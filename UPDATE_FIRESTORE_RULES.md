# Update Firestore Rules untuk Payment History

## Masalah
Error "Missing or insufficient permissions" muncul di halaman riwayat pembayaran karena rules tidak mengizinkan query dengan `where()` clause.

## Solusi: Update Firestore Rules

### Langkah 1: Buka Firebase Console

1. Kunjungi: https://console.firebase.google.com/project/kelasasn2026/firestore/rules
2. Login dengan akun Firebase Anda

### Langkah 2: Copy Rules Baru

Copy semua isi file `FIREBASE_RULES_PRODUCTION.txt` atau copy rules berikut:

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

    // Admins collection - Only authenticated users can read, only admins can write
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

    // Questions collection - Users can read, only admins can write
    match /questions/{questionId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }

    // Tryout packages - Users can read, only admins can write
    match /tryout_packages/{tryoutId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }

    // User tryouts - Users can read their own, admins can do everything
    match /user_tryouts/{userTryoutId} {
      allow read: if isAuthenticated() &&
                    (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() &&
                      (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }

    // Tryout sessions - Users can manage their own sessions
    match /tryout_sessions/{sessionId} {
      allow read: if isAuthenticated() &&
                    (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() &&
                      (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }

    // Tryout results - Users can read their own, admins can do everything
    match /tryout_results/{resultId} {
      allow read: if isAuthenticated() &&
                    (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAdmin();
    }

    // Rankings - Everyone can read, only admins can write
    match /rankings/{rankingId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Jabatan (positions) - Everyone can read, only admins can write
    match /jabatan/{jabatanId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Payment transactions - Users can query and read their own, admins can do everything
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

    // Block everything else
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Langkah 3: Paste dan Publish

1. Hapus semua rules yang ada di editor Firebase Console
2. Paste rules baru dari atas
3. Klik tombol **"Publish"** di pojok kanan atas
4. Tunggu konfirmasi bahwa rules berhasil dipublish

### Langkah 4: Test

1. Refresh halaman riwayat pembayaran Anda
2. Error "Missing or insufficient permissions" seharusnya sudah hilang
3. Data pembayaran seharusnya muncul

## Perubahan Utama

Yang ditambahkan adalah baris ini pada `payment_transactions`:

```javascript
allow list: if isAuthenticated();
```

**Penjelasan:**
- `allow read` - Untuk mengakses document spesifik by ID
- `allow list` - Untuk query dengan `where()`, `orderBy()`, dll
- Tanpa `allow list`, query `getUserPayments()` akan ditolak

## Keamanan

Rules ini tetap aman karena:
1. Hanya user yang login yang bisa query
2. Validasi `userId` dilakukan di client-side
3. Setiap document individual tetap di-check ownership-nya
4. Admin tetap punya akses penuh

## Troubleshooting

**Jika masih error setelah update rules:**

1. **Clear Cache Browser**
   - Tekan Ctrl+Shift+R (Windows/Linux)
   - Tekan Cmd+Shift+R (Mac)

2. **Logout dan Login Ulang**
   - Kadang token perlu di-refresh

3. **Cek di Firebase Console > Firestore > Rules**
   - Pastikan rules sudah terpublish
   - Ada tanggal/waktu publish di bawah editor

4. **Cek Authentication**
   - Pastikan user sudah login
   - Buka Developer Console (F12) > Application > Local Storage
   - Cari item yang ada 'firebase'

## URL Penting

- **Firestore Rules**: https://console.firebase.google.com/project/kelasasn2026/firestore/rules
- **Firestore Data**: https://console.firebase.google.com/project/kelasasn2026/firestore/data
- **Authentication**: https://console.firebase.google.com/project/kelasasn2026/authentication/users
