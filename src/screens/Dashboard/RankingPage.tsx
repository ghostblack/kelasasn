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
import { getRankingByTryout, hydrateRankingUsers } from '@/services/rankingService';
import type { RankingEntry } from '@/services/rankingService';
import { getAllTryouts } from '@/services/tryoutService';
import { checkUserFormasiAccess } from '@/services/formasiAccessCodeService';
import { LockedFeatureOverlay } from '@/components/LockedFeatureOverlay';
import { cn } from '@/lib/utils';
import { TryoutPackage } from '@/types';

export const RankingPage = () => {
  const { user, isAdmin } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [baseRankings, setBaseRankings] = useState<RankingEntry[]>([]);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [tryouts, setTryouts] = useState<TryoutPackage[]>([]);
  const [selectedTryout, setSelectedTryout] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAccess = async () => {
      if (isAdmin) {
        setIsUnlocked(true);
        return;
      }
      if (user) {
        const hasAccess = await checkUserFormasiAccess(user.uid);
        setIsUnlocked(hasAccess);
      } else {
        setIsUnlocked(false);
      }
    };
    initAccess();
  }, [user, isAdmin]);

  useEffect(() => {
    if (isUnlocked === true) {
      loadTryouts();
      loadRankings();
    } else if (isUnlocked === false) {
      setLoading(false);
    }
  }, [isUnlocked]);

  useEffect(() => {
    if (isUnlocked === true) {
      loadRankings();
    }
  }, [selectedTryout]);

  useEffect(() => {
    const hydratePage = async () => {
      if (baseRankings.length === 0) {
        setRankings([]);
        return;
      }
      
      const top100 = baseRankings.slice(0, 100);
      const toHydrate = [...top100];

      // Pastikan info user diri sendiri juga ikut di-hydrate 
      if (user?.uid) {
         const userInBase = baseRankings.find(r => r.userId === user.uid);
         if (userInBase && !toHydrate.some(r => r.userId === user.uid)) {
            toHydrate.push(userInBase);
         }
      }

      setLoading(true);
      const hydratedData = await hydrateRankingUsers(toHydrate);
      setRankings(hydratedData);
      setLoading(false);
    };

    if (isUnlocked === true && baseRankings.length > 0) {
      hydratePage();
    }
  }, [baseRankings, user?.uid]);

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
      console.log('Loading base rankings for tryout:', tryoutId);
      const data = await getRankingByTryout(tryoutId, -1); // Ambil semua raw scores sekalian tanpa berat (0ms read time)
      setBaseRankings(data);
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

  if (isUnlocked === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600/10 border-t-blue-600" />
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Checking Authorization...</p>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen message="Memuat data ranking..." type="spinner" fullScreen overlay />;
  }

  return (
    <div className="relative">
      {!isUnlocked && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-30 backdrop-blur-md bg-white/60 pointer-events-none" />
      )}
      <div className={cn(
        "space-y-6 transition-all duration-300 ease-out",
        !isUnlocked ? "opacity-20 grayscale pointer-events-none select-none" : "opacity-100 grayscale-0"
      )}>
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
          {baseRankings.length > 0 && `Top 100 dari ${baseRankings.length} peserta`}
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
      ) : baseRankings.length === 0 ? (
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Top 3 Podium (Left Column) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-blue-50/50 to-transparent rounded-3xl pb-4 border border-gray-100 flex flex-col justify-end">
            <div className="flex justify-center items-end gap-2 md:gap-4 px-4 py-8 min-h-[340px]">
              {/* Rank 2 */}
              {rankings.length > 1 && (
                <div className="flex flex-col items-center flex-1 max-w-[120px] animate-fade-up [animation-delay:200ms]">
                  <div className="relative mb-3">
                    <Avatar className="h-14 w-14 border-2 border-slate-200">
                      <AvatarFallback className="bg-slate-500 text-white font-bold">
                        {getInitials(rankings[1].userName || rankings[1].userEmail || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-1 w-6 h-6 bg-slate-400 border border-white rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                      2
                    </div>
                  </div>
                  <div className="text-center mb-2 w-full">
                    <p className="font-bold text-gray-900 text-xs truncate px-1">
                      {rankings[1].userId === user?.uid ? 'Anda' : anonymizeName(rankings[1].userName || rankings[1].userEmail || 'user')}
                    </p>
                    <p className="text-[9px] font-black text-blue-600 uppercase">
                      {rankings[1].totalScore?.toFixed(0) || 0} PTS
                    </p>
                  </div>
                  <div className="w-full h-28 bg-white border-t border-x border-slate-100 rounded-t-2xl shadow-sm flex flex-col items-center justify-start pt-4">
                    <Medal className="h-6 w-6 text-slate-400" />
                  </div>
                </div>
              )}

              {/* Rank 1 */}
              {rankings.length > 0 && (
                <div className="flex flex-col items-center flex-1 max-w-[140px] animate-fade-up relative z-10">
                  <div className="relative mb-4 scale-110">
                    <Avatar className="h-16 w-16 border-4 border-yellow-400 shadow-md">
                      <AvatarFallback className="bg-yellow-500 text-white text-lg font-black">
                        {getInitials(rankings[0].userName || rankings[0].userEmail || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-1 w-8 h-8 bg-yellow-500 border-2 border-white rounded-full flex items-center justify-center text-white shadow-md">
                      <Trophy className="h-3.5 w-3.5" />
                    </div>
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                      <span className="text-xl">👑</span>
                    </div>
                  </div>
                  <div className="text-center mb-3 w-full">
                    <p className="font-black text-gray-900 text-sm truncate px-1">
                      {rankings[0].userId === user?.uid ? 'Anda' : anonymizeName(rankings[0].userName || rankings[0].userEmail || 'user')}
                    </p>
                    <p className="text-[10px] font-black text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-sm inline-block mt-0.5">
                      {rankings[0].totalScore?.toFixed(0) || 0} PTS
                    </p>
                  </div>
                  <div className="w-full h-36 bg-white border-t-2 border-x border-yellow-100 rounded-t-2xl shadow-sm flex flex-col items-center justify-start pt-5">
                    <Trophy className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>
              )}

              {/* Rank 3 */}
              {rankings.length > 2 && (
                <div className="flex flex-col items-center flex-1 max-w-[120px] animate-fade-up [animation-delay:400ms]">
                  <div className="relative mb-3">
                    <Avatar className="h-14 w-14 border-2 border-orange-200">
                      <AvatarFallback className="bg-orange-500 text-white font-bold">
                        {getInitials(rankings[2].userName || rankings[2].userEmail || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-1 w-6 h-6 bg-orange-500 border border-white rounded-full flex items-center justify-center text-white text-[10px] font-black shadow-sm">
                      3
                    </div>
                  </div>
                  <div className="text-center mb-2 w-full">
                    <p className="font-bold text-gray-900 text-xs truncate px-1">
                      {rankings[2].userId === user?.uid ? 'Anda' : anonymizeName(rankings[2].userName || rankings[2].userEmail || 'user')}
                    </p>
                    <p className="text-[9px] font-black text-blue-600 uppercase">
                      {rankings[2].totalScore?.toFixed(0) || 0} PTS
                    </p>
                  </div>
                  <div className="w-full h-20 bg-white border-t border-x border-orange-50 rounded-t-2xl shadow-sm flex flex-col items-center justify-start pt-3">
                    <Award className="h-6 w-6 text-orange-400" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Table List for Rank 4+ (Right Column) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center gap-2 mb-4 px-1">
              <Users className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Peringkat Lainnya</h2>
            </div>
            {baseRankings.length > 3 ? (
              <>
                <div className="space-y-2 bg-gray-50/50 p-3 rounded-2xl border border-gray-100 max-h-[500px] overflow-y-auto custom-scrollbar">
                  {(() => {
                    // rankings yang ter-render di list (slice setelah top3 yang di-hydrate) limit top 100
                    const displayList = rankings.filter(r => {
                      const isTop3 = rankings.slice(0, 3).some(top => top.userId === r.userId);
                      const isSelf = r.userId === user?.uid;
                      const isTop100 = r.rank <= 100;
                      return !isTop3 && isTop100; 
                    });

                    return displayList.map((entry) => {
                    const isCurrentUser = entry.userId === user?.uid;
                    return (
                      <div
                        key={entry.id}
                        className={`flex items-center justify-between gap-3 p-3 bg-white rounded-xl border ${
                          isCurrentUser ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100'
                        }`}
                      >
                        <div className="w-6 text-center text-[11px] font-black text-gray-400">
                          {entry.rank}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gray-100 text-gray-600 text-[10px] font-bold">
                            {getInitials(entry.userName || entry.userEmail || 'U')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 text-xs truncate">
                              {isCurrentUser
                                ? entry.userName || 'Anda'
                                : anonymizeName(entry.userName || entry.userEmail || 'user')}
                            </p>
                            {isCurrentUser && (
                              <Badge className="bg-blue-600 text-white text-[8px] px-1.5 py-0 h-4 rounded-sm uppercase tracking-wider">
                                You
                              </Badge>
                            )}
                          </div>
                          <p className="text-[9px] font-medium text-gray-400 truncate uppercase mt-0.5">
                            {entry.tryoutName}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-black text-sm text-gray-900">
                            {entry.totalScore?.toFixed(0) || 0} <span className="text-[8px] text-gray-400 font-bold uppercase">pts</span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                  })()}
                </div>
                


                {/* Info Ranking User Sendiri (Selalu Muncul) */}
                {(() => {
                  const currentUserRanking = rankings.find(r => r.userId === user?.uid);
                  if (!currentUserRanking) return null;
                  
                  return (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg border border-blue-500 text-white flex items-center justify-between animate-fade-in relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                        <Trophy className="h-20 w-20" />
                      </div>
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm shadow-inner flex items-center justify-center font-black text-xl border border-white/20">
                          {currentUserRanking.rank}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-0.5">Peringkat Anda</p>
                          <p className="font-black text-sm md:text-base leading-tight">
                            {currentUserRanking.tryoutName || 'Try Out'} 
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end relative z-10">
                        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-0.5">Skor Akhir</p>
                        <p className="font-black text-2xl leading-none drop-shadow-md">
                          {currentUserRanking.totalScore?.toFixed(0) || 0}
                          <span className="text-[10px] text-blue-200 uppercase font-bold ml-1">pts</span>
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Hanya ada top 3</p>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
      {!isUnlocked && <LockedFeatureOverlay type="ranking" />}
    </div>
  );
};
