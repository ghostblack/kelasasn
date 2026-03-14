# Firestore Security Rules untuk KelasASN

## MASALAH: Missing or insufficient permissions

Error ini terjadi karena Firestore Security Rules tidak mengizinkan write operation.

**PENTING**: Anda HARUS mengubah Firestore Rules di Firebase Console agar admin dapat membuat soal dan user dapat mengakses tryout!

## SOLUSI 1: Setup Rules di Firebase Console (WAJIB)

### Langkah-langkah:

1. **Buka Firebase Console**
   ```
   https://console.firebase.google.com/project/kelasasn2026/firestore
   ```

2. **Pilih tab "Rules"**
   - Ada di menu atas: Data | Rules | Indexes | Usage

3. **TEMPORARY: Gunakan Rules ini untuk Setup Awal**

   **PENTING**: Rules ini HANYA untuk membuat admin pertama kali. Setelah admin dibuat, GANTI dengan rules yang aman!

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // TEMPORARY - ONLY FOR CREATING FIRST ADMIN
       // DELETE THIS AFTER ADMIN IS CREATED
       match /admins/{adminId} {
         allow read, write: if true;  // TEMPORARY!
       }

       match /users/{userId} {
         allow read, write: if true;  // TEMPORARY!
       }

       // Block everything else
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

4. **Klik "Publish"**

5. **Buat Admin menggunakan create-admin.html**

6. **SETELAH ADMIN DIBUAT, GANTI dengan Rules yang Aman**

   **COPY RULES INI dan PASTE di Firebase Console:**

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

       // Payment transactions - Users can read and create their own, admins can do everything
       match /payment_transactions/{transactionId} {
         allow read: if isAuthenticated() &&
                       (resource.data.userId == request.auth.uid || isAdmin());
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

7. **Klik "Publish"** lagi

## SOLUSI 2: Buat Admin Langsung dari Firebase Console

Jika tidak ingin mengubah rules, buat admin secara manual:

### Langkah A: Buat User di Authentication

1. Buka **Authentication** > **Users**
2. Klik **Add user**
3. Email: `admin@kelasasn.com`
4. Password: `Admin123!` (atau password kuat lainnya)
5. **COPY UID yang muncul** (contoh: `kP8xY2mN5fQ9wR1tU7vS3`)

### Langkah B: Tambahkan ke Firestore - Collection admins

1. Buka **Firestore Database**
2. Klik **+ Start collection** atau buka collection `admins`
3. Collection ID: `admins`
4. Document ID: **[Paste UID dari langkah A]**
5. Tambahkan fields:

   | Field Name  | Type      | Value                    |
   |-------------|-----------|--------------------------|
   | uid         | string    | [UID yang sama]          |
   | email       | string    | admin@kelasasn.com       |
   | role        | string    | admin                    |
   | displayName | string    | Admin KelasASN           |
   | createdAt   | timestamp | [klik timestamp now]     |

6. Klik **Save**

### Langkah C: Tambahkan ke Firestore - Collection users

1. Masih di **Firestore Database**
2. Buka/buat collection `users`
3. Document ID: **[UID yang sama]**
4. Tambahkan fields:

   | Field Name  | Type      | Value                    |
   |-------------|-----------|--------------------------|
   | uid         | string    | [UID yang sama]          |
   | email       | string    | admin@kelasasn.com       |
   | displayName | string    | Admin KelasASN           |
   | createdAt   | timestamp | [klik timestamp now]     |
   | updatedAt   | timestamp | [klik timestamp now]     |

5. Klik **Save**

### Langkah D: Login

Sekarang login di `/admin/login` dengan:
- Email: `admin@kelasasn.com`
- Password: `Admin123!` (atau password yang Anda buat)

## Penjelasan Rules

### Rules Sementara (Setup)
```javascript
allow read, write: if true;
```
Mengizinkan semua orang read/write. **TIDAK AMAN!** Hanya untuk setup.

### Rules Aman (Production)
```javascript
allow read: if isAuthenticated();
allow write: if isAdmin();
```
- Read: Hanya user yang login
- Write: Hanya admin

### Function isAdmin()
```javascript
function isAdmin() {
  return isAuthenticated() &&
         exists(/databases/$(database)/documents/admins/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.role == 'admin';
}
```
Mengecek apakah:
1. User sudah login
2. Document user ada di collection `admins`
3. Field `role` = "admin"

## Checklist Setup

- [ ] Buka Firebase Console
- [ ] Masuk ke Firestore > Rules
- [ ] Paste temporary rules
- [ ] Publish rules
- [ ] Buat admin menggunakan create-admin.html ATAU manual di console
- [ ] Verifikasi admin berhasil dibuat
- [ ] **GANTI dengan production rules**
- [ ] Publish rules lagi
- [ ] Test login admin
- [ ] Hapus file create-admin.html

## URL Firebase Console

- **Project Dashboard**: https://console.firebase.google.com/project/kelasasn2026
- **Authentication**: https://console.firebase.google.com/project/kelasasn2026/authentication/users
- **Firestore Database**: https://console.firebase.google.com/project/kelasasn2026/firestore/data
- **Firestore Rules**: https://console.firebase.google.com/project/kelasasn2026/firestore/rules

## Catatan Keamanan

1. **JANGAN PERNAH** gunakan `allow read, write: if true;` di production
2. Selalu gunakan authentication checks
3. Batasi write access hanya untuk admin
4. Validate data di rules jika perlu
5. Monitor Firestore usage di Firebase Console

## Troubleshooting

**Error: "Missing or insufficient permissions"**
→ Rules belum di-setup atau terlalu ketat

**Error: "Document doesn't exist"**
→ Admin belum dibuat di Firestore collection `admins`

**Error: "Permission denied"**
→ User tidak punya role admin atau rules salah

**Login berhasil tapi "Akses Ditolak"**
→ Document ada di `admins` tapi field `role` bukan "admin"
