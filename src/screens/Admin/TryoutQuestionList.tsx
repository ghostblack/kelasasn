import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getQuestionsForTryoutDisplaying, deleteQuestion, removeQuestionFromTryout } from '@/services/questionService';
import { Question } from '@/types';

export const TryoutQuestionList: React.FC = () => {
  const navigate = useNavigate();
  const { tryoutId, category } = useParams<{ tryoutId: string; category: string }>();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const categoryName = (category?.toUpperCase() || 'TWK') as 'TWK' | 'TIU' | 'TKP';

  const categoryInfo = {
    TWK: {
      title: 'Tes Wawasan Kebangsaan',
      color: 'bg-blue-600',
      description: 'Daftar soal wawasan kebangsaan',
    },
    TIU: {
      title: 'Tes Intelegensia Umum',
      color: 'bg-purple-600',
      description: 'Daftar soal intelegensia umum',
    },
    TKP: {
      title: 'Tes Karakteristik Pribadi',
      color: 'bg-orange-600',
      description: 'Daftar soal karakteristik pribadi',
    },
  }[categoryName];

  useEffect(() => {
    loadQuestions();
  }, [categoryName]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      if (!tryoutId) return;
      const data = await getQuestionsForTryoutDisplaying(tryoutId, categoryName);
      setQuestions(data);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat soal',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Yakin ingin menghapus soal ini? Soal akan dihapus secara permanen.')) return;

    try {
      await deleteQuestion(questionId);

      if (tryoutId) {
        await removeQuestionFromTryout(tryoutId, questionId);
      }

      toast({
        title: 'Berhasil',
        description: 'Soal berhasil dihapus',
      });
      loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus soal',
        variant: 'destructive',
      });
    }
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const filteredQuestions = questions.filter((q) =>
    q.questionText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/admin/tryouts/${tryoutId}/questions`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Daftar Soal {categoryName}</h1>
              <p className="text-sm text-gray-500">{filteredQuestions.length} soal</p>
            </div>
          </div>
          <Button
            onClick={() => navigate(`/admin/tryouts/${tryoutId}/questions/${category}/input`)}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Soal
          </Button>
        </div>

        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari soal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
            <p className="mt-3 text-gray-600 text-sm">Memuat soal...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredQuestions.map((question, index) => {
              const isExpanded = expandedQuestions.has(question.id);

              return (
                <div
                  key={question.id}
                  className="border rounded-lg overflow-hidden bg-white"
                >
                  <div
                    className="flex items-center justify-between gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleQuestion(question.id)}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center font-medium text-xs flex-shrink-0">
                        {index + 1}
                      </div>
                      {question.subcategory && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {question.subcategory}
                        </Badge>
                      )}
                      <p className="text-sm text-gray-900 truncate flex-1">{question.questionText}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/tryouts/${tryoutId}/questions/${category}/edit/${question.id}`);
                        }}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 p-0"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(question.id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 pt-2 border-t bg-gray-50 text-sm">
                          <div className="mb-2">
                            <p className="font-medium text-gray-700 mb-1.5 text-xs">Pertanyaan:</p>
                            <p className="text-gray-900 whitespace-pre-wrap">
                              {question.questionText}
                            </p>
                            {question.questionImage && (
                              <img
                                src={question.questionImage}
                                alt="Question"
                                className="mt-2 max-w-md rounded border"
                              />
                            )}
                          </div>

                          <div className="space-y-1.5 mb-2">
                            <p className="font-medium text-gray-700 text-xs">Pilihan:</p>
                            {['a', 'b', 'c', 'd', 'e'].map((option) => (
                              <div
                                key={option}
                                className={`p-2 rounded text-sm ${
                                  question.correctAnswer === option
                                    ? 'bg-green-50 border border-green-300'
                                    : 'bg-white border'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-gray-900 flex-1">
                                    <span className="font-medium mr-1.5">{option.toUpperCase()}.</span>
                                    {question.options[option as keyof typeof question.options]}
                                  </p>
                                  {categoryName === 'TKP' && question.tkpScoring && (
                                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                                      {question.tkpScoring[option as 'a' | 'b' | 'c' | 'd' | 'e']}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {question.explanation && (
                            <div className="p-2 bg-blue-50 rounded border border-blue-200">
                              <p className="text-xs font-medium text-blue-900 mb-1">Pembahasan:</p>
                              <p className="text-sm text-blue-800 whitespace-pre-wrap">
                                {question.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {filteredQuestions.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-gray-600 text-sm">Belum ada soal {categoryName}</p>
                <Button
                  onClick={() => navigate(`/admin/tryouts/${tryoutId}/questions/${category}/input`)}
                  className="mt-3"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Soal
                </Button>
              </div>
            )}
          </div>
        )}
    </div>
  );
};
