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

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-50">
            #{rank}
          </Badge>
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center gap-2">
          <Medal className="h-5 w-5 text-gray-400" />
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-50">#{rank}</Badge>
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-orange-600" />
          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50">
            #{rank}
          </Badge>
        </div>
      );
    }
    return <span className="text-gray-600 font-medium">#{rank}</span>;
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
        <div className="space-y-3">
          {rankings.map((entry) => {
            const isCurrentUser = entry.userId === user?.uid;
            return (
              <div
                key={entry.id}
                className={`bg-white border rounded-xl p-4 transition-all duration-200 ${
                  isCurrentUser
                    ? 'border-blue-300 bg-blue-50/50'
                    : 'border-gray-200/60 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      {getRankBadge(entry.rank)}
                    </div>
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                        {getInitials(entry.userName || entry.userEmail || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {isCurrentUser
                            ? entry.userName || 'Anda'
                            : anonymizeName(entry.userName || entry.userEmail || 'user')}
                        </p>
                        {isCurrentUser && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200/50 text-xs flex-shrink-0"
                          >
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {entry.tryoutName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="mb-0.5">
                      <span className="font-bold text-xl text-gray-900">
                        {entry.totalScore?.toFixed(0) || 0}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {new Date(entry.completedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
