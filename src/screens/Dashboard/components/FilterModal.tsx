import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { sscasnService, FilterOptions } from '@/services/sscasnService';
import { X, Search } from 'lucide-react';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

const JENJANG_OPTIONS = [
  { value: '10', label: 'SMA/Sederajat' },
  { value: '15', label: 'Diploma I' },
  { value: '20', label: 'Diploma II' },
  { value: '30', label: 'Diploma III/Sarjana Muda' },
  { value: '35', label: 'Diploma IV' },
  { value: '40', label: 'S-1/Sarjana' },
  { value: '45', label: 'S-2' },
  { value: '50', label: 'S-3/Doktor' },
  { value: '80', label: 'Spesialis' },
];

const getDegreePrefix = (code: string, name: string) => {
  // 1. Try to get from name first (reliable for BKN)
  const upperName = name.toUpperCase();
  if (upperName.includes('S-1')) return 'S-1';
  if (upperName.includes('D-IV')) return 'D-IV';
  if (upperName.includes('D-III')) return 'D-III';
  if (upperName.includes('S-2')) return 'S-2';
  if (upperName.includes('S-3')) return 'S-3';
  if (upperName.includes('D-II')) return 'D-II';
  if (upperName.includes('D-I')) return 'D-I';
  if (upperName.includes('SMA')) return 'SMA';

  // 2. Fallback to code prefix
  const prefix = code.substring(0, 2);
  switch (prefix) {
    case '10': return 'SMA';
    case '15': return 'D-I';
    case '20': return 'D-II';
    case '30': return 'D-III';
    case '35': return 'D-IV';
    case '40': return 'S-1';
    case '45': return 'S-2';
    case '50': return 'S-3';
    case '51': return 'S-1/D-IV';
    case '52': return 'S-1';
    case '80': return 'Spesialis';
    default: return '';
  }
};

export const FilterModal = ({ isOpen, onClose, onApply, currentFilters }: FilterModalProps) => {
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);
  const [instansiList, setInstansiList] = useState<any[]>([]);
  const [jabatanList, setJabatanList] = useState<any[]>([]);
  const [prodiList, setProdiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchProdi, setSearchProdi] = useState('');
  const [searchJabatan, setSearchJabatan] = useState('');
  const [searchInstansi, setSearchInstansi] = useState('');
  const [isFilteringProdi, setIsFilteringProdi] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMetadata();
      setFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const loadMetadata = async () => {
    if (instansiList.length > 0) return;
    setLoading(true);
    try {
      const [instansi, jabatan, pendidikan] = await Promise.all([
        sscasnService.getInstansi(),
        sscasnService.getJabatan(),
        sscasnService.getPendidikan(),
      ]);
      
      // Sort alphabetically
      const sortedInstansi = (instansi || []).sort((a, b) => a.nama.localeCompare(b.nama));
      const sortedJabatan = (jabatan || []).sort((a, b) => a.nama.localeCompare(b.nama));
      const sortedProdi = (pendidikan || []).sort((a, b) => a.nama_pend.localeCompare(b.nama_pend));

      setInstansiList(sortedInstansi);
      setJabatanList(sortedJabatan);
      setProdiList(sortedProdi);
    } catch (error) {
      console.error('Error loading filter metadata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const resetFilters = () => {
    setFilters({});
    setSearchProdi('');
    setSearchJabatan('');
    setSearchInstansi('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-white border-none text-gray-900 p-0 overflow-hidden sm:rounded-3xl shadow-2xl">
        <div className="p-8 space-y-8">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold tracking-tight">Filter Data</DialogTitle>
              <p className="text-xs text-gray-400 font-medium">Sesuaikan hasil pencarian Anda</p>
            </div>
            <Button 
              variant="ghost" 
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
            >
              <X className="h-4 w-4 text-gray-400" />
            </Button>
          </DialogHeader>

          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* Jenjang Pendidikan */}
            <div className="space-y-2.5">
              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Jenjang Pendidikan</Label>
              <Select 
                value={filters.pendidikan_kode?.substring(0, 2)} 
                onValueChange={(val) => {
                  setFilters(prev => ({ ...prev, pendidikan_kode: val }));
                  setSearchProdi(''); // Reset search when jenjang changes
                  if (val !== 'all') {
                    setIsFilteringProdi(true);
                    setTimeout(() => setIsFilteringProdi(false), 600);
                  }
                }}
              >
                <SelectTrigger className="bg-gray-50 border-gray-100 text-gray-700 h-12 rounded-xl focus:ring-2 focus:ring-blue-100 transition-all border">
                  <SelectValue placeholder="Semua Jenjang" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-100 rounded-xl shadow-xl">
                  <SelectItem value="all">Semua Jenjang</SelectItem>
                  {JENJANG_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value} className="text-sm py-2.5">{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Program Studi */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Program Studi</Label>
                <div className="flex-1 max-w-[150px] relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input 
                    placeholder="Cari prodi..." 
                    className="h-7 pl-8 text-[10px] rounded-lg border-gray-100 bg-gray-50/50"
                    value={searchProdi}
                    onChange={(e) => setSearchProdi(e.target.value)}
                  />
                </div>
              </div>
              <Select 
                disabled={loading || !filters.pendidikan_kode || filters.pendidikan_kode === 'all' || isFilteringProdi}
                value={filters.pendidikan_kode} 
                onValueChange={(val) => setFilters(prev => ({ ...prev, pendidikan_kode: val }))}
              >
                <SelectTrigger className="bg-gray-50 border-gray-100 text-gray-700 h-12 rounded-xl focus:ring-2 focus:ring-blue-100 transition-all border disabled:opacity-50 disabled:cursor-not-allowed">
                  <SelectValue placeholder={
                    loading ? "Memuat..." : 
                    isFilteringProdi ? "Menyiapkan list..." :
                    (!filters.pendidikan_kode || filters.pendidikan_kode === 'all') ? "Pilih jenjang terlebih dahulu" : 
                    "Semua Program Studi"
                  } />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-100 rounded-xl shadow-xl max-h-60">
                  {loading ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-xs font-bold text-gray-400">
                      <div className="h-3 w-3 border-2 border-gray-100 border-t-blue-500 rounded-full animate-spin" />
                      Memuat Program Studi...
                    </div>
                  ) : (!filters.pendidikan_kode || filters.pendidikan_kode === 'all') ? (
                    <div className="py-8 px-6 text-center space-y-2">
                       <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Pilih jenjang terlebih dahulu</p>
                    </div>
                  ) : (
                    <>
                      <SelectItem value="all">Semua Program Studi</SelectItem>
                      {prodiList
                        .filter(prodi => {
                          const levelCode = filters.pendidikan_kode!; // e.g., "40" for S1
                          const prodiCode = String(prodi.kode_pend);
                          const prodiName = prodi.nama_pend.toUpperCase();

                          // Robust filtering logic
                          let isMatch = false;

                          if (levelCode === '10') isMatch = prodiCode.startsWith('10') || prodiName.includes('SMA');
                          else if (levelCode === '30') isMatch = prodiCode.startsWith('30') || prodiName.includes('D-III');
                          else if (levelCode === '35') isMatch = prodiCode.startsWith('35') || prodiName.includes('D-IV');
                          else if (levelCode === '40') isMatch = prodiCode.startsWith('51') || prodiCode.startsWith('52') || prodiCode.startsWith('50') || prodiName.includes('S-1') || prodiName.includes('SARJANA');
                          else if (levelCode === '45') isMatch = prodiCode.startsWith('45') || prodiName.includes('S-2');
                          else if (levelCode === '50') isMatch = prodiCode.startsWith('50') || prodiName.includes('S-3');
                          else isMatch = prodiCode.startsWith(levelCode);

                          if (!isMatch) return false;
                          
                          if (searchProdi) {
                            return prodi.nama_pend.toLowerCase().includes(searchProdi.toLowerCase());
                          }
                          
                          return true;
                        })
                        .slice(0, 2000).map(prodi => {
                        const prefix = getDegreePrefix(prodi.kode_pend, prodi.nama_pend);
                        const label = prefix ? `${prefix} ${prodi.nama_pend}` : prodi.nama_pend;
                        return (
                          <SelectItem key={prodi.id || prodi.kode_pend} value={prodi.kode_pend} className="text-sm py-2.5">
                            {label}
                          </SelectItem>
                        );
                      })}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Jabatan */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Jabatan</Label>
                <div className="flex-1 max-w-[150px] relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input 
                    placeholder="Cari jabatan..." 
                    className="h-7 pl-8 text-[10px] rounded-lg border-gray-100 bg-gray-50/50"
                    value={searchJabatan}
                    onChange={(e) => setSearchJabatan(e.target.value)}
                  />
                </div>
              </div>
              <Select 
                disabled={loading}
                value={filters.jabatan_kode} 
                onValueChange={(val) => setFilters(prev => ({ ...prev, jabatan_kode: val }))}
              >
                <SelectTrigger className="bg-gray-50 border-gray-100 text-gray-700 h-12 rounded-xl focus:ring-2 focus:ring-blue-100 transition-all border">
                  <SelectValue placeholder={loading ? "Memuat..." : "Semua Jabatan"} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-100 rounded-xl shadow-xl max-h-60">
                  {loading ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-xs font-bold text-gray-400">
                      <div className="h-3 w-3 border-2 border-gray-100 border-t-blue-500 rounded-full animate-spin" />
                      Memuat Jabatan...
                    </div>
                  ) : (
                    <>
                      <SelectItem value="all">Semua Jabatan</SelectItem>
                      {jabatanList
                        .filter(j => !searchJabatan || j.nama.toLowerCase().includes(searchJabatan.toLowerCase()))
                        .slice(0, 500).map(jabs => (
                        <SelectItem key={jabs.kode} value={jabs.kode} className="text-sm py-2.5">{jabs.nama}</SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Instansi */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Instansi</Label>
                <div className="flex-1 max-w-[150px] relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <Input 
                    placeholder="Cari instansi..." 
                    className="h-7 pl-8 text-[10px] rounded-lg border-gray-100 bg-gray-50/50"
                    value={searchInstansi}
                    onChange={(e) => setSearchInstansi(e.target.value)}
                  />
                </div>
              </div>
              <Select 
                disabled={loading}
                value={filters.instansi_kode} 
                onValueChange={(val) => setFilters(prev => ({ ...prev, instansi_kode: val }))}
              >
                <SelectTrigger className="bg-gray-50 border-gray-100 text-gray-700 h-12 rounded-xl focus:ring-2 focus:ring-blue-100 transition-all border">
                  <SelectValue placeholder={loading ? "Memuat..." : "Semua Instansi"} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-100 rounded-xl shadow-xl max-h-60">
                  {loading ? (
                    <div className="flex items-center justify-center py-6 gap-2 text-xs font-bold text-gray-400">
                      <div className="h-3 w-3 border-2 border-gray-100 border-t-blue-500 rounded-full animate-spin" />
                      Memuat Instansi...
                    </div>
                  ) : (
                    <>
                      <SelectItem value="all">Semua Instansi</SelectItem>
                      {instansiList
                        .filter(i => !searchInstansi || i.nama.toLowerCase().includes(searchInstansi.toLowerCase()))
                        .slice(0, 500).map(ins => (
                        <SelectItem key={ins.kode} value={ins.kode} className="text-sm py-2.5">{ins.nama}</SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
               {/* Sort Field */}
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Urutan</Label>
                <Select 
                  value={filters.sort || 'jumlah_formasi'} 
                  onValueChange={(val: any) => setFilters(prev => ({ ...prev, sort: val }))}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-100 text-gray-700 h-12 rounded-xl focus:ring-2 focus:ring-blue-100 transition-all border">
                    <SelectValue placeholder="Formasi" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-100 rounded-xl shadow-xl">
                    <SelectItem value="jumlah_formasi" className="text-sm">Jml Formasi</SelectItem>
                    <SelectItem value="jumlah_pelamar" className="text-sm">Jml Pelamar</SelectItem>
                    <SelectItem value="gaji_min" className="text-sm">Gaji Min</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] ml-1">Arah</Label>
                <Select 
                  value={filters.order || 'desc'} 
                  onValueChange={(val: any) => setFilters(prev => ({ ...prev, order: val }))}
                >
                  <SelectTrigger className="bg-gray-50 border-gray-100 text-gray-700 h-12 rounded-xl focus:ring-2 focus:ring-blue-100 transition-all border">
                    <SelectValue placeholder="Desc" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-100 rounded-xl shadow-xl">
                    <SelectItem value="desc" className="text-sm">High-Low</SelectItem>
                    <SelectItem value="asc" className="text-sm">Low-High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-row gap-3 pt-6 border-t border-gray-50">
            <Button 
              onClick={resetFilters}
              variant="ghost" 
              className="flex-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 h-12 rounded-2xl font-bold transition-all"
            >
              Reset
            </Button>
            <Button 
              onClick={handleApply}
              className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all"
            >
              Terapkan
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
