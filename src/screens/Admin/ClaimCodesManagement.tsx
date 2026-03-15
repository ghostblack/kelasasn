import React, { useEffect, useState } from 'react';
import { ClaimCode, TryoutPackage } from '@/types';
import {
  generateClaimCode,
  getAllClaimCodes,
  updateClaimCodeStatus,
  deleteClaimCode,
} from '@/services/claimCodeService';
import { getAllTryouts } from '@/services/tryoutService';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Power, Copy, Check } from 'lucide-react';

export const ClaimCodesManagement: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [claimCodes, setClaimCodes] = useState<ClaimCode[]>([]);
  const [tryouts, setTryouts] = useState<TryoutPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tryoutId: '',
    maxUses: 1,
    expiryDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [codesData, tryoutsData] = await Promise.all([
        getAllClaimCodes(),
        getAllTryouts(),
      ]);
      console.log('Loaded tryouts:', tryoutsData);
      console.log('Loaded claim codes:', codesData);

      setClaimCodes(codesData);
      const activeTryouts = tryoutsData.filter((t) => t.isActive);
      console.log('Active tryouts:', activeTryouts);
      setTryouts(activeTryouts);

      if (activeTryouts.length === 0) {
        toast({
          title: 'Info',
          description: 'Belum ada try out aktif. Silakan buat try out terlebih dahulu.',
        });
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Gagal memuat data. Pastikan koneksi Firebase aktif.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!user || !formData.tryoutId) {
      toast({
        title: 'Error',
        description: 'Pilih try out terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    try {
      const selectedTryout = tryouts.find((t) => t.id === formData.tryoutId);
      if (!selectedTryout) return;

      const expiryDate = formData.expiryDate ? new Date(formData.expiryDate) : undefined;

      const code = await generateClaimCode(
        formData.tryoutId,
        selectedTryout.name,
        formData.maxUses,
        user.uid,
        expiryDate
      );

      toast({
        title: 'Berhasil',
        description: `Kode klaim berhasil dibuat: ${code}`,
      });

      setShowDialog(false);
      setFormData({ tryoutId: '', maxUses: 1, expiryDate: '' });
      loadData();
    } catch (error) {
      console.error('Error generating code:', error);
      toast({
        title: 'Error',
        description: 'Gagal membuat kode klaim',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (claimCodeId: string, currentStatus: boolean) => {
    try {
      await updateClaimCodeStatus(claimCodeId, !currentStatus);
      toast({
        title: 'Berhasil',
        description: `Kode ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
      });
      loadData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengubah status kode',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (claimCodeId: string) => {
    if (!confirm('Yakin ingin menghapus kode klaim ini?')) return;

    try {
      await deleteClaimCode(claimCodeId);
      toast({
        title: 'Berhasil',
        description: 'Kode klaim berhasil dihapus',
      });
      loadData();
    } catch (error) {
      console.error('Error deleting code:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus kode klaim',
        variant: 'destructive',
      });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: 'Berhasil',
      description: 'Kode berhasil disalin',
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-100 pb-10">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span className="text-[10px] font-bold text-gray-400 capitalize tracking-wider">Access Authorization</span>
           </div>
           <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
             Kelola <span className="text-gray-400 font-medium ml-2">Kode Klaim</span>
           </h1>
           <p className="text-sm text-gray-500 mt-4 leading-relaxed max-w-xl">
             Generate dan kelola kode klaim untuk akses try out manual. Aktifkan atau nonaktifkan kode untuk mengontrol akses pengguna secara instan.
           </p>
        </div>
        <div className="flex items-center gap-3">
           <Button onClick={() => setShowDialog(true)} className="bg-gray-900 hover:bg-black text-white px-6 h-11 rounded-none text-xs font-bold uppercase tracking-widest transition-all shadow-sm">
              <Plus className="w-4 h-4 mr-2" />
              Generate Kode
           </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-24 bg-white border border-gray-100">
           <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto"></div>
           <p className="mt-4 text-gray-500 text-xs font-bold uppercase tracking-widest">Initialising Database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {claimCodes.map((claimCode) => (
            <Card key={claimCode.id} className="bg-white border border-gray-100 rounded-none shadow-sm overflow-hidden hover:border-gray-200 transition-all group">
              <div className="p-6 border-b border-gray-50 bg-gray-50/50">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-tight mb-2 leading-tight min-h-[2rem] line-clamp-2">
                      {claimCode.tryoutName}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge className={`rounded-none border-none text-[9px] font-black tracking-tighter ${
                        claimCode.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {claimCode.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                      {claimCode.currentUses >= claimCode.maxUses && (
                        <Badge className="bg-red-50 text-red-600 rounded-none border-none text-[9px] font-black tracking-tighter">
                          FULL
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="relative group/code">
                  <div className="absolute -inset-2 bg-indigo-50/0 group-hover/code:bg-indigo-50/50 transition-all duration-300 -z-10" />
                  <div className="flex items-center justify-between gap-4 p-4 border border-gray-100 bg-white">
                    <code className="text-xl font-black text-gray-900 tracking-wider">
                      {claimCode.code}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCode(claimCode.code)}
                      className="h-8 w-8 p-0 hover:bg-gray-50 rounded-none transition-colors"
                    >
                      {copiedCode === claimCode.code ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-px bg-gray-100 border border-gray-100">
                  <div className="bg-white p-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Usage</p>
                    <p className="text-xs font-black text-gray-900">
                      {claimCode.currentUses} <span className="text-gray-300 font-medium">/</span> {claimCode.maxUses}
                    </p>
                  </div>
                  <div className="bg-white p-3">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-xs font-black text-gray-900">
                      {claimCode.currentUses >= claimCode.maxUses ? 'EXHAUSTED' : 'AVAILABLE'}
                    </p>
                  </div>
                  <div className="bg-white p-3 col-span-2 border-t border-gray-100">
                     <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Created / Expiry</p>
                     <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-900">{claimCode.createdAt.toLocaleDateString('id-ID')}</span>
                        <span className="text-xs font-medium text-gray-400">
                          {claimCode.expiryDate ? claimCode.expiryDate.toLocaleDateString('id-ID') : 'No Expiry'}
                        </span>
                     </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`flex-1 rounded-none text-[10px] font-bold uppercase tracking-widest h-10 border border-gray-100 transition-all ${
                      claimCode.isActive ? 'text-gray-400 hover:text-orange-600 hover:bg-orange-50/50' : 'text-blue-600 hover:bg-blue-50/50 bg-blue-50/30'
                    }`}
                    onClick={() => handleToggleStatus(claimCode.id, claimCode.isActive)}
                  >
                    <Power className="w-3.5 h-3.5 mr-2" />
                    {claimCode.isActive ? 'Deactivate' : 'Activate Area'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="aspect-square w-10 p-0 rounded-none text-gray-300 hover:text-red-600 hover:bg-red-50 border border-gray-100 transition-all"
                    onClick={() => handleDelete(claimCode.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {claimCodes.length === 0 && (
            <div className="col-span-full text-center py-24 bg-white border border-dashed border-gray-200">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                  <Plus className="w-6 h-6 text-gray-300" />
               </div>
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No active claim codes found</p>
               <Button variant="link" onClick={() => setShowDialog(true)} className="text-blue-600 text-[10px] font-bold uppercase tracking-widest mt-2">
                 Generate First Code
               </Button>
            </div>
          )}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Kode Klaim Baru</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pilih Try Out</Label>
              <Select value={formData.tryoutId} onValueChange={(value) => setFormData({ ...formData, tryoutId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih try out" />
                </SelectTrigger>
                <SelectContent>
                  {tryouts.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500 text-center">
                      Tidak ada try out aktif
                    </div>
                  ) : (
                    tryouts.map((tryout) => (
                      <SelectItem key={tryout.id} value={tryout.id}>
                        {tryout.name} ({tryout.category === 'free' ? 'Gratis' : 'Premium'})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {tryouts.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Silakan buat try out terlebih dahulu di menu Kelola Try Out
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Maksimal Penggunaan</Label>
              <Input
                type="number"
                min="1"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: parseInt(e.target.value) || 1 })}
                placeholder="Jumlah user yang dapat menggunakan kode"
              />
            </div>

            <div className="space-y-2">
              <Label>Tanggal Kadaluarsa (Opsional)</Label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleGenerate} disabled={!formData.tryoutId}>
              Generate Kode
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
