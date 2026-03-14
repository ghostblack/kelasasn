import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface LandingStats {
  totalUsers: number;
  totalParticipants: number;
}

export const getLandingStats = async (): Promise<LandingStats> => {
  try {
    const [usersSnapshot, resultsSnapshot] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'tryout_results')),
    ]);

    return {
      totalUsers: usersSnapshot.size,
      totalParticipants: resultsSnapshot.size,
    };
  } catch (error) {
    console.error('Error fetching landing stats:', error);
    return {
      totalUsers: 0,
      totalParticipants: 0,
    };
  }
};

export const landingService = {
  getLandingStats,
};
