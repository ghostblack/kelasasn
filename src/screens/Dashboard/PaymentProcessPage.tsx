import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getPaymentTransaction,
  getTripayTransactionDetail,
  updatePaymentStatus,
} from '@/services/paymentService';
import { PaymentTransaction } from '@/types';
import { Button } from '@/components/ui/button';
import { LoadingScreen } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Clock,
  Copy,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  ExternalLink,
  QrCode,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';

const POLL_INTERVAL_MS = 5000; // cek status tiap 5 detik

export const PaymentProcessPage: React.FC = () => {
  const { tryoutId, paymentId } = useParams<{ tryoutId: string; paymentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [payment, setPayment] = useState<PaymentTransaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Load payment dari Firestore ──────────────────────────────────────────
  const loadPayment = useCallback(async () => {
    if (!paymentId) return;
    try {
      const paymentData = await getPaymentTransaction(paymentId);
      setPayment(paymentData);
      if (paymentData?.status === 'PAID') {
        navigate(`/dashboard/payment/${tryoutId}/success`);
      }
    } catch (error) {
      console.error('Error loading payment:', error);
      toast({ title: 'Error', description: 'Gagal memuat data pembayaran', variant: 'destructive' });
    }
  }, [paymentId, tryoutId, navigate, toast]);

  // ─── Poll status dari TriPay ──────────────────────────────────────────────
  const pollStatus = useCallback(async () => {
    if (!payment || payment.status !== 'UNPAID') return;
    setIsPolling(true);
    try {
      // Gunakan tripayReference (DEV-XXX) dari Tripay, bukan merchant reference (ASN-XXX)
      const referenceToPoll = payment.tripayReference || payment.reference;
      const tripayDetail = await getTripayTransactionDetail(referenceToPoll);
      setLastChecked(new Date());

      if (tripayDetail && tripayDetail.status === 'PAID') {
        // Update Firestore → akan trigger redirect
        await updatePaymentStatus(payment.reference, 'PAID');
        await loadPayment();
      } else if (tripayDetail && tripayDetail.status === 'EXPIRED') {
        await updatePaymentStatus(payment.reference, 'EXPIRED');
        setPayment((prev) => prev ? { ...prev, status: 'EXPIRED' } : prev);
      } else if (tripayDetail && tripayDetail.status === 'FAILED') {
        await updatePaymentStatus(payment.reference, 'FAILED');
        setPayment((prev) => prev ? { ...prev, status: 'FAILED' } : prev);
      }
    } catch (err) {
      console.warn('[PaymentProcessPage] Poll failed:', err);
    } finally {
      setIsPolling(false);
    }
  }, [payment, loadPayment]);

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadPayment();
      setLoading(false);
    })();
  }, [paymentId]);

  // ─── Auto-poll loop ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!payment || payment.status !== 'UNPAID') return;

    pollTimerRef.current = setInterval(pollStatus, POLL_INTERVAL_MS);
    return () => { if (pollTimerRef.current) clearInterval(pollTimerRef.current); };
  }, [payment?.reference, payment?.status, pollStatus]);

  // ─── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!payment) return;
    const interval = setInterval(() => {
      const diff = payment.expiredTime.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('Expired'); clearInterval(interval); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [payment]);

  const copyToClipboard = (text: string, label = 'Teks') => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} disalin!` });
  };

  if (loading) return <LoadingScreen message="Memuat data pembayaran..." type="spinner" fullScreen overlay />;

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

  // ─── Status Badge ─────────────────────────────────────────────────────────
  const statusBadge = () => {
    switch (payment.status) {
      case 'PAID':
        return <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 shadow-none"><CheckCircle className="w-3.5 h-3.5 mr-1.5" />Berhasil</Badge>;
      case 'PENDING_CONFIRMATION':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 shadow-none"><Clock className="w-3.5 h-3.5 mr-1.5" />Menunggu Verifikasi</Badge>;
      case 'EXPIRED':
        return <Badge variant="secondary" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-0 shadow-none"><XCircle className="w-3.5 h-3.5 mr-1.5" />Kedaluwarsa</Badge>;
      case 'FAILED':
        return <Badge variant="secondary" className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-0 shadow-none"><XCircle className="w-3.5 h-3.5 mr-1.5" />Gagal</Badge>;
      default:
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0 shadow-none"><AlertCircle className="w-3.5 h-3.5 mr-1.5" />Menunggu Pembayaran</Badge>;
    }
  };

  // ─── Instruksi pembayaran ─────────────────────────────────────────────────
  const instructions: Array<{ title: string; steps: string[] }> =
    (payment as any).instructions || [];
  const payUrl: string | null = (payment as any).payUrl || null;
  const qrUrl: string | null = (payment as any).qrUrl || null;
  const checkoutUrl: string | null = (payment as any).checkoutUrl || null;
  const isQRIS = payment.paymentMethodCode === 'QRIS';

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Detail Pembayaran</h1>
        <p className="text-gray-500 text-sm">
          Selesaikan pembayaran Anda. Status akan diperbarui otomatis.
        </p>
      </div>

      <div className="space-y-6">
        {/* ─── Card Utama ────────────────── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Status Pembayaran</h2>
            {statusBadge()}
          </div>
          <div className="p-6 space-y-6">
            {/* Nominal + Countdown */}
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Pembayaran</p>
                  <p className="text-3xl font-bold text-gray-900">
                    Rp {payment.totalAmount.toLocaleString('id-ID')}
                  </p>
                </div>
                {payment.status === 'UNPAID' && timeLeft && (
                  <div className="md:text-right bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm inline-block">
                    <p className="text-xs font-medium text-gray-500 mb-1">Sisa Waktu</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-lg font-bold text-orange-600 font-mono tracking-tight">{timeLeft}</span>
                    </div>
                  </div>
                )}
              </div>
              <Separator className="my-5 bg-gray-200" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Harga Produk</span>
                  <span className="font-medium text-gray-900">Rp {payment.amount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Biaya Admin</span>
                  <span className="font-medium text-gray-900">
                    {payment.fee === 0 ? 'Gratis' : `Rp ${payment.fee.toLocaleString('id-ID')}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Info transaksi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Metode Pembayaran</p>
                <p className="font-semibold text-gray-900">{payment.paymentMethod}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Nomor Referensi</p>
                <div className="flex items-center justify-between gap-2">
                  <code className="text-sm font-mono font-medium text-gray-900 truncate">
                    {payment.reference}
                  </code>
                  <Button size="icon" variant="ghost" onClick={() => copyToClipboard(payment.reference, 'Referensi')} className="h-6 w-6 text-gray-400 hover:text-gray-900">
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* ─── Tampilan QR / Pay URL (hanya jika UNPAID) ─── */}
            {payment.status === 'UNPAID' && (
              <div className="space-y-6 pt-2">
                {/* QR Code (QRIS) */}
                {isQRIS && qrUrl && (
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col items-center gap-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                      <QrCode className="w-3.5 h-3.5" />
                      Scan QRIS berikut untuk membayar
                    </div>
                    <div className="p-4 bg-white border-2 border-dashed border-gray-200 rounded-2xl">
                      <img
                        src={qrUrl}
                        alt="QRIS Code"
                        className="w-48 h-48 object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-500 max-w-xs">
                      Gunakan GoPay, OVO, DANA, ShopeePay, atau M-Banking manapun yang mendukung QRIS
                    </p>
                  </div>
                )}

                {/* Tombol bayar (Virtual Account / E-Wallet) */}
                {payUrl && (
                  <a
                    href={payUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Lanjutkan ke Halaman Pembayaran
                  </a>
                )}

                {/* Checkout URL fallback */}
                {!payUrl && !isQRIS && checkoutUrl && (
                  <a
                    href={checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Buka Halaman Pembayaran
                  </a>
                )}

                {/* Instruksi langkah */}
                {instructions.length > 0 && (
                  <div className="space-y-3">
                    {instructions.slice(0, 2).map((ins, idx) => (
                      <div key={idx} className="bg-gray-50/80 p-5 rounded-2xl border border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 mb-3">{ins.title}</p>
                        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-outside ml-4">
                          {ins.steps.map((step, si) => (
                            <li key={si} dangerouslySetInnerHTML={{ __html: step }} className="pl-1" />
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                )}

                {/* Auto-poll indicator */}
                <div className="flex items-center justify-between text-xs text-gray-500 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-1">
                    {isPolling ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    <span>
                      {isPolling
                        ? 'Memeriksa status...'
                        : lastChecked
                        ? `Terakhir dicek: ${lastChecked.toLocaleTimeString('id-ID')}`
                        : 'Status diperbarui otomatis setiap 5 detik'}
                    </span>
                  </div>
                  <button
                    onClick={pollStatus}
                    disabled={isPolling}
                    className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                  >
                    Cek Sekarang
                  </button>
                </div>
              </div>
            )}

            {/* Status PAID */}
            {payment.status === 'PAID' && (
              <div className="bg-emerald-50/50 p-8 rounded-2xl border border-emerald-100 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-900 mb-2">Pembayaran Berhasil!</h3>
                <p className="text-sm text-emerald-700">Terima kasih, akses try out Anda sudah dibuka secara otomatis.</p>
              </div>
            )}

            {/* Status PENDING_CONFIRMATION */}
            {payment.status === 'PENDING_CONFIRMATION' && (
              <div className="bg-blue-50/50 p-8 rounded-2xl border border-blue-100 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 relative overflow-hidden group">
                  <Clock className="w-10 h-10 animate-pulse z-10" />
                  <div className="absolute inset-0 bg-blue-200/50 animate-ping opacity-20" />
                </div>
                
                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="h-px w-8 bg-blue-200" />
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Pembayaran Aman</span>
                  <div className="h-px w-8 bg-blue-200" />
                </div>

                <h3 className="text-2xl font-black text-blue-900 mb-3 tracking-tight">Sedang Diverifikasi</h3>
                
                <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-blue-100 mb-6 max-w-sm mx-auto">
                    <p className="text-sm text-blue-800 leading-relaxed">
                        Tenang saja bro, pembayaran Anda sudah <strong>aman dalam sistem kami</strong>. Admin sedang melakukan pengecekan manual (biasanya 5-15 menit).
                    </p>
                </div>
                
                <div className="space-y-3 max-w-xs mx-auto">
                  <a 
                    href={`https://wa.me/628123456789?text=Halo%20Admin%20Kelas%20ASN%2C%20saya%20ingin%20konfirmasi%20pembayaran%20untuk%20${encodeURIComponent(payment.tryoutName)}%20dengan%20referensi%20${payment.reference}.%20Berikut%20bukti%20pembayaran%20saya.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-14 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-xl transition-all shadow-lg shadow-green-100 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <MessageCircle className="w-5 h-5 fill-current" />
                    Kirim Bukti ke WA Admin
                  </a>
                  <p className="text-[11px] text-blue-400 font-medium italic">
                    *Kirim bukti transfer agar akses lebih cepat dibuka
                  </p>
                </div>
              </div>
            )}

            {/* Status EXPIRED / FAILED */}
            {(payment.status === 'EXPIRED' || payment.status === 'FAILED') && (
              <div className="bg-rose-50/50 p-8 rounded-2xl border border-rose-100 text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                  <XCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold text-rose-900 mb-2">
                  {payment.status === 'EXPIRED' ? 'Waktu Pembayaran Habis' : 'Pembayaran Gagal'}
                </h3>
                <p className="text-sm text-rose-700 mb-6 max-w-sm mx-auto">
                  {payment.status === 'EXPIRED'
                    ? 'Waktu untuk menyelesaikan pembayaran telah habis. Silakan buat transaksi baru.'
                    : 'Terjadi kesalahan pada pembayaran atau transaksi dibatalkan. Silakan coba lagi.'}
                </p>
                <Button
                  onClick={() => navigate(`/dashboard/payment/${tryoutId}`)}
                  variant="outline"
                  className="bg-white border-rose-200 text-rose-700 hover:bg-rose-50"
                >
                  Buat Transaksi Baru
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ─── Navigasi Bawah ────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            variant="ghost"
            onClick={() => navigate(`/dashboard/tryout/${tryoutId}`)}
            className="flex-1 h-12 text-gray-600 hover:text-gray-900"
          >
            Batal & Kembali
          </Button>
          <Button
            onClick={() => navigate('/dashboard/tryouts')}
            className="flex-1 h-12 shadow-none"
          >
            Lihat Try Out Lainnya
          </Button>
        </div>
      </div>
    </div>
  );
};
