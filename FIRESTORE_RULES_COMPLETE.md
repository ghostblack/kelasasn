# Firestore Rules Lengkap - KelasASN

## PENTING: Rules ini yang HARUS digunakan!

Gunakan rules ini karena sudah sesuai dengan collection names yang ada di code.

## Copy Rules Ini ke Firebase Console

Buka Firebase Console → Firestore Database → Rules, lalu copy-paste rules berikut:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ===== Helper Functions =====
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

    // ===== Admins Collection =====
    match /admins/{adminId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // ===== Users Collection =====
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }

    // ===== User Sessions Collection =====
    // Collection name: userSessions (camelCase!)
    match /userSessions/{sessionId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow create: if isAuthenticated();
      allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
    }

    // ===== Questions Collection =====
    match /questions/{questionId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }

    // ===== Tryout Packages Collection =====
    // Collection name: tryout_packages (with underscore!)
    match /tryout_packages/{tryoutId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }

    // ===== Tryouts Collection (Legacy) =====
    match /tryouts/{tryoutId} {
      allow read: if isAuthenticated();
      allow create, update, delete: if isAdmin();
    }

    // ===== User Tryouts Collection =====
    // Collection name: user_tryouts (with underscore!)
    match /user_tryouts/{userTryoutId} {
      allow read: if isAuthenticated() &&
                    (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() &&
                      (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }

    // ===== Tryout Sessions Collection =====
    // Collection name: tryout_sessions (with underscore!)
    match /tryout_sessions/{sessionId} {
      allow read: if isAuthenticated() &&
                    (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() &&
                      (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }

    // ===== Tryout Results Collection =====
    // Collection name: tryout_results (with underscore!)
    match /tryout_results/{resultId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
      allow update, delete: if isAdmin();
    }

    // ===== Rankings Collection =====
    match /rankings/{rankingId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // ===== Jabatan Collection =====
    match /jabatan/{jabatanId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin();
    }

    // ===== Payment Transactions Collection =====
    // Collection name: payment_transactions (with underscore!)
    match /payment_transactions/{transactionId} {
      allow get: if isAuthenticated() &&
                    (resource.data.userId == request.auth.uid || isAdmin());
      allow list: if isAuthenticated();
      allow create: if isAuthenticated() &&
                      request.resource.data.userId == request.auth.uid;
      allow update: if isAuthenticated() &&
                      (resource.data.userId == request.auth.uid || isAdmin());
      allow delete: if isAdmin();
    }

    // ===== Claim Codes Collection =====
    // Collection name: claim_codes (with underscore!)
    match /claim_codes/{claimCodeId} {
      allow read: if isAuthenticated();
      allow create, delete: if isAdmin();
      allow update: if isAuthenticated() &&
                      (isAdmin() ||
                       (resource.data.isActive == true &&
                        resource.data.currentUses < resource.data.maxUses &&
                        !(request.auth.uid in resource.data.usedBy)));
    }

    // ===== Default Deny All =====
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Collection Names yang Benar

Ini collection names yang sebenarnya digunakan di code:

| Collection di Code | Rules Name | Note |
|-------------------|------------|------|
| `users` | `users` | No underscore |
| `admins` | `admins` | No underscore |
| `userSessions` | `userSessions` | camelCase! |
| `questions` | `questions` | No underscore |
| `tryout_packages` | `tryout_packages` | With underscore! |
| `user_tryouts` | `user_tryouts` | With underscore! |
| `tryout_sessions` | `tryout_sessions` | With underscore! |
| `tryout_results` | `tryout_results` | With underscore! |
| `payment_transactions` | `payment_transactions` | With underscore! |
| `claim_codes` | `claim_codes` | With underscore! |
| `jabatan` | `jabatan` | No underscore |

## Cara Menerapkan Rules

### Step 1: Buka Firebase Console
```
https://console.firebase.google.com/project/[PROJECT_ID]/firestore/rules
```

### Step 2: Hapus Rules Lama
- Select all (Ctrl+A / Cmd+A)
- Delete

### Step 3: Copy-Paste Rules Baru
- Copy rules dari file ini (mulai dari `rules_version`)
- Paste di editor

### Step 4: Publish
- Klik tombol **Publish**
- Tunggu sampai selesai (biasanya 10-30 detik)

### Step 5: Refresh App
- Refresh browser atau reload app
- Test login dan akses tryout

## Fitur Security Rules Ini

### 1. Google Login Support ✅
```javascript
// Users bisa create profile sendiri saat first login
match /users/{userId} {
  allow create: if isAuthenticated() && request.auth.uid == userId;
}
```

### 2. Session Management ✅
```javascript
// User bisa manage session mereka sendiri
match /userSessions/{sessionId} {
  allow create, update, delete: if isAuthenticated();
}
```

### 3. Tryout Access ✅
```javascript
// Semua user bisa baca tryout packages
match /tryout_packages/{tryoutId} {
  allow read: if isAuthenticated();
}

// User hanya bisa akses tryout mereka sendiri
match /user_tryouts/{userTryoutId} {
  allow read: if resource.data.userId == request.auth.uid;
}
```

### 4. Ranking Support ✅
```javascript
// Semua user bisa baca semua results (untuk ranking)
match /tryout_results/{resultId} {
  allow read: if isAuthenticated();
}
```

### 5. Payment Protection ✅
```javascript
// User hanya bisa create transaction untuk diri sendiri
match /payment_transactions/{transactionId} {
  allow create: if request.resource.data.userId == request.auth.uid;
}
```

### 6. Claim Code System ✅
```javascript
// User bisa update claim code saat claiming
// Tapi hanya jika code masih valid dan belum pernah dipakai
match /claim_codes/{claimCodeId} {
  allow update: if resource.data.isActive == true &&
                   resource.data.currentUses < resource.data.maxUses &&
                   !(request.auth.uid in resource.data.usedBy);
}
```

## Testing Checklist

Setelah apply rules, test ini:

- [ ] Login dengan Google → Harus berhasil tanpa error
- [ ] Buka halaman Tryouts → Harus muncul list tryout
- [ ] Klik detail tryout → Harus bisa buka detail
- [ ] Mulai tryout → Harus bisa start exam
- [ ] Submit jawaban → Harus berhasil save
- [ ] Lihat hasil → Harus muncul score
- [ ] Lihat ranking → Harus muncul ranking semua user
- [ ] Buka payment → Harus bisa create transaction
- [ ] Input claim code → Harus bisa claim jika valid
- [ ] Browser console → Tidak ada error permissions

## Troubleshooting

### Error: "Missing or insufficient permissions"

**Penyebab**: Rules tidak sesuai dengan collection names di code

**Solusi**: Pastikan rules menggunakan collection names yang EXACT sama dengan code

### Error: "PERMISSION_DENIED" saat load tryout

**Penyebab**: Collection name salah atau rules terlalu ketat

**Solusi**:
1. Check console log untuk lihat collection apa yang error
2. Pastikan rules ada untuk collection tersebut
3. Pastikan user sudah authenticated

### Tryout tidak muncul tapi tidak ada error

**Penyebab**: Mungkin rules `allow list` tidak diset

**Solusi**: Rules sudah benar, check apakah ada data di collection `tryout_packages`

## Perbedaan dengan Rules Sebelumnya

### Rules Lama (SALAH ❌):
```javascript
match /sessions/{sessionId} { ... }  // ❌ Collection tidak ada!
match /tryouts/{tryoutId} { ... }    // ❌ Harusnya tryout_packages!
match /userTryouts/{id} { ... }      // ❌ Harusnya user_tryouts!
match /tryoutResults/{id} { ... }    // ❌ Harusnya tryout_results!
match /transactions/{id} { ... }     // ❌ Harusnya payment_transactions!
match /claimCodes/{id} { ... }       // ❌ Harusnya claim_codes!
```

### Rules Baru (BENAR ✅):
```javascript
match /userSessions/{sessionId} { ... }        // ✅ camelCase
match /tryout_packages/{tryoutId} { ... }      // ✅ dengan underscore
match /user_tryouts/{id} { ... }               // ✅ dengan underscore
match /tryout_results/{id} { ... }             // ✅ dengan underscore
match /payment_transactions/{id} { ... }       // ✅ dengan underscore
match /claim_codes/{id} { ... }                // ✅ dengan underscore
```

## Status

✅ Rules sudah diperbaiki dan sesuai dengan code
✅ Semua collection names sudah benar
✅ Support Google login
✅ Support session management
✅ Support ranking system
✅ Support payment system
✅ Support claim codes

## Update Log

- 2024: Rules awal dengan collection names yang salah
- NOW: Fixed semua collection names sesuai dengan code actual
