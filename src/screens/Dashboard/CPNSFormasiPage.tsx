import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, BarChart3, LayoutGrid, ChevronDown, X, Lock, KeyRound, Send, ExternalLink, MapPin } from 'lucide-react';
import { sscasnService, FilterOptions } from '@/services/sscasnService';
import { SSCASNFormation } from '@/types/sscasn';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { checkUserFormasiAccess, useFormasiCode } from '@/services/formasiAccessCodeService';

const PROVINSI_LIST = [
  'ACEH', 'BALI', 'BANTEN', 'BENGKULU', 'DI YOGYAKARTA', 'DKI JAKARTA', 
  'GORONTALO', 'JAMBI', 'JAWA BARAT', 'JAWA TENGAH', 'JAWA TIMUR', 
  'KALIMANTAN BARAT', 'KALIMANTAN SELATAN', 'KALIMANTAN TENGAH', 
  'KALIMANTAN TIMUR', 'KALIMANTAN UTARA', 'KEPULAUAN BANGKA BELITUNG', 
  'KEPULAUAN RIAU', 'LAMPUNG', 'MALUKU', 'MALUKU UTARA', 
  'NUSA TENGGARA BARAT', 'NUSA TENGGARA TIMUR', 'PAPUA', 'PAPUA BARAT', 
  'PAPUA DAYA', 'PAPUA PEGUNUNGAN', 'PAPUA SELATAN', 'PAPUA TENGAH', 
  'RIAU', 'SULAWESI BARAT', 'SULAWESI SELATAN', 'SULAWESI TENGAH', 
  'SULAWESI TENGGARA', 'SULAWESI UTARA', 'SUMATERA BARAT', 
  'SUMATERA SELATAN', 'SUMATERA UTARA'
];

const PROVINSI_SEARCH_MAP: Record<string, string> = {
  'DI YOGYAKARTA': 'YOGYAKARTA',
  'DKI JAKARTA': 'JAKARTA',
  'NUSA TENGGARA BARAT': 'NUSA TENGGARA BARAT',
  'NUSA TENGGARA TIMUR': 'NUSA TENGGARA TIMUR',
  'KEPULAUAN BANGKA BELITUNG': 'BANGKA BELITUNG',
  'KEPULAUAN RIAU': 'KEPULAUAN RIAU',
};

export function CPNSFormasiPage() {
  const { user } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState('');
  const [accessLoading, setAccessLoading] = useState(false);

  const [formasi, setFormasi] = useState<SSCASNFormation[]>([]);
  const [allSortedFormasi, setAllSortedFormasi] = useState<SSCASNFormation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('formasi');
  const [filters, setFilters] = useState<FilterOptions>({});
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSortMode, setIsSortMode] = useState(false); // true saat sort aktif → client-side paginasi
  
  // Detail Modal State
  const [selectedFormasi, setSelectedFormasi] = useState<SSCASNFormation | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  
  // Filter Metadata State
  const [instansiList, setInstansiList] = useState<any[]>([]);
  const [jabatanList, setJabatanList] = useState<any[]>([]);
  const [prodiList, setProdiList] = useState<any[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(false);
  const [searchProdi, setSearchProdi] = useState('');
  const [searchWilayah, setSearchWilayah] = useState('');
  const [isProdiOpen, setIsProdiOpen] = useState(false);
  const [isInstansiOpen, setIsInstansiOpen] = useState(false);
  const [isJabatanOpen, setIsJabatanOpen] = useState(false);
  const [isWilayahOpen, setIsWilayahOpen] = useState(false);
  const [searchInstansi, setSearchInstansi] = useState('');
  const [searchJabatan, setSearchJabatan] = useState('');
  const prodiComboRef = useRef<HTMLDivElement>(null);
  const instansiComboRef = useRef<HTMLDivElement>(null);
  const jabatanComboRef = useRef<HTMLDivElement>(null);
  const wilayahComboRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Tutup semua combobox kalau klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (prodiComboRef.current && !prodiComboRef.current.contains(e.target as Node)) setIsProdiOpen(false);
      if (instansiComboRef.current && !instansiComboRef.current.contains(e.target as Node)) setIsInstansiOpen(false);
      if (jabatanComboRef.current && !jabatanComboRef.current.contains(e.target as Node)) setIsJabatanOpen(false);
      if (wilayahComboRef.current && !wilayahComboRef.current.contains(e.target as Node)) setIsWilayahOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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


  // Initial Load Metadata only once
  useEffect(() => {
    loadMetadata();
  }, []);

  // Handle Search & Filter Changes - Only reset page, don't auto-load
  useEffect(() => {
    setCurrentPage(1);
    // Removed automatic loadFormasi() call to honor user request for manual trigger
  }, [filters, debouncedSearchTerm]);

  // Handle Pagination
  useEffect(() => {
    if (!hasSearched) return;
    if (isSortMode && allSortedFormasi.length > 0) {
      // Sort mode: slice dari data yang sudah ada di memori
      const start = (currentPage - 1) * 10;
      setFormasi(allSortedFormasi.slice(start, start + 10));
    } else if (!isSortMode) {
      // Normal mode: fetch API
      loadFormasi();
    }
  }, [currentPage]);

  // Handle search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 800);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadMetadata = async () => {
    if (metadataLoading) return; // Hindari double fetch
    setMetadataLoading(true);
    try {
      const [instansi, jabatan, pendidikan] = await Promise.all([
        sscasnService.getInstansi(),
        sscasnService.getJabatan(),
        sscasnService.getPendidikan(),
      ]);
      
      setInstansiList((instansi || []).sort((a, b) => a.nama.localeCompare(b.nama)));
      setJabatanList((jabatan || []).sort((a, b) => a.nama.localeCompare(b.nama)));
      setProdiList((pendidikan || []).sort((a, b) => a.nama_pend.localeCompare(b.nama_pend)));
    } catch (error) {
      console.error('Error loading filter metadata:', error);
    } finally {
      setMetadataLoading(false);
    }
  };

  const PAGE_SIZE = 10;

  const sortData = (data: SSCASNFormation[], s: string | undefined): SSCASNFormation[] => {
    if (!s || s === 'none') return data;
    const d = [...data];
    if (s === 'terketat')       d.sort((a, b) => ((b.jumlah_ms||0)/(b.jumlah_formasi||1)) - ((a.jumlah_ms||0)/(a.jumlah_formasi||1)));
    else if (s === 'tidak_ketat')    d.sort((a, b) => ((a.jumlah_ms||0)/(a.jumlah_formasi||1)) - ((b.jumlah_ms||0)/(b.jumlah_formasi||1)));
    else if (s === 'pelamar_sedikit') d.sort((a, b) => (a.jumlah_ms||0) - (b.jumlah_ms||0));
    else if (s === 'jumlah_formasi')  d.sort((a, b) => (b.jumlah_formasi||0) - (a.jumlah_formasi||0));
    else if (s === 'jumlah_pelamar')  d.sort((a, b) => (b.jumlah_ms||0) - (a.jumlah_ms||0));
    else if (s === 'gaji_max')        d.sort((a, b) => (b.gaji_max||0) - (a.gaji_max||0));
    return d;
  };

  const loadFormasi = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);
    try {
      const pendidikan_kode = filters.pendidikan_kode && filters.pendidikan_kode !== 'all' 
        ? filters.pendidikan_kode 
        : (filters.level && filters.level !== 'all' ? filters.level : undefined);
      
      const { level, pendidikan_kode: _pc, sort: rawSort, wilayah, ...cleanFilters } = filters;
      const s = rawSort as string | undefined;
      const isSorting = !!(s && s !== 'none');
      setIsSortMode(isSorting);

      const wilayahSearch = wilayah ? (PROVINSI_SEARCH_MAP[wilayah] || wilayah) : '';
      const combinedSearch = wilayahSearch 
        ? (debouncedSearchTerm ? `${debouncedSearchTerm} ${wilayahSearch}` : wilayahSearch)
        : debouncedSearchTerm;

      if (isSorting) {
        // ── SORT MODE ──────────────────────────────────────────────────────────
        // Fetch 100 item dari API (max per page). Gunakan proxy sort API kalau ada.
        // API proxy: untuk ratio sort → pakai jumlah_pelamar asc (pendekatan terbaik)
        // Ini memastikan dataset yang kita sort sudah pre-filtered oleh API.
        const apiProxySort = 
          (s === 'tidak_ketat' || s === 'pelamar_sedikit') ? 'jumlah_pelamar' :
          (s === 'terketat')     ? 'jumlah_pelamar' :
          (s === 'jumlah_formasi') ? 'jumlah_formasi' :
          (s === 'gaji_max')     ? 'gaji_max' : undefined;
        const apiProxyOrder = 
          (s === 'tidak_ketat' || s === 'pelamar_sedikit') ? 'asc' :
          (s === 'terketat')   ? 'desc' : 'desc';

        const result = await sscasnService.getFormasi(1, 100, combinedSearch, {
          ...cleanFilters,
          pendidikan_kode,
          ...(apiProxySort ? { sort: apiProxySort as any, order: apiProxyOrder } : {}),
        });
        if (controller.signal.aborted) return;

        if (result?.data) {
          const sorted = sortData(result.data, s);
          setAllSortedFormasi(sorted);
          // Pagination internal dari 100 data
          const totalSortedPages = Math.ceil(sorted.length / PAGE_SIZE);
          setTotalPages(totalSortedPages);
          setFormasi(sorted.slice(0, PAGE_SIZE)); // Halaman 1
          setCurrentPage(1);
        } else {
          setAllSortedFormasi([]);
          setFormasi([]);
        }
      } else {
        // ── NORMAL PAGINATION MODE ─────────────────────────────────────────────
        const result = await sscasnService.getFormasi(currentPage, PAGE_SIZE, combinedSearch, {
          ...cleanFilters,
          pendidikan_kode,
        });
        if (controller.signal.aborted) return;

        if (result?.data) {
          setFormasi(result.data);
          setTotalPages(result.pagination.total_pages);
          setAllSortedFormasi([]);
        } else {
          setFormasi([]);
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('Error loading CPNS formasi:', error);
      setError('Gagal memuat data dari SSCASN. Silakan coba lagi nanti.');
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const handleApplyFilters = () => {
    setIsFilterModalOpen(false);
    handleSearch();
  };

  const handleSearch = () => {
    setHasSearched(true);
    setCurrentPage(1);
    loadFormasi();
  };

  const resetFilters = () => {
    setFilters({});
    setSearchTerm('');
    setSearchProdi('');
    setCurrentPage(1);
  };

  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);
  const formatCurrency = (amount: number) => (amount / 1000000).toFixed(1);

  const formatPlacement = (lokasi: string, instansi: string) => {
    if (!lokasi) return '-';
    let clean = lokasi.trim();
    
    // Pattern 1: | Agency Name (Usually Pusat/National)
    if (clean.startsWith('|')) {
      const part = clean.replace(/^\|\s*/, '').trim();
      if (part.toUpperCase() === instansi.toUpperCase()) return 'PUSAT / SELURUH INDONESIA';
      return part;
    }

    // Pattern 2: Agency Name | Specific Location
    if (clean.includes('|')) {
      const parts = clean.split('|').map(p => p.trim());
      // Ambil bagian yang bukan nama instansi
      const specific = parts.find(p => 
        p.toUpperCase() !== instansi.toUpperCase() && 
        !instansi.toUpperCase().includes(p.toUpperCase()) &&
        p !== ''
      );
      if (specific) return specific;
      return parts[parts.length - 1];
    }
    
    // Pattern 3: KANWIL / KANTOR REGIONAL
    if (clean.toUpperCase().includes('KANTOR WILAYAH') || clean.toUpperCase().includes('KANWIL')) {
      // Seringkali sudah cukup spesifik
      return clean;
    }

    // Jika sama dengan instansi, tandai sebagai pusat
    if (clean.toUpperCase() === instansi.toUpperCase()) {
      return 'PUSAT / UNIT UTAMA';
    }

    return clean;
  };

  const getRatioInfo = (ms: number, quota: number) => {
    if (quota === 0) return { ratio: 0, color: 'bg-gray-100 text-gray-600' };
    const ratio = ms / quota;
    let color = 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (ratio > 50) color = 'bg-rose-50 text-rose-700 border-rose-100';
    else if (ratio > 20) color = 'bg-amber-50 text-amber-700 border-amber-100';
    else if (ratio > 10) color = 'bg-blue-50 text-blue-700 border-blue-100';
    
    return { ratio: Math.ceil(ratio), color };
  };

  useEffect(() => {
    const initAccess = async () => {
      if (user) {
        const hasAccess = await checkUserFormasiAccess(user.uid);
        setIsUnlocked(hasAccess);
      } else {
        setIsUnlocked(false);
      }
    };
    initAccess();
  }, [user]);

  const handleUnlock = async () => {
    if (!user || !accessCode.trim()) return;
    
    setAccessLoading(true);
    setAccessError('');
    try {
      await useFormasiCode(accessCode.trim(), user.uid);
      setIsUnlocked(true);
    } catch (err: any) {
      setAccessError(err.message || 'Gagal memverifikasi kode akses');
    } finally {
      setAccessLoading(false);
    }
  };

  const handleRowClick = async (formasiId: string) => {
    setIsDetailLoading(true);
    try {
      // Set to basic data first to open modal immediately
      const basicData = formasi.find(f => f.formasi_id === formasiId) || allSortedFormasi.find(f => f.formasi_id === formasiId);
      if (basicData) setSelectedFormasi(basicData);
      
      const detail = await sscasnService.getFormasiById(formasiId);
      if (detail) {
        setSelectedFormasi(detail);
      }
    } catch (err) {
      console.error('Error fetching formasi details:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  if (isUnlocked === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Checking Authorization...</p>
      </div>
    );
  }

  if (isUnlocked === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
        <div className="w-full max-w-md bg-white border border-gray-100 shadow-sm p-8 space-y-8 text-center rounded-2xl">
          <div className="w-16 h-16 bg-blue-50 flex items-center justify-center mx-auto rounded-full ring-4 ring-blue-50/50">
            <Lock className="w-8 h-8 text-blue-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Formasi Terkunci</h2>
            <p className="text-sm text-gray-500 font-medium leading-relaxed">
              Fitur pencarian formasi adalah fitur eksklusif. Masukkan kode akses Anda untuk membuka kunci selama 1 minggu.
            </p>
          </div>
          
          <div className="space-y-4 pt-4">
            <div className="space-y-2 text-left">
              <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Kode Akses</Label>
              <Input 
                value={accessCode}
                onChange={(e) => { setAccessCode(e.target.value.toUpperCase()); setAccessError(''); }}
                placeholder="Masukkan 6 digit kode"
                className="h-14 bg-gray-50 border-gray-100 rounded-xl text-center text-lg font-black tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-normal placeholder:text-gray-400 focus:bg-white"
                maxLength={6}
              />
              {accessError && (
                <p className="text-rose-500 text-xs font-bold text-center mt-2 animate-pulse">{accessError}</p>
              )}
            </div>
            
            <Button 
              onClick={handleUnlock}
              disabled={accessLoading || accessCode.length < 3}
              className="w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100 transition-all active:scale-[0.98]"
            >
              {accessLoading ? (
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   Verifikasi...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                   <KeyRound className="w-4 h-4" />
                   Buka Akses
                </div>
              )}
            </Button>

            <div className="pt-2">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-100"></span>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-gray-300">
                  <span className="bg-white px-2">Belum punya kode?</span>
                </div>
              </div>
              
              <a 
                href="https://t.me/KelasASN" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-3 w-full h-12 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all group border border-blue-100/50 shadow-sm shadow-blue-50/50"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Send className="w-4 h-4 text-white ml-[-1px]" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest leading-none">Dapatkan di Telegram</p>
                  <p className="text-[9px] font-bold text-blue-400 mt-1 flex items-center gap-1">
                    Grup Diskusi @KelasASN <ExternalLink className="w-2.5 h-2.5" />
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight text-gray-900">Formasi CPNS 2024</h1>
          <p className="text-sm text-gray-400 font-medium">Monitoring data SSCASN secara transparan & real-time</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
          <button 
            onClick={() => setActiveTab('formasi')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all",
              activeTab === 'formasi' ? "bg-white text-blue-600 shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            LIST FORMASI
          </button>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-gray-300 cursor-not-allowed">
            <BarChart3 className="h-4 w-4" />
            COMING SOON
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {/* Rigid Search Bar & Filter Trigger */}
        <div className="flex flex-col md:flex-row gap-0">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="CARI JABATAN, INSTANSI, ATAU UNIT KERJA..." 
              className="pl-12 h-12 bg-white border border-gray-200 rounded-none text-gray-900 font-mono text-xs focus:ring-1 focus:ring-blue-500 uppercase placeholder:text-gray-300 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <Button 
            variant="outline"
            onClick={() => setIsFilterModalOpen(true)}
            className="h-12 px-6 rounded-none border border-l-0 border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-900 flex items-center gap-3 transition-all font-mono text-[10px] font-bold uppercase tracking-widest"
          >
            <Filter className="h-3 w-3 text-blue-600" />
            FILTER
          </Button>
      {/* Boxy Right Sidebar Filter */}
      {isFilterModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-end"
          onClick={() => setIsFilterModalOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300" />
          <div 
            className={cn(
              "relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-out font-mono animate-in slide-in-from-right",
              isFilterModalOpen ? "translate-x-0" : "translate-x-full"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-blue-600" />
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-900">FILTER KRITERIA</h2>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsFilterModalOpen(false)}
                className="rounded-none hover:bg-white h-8 w-8"
              >
                <LayoutGrid className="h-4 w-4 text-gray-400 rotate-45" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Sorting */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Urutan Data</Label>
                <Select 
                  value={filters.sort || 'none'} 
                  onValueChange={(val) => setFilters(prev => ({ ...prev, sort: val === 'none' ? undefined : val as any }))}
                >
                  <SelectTrigger className="bg-white border border-gray-200 text-gray-700 h-11 rounded-none focus:ring-1 focus:ring-blue-500 font-bold text-[10px] uppercase">
                    <SelectValue placeholder="SORT BY..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-gray-200">
                    <SelectItem value="none" className="text-[10px] uppercase">Default</SelectItem>
                    <SelectItem value="terketat" className="text-[10px] uppercase text-rose-600 font-black">🔴 Persaingan Terketat</SelectItem>
                    <SelectItem value="tidak_ketat" className="text-[10px] uppercase text-emerald-600 font-black">🟢 Persaingan Tidak Ketat</SelectItem>
                    <SelectItem value="pelamar_sedikit" className="text-[10px] uppercase text-blue-600 font-black">🙋 Pelamar Tersedikit</SelectItem>
                    <SelectItem value="jumlah_formasi" className="text-[10px] uppercase">📋 Kuota Terbanyak</SelectItem>
                    <SelectItem value="jumlah_pelamar" className="text-[10px] uppercase">👥 Pelamar Terbanyak</SelectItem>
                    <SelectItem value="gaji_max" className="text-[10px] uppercase">💰 Gaji Tertinggi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Jenjang */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Jenjang Pendidikan</Label>
                <Select 
                  value={filters.level || 'all'} 
                  onValueChange={(val) => {
                    setFilters(prev => ({ ...prev, level: val === 'all' ? undefined : val, pendidikan_kode: undefined }));
                    setSearchProdi('');
                  }}
                >
                  <SelectTrigger className="bg-white border border-gray-200 text-gray-700 h-11 rounded-none focus:ring-1 focus:ring-blue-50 font-bold text-[10px] uppercase">
                    <SelectValue placeholder="SEMUA JENJANG" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-gray-200">
                    <SelectItem value="all" className="text-[10px] uppercase">SEMUA JENJANG</SelectItem>
                    {JENJANG_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-[10px] uppercase">{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prodi — Searchable Combobox */}
              <div className="space-y-3">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Program Studi</Label>
                {metadataLoading ? (
                  <div className="flex items-center gap-3 h-11 border border-gray-200 bg-gray-50 px-3">
                    <div className="h-3.5 w-3.5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin flex-shrink-0" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Memuat data prodi...</span>
                  </div>
                ) : prodiList.length === 0 ? (
                  <button
                    onClick={loadMetadata}
                    className="w-full h-11 border border-dashed border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  >
                    ↻ Retry muat data filter
                  </button>
                ) : (
                  <div ref={prodiComboRef} className="relative">
                    {/* Trigger button */}
                    <button
                      type="button"
                      disabled={!filters.level || filters.level === 'all'}
                      onClick={() => { setIsProdiOpen(v => !v); setSearchProdi(''); }}
                      className={cn(
                        "w-full h-11 flex items-center justify-between px-3 border border-gray-200 bg-white text-[10px] font-bold uppercase tracking-wide transition-colors",
                        (!filters.level || filters.level === 'all') ? "opacity-40 cursor-not-allowed text-gray-300" : "text-gray-700 hover:bg-gray-50 cursor-pointer"
                      )}
                    >
                      <span className="truncate">
                        {(() => {
                          if (!filters.level || filters.level === 'all') return 'PILIH JENJANG DULU';
                          if (!filters.pendidikan_kode) return 'PILIH PRODI';
                          const found = prodiList.find(p => p.kode_pend === filters.pendidikan_kode);
                          return found ? found.nama_pend : 'PILIH PRODI';
                        })()}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {filters.pendidikan_kode && (
                          <X
                            className="h-3 w-3 text-gray-400 hover:text-gray-700"
                            onClick={(e) => { e.stopPropagation(); setFilters(prev => ({ ...prev, pendidikan_kode: undefined })); setIsProdiOpen(false); }}
                          />
                        )}
                        <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform", isProdiOpen && "rotate-180")} />
                      </div>
                    </button>

                    {/* Dropdown popup */}
                    {isProdiOpen && (
                      <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 border-t-0 shadow-lg">
                        {/* Search input di dalam dropdown */}
                        <div className="relative border-b border-gray-100">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                          <input
                            autoFocus
                            placeholder="Cari nama prodi..."
                            value={searchProdi}
                            onChange={e => setSearchProdi(e.target.value)}
                            className="w-full pl-9 pr-3 h-10 text-[10px] font-bold uppercase bg-gray-50 outline-none placeholder:text-gray-300"
                          />
                        </div>
                        {/* List */}
                        <div className="max-h-56 overflow-y-auto">
                          <button
                            type="button"
                            className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase text-gray-400 hover:bg-gray-50"
                            onClick={() => { setFilters(prev => ({ ...prev, pendidikan_kode: undefined })); setIsProdiOpen(false); }}
                          >
                            Semua Prodi
                          </button>
                          {prodiList
                            .filter(prodi => {
                              const levelCode = filters.level;
                              const prodiTk = String(prodi.tk_pend || '');
                              
                              // Normalisasi prodi Name dan Query untuk pencarian yang lebih tahan banting
                              // S-1 -> S1, D-III -> D3, D-IV -> D4, tanda baca dihapus
                              const normalizeStr = (s: string) => {
                                let norm = s.toUpperCase();
                                // Synonyms / Common Typos normalization
                                norm = norm.replace(/AKUTANSI/g, 'AKUNTANSI');
                                norm = norm.replace(/AKUNTASI/g, 'AKUNTANSI');
                                
                                norm = norm.replace(/S-1/g, 'S1');
                                norm = norm.replace(/S-2/g, 'S2');
                                norm = norm.replace(/S-3/g, 'S3');
                                norm = norm.replace(/D-I\b/g, 'D1');
                                norm = norm.replace(/D-II\b/g, 'D2');
                                norm = norm.replace(/D-III\b/g, 'D3');
                                norm = norm.replace(/D-IV\b/g, 'D4');
                                norm = norm.replace(/D-V\b/g, 'D5');
                                norm = norm.replace(/[^A-Z0-9]/g, ' '); // Ganti tanda baca dengan spasi
                                norm = norm.replace(/\s+/g, ' ').trim(); // Hapus spasi berlebih
                                return norm;
                              };
                              
                              const prodiNameNorm = normalizeStr(prodi.nama_pend || '');
                              const qNorm = normalizeStr(searchProdi);

                              let isLevelMatch = false;
                              if (!levelCode || levelCode === 'all') {
                                isLevelMatch = true;
                              } else {
                                if (levelCode === '10') {
                                  isLevelMatch = ['10', '15', '17', '18'].includes(prodiTk);
                                } else if (levelCode === '30') {
                                  isLevelMatch = ['30', '31'].includes(prodiTk);
                                } else if (levelCode === '40') {
                                  isLevelMatch = ['40', '35', '36', '37', '38', '39'].includes(prodiTk);
                                } else if (levelCode === '35') {
                                  isLevelMatch = ['35', '40'].includes(prodiTk);
                                } else if (levelCode === '45') {
                                  isLevelMatch = ['45', '80'].includes(prodiTk);
                                } else if (levelCode === '50') {
                                  isLevelMatch = prodiTk === '50';
                                } else {
                                  isLevelMatch = prodiTk === levelCode;
                                }
                              }

                              if (!isLevelMatch) return false;
                              if (!qNorm) return true;
                              
                              // Split query into words and check if all words exist in the prodi name
                              const searchTerms = qNorm.split(' ').filter(t => t.trim() !== '');
                              return searchTerms.every(term => prodiNameNorm.includes(term));
                            })
                            .slice(0, 500)
                            .map(prodi => (
                              <button
                                key={prodi.kode_pend}
                                type="button"
                                className={cn(
                                  "w-full text-left px-3 py-2 text-[10px] font-bold uppercase hover:bg-blue-50 hover:text-blue-700 transition-colors",
                                  filters.pendidikan_kode === prodi.kode_pend ? "bg-blue-50 text-blue-700" : "text-gray-700"
                                )}
                                onClick={() => {
                                  setFilters(prev => ({ ...prev, pendidikan_kode: prodi.kode_pend }));
                                  setIsProdiOpen(false);
                                  setSearchProdi('');
                                }}
                              >
                                {prodi.nama_pend}
                              </button>
                            ))
                          }
                          {prodiList.filter(prodi => {
                            const levelCode = filters.level;
                            const prodiTk = String(prodi.tk_pend || '');
                            const prodiName = (prodi.nama_pend || '').toUpperCase();
                            const q = searchProdi.toUpperCase();
                            let isLevelMatch = !levelCode || levelCode === 'all';
                            if (levelCode === '10') isLevelMatch = prodiTk === '15';
                            else if (levelCode === '30') isLevelMatch = prodiTk === '30';
                            else if (levelCode === '40') isLevelMatch = prodiTk === '40';
                            else if (levelCode === '45') isLevelMatch = prodiTk === '45';
                            else if (levelCode === '50') isLevelMatch = prodiTk === '50';
                            else if (levelCode && levelCode !== 'all') isLevelMatch = prodiTk === levelCode;
                            return isLevelMatch && (!q || prodiName.includes(q));
                          }).length === 0 && (
                            <p className="px-3 py-4 text-[10px] text-gray-300 font-bold uppercase text-center">Tidak ada hasil</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Wilayah (Provinsi) — Searchable Combobox */}
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Wilayah (Provinsi)</Label>
                <div ref={wilayahComboRef} className="relative">
                  <button
                    type="button"
                    onClick={() => { setIsWilayahOpen(v => !v); setSearchWilayah(''); }}
                    className="w-full h-11 flex items-center justify-between px-3 border border-gray-200 bg-white text-[10px] font-bold uppercase tracking-wide text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        {filters.wilayah || 'SEMUA WILAYAH / NASIONAL'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {filters.wilayah && (
                        <X className="h-3 w-3 text-gray-400 hover:text-gray-700" onClick={e => { e.stopPropagation(); setFilters(prev => ({ ...prev, wilayah: undefined })); }} />
                      )}
                      <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform", isWilayahOpen && "rotate-180")} />
                    </div>
                  </button>
                  {isWilayahOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 border-t-0 shadow-lg">
                      <div className="relative border-b border-gray-100">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input 
                          autoFocus 
                          placeholder="Cari provinsi..." 
                          value={searchWilayah}
                          onChange={e => setSearchWilayah(e.target.value)}
                          className="w-full pl-9 pr-3 h-10 text-[10px] font-bold uppercase bg-gray-50 outline-none placeholder:text-gray-300" 
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        <button type="button" className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase text-gray-400 hover:bg-gray-50"
                          onClick={() => { setFilters(prev => ({ ...prev, wilayah: undefined })); setIsWilayahOpen(false); }}>Semua Wilayah</button>
                        {PROVINSI_LIST
                          .filter(p => !searchWilayah || p.toUpperCase().includes(searchWilayah.toUpperCase()))
                          .map(p => (
                            <button key={p} type="button"
                              className={cn("w-full text-left px-3 py-2 text-[10px] font-bold uppercase hover:bg-blue-50 hover:text-blue-700 transition-colors",
                                filters.wilayah === p ? "bg-blue-50 text-blue-700" : "text-gray-700")}
                              onClick={() => { setFilters(prev => ({ ...prev, wilayah: p })); setIsWilayahOpen(false); setSearchWilayah(''); }}>
                              {p}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Salary Range */}
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Range Gaji (Juta)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-gray-300 ml-1">MIN</span>
                    <Input 
                      type="number"
                      placeholder="0"
                      value={filters.min_gaji || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, min_gaji: Number(e.target.value) || undefined }))}
                      className="h-10 bg-white border border-gray-200 rounded-none text-[10px] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-bold text-gray-300 ml-1">MAX</span>
                    <Input 
                      type="number"
                      placeholder="50"
                      value={filters.max_gaji || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, max_gaji: Number(e.target.value) || undefined }))}
                      className="h-10 bg-white border border-gray-200 rounded-none text-[10px] font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Instansi — Searchable Combobox */}
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Instansi</Label>
                <div ref={instansiComboRef} className="relative">
                  <button
                    type="button"
                    onClick={() => { setIsInstansiOpen(v => !v); setSearchInstansi(''); }}
                    className="w-full h-11 flex items-center justify-between px-3 border border-gray-200 bg-white text-[10px] font-bold uppercase tracking-wide text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <span className="truncate">
                      {filters.instansi_kode
                        ? (instansiList.find(i => i.kode === filters.instansi_kode)?.nama ?? 'SEMUA INSTANSI')
                        : 'SEMUA INSTANSI'}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {filters.instansi_kode && (
                        <X className="h-3 w-3 text-gray-400 hover:text-gray-700" onClick={e => { e.stopPropagation(); setFilters(prev => ({ ...prev, instansi_kode: undefined })); }} />
                      )}
                      <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform", isInstansiOpen && "rotate-180")} />
                    </div>
                  </button>
                  {isInstansiOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 border-t-0 shadow-lg">
                      <div className="relative border-b border-gray-100">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input autoFocus placeholder="Cari instansi..." value={searchInstansi}
                          onChange={e => setSearchInstansi(e.target.value)}
                          className="w-full pl-9 pr-3 h-10 text-[10px] font-bold uppercase bg-gray-50 outline-none placeholder:text-gray-300" />
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        <button type="button" className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase text-gray-400 hover:bg-gray-50"
                          onClick={() => { setFilters(prev => ({ ...prev, instansi_kode: undefined })); setIsInstansiOpen(false); }}>Semua Instansi</button>
                        {instansiList
                          .filter(i => !searchInstansi || i.nama.toUpperCase().includes(searchInstansi.toUpperCase()))
                          .slice(0, 200)
                          .map(i => (
                            <button key={i.kode} type="button"
                              className={cn("w-full text-left px-3 py-2 text-[10px] font-bold uppercase hover:bg-blue-50 hover:text-blue-700 transition-colors",
                                filters.instansi_kode === i.kode ? "bg-blue-50 text-blue-700" : "text-gray-700")}
                              onClick={() => { setFilters(prev => ({ ...prev, instansi_kode: i.kode })); setIsInstansiOpen(false); setSearchInstansi(''); }}>
                              {i.nama}
                            </button>
                          ))}
                        {instansiList.filter(i => !searchInstansi || i.nama.toUpperCase().includes(searchInstansi.toUpperCase())).length === 0 && (
                          <p className="px-3 py-4 text-[10px] text-gray-300 font-bold uppercase text-center">Tidak ada hasil</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Jabatan — Searchable Combobox */}
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Jabatan</Label>
                <div ref={jabatanComboRef} className="relative">
                  <button
                    type="button"
                    onClick={() => { setIsJabatanOpen(v => !v); setSearchJabatan(''); }}
                    className="w-full h-11 flex items-center justify-between px-3 border border-gray-200 bg-white text-[10px] font-bold uppercase tracking-wide text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <span className="truncate">
                      {filters.jabatan_kode
                        ? (jabatanList.find(j => j.kode === filters.jabatan_kode)?.nama ?? 'SEMUA JABATAN')
                        : 'SEMUA JABATAN'}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {filters.jabatan_kode && (
                        <X className="h-3 w-3 text-gray-400 hover:text-gray-700" onClick={e => { e.stopPropagation(); setFilters(prev => ({ ...prev, jabatan_kode: undefined })); }} />
                      )}
                      <ChevronDown className={cn("h-3.5 w-3.5 text-gray-400 transition-transform", isJabatanOpen && "rotate-180")} />
                    </div>
                  </button>
                  {isJabatanOpen && (
                    <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 border-t-0 shadow-lg">
                      <div className="relative border-b border-gray-100">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                        <input autoFocus placeholder="Cari jabatan..." value={searchJabatan}
                          onChange={e => setSearchJabatan(e.target.value)}
                          className="w-full pl-9 pr-3 h-10 text-[10px] font-bold uppercase bg-gray-50 outline-none placeholder:text-gray-300" />
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        <button type="button" className="w-full text-left px-3 py-2 text-[10px] font-bold uppercase text-gray-400 hover:bg-gray-50"
                          onClick={() => { setFilters(prev => ({ ...prev, jabatan_kode: undefined })); setIsJabatanOpen(false); }}>Semua Jabatan</button>
                        {jabatanList
                          .filter(j => !searchJabatan || j.nama.toUpperCase().includes(searchJabatan.toUpperCase()))
                          .slice(0, 200)
                          .map(j => (
                            <button key={j.kode} type="button"
                              className={cn("w-full text-left px-3 py-2 text-[10px] font-bold uppercase hover:bg-blue-50 hover:text-blue-700 transition-colors",
                                filters.jabatan_kode === j.kode ? "bg-blue-50 text-blue-700" : "text-gray-700")}
                              onClick={() => { setFilters(prev => ({ ...prev, jabatan_kode: j.kode })); setIsJabatanOpen(false); setSearchJabatan(''); }}>
                              {j.nama}
                            </button>
                          ))}
                        {jabatanList.filter(j => !searchJabatan || j.nama.toUpperCase().includes(searchJabatan.toUpperCase())).length === 0 && (
                          <p className="px-3 py-4 text-[10px] text-gray-300 font-bold uppercase text-center">Tidak ada hasil</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-2">
              <Button 
                variant="outline" 
                onClick={resetFilters}
                className="flex-1 rounded-none h-12 font-black uppercase tracking-widest text-[10px] text-gray-400 hover:text-gray-900 border-gray-200 bg-white"
              >
                RESET
              </Button>
              <Button 
                onClick={handleApplyFilters}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white h-12 rounded-none font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100"
              >
                APPLY & SEARCH
              </Button>
            </div>
          </div>
        </div>
      )}
        </div>

        {/* Right: Data Table/Cards Area */}
        <main className="space-y-6">
          {/* Active Filters Display */}
          {hasSearched && (
            <div className="flex flex-wrap items-center gap-2 min-h-[32px]">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mr-2">Filter Aktif:</span>
              
              {/* Keyword */}
              {searchTerm && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-[9px] font-bold uppercase ring-1 ring-blue-100">
                  <span>Cari: {searchTerm}</span>
                  <X className="h-3 w-3 cursor-pointer hover:text-blue-900" onClick={() => { setSearchTerm(''); setDebouncedSearchTerm(''); handleSearch(); }} />
                </div>
              )}

              {/* Sort Tag */}
              {filters.sort && filters.sort !== 'none' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 text-gray-700 text-[9px] font-bold uppercase ring-1 ring-gray-100">
                  <span>Urutan: {(() => {
                    if (filters.sort === 'terketat') return '🔴 Persaingan Terketat';
                    if (filters.sort === 'tidak_ketat') return '🟢 Persaingan Tidak Ketat';
                    if (filters.sort === 'pelamar_sedikit') return '🙋 Pelamar Tersedikit';
                    if (filters.sort === 'jumlah_formasi') return '📋 Kuota Terbanyak';
                    if (filters.sort === 'jumlah_pelamar') return '👥 Pelamar Terbanyak';
                    if (filters.sort === 'gaji_max') return '💰 Gaji Tertinggi';
                    return filters.sort;
                  })()}</span>
                  <X className="h-3 w-3 cursor-pointer hover:text-gray-900" onClick={() => { setFilters(prev => ({ ...prev, sort: undefined })); handleSearch(); }} />
                </div>
              )}

              {/* Jenjang */}
              {filters.level && filters.level !== 'all' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 text-gray-700 text-[9px] font-bold uppercase ring-1 ring-gray-100">
                  <span>Jenjang: {JENJANG_OPTIONS.find(o => o.value === filters.level)?.label}</span>
                  <X className="h-3 w-3 cursor-pointer hover:text-gray-900" onClick={() => { setFilters(prev => ({ ...prev, level: undefined, pendidikan_kode: undefined })); handleSearch(); }} />
                </div>
              )}

              {/* Prodi */}
              {filters.pendidikan_kode && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 text-gray-700 text-[9px] font-bold uppercase ring-1 ring-gray-100">
                  <span className="max-w-[150px] truncate">Prodi: {prodiList.find(p => p.kode_pend === filters.pendidikan_kode)?.nama_pend}</span>
                  <X className="h-3 w-3 cursor-pointer hover:text-gray-900" onClick={() => { setFilters(prev => ({ ...prev, pendidikan_kode: undefined })); handleSearch(); }} />
                </div>
              )}

              {/* Instansi */}
              {filters.instansi_kode && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 text-gray-700 text-[9px] font-bold uppercase ring-1 ring-gray-100">
                  <span className="max-w-[150px] truncate">Instansi: {instansiList.find(i => i.kode === filters.instansi_kode)?.nama}</span>
                  <X className="h-3 w-3 cursor-pointer hover:text-gray-900" onClick={() => { setFilters(prev => ({ ...prev, instansi_kode: undefined })); handleSearch(); }} />
                </div>
              )}

              {/* Jabatan */}
              {filters.jabatan_kode && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 text-gray-700 text-[9px] font-bold uppercase ring-1 ring-gray-100">
                  <span className="max-w-[150px] truncate">Jabatan: {jabatanList.find(j => j.kode === filters.jabatan_kode)?.nama}</span>
                  <X className="h-3 w-3 cursor-pointer hover:text-gray-900" onClick={() => { setFilters(prev => ({ ...prev, jabatan_kode: undefined })); handleSearch(); }} />
                </div>
              )}

              {/* Salary */}
              {(filters.min_gaji || filters.max_gaji) && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 text-gray-700 text-[9px] font-bold uppercase ring-1 ring-gray-100">
                  <span>Gaji: {filters.min_gaji || 0} - {filters.max_gaji || '∞'} JT</span>
                  <X className="h-3 w-3 cursor-pointer hover:text-gray-900" onClick={() => { setFilters(prev => ({ ...prev, min_gaji: undefined, max_gaji: undefined })); handleSearch(); }} />
                </div>
              )}

              {/* Clear All button */}
              {(searchTerm || filters.level || filters.pendidikan_kode || filters.instansi_kode || filters.jabatan_kode || filters.min_gaji || filters.max_gaji || (filters.sort && filters.sort !== 'none')) && (
                <button 
                  onClick={resetFilters}
                  className="text-[9px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-tighter ml-2 underline underline-offset-4"
                >
                  Clear All
                </button>
              )}
            </div>
          )}

          <div className="min-h-[600px]">
            {!hasSearched ? (
              <div className="bg-white rounded-[2.5rem] border border-gray-100 py-24 text-center shadow-xl shadow-gray-100/10">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="mx-auto w-20 h-20 bg-blue-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-200">
                    <Search className="h-10 w-10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-gray-900 uppercase">Siap Mencari Formasi?</h3>
                    <p className="text-sm text-gray-400 font-medium">Gunakan filter untuk mencari instansi favorit Anda.</p>
                  </div>
                  <Button 
                    onClick={handleSearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-10 h-14 rounded-2xl font-black shadow-xl shadow-blue-200 uppercase tracking-widest text-[10px]"
                  >
                    Mulai Pencarian
                  </Button>
                </div>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-6">
                <div className="relative">
                  <div className="h-16 w-16 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 bg-blue-100 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Memproses Data</p>
                  <p className="text-xs text-gray-400 font-medium mt-1">Mengambil data terbaru dari server BKN...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <div className="h-3 w-3 bg-rose-500 rounded-full animate-ping" />
                </div>
                <p className="text-rose-600 font-black text-lg mb-2">{error}</p>
                <p className="text-gray-400 text-sm mb-8">Terjadi kendala saat menghubungkan ke API.</p>
                <Button onClick={loadFormasi} variant="outline" className="rounded-2xl border-rose-100 text-rose-600 hover:bg-rose-50 px-8 font-black h-12 uppercase text-xs tracking-widest">
                  Retry Connection
                </Button>
              </div>
            ) : formasi.length === 0 ? (
              <div className="text-center py-32 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-100">
                <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Search className="h-6 w-6 text-gray-300" />
                </div>
                <p className="text-gray-900 font-black text-lg mb-2">No results found</p>
                <p className="text-gray-400 text-sm">Coba kata kunci atau filter yang lebih umum.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Banner sort mode */}
                {isSortMode && (
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-100 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />
                    Menampilkan {allSortedFormasi.length} data terurut dari 100 hasil terbaik · Gunakan filter instansi/jenjang untuk mempersempit
                  </div>
                )}
                {/* Rigid Light Boxy Table View */}
                <div className="bg-white border border-gray-200 overflow-x-auto rounded-none shadow-sm">
                  <Table className="border-collapse border border-gray-200 font-mono">
                    <TableHeader className="bg-gray-50/80">
                      <TableRow className="hover:bg-transparent border-gray-200">
                        <TableHead className="w-12 text-center text-[10px] font-bold uppercase text-gray-500 border-r border-gray-200 h-10">No</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-gray-900 border-r border-gray-200 h-10 px-4">Jabatan</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-gray-500 border-r border-gray-200 h-10 px-4">Instansi</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase text-gray-500 border-r border-gray-200 h-10 px-4">Penempatan</TableHead>
                        <TableHead className="text-center text-[10px] font-bold uppercase text-gray-900 border-r border-gray-200 h-10 px-2">Kuota</TableHead>
                        <TableHead className="text-center text-[10px] font-bold uppercase text-blue-600 border-r border-gray-200 h-10 px-2">Pelamar</TableHead>
                        <TableHead className="text-center text-[10px] font-bold uppercase text-gray-900 border-r border-gray-200 h-10 px-2">Ratio</TableHead>
                        <TableHead className="text-right text-[10px] font-bold uppercase text-gray-900 h-10 pr-6">Gaji Max</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formasi.map((item, index) => {
                        const ratioInfo = getRatioInfo(item.jumlah_ms, item.jumlah_formasi);
                        return (
                          <TableRow 
                            key={item.formasi_id} 
                            onClick={() => handleRowClick(item.formasi_id)}
                            className="hover:bg-blue-50/50 cursor-pointer border-gray-200 transition-colors h-11 group"
                          >
                            <TableCell className="text-center text-[10px] text-gray-400 border-r border-gray-200 py-1 font-bold group-hover:text-blue-600 transition-colors">
                              {(currentPage - 1) * 10 + index + 1}
                            </TableCell>
                            <TableCell className="text-[10px] text-gray-900 border-r border-gray-200 py-1 font-black uppercase px-4 truncate max-w-[220px]">
                              {item.jabatan_nm}
                            </TableCell>
                            <TableCell className="text-[10px] text-gray-500 border-r border-gray-200 py-1 uppercase px-4 truncate max-w-[150px]">
                              {item.ins_nm}
                            </TableCell>
                            <TableCell className="text-[10px] text-blue-700 border-r border-gray-200 py-1 font-bold uppercase px-4 truncate max-w-[180px]">
                              {formatPlacement(item.lokasi_nm, item.ins_nm)}
                            </TableCell>
                            <TableCell className="text-center text-[10px] text-gray-900 border-r border-gray-200 py-1 font-black">
                              {item.jumlah_formasi}
                            </TableCell>
                            <TableCell className="text-center text-[10px] text-blue-600 border-r border-gray-200 py-1 font-black">
                              {formatNumber(item.jumlah_ms)}
                            </TableCell>
                            <TableCell className="text-center border-r border-gray-200 py-1">
                               <span className={cn("text-[9px] font-black uppercase px-2 py-0.5", ratioInfo.ratio > 20 ? "text-rose-600" : "text-emerald-600")}>
                                 1:{ratioInfo.ratio}
                               </span>
                            </TableCell>
                            <TableCell className="text-right text-[10px] text-gray-800 py-1 pr-6 font-black">
                               {formatCurrency(item.gaji_max)}JT
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Rigid Light Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-10 font-mono">
                  <div className="flex items-center shadow-sm">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1 || loading}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      className="w-10 h-10 p-0 rounded-none border-gray-200 bg-white text-gray-900 hover:bg-gray-50 disabled:opacity-20"
                    >
                      &lt;
                    </Button>
                    
                    {[...Array(Math.min(3, totalPages))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                           <Button
                             key={pageNum}
                             variant="outline"
                             onClick={() => setCurrentPage(pageNum)}
                             className={cn(
                               "w-10 h-10 p-0 rounded-none border-l-0 border-gray-200 font-black text-xs transition-all",
                               currentPage === pageNum ? "bg-blue-600 text-white border-blue-600 shadow-inner" : "bg-white text-gray-400 hover:bg-gray-50"
                             )}
                           >
                             {pageNum}
                           </Button>
                        );
                    })}

                    {totalPages > 3 && <div className="w-10 h-10 flex items-center justify-center border-l-0 border border-gray-200 bg-white text-gray-300">...</div>}
                    
                    {totalPages > 3 && (
                        <Button
                          variant="outline"
                          onClick={() => setCurrentPage(totalPages)}
                          className={cn(
                            "w-12 h-10 p-0 rounded-none border-l-0 border-gray-200 font-black text-xs",
                            currentPage === totalPages ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-400 hover:bg-gray-50"
                          )}
                        >
                          {totalPages}
                        </Button>
                    )}

                    <Button
                      variant="outline"
                      disabled={currentPage === totalPages || loading}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className="w-10 h-10 p-0 rounded-none border-l-0 border-gray-200 bg-white text-gray-900 hover:bg-gray-50 disabled:opacity-20"
                    >
                      &gt;
                    </Button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">PAGE:</span>
                    <Input 
                      className="w-12 h-10 bg-white border border-gray-200 rounded-none text-center text-xs text-gray-900 p-0 font-black"
                      value={currentPage}
                      readOnly
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Formasi Details Modal */}
      {selectedFormasi && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          onClick={() => setSelectedFormasi(null)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-300" />
          <div 
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 flex justify-between items-start">
              <div className="text-white space-y-1 pr-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black tracking-widest uppercase bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {selectedFormasi.formasi_id}
                  </span>
                  {(selectedFormasi as any).jenis_formasi_nm && (
                    <span className="text-[10px] font-black tracking-widest uppercase bg-amber-500 text-amber-50 px-2 py-0.5 rounded-full">
                      {(selectedFormasi as any).jenis_formasi_nm}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black leading-tight uppercase">
                  {selectedFormasi.jabatan_nm}
                </h2>
                <p className="text-blue-100 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 opacity-90 line-clamp-2">
                  {selectedFormasi.ins_nm} <br/> {selectedFormasi.lokasi_nm}
                </p>
              </div>
              <button 
                onClick={() => setSelectedFormasi(null)}
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar bg-gray-50">
              {isDetailLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-8 w-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4" />
                  <p className="text-xs font-bold text-gray-400 tracking-widest uppercase">Mengambil Data Detail...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Kualifikasi Pendidikan */}
                  <div className="md:col-span-2 space-y-2 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kualifikasi Pendidikan</Label>
                    <p className="text-xs font-bold text-gray-900 leading-relaxed uppercase">
                      {selectedFormasi.pendidikan_nm}
                    </p>
                  </div>

                  {/* Statistik Persaingan */}
                  <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Statistik Pelamar</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Kebutuhan</span>
                        <p className="text-2xl font-black text-gray-900">{selectedFormasi.jumlah_formasi}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">Pendaftar Lulus Admin</span>
                        <p className="text-2xl font-black text-blue-600">{formatNumber(selectedFormasi.jumlah_ms)}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Estimasi Rasio</span>
                        <span className={cn(
                          "text-xs font-black px-2 py-0.5 rounded-md uppercase",
                          getRatioInfo(selectedFormasi.jumlah_ms, selectedFormasi.jumlah_formasi).ratio > 20 
                            ? "bg-rose-50 text-rose-600 border border-rose-100" 
                            : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                        )}>
                          1 : {getRatioInfo(selectedFormasi.jumlah_ms, selectedFormasi.jumlah_formasi).ratio}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info Pendapatan & Lainnya */}
                  <div className="space-y-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Info Tambahan</Label>
                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] text-gray-500 font-bold uppercase block mb-0.5">Rentang Penghasilan</span>
                        <p className="text-xs font-black text-emerald-600">
                          Rp {formatNumber(selectedFormasi.gaji_min)} - {formatNumber(selectedFormasi.gaji_max)}
                        </p>
                      </div>
                      {/* Tampilkan data tambahan lain jika ada dari detail API BKN */}
                      {(selectedFormasi as any).disable !== undefined && (
                         <div>
                           <span className="text-[9px] text-gray-500 font-bold uppercase block mb-0.5">Status Disabilitas</span>
                           <p className="text-xs font-black text-gray-900 uppercase">
                             {(selectedFormasi as any).disable === 1 ? 'Menerima Disabilitas' : 'Formasi Umum/Non-Disabilitas'}
                           </p>
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-gray-100 flex justify-end">
              <Button 
                onClick={() => setSelectedFormasi(null)}
                className="bg-gray-900 hover:bg-gray-800 text-white text-[10px] font-bold uppercase tracking-widest h-10 px-6 rounded-xl"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center pt-12 pb-6">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-100 to-transparent w-64 mx-auto mb-6" />
        <p className="text-[10px] text-gray-200 font-black uppercase tracking-[0.5em] px-4 text-center">
          Official SSCASN BKN 2024 Portal Interface
        </p>
      </div>
    </div>
  );
}
