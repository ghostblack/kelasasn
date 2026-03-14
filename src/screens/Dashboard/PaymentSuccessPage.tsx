import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Receipt } from 'lucide-react';

export const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { tryoutId } = useParams<{ tryoutId: string }>();

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center">
        <CardContent className="pt-12 pb-12">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pembayaran Berhasil!
            </h1>
            <p className="text-gray-600 text-lg">
              Terima kasih atas pembayaran Anda. Try out telah berhasil dibeli.
            </p>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8">
            <p className="text-green-800 font-medium mb-2">
              Try out Anda sudah dapat diakses
            </p>
            <p className="text-green-700 text-sm">
              Anda sekarang dapat mulai mengerjakan try out yang telah dibeli
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate(`/dashboard/tryout/${tryoutId}`)}
              className="w-full h-12 text-base"
            >
              Mulai Try Out
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/payment-history')}
              className="w-full h-12 text-base"
            >
              <Receipt className="h-5 w-5 mr-2" />
              Lihat Riwayat Pembayaran
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/tryouts')}
              className="w-full h-12 text-base"
            >
              Lihat Semua Try Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
