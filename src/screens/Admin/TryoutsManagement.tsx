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
import { Plus, Edit, Trash2, Eye, EyeOff, Link2, FileEdit, RotateCcw } from 'lucide-react';
import { QuestionRecoveryModal } from '@/components/QuestionRecoveryModal';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Kelola Try Out</h1>
          <p className="text-sm text-gray-600 mt-1">Buat dan kelola paket try out</p>
        </div>
        <Button onClick={() => navigate('/admin/tryouts/create')} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Try Out
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">Memuat data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tryouts.map((tryout) => (
            <Card key={tryout.id} className="border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors">
              {tryout.imageUrl && (
                <div className="h-40 overflow-hidden">
                  <img
                    src={tryout.imageUrl}
                    alt={tryout.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium text-gray-900 mb-2">{tryout.name}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={tryout.category === 'free' ? 'default' : 'secondary'} className="text-xs">
                        {tryout.category === 'free' ? 'Gratis' : 'Premium'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{tryout.type}</Badge>
                      {!tryout.isActive && <Badge variant="destructive" className="text-xs">Nonaktif</Badge>}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-3">
                <p className="text-sm text-gray-700 line-clamp-2">{tryout.description}</p>

                <div className="space-y-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Harga:</span>
                    <div className="text-right">
                      {tryout.category === 'free' ? (
                        <div>
                          {tryout.originalPrice && tryout.originalPrice > 0 ? (
                            <>
                              <span className="text-xs text-gray-400 line-through block">
                                Rp {tryout.originalPrice.toLocaleString('id-ID')}
                              </span>
                              <span className="font-medium text-green-600">Gratis</span>
                            </>
                          ) : (
                            <span className="font-medium text-green-600">Gratis</span>
                          )}
                        </div>
                      ) : tryout.discount && tryout.discount > 0 && tryout.originalPrice ? (
                        <div>
                          <span className="text-xs text-gray-400 line-through block">
                            Rp {tryout.originalPrice.toLocaleString('id-ID')}
                          </span>
                          <span className="font-medium text-blue-600">
                            Rp {tryout.price.toLocaleString('id-ID')}
                          </span>
                          <Badge variant="secondary" className="ml-2 text-[10px]">
                            -{tryout.discount}%
                          </Badge>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-900">
                          Rp {tryout.price.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Soal:</span>
                    <span className="font-medium text-gray-900">{tryout.totalQuestions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Total Durasi:</span>
                    <span className="font-medium text-gray-900">
                      {tryout.totalDuration} menit
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-3">
                  <Button
                    variant={tryout.isActive ? 'default' : 'outline'}
                    size="sm"
                    className="w-full"
                    onClick={() => handleToggleStatus(tryout.id, tryout.isActive)}
                  >
                    {tryout.isActive ? (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Aktif (Klik untuk Nonaktifkan)
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Nonaktif (Klik untuk Aktifkan)
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setRecoveryModal({ isOpen: true, tryoutId: tryout.id, tryoutName: tryout.name })}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Recovery Soal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigate(`/admin/tryouts/${tryout.id}/questions`)}
                  >
                    <FileEdit className="w-4 h-4 mr-2" />
                    Kelola Soal
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/admin/tryouts/edit/${tryout.id}`)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(tryout.id)}
                    >
                      <Trash2 className="w-4 h-4" />
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
