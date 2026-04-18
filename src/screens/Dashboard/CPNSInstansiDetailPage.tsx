import { useEffect, useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search, Building2, MapPin, GraduationCap, Briefcase, 
  TrendingUp, Wallet, Star, AlertTriangle, ShieldCheck, 
  ThumbsUp, ThumbsDown, Info, ArrowLeft, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SSCASNFormation } from '@/types/sscasn';
import { getInstansiReview, InstansiReview } from '@/data/instansi-reviews';
import { useAuth } from '@/contexts/AuthContext';
import { checkUserFormasiAccess } from '@/services/formasiAccessCodeService';
import { LockedFeatureOverlay } from '@/components/LockedFeatureOverlay';
import { getAllPassingGrades, getPassingGradesByInstansiNm } from '@/services/passingGradeService';
import { PassingGrade } from '@/types/passingGrade';

interface AggregatedStats {
  avgGajiMin: number;
  avgGajiMax: number;
  totalFormasi: number;
  totalPelamar: number;
  ratio: number;
  topJabatan: { name: string; count: number }[];
  topPendidikan: { name: string; count: number }[];
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam cache formasi per instansi

export function CPNSInstansiDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Ambil state 'instansi' yang di-pass saat navigasi dari halaman sebelumnya
  const instansi = location.state?.instansi;

  const [formasiList, setFormasiList] = useState<SSCASNFormation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // pgMap: key = "jabatan_nm|pendidikan_nm" → PassingGrade (PG data)
  const [pgMap, setPgMap] = useState<Map<string, PassingGrade>>(new Map());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'ratio_asc' | 'ratio_desc' | 'gaji_desc'>('default' as any);
  
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 25;

  // Modal detail PG
  const [pgDetailModal, setPgDetailModal] = useState<PassingGrade | null>(null);

  // VIP Access States
  const { user, isAdmin } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);

  // Redirect if no instansi data (e.g. direct URL access)
  useEffect(() => {
    if (!instansi) {
      navigate('/dashboard/instansi', { replace: true });
    }
  }, [instansi, navigate]);

  // Review & Rating
  const review: InstansiReview | null = useMemo(() => {
    if (!instansi?.nama) return null;
    return getInstansiReview(instansi.nama, instansi.tier?.cat?.toString() || null);
  }, [instansi?.nama, instansi?.tier?.cat]);

  // ─── Check VIP Access ──────────────────────────────────────────────────────
  useEffect(() => {
    const initAccess = async () => {
      if (isAdmin) {
        setIsUnlocked(true);
        return;
      }
      if (user) {
        const hasAccess = await checkUserFormasiAccess(user.uid);
        setIsUnlocked(hasAccess);
      } else {
        setIsUnlocked(false);
      }
    };
    initAccess();
  }, [user, isAdmin]);

  // Fetch / Cache logic
  useEffect(() => {
    if (!instansi?.kode) return;
    
    let isMounted = true;
    const cacheKey = `instansi_formasi_all_${instansi.kode}`;
    
    const fetchAllFormasi = async () => {
      setLoading(true);
      setError(null);
      try {
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
            if (isMounted) setFormasiList(parsed.data);
            setLoading(false);
            return; 
          }
        }

        const res = await fetch(`/api/sscasn/formasi?instansi_kode=${instansi.kode}&limit=2000&page=1`);
        if (!res.ok) throw new Error('Gagal mengambil data formasi dari server');
        const json = await res.json();
        const data = json.data || [];
        
        if (isMounted) setFormasiList(data);
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));

      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error loading formasi');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAllFormasi();
    
    return () => { isMounted = false; };
  }, [instansi?.kode]);

  // Fetch Passing Grade data — query by instansi_nm (nama) sebagai primary strategy
  // karena format instansi_kode di PDF bisa berbeda dengan kode API BKN
  // CACHE: PG data di-cache localStorage 12 jam untuk hemat Firestore reads
  useEffect(() => {
    if (!instansi?.nama || !formasiList.length) return;
    let cancelled = false;

    const PG_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 jam (data PG jarang berubah)
    const cacheKey = `pg_data_v2_${instansi.kode || instansi.nama.slice(0, 20)}`;

    // Cek cache dulu
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { ts, data } = JSON.parse(cached);
        if (Date.now() - ts < PG_CACHE_TTL && data.length > 0) {
          // Rebuild map dari cache — TANPA Firestore call
          const norm = (s: string) => (s || '').toUpperCase().replace(/\s+/g, ' ').trim();
          const normPend = (s: string) =>
            (s || '').toUpperCase().split(/[,\/]/).map(t => t.replace(/\s+/g, ' ').trim()).filter(Boolean).sort().join('|');
          const map = new Map<string, PassingGrade>();
          const exactMap = new Map<string, PassingGrade[]>();
          const jabMap = new Map<string, PassingGrade[]>();
          const pendMap = new Map<string, PassingGrade[]>();
          (data as PassingGrade[]).forEach((pg) => {
            const key = `${norm(pg.jabatan_nm)}|${norm(pg.pendidikan_nm)}`;
            if (!exactMap.has(key)) exactMap.set(key, []);
            exactMap.get(key)!.push(pg);
            const jk = norm(pg.jabatan_nm);
            if (!jabMap.has(jk)) jabMap.set(jk, []);
            jabMap.get(jk)!.push(pg);
            const pk = `${jk}|${normPend(pg.pendidikan_nm)}`;
            if (!pendMap.has(pk)) pendMap.set(pk, []);
            pendMap.get(pk)!.push(pg);
          });
          (map as any).__exactMap = exactMap;
          (map as any).__jabMap = jabMap;
          (map as any).__pendMap = pendMap;
          (map as any).__normPend = normPend;
          setPgMap(map);
          return; // ← STOP, tidak panggil Firestore sama sekali
        }
      }
    } catch { /* ignore cache error */ }

    const norm = (s: string) => (s || '').toUpperCase().replace(/\s+/g, ' ').trim();

    const tryQueryByNm = async (name: string): Promise<PassingGrade[]> => {
      try {
        const r = await getPassingGradesByInstansiNm(name);
        return r;
      } catch { return []; }
    };

    const load = async () => {
      let pgs: PassingGrade[] = [];

      // 1. Coba by instansi_kode (paling efisien — 1 query saja)
      if (instansi.kode) {
        pgs = await getAllPassingGrades({ instansi_kode: String(instansi.kode) }).catch(() => []);
      }

      // 2. Fallback: by nama instansi — hanya jika kode tidak menghasilkan data
      //    Coba urutan: as-is → UPPERCASE → short name (tanpa "Republik Indonesia")
      //    Masing-masing berhenti segera jika sudah ada hasil (tidak lanjut query berikut)
      if (pgs.length === 0) {
        for (const nameVariant of [
          instansi.nama,
          norm(instansi.nama),
          norm(instansi.nama).replace(/\bREPUBLIK INDONESIA\b/g, '').replace(/\bRI\b/g, '').trim(),
        ]) {
          if (!nameVariant) continue;
          pgs = await tryQueryByNm(nameVariant);
          if (pgs.length > 0) break; // stop segera, tidak perlu coba variasi lain
        }
      }

      if (cancelled) return;

      const map = new Map<string, PassingGrade>();
      const exactMap = new Map<string, PassingGrade[]>();
      const jabMap = new Map<string, PassingGrade[]>();
      // pendMap: key = jabatan + sorted-normalized-pendidikan tokens (order/separator agnostic)
      const pendMap = new Map<string, PassingGrade[]>();

      // Helper: normalise pendidikan string → split by , or /, sort tokens, rejoin
      // Handles: "D-IV AKUNTANSI/ S-1 AKUNTANSI" == "S-1 AKUNTANSI , D-IV AKUNTANSI"
      const normPend = (s: string) =>
        (s || '').toUpperCase()
          .split(/[,\/]/)         // split by , or /
          .map(t => t.replace(/\s+/g, ' ').trim())
          .filter(Boolean)
          .sort()
          .join('|');

      pgs.forEach((pg) => {
        const key = `${norm(pg.jabatan_nm)}|${norm(pg.pendidikan_nm)}`;
        if (!exactMap.has(key)) exactMap.set(key, []);
        exactMap.get(key)!.push(pg);

        const jk = norm(pg.jabatan_nm);
        if (!jabMap.has(jk)) jabMap.set(jk, []);
        jabMap.get(jk)!.push(pg);

        // pendMap key: jabatan + sorted pend tokens (toleran separator & urutan)
        const pk = `${jk}|${normPend(pg.pendidikan_nm)}`;
        if (!pendMap.has(pk)) pendMap.set(pk, []);
        pendMap.get(pk)!.push(pg);
      });

      (map as any).__exactMap = exactMap;
      (map as any).__jabMap = jabMap;
      (map as any).__pendMap = pendMap;
      (map as any).__normPend = normPend;
      setPgMap(map);

      // Simpan ke cache hanya jika ada data (hemat storage kalau memang kosong)
      if (pgs.length > 0) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: pgs }));
        } catch { /* ignore storage full */ }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [instansi?.kode, instansi?.nama, formasiList.length]);

  // Aggregation
  const stats: AggregatedStats | null = useMemo(() => {
    if (!formasiList.length) return null;

    let totGajiMin = 0;
    let totGajiMax = 0;
    let validGajiCount = 0;
    let totFormasi = 0;
    let totPelamar = 0;

    const jabMap = new Map<string, number>();
    const pendMap = new Map<string, number>();

    formasiList.forEach(f => {
      if (f.gaji_min > 0 && f.gaji_max > 0) {
        totGajiMin += Number(f.gaji_min);
        totGajiMax += Number(f.gaji_max);
        validGajiCount++;
      }
      const jml = Number(f.jumlah_formasi) || 0;
      totFormasi += jml;
      totPelamar += Number(f.jumlah_ms) || 0;

      jabMap.set(f.jabatan_nm, (jabMap.get(f.jabatan_nm) || 0) + jml);
      
      const pendArr = f.pendidikan_nm ? f.pendidikan_nm.split('/').map(s => s.trim()) : [];
      pendArr.forEach(p => {
        if (p) pendMap.set(p, (pendMap.get(p) || 0) + jml);
      });
    });

    const topJabatan = Array.from(jabMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const topPendidikan = Array.from(pendMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      avgGajiMin: validGajiCount > 0 ? totGajiMin / validGajiCount : 0,
      avgGajiMax: validGajiCount > 0 ? totGajiMax / validGajiCount : 0,
      totalFormasi: totFormasi,
      totalPelamar: totPelamar,
      ratio: totFormasi > 0 ? totPelamar / totFormasi : 0,
      topJabatan,
      topPendidikan,
    };
  }, [formasiList]);

  // Filtering & Sorting
  const filteredFormasi = useMemo(() => {
    // Filter dulu berdasarkan searchTerm
    let result = searchTerm
      ? formasiList.filter(f => {
          const q = searchTerm.toLowerCase();
          return (
            f.jabatan_nm?.toLowerCase().includes(q) ||
            f.pendidikan_nm?.toLowerCase().includes(q) ||
            f.lokasi_nm?.toLowerCase().includes(q)
          );
        })
      : [...formasiList]; // spread agar tidak mutasi array asli

    // Sort — selalu gunakan copy baru agar tidak mempengaruhi formasiList
    return [...result].sort((a, b) => {
      if (sortBy === 'gaji_desc') return (b.gaji_max || 0) - (a.gaji_max || 0);

      const ratioA = (a.jumlah_formasi || 0) > 0 ? (a.jumlah_ms || 0) / a.jumlah_formasi : Infinity;
      const ratioB = (b.jumlah_formasi || 0) > 0 ? (b.jumlah_ms || 0) / b.jumlah_formasi : Infinity;

      if (sortBy === 'ratio_asc') return ratioA - ratioB;
      if (sortBy === 'ratio_desc') return ratioB - ratioA;

      return 0;
    });
  }, [formasiList, searchTerm, sortBy]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  const totalPages = Math.ceil(filteredFormasi.length / PAGE_SIZE);
  const paginatedFormasi = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredFormasi.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredFormasi, currentPage]);


  const fmtCurr = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
  const fmtNum = (n: number) => new Intl.NumberFormat('id-ID').format(n);
  const ratioColor = (r: number) => r > 50 ? 'text-rose-600 bg-rose-50' : r > 20 ? 'text-amber-600 bg-amber-50' : r > 10 ? 'text-blue-600 bg-blue-50' : 'text-emerald-600 bg-emerald-50';

  if (!instansi) return null;

  if (isUnlocked === null || loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600/10 border-t-blue-600" />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">
        {isUnlocked === null ? 'Pengecekan Akses...' : 'Memuat Data Instansi...'}
      </p>
    </div>
  );

  return (
    <div className="relative min-h-[80vh]">
      {/* Background Content (Blurred if locked) */}
      <div className={cn(
        "transition-all duration-300 ease-out",
        !isUnlocked ? "blur-[16px] opacity-20 grayscale pointer-events-none select-none" : "blur-0 opacity-100 grayscale-0"
      )}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      
      <button 
        onClick={() => navigate('/dashboard/instansi')}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors mb-6 group w-fit"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        Kembali ke Daftar Instansi
      </button>

      {/* --- HEADER --- */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8 group overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-50/50 transition-colors duration-700" />
        <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          {instansi.logo ? (
            <img src={instansi.logo} alt="" className="h-16 w-16 sm:h-24 sm:w-24 object-contain rounded-2xl bg-white p-1 sm:p-2 border border-gray-100 shadow-sm" onError={e => e.currentTarget.style.display='none'} />
          ) : (
            <div className="h-16 w-16 sm:h-24 sm:w-24 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
              <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300" />
            </div>
          )}
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight uppercase mb-2 sm:mb-3">{instansi.nama}</h1>
            <div className="flex flex-wrap gap-2">
              <span className={cn('text-[9px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border', 
                instansi.type === 'pusat' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100')}>
                {instansi.type === 'pusat' ? 'K/L Pusat' : 'Pemda'}
              </span>
              {instansi.tier && instansi.type === 'pusat' && (
                <span className={cn('text-[9px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border', instansi.tier.badgeBg, instansi.tier.badgeText, instansi.tier.badgeBorder)}>
                  Tier {instansi.tier.cat}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {review && (
          <div className="flex flex-col items-start md:items-center bg-slate-50 px-5 sm:px-6 py-4 rounded-2xl border border-slate-100 whitespace-nowrap w-full md:w-auto">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Rating Instansi</p>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 sm:h-6 sm:w-6 fill-amber-400 text-amber-400" />
              <span className="text-2xl sm:text-3xl font-black text-slate-900">{review.rating.toFixed(1)}</span>
              <span className="text-sm font-bold text-slate-400">/ 5.0</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: Review & Info */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {review && (
            <div className={cn(
              "rounded-3xl border p-6 sm:p-7 shadow-sm",
              review.culture === 'green' ? "bg-emerald-50/50 border-emerald-100" : 
              review.culture === 'red' ? "bg-rose-50/50 border-rose-100" : 
              "bg-blue-50/50 border-blue-100"
            )}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  {review.culture === 'green' ? <ShieldCheck className="h-5 w-5 text-emerald-600" /> : 
                   review.culture === 'red' ? <AlertTriangle className="h-5 w-5 text-rose-500" /> : 
                   <Info className="h-5 w-5 text-blue-500" />}
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">Opini & Lingkungan</h3>
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border",
                  review.culture === 'green' ? "bg-emerald-100 text-emerald-700 border-emerald-200" : 
                  review.culture === 'red' ? "bg-rose-100 text-rose-700 border-rose-200" : 
                  "bg-blue-100 text-blue-700 border-blue-200"
                )}>
                  {review.culture === 'green' ? '🟢 Green Flag' : review.culture === 'red' ? '🚩 Red Flag' : '⚪ Neutral'}
                </span>
              </div>
              
              <p className="text-sm text-gray-700 leading-relaxed font-medium mb-6 bg-white/60 p-4 rounded-xl backdrop-blur-sm border border-black/5">{review.summary}</p>
              
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-xl p-4 border border-emerald-50 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-3">
                    <ThumbsUp className="h-4 w-4 text-emerald-500" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Kelebihan (Pros)</span>
                  </div>
                  <ul className="space-y-2">
                    {review.pros.map((pro, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">•</span>
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-xl p-4 border border-rose-50 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-3">
                    <ThumbsDown className="h-4 w-4 text-rose-400" />
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Kekurangan (Cons)</span>
                  </div>
                  <ul className="space-y-2">
                    {review.cons.map((con, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-rose-400 mt-0.5">•</span>
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {stats && (
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-1.5"><GraduationCap className="h-4 w-4"/> Jurusan Paling Dicari</p>
              <div className="space-y-3">
                {stats.topPendidikan.map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                    <span className="text-xs font-bold text-gray-700 truncate mr-3" title={p.name}>{p.name}</span>
                    <span className="text-[10px] font-black bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-full whitespace-nowrap shadow-sm">{fmtNum(p.count)} Kursi</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Stats & Table */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {error ? (
            <div className="bg-red-50 text-red-600 p-8 rounded-3xl text-center text-sm font-bold border border-red-100">
              <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
              {error}
            </div>
          ) : stats && (
            <>
              {/* Top Highlight Stats */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <Wallet className="h-24 w-24" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3 text-slate-400">
                      <Wallet className="h-5 w-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Rata-rata Pendapatan</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-2xl sm:text-3xl font-black text-white">{fmtCurr(stats.avgGajiMin)}</p>
                      <p className="text-xs sm:text-sm font-bold text-slate-400">s.d {fmtCurr(stats.avgGajiMax)} / bulan</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1 text-gray-400">
                        <Briefcase className="h-4 w-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Total Kuota Tersedia</span>
                      </div>
                      <p className="text-2xl font-black text-gray-900">{fmtNum(stats.totalFormasi)} <span className="text-sm text-gray-400 font-bold">Kursi</span></p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <Briefcase className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1 text-gray-400">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Keketatan Instansi</span>
                      </div>
                      <p className={cn("text-2xl font-black", stats.ratio > 20 ? "text-rose-600" : "text-emerald-600")}>
                        {stats.ratio >= 1 ? `${Math.round(stats.ratio)} Pelamar / Kursi` : 'Minim Pesaing'}
                      </p>
                    </div>
                    <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", 
                      stats.ratio > 20 ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500")}>
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Formasi Table */}
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm flex flex-col mt-4">
                <div className="p-5 sm:p-6 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 whitespace-nowrap">Daftar Formasi ({filteredFormasi.length})</h3>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Cari jabatan/pendidikan..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select 
                      className="w-full sm:w-auto py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                    >
                      <option value="default">Sort: Default</option>
                      <option value="ratio_asc">🟢 Paling Santai</option>
                      <option value="ratio_desc">🔴 Paling Ketat</option>
                      <option value="gaji_desc">💰 Gaji Tertinggi</option>
                    </select>
                  </div>
                </div>

                <div className="flex-1 bg-slate-50/50 p-4 sm:p-0">
                  <table className="w-full text-xs block md:table">
                    <thead className="hidden md:table-header-group bg-white sticky top-0 z-10 shadow-sm border-b border-gray-100">
                      <tr className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                        <th className="px-6 py-4 text-left">Jabatan & Penempatan</th>
                        <th className="px-6 py-4 text-left">Pendidikan Syarat</th>
                        <th className="px-6 py-4 text-right">Penghasilan Maksimal</th>
                        <th className="px-6 py-4 text-center">Rasio Keketatan</th>
                        {/* <th className="px-6 py-4 text-center">Target SKD 2024</th> */}
                      </tr>
                    </thead>
                    <tbody className="block md:table-row-group divide-y divide-gray-100 bg-transparent md:bg-white space-y-4 md:space-y-0">
                      {paginatedFormasi.map((f) => {
                        const ratio = (f.jumlah_formasi || 0) > 0 ? (f.jumlah_ms || 0) / f.jumlah_formasi : 0;

                        // ── Cari PG dengan multi-level matching ──
                        const normStr = (s: string) => (s || '').toUpperCase().replace(/\s+/g, ' ').trim();
                        // normPend: split by , atau /, sort token → order & separator agnostic
                        const normPendFn = (pgMap as any).__normPend as ((s: string) => string) | undefined;
                        const normPendLocal = normPendFn ?? ((s: string) =>
                          (s || '').toUpperCase().split(/[,\/]/).map(t => t.replace(/\s+/g, ' ').trim()).filter(Boolean).sort().join('|')
                        );

                        // Normalisasi formasi: API kadang mengembalikan kode angka ("1","2") alih-alih label
                        // Peta ke label standar yang sama dgn parser PDF (Umum, Cumlaude, dll)
                        const normalizeFormasiNm = (raw: string | undefined | null): string => {
                          const s = (raw ?? '').trim();
                          const up = s.toUpperCase();
                          if (!s || /^\d+$/.test(s)) {
                            // Kode angka: 1=Umum (UMUM), 2=Cumlaude (heuristic BKN)
                            if (s === '2') return 'Cumlaude';
                            if (s === '3') return 'Disabilitas';
                            return 'Umum'; // default: 1 atau kosong = Umum
                          }
                          if (up.includes('CUMLAUDE') || up.includes('CUM LAUDE')) return 'Cumlaude';
                          if (up.includes('DISABILITAS') || up.includes('DISABLE')) return 'Disabilitas';
                          if (up.includes('PUTRA') && up.includes('PAPUA')) return 'Putra/i Papua';
                          if (up.includes('PUTRA') && up.includes('KALIMANTAN')) return 'Putra/i Kalimantan';
                          if (up.includes('DIASPORA')) return 'Diaspora';
                          // Jika sudah 'Umum', 'UMUM', 'umum' dll → Umum
                          return 'Umum';
                        };

                        const jabNorm = normStr(f.jabatan_nm);
                        const pendNorm = normStr(f.pendidikan_nm);
                        const pendSorted = normPendLocal(f.pendidikan_nm);
                        const locNorm = normStr(f.lokasi_nm);
                        // Gunakan normalizeFormasiNm agar "1"/"2" dari API dipetakan ke label standar
                        const formasiNorm = normalizeFormasiNm(f.formasi_nm).toUpperCase();

                        // Helper pilih kandidat terbaik (prioritas: lokasi → formasi cocok → UMUM → nilai tertinggi)
                        const pickBest = (candidates: PassingGrade[]): PassingGrade => {
                          // P1: lokasi sama DAN formasi sama
                          const p1 = candidates.find(p => normStr(p.lokasi_nm) === locNorm && normStr(p.formasi_nm).toUpperCase() === formasiNorm.toUpperCase());
                          if (p1) return p1;
                          // P2: lokasi sama saja
                          const p2 = candidates.find(p => normStr(p.lokasi_nm) === locNorm);
                          if (p2) return p2;
                          // P3: formasi UMUM
                          const p3 = candidates.find(p => normStr(p.formasi_nm) === 'UMUM');
                          if (p3) return p3;
                          // P4: nilai akhir tertinggi
                          return [...candidates].sort((a, b) => (b.nilai_akhir || 0) - (a.nilai_akhir || 0))[0];
                        };

                        let pgData: PassingGrade | undefined;

                        // ── Level 1: exact jabatan + exact pendidikan (as-is dari API) ──
                        const exactCandidates = (pgMap as any).__exactMap?.get(`${jabNorm}|${pendNorm}`) as PassingGrade[] | undefined;
                        if (exactCandidates && exactCandidates.length > 0) {
                          pgData = pickBest(exactCandidates);
                        }

                        // ── Level 2: jabatan exact + pendidikan order/separator agnostic ──
                        // Menangani: PDF "D-IV AKUNTANSI/ S-1 AKUNTANSI" == API "S-1 AKUNTANSI , D-IV AKUNTANSI"
                        if (!pgData) {
                          const pendKey = `${jabNorm}|${pendSorted}`;
                          const pendCandidates = (pgMap as any).__pendMap?.get(pendKey) as PassingGrade[] | undefined;
                          if (pendCandidates && pendCandidates.length > 0) {
                            pgData = pickBest(pendCandidates);
                          }
                        }

                        // ── Level 3: jabatan exact + pendidikan fuzzy token match ──
                        // Fallback jika token-sorted masih tidak cocok (misal nama prodi beda singkatan)
                        if (!pgData) {
                          const jabCandidates = (pgMap as any).__jabMap?.get(jabNorm) as PassingGrade[] | undefined;
                          if (jabCandidates) {
                            // Tokenize pendidikan dari API untuk dicocokkan
                            const apiTokens = pendNorm.split(/[,\/\s]+/).filter(t => t.length > 3);
                            const fuzzyCandidates = jabCandidates.filter(pg => {
                              const pgPend = normStr(pg.pendidikan_nm);
                              // a) substring check dua arah
                              if (pendNorm.includes(pgPend) || pgPend.includes(pendNorm)) return true;
                              // b) token intersection: minimal 1 token pend API ada di pend PG
                              const pgTokens = pgPend.split(/[,\/\s]+/).filter(t => t.length > 3);
                              const intersection = apiTokens.filter(t => pgTokens.includes(t));
                              return intersection.length >= Math.min(2, apiTokens.length);
                            });
                            if (fuzzyCandidates.length > 0) {
                              pgData = pickBest(fuzzyCandidates);
                            }
                          }
                        }

                        // ── Level 4: jabatan exact saja (last resort) → hanya jika lokasi atau formasi cocok ──
                        // Jangan tampilkan jika sama sekali tidak ada konteks (bisa salah data)
                        if (!pgData) {
                          const jabCandidates = (pgMap as any).__jabMap?.get(jabNorm) as PassingGrade[] | undefined;
                          if (jabCandidates && jabCandidates.length > 0) {
                            // Hanya tampilkan jika ada lokasi yang sama
                            const locMatch = jabCandidates.find(p => normStr(p.lokasi_nm) === locNorm);
                            if (locMatch) pgData = locMatch;
                          }
                        }

                        return (
                          <tr key={f.formasi_id} className="block md:table-row bg-white md:hover:bg-blue-50/40 transition-colors group p-4 rounded-2xl shadow-sm border border-gray-100 md:p-0 md:rounded-none md:shadow-none md:border-none">
                            <td className="block md:table-cell px-2 py-2 md:px-6 md:py-4 md:max-w-[200px]">
                              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                                <p className="font-bold text-gray-900 leading-tight md:line-clamp-2">{f.jabatan_nm}</p>
                                {(() => {
                                  // Normalisasi formasi API sebelum ditampilkan
                                  const formasiTag = normalizeFormasiNm(f.formasi_nm) || pgData?.formasi_nm || 'Umum';
                                  // Sembunyikan badge jika Umum — jenis default, tidak perlu label khusus
                                  const isUmum = formasiTag.toUpperCase() === 'UMUM';
                                  if (isUmum) return null;
                                  return (
                                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 border rounded uppercase tracking-wider whitespace-nowrap", "bg-indigo-50 text-indigo-600 border-indigo-200")}>
                                      {formasiTag}
                                    </span>
                                  );
                                })()}
                              </div>
                              <p className="text-[10px] text-gray-500 flex items-start gap-1 md:line-clamp-2">
                                <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" /> {f.lokasi_nm}
                              </p>
                            </td>
                            <td className="block md:table-cell px-2 py-2 md:px-6 md:py-4 md:max-w-[180px]">
                              <p className="text-[10px] md:hidden font-black text-gray-400 uppercase tracking-widest mb-1.5 mt-2">Pendidikan</p>
                              <p className="text-[10px] text-gray-700 leading-relaxed font-medium md:line-clamp-3" title={f.pendidikan_nm}>
                                {f.pendidikan_nm ? f.pendidikan_nm.split('/').join(', ') : '-'}
                              </p>
                            </td>
                            <td className="flex justify-between items-center md:table-cell px-2 py-2 md:px-6 md:py-4 md:text-right border-t border-gray-50 md:border-0 mt-3 md:mt-0">
                              <p className="text-[10px] font-bold text-slate-400 md:mb-0.5 md:hidden">Potensi Penghasilan</p>
                              <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-black px-2.5 py-1.5 rounded-lg shadow-sm">
                                {fmtCurr(f.gaji_max)}
                              </span>
                            </td>
                            <td className="flex justify-between items-center md:table-cell px-2 py-2 md:px-6 md:py-4 text-center">
                              <p className="text-[10px] font-bold text-slate-400 md:hidden">Rasio & Kuota</p>
                              <div className="flex flex-row md:flex-col items-center gap-2 md:gap-1">
                                <span className={cn('inline-block text-[11px] font-black px-2.5 py-1.5 rounded-lg border shadow-sm', ratioColor(ratio))}>
                                  {ratio >= 1 ? `${Math.round(ratio)}:1` : '< 1:1'}
                                </span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{f.jumlah_formasi} Kursi</span>
                              </div>
                            </td>

                            {/* ── Kolom Target SKD 2024 (DISEMBUNYIKAN SEMENTARA) ── */}
                            {/* <td className="block md:table-cell px-2 py-2 md:px-4 md:py-3 text-center">
                              {pgData ? (() => {
                                const skd = (pgData.nilai_skd_total ??
                                  ((pgData.nilai_skd_twk ?? 0) + (pgData.nilai_skd_tiu ?? 0) + (pgData.nilai_skd_tkp ?? 0))) || null;
                                return (
                                  <button
                                    onClick={() => setPgDetailModal(pgData)}
                                    className="inline-flex flex-col items-center gap-0.5 bg-amber-50 hover:bg-amber-100 active:scale-95 border border-amber-200 hover:border-amber-400 rounded-xl px-3 py-2 transition-all cursor-pointer shadow-sm"
                                    title="Lihat detail SKD passing grade 2024"
                                  >
                                    <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Target SKD</span>
                                    <span className="text-[17px] font-black text-amber-800 leading-tight">
                                      {skd ?? '—'}
                                    </span>
                                  </button>
                                );
                              })() : (
                                <span className="text-[10px] text-gray-300 font-bold">—</span>
                              )}
                            </td> */}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {totalPages > 1 && (
                    <div className="pt-6 pb-2 px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center sm:text-left">
                        Menampilkan {paginatedFormasi.length} dari total {filteredFormasi.length} formasi
                      </p>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        
                        <div className="h-9 px-4 rounded-xl border border-gray-200 bg-white flex items-center justify-center">
                          <span className="text-[11px] font-black text-gray-700">
                            Hal {currentPage} / {totalPages}
                          </span>
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}
                  {filteredFormasi.length === 0 && (
                    <div className="p-12 text-center text-gray-400 text-sm font-bold bg-white rounded-3xl mx-4 mt-4 border border-gray-100">
                      Tidak ada formasi ditemukan dengan filter tersebut.
                    </div>
                  )}
                  </div> {/* Close overflow-x-auto (line 451) */}
                </div> {/* Close bg-white (line 425) */}
              </>
            )}
          </div> {/* Close lg:col-span-2 (line 360) */}
        </div> {/* Close grid lg:grid-cols-3 (line 281) */}
      </div> {/* Close max-w-7xl (line 232) */}
    </div> {/* Close transition-all (line 228) */}

    {/* Overlay for Locked State */}
    {!isUnlocked && <LockedFeatureOverlay type="detail" />}

    {/* ── Modal Detail PG ── */}
    {pgDetailModal && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={() => setPgDetailModal(null)}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        {/* Panel */}
        <div
          className="relative z-10 bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1">Nilai PG 2024</p>
              <h3 className="text-sm font-black text-gray-900 leading-snug">{pgDetailModal.jabatan_nm}</h3>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">{pgDetailModal.pendidikan_nm}</p>
            </div>
            <button
              onClick={() => setPgDetailModal(null)}
              className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors flex-shrink-0 ml-3"
            >
              ✕
            </button>
          </div>

          {/* SKD Block — satu-satunya yang ditampilkan */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-3">Seleksi Kompetensi Dasar (SKD)</p>

            {/* TWK | TIU | TKP */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {([
                ['TWK', pgDetailModal.nilai_skd_twk, 'Max 150'],
                ['TIU', pgDetailModal.nilai_skd_tiu, 'Max 175'],
                ['TKP', pgDetailModal.nilai_skd_tkp, 'Min 76'],
              ] as const).map(([label, val, hint]) => (
                <div key={label} className="bg-white rounded-xl p-2.5 text-center border border-amber-100">
                  <p className="text-[8px] font-black text-amber-500 mb-0.5">{label}</p>
                  <p className="text-[18px] font-black text-gray-900 leading-tight">{val ?? '—'}</p>
                  <p className="text-[8px] text-gray-400">{hint}</p>
                </div>
              ))}
            </div>

            {/* Total SKD highlight */}
            {(() => {
              const total = (pgDetailModal.nilai_skd_total ??
                ((pgDetailModal.nilai_skd_twk ?? 0) + (pgDetailModal.nilai_skd_tiu ?? 0) + (pgDetailModal.nilai_skd_tkp ?? 0))) || null;
              return total ? (
                <div className="bg-amber-400 rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-amber-900 uppercase tracking-widest">Total SKD</p>
                    <p className="text-[9px] text-amber-800 font-medium mt-0.5">P/L terakhir yang lolos seleksi</p>
                  </div>
                  <span className="text-3xl font-black text-white">{total}</span>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-xl px-4 py-3 text-center">
                  <p className="text-[10px] text-gray-400 font-bold">Data SKD belum tersedia</p>
                </div>
              );
            })()}
          </div>

          {/* Lokasi & Formasi badge */}
          {(pgDetailModal.lokasi_nm || pgDetailModal.formasi_nm) && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {pgDetailModal.formasi_nm && (
                <span className="text-[9px] font-bold px-2 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg">
                  {pgDetailModal.formasi_nm}
                </span>
              )}
              {pgDetailModal.lokasi_nm && (
                <span className="text-[9px] font-bold px-2 py-1 bg-gray-50 text-gray-500 border border-gray-100 rounded-lg">
                  📍 {pgDetailModal.lokasi_nm}
                </span>
              )}
            </div>
          )}

          {/* Footer note */}
          <p className="text-[9px] text-gray-400 text-center mt-3 font-medium">
            📊 Data hasil integrasi SKD &amp; SKB CPNS 2024 · BKN
          </p>
        </div>
      </div>
    )}

  </div>
);
}

