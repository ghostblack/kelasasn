# Quick Fix Guide: Transaksi Pembayaran Gagal

## Masalah
Payment channel berhasil diambil, tapi saat klik "Bayar Sekarang" transaksi gagal.

## Root Cause
Apps Script tidak bisa membaca data dari POST request dengan JSON body. Apps Script lama hanya bisa handle GET request dengan query parameters.

## Solusi Cepat (5 Menit)

**PENTING:** Solusi ini sudah otomatis diterapkan di frontend. Anda hanya perlu update Apps Script.

### Step 1: Buka Apps Script
1. Buka Google Sheets yang sudah dipakai untuk Tripay
2. Klik **Extensions** > **Apps Script**

### Step 2: Replace Code
1. **Hapus semua code** yang ada di editor
2. **Copy semua code** dari file: `google-apps-script/TripayProxy-Fixed.gs`
3. **Paste** ke editor Apps Script
4. **Save** (Ctrl+S atau Cmd+S)

### Step 3: Deploy Ulang
1. Klik **Deploy** > **Manage deployments**
2. Klik icon **Edit** (pensil) pada deployment yang aktif
3. Di dropdown **New version**, pilih **New version**
4. Klik **Deploy**
5. Klik **Done**

### Step 4: Test
1. Buka aplikasi Anda
2. Login
3. Pilih tryout
4. Klik "Beli Tryout"
5. Isi data pembeli (nama dan nomor WhatsApp)
6. Pilih metode pembayaran
7. Klik "Bayar Sekarang"

**Expected Result:**
- Tidak ada error
- Muncul halaman Payment Process dengan:
  - Total pembayaran
  - Nomor referensi
  - Tombol "Bayar Sekarang" (untuk ke Tripay checkout)
  - Timer countdown
  - Tombol "Cek Status Pembayaran"

## Apa yang Berubah?

### Sebelum (Tidak Bekerja):
```javascript
// Apps Script hanya bisa handle GET request
function doGet(e) {
  if (action === 'createTransaction') {
    // ❌ Coba ambil data dari query params
    // tapi frontend kirim via POST body
    const amount = e.parameter.amount;  // undefined
    const method = e.parameter.method;  // undefined
  }
}
```

### Sesudah (Bekerja):
```javascript
// Apps Script bisa handle POST request dengan JSON body
function doPost(e) {
  // ✅ Parse JSON body dari frontend
  const requestData = JSON.parse(e.postData.contents);

  // ✅ Data lengkap tersedia
  const amount = requestData.amount;
  const method = requestData.method;
  // ... dst
}
```

## Debugging Tips

### 1. Cek Console Browser (F12)
Buka tab Console, seharusnya muncul:
```
Sending transaction request to Apps Script: {...}
Apps Script response: {success: true, data: {...}}
Transaction data from Tripay: {...}
```

Jika ada error, akan muncul di sini.

### 2. Cek Network Tab
Buka tab Network, filter "Fetch/XHR":
- Cari request ke Apps Script URL
- Status harus: **200 OK**
- Response harus: `{success: true, data: {...}}`

### 3. Cek Log di Google Sheets
Apps Script otomatis bikin sheet baru bernama **TransactionLogs**:
- Setiap request tercatat dengan timestamp
- Bisa lihat payload yang dikirim dan response yang diterima

## Jika Masih Gagal

### Kemungkinan 1: URL Apps Script Salah
**Cek file `.env`:**
```bash
VITE_TRIPAY_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

**Pastikan:**
- URL diakhiri dengan `/exec`
- Tidak ada spasi
- DEPLOYMENT_ID benar (copy dari Apps Script deployment)

### Kemungkinan 2: Apps Script Tidak Ter-deploy
**Solusi:**
1. Kembali ke Apps Script
2. Klik **Deploy** > **Manage deployments**
3. Pastikan ada deployment dengan status **Active**
4. Jika tidak ada, create new deployment:
   - Klik **New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Deploy

### Kemungkinan 3: Firestore Rules Tidak Mengizinkan
**Cek Firestore Rules** untuk collection `payment_transactions`:
```javascript
// Rules harus mengizinkan authenticated user untuk write
match /payment_transactions/{transactionId} {
  allow create: if request.auth != null;
  allow read: if request.auth != null &&
    resource.data.userId == request.auth.uid;
  allow update: if request.auth != null &&
    resource.data.userId == request.auth.uid;
}
```

## Verification Checklist

Setelah fix, pastikan semua ini work:

- [ ] GET payment channels: ✓ (sudah work)
- [ ] POST create transaction: ✓ (setelah fix)
- [ ] Transaction tersimpan di Firestore
- [ ] User redirect ke payment process page
- [ ] Bisa klik "Bayar Sekarang" ke Tripay checkout
- [ ] Bisa klik "Cek Status Pembayaran"
- [ ] Log tercatat di Google Sheets

## Bantuan Lebih Lanjut

Jika masih ada masalah, buka file detail: **PAYMENT_TRANSACTION_FIX.md**

File tersebut menjelaskan:
- Root cause yang lebih detail
- Semua perubahan code
- Flow diagram
- Troubleshooting lengkap
