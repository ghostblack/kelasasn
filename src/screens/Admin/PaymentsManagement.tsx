import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAllPayments, updatePaymentStatus } from '@/services/paymentService';
import { PaymentTransaction } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X, Search } from 'lucide-react';

export const PaymentsManagement: React.FC = () => {
    const [payments, setPayments] = useState<PaymentTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        loadPayments();
    }, []);

    const loadPayments = async () => {
        try {
            setLoading(true);
            const data = await getAllPayments();
            // Sort by status (pending first) then by date (newest first)
            const sorted = [...data].sort((a, b) => {
                if (a.status === 'PENDING_CONFIRMATION' && b.status !== 'PENDING_CONFIRMATION') return -1;
                if (a.status !== 'PENDING_CONFIRMATION' && b.status === 'PENDING_CONFIRMATION') return 1;
                return b.createdAt.getTime() - a.createdAt.getTime();
            });
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
                title: 'Berhasil',
                description: `Pembayaran ${payment.reference} telah disetujui`,
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
                title: 'Berhasil',
                description: `Pembayaran ${payment.reference} telah ditolak`,
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

    if (loading) {
        return <div className="p-8 text-center">Memuat data pembayaran...</div>;
    }

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-10">
                <div>
                   <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <span className="text-[10px] font-bold text-gray-400 capitalize tracking-wider">Revenue & Transactions</span>
                   </div>
                   <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
                     Kelola <span className="text-gray-400 font-medium ml-2">Pembayaran</span>
                   </h1>
                   <p className="text-sm text-gray-500 mt-4 leading-relaxed max-w-xl">
                     Verifikasi pembayaran manual, pantau riwayat transaksi, dan kelola status langganan peserta tryout secara real-time.
                   </p>
                </div>
                <div className="flex items-center gap-3">
                   <Button onClick={loadPayments} className="bg-gray-900 hover:bg-black text-white px-6 h-11 rounded-none text-xs font-bold uppercase tracking-widest transition-all shadow-sm">
                      <Search className="w-4 h-4 mr-2" />
                      Refresh History
                   </Button>
                </div>
            </div>

            <Card className="bg-white border border-gray-100 rounded-none shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                    <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction Records</h2>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="border-gray-100 hover:bg-transparent">
                                <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest py-4">Timestamp</TableHead>
                                <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest py-4">Customer Details</TableHead>
                                <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest py-4">Product</TableHead>
                                <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest py-4">Amount</TableHead>
                                <TableHead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest py-4 text-center">Status</TableHead>
                                <TableHead className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-widest py-4 px-6">Verification</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        Tidak ada transaksi ditemukan
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payments.map((payment) => (
                                    <TableRow key={payment.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="py-4">
                                            <div className="text-xs font-bold text-gray-900">{payment.createdAt.toLocaleDateString('id-ID')}</div>
                                            <div className="text-[10px] font-medium text-gray-400">{payment.createdAt.toLocaleTimeString('id-ID')}</div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="text-sm font-bold text-gray-900 uppercase tracking-tight">{(payment as any).customerName || 'N/A'}</div>
                                            <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{(payment as any).customerPhone || 'N/A'}</div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="text-xs font-bold text-gray-700">{payment.tryoutName}</div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="text-sm font-black text-gray-900">
                                                Rp {payment.totalAmount.toLocaleString('id-ID')}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center py-4">
                                            {payment.status === 'PAID' && (
                                                <Badge className="bg-green-50 text-green-600 rounded-none border-none text-[10px] font-bold tracking-tighter">SUCCESS</Badge>
                                            )}
                                            {payment.status === 'PENDING_CONFIRMATION' && (
                                                <Badge className="bg-blue-50 text-blue-600 rounded-none border-none text-[10px] font-bold tracking-tighter italic">WAITING</Badge>
                                            )}
                                            {payment.status === 'UNPAID' && (
                                                <Badge className="bg-yellow-50 text-yellow-600 rounded-none border-none text-[10px] font-bold tracking-tighter">UNPAID</Badge>
                                            )}
                                            {payment.status === 'FAILED' && (
                                                <Badge className="bg-red-50 text-red-600 rounded-none border-none text-[10px] font-bold tracking-tighter">FAILED</Badge>
                                            )}
                                            {payment.status === 'EXPIRED' && (
                                                <Badge className="bg-gray-50 text-gray-400 rounded-none border-none text-[10px] font-bold tracking-tighter">EXPIRED</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right py-4 px-6">
                                            {payment.status === 'PENDING_CONFIRMATION' && (
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 w-9 p-0 text-green-600 hover:bg-green-50 rounded-none"
                                                        onClick={() => handleApprove(payment)}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-9 w-9 p-0 text-red-500 hover:bg-red-50 rounded-none"
                                                        onClick={() => handleReject(payment)}
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};
