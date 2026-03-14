# Firestore Rules untuk Google Authentication

## Rules yang Harus Diterapkan di Firebase Console

Buka Firebase Console > Firestore Database > Rules, dan ganti dengan rules berikut:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() &&
             exists(/databases/$(database)/documents/admins/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
    }

    // Users collection - Allow create on first login, update own profile
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId);
      allow delete: if false;
    }

    // Sessions collection
    match /sessions/{sessionId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // Tryouts collection
    match /tryouts/{tryoutId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Questions collection
    match /questions/{questionId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // User tryouts collection
    match /userTryouts/{userTryoutId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if false;
    }

    // Tryout results collection
    match /tryoutResults/{resultId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if false;
    }

    // Transactions collection
    match /transactions/{transactionId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if false;
    }

    // Claim codes collection
    match /claimCodes/{codeId} {
      allow read: if isAuthenticated();
      allow create: if isAdmin();
      allow update: if isAuthenticated();
      allow delete: if isAdmin();
    }

    // Jabatan collection
    match /jabatan/{jabatanId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // Admins collection
    match /admins/{userId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }

    // Default: deny all
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Poin Penting dalam Rules Ini:

1. **Users Collection**:
   - `allow create` - User bisa membuat profile sendiri saat pertama kali login dengan Google
   - `allow update` - User hanya bisa update profile sendiri
   - `allow read` - Semua authenticated user bisa baca user lain (untuk ranking, dll)

2. **Sessions Collection**:
   - User bisa create, read, update, delete session mereka sendiri

3. **Security**:
   - Semua operasi membutuhkan authentication
   - User hanya bisa akses data mereka sendiri
   - Admin memiliki akses penuh untuk manage content

## Cara Menerapkan Rules:

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Pilih project Anda
3. Klik "Firestore Database" di menu samping
4. Tab "Rules"
5. Copy-paste rules di atas
6. Klik "Publish"

## Testing Rules:

Setelah publish, test dengan:
1. Login dengan Google
2. Check browser console untuk error
3. Pastikan tidak ada "Missing or insufficient permissions" error

## Troubleshooting:

Jika masih ada error permissions:
1. Pastikan rules sudah di-publish
2. Check apakah user sudah authenticated
3. Lihat console log untuk error detail
4. Gunakan Rules Playground di Firebase Console untuk test
