import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Loader } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { findMissingQuestionsForTryout, recoverTryoutQuestions } from '@/utils/questionRecovery';
import { Question } from '@/types';

interface QuestionRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  tryoutId: string;
  tryoutName: string;
  onRecoveryComplete?: () => void;
}

export const QuestionRecoveryModal: React.FC<QuestionRecoveryModalProps> = ({
  isOpen,
  onClose,
  tryoutId,
  tryoutName,
  onRecoveryComplete,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [missingQuestions, setMissingQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    twk: 0,
    tiu: 0,
    tkp: 0,
  });

  useEffect(() => {
    if (isOpen) {
      loadMissingQuestions();
    }
  }, [isOpen]);

  const loadMissingQuestions = async () => {
    setLoading(true);
    try {
      const questions = await findMissingQuestionsForTryout(tryoutId);
      setMissingQuestions(questions);

      const twk = questions.filter(q => q.category === 'TWK').length;
      const tiu = questions.filter(q => q.category === 'TIU').length;
      const tkp = questions.filter(q => q.category === 'TKP').length;

      setStats({ twk, tiu, tkp });
      setSelectedQuestions(new Set(questions.map(q => q.id)));
    } catch (error) {
      console.error('Error loading missing questions:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat soal yang hilang',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestion = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedQuestions.size === missingQuestions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(missingQuestions.map(q => q.id)));
    }
  };

  const handleRecover = async () => {
    if (selectedQuestions.size === 0) {
      toast({
        title: 'Error',
        description: 'Pilih minimal satu soal untuk di-recover',
        variant: 'destructive',
      });
      return;
    }

    setRecovering(true);
    try {
      const result = await recoverTryoutQuestions(tryoutId, Array.from(selectedQuestions));

      toast({
        title: 'Berhasil',
        description: `${result.totalRecovered} soal berhasil di-recover: TWK (${result.twkRecovered}), TIU (${result.tiuRecovered}), TKP (${result.tkpRecovered})`,
      });

      onRecoveryComplete?.();
      onClose();
    } catch (error) {
      console.error('Error recovering questions:', error);
      toast({
        title: 'Error',
        description: 'Gagal melakukan recovery soal',
        variant: 'destructive',
      });
    } finally {
      setRecovering(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recovery Soal - {tryoutName}</DialogTitle>
          <DialogDescription>
            Pulihkan soal yang hilang dari database untuk paket ini
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span>Memuat soal yang hilang...</span>
          </div>
        ) : missingQuestions.length === 0 ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-900">Tidak Ada Soal yang Hilang</AlertTitle>
            <AlertDescription className="text-green-800">
              Semua soal untuk paket ini sudah lengkap.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">Soal Ditemukan</AlertTitle>
              <AlertDescription className="text-blue-800">
                Ditemukan {missingQuestions.length} soal yang dapat dipulihkan
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-3 gap-3">
              <Card className="border-blue-200">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">TWK</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.twk}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-purple-200">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">TIU</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.tiu}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-orange-200">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">TKP</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.tkp}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedQuestions.size === missingQuestions.length}
                    onChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">Pilih Semua ({missingQuestions.length})</span>
                </div>
                <span className="text-sm text-gray-600">
                  {selectedQuestions.size} dipilih
                </span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {missingQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedQuestions.has(question.id)}
                      onChange={() => handleSelectQuestion(question.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {question.category}
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
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={recovering}>
            Batal
          </Button>
          <Button
            onClick={handleRecover}
            disabled={
              recovering || loading || missingQuestions.length === 0 || selectedQuestions.size === 0
            }
            className="bg-green-600 hover:bg-green-700"
          >
            {recovering ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                Melakukan Recovery...
              </>
            ) : (
              `Recovery ${selectedQuestions.size} Soal`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
