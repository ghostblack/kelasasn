# Perbaikan Halaman Pembayaran

## Masalah yang Ditemukan

Halaman pembayaran tidak muncul dengan benar meskipun koneksi Apps Script dan backend berjalan lancar. Setelah analisis mendalam, ditemukan 2 masalah utama:

### 1. Konfigurasi Tripay Belum Lengkap

**Masalah:**
- File `.env` tidak memiliki variabel `VITE_TRIPAY_APPS_SCRIPT_URL`
- Tanpa URL ini, aplikasi tidak bisa mengakses API Tripay melalui Apps Script
- Halaman payment akan menampilkan error atau tidak menampilkan metode pembayaran

**Lokasi Error:**
- File: `src/services/tripayService.ts`
- Fungsi: `getPaymentChannels()`, `createTransaction()`, `getTransactionDetail()`

**Gejala:**
- Halaman payment muncul tapi tidak ada metode pembayaran
- Console browser menampilkan error: "Tripay belum dikonfigurasi"
- Toast/notifikasi error: "Metode pembayaran sedang tidak tersedia"

### 2. Firebase Rules Untuk Payment Transactions Kurang Tepat

**Masalah:**
- Rule `allow list` untuk koleksi `payment_transactions` terlalu permisif
- Sebelumnya: `allow list: if isAuthenticated();` (semua user bisa list semua transaksi)
- Ini berpotensi membocorkan data transaksi user lain

**Dampak Keamanan:**
- User authenticated bisa melihat list semua transaksi (milik user lain)
- Tidak sesuai dengan prinsip least privilege
- Melanggar privasi data pembayaran

## Solusi yang Diterapkan

### 1. Menambahkan Konfigurasi Tripay di .env

File `.env` telah diupdate dengan menambahkan:

```env
# Tripay Configuration
# Masukkan URL Google Apps Script yang sudah di-deploy
# Lihat file TRIPAY_APPS_SCRIPT_SETUP.md untuk cara setup
VITE_TRIPAY_APPS_SCRIPT_URL=
```

**Cara Mengisi:**
1. Buka Google Apps Script yang sudah Anda deploy (lihat `TRIPAY_APPS_SCRIPT_SETUP.md`)
2. Copy URL deployment (format: `https://script.google.com/macros/s/XXXXXXX/exec`)
3. Paste di file `.env` setelah `VITE_TRIPAY_APPS_SCRIPT_URL=`
4. Restart development server

**Contoh:**
```env
VITE_TRIPAY_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbxXXXXXXXXX/exec
```

### 2. Memperbaiki Firebase Rules

Firebase Rules untuk `payment_transactions` telah diperbaiki:

**Sebelum:**
```javascript
allow list: if isAuthenticated();
```

**Sesudah:**
```javascript
allow list: if isAuthenticated() &&
              (request.query.userId == request.auth.uid || isAdmin());
```

**Penjelasan:**
- User hanya bisa list transaksi mereka sendiri (dengan filter userId)
- Admin bisa list semua transaksi
- Lebih aman dan sesuai standar keamanan

## Langkah-Langkah Setup

### Step 1: Setup Google Apps Script

1. Buka file `google-apps-script/TripayProxy.gs`
2. Copy semua kode dan paste ke Google Apps Script baru
3. Ganti `API_KEY` dan `PRIVATE_KEY` dengan kredensial Tripay Anda
4. Deploy as Web App (akses: Anyone)
5. Copy URL deployment

Detail lengkap ada di file: `TRIPAY_APPS_SCRIPT_SETUP.md`

### Step 2: Update Environment Variable

1. Buka file `.env`
2. Isi `VITE_TRIPAY_APPS_SCRIPT_URL` dengan URL deployment dari Step 1
3. Pastikan tidak ada spasi sebelum/sesudah URL

### Step 3: Update Firebase Rules

1. Buka Firebase Console
2. Pergi ke Firestore > Rules
3. Copy isi file `FIREBASE_RULES_PRODUCTION.txt`
4. Paste dan publish rules

**PENTING:** Backup rules lama sebelum update!

### Step 4: Restart dan Test

1. Stop development server (Ctrl+C)
2. Jalankan lagi: `npm run dev`
3. Login ke aplikasi
4. Buka halaman tryout dan klik "Beli Tryout"
5. Halaman payment seharusnya muncul dengan metode pembayaran

## Cara Testing

### Test 1: Cek Konfigurasi Tripay

```javascript
// Buka browser console di halaman payment
console.log(import.meta.env.VITE_TRIPAY_APPS_SCRIPT_URL);
// Seharusnya menampilkan URL Apps Script, bukan undefined atau empty string
```

### Test 2: Cek Payment Channels

```javascript
// Buka browser console dan jalankan:
const response = await fetch(import.meta.env.VITE_TRIPAY_APPS_SCRIPT_URL + '?path=payment-channels');
const data = await response.json();
console.log(data);
// Seharusnya menampilkan list metode pembayaran
```

### Test 3: Test Firebase Rules

```javascript
// Di halaman payment history, cek network tab
// Request ke firestore seharusnya include filter: where userId == current user
```

## Troubleshooting

### Problem 1: Masih Tidak Ada Metode Pembayaran

**Cek:**
1. Apakah `VITE_TRIPAY_APPS_SCRIPT_URL` sudah diisi?
2. Apakah URL Apps Script benar?
3. Apakah Apps Script sudah di-deploy dengan akses "Anyone"?
4. Apakah API Key dan Private Key Tripay sudah benar?

**Cara Cek:**
```bash
# Cek environment variable
echo $VITE_TRIPAY_APPS_SCRIPT_URL

# Test langsung Apps Script
curl "YOUR_APPS_SCRIPT_URL?path=payment-channels"
```

### Problem 2: Firebase Permission Denied

**Gejala:**
- Error: "Missing or insufficient permissions"
- Tidak bisa list payment history

**Solusi:**
1. Cek Firebase Rules sudah di-publish
2. Pastikan query include `where('userId', '==', userId)`
3. Cek user sudah authenticated

### Problem 3: Apps Script Error

**Gejala:**
- Error 500 dari Apps Script
- Response: "Script error"

**Solusi:**
1. Cek logs di Apps Script (Executions > View Logs)
2. Pastikan API Key dan Private Key benar
3. Cek Tripay API masih aktif (sandbox/production sesuai environment)

## Keamanan

### Firebase Rules Security

Rules baru memastikan:
- ✅ User hanya bisa baca transaksi mereka sendiri
- ✅ User tidak bisa akses transaksi user lain
- ✅ Admin bisa akses semua transaksi untuk management
- ✅ Query harus include filter userId untuk non-admin

### Tripay API Security

Apps Script sebagai proxy memastikan:
- ✅ API Key dan Private Key tidak exposed di frontend
- ✅ Signature validation di server-side
- ✅ CORS handled dengan benar
- ✅ Request validation sebelum forward ke Tripay

## Files yang Dimodifikasi

1. `.env` - Menambahkan `VITE_TRIPAY_APPS_SCRIPT_URL`
2. `FIREBASE_RULES_PRODUCTION.txt` - Memperbaiki rule `payment_transactions`

## Referensi

- Setup Tripay Apps Script: `TRIPAY_APPS_SCRIPT_SETUP.md`
- Firebase Rules Setup: `SETUP_FIREBASE_RULES.md`
- Tripay Quick Start: `TRIPAY_QUICK_START.md`
- Troubleshooting Payment: `TROUBLESHOOTING_PAYMENT.md`

## Kesimpulan

Masalah halaman pembayaran yang tidak muncul disebabkan oleh:
1. **Missing configuration**: `VITE_TRIPAY_APPS_SCRIPT_URL` tidak di-set
2. **Security issue**: Firebase rules untuk payment transactions kurang ketat

Kedua masalah sudah diperbaiki. Sekarang Anda perlu:
1. Setup Google Apps Script untuk Tripay
2. Update `.env` dengan URL Apps Script
3. Update Firebase Rules di console
4. Restart development server

Setelah langkah-langkah ini, halaman pembayaran akan berfungsi dengan baik dan aman.
