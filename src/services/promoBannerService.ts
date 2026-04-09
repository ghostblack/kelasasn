import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type BannerLinkTarget = 'tryouts_page' | 'tryout_detail' | 'none';

export interface PromoBanner {
  isActive: boolean;
  imageUrl: string;
  title?: string;
  /** Ke mana user diarahkan saat klik banner */
  linkTarget?: BannerLinkTarget;
  /** ID tryout yang dituju (hanya dipakai jika linkTarget === 'tryout_detail') */
  linkTryoutId?: string;
  /** Nama tampilan tryout yang dipilih (untuk label di admin, tidak disimpan di Firestore) */
  linkTryoutName?: string;
  updatedAt?: Date;
  updatedBy?: string;
}

const PROMO_DOC = doc(db, 'settings', 'promo_banner');

export const getPromoBanner = async (): Promise<PromoBanner> => {
  try {
    const snap = await getDoc(PROMO_DOC);
    if (snap.exists()) {
      const data = snap.data();
      return {
        isActive: data.isActive ?? false,
        imageUrl: data.imageUrl ?? '',
        title: data.title ?? '',
        linkTarget: data.linkTarget ?? 'none',
        linkTryoutId: data.linkTryoutId ?? '',
        updatedAt: data.updatedAt?.toDate(),
        updatedBy: data.updatedBy,
      };
    }
    return { isActive: false, imageUrl: '', linkTarget: 'none' };
  } catch (error) {
    console.error('Error getting promo banner:', error);
    return { isActive: false, imageUrl: '', linkTarget: 'none' };
  }
};

export const setPromoBanner = async (
  data: Omit<PromoBanner, 'updatedAt' | 'linkTryoutName'>,
  adminUid: string
): Promise<void> => {
  await setDoc(
    PROMO_DOC,
    { ...data, updatedAt: serverTimestamp(), updatedBy: adminUid },
    { merge: true }
  );
};

export const onPromoBannerChange = (callback: (banner: PromoBanner) => void) => {
  return onSnapshot(PROMO_DOC, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      callback({
        isActive: data.isActive ?? false,
        imageUrl: data.imageUrl ?? '',
        title: data.title ?? '',
        linkTarget: data.linkTarget ?? 'none',
        linkTryoutId: data.linkTryoutId ?? '',
        updatedAt: data.updatedAt?.toDate(),
        updatedBy: data.updatedBy,
      });
    } else {
      callback({ isActive: false, imageUrl: '', linkTarget: 'none' });
    }
  });
};
