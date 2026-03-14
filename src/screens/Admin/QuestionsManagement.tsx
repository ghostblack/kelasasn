import React, { useEffect, useState } from 'react';
import { Question } from '@/types';
import { getAllQuestions, createQuestion, updateQuestion, deleteQuestion } from '@/services/questionService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, CreditCard as Edit2, Trash2, Search, Eye, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const QuestionsManagement: React.FC = () => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    questionText: '',
    questionImage: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    optionE: '',
    correctAnswer: 'a' as 'a' | 'b' | 'c' | 'd' | 'e',
    explanation: '',
    category: 'TWK' as 'TWK' | 'TIU' | 'TKP',
    subcategory: '',
    weight: 1,
    tkpScoreA: 5,
    tkpScoreB: 4,
    tkpScoreC: 3,
    tkpScoreD: 2,
    tkpScoreE: 1,
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await getAllQuestions();
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

  const handleOpenDialog = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        questionText: question.questionText,
        questionImage: question.questionImage || '',
        optionA: question.options.a,
        optionB: question.options.b,
        optionC: question.options.c,
        optionD: question.options.d,
        optionE: question.options.e,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || '',
        category: question.category,
        subcategory: question.subcategory || '',
        weight: question.weight,
        tkpScoreA: question.tkpScoring?.a || 5,
        tkpScoreB: question.tkpScoring?.b || 4,
        tkpScoreC: question.tkpScoring?.c || 3,
        tkpScoreD: question.tkpScoring?.d || 2,
        tkpScoreE: question.tkpScoring?.e || 1,
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        questionText: '',
        questionImage: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        optionE: '',
        correctAnswer: 'a',
        explanation: '',
        category: 'TWK',
        subcategory: '',
        weight: 1,
        tkpScoreA: 5,
        tkpScoreB: 4,
        tkpScoreC: 3,
        tkpScoreD: 2,
        tkpScoreE: 1,
      });
    }
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!formData.questionText.trim()) {
      toast({
        title: 'Error',
        description: 'Pertanyaan harus diisi',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.optionA.trim() || !formData.optionB.trim() || !formData.optionC.trim() ||
        !formData.optionD.trim() || !formData.optionE.trim()) {
      toast({
        title: 'Error',
        description: 'Semua pilihan jawaban (A-E) harus diisi',
        variant: 'destructive',
      });
      return;
    }

    try {
      const questionData: any = {
        questionText: formData.questionText,
        options: {
          a: formData.optionA,
          b: formData.optionB,
          c: formData.optionC,
          d: formData.optionD,
          e: formData.optionE,
        },
        correctAnswer: formData.correctAnswer,
        category: formData.category,
        weight: formData.weight,
      };

      if (formData.questionImage.trim()) {
        questionData.questionImage = formData.questionImage.trim();
      }

      if (formData.explanation.trim()) {
        questionData.explanation = formData.explanation.trim();
      }

      if (formData.subcategory.trim()) {
        questionData.subcategory = formData.subcategory.trim();
      }

      if (formData.category === 'TKP') {
        questionData.tkpScoring = {
          a: formData.tkpScoreA,
          b: formData.tkpScoreB,
          c: formData.tkpScoreC,
          d: formData.tkpScoreD,
          e: formData.tkpScoreE,
        };
      }

      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, questionData);
        toast({
          title: 'Berhasil',
          description: 'Soal berhasil diperbarui',
        });
      } else {
        await createQuestion(questionData as Omit<Question, 'id'>);
        toast({
          title: 'Berhasil',
          description: 'Soal berhasil ditambahkan',
        });
      }

      setShowDialog(false);
      loadQuestions();
    } catch (error: any) {
      console.error('Error saving question:', error);

      let errorMessage = 'Gagal menyimpan soal';
      let errorDescription = 'Terjadi kesalahan saat menyimpan soal';

      if (error?.code === 'permission-denied') {
        errorMessage = 'Permission Denied';
        errorDescription = 'Anda tidak memiliki akses untuk membuat soal. Pastikan: 1) Anda login sebagai admin 2) Firebase Rules sudah di-setup dengan benar. Lihat file SETUP_FIREBASE_RULES.md';
      } else if (error?.message) {
        errorDescription = error.message;
      }

      toast({
        title: errorMessage,
        description: errorDescription,
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!confirm('Yakin ingin menghapus soal ini?')) return;

    try {
      await deleteQuestion(questionId);
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

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || q.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Kelola Soal</h1>
          <p className="text-sm text-gray-600 mt-1">Buat dan kelola bank soal try out</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Soal
        </Button>
      </div>

      <Card className="border border-gray-200">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari soal..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="TWK">TWK</SelectItem>
                <SelectItem value="TIU">TIU</SelectItem>
                <SelectItem value="TKP">TKP</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">Memuat soal...</p>
        </div>
      ) : (
        <div className="space-y-2">
            {filteredQuestions.map((question, index) => {
              const isExpanded = expandedQuestions.has(question.id);

              return (
                <div key={question.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between gap-4 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleQuestion(question.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {question.category}
                      </Badge>
                      <span className="text-xs text-gray-500 flex-shrink-0">#{index + 1}</span>
                      {question.subcategory && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">{question.subcategory}</Badge>
                      )}
                      <p className="text-sm text-gray-900 truncate flex-1">{question.questionText}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(question);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(question.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-2"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
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
                        <div className="px-4 pb-4 pt-2 border-t border-gray-200 bg-gray-50">
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Pertanyaan:</p>
                            <p className="text-sm text-gray-900 whitespace-pre-wrap">{question.questionText}</p>
                            {question.questionImage && (
                              <img
                                src={question.questionImage}
                                alt="Question"
                                className="mt-2 max-w-md rounded border border-gray-200"
                              />
                            )}
                          </div>

                          <div className="space-y-2 mb-3">
                            <p className="text-sm font-medium text-gray-700">Pilihan Jawaban:</p>
                            {['a', 'b', 'c', 'd', 'e'].map((option) => (
                              <div
                                key={option}
                                className={`p-3 rounded border ${
                                  question.correctAnswer === option
                                    ? 'bg-green-50 border-green-300'
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-sm text-gray-900 flex-1">
                                    <span className="font-medium mr-2">{option.toUpperCase()}.</span>
                                    {question.options[option as keyof typeof question.options]}
                                  </p>
                                  {question.category === 'TKP' && question.tkpScoring && (
                                    <Badge variant="outline" className="ml-2 text-xs bg-orange-50 text-orange-700 border-orange-300">
                                      {question.tkpScoring[option as 'a' | 'b' | 'c' | 'd' | 'e']} poin
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {question.explanation && (
                            <div className="p-3 bg-blue-50 rounded border border-blue-200">
                              <p className="text-xs font-medium text-blue-900 mb-2">Pembahasan:</p>
                              <p className="text-sm text-blue-800 whitespace-pre-wrap">{question.explanation}</p>
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
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-base">Tidak ada soal ditemukan</p>
                <p className="text-gray-500 text-sm mt-2">Coba ubah filter atau kata kunci pencarian</p>
              </div>
            )}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {editingQuestion ? 'Edit Soal' : 'Tambah Soal Baru'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TWK">TWK</SelectItem>
                    <SelectItem value="TIU">TIU</SelectItem>
                    <SelectItem value="TKP">TKP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Subkategori (Opsional)</Label>
                <Input
                  value={formData.subcategory}
                  onChange={(e) =>
                    setFormData({ ...formData, subcategory: e.target.value })
                  }
                  placeholder="Misal: Pancasila, Logika, dll"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Pertanyaan</Label>
              <textarea
                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={formData.questionText}
                onChange={(e) =>
                  setFormData({ ...formData, questionText: e.target.value })
                }
                placeholder="Tuliskan pertanyaan..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">URL Gambar (Opsional)</Label>
              <Input
                value={formData.questionImage}
                onChange={(e) =>
                  setFormData({ ...formData, questionImage: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium text-gray-700">Pilihan Jawaban</Label>
              <div className="space-y-2">
                {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                  <div key={letter} className="flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-medium text-sm flex-shrink-0">
                      {letter}
                    </div>
                    <Input
                      value={formData[`option${letter}` as keyof typeof formData] as string}
                      onChange={(e) =>
                        setFormData({ ...formData, [`option${letter}`]: e.target.value })
                      }
                      placeholder={`Pilihan ${letter}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Jawaban Benar</Label>
              <Select
                value={formData.correctAnswer}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, correctAnswer: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">A</SelectItem>
                  <SelectItem value="b">B</SelectItem>
                  <SelectItem value="c">C</SelectItem>
                  <SelectItem value="d">D</SelectItem>
                  <SelectItem value="e">E</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.category === 'TKP' && (
              <div className="space-y-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-semibold text-orange-900">Pembobotan TKP (5-0)</Label>
                  <span className="text-xs text-orange-700">Sesuaikan skor untuk setiap pilihan jawaban</span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                    <div key={letter} className="space-y-1">
                      <Label className="text-xs font-medium text-gray-700">Opsi {letter}</Label>
                      <Select
                        value={String(formData[`tkpScore${letter}` as keyof typeof formData])}
                        onValueChange={(value) =>
                          setFormData({ ...formData, [`tkpScore${letter}`]: parseInt(value) })
                        }
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="0">0</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-orange-700 mt-2">
                  Skor tertinggi (5) untuk jawaban terbaik, skor terendah (0) untuk jawaban terburuk
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Pembahasan (Opsional)</Label>
              <textarea
                className="w-full min-h-[80px] p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                value={formData.explanation}
                onChange={(e) =>
                  setFormData({ ...formData, explanation: e.target.value })
                }
                placeholder="Pembahasan jawaban..."
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Batal
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingQuestion ? 'Simpan Perubahan' : 'Tambah Soal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
