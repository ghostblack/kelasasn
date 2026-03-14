# Update Firestore Rules untuk Fitur Ranking

## Masalah yang Ditemukan

Fitur ranking tidak menampilkan data karena **Firestore Rules tidak mengizinkan semua authenticated users untuk membaca semua hasil try out**.

Rules sebelumnya:
```javascript
match /tryout_results/{resultId} {
  allow read: if isAuthenticated() &&
                (resource.data.userId == request.auth.uid || isAdmin());
  // Ini hanya mengizinkan user membaca hasil mereka sendiri
}
```

Hal ini menyebabkan:
- Ketika query `getDocs(collection(db, 'tryout_results'))` dipanggil
- Firestore hanya mengembalikan dokumen milik user yang sedang login
- Ranking hanya menampilkan satu entry (user sendiri) atau kosong
- **Tidak menampilkan semua peserta try out**

## Solusi

Rules baru memperbolehkan semua authenticated users untuk membaca semua hasil try out (diperlukan untuk fitur ranking):

```javascript
match /tryout_results/{resultId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() &&
                  request.resource.data.userId == request.auth.uid;
  allow update, delete: if isAdmin();
}
```

## Cara Update Firestore Rules

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Anda
3. Ke menu **Firestore Database** di sidebar kiri
4. Klik tab **Rules**
5. Copy seluruh isi file `FIREBASE_RULES_PRODUCTION.txt` yang sudah diperbaiki
6. Paste ke editor rules di Firebase Console
7. Klik tombol **Publish** untuk menerapkan rules baru
8. Tunggu beberapa detik hingga rules ter-publish

## Perubahan yang Dilakukan

### 1. Tryout Results - Akses Read untuk Semua User
**Sebelum:**
```javascript
match /tryout_results/{resultId} {
  allow read: if isAuthenticated() &&
                (resource.data.userId == request.auth.uid || isAdmin());
  allow create: if isAuthenticated() &&
                  request.resource.data.userId == request.auth.uid;
  allow update, delete: if isAdmin();
}
```

**Sesudah:**
```javascript
match /tryout_results/{resultId} {
  allow read: if isAuthenticated();  // ✅ Semua user bisa baca semua hasil
  allow create: if isAuthenticated() &&
                  request.resource.data.userId == request.auth.uid;
  allow update, delete: if isAdmin();
}
```

### 2. Menambahkan Rules untuk Collection `tryouts`
Collection `tryouts` sebelumnya tidak ada di rules, sehingga menyebabkan error saat mengambil nama tryout:

```javascript
// Tryouts collection - Users can read, only admins can write
match /tryouts/{tryoutId} {
  allow read: if isAuthenticated();
  allow create, update, delete: if isAdmin();
}
```

## Perbaikan Code yang Dilakukan

### 1. rankingService.ts
- ✅ Menambahkan logging lebih detail untuk debugging
- ✅ Memperbaiki filter untuk tryoutId `'all'`
- ✅ Menambahkan error handling yang lebih baik
- ✅ Menampilkan pesan yang jelas saat tidak ada data

### 2. tryoutSessionService.ts
- ✅ Menambahkan logging saat menyimpan hasil try out
- ✅ Memastikan data tersimpan dengan benar di collection `tryout_results`
- ✅ Logging untuk debugging masalah submission

## Testing

Setelah update rules:

1. **Login sebagai user**
2. **Selesaikan minimal 1 try out** untuk membuat data di `tryout_results`
3. **Buka halaman Ranking**
4. Periksa browser console untuk melihat log:
   - `✓ Found tryout_results documents: X` (X > 0)
   - Data ranking seharusnya muncul
5. **Login sebagai user lain dan selesaikan try out**
6. **Refresh halaman Ranking**
7. Seharusnya muncul 2 entry ranking (kedua user)

## Keamanan

Perubahan ini **aman** karena:
- ✅ Semua user tetap harus authenticated untuk membaca
- ✅ User hanya bisa create hasil try out untuk diri mereka sendiri
- ✅ Hanya admin yang bisa update/delete hasil
- ✅ Tidak ada informasi sensitif di tryout results (hanya skor dan userId)
- ✅ Email user di-anonymize di UI (hanya 3 karakter pertama + ***)

## Expected Result

Setelah perbaikan ini, halaman Ranking akan menampilkan:
- ✅ Semua user yang sudah menyelesaikan try out
- ✅ Skor terbaik masing-masing user
- ✅ Ranking berdasarkan skor (tertinggi ke terendah)
- ✅ Jika skor sama, ranking berdasarkan waktu selesai (lebih cepat lebih tinggi)
- ✅ Badge khusus untuk user yang sedang login
- ✅ Email user di-anonymize untuk privacy

## Catatan Penting

⚠️ **PENTING**: Firestore Rules harus di-update di Firebase Console agar perubahan ini bekerja. File `FIREBASE_RULES_PRODUCTION.txt` hanya dokumentasi, bukan rules aktif.

📝 Jika setelah update rules ranking masih kosong, pastikan:
1. Ada data di collection `tryout_results` (cek di Firebase Console > Firestore Database)
2. User sudah login dengan benar
3. Tidak ada error di browser console
