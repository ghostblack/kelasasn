import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTryoutById } from '@/services/tryoutService';
import { validateClaimCode, useClaimCode } from '@/services/claimCodeService';
import {
  createQRISPaymentTransaction,
  confirmPayment,
  notifyAdminPayment,
} from '@/services/paymentService';
import { TryoutPackage } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, ArrowLeft, Loader2, CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const QRIS_IMAGE_URL = 'https://i.imgur.com/QWw8pWy.jpeg';

export const PaymentQRISUnifiedPage: React.FC = () => {
  const { tryoutId } = useParams<{ tryoutId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [tryout, setTryout] = useState<TryoutPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showWaiting, setShowWaiting] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Claim code (secondary option)
  const [showClaimCode, setShowClaimCode] = useState(false);
  const [claimCode, setClaimCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);

  useEffect(() => {
    loadPaymentData();
  }, [tryoutId]);

  const loadPaymentData = async () => {
    if (!tryoutId) return;

    try {
      setLoading(true);
      const tryoutData = await getTryoutById(tryoutId);

      if (!tryoutData) {
        throw new Error('Try out tidak ditemukan');
      }

      setTryout(tryoutData);
    } catch (error) {
      console.error('Error loading payment data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal memuat data pembayaran';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSudahBayar = async () => {
    if (!user || !tryout) return;

    try {
      setSubmitting(true);

      // 1. Create payment transaction
      const transaction = await createQRISPaymentTransaction(
        user.uid,
        tryout.id,
        tryout.name,
        tryout.price,
        user.displayName || user.email || '',
        user.email || ''
      );

      // 2. Mark as pending confirmation
      await confirmPayment(transaction.id);

      // 3. Send Telegram notification to admin
      await notifyAdminPayment({
        customerName: user.displayName || user.email || 'Unknown',
        tryoutName: tryout.name,
        amount: tryout.price,
        reference: transaction.reference,
      });

      // 4. Show waiting screen
      setShowWaiting(true);

      toast({
        title: 'Berhasil',
        description: 'Admin telah diberitahu. Menunggu konfirmasi.',
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: 'Error',
        description: 'Gagal memproses pembayaran. Silakan coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidateCode = async () => {
    if (!claimCode.trim() || !user || !tryout) {
      toast({
        title: 'Error',
        description: 'Pastikan code sudah diisi',
        variant: 'destructive',
      });
      return;
    }

    try {
      setValidatingCode(true);

      const validation = await validateClaimCode(claimCode.trim(), user.uid);

      if (!validation.valid) {
        toast({
          title: 'Kode Tidak Valid',
          description: validation.message,
          variant: 'destructive',
        });
        return;
      }

      await useClaimCode(claimCode.trim(), user.uid);

      const userTryoutsRef = collection(db, 'user_tryouts');
      await addDoc(userTryoutsRef, {
        userId: user.uid,
        tryoutId: tryout.id,
        tryoutName: tryout.name,
        purchaseDate: serverTimestamp(),
        status: 'not_started',
        paymentStatus: 'success',
        attempts: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({
        title: 'Berhasil',
        description: 'Pembayaran berhasil!',
      });


      setShowSuccessMessage(true);
      setTimeout(() => {
        navigate(`/dashboard/tryout/${tryout.id}`);
      }, 2000);
    } catch (error) {
      console.error('Error validating code:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal memvalidasi code';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setValidatingCode(false);
    }
  };

  const handleDownloadQRIS = async () => {
    try {
      const response = await fetch(QRIS_IMAGE_URL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'qris.jpeg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Berhasil',
        description: 'QR Code berhasil diunduh',
      });
    } catch (error) {
      console.error('Error downloading QRIS:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengunduh QR Code',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
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

  if (showSuccessMessage) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">Pembayaran Berhasil!</h2>
              <p className="text-green-800">
                Try out siap diakses. Anda akan dialihkan dalam beberapa detik...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showWaiting) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-blue-600 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-blue-900 mb-2">Menunggu Konfirmasi Admin</h2>
                <p className="text-blue-800 mb-4">
                  Admin telah diberitahu melalui Telegram. Anda akan mendapat akses setelah admin mengonfirmasi pembayaran.
                </p>
                <div className="bg-blue-100 rounded-lg p-4 text-sm text-blue-700 max-w-md mx-auto">
                  <p className="font-semibold mb-1">💡 Tips:</p>
                  <p>Biasanya konfirmasi dilakukan dalam beberapa menit. Silakan cek kembali halaman tryout secara berkala.</p>
                </div>
              </div>
              <Button
                onClick={() => navigate(`/dashboard/tryout/${tryout.id}`)}
                variant="outline"
                className="mt-6 border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Halaman Try Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-5xl mx-auto px-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/dashboard/tryout/${tryoutId}`)}
          className="mb-8 -ml-3"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>

        <div className="space-y-6">
          <Card className="shadow-none border-b">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">{tryout.name}</CardTitle>
              <p className="text-lg font-semibold text-blue-600 mt-2">
                Rp {tryout.price.toLocaleString('id-ID')}
              </p>
            </CardHeader>
          </Card>

          <Card className="shadow-none border-b">
            <CardHeader className="pb-4">
              <CardTitle>Pembayaran via QRIS</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="flex flex-col items-center justify-start space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 w-full">
                    <p className="text-sm text-gray-900 font-semibold">
                      Langkah 1: Scan QR Code
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Scan menggunakan aplikasi e-wallet atau mobile banking Anda.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <img
                      src={QRIS_IMAGE_URL}
                      alt="QRIS Code"
                      className="w-80 h-80 object-contain rounded"
                    />
                  </div>

                  <Button
                    onClick={handleDownloadQRIS}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Unduh QR Code
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Langkah 2: Bayar & Konfirmasi
                    </p>
                    <p className="text-sm text-gray-600">
                      Setelah scan dan transfer selesai, klik tombol di bawah. Admin akan menerima notifikasi dan mengonfirmasi pembayaran Anda.
                    </p>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-amber-900 mb-1">⚠️ Penting</p>
                    <p className="text-xs text-amber-800">
                      Pastikan Anda sudah menyelesaikan pembayaran sebelum klik tombol di bawah. Nominal yang harus dibayar: <strong>Rp {tryout.price.toLocaleString('id-ID')}</strong>
                    </p>
                  </div>

                  <Button
                    onClick={handleSudahBayar}
                    disabled={submitting}
                    className="w-full h-14 text-base font-semibold bg-green-600 hover:bg-green-700"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Saya Sudah Bayar
                      </>
                    )}
                  </Button>

                  {/* Claim code - secondary option */}
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={() => setShowClaimCode(!showClaimCode)}
                      className="flex items-center justify-center w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showClaimCode ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                      Punya Kode Klaim?
                    </button>

                    {showClaimCode && (
                      <div className="mt-4 space-y-3">
                        <Label htmlFor="claim-code" className="text-sm font-semibold">
                          Kode Klaim
                        </Label>
                        <Input
                          id="claim-code"
                          placeholder="Contoh: ABC12345"
                          value={claimCode}
                          onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                          className="font-mono text-center text-xl tracking-widest font-bold h-12"
                          maxLength={8}
                          disabled={validatingCode}
                        />
                        <Button
                          onClick={handleValidateCode}
                          disabled={validatingCode || !claimCode.trim() || claimCode.length < 8}
                          className="w-full h-12 text-base font-semibold"
                          variant="outline"
                        >
                          {validatingCode ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Memvalidasi...
                            </>
                          ) : (
                            'Gunakan Kode Klaim'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-none border-b">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Panduan Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col items-center md:items-start space-y-2">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                    <div className="text-center md:text-left">
                      <p className="font-semibold text-gray-900 text-sm">Scan QR</p>
                      <p className="text-xs text-gray-600">Gunakan e-wallet Anda</p>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center justify-center">
                    <div className="text-gray-300 text-2xl">→</div>
                  </div>

                  <div className="flex flex-col items-center md:items-start space-y-2">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                    <div className="text-center md:text-left">
                      <p className="font-semibold text-gray-900 text-sm">Bayar</p>
                      <p className="text-xs text-gray-600">Selesaikan pembayaran</p>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center justify-center">
                    <div className="text-gray-300 text-2xl">→</div>
                  </div>

                  <div className="flex flex-col items-center md:items-start space-y-2">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                    <div className="text-center md:text-left">
                      <p className="font-semibold text-gray-900 text-sm">Klik "Saya Sudah Bayar"</p>
                      <p className="text-xs text-gray-600">Admin akan konfirmasi</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Cara Pembayaran:</h4>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <span className="font-bold text-gray-600 min-w-fit">1.</span>
                      <span>Scan QR Code di atas dengan e-wallet Anda (Gopay, OVO, Dana, ShopeePay, dll)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-gray-600 min-w-fit">2.</span>
                      <span>Masukkan jumlah Rp {tryout.price.toLocaleString('id-ID')} dan selesaikan pembayaran</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-gray-600 min-w-fit">3.</span>
                      <span>Klik tombol "Saya Sudah Bayar" di atas — admin akan menerima notifikasi otomatis</span>
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
