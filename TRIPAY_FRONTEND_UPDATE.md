# Update Frontend Tripay - Apps Script Integration

## Perubahan yang Dilakukan

### 1. Google Apps Script (TripayProxy.gs)

File Apps Script telah diperbarui dengan perbaikan berikut:

#### Perbaikan CORS
- **Menambahkan `doOptions(e)`**: Fungsi baru untuk menangani CORS preflight requests (OPTIONS)
- **Memperbaiki `createJsonResponse()`**: Menambahkan header CORS ke semua respons:
  - `Access-Control-Allow-Origin: *`
  - `Access-Control-Allow-Methods: GET, POST, OPTIONS`
  - `Access-Control-Allow-Headers: Content-Type, Authorization`

#### Perbaikan Routing
- **Menghapus cek yang salah**: `e.parameter.method === 'OPTIONS'` (parameter ini tidak ada)
- **Memperbaiki `doPost(e)`**: Sekarang membedakan:
  - Request dengan `?path=...` → API call dari frontend
  - Request tanpa `?path=` → Webhook callback dari Tripay

#### Callback Handler yang Lebih Aman
- Verifikasi signature menggunakan full JSON body
- Mencari signature di header dan body
- Validasi yang lebih ketat

### 2. Frontend Configuration (tripay.config.ts)

**Penambahan:**
```typescript
export const TRIPAY_CALLBACK = {
  webhookUrl: import.meta.env.VITE_TRIPAY_APPS_SCRIPT_URL?.replace(/\?.*$/, '') || '',
} as const;
```

Ini memastikan callback URL dikirim tanpa query parameters ke Tripay (webhook endpoint).

### 3. Frontend Service (tripayService.ts)

**Perubahan pada semua fetch requests:**
- Menambahkan `mode: 'cors'` di semua fetch options
- Import `TRIPAY_CALLBACK` untuk webhook URL
- Callback URL sekarang menggunakan Apps Script URL langsung (tanpa parameter)
- Return URL tetap ke aplikasi frontend

**Before:**
```typescript
callback_url: params.callbackUrl || `${window.location.origin}/api/tripay/callback`,
```

**After:**
```typescript
callback_url: params.callbackUrl || TRIPAY_CALLBACK.webhookUrl,
```

### 4. Dokumentasi (TRIPAY_QUICK_START.md)

Menambahkan troubleshooting untuk CORS error:
- Memastikan Web App sudah di-deploy dengan benar
- Verifikasi "Who has access" diset ke "Anyone"
- Memastikan URL deployment benar

## Cara Kerja Sistem Sekarang

### Flow Pembayaran:

1. **User membuat transaksi di frontend**
   - Frontend → Apps Script URL dengan `?path=create-transaction`
   - Apps Script menerima di `doPost(e)` dengan path parameter
   - Apps Script generate signature dan forward ke Tripay API
   - Tripay membuat transaksi dan return payment URL

2. **User melakukan pembayaran**
   - User membuka payment URL dari Tripay
   - User melakukan pembayaran (QRIS/Virtual Account/dll)
   - Tripay memverifikasi pembayaran

3. **Tripay mengirim callback**
   - Tripay → Apps Script URL (tanpa parameter path)
   - Apps Script menerima di `doPost(e)` tanpa path (masuk ke `handleCallback`)
   - Apps Script verifikasi signature dari Tripay
   - Apps Script log callback data (bisa di-forward ke Firebase/database Anda)

4. **User redirect ke success page**
   - User → Return URL yang di-set saat create transaction
   - Frontend → Apps Script untuk cek status transaksi
   - Frontend update UI berdasarkan status

## Setup yang Diperlukan

### 1. Re-deploy Apps Script (PENTING!)

Karena ada perubahan pada Apps Script, Anda HARUS melakukan deploy ulang:

```
1. Buka Google Apps Script project Anda
2. Copy paste code baru dari google-apps-script/TripayProxy.gs
3. Klik "Deploy" > "Manage deployments"
4. Klik icon "edit" (pensil) di deployment yang ada
5. Klik "Version" > "New version"
6. Klik "Deploy"
7. URL deployment tetap sama, tidak perlu update .env
```

### 2. Verifikasi Environment Variable

Pastikan `.env` sudah benar:
```env
VITE_TRIPAY_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID_HERE/exec
```

### 3. Test Flow Lengkap

```bash
# 1. Test Apps Script dari editor
- Jalankan testGetPaymentChannels()
- Jalankan getCurrentEnvironment()

# 2. Test dari frontend
npm run dev

# 3. Test create transaction
- Login ke aplikasi
- Pilih tryout berbayar
- Lengkapi form pembayaran
- Klik "Bayar Sekarang"
- Verifikasi payment URL muncul

# 4. Test callback (di sandbox)
- Buka Tripay Dashboard Sandbox
- Cari transaksi Anda
- Klik "Pay" untuk simulasi pembayaran
- Check Apps Script Execution log untuk callback
```

## Debugging

### Jika Error CORS:
1. Pastikan Apps Script sudah di-deploy ulang dengan code baru
2. Verify "Who has access" = "Anyone"
3. Clear browser cache
4. Coba di incognito mode

### Jika Callback Tidak Masuk:
1. Check Apps Script Execution log
2. Verify callback URL di Tripay = Apps Script URL (tanpa parameter)
3. Test signature verification
4. Check Tripay webhook settings

### Check Apps Script Logs:
```
1. Buka Apps Script
2. Klik "Executions" di sidebar kiri
3. Lihat semua request masuk
4. Klik detail untuk melihat log lengkap
```

## Keamanan

### CORS Headers
- `Access-Control-Allow-Origin: *` aman karena Apps Script hanya proxy
- API Key dan Private Key tetap tersimpan aman di Script Properties
- Frontend tidak pernah tahu credentials Tripay

### Signature Verification
- Setiap request ke Tripay menggunakan signature yang di-generate Apps Script
- Setiap callback dari Tripay diverifikasi signaturenya
- Invalid signature = request ditolak

### Environment Separation
- Sandbox dan Production credentials terpisah
- Easy switch dengan fungsi `switchToProduction()` dan `switchToSandbox()`

## Next Steps

1. Test di sandbox sampai semua flow berjalan
2. Monitor Apps Script execution logs
3. Setup proper error handling di frontend
4. Implement retry mechanism untuk failed transactions
5. Setup notification untuk user ketika payment sukses
6. Migrate ke production dengan credentials production

## Support

Jika ada masalah:
1. Check browser console untuk frontend errors
2. Check Apps Script Executions untuk server errors
3. Verify credentials di Script Properties
4. Test individual functions di Apps Script editor

---

**Updated**: 2024-01-XX
**Version**: 2.0 (with CORS fixes and improved callback handling)
