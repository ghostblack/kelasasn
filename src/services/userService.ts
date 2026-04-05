import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, deleteDoc, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/types';

export const createUserProfile = async (
  userId: string,
  email: string,
  displayName: string,
  phoneNumber?: string
): Promise<void> => {
  const userRef = doc(db, 'users', userId);

  const baseUsername = displayName || email.split('@')[0] || 'user';
  const cleanUsername = baseUsername.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
  let username = cleanUsername;
  let counter = 1;

  while (!(await checkUsernameAvailability(username))) {
    username = `${cleanUsername}${counter}`;
    counter++;
  }

  const userData: any = {
    uid: userId,
    email,
    displayName: displayName || email.split('@')[0],
    username,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (phoneNumber) {
    userData.phoneNumber = phoneNumber;
  }

  await setDoc(userRef, userData);
};

export const createMinimalUserProfile = async (
  userId: string,
  email: string
): Promise<void> => {
  const userRef = doc(db, 'users', userId);

  await setDoc(userRef, {
    uid: userId,
    email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as UserProfile;
  }

  return null;
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>): Promise<void> => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const getUserData = async (userId: string): Promise<UserProfile | null> => {
  return getUserProfile(userId);
};

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username), limit(1));
  const querySnapshot = await getDocs(q);

  return querySnapshot.empty;
};

export const updateUsername = async (userId: string, username: string): Promise<void> => {
  const userRef = doc(db, 'users', userId);

  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  await updateDoc(userRef, {
    username,
    updatedAt: serverTimestamp(),
  });
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    // 1. Clean up associated data
    const sessionsRef = collection(db, 'tryout_sessions');
    const sessionsQ = query(sessionsRef, where('userId', '==', userId));
    const sessionsSnap = await getDocs(sessionsQ);
    
    const resultsRef = collection(db, 'tryout_results');
    const resultsQ = query(resultsRef, where('userId', '==', userId));
    const resultsSnap = await getDocs(resultsQ);

    const userTryoutsRef = collection(db, 'user_tryouts');
    const userTryoutsQ = query(userTryoutsRef, where('userId', '==', userId));
    const userTryoutsSnap = await getDocs(userTryoutsQ);

    const paymentsRef = collection(db, 'payment_transactions');
    const paymentsQ = query(paymentsRef, where('userId', '==', userId));
    const paymentsSnap = await getDocs(paymentsQ);

    // Delete all associated data
    const deletePromises = [
      ...sessionsSnap.docs.map(d => deleteDoc(d.ref)),
      ...resultsSnap.docs.map(d => deleteDoc(d.ref)),
      ...userTryoutsSnap.docs.map(d => deleteDoc(d.ref)),
      ...paymentsSnap.docs.map(d => deleteDoc(d.ref)),
      deleteDoc(doc(db, 'users', userId))
    ];

    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const userService = {
  createUserProfile,
  createMinimalUserProfile,
  getUserProfile,
  updateUserProfile,
  getUserData,
  checkUsernameAvailability,
  updateUsername,
  deleteUser,
};
