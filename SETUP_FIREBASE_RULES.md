# 🔥 Setup Firebase Rules - WAJIB DILAKUKAN!

## ⚠️ MASALAH

Jika Anda mengalami error berikut:
- ❌ "Missing or insufficient permissions"
- ❌ Admin tidak bisa membuat soal
- ❌ User tidak bisa mengakses tryout

**Masalahnya adalah**: Firebase Rules belum di-setup dengan benar!

---

## ✅ SOLUSI: Setup Firebase Rules

### Langkah 1: Buka Firebase Console

Klik link ini: **[Firebase Console - Firestore Rules](https://console.firebase.google.com/project/kelasasn2026/firestore/rules)**

### Langkah 2: Copy Rules Production

Buka file `FIREBASE_RULES_PRODUCTION.txt` di project ini, atau copy rules berikut:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isAdmin() {
      return isAuthenticated() &&
             exists(/databases/$(database)/documents/admins/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
    }

    // Admins collection
    match /admins/{adminId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() &&
                               (request.auth.uid == userId || isAdmin());
    }

    // Questions collection - PENTING untuk admin bisa buat soal!
    match /questions/{questionId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }

    // Tryout packages - PENTING untuk user bisa beli tryout!
    match /tryout_packages/{tryoutId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }

    // User tryouts
    match /user_tryouts/{userTryoutId} {
      allow read: if isAuthenticated() &&
                    (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() &&
                      (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }

    // Tryout sessions
    match /tryout_sessions/{sessionId} {
      allow read: if isAuthenticated() &&
                    (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() &&
                      (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }

    // Tryout results
    match /tryout_results/{resultId} {
      allow read: if isAuthenticated() &&
                    (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAdmin();
    }

    // Rankings
    match /rankings/{rankingId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Jabatan
    match /jabatan/{jabatanId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Payment transactions
    match /payment_transactions/{transactionId} {
      allow read: if isAuthenticated() &&
                    (resource.data.userId == request.auth.uid || isAdmin());
      allow list: if isAuthenticated();
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() &&
                      (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }

    // Claim codes - Users can read to validate, admins can manage
    match /claim_codes/{claimCodeId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }

    // Block everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Langkah 3: Paste ke Firebase Console

1. Hapus semua rules yang ada di Firebase Console
2. Paste rules baru dari atas
3. Klik tombol **"Publish"** (warna biru di kanan atas)
4. Tunggu sampai muncul notifikasi "Rules published successfully"

### Langkah 4: Test

1. **Test Admin**: Login sebagai admin di `/admin/login`
2. **Test Buat Soal**: Coba buat soal baru di menu "Kelola Soal"
3. **Test User**: Login sebagai user biasa
4. **Test Beli Tryout**: Coba lihat dan beli tryout di "List Try Out"

---

## 📋 Penjelasan Rules

### 🔐 Questions Collection
```javascript
match /questions/{questionId} {
  allow read: if isAuthenticated();        // Semua user yang login bisa baca soal
  allow create, update, delete: if isAdmin(); // Hanya admin bisa buat/edit/hapus soal
}
```

**Kenapa perlu ini?**
- Admin perlu akses `create` untuk membuat soal baru
- Admin perlu akses `update` untuk edit soal
- Admin perlu akses `delete` untuk hapus soal
- User biasa hanya bisa membaca soal (saat mengerjakan tryout)

### 🎯 Tryout Packages Collection
```javascript
match /tryout_packages/{tryoutId} {
  allow read: if isAuthenticated();        // Semua user bisa lihat daftar tryout
  allow create, update, delete: if isAdmin(); // Hanya admin bisa kelola tryout
}
```

**Kenapa perlu ini?**
- User perlu akses `read` untuk melihat list tryout yang tersedia
- User perlu akses `read` untuk melihat detail tryout sebelum beli
- Admin perlu akses penuh untuk kelola tryout

### 👤 User Tryouts Collection
```javascript
match /user_tryouts/{userTryoutId} {
  allow read: if isAuthenticated() &&
                (resource.data.userId == request.auth.uid || isAdmin());
  allow create: if isAuthenticated() &&
                  request.resource.data.userId == request.auth.uid;
}
```

**Kenapa perlu ini?**
- User perlu akses `create` untuk membeli tryout
- User hanya bisa baca tryout yang dia beli sendiri
- Admin bisa lihat semua pembelian

---

## ❓ Troubleshooting

### Error: "Missing or insufficient permissions" saat buat soal
**Solusi**: Pastikan rules sudah di-publish dan Anda login sebagai admin yang terdaftar di collection `admins`

### Error: User tidak bisa lihat daftar tryout
**Solusi**: Pastikan collection bernama `tryout_packages` (bukan `tryouts`) dan rules sudah benar

### Error: User tidak bisa beli tryout
**Solusi**:
1. Pastikan collection `user_tryouts` ada di rules
2. Pastikan user sudah login (authenticated)
3. Check console browser untuk error detail

### Cara check apakah user adalah admin
1. Buka Firebase Console > Firestore Database
2. Cari collection `admins`
3. Cari document dengan ID = UID user Anda
4. Pastikan field `role` = "admin"

---

## 🔗 Link Berguna

- **Firestore Rules**: https://console.firebase.google.com/project/kelasasn2026/firestore/rules
- **Firestore Data**: https://console.firebase.google.com/project/kelasasn2026/firestore/data
- **Authentication**: https://console.firebase.google.com/project/kelasasn2026/authentication/users

---

## ✨ Setelah Setup Berhasil

Anda akan bisa:
- ✅ Admin dapat membuat, edit, dan hapus soal
- ✅ Admin dapat membuat dan kelola tryout packages
- ✅ User dapat melihat daftar tryout
- ✅ User dapat membeli tryout (gratis atau berbayar)
- ✅ User dapat mengerjakan tryout yang sudah dibeli
- ✅ System aman dari akses tidak sah
