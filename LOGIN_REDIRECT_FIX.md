# Perbaikan Login Redirect Issue

## Masalah yang Terjadi

1. **Error "Missing or insufficient permissions"** - Firestore rules tidak mengizinkan user create profile sendiri
2. **Popup blocked** - Browser memblokir popup login Google
3. **Login loop** - Setelah login, user diarahkan kembali ke halaman login terus-menerus

## Penyebab Masalah

### 1. Firestore Rules Terlalu Ketat
```javascript
// Rules lama - tidak allow user create profile sendiri
match /users/{userId} {
  allow read: if isAuthenticated();
  allow write: if isAdmin(); // ❌ Hanya admin yang bisa write
}
```

### 2. Popup Blocked oleh Browser
- `signInWithPopup` sering diblokir oleh browser modern
- User harus manual allow popup

### 3. Session Validation Loop
```javascript
// AuthContext lama
} else {
  setUser(null); // ❌ Langsung reject user tanpa session
}
```

Saat user baru login:
1. Google redirect kembali ke app
2. AuthContext check session → tidak ada
3. AuthContext set `user = null`
4. User diarahkan kembali ke login page
5. Loop terus...

## Solusi yang Diterapkan

### 1. Update Firestore Rules ✅

```javascript
// Rules baru - allow user create/update profile sendiri
match /users/{userId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && request.auth.uid == userId; // ✅
  allow update: if isOwner(userId); // ✅
  allow delete: if false;
}
```

**Cara Apply:**
1. Buka Firebase Console → Firestore Database → Rules
2. Copy rules dari `FIRESTORE_RULES_GOOGLE_AUTH.md`
3. Publish

### 2. Ganti Popup ke Redirect ✅

**Before:**
```javascript
// Popup - sering diblock
await signInWithPopup(auth, provider);
```

**After:**
```javascript
// Redirect - tidak pernah diblock
await signInWithRedirect(auth, provider);
```

**Flow baru:**
1. User klik "Lanjutkan dengan Google"
2. Redirect ke halaman Google
3. Pilih akun
4. Redirect kembali ke app
5. Auto-login

### 3. Fix Session Validation Logic ✅

**Before:**
```javascript
// AuthContext lama
} else {
  setUser(null); // ❌ Reject user tanpa session
}
```

**After:**
```javascript
// AuthContext baru
} else {
  setUser(currentUser); // ✅ Allow user tanpa session (first login)
  setSessionId(null);
}
```

**Dengan ini:**
- User yang baru login tetap authenticated
- LoginPage punya waktu untuk create session
- Tidak ada loop lagi

### 4. Prevent Double Navigation ✅

**Tambah flag `isHandlingRedirect`:**
```javascript
const [isHandlingRedirect, setIsHandlingRedirect] = useState(false);

useEffect(() => {
  // Hanya navigate jika tidak sedang handle redirect
  if (user && !loading && !isHandlingRedirect) {
    checkUserProfile();
  }
}, [user, loading, isHandlingRedirect]);
```

**Dengan ini:**
- Tidak ada double navigation
- Tidak ada race condition

### 5. Auto-Create User Profile ✅

```javascript
const userRef = await userService.getUserData(user.uid);
if (!userRef) {
  // Auto-create profile saat first login
  await userService.createUserProfile(
    user.uid,
    user.email || '',
    user.displayName || user.email?.split('@')[0] || 'User'
  );
}
```

## Cara Testing

### 1. Test Login Pertama Kali (New User)
1. Buka app di incognito/private mode
2. Klik "Lanjutkan dengan Google"
3. Pilih akun Google
4. Harus masuk ke halaman Setup Username
5. Check console - tidak ada error permissions

### 2. Test Login User Existing
1. Login dengan akun yang sudah pernah setup username
2. Harus langsung masuk ke Dashboard
3. Tidak ada loop ke login page

### 3. Test Multiple Device
1. Login di device/browser 1
2. Coba login di device/browser 2 dengan akun yang sama
3. Device 1 harus otomatis logout (session conflict)

## Checklist

- [x] Update Firestore Rules di Firebase Console
- [x] Ganti popup ke redirect di LoginPage
- [x] Fix session validation di AuthContext
- [x] Prevent double navigation
- [x] Auto-create user profile
- [x] Build berhasil tanpa error

## File yang Diubah

1. `src/screens/LoginPage/LoginPage.tsx` - Ganti popup ke redirect
2. `src/contexts/AuthContext.tsx` - Fix session validation
3. `FIRESTORE_RULES_GOOGLE_AUTH.md` - Dokumentasi rules baru

## Status: ✅ COMPLETED

Build berhasil dan siap untuk testing!
