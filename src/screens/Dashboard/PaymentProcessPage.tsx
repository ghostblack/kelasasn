import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPaymentTransaction, confirmPayment } from '@/services/paymentService';
import { PaymentTransaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, Copy, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const PaymentProcessPage: React.FC = () => {
  const { tryoutId, paymentId } = useParams<{ tryoutId: string; paymentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [payment, setPayment] = useState<PaymentTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    loadPayment();
  }, [paymentId]);

  useEffect(() => {
    if (!payment || payment.status !== 'UNPAID') return;
    // Auto-check is disabled for manual QRIS
  }, [payment?.reference, payment?.status]);

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

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
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

  const handleConfirmPayment = async () => {
    if (!payment) return;

    try {
      setChecking(true);
      await confirmPayment(payment.id);

      toast({
        title: 'Berhasil',
        description: 'Pembayaran Anda sedang dalam proses konfirmasi oleh admin',
      });

      await loadPayment();
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast({
        title: 'Error',
        description: 'Gagal melakukan konfirmasi pembayaran',
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Berhasil',
      description: 'Teks berhasil disalin',
    });
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

  const getStatusBadge = () => {
    switch (payment.status) {
      case 'PAID':
        return <Badge className="bg-green-100 text-green-700 border-green-300"><CheckCircle className="w-4 h-4 mr-1" />Berhasil</Badge>;
      case 'PENDING_CONFIRMATION':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300"><Clock className="w-4 h-4 mr-1" />Menunggu Konfirmasi Admin</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-red-100 text-red-700 border-red-300"><XCircle className="w-4 h-4 mr-1" />Expired</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-700 border-red-300"><XCircle className="w-4 h-4 mr-1" />Gagal</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-300"><AlertCircle className="w-4 h-4 mr-1" />Menunggu Pembayaran</Badge>;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Detail Pembayaran</h1>
        <p className="text-gray-600">Selesaikan pembayaran Anda sebelum waktu habis</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Status Pembayaran</CardTitle>
              {getStatusBadge()}
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
                  <span className="text-gray-700">Harga Try Out</span>
                  <span className="font-medium text-gray-900">
                    Rp {payment.amount.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Biaya Admin</span>
                  <span className="font-medium text-gray-900">
                    Rp {payment.fee.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-1">Metode Pembayaran</p>
                <p className="font-semibold text-gray-900">{payment.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Nomor Referensi</p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                    {payment.reference}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(payment.reference)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {payment.status === 'UNPAID' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border flex flex-col items-center">
                  <p className="text-sm font-medium mb-3 text-center">Scan QRIS di bawah ini</p>
                  {payment.qrUrl ? (
                    <img
                      src={payment.qrUrl}
                      alt="QRIS Code"
                      className="w-64 h-64 object-contain"
                    />
                  ) : (
                    <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded">
                      <p className="text-gray-400">QR Code loading...</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Pastikan nominal pembayaran sesuai dengan total di atas
                  </p>
                </div>

                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <p className="text-sm font-semibold text-orange-900 mb-2">Instruksi Pembayaran:</p>
                  <ol className="text-xs text-orange-800 space-y-1 list-decimal list-inside">
                    <li>Buka aplikasi pembayaran (Gopay, OVO, Dana, M-Banking, dll)</li>
                    <li>Scan QRIS di atas</li>
                    <li>Lakukan pembayaran sebesar nominal yang tertera</li>
                    <li>Simpan bukti bayar Anda</li>
                    <li>Klik tombol "Saya Sudah Bayar" di bawah ini</li>
                  </ol>
                </div>

                <Button
                  onClick={handleConfirmPayment}
                  disabled={checking}
                  className="w-full h-12 text-base font-semibold"
                >
                  {checking ? 'Memproses...' : 'Saya Sudah Bayar'}
                </Button>
              </div>
            )}

            {payment.status === 'PENDING_CONFIRMATION' && (
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-center">
                <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Menunggu Konfirmasi Admin
                </h3>
                <p className="text-sm text-blue-800">
                  Terima kasih! Kami telah menerima laporan pembayaran Anda.
                  Admin akan segera memverifikasi pembayaran Anda dalam waktu 1x24 jam.
                  Akses try out akan otomatis terbuka setelah dikonfirmasi.
                </p>
              </div>
            )}

          </CardContent>
        </Card>

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
