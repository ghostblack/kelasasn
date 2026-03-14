# Tripay Payment Gateway - Setup Complete

## Konfigurasi yang Sudah Diterapkan

### 1. Google Apps Script Backend
URL Google Apps Script sudah dikonfigurasi di file `.env`:
```
VITE_TRIPAY_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbxPQx_gx2eNTUOMqODL0kB8d659IsP9-uUof3lXtnwj3J8iOZGSp3nlA8XYhfUtZMutBw/exec
```

### 2. Cara Kerja Sistem
```
Frontend (React) → Google Apps Script → Tripay API
     ↓                     ↓                  ↓
  User Interface      Backend Proxy      Payment Gateway
```

### 3. Endpoint yang Tersedia

#### A. Get Payment Channels
```typescript
// Mendapatkan daftar metode pembayaran
GET https://script.google.com/.../exec?path=payment-channels
```

#### B. Create Transaction
```typescript
// Membuat transaksi pembayaran baru
POST https://script.google.com/.../exec?path=create-transaction
Body: {
  method: 'QRIS',
  merchant_ref: 'TRY-12345678-1234567890',
  amount: 50000,
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  customer_phone: '081234567890',
  order_items: [
    {
      name: 'Tryout CPNS 2024',
      price: 50000,
      quantity: 1
    }
  ]
}
```

#### C. Get Transaction Detail
```typescript
// Mengecek status pembayaran
GET https://script.google.com/.../exec?path=transaction-detail&reference=T12345678...
```

### 4. File yang Sudah Dikonfigurasi

1. **`.env`** - Environment variables dengan URL Apps Script
2. **`src/config/tripay.config.ts`** - Konfigurasi Tripay
3. **`src/services/tripayService.ts`** - Service untuk Tripay API
4. **`src/services/paymentService.ts`** - Service untuk payment transactions
5. **`google-apps-script/TripayProxy.gs`** - Backend proxy (reference)

### 5. Testing

Untuk test payment gateway:
1. Buka halaman Tryouts di dashboard
2. Pilih tryout yang ingin dibeli
3. Klik "Beli Tryout"
4. Pilih metode pembayaran
5. Sistem akan menampilkan instruksi pembayaran

### 6. Flow Pembayaran

```
1. User pilih tryout → /dashboard/tryouts
2. User pilih metode pembayaran → /dashboard/payment
3. Sistem create transaction via Apps Script
4. User melakukan pembayaran (QRIS/VA/Retail)
5. Tripay mengirim webhook ke Apps Script
6. Apps Script update status di Firestore
7. User dapat akses tryout
```

### 7. Monitoring

Untuk monitoring transaksi:
- **Frontend**: Lihat di `/dashboard/payment-history`
- **Firestore**: Collection `payment_transactions`
- **Apps Script**: Lihat logs di Google Apps Script editor

### 8. Mode Sandbox vs Production

Saat ini menggunakan **Sandbox Mode** untuk testing.

Untuk switch ke Production:
1. Buka Google Apps Script
2. Jalankan function `switchToProduction()`
3. Pastikan credentials production sudah di-setup di Script Properties

### 9. Keamanan

✅ API Key dan Private Key disimpan di Google Apps Script
✅ Tidak ada sensitive data di frontend
✅ CORS sudah dikonfigurasi
✅ Signature verification untuk webhook
✅ SSL/HTTPS untuk semua komunikasi

### 10. Support

Jika ada masalah:
- Check console browser untuk error messages
- Check Google Apps Script logs
- Check Firestore untuk payment transactions
- Pastikan internet connection stabil

---

**Status**: ✅ Ready to use
**Environment**: Sandbox (Testing)
**Last Updated**: 2025-10-25
