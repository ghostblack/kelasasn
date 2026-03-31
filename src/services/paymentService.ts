import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PaymentTransaction } from '@/types';
import { grantFormasiAccess } from './formasiAccessCodeService';
import { VIP_BUNDLING_ID, recordVIPBundlingSale } from './vipBundlingService';
import { getAllTryouts } from './tryoutService';

// ─── Apps Script URL ──────────────────────────────────────────────────────────
const APPS_SCRIPT_URL = import.meta.env.VITE_TRIPAY_APPS_SCRIPT_URL as string;
export const TEST_EMAILS = ['enggar308@gmail.com'];

function getAppsScriptUrl(): string {
  if (!APPS_SCRIPT_URL) {
    throw new Error('VITE_TRIPAY_APPS_SCRIPT_URL belum dikonfigurasi di .env');
  }
  return APPS_SCRIPT_URL;
}

// ─── TriPay Types ─────────────────────────────────────────────────────────────
export interface TripayChannel {
  group: string;
  code: string;
  name: string;
  type: string;
  fee_merchant: { flat: number; percent: number };
  fee_customer: { flat: number; percent: number };
  total_fee: { flat: number; percent: number };
  minimum_fee: number;
  maximum_fee: number;
  icon_url: string;
  active: boolean;
}

export interface TripayTransaction {
  reference: string;
  merchant_ref: string;
  payment_method: string;
  payment_method_code: string;
  status: string;
  amount: number;
  fee_merchant: number;
  fee_customer: number;
  total_fee: number;
  amount_received: number;
  pay_url: string | null;
  checkout_url: string;
  instructions: Array<{
    title: string;
    steps: string[];
  }>;
  qr_url?: string | null;
  qr_string?: string | null;
  expired_time: number;
}

// ─── Apps Script Caller Helper ────────────────────────────────────────────────
async function callAppsScript<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: object
): Promise<T> {
  const url = getAppsScriptUrl();

  let response: Response;
  if (method === 'GET') {
    const timestamp = Date.now();
    // Path ditaruh di dalam template string setelah tanda &, memastikan `e.parameter.path` valid
    response = await fetch(`${url}?path=${path}&_t=${timestamp}`, { 
      method: 'GET',
      cache: 'no-store'
    });
  } else {
    response = await fetch(`${url}?path=${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    });
  }

  if (!response.ok) {
    throw new Error(`Apps Script request failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || result.data?.message || 'TriPay request gagal');
  }
  return result as T;
}

// ─── TriPay API Functions ─────────────────────────────────────────────────────

/** Ambil daftar payment channels dari TriPay */
export const getTripayPaymentChannels = async (): Promise<TripayChannel[]> => {
  try {
    const result = await callAppsScript<{ success: boolean; data: { data: TripayChannel[] } }>(
      'GET',
      'payment-channels'
    );
    return result.data?.data || [];
  } catch (err) {
    console.error('[paymentService] getTripayPaymentChannels error:', err);
    return [];
  }
};

/** Hitung fee untuk metode tertentu */
export const calculateFee = (channel: TripayChannel, amount: number): number => {
  const flatFee = channel.total_fee?.flat || 0;
  const percentFee = Math.ceil((channel.total_fee?.percent || 0) / 100 * amount);
  return flatFee + percentFee;
};

/** Ambil detail transaksi dari TriPay (untuk polling status) */
export const getTripayTransactionDetail = async (
  reference: string
): Promise<TripayTransaction | null> => {
  try {
    const result = await callAppsScript<{
      success: boolean;
      data: { data: TripayTransaction };
    }>('GET', `transaction-detail&reference=${reference}`);
    return result.data?.data || null;
  } catch (err) {
    console.error('[paymentService] getTripayTransactionDetail error:', err);
    return null;
  }
};

// ─── Reference Generator ──────────────────────────────────────────────────────
const generateReference = (): string => {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ASN-${ts}-${rand}`;
};

// ─── Create Payment via TriPay ────────────────────────────────────────────────
export const createPaymentTransaction = async (
  userId: string,
  tryoutId: string,
  tryoutName: string,
  amount: number,
  paymentMethod: string,
  customerName: string,
  customerEmail: string,
  customerPhone: string
): Promise<PaymentTransaction> => {
  const merchantRef = generateReference();

  // Callback URL → Netlify Function kita
  const baseUrl = window.location.origin;
  const callbackUrl = `${baseUrl}/api/tripay-callback`;
  const returnUrl = `${baseUrl}/dashboard/payment/${tryoutId}/success`;

  // Buat transaksi di TriPay via Apps Script
  const result = await callAppsScript<{
    success: boolean;
    data: { data: TripayTransaction };
  }>('POST', 'create-transaction', {
    method: paymentMethod,
    merchant_ref: merchantRef,
    amount,
    customer_name: customerName,
    customer_email: customerEmail || `${userId}@kelasasn.id`,
    customer_phone: customerPhone,
    order_items: [
      {
        name: tryoutName,
        price: amount,
        quantity: 1,
      },
    ],
    callback_url: callbackUrl,
    return_url: returnUrl,
  });

  const tripayData: TripayTransaction = result.data?.data;
  if (!tripayData) {
    throw new Error('TriPay tidak mengembalikan data transaksi');
  }

  const expiredTime = new Date(tripayData.expired_time * 1000);

  // Simpan ke Firestore
  const transactionData = {
    userId,
    tryoutId,
    tryoutName,
    amount,
    fee: tripayData.fee_customer || 0,
    totalAmount: amount + (tripayData.fee_customer || 0),
    reference: merchantRef,
    merchantRef,
    tripayReference: tripayData.reference,
    paymentMethod: tripayData.payment_method || paymentMethod,
    paymentMethodCode: paymentMethod,
    status: 'UNPAID',
    // URL pembayaran dari TriPay
    qrUrl: tripayData.qr_url || null,
    qrString: tripayData.qr_string || null,
    payUrl: tripayData.pay_url || null,
    checkoutUrl: tripayData.checkout_url || null,
    instructions: tripayData.instructions || [],
    expiredTime,
    customerName,
    customerEmail,
    customerPhone,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, 'payment_transactions'), transactionData);

  return {
    id: docRef.id,
    ...transactionData,
    expiredTime,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as PaymentTransaction;
};

// ─── Firestore Read Functions ─────────────────────────────────────────────────

export const getPaymentTransaction = async (
  transactionId: string
): Promise<PaymentTransaction | null> => {
  const docRef = doc(db, 'payment_transactions', transactionId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    expiredTime: (data.expiredTime as Timestamp).toDate(),
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
    paidAt: data.paidAt ? (data.paidAt as Timestamp).toDate() : undefined,
  } as PaymentTransaction;
};

export const getPaymentByReference = async (
  reference: string
): Promise<PaymentTransaction | null> => {
  const q = query(
    collection(db, 'payment_transactions'),
    where('reference', '==', reference)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();
  return {
    id: docSnap.id,
    ...data,
    expiredTime: (data.expiredTime as Timestamp).toDate(),
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
    paidAt: data.paidAt ? (data.paidAt as Timestamp).toDate() : undefined,
  } as PaymentTransaction;
};

export const getUserPayments = async (userId: string): Promise<PaymentTransaction[]> => {
  const q = query(
    collection(db, 'payment_transactions'),
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);
  const payments = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      expiredTime: (data.expiredTime as Timestamp).toDate(),
      createdAt: (data.createdAt as Timestamp).toDate(),
      updatedAt: (data.updatedAt as Timestamp).toDate(),
      paidAt: data.paidAt ? (data.paidAt as Timestamp).toDate() : undefined,
    } as PaymentTransaction;
  });

  const now = new Date();
  for (const payment of payments) {
    if (payment.status === 'UNPAID' && now > payment.expiredTime) {
      await updatePaymentStatus(payment.reference, 'EXPIRED');
      payment.status = 'EXPIRED';
    }
  }
  return payments;
};

export const updatePaymentStatus = async (
  reference: string,
  status: 'PAID' | 'FAILED' | 'EXPIRED' | 'PENDING_CONFIRMATION'
): Promise<void> => {
  const payment = await getPaymentByReference(reference);
  if (!payment) throw new Error('Payment not found');

  const updateData: any = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (status === 'PAID') {
    updateData.paidAt = serverTimestamp();
  }

  const docRef = doc(db, 'payment_transactions', payment.id);
  await updateDoc(docRef, updateData);

  // Jika PAID dan belum ada user_tryout → buat (fallback jika webhook terlambat)
  if (status === 'PAID') {
    // 0. Update Sales Counter for the package (Skip if Test Email)
    const isTestEmail = TEST_EMAILS.includes(payment.customerEmail || '');
    const tryoutRef = doc(db, 'tryout_packages', payment.tryoutId);
    const tryoutSnap = await getDoc(tryoutRef);
    const tryoutData = tryoutSnap.exists() ? tryoutSnap.data() : null;
    
    if (tryoutRef.id !== VIP_BUNDLING_ID && tryoutSnap.exists() && !isTestEmail) {
      await updateDoc(tryoutRef, {
        currentSales: (tryoutData?.currentSales || 0) + 1,
        updatedAt: serverTimestamp()
      });
    } else if (isTestEmail) {
      console.log(`[paymentService] Test email detected (${payment.customerEmail}). Skipping sales increment.`);
    }

    // 1. Handle VIP Bundling Special Case (Legacy / All-Access)
    if (payment.tryoutId === VIP_BUNDLING_ID) {
      await grantFormasiAccess(payment.userId, 365);
      await recordVIPBundlingSale();
      
      // Automatically grant all tryouts marked as "Bundling"
      const allTryouts = await getAllTryouts();
      const bundleTryouts = allTryouts.filter(t => t.isBundle === true && t.isActive !== false);
      const userTryoutsRef = collection(db, 'user_tryouts');
      
      for (const t of bundleTryouts) {
        const existing = await getDocs(
          query(
            userTryoutsRef,
            where('userId', '==', payment.userId),
            where('tryoutId', '==', t.id)
          )
        );
        
        if (existing.empty) {
          await addDoc(userTryoutsRef, {
            userId: payment.userId,
            tryoutId: t.id,
            tryoutName: t.name,
            purchaseDate: serverTimestamp(),
            status: 'completed',
            paymentStatus: 'success',
            transactionId: `${payment.reference}-VIP`,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
      return;
    }

    // 2. Normal Tryout / Specific Bundle Purchase
    const isBundle = tryoutData?.isBundle || false;
    const userTryoutsRef = collection(db, 'user_tryouts');

    // Cek duplikat untuk main item
    const existing = await getDocs(
      query(
        userTryoutsRef,
        where('userId', '==', payment.userId),
        where('tryoutId', '==', payment.tryoutId),
        where('paymentStatus', '==', 'success')
      )
    );

    if (existing.empty) {
      await addDoc(userTryoutsRef, {
        userId: payment.userId,
        tryoutId: payment.tryoutId,
        tryoutName: payment.tryoutName,
        purchaseDate: serverTimestamp(),
        status: isBundle ? 'completed' : 'not_started',
        paymentStatus: 'success',
        transactionId: payment.reference,
        attempts: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Grant VIP access if it's a bundle
      if (isBundle) {
        console.log(`[paymentService] Bundle purchase detected (${payment.tryoutId}). Granting VIP access.`);
        await grantFormasiAccess(payment.userId, 365);
      }
    }

    // Grant children if it's a bundle
    if (isBundle && tryoutData?.includedTryoutIds) {
      for (const incId of tryoutData.includedTryoutIds) {
        // Cek duplikat untuk child item
        const existingChild = await getDocs(
          query(
            userTryoutsRef,
            where('userId', '==', payment.userId),
            where('tryoutId', '==', incId),
            where('paymentStatus', '==', 'success')
          )
        );

        if (existingChild.empty) {
          const incRef = doc(db, 'tryout_packages', incId);
          const incSnap = await getDoc(incRef);
          if (incSnap.exists()) {
            const incData = incSnap.data();
            await addDoc(userTryoutsRef, {
              userId: payment.userId,
              tryoutId: incId,
              tryoutName: incData.name,
              purchaseDate: serverTimestamp(),
              status: 'not_started',
              paymentStatus: 'success',
              transactionId: `${payment.reference}-BNDL`,
              bundleId: payment.tryoutId,
              attempts: 0,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }
      }
    }
  }
};

export const checkPaymentStatus = async (reference: string): Promise<PaymentTransaction> => {
  const payment = await getPaymentByReference(reference);
  if (!payment) throw new Error('Payment not found');
  if (payment.status === 'UNPAID' && new Date() > payment.expiredTime) {
    await updatePaymentStatus(reference, 'EXPIRED');
    payment.status = 'EXPIRED';
  }
  return payment;
};

export const getAllPendingPayments = async (): Promise<PaymentTransaction[]> => {
  const q = query(
    collection(db, 'payment_transactions'),
    where('status', '==', 'PENDING_CONFIRMATION')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
    expiredTime: (docSnap.data().expiredTime as Timestamp).toDate(),
    createdAt: (docSnap.data().createdAt as Timestamp).toDate(),
    updatedAt: (docSnap.data().updatedAt as Timestamp).toDate(),
  })) as PaymentTransaction[];
};

export const getAllPayments = async (): Promise<PaymentTransaction[]> => {
  const snapshot = await getDocs(collection(db, 'payment_transactions'));
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
    expiredTime: (docSnap.data().expiredTime as Timestamp).toDate(),
    createdAt: (docSnap.data().createdAt as Timestamp).toDate(),
    updatedAt: (docSnap.data().updatedAt as Timestamp).toDate(),
  })) as PaymentTransaction[];
};

/** Notif admin via Telegram (dipanggil dari frontend jika perlu) */
export const notifyAdminPayment = async (data: {
  customerName: string;
  tryoutName: string;
  amount: number;
  reference: string;
}): Promise<boolean> => {
  try {
    const response = await fetch('/api/telegram-notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      }),
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to notify admin via Telegram:', error);
    return false;
  }
};

/** @deprecated Tidak dipakai lagi — gunakan createPaymentTransaction */
export const createQRISPaymentTransaction = createPaymentTransaction;
/** @deprecated Tidak dipakai lagi */
export const confirmPayment = async (_transactionId: string): Promise<void> => {};

// ─── Coupon System Stub ────────────────────────────────────────────────────────
export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountType: 'percent' | 'flat';
  discountValue: number;
  message?: string;
}

export async function validateCouponCode(code: string, _tryoutId: string): Promise<CouponValidationResult> {
  // Stub for future coupon system
  // To implement: Fetch from 'coupon_codes' collection in Firestore
  // Check if code is active, applies to tryoutId, within valid dates, and under usage limits
  
  return {
    valid: false,
    code,
    discountType: 'percent',
    discountValue: 0,
    message: 'Sistem kupon belum aktif'
  };
}
