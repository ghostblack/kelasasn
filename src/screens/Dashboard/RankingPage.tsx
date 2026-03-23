import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/spinner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trophy, Medal, Award, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getRankingByTryout } from '@/services/rankingService';
import type { RankingEntry } from '@/services/rankingService';
import { getAllTryouts } from '@/services/tryoutService';
import { TryoutPackage } from '@/types';

export const RankingPage = () => {
  const { user } = useAuth();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [tryouts, setTryouts] = useState<TryoutPackage[]>([]);
  const [selectedTryout, setSelectedTryout] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTryouts();
  }, []);

  useEffect(() => {
    loadRankings();
  }, [selectedTryout]);

  const loadTryouts = async () => {
    try {
      const data = await getAllTryouts();
      setTryouts(data);
    } catch (error) {
      console.error('Error loading tryouts:', error);
    }
  };

  const loadRankings = async () => {
    setLoading(true);
    setError(null);
    try {
      const tryoutId = selectedTryout === 'all' ? undefined : selectedTryout;
      console.log('Loading rankings for tryout:', tryoutId);
      const data = await getRankingByTryout(tryoutId);
      console.log('Ranking data loaded:', data);
      console.log('Total rankings:', data.length);

      if (data.length === 0) {
        console.log('No ranking data available');
      }

      setRankings(data);
    } catch (err: any) {
      console.error('Error loading rankings:', err);

      if (err?.code === 'permission-denied') {
        setError('Tidak memiliki izin untuk melihat ranking. Silakan update Firestore Rules di Firebase Console.');
      } else {
        setError('Gagal memuat data ranking. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };


  const getInitials = (name: string) => {
    if (!name) return 'U';
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const anonymizeName = (name: string) => {
    if (!name || name === 'Unknown') return 'User';
    if (name.length <= 3) return name;
    return name.substring(0, 3) + '***';
  };

  if (loading) {
    return <LoadingScreen message="Memuat data ranking..." type="spinner" fullScreen overlay />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Ranking
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Lihat peringkat peserta try out
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {rankings.length > 0 && `${rankings.length} peserta`}
        </div>
        <Select value={selectedTryout} onValueChange={setSelectedTryout}>
          <SelectTrigger className="w-full md:w-[280px] h-11 bg-white border-gray-200/60 focus:border-gray-300 rounded-xl">
            <SelectValue placeholder="Pilih Try Out" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Try Out</SelectItem>
            {tryouts.map((tryout) => (
              <SelectItem key={tryout.id} value={tryout.id}>
                {tryout.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <div className="bg-white border border-gray-200/60 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Terjadi Kesalahan
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {error}
          </p>
          <Button
            onClick={loadRankings}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Coba Lagi
          </Button>
        </div>
      ) : rankings.length === 0 ? (
        <div className="bg-white border border-gray-200/60 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Belum Ada Data Ranking
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {selectedTryout === 'all'
              ? 'Ranking akan muncul setelah ada peserta yang menyelesaikan try out'
              : 'Belum ada peserta yang menyelesaikan try out ini'}
          </p>
          <p className="text-xs text-gray-400">
            Untuk melihat ranking, Anda atau peserta lain perlu menyelesaikan minimal satu try out terlebih dahulu
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top 3 Podium */}
          <div className="bg-gradient-to-b from-blue-50/50 to-transparent rounded-3xl pb-4 overflow-hidden">
            <div className="flex justify-center items-end gap-2 md:gap-8 px-4 py-12 min-h-[380px]">
              {/* Rank 2 */}
              {rankings.length > 1 && (
                <div className="flex flex-col items-center flex-1 max-w-[140px] animate-fade-up [animation-delay:200ms]">
                  <div className="relative mb-4 group">
                    <div className="absolute -inset-1 bg-slate-200 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <Avatar className="h-14 w-14 md:h-18 md:w-18 border-2 border-slate-200 relative">
                      <AvatarFallback className="bg-slate-500 text-white text-base md:text-lg font-bold">
                        {getInitials(rankings[1].userName || rankings[1].userEmail || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-slate-400 border-2 border-white rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg">
                      2
                    </div>
                  </div>
                  <div className="text-center mb-3 w-full">
                    <p className="font-bold text-gray-900 text-xs md:text-sm truncate px-1">
                      {rankings[1].userId === user?.uid ? 'Anda' : anonymizeName(rankings[1].userName || rankings[1].userEmail || 'user')}
                    </p>
                    <p className="text-[10px] md:text-xs font-black text-blue-600 uppercase tracking-wider">
                      {rankings[1].totalScore?.toFixed(0) || 0} PTS
                    </p>
                  </div>
                  <div className="w-full h-32 md:h-40 bg-white border-t-2 border-x-2 border-slate-100 rounded-t-2xl shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)] flex flex-col items-center justify-start pt-6">
                    <Medal className="h-8 w-8 text-slate-400" />
                  </div>
                </div>
              )}

              {/* Rank 1 */}
              {rankings.length > 0 && (
                <div className="flex flex-col items-center flex-1 max-w-[160px] animate-fade-up relative z-10">
                  <div className="relative mb-6 group scale-110">
                    <div className="absolute -inset-2 bg-yellow-400 rounded-full blur opacity-40 group-hover:opacity-70 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                    <Avatar className="h-16 w-16 md:h-22 md:w-22 border-4 border-yellow-400 relative shadow-2xl">
                      <AvatarFallback className="bg-yellow-500 text-white text-xl md:text-2xl font-black">
                        {getInitials(rankings[0].userName || rankings[0].userEmail || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-yellow-500 border-2 border-white rounded-full flex items-center justify-center text-white text-sm font-black shadow-xl">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-bounce">
                      <span className="text-2xl">👑</span>
                    </div>
                  </div>
                  <div className="text-center mb-4 w-full">
                    <p className="font-black text-gray-900 text-sm md:text-base truncate px-1">
                      {rankings[0].userId === user?.uid ? 'Anda' : anonymizeName(rankings[0].userName || rankings[0].userEmail || 'user')}
                    </p>
                    <p className="text-xs md:text-sm font-black text-yellow-600 bg-yellow-100 px-3 py-0.5 rounded-full inline-block mt-1">
                      {rankings[0].totalScore?.toFixed(0) || 0} PTS
                    </p>
                  </div>
                  <div className="w-full h-44 md:h-56 bg-white border-t-4 border-x-2 border-yellow-100 rounded-t-3xl shadow-[0_-15px_35px_-5px_rgba(234,179,8,0.2)] flex flex-col items-center justify-start pt-8">
                    <Trophy className="h-12 w-12 text-yellow-500" />
                  </div>
                </div>
              )}

              {/* Rank 3 */}
              {rankings.length > 2 && (
                <div className="flex flex-col items-center flex-1 max-w-[140px] animate-fade-up [animation-delay:400ms]">
                  <div className="relative mb-4 group">
                    <div className="absolute -inset-1 bg-orange-200 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <Avatar className="h-14 w-14 md:h-18 md:w-18 border-2 border-orange-200 relative">
                      <AvatarFallback className="bg-orange-600 text-white text-base md:text-lg font-bold">
                        {getInitials(rankings[2].userName || rankings[2].userEmail || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-orange-600 border-2 border-white rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg">
                      3
                    </div>
                  </div>
                  <div className="text-center mb-3 w-full">
                    <p className="font-bold text-gray-900 text-xs md:text-sm truncate px-1">
                      {rankings[2].userId === user?.uid ? 'Anda' : anonymizeName(rankings[2].userName || rankings[2].userEmail || 'user')}
                    </p>
                    <p className="text-[10px] md:text-xs font-black text-blue-600 uppercase tracking-wider">
                      {rankings[2].totalScore?.toFixed(0) || 0} PTS
                    </p>
                  </div>
                  <div className="w-full h-24 md:h-32 bg-white border-t-2 border-x-2 border-orange-50 rounded-t-2xl shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)] flex flex-col items-center justify-start pt-4">
                    <Award className="h-8 w-8 text-orange-400" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Table List for Rank 4+ */}
          {rankings.length > 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-2">
                <Users className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-800">Peringkat Lainnya</h2>
              </div>
              <div className="space-y-3">
                {rankings.slice(3).map((entry) => {
                  const isCurrentUser = entry.userId === user?.uid;
                  return (
                    <div
                      key={entry.id}
                      className={`bg-white border rounded-xl p-4 transition-all duration-200 ${
                        isCurrentUser
                          ? 'border-blue-300 bg-blue-50/50'
                          : 'border-gray-200/60 hover:border-gray-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-8 text-center font-black text-gray-400">
                            {entry.rank}
                          </div>
                          <Avatar className="h-10 w-10 flex-shrink-0">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-bold">
                              {getInitials(entry.userName || entry.userEmail || 'U')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="font-bold text-gray-900 text-sm truncate">
                                {isCurrentUser
                                  ? entry.userName || 'Anda'
                                  : anonymizeName(entry.userName || entry.userEmail || 'user')}
                              </p>
                              {isCurrentUser && (
                                <Badge
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] h-5 rounded-full px-2"
                                >
                                  You
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 truncate">
                              {entry.tryoutName}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="mb-0.5">
                            <span className="font-black text-lg text-gray-900">
                              {entry.totalScore?.toFixed(0) || 0}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 ml-1 uppercase">pts</span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium">
                            {new Date(entry.completedAt).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
