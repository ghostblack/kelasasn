import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Trash2, ArrowLeft, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { getTryoutById, getAllTryouts } from '@/services/tryoutService';

export const CreateTryoutPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [tryoutInfo, setTryoutInfo] = useState({
    name: '',
    description: '',
    price: 0,
    originalPrice: 0,
    discount: 0,
    category: 'free' as 'free' | 'premium',
    type: 'SKD' as 'SKD' | 'SKB' | 'BOTH',
    features: [] as string[],
    imageUrl: '',
    totalDuration: 100,
    twkQuestions: 30,
    tiuQuestions: 35,
    tkpQuestions: 45,
    passingGradeTWK: 65,
    passingGradeTIU: 80,
    passingGradeTKP: 166,
    isActive: true,
    isBundle: false,
    includedTryoutIds: [] as string[],
  });

  const [featureInput, setFeatureInput] = useState('');
  const [availableTryouts, setAvailableTryouts] = useState<any[]>([]);


  useEffect(() => {
    const fetchAvailable = async () => {
      try {
        const tryouts = await getAllTryouts();
        setAvailableTryouts(tryouts.filter(t => !t.isBundle && t.id !== id));
      } catch (err) {
        console.error('Failed to load available tryouts', err);
      }
    };
    fetchAvailable();

    if (isEditMode && id) {
      loadTryoutData(id);
    }
  }, [id, isEditMode]);

  const loadTryoutData = async (tryoutId: string) => {
    setLoading(true);
    try {
      const tryout = await getTryoutById(tryoutId);
      if (!tryout) {
        toast({
          title: 'Error',
          description: 'Try out tidak ditemukan',
          variant: 'destructive',
        });
        navigate('/admin/tryouts');
        return;
      }

      setTryoutInfo({
        name: tryout.name,
        description: tryout.description,
        price: tryout.price,
        originalPrice: tryout.originalPrice || 0,
        discount: tryout.discount || 0,
        category: tryout.category,
        type: tryout.type,
        features: tryout.features,
        imageUrl: tryout.imageUrl || '',
        totalDuration: tryout.totalDuration || 100,
        twkQuestions: tryout.twkQuestions,
        tiuQuestions: tryout.tiuQuestions,
        tkpQuestions: tryout.tkpQuestions,
        passingGradeTWK: tryout.passingGradeTWK || 65,
        passingGradeTIU: tryout.passingGradeTIU || 80,
        passingGradeTKP: tryout.passingGradeTKP || 166,
        isActive: tryout.isActive,
        isBundle: tryout.isBundle || false,
        includedTryoutIds: tryout.includedTryoutIds || [],
      });

    } catch (error) {
      console.error('Error loading tryout:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat data try out',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setTryoutInfo({
        ...tryoutInfo,
        features: [...tryoutInfo.features, featureInput.trim()],
      });
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    setTryoutInfo({
      ...tryoutInfo,
      features: tryoutInfo.features.filter((_, i) => i !== index),
    });
  };


  const validateInfo = () => {
    if (!tryoutInfo.name.trim()) {
      toast({
        title: 'Error',
        description: 'Nama try out harus diisi',
        variant: 'destructive',
      });
      return false;
    }
    if (!tryoutInfo.description.trim()) {
      toast({
        title: 'Error',
        description: 'Deskripsi harus diisi',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleSaveTryoutInfo = async () => {
    if (!validateInfo()) return;

    setSaving(true);
    try {
      const totalQuestions = tryoutInfo.twkQuestions + tryoutInfo.tiuQuestions + tryoutInfo.tkpQuestions;

      if (isEditMode && id) {
        // Saat edit: hanya update field yang allowed, preserve questionIds
        const updateData = {
          name: tryoutInfo.name,
          description: tryoutInfo.description,
          price: tryoutInfo.price,
          originalPrice: tryoutInfo.originalPrice,
          discount: tryoutInfo.discount,
          category: tryoutInfo.category,
          type: tryoutInfo.type,
          features: tryoutInfo.features,
          imageUrl: tryoutInfo.imageUrl,
          totalDuration: tryoutInfo.totalDuration,
          twkQuestions: tryoutInfo.twkQuestions,
          tiuQuestions: tryoutInfo.tiuQuestions,
          tkpQuestions: tryoutInfo.tkpQuestions,
          passingGradeTWK: tryoutInfo.passingGradeTWK,
          passingGradeTIU: tryoutInfo.passingGradeTIU,
          passingGradeTKP: tryoutInfo.passingGradeTKP,
          isActive: tryoutInfo.isActive,
          isBundle: tryoutInfo.isBundle,
          includedTryoutIds: tryoutInfo.isBundle ? tryoutInfo.includedTryoutIds : [],
          totalQuestions: tryoutInfo.isBundle ? 0 : totalQuestions,
          updatedAt: serverTimestamp(),
          // JANGAN set questionIds - biarkan tetap existing
        };

        await updateDoc(doc(db, 'tryout_packages', id), updateData);
        toast({
          title: 'Berhasil',
          description: 'Informasi try out berhasil diperbarui',
        });
        if (tryoutInfo.isBundle) {
          navigate('/admin/tryouts');
        } else {
          navigate(`/admin/tryouts/${id}/questions`);
        }
      } else {
        // Saat create: inisialisasi dengan questionIds kosong
        const tryoutData = {
          ...tryoutInfo,
          isBundle: tryoutInfo.isBundle,
          includedTryoutIds: tryoutInfo.isBundle ? tryoutInfo.includedTryoutIds : [],
          totalQuestions: tryoutInfo.isBundle ? 0 : totalQuestions,
          questionIds: [],
          updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, 'tryout_packages'), {
          ...tryoutData,
          createdAt: serverTimestamp(),
        });
        toast({
          title: 'Berhasil',
          description: tryoutInfo.isBundle ? 'Paket Try out berhasil dibuat.' : 'Try out berhasil dibuat. Silakan input soal.',
        });
        if (tryoutInfo.isBundle) {
          navigate('/admin/tryouts');
        } else {
          navigate(`/admin/tryouts/${docRef.id}/questions`);
        }
      }
    } catch (error) {
      console.error('Error saving tryout:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan try out',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">Memuat data...</p>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/tryouts')}
            className="hover:bg-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isEditMode ? 'Edit Try Out' : 'Buat Try Out Baru'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">Langkah 1: Informasi Try Out</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
        <Card className="border border-gray-200 bg-white">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Nama Try Out</Label>
              <Input
                value={tryoutInfo.name}
                onChange={(e) => setTryoutInfo({ ...tryoutInfo, name: e.target.value })}
                placeholder="Try Out CPNS 2024"
                className="border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Deskripsi</Label>
              <textarea
                className="w-full min-h-[80px] p-3 border border-slate-200 rounded-lg focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all"
                value={tryoutInfo.description}
                onChange={(e) => setTryoutInfo({ ...tryoutInfo, description: e.target.value })}
                placeholder="Deskripsi try out..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">URL Gambar</Label>
              <Input
                value={tryoutInfo.imageUrl}
                onChange={(e) => setTryoutInfo({ ...tryoutInfo, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="border-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={tryoutInfo.category}
                  onValueChange={(value: any) => setTryoutInfo({ ...tryoutInfo, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Gratis</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipe</Label>
                <Select value={tryoutInfo.type} onValueChange={(value: any) => setTryoutInfo({ ...tryoutInfo, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SKD">SKD</SelectItem>
                    <SelectItem value="SKB">SKB</SelectItem>
                    <SelectItem value="BOTH">BOTH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
              <input
                type="checkbox"
                id="isBundle"
                checked={tryoutInfo.isBundle}
                onChange={(e) => setTryoutInfo({ ...tryoutInfo, isBundle: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <div>
                <Label htmlFor="isBundle" className="cursor-pointer font-bold text-blue-900 block mt-0.5">
                  Jadikan sebagai Paket Bundling
                </Label>
                <p className="text-xs text-blue-700 mt-1 pb-0.5">Berisi kumpulan try out satuan. Tidak memiliki soal sendiri.</p>
              </div>
            </div>

            {tryoutInfo.isBundle && (
              <div className="space-y-3 p-5 border border-purple-200 rounded-xl bg-purple-50">
                <Label className="text-base font-bold text-purple-900">Pilih Try Out untuk Paket Ini</Label>
                <p className="text-xs text-purple-700 mb-2">Pilih try out mana saja yang akan dimasukkan ke dalam paket ini.</p>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto p-2 bg-white rounded-lg border border-purple-100">
                  {availableTryouts.length === 0 ? (
                    <p className="text-sm text-gray-500 italic p-2">Tidak ada try out satuan yang tersedia.</p>
                  ) : (
                    availableTryouts.map(t => (
                      <div key={t.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md border border-gray-100">
                        <input
                          type="checkbox"
                          id={`bundle-${t.id}`}
                          checked={tryoutInfo.includedTryoutIds.includes(t.id)}
                          onChange={(e) => {
                            const newIds = e.target.checked 
                              ? [...tryoutInfo.includedTryoutIds, t.id]
                              : tryoutInfo.includedTryoutIds.filter(id => id !== t.id);
                            setTryoutInfo({ ...tryoutInfo, includedTryoutIds: newIds });
                          }}
                          className="w-4 h-4"
                        />
                        <Label htmlFor={`bundle-${t.id}`} className="cursor-pointer flex-1 cursor-pointer">
                          <span className="font-semibold block">{t.name}</span>
                          <span className="text-xs text-gray-500">
                            {t.category === 'free' ? 'Gratis' : `Rp ${t.price.toLocaleString('id-ID')}`}
                          </span>
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}


            <div className="space-y-3 p-5 border border-slate-200 rounded-xl bg-slate-50">
              <Label className="text-base font-bold text-slate-900">Pengaturan Harga</Label>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm">Harga Asli</Label>
                  <Input
                    type="number"
                    value={tryoutInfo.originalPrice}
                    onChange={(e) => {
                      const originalPrice = parseInt(e.target.value) || 0;
                      let calculatedDiscount = 0;

                      if (originalPrice > 0 && tryoutInfo.price > 0 && tryoutInfo.price < originalPrice) {
                        calculatedDiscount = Math.round(((originalPrice - tryoutInfo.price) / originalPrice) * 100);
                      }

                      setTryoutInfo({
                        ...tryoutInfo,
                        originalPrice: originalPrice,
                        discount: calculatedDiscount,
                      });
                    }}
                    placeholder="Harga sebelum diskon"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Harga Final</Label>
                  <Input
                    type="number"
                    value={tryoutInfo.price}
                    onChange={(e) => {
                      const finalPrice = parseInt(e.target.value) || 0;
                      let calculatedDiscount = 0;

                      if (tryoutInfo.originalPrice > 0 && finalPrice > 0 && finalPrice < tryoutInfo.originalPrice) {
                        calculatedDiscount = Math.round(((tryoutInfo.originalPrice - finalPrice) / tryoutInfo.originalPrice) * 100);
                      }

                      setTryoutInfo({
                        ...tryoutInfo,
                        price: finalPrice,
                        discount: calculatedDiscount,
                      });
                    }}
                    placeholder="Harga akhir"
                  />
                </div>
              </div>
            </div>

            {!tryoutInfo.isBundle && (
              <>
            <div className="space-y-3 p-5 border border-slate-200 rounded-xl bg-slate-50">
              <Label className="text-base font-bold text-slate-900">Konfigurasi Soal</Label>

              <div className="space-y-2">
                <Label className="text-sm text-blue-900">Total Durasi (menit)</Label>
                <Input
                  type="number"
                  value={tryoutInfo.totalDuration}
                  onChange={(e) => setTryoutInfo({ ...tryoutInfo, totalDuration: parseInt(e.target.value) || 100 })}
                  className="bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-blue-900">Soal TWK</Label>
                  <Input
                    type="number"
                    value={tryoutInfo.twkQuestions}
                    onChange={(e) => setTryoutInfo({ ...tryoutInfo, twkQuestions: parseInt(e.target.value) || 0 })}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-blue-900">Soal TIU</Label>
                  <Input
                    type="number"
                    value={tryoutInfo.tiuQuestions}
                    onChange={(e) => setTryoutInfo({ ...tryoutInfo, tiuQuestions: parseInt(e.target.value) || 0 })}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-blue-900">Soal TKP</Label>
                  <Input
                    type="number"
                    value={tryoutInfo.tkpQuestions}
                    onChange={(e) => setTryoutInfo({ ...tryoutInfo, tkpQuestions: parseInt(e.target.value) || 0 })}
                    className="bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 p-5 border border-slate-200 rounded-xl bg-slate-50">
              <Label className="text-base font-bold text-slate-900">Passing Grade</Label>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm text-blue-900">TWK</Label>
                  <Input
                    type="number"
                    value={tryoutInfo.passingGradeTWK}
                    onChange={(e) => setTryoutInfo({ ...tryoutInfo, passingGradeTWK: parseInt(e.target.value) || 65 })}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-blue-900">TIU</Label>
                  <Input
                    type="number"
                    value={tryoutInfo.passingGradeTIU}
                    onChange={(e) => setTryoutInfo({ ...tryoutInfo, passingGradeTIU: parseInt(e.target.value) || 80 })}
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm text-blue-900">TKP</Label>
                  <Input
                    type="number"
                    value={tryoutInfo.passingGradeTKP}
                    onChange={(e) => setTryoutInfo({ ...tryoutInfo, passingGradeTKP: parseInt(e.target.value) || 143 })}
                    className="bg-white"
                  />
                </div>
              </div>
            </div>
            </>
            )}

            <div className="space-y-2">
              <Label>Fitur</Label>
              <div className="flex gap-2">
                <Input
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  placeholder="Tambah fitur..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFeature()}
                />
                <Button type="button" onClick={handleAddFeature}>
                  Tambah
                </Button>
              </div>
              <div className="space-y-2 mt-2">
                {tryoutInfo.features.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{feature}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFeature(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={tryoutInfo.isActive}
                onChange={(e) => setTryoutInfo({ ...tryoutInfo, isActive: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Try Out Aktif
              </Label>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-end gap-3"
        >
          <Button
            variant="outline"
            onClick={() => navigate('/admin/tryouts')}
            className="border-slate-200 hover:bg-slate-50"
          >
            Batal
          </Button>
          <Button
            onClick={handleSaveTryoutInfo}
            disabled={saving}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {saving 
              ? 'Menyimpan...' 
              : tryoutInfo.isBundle 
                ? (isEditMode ? 'Update Paket' : 'Buat Paket') 
                : (isEditMode ? 'Update & Lanjut Input Soal' : 'Simpan & Lanjut Input Soal')}
          </Button>
        </motion.div>
        </motion.div>
    </div>
  );
};
