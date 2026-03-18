import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTryoutById, getUserTryouts } from '@/services/tryoutService';
import { getQuestionsByIds, getTryoutQuestionIds } from '@/services/questionService';
import {
  createTryoutSession,
  getActiveTryoutSession,
  saveAnswer,
  completeTryoutSession,
  updateTryoutSession,
  shuffleQuestionsByCategory,
} from '@/services/tryoutSessionService';
import { Question, TryoutPackage, TryoutSession } from '@/types';
import { MathText } from '@/components/MathText';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingScreen } from '@/components/ui/spinner';
import { Menu, Flag, CircleAlert as AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type ExamSection = 'TWK' | 'TIU' | 'TKP';

export const TryoutExamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [tryout, setTryout] = useState<TryoutPackage | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [session, setSession] = useState<TryoutSession | null>(null);
  const [currentSection, setCurrentSection] = useState<ExamSection>('TWK');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState<{ [questionId: string]: string }>({});

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    if (!id) {
      setLoading(false);
      return;
    }

    initializeExam();
  }, [id, user, authLoading]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentQuestionIndex]);

  useEffect(() => {
    if (!session || session.status !== 'active') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session]);

  useEffect(() => {
    if (!session || session.status !== 'active') return;

    const autoSaveTimer = setInterval(async () => {
      if (session.id && timeLeft > 0) {
        try {
          await updateTryoutSession(session.id, {
            totalTimeLeft: timeLeft,
          } as any);
        } catch (error) {
          console.error('Auto-save time failed:', error);
        }
      }
    }, 30000);

    return () => clearInterval(autoSaveTimer);
  }, [session, timeLeft]);

  const initializeExam = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      const tryoutData = await getTryoutById(id);
      if (!tryoutData) {
        setTryout(null);
        setLoading(false);
        return;
      }

      const userTryouts = await getUserTryouts(user.uid);
      const userTryout = userTryouts.find((ut) => ut.tryoutId === id);

      if (!userTryout) {
        setTryout(null);
        setLoading(false);
        return;
      }

      if (userTryout.status === 'completed') {
        setTimeout(() => {
          navigate(`/dashboard/tryout/${id}/result`);
        }, 0);
        return;
      }

      setTryout(tryoutData);

      // Get ALL questions belonging to this tryout (unified definition)
      const allPackageQuestionIds = await getTryoutQuestionIds(id);

      let sessionData = await getActiveTryoutSession(user.uid, id);

      if (!sessionData) {
        await createTryoutSession(
          user.uid,
          userTryout.id,
          id,
          tryoutData.totalDuration,
          allPackageQuestionIds
        );
        sessionData = await getActiveTryoutSession(user.uid, id);
      } else if (
        sessionData.shuffledQuestionIds &&
        allPackageQuestionIds &&
        sessionData.shuffledQuestionIds.length !== allPackageQuestionIds.length
      ) {
        // Fix for existing sessions that were created with missing questions or wrong count
        console.log(`Detected incomplete session question list (${sessionData.shuffledQuestionIds.length} vs ${allPackageQuestionIds.length}). Fixing...`);
        const newShuffledIds = await shuffleQuestionsByCategory(allPackageQuestionIds);
        
        await updateTryoutSession(sessionData.id, {
          shuffledQuestionIds: newShuffledIds
        } as any);
        
        // Update local session data
        sessionData = {
          ...sessionData,
          shuffledQuestionIds: newShuffledIds
        };
      }

      const shuffledQuestionIds = sessionData?.shuffledQuestionIds || allPackageQuestionIds;
      const questionsData = await getQuestionsByIds(shuffledQuestionIds);

      if (questionsData.length === 0) {
        setTryout(null);
        setLoading(false);
        return;
      }

      setQuestions(questionsData);

      if (sessionData) {
        setSession(sessionData);
        setTimeLeft(sessionData.totalTimeLeft);

        // Ensure current section matches the first question's category
        if (questionsData.length > 0) {
          const firstCat = (questionsData[0].category?.toUpperCase().trim() || 'TWK') as ExamSection;
          setCurrentSection(firstCat);
        }
      }
    } catch (error) {
      console.error('Error initializing exam:', error);
      setTryout(null);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSectionQuestions = useMemo(() => {
    return questions.filter((q) => q.category?.toUpperCase().trim() === currentSection);
  }, [questions, currentSection]);

  const getCurrentQuestion = useMemo(() => {
    return questions[currentQuestionIndex] || null;
  }, [questions, currentQuestionIndex]);

  const getGlobalIndex = useCallback((question: Question): number => {
    return questions.findIndex(q => q.id === question.id);
  }, [questions]);

  const getAnswerForQuestion = useCallback((questionId: string): string => {
    if (!session) return '';
    return session.answers[questionId] || '';
  }, [session]);

  const getPendingAnswerForQuestion = useCallback((questionId: string): string => {
    return pendingAnswer[questionId] || '';
  }, [pendingAnswer]);

  const getCurrentAnswerDisplay = useCallback((questionId: string): string => {
    const pending = getPendingAnswerForQuestion(questionId);
    if (pending) return pending;
    return getAnswerForQuestion(questionId);
  }, [getPendingAnswerForQuestion, getAnswerForQuestion]);

  const hasAnswerChanged = useCallback((questionId: string): boolean => {
    const savedAnswer = getAnswerForQuestion(questionId);
    const currentAnswer = getPendingAnswerForQuestion(questionId);
    return currentAnswer !== '' && currentAnswer !== savedAnswer;
  }, [getAnswerForQuestion, getPendingAnswerForQuestion]);

  const handleAnswerSelect = useCallback((answer: string) => {
    if (!session || !getCurrentQuestion) return;

    const question = getCurrentQuestion;
    if (!question) return;

    setPendingAnswer(prev => ({
      ...prev,
      [question.id]: answer
    }));
  }, [session, getCurrentQuestion]);

  const handleSaveAndContinue = useCallback(async () => {
    if (!session || !getCurrentQuestion) return;

    const question = getCurrentQuestion;
    if (!question) return;

    const pendingAns = getPendingAnswerForQuestion(question.id);
    if (!pendingAns) return;

    const currentGlobalIndex = getGlobalIndex(question);
    const isLastQuestion = currentGlobalIndex === questions.length - 1;

    try {
      await saveAnswer(session.id, question.id, pendingAns, currentSection, { ...session.answers, [question.id]: pendingAns }, timeLeft);

      setSession(prev => ({
        ...prev!,
        answers: { ...prev!.answers, [question.id]: pendingAns }
      }));

      setPendingAnswer(prev => {
        const newPending = { ...prev };
        delete newPending[question.id];
        return newPending;
      });

      if (isLastQuestion) {
        setShowFinishDialog(true);
        return;
      }

      if (currentGlobalIndex < questions.length - 1) {
        const nextGlobalIndex = currentGlobalIndex + 1;
        const nextQuestion = questions[nextGlobalIndex];
        const nextCategory = nextQuestion.category as ExamSection;

        if (nextCategory !== currentSection) {
          setCurrentSection(nextCategory);
        }

        setCurrentQuestionIndex(nextGlobalIndex);
      }
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  }, [session, getCurrentQuestion, getPendingAnswerForQuestion, getGlobalIndex, questions, currentSection, timeLeft]);

  const handleFinishTryout = async () => {
    if (!session || !getCurrentQuestion) return;

    const question = getCurrentQuestion;
    if (!question) return;

    const pendingAns = getPendingAnswerForQuestion(question.id);

    if (pendingAns) {
      try {
        await saveAnswer(session.id, question.id, pendingAns, currentSection, { ...session.answers, [question.id]: pendingAns }, timeLeft);

        setSession(prev => ({
          ...prev!,
          answers: { ...prev!.answers, [question.id]: pendingAns }
        }));
      } catch (error) {
        console.error('Error saving last answer:', error);
      }
    }

    setShowFinishDialog(false);
    handleSubmit();
  };

  const handleSkip = useCallback(() => {
    const question = getCurrentQuestion;
    if (!question) return;

    setPendingAnswer(prev => {
      const newPending = { ...prev };
      delete newPending[question.id];
      return newPending;
    });

    const currentGlobalIndex = getGlobalIndex(question);
    const isLastQuestion = currentGlobalIndex === questions.length - 1;

    if (isLastQuestion) {
      setShowFinishDialog(true);
      return;
    }

    if (currentGlobalIndex < questions.length - 1) {
      const nextGlobalIndex = currentGlobalIndex + 1;
      const nextQuestion = questions[nextGlobalIndex];
      const nextCategory = nextQuestion.category as ExamSection;

      if (nextCategory !== currentSection) {
        setCurrentSection(nextCategory);
      }

      setCurrentQuestionIndex(nextGlobalIndex);
    }
  }, [getCurrentQuestion, getGlobalIndex, questions, currentSection]);

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextQuestion = questions[currentQuestionIndex + 1];
      const nextCategory = nextQuestion.category as ExamSection;
      if (nextCategory !== currentSection) {
        setCurrentSection(nextCategory);
      }
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevQuestion = questions[currentQuestionIndex - 1];
      const prevCategory = prevQuestion.category as ExamSection;
      if (prevCategory !== currentSection) {
        setCurrentSection(prevCategory);
      }
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSectionChange = async (section: ExamSection) => {
    if (!session) return;

    await updateTryoutSession(session.id, {
      totalTimeLeft: timeLeft,
    } as any);

    setCurrentSection(section);
    const firstQuestionInSection = questions.findIndex(q => q.category?.toUpperCase().trim() === section);
    if (firstQuestionInSection !== -1) {
      setCurrentQuestionIndex(firstQuestionInSection);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const calculateScores = () => {
    if (!questions || !session) return null;

    // Deduplicate questions to prevent double counting if the same ID exists multiple times
    const uniqueQuestionsMap = new Map<string, Question>();
    questions.forEach(q => {
      if (q && q.id) {
        uniqueQuestionsMap.set(q.id, q);
      }
    });
    
    const uniqueQuestions = Array.from(uniqueQuestionsMap.values());

    const twkQuestions = uniqueQuestions.filter((q) => q.category?.toUpperCase().trim() === 'TWK');
    const tiuQuestions = uniqueQuestions.filter((q) => q.category?.toUpperCase().trim() === 'TIU');
    const tkpQuestions = uniqueQuestions.filter((q) => q.category?.toUpperCase().trim() === 'TKP');

    let twkCorrect = 0;
    let tiuCorrect = 0;
    let tkpCorrect = 0;
    let tkpScore = 0;

    twkQuestions.forEach((q) => {
      if (session.answers[q.id] === q.correctAnswer) twkCorrect++;
    });

    tiuQuestions.forEach((q) => {
      if (session.answers[q.id] === q.correctAnswer) tiuCorrect++;
    });

    tkpQuestions.forEach((q) => {
      const userAnswer = session.answers[q.id];
      if (userAnswer && q.tkpScoring) {
        // Ensure score is added as a number
        const scoreValue = q.tkpScoring[userAnswer as 'a' | 'b' | 'c' | 'd' | 'e'];
        tkpScore += Number(scoreValue) || 0;
      }
      if (session.answers[q.id] === q.correctAnswer) tkpCorrect++;
    });

    const twkScore = twkCorrect * 5;
    const tiuScore = tiuCorrect * 5;
    const tkpMaxScore = tkpQuestions.length * 5;

    const maxTwkScore = twkQuestions.length * 5;
    const maxTiuScore = tiuQuestions.length * 5;
    const maxTkpScore = tkpMaxScore;

    return {
      twkScore: Number(twkScore),
      tiuScore: Number(tiuScore),
      tkpScore: Number(tkpScore),
      twkCorrect,
      tiuCorrect,
      tkpCorrect,
      twkTotal: twkQuestions.length,
      tiuTotal: tiuQuestions.length,
      tkpTotal: tkpQuestions.length,
      maxTwkScore,
      maxTiuScore,
      maxTkpScore,
    };
  };

  const handleSubmit = async () => {
    if (!session || !tryout || !user || submitting) return;

    try {
      setSubmitting(true);
      setShowSubmitDialog(false);

      const scores = calculateScores();

      if (!scores) {
        throw new Error('Failed to calculate scores');
      }

      await completeTryoutSession(
        session.id,
        user.uid,
        tryout.id,
        tryout.name,
        session.answers,
        scores,
        {
          passingGradeTWK: tryout.passingGradeTWK || 65,
          passingGradeTIU: tryout.passingGradeTIU || 80,
          passingGradeTKP: tryout.passingGradeTKP || 166,
        }
      );

      navigate(`/dashboard/tryout/${id}/result`);
    } catch (error) {
      console.error('Error submitting tryout:', error);
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = () => {
    setShowSubmitDialog(true);
    handleSubmit();
  };

  const getAnsweredCount = useCallback((section: ExamSection): number => {
    if (!session) return 0;
    const sectionQuestions = questions.filter((q) => q.category?.toUpperCase().trim() === section);
    return sectionQuestions.filter((q) => session.answers[q.id]).length;
  }, [session, questions]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <LoadingScreen message="Memuat soal try out..." type="spinner" fullScreen overlay />;
  }

  if (!tryout || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tidak Dapat Memuat Try Out</h2>
          <p className="text-gray-600 mb-6">Try out tidak ditemukan atau belum bisa diakses.</p>
          <Button onClick={() => navigate('/dashboard/tryouts')} className="bg-blue-600 hover:bg-blue-700">
            Kembali ke Daftar Try Out
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion;
  const sectionQuestions = getCurrentSectionQuestions;
  const answeredCount = getAnsweredCount(currentSection);
  const progress = (answeredCount / sectionQuestions.length) * 100;

  const currentGlobalQuestionIndex = currentQuestion ? getGlobalIndex(currentQuestion) : -1;
  const isLastQuestion = currentGlobalQuestionIndex === questions.length - 1;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={() => setShowQuestionNav(true)}
                className="md:hidden bg-slate-800 p-2 rounded text-white"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="bg-slate-800 px-3 md:px-4 py-2 rounded text-white text-xs md:text-sm font-medium">
                {currentSection}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 text-white px-3 md:px-5 py-2 rounded font-mono text-base md:text-lg font-semibold tracking-wide">
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex gap-4">
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded shadow-sm p-4 sticky top-20">
              <div className="bg-blue-900 text-white text-center py-2 rounded text-sm font-medium mb-4">
                {currentSection}
              </div>

              <div className="grid grid-cols-5 gap-2 mb-4 max-h-[500px] overflow-y-auto">
                {questions.map((question, index) => {
                  const savedAnswer = getAnswerForQuestion(question.id);
                  const pendingAns = getPendingAnswerForQuestion(question.id);
                  const isAnswered = !!savedAnswer;
                  const hasPending = !!pendingAns;
                  const isCurrent = currentQuestionIndex === index;

                  let bgColor = 'bg-green-500 text-white';
                  if (isCurrent) {
                    bgColor = 'bg-yellow-400 text-gray-900';
                  } else if (hasPending) {
                    bgColor = 'bg-blue-500 text-white';
                  } else if (!isAnswered) {
                    bgColor = 'bg-white text-gray-700 border border-gray-300';
                  }

                  return (
                    <button
                      key={question.id}
                      onClick={() => {
                        const questionCategory = question.category as ExamSection;
                        if (questionCategory !== currentSection) {
                          setCurrentSection(questionCategory);
                        }
                        setCurrentQuestionIndex(index);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`aspect-square rounded text-base font-bold transition-colors ${bgColor}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setShowSubmitDialog(true)}
                  className="w-full h-10 text-sm bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Selesaikan
                </Button>
              </div>
            </div>
          </div>

          <div className="flex-1">
            {currentQuestion && (
              <div className="bg-white rounded shadow-sm">
                <div className="border-b bg-blue-700 text-white px-4 py-2.5 rounded-t">
                  <div className="text-xs md:text-sm font-medium">
                    {currentQuestion.subcategory || 'Soal'} - Nomor {currentQuestion ? getGlobalIndex(currentQuestion) + 1 : 0}
                  </div>
                </div>

                <div className="p-4 md:p-6">
                  <div className="mb-6 space-y-4">
                    <MathText text={currentQuestion.questionText} className="text-sm leading-relaxed text-gray-900" />
                    {currentQuestion.questionImage && (
                      <div className="flex justify-center py-2">
                        <img
                          src={currentQuestion.questionImage}
                          alt="Soal"
                          className="max-w-sm max-h-80 object-contain rounded-lg border-2 border-gray-300 shadow-md"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    {['a', 'b', 'c', 'd', 'e'].map((key) => {
                      const value = currentQuestion.options[key as keyof typeof currentQuestion.options];
                      const savedAnswer = getAnswerForQuestion(currentQuestion.id);
                      const pendingAns = getPendingAnswerForQuestion(currentQuestion.id);
                      const displayAnswer = pendingAns || savedAnswer;
                      const isSelected = displayAnswer === key;
                      const isSaved = savedAnswer === key && !pendingAns;
                      const isPending = pendingAns === key;

                      return (
                        <button
                          key={key}
                          onClick={() => handleAnswerSelect(key)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg border-2 transition-all ${
                            isPending
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : isSaved
                              ? 'border-green-500 bg-green-50 shadow-sm'
                              : isSelected
                              ? 'border-green-500 bg-green-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border-2 ${
                                isPending
                                  ? 'bg-blue-500 text-white border-blue-500'
                                  : isSaved
                                  ? 'bg-green-500 text-white border-green-500'
                                  : isSelected
                                  ? 'bg-green-500 text-white border-green-500'
                                  : 'bg-white text-gray-700 border-gray-400'
                              }`}
                            >
                              {key.toUpperCase()}
                            </div>
                            <div className="flex flex-col gap-2 grow">
                              <MathText text={value} className="text-sm text-gray-900 leading-relaxed pt-0.5" />
                              {currentQuestion.optionImages?.[key as 'a'|'b'|'c'|'d'|'e'] && (
                                <div className="mt-1">
                                  <img 
                                    src={currentQuestion.optionImages[key as 'a'|'b'|'c'|'d'|'e']} 
                                    alt={`Pilihan ${key.toUpperCase()}`}
                                    className="max-w-full sm:max-w-xs max-h-48 object-contain rounded border border-gray-100 bg-white"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>


                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
                    {(() => {
                      const isChanged = hasAnswerChanged(currentQuestion.id);

                      if (isLastQuestion) {
                        return (
                          <>
                            {isChanged && (
                              <Button
                                onClick={handleSaveAndContinue}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-semibold rounded shadow-md h-9"
                              >
                                SIMPAN DAN LANJUTKAN
                              </Button>
                            )}
                            <Button
                              onClick={handleSkip}
                              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 text-xs font-semibold rounded shadow-md h-9"
                            >
                              LEWATKAN
                            </Button>
                          </>
                        );
                      }

                      return (
                        <>
                          {isChanged && (
                            <Button
                              onClick={handleSaveAndContinue}
                              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-semibold rounded shadow-md h-9"
                            >
                              SIMPAN DAN LANJUTKAN
                            </Button>
                          )}
                          <Button
                            onClick={handleSkip}
                            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 text-xs font-semibold rounded shadow-md h-9"
                          >
                            LEWATKAN
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showQuestionNav} onOpenChange={setShowQuestionNav}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:max-h-[90vh] max-sm:w-full max-sm:data-[state=open]:animate-slide-in-from-bottom max-sm:data-[state=closed]:animate-slide-out-to-bottom">
          <DialogHeader>
            <DialogTitle>Navigasi Soal</DialogTitle>
            <DialogDescription>
              Pilih nomor soal yang ingin dikerjakan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
              <span className="text-sm font-medium">Bagian: {currentSection}</span>
              <Badge variant="outline" className="text-xs">
                {answeredCount}/{sectionQuestions.length} Terjawab
              </Badge>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((question, index) => {
                const savedAnswer = getAnswerForQuestion(question.id);
                const pendingAns = getPendingAnswerForQuestion(question.id);
                const isAnswered = !!savedAnswer;
                const hasPending = !!pendingAns;
                const isCurrent = currentQuestionIndex === index;

                let bgColor = 'bg-green-500 text-white';
                if (isCurrent) {
                  bgColor = 'bg-yellow-400 text-gray-900';
                } else if (hasPending) {
                  bgColor = 'bg-blue-500 text-white';
                } else if (!isAnswered) {
                  bgColor = 'bg-white text-gray-700 border border-gray-300';
                }

                return (
                  <button
                    key={question.id}
                    onClick={() => {
                      const questionCategory = question.category as ExamSection;
                      if (questionCategory !== currentSection) {
                        setCurrentSection(questionCategory);
                      }
                      setCurrentQuestionIndex(index);
                      setShowQuestionNav(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`aspect-square rounded text-base font-bold transition-colors ${bgColor}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-6 h-6 bg-yellow-400 rounded"></div>
                <span>Soal saat ini</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
                <span>Sudah disimpan</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
                <span>Belum disimpan</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-6 h-6 bg-white border border-gray-300 rounded"></div>
                <span>Belum dijawab</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              onClick={() => setShowQuestionNav(false)}
              variant="outline"
              className="w-full text-xs h-9"
            >
              Tutup
            </Button>
            <Button
              onClick={() => {
                setShowQuestionNav(false);
                setShowSubmitDialog(true);
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-xs h-9"
            >
              <Flag className="w-3.5 h-3.5 mr-2" />
              Selesaikan Try Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <DialogContent className="sm:max-w-md max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:max-h-[90vh] max-sm:overflow-y-auto max-sm:w-full max-sm:data-[state=open]:animate-slide-in-from-bottom max-sm:data-[state=closed]:animate-slide-out-to-bottom">
          <DialogHeader>
            <DialogTitle className="text-base">Selesaikan Try Out?</DialogTitle>
            <DialogDescription className="text-sm">
              Apakah Anda yakin ingin menyelesaikan try out ini? Jawaban yang sudah disimpan tidak dapat diubah kembali.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 border rounded">
              <span className="text-sm font-medium text-gray-700">TWK</span>
              <Badge variant="outline" className="text-xs">
                {getAnsweredCount('TWK')}/{questions.filter((q) => q.category === 'TWK').length}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-2 border rounded">
              <span className="text-sm font-medium text-gray-700">TIU</span>
              <Badge variant="outline" className="text-xs">
                {getAnsweredCount('TIU')}/{questions.filter((q) => q.category === 'TIU').length}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-2 border rounded">
              <span className="text-sm font-medium text-gray-700">TKP</span>
              <Badge variant="outline" className="text-xs">
                {getAnsweredCount('TKP')}/{questions.filter((q) => q.category === 'TKP').length}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFinishDialog(false)} disabled={submitting} size="sm" className="text-xs h-8">
              Batal
            </Button>
            <Button onClick={handleFinishTryout} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-xs h-8" size="sm">
              {submitting ? 'Mengirim...' : 'Ya, Selesaikan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent className="sm:max-w-md max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:max-h-[90vh] max-sm:overflow-y-auto max-sm:w-full max-sm:data-[state=open]:animate-slide-in-from-bottom max-sm:data-[state=closed]:animate-slide-out-to-bottom">
          <DialogHeader>
            <DialogTitle className="text-base">Selesaikan Try Out?</DialogTitle>
            <DialogDescription className="text-sm">
              Pastikan semua jawaban sudah terisi sebelum menyelesaikan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 border rounded">
              <span className="text-sm font-medium text-gray-700">TWK</span>
              <Badge variant="outline" className="text-xs">
                {getAnsweredCount('TWK')}/{questions.filter((q) => q.category === 'TWK').length}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-2 border rounded">
              <span className="text-sm font-medium text-gray-700">TIU</span>
              <Badge variant="outline" className="text-xs">
                {getAnsweredCount('TIU')}/{questions.filter((q) => q.category === 'TIU').length}
              </Badge>
            </div>
            <div className="flex justify-between items-center p-2 border rounded">
              <span className="text-sm font-medium text-gray-700">TKP</span>
              <Badge variant="outline" className="text-xs">
                {getAnsweredCount('TKP')}/{questions.filter((q) => q.category === 'TKP').length}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)} disabled={submitting} size="sm" className="text-xs h-8">
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-green-600 hover:bg-green-700 text-xs h-8" size="sm">
              {submitting ? 'Mengirim...' : 'Selesaikan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
