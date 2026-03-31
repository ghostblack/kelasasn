import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingScreen } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, CircleCheck as CheckCircle, Clock, FileText, Star, Layers } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllTryouts, getUserTryouts } from '@/services/tryoutService';
import { checkUserFormasiAccess } from '@/services/formasiAccessCodeService';
import { TryoutPackage, UserTryout } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const TryoutsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tryouts, setTryouts] = useState<TryoutPackage[]>([]);
  const [userTryouts, setUserTryouts] = useState<UserTryout[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTryout, setSelectedTryout] = useState<TryoutPackage | null>(null);
  const [hasVIP, setHasVIP] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const [allTryouts, purchased, isVIP] = await Promise.all([
        getAllTryouts(),
        getUserTryouts(user.uid),
        checkUserFormasiAccess(user.uid)
      ]);

      const activeTryouts = allTryouts.filter(tryout => tryout.isActive === true || tryout.isDraft === true);
      activeTryouts.sort((a, b) => {
        // 1. Prioritaskan Paket Bundling
        if (a.isBundle && !b.isBundle) return -1;
        if (!a.isBundle && b.isBundle) return 1;

        // 2. Prioritaskan yang sudah terbeli
        const aPurchased = purchased.some(t => t.tryoutId === a.id);
        const bPurchased = purchased.some(t => t.tryoutId === b.id);
        if (aPurchased && !bPurchased) return -1;
        if (!aPurchased && bPurchased) return 1;

        // 3. Berdasarkan tanggal pembuatan (terbaru)
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setTryouts(activeTryouts);
      setUserTryouts(purchased);
      setHasVIP(isVIP);
    } catch (error) {
      console.error('Error loading tryouts data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data try out',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isPurchased = (tryoutId: string) => {
    return userTryouts.some((ut) => ut.tryoutId === tryoutId);
  };

  const filteredTryouts = tryouts.filter((tryout) => {
    const matchesSearch = tryout.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'free' && tryout.category === 'free') ||
      (selectedCategory === 'premium' && tryout.category === 'premium') ||
      (selectedCategory === 'bundling' && tryout.isBundle) ||
      tryout.type === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'Semua' },
    { value: 'free', label: 'Gratis' },
    { value: 'premium', label: 'Premium' },
    { value: 'SKD', label: 'SKD' },
    { value: 'SKB', label: 'SKB' },
    { value: 'bundling', label: 'Bundling' },
  ];

  if (loading) {
    return <LoadingScreen message="Memuat daftar try out..." type="spinner" fullScreen overlay />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          List Try Out
        </h1>
        <p className="text-sm text-gray-500">
          Pilih try out sesuai kebutuhan Anda
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Cari try out..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-11 h-11 bg-white border-gray-200/60 focus:border-gray-300 rounded-xl text-sm"
        />
      </div>

      {hasVIP && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl overflow-hidden shadow-lg mb-8 border-0 ring-4 ring-blue-500/10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="p-8 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />
            
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-5 text-center md:text-left flex-1">
                <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm border border-white/20">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest leading-none">VIP All-Access Active</span>
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight leading-none mb-3 uppercase">
                    Paket VIP <span className="text-blue-100 italic">Bundling</span>
                  </h2>
                  <p className="text-blue-50 text-sm font-medium max-w-lg opacity-90 leading-relaxed">
                    Akses penuh ke semua try out terpilih dan data instansi SSCASN selama 1 tahun. Fokus belajar, biarkan kami siapkan materinya.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                   <Badge className="bg-white/10 text-white hover:bg-white/20 border-white/10 font-bold uppercase text-[9px] px-2 py-1">SKD Terlengkap</Badge>
                   <Badge className="bg-white/10 text-white hover:bg-white/20 border-white/10 font-bold uppercase text-[9px] px-2 py-1">Update Rutin</Badge>
                   <Badge className="bg-white/10 text-white hover:bg-white/20 border-white/10 font-bold uppercase text-[9px] px-2 py-1">Pembahasan Detail</Badge>
                </div>
              </div>
              <div className="shrink-0 group">
                 <div className="w-32 h-32 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 relative rotate-3 group-hover:rotate-0 transition-transform duration-500">
                    <Layers className="h-16 w-16 text-white drop-shadow-xl -rotate-6 group-hover:rotate-0 transition-transform duration-500" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full border-4 border-indigo-700 flex items-center justify-center shadow-lg">
                       <CheckCircle className="w-4 h-4 text-indigo-700" />
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {categories.map((cat) => (
          <Button
            key={cat.value}
            variant={selectedCategory === cat.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat.value)}
            className={
              selectedCategory === cat.value
                ? 'bg-blue-600 hover:bg-blue-700 text-white text-xs h-9'
                : 'border-gray-200/60 hover:bg-gray-50 text-gray-700 text-xs h-9'
            }
          >
            {cat.label}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTryouts.map((tryout) => {
          const purchased = isPurchased(tryout.id);
          const isFree = tryout.category === 'free';
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
                    {tryout.category === 'premium' && !tryout.isBundle && (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs px-2 py-0.5 hover:bg-amber-100">
                        PREMIUM
                      </Badge>
                    )}
                    {!isReleased && (
                      <Badge className="bg-blue-600 text-white border-none text-[10px] px-2 py-0.5 font-black uppercase tracking-wider animate-pulse">
                        🚀 Rilis {releaseDateText}
                      </Badge>
                    )}
                    {(purchased || (hasVIP && tryout.isBundle)) && isReleased && (
                      <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-xs font-medium text-green-700">
                          {purchased ? 'Terbeli' : 'VIP Access'}
                        </span>
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
                  <div className="min-h-[40px] flex items-center">
                    {tryout.isBundle && isEarlyBirdActive && tryout.earlyBirdPrice ? (
                      <div className="space-y-0.5">
                         <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-400 line-through font-medium">
                              Rp {(tryout.originalPrice || tryout.price).toLocaleString('id-ID')}
                            </span>
                            <Badge className="bg-amber-500 text-white border-none text-[9px] px-1.5 py-0 font-bold uppercase tracking-tight">
                               Early Bird
                            </Badge>
                          </div>
                          <div className="text-xl font-black text-blue-600 tracking-tight">
                            Rp {tryout.earlyBirdPrice.toLocaleString('id-ID')}
                          </div>
                      </div>
                    ) : isFree ? (
                      <div className="space-y-0.5">
                        {tryout.originalPrice && tryout.originalPrice > 0 && (
                          <div className="text-[11px] text-gray-400 line-through font-medium">
                            Rp {tryout.originalPrice.toLocaleString('id-ID')}
                          </div>
                        )}
                        <div className="text-xl font-black text-green-600 tracking-tight">GRATIS</div>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {tryout.originalPrice && tryout.originalPrice > tryout.price ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-400 line-through font-medium">
                              Rp {tryout.originalPrice.toLocaleString('id-ID')}
                            </span>
                            <Badge className="bg-orange-500 text-white border-none text-[9px] px-1.5 py-0 font-bold uppercase tracking-tight">
                              Hemat {Math.round(((tryout.originalPrice - tryout.price) / tryout.originalPrice) * 100)}%
                            </Badge>
                          </div>
                        ) : null}
                        <div className="text-xl font-black text-blue-600 tracking-tight">
                          Rp {tryout.price.toLocaleString('id-ID')}
                        </div>
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
                    {!isReleased ? `Rilis: ${releaseDateText}` : (purchased ? (tryout.isBundle ? 'Akses Paket' : 'Mulai Kerjakan') : isFree ? 'Daftar Gratis' : 'Beli Try Out')}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTryouts.length === 0 && (
        <div className="bg-white border border-gray-200/60 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada try out yang ditemukan</h3>
          <p className="text-sm text-gray-500">Coba ubah kata kunci atau filter pencarian Anda</p>
        </div>
      )}

      <Dialog open={!!selectedTryout} onOpenChange={() => setSelectedTryout(null)}>
        <DialogContent className="sm:max-w-md max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:max-h-[90vh] max-sm:overflow-y-auto max-sm:w-full max-sm:data-[state=open]:animate-slide-in-from-bottom max-sm:data-[state=closed]:animate-slide-out-to-bottom">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {selectedTryout?.name}
            </DialogTitle>
            <DialogDescription className="text-sm">{selectedTryout?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <h4 className="font-medium text-sm mb-2 text-gray-900">Fitur:</h4>
              <ul className="space-y-2">
                {selectedTryout?.features.map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="font-medium text-sm text-gray-700">Total:</span>
              <span className="text-xl font-semibold text-gray-900">
                {selectedTryout?.price === 0
                  ? 'Gratis'
                  : `Rp ${selectedTryout?.price.toLocaleString('id-ID')}`}
              </span>
            </div>

            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 h-10 text-sm"
              onClick={() => {
                if (selectedTryout) {
                  navigate(`/dashboard/tryout/${selectedTryout.id}`);
                  setSelectedTryout(null);
                }
              }}
            >
              Lihat Detail
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
