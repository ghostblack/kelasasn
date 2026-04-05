import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTryoutById } from '@/services/tryoutService';
import { TryoutPackage } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Download, ExternalLink, ArrowLeft } from 'lucide-react';

const QRIS_IMAGE_URL = 'https://ik.imagekit.io/gambarid/Kelas%20ASN/WhatsApp%20Image%202026-04-05%20at%2009.57.38.jpeg';
const TELEGRAM_CONTACT = 'https://t.me/Kelas_ASN';

export const PaymentQRISPage: React.FC = () => {
  const { tryoutId } = useParams<{ tryoutId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [tryout, setTryout] = useState<TryoutPackage | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handlePaymentRequest = async () => {
    if (!tryout) {
      toast({
        title: 'Error',
        description: 'Data pembayaran tidak lengkap',
        variant: 'destructive',
      });
      return;
    }

    navigate(`/dashboard/payment/${tryout.id}/qris-code`);
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

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="outline"
        onClick={() => navigate(`/dashboard/tryout/${tryoutId}`)}
        className="mb-6 border-2 hover:bg-gray-50"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali ke Detail Try Out
      </Button>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Produk</p>
              <p className="font-semibold text-gray-900">{tryout.name}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Harga Try Out</span>
                <span className="font-medium text-gray-900">
                  Rp {tryout.price.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="font-bold text-xl text-gray-900">
                Rp {tryout.price.toLocaleString('id-ID')}
              </span>
            </div>
          </CardContent>
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

            <div className="space-y-2">
              <Button
                onClick={handleDownloadQRIS}
                variant="outline"
                className="w-full h-11 text-base"
              >
                <Download className="w-4 h-4 mr-2" />
                Unduh QR Code
              </Button>

              <Button
                onClick={handlePaymentRequest}
                className="w-full h-11 text-base"
              >
                Lanjut ke Step Berikutnya
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
