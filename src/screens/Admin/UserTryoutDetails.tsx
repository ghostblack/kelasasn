import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { getTryoutResult } from '@/services/tryoutSessionService';
import { getQuestionsForTryoutDisplaying } from '@/services/questionService';
import { TryoutResult, Question, UserProfile } from '@/types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export const UserTryoutDetails: React.FC = () => {
  const { userId, resultId } = useParams<{ userId: string; resultId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<TryoutResult | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    fetchData();
  }, [userId, resultId]);

  const fetchData = async () => {
    if (!userId || !resultId) return;

    try {
      setLoading(true);

      // Fetch user profile
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUser({ uid: userSnap.id, ...userSnap.data() } as UserProfile);
      }

      // Fetch tryout result
      const tryoutResult = await getTryoutResult(resultId);
      if (!tryoutResult) {
        toast({ title: 'Error', description: 'Data hasil tryout tidak ditemukan', variant: 'destructive' });
        setLoading(false);
        return;
      }
      setResult(tryoutResult);

      // Fetch questions using the tryoutId from result
      const twk = await getQuestionsForTryoutDisplaying(tryoutResult.tryoutId, 'TWK');
      const tiu = await getQuestionsForTryoutDisplaying(tryoutResult.tryoutId, 'TIU');
      const tkp = await getQuestionsForTryoutDisplaying(tryoutResult.tryoutId, 'TKP');
      
      const allQuestions = [...twk, ...tiu, ...tkp];
      
      // If we have shuffledQuestionIds, sort by that order, otherwise just category order
      if (tryoutResult.shuffledQuestionIds && tryoutResult.shuffledQuestionIds.length > 0) {
        const sortedQuestions: Question[] = [];
        tryoutResult.shuffledQuestionIds.forEach(id => {
          const q = allQuestions.find(q => q.id === id);
          if (q) sortedQuestions.push(q);
        });
        
        // Add any questions that might not be in shuffled array just in case
        allQuestions.forEach(q => {
          if (!sortedQuestions.find(sq => sq.id === q.id)) {
            sortedQuestions.push(q);
          }
        });
        setQuestions(sortedQuestions);
      } else {
        setQuestions(allQuestions);
      }

    } catch (error) {
      console.error('Error fetching tryout detail:', error);
      toast({ title: 'Error', description: 'Gagal memuat detail tryout', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getQuestionStatus = (question: Question, answer?: string) => {
    if (!answer) return { status: 'unanswered', score: 0 };
    
    if (question.category === 'TKP') {
      const score = question.tkpScoring ? question.tkpScoring[answer as keyof typeof question.tkpScoring] : 0;
      return { status: 'answered', score: score || 0 };
    }
    
    const isCorrect = answer === question.correctAnswer;
    return { status: isCorrect ? 'correct' : 'incorrect', score: isCorrect ? question.weight : 0 };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat detail tryout...</p>
        </div>
      </div>
    );
  }

  if (!result || !user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Data tidak ditemukan</p>
        <Button onClick={() => navigate('/admin/users')}>Kembali</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate('/admin/users')}
          className="rounded-full shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
           <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-gray-400 capitalize tracking-wider">Detail Sesi Tryout</span>
              <div className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{result.tryoutName}</span>
           </div>
           <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
             {user.displayName} <span className="text-gray-400 font-medium ml-2">Review</span>
           </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col items-center justify-center text-center bg-white border border-gray-100 rounded-none shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Skor</p>
          <p className="text-3xl font-bold text-blue-600">{result.totalScore}</p>
          <p className="text-xs text-gray-400 mt-1">Status: {result.isPassed ? <span className="text-green-600 font-semibold">LULUS</span> : <span className="text-red-600 font-semibold">TIDAK LULUS</span>}</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center bg-white border border-gray-100 rounded-none shadow-sm border-t-4 border-t-red-500">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Skor TWK</p>
          <p className="text-2xl font-bold text-gray-900">{result.twkScore}</p>
          <p className="text-xs text-gray-400 mt-1">Passing Grade: {result.passedTWK ? 'Lulus' : 'Gagal'}</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center bg-white border border-gray-100 rounded-none shadow-sm border-t-4 border-t-green-500">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Skor TIU</p>
          <p className="text-2xl font-bold text-gray-900">{result.tiuScore}</p>
          <p className="text-xs text-gray-400 mt-1">Passing Grade: {result.passedTIU ? 'Lulus' : 'Gagal'}</p>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center bg-white border border-gray-100 rounded-none shadow-sm border-t-4 border-t-blue-500">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Skor TKP</p>
          <p className="text-2xl font-bold text-gray-900">{result.tkpScore}</p>
          <p className="text-xs text-gray-400 mt-1">Passing Grade: {result.passedTKP ? 'Lulus' : 'Gagal'}</p>
        </Card>
      </div>

      <Card className="bg-white border border-gray-100 rounded-none shadow-sm overflow-hidden mt-6">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Detail Jawaban Siswa</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <tr>
                <th className="px-4 py-3 border-b border-gray-100">No</th>
                <th className="px-4 py-3 border-b border-gray-100">Kategori</th>
                <th className="px-4 py-3 border-b border-gray-100 min-w-48">Pertanyaan</th>
                <th className="px-4 py-3 border-b border-gray-100">Status</th>
                <th className="px-4 py-3 border-b border-gray-100">Skor</th>
                <th className="px-4 py-3 border-b border-gray-100">Siswa</th>
                <th className="px-4 py-3 border-b border-gray-100">Kunci</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {questions.map((q, idx) => {
                const userAnswer = result.answers[q.id];
                const status = getQuestionStatus(q, userAnswer);
                
                // create text snippet from html questionText
                const tmp = document.createElement("DIV");
                tmp.innerHTML = q.questionText || "";
                const textContent = tmp.textContent || tmp.innerText || "";
                const snippet = textContent.length > 60 ? textContent.substring(0, 60) + '...' : textContent;

                return (
                  <tr key={q.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-4 py-3 font-medium text-gray-900">{idx + 1}</td>
                    <td className="px-4 py-3">
                       <Badge variant="outline" className={`text-[10px] font-bold rounded-sm ${
                         q.category === 'TWK' ? 'text-red-600 border-red-200 bg-red-50' :
                         q.category === 'TIU' ? 'text-green-600 border-green-200 bg-green-50' : 
                         'text-blue-600 border-blue-200 bg-blue-50'
                       }`}>
                         {q.category}
                       </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 line-clamp-2" dangerouslySetInnerHTML={{ __html: snippet }}></td>
                    <td className="px-4 py-3">
                      {status.status === 'unanswered' ? (
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <MinusCircle className="w-4 h-4" /> <span className="text-xs">Kosong</span>
                        </div>
                      ) : status.status === 'correct' ? (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <CheckCircle2 className="w-4 h-4" /> <span className="text-xs font-semibold">Benar</span>
                        </div>
                      ) : status.status === 'incorrect' ? (
                        <div className="flex items-center gap-1.5 text-red-500">
                           <XCircle className="w-4 h-4" /> <span className="text-xs">Salah</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-blue-600">
                           <CheckCircle2 className="w-4 h-4" /> <span className="text-xs font-semibold">Terjawab</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      +{status.score}
                    </td>
                    <td className="px-4 py-3">
                       {userAnswer ? (
                         <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-gray-100 text-xs font-bold uppercase text-gray-900">
                           {userAnswer}
                         </span>
                       ) : <span className="text-gray-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {q.category === 'TKP' ? (
                         <div className="flex gap-1">
                           {q.tkpScoring && Object.entries(q.tkpScoring).sort((a,b) => b[1] - a[1]).map(([key, val]) => (
                             <span key={key} className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                               val === 5 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                             }`}>
                               {key}:{val}
                             </span>
                           ))}
                         </div>
                      ) : (
                         <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-100 text-xs font-bold uppercase text-green-700">
                           {q.correctAnswer}
                         </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
