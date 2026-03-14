import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getTryoutById } from '@/services/tryoutService';
import { createPaymentTransaction } from '@/services/paymentService';
import { TryoutPackage } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { CreditCard, ArrowLeft } from 'lucide-react';

export const PaymentPage: React.FC = () => {
  const { tryoutId } = useParams<{ tryoutId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [tryout, setTryout] = useState<TryoutPackage | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string>('QRIS');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!tryoutId) {
      setLoading(false);
      return;
    }

    loadPaymentData();
  }, [tryoutId, authLoading]);

  useEffect(() => {
    if (user) {
      setCustomerName(user.displayName || '');
    }
  }, [user]);

  const loadPaymentData = async () => {
    if (!tryoutId) return;

    try {
      setLoading(true);
      const tryoutData = await getTryoutById(tryoutId);

      if (!tryoutData) {
        throw new Error('Try out tidak ditemukan');
      }

      setTryout(tryoutData);

      setTryout(tryoutData);

      console.log('Payment data loaded successfully:', {
        tryout: tryoutData.name,
        price: tryoutData.price,
      });
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

  const handlePayment = async () => {
    if (!tryout || !user || !customerName || !customerPhone) {
      toast({
        title: 'Error',
        description: 'Mohon lengkapi semua data pembayaran',
        variant: 'destructive',
      });
      return;
    }

    try {
      setProcessing(true);

      const payment = await createPaymentTransaction(
        user.uid,
        tryout.id,
        tryout.name,
        tryout.price,
        'QRIS',
        customerName,
        user.email || '',
        customerPhone
      );

      toast({
        title: 'Berhasil',
        description: 'Transaksi pembayaran berhasil dibuat',
      });

      navigate(`/dashboard/payment/${tryout.id}/process/${payment.id}`);
    } catch (error) {
      console.error('Error creating payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal membuat transaksi pembayaran';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
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

  <Button
    variant="outline"
    onClick={() => navigate(`/dashboard/tryout/${tryoutId}`)}
    className="mb-6 border-2 hover:bg-gray-50"
  >
    <ArrowLeft className="w-4 h-4 mr-2" />
    Kembali ke Detail Try Out
  </Button>


  const totalAmount = tryout.price;

  return (
    <div className="max-w-4xl mx-auto">
      <Button
        variant="outline"
        onClick={() => navigate(`/dashboard/tryout/${tryoutId}`)}
        className="mb-6 border-2 hover:bg-gray-50"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Kembali ke Detail Try Out
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pembeli</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Nomor WhatsApp</Label>
                <Input
                  id="phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pilih Metode Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setSelectedChannel('QRIS')}
                    className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all border-blue-600 bg-blue-50`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white rounded border flex items-center justify-center">
                        <span className="font-bold text-blue-600">QRIS</span>
                      </div>
                      <div className="text-left">
                        <span className="font-medium text-gray-900 block">QRIS Statis</span>
                        <span className="text-xs text-gray-500">Scan dan konfirmasi pembayaran</span>
                      </div>
                    </div>
                    <span className="text-sm text-green-600 font-medium">Gratis Biaya</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-lg">Ringkasan Pesanan</CardTitle>
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
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Biaya Admin</span>
                  <span className="font-medium text-green-600">
                    Gratis
                  </span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-xl text-gray-900">
                  Rp {totalAmount.toLocaleString('id-ID')}
                </span>
              </div>

              <Button
                onClick={handlePayment}
                disabled={!selectedChannel || !customerName || !customerPhone || processing}
                className="w-full h-12 text-base"
              >
                <CreditCard className="mr-2 h-5 w-5" />
                {processing ? 'Memproses...' : 'Bayar Sekarang'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
