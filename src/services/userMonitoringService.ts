import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, TryoutSession, TryoutResult } from '@/types';

export interface UserMonitoringData {
  user: UserProfile;
  totalTryouts: number;
  completedTryouts: number;
  inProgressTryouts: number;
  lastActivity?: Date;
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
    console.log('Starting to fetch all users with activity...');
    const users = await getAllUsers();
    console.log('Users fetched:', users.length);

    if (users.length === 0) {
      console.log('No users found in database');
      return [];
    }

    const tryoutsRef = collection(db, 'tryout_packages');
    const tryoutsSnapshot = await getDocs(tryoutsRef);
    const tryoutsMap = new Map();
    tryoutsSnapshot.docs.forEach(doc => {
      tryoutsMap.set(doc.id, doc.data().name);
    });

    const usersWithActivity = await Promise.all(
      users.map(async (user) => {
        try {
          const [sessions, results, accessibleIds] = await Promise.all([
            getUserTryoutSessions(user.uid),
            getUserTryoutResults(user.uid),
            getUserAccessibleTryouts(user.uid)
          ]);

          const inProgressSessions = sessions.filter(s => s.status === 'active' || s.status === 'paused');
          
          const accessibleTryouts = accessibleIds.map(id => tryoutsMap.get(id) || 'Unknown Tryout');

          const lastActivity = sessions.length > 0
            ? sessions[0].startTime
            : results.length > 0
            ? results[0].completedAt
            : undefined;

          const tryoutSessions = results.map(result => ({
            id: result.id,
            tryoutId: result.tryoutId,
            tryoutName: result.tryoutName || tryoutsMap.get(result.tryoutId) || 'Unknown Tryout',
            status: 'completed',
            startTime: result.completedAt,
            completedAt: result.completedAt,
          }));

          return {
            user,
            totalTryouts: results.length,
            completedTryouts: results.length,
            inProgressTryouts: inProgressSessions.length,
            lastActivity,
            accessibleTryouts,
            tryoutSessions,
          };
        } catch (error) {
          console.error(`Error fetching activity for user ${user.uid}:`, error);
          return {
            user,
            totalTryouts: 0,
            completedTryouts: 0,
            inProgressTryouts: 0,
            lastActivity: undefined,
            accessibleTryouts: [],
            tryoutSessions: [],
          };
        }
      })
    );

    console.log('Users with activity processed:', usersWithActivity.length);
    return usersWithActivity;
  } catch (error) {
    console.error('Error in getAllUsersWithActivity:', error);
    throw error;
  }
};

export const userMonitoringService = {
  getAllUsers,
  getUserTryoutSessions,
  getUserTryoutResults,
  getAllUsersWithActivity,
};
