import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTryoutById, getUserResultsByTryout } from '@/services/tryoutService';
import { getQuestionsByIds, getTryoutQuestionIds } from '@/services/questionService';
import { TryoutResult, TryoutPackage, Question } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingScreen } from '@/components/ui/spinner';
import { Trophy, BookOpen, TrendingUp, Award, ArrowLeft } from 'lucide-react';

export const TryoutResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<TryoutResult | null>(null);
  const [allResults, setAllResults] = useState<TryoutResult[]>([]);
  const [tryout, setTryout] = useState<TryoutPackage | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<number>(0);

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

      if (tryoutData) {
        const allQuestionIds = await getTryoutQuestionIds(id);
        const questionsData = await getQuestionsByIds(allQuestionIds);
        setQuestions(questionsData);
      }
    } catch (error) {
      console.error('Error loading result:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number, maxScore: number): string => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number, maxScore: number): string => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 80) return 'bg-green-50';
    if (percentage >= 60) return 'bg-blue-50';
    if (percentage >= 40) return 'bg-orange-50';
    return 'bg-red-50';
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
  const tkpTotal = tryout.tkpQuestions || 45;

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
    </div>
  );
};
