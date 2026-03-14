# 🎯 Cara Setup Pembayaran Tripay (5 Menit)

Panduan praktis setup pembayaran Tripay dengan Google Apps Script.

## 📋 Yang Sudah Disiapkan

Semua kode sudah siap pakai! Anda tinggal:
1. Deploy Apps Script (2 menit)
2. Copy URL (30 detik)
3. Update .env (30 detik)
4. Test (2 menit)

## 🚀 Langkah Setup

### Langkah 1: Deploy Google Apps Script

**A. Buat Project Baru**
1. Buka: https://script.google.com
2. Klik tombol **"+ New project"**
3. Ganti nama project: **"Tripay Payment Proxy"**

**B. Copy Code**
1. Buka file: `google-apps-script/TripayProxy.gs` dari repository ini
2. Copy SEMUA isi file (Ctrl+A, Ctrl+C)
3. Paste ke Apps Script editor (hapus code default)
4. Save (Ctrl+S)

**C. Setup Konfigurasi**
1. Di dropdown function (atas editor), pilih: **`setupScriptProperties`**
2. Klik tombol **Run** (▶️)
3. Pertama kali akan minta authorization:
   - Klik "Review Permissions"
   - Pilih akun Google Anda
   - Klik "Advanced" → "Go to ... (unsafe)"
   - Klik "Allow"
4. Tunggu sampai selesai (cek Execution log)

**D. Deploy sebagai Web App**
1. Klik tombol **"Deploy"** (pojok kanan atas)
2. Pilih **"New deployment"**
3. Klik icon ⚙️ → Pilih **"Web app"**
4. Setting:
   - **Execute as**: Me
   - **Who has access**: Anyone
5. Klik **"Deploy"**
6. **COPY URL** yang muncul (contoh: `https://script.google.com/macros/s/AKfycby.../exec`)
7. Simpan URL ini!

### Langkah 2: Update Environment Variable

1. Buka file `.env` di root project
2. Tambahkan URL Apps Script yang tadi di-copy:

```env
VITE_TRIPAY_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID_HERE/exec
```

3. Ganti `YOUR_ID_HERE` dengan ID dari URL deployment Anda
4. Save file

### Langkah 3: Test di Apps Script

Kembali ke Apps Script editor:

**Test 1: Payment Channels**
1. Dropdown function → Pilih: **`testGetPaymentChannels`**
2. Klik **Run**
3. Cek Execution log → Harus muncul list payment channels

**Test 2: Create Transaction**
1. Dropdown function → Pilih: **`testCreateTransaction`**
2. Klik **Run**
3. Cek Execution log → Harus muncul reference & pay_url

**Test 3: Check Environment**
1. Dropdown function → Pilih: **`getCurrentEnvironment`**
2. Klik **Run**
3. Cek log → Harus tampil environment = "sandbox"

✅ Jika semua test berhasil, setup Apps Script SELESAI!

### Langkah 4: Test di Aplikasi

**A. Jalankan Development Server**
```bash
npm run dev
```

**B. Test Payment Flow**
1. Buka browser → http://localhost:5173
2. Login ke aplikasi
3. Pilih tryout yang berbayar
4. Klik "Beli Tryout"
5. Pilih metode pembayaran (QRIS recommended untuk test)
6. Klik "Bayar"
7. Harus muncul halaman pembayaran dengan QR code atau instruksi

✅ Jika muncul halaman pembayaran, setup BERHASIL!

### Langkah 5: Test Pembayaran (Sandbox)

**A. Simulasi Pembayaran**
1. Setelah buat transaksi, copy **Reference Number**
2. Buka: https://tripay.co.id/member
3. Login dengan akun sandbox Anda
4. Menu "Transactions"
5. Cari transaksi berdasarkan reference number
6. Klik tombol **"Pay"** untuk simulasi pembayaran sukses

**B. Cek Status di Aplikasi**
1. Tunggu 1-5 menit (untuk callback)
2. Refresh halaman payment atau kembali ke dashboard
3. Status harus berubah ke **"PAID"**
4. Tryout harus muncul di dashboard Anda
5. Anda bisa mengerjakan tryout tersebut

✅ Jika status berubah ke PAID, sistem berfungsi dengan sempurna!

## 🧪 Testing Tool (Bonus)

Ada tool HTML untuk testing tanpa aplikasi:

1. Buka file: `test-tripay-apps-script.html` di browser
2. Input URL Apps Script Anda
3. Klik "Simpan Konfigurasi"
4. Test semua function dengan tombol yang tersedia

Tool ini berguna untuk:
- Test payment channels
- Test create transaction
- Test get transaction detail
- Debug masalah

## 🔄 Migrasi ke Production (Nanti)

Ketika sudah siap production:

### 1. Dapatkan Credentials Production
- Login ke Tripay Dashboard Production
- Settings → API Key
- Copy:
  - API Key Production
  - Private Key Production
  - Merchant Code Production

### 2. Update Apps Script
- Buka Apps Script
- Project Settings (⚙️) → Script Properties
- Edit dan isi:
  - `TRIPAY_API_KEY_PROD`
  - `TRIPAY_PRIVATE_KEY_PROD`
  - `TRIPAY_MERCHANT_CODE_PROD`

### 3. Switch Environment
- Dropdown function → `switchToProduction`
- Klik Run
- Verify dengan `getCurrentEnvironment`

### 4. Test Production
- Buat 1 transaksi test (nominal kecil)
- Bayar dengan uang REAL
- Verify status berubah ke PAID
- Monitor selama 2-4 jam

## ❓ Troubleshooting

### Error: "Tripay belum dikonfigurasi"
**Solusi**: Pastikan `VITE_TRIPAY_APPS_SCRIPT_URL` sudah di-set di `.env` dan restart dev server

### Error: "Authorization required"
**Solusi**: Klik "Review permissions" → "Advanced" → "Allow"

### Payment channels tidak muncul
**Solusi**:
- Cek Execution log di Apps Script
- Verify API Key di Script Properties
- Pastikan environment = "sandbox"

### Create transaction gagal
**Solusi**:
- Cek Execution log untuk detail error
- Verify Private Key di Script Properties
- Pastikan Merchant Code benar

### Callback tidak diterima
**Solusi**:
- Tunggu 5-10 menit
- Cek Apps Script Execution log
- Verify callback URL di Tripay dashboard

## 📚 Dokumentasi Lengkap

File dokumentasi lain yang tersedia:

1. **TRIPAY_INTEGRATION_SUMMARY.md** - Overview lengkap sistem
2. **TRIPAY_QUICK_START.md** - Quick start guide
3. **TRIPAY_SETUP_VISUAL_GUIDE.md** - Panduan visual dengan diagram
4. **TRIPAY_APPS_SCRIPT_SETUP.md** - Setup detail dan advanced
5. **PRODUCTION_MIGRATION_CHECKLIST.md** - Checklist untuk production

## ✅ Checklist Setup

Tandai yang sudah selesai:

- [ ] Apps Script project dibuat
- [ ] Code TripayProxy.gs di-copy
- [ ] Function setupScriptProperties dijalankan
- [ ] Web app di-deploy
- [ ] URL deployment di-copy
- [ ] File .env di-update dengan URL
- [ ] testGetPaymentChannels berhasil
- [ ] testCreateTransaction berhasil
- [ ] getCurrentEnvironment menunjukkan "sandbox"
- [ ] Test di frontend berhasil
- [ ] Halaman pembayaran muncul
- [ ] Simulasi pembayaran di Tripay dashboard berhasil
- [ ] Status berubah ke PAID di aplikasi
- [ ] Tryout muncul di dashboard user

## 🎯 Yang Dicapai

Setelah setup selesai, Anda memiliki:

✅ Sistem pembayaran yang **AMAN** (API Key tidak exposed)
✅ **Easy testing** di Sandbox
✅ **Easy migration** ke Production (10 detik!)
✅ **Monitoring** lengkap via Apps Script log
✅ **Zero cost** (Apps Script gratis)
✅ **Production-ready** architecture

## 🚀 Next Steps

### Untuk Hari Ini (Sandbox):
1. Test SEMUA metode pembayaran yang tersedia
2. Test edge cases (expired, failed, dll)
3. Verify callback berfungsi
4. Familiarize dengan Tripay dashboard
5. Test dengan berbagai nominal

### Untuk Besok (Production):
1. Dapatkan credentials production dari Tripay
2. Follow checklist di `PRODUCTION_MIGRATION_CHECKLIST.md`
3. Switch environment
4. Test dengan transaksi real (nominal kecil)
5. Monitor dan optimize

## 💡 Tips

- **Simpan** URL Apps Script di tempat aman
- **Jangan share** API Key atau Private Key
- **Backup** Script Properties sebelum update
- **Test** di sandbox sebelum production
- **Monitor** log secara rutin
- **Dokumentasi** setiap perubahan

## 📞 Butuh Bantuan?

1. Cek Execution log di Apps Script
2. Cek Browser console (F12)
3. Gunakan `test-tripay-apps-script.html`
4. Baca dokumentasi lengkap
5. Review error message dengan teliti

---

**Estimasi Waktu Setup**: 5 menit
**Tingkat Kesulitan**: Easy
**Status**: Ready for Sandbox Testing

Selamat mencoba! 🎉
