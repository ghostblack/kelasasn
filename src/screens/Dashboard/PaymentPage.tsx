import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTryoutById } from '@/services/tryoutService';
import {
  createPaymentTransaction,
  getTripayPaymentChannels,
  calculateFee,
  TripayChannel,
} from '@/services/paymentService';
import { TryoutPackage } from '@/types';
import { VIP_BUNDLING_ID, calculateCurrentVIPPrice } from '@/services/vipBundlingService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { CreditCard, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Grup channel yang ingin ditampilkan (opsional filter)
const GROUP_ORDER = ['Virtual Account', 'QRIS', 'Convenience Store', 'E-Wallet'];

export const PaymentPage: React.FC = () => {
  const { tryoutId } = useParams<{ tryoutId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [tryout, setTryout] = useState<TryoutPackage | null>(null);
  const [channels, setChannels] = useState<TripayChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<TripayChannel | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!tryoutId) { setLoadingPage(false); return; }
    loadPaymentData();
  }, [tryoutId, authLoading]);

  useEffect(() => {
    if (user) setCustomerName(user.displayName || '');
  }, [user]);

  const loadPaymentData = async () => {
    if (!tryoutId) return;
    try {
      setLoadingPage(true);
      
      let tryoutData: TryoutPackage | null = null;
      
      if (tryoutId === VIP_BUNDLING_ID) {
        const price = await calculateCurrentVIPPrice();
        tryoutData = {
          id: VIP_BUNDLING_ID,
          name: 'VIP Bundling All Access CPNS (1 Tahun)',
          price: price,
          description: 'Akses penuh fitur Formasi CPNS, Instansi CPNS, dan Semua Paket Try Out selama 1 tahun.',
          isActive: true,
          category: 'premium',
          type: 'BOTH',
          features: ['Akses Formasi CPNS', 'Akses Instansi CPNS', 'Semua Paket Try Out'],
          totalDuration: 100,
          twkQuestions: 30,
          tiuQuestions: 35,
          tkpQuestions: 45,
          totalQuestions: 110,
          passingGradeTWK: 65,
          passingGradeTIU: 80,
          passingGradeTKP: 166,
          questionIds: [],
          createdAt: new Date(),
        } as TryoutPackage;
      } else {
        tryoutData = await getTryoutById(tryoutId);
      }

      if (!tryoutData) throw new Error('Produk tidak ditemukan');
      setTryout(tryoutData);

      // Load channels paralel
      setLoadingChannels(true);
      const channelList = await getTripayPaymentChannels();
      const active = channelList.filter((c) => c.active);
      setChannels(active);
      // Default pilih QRIS jika ada
      const defaultQris = active.find((c) => c.code === 'QRIS');
      if (defaultQris) setSelectedChannel(defaultQris);
    } catch (error) {
      console.error('Error loading payment data:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal memuat data pembayaran',
        variant: 'destructive',
      });
    } finally {
      setLoadingPage(false);
      setLoadingChannels(false);
    }
  };

  const handlePayment = async () => {
    if (!tryout || !user || !customerName || !customerPhone || !selectedChannel) {
      toast({
        title: 'Data tidak lengkap',
        description: 'Mohon lengkapi nama, nomor WhatsApp, dan pilih metode pembayaran',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);

      const isEarlyBirdActive = tryout.isEarlyBirdActive && 
        tryout.earlyBirdQuota && 
        (tryout.currentSales || 0) < tryout.earlyBirdQuota;
      
      const activePrice = isEarlyBirdActive ? tryout.earlyBirdPrice || 0 : tryout.price;

      const payment = await createPaymentTransaction(
        user.uid,
        tryout.id,
        tryout.name,
        activePrice,
        selectedChannel.code,
        customerName,
        user.email || '',
        customerPhone
      );

      toast({ title: 'Transaksi dibuat!', description: 'Mengarahkan ke halaman pembayaran...' });
      navigate(`/dashboard/payment/${tryout.id}/process/${payment.id}`);
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Gagal membuat transaksi',
        description: error instanceof Error ? error.message : 'Silakan coba lagi',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  if (loadingPage) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Memuat data pembayaran...</p>
        </div>
      </div>
    );
  }

  if (!tryout) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Try out tidak ditemukan</p>
        <Button onClick={() => navigate('/dashboard/tryouts')} className="mt-4">
          Kembali ke Daftar Try Out
        </Button>
      </div>
    );
  }

  // Hitung fee berdasarkan channel terpilih
  const isEarlyBirdActive = tryout.isEarlyBirdActive && 
    tryout.earlyBirdQuota && 
    (tryout.currentSales || 0) < tryout.earlyBirdQuota;
  
  const activePrice = isEarlyBirdActive ? tryout.earlyBirdPrice || 0 : tryout.price;
  const fee = selectedChannel ? calculateFee(selectedChannel, activePrice) : 0;
  const totalAmount = activePrice + fee;

  // Kelompokkan channels berdasarkan grup
  const grouped: Record<string, TripayChannel[]> = {};
  for (const ch of channels) {
    if (!grouped[ch.group]) grouped[ch.group] = [];
    grouped[ch.group].push(ch);
  }
  const sortedGroups = GROUP_ORDER.filter((g) => grouped[g]).concat(
    Object.keys(grouped).filter((g) => !GROUP_ORDER.includes(g))
  );

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <Button
        variant="ghost"
        onClick={() => navigate(tryoutId === VIP_BUNDLING_ID ? '/dashboard/cpns-formasi' : `/dashboard/tryout/${tryoutId}`)}
        className="mb-6 text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali ke {tryoutId === VIP_BUNDLING_ID ? 'Dashboard' : 'Detail Try Out'}
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ─── Kiri: Form + Channel ─────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Info Pembeli */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Pembeli</h2>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-600">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-600">Nomor WhatsApp</Label>
                <Input
                  id="phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  type="tel"
                  className="bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </section>

          {/* Pilih Metode Pembayaran */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metode Pembayaran</h2>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              {loadingChannels ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <Loader2 className="animate-spin w-6 h-6 mr-2" />
                  <span>Memuat metode pembayaran...</span>
                </div>
              ) : channels.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center text-gray-500 gap-2">
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                  <p className="font-medium">Metode pembayaran tidak tersedia</p>
                  <p className="text-sm">Pastikan VITE_TRIPAY_APPS_SCRIPT_URL sudah dikonfigurasi di .env</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {sortedGroups.map((group) => (
                    <div key={group}>
                      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                        {group}
                      </p>
                      <div className="grid grid-cols-1 gap-3">
                        {grouped[group].map((channel) => {
                          const chFee = calculateFee(channel, tryout.price);
                          const isSelected = selectedChannel?.code === channel.code;
                          return (
                            <button
                              key={channel.code}
                              onClick={() => setSelectedChannel(channel)}
                              className={`group flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                                  : 'border-gray-100 hover:border-blue-200 hover:bg-gray-50/50'
                              }`}
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-8 bg-white rounded border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {channel.icon_url ? (
                                    <img
                                      src={channel.icon_url}
                                      alt={channel.name}
                                      className="w-full h-full object-contain p-1"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <CreditCard className="w-5 h-5 text-gray-300" />
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className={`font-medium block text-sm transition-colors ${isSelected ? 'text-blue-900' : 'text-gray-700 group-hover:text-gray-900'}`}>
                                    {channel.name}
                                  </span>
                                  <span className="text-xs text-gray-500 mt-0.5">
                                    {chFee === 0
                                      ? 'Bebas biaya admin'
                                      : `Biaya admin Rp ${chFee.toLocaleString('id-ID')}`}
                                  </span>
                                </div>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300 group-hover:border-blue-300'}`}>
                                {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ─── Kanan: Ringkasan & Tombol Bayar ─────── */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Ringkasan Pesanan</h2>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-1">Produk</p>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{tryout.name}</p>
                  {tryout.id === VIP_BUNDLING_ID && (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 text-[8px] h-4">VIP</Badge>
                  )}
                </div>
              </div>

              {selectedChannel && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Metode</p>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 font-normal hover:bg-gray-200 border-0">
                    {selectedChannel.name}
                  </Badge>
                </div>
              )}

              <Separator className="bg-gray-100" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    {tryout.id === VIP_BUNDLING_ID ? 'Harga Paket' : isEarlyBirdActive ? 'Harga Early Bird' : 'Harga Try Out'}
                  </span>
                  <div className="text-right">
                    {isEarlyBirdActive && tryout.price > 0 && (
                      <span className="text-[10px] text-gray-400 line-through block leading-none mb-1">
                        Rp {tryout.price.toLocaleString('id-ID')}
                      </span>
                    )}
                    <span className="font-medium text-gray-900 text-base">
                      Rp {activePrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Biaya Admin</span>
                  <span className={`font-medium ${fee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                    {fee === 0 ? 'Gratis' : `Rp ${fee.toLocaleString('id-ID')}`}
                  </span>
                </div>
              </div>

              <Separator className="bg-gray-100" />

              <div className="flex justify-between items-end pt-2">
                <span className="text-sm text-gray-600">Total Pembayaran</span>
                <span className="font-bold text-2xl text-blue-600">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </span>
              </div>

              <Button
                onClick={handlePayment}
                disabled={!selectedChannel || !customerName || !customerPhone || processing || channels.length === 0}
                className="w-full h-12 text-base rounded-xl font-medium shadow-none hover:shadow-md transition-all active:scale-[0.98]"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Bayar Sekarang
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-gray-400">
                Pembayaran aman & terenkripsi
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
