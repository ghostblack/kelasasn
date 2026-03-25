import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTryoutById, getUserResultsByTryout, submitTryoutFeedback } from '@/services/tryoutService';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { TryoutResult, TryoutPackage } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingScreen } from '@/components/ui/spinner';
import { BookOpen, TrendingUp, Award, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const TryoutResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<TryoutResult | null>(null);
  const [allResults, setAllResults] = useState<TryoutResult[]>([]);
  const [tryout, setTryout] = useState<TryoutPackage | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<number>(0);
  const [feedbackGood, setFeedbackGood] = useState('');
  const [feedbackMissing, setFeedbackMissing] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    loadResult();
  }, [id, user, authLoading]);

  const loadResult = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      const results = await getUserResultsByTryout(user.uid, id);

      if (results.length === 0) {
        navigate(`/dashboard/tryout/${id}`);
        return;
      }

      setAllResults(results);
      setResult(results[0]);

      const tryoutData = await getTryoutById(id);
      setTryout(tryoutData);

    } catch (error) {
      console.error('Error loading result:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!id || !user || !tryout) return;
    if (!feedbackGood.trim() && !feedbackMissing.trim()) {
      toast({
        title: "Input Kosong",
        description: "Silakan isi feedback Anda",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingFeedback(true);
      await submitTryoutFeedback({
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        tryoutId: id,
        tryoutName: tryout.name,
        whatIsGood: feedbackGood,
        whatIsMissing: feedbackMissing,
      });
      setFeedbackSubmitted(true);
      toast({
        title: "Terima Kasih",
        description: "Feedback Anda telah berhasil dikirim",
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Gagal Mengirim",
        description: "Terjadi kesalahan saat mengirim feedback",
        variant: "destructive",
      });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Memuat hasil try out..." type="spinner" fullScreen overlay />;
  }

  if (!result || !tryout) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Hasil tidak ditemukan</p>
        <Button onClick={() => navigate('/dashboard/tryouts')} className="mt-4">
          Kembali
        </Button>
      </div>
    );
  }

  const twkMaxScore = result.maxTwkScore || (tryout.twkQuestions || 30) * 5;
  const tiuMaxScore = result.maxTiuScore || (tryout.tiuQuestions || 35) * 5;
  const tkpMaxScore = result.maxTkpScore || (tryout.tkpQuestions || 45) * 5;
  const totalMaxScore = result.maxTotalScore || (twkMaxScore + tiuMaxScore + tkpMaxScore);

  const twkTotal = tryout.twkQuestions || 30;
  const tiuTotal = tryout.tiuQuestions || 35;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-gray-900">Hasil Try Out</h1>
          <p className="text-sm text-gray-500 mt-1">{tryout.name}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/tryouts')}
          className="border hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>

      {allResults.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Pilih Percobaan
          </label>
          <Select
            value={selectedAttempt.toString()}
            onValueChange={(value) => {
              const idx = parseInt(value);
              setSelectedAttempt(idx);
              setResult(allResults[idx]);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih percobaan" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px] overflow-y-auto">
              {allResults.map((r, idx) => (
                <SelectItem key={r.id} value={idx.toString()}>
                  <div className="flex items-center justify-between w-full gap-4">
                    <span>Percobaan {r.attemptNumber}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {new Date(r.completedAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${r.isPassed ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'}`}
                      >
                        {r.totalScore}
                      </Badge>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="border rounded-lg p-6 bg-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Skor Total</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl text-gray-900">{result.totalScore}</span>
              <span className="text-lg text-gray-400">/ {totalMaxScore}</span>
            </div>
          </div>
          <Badge className={`text-sm px-4 py-1 ${result.isPassed ? 'bg-green-600' : 'bg-red-600'}`}>
            {result.isPassed ? 'Lulus' : 'Tidak Lulus'}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded flex items-center justify-center ${result.passedTWK ? 'bg-blue-600' : 'bg-gray-400'}`}>
                <span className="text-xs text-white">TWK</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${result.passedTWK ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {result.passedTWK ? 'Lulus' : 'Tidak Lulus'}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl text-gray-900">{result.twkScore}</span>
              <span className="text-sm text-gray-500">/ {twkMaxScore}</span>
            </div>
            <p className="text-xs text-gray-500">{result.twkCorrect}/{twkTotal} benar</p>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded flex items-center justify-center ${result.passedTIU ? 'bg-green-600' : 'bg-gray-400'}`}>
                <span className="text-xs text-white">TIU</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${result.passedTIU ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {result.passedTIU ? 'Lulus' : 'Tidak Lulus'}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl text-gray-900">{result.tiuScore}</span>
              <span className="text-sm text-gray-500">/ {tiuMaxScore}</span>
            </div>
            <p className="text-xs text-gray-500">{result.tiuCorrect}/{tiuTotal} benar</p>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded flex items-center justify-center ${result.passedTKP ? 'bg-orange-600' : 'bg-gray-400'}`}>
                <span className="text-xs text-white">TKP</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${result.passedTKP ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {result.passedTKP ? 'Lulus' : 'Tidak Lulus'}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-2xl text-gray-900">{result.tkpScore}</span>
              <span className="text-sm text-gray-500">/ {tkpMaxScore}</span>
            </div>
            <p className="text-xs text-gray-500">Nilai: {result.tkpScore}/{tkpMaxScore}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm text-gray-900">Peringkat Anda</h3>
          </div>
          <p className="text-3xl text-amber-600">#{result.rank}</p>
          <p className="text-xs text-gray-500 mt-1">dari {result.totalParticipants} peserta</p>
        </div>

        <div className="border rounded-lg p-4 bg-white">
          <h3 className="text-sm text-gray-900 mb-3">Passing Grade</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">TWK</span>
              <span className="text-gray-900">{tryout.passingGradeTWK || 65}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">TIU</span>
              <span className="text-gray-900">{tryout.passingGradeTIU || 80}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">TKP</span>
              <span className="text-gray-900">{tryout.passingGradeTKP || 166}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => navigate(`/dashboard/tryout/${id}/review`)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Lihat Pembahasan
        </Button>
        <Button
          onClick={() => navigate('/dashboard/tryouts')}
          variant="outline"
          className="flex-1 border hover:bg-gray-50"
        >
          Kembali ke List
        </Button>
      </div>

      {tryout.category === 'free' && (
        <div className="border rounded-lg p-6 bg-white mt-12 bg-gradient-to-br from-blue-50/50 to-white">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Bantu Kami Berkembang</h3>
          </div>

          {feedbackSubmitted ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Terima Kasih Atas Feedback Anda!</h4>
              <p className="text-sm text-gray-500">Feedback Anda sangat berharga bagi kami untuk terus meningkatkan kualitas platform KelasASN.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-gray-600 leading-relaxed">
                Karena ini adalah <span className="font-bold text-blue-600 underline decoration-blue-200 decoration-2">Try Out Gratis</span>, kami sangat menghargai jika Anda bersedia memberikan testimoni singkat untuk membantu kami memperbanyak try out gratis lainnya.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Apa yang sudah bagus dari Try Out ini? (Testimoni)
                  </label>
                  <Textarea
                    placeholder="Contoh: Soal-soalnya sangat relevan dengan kisi-kisi CPNS terbaru..."
                    value={feedbackGood}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedbackGood(e.target.value)}
                    className="min-h-[100px] border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Apa yang masih kurang atau perlu kami perbaiki?
                  </label>
                  <Textarea
                    placeholder="Contoh: Pembahasannya kurang mendalam di bagian TIU..."
                    value={feedbackMissing}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedbackMissing(e.target.value)}
                    className="min-h-[100px] border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <Button
                  onClick={handleFeedbackSubmit}
                  disabled={submittingFeedback}
                  className="w-full bg-gray-900 hover:bg-black text-white py-6 h-auto text-sm font-bold uppercase tracking-widest transition-all"
                >
                  {submittingFeedback ? 'Mengirim...' : 'Kirim Feedback & Testimoni'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
