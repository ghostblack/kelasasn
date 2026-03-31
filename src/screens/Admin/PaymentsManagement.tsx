import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAllPayments, updatePaymentStatus } from '@/services/paymentService';
import { PaymentTransaction } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw, Filter, CreditCard, Clock, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';

export const PaymentsManagement: React.FC = () => {
    const [payments, setPayments] = useState<PaymentTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        try {
            setLoading(true);
            const data = await getAllPayments();
            const sorted = [...data].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            setPayments(sorted);
        } catch (error) {
            console.error('Error loading payments:', error);
            toast({
                title: 'Error',
                description: 'Gagal memuat data pembayaran',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (payment: PaymentTransaction) => {
        try {
            await updatePaymentStatus(payment.reference, 'PAID');
            toast({
                title: 'Konfirmasi Berhasil',
                description: `Pembayaran ${payment.reference} telah disetujui.`,
                variant: 'default',
            });
            loadPayments();
        } catch (error) {
            console.error('Error approving payment:', error);
            toast({
                title: 'Error',
                description: 'Gagal menyetujui pembayaran',
                variant: 'destructive',
            });
        }
    };

    const handleReject = async (payment: PaymentTransaction) => {
        try {
            await updatePaymentStatus(payment.reference, 'FAILED');
            toast({
                title: 'Penolakan Berhasil',
                description: `Pembayaran ${payment.reference} telah ditolak.`,
            });
            loadPayments();
        } catch (error) {
            console.error('Error rejecting payment:', error);
            toast({
                title: 'Error',
                description: 'Gagal menolak pembayaran',
                variant: 'destructive',
            });
        }
    };

    // Calculate Stats
    const stats = useMemo(() => {
        const totalPurchases = payments.length;
        const totalRevenue = payments
            .filter(p => p.status === 'PAID')
            .reduce((sum, p) => sum + p.totalAmount, 0);
        const pendingConfirmation = payments.filter(p => p.status === 'PENDING_CONFIRMATION').length;
        const successRate = totalPurchases > 0 
            ? ((payments.filter(p => p.status === 'PAID').length / totalPurchases) * 100).toFixed(1)
            : 0;

        return { totalPurchases, totalRevenue, pendingConfirmation, successRate };
    }, [payments]);

    // Filtered Payments
    const filteredPayments = useMemo(() => {
        switch (activeTab) {
            case 'pending':
                return payments.filter(p => p.status === 'PENDING_CONFIRMATION');
            case 'success':
                return payments.filter(p => p.status === 'PAID');
            case 'others':
                return payments.filter(p => ['FAILED', 'EXPIRED', 'UNPAID'].includes(p.status));
            default:
                return payments;
        }
    }, [payments, activeTab]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-sm font-medium text-gray-500">Menyelaraskan data transaksi...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto p-2">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Kelola Pembayaran</h1>
                    <p className="text-gray-500">Pantau arus kas dan konfirmasi bukti pembayaran peserta.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        onClick={loadPayments}
                        className="bg-white hover:bg-gray-50 text-gray-700 h-10 px-4"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Notification Alert for Pending Confirmation */}
            <AnimatePresence mode="wait">
                {stats.pendingConfirmation > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <Alert className="bg-amber-50 border-amber-200 text-amber-900 shadow-sm border-l-4 border-l-amber-500">
                            <AlertCircle className="h-5 w-5 text-amber-600" />
                            <AlertTitle className="font-bold flex items-center gap-2">
                                Perhatian Admin!
                                <Badge variant="secondary" className="bg-amber-200 text-amber-800 text-[10px] py-0 h-5 px-2">Action Required</Badge>
                            </AlertTitle>
                            <AlertDescription className="text-amber-800/80 mt-1">
                                Terdapat <strong>{stats.pendingConfirmation} pembayaran</strong> yang sedang menunggu konfirmasi manual. Segera periksa bukti transfer untuk melancarkan akses peserta.
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative group">
                    <div className="absolute right-[-10%] top-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-100 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Total Pendapatan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold tracking-tight">
                            Rp {stats.totalRevenue.toLocaleString('id-ID')}
                        </div>
                        <p className="text-xs text-blue-100 mt-1">Dari transaksi yang berhasil</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden group hover:ring-1 hover:ring-gray-200 transition-all">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-emerald-500" />
                            Total Pembelian
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{stats.totalPurchases}</div>
                        <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {stats.successRate}% Success Rate
                        </p>
                    </CardContent>
                </Card>

                <Card className={`border-none shadow-sm bg-white overflow-hidden ${stats.pendingConfirmation > 0 ? 'ring-2 ring-red-100' : ''}`}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Clock className={`w-4 h-4 ${stats.pendingConfirmation > 0 ? 'text-red-500 animate-pulse' : 'text-blue-500'}`} />
                            Menunggu Konfirmasi
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats.pendingConfirmation > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                            {stats.pendingConfirmation}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Transaksi butuh verifikasi</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Filter className="w-4 h-4 text-purple-500" />
                            Aktif di Tab
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900 capitalize italic">{activeTab === 'all' ? 'Semua Data' : activeTab}</div>
                        <p className="text-xs text-gray-500 mt-1">Filter tampilan data</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs & Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
                    <div className="px-6 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-50 pb-4">
                        <TabsList className="bg-gray-100/50 p-1 rounded-lg">
                            <TabsTrigger value="all" className="rounded-md px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold">Semua</TabsTrigger>
                            <TabsTrigger value="pending" className="relative rounded-md px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold">
                                Menunggu
                                {stats.pendingConfirmation > 0 && (
                                    <span className="absolute -top-1 -right-1 block w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="success" className="rounded-md px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold">Berhasil</TabsTrigger>
                            <TabsTrigger value="others" className="rounded-md px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs font-semibold">Gagal/Lainnya</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="w-[180px] font-bold text-gray-500 uppercase text-[10px] tracking-wider py-5 pl-8">Waktu & Referensi</TableHead>
                                    <TableHead className="font-bold text-gray-500 uppercase text-[10px] tracking-wider py-5">Peserta</TableHead>
                                    <TableHead className="font-bold text-gray-500 uppercase text-[10px] tracking-wider py-5">Item Pembelian</TableHead>
                                    <TableHead className="font-bold text-gray-500 uppercase text-[10px] tracking-wider py-5">Nominal</TableHead>
                                    <TableHead className="font-bold text-gray-500 uppercase text-[10px] tracking-wider py-5 text-center">Status</TableHead>
                                    <TableHead className="font-bold text-gray-500 uppercase text-[10px] tracking-wider py-5 text-right pr-8">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPayments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-64 text-center">
                                            <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
                                                <Search className="w-10 h-10 opacity-20" />
                                                <p className="text-sm">Tidak ada transaksi ditemukan di tab ini.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredPayments.map((payment) => (
                                        <TableRow key={payment.id} className="group hover:bg-gray-50/80 transition-all border-b border-gray-50 duration-200">
                                            <TableCell className="py-4 pl-8">
                                                <div className="text-sm font-bold text-gray-900 mb-0.5">{payment.createdAt.toLocaleDateString('id-ID')}</div>
                                                <div className="text-[10px] font-mono text-gray-400 font-medium">{payment.reference}</div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="font-bold text-gray-900 text-sm">{(payment as any).customerName || 'No Name'}</div>
                                                <div className="text-[10px] text-gray-500 font-medium">{(payment as any).customerPhone || 'No Phone'}</div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="text-sm font-medium text-gray-700 bg-blue-50/50 inline-block px-2 py-0.5 rounded border border-blue-100">
                                                    {payment.tryoutName}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="text-base font-black text-gray-900 group-hover:text-blue-700 transition-colors">
                                                    Rp {payment.totalAmount.toLocaleString('id-ID')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center py-4">
                                                <StatusBadge status={payment.status} />
                                            </TableCell>
                                            <TableCell className="text-right py-4 pr-8">
                                                {payment.status === 'PENDING_CONFIRMATION' ? (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-4 rounded-full text-xs font-bold transition-all shadow-md active:scale-95"
                                                            onClick={() => handleApprove(payment)}
                                                        >
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 px-3 rounded-full text-xs"
                                                            onClick={() => handleReject(payment)}
                                                        >
                                                            Reject
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-gray-300 italic">No Action Needed</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Tabs>
            </div>
        </div>
    );
};

interface StatusBadgeProps {
    status: PaymentTransaction['status'];
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    switch (status) {
        case 'PAID':
            return <Badge className="bg-emerald-100 text-emerald-700 border-none px-3 py-1 text-[11px] font-bold shadow-none">BERHASIL</Badge>;
        case 'PENDING_CONFIRMATION':
            return <Badge className="bg-blue-100 text-blue-700 border-none px-3 py-1 text-[11px] font-bold shadow-none animate-pulse">MENUNGGU</Badge>;
        case 'UNPAID':
            return <Badge className="bg-amber-100 text-amber-700 border-none px-3 py-1 text-[11px] font-bold shadow-none">BELUM BAYAR</Badge>;
        case 'FAILED':
            return <Badge className="bg-red-100 text-red-700 border-none px-3 py-1 text-[11px] font-bold shadow-none">GAGAL</Badge>;
        case 'EXPIRED':
            return <Badge className="bg-gray-100 text-gray-500 border-none px-3 py-1 text-[11px] font-bold shadow-none">EXPIRED</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};
