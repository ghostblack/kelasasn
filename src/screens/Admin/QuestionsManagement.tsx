import React, { useEffect, useState } from 'react';
import { Question } from '@/types';
import { getAllQuestions, createQuestion, updateQuestion, deleteQuestion, removeQuestionFromAllTryouts } from '@/services/questionService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, CreditCard as Edit2, Trash2, Search, Save, X, ChevronDown, ChevronUp, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImportQuestionsDialog } from './ImportQuestionsDialog';

export const QuestionsManagement: React.FC = () => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
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
        correctAnswer: question.correctAnswer as 'a' | 'b' | 'c' | 'd' | 'e',
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
    setConfirmingDeleteId(questionId);
  };

  const executeDelete = async () => {
    if (!confirmingDeleteId) return;
    const questionId = confirmingDeleteId;
    setConfirmingDeleteId(null);

    try {
      setDeletingIds(prev => new Set(prev).add(questionId));
      
      // 1. Bersihkan dari semua tryout
      await removeQuestionFromAllTryouts(questionId);
      
      // 2. Hapus dokumen soal
      await deleteQuestion(questionId);
      
      toast({
        title: 'Berhasil',
        description: 'Soal berhasil dihapus',
      });
      loadQuestions();
    } catch (error: any) {
      console.error('Error deleting question:', error);
      let errorDescription = 'Gagal menghapus soal';
      
      if (error?.code === 'permission-denied') {
        errorDescription = 'Permission Denied: Anda tidak memiliki akses untuk menghapus soal.';
      }

      toast({
        title: 'Error',
        description: errorDescription,
        variant: 'destructive',
      });
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
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
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-10">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-gray-400 capitalize tracking-wider">Content Repository</span>
           </div>
           <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
             Kelola <span className="text-gray-400 font-medium ml-2">Soal</span>
           </h1>
           <p className="text-sm text-gray-500 mt-4 leading-relaxed max-w-xl">
             Kumpulan bank soal untuk Try Out. Kelola pertanyaan, pilihan jawaban, dan pembobotan skor secara terpusat.
           </p>
        </div>
        <div className="flex items-center gap-3">
           <Button
             onClick={() => handleOpenDialog()}
             className="bg-gray-900 hover:bg-black text-white px-6 h-11 rounded-none text-xs font-bold uppercase tracking-widest transition-all shadow-sm"
           >
             <Plus className="w-4 h-4 mr-2" />
             Tambah Soal
           </Button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 p-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari soal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 rounded-none border-gray-100 bg-gray-50/50 focus:bg-white transition-all text-sm"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40 h-11 rounded-none border-gray-100 bg-gray-50/50">
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

      {loading ? (
        <div className="text-center py-24 bg-white border border-gray-100">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-xs font-bold uppercase tracking-widest">Memuat Soal...</p>
        </div>
      ) : (
        <div className="space-y-3">
            {filteredQuestions.map((question, index) => {
              const isExpanded = expandedQuestions.has(question.id);

              return (
                <div key={question.id} className="bg-white border border-gray-100 rounded-none transition-all hover:border-gray-200 shadow-sm">
                  <div
                    className="flex items-center justify-between gap-4 p-5 cursor-pointer"
                    onClick={() => toggleQuestion(question.id)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0">
                        {index + 1}
                      </div>
                      <Badge className="bg-blue-50 text-blue-600 rounded-none border-none text-[10px] font-bold uppercase tracking-widest flex-shrink-0">
                        {question.category}
                      </Badge>
                      {question.subcategory && (
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest flex-shrink-0">{question.subcategory}</span>
                      )}
                      <p className="text-sm font-medium text-gray-900 truncate flex-1">{question.questionText}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 hover:bg-gray-50 rounded-none"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog(question);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={deletingIds.has(question.id)}
                        className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-none relative"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(question.id);
                        }}
                      >
                        {deletingIds.has(question.id) ? (
                          <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 rounded-none text-gray-400"
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

      {/* Confirmation Dialog for Deletion */}
      <Dialog open={!!confirmingDeleteId} onOpenChange={(open) => !open && setConfirmingDeleteId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-900 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Konfirmasi Hapus Soal
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus soal ini secara permanen? 
              <span className="block mt-2 font-semibold text-red-600">
                Soal ini juga akan otomatis dihapus dari semua paket try out yang menggunakannya.
              </span>
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmingDeleteId(null)}
              className="rounded-none h-11"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={executeDelete}
              className="rounded-none h-11 bg-red-600 hover:bg-red-700"
            >
              Hapus Secara Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ImportQuestionsDialog 
        isOpen={showImportDialog} 
        onOpenChange={setShowImportDialog}
        onSuccess={loadQuestions}
      />
    </div>
  );
};
