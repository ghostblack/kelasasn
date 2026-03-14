import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTryoutById } from '@/services/tryoutService';
import { validateClaimCode, useClaimCode } from '@/services/claimCodeService';
import { TryoutPackage } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Download, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
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
  const [claimCode, setClaimCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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
                      Langkah 2: Input Kode dari Admin
                    </p>
                    <p className="text-sm text-gray-600">
                      Setelah scan dan transfer selesai, admin akan memberikan kode konfirmasi. Masukkan kode di bawah.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="claim-code" className="text-sm font-semibold">
                      Kode Konfirmasi Pembayaran
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
                    <p className="text-xs text-gray-500 text-center">
                      Kode terdiri dari 8 karakter (huruf dan angka)
                    </p>
                  </div>

                  <Button
                    onClick={handleValidateCode}
                    disabled={validatingCode || !claimCode.trim() || claimCode.length < 8}
                    className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700"
                  >
                    {validatingCode ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Memvalidasi...
                      </>
                    ) : (
                      'Aktifkan Try Out'
                    )}
                  </Button>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                      <p className="font-semibold text-gray-900 text-sm">Kirim Bukti</p>
                      <p className="text-xs text-gray-600">Screenshot transfer</p>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center justify-center">
                    <div className="text-gray-300 text-2xl">→</div>
                  </div>

                  <div className="flex flex-col items-center md:items-start space-y-2">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                    <div className="text-center md:text-left">
                      <p className="font-semibold text-gray-900 text-sm">Input Kode</p>
                      <p className="text-xs text-gray-600">Dari admin</p>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center justify-center">
                    <div className="text-gray-300 text-2xl">→</div>
                  </div>

                  <div className="flex flex-col items-center md:items-start space-y-2">
                    <div className="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">4</div>
                    <div className="text-center md:text-left">
                      <p className="font-semibold text-gray-900 text-sm">Selesai</p>
                      <p className="text-xs text-gray-600">Akses try out</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Cara Pembayaran:</h4>
                  <ol className="space-y-2 text-sm text-gray-700">
                    <li className="flex gap-2">
                      <span className="font-bold text-gray-600 min-w-fit">1.</span>
                      <span>Scan QR Code di atas dengan e-wallet Anda (GCash, Gopay, OVO, Dana, dll)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-gray-600 min-w-fit">2.</span>
                      <span>Masukkan jumlah dan selesaikan pembayaran</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-gray-600 min-w-fit">3.</span>
                      <span>Kirim screenshot bukti transfer ke admin via tombol di bawah</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-gray-600 min-w-fit">4.</span>
                      <span>Admin akan kirim kode konfirmasi (masukkan di kolom atas)</span>
                    </li>
                  </ol>
                </div>

                <a
                  href="https://t.me/kelasasnadmin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
                >
                  Kirim Bukti Pembayaran ke Admin (Telegram)
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
