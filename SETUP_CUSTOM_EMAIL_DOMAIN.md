# Setup Custom Email Domain untuk KelasASN.id

## Yang Sudah Dilakukan

1. ✅ Membuat custom email action handler di `/auth/action`
2. ✅ Mengubah `authDomain` di Firebase config menjadi `kelasasn.id`
3. ✅ Update semua email verification links untuk menggunakan domain custom
4. ✅ Halaman verifikasi dengan design profesional dan branding KelasASN.id

## Langkah Setup di Firebase Console

### 1. Tambahkan Domain ke Authorized Domains

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project **kelasasn2026**
3. Pergi ke **Authentication** → **Settings** → **Authorized domains**
4. Klik **Add domain**
5. Tambahkan: `kelasasn.id`
6. Klik **Add**

### 2. Setup Email Templates (Opsional - untuk branding tambahan)

Meskipun Firebase membatasi customization template, Anda bisa mengubah beberapa hal:

1. Pergi ke **Authentication** → **Templates**
2. Pilih **Email address verification**
3. Edit:
   - **From name**: `KelasASN.id`
   - **Reply-to email**: Email support Anda (misal: `support@kelasasn.id`)
   - **Subject**: `Verifikasi Email Anda - KelasASN.id`

### 3. Verifikasi Domain Ownership (PENTING!)

Untuk menggunakan custom domain, Firebase memerlukan verifikasi kepemilikan domain:

1. Pergi ke **Authentication** → **Settings** → **Authorized domains**
2. Klik domain `kelasasn.id` yang baru ditambahkan
3. Firebase akan memberikan TXT record
4. Tambahkan TXT record tersebut ke DNS settings domain Anda

**Contoh TXT Record:**
```
Host: @
Type: TXT
Value: google-site-verification=xxxxxxxxxxxxx
TTL: 3600
```

### 4. Setup DNS untuk Email (Jika menggunakan custom email sender)

Jika ingin email dikirim dari `noreply@kelasasn.id`:

1. Tambahkan SPF record:
```
Type: TXT
Host: @
Value: v=spf1 include:_spf.firebasemail.com ~all
TTL: 3600
```

2. Tambahkan DKIM record (akan diberikan oleh Firebase setelah setup)

## Cara Kerja Sistem Baru

### Flow Email Verification

1. User mendaftar di `/register`
2. Firebase mengirim email dengan link:
   ```
   https://kelasasn.id/auth/action?mode=verifyEmail&oobCode=xxxxx
   ```
3. User klik link → Diarahkan ke halaman custom di KelasASN.id
4. Halaman custom memproses verifikasi dengan design profesional
5. Setelah berhasil, user auto-redirect ke `/login`

### Keuntungan

✅ **Branding Konsisten**: Semua link menggunakan kelasasn.id
✅ **Kontrol Penuh**: Design halaman verifikasi sesuai brand
✅ **User Experience**: Seamless, tidak keluar dari domain
✅ **Profesional**: Tidak ada lagi link firebaseapp.com
✅ **Trust**: User lebih percaya dengan domain resmi

## Testing

Setelah setup selesai, test dengan:

1. **Daftar akun baru** di `/register`
2. **Cek email** yang diterima
3. **Verifikasi link** menggunakan domain kelasasn.id
4. **Pastikan** halaman verifikasi muncul dengan branding KelasASN.id
5. **Confirm** redirect ke login berhasil

## Troubleshooting

### Problem: Link masih menggunakan firebaseapp.com

**Solution**:
- Pastikan `authDomain: "kelasasn.id"` sudah benar di `src/lib/firebase.ts`
- Clear browser cache dan cookies
- Restart dev server

### Problem: Domain tidak terverifikasi

**Solution**:
- Cek TXT record sudah terpasang di DNS
- Tunggu propagasi DNS (bisa 24-48 jam)
- Gunakan [Google DNS Checker](https://dns.google/) untuk verifikasi

### Problem: Email tidak terkirim

**Solution**:
- Pastikan domain sudah terverifikasi
- Cek SPF record sudah terpasang
- Verifikasi Authorized domains di Firebase Console

## Domain Setup Checklist

- [ ] Tambahkan `kelasasn.id` ke Authorized domains
- [ ] Verifikasi domain ownership dengan TXT record
- [ ] Setup SPF record untuk email
- [ ] Test pendaftaran akun baru
- [ ] Test email verification link
- [ ] Test halaman verifikasi custom
- [ ] Test redirect setelah verifikasi

## Catatan Penting

1. **DNS Propagation**: Perubahan DNS bisa memakan waktu 24-48 jam
2. **Email Delivery**: Pastikan SPF dan DKIM sudah di-setup untuk deliverability
3. **Testing**: Gunakan email asli untuk testing, bukan email temporary
4. **Spam Folder**: Awal-awal email mungkin masuk spam, ini normal

## Support

Jika ada masalah dengan setup:
1. Cek Firebase Console untuk error messages
2. Verifikasi DNS records dengan tools online
3. Test dengan multiple email providers (Gmail, Yahoo, Outlook)
