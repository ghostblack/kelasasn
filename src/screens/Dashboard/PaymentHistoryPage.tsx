import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPayments, checkPaymentStatus } from '@/services/paymentService';
import { PaymentTransaction } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Receipt,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export const PaymentHistoryPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'failed'>('all');

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    loadPayments();
  }, [user, authLoading]);

  const loadPayments = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userPayments = await getUserPayments(user.uid);

      const sortedPayments = userPayments.sort((a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime()
      );

      setPayments(sortedPayments);
    } catch (err) {
      console.error('Error loading payments:', err);
      setError('Gagal memuat riwayat pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async (reference: string) => {
    try {
      setRefreshing(reference);
      setError(null);

      const updatedPayment = await checkPaymentStatus(reference);

      setPayments(prev =>
        prev.map(p => p.reference === reference ? updatedPayment : p)
      );

      if (updatedPayment.status === 'PAID') {
        toast({
          title: 'Pembayaran Berhasil',
          description: 'Pembayaran Anda telah dikonfirmasi',
        });
        await loadPayments();
      } else if (updatedPayment.status === 'EXPIRED') {
        toast({
          title: 'Pembayaran Expired',
          description: 'Waktu pembayaran telah habis',
          variant: 'destructive',
        });
      } else if (updatedPayment.status === 'FAILED') {
        toast({
          title: 'Pembayaran Gagal',
          description: 'Pembayaran Anda gagal diproses',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Menunggu Pembayaran',
          description: 'Pembayaran belum diterima. Silakan coba lagi dalam beberapa saat.',
        });
      }
    } catch (err: any) {
      console.error('Error checking payment status:', err);
      const errorMessage = err?.message || 'Gagal memeriksa status pembayaran';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setRefreshing(null);
    }
  };

  const handleContinuePayment = (payment: PaymentTransaction) => {
    if (payment.checkoutUrl) {
      window.open(payment.checkoutUrl, '_blank');
    } else if (payment.payUrl) {
      window.open(payment.payUrl, '_blank');
    }
  };

  const isPaymentExpired = (payment: PaymentTransaction) => {
    return new Date() > payment.expiredTime;
  };

  const canContinuePayment = (payment: PaymentTransaction) => {
    return payment.status === 'UNPAID' && !isPaymentExpired(payment);
  };

  const getStatusBadge = (status: PaymentTransaction['status']) => {
    switch (status) {
      case 'PAID':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Berhasil
          </Badge>
        );
      case 'UNPAID':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
            <Clock className="h-3 w-3 mr-1" />
            Menunggu
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <XCircle className="h-3 w-3 mr-1" />
            Gagal
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            Kadaluarsa
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTimeRemaining = (expiredTime: Date) => {
    const now = new Date();
    const diff = expiredTime.getTime() - now.getTime();

    if (diff <= 0) return 'Kadaluarsa';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours} jam ${minutes} menit`;
    }
    return `${minutes} menit`;
  };

  const filteredPayments = payments.filter(payment => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'pending') return payment.status === 'UNPAID' && !isPaymentExpired(payment);
    if (filterStatus === 'paid') return payment.status === 'PAID';
    if (filterStatus === 'failed') return payment.status === 'FAILED' || payment.status === 'EXPIRED' || isPaymentExpired(payment);
    return true;
  });

  const statusFilters = [
    { value: 'all', label: 'Semua', count: payments.length },
    { value: 'pending', label: 'Menunggu', count: payments.filter(p => p.status === 'UNPAID' && !isPaymentExpired(p)).length },
    { value: 'paid', label: 'Berhasil', count: payments.filter(p => p.status === 'PAID').length },
    { value: 'failed', label: 'Gagal', count: payments.filter(p => p.status === 'FAILED' || p.status === 'EXPIRED' || (p.status === 'UNPAID' && isPaymentExpired(p))).length },
  ];

  const renderPaymentCard = (payment: PaymentTransaction) => (
    <div
      key={payment.id}
      className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <h3 className="font-semibold text-gray-900 truncate">
              {payment.tryoutName}
            </h3>
          </div>
          <p className="text-xs text-gray-500">
            {formatDate(payment.createdAt)}
          </p>
        </div>
        {getStatusBadge(payment.status)}
      </div>

      <div className="space-y-2 mb-3 pb-3 border-b border-gray-100">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Metode</span>
          <span className="font-medium text-gray-900">{payment.paymentMethod}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total</span>
          <span className="font-bold text-gray-900">{formatCurrency(payment.totalAmount)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Referensi</span>
          <span className="font-mono text-xs text-gray-600">{payment.reference}</span>
        </div>
      </div>

      {payment.status === 'UNPAID' && !isPaymentExpired(payment) && (
        <div className="bg-orange-50 rounded-lg p-3 mb-3 border border-orange-100">
          <p className="text-xs text-orange-700 font-medium mb-1">Waktu Tersisa</p>
          <p className="text-sm font-bold text-orange-900">{getTimeRemaining(payment.expiredTime)}</p>
        </div>
      )}

      {payment.status === 'PAID' && payment.paidAt && (
        <div className="bg-green-50 rounded-lg p-3 mb-3 border border-green-100">
          <p className="text-xs text-green-700 font-medium mb-1">Dibayar Pada</p>
          <p className="text-sm font-semibold text-green-900">{formatDate(payment.paidAt)}</p>
        </div>
      )}

      <div className="flex gap-2">
        {canContinuePayment(payment) && (
          <>
            <Button
              onClick={() => handleContinuePayment(payment)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Lanjut Bayar
            </Button>
            <Button
              onClick={() => handleCheckStatus(payment.reference)}
              variant="outline"
              size="sm"
              disabled={refreshing === payment.reference}
            >
              {refreshing === payment.reference ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </>
        )}
        {payment.status === 'PAID' && (
          <Button
            onClick={() => navigate(`/dashboard/tryout/${payment.tryoutId}`)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
          >
            Lihat Try Out
          </Button>
        )}
        {(payment.status === 'UNPAID' && !canContinuePayment(payment)) && (
          <Button
            onClick={() => handleCheckStatus(payment.reference)}
            variant="outline"
            size="sm"
            disabled={refreshing === payment.reference}
            className="flex-1"
          >
            {refreshing === payment.reference ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Memeriksa...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Cek Status
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-28" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Riwayat Pembayaran
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola transaksi pembelian Try Out Anda
          </p>
        </div>
        <Button
          onClick={loadPayments}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {statusFilters.map((filter) => (
          <Button
            key={filter.value}
            variant={filterStatus === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(filter.value as any)}
            className={
              filterStatus === filter.value
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-white hover:bg-gray-50'
            }
          >
            {filter.label} <span className="ml-1.5 text-xs">({filter.count})</span>
          </Button>
        ))}
      </div>

      {filteredPayments.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Tidak Ada Transaksi
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {filterStatus === 'all'
              ? 'Anda belum memiliki riwayat transaksi'
              : `Tidak ada transaksi ${filterStatus === 'pending' ? 'yang menunggu pembayaran' : filterStatus === 'paid' ? 'yang berhasil' : 'yang gagal'}`}
          </p>
          {filterStatus === 'all' && (
            <Button
              onClick={() => navigate('/dashboard/tryouts')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Lihat Try Out
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPayments.map(renderPaymentCard)}
        </div>
      )}
    </div>
  );
};
