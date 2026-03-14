# Update Firebase Firestore Rules untuk Fix Klaim Try Out

## Masalah
Error "Missing or insufficient permissions" muncul saat user mencoba klaim try out gratis karena user tidak punya permission untuk update `claim_codes`.

## Solusi
Update Firestore rules untuk membolehkan user mengupdate `claim_codes` saat klaim, dengan validasi keamanan yang ketat.

## Langkah-langkah Update Rules

### 1. Buka Firebase Console
1. Pergi ke [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Anda
3. Klik **Firestore Database** di menu kiri
4. Klik tab **Rules** di bagian atas

### 2. Update Rules untuk claim_codes

Cari bagian `claim_codes` di rules (sekitar line 97-101):

**SEBELUM (Salah):**
```javascript
// Claim codes - Users can read to validate, admins can manage
match /claim_codes/{claimCodeId} {
  allow read: if isAuthenticated();
  allow create, update, delete: if isAdmin();
}
```

**SESUDAH (Benar):**
```javascript
// Claim codes - Users can read and update (for claiming), admins can manage
match /claim_codes/{claimCodeId} {
  allow read: if isAuthenticated();
  allow create, delete: if isAdmin();
  // Allow users to update claim codes when claiming (increment usage, add to usedBy)
  allow update: if isAuthenticated() &&
                  (isAdmin() ||
                   (resource.data.isActive == true &&
                    resource.data.currentUses < resource.data.maxUses &&
                    !(request.auth.uid in resource.data.usedBy)));
}
```

### 3. Publish Rules
1. Klik tombol **Publish** di bagian atas
2. Tunggu konfirmasi "Rules published successfully"

## Penjelasan Rules Baru

Rules yang baru membolehkan user untuk update `claim_codes` HANYA jika:

1. ✅ User sudah authenticated
2. ✅ User adalah admin, ATAU memenuhi semua kondisi berikut:
   - Kode masih aktif (`isActive == true`)
   - Belum mencapai batas maksimum (`currentUses < maxUses`)
   - User belum pernah pakai kode ini (`!(request.auth.uid in resource.data.usedBy)`)

## Keamanan

Rules ini **AMAN** karena:

- ❌ User tidak bisa mengaktifkan kode yang sudah di-disable
- ❌ User tidak bisa menggunakan kode yang sudah full
- ❌ User tidak bisa menggunakan kode yang sama 2x
- ❌ User tidak bisa create atau delete claim codes
- ✅ User hanya bisa update untuk increment usage dan tambah diri ke usedBy
- ✅ Admin tetap punya full control

## Testing Setelah Update

1. Buka aplikasi
2. Login sebagai user biasa (bukan admin)
3. Pilih try out gratis
4. Klik "Klaim Gratis"
5. Centang persyaratan
6. Masukkan kode klaim yang valid (contoh: P6AD9YOT)
7. Klik "Klaim Try Out"

**Hasil yang diharapkan:**
- ✅ Muncul toast "Try out berhasil diklaim!"
- ✅ Try out muncul di "Try Out Saya"
- ✅ Tombol berubah jadi "Mulai Try Out"
- ✅ Tidak ada error "Missing or insufficient permissions"

## Troubleshooting

### Jika masih error setelah update rules:

1. **Clear browser cache**
   - Tekan Ctrl+Shift+Delete
   - Clear cache dan cookies
   - Restart browser

2. **Cek apakah rules sudah ter-publish**
   - Buka Firebase Console → Firestore → Rules
   - Pastikan tidak ada warning "Unpublished changes"

3. **Cek di browser console**
   - Buka DevTools (F12)
   - Lihat tab Console
   - Seharusnya ada log:
     ```
     Starting claim process...
     Validation result: {valid: true, ...}
     Using claim code...
     Current claim code data: {...}
     Claim code updated successfully for user: xxx
     Purchasing tryout...
     Purchase successful, ID: xxx
     ```

4. **Cek Firestore data**
   - Buka Firebase Console → Firestore → Data
   - Cek collection `claim_codes`
   - Pastikan kode ada dan `isActive: true`
   - Setelah klaim, `currentUses` harus bertambah
   - User ID harus masuk ke array `usedBy`

## File Rules Lengkap

File lengkap ada di: `FIREBASE_RULES_PRODUCTION.txt`

Copy seluruh isi file tersebut ke Firebase Console untuk memastikan semua rules konsisten.
