import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TryoutPackage } from '@/types';
import { getAllTryouts, toggleTryoutStatus } from '@/services/tryoutService';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, FileEdit, RotateCcw } from 'lucide-react';
import { QuestionRecoveryModal } from '@/components/QuestionRecoveryModal';
import { deleteAllRankings } from '@/services/rankingService';

export const TryoutsManagement: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tryouts, setTryouts] = useState<TryoutPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [recoveryModal, setRecoveryModal] = useState<{
    isOpen: boolean;
    tryoutId: string;
    tryoutName: string;
  }>({ isOpen: false, tryoutId: '', tryoutName: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const tryoutsData = await getAllTryouts();
      setTryouts(tryoutsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (tryoutId: string, currentStatus: boolean) => {
    try {
      await toggleTryoutStatus(tryoutId);
      toast({
        title: 'Berhasil',
        description: currentStatus
          ? 'Try out berhasil dinonaktifkan'
          : 'Try out berhasil diaktifkan',
      });
      loadData();
    } catch (error) {
      console.error('Error toggling tryout status:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengubah status try out',
        variant: 'destructive',
      });
    }
  };

  const handleResetRankings = async (tryoutId: string, tryoutName: string) => {
    if (!confirm(`Yakin ingin mereset semua data ranking untuk "${tryoutName}"? Tindakan ini akan menghapus semua hasil pengerjaan peserta untuk try out ini.`)) return;

    try {
      setLoading(true);
      await deleteAllRankings(tryoutId);
      toast({
        title: 'Berhasil',
        description: `Seluruh data ranking untuk ${tryoutName} telah dihapus`,
      });
      loadData();
    } catch (error) {
      console.error('Error resetting rankings:', error);
      toast({
        title: 'Error',
        description: 'Gagal mereset data ranking',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tryoutId: string) => {
    if (!confirm('Yakin ingin menghapus try out ini?')) return;

    try {
      await deleteDoc(doc(db, 'tryout_packages', tryoutId));
      toast({
        title: 'Berhasil',
        description: 'Try out berhasil dihapus',
      });
      loadData();
    } catch (error) {
      console.error('Error deleting tryout:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus try out',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-10">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold text-gray-400 capitalize tracking-wider">Product Management</span>
           </div>
           <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
             Kelola <span className="text-gray-400 font-medium ml-2">Try Out</span>
           </h1>
           <p className="text-sm text-gray-500 mt-4 leading-relaxed max-w-xl">
             Buat paket baru, atur visibilitas, dan kelola rincian paket try out yang tersedia untuk peserta.
           </p>
        </div>
        <div className="flex items-center gap-3">
           <Button onClick={() => navigate('/admin/tryouts/create')} className="bg-gray-900 hover:bg-black text-white px-6 h-11 rounded-none text-xs font-bold uppercase tracking-widest transition-all shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Try Out
           </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-24 bg-white border border-gray-100">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-500 text-xs font-bold uppercase tracking-widest">Memuat Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tryouts.map((tryout) => (
            <Card key={tryout.id} className="bg-white border border-gray-100 rounded-none overflow-hidden hover:border-gray-200 transition-all group shadow-sm hover:shadow-md">
              {tryout.imageUrl && (
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={tryout.imageUrl}
                    alt={tryout.name}
                    className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                    }}
                  />
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    <Badge className={`${tryout.category === 'free' ? 'bg-green-500' : 'bg-gray-900'} text-white rounded-none border-none text-[10px] font-bold uppercase tracking-widest`}>
                      {tryout.category === 'free' ? 'Gratis' : 'Premium'}
                    </Badge>
                  </div>
                </div>
              )}
              <CardHeader className="pb-4 pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-gray-900 mb-1 leading-tight">{tryout.name}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{tryout.type}</span>
                      {!tryout.isActive && <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest leading-none">Offline</span>}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pb-8">
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed h-8">{tryout.description}</p>

                <div className="grid grid-cols-2 gap-px bg-gray-100 border border-gray-100">
                  <div className="bg-gray-50/50 p-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Pricing</span>
                    <div className="text-sm font-bold text-gray-900">
                      {tryout.category === 'free' ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        <span>Rp {tryout.price.toLocaleString('id-ID')}</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-gray-50/50 p-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Quantity</span>
                    <div className="text-sm font-bold text-gray-900">
                      {tryout.totalQuestions} <span className="text-[10px] font-medium text-gray-400">Items</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full rounded-none h-11 border-gray-100 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50"
                    onClick={() => navigate(`/admin/tryouts/${tryout.id}/questions`)}
                  >
                    <FileEdit className="w-3.5 h-3.5 mr-2" />
                    Manage Content
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-none h-11 border-gray-100 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50"
                      onClick={() => navigate(`/admin/tryouts/edit/${tryout.id}`)}
                    >
                      <Edit className="w-3.5 h-3.5 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      title="Reset Rankings"
                      className="flex-1 rounded-none h-11 border-gray-100 text-orange-500 hover:bg-orange-50 hover:border-orange-100 transition-all"
                      onClick={() => handleResetRankings(tryout.id, tryout.name)}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      className={`flex-1 rounded-none h-11 border-gray-100 text-[10px] font-bold uppercase tracking-widest ${tryout.isActive ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-50'}`}
                      onClick={() => handleToggleStatus(tryout.id, tryout.isActive)}
                    >
                      {tryout.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-11 h-11 rounded-none p-0 border-gray-100 text-red-500 hover:bg-red-50 hover:border-red-100"
                      onClick={() => handleDelete(tryout.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {tryouts.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600">Belum ada try out</p>
            </div>
          )}
        </div>
      )}

      <QuestionRecoveryModal
        isOpen={recoveryModal.isOpen}
        onClose={() => setRecoveryModal({ isOpen: false, tryoutId: '', tryoutName: '' })}
        tryoutId={recoveryModal.tryoutId}
        tryoutName={recoveryModal.tryoutName}
        onRecoveryComplete={() => loadData()}
      />
    </div>
  );
};
