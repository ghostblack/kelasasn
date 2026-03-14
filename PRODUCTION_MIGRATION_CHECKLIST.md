# 🚀 Production Migration Checklist

Checklist lengkap untuk migrasi dari Tripay Sandbox ke Production dengan aman.

## 📋 Pre-Migration (1-2 Hari Sebelum)

### Testing di Sandbox
- [ ] Semua metode pembayaran sudah ditest
- [ ] Payment success flow berjalan dengan baik
- [ ] Payment expired handling berfungsi
- [ ] Payment failed handling berfungsi
- [ ] Callback webhook sudah ditest
- [ ] User dapat melihat history pembayaran
- [ ] User dapat mengakses tryout setelah payment success

### Persiapan Credentials
- [ ] Akun Tripay Production sudah dibuat
- [ ] Verifikasi bisnis sudah lengkap di Tripay
- [ ] API Key Production sudah didapatkan
- [ ] Private Key Production sudah didapatkan
- [ ] Merchant Code Production sudah didapatkan
- [ ] Rekening bank untuk settlement sudah terdaftar

### Dokumentasi
- [ ] Backup semua credentials sandbox
- [ ] Dokumentasikan flow pembayaran yang sudah ditest
- [ ] Screenshot hasil testing di sandbox
- [ ] Catat semua issue yang ditemukan dan solusinya

## 🔧 Migration Day

### 1. Backup (5 menit)

```bash
# Backup Script Properties saat ini
# Di Google Apps Script:
# 1. Klik Project Settings
# 2. Screenshot semua Script Properties
# 3. Simpan ke file secure
```

- [ ] Backup Script Properties dari Apps Script
- [ ] Backup .env file
- [ ] Backup database (export Firestore jika perlu)
- [ ] Tag git commit terakhir yang stable

### 2. Update Apps Script (10 menit)

Di Google Apps Script:

- [ ] Buka Project Settings (⚙️)
- [ ] Scroll ke "Script Properties"
- [ ] Klik "Edit script properties"
- [ ] Update properties berikut:

```
TRIPAY_API_KEY_PROD = [Production API Key]
TRIPAY_PRIVATE_KEY_PROD = [Production Private Key]
TRIPAY_MERCHANT_CODE_PROD = [Production Merchant Code]
```

- [ ] Save properties
- [ ] Verify semua properties tersimpan

### 3. Test di Apps Script Console (5 menit)

- [ ] Function `getCurrentEnvironment` → Verify masih sandbox
- [ ] Function `testGetPaymentChannels` → Harus sukses (sandbox)
- [ ] Function `testCreateTransaction` → Harus sukses (sandbox)

### 4. Switch to Production (2 menit)

- [ ] Jalankan function `switchToProduction`
- [ ] Cek Execution log: "Environment switched to PRODUCTION"
- [ ] Function `getCurrentEnvironment` → Verify:
  - environment = "production"
  - baseUrl = "https://tripay.co.id/api"
  - merchantCode = [Your Prod Merchant Code]

### 5. Test Production API (10 menit)

- [ ] Function `testGetPaymentChannels` → Harus sukses (production)
- [ ] Verify payment channels berbeda dari sandbox
- [ ] Verify fee berbeda dari sandbox

### 6. Test Real Transaction (15 menit)

- [ ] Buka aplikasi frontend
- [ ] Login dengan akun test
- [ ] Pilih tryout dengan harga paling murah (atau buat tryout khusus Rp 10.000)
- [ ] Pilih metode QRIS atau VA
- [ ] Lakukan pembayaran dengan UANG REAL
- [ ] **PENTING**: Ini bukan simulasi, uang akan benar-benar terpotong!

Monitoring:
- [ ] Cek Apps Script Execution log
- [ ] Cek Browser console tidak ada error
- [ ] Cek transaksi muncul di Tripay Dashboard Production
- [ ] Bayar transaksi
- [ ] Tunggu callback (biasanya 1-5 menit)
- [ ] Cek status payment di aplikasi berubah ke PAID
- [ ] Cek tryout muncul di user dashboard
- [ ] Cek user bisa mengerjakan tryout

### 7. Setup Webhook Production (5 menit)

- [ ] Login ke Tripay Dashboard Production
- [ ] Settings → Callback URL
- [ ] Set URL: `[Your Apps Script URL]?action=callback`
- [ ] Test webhook dengan transaksi baru
- [ ] Verify callback diterima di Apps Script log

### 8. Monitoring Awal (2-4 Jam)

- [ ] Monitor Apps Script Executions setiap 30 menit
- [ ] Monitor error rate
- [ ] Test 2-3 transaksi lagi dengan nominal berbeda
- [ ] Test metode pembayaran berbeda (QRIS, VA, dll)
- [ ] Verify semua berhasil

## 🔄 Rollback Plan (Jika Ada Masalah)

Jika menemukan critical issue:

### Quick Rollback (2 menit)

```javascript
// Di Google Apps Script, jalankan:
function emergencyRollback() {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('ENVIRONMENT', 'sandbox');
  Logger.log('ROLLED BACK TO SANDBOX');
}
```

- [ ] Jalankan function `emergencyRollback` atau `switchToSandbox`
- [ ] Verify environment = "sandbox"
- [ ] Test 1 transaksi di sandbox untuk confirm
- [ ] Investigate issue
- [ ] Fix issue
- [ ] Repeat migration steps

### Common Issues dan Solutions

**Issue**: Signature invalid di production
**Solution**:
- Verify API Key, Private Key, Merchant Code tidak ada spasi
- Copy paste ulang dari Tripay dashboard
- Pastikan menggunakan credentials production, bukan sandbox

**Issue**: Payment channels tidak muncul
**Solution**:
- Verify environment sudah production
- Cek Execution log untuk detail error
- Verify API Key valid dan tidak expired

**Issue**: Callback tidak diterima
**Solution**:
- Verify callback URL di Tripay dashboard
- Test manual dengan transaksi baru
- Cek Apps Script Execution log
- Verify signature validation di callback handler

## 📊 Post-Migration (1-7 Hari)

### Day 1 (Monitoring Intensif)
- [ ] Check Execution log setiap 2 jam
- [ ] Monitor error rate < 1%
- [ ] Test 5-10 transaksi dengan user real
- [ ] Collect feedback dari user
- [ ] Fix issues immediately

### Day 2-3
- [ ] Check log 2x per hari (pagi & sore)
- [ ] Monitor settlement di Tripay dashboard
- [ ] Verify dana masuk ke rekening
- [ ] Update dokumentasi dengan findings

### Day 4-7
- [ ] Check log 1x per hari
- [ ] Review all transactions
- [ ] Calculate success rate
- [ ] Identify patterns (popular payment methods, peak hours, etc)
- [ ] Optimize based on data

## ✅ Success Criteria

Production migration dianggap sukses jika:

- [ ] Success rate > 95% (5 dari 5 transaksi berhasil)
- [ ] Payment status update dalam < 5 menit
- [ ] Tidak ada critical errors dalam 24 jam
- [ ] User dapat access tryout setelah payment
- [ ] Settlement dana berjalan normal
- [ ] Feedback user positif

## 🔐 Security Checklist

- [ ] API Key tidak exposed di frontend code
- [ ] Private Key tidak exposed di frontend code
- [ ] Callback signature validation berfungsi
- [ ] Script Properties di Apps Script tidak public
- [ ] Apps Script deployment "Execute as: Me"
- [ ] HTTPS digunakan untuk semua request
- [ ] Environment variable tidak di-commit ke git

## 📝 Documentation Updates

Setelah migration sukses:

- [ ] Update README dengan production notes
- [ ] Document actual payment flow
- [ ] Update troubleshooting guide
- [ ] Create user guide untuk pembayaran
- [ ] Document settlement process
- [ ] Create runbook untuk common issues

## 🎯 Performance Benchmarks

Catat metrics berikut untuk evaluasi:

| Metric | Target | Actual |
|--------|--------|--------|
| Payment creation time | < 3 detik | ___ |
| Callback receive time | < 5 menit | ___ |
| Status update time | < 1 menit | ___ |
| Success rate | > 95% | ___% |
| User satisfaction | > 4/5 | ___/5 |

## 📞 Emergency Contacts

Simpan kontak ini untuk emergency:

- **Tripay Support**: support@tripay.co.id
- **Tripay Phone**: [Cek di dashboard]
- **Technical Lead**: [Your contact]
- **Database Admin**: [Your contact]

## 🎉 Post-Migration Celebration

Jika semua checklist done dan success criteria tercapai:

- [ ] Inform team migration sukses
- [ ] Update status page (jika ada)
- [ ] Send announcement ke users
- [ ] Document lessons learned
- [ ] Backup production configuration
- [ ] Schedule review meeting (1 minggu setelah migration)

---

**Migration Date**: _______________
**Migrated By**: _______________
**Rollback Date (if any)**: _______________
**Final Status**: [ ] Success / [ ] Rolled Back / [ ] In Progress

**Notes**:
```
[Tambahkan notes selama proses migration]
```

---

**IMPORTANT REMINDER**:
- Backup sebelum ubah apapun
- Test di sandbox terlebih dahulu
- Gunakan transaksi nominal kecil untuk test production
- Monitor intensive di 24 jam pertama
- Jangan panic jika ada issue, ada rollback plan
- Document semuanya untuk future reference

Good luck! 🚀
