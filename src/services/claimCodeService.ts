import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ClaimCode } from '@/types';

export const generateClaimCode = async (
  tryoutId: string,
  tryoutName: string,
  maxUses: number,
  createdBy: string,
  expiryDate?: Date
): Promise<string> => {
  const code = generateRandomCode();

  const claimCodesRef = collection(db, 'claim_codes');
  const docRef = await addDoc(claimCodesRef, {
    code,
    tryoutId,
    tryoutName,
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

export const validateClaimCode = async (
  code: string,
  userId: string
): Promise<{ valid: boolean; message: string; tryoutId?: string }> => {
  const claimCodesRef = collection(db, 'claim_codes');
  const q = query(claimCodesRef, where('code', '==', code));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return { valid: false, message: 'Kode tidak valid' };
  }

  const claimDoc = snapshot.docs[0];
  const claimData = claimDoc.data() as ClaimCode;

  if (!claimData.isActive) {
    return { valid: false, message: 'Kode sudah tidak aktif' };
  }

  if (claimData.currentUses >= claimData.maxUses) {
    return { valid: false, message: 'Kode sudah mencapai batas penggunaan' };
  }

  if (claimData.usedBy.includes(userId)) {
    return { valid: false, message: 'Anda sudah menggunakan kode ini' };
  }

  if (claimData.expiryDate && claimData.expiryDate.toDate() < new Date()) {
    return { valid: false, message: 'Kode sudah kadaluarsa' };
  }

  return { valid: true, message: 'Kode valid', tryoutId: claimData.tryoutId };
};

export const useClaimCode = async (code: string, userId: string): Promise<void> => {
  const claimCodesRef = collection(db, 'claim_codes');
  const q = query(claimCodesRef, where('code', '==', code));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    console.error('Claim code not found:', code);
    throw new Error('Kode klaim tidak ditemukan');
  }

  const claimDoc = snapshot.docs[0];
  const claimData = claimDoc.data();

  console.log('Current claim code data:', {
    id: claimDoc.id,
    currentUses: claimData.currentUses,
    maxUses: claimData.maxUses,
    usedBy: claimData.usedBy,
  });

  if (claimData.usedBy && claimData.usedBy.includes(userId)) {
    console.error('User already used this code:', userId);
    throw new Error('Anda sudah menggunakan kode ini');
  }

  await updateDoc(doc(db, 'claim_codes', claimDoc.id), {
    currentUses: increment(1),
    usedBy: arrayUnion(userId),
  });

  console.log('Claim code updated successfully for user:', userId);
};

export const getAllClaimCodes = async (): Promise<ClaimCode[]> => {
  try {
    const claimCodesRef = collection(db, 'claim_codes');
    const snapshot = await getDocs(claimCodesRef);

    console.log('Claim codes query result:', snapshot.size, 'documents');

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        expiryDate: data.expiryDate?.toDate(),
      };
    }) as ClaimCode[];
  } catch (error) {
    console.error('Error in getAllClaimCodes:', error);
    throw error;
  }
};

export const updateClaimCodeStatus = async (
  claimCodeId: string,
  isActive: boolean
): Promise<void> => {
  const claimCodeRef = doc(db, 'claim_codes', claimCodeId);
  await updateDoc(claimCodeRef, { isActive });
};

export const deleteClaimCode = async (claimCodeId: string): Promise<void> => {
  const claimCodeRef = doc(db, 'claim_codes', claimCodeId);
  await deleteDoc(claimCodeRef);
};

const generateRandomCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};
