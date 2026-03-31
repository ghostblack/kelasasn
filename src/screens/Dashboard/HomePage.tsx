import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/spinner';
import { FileText, TrendingUp, ChartBar as BarChart3, Trophy, Clock, CircleCheck as CheckCircle, ArrowRight, BookOpen, LayoutGrid, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserStats, getUserTryouts, getAllTryouts } from '@/services/tryoutService';
import { getVIPBundlingSettings, getVIPBundlingStats } from '@/services/vipBundlingService';
import { UserStats, UserTryout, TryoutPackage } from '@/types';
import { SeedDataButton } from '@/components/SeedDataButton';

// ── Mock data untuk visual banner ────────────────────────────────────────────
const bannerMockRows = [
  { jabatan: 'Analis Kebijakan Ahli Pertama', instansi: 'Kemenkeu', kuota: 125, pelamar: 450, ratio: 4, safe: true },
  { jabatan: 'Auditor Ahli Pertama', instansi: 'BPK', kuota: 45, pelamar: 950, ratio: 22, safe: false },
  { jabatan: 'Penyuluh Kesehatan Masyarakat', instansi: 'Kemenkes', kuota: 85, pelamar: 255, ratio: 3, safe: true },
];

export const HomePage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [tryouts, setTryouts] = useState<UserTryout[]>([]);
  const [allTryouts, setAllTryouts] = useState<TryoutPackage[]>([]);
  const [earlyBirdRemaining, setEarlyBirdRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVip, setHasVip] = useState(false);

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
        const [userStats, userTryouts, availableTryouts, vipSettings, vipStats] = await Promise.all([
          getUserStats(user.uid),
          getUserTryouts(user.uid),
          getAllTryouts(),
          getVIPBundlingSettings(),
          getVIPBundlingStats()
        ]);

        if (!isMounted) return;

        const remaining = Math.max(0, vipSettings.earlyBirdLimit - vipStats.totalSales);
        setEarlyBirdRemaining(remaining);
        
        // Check if user already has a purchased bundle
        const purchasedBundle = userTryouts.some(ut => {
          const pkg = availableTryouts.find(at => at.id === ut.tryoutId);
          return pkg?.isBundle === true && ut.paymentStatus === 'success';
        });
        setHasVip(purchasedBundle);
        
        setStats(userStats);
        setTryouts(userTryouts.slice(0, 5));
        const activeTryouts = availableTryouts.filter(tryout => tryout.isActive === true || tryout.isDraft === true);
        activeTryouts.sort((a, b) => {
          const aPurchased = userTryouts.some(t => t.tryoutId === a.id);
          const bPurchased = userTryouts.some(t => t.tryoutId === b.id);
          if (aPurchased && !bPurchased) return -1;
          if (!aPurchased && bPurchased) return 1;
          return 0;
        });
        setAllTryouts(activeTryouts);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        if (isMounted) {
          setStats({ totalTryouts: 0, highestScore: 0, averageScore: 0, bestRank: 0 });
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

        {/* ── Formasi Trial Banner ─────────────────────────────────────────── */}
        {!hasVip && (
          <div
            className="relative w-full rounded-2xl overflow-hidden cursor-pointer group"
            onClick={() => navigate('/dashboard/formasi')}
            style={{ background: 'linear-gradient(135deg, #1a1a3e 0%, #2c29e2 60%, #4338ca 100%)' }}
          >
          {/* Decorative glow orbs */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 left-1/3 w-32 h-32 bg-blue-400/10 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 p-5 sm:p-6 lg:p-7">
            {/* Left: Text Content */}
            <div className="flex-1 space-y-3 w-full">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full animate-pulse">
                  <Sparkles className="w-3 h-3" />
                  Promo Early Bird {earlyBirdRemaining !== null ? `· Sisa ${earlyBirdRemaining} Paket!` : ''}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/70 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-white/10">
                  VIP All Access
                </span>
              </div>

              <div>
                <h2 className="text-white font-bold text-xl sm:text-2xl leading-snug">
                  Unlock Fitur Instansi & Formasi VIP
                </h2>
                <p className="text-blue-200/80 text-sm mt-1.5 leading-relaxed max-w-md">
                  Gunakan Paket VIP Bundling untuk akses penuh data 14.000+ formasi, rincian tukin nasional, dan peluang kelulusan.
                </p>
              </div>

              <Button
                onClick={(e) => { e.stopPropagation(); navigate('/dashboard/tryouts?category=bundling'); }}
                className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-[#2c29e2] font-bold text-sm h-10 px-5 rounded-xl shadow-lg shadow-black/20 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <LayoutGrid className="w-4 h-4" />
                Beli Paket VIP Sekarang
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>

            {/* Right: Mock formasi rows – desktop only */}
            <div className="hidden lg:flex flex-col gap-2 w-[340px] flex-shrink-0">
              {bannerMockRows.map((row, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white/8 hover:bg-white/12 backdrop-blur-sm rounded-xl px-3.5 py-2.5 border border-white/10 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-[11px] font-semibold truncate leading-tight">{row.jabatan}</p>
                    <p className="text-blue-300/70 text-[10px] mt-0.5">{row.instansi}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-white/40 text-[8px] uppercase tracking-wider">Pelamar</p>
                      <p className="text-white text-[11px] font-bold">{row.pelamar.toLocaleString('id-ID')}</p>
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      row.safe
                        ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-rose-400/20 text-rose-300 border border-rose-400/30'
                    }`}>
                      1:{row.ratio}
                    </span>
                  </div>
                </div>
              ))}
              <p className="text-white/30 text-[9px] text-center uppercase tracking-widest mt-1">
                + 14.000 formasi lainnya tersedia
              </p>
            </div>
            </div>
          </div>
        )}

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
                const isEarlyBirdActive = tryout.isEarlyBirdActive && 
                  tryout.earlyBirdQuota && 
                  (tryout.currentSales || 0) < tryout.earlyBirdQuota;

                const isReleased = !tryout.releaseDate || new Date() >= new Date(tryout.releaseDate);
                const releaseDateText = tryout.releaseDate ? new Date(tryout.releaseDate).toLocaleString('id-ID', { 
                  day: 'numeric', 
                  month: 'short', 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : '';

                return (
                  <div
                    key={tryout.id}
                    className={`bg-white border border-gray-200/60 rounded-xl overflow-hidden transition-all duration-200 hover:border-blue-300 hover:shadow-md flex flex-col h-full min-h-[420px] ${!isReleased ? 'opacity-95' : ''}`}
                  >
                    <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-blue-50 to-blue-100 flex-shrink-0 overflow-hidden">
                      {tryout.imageUrl ? (
                        <img
                          src={tryout.imageUrl}
                          alt={tryout.name}
                          loading="lazy"
                          className={`w-full h-full object-cover absolute inset-0 ${!isReleased ? 'grayscale-[0.4] brightness-90' : ''}`}
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

                      {!isReleased && (
                        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] flex items-center justify-center z-20">
                          <div className="bg-white/90 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 border border-blue-100">
                            <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                            <span className="text-[10px] font-bold text-gray-900 uppercase">Segera Hadir</span>
                          </div>
                        </div>
                      )}



                      {tryout.isBundle ? (
                        <div className="absolute bottom-3 right-3 z-10 bg-amber-100/95 text-amber-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-sm backdrop-blur-sm">
                          <FileText className="h-3.5 w-3.5" />
                          {tryout.includedTryoutIds?.length || Object.keys(tryout.questionIds || {}).length || 3} Paket
                        </div>
                      ) : tryout.totalDuration && tryout.totalDuration > 0 ? (
                        <div className="absolute bottom-3 right-3 z-10 bg-white/95 text-gray-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-medium shadow-sm backdrop-blur-sm">
                          <Clock className="h-3.5 w-3.5" />
                          {tryout.totalDuration} menit
                        </div>
                      ) : null}
                    </div>

                    <div className="p-4 flex flex-col flex-grow">
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {tryout.isBundle && (
                            <Badge className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-none text-[10px] px-2 py-0.5 font-black uppercase tracking-wider shadow-sm">
                              💎 VIP BUNDLING
                            </Badge>
                          )}
                          {tryout.type && !tryout.isBundle && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-2 py-0.5 hover:bg-blue-100">
                              {tryout.type}
                            </Badge>
                          )}
                          {tryout.category === 'premium' && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs px-2 py-0.5 hover:bg-amber-100">
                              PREMIUM
                            </Badge>
                          )}
                          {!isReleased && (
                            <Badge className="bg-blue-600 text-white border-none text-[10px] px-2 py-0.5 font-black uppercase tracking-wider animate-pulse">
                              🚀 Rilis {releaseDateText}
                            </Badge>
                          )}
                          {isPurchased && isReleased && (
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
                          {tryout.isBundle && isEarlyBirdActive && tryout.earlyBirdPrice ? (
                            <div className="w-full">
                               <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 line-through">
                                    Rp {tryout.price.toLocaleString('id-ID')}
                                  </span>
                                  <Badge className="bg-amber-500 text-white border-none text-[9px] px-1.5 py-0 font-bold uppercase tracking-tight">
                                     Early Bird
                                  </Badge>
                                </div>
                                <div className="text-lg font-bold text-blue-600">
                                  Rp {tryout.earlyBirdPrice.toLocaleString('id-ID')}
                                </div>
                            </div>
                          ) : isFree ? (
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
                              {hasDiscount && tryout.originalPrice && tryout.originalPrice > tryout.price ? (
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
                          disabled={!isReleased}
                          className={`w-full h-10 text-sm font-semibold rounded-lg shadow-sm transition-all duration-200 ${
                            !isReleased 
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                          onClick={() => navigate(`/dashboard/tryout/${tryout.id}`)}
                        >
                          {!isReleased ? `Rilis: ${releaseDateText}` : (isPurchased ? 'Mulai Kerjakan' : isFree ? 'Daftar Gratis' : 'Beli Try Out')}
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
