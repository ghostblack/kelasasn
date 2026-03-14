import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';
import { createQuestion, getQuestionById, updateQuestion } from '@/services/questionService';
import { Question } from '@/types';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const TryoutQuestionInput: React.FC = () => {
  const navigate = useNavigate();
  const { tryoutId, category, questionId } = useParams<{ tryoutId: string; category: string; questionId?: string }>();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [showPreview, setShowPreview] = useState(true);
  const isEditMode = !!questionId;

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
    subcategory: '',
    weight: 1,
    tkpScoreA: 5,
    tkpScoreB: 4,
    tkpScoreC: 3,
    tkpScoreD: 2,
    tkpScoreE: 1,
  });

  const categoryName = category?.toUpperCase() || 'TWK';
  const isTKP = categoryName === 'TKP';

  useEffect(() => {
    if (isEditMode && questionId) {
      loadQuestion();
    }
  }, [questionId]);

  const loadQuestion = async () => {
    if (!questionId) return;

    setLoading(true);
    try {
      const question = await getQuestionById(questionId);
      if (question) {
        setFormData({
          questionText: question.questionText,
          questionImage: question.questionImage || '',
          optionA: question.options.a,
          optionB: question.options.b,
          optionC: question.options.c,
          optionD: question.options.d,
          optionE: question.options.e,
          correctAnswer: (question.correctAnswer?.toLowerCase() as any) || 'a',
          explanation: question.explanation || '',
          subcategory: question.subcategory || '',
          weight: question.weight || 1,
          tkpScoreA: question.tkpScoring?.a || 5,
          tkpScoreB: question.tkpScoring?.b || 4,
          tkpScoreC: question.tkpScoring?.c || 3,
          tkpScoreD: question.tkpScoring?.d || 2,
          tkpScoreE: question.tkpScoring?.e || 1,
        });
      }
    } catch (error) {
      console.error('Error loading question:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data soal',
        variant: 'destructive',
      });
      navigate(`/admin/tryouts/${tryoutId}/questions/${category}/list`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
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
      subcategory: '',
      weight: 1,
      tkpScoreA: 5,
      tkpScoreB: 4,
      tkpScoreC: 3,
      tkpScoreD: 2,
      tkpScoreE: 1,
    });
  };

  const validateForm = () => {
    if (!formData.questionText.trim()) {
      toast({ title: 'Input Error', description: 'Pertanyaan tidak boleh kosong', variant: 'destructive' });
      return false;
    }
    if (!formData.optionA.trim() || !formData.optionB.trim() || !formData.optionC.trim() || !formData.optionD.trim() || !formData.optionE.trim()) {
      toast({ title: 'Input Error', description: 'Semua pilihan jawaban A-E wajib diisi', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSave = async (saveAndNew: boolean = false) => {
    if (!validateForm()) return;

    setSaving(true);
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
        category: categoryName,
        weight: formData.weight,
        tryoutId: tryoutId || '',
      };

      if (!isTKP) questionData.correctAnswer = formData.correctAnswer;
      if (formData.questionImage.trim()) questionData.questionImage = formData.questionImage.trim();
      if (formData.explanation.trim()) questionData.explanation = formData.explanation.trim();
      if (formData.subcategory.trim()) questionData.subcategory = formData.subcategory.trim();
      if (isTKP) {
        questionData.tkpScoring = {
          a: formData.tkpScoreA,
          b: formData.tkpScoreB,
          c: formData.tkpScoreC,
          d: formData.tkpScoreD,
          e: formData.tkpScoreE,
        };
      }

      if (isEditMode && questionId) {
        await updateQuestion(questionId, questionData);
        toast({ title: 'Success', description: 'Soal berhasil diperbarui' });
        navigate(`/admin/tryouts/${tryoutId}/questions/${category}/list`);
      } else {
        await createQuestion(questionData as Omit<Question, 'id'>);
        toast({ title: 'Success', description: 'Soal berhasil ditambahkan' });
        if (saveAndNew) {
          resetForm();
          setActiveTab('content');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          navigate(`/admin/tryouts/${tryoutId}/questions/${category}/list`);
        }
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Gagal menyimpan soal', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-gray-100 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between border-b border-gray-100 pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/admin/tryouts/${tryoutId}/questions/${category}/list`)}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 border border-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              {isEditMode ? 'Edit' : 'New'} <span className="text-blue-600">{categoryName}</span> Question
            </h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Management Console</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className={`text-xs font-bold uppercase tracking-widest px-4 h-10 border border-gray-100 rounded-none transition-all ${showPreview ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-400'}`}
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          {!isEditMode && (
            <Button
              variant="outline"
              className="text-xs font-bold uppercase tracking-widest px-4 h-10 border border-gray-100 rounded-none text-gray-400 hover:text-gray-900"
              onClick={() => navigate(`/admin/tryouts/${tryoutId}/questions/${category}/list`)}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className={`grid gap-12 transition-all duration-500 ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        <div className="space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full h-auto p-0 bg-transparent border-b border-gray-100 rounded-none gap-8">
              <TabsTrigger
                value="content"
                className="rounded-none border-b-2 border-transparent px-0 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 data-[state=active]:bg-transparent data-[state=active]:border-blue-600 data-[state=active]:text-gray-900"
              >
                1. Content
              </TabsTrigger>
              <TabsTrigger
                value="scoring"
                className="rounded-none border-b-2 border-transparent px-0 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 data-[state=active]:bg-transparent data-[state=active]:border-blue-600 data-[state=active]:text-gray-900"
              >
                2. Scoring
              </TabsTrigger>
              <TabsTrigger
                value="explanation"
                className="rounded-none border-b-2 border-transparent px-0 py-4 text-xs font-bold uppercase tracking-widest text-gray-400 data-[state=active]:bg-transparent data-[state=active]:border-blue-600 data-[state=active]:text-gray-900"
              >
                3. Metadata
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="pt-8 space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pertanyaan</Label>
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Required</span>
                </div>
                <textarea
                  className="w-full min-h-[160px] p-4 text-sm border border-gray-100 focus:outline-none focus:border-blue-600 transition-colors bg-white resize-y"
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  placeholder="Masukkan teks soal di sini..."
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pilihan Jawaban</Label>
                <div className="space-y-4">
                  {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                    <div key={letter} className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center border border-gray-100 text-[10px] font-bold text-gray-400">
                        {letter}
                      </div>
                      <Input
                        className="pl-16 h-14 border-gray-100 focus-visible:ring-0 focus-visible:border-blue-600 rounded-none text-sm"
                        value={formData[`option${letter}` as keyof typeof formData] as string}
                        onChange={(e) => setFormData({ ...formData, [`option${letter}`]: e.target.value })}
                        placeholder={`Teks pilihan ${letter}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Ilustrasi Gambar (Opsional)</Label>
                <Input
                  className="h-12 border-gray-100 focus-visible:ring-0 focus-visible:border-blue-600 rounded-none text-sm"
                  value={formData.questionImage}
                  onChange={(e) => setFormData({ ...formData, questionImage: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </TabsContent>

            <TabsContent value="scoring" className="pt-8 space-y-8 animate-in fade-in slide-in-from-bottom-2">
              {!isTKP ? (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Kunci Jawaban</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {['a', 'b', 'c', 'd', 'e'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setFormData({ ...formData, correctAnswer: opt as any })}
                          className={`h-14 flex items-center justify-center border font-bold text-sm transition-all ${
                            formData.correctAnswer === opt
                              ? 'bg-gray-900 border-gray-900 text-white'
                              : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                          }`}
                        >
                          {opt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Bobot Nilai</Label>
                    <Input
                      type="number"
                      className="h-14 border-gray-100 focus-visible:ring-0 focus-visible:border-blue-600 rounded-none text-sm"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-orange-50 border border-orange-100 text-[10px] font-bold text-orange-700 uppercase tracking-widest">
                    Mode TKP: Berikan skor 1-5 untuk setiap pilihan jawaban
                  </div>
                  <div className="space-y-4">
                    {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                      <div key={letter} className="flex items-center gap-4">
                        <div className="w-10 h-10 flex items-center justify-center border border-gray-100 text-xs font-bold text-gray-900">
                          {letter}
                        </div>
                        <Select
                          value={String(formData[`tkpScore${letter}` as keyof typeof formData])}
                          onValueChange={(v) => setFormData({ ...formData, [`tkpScore${letter}`]: parseInt(v) })}
                        >
                          <SelectTrigger className="grow h-14 border-gray-100 rounded-none focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-none border-gray-100">
                            {[5, 4, 3, 2, 1, 0].map(s => (
                              <SelectItem key={s} value={String(s)}>{s} Poin</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="explanation" className="pt-8 space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pembahasan</Label>
                <textarea
                  className="w-full min-h-[160px] p-4 text-sm border border-gray-100 focus:outline-none focus:border-blue-600 transition-colors bg-white resize-y"
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Berikan penjelasan jawaban di sini..."
                />
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Subkategori</Label>
                <Input
                  className="h-14 border-gray-100 focus-visible:ring-0 focus-visible:border-blue-600 rounded-none text-sm"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder={isTKP ? "e.g. Integritas" : "e.g. Nasionalisme"}
                />
              </div>
            </TabsContent>
          </Tabs>

          <footer className="pt-8 flex items-center gap-4">
            <Button
              className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-none text-xs font-bold uppercase tracking-widest transition-all"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : isEditMode ? 'Update' : 'Save'}
            </Button>
            {!isEditMode && (
              <Button
                variant="outline"
                className="h-14 border-gray-100 hover:border-blue-600 hover:text-blue-600 rounded-none text-xs font-bold uppercase tracking-widest transition-all px-8"
                onClick={() => handleSave(true)}
                disabled={saving}
              >
                Save & Add Next
              </Button>
            )}
          </footer>
        </div>

        {showPreview && (
          <div className="sticky top-28 h-fit animate-in fade-in slide-in-from-right-4">
            <div className="flex flex-col border border-gray-100 h-[700px] bg-gray-50/50 relative overflow-hidden">
              <header className="px-6 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Student Preview</span>
                <div className="flex gap-1 h-1 bg-gray-100 w-20 rounded-full overflow-hidden">
                   <div className="w-1/3 bg-blue-500" />
                </div>
              </header>
              <div className="p-10 overflow-auto bg-white flex-1">
                <div className="space-y-10 max-w-sm mx-auto">
                   <div className="space-y-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 flex items-center justify-center border-2 border-gray-900 text-sm font-bold">1</div>
                         <div className="h-0.5 grow bg-gray-100" />
                      </div>
                      <p className="text-base text-gray-900 leading-relaxed font-medium">
                        {formData.questionText || 'Pratinjau teks pertanyaan belum tersedia...'}
                      </p>
                   </div>

                   {formData.questionImage && (
                     <img src={formData.questionImage} alt="Preview" className="w-full h-48 object-cover border border-gray-100 grayscale hover:grayscale-0 transition-all opacity-50" />
                   )}

                   <div className="space-y-4">
                      {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                        <div
                          key={letter}
                          className={`p-5 border flex items-center gap-4 transition-all ${
                            !isTKP && formData.correctAnswer === letter.toLowerCase()
                            ? 'bg-blue-50/50 border-blue-200'
                            : 'bg-white border-gray-100'
                          }`}
                        >
                          <div className={`w-8 h-8 flex items-center justify-center text-xs font-bold border ${
                            !isTKP && formData.correctAnswer === letter.toLowerCase()
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-gray-100 text-gray-400'
                          }`}>
                            {letter}
                          </div>
                          <span className={`text-sm font-medium ${
                             !isTKP && formData.correctAnswer === letter.toLowerCase()
                             ? 'text-blue-900'
                             : 'text-gray-500'
                          }`}>
                            {formData[`option${letter}` as keyof typeof formData] || `Option ${letter}...`}
                          </span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
              <footer className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <div className="w-10 h-10 border border-gray-200" />
                <div className="h-10 px-8 border border-gray-200 flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-300 bg-white">
                   Next Question
                </div>
              </footer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
