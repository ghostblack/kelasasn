import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTryoutById, purchaseTryout, getUserTryouts, resetTryoutAttempt, getUserResultsByTryout } from '@/services/tryoutService';
import { getActiveTryoutSession } from '@/services/tryoutSessionService';
import { TryoutPackage, UserTryout, TryoutSession } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingScreen } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Clock, FileText, CircleCheck as CheckCircle, ShoppingCart, Play, CircleAlert as AlertCircle, Gift, Info, ArrowLeft, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const [showFreeRegistrationDialog, setShowFreeRegistrationDialog] = useState(false);

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
        setShowFreeRegistrationDialog(true);
        setPurchasing(false);
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
      setPurchasing(false);
    }
  };

  const handleConfirmFreeRegistration = async () => {
    if (!tryout || !user) return;

    try {
      setPurchasing(true);
      await purchaseTryout(user.uid, tryout.id, tryout.name);

      toast({
        title: 'Berhasil',
        description: 'Try out gratis berhasil didaftarkan! Anda dapat mulai mengerjakan.',
      });

      setShowFreeRegistrationDialog(false);

      await new Promise(resolve => setTimeout(resolve, 500));
      await loadTryoutDetail();
    } catch (error) {
      console.error('Error registering free tryout:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Gagal mendaftar try out',
        variant: 'destructive',
      });
    } finally {
      setPurchasing(false);
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
  const hasQuestions = tryout.questionIds && tryout.questionIds.length > 0;

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
                  <h1 className="text-2xl font-bold text-gray-900">{tryout.name}</h1>
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
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs text-blue-700 font-medium">Durasi</p>
                      <p className="text-sm font-bold text-gray-900">{totalDuration} Menit</p>
                    </div>
                  </div>
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

          {/* Detail Kategori Soal */}
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

      <Dialog open={showFreeRegistrationDialog} onOpenChange={setShowFreeRegistrationDialog}>
        <DialogContent className="sm:max-w-md max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:max-h-[90vh] max-sm:overflow-y-auto max-sm:w-full max-sm:data-[state=open]:animate-slide-in-from-bottom max-sm:data-[state=closed]:animate-slide-out-to-bottom">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Gift className="w-5 h-5 text-green-600" />
              Daftar Try Out Gratis
            </DialogTitle>
            <DialogDescription>
              Dapatkan akses ke try out gratis dan bergabung dengan komunitas belajar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-3">
                Untuk pengalaman belajar yang lebih maksimal, kami merekomendasikan:
              </p>

              <div className="space-y-3">
                <a
                  href="https://www.instagram.com/kelasasn.id"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">Follow Instagram Kami</p>
                    <p className="text-xs text-gray-600">@kelasasn.id - Tips dan materi belajar</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>

                <a
                  href="https://t.me/KelasASN"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">Join Grup Telegram</p>
                    <p className="text-xs text-gray-600">Diskusi dan tanya jawab bersama</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-gray-700 text-center">
                <Info className="w-3 h-3 inline mr-1" />
                Anda dapat langsung mendaftar tanpa mengikuti rekomendasi di atas
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFreeRegistrationDialog(false)}
              className="flex-1"
              disabled={purchasing}
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirmFreeRegistration}
              disabled={purchasing}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {purchasing ? 'Memproses...' : 'Daftar Sekarang'}
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
