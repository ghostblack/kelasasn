import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getPaymentTransaction, updatePaymentStatus } from '@/services/paymentService';
import { PaymentTransaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, CheckCircle, AlertCircle, Download, ExternalLink } from 'lucide-react';

const QRIS_IMAGE_URL = 'https://i.imgur.com/QWw8pWy.jpeg';
const TELEGRAM_CONTACT = 'https://t.me/Kelas_ASN';

export const PaymentQRISProcessPage: React.FC = () => {
  const { tryoutId, paymentId } = useParams<{ tryoutId: string; paymentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [payment, setPayment] = useState<PaymentTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    loadPayment();
  }, [paymentId]);

  useEffect(() => {
    if (!payment) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expired = payment.expiredTime.getTime();
      const diff = expired - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [payment]);

  const loadPayment = async () => {
    if (!paymentId) return;

    try {
      setLoading(true);
      const paymentData = await getPaymentTransaction(paymentId);
      setPayment(paymentData);

      if (paymentData?.status === 'PAID') {
        navigate(`/dashboard/payment/${tryoutId}/success`);
      }
    } catch (error) {
      console.error('Error loading payment:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data pembayaran',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  const handleMarkAsPaid = async () => {
    if (!payment) return;

    try {
      await updatePaymentStatus(payment.reference, 'PAID');
      toast({
        title: 'Berhasil',
        description: 'Pembayaran berhasil dikonfirmasi',
      });
      setTimeout(() => {
        navigate(`/dashboard/payment/${tryoutId}/success`);
      }, 1500);
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengkonfirmasi pembayaran',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <LoadingScreen message="Memuat data pembayaran..." type="spinner" fullScreen overlay />;
  }

  if (!payment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Data pembayaran tidak ditemukan</p>
        <Button onClick={() => navigate('/dashboard/tryouts')} className="mt-4">
          Kembali ke Daftar Try Out
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran via QRIS</h1>
        <p className="text-gray-600">Scan QR Code di bawah untuk melakukan pembayaran</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Status Pembayaran</CardTitle>
              {payment.status === 'PAID' ? (
                <Badge className="bg-green-100 text-green-700 border-green-300">
                  <CheckCircle className="w-4 h-4 mr-1" />Berhasil
                </Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300">
                  <AlertCircle className="w-4 h-4 mr-1" />Menunggu Pembayaran
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-700 font-medium mb-1">Total Pembayaran</p>
                  <p className="text-3xl font-bold text-blue-700">
                    Rp {payment.totalAmount.toLocaleString('id-ID')}
                  </p>
                </div>
                {payment.status === 'UNPAID' && (
                  <div className="text-right">
                    <p className="text-sm text-gray-700 font-medium mb-1">Sisa Waktu</p>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-blue-700" />
                      <p className="text-xl font-bold text-blue-700">{timeLeft}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-4 bg-blue-300" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Try Out</span>
                  <span className="font-medium text-gray-900">{payment.tryoutName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Harga</span>
                  <span className="font-medium text-gray-900">
                    Rp {payment.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {payment.status === 'UNPAID' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>QR Code QRIS</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <img
                    src={QRIS_IMAGE_URL}
                    alt="QRIS Code"
                    className="w-full max-w-sm mx-auto rounded-lg border-2 border-gray-200"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 mb-3">
                    Scan QR Code di atas menggunakan aplikasi e-wallet atau mobile banking Anda. Pembayaran harus diselesaikan dalam waktu yang ditentukan.
                  </p>
                  <p className="text-xs text-blue-800">
                    Pastikan nominal pembayaran sesuai: Rp {payment.totalAmount.toLocaleString('id-ID')}
                  </p>
                </div>

                <Button
                  onClick={handleDownloadQRIS}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Unduh QR Code
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Verifikasi Pembayaran</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900">
                    Hubungi admin untuk verifikasi setelah pembayaran
                  </p>
                </div>

                <div className="space-y-2">
                  <a
                    href={TELEGRAM_CONTACT}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full"
                  >
                    <Button className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Hubungi Admin Telegram
                    </Button>
                  </a>

                  <Button
                    onClick={handleMarkAsPaid}
                    variant="outline"
                    className="w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Saya Telah Membayar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/tryout/${tryoutId}`)}
            className="flex-1"
          >
            Kembali ke Detail
          </Button>
          <Button
            onClick={() => navigate('/dashboard/tryouts')}
            className="flex-1"
          >
            Lihat Try Out Lain
          </Button>
        </div>
      </div>
    </div>
  );
};
