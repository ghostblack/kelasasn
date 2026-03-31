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

    // Check if current time is past expiration
    if (new Date() > expiresAt) {
      return false;
    }

    return true; // Valid access
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
