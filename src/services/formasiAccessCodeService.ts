import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  increment,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FormasiAccessCode, UserFormasiAccess } from '@/types';
// Import Timestamp type for casting
import { Timestamp } from 'firebase/firestore';

const COLLECTION_CODES = 'formasi_access_codes';
const COLLECTION_USERS = 'user_formasi_access';

export const generateFormasiCode = async (
  maxUses: number,
  createdBy: string,
  expiryDate?: Date
): Promise<string> => {
  const code = generateRandomCode();

  const codesRef = collection(db, COLLECTION_CODES);
  await addDoc(codesRef, {
    code,
    maxUses,
    currentUses: 0,
    isActive: true,
    expiryDate: expiryDate || null,
    usedBy: [],
    createdAt: serverTimestamp(),
    createdBy,
  });

  return code;
};

export const checkUserFormasiAccess = async (userId: string): Promise<boolean> => {
  try {
    const userAccessRef = doc(db, COLLECTION_USERS, userId);
    const userAccessSnap = await getDoc(userAccessRef);

    if (!userAccessSnap.exists()) {
      return false;
    }

    const data = userAccessSnap.data();
    if (!data.expiresAt) return false;
    
    // Support either Timestamp or Date string
    let expiresAt: Date;
    if (data.expiresAt instanceof Timestamp) {
      expiresAt = data.expiresAt.toDate();
    } else if (typeof data.expiresAt === 'string') {
      expiresAt = new Date(data.expiresAt);
    } else if (data.expiresAt?.seconds) {
      // Fallback for cases where it's a plain object that looks like a Timestamp
      expiresAt = new Date(data.expiresAt.seconds * 1000);
    } else {
      expiresAt = new Date(data.expiresAt);
    }

    if (!expiresAt || isNaN(expiresAt.getTime())) return false;

    // Strict Check: Only bundling purchases (365+ days) or specific long-term access allowed
    // Legacy redeem codes (typically 7 days) are now deprecated for these features.
    const duration = data.durationInDays || 0;
    if (duration < 365) {
      console.log(`[formasiAccess] Access denied for user ${userId}. Reason: Legacy/Short-term access (${duration} days). Bundling purchase required.`);
      return false;
    }

    // Check if current time is past expiration
    const now = new Date();
    if (now > expiresAt) {
      console.log(`[formasiAccess] Access expired for user ${userId}. (Now: ${now.toISOString()}, Expires: ${expiresAt.toISOString()})`);
      return false;
    }

    return true; // Valid 365-day bundling access
  } catch (error) {
    console.error('Error checking user formasi access:', error);
    return false;
  }
};

export const validateFormasiCode = async (
  code: string,
  userId: string
): Promise<{ valid: boolean; message: string; codeId?: string; data?: FormasiAccessCode }> => {
  const codesRef = collection(db, COLLECTION_CODES);
  const q = query(codesRef, where('code', '==', code.toUpperCase()));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return { valid: false, message: 'Kode akses tidak ditemukan' };
  }

  const codeDoc = snapshot.docs[0];
  const codeData = codeDoc.data() as FormasiAccessCode;

  if (!codeData.isActive) {
    return { valid: false, message: 'Kode akses sudah tidak aktif' };
  }

  if (codeData.currentUses >= codeData.maxUses) {
    return { valid: false, message: 'Kode akses sudah mencapai batas maksimal penggunaan' };
  }

  if (codeData.usedBy && codeData.usedBy.includes(userId)) {
    return { valid: false, message: 'Anda sudah menggunakan kode akses ini sebelumnya' };
  }

  if (codeData.expiryDate) {
    const expiresAt = codeData.expiryDate instanceof Timestamp 
      ? codeData.expiryDate.toDate() 
      : new Date(codeData.expiryDate);
    if (expiresAt < new Date()) {
      return { valid: false, message: 'Kode akses sudah kadaluarsa' };
    }
  }

  return { valid: true, message: 'Kode valid', codeId: codeDoc.id, data: codeData };
};

/**
 * Grant access to formasi/instansi for a user
 * @param userId User UID
 * @param durationInDays Number of days to grant access (default 7 for codes, 365 for VIP)
 */
export const grantFormasiAccess = async (userId: string, durationInDays: number = 7): Promise<void> => {
  const userAccessRef = doc(db, COLLECTION_USERS, userId);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationInDays * 24 * 60 * 60 * 1000);

  await setDoc(userAccessRef, {
    userId,
    unlockedAt: serverTimestamp(),
    expiresAt,
    durationInDays, // Store duration for reference
  }, { merge: true });
};

/**
 * [ADMIN ONLY] Dapatkan info VIP lengkap seorang user.
 * Mengembalikan null jika user tidak memiliki dokumen akses.
 */
export const getUserVIPInfo = async (userId: string): Promise<{
  isVIP: boolean;
  expiresAt: Date | null;
  durationInDays: number;
  unlockedAt: Date | null;
} | null> => {
  try {
    const userAccessRef = doc(db, COLLECTION_USERS, userId);
    const snap = await getDoc(userAccessRef);

    if (!snap.exists()) {
      return { isVIP: false, expiresAt: null, durationInDays: 0, unlockedAt: null };
    }

    const data = snap.data();
    const duration = data.durationInDays || 0;

    let expiresAt: Date | null = null;
    if (data.expiresAt instanceof Timestamp) {
      expiresAt = data.expiresAt.toDate();
    } else if (data.expiresAt) {
      expiresAt = new Date(data.expiresAt);
    }

    const unlockedAt = data.unlockedAt instanceof Timestamp
      ? data.unlockedAt.toDate()
      : data.unlockedAt ? new Date(data.unlockedAt) : null;

    const isVIP = duration >= 365 && !!expiresAt && expiresAt > new Date();

    return { isVIP, expiresAt, durationInDays: duration, unlockedAt };
  } catch (error) {
    console.error('Error in getUserVIPInfo:', error);
    return null;
  }
};

/**
 * [ADMIN ONLY] Cabut akses VIP seorang user.
 * Menggunakan update (bukan delete) agar audit trail tetap ada.
 * TIDAK menyentuh payment, user_tryouts, atau data user lainnya.
 */
export const revokeFormasiAccess = async (userId: string): Promise<void> => {
  const userAccessRef = doc(db, COLLECTION_USERS, userId);
  // Set durationInDays ke 0 → guard '< 365' otomatis menolak akses
  // Set expiresAt ke masa lalu → guard waktu juga menolak
  await setDoc(userAccessRef, {
    userId,
    durationInDays: 0,
    expiresAt: new Date(0), // 1 Jan 1970 = sudah expired
    revokedAt: serverTimestamp(),
  }, { merge: true });
};

export const useFormasiCode = async (code: string, userId: string): Promise<void> => {
  const validation = await validateFormasiCode(code, userId);
  
  if (!validation.valid || !validation.codeId) {
    throw new Error(validation.message);
  }

  // 1. Update the code usage
  const codeRef = doc(db, COLLECTION_CODES, validation.codeId);
  await updateDoc(codeRef, {
    currentUses: increment(1),
    usedBy: arrayUnion(userId),
  });

  // 2. Grant 7-day access to user
  await grantFormasiAccess(userId, 7);
};

export const getAllFormasiCodes = async (): Promise<FormasiAccessCode[]> => {
  try {
    const codesRef = collection(db, COLLECTION_CODES);
    const snapshot = await getDocs(codesRef);

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiryDate: data.expiryDate?.toDate(),
      };
    }) as FormasiAccessCode[];
  } catch (error) {
    console.error('Error in getAllFormasiCodes:', error);
    throw error;
  }
};

export const updateFormasiCodeStatus = async (
  codeId: string,
  isActive: boolean
): Promise<void> => {
  const codeRef = doc(db, COLLECTION_CODES, codeId);
  await updateDoc(codeRef, { isActive });
};

export const deleteFormasiCode = async (codeId: string): Promise<void> => {
  const codeRef = doc(db, COLLECTION_CODES, codeId);
  await deleteDoc(codeRef);
};

const generateRandomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  // 6 digit code for easy typing
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
