# Google Apps Script - Tripay Integration Guide

## Masalah yang Ditemukan

Apps Script Anda menggunakan **GET request dengan query parameters**, sedangkan aplikasi frontend sebelumnya menggunakan **POST request dengan JSON body**. Ini menyebabkan ketidakcocokan format request.

## Solusi

Saya telah mengupdate `tripayService.ts` untuk menyesuaikan dengan format Apps Script Anda yang sudah berhasil di-test.

## Langkah Setup

### 1. Update Apps Script Anda

Copy code dari file `google-apps-script/TripayProxy-Updated.gs` ke Google Apps Script Anda. File ini mendukung 3 action:

- `getPaymentChannels` - Mendapatkan daftar metode pembayaran
- `createTransaction` - Membuat transaksi baru
- `getTransactionDetail` - Mendapatkan detail transaksi

### 2. Deploy Apps Script

1. Buka Google Apps Script Editor
2. Copy paste code dari `TripayProxy-Updated.gs`
3. Klik **Deploy** → **New deployment**
4. Pilih type: **Web app**
5. Set:
   - **Execute as**: Me (your email)
   - **Who has access**: Anyone
6. Copy URL deployment

### 3. Update .env

URL sudah di-set di file `.env`:
```env
VITE_TRIPAY_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbxPQx_gx2eNTUOMqODL0kB8d659IsP9-uUof3lXtnwj3J8iOZGSp3nlA8XYhfUtZMutBw/exec
```

## Format Request yang Digunakan

### 1. Get Payment Channels
```
GET [APPS_SCRIPT_URL]?action=getPaymentChannels
```

### 2. Create Transaction
```
GET [APPS_SCRIPT_URL]?action=createTransaction&amount=50000&method=QRIS&name=John&email=john@example.com&phone=081234567890
```

### 3. Get Transaction Detail
```
GET [APPS_SCRIPT_URL]?action=getTransactionDetail&reference=T12345678...
```

## Testing

### Test di Browser
Buka URL ini di browser (ganti dengan URL Apps Script Anda):
```
https://script.google.com/.../exec?action=getPaymentChannels
```

Response yang diharapkan:
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "code": "QRIS",
        "name": "QRIS",
        "active": true,
        ...
      }
    ]
  }
}
```

### Test Create Transaction
```
https://script.google.com/.../exec?action=createTransaction&amount=10000&method=QRIS&name=Test&email=test@example.com&phone=081234567890
```

## Monitoring

### Google Sheets Logs
Apps Script akan otomatis membuat 2 sheet untuk logging:

1. **TransactionLogs** - Log semua transaksi API
2. **CallbackLogs** - Log callback dari Tripay

### View Logs
1. Buka Google Apps Script Editor
2. Klik **Execution log** atau **View → Logs**
3. Atau buka Google Sheet yang terhubung untuk melihat log detail

## Callback Webhook

Ketika pembayaran berhasil/gagal, Tripay akan mengirim POST request ke URL Apps Script Anda.

Apps Script akan:
1. Validasi signature
2. Log data ke sheet
3. Update status (implementasi TODO di section doPost)

## Troubleshooting

### Error: "No signature found"
- Pastikan Apps Script di-deploy sebagai Web App
- Set "Who has access" = Anyone

### Error: "Invalid Signature"
- Pastikan PRIVATE_KEY di Apps Script benar
- Check Tripay callback settings

### Payment channels tidak muncul
- Test URL Apps Script di browser dulu
- Check Execution log di Apps Script
- Pastikan kredensial Tripay benar

### CORS Error
- Apps Script secara otomatis menangani CORS
- Pastikan request dari domain yang benar

## Production Checklist

Sebelum ke production:

- [ ] Update kredensial Tripay dari Sandbox ke Production
- [ ] Update `MERCHANT_CODE`, `API_KEY`, `PRIVATE_KEY` di Apps Script
- [ ] Ganti `TRIPAY_SANDBOX_URL` menjadi `https://tripay.co.id/api`
- [ ] Test semua flow payment
- [ ] Setup monitoring Google Sheets
- [ ] Implement webhook handler untuk update Firestore

## Support

Jika ada error:
1. Check browser console
2. Check Google Apps Script Execution log
3. Check Google Sheets logs (TransactionLogs & CallbackLogs)
4. Verify .env file memiliki URL yang benar

---

**Status**: ✅ Configured and Ready
**Environment**: Sandbox (Testing)
**Last Updated**: 2025-10-25
