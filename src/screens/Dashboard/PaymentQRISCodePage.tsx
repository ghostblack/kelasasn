import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTryoutById } from '@/services/tryoutService';
import { validateClaimCode, useClaimCode } from '@/services/claimCodeService';
import { TryoutPackage, PaymentTransaction } from '@/types';
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

const QRIS_IMAGE_URL = 'https://ik.imagekit.io/gambarid/Kelas%20ASN/WhatsApp%20Image%202026-04-05%20at%2009.57.38.jpeg';

interface PaymentStep {
  id: number;
  step: 'qris' | 'code' | 'success';
  label: string;
}

const STEPS: PaymentStep[] = [
  { id: 1, step: 'qris', label: 'Scan QRIS' },
  { id: 2, step: 'code', label: 'Input Code' },
  { id: 3, step: 'success', label: 'Selesai' },
];

export const PaymentQRISCodePage: React.FC = () => {
  const { tryoutId } = useParams<{ tryoutId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [tryout, setTryout] = useState<TryoutPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'qris' | 'code' | 'success'>('qris');
  const [claimCode, setClaimCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  const [paymentTransaction, setPaymentTransaction] = useState<PaymentTransaction | null>(null);

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

  const handleNextStep = async () => {
    if (!tryout || !user) {
      toast({
        title: 'Error',
        description: 'Data pembayaran tidak lengkap',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      setCurrentStep('code');
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: 'Terjadi kesalahan',
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

      setCurrentStep('success');
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

  if (loading && currentStep === 'qris') {
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

  return (
    <div className="max-w-2xl mx-auto px-4">
      <Button
        variant="ghost"
        onClick={() => navigate(`/dashboard/tryout/${tryoutId}`)}
        className="mb-6 -ml-3"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali
      </Button>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((item, index) => {
            const isCompleted = STEPS.findIndex(s => s.step === currentStep) > index;
            const isCurrent = currentStep === item.step;

            return (
              <div key={item.step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    item.id
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-3 transition-all ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {currentStep === 'qris' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{tryout?.name}</CardTitle>
              <p className="text-sm text-gray-600 font-normal mt-1">
                Rp {tryout?.price.toLocaleString('id-ID')}
              </p>
            </CardHeader>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
              <CardTitle className="text-xl">Scan QRIS untuk Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-8">
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900">
                  Instruksi: Scan QR Code di bawah dengan e-wallet atau mobile banking Anda
                </p>
              </div>

              <div className="flex justify-center">
                <div className="bg-white p-6 rounded-xl border-4 border-gray-300 shadow-lg hover:shadow-xl transition-shadow">
                  <img
                    src={QRIS_IMAGE_URL}
                    alt="QRIS Code"
                    className="w-80 h-80 object-contain rounded"
                  />
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <p className="text-sm text-green-900">
                  <strong className="text-green-700">Tips:</strong> Pastikan QR Code terlihat jelas dan lengkap sebelum melakukan scan
                </p>
              </div>

              <Button
                onClick={handleDownloadQRIS}
                variant="outline"
                className="w-full h-11 text-base"
              >
                <Download className="w-4 h-4 mr-2" />
                Unduh QR Code
              </Button>

              <Button
                onClick={handleNextStep}
                className="w-full h-11 text-base"
              >
                Lanjut ke Step 2
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 'code' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{tryout?.name}</CardTitle>
              <p className="text-sm text-gray-600 font-normal mt-1">
                Rp {tryout?.price.toLocaleString('id-ID')}
              </p>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Input Code Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-900">
                  Masukkan code dari admin setelah scan QRIS
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="claim-code" className="text-sm">Code Pembayaran</Label>
                <Input
                  id="claim-code"
                  placeholder="Contoh: ABC12345"
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                  className="font-mono text-center text-lg tracking-widest"
                  maxLength={8}
                  disabled={validatingCode}
                />
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleValidateCode}
                  disabled={validatingCode || !claimCode.trim() || claimCode.length < 8}
                  className="w-full"
                >
                  {validatingCode ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memvalidasi...
                    </>
                  ) : (
                    'Validasi'
                  )}
                </Button>

                <Button
                  onClick={() => setCurrentStep('qris')}
                  variant="outline"
                  className="w-full"
                  disabled={validatingCode}
                >
                  Kembali
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 'success' && (
        <div className="space-y-6">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-8 pb-8 text-center">
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

          <Button
            onClick={() => navigate(`/dashboard/tryout/${tryout?.id}`)}
            className="w-full h-11"
          >
            Mulai Try Out Sekarang
          </Button>
        </div>
      )}
    </div>
  );
};
