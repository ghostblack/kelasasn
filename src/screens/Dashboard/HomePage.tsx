import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/spinner';
import { FileText, TrendingUp, ChartBar as BarChart3, Trophy, Clock, CircleCheck as CheckCircle, Play, ArrowRight, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserStats, getUserTryouts, getAllTryouts } from '@/services/tryoutService';
import { UserStats, UserTryout, TryoutPackage } from '@/types';
import { SeedDataButton } from '@/components/SeedDataButton';

export const HomePage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [tryouts, setTryouts] = useState<UserTryout[]>([]);
  const [allTryouts, setAllTryouts] = useState<TryoutPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      if (authLoading) {
        return;
      }

      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      const timeoutId = setTimeout(() => {
        if (isMounted) {
          console.error('Dashboard data loading timeout');
          setLoading(false);
        }
      }, 10000);

      try {
        const [userStats, userTryouts, availableTryouts] = await Promise.all([
          getUserStats(user.uid),
          getUserTryouts(user.uid),
          getAllTryouts(),
        ]);

        if (!isMounted) return;

        setStats(userStats);
        setTryouts(userTryouts.slice(0, 5));
        const activeTryouts = availableTryouts.filter(tryout => tryout.isActive === true);
        setAllTryouts(activeTryouts);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        if (isMounted) {
          setStats({ totalTryouts: 0, completedTryouts: 0, averageScore: 0, highestScore: 0, bestRank: '-' });
          setTryouts([]);
          setAllTryouts([]);
        }
      } finally {
        clearTimeout(timeoutId);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  const statsCards = [
    {
      title: 'Total Try Out',
      value: stats?.totalTryouts || 0,
      icon: FileText,
      color: 'blue',
      bgColor: 'bg-blue-50/50',
      iconColor: 'text-blue-600',
      accentColor: 'bg-blue-500',
    },
    {
      title: 'Nilai Tertinggi',
      value: stats?.highestScore || 0,
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-50/50',
      iconColor: 'text-green-600',
      accentColor: 'bg-green-500',
    },
    {
      title: 'Nilai Rata-rata',
      value: stats?.averageScore ? Math.round(stats.averageScore) : 0,
      icon: BarChart3,
      color: 'orange',
      bgColor: 'bg-orange-50/50',
      iconColor: 'text-orange-600',
      accentColor: 'bg-orange-500',
    },
    {
      title: 'Ranking Terbaik',
      value: stats?.bestRank || '-',
      icon: Trophy,
      color: 'amber',
      bgColor: 'bg-amber-50/50',
      iconColor: 'text-amber-600',
      accentColor: 'bg-amber-500',
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { label: 'Selesai', className: 'bg-green-50/80 text-green-700 border-green-200/50' },
      in_progress: { label: 'Sedang Dikerjakan', className: 'bg-blue-50/80 text-blue-700 border-blue-200/50' },
      not_started: { label: 'Belum Dikerjakan', className: 'bg-gray-50/80 text-gray-600 border-gray-200/50' },
    };

    const variant = variants[status as keyof typeof variants] || variants.not_started;
    return <Badge variant="outline" className={`${variant.className} text-xs font-medium`}>{variant.label}</Badge>;
  };

  if (loading) {
    return <LoadingScreen message="Memuat data dashboard..." type="spinner" fullScreen overlay />;
  };

  return (
    <>
      <SeedDataButton />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Selamat datang di Kelas ASN
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Belajar lebih mudah dengan soal terbaik
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group relative bg-white border border-gray-200/60 rounded-lg p-3.5 transition-all duration-200 hover:border-gray-300"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`${stat.bgColor} rounded-md p-2`}>
                    <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                  <div className={`w-0.5 h-6 ${stat.accentColor} rounded-full`}></div>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {stat.title}
                  </p>
                  <div className="flex items-baseline gap-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {stat.value}
                    </h3>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-gray-200/60 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Rekomendasi Try Out untuk Kamu</h2>
              <p className="text-sm text-gray-500 mt-0.5">Pilih try out terbaik untuk meningkatkan kemampuanmu</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/tryouts')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-sm font-medium"
            >
              Lihat Semua
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>

          {allTryouts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum Ada Try Out Tersedia
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                Saat ini belum ada try out yang tersedia. Silakan cek kembali nanti
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {allTryouts.map((tryout) => {
                const userTryout = tryouts.find(t => t.tryoutId === tryout.id);
                const isPurchased = !!userTryout;
                const isFree = tryout.category === 'free';
                const hasDiscount = tryout.discount && tryout.discount > 0;

                return (
                  <div
                    key={tryout.id}
                    className="bg-white border border-gray-200/60 rounded-xl overflow-hidden transition-all duration-200 hover:border-blue-300 hover:shadow-md flex flex-col h-full min-h-[420px]"
                  >
                    <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-blue-50 to-blue-100 flex-shrink-0 overflow-hidden">
                      {tryout.imageUrl ? (
                        <img
                          src={tryout.imageUrl}
                          alt={tryout.name}
                          loading="lazy"
                          className="w-full h-full object-cover absolute inset-0"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center absolute inset-0">
                          <div className="w-16 h-16 bg-blue-200/50 rounded-lg flex items-center justify-center">
                            <FileText className="w-8 h-8 text-blue-600" />
                          </div>
                        </div>
                      )}

                      {hasDiscount && tryout.discount > 0 && (
                        <div className="absolute top-3 right-3 z-10 bg-orange-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
                          Hemat {tryout.discount}%
                        </div>
                      )}

                      {tryout.totalDuration && tryout.totalDuration > 0 && (
                        <div className="absolute bottom-3 right-3 z-10 bg-white/95 text-gray-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-medium shadow-sm backdrop-blur-sm">
                          <Clock className="h-3.5 w-3.5" />
                          {tryout.totalDuration} menit
                        </div>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-grow">
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {tryout.type && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-2 py-0.5 hover:bg-blue-100">
                              {tryout.type}
                            </Badge>
                          )}
                          {isPurchased && (
                            <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                              <span className="text-xs font-medium text-green-700">Terbeli</span>
                            </div>
                          )}
                        </div>

                        <h3 className="text-base font-semibold text-gray-900 leading-tight mb-2 min-h-[48px] line-clamp-2">
                          {tryout.name}
                        </h3>

                        <div className="min-h-[40px] mb-3">
                          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                            {tryout.description || 'Try out ini mencakup berbagai soal untuk membantu Anda mempersiapkan ujian dengan lebih baik.'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2 border-t border-gray-100">
                        <div className="min-h-[36px] flex items-center">
                          {isFree ? (
                            <div className="w-full">
                              {tryout.originalPrice && tryout.originalPrice > 0 ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 line-through">
                                    Rp {tryout.originalPrice.toLocaleString('id-ID')}
                                  </span>
                                  <span className="text-lg font-bold text-green-600">GRATIS</span>
                                </div>
                              ) : (
                                <span className="text-lg font-bold text-green-600">GRATIS</span>
                              )}
                            </div>
                          ) : (
                            <div className="w-full">
                              {hasDiscount && tryout.originalPrice && tryout.originalPrice > 0 ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 line-through">
                                    Rp {tryout.originalPrice.toLocaleString('id-ID')}
                                  </span>
                                  <span className="text-lg font-bold text-blue-600">
                                    Rp {tryout.price.toLocaleString('id-ID')}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-lg font-bold text-blue-600">
                                  Rp {tryout.price.toLocaleString('id-ID')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 text-sm font-semibold rounded-lg shadow-sm transition-all duration-200"
                          onClick={() => navigate(`/dashboard/tryout/${tryout.id}`)}
                        >
                          {isPurchased ? 'Lihat Detail' : 'Selengkapnya'}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
