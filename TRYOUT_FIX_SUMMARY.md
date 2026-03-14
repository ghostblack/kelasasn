# Perbaikan Try-Out System

## Permasalahan yang Ditemukan

### 1. Error Firebase Composite Index
**Masalah:** Query memerlukan Firebase Composite Index untuk field `userId` dan `purchaseDate` di collection `user_tryouts`, serta untuk field `userId` dan `completedAt` di collection `tryout_results`.

**Error:**
```
The query requires an index. You can create it here: https://console.firebase.google.com/...
```

**Solusi:**
- Menghapus `orderBy()` dari query Firebase
- Menggunakan JavaScript `.sort()` untuk mengurutkan data setelah fetch
- Ini menghindari kebutuhan untuk membuat composite index di Firebase Console

### 2. Field Naming Inconsistency
**Masalah:** Type definition menggunakan `totalScore` tapi service menggunakan `score`

**Solusi:** Mengupdate semua referensi untuk konsisten menggunakan `totalScore`

### 3. Error Handling yang Buruk
**Masalah:** Jika query `user_tryouts` gagal, seluruh halaman try-out tidak muncul

**Solusi:** Menambahkan nested try-catch agar try-out tetap ditampilkan meskipun data pembelian user gagal dimuat

## File yang Diperbaiki

### 1. `/src/services/tryoutService.ts`
**Perubahan:**
- `getUserTryouts()`: Menghapus `orderBy('purchaseDate', 'desc')` dan mengganti dengan client-side sorting
- `getUserResults()`: Menghapus `orderBy('completedAt', 'desc')` dan mengganti dengan client-side sorting
- `getUserStats()`: Memperbaiki referensi dari `r.score` menjadi `r.totalScore`

### 2. `/src/services/rankingService.ts`
**Perubahan:**
- `getRankingByTryout()`: Menghapus composite `orderBy()` dan mengganti dengan client-side sorting
- `getUserRankInTryout()`: Menghapus composite `orderBy()` dan mengganti dengan client-side sorting
- Menambahkan validasi return 0 jika user tidak ditemukan dalam ranking

### 3. `/src/screens/Dashboard/TryoutsPage.tsx`
**Perubahan:**
- Memisahkan error handling untuk `getAllTryouts()` dan `getUserTryouts()`
- Try-out tetap ditampilkan meskipun data pembelian user gagal dimuat

## Fitur yang Sudah Berfungsi

### ✅ Manajemen Try-Out di Admin
- Admin dapat membuat try-out baru
- Admin dapat set harga per try-out (field `price`)
- Admin dapat set kategori: `free` atau `premium`
- Admin dapat memilih soal-soal untuk try-out
- Admin dapat set durasi per kategori (TWK, TIU, TKP)

### ✅ Pembelian Try-Out oleh User
- User dapat melihat semua try-out yang tersedia
- User dapat melihat detail try-out beserta harganya
- User dapat membeli try-out (gratis atau berbayar)
- Sistem menyimpan record pembelian di `user_tryouts` collection

### ✅ Eksekusi Try-Out
- User dapat mengerjakan soal try-out yang sudah dibeli
- Soal dimuat dari `questionIds` yang sudah dipilih admin
- Timer per kategori soal
- Sistem menyimpan jawaban real-time
- Perhitungan skor otomatis

### ✅ Sistem Harga
- Field `price` sudah ada di `TryoutPackage` type
- Admin dapat set harga saat membuat/edit try-out
- UI menampilkan harga dengan format Rupiah
- Pembedaan visual antara try-out gratis dan premium

## Testing yang Diperlukan

1. **Test Firebase Rules**
   - Pastikan Firestore rules mengizinkan:
     - Read access untuk collection `tryout_packages` (where `isActive == true`)
     - Read/Write access untuk collection `user_tryouts` (user hanya bisa akses data sendiri)
     - Read/Write access untuk collection `tryout_sessions` (user hanya bisa akses session sendiri)
     - Read/Write access untuk collection `tryout_results` (user hanya bisa akses hasil sendiri)

2. **Test Admin Functions**
   - Login sebagai admin
   - Buat try-out baru dengan harga
   - Pilih soal-soal untuk try-out
   - Set try-out sebagai aktif

3. **Test User Flow**
   - Login sebagai user biasa
   - Lihat daftar try-out
   - Beli try-out (gratis atau premium)
   - Kerjakan try-out
   - Lihat hasil

## Konfigurasi Firebase Rules yang Disarankan

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Admin users collection
    match /admin_users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false;
    }

    // Try-out packages (read-only for users, admin can manage)
    match /tryout_packages/{packageId} {
      allow read: if request.auth != null && resource.data.isActive == true;
      allow write: if request.auth != null &&
                     exists(/databases/$(database)/documents/admin_users/$(request.auth.uid));
    }

    // Questions (read-only for authenticated users)
    match /questions/{questionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     exists(/databases/$(database)/documents/admin_users/$(request.auth.uid));
    }

    // User try-outs (users can only access their own)
    match /user_tryouts/{tryoutId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // Try-out sessions (users can only access their own)
    match /tryout_sessions/{sessionId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // Try-out results (read all for ranking, users can only write their own)
    match /tryout_results/{resultId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update: if request.auth != null && resource.data.userId == request.auth.uid;
    }

    // Jabatan (read-only for authenticated users)
    match /jabatan/{jabatanId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                     exists(/databases/$(database)/documents/admin_users/$(request.auth.uid));
    }
  }
}
```

## Langkah Selanjutnya

1. ✅ Update Firebase Rules menggunakan konfigurasi di atas
2. ✅ Test create try-out di admin panel
3. ✅ Pastikan soal sudah diinput (gunakan seed data jika perlu)
4. ✅ Test user flow dari pembelian sampai eksekusi try-out
5. ✅ Test ranking system

## Catatan Penting

- Sistem sudah mendukung harga per try-out
- Sistem sudah mendukung pembelian try-out
- Sistem sudah mendukung loading soal dari questionIds
- **Yang perlu dipastikan:** Firebase Rules harus di-setup dengan benar
- **Yang perlu dipastikan:** Data soal harus ada di database
- **Yang perlu dipastikan:** Admin sudah membuat try-out dengan memilih soal-soal
