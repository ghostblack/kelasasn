import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TryoutSession, TryoutResult } from '@/types';

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const shuffleQuestionsByCategory = async (questionIds: string[]): Promise<string[]> => {
  const BATCH_SIZE = 10;
  const questionsMap = new Map<string, string>(); // id -> category

  for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
    const batch = questionIds.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(id => {
      const questionRef = doc(db, 'questions', id);
      return getDoc(questionRef);
    });

    const snapshots = await Promise.all(batchPromises);
    snapshots.forEach((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        questionsMap.set(snap.id, data.category || 'OTHERS');
      } else {
        questionsMap.set(snap.id, 'NOT_FOUND');
      }
    });
  }

  const twkQuestions: string[] = [];
  const tiuQuestions: string[] = [];
  const tkpQuestions: string[] = [];
  const otherQuestions: string[] = [];

  questionIds.forEach(id => {
    const rawCategory = questionsMap.get(id) || '';
    const category = rawCategory.toUpperCase().trim();
    if (category === 'TWK') {
      twkQuestions.push(id);
    } else if (category === 'TIU') {
      tiuQuestions.push(id);
    } else if (category === 'TKP') {
      tkpQuestions.push(id);
    } else {
      otherQuestions.push(id);
    }
  });

  const shuffledTwk = shuffleArray(twkQuestions);
  const shuffledTiu = shuffleArray(tiuQuestions);
  const shuffledTkp = shuffleArray(tkpQuestions);
  const shuffledOthers = shuffleArray(otherQuestions);

  return [...shuffledTwk, ...shuffledTiu, ...shuffledTkp, ...shuffledOthers];
};

export const createTryoutSession = async (
  userId: string,
  userTryoutId: string,
  tryoutId: string,
  totalDuration: number,
  questionIds: string[]
): Promise<string> => {
  const shuffledQuestionIds = await shuffleQuestionsByCategory(questionIds);

  const sessionsRef = collection(db, 'tryout_sessions');
  const docRef = await addDoc(sessionsRef, {
    userId,
    userTryoutId,
    tryoutId,
    startTime: serverTimestamp(),
    currentQuestion: 0,
    answers: {},
    twkAnswers: {},
    tiuAnswers: {},
    tkpAnswers: {},
    status: 'active',
    totalTimeLeft: totalDuration * 60,
    shuffledQuestionIds,
  });

  const userTryoutRef = doc(db, 'user_tryouts', userTryoutId);
  await updateDoc(userTryoutRef, {
    status: 'in_progress',
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

export const getTryoutSession = async (sessionId: string): Promise<TryoutSession | null> => {
  const sessionRef = doc(db, 'tryout_sessions', sessionId);
  const sessionSnap = await getDoc(sessionRef);

  if (sessionSnap.exists()) {
    const data = sessionSnap.data();
    return {
      id: sessionSnap.id,
      ...data,
      startTime: data.startTime?.toDate() || new Date(),
      endTime: data.endTime?.toDate(),
    } as TryoutSession;
  }

  return null;
};

export const getActiveTryoutSession = async (
  userId: string,
  tryoutId: string
): Promise<TryoutSession | null> => {
  const sessionsRef = collection(db, 'tryout_sessions');
  const q = query(
    sessionsRef,
    where('userId', '==', userId),
    where('tryoutId', '==', tryoutId),
    where('status', '==', 'active')
  );
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      startTime: data.startTime?.toDate() || new Date(),
      endTime: data.endTime?.toDate(),
    } as TryoutSession;
  }

  return null;
};

export const updateTryoutSession = async (
  sessionId: string,
  updates: Partial<TryoutSession>
): Promise<void> => {
  const sessionRef = doc(db, 'tryout_sessions', sessionId);
  await updateDoc(sessionRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
};

export const saveAnswer = async (
  sessionId: string,
  questionId: string,
  answer: string,
  category: 'TWK' | 'TIU' | 'TKP',
  currentAnswers: Record<string, string>,
  timeLeft?: number
): Promise<void> => {
  const sessionRef = doc(db, 'tryout_sessions', sessionId);

  const answers = { ...currentAnswers, [questionId]: answer };
  const categoryKey = `${category.toLowerCase()}Answers.${questionId}`;

  const updates: any = {
    [`answers.${questionId}`]: answer,
    [categoryKey]: answer,
    updatedAt: serverTimestamp(),
  };

  if (timeLeft !== undefined) {
    updates.totalTimeLeft = timeLeft;
  }

  await updateDoc(sessionRef, updates);
};

export const completeTryoutSession = async (
  sessionId: string,
  userId: string,
  tryoutId: string,
  tryoutName: string,
  answers: Record<string, string>,
  scores: {
    twkScore: number;
    tiuScore: number;
    tkpScore: number;
    twkCorrect: number;
    tiuCorrect: number;
    tkpCorrect: number;
    twkTotal: number;
    tiuTotal: number;
    tkpTotal: number;
    maxTwkScore: number;
    maxTiuScore: number;
    maxTkpScore: number;
  },
  passingGrades?: {
    passingGradeTWK: number;
    passingGradeTIU: number;
    passingGradeTKP: number;
  }
): Promise<string> => {
  try {
    const totalScore = Number(scores.twkScore || 0) + Number(scores.tiuScore || 0) + Number(scores.tkpScore || 0);
    const maxTotalScore = Number(scores.maxTwkScore || 0) + Number(scores.maxTiuScore || 0) + Number(scores.maxTkpScore || 0);

    let attemptNumber = 1;
    let rank = 0;
    let totalParticipants = 0;

    const session = await getTryoutSession(sessionId);

    if (session) {
      const userTryoutRef = doc(db, 'user_tryouts', session.userTryoutId);
      const userTryoutSnap = await getDoc(userTryoutRef);

      if (userTryoutSnap.exists()) {
        const currentAttempts = userTryoutSnap.data().attempts || 0;
        attemptNumber = currentAttempts + 1;
      }
    }

    try {
      let isVIP = false;
      const userAccessSnap = await getDoc(doc(db, 'user_formasi_access', userId));
      if (userAccessSnap.exists()) {
        const accessData = userAccessSnap.data();
        const duration = accessData.durationInDays || 0;
        const expiresAt = accessData.expiresAt?.toDate ? accessData.expiresAt.toDate() : (accessData.expiresAt ? new Date(accessData.expiresAt) : null);
        if (duration >= 365 && expiresAt && expiresAt > new Date()) {
          isVIP = true;
        }
      }

      if (isVIP) {
        const resultsRef = collection(db, 'tryout_results');
        const allResults = await getDocs(query(resultsRef, where('tryoutId', '==', tryoutId)));

        const userBestScores = new Map<string, number>();
        allResults.docs.forEach(doc => {
          const data = doc.data();
          const uid = data.userId;
          const score = data.totalScore || 0;
          const currentBest = userBestScores.get(uid) || 0;
          if (score > currentBest) {
            userBestScores.set(uid, score);
          }
        });

        const existingBest = userBestScores.get(userId) || 0;
        if (totalScore > existingBest) {
          userBestScores.set(userId, totalScore);
        }

        const allScores = Array.from(userBestScores.values()).sort((a, b) => b - a);
        rank = allScores.findIndex(score => score <= totalScore) + 1;
        if (rank === 0) rank = allScores.length + 1;
        totalParticipants = userBestScores.size;
      } else {
        rank = 0;
        totalParticipants = 0;
      }
    } catch (rankError) {
      console.error('Error calculating rank, using defaults:', rankError);
      rank = 1;
      totalParticipants = 1;
    }

    let passedTWK = true;
    let passedTIU = true;
    let passedTKP = true;
    let isPassed = true;

    if (passingGrades) {
      passedTWK = scores.twkScore >= passingGrades.passingGradeTWK;
      passedTIU = scores.tiuScore >= passingGrades.passingGradeTIU;
      passedTKP = scores.tkpScore >= passingGrades.passingGradeTKP;
      isPassed = passedTWK && passedTIU && passedTKP;
    }

    const resultsRef = collection(db, 'tryout_results');

    const resultData = {
      userId,
      tryoutId,
      tryoutName,
      totalScore,
      maxTotalScore,
      twkScore: scores.twkScore,
      tiuScore: scores.tiuScore,
      tkpScore: scores.tkpScore,
      maxTwkScore: scores.maxTwkScore,
      maxTiuScore: scores.maxTiuScore,
      maxTkpScore: scores.maxTkpScore,
      twkCorrect: scores.twkCorrect,
      tiuCorrect: scores.tiuCorrect,
      tkpCorrect: scores.tkpCorrect,
      twkTotal: scores.twkTotal,
      tiuTotal: scores.tiuTotal,
      tkpTotal: scores.tkpTotal,
      isPassed,
      passedTWK,
      passedTIU,
      passedTKP,
      rank,
      totalParticipants,
      answers,
      attemptNumber,
      shuffledQuestionIds: session?.shuffledQuestionIds || [],
      completedAt: serverTimestamp(),
    };

    const docRef = await addDoc(resultsRef, resultData);

    const sessionRef = doc(db, 'tryout_sessions', sessionId);
    await updateDoc(sessionRef, {
      status: 'completed',
      endTime: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    console.log('✓ Session status updated to completed');

    if (session) {
      const userTryoutRef = doc(db, 'user_tryouts', session.userTryoutId);
      await updateDoc(userTryoutRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        attempts: attemptNumber,
      });
      console.log('✓ User tryout status updated');
    }

    console.log('=== completeTryoutSession finished successfully ===');
    return docRef.id;
  } catch (error) {
    console.error('Error in completeTryoutSession:', error);
    throw error;
  }
};

export const getTryoutResult = async (resultId: string): Promise<TryoutResult | null> => {
  const resultRef = doc(db, 'tryout_results', resultId);
  const resultSnap = await getDoc(resultRef);

  if (resultSnap.exists()) {
    const data = resultSnap.data();
    return {
      id: resultSnap.id,
      ...data,
      completedAt: data.completedAt?.toDate() || new Date(),
    } as TryoutResult;
  }

  return null;
};
