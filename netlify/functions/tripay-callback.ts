import type { Config } from "@netlify/functions";
import * as crypto from "crypto";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const config: Config = {
  path: "/api/tripay-callback",
};

// ─── Firebase Admin Init ──────────────────────────────────────────────────────
function getAdminDb() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT env var not set");
    const serviceAccount = JSON.parse(raw);
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function jsonResponse(data: object, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function verifySignature(rawBody: string, receivedSig: string, privateKey: string): boolean {
  const expected = crypto
    .createHmac("sha256", privateKey)
    .update(rawBody)
    .digest("hex");
  // timing-safe compare
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(receivedSig));
  } catch {
    return false;
  }
}

// ─── Main Handler ─────────────────────────────────────────────────────────────
export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const rawBody = await req.text();

  // Ambil signature dari header
  const receivedSig =
    req.headers.get("X-Callback-Signature") ||
    req.headers.get("x-callback-signature") ||
    "";

  // Tentukan private key berdasarkan environment
  const environment = process.env.TRIPAY_ENVIRONMENT || "sandbox";
  const privateKey =
    environment === "production"
      ? process.env.TRIPAY_PRIVATE_KEY_PROD || ""
      : process.env.TRIPAY_PRIVATE_KEY_SANDBOX || "KDo45-rfo1e-eVdb9-uM9LU-rGm4W";

  console.log(`[tripay-callback] Environment: ${environment}`);
  console.log(`[tripay-callback] Received signature: ${receivedSig}`);

  // Verifikasi signature (jika ada — sandbox kadang tidak kirim)
  if (receivedSig) {
    const valid = verifySignature(rawBody, receivedSig, privateKey);
    if (!valid) {
      console.error("[tripay-callback] Invalid signature");
      return jsonResponse({ success: false, message: "Invalid signature" }, 403);
    }
    console.log("[tripay-callback] Signature valid ✓");
  } else {
    console.warn("[tripay-callback] No signature header — skipping verification (sandbox mode)");
  }

  // Parse body
  let callbackData: any;
  try {
    callbackData = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ success: false, message: "Invalid JSON body" }, 400);
  }

  const { merchant_ref, status, reference, total_amount } = callbackData;
  console.log(`[tripay-callback] merchant_ref=${merchant_ref} status=${status} reference=${reference}`);

  if (!merchant_ref || !status) {
    return jsonResponse({ success: false, message: "Missing merchant_ref or status" }, 400);
  }

  try {
    const db = getAdminDb();

    // Cari transaksi berdasarkan reference (merchant_ref)
    const txQuery = await db
      .collection("payment_transactions")
      .where("reference", "==", merchant_ref)
      .limit(1)
      .get();

    if (txQuery.empty) {
      console.error(`[tripay-callback] Transaction not found: ${merchant_ref}`);
      return jsonResponse({ success: false, message: "Transaction not found" }, 404);
    }

    const txDoc = txQuery.docs[0];
    const txData = txDoc.data();

    // Mapping status TriPay → status internal
    const statusMap: Record<string, string> = {
      PAID: "PAID",
      FAILED: "FAILED",
      EXPIRED: "EXPIRED",
      REFUND: "FAILED",
      UNPAID: "UNPAID",
    };
    const internalStatus = statusMap[status] || status;

    console.log(`[tripay-callback] Updating ${txDoc.id} → ${internalStatus}`);

    const updateData: Record<string, any> = {
      status: internalStatus,
      tripayReference: reference || null,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (internalStatus === "PAID") {
      updateData.paidAt = FieldValue.serverTimestamp();
    }

    await txDoc.ref.update(updateData);

    // Jika PAID → beri akses tryout ke user
    if (internalStatus === "PAID") {
      const { userId, tryoutId, tryoutName } = txData;

      // Cek apakah sudah ada user_tryout record (hindari duplikat)
      const existingQuery = await db
        .collection("user_tryouts")
        .where("userId", "==", userId)
        .where("tryoutId", "==", tryoutId)
        .where("paymentStatus", "==", "success")
        .limit(1)
        .get();

      if (existingQuery.empty) {
        // Cek apakah bundle
        const tryoutSnap = await db.collection("tryout_packages").doc(tryoutId).get();
        const tryoutData = tryoutSnap.exists ? tryoutSnap.data() : null;
        const isBundle = tryoutData?.isBundle || false;

        // --- SALES COUNTER & TEST GUARD ---
        const TEST_EMAILS = ["enggar308@gmail.com"];
        const isTestEmail = TEST_EMAILS.includes(txData.customerEmail || "");
        
        if (tryoutId !== "VIP-BUNDLING" && !isTestEmail) {
          await db.collection("tryout_packages").doc(tryoutId).update({
            currentSales: FieldValue.increment(1),
            updatedAt: FieldValue.serverTimestamp(),
          });
          console.log(`[tripay-callback] Incremented currentSales for ${tryoutId}`);
        } else if (isTestEmail) {
          console.log(`[tripay-callback] Test email detected (${txData.customerEmail}). Skipping sales increment.`);
        }
        // ------------------------------------

        // Buat user_tryout record utama
        await db.collection("user_tryouts").add({
          userId,
          tryoutId,
          tryoutName,
          purchaseDate: FieldValue.serverTimestamp(),
          status: isBundle ? "completed" : "not_started",
          paymentStatus: "success",
          transactionId: merchant_ref,
          attempts: 0,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        console.log(`[tripay-callback] Granted access to tryout ${tryoutId} for user ${userId}`);

        // Jika bundle → beri akses ke semua tryout di dalamnya
        if (isBundle && tryoutData?.includedTryoutIds?.length) {
          for (const incId of tryoutData.includedTryoutIds) {
            const incSnap = await db.collection("tryout_packages").doc(incId).get();
            if (incSnap.exists) {
              const incData = incSnap.data()!;
              await db.collection("user_tryouts").add({
                userId,
                tryoutId: incId,
                tryoutName: incData.name,
                purchaseDate: FieldValue.serverTimestamp(),
                status: "not_started",
                paymentStatus: "success",
                transactionId: `${merchant_ref}-BNDL`,
                bundleId: tryoutId,
                attempts: 0,
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
              });
            }
          }
        }

        // Kirim notifikasi Telegram (fire & forget)
        const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
        const telegramChatId = process.env.TELEGRAM_CHAT_ID;
        if (telegramToken && telegramChatId) {
          const msg = [
            `<b>✅ PEMBAYARAN BERHASIL (TriPay)</b>`,
            ``,
            `<b>👤 User ID:</b> <code>${userId}</code>`,
            `<b>📝 Try Out:</b> ${tryoutName}`,
            `<b>💵 Jumlah:</b> Rp ${Number(total_amount || 0).toLocaleString("id-ID")}`,
            `<b>🔖 Ref:</b> <code>${merchant_ref}</code>`,
            `<b>🌐 Via:</b> TriPay (${environment})`,
          ].join("\n");

          fetch(
            `https://api.telegram.org/bot${telegramToken}/sendMessage`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: telegramChatId, text: msg, parse_mode: "HTML" }),
            }
          ).catch((e) => console.error("[tripay-callback] Telegram notify failed:", e));
        }
      } else {
        console.log(`[tripay-callback] User already has access to tryout ${tryoutId}, skipping`);
      }
    }

    return jsonResponse({ success: true, message: "Callback processed" });
  } catch (err: any) {
    console.error("[tripay-callback] Error:", err.message, err.stack);
    return jsonResponse({ success: false, message: "Internal server error" }, 500);
  }
}
