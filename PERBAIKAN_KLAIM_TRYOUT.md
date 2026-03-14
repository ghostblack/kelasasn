# Perbaikan Sistem Klaim Try Out Gratis

## Masalah yang Diperbaiki
Kode klaim sudah di-generate dan sudah diklaim oleh user, tetapi try out tetap tidak bisa diakses (gagal klaim).

## Penyebab Masalah

1. **Race Condition**: Setelah `purchaseTryout()` dipanggil, data mungkin belum ter-update di Firebase ketika `loadTryoutDetail()` dipanggil
2. **Tidak Ada Validasi**: Tidak ada pengecekan apakah data berhasil dibuat di database
3. **Error Handling Kurang**: Error yang terjadi tidak ditangani dengan baik

## Solusi yang Diterapkan

### 1. Tambah Pengecekan Duplikasi di `purchaseTryout`
**File**: `src/services/tryoutService.ts`

```typescript
export const purchaseTryout = async (
  userId: string,
  tryoutId: string,
  tryoutName: string
): Promise<string> => {
  // Cek apakah tryout sudah pernah dibeli
  const q = query(
    userTryoutsRef,
    where('userId', '==', userId),
    where('tryoutId', '==', tryoutId)
  );
  const existingSnapshot = await getDocs(q);

  if (!existingSnapshot.empty) {
    // Jika sudah ada, return ID yang sudah ada
    return existingSnapshot.docs[0].id;
  }

  // Buat dokumen baru
  const docRef = await addDoc(userTryoutsRef, {...});

  // Verifikasi dokumen berhasil dibuat
  await new Promise(resolve => setTimeout(resolve, 300));
  const verifySnapshot = await getDoc(docRef);

  if (!verifySnapshot.exists()) {
    throw new Error('Gagal memverifikasi pembelian tryout');
  }

  return docRef.id;
};
```

**Manfaat**:
- Mencegah duplikasi data
- Memverifikasi data berhasil dibuat
- Mengatasi race condition dengan delay kecil

### 2. Tambah Logging Detail
**File**: `src/services/tryoutService.ts`, `src/services/claimCodeService.ts`

Menambahkan console.log di setiap langkah penting untuk debugging:
- Saat mengecek tryout yang sudah dibeli
- Saat membuat dokumen baru
- Saat memverifikasi pembelian
- Saat update claim code

**Manfaat**:
- Memudahkan debugging jika ada masalah
- Tracking alur proses klaim

### 3. Improved Error Handling di `useClaimCode`
**File**: `src/services/claimCodeService.ts`

```typescript
export const useClaimCode = async (code: string, userId: string): Promise<void> => {
  if (snapshot.empty) {
    throw new Error('Kode klaim tidak ditemukan');
  }

  if (claimData.usedBy && claimData.usedBy.includes(userId)) {
    throw new Error('Anda sudah menggunakan kode ini');
  }

  await updateDoc(doc(db, 'claim_codes', claimDoc.id), {
    currentUses: increment(1),
    usedBy: arrayUnion(userId),
  });
};
```

**Manfaat**:
- Error message lebih jelas
- Validasi lebih ketat
- Mencegah penggunaan kode yang sama berulang kali

### 4. Tambah Delay & Logging di `handleClaimWithCode`
**File**: `src/screens/Dashboard/TryoutDetailPage.tsx`

```typescript
const handleClaimWithCode = async () => {
  try {
    console.log('Starting claim process...');

    // Validasi kode
    const validation = await validateClaimCode(...);
    console.log('Validation result:', validation);

    // Gunakan kode
    await useClaimCode(...);

    // Purchase tryout
    const purchaseId = await purchaseTryout(...);
    console.log('Purchase successful, ID:', purchaseId);

    // Delay sebelum reload
    await new Promise(resolve => setTimeout(resolve, 500));

    // Reload data
    await loadTryoutDetail();

  } catch (error) {
    // Error handling yang lebih baik
    toast({
      title: 'Error',
      description: error instanceof Error ? error.message : 'Gagal mengklaim try out',
      variant: 'destructive',
    });
  }
};
```

**Manfaat**:
- Logging setiap langkah untuk debugging
- Delay untuk memastikan data sudah ter-commit ke Firebase
- Error handling yang lebih spesifik

### 5. Enhanced Logging di `getUserTryouts`
**File**: `src/services/tryoutService.ts`

```typescript
export const getUserTryouts = async (userId: string): Promise<UserTryout[]> => {
  console.log(`Found ${snapshot.size} tryouts for user ${userId}`);

  const tryouts = snapshot.docs.map(doc => {
    console.log('User tryout document:', doc.id, doc.data());
    return {...};
  });

  console.log(`Returning ${validTryouts.length} valid tryouts`);
  return validTryouts;
};
```

## Flow Klaim Try Out yang Diperbaiki

1. User mengisi persyaratan (follow Instagram, join Telegram)
2. User memasukkan kode klaim
3. System validasi kode:
   - Cek apakah kode valid
   - Cek apakah kode belum expired
   - Cek apakah user belum pernah pakai kode ini
   - Cek apakah kode untuk tryout yang benar
4. System update claim code (increment usage, tambah user ke usedBy)
5. System purchase tryout:
   - Cek apakah sudah pernah dibeli (skip jika sudah ada)
   - Buat dokumen baru di user_tryouts
   - Verifikasi dokumen berhasil dibuat
6. Delay 500ms untuk memastikan data ter-commit
7. Reload data tryout
8. Tampilkan success message

## Testing

Untuk test sistem klaim:

1. Buka browser console (F12)
2. Pilih try out gratis
3. Klik "Klaim Gratis"
4. Centang persyaratan
5. Masukkan kode klaim yang valid
6. Klik "Klaim Try Out"
7. Perhatikan console log:
   - "Starting claim process..."
   - "Validation result: {valid: true, ...}"
   - "Using claim code..."
   - "Purchasing tryout..."
   - "Purchase successful, ID: xxx"
   - "Found X tryouts for user..."

Jika ada error, console akan menampilkan detail error untuk memudahkan debugging.

## Database yang Digunakan

Sistem ini tetap menggunakan **Firebase Firestore** sebagai database:
- Collection: `claim_codes` - menyimpan kode klaim
- Collection: `user_tryouts` - menyimpan tryout yang dibeli user
- Collection: `tryout_packages` - menyimpan paket tryout

## Kesimpulan

Perbaikan ini mengatasi masalah klaim try out gratis dengan:
- ✅ Menambah validasi dan verifikasi di setiap langkah
- ✅ Mengatasi race condition dengan delay strategis
- ✅ Mencegah duplikasi data
- ✅ Menambah logging lengkap untuk debugging
- ✅ Improved error handling dengan pesan yang jelas
- ✅ Tetap menggunakan Firebase sebagai database
