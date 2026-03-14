import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAllPayments, updatePaymentStatus } from '@/services/paymentService';
import { PaymentTransaction } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';

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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Kelola Pembayaran</h1>
                <Button onClick={loadPayments} variant="outline" size="sm">Refresh</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Daftar Transaksi</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Try Out</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Aksi</TableHead>
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
                                    <TableRow key={payment.id}>
                                        <TableCell className="text-xs">
                                            {payment.createdAt.toLocaleDateString('id-ID')}
                                            <br />
                                            {payment.createdAt.toLocaleTimeString('id-ID')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm font-medium">{(payment as any).customerName || 'N/A'}</div>
                                            <div className="text-xs text-gray-500">{(payment as any).customerPhone || 'N/A'}</div>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">{payment.tryoutName}</TableCell>
                                        <TableCell className="text-sm font-bold">
                                            Rp {payment.totalAmount.toLocaleString('id-ID')}
                                        </TableCell>
                                        <TableCell>
                                            {payment.status === 'PAID' && (
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Disetujui</Badge>
                                            )}
                                            {payment.status === 'PENDING_CONFIRMATION' && (
                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Menunggu Konfirmasi</Badge>
                                            )}
                                            {payment.status === 'UNPAID' && (
                                                <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">Belum Bayar</Badge>
                                            )}
                                            {payment.status === 'FAILED' && (
                                                <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Ditolak</Badge>
                                            )}
                                            {payment.status === 'EXPIRED' && (
                                                <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200">Expired</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {payment.status === 'PENDING_CONFIRMATION' && (
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleApprove(payment)}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
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
                </CardContent>
            </Card>
        </div>
    );
};
