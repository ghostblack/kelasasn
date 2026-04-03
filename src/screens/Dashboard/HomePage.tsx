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
  const [activeSlide, setActiveSlide] = useState(0);

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
        const fomoRemaining = remaining > 15 ? (remaining % 9) + 4 : Math.max(1, remaining);
        setEarlyBirdRemaining(fomoRemaining);
        
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
          // 1. Prioritaskan Paket Bundling
          if (a.isBundle && !b.isBundle) return -1;
          if (!a.isBundle && b.isBundle) return 1;

          // 2. Prioritaskan yang sudah terbeli
          const aPurchased = userTryouts.some(t => t.tryoutId === a.id);
          const bPurchased = userTryouts.some(t => t.tryoutId === b.id);
          if (aPurchased && !bPurchased) return -1;
          if (!aPurchased && bPurchased) return 1;

          // 3. Berdasarkan tanggal pembuatan (terbaru)
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
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

  useEffect(() => {
    if (hasVip || loading) return;
    const interval = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, [hasVip, loading]);

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

        {/* ── Carousel Banner VIP ─────────────────────────────────────────── */}
        {!hasVip && (
          <div className="relative w-full h-[280px] sm:h-[260px] lg:h-[240px] rounded-2xl overflow-hidden cursor-pointer group shadow-sm border border-gray-200 mb-6 bg-gray-900 group">
            <div 
              className="flex w-full h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
                {/* SLIDE 1: FOMO Early Bird */}
                <div 
                  className="w-full flex-shrink-0 h-full relative" 
                  style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 60%, #ea580c 100%)' }}
                  onClick={() => navigate('/dashboard/tryouts?category=bundling')}
                >
                    <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col justify-center h-full p-5 sm:p-6 lg:p-7 shrink-0">
                       <span className="inline-flex items-center gap-1.5 bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full animate-pulse w-fit mb-2 shadow-sm">
                          <Sparkles className="w-3 h-3" />
                          Promo Early Bird · Sisa {earlyBirdRemaining} Kuota!
                       </span>
                       <h2 className="text-white font-bold text-xl sm:text-2xl leading-snug drop-shadow-md">
                         Segera Beli VIP Bundling <br className="hidden sm:block"/> Sebelum Kehabisan!
                       </h2>
                       <p className="text-red-100/90 text-sm mt-1.5 leading-relaxed max-w-md">
                         Akses penuh materi, try out & formasi. <span className="font-bold border-b border-dashed text-white px-0.5">Hanya Rp 20.000</span> (Normal Rp 60.000).
                       </p>
                       <Button
                          onClick={(e) => { e.stopPropagation(); navigate('/dashboard/tryouts?category=bundling'); }}
                          className="mt-3 sm:mt-4 w-fit bg-white hover:bg-gray-50 text-red-700 font-bold text-sm h-10 px-5 rounded-xl shadow-lg transition-all hover:scale-105"
                       >
                          Amankan Kuota Sekarang <ArrowRight className="w-4 h-4 ml-2" />
                       </Button>
                    </div>
                </div>

                {/* SLIDE 2: Formasi */}
                <div 
                  className="w-full flex-shrink-0 h-full relative" 
                  style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #4f46e5 100%)' }}
                  onClick={() => navigate('/dashboard/formasi')}
                >
                    <div className="absolute -bottom-8 left-1/3 w-32 h-32 bg-blue-400/20 rounded-full blur-xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center lg:justify-between h-full gap-4 p-5 sm:p-6 lg:p-7">
                       <div className="flex-1 w-full flex flex-col justify-center">
                          <span className="inline-flex items-center gap-1.5 bg-blue-400/20 text-blue-200 border border-blue-400/30 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full w-fit mb-2">
                             <LayoutGrid className="w-3 h-3" /> Eksklusif VIP
                          </span>
                          <h2 className="text-white font-bold text-xl sm:text-2xl leading-snug">
                            Buka Peta Persaingan Formasi
                          </h2>
                          <p className="text-blue-200/80 text-sm mt-1.5 leading-relaxed max-w-md">
                            Akses jumlah pelamar, rincian gaji, dan probabilitas kelulusan dari 14.000+ data formasi asli.
                          </p>
                          <Button
                             onClick={(e) => { e.stopPropagation(); navigate('/dashboard/formasi'); }}
                             className="mt-3 sm:mt-4 w-fit bg-white/20 hover:bg-white/30 text-white font-bold text-sm h-10 px-5 rounded-xl border border-white/30 backdrop-blur-md transition-all shadow-sm"
                          >
                             Cari Formasi <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                       </div>
                       
                       <div className="hidden lg:flex flex-col gap-2 w-[340px] flex-shrink-0 self-center pointer-events-none pb-2">
                         {bannerMockRows.map((row, i) => (
                           <div key={i} className="flex items-center justify-between gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-3.5 py-2.5 border border-white/10">
                             <div className="flex-1 min-w-0">
                               <p className="text-white text-[11px] font-semibold truncate leading-tight">{row.jabatan}</p>
                               <p className="text-blue-200/70 text-[10px] mt-0.5 truncate">{row.instansi}</p>
                             </div>
                             <div className="flex items-center gap-3 flex-shrink-0 text-right">
                               <div>
                                 <p className="text-white/50 text-[8px] uppercase tracking-wider mb-0.5">Pelamar</p>
                                 <p className="text-white text-[11px] font-bold">{row.pelamar.toLocaleString()}</p>
                               </div>
                               <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${row.safe ? 'bg-emerald-400/20 text-emerald-300' : 'bg-rose-400/20 text-rose-300'}`}>
                                  1:{row.ratio}
                               </span>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                </div>

                {/* SLIDE 3: Instansi & Leaderboard */}
                <div 
                  className="w-full flex-shrink-0 h-full relative" 
                  style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 60%, #059669 100%)' }}
                  onClick={() => navigate('/dashboard/instansi')}
                >
                    <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col justify-center h-full p-5 sm:p-6 lg:p-7">
                       <span className="inline-flex items-center gap-1.5 bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full w-fit mb-2">
                          <Trophy className="w-3 h-3" /> Peringkat & Rating Instansi
                       </span>
                       <h2 className="text-white font-bold text-xl sm:text-2xl leading-snug">
                         Awas Ketemu Instansi "Red Flag"
                       </h2>
                       <p className="text-emerald-100/90 text-sm mt-1.5 leading-relaxed max-w-md">
                         Telusuri data Tunjangan Kinerja tertinggi. Jadilah juara dan pamerkan pencapaian SKD-mu pada Leaderboard Nasional secara real-time.
                       </p>
                       <Button
                          onClick={(e) => { e.stopPropagation(); navigate('/dashboard/instansi'); }}
                          className="mt-3 sm:mt-4 w-fit bg-emerald-800 hover:bg-emerald-900 text-emerald-50 font-bold text-sm h-10 px-5 rounded-xl border border-emerald-700/50 transition-all shadow-md"
                       >
                          Cek Tukin Instansi <ArrowRight className="w-4 h-4 ml-2" />
                       </Button>
                    </div>
                </div>
            </div>

            {/* Dots Pagination */}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2.5 z-20">
              {[0, 1, 2].map((idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setActiveSlide(idx); }}
                  className={`border-none h-2 rounded-full transition-all duration-300 shadow-sm ${activeSlide === idx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
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
                                    Rp {(tryout.originalPrice || tryout.price).toLocaleString('id-ID')}
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
