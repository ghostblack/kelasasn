import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Question } from '@/types';

export interface RecoveryStats {
  tryoutId: string;
  tryoutName: string;
  missingQuestions: number;
  recoveredQuestions: number;
  twkRecovered: number;
  tiuRecovered: number;
  tkpRecovered: number;
  totalRecovered: number;
}

export const findMissingQuestionsForTryout = async (
  tryoutId: string
): Promise<Question[]> => {
  const tryoutRef = doc(db, 'tryout_packages', tryoutId);
  const tryoutSnap = await getDoc(tryoutRef);

  if (!tryoutSnap.exists()) {
    throw new Error('Tryout tidak ditemukan');
  }

  const tryoutData = tryoutSnap.data();
  const expectedTWK = tryoutData.twkQuestions || 0;
  const expectedTIU = tryoutData.tiuQuestions || 0;
  const expectedTKP = tryoutData.tkpQuestions || 0;

  const questionsRef = collection(db, 'questions');

  const [twkSnap, tiuSnap, tkpSnap] = await Promise.all([
    getDocs(
      query(questionsRef, where('category', '==', 'TWK'), where('tryoutId', '==', tryoutId))
    ),
    getDocs(
      query(questionsRef, where('category', '==', 'TIU'), where('tryoutId', '==', tryoutId))
    ),
    getDocs(
      query(questionsRef, where('category', '==', 'TKP'), where('tryoutId', '==', tryoutId))
    ),
  ]);

  const currentTWK = twkSnap.size;
  const currentTIU = tiuSnap.size;
  const currentTKP = tkpSnap.size;

  const missingTWK = expectedTWK - currentTWK;
  const missingTIU = expectedTIU - currentTIU;
  const missingTKP = expectedTKP - currentTKP;

  const missingQuestions: Question[] = [];

  if (missingTWK > 0) {
    const allTWKSnap = await getDocs(
      query(questionsRef, where('category', '==', 'TWK'))
    );
    const allTWK = allTWKSnap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as Question[];

    const currentIds = new Set(twkSnap.docs.map(d => d.id));
    const availableTWK = allTWK.filter(q => !currentIds.has(q.id));
    missingQuestions.push(...availableTWK.slice(0, missingTWK));
  }

  if (missingTIU > 0) {
    const allTIUSnap = await getDocs(
      query(questionsRef, where('category', '==', 'TIU'))
    );
    const allTIU = allTIUSnap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as Question[];

    const currentIds = new Set(tiuSnap.docs.map(d => d.id));
    const availableTIU = allTIU.filter(q => !currentIds.has(q.id));
    missingQuestions.push(...availableTIU.slice(0, missingTIU));
  }

  if (missingTKP > 0) {
    const allTKPSnap = await getDocs(
      query(questionsRef, where('category', '==', 'TKP'))
    );
    const allTKP = allTKPSnap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as Question[];

    const currentIds = new Set(tkpSnap.docs.map(d => d.id));
    const availableTKP = allTKP.filter(q => !currentIds.has(q.id));
    missingQuestions.push(...availableTKP.slice(0, missingTKP));
  }

  return missingQuestions;
};

export const recoverTryoutQuestions = async (
  tryoutId: string,
  selectedQuestionIds: string[]
): Promise<RecoveryStats> => {
  const tryoutRef = doc(db, 'tryout_packages', tryoutId);
  const tryoutSnap = await getDoc(tryoutRef);

  if (!tryoutSnap.exists()) {
    throw new Error('Tryout tidak ditemukan');
  }

  const tryoutData = tryoutSnap.data();
  const questions = await Promise.all(
    selectedQuestionIds.map(id =>
      getDoc(doc(db, 'questions', id)).then(snap =>
        snap.exists() ? ({ id: snap.id, ...snap.data() } as Question) : null
      )
    )
  );

  const validQuestions = questions.filter(q => q !== null) as Question[];

  const twkCount = validQuestions.filter(q => q.category === 'TWK').length;
  const tiuCount = validQuestions.filter(q => q.category === 'TIU').length;
  const tkpCount = validQuestions.filter(q => q.category === 'TKP').length;

  const currentQuestionIds = tryoutData.questionIds || [];
  const newQuestionIds = [
    ...new Set([...currentQuestionIds, ...selectedQuestionIds]),
  ];

  await updateDoc(tryoutRef, {
    questionIds: newQuestionIds,
    updatedAt: serverTimestamp(),
  });

  return {
    tryoutId,
    tryoutName: tryoutData.name,
    missingQuestions: selectedQuestionIds.length,
    recoveredQuestions: validQuestions.length,
    twkRecovered: twkCount,
    tiuRecovered: tiuCount,
    tkpRecovered: tkpCount,
    totalRecovered: validQuestions.length,
  };
};
