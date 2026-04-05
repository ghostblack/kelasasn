import { collection, query, where, getDocs, doc, getDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface RankingEntry {
  id: string;
  userId: string;
  tryoutId: string;
  tryoutName: string;
  totalScore: number;
  completedAt: Date;
  rank: number;
  userName?: string;
  userEmail?: string;
}

export const getRankingByTryout = async (
  tryoutId?: string,
  limitCount: number = 100
): Promise<RankingEntry[]> => {
  try {
    // Hidden logs for security

    const resultsRef = collection(db, 'tryout_results');
    let q;

    if (tryoutId && tryoutId !== 'all') {
      q = query(
        resultsRef,
        where('tryoutId', '==', tryoutId)
      );
    } else {
      q = query(resultsRef);
    }

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return [];
    }

    const resultsWithUserData = await Promise.all(
      snapshot.docs.map(async (resultDoc) => {
        const data = resultDoc.data();

        let userEmail = 'Unknown';
        let userName = 'Unknown';
        let tryoutName = data.tryoutName || 'Tryout';

        try {
          const userDocRef = doc(db, 'users', data.userId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userEmail = userData.email || userEmail;
            userName = userData.displayName || userData.name || userEmail.split('@')[0];
          }
        } catch (err) {
          console.error('Error fetching user data for userId:', data.userId, err);
        }

        if (!data.tryoutName && data.tryoutId) {
          try {
            const tryoutDocRef = doc(db, 'tryouts', data.tryoutId);
            const tryoutDoc = await getDoc(tryoutDocRef);
            if (tryoutDoc.exists()) {
              tryoutName = tryoutDoc.data().name || tryoutName;
            }
          } catch (err) {
            console.error('Error fetching tryout data for tryoutId:', data.tryoutId, err);
          }
        }

        return {
          id: resultDoc.id,
          userId: data.userId,
          tryoutId: data.tryoutId,
          tryoutName: tryoutName,
          totalScore: data.totalScore || 0,
          completedAt: data.completedAt?.toDate() || new Date(),
          rank: 0,
          userEmail,
          userName,
        } as RankingEntry;
      })
    );

    const validResults = resultsWithUserData.filter(r => {
      const score = Number(r.totalScore || 0);
      return score <= 550 && score >= 0;
    });

    const userBestScores = new Map<string, typeof validResults[0]>();

    validResults.forEach(result => {
      const key = tryoutId && tryoutId !== 'all' ? `${result.userId}-${result.tryoutId}` : result.userId;
      const existing = userBestScores.get(key);

      const currentScore = Number(result.totalScore || 0);
      const existingScore = existing ? Number(existing.totalScore || 0) : -1;

      if (!existing || currentScore > existingScore ||
          (currentScore === existingScore &&
           result.completedAt.getTime() < existing.completedAt.getTime())) {
        userBestScores.set(key, result);
      }
    });

    const bestResults = Array.from(userBestScores.values());

    bestResults.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return a.completedAt.getTime() - b.completedAt.getTime();
    });

    const rankedResults = bestResults
      .slice(0, limitCount)
      .map((result, index) => ({
        ...result,
        rank: index + 1,
      }));

    return rankedResults;
  } catch (error) {
    console.error('Error in getRankingByTryout:', error);
    return [];
  }
};

export const getUserRankInTryout = async (
  userId: string,
  tryoutId: string
): Promise<number> => {
  try {
    const resultsRef = collection(db, 'tryout_results');
    const q = query(
      resultsRef,
      where('tryoutId', '==', tryoutId)
    );

    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      userId: doc.data().userId,
      totalScore: doc.data().totalScore || 0,
      completedAt: doc.data().completedAt?.toDate() || new Date(),
    }));

    const userBestScores = new Map<string, typeof results[0]>();

    results.forEach(result => {
      const existing = userBestScores.get(result.userId);
      if (!existing || result.totalScore > existing.totalScore ||
          (result.totalScore === existing.totalScore &&
           result.completedAt.getTime() < existing.completedAt.getTime())) {
        userBestScores.set(result.userId, result);
      }
    });

    const bestResults = Array.from(userBestScores.values());

    bestResults.sort((a, b) => {
      if (b.totalScore !== a.totalScore) {
        return b.totalScore - a.totalScore;
      }
      return a.completedAt.getTime() - b.completedAt.getTime();
    });

    const userResultIndex = bestResults.findIndex(r => r.userId === userId);
    return userResultIndex >= 0 ? userResultIndex + 1 : 0;
  } catch (error) {
    console.error('Error in getUserRankInTryout:', error);
    return 0;
  }
};

export const deleteAllRankings = async (tryoutId?: string): Promise<void> => {
  try {
    console.log('=== deleteAllRankings called ===');
    console.log('tryoutId:', tryoutId || 'all');

    const resultsRef = collection(db, 'tryout_results');
    let q;

    if (tryoutId && tryoutId !== 'all') {
      console.log('Deleting rankings for specific tryout:', tryoutId);
      q = query(resultsRef, where('tryoutId', '==', tryoutId));
    } else {
      console.log('Deleting all rankings');
      q = query(resultsRef);
    }

    const snapshot = await getDocs(q);
    console.log('Found', snapshot.size, 'documents to delete');

    if (snapshot.empty) {
      console.log('No rankings to delete');
      return;
    }

    const batchSize = 500;
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;

    snapshot.docs.forEach((document) => {
      currentBatch.delete(document.ref);
      operationCount++;

      if (operationCount === batchSize) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    });

    if (operationCount > 0) {
      batches.push(currentBatch);
    }

    console.log('Executing', batches.length, 'batch(es)');
    await Promise.all(batches.map(batch => batch.commit()));

    console.log('✓ Successfully deleted', snapshot.size, 'ranking(s)');
    console.log('=== deleteAllRankings completed ===');
  } catch (error) {
    console.error('Error deleting rankings:', error);
    throw error;
  }
};
