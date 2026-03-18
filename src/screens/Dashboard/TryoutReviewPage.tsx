import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTryoutById, getUserResultsByTryout } from '@/services/tryoutService';
import { getQuestionsByIds } from '@/services/questionService';
import { TryoutResult, TryoutPackage, Question } from '@/types';
import { MathText } from '@/components/MathText';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CircleCheck, XCircle, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';

type ExamSection = 'TWK' | 'TIU' | 'TKP';

export const TryoutReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<TryoutResult | null>(null);
  const [tryout, setTryout] = useState<TryoutPackage | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentSection, setCurrentSection] = useState<ExamSection>('TWK');

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    loadReview();
  }, [id, user, authLoading]);

  const loadReview = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      const results = await getUserResultsByTryout(user.uid, id);

      if (results.length === 0) {
        navigate(`/dashboard/tryout/${id}`);
        return;
      }

      setResult(results[0]);

      const tryoutData = await getTryoutById(id);
      setTryout(tryoutData);

      if (tryoutData) {
        const shuffledQuestionIds = results[0].shuffledQuestionIds || tryoutData.questionIds;
        const questionsData = await getQuestionsByIds(shuffledQuestionIds);
        setQuestions(questionsData);

        if (questionsData.length > 0) {
          const firstCat = (questionsData[0].category?.toUpperCase().trim() || 'TWK') as ExamSection;
          setCurrentSection(firstCat);
        }
      }
    } catch (error) {
      console.error('Error loading review:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSectionQuestions = (): Question[] => {
    return questions.filter((q) => q.category?.toUpperCase().trim() === currentSection);
  };

  const getCurrentQuestion = (): Question | null => {
    const sectionQuestions = getCurrentSectionQuestions();
    return sectionQuestions[currentQuestionIndex] || null;
  };

  const handleQuestionClick = (globalIndex: number) => {
    const question = questions[globalIndex];
    const questionCategory = question.category?.toUpperCase().trim() as ExamSection;

    if (questionCategory !== currentSection) {
      setCurrentSection(questionCategory);
    }

    const sectionQuestions = questions.filter(q => q.category?.toUpperCase().trim() === questionCategory);
    const sectionIndex = sectionQuestions.findIndex(q => q.id === question.id);
    setCurrentQuestionIndex(sectionIndex);
  };

  const handleNextQuestion = () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    const currentGlobalIndex = questions.findIndex(q => q.id === currentQuestion.id);

    if (currentGlobalIndex < questions.length - 1) {
      const nextQuestion = questions[currentGlobalIndex + 1];
      const nextCategory = nextQuestion.category?.toUpperCase().trim() as ExamSection;

      if (nextCategory !== currentSection) {
        setCurrentSection(nextCategory);
      }

      const nextSectionQuestions = questions.filter(q => q.category?.toUpperCase().trim() === nextCategory);
      const nextIndex = nextSectionQuestions.findIndex(q => q.id === nextQuestion.id);
      setCurrentQuestionIndex(nextIndex);
    }
  };

  const handlePreviousQuestion = () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    const currentGlobalIndex = questions.findIndex(q => q.id === currentQuestion.id);

    if (currentGlobalIndex > 0) {
      const prevQuestion = questions[currentGlobalIndex - 1];
      const prevCategory = prevQuestion.category?.toUpperCase().trim() as ExamSection;

      if (prevCategory !== currentSection) {
        setCurrentSection(prevCategory);
      }

      const prevSectionQuestions = questions.filter(q => q.category?.toUpperCase().trim() === prevCategory);
      const prevIndex = prevSectionQuestions.findIndex(q => q.id === prevQuestion.id);
      setCurrentQuestionIndex(prevIndex);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Memuat pembahasan...</p>
        </div>
      </div>
    );
  }

  if (!result || !tryout || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-600">Pembahasan tidak ditemukan</p>
        <Button onClick={() => navigate(`/dashboard/tryout/${id}/result`)} className="mt-4 text-sm h-9">
          Kembali
        </Button>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();
  if (!currentQuestion) return null;

  const userAnswer = result.answers[currentQuestion.id];
  const isCorrect = userAnswer === currentQuestion.correctAnswer;
  const currentGlobalIndex = questions.findIndex(q => q.id === currentQuestion.id);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-slate-800 px-4 py-2 rounded text-white text-sm">
                Pembahasan
              </div>
              <div className="hidden md:block">
                <p className="text-sm text-gray-900">{tryout.name}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(`/dashboard/tryout/${id}/result`)}
              className="border hover:bg-gray-50 text-sm h-9"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex gap-4">
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded p-4 sticky top-20">
              <div className="bg-blue-900 text-white text-center py-2 rounded text-sm mb-4">
                Navigasi Soal
              </div>

              <div className="grid grid-cols-5 gap-2 mb-4 max-h-[500px] overflow-y-auto">
                {questions.map((question, index) => {
                  const qAnswer = result.answers[question.id];
                  const qCorrect = qAnswer === question.correctAnswer;
                  const isCurrent = currentGlobalIndex === index;

                  let bgColor = 'bg-green-500 text-white';
                  if (isCurrent) {
                    bgColor = 'bg-yellow-400 text-gray-900';
                  } else if (!qCorrect) {
                    bgColor = 'bg-red-500 text-white';
                  }

                  return (
                    <button
                      key={question.id}
                      onClick={() => handleQuestionClick(index)}
                      className={`aspect-square rounded text-base transition-all ${bgColor}`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                  <span className="text-gray-600">Dipilih</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-gray-600">Benar</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-gray-600">Salah</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded">
              <div className={`border-b px-4 py-2.5 ${isCorrect ? 'bg-green-700' : 'bg-red-700'}`}>
                <div className="flex items-center justify-between">
                  <div className="text-xs md:text-sm text-white">
                    {currentQuestion.subcategory || 'Soal'} - Nomor {currentGlobalIndex + 1}
                  </div>
                  {isCorrect ? (
                    <div className="flex items-center gap-1.5 text-white">
                      <CircleCheck className="w-4 h-4" />
                      <span className="text-xs md:text-sm">Benar</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-white">
                      <XCircle className="w-4 h-4" />
                      <span className="text-xs md:text-sm">Salah</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 md:p-6">
                <div className="mb-6">
                  <MathText text={currentQuestion.questionText} className="text-sm leading-relaxed text-gray-900" />
                  {currentQuestion.questionImage && (
                    <img
                      src={currentQuestion.questionImage}
                      alt="Soal"
                      className="mt-4 max-w-full rounded border"
                    />
                  )}
                </div>

                <div className="space-y-2.5 mb-6">
                  {['a', 'b', 'c', 'd', 'e'].map((key) => {
                    const value = currentQuestion.options[key as keyof typeof currentQuestion.options];
                    const isUserAnswer = userAnswer === key;
                    const isCorrectAnswer = currentQuestion.correctAnswer === key;

                    return (
                      <div
                        key={key}
                        className={`px-3 py-2.5 rounded-lg border-2 ${
                          isCorrectAnswer
                            ? 'border-green-500 bg-green-50'
                            : isUserAnswer
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 border-2 ${
                              isCorrectAnswer
                                ? 'bg-green-500 text-white border-green-500'
                                : isUserAnswer
                                ? 'bg-red-500 text-white border-red-500'
                                : 'bg-white text-gray-700 border-gray-400'
                            }`}
                          >
                            {key.toUpperCase()}
                          </div>
                          <MathText text={value} className="flex-1 text-sm text-gray-900 leading-relaxed pt-0.5" />
                          {isCorrectAnswer && (
                            <span className="text-xs px-2 py-0.5 bg-green-600 text-white rounded">
                              Jawaban Benar
                            </span>
                          )}
                          {isUserAnswer && !isCorrectAnswer && (
                            <span className="text-xs px-2 py-0.5 bg-red-600 text-white rounded">Jawaban Anda</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {currentQuestion.explanation && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm text-gray-900 mb-2">Pembahasan</h4>
                    <MathText text={currentQuestion.explanation} className="text-sm text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg border border-blue-100 block" />
                  </div>
                )}

                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <Button
                    onClick={handlePreviousQuestion}
                    disabled={currentGlobalIndex === 0}
                    variant="outline"
                    className="h-9 text-sm border hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Sebelumnya
                  </Button>

                  <span className="text-sm text-gray-600">
                    {currentGlobalIndex + 1} / {questions.length}
                  </span>

                  <Button
                    onClick={handleNextQuestion}
                    disabled={currentGlobalIndex === questions.length - 1}
                    variant="outline"
                    className="h-9 text-sm border hover:bg-gray-50"
                  >
                    Selanjutnya
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
