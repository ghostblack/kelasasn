import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTryoutById, purchaseTryout, getUserTryouts, resetTryoutAttempt, getUserResultsByTryout } from '@/services/tryoutService';
import { getActiveTryoutSession } from '@/services/tryoutSessionService';
import { validateClaimCode, useClaimCode } from '@/services/claimCodeService';
import { TryoutPackage, UserTryout, TryoutSession } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingScreen } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Clock, FileText, CircleCheck as CheckCircle, ShoppingCart, Play, CircleAlert as AlertCircle, Gift, Info, ArrowLeft, RotateCcw, Send, Instagram, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

export const TryoutDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [tryout, setTryout] = useState<TryoutPackage | null>(null);
  const [userTryout, setUserTryout] = useState<UserTryout | null>(null);
  const [activeSession, setActiveSession] = useState<TryoutSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [attempts, setAttempts] = useState<number>(0);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showClaimCodeDialog, setShowClaimCodeDialog] = useState(false);
  const [claimCode, setClaimCode] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [includedTryouts, setIncludedTryouts] = useState<TryoutPackage[]>([]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    if (!id) {
      setLoading(false);
      setTryout(null);
      return;
    }

    loadTryoutDetail();
  }, [id, user, authLoading]);

  const loadTryoutDetail = async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      const tryoutData = await getTryoutById(id);

      if (!tryoutData) {
        setTryout(null);
        toast({
          title: 'Error',
          description: 'Try out tidak ditemukan',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      setTryout(tryoutData);

      if (tryoutData.isBundle && tryoutData.includedTryoutIds) {
        const incTryouts = await Promise.all(
          tryoutData.includedTryoutIds.map(incId => getTryoutById(incId))
        );
        setIncludedTryouts(incTryouts.filter(t => t !== null) as TryoutPackage[]);
      }

      const userTryouts = await getUserTryouts(user.uid);
      const purchased = userTryouts.find(ut => ut.tryoutId === id);
      setUserTryout(purchased || null);

      if (purchased) {
        const results = await getUserResultsByTryout(user.uid, id);
        setAttempts(results.length);

        // Check for active session
        const session = await getActiveTryoutSession(user.uid, id);
        setActiveSession(session);
      }
    } catch (error) {
      console.error('Error loading tryout:', error);
      setTryout(null);
      toast({
        title: 'Error',
        description: 'Gagal memuat detail try out. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!tryout || !user) return;

    try {
      setPurchasing(true);

      if (tryout.price === 0) {
        setShowClaimCodeDialog(true);
      } else {
        navigate(`/dashboard/payment/${tryout.id}/qris`);
      }
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

  const handleClaimWithCode = async () => {
    if (!tryout || !user || !claimCode.trim()) {
      toast({
        title: 'Input Diperlukan',
        description: 'Silakan masukkan kode klaim terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    try {
      setClaiming(true);
      
      // 1. Validate code
      const validation = await validateClaimCode(claimCode.toUpperCase(), user.uid);
      
      if (!validation.valid) {
        toast({
          title: 'Gagal Klaim',
          description: validation.message,
          variant: 'destructive',
        });
        return;
      }

      if (validation.tryoutId !== tryout.id) {
        toast({
          title: 'Kode Tidak Sesuai',
          description: 'Kode ini bukan untuk paket try out ini.',
          variant: 'destructive',
        });
        return;
      }

      // 2. Use code
      await useClaimCode(claimCode.toUpperCase(), user.uid);

      // 3. Purchase (Grant Access)
      await purchaseTryout(user.uid, tryout.id, tryout.name);

      toast({
        title: 'Klaim Berhasil!',
        description: 'Kode klaim berhasil digunakan. Selamat belajar!',
      });

      setShowClaimCodeDialog(false);
      setClaimCode('');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadTryoutDetail();
    } catch (error) {
      console.error('Error claiming code:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal menggunakan kode klaim',
        variant: 'destructive',
      });
    } finally {
      setClaiming(false);
    }
  };

  const handleStartTryout = () => {
    if (!userTryout) return;
    setShowConfirmationDialog(true);
  };

  const handleConfirmStart = () => {
    if (!agreedToTerms) {
      toast({
        title: 'Persetujuan Diperlukan',
        description: 'Silakan centang persetujuan terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }
    setShowConfirmationDialog(false);
    navigate(`/dashboard/tryout/${id}/exam`);
  };

  const handleRetake = async () => {
    if (!userTryout) return;

    try {
      setResetting(true);
      await resetTryoutAttempt(userTryout.id);

      toast({
        title: 'Berhasil',
        description: 'Anda dapat mengerjakan try out lagi',
      });

      await loadTryoutDetail();
      navigate(`/dashboard/tryout/${id}/exam`);
    } catch (error) {
      console.error('Error resetting tryout:', error);
      toast({
        title: 'Error',
        description: 'Gagal mereset try out',
        variant: 'destructive',
      });
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Memuat detail try out..." type="spinner" fullScreen overlay />;
  }

  if (!tryout) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Try Out Tidak Ditemukan</h2>
            <p className="text-gray-600 mb-6">Try out yang Anda cari tidak ditemukan atau sudah tidak tersedia.</p>
            <Button onClick={() => navigate('/dashboard/tryouts')} className="bg-blue-600 hover:bg-blue-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Daftar Try Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalDuration = tryout.totalDuration;
  const isPurchased = !!userTryout;
  const isCompleted = userTryout?.status === 'completed';
  // Check if there's an active session to determine if tryout is in progress
  const isInProgress = !!activeSession && activeSession.status === 'active';
  const hasQuestions = (tryout.questionIds && tryout.questionIds.length > 0) || 
    tryout.name.toLowerCase().includes('test') || 
    tryout.name.toLowerCase().includes('dummy');

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-32 lg:pb-6">
      <Button
        variant="outline"
        onClick={() => navigate('/dashboard/tryouts')}
        className="mb-6 border-2 hover:bg-gray-50"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali ke Daftar Try Out
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-6">
        {/* Left Side - Main Content */}
        <div className="space-y-6">
          {/* Title and Image Section */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-[200px,1fr] gap-6 p-6">
              {/* Image */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 flex items-center justify-center">
                {tryout.imageUrl ? (
                  <img
                    src={tryout.imageUrl}
                    alt={tryout.name}
                    className="w-full h-auto object-contain rounded-lg shadow-md max-h-[160px]"
                  />
                ) : (
                  <div className="w-full aspect-square flex items-center justify-center">
                    <div className="w-16 h-16 bg-blue-200/50 rounded-xl flex items-center justify-center">
                      <FileText className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                )}
              </div>

              {/* Title and Description */}
              <div className="flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex flex-col gap-1">
                    {tryout.isBundle && (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs w-fit font-bold uppercase hover:bg-purple-100 mb-2">
                        📦 Paket Bundling
                      </Badge>
                    )}
                    <h1 className="text-2xl font-bold text-gray-900">{tryout.name}</h1>
                  </div>
                  <Badge
                    variant="outline"
                    className={`ml-4 shrink-0 ${
                      tryout.category === 'free'
                        ? 'bg-green-50 text-green-700 border-green-300'
                        : 'bg-blue-50 text-blue-700 border-blue-300'
                    }`}
                  >
                    {tryout.category === 'free' ? 'GRATIS' : 'PREMIUM'}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{tryout.description}</p>

                {/* Duration and Type */}
                <div className="grid grid-cols-2 gap-3 mt-auto">
                  {!tryout.isBundle && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-xs text-blue-700 font-medium">Durasi</p>
                        <p className="text-sm font-bold text-gray-900">{totalDuration} Menit</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-orange-600 shrink-0" />
                    <div>
                      <p className="text-xs text-orange-700 font-medium">Tipe</p>
                      <p className="text-sm font-bold text-gray-900">{tryout.type}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Paket Bundle Content OR Detail Kategori Soal */}
          {tryout.isBundle ? (
            <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-10 -mt-10 pointer-events-none" />
              <h3 className="text-base font-semibold text-purple-900 mb-4 relative">Isi Paket Bundling Ini</h3>
              <div className="space-y-3 relative">
                {includedTryouts.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Memuat daftar try out dalam paket...</p>
                ) : (
                  includedTryouts.map((inc, idx) => (
                    <div key={inc.id} className="flex items-center gap-4 py-3 px-4 border border-purple-100 bg-purple-50/30 rounded-lg hover:border-purple-300 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/tryout/${inc.id}`)}>
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-purple-700">{idx + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-gray-900">{inc.name}</h4>
                        <p className="text-xs text-gray-600">{inc.totalQuestions} Soal • {inc.totalDuration} Menit</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-purple-300" />
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-4">Detail Kategori Soal</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium mb-1">TWK</p>
                  <p className="text-2xl font-bold text-blue-600">{tryout.twkQuestions}</p>
                  <p className="text-xs text-gray-600 mt-1">soal</p>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700 font-medium mb-1">TIU</p>
                  <p className="text-2xl font-bold text-green-600">{tryout.tiuQuestions}</p>
                  <p className="text-xs text-gray-600 mt-1">soal</p>
                </div>
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs text-orange-700 font-medium mb-1">TKP</p>
                  <p className="text-2xl font-bold text-orange-600">{tryout.tkpQuestions}</p>
                  <p className="text-xs text-gray-600 mt-1">soal</p>
                </div>
              </div>
            </div>
          )}

          {/* Fitur Yang Didapatkan */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Fitur Yang Didapatkan</h3>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Pembahasan soal yang lengkap dan detail</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Dapat mengulang tryout tanpa batas</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Sistem penilaian otomatis sesuai standar SKD</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Ranking nasional dan per jabatan</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">Akses ke grup Telegram Angkatan</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="space-y-4">
          {/* Price Card (if applicable) */}
          {tryout.price > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <p className="text-xs text-gray-600 font-medium mb-2">Harga</p>
              <p className="text-3xl font-bold text-blue-600 mb-1">
                Rp {tryout.price.toLocaleString('id-ID')}
              </p>
            </div>
          )}

          {/* Action Card - Desktop */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {!hasQuestions ? (
              <div className="space-y-3">
                <div className="bg-orange-50 border border-orange-300 p-4 rounded-lg text-center">
                  <div className="bg-orange-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-sm text-gray-900 font-medium mb-1">Try Out Belum Siap</p>
                  <p className="text-xs text-gray-600">Try out ini belum memiliki soal. Silakan hubungi admin.</p>
                </div>
                <Button
                  disabled
                  className="w-full h-11 text-sm font-semibold bg-gray-400 rounded-lg"
                >
                  Belum Tersedia
                </Button>
              </div>
            ) : !isPurchased ? (
              <div className="space-y-3">
                <Button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full h-11 text-sm font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
                >
                  {tryout.price === 0 ? (
                    <>
                      <Gift className="mr-2 h-4 w-4" />
                      Daftar Gratis
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Beli Sekarang
                    </>
                  )}
                </Button>
                
                {tryout.price > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setShowClaimCodeDialog(true)}
                    className="w-full h-11 text-sm font-semibold border-2 border-blue-100 hover:border-blue-200 hover:bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <Gift className="h-4 w-4" />
                    Punya Kode Klaim?
                  </Button>
                )}
              </div>
            ) : tryout.isBundle ? (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-300 p-4 rounded-lg text-center">
                  <div className="bg-green-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-900 font-medium mb-1">Paket Berhasil Dibeli</p>
                  <p className="text-xs text-gray-600">Semua try out dalam paket ini telah ditambahkan ke akun Anda.</p>
                </div>
                <Button
                  onClick={() => navigate(`/dashboard/tryouts`)}
                  className="w-full h-11 text-sm font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Pilih Try Out untuk Dikerjakan
                </Button>
              </div>
            ) : isCompleted ? (
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-300 p-4 rounded-lg text-center">
                  <div className="bg-green-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-900 font-medium mb-1">Try Out Selesai</p>
                  <p className="text-xs text-gray-600">Anda telah menyelesaikan try out ini</p>
                  {attempts > 0 && (
                    <Badge variant="outline" className="mt-2 bg-white border-green-300 text-green-700 text-xs">
                      {attempts}x percobaan
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={() => navigate(`/dashboard/tryout/${id}/result`)}
                  className="w-full h-11 text-sm font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Lihat Hasil
                </Button>
                <Button
                  onClick={handleRetake}
                  disabled={resetting}
                  variant="outline"
                  className="w-full h-11 text-sm font-semibold border border-gray-300 hover:bg-gray-50 rounded-lg"
                >
                  {resetting ? 'Memproses...' : 'Kerjakan Lagi'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {isInProgress && (
                  <div className="bg-orange-50 border border-orange-300 p-4 rounded-lg text-center">
                    <div className="bg-orange-100 rounded-full w-10 h-10 flex items-center justify-center mx-auto mb-2">
                      <RotateCcw className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-sm text-gray-900 font-medium mb-1">Try Out Sedang Berjalan</p>
                    <p className="text-xs text-gray-600">Anda dapat melanjutkan pengerjaan try out</p>
                  </div>
                )}
                <Button
                  onClick={handleStartTryout}
                  className={`w-full h-11 text-sm font-semibold rounded-lg shadow-sm ${
                    isInProgress
                      ? 'bg-orange-600 hover:bg-orange-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isInProgress ? (
                    <>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Lanjutkan Try Out
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Mulai Try Out
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Action Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {!hasQuestions ? (
            <div className="space-y-3">
              <div className="bg-orange-50 border border-orange-300 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <p className="text-sm text-gray-900 font-medium">Try Out Belum Siap</p>
                </div>
                <p className="text-xs text-gray-600">Try out ini belum memiliki soal</p>
              </div>
              <Button
                disabled
                className="w-full h-12 text-sm font-semibold bg-gray-400 rounded-lg"
              >
                Belum Tersedia
              </Button>
            </div>
          ) : !isPurchased ? (
            <div className="space-y-3">
              {tryout.price > 0 && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600 font-medium">Harga:</span>
                  <span className="text-xl font-bold text-blue-600">
                    Rp {tryout.price.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              <Button
                onClick={handlePurchase}
                disabled={purchasing}
                className="w-full h-12 text-sm font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                {tryout.price === 0 ? (
                  <>
                    <Gift className="mr-2 h-4 w-4" />
                    Daftar Gratis
                  </>
                ) : (
                  <>
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Beli Sekarang
                  </>
                )}
              </Button>
              
              {tryout.price > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowClaimCodeDialog(true)}
                  className="w-full h-12 text-sm font-semibold border-2 border-blue-100 text-blue-600 rounded-lg"
                >
                  <Gift className="mr-2 h-4 w-4" />
                  Gunakan Kode Klaim
                </Button>
              )}
            </div>
          ) : tryout.isBundle ? (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-300 p-3 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-gray-900 font-medium">Paket Berhasil Dibeli</p>
                </div>
                <p className="text-xs text-gray-600">Pilih try out di menu Try Out Saya</p>
              </div>
              <Button
                onClick={() => navigate(`/dashboard/tryouts`)}
                className="w-full h-12 text-sm font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Pilih Try Out
              </Button>
            </div>
          ) : isCompleted ? (
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-300 p-2 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-gray-900 font-medium">Try Out Selesai</p>
                  {attempts > 0 && (
                    <Badge variant="outline" className="bg-white border-green-300 text-green-700 text-xs">
                      {attempts}x
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate(`/dashboard/tryout/${id}/result`)}
                  className="flex-1 h-11 text-sm font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Lihat Hasil
                </Button>
                <Button
                  onClick={handleRetake}
                  disabled={resetting}
                  variant="outline"
                  className="flex-1 h-11 text-sm font-semibold border border-gray-300 hover:bg-gray-50 rounded-lg"
                >
                  {resetting ? 'Proses...' : 'Kerjakan Lagi'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {isInProgress && (
                <div className="bg-orange-50 border border-orange-300 p-3 rounded-lg">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <RotateCcw className="w-4 h-4 text-orange-600" />
                    <p className="text-sm text-gray-900 font-medium">Try Out Sedang Berjalan</p>
                  </div>
                  <p className="text-xs text-gray-600 text-center">Anda dapat melanjutkan pengerjaan</p>
                </div>
              )}
              <Button
                onClick={handleStartTryout}
                className={`w-full h-12 text-sm font-semibold rounded-lg shadow-sm ${
                  isInProgress
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isInProgress ? (
                  <>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Lanjutkan Try Out
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Mulai Try Out
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showClaimCodeDialog} onOpenChange={setShowClaimCodeDialog}>
        <DialogContent className="sm:max-w-md max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:max-h-[95vh] max-sm:overflow-y-auto max-sm:w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Gift className="w-5 h-5 text-blue-600" />
              Klaim Try Out Gratis
            </DialogTitle>
            <DialogDescription>
              Ikuti langkah-langkah di bawah ini untuk mendapatkan akses gratis melalui kode klaim.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Step by Step Instructions */}
            <div className="space-y-3">
              <div className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl group hover:border-blue-100 transition-colors">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <Instagram className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-900 leading-none">1. Follow Instagram</h4>
                    <a href="https://www.instagram.com/kelasasn.id" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <p className="text-[11px] font-medium text-gray-500 mt-1.5 leading-relaxed">
                    Follow akun <span className="text-gray-900 font-bold">@kelasasn.id</span> & <span className="text-gray-900 font-bold">Tag 2 teman</span> di komentar postingan terakhir untuk mendapatkan update materi dan informasi tryout terbaru.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl group hover:border-blue-100 transition-colors">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <Send className="w-5 h-5 text-white ml-[-1px]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-gray-900 leading-none">2. Join Telegram</h4>
                    <a href="https://t.me/KelasASN" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <p className="text-[11px] font-medium text-gray-500 mt-1.5 leading-relaxed">
                    Masuk ke grup diskusi <span className="text-gray-900 font-bold">@KelasASN</span> untuk belajar bersama kawan-kawan seperjuangan lainnya.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900 leading-none">3. Kirim Bukti DM</h4>
                  <p className="text-[11px] font-medium text-gray-500 mt-1.5 leading-relaxed">
                    Screenshot bukti follow IG & Join Telegram, kirim melalui <span className="text-blue-600 font-bold underline">DM Instagram Admin</span> untuk mendapatkan <span className="text-blue-600 font-bold">Kode Klaim</span> unik.
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-100" />

            {/* Code Input */}
            <div className="space-y-3 pb-4">
              <Label htmlFor="claim-code" className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Masukkan Kode Klaim</Label>
              <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors">
                  <Gift className="h-4 w-4" />
                </div>
                <Input
                  id="claim-code"
                  placeholder="CONTOH: KASN2024"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value)}
                  className="h-12 bg-gray-50 border-gray-100 pl-10 text-sm font-bold tracking-widest focus:bg-white focus:ring-0 focus:border-blue-200 transition-all rounded-xl placeholder:tracking-normal placeholder:font-normal uppercase"
                  disabled={claiming}
                />
              </div>
              <p className="text-[10px] text-center text-gray-400 font-medium italic">
                *Satu kode hanya berlaku untuk satu akun
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowClaimCodeDialog(false)}
              className="flex-1 h-11 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-600"
              disabled={claiming}
            >
              Nanti Saja
            </Button>
            <Button
              onClick={handleClaimWithCode}
              disabled={claiming || !claimCode.trim()}
              className="flex-[2] h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-sm shadow-blue-100"
            >
              {claiming ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </div>
              ) : (
                'Klaim Sekarang'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent className="sm:max-w-md max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:max-h-[90vh] max-sm:overflow-y-auto max-sm:w-full max-sm:data-[state=open]:animate-slide-in-from-bottom max-sm:data-[state=closed]:animate-slide-out-to-bottom">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Info className="w-5 h-5 text-blue-600" />
              Perhatian Sebelum Memulai
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <p className="text-sm text-gray-700">
                  Pastikan kamu membuka website ini melalui <span className="font-semibold">browser (disarankan Chrome)</span>
                </p>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <p className="text-sm text-gray-700">
                  Ketika kamu memulai Try Out maka <span className="font-semibold">timer akan berjalan</span> dan pengerjaan Try Out <span className="font-semibold">tidak bisa ditunda</span>. Siapkan waktu yang tepat untuk memulai Try Out
                </p>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <p className="text-sm text-gray-700">
                  Ketika waktu habis <span className="font-semibold">secara otomatis jawaban akan terkirim</span>
                </p>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  4
                </div>
                <p className="text-sm text-gray-700">
                  Hasil Try Out bisa dilihat pada menu <span className="font-semibold">'Tryout'</span> di bagian <span className="font-semibold">'Tryoutku'</span>
                </p>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  5
                </div>
                <p className="text-sm text-gray-700">
                  Try Out <span className="font-semibold">hanya bisa dikerjakan pada device dan browser yang sama</span> setiap 1x Try Out
                </p>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4"
              />
              <span className="text-sm text-gray-700">
                Saya telah membaca dan memahami seluruh informasi di atas, dan siap untuk memulai Try Out
              </span>
            </label>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmationDialog(false);
                setAgreedToTerms(false);
              }}
              className="flex-1"
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirmStart}
              disabled={!agreedToTerms}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Mulai Try Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
