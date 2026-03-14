# 🚀 Quick Start - Tripay Payment Gateway

Panduan cepat untuk setup dan testing Tripay payment gateway menggunakan Google Apps Script.

## ✅ Checklist Setup (5 Menit)

### 1. Deploy Google Apps Script (2 menit)

- [ ] Buka https://script.google.com
- [ ] Klik "New project"
- [ ] Copy code dari `google-apps-script/TripayProxy.gs`
- [ ] Paste ke editor
- [ ] Pilih function `setupScriptProperties` dari dropdown
- [ ] Klik Run (▶️) - Authorize jika diminta
- [ ] Klik "Deploy" > "New deployment" > "Web app"
- [ ] Set "Execute as": Me, "Who has access": Anyone
- [ ] Klik "Deploy"
- [ ] **Copy URL deployment** (simpan!)

### 2. Update Environment Variable (1 menit)

Buka file `.env` dan update:

```env
VITE_TRIPAY_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID_HERE/exec
```

Ganti `YOUR_ID_HERE` dengan URL deployment Anda.

### 3. Test di Apps Script (1 menit)

Di Google Apps Script console:

- [ ] Pilih function `testGetPaymentChannels`
- [ ] Klik Run
- [ ] Cek log - harus muncul list payment channels
- [ ] Pilih function `getCurrentEnvironment`
- [ ] Klik Run
- [ ] Pastikan environment = "sandbox"

### 4. Test di Frontend (1 menit)

```bash
npm run dev
```

- [ ] Login ke aplikasi
- [ ] Pilih tryout berbayar
- [ ] Klik "Beli Tryout"
- [ ] Pilih metode pembayaran (QRIS recommended)
- [ ] Klik "Bayar"
- [ ] Verifikasi payment page muncul

## 🧪 Testing Sandbox

### Cara Test Payment di Sandbox:

1. **Buat Transaksi**
   - Pilih tryout dan metode pembayaran
   - Akan muncul halaman payment dengan instruksi

2. **Simulasi Pembayaran (Sandbox)**
   - Buka Tripay Dashboard Sandbox
   - Masuk ke menu "Transactions"
   - Cari transaksi Anda (by reference)
   - Klik tombol "Pay" untuk simulasi pembayaran sukses
   - Atau biarkan expired untuk test expired

3. **Verifikasi di Aplikasi**
   - Kembali ke aplikasi
   - Status payment harus berubah ke "PAID"
   - Tryout harus muncul di dashboard Anda

### Test Cases yang Harus Dicoba:

- [ ] Payment berhasil (QRIS)
- [ ] Payment berhasil (Virtual Account - pilih bank)
- [ ] Payment expired (tunggu atau set expired time pendek)
- [ ] Check payment status sebelum bayar
- [ ] Check payment status setelah bayar

## 🔄 Migrasi ke Production

Ketika sudah siap production (SETELAH testing sandbox lengkap):

### 1. Dapatkan Credentials Production

- [ ] Login ke Tripay Dashboard Production
- [ ] Navigasi ke Settings > API Key
- [ ] Copy:
  - API Key Production
  - Private Key Production
  - Merchant Code Production

### 2. Update Apps Script Properties

- [ ] Buka Google Apps Script
- [ ] Klik "Project Settings" (⚙️)
- [ ] Scroll ke "Script Properties"
- [ ] Klik "Edit script properties"
- [ ] Update:
  - `TRIPAY_API_KEY_PROD` = [Your Prod API Key]
  - `TRIPAY_PRIVATE_KEY_PROD` = [Your Prod Private Key]
  - `TRIPAY_MERCHANT_CODE_PROD` = [Your Prod Merchant Code]

### 3. Switch Environment

- [ ] Di Apps Script, pilih function `switchToProduction`
- [ ] Klik Run
- [ ] Verify dengan function `getCurrentEnvironment`
- [ ] Pastikan environment = "production" dan baseUrl = "https://tripay.co.id/api"

### 4. Test Production

- [ ] Buat 1 transaksi test dengan nominal kecil (contoh: Rp 10.000)
- [ ] Bayar menggunakan uang real
- [ ] Verifikasi pembayaran masuk ke Tripay dashboard
- [ ] Verifikasi status di aplikasi berubah ke PAID

### 5. Go Live

- [ ] Monitor log selama 24 jam pertama
- [ ] Setup alert untuk failed transactions
- [ ] Update dokumentasi dengan production notes

## ⚠️ Troubleshooting Cepat

### Error: "Tripay belum dikonfigurasi"
**Solusi**: Set `VITE_TRIPAY_APPS_SCRIPT_URL` di file `.env`

### Error: "Script requires authorization"
**Solusi**:
- Klik "Review permissions"
- Klik "Advanced" > "Go to ... (unsafe)"
- Klik "Allow"

### Payment channels tidak muncul
**Solusi**:
- Cek Execution log di Apps Script
- Pastikan API Key valid
- Verify environment (sandbox/production)

### Signature invalid
**Solusi**:
- Cek Script Properties
- Pastikan tidak ada spasi di API Key/Private Key
- Verify Merchant Code benar

### Apps Script timeout
**Solusi**:
- Check internet connection
- Verify Tripay API tidak down
- Retry setelah beberapa menit

### CORS Error saat fetch
**Solusi**:
- Pastikan sudah deploy Apps Script sebagai Web App
- Pastikan "Who has access" diset ke "Anyone"
- Verifikasi URL deployment sudah benar di `.env`
- Apps Script otomatis menangani CORS dengan header yang tepat

## 📊 Monitoring

### Check Apps Script Logs:
1. Buka Apps Script
2. Klik "Executions" di sidebar
3. Lihat semua request dan response
4. Click detail untuk log lengkap

### Check Browser Console:
1. Buka Developer Tools (F12)
2. Tab Console
3. Filter: "tripay" atau "payment"

## 🎯 Tips untuk Production

1. **Backup Script Properties** sebelum update
2. **Test di sandbox** sebelum switch production
3. **Monitor log** 24 jam pertama production
4. **Setup webhook** untuk auto-update status
5. **Document** semua credentials dengan aman
6. **Enable 2FA** di Tripay dashboard
7. **Set alert** untuk failed/expired transactions
8. **Review transaction** secara berkala

## 📞 Support

### Jika masalah di Sandbox:
1. Cek Execution log di Apps Script
2. Cek Browser console
3. Verify Script Properties
4. Test individual functions di Apps Script

### Jika masalah di Production:
1. Switch kembali ke sandbox terlebih dahulu
2. Debug di sandbox
3. Contact Tripay support jika masalah di API mereka
4. Check status Tripay di https://status.tripay.co.id

## 📚 Resources

- [Tripay API Docs](https://tripay.co.id/developer)
- [Tripay Dashboard Sandbox](https://tripay.co.id/member)
- [Google Apps Script Docs](https://developers.google.com/apps-script)
- File dokumentasi lengkap: `TRIPAY_APPS_SCRIPT_SETUP.md`

---

**Setup Time**: ~5 menit untuk sandbox
**Test Time**: ~10 menit untuk comprehensive testing
**Production Ready**: Setelah all test cases passed

Selamat coding! 🚀
