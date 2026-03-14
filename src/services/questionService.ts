import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Question } from '@/types';

export const getAllQuestions = async (): Promise<Question[]> => {
  const questionsRef = collection(db, 'questions');
  const snapshot = await getDocs(questionsRef);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Question[];
};

export const getQuestionsByCategory = async (category: 'TWK' | 'TIU' | 'TKP'): Promise<Question[]> => {
  const questionsRef = collection(db, 'questions');
  const q = query(questionsRef, where('category', '==', category));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Question[];
};

export const getQuestionsByTryoutAndCategory = async (tryoutId: string, category: 'TWK' | 'TIU' | 'TKP'): Promise<Question[]> => {
  const questionsRef = collection(db, 'questions');
  const q = query(questionsRef, where('tryoutId', '==', tryoutId), where('category', '==', category));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Question[];
};

export const getQuestionsForTryoutDisplaying = async (tryoutId: string, category: 'TWK' | 'TIU' | 'TKP'): Promise<Question[]> => {
  const questionsRef = collection(db, 'questions');
  const q = query(questionsRef, where('category', '==', category));
  const snapshot = await getDocs(q);

  const allQuestions = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Question[];

  // Filter untuk soal yang:
  // 1. Memiliki tryoutId yang sesuai (soal baru), ATAU
  // 2. Tidak memiliki tryoutId dan ada di dalam questionIds tryout tersebut (soal lama)
  const tryoutRef = doc(db, 'tryout_packages', tryoutId);
  const tryoutSnap = await getDoc(tryoutRef);

  if (!tryoutSnap.exists()) {
    return [];
  }

  const tryoutData = tryoutSnap.data();
  const questionIds = tryoutData.questionIds || [];

  return allQuestions.filter(question => {
    // Jika soal memiliki tryoutId, harus sesuai dengan tryoutId yang diminta
    if (question.tryoutId) {
      return question.tryoutId === tryoutId;
    }
    // Jika soal tidak memiliki tryoutId (soal lama), harus ada di questionIds tryout
    return questionIds.includes(question.id);
  });
};

export const getQuestionById = async (questionId: string): Promise<Question | null> => {
  const questionRef = doc(db, 'questions', questionId);
  const questionSnap = await getDoc(questionRef);

  if (questionSnap.exists()) {
    return {
      id: questionSnap.id,
      ...questionSnap.data(),
    } as Question;
  }

  return null;
};

export const getQuestionsByIds = async (questionIds: string[]): Promise<Question[]> => {
  if (questionIds.length === 0) return [];

  const BATCH_SIZE = 30;
  const allPromises: Promise<any>[] = [];

  for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
    const batch = questionIds.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(id => {
      const questionRef = doc(db, 'questions', id);
      return getDoc(questionRef);
    });
    allPromises.push(...batchPromises);
  }

  const snapshots = await Promise.all(allPromises);
  const questions: Question[] = [];

  snapshots.forEach((questionSnap) => {
    if (questionSnap.exists()) {
      questions.push({
        id: questionSnap.id,
        ...questionSnap.data(),
      } as Question);
    }
  });

  const questionsMap = new Map(questions.map(q => [q.id, q]));
  return questionIds.map(id => questionsMap.get(id)).filter((q): q is Question => q !== undefined);
};

export const createQuestion = async (question: Omit<Question, 'id'>): Promise<string> => {
  const questionsRef = collection(db, 'questions');

  const cleanData: any = {
    questionText: question.questionText,
    options: question.options,
    category: question.category,
    weight: question.weight,
    tryoutId: question.tryoutId,
    createdAt: serverTimestamp(),
  };

  if (question.correctAnswer !== undefined && question.correctAnswer !== null) {
    cleanData.correctAnswer = question.correctAnswer;
  }

  if (question.questionImage) {
    cleanData.questionImage = question.questionImage;
  }

  if (question.explanation) {
    cleanData.explanation = question.explanation;
  }

  if (question.subcategory) {
    cleanData.subcategory = question.subcategory;
  }

  if (question.tkpScoring) {
    cleanData.tkpScoring = question.tkpScoring;
  }

  const docRef = await addDoc(questionsRef, cleanData);

  return docRef.id;
};

export const updateQuestion = async (questionId: string, updates: Partial<Question>): Promise<void> => {
  const questionRef = doc(db, 'questions', questionId);

  const cleanUpdates: any = {
    updatedAt: serverTimestamp(),
  };

  if (updates.questionText !== undefined) {
    cleanUpdates.questionText = updates.questionText;
  }

  if (updates.questionImage !== undefined) {
    if (updates.questionImage) {
      cleanUpdates.questionImage = updates.questionImage;
    }
  }

  if (updates.options !== undefined) {
    cleanUpdates.options = updates.options;
  }

  if (updates.correctAnswer !== undefined) {
    cleanUpdates.correctAnswer = updates.correctAnswer;
  }

  if (updates.explanation !== undefined) {
    if (updates.explanation) {
      cleanUpdates.explanation = updates.explanation;
    }
  }

  if (updates.category !== undefined) {
    cleanUpdates.category = updates.category;
  }

  if (updates.subcategory !== undefined) {
    if (updates.subcategory) {
      cleanUpdates.subcategory = updates.subcategory;
    }
  }

  if (updates.weight !== undefined) {
    cleanUpdates.weight = updates.weight;
  }

  if (updates.tkpScoring !== undefined) {
    cleanUpdates.tkpScoring = updates.tkpScoring;
  }

  await updateDoc(questionRef, cleanUpdates);
};

export const deleteQuestion = async (questionId: string): Promise<void> => {
  const questionRef = doc(db, 'questions', questionId);
  await deleteDoc(questionRef);
};

export const bulkCreateQuestions = async (questions: Omit<Question, 'id'>[]): Promise<string[]> => {
  const batch = writeBatch(db);
  const questionsRef = collection(db, 'questions');
  const questionIds: string[] = [];

  for (const question of questions) {
    const newDocRef = doc(questionsRef);

    const cleanData: any = {
      questionText: question.questionText,
      options: question.options,
      category: question.category,
      weight: question.weight,
      tryoutId: question.tryoutId,
      createdAt: serverTimestamp(),
    };

    if (question.correctAnswer !== undefined && question.correctAnswer !== null) {
      cleanData.correctAnswer = question.correctAnswer;
    }

    if (question.questionImage) {
      cleanData.questionImage = question.questionImage;
    }

    if (question.explanation) {
      cleanData.explanation = question.explanation;
    }

    if (question.subcategory) {
      cleanData.subcategory = question.subcategory;
    }

    if (question.tkpScoring) {
      cleanData.tkpScoring = question.tkpScoring;
    }

    batch.set(newDocRef, cleanData);
    questionIds.push(newDocRef.id);
  }

  await batch.commit();
  return questionIds;
};

export const addQuestionToTryout = async (tryoutId: string, questionId: string): Promise<void> => {
  const tryoutRef = doc(db, 'tryout_packages', tryoutId);
  const tryoutSnap = await getDoc(tryoutRef);

  if (!tryoutSnap.exists()) {
    throw new Error('Tryout tidak ditemukan');
  }

  const currentQuestionIds = tryoutSnap.data().questionIds || [];

  if (currentQuestionIds.includes(questionId)) {
    return;
  }

  await updateDoc(tryoutRef, {
    questionIds: [...currentQuestionIds, questionId],
    updatedAt: serverTimestamp(),
  });
};

export const removeQuestionFromTryout = async (tryoutId: string, questionId: string): Promise<void> => {
  const tryoutRef = doc(db, 'tryout_packages', tryoutId);
  const tryoutSnap = await getDoc(tryoutRef);

  if (!tryoutSnap.exists()) {
    throw new Error('Tryout tidak ditemukan');
  }

  const currentQuestionIds = tryoutSnap.data().questionIds || [];
  const updatedQuestionIds = currentQuestionIds.filter((id: string) => id !== questionId);

  await updateDoc(tryoutRef, {
    questionIds: updatedQuestionIds,
    updatedAt: serverTimestamp(),
  });
};
