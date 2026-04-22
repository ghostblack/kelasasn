import React, { useState, useEffect } from 'react';
import { Image, Power, Save, Eye, EyeOff, ExternalLink, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getPromoBanner, setPromoBanner, PromoBanner, BannerLinkTarget } from '@/services/promoBannerService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getAllTryoutsForAdmin } from '@/services/tryoutService';
import { TryoutPackage } from '@/types';

const LINK_TARGETS: { value: BannerLinkTarget; label: string; desc: string }[] = [
  { value: 'none',          label: 'Tidak ada (hanya ditutup)',        desc: 'User hanya bisa menutup banner.' },
  { value: 'tryouts_page',  label: 'Halaman Daftar Paket (Bundling)',  desc: 'Arahkan ke halaman Try Out, filter Bundling.' },
  { value: 'tryout_detail', label: 'Paket Tertentu (pilih di bawah)',  desc: 'Langsung ke detail/pembayaran paket yang dipilih.' },
];

export const PromoBannerManagement: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [banner, setBanner] = useState<PromoBanner>({
    isActive: false,
    imageUrl: '',
    title: '',
    linkTarget: 'none',
    linkTryoutId: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOk, setPreviewOk] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // Daftar tryout untuk dropdown
  const [tryouts, setTryouts] = useState<TryoutPackage[]>([]);
  const [loadingTryouts, setLoadingTryouts] = useState(false);

  useEffect(() => {
    getPromoBanner().then((data) => {
      setBanner(data);
      setLoading(false);
      if (data.imageUrl) setPreviewOk(true);
    });

    setLoadingTryouts(true);
    getAllTryoutsForAdmin()
      .then((list) => {
        // Tampilkan hanya yang aktif, utamakan bundling
        const active = list
          .filter((t) => t.isActive)
          .sort((a, b) => (b.isBundle ? 1 : 0) - (a.isBundle ? 1 : 0));
        setTryouts(active);
      })
      .finally(() => setLoadingTryouts(false));
  }, []);

  const handleImageUrlChange = (val: string) => {
    setBanner((prev) => ({ ...prev, imageUrl: val }));
    setPreviewOk(false);
    setPreviewError(false);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!banner.imageUrl.trim()) {
      toast({ title: 'URL gambar wajib diisi', variant: 'destructive' });
      return;
    }
    if (banner.linkTarget === 'tryout_detail' && !banner.linkTryoutId) {
      toast({ title: 'Pilih paket tujuan terlebih dahulu', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      // Hapus linkTryoutId jika tidak relevan
      const payload: Omit<PromoBanner, 'updatedAt' | 'linkTryoutName'> = {
        ...banner,
        linkTryoutId: banner.linkTarget === 'tryout_detail' ? banner.linkTryoutId : '',
      };
      await setPromoBanner(payload, user.uid);
      toast({ title: '✅ Berhasil Disimpan', description: 'Konfigurasi promo banner telah diperbarui.' });
    } catch (err) {
      toast({ title: 'Gagal menyimpan', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const selectedTryout = tryouts.find((t) => t.id === banner.linkTryoutId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-2xl">
      {/* Header */}
      <div className="border-b border-gray-100 pb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Promo / Iklan</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Banner Iklan <span className="text-gray-400 font-medium ml-2 text-2xl">Management</span>
        </h1>
        <p className="text-sm text-gray-500 mt-3 leading-relaxed">
          Banner tampil sekali per sesi saat user login. Admin dapat mengatur gambar, tujuan klik, dan status aktif.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ── Form kiri ── */}
        <div className="space-y-6">

          {/* Toggle On/Off */}
          <div className={`p-5 border rounded-xl transition-all ${
            banner.isActive ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">Status Banner</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {banner.isActive ? 'Banner aktif & akan tampil ke user' : 'Banner dinonaktifkan'}
                </p>
              </div>
              <button
                onClick={() => setBanner((p) => ({ ...p, isActive: !p.isActive }))}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none ${
                  banner.isActive ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                  banner.isActive ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          {/* URL Gambar */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
              <Image className="h-3.5 w-3.5" /> URL Gambar Iklan
            </label>
            <input
              type="url"
              value={banner.imageUrl}
              onChange={(e) => handleImageUrlChange(e.target.value)}
              placeholder="https://contoh.com/gambar-promo.jpg"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
            />
            <p className="text-[10px] text-gray-400 font-medium px-1">
              Gunakan URL gambar publik. Gambar tampil sesuai proporsi aslinya (tidak dipotong).
            </p>
          </div>

          {/* Judul opsional */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-widest">
              Judul / Label <span className="text-gray-400 font-normal normal-case tracking-normal ml-1">(opsional)</span>
            </label>
            <input
              type="text"
              value={banner.title || ''}
              onChange={(e) => setBanner((p) => ({ ...p, title: e.target.value }))}
              placeholder="Promo Ramadan 2025"
              className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
            />
          </div>

          {/* ── Pengaturan Klik / Link ── */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5" /> Tujuan Saat Diklik
            </label>
            <div className="space-y-2">
              {LINK_TARGETS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setBanner((p) => ({ ...p, linkTarget: opt.value, linkTryoutId: '' }))}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                    banner.linkTarget === opt.value
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-bold text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Dropdown pilih tryout (hanya muncul jika linkTarget === 'tryout_detail') */}
          {banner.linkTarget === 'tryout_detail' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                <Package className="h-3.5 w-3.5" /> Pilih Paket Tujuan
              </label>
              <select
                value={banner.linkTryoutId || ''}
                onChange={(e) => setBanner((p) => ({ ...p, linkTryoutId: e.target.value }))}
                disabled={loadingTryouts}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
              >
                <option value="">-- Pilih paket --</option>
                {tryouts.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.isBundle ? '💎 ' : ''}{t.name}
                    {t.price > 0 ? ` — Rp ${t.price.toLocaleString('id-ID')}` : ' — GRATIS'}
                  </option>
                ))}
              </select>
              {selectedTryout && (
                <p className="text-[10px] text-blue-600 font-bold px-1">
                  ✓ Dipilih: {selectedTryout.name}
                </p>
              )}
            </div>
          )}

          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
          </Button>

          {/* Info */}
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
            <div className="flex items-start gap-3">
              <Power className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Cara Kerja</p>
                <ul className="text-xs text-amber-700 space-y-0.5 leading-relaxed">
                  <li>• Popup muncul sekali saat user login (per sesi tab)</li>
                  <li>• Admin tidak mendapatkan popup</li>
                  <li>• Klik gambar → arahkan ke paket yang dipilih</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ── Preview kanan ── */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-widest">Preview Tampilan</p>
          <div className="relative w-full min-h-[200px] max-h-[500px] rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm flex items-center justify-center">
            {banner.imageUrl && !previewError ? (
              <>
                <img
                  src={banner.imageUrl}
                  alt="Preview iklan"
                  className="w-full h-auto max-h-[500px] object-contain rounded-2xl"
                  onLoad={() => setPreviewOk(true)}
                  onError={() => { setPreviewError(true); setPreviewOk(false); }}
                />
                {/* Status badge */}
                <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                  banner.isActive
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-gray-50 text-gray-500 border-gray-200'
                }`}>
                  {banner.isActive ? '● Aktif' : '○ Nonaktif'}
                </div>
                {/* Simulasi close button */}
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white shadow border border-gray-200 flex items-center justify-center">
                  <span className="text-xs text-gray-500">✕</span>
                </div>
              </>
            ) : previewError ? (
              <div className="w-full h-48 flex flex-col items-center justify-center gap-2 text-gray-400 p-6">
                <EyeOff className="h-10 w-10 text-gray-300" />
                <p className="text-xs font-bold text-center uppercase tracking-widest">URL gambar tidak valid</p>
              </div>
            ) : (
              <div className="w-full h-48 flex flex-col items-center justify-center gap-2 text-gray-300 p-6">
                <Eye className="h-10 w-10" />
                <p className="text-xs font-bold text-center uppercase tracking-widest">Preview gambar</p>
              </div>
            )}
          </div>

          {previewOk && !previewError && (
            <p className="text-[10px] text-green-600 font-bold text-center uppercase tracking-widest">
              ✓ Gambar berhasil dimuat
            </p>
          )}

          {/* Info tujuan klik */}
          {banner.linkTarget !== 'none' && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Tujuan Klik:</p>
              <p className="text-xs text-blue-700">
                {banner.linkTarget === 'tryouts_page'
                  ? '→ Halaman Daftar Paket (filter: Bundling)'
                  : selectedTryout
                    ? `→ ${selectedTryout.name}`
                    : '→ (belum ada paket dipilih)'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
