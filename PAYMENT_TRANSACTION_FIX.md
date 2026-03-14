# Fix: Transaksi Pembayaran Gagal Setelah Payment Channel Berhasil

## Masalah yang Ditemukan

Meskipun payment channel berhasil diambil dari Tripay melalui Apps Script, transaksi pembayaran gagal saat tombol "Bayar Sekarang" diklik.

### Root Cause

**Ketidaksesuaian antara Frontend dan Apps Script dalam menangani request Create Transaction:**

1. **Frontend (`tripayService.ts`):**
   - Mengirim **POST request** dengan body JSON
   - URL: `${BASE_URL}?path=create-transaction`
   - Data dikirim via `body: JSON.stringify(payload)`

2. **Apps Script Lama (`TripayProxy-Updated.gs`):**
   - Hanya menangani GET request dengan parameter `action=createTransaction`
   - Membaca data dari query parameters (`e.parameter.amount`, `e.parameter.method`, dll)
   - Tidak memproses POST request dengan JSON body

### Akibatnya:
- Frontend mengirim POST request dengan JSON body
- Apps Script tidak dapat membaca data dari JSON body
- Transaction gagal dibuat karena data tidak lengkap

## Solusi

### 1. Update Apps Script

File baru: `google-apps-script/TripayProxy-Fixed.gs`

**Perubahan Utama:**

#### A. Pisahkan Handling POST Request
```javascript
function doPost(e) {
  // Deteksi apakah ini callback dari Tripay atau create transaction dari frontend
  const signature = e.parameter.headers ? e.parameter.headers['x-signature'] : null;

  if (e.postData && e.postData.contents && signature) {
    // Ini callback dari Tripay
    return handleTripayCallback(e, signature);
  }

  // Ini create transaction dari frontend
  return handleCreateTransaction(e);
}
```

#### B. Handle Create Transaction dengan JSON Body
```javascript
function handleCreateTransaction(e) {
  // Parse JSON body dari frontend
  let requestData = JSON.parse(e.postData.contents);

  // Validasi data
  if (!requestData.amount || !requestData.method) {
    return error response
  }

  // Buat signature
  const stringToSign = MERCHANT_CODE + merchantRef + amount;
  const signature = bytesToHex(
    Utilities.computeHmacSha256Signature(stringToSign, PRIVATE_KEY)
  );

  // Siapkan payload untuk Tripay
  const payload = {
    method: requestData.method,
    merchant_ref: merchantRef,
    amount: amount,
    customer_name: requestData.customer_name,
    customer_email: requestData.customer_email,
    customer_phone: requestData.customer_phone,
    order_items: requestData.order_items,
    callback_url: requestData.callback_url,
    return_url: requestData.return_url,
    expired_time: requestData.expired_time,
    signature: signature
  };

  // Panggil Tripay API
  const result = callTripayAPI('/transaction/create', 'post', payload);

  return result;
}
```

#### C. Logging yang Lebih Detail
```javascript
// Log setiap step untuk debugging
logToSheet(LOG_SHEET_TRANSACTIONS, {
  type: 'Create Transaction Request',
  requestData: requestData
});

logToSheet(LOG_SHEET_TRANSACTIONS, {
  type: 'Tripay Request Payload',
  payload: payload
});

logToSheet(LOG_SHEET_TRANSACTIONS, {
  type: 'Tripay Response',
  result: result
});
```

### 2. Cara Deploy Apps Script yang Sudah Diperbaiki

#### Step 1: Buka Google Apps Script
1. Buka Google Sheets yang sudah Anda gunakan sebelumnya
2. Klik **Extensions** > **Apps Script**

#### Step 2: Replace Code
1. Hapus semua code yang ada di editor
2. Copy semua code dari file `google-apps-script/TripayProxy-Fixed.gs`
3. Paste ke editor Apps Script
4. **Pastikan kredensial Tripay masih benar:**
   ```javascript
   const MERCHANT_CODE = 'T46118';
   const API_KEY = 'DEV-pnxETy9k3YyvbbzJ6heBhEp6dLuZqQT0yHARLTAy';
   const PRIVATE_KEY = '09Kcz-WsrHJ-CcRWU-loP7N-Xght0';
   ```

#### Step 3: Deploy Ulang
1. Klik **Deploy** > **Manage deployments**
2. Klik icon **Edit** (pensil) pada deployment yang aktif
3. Pada **New version**, pilih **New version**
4. Klik **Deploy**
5. Copy URL deployment (tidak perlu berubah jika edit deployment yang sama)

#### Step 4: Test
Tidak perlu update `.env` jika URL deployment sama. Langsung test:
1. Buka aplikasi
2. Pilih tryout
3. Klik "Beli Tryout"
4. Isi data pembeli
5. Pilih metode pembayaran
6. Klik "Bayar Sekarang"

### 3. Cara Debugging

#### A. Cek Log di Google Sheets
Apps Script akan otomatis membuat sheet baru bernama `TransactionLogs`:
- Timestamp: Kapan request terjadi
- Data: JSON string berisi detail request/response

#### B. Cek Console Browser
Buka Developer Tools (F12) dan lihat tab Console:
```
Sending transaction request to Apps Script: {...}
Apps Script response: {...}
Transaction data from Tripay: {...}
```

#### C. Cek Network Tab
Lihat request POST ke Apps Script:
- Status: Harus 200
- Response: Harus berisi `success: true` dan `data`

## Perbedaan Kunci

### Sebelum (TripayProxy-Updated.gs):
```javascript
// ❌ Hanya handle GET dengan query params
function doGet(e) {
  if (action === 'createTransaction') {
    const amount = e.parameter.amount;  // ❌ Tidak ada data dari POST body
    const method = e.parameter.method;   // ❌ Tidak ada data dari POST body
    ...
  }
}
```

### Sesudah (TripayProxy-Fixed.gs):
```javascript
// ✅ Handle POST dengan JSON body
function doPost(e) {
  // ✅ Parse JSON body
  const requestData = JSON.parse(e.postData.contents);

  // ✅ Ambil data dari parsed JSON
  const amount = requestData.amount;
  const method = requestData.method;
  ...
}
```

## Expected Flow

### Flow yang Benar:
1. User klik "Bayar Sekarang"
2. Frontend (`PaymentPage.tsx`) panggil `createPaymentTransaction()`
3. `createPaymentTransaction()` panggil `createTransaction()` di `tripayService.ts`
4. `tripayService.ts` kirim **POST request dengan JSON body** ke Apps Script
5. Apps Script terima POST request di `doPost()`
6. Apps Script parse JSON body dengan `JSON.parse(e.postData.contents)`
7. Apps Script buat signature dan payload untuk Tripay
8. Apps Script panggil Tripay API `/transaction/create`
9. Tripay return transaction data
10. Apps Script forward response ke frontend
11. Frontend simpan transaction ke Firestore
12. User diredirect ke halaman PaymentProcess

## Testing Checklist

- [ ] Payment channels bisa diambil (sudah berhasil)
- [ ] Klik "Bayar Sekarang" tidak error
- [ ] Console menampilkan "Transaction data from Tripay: {...}"
- [ ] Data transaction tersimpan di Firestore collection `payment_transactions`
- [ ] User diredirect ke halaman Payment Process
- [ ] Halaman Payment Process menampilkan:
  - Total pembayaran
  - Metode pembayaran
  - Nomor referensi
  - Tombol "Bayar Sekarang" (link ke checkout_url)
- [ ] Log di Google Sheets terisi dengan data request dan response

## Troubleshooting

### Error: "Failed to create transaction"
**Penyebab:** Apps Script belum di-deploy ulang dengan code yang baru

**Solusi:**
1. Pastikan sudah copy code dari `TripayProxy-Fixed.gs`
2. Deploy ulang dengan **New version**
3. Test lagi

### Error: "Invalid JSON format"
**Penyebab:** Frontend mengirim data dalam format yang salah

**Solusi:**
1. Cek console browser untuk melihat payload yang dikirim
2. Pastikan payload memiliki fields: `method`, `amount`, `customer_name`, `customer_email`, `customer_phone`, `order_items`

### Error di Apps Script: "Cannot read property 'contents' of undefined"
**Penyebab:** Request tidak memiliki body

**Solusi:**
1. Pastikan frontend menggunakan method POST
2. Pastikan header `Content-Type: application/json`
3. Pastikan body tidak kosong

## Kesimpulan

Masalah utama adalah **Apps Script tidak dapat membaca data dari POST body JSON**. Dengan memisahkan handling antara GET dan POST request, serta menambahkan parser untuk JSON body, transaksi pembayaran sekarang dapat berhasil dibuat.
