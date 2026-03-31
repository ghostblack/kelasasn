import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, Receipt, ArrowRight } from 'lucide-react';

export const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { tryoutId } = useParams<{ tryoutId: string }>();

  return (
    <div className="max-w-xl mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-12 text-center">
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-emerald-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
          Pembayaran Berhasil
        </h1>
        <p className="text-gray-500 text-lg mb-8 max-w-sm mx-auto">
          Terima kasih. Akses ke try out Anda sekarang sudah dibuka sepenuhnya.
        </p>

        <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-6 mb-10 text-left flex gap-4 items-start">
          <div className="bg-emerald-100 p-2 rounded-full mt-0.5">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-emerald-900 font-semibold mb-1">
              Siap untuk Mulai Belajar!
            </p>
            <p className="text-emerald-700 text-sm leading-relaxed">
              Anda sudah dapat mengakses semua materi dan soal try out yang telah berhasil dibeli.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => navigate(`/dashboard/tryout/${tryoutId}`)}
            className="w-full h-14 text-base rounded-xl bg-blue-600 hover:bg-blue-700 font-medium shadow-none hover:shadow-md transition-all flex items-center justify-center gap-2 group"
          >
            Mulai Try Out Sekarang
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/payment-history')}
              className="h-12 text-sm rounded-xl border-gray-200 hover:bg-gray-50 text-gray-600 font-medium"
            >
              <Receipt className="h-4 w-4 mr-2" />
              Riwayat
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard/tryouts')}
              className="h-12 text-sm rounded-xl border-gray-200 hover:bg-gray-50 text-gray-600 font-medium"
            >
              Cari Try Out Lain
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
