# Testing Steps - Payment Gateway Tripay

## ✅ Sistem Sudah Siap

Integrasi payment gateway Tripay sudah berfungsi dengan baik di mode sandbox.

## 🧪 Cara Testing Payment Flow

### Step 1: Start Development Server
```bash
npm run dev
```

### Step 2: Login/Register User
1. Buka aplikasi di browser
2. Register akun baru atau login dengan akun existing
3. Verifikasi email jika diperlukan

### Step 3: Pilih Try Out Premium
1. Dari dashboard, klik menu "Try Out"
2. Pilih try out dengan kategori "Premium" (yang berbayar)
3. Klik "Beli Try Out"

### Step 4: Isi Form Pembayaran
1. Isi **Nama Lengkap** pembeli
2. Isi **Nomor WhatsApp** (format: 08xxxxxxxxxx)
3. Pilih **Metode Pembayaran** (contoh: QRIS, BRI Virtual Account, dll)
4. Lihat total pembayaran (harga + biaya admin)
5. Klik tombol **"Bayar Sekarang"**

### Step 5: Proses Pembayaran
1. Anda akan diarahkan ke halaman **Payment Process**
2. Di halaman ini akan muncul:
   - Detail pembayaran
   - Nomor referensi transaksi
   - Countdown timer
   - Link checkout (untuk pembayaran real)

### Step 6: Simulasi Pembayaran (Testing Mode)
**PENTING untuk Testing:**

Karena ini mode sandbox, Anda tidak perlu melakukan pembayaran real. Gunakan fitur simulasi:

1. Scroll ke bawah pada halaman Payment Process
2. Anda akan melihat box biru dengan label **"Mode Sandbox Testing"**
3. Klik tombol **"🧪 Simulasi Pembayaran Berhasil (Testing)"**
4. Sistem akan mensimulasikan pembayaran berhasil
5. Anda akan diarahkan ke halaman Success

### Step 7: Verifikasi
1. Setelah simulasi berhasil, cek di Dashboard > Try Out
2. Try out yang dibeli seharusnya sudah muncul dengan status "Tersedia"
3. Klik try out tersebut untuk mulai mengerjakan

## 🔍 Testing API Langsung

Untuk test API Tripay secara langsung tanpa UI:

1. Buka file `test-tripay.html` di browser
2. Test endpoint:
   - **Get Channels**: Klik "Test Channels"
   - **Create Transaction**: Klik "Create Test Transaction"
   - **Get Detail**: Input reference lalu klik "Get Detail"

## 📊 Monitoring Data

### Cek Data di Firebase Console

1. Buka Firebase Console project Anda
2. Buka **Firestore Database**
3. Cek collection:

   **`payment_transactions`** - Semua transaksi pembayaran
   ```
   - userId
   - tryoutId
   - amount, fee, totalAmount
   - reference, merchantRef
   - status: UNPAID / PAID / EXPIRED
   ```

   **`user_tryouts`** - Try out yang sudah dibeli user
   ```
   - userId
   - tryoutId
   - paymentStatus: success
   - purchaseDate
   - status: not_started / in_progress / completed
   ```

## ⚠️ Troubleshooting

### Error: "Failed to fetch payment channels"
- Pastikan koneksi internet stabil
- Tripay sandbox API harus bisa diakses

### Error: "Failed to create transaction"
- Cek apakah semua field sudah diisi
- Pastikan amount minimal sesuai channel

### Pembayaran tidak muncul di dashboard
- Refresh halaman dashboard
- Cek Firebase Console apakah data masuk
- Cek console browser untuk error

### Tombol simulasi tidak muncul
- Pastikan status pembayaran UNPAID
- Refresh halaman

## 🎯 Expected Results

Setelah testing berhasil:
- ✅ Payment channels berhasil dimuat
- ✅ Transaksi berhasil dibuat
- ✅ Data tersimpan di Firebase
- ✅ Simulasi pembayaran berfungsi
- ✅ Try out muncul di dashboard user
- ✅ User bisa mulai mengerjakan try out

## 📝 Notes

- Mode sandbox cocok untuk development dan testing
- Tidak ada pembayaran real yang terjadi
- Untuk production, perlu update ke Tripay Production API
- Semua transaksi bisa di-track melalui Firebase Console

---
Happy Testing! 🚀
