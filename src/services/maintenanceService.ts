import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface MaintenanceStatus {
  isActive: boolean;
  message: string;
  updatedAt?: Date;
  updatedBy?: string;
}

const MAINTENANCE_DOC = doc(db, 'settings', 'maintenance');

export const getMaintenanceStatus = async (): Promise<MaintenanceStatus> => {
  try {
    const snap = await getDoc(MAINTENANCE_DOC);
    if (snap.exists()) {
      const data = snap.data();
      return {
        isActive: data.isActive ?? false,
        message: data.message ?? 'Sedang ada pemeliharaan sistem. Silakan coba lagi nanti.',
        updatedAt: data.updatedAt?.toDate(),
        updatedBy: data.updatedBy,
      };
    }
    return { isActive: false, message: '' };
  } catch (error) {
    console.error('Error getting maintenance status:', error);
    return { isActive: false, message: '' };
  }
};

export const setMaintenanceStatus = async (
  isActive: boolean,
  message: string,
  adminUid: string
): Promise<void> => {
  await setDoc(MAINTENANCE_DOC, {
    isActive,
    message,
    updatedAt: serverTimestamp(),
    updatedBy: adminUid,
  }, { merge: true });
};

export const onMaintenanceStatusChange = (
  callback: (status: MaintenanceStatus) => void
) => {
  return onSnapshot(MAINTENANCE_DOC, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      callback({
        isActive: data.isActive ?? false,
        message: data.message ?? 'Sedang ada pemeliharaan sistem. Silakan coba lagi nanti.',
        updatedAt: data.updatedAt?.toDate(),
        updatedBy: data.updatedBy,
      });
    } else {
      callback({ isActive: false, message: '' });
    }
  });
};
