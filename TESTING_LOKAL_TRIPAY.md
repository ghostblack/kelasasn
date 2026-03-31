# 🧪 Panduan Testing Alur Pembelian TriPay (Lokal)

## Arsitektur Saat Testing Lokal

```
Browser (localhost:8888)
    ↕ HTTP
Netlify Dev (port 8888)
    ├── Vite (React App)  ← semua halaman /dashboard/*
    └── Netlify Functions ← /api/tripay-callback

TriPay Sandbox (API)
    ↕ HTTP callback (butuh URL publik)
ngrok tunnel → https://xxxx.ngrok-free.app → localhost:8888/api/tripay-callback

Google Apps Script → TriPay API Sandbox
    ↑ dipanggil dari frontend via fetch()
```

---

## Step 1 — Install Netlify CLI (sekali saja)

```bash
npm install -g netlify-cli
```

Verifikasi:
```bash
netlify --version
```

---

## Step 2 — Siapkan `.env` untuk Netlify Functions

Netlify Functions perlu environment variable. Buat file `.env` di root project (sudah ada), pastikan sudah punya:

```env
# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# TriPay
VITE_TRIPAY_APPS_SCRIPT_URL=https://script.google.com/macros/...

# Untuk Netlify Functions (tripay-callback.ts)
TRIPAY_ENVIRONMENT=sandbox
TRIPAY_PRIVATE_KEY_SANDBOX=KDo45-rfo1e-eVdb9-uM9LU-rGm4W

# Firebase Admin (untuk webhook callback)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"kelasasn2026",...}
```

> ℹ️ `FIREBASE_SERVICE_ACCOUNT` adalah JSON dari Firebase Console →
> Project Settings → Service Accounts → Generate New Private Key
> Paste seluruh isi JSON-nya sebagai satu baris string.

---

## Step 3 — Jalankan Netlify Dev (Vite + Functions)

```bash
npm run dev:netlify
```

Ini akan menjalankan:
- React App di `http://localhost:8888` (bukan 5173)
- Netlify Functions di `http://localhost:8888/api/*`

> ⚠️ Gunakan `localhost:8888`, bukan `localhost:5173` saat testing.

---

## Step 4 — Setup ngrok (untuk TriPay Webhook Callback)

### Install ngrok
```bash
# Mac dengan Homebrew
brew install ngrok

# ATAU download manual dari https://ngrok.com/download
```

### Buat akun ngrok gratis
Daftar di https://ngrok.com → salin auth token kamu:

```bash
ngrok config add-authtoken <TOKEN_KAMU>
```

### Jalankan ngrok (terminal terpisah)
```bash
ngrok http 8888
```

Output:
```
Forwarding  https://abc123.ngrok-free.app → http://localhost:8888
```

Salin URL `https://abc123.ngrok-free.app`

---

## Step 5 — Update Callback URL di Google Apps Script

Buka Google Apps Script kamu → di fungsi `doPost` bagian create transaction,
pastikan `callback_url` menggunakan URL ngrok saat testing:

**Cara mudah:** Saat lokal, `window.location.origin` di `createPaymentTransaction()`
otomatis menghasilkan `http://localhost:8888` yang tidak bisa dijangkau TriPay.

**Solusi:** Override callback URL sementara. Buka `src/services/paymentService.ts`,
ubah baris ini sementara untuk testing:

```ts
// Sebelum (produksi):
const callbackUrl = `${baseUrl}/api/tripay-callback`;

// Saat testing lokal — ganti dengan URL ngrok kamu:
const callbackUrl = `https://abc123.ngrok-free.app/api/tripay-callback`;
```

> ⚠️ Jangan lupa kembalikan ke semula sebelum commit/deploy!

---

## Step 6 — Test Alur Pembelian

1. Buka `http://localhost:8888`
2. Login dengan akun test
3. Pilih paket tryout → klik Beli
4. Pilih metode pembayaran (contoh: QRIS atau BCA Virtual Account)
5. Simulasikan pembayaran di TriPay Sandbox:
   - Login ke https://tripay.co.id/simulator
   - Masukkan reference transaksi
   - Klik "Bayar"
6. Tunggu ±5 detik → auto-polling frontend akan deteksi status PAID
7. **ATAU** TriPay akan kirim webhook ke ngrok URL → Netlify Function handler

---

## Cara Cek Log Webhook

Netlify Dev akan print log di terminal:
```
[functions] tripay-callback: [tripay-callback] merchant_ref=ASN-XXXXX status=PAID
[functions] tripay-callback: [tripay-callback] Updating doc123 → PAID
[functions] tripay-callback: [tripay-callback] Granted access to tryout XYZ for user ABC
```

ngrok juga punya dashboard di: `http://127.0.0.1:4040`
→ bisa lihat semua request masuk dari TriPay beserta body-nya.

---

## Alur Lengkap (Ringkasan)

```
[1] User klik Beli
    → Apps Script → TriPay Sandbox API
    → Data disimpan ke Firestore (status: UNPAID)

[2] User diarahkan ke halaman process
    → Auto-poll setiap 5 detik ke TriPay via Apps Script

[3a] Simulasi bayar di TriPay Simulator
     → TriPay kirim POST ke ngrok → Netlify Function
     → Update Firestore → status: PAID
     → Buat user_tryouts record → akses terbuka

[3b] ATAU auto-polling deteksi status PAID
     → updatePaymentStatus() di paymentService.ts
     → Buat user_tryouts record → akses terbuka

[4] Frontend redirect ke halaman success
```

---

## FAQ

**Q: Apakah data masuk ke Firestore production saat testing lokal?**
A: YA — karena `firebase.ts` terhubung ke project `kelasasn2026`. Data transaksi test (status UNPAID) akan masuk. Tapi tidak ada uang yang berpindah karena TriPay Sandbox. Transaksi test bisa dihapus manual dari Firebase Console.

**Q: Apakah ngrok URL berubah setiap kali restart?**
A: Ya (akun gratis). Setiap restart ngrok, URL berubah. Kamu perlu update callback URL di kode sementara.

**Q: Saya tidak mau data test masuk ke Firestore production, bagaimana?**
A: Buat Firebase project baru (dev/staging), copy credentials ke `.env.local`, dan arahkan `firebase.ts` ke project baru tersebut. Atau gunakan Firebase Emulator untuk Firestore saja.

**Q: Apa bedanya `npm run dev` vs `npm run dev:netlify`?**
A: `npm run dev` hanya menjalankan Vite (React saja) — endpoint `/api/*` tidak tersedia. `npm run dev:netlify` menjalankan Vite + Netlify Functions sekaligus, sehingga `/api/tripay-callback` bisa menerima webhook.
