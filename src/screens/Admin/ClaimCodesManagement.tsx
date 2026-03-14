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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Kelola Kode Klaim</h1>
          <p className="text-sm text-gray-600 mt-1">Generate dan kelola kode klaim untuk akses try out</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Generate Kode
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">Memuat data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {claimCodes.map((claimCode) => (
            <Card key={claimCode.id} className="border border-gray-200 hover:border-gray-300 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium text-gray-900 mb-2">{claimCode.tryoutName}</CardTitle>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={claimCode.isActive ? 'default' : 'secondary'} className="text-xs">
                        {claimCode.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                      {claimCode.currentUses >= claimCode.maxUses && (
                        <Badge variant="destructive" className="text-xs">
                          Penuh
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-3">
                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-lg font-semibold text-blue-900">{claimCode.code}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCode(claimCode.code)}
                      className="shrink-0"
                    >
                      {copiedCode === claimCode.code ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="flex justify-between">
                    <span className="font-medium">Penggunaan:</span>
                    <span className="font-medium text-gray-900">
                      {claimCode.currentUses} / {claimCode.maxUses}
                    </span>
                  </div>
                  {claimCode.expiryDate && (
                    <div className="flex justify-between">
                      <span className="font-medium">Kadaluarsa:</span>
                      <span className="font-medium text-gray-900">
                        {claimCode.expiryDate.toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">Dibuat:</span>
                    <span className="font-medium text-gray-900">
                      {claimCode.createdAt.toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    variant={claimCode.isActive ? 'outline' : 'default'}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleToggleStatus(claimCode.id, claimCode.isActive)}
                  >
                    <Power className="w-4 h-4 mr-2" />
                    {claimCode.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(claimCode.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {claimCodes.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-600 text-base">Belum ada kode klaim</p>
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
