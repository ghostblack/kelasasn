import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Search, CircleCheck as CheckCircle, Clock, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getAllTryouts, getUserTryouts, purchaseTryout } from '@/services/tryoutService';
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
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    loadTryouts();
  }, [user, authLoading]);

  const loadTryouts = async () => {
    if (!user) return;

    try {
      const allTryouts = await getAllTryouts();
      const activeTryouts = allTryouts.filter(tryout => tryout.isActive === true);
      setTryouts(activeTryouts);

      try {
        const purchased = await getUserTryouts(user.uid);
        setUserTryouts(purchased);
      } catch (error) {
        console.error('Error loading user tryouts:', error);
        setUserTryouts([]);
      }
    } catch (error) {
      console.error('Error loading tryouts:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data try out',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedTryout || !user || purchasing) return;

    setPurchasing(true);
    try {
      await purchaseTryout(user.uid, selectedTryout.id, selectedTryout.name);
      toast({
        title: 'Berhasil!',
        description: 'Try out berhasil dibeli',
      });

      setSelectedTryout(null);
      await loadTryouts();
    } catch (error) {
      console.error('Error purchasing tryout:', error);
      toast({
        title: 'Error',
        description: 'Gagal membeli try out',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
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
      tryout.type === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'Semua' },
    { value: 'free', label: 'Gratis' },
    { value: 'premium', label: 'Premium' },
    { value: 'SKD', label: 'SKD' },
    { value: 'SKB', label: 'SKB' },
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

                {!tryout.isBundle && tryout.totalDuration && tryout.totalDuration > 0 && (
                  <div className="absolute bottom-3 right-3 z-10 bg-white/95 text-gray-700 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs font-medium shadow-sm backdrop-blur-sm">
                    <Clock className="h-3.5 w-3.5" />
                    {tryout.totalDuration} menit
                  </div>
                )}
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {tryout.isBundle && (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs px-2 py-0.5 font-bold uppercase hover:bg-purple-100">
                        📦 Paket Bundling
                      </Badge>
                    )}
                    {tryout.type && !tryout.isBundle && (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-2 py-0.5 hover:bg-blue-100">
                        {tryout.type}
                      </Badge>
                    )}
                    {purchased && (
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
                  <div className="min-h-[32px] flex items-center">
                    {isFree ? (
                      <div>
                        {tryout.originalPrice && tryout.originalPrice > 0 ? (
                          <div>
                            <div className="text-sm text-gray-400 line-through mb-1">
                              Rp {tryout.originalPrice.toLocaleString('id-ID')}
                            </div>
                            <div className="text-xl font-bold text-green-600">GRATIS</div>
                          </div>
                        ) : (
                          <div className="text-xl font-bold text-green-600">GRATIS</div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {hasDiscount && tryout.originalPrice ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 line-through">
                              Rp {tryout.originalPrice.toLocaleString('id-ID')}
                            </span>
                            <Badge className="bg-orange-500 text-white border-none text-[10px] px-1.5 py-0">
                              Hemat {tryout.discount}%
                            </Badge>
                          </div>
                        ) : null}
                        <div className="text-xl font-bold text-blue-600">
                          Rp {tryout.price.toLocaleString('id-ID')}
                        </div>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 text-sm font-semibold rounded-lg shadow-sm transition-all duration-200"
                    onClick={() => navigate(`/dashboard/tryout/${tryout.id}`)}
                  >
                    {purchased ? 'Lihat Detail' : 'Selengkapnya'}
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
                {selectedTryout?.features.map((feature, idx) => (
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
