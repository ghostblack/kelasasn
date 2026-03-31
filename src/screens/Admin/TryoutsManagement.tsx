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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, EyeOff, FileEdit, RotateCcw, AlertTriangle } from 'lucide-react';
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

  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    tryoutId: string;
    tryoutName: string;
  }>({ isOpen: false, tryoutId: '', tryoutName: '' });

  const [confirmReset, setConfirmReset] = useState<{
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
    setConfirmReset({ isOpen: true, tryoutId, tryoutName });
  };

  const executeResetRankings = async () => {
    const { tryoutId, tryoutName } = confirmReset;
    try {
      setConfirmReset(prev => ({ ...prev, isOpen: false }));
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

  const handleDelete = async (tryoutId: string, tryoutName: string) => {
    setConfirmDelete({ isOpen: true, tryoutId, tryoutName });
  };

  const executeDelete = async () => {
    const { tryoutId } = confirmDelete;
    try {
      setConfirmDelete(prev => ({ ...prev, isOpen: false }));
      setLoading(true);
      await deleteDoc(doc(db, 'tryout_packages', tryoutId));
      console.log('Successfully deleted tryout from Firestore:', tryoutId);
      toast({
        title: 'Berhasil',
        description: 'Try out berhasil dihapus',
      });
      loadData();
    } catch (error) {
      console.error('CRITICAL ERROR deleting tryout:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? `Gagal: ${error.message}` : 'Gagal menghapus try out',
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
                      {tryout.isBundle && (
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px] font-bold uppercase tracking-widest leading-none hover:bg-purple-100">
                          📦 Paket Bundling
                        </Badge>
                      )}
                      {tryout.isDraft && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] font-bold uppercase tracking-widest leading-none hover:bg-blue-100">
                          🚧 Draft (Lokal)
                        </Badge>
                      )}
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{tryout.type}</span>
                      {!tryout.isActive && !tryout.isDraft && <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest leading-none">Offline</span>}
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
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                      {tryout.isBundle ? 'Contents' : 'Quantity'}
                    </span>
                    <div className="text-sm font-bold text-gray-900">
                      {tryout.isBundle ? (
                        <span>{tryout.includedTryoutIds?.length || 0} <span className="text-[10px] font-medium text-gray-400">Tryouts</span></span>
                      ) : (
                        <span>{tryout.totalQuestions} <span className="text-[10px] font-medium text-gray-400">Items</span></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full rounded-none h-11 border-gray-100 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50"
                    onClick={() => navigate(tryout.isBundle ? `/admin/tryouts/edit/${tryout.id}` : `/admin/tryouts/${tryout.id}/questions`)}
                  >
                    <FileEdit className="w-3.5 h-3.5 mr-2" />
                    {tryout.isBundle ? 'Manage Bundle' : 'Manage Content'}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResetRankings(tryout.id, tryout.name);
                      }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(tryout.id, tryout.name);
                      }}
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

      {/* Custom Delete Confirmation Dialog */}
      <Dialog open={confirmDelete.isOpen} onOpenChange={(open) => setConfirmDelete(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-[400px] border-none shadow-2xl p-0 overflow-hidden rounded-none">
          <div className="bg-red-500 p-6 flex flex-col items-center justify-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
               <Trash2 className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-white uppercase tracking-tight">Hapus Try Out</DialogTitle>
          </div>
          <div className="p-8 space-y-6 text-center">
            <DialogDescription className="text-gray-900 font-medium text-base">
               Apakah Anda yakin ingin menghapus <span className="font-bold underline">"{confirmDelete.tryoutName}"</span>?
            </DialogDescription>
            <div className="bg-red-50 p-4 border border-red-100">
               <div className="flex items-center gap-2 text-red-600 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Warning</span>
               </div>
               <p className="text-[11px] text-red-500 leading-relaxed font-medium">
                  Tindakan ini tidak dapat dibatalkan. Semua data terkait try out ini akan dihapus secara permanen.
               </p>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 sm:justify-center">
              <Button 
                variant="outline" 
                onClick={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
                className="rounded-none border-gray-200 h-11 px-8 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-50"
              >
                Batal
              </Button>
              <Button 
                onClick={executeDelete}
                className="bg-red-600 hover:bg-red-700 text-white rounded-none h-11 px-8 text-[11px] font-bold uppercase tracking-widest shadow-sm"
              >
                Hapus Sekarang
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom Reset Rankings Confirmation Dialog */}
      <Dialog open={confirmReset.isOpen} onOpenChange={(open) => setConfirmReset(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-[400px] border-none shadow-2xl p-0 overflow-hidden rounded-none">
          <div className="bg-orange-500 p-6 flex flex-col items-center justify-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4">
               <RotateCcw className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-xl font-bold text-white uppercase tracking-tight">Reset Ranking</DialogTitle>
          </div>
          <div className="p-8 space-y-6 text-center">
            <DialogDescription className="text-gray-900 font-medium text-base">
               Ingin mereset seluruh data hasil pengerjaan untuk <span className="font-bold">"{confirmReset.tryoutName}"</span>?
            </DialogDescription>
            <div className="bg-orange-50 p-4 border border-orange-100">
               <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Caution</span>
               </div>
               <p className="text-[11px] text-orange-500 leading-relaxed font-medium">
                  Seluruh data ranking dan poin peserta akan dihapus. Peserta dapat mengerjakan ulang try out ini dari awal.
               </p>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 sm:justify-center">
              <Button 
                variant="outline" 
                onClick={() => setConfirmReset(prev => ({ ...prev, isOpen: false }))}
                className="rounded-none border-gray-200 h-11 px-8 text-[11px] font-bold uppercase tracking-widest hover:bg-gray-50"
              >
                Batal
              </Button>
              <Button 
                onClick={executeResetRankings}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-none h-11 px-8 text-[11px] font-bold uppercase tracking-widest shadow-sm"
              >
                Reset Sekarang
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
