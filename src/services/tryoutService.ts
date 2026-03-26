import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TryoutPackage, UserTryout, TryoutResult, UserStats } from '@/types';

export interface TryoutFeedback {
  id?: string;
  userId: string;
  userName: string;
  tryoutId: string;
  tryoutName: string;
  whatIsGood: string;
  whatIsMissing: string;
  createdAt: any;
}

export const getAllTryouts = async (): Promise<TryoutPackage[]> => {
  try {
    const tryoutsRef = collection(db, 'tryout_packages');
    const snapshot = await getDocs(tryoutsRef);

    console.log('Firebase query result:', snapshot.size, 'documents');

    const tryouts = snapshot.docs.map(doc => {
      const data = doc.data();
      console.log('Tryout document:', doc.id, data);
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    }) as TryoutPackage[];

    const sortedTryouts = tryouts.sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    return sortedTryouts;
  } catch (error) {
    console.error('Error in getAllTryouts:', error);
    throw error;
  }
};

export const getTryoutById = async (tryoutId: string): Promise<TryoutPackage | null> => {
  const tryoutRef = doc(db, 'tryout_packages', tryoutId);
  const tryoutSnap = await getDoc(tryoutRef);

  if (tryoutSnap.exists()) {
    return {
      id: tryoutSnap.id,
      ...tryoutSnap.data(),
      createdAt: tryoutSnap.data().createdAt?.toDate() || new Date(),
    } as TryoutPackage;
  }

  return null;
};

export const getUserTryouts = async (userId: string): Promise<UserTryout[]> => {
  const userTryoutsRef = collection(db, 'user_tryouts');
  const q = query(
    userTryoutsRef,
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);

  console.log(`Found ${snapshot.size} tryouts for user ${userId}`);

  const tryouts = snapshot.docs.map(doc => {
    const data = doc.data();
    console.log('User tryout document:', doc.id, data);
    return {
      id: doc.id,
      ...data,
      purchaseDate: data.purchaseDate?.toDate() || new Date(),
      completedAt: data.completedAt?.toDate(),
    };
  }) as UserTryout[];

  const validTryouts: UserTryout[] = [];

  for (const tryout of tryouts) {
    const tryoutPackage = await getTryoutById(tryout.tryoutId);
    if (tryoutPackage && tryoutPackage.isActive) {
      validTryouts.push(tryout);
    }
  }

  console.log(`Returning ${validTryouts.length} valid tryouts`);
  return validTryouts.sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime());
};

export const purchaseTryout = async (
  userId: string,
  tryoutId: string,
  tryoutName: string
): Promise<string> => {
  const userTryoutsRef = collection(db, 'user_tryouts');

  console.log('Checking if tryout already purchased...', { userId, tryoutId });

  const tryoutData = await getTryoutById(tryoutId);
  const isBundle = tryoutData?.isBundle || false;

  const q = query(
    userTryoutsRef,
    where('userId', '==', userId),
    where('tryoutId', '==', tryoutId)
  );
  const existingSnapshot = await getDocs(q);

  if (!existingSnapshot.empty) {
    console.log('Tryout already purchased, returning existing record:', existingSnapshot.docs[0].id);
    return existingSnapshot.docs[0].id;
  }

  console.log('Creating new user_tryout document...');
  const docRef = await addDoc(userTryoutsRef, {
    userId,
    tryoutId,
    tryoutName,
    purchaseDate: serverTimestamp(),
    status: isBundle ? 'completed' : 'not_started',
    paymentStatus: 'success',
    transactionId: `TRX-${Date.now()}`,
    attempts: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  if (isBundle && tryoutData?.includedTryoutIds) {
    console.log('Tryout is a bundle, adding included tryouts...', tryoutData.includedTryoutIds);
    for (const incId of tryoutData.includedTryoutIds) {
      const incData = await getTryoutById(incId);
      if (incData) {
        const incQ = query(userTryoutsRef, where('userId', '==', userId), where('tryoutId', '==', incId));
        const incExisting = await getDocs(incQ);
        if (incExisting.empty) {
          await addDoc(userTryoutsRef, {
            userId,
            tryoutId: incId,
            tryoutName: incData.name,
            purchaseDate: serverTimestamp(),
            status: 'not_started',
            paymentStatus: 'success',
            transactionId: `TRX-${Date.now()}-BNDL`,
            bundleId: tryoutId,
            attempts: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }
    }
  }

  console.log('Tryout purchased successfully, document ID:', docRef.id);

  await new Promise(resolve => setTimeout(resolve, 300));

  const verifySnapshot = await getDoc(docRef);
  if (!verifySnapshot.exists()) {
    console.error('Failed to verify created document');
    throw new Error('Gagal memverifikasi pembelian tryout');
  }

  console.log('Purchase verified successfully');


  return docRef.id;
};

export const resetTryoutAttempt = async (
  userTryoutId: string
): Promise<void> => {
  const userTryoutRef = doc(db, 'user_tryouts', userTryoutId);
  const userTryoutSnap = await getDoc(userTryoutRef);

  if (!userTryoutSnap.exists()) {
    throw new Error('User tryout not found');
  }

  const currentAttempts = userTryoutSnap.data().attempts || 0;

  await updateDoc(userTryoutRef, {
    status: 'not_started',
    attempts: currentAttempts,
    lastAttemptAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getUserResults = async (userId: string): Promise<TryoutResult[]> => {
  const resultsRef = collection(db, 'tryout_results');
  const q = query(
    resultsRef,
    where('userId', '==', userId)
  );
  const snapshot = await getDocs(q);

  const results = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    attemptNumber: doc.data().attemptNumber || 1,
    completedAt: doc.data().completedAt?.toDate() || new Date(),
  })) as TryoutResult[];

  return results.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
};

export const getUserResultsByTryout = async (
  userId: string,
  tryoutId: string
): Promise<TryoutResult[]> => {
  const resultsRef = collection(db, 'tryout_results');
  const q = query(
    resultsRef,
    where('userId', '==', userId),
    where('tryoutId', '==', tryoutId)
  );
  const snapshot = await getDocs(q);

  const results = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    attemptNumber: doc.data().attemptNumber || 1,
    completedAt: doc.data().completedAt?.toDate() || new Date(),
  })) as TryoutResult[];

  return results.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
};

export const getUserStats = async (userId: string): Promise<UserStats> => {
  const results = await getUserResults(userId);
  const tryouts = await getUserTryouts(userId);

  if (results.length === 0) {
    return {
      totalTryouts: tryouts.length,
      highestScore: 0,
      averageScore: 0,
      bestRank: 0,
    };
  }

  const ranks = results.map(r => r.rank).filter(r => r > 0);

  let highestScore = 0;
  let highestMaxScore = 1;
  let totalWeightedScore = 0;
  let totalMaxScore = 0;

  results.forEach(r => {
    const maxScore = r.maxTotalScore || 550;
    const scorePercentage = (r.totalScore / maxScore) * 100;

    if (scorePercentage > (highestScore / highestMaxScore) * 100) {
      highestScore = r.totalScore;
      highestMaxScore = maxScore;
    }

    totalWeightedScore += r.totalScore;
    totalMaxScore += maxScore;
  });

  return {
    totalTryouts: tryouts.length,
    highestScore: Math.round(highestScore),
    averageScore: Math.round(totalWeightedScore / results.length),
    bestRank: ranks.length > 0 ? Math.min(...ranks) : 0,
  };
};

export const toggleTryoutStatus = async (tryoutId: string): Promise<void> => {
  const tryoutRef = doc(db, 'tryout_packages', tryoutId);
  const tryoutSnap = await getDoc(tryoutRef);

  if (!tryoutSnap.exists()) {
    throw new Error('Tryout tidak ditemukan');
  }

  const currentStatus = tryoutSnap.data().isActive;

  await updateDoc(tryoutRef, {
    isActive: !currentStatus,
    updatedAt: serverTimestamp(),
  });
};

export const submitTryoutFeedback = async (feedback: Omit<TryoutFeedback, 'id' | 'createdAt'>): Promise<void> => {
  try {
    const feedbacksRef = collection(db, 'tryout_feedbacks');
    await addDoc(feedbacksRef, {
      ...feedback,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error in submitTryoutFeedback:', error);
    throw error;
  }
};

export const getAllFeedbacks = async (): Promise<TryoutFeedback[]> => {
  try {
    const feedbacksRef = collection(db, 'tryout_feedbacks');
    const q = query(feedbacksRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as TryoutFeedback[];
  } catch (error) {
    console.error('Error in getAllFeedbacks:', error);
    throw error;
  }
};
