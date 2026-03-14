import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, List, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { createQuestion, getQuestionById, updateQuestion } from '@/services/questionService';
import { Question } from '@/types';

export const TryoutQuestionInput: React.FC = () => {
  const navigate = useNavigate();
  const { tryoutId, category, questionId } = useParams<{ tryoutId: string; category: string; questionId?: string }>();
  const { toast } = useToast();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const categoryInfo = {
    TWK: {
      title: 'Tes Wawasan Kebangsaan',
      color: 'bg-blue-600',
      description: 'Input soal tentang wawasan kebangsaan',
    },
    TIU: {
      title: 'Tes Intelegensia Umum',
      color: 'bg-purple-600',
      description: 'Input soal tentang kemampuan verbal, numerik, dan figural',
    },
    TKP: {
      title: 'Tes Karakteristik Pribadi',
      color: 'bg-orange-600',
      description: 'Input soal tentang karakteristik pribadi',
    },
  }[categoryName as 'TWK' | 'TIU' | 'TKP'];

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
          correctAnswer: question.correctAnswer || 'a',
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
      toast({
        title: 'Error',
        description: 'Pertanyaan harus diisi',
        variant: 'destructive',
      });
      return false;
    }

    if (
      !formData.optionA.trim() ||
      !formData.optionB.trim() ||
      !formData.optionC.trim() ||
      !formData.optionD.trim() ||
      !formData.optionE.trim()
    ) {
      toast({
        title: 'Error',
        description: 'Semua pilihan jawaban (A-E) harus diisi',
        variant: 'destructive',
      });
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

      if (!isTKP) {
        questionData.correctAnswer = formData.correctAnswer;
      }

      if (formData.questionImage.trim()) {
        questionData.questionImage = formData.questionImage.trim();
      }

      if (formData.explanation.trim()) {
        questionData.explanation = formData.explanation.trim();
      }

      if (formData.subcategory.trim()) {
        questionData.subcategory = formData.subcategory.trim();
      }

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
        toast({
          title: 'Berhasil',
          description: 'Soal berhasil diperbarui',
        });
        navigate(`/admin/tryouts/${tryoutId}/questions/${category}/list`);
      } else {
        await createQuestion(questionData as Omit<Question, 'id'>);

        toast({
          title: 'Berhasil',
          description: 'Soal berhasil disimpan untuk tryout ini',
        });

        if (saveAndNew) {
          resetForm();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          navigate(`/admin/tryouts/${tryoutId}/questions/${category}/list`);
        }
      }
    } catch (error: any) {
      console.error('Error saving question:', error);

      let errorMessage = 'Gagal menyimpan soal';
      let errorDescription = 'Terjadi kesalahan saat menyimpan soal';

      if (error?.code === 'permission-denied') {
        errorMessage = 'Permission Denied';
        errorDescription = 'Anda tidak memiliki akses untuk membuat soal';
      } else if (error?.message) {
        errorDescription = error.message;
      }

      toast({
        title: errorMessage,
        description: errorDescription,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data soal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/admin/tryouts/${tryoutId}/questions/${category}/list`)}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {isEditMode ? 'Edit' : 'Tambah'} Soal {categoryName}
              </h1>
              <p className="text-sm text-gray-500">{categoryInfo?.description}</p>
            </div>
          </div>
          {!isEditMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/admin/tryouts/${tryoutId}/questions/${category}/list`)}
            >
              <List className="w-4 h-4 mr-2" />
              Daftar Soal
            </Button>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Form Input Soal</CardTitle>
            {isTKP && (
              <p className="text-sm text-orange-600 mt-1">
                TKP: Atur skor untuk setiap pilihan (1-5 poin)
              </p>
            )}
          </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Pertanyaan *</Label>
                <textarea
                  className="w-full min-h-[100px] p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.questionText}
                  onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                  placeholder="Tulis pertanyaan..."
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">URL Gambar (opsional)</Label>
                <Input
                  className="text-sm"
                  value={formData.questionImage}
                  onChange={(e) => setFormData({ ...formData, questionImage: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Pilihan Jawaban *
                </Label>
                <div className="space-y-2">
                  {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                    <div key={letter} className="flex gap-2 items-center">
                      <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center font-medium text-xs flex-shrink-0">
                        {letter}
                      </div>
                      <Input
                        className="text-sm flex-1"
                        value={formData[`option${letter}` as keyof typeof formData] as string}
                        onChange={(e) =>
                          setFormData({ ...formData, [`option${letter}`]: e.target.value })
                        }
                        placeholder={`Pilihan ${letter}`}
                      />
                      {isTKP && (
                        <Select
                          value={String(formData[`tkpScore${letter}` as keyof typeof formData])}
                          onValueChange={(value) =>
                            setFormData({ ...formData, [`tkpScore${letter}`]: parseInt(value) })
                          }
                        >
                          <SelectTrigger className="w-20 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[5, 4, 3, 2, 1, 0].map(score => (
                              <SelectItem key={score} value={String(score)}>{score}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {!isTKP && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Jawaban Benar *</Label>
                  <Select
                    value={formData.correctAnswer}
                    onValueChange={(value: any) => setFormData({ ...formData, correctAnswer: value })}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['a', 'b', 'c', 'd', 'e'].map(opt => (
                        <SelectItem key={opt} value={opt}>{opt.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Subkategori (opsional)</Label>
                <Input
                  className="text-sm"
                  value={formData.subcategory}
                  onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  placeholder={isTKP ? "Contoh: Integritas" : "Contoh: Pancasila"}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Pembahasan (opsional)</Label>
                <textarea
                  className="w-full min-h-[80px] p-3 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Pembahasan jawaban..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/admin/tryouts/${tryoutId}/questions/${category}/list`)}
            >
              Kembali
            </Button>
            <div className="flex gap-2">
              {!isEditMode && (
                <Button
                  variant="outline"
                  onClick={() => handleSave(true)}
                  disabled={saving}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Simpan & Buat Baru
                </Button>
              )}
              <Button
                onClick={() => handleSave(false)}
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Menyimpan...' : isEditMode ? 'Update' : 'Simpan'}
              </Button>
            </div>
          </div>
    </div>
  );
};
