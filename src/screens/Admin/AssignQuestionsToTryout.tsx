import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Link2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getTryoutById } from '@/services/tryoutService';
import { getQuestionsByCategory, addQuestionToTryout } from '@/services/questionService';
import { Question } from '@/types';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const AssignQuestionsToTryout: React.FC = () => {
  const navigate = useNavigate();
  const { tryoutId } = useParams<{ tryoutId: string }>();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [tryoutName, setTryoutName] = useState('');
  const [currentQuestionIds, setCurrentQuestionIds] = useState<string[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<{
    TWK: Question[];
    TIU: Question[];
    TKP: Question[];
  }>({ TWK: [], TIU: [], TKP: [] });
  const [selectedQuestions, setSelectedQuestions] = useState<{
    TWK: string[];
    TIU: string[];
    TKP: string[];
  }>({ TWK: [], TIU: [], TKP: [] });
  const [requiredCounts, setRequiredCounts] = useState({
    TWK: 0,
    TIU: 0,
    TKP: 0,
  });

  useEffect(() => {
    if (tryoutId) {
      loadData();
    }
  }, [tryoutId]);

  const loadData = async () => {
    if (!tryoutId) return;

    try {
      setLoading(true);

      const tryout = await getTryoutById(tryoutId);
      if (!tryout) {
        toast({
          title: 'Error',
          description: 'Try out tidak ditemukan',
          variant: 'destructive',
        });
        navigate('/admin/tryouts');
        return;
      }

      setTryoutName(tryout.name);
      setCurrentQuestionIds(tryout.questionIds || []);
      setRequiredCounts({
        TWK: tryout.twkQuestions,
        TIU: tryout.tiuQuestions,
        TKP: tryout.tkpQuestions,
      });

      const twkQuestions = await getQuestionsByCategory('TWK');
      const tiuQuestions = await getQuestionsByCategory('TIU');
      const tkpQuestions = await getQuestionsByCategory('TKP');

      const assignedIds = new Set(tryout.questionIds || []);

      setAvailableQuestions({
        TWK: twkQuestions.filter(q => !assignedIds.has(q.id)),
        TIU: tiuQuestions.filter(q => !assignedIds.has(q.id)),
        TKP: tkpQuestions.filter(q => !assignedIds.has(q.id)),
      });

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = (category: 'TWK' | 'TIU' | 'TKP') => {
    const required = requiredCounts[category];
    const available = availableQuestions[category];

    if (available.length < required) {
      toast({
        title: 'Soal Tidak Cukup',
        description: `Hanya tersedia ${available.length} soal ${category}, dibutuhkan ${required} soal`,
        variant: 'destructive',
      });
      return;
    }

    const selected = available.slice(0, required).map(q => q.id);
    setSelectedQuestions(prev => ({
      ...prev,
      [category]: selected,
    }));

    toast({
      title: 'Berhasil',
      description: `${selected.length} soal ${category} dipilih`,
    });
  };

  const handleAssignToTryout = async () => {
    if (!tryoutId) return;

    const totalSelected =
      selectedQuestions.TWK.length +
      selectedQuestions.TIU.length +
      selectedQuestions.TKP.length;

    if (totalSelected === 0) {
      toast({
        title: 'Tidak Ada Soal Dipilih',
        description: 'Pilih soal terlebih dahulu atau gunakan Auto Assign',
        variant: 'destructive',
      });
      return;
    }

    try {
      setAssigning(true);

      const allSelectedIds = [
        ...selectedQuestions.TWK,
        ...selectedQuestions.TIU,
        ...selectedQuestions.TKP,
      ];

      const tryoutRef = doc(db, 'tryout_packages', tryoutId);
      const newQuestionIds = [...new Set([...currentQuestionIds, ...allSelectedIds])];

      await updateDoc(tryoutRef, {
        questionIds: newQuestionIds,
      });

      toast({
        title: 'Berhasil',
        description: `${totalSelected} soal berhasil ditambahkan ke try out`,
      });

      await loadData();

      setSelectedQuestions({ TWK: [], TIU: [], TKP: [] });

    } catch (error) {
      console.error('Error assigning questions:', error);
      toast({
        title: 'Error',
        description: 'Gagal menambahkan soal ke try out',
        variant: 'destructive',
      });
    } finally {
      setAssigning(false);
    }
  };

  const toggleQuestion = (category: 'TWK' | 'TIU' | 'TKP', questionId: string) => {
    setSelectedQuestions(prev => {
      const current = prev[category];
      if (current.includes(questionId)) {
        return {
          ...prev,
          [category]: current.filter(id => id !== questionId),
        };
      } else {
        const required = requiredCounts[category];
        if (current.length >= required) {
          toast({
            title: 'Maksimal Tercapai',
            description: `Maksimal ${required} soal ${category}`,
            variant: 'destructive',
          });
          return prev;
        }
        return {
          ...prev,
          [category]: [...current, questionId],
        };
      }
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
        <p className="mt-4 text-gray-600 text-sm">Memuat data...</p>
      </div>
    );
  }

  const categories: Array<{
    key: 'TWK' | 'TIU' | 'TKP';
    title: string;
    color: string;
  }> = [
    { key: 'TWK', title: 'Tes Wawasan Kebangsaan', color: 'bg-blue-600' },
    { key: 'TIU', title: 'Tes Intelegensia Umum', color: 'bg-purple-600' },
    { key: 'TKP', title: 'Tes Karakteristik Pribadi', color: 'bg-orange-600' },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/tryouts')}
            className="hover:bg-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Assign Soal ke Try Out</h1>
            <p className="text-sm text-slate-600 mt-1">{tryoutName}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {currentQuestionIds.length} soal sudah di-assign
        </Badge>
      </motion.div>

      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-blue-900">
                Panduan Assign Soal
              </p>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Gunakan tombol "Auto Assign" untuk memilih soal secara otomatis</li>
                <li>Atau pilih soal secara manual dengan klik pada setiap soal</li>
                <li>Setelah memilih, klik "Assign ke Try Out" untuk menyimpan</li>
                <li>Soal yang sudah di-assign tidak akan muncul di daftar ini</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {categories.map((cat) => {
        const available = availableQuestions[cat.key];
        const selected = selectedQuestions[cat.key];
        const required = requiredCounts[cat.key];
        const assigned = currentQuestionIds.filter(id =>
          available.some(q => q.id === id) || selected.includes(id)
        ).length;

        return (
          <motion.div
            key={cat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-2 border-gray-200">
              <CardHeader className="bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center`}>
                      <span className="text-white font-bold text-sm">{cat.key}</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold">{cat.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Dibutuhkan: {required} soal | Tersedia: {available.length} soal
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={selected.length >= required ? 'default' : 'secondary'}>
                      {selected.length} / {required} dipilih
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAutoAssign(cat.key)}
                      disabled={available.length < required}
                    >
                      Auto Assign
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {available.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">Tidak ada soal {cat.key} yang tersedia</p>
                    <p className="text-xs mt-1">Semua soal sudah di-assign atau belum ada soal</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {available.map((question, index) => {
                      const isSelected = selected.includes(question.id);
                      return (
                        <div
                          key={question.id}
                          onClick={() => toggleQuestion(cat.key, question.id)}
                          className={`p-3 border rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                                isSelected ? 'bg-blue-600' : 'bg-gray-200'
                              }`}
                            >
                              {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  #{index + 1}
                                </Badge>
                                {question.subcategory && (
                                  <Badge variant="secondary" className="text-xs">
                                    {question.subcategory}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-900 line-clamp-2">
                                {question.questionText}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-between items-center p-6 bg-white border border-gray-200 rounded-lg sticky bottom-0"
      >
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Total Dipilih: {selectedQuestions.TWK.length + selectedQuestions.TIU.length + selectedQuestions.TKP.length} soal
          </p>
          <p className="text-xs text-gray-600 mt-1">
            TWK: {selectedQuestions.TWK.length}, TIU: {selectedQuestions.TIU.length}, TKP: {selectedQuestions.TKP.length}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/tryouts')}
          >
            Batal
          </Button>
          <Button
            onClick={handleAssignToTryout}
            disabled={assigning || (selectedQuestions.TWK.length + selectedQuestions.TIU.length + selectedQuestions.TKP.length) === 0}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {assigning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 mr-2" />
                Assign ke Try Out
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
