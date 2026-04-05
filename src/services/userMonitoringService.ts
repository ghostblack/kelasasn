import { collection, getDocs, query, where, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, TryoutSession, TryoutResult } from '@/types';

export interface UserMonitoringData {
  user: UserProfile;
  totalTryouts: number;
  completedTryouts: number;
  inProgressTryouts: number;
  lastActivity?: Date;
  isVIP: boolean;
  vipExpiry?: Date;
  accessibleTryouts: string[];
  tryoutSessions: Array<{
    id: string;
    tryoutId: string;
    tryoutName: string;
    status: string;
    startTime: Date;
    completedAt?: Date;
  }>;
}

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    console.log('Total users fetched:', snapshot.size);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email || '',
        displayName: data.displayName || 'Unknown',
        username: data.username,
        photoURL: data.photoURL,
        phoneNumber: data.phoneNumber,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserProfile;
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const getUserTryoutSessions = async (userId: string): Promise<TryoutSession[]> => {
  try {
    const sessionsRef = collection(db, 'tryout_sessions');
    const q = query(sessionsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startTime: data.startTime?.toDate() || new Date(),
        endTime: data.endTime?.toDate(),
      } as TryoutSession;
    }).sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  } catch (error) {
    console.error('Error fetching user sessions:', error);
    return [];
  }
};

export const getUserTryoutResults = async (userId: string): Promise<TryoutResult[]> => {
  try {
    const resultsRef = collection(db, 'tryout_results');
    const q = query(resultsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        completedAt: data.completedAt?.toDate() || new Date(),
      } as TryoutResult;
    }).sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  } catch (error) {
    console.error('Error fetching user results:', error);
    return [];
  }
};

export const getUserAccessibleTryouts = async (userId: string): Promise<string[]> => {
  try {
    const userTryoutsRef = collection(db, 'user_tryouts');
    const q = query(userTryoutsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => doc.data().tryoutId);
  } catch (error) {
    console.error('Error fetching user accessible tryouts:', error);
    return [];
  }
};

export const getAllUsersWithActivity = async (): Promise<UserMonitoringData[]> => {
  try {
    console.log('Starting to fetch all users (Optimized)...');
    const users = await getAllUsers();
    console.log('Users fetched:', users.length);

    if (users.length === 0) {
      return [];
    }

    // Fetch all formasi access once
    const formasiAccessRef = collection(db, 'user_formasi_access');
    const formasiSnap = await getDocs(formasiAccessRef);
    const vipMap = new Map<string, Date>();
    
    formasiSnap.docs.forEach(doc => {
      const data = doc.data();
      const duration = data.durationInDays || 0;
      const expiresAt = data.expiresAt instanceof Timestamp 
        ? data.expiresAt.toDate() 
        : data.expiresAt ? new Date(data.expiresAt) : null;

      if (duration >= 365 && expiresAt && expiresAt > new Date()) {
        vipMap.set(doc.id, expiresAt);
      }
    });

    const usersWithActivity = users.map(user => {
      const vipExpiry = vipMap.get(user.uid);
      const isVIP = !!vipExpiry;

      return {
        user,
        // The following fields are set to empty/zero to save reads.
        // They will be populated on-demand when an admin clicks "View Details".
        totalTryouts: 0,
        completedTryouts: 0,
        inProgressTryouts: 0,
        lastActivity: user.createdAt,
        isVIP,
        vipExpiry,
        accessibleTryouts: [],
        tryoutSessions: [],
      };
    });

    console.log('Users mapped successfully:', usersWithActivity.length);
    return usersWithActivity;
  } catch (error) {
    console.error('Error in getAllUsersWithActivity (Optimized):', error);
    throw error;
  }
};

export const userMonitoringService = {
  getAllUsers,
  getUserTryoutSessions,
  getUserTryoutResults,
  getUserAccessibleTryouts,
  getAllUsersWithActivity,
};
