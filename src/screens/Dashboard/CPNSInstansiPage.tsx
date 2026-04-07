import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Building2,
  ChevronLeft, ChevronRight, Info, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { checkUserFormasiAccess } from '@/services/formasiAccessCodeService';
import { LockedFeatureOverlay } from '@/components/LockedFeatureOverlay';
import { cn } from '@/lib/utils';
import { sscasnService } from '@/services/sscasnService';
import { useNavigate } from 'react-router-dom';

// ─── Types ──────────────────────────────────────────────────────────────────
type TukinCategory = 99 | 5 | 4 | 3 | 2 | 1 | 0 | '-' | null;

interface TukinTier {
  cat: string;
  label: string;
  subtitle: string;
  emoji: string;
  description: string;
  nominalKj7?: string;   // Kelas Jabatan 7 (D3 / Terampil)
  nominalKj8?: string;   // Kelas Jabatan 8 (S1 / Ahli Pertama)
  // style tokens
  gradient: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  headerBg: string;
  rank: number;
}

const TIERS: TukinTier[] = [
  {
    cat: '99',
    label: 'Kesultanan',
    subtitle: 'Kasta Paling Istimewa',
    emoji: '👑',
    description: 'Tukin dengan besaran tersendiri, jauh di atas kategori biasa. Ditetapkan khusus untuk lembaga strategis negara.',
    nominalKj7: '±Rp 12–30 juta',
    nominalKj8: '±Rp 18–45 juta',
    gradient: 'from-yellow-400 via-amber-400 to-orange-400',
    textColor: 'text-amber-900',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-300',
    headerBg: 'bg-gradient-to-r from-yellow-400 to-amber-400',
    rank: 6,
  },
  {
    cat: '5',
    label: 'Adipati',
    subtitle: 'Tier Sangat Tinggi',
    emoji: '💎',
    description: 'Kategorisasi tukin tertinggi ke-2. Lembaga strategis / pengawasan dengan beban tanggung jawab sangat besar.',
    nominalKj7: '±Rp 4–8 juta',
    nominalKj8: '±Rp 5–12 juta',
    gradient: 'from-purple-500 via-violet-500 to-purple-600',
    textColor: 'text-purple-900',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-300',
    headerBg: 'bg-gradient-to-r from-purple-500 to-violet-500',
    rank: 5,
  },
  {
    cat: '4',
    label: 'Bangsawan',
    subtitle: 'Tier Tinggi',
    emoji: '⚜️',
    description: 'Mayoritas kementerian dan lembaga pusat. Tukin memadai dengan besaran yang bervariasi antar instansi.',
    nominalKj7: '±Rp 3–5 juta',
    nominalKj8: '±Rp 4–7 juta',
    gradient: 'from-blue-500 via-blue-600 to-indigo-600',
    textColor: 'text-blue-900',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-300',
    headerBg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    rank: 4,
  },
  {
    cat: '3',
    label: 'Ksatria',
    subtitle: 'Tier Menengah',
    emoji: '⚔️',
    description: 'Lembaga dengan tukin menengah. Biasanya kementerian teknis atau lembaga nonkementerian yang baru naik kelas.',
    nominalKj7: '±Rp 2–3,5 juta',
    nominalKj8: '±Rp 3–5 juta',
    gradient: 'from-emerald-500 via-teal-500 to-green-600',
    textColor: 'text-emerald-900',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-300',
    headerBg: 'bg-gradient-to-r from-emerald-500 to-teal-600',
    rank: 3,
  },
  {
    cat: '2',
    label: 'Rakyat Biasa',
    subtitle: 'Tier Rendah',
    emoji: '🛡️',
    description: 'Tukin masih ada namun dengan nominal yang lebih kecil. Umumnya lembaga dengan anggaran terbatas.',
    nominalKj7: '±Rp 1,5–2,5 juta',
    nominalKj8: '±Rp 2–3.5 juta',
    gradient: 'from-sky-400 via-cyan-500 to-blue-500',
    textColor: 'text-sky-900',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
    badgeBorder: 'border-sky-300',
    headerBg: 'bg-gradient-to-r from-sky-400 to-blue-500',
    rank: 2,
  },
  {
    cat: '1',
    label: 'Jelata',
    subtitle: 'Tier Paling Dasar',
    emoji: '🌿',
    description: 'Kategori tukin terendah. Lembaga kecil atau yang masih dalam proses penyesuaian kebijakan remunerasi.',
    nominalKj7: '±Rp 1–2 juta',
    nominalKj8: '±Rp 1,5–2,5 juta',
    gradient: 'from-gray-400 via-gray-500 to-slate-500',
    textColor: 'text-gray-900',
    badgeBg: 'bg-gray-50',
    badgeText: 'text-gray-600',
    badgeBorder: 'border-gray-300',
    headerBg: 'bg-gradient-to-r from-gray-400 to-slate-500',
    rank: 1,
  },
];

const TUKIN_1_17 = {
  '1': [19360000, 14131000, 10315000, 7529000, 6023000, 4819000, 3855000, 3352000, 2915000, 2535000, 2304000, 2095000, 1904000, 1814000, 1727000, 1645000, 1563000],
  '2': [24930000, 17413000, 12518000, 9600000, 7293000, 6045000, 4519000, 3952000, 3348000, 2927000, 2616000, 2399000, 2199000, 2082000, 1972000, 1867000, 1766000],
  '3': [26324000, 20695000, 14721000, 11670000, 8562000, 7271000, 5183000, 4551000, 3781000, 3319000, 2928000, 2702000, 2493000, 2350000, 2216000, 2089000, 1968000],
  '4': [33240000, 27577500, 19280000, 17064000, 10936000, 9896000, 8757600, 5979200, 5079200, 4595150, 3915950, 3510400, 3134250, 2985000, 2898000, 2708250, 2531250],
  '5': [41550000, 32540000, 24100000, 21330000, 13670000, 12370000, 10947000, 8458000, 7474000, 6349000, 5079000, 4837000, 4607000, 4179000, 3980000, 3154000, 2575000],
};

const TIER_MAP = new Map(TIERS.map(t => [t.cat, t]));

function getTier(cat: TukinCategory): TukinTier {
  if (cat === null || cat === undefined) return TIER_MAP.get('-') ?? TIERS[5];
  return TIER_MAP.get(String(cat)) ?? {
    cat: '-', label: 'N/A', subtitle: '', emoji: '❓', description: '', rank: 0,
    gradient: 'from-gray-200 to-gray-300', textColor: 'text-gray-500',
    badgeBg: 'bg-gray-50', badgeText: 'text-gray-400', badgeBorder: 'border-gray-200',
    headerBg: 'bg-gray-300',
  };
}

// ─── Types for data ─────────────────────────────────────────────────────────
interface TukinKLItem {
  peraturan_title: string;
  data: {
    tukin_category: TukinCategory;
    peraturan_year: number;
    wikipedia_logo?: string;
    is_aktif: number;
  }[];
  is_aktif?: boolean;
}

interface InstansiItem {
  kode: string;
  nama: string;
}

interface InstansiStats {
  total_pelamar: number;
  total_formasi: number;
  ratio: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ALIASES: Record<string, string> = {
  'setjen': 'sekretariat jenderal',
  'kemenkes': 'kementerian kesehatan',
  'kemenkeu': 'kementerian keuangan',
  'kemenhub': 'kementerian perhubungan',
  'kemendikbud': 'kementerian pendidikan',
  'kemensos': 'kementerian sosial',
  'kemenag': 'kementerian agama',
  'kemenkumham': 'kementerian hukum dan hak asasi manusia',
  'kpu': 'komisi pemilihan umum',
  'bawaslu': 'badan pengawas pemilihan umum',
  'bkn': 'badan kepegawaian negara',
  'bnn': 'badan narkotika nasional',
  'bmkg': 'badan meteorologi klimatologi dan geofisika',
  'pemprov': 'pemerintah provinsi',
  'pemkab': 'pemerintah kabupaten',
  'pemkot': 'pemerintah kota',
  'kemen': 'kementerian',
  // Daerah aliases
  'dki': 'daerah khusus ibukota jakarta',
  'diy': 'daerah istimewa yogyakarta',
  'jabar': 'jawa barat',
  'jateng': 'jawa tengah',
  'jatim': 'jawa timur',
  'sulsel': 'sulawesi selatan',
  'sumut': 'sumatera utara',
  'sumbar': 'sumatera barat',
  'kalbar': 'kalimantan barat',
  'kaltim': 'kalimantan timur',
  'kepri': 'kepulauan riau',
  'ntb': 'nusa tenggara barat',
  'ntt': 'nusa tenggara timur',
};

const normalizeStr = (s: string) => {
  let norm = s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  // Apply aliases
  for (const [alias, full] of Object.entries(ALIASES)) {
    if (norm.includes(alias) && !norm.includes(full)) {
      norm = norm.replace(new RegExp(`\\b${alias}\\b`, 'g'), full);
    }
  }
  return norm;
};

// ... existing code ...
function matchTukin(instansiNama: string, tukinMap: Map<string, TukinKLItem>): TukinKLItem | null {
  const norm = normalizeStr(instansiNama);
  
  // 1. Exact Match after normalization
  for (const [key, val] of tukinMap) {
    if (normalizeStr(key) === norm) return val;
  }
  
  // 2. Substring Match (A contains B or B contains A)
  for (const [key, val] of tukinMap) {
    const kn = normalizeStr(key);
    if (norm.includes(kn) || kn.includes(norm)) return val;
  }
  
  // 3. Token-based Match (all words in shorter name exist in longer name)
  const nt = norm.split(' ').filter(Boolean);
  for (const [key, val] of tukinMap) {
    const kt = normalizeStr(key).split(' ').filter(Boolean);
    const shorter = nt.length <= kt.length ? nt : kt;
    const longer  = nt.length <= kt.length ? kt : nt;
    
    // Ignore short common words for token matching to avoid false positives
    const ignoreList = ['badan', 'kementerian', 'sekretariat', 'jenderal', 'dan', 'nasional', 'pusat'];
    const meaningfulShorter = shorter.filter(w => !ignoreList.includes(w) && w.length > 2);
    
    // If we have meaningful tokens and ALL of them exist in the longer name
    if (meaningfulShorter.length >= 1 && meaningfulShorter.every(t => longer.some(l => l.includes(t) || t.includes(l)))) {
      return val;
    }
  }
  
  return null;
}

function getCurrentCategory(item: TukinKLItem): TukinCategory {
  if (!item.data?.length) return '-';
  const now = new Date().getFullYear();
  const active = item.data.filter(d =>
    parseInt(String(d.peraturan_year)) <= now && d.tukin_category !== '-' && d.tukin_category !== undefined
  );
  if (!active.length) return '-';
  return active[active.length - 1].tukin_category;
}

function getLogoUrl(item: TukinKLItem): string | undefined {
  for (let i = item.data.length - 1; i >= 0; i--) {
    const logo = (item.data[i] as any).wikipedia_logo;
    if (logo) return logo;
  }
}

const PAGE_SIZE = 24;
const STATS_CACHE_KEY = 'instansi_stats_cache';
const STATS_TTL_MS = 2 * 60 * 60 * 1000; // 2 jam

// ─── LocalStorage helpers ─────────────────────────────────────────────────────
function loadStatsCache(): Map<string, InstansiStats> {
  try {
    const raw = localStorage.getItem(STATS_CACHE_KEY);
    if (!raw) return new Map();
    const parsed: { ts: number; data: [string, InstansiStats][] } = JSON.parse(raw);
    if (Date.now() - parsed.ts > STATS_TTL_MS) { localStorage.removeItem(STATS_CACHE_KEY); return new Map(); }
    return new Map(parsed.data);
  } catch { return new Map(); }
}

function saveStatsCache(map: Map<string, InstansiStats | 'loading' | 'error'>) {
  try {
    const data: [string, InstansiStats][] = [];
    for (const [k, v] of map) { if (typeof v === 'object') data.push([k, v]); }
    localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function CPNSInstansiPage() {
  const [tab, setTab] = useState<'klasifikasi' | 'instansi'>('klasifikasi');
  const [tukinRaw, setTukinRaw] = useState<TukinKLItem[]>([]);
  const [instansiList, setInstansiList] = useState<InstansiItem[]>([]);
  const [tukinMap, setTukinMap] = useState<Map<string, TukinKLItem>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // VIP Access States
  const { user, isAdmin } = useAuth();
  const [isUnlocked, setIsUnlocked] = useState<boolean | null>(null);

  // Instansi tab state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'semua' | 'pusat' | 'daerah'>('semua');
  const [filterTierCat, setFilterTierCat] = useState<string>('semua');
  const [sortMode, setSortMode] = useState<'default' | 'tukin_desc' | 'pelamar_desc' | 'ratio_desc' | 'ratio_asc'>('default');
  const [currentPage, setCurrentPage] = useState(1);

  // Stats — pre-load from localStorage cache, fetch missing in background
  const [stats, setStats] = useState<Map<string, InstansiStats | 'loading' | 'error'>>(() => {
    const cached = loadStatsCache();
    const m = new Map<string, InstansiStats | 'loading' | 'error'>();
    for (const [k, v] of cached) m.set(k, v);
    return m;
  });
  const loadingCodesRef = useRef<Set<string>>(new Set());

  const navigate = useNavigate();

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

  // ─── Load master data ───────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [instansi, tukin] = await Promise.all([
          sscasnService.getInstansi(),
          sscasnService.getTukinKL().catch(() => []),
        ]);
        setInstansiList(instansi || []);
        const arr = Array.isArray(tukin) ? tukin : [];
        setTukinRaw(arr);
        const map = new Map<string, TukinKLItem>();
        arr.forEach((item: TukinKLItem) => map.set(item.peraturan_title, item));
        setTukinMap(map);
      } catch {
        setError('Gagal memuat data. Silakan muat ulang halaman.');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const classify = (nama: string): 'pusat' | 'daerah' => {
    const n = nama.toUpperCase();
    return (
      n.includes('PEMERINTAH PROVINSI') ||
      n.includes('PEMERINTAH KABUPATEN') ||
      n.includes('PEMERINTAH KOTA') ||
      n.includes('PEMERINTAH DAERAH') ||
      n.includes('PEMERINTAH ACEH') ||
      n.startsWith('PEMERINTAH PROV') ||
      n.includes('PEMDA') || n.includes('PEMKAB') ||
      n.includes('PEMKOT') || n.includes('PEMPROV') ||
      n.includes('KAB.') || n.includes('PROV.') ||
      n.startsWith('KOTA ')
    ) ? 'daerah' : 'pusat';
  };

  // ─── Enriched instansi list ──────────────────────────────────────────────────
  const enriched = instansiList.map(ins => {
    const type = classify(ins.nama);
    const tukin = type === 'pusat' ? matchTukin(ins.nama, tukinMap) : null;
    const category = tukin ? getCurrentCategory(tukin) : null;
    const tier = getTier(category as TukinCategory);
    const logo = tukin ? getLogoUrl(tukin) : undefined;
    const peraturan_title = tukin ? tukin.peraturan_title : undefined;
    return { ...ins, category, tier, logo, type, peraturan_title };
  });

  // ─── Group tukin entries by current category ─────────────────────────────────
  const tukinGrouped = (() => {
    const groups = new Map<string, { item: TukinKLItem; category: TukinCategory; logo?: string }[]>();
    tukinRaw.forEach(item => {
      const cat = getCurrentCategory(item);
      const catStr = cat === null ? '-' : String(cat);
      if (!groups.has(catStr)) groups.set(catStr, []);
      groups.get(catStr)!.push({ item, category: cat, logo: getLogoUrl(item) });
    });
    return groups;
  })();

  // ─── Instansi filter & sort ───────────────────────────────────────────────────
  const filtered = enriched.filter(ins => {
    if (filterType !== 'semua' && ins.type !== filterType) return false;
    if (filterTierCat !== 'semua') {
      const catStr = ins.category === null ? 'null' : String(ins.category);
      if (catStr !== filterTierCat) return false;
    }
    if (searchTerm) {
      const searchNorm = normalizeStr(searchTerm);
      const insNorm = normalizeStr(ins.nama);
      if (!insNorm.includes(searchNorm) && !ins.nama.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortMode === 'tukin_desc') return (b.tier.rank ?? 0) - (a.tier.rank ?? 0);
    if (sortMode === 'pelamar_desc') {
      const as = stats.get(a.kode), bs = stats.get(b.kode);
      return (typeof bs === 'object' && bs ? bs.total_pelamar : 0) -
             (typeof as === 'object' && as ? as.total_pelamar : 0);
    }
    if (sortMode === 'ratio_desc') {
      const as = stats.get(a.kode), bs = stats.get(b.kode);
      return (typeof bs === 'object' && bs ? bs.ratio : 0) -
             (typeof as === 'object' && as ? as.ratio : 0);
    }
    if (sortMode === 'ratio_asc') {
      const as = stats.get(a.kode), bs = stats.get(b.kode);
      return (typeof as === 'object' && as ? as.ratio : Infinity) -
             (typeof bs === 'object' && bs ? bs.ratio : Infinity);
    }
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterType, filterTierCat, sortMode]);

  // ─── Stats fetch ─────────────────────────────────────────────────────────────
  const loadStats = useCallback(async (codes: string[]) => {
    // Filter only codes we haven't started loading
    if (!isUnlocked && !isAdmin) return;

    const toFetch = codes.filter(k => {
      if (loadingCodesRef.current.has(k)) return false;
      const s = stats.get(k);
      return !s || s === 'error';
    });
    if (!toFetch.length) return;

    // Mark as loading immediately
    toFetch.forEach(k => loadingCodesRef.current.add(k));
    setStats(prev => {
      const n = new Map(prev);
      toFetch.forEach(k => { if (!n.get(k) || n.get(k) === 'error') n.set(k, 'loading'); });
      return n;
    });

    // Load codes with a small staggered delay to be kinder to the upstream API
    await Promise.allSettled(toFetch.map(async (kode, index) => {
      try {
        // Small staggered delay (50ms per item) to prevent massive burst
        if (index > 0) await new Promise(resolve => setTimeout(resolve, index * 50));
        
        // Use limit 100: lightest configuration for maximum efficiency
        const res = await sscasnService.getFormasi(1, 100, undefined, { instansi_kode: kode });
        const data = res.data ?? [];
        const totalFormasi = data.reduce((s: number, f: any) => s + (f.jumlah_formasi || 0), 0);
        const totalPelamar = data.reduce((s: number, f: any) => s + (f.jumlah_ms || 0), 0);
        const ratio = totalFormasi > 0 ? totalPelamar / totalFormasi : 0;
        setStats(prev => {
          const n = new Map(prev);
          n.set(kode, { total_pelamar: totalPelamar, total_formasi: totalFormasi, ratio });
          saveStatsCache(n);
          return n;
        });
      } catch {
        setStats(prev => { const n = new Map(prev); n.set(kode, 'error'); return n; });
      } finally {
        loadingCodesRef.current.delete(kode);
      }
    }));
  }, [isUnlocked, isAdmin, stats]);

  useEffect(() => {
    const codes = paginated.map(p => p.kode).filter(k => {
      const s = stats.get(k);
      return !s || s === 'error';
    });
    if (codes.length) loadStats(codes);
  }, [paginated, loadStats, stats]);

  const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);
  const ratioColor = (r: number) =>
    r > 50 ? 'text-rose-600 bg-rose-50' : r > 20 ? 'text-amber-600 bg-amber-50' : r > 10 ? 'text-blue-600 bg-blue-50' : 'text-emerald-600 bg-emerald-50';

  if (isUnlocked === null || loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600/10 border-t-blue-600" />
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">
        {isUnlocked === null ? 'Pengecekan Akses...' : 'Memuat Data Instansi...'}
      </p>
    </div>
  );

  return (
    <div className="relative">
      {/* Full-page blur overlay when locked */}
      {!isUnlocked && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-30 backdrop-blur-md bg-white/60 pointer-events-none" />
      )}
      {/* Background Content */}
      <div className={cn(
        "transition-all duration-300 ease-out",
        !isUnlocked ? "opacity-20 grayscale pointer-events-none select-none" : "opacity-100 grayscale-0"
      )}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tight text-gray-900">Instansi CPNS 2024</h1>
        <p className="text-sm text-gray-400 font-medium">Klasifikasi tier tukin K/L &amp; data keketatan instansi pemerintah</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-0 border-b border-gray-200">
        {[
          { key: 'klasifikasi', label: 'Klasifikasi Tukin', icon: Layers },
          { key: 'instansi', label: 'Cari Instansi', icon: Building2 },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as any)}
            className={cn(
              'flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all',
              tab === key
                ? 'border-blue-600 text-blue-600 bg-blue-50/40'
                : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: KLASIFIKASI ─────────────────────────────────────────────────── */}
      {tab === 'klasifikasi' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Intro */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 flex gap-4">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-black text-blue-900 uppercase tracking-wide">Apa itu Tier Tukin?</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Tunjangan Kinerja (Tukin) adalah komponen penghasilan terbesar ASN. Setiap K/L ditetapkan dalam kategori 1–5 atau 99 (khusus) berdasarkan Perpres. Semakin tinggi kategori, semakin besar nominal yang diterima pegawai per bulan. Data Pemda menggunakan TPP (Tambahan Penghasilan Pegawai) yang besarannya ditetapkan masing-masing daerah dan tidak termasuk dalam kategori ini.
              </p>
            </div>
          </div>

            {/* Main Content Wrapper */}
            <div className="space-y-6">
              {/* 1-17 matrices replacing the table */}
              <div className="space-y-4">
              <h2 className="text-xl font-black text-gray-900 px-1 pt-2 tracking-tight">Besaran Tunjangan Kinerja</h2>
              <div className="flex gap-5 overflow-x-auto pb-6 custom-scrollbar snap-x">
                {['1', '2', '3', '4', '5'].map((catStr) => {
                  const tier = TIERS.find(t => t.cat === catStr);
                  if (!tier) return null;
                  const arr = (TUKIN_1_17 as Record<string, number[]>)[catStr];
                  return (
                    <div key={catStr} className="min-w-[220px] flex-shrink-0 border border-gray-200 rounded-2xl overflow-hidden shadow-sm bg-white snap-center">
                      <div className={cn("px-4 py-3 text-center text-white", tier.headerBg)}>
                        <p className="font-black tracking-tight">{tier.emoji} {tier.label} {catStr}</p>
                      </div>
                      <table className="w-full text-xs text-center border-collapse">
                        <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500">
                          <tr>
                            <th className="py-2.5 w-1/3 border-r border-gray-200 text-[10px] font-black uppercase tracking-widest">Kelas</th>
                            <th className="py-2.5 w-2/3 text-[10px] font-black uppercase tracking-widest">Tukin (Rp)</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white text-gray-700">
                          {arr.map((val, idx) => {
                            const kelas = 17 - idx;
                            const isHighlighted = kelas === 6 || kelas === 8;
                            return (
                              <tr key={kelas} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                <td className={cn("py-2 border-r border-gray-100 font-bold text-[11px]", isHighlighted ? "text-rose-600 bg-rose-50/50" : "text-gray-600")}>
                                  {isHighlighted ? '* ' : ''}{kelas}
                                </td>
                                <td className={cn("py-2 font-mono font-bold text-[11px] tracking-tight", isHighlighted && "bg-rose-50/30 text-rose-700")}>
                                  {new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(val).replace(/,/g, '.')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 mt-8">
              <div className="px-1">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Daftar Instansi per Kategori</h2>
                <p className="text-xs text-gray-500 mt-1">Kementerian dan Lembaga yang tergabung dalam masing-masing kategori tukin di atas.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {TIERS.map(tier => {
                  const members = tukinGrouped.get(tier.cat) ?? [];
                  if (members.length === 0) return null;
                  return (
                    <div key={'list-'+tier.cat} className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col">
                      <div className="bg-gray-50 px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{tier.emoji}</span>
                          <span className={cn('text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border', tier.badgeBg, tier.badgeText, tier.badgeBorder)}>
                            Tier {tier.cat}
                          </span>
                        </div>
                        <span className="text-xs font-black text-gray-400 font-mono">{members.length} K/L</span>
                      </div>
                      <div className="p-4 flex-1 flex flex-wrap gap-2 content-start max-h-[350px] overflow-y-auto custom-scrollbar">
                        {members.map(m => (
                          <span key={m.item.peraturan_title} className="text-[10px] font-bold text-gray-700 bg-white border border-gray-200 px-2.5 py-1.5 rounded-md inline-block shadow-sm">
                            {m.item.peraturan_title}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pemda Note */}
            <div className="rounded-2xl border border-green-100 overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center gap-3">
                <span className="text-3xl">🏢</span>
                <div>
                  <span className="text-lg font-black tracking-tight">Pemerintah Daerah (Pemda)</span>
                  <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">TPP — Tidak Ada Kategori Tukin</p>
                </div>
              </div>
              <div className="bg-white px-6 py-5 space-y-2">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Pemda (Provinsi, Kabupaten, Kota) tidak mengikuti sistem kategorisasi tukin K/L. Mereka menggunakan <strong>Tambahan Penghasilan Pegawai (TPP)</strong> yang ditetapkan melalui Perkada masing-masing daerah. Besaran TPP sangat bervariasi — DKI Jakarta misalnya memberikan TPP yang bisa lebih tinggi dari K/L Kesultanan, sementara daerah 3T bisa sangat rendah.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['DKI Jakarta', 'Kota Surabaya', 'Kota Bandung', 'Prov. Bali', 'Kab. Kutai Kartanegara'].map(d => (
                    <span key={d} className="px-2.5 py-1.5 text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 rounded-full">{d}</span>
                  ))}
                  <span className="px-2.5 py-1.5 text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-200 rounded-full">...dan ratusan Pemda lainnya</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: INSTANSI ────────────────────────────────────────────────────── */}
      {tab === 'instansi' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Active filter indicator */}
          {filterTierCat !== 'semua' && (
            <div className="flex items-center gap-2">
              {(() => {
                const t = TIER_MAP.get(filterTierCat);
                return t ? (
                  <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border', t.badgeBg, t.badgeText, t.badgeBorder)}>
                    {t.emoji} Filter: {t.label}
                    <button onClick={() => setFilterTierCat('semua')} className="ml-1 opacity-60 hover:opacity-100">✕</button>
                  </span>
                ) : null;
              })()}
            </div>
          )}

          {/* Tier pill filter */}
          <div className="flex flex-wrap gap-2">
            {TIERS.map(tier => {
              const cnt = enriched.filter(i => i.type === 'pusat' && String(i.category) === tier.cat).length;
              return (
                <button
                  key={tier.cat}
                  onClick={() => setFilterTierCat(filterTierCat === tier.cat ? 'semua' : tier.cat)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide border transition-all',
                    tier.badgeBg, tier.badgeText, tier.badgeBorder,
                    filterTierCat === tier.cat ? 'ring-2 ring-offset-1 ring-current' : 'opacity-75 hover:opacity-100'
                  )}
                >
                  {tier.emoji} {tier.label} {cnt > 0 && <span className="opacity-60">({cnt})</span>}
                </button>
              );
            })}
            <button
              onClick={() => setFilterTierCat('semua')}
              className={cn(
                'inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wide border transition-all bg-gray-50 text-gray-600 border-gray-200',
                filterTierCat === 'semua' ? 'ring-2 ring-offset-1 ring-gray-300' : 'opacity-75 hover:opacity-100'
              )}
            >
              Semua
            </button>
          </div>

          {/* Search + Filter bar */}
          <div className="flex flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="CARI NAMA INSTANSI..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-12 h-12 rounded-none border border-gray-200 font-mono text-xs uppercase placeholder:text-gray-300"
              />
            </div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="h-12 px-4 border border-l-0 border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="semua">Semua Tipe</option>
              <option value="pusat">K/L Pusat</option>
              <option value="daerah">Pemda</option>
            </select>
            <select
              value={sortMode}
              onChange={e => setSortMode(e.target.value as any)}
              className="h-12 px-4 border border-l-0 border-gray-200 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="default">Default (A-Z)</option>
              <option value="tukin_desc">👑 Tukin Tertinggi</option>
              <option value="pelamar_desc">👥 Pelamar Terbanyak</option>
              <option value="ratio_desc">🔴 Paling Ketat</option>
              <option value="ratio_asc">🟢 Paling Santai</option>
            </select>
          </div>

          {/* Stats headline */}
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            {filtered.length.toLocaleString('id-ID')} instansi ditemukan
          </p>

          {/* Card Grid */}
          {paginated.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="h-12 w-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold text-sm">Tidak ada instansi yang sesuai filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginated.map((ins, index) => {
                const statEntry = stats.get(ins.kode);
                const isLoading = statEntry === 'loading';
                const isErr = statEntry === 'error';
                const statData = typeof statEntry === 'object' ? statEntry : null;

                return (
                  <div key={ins.kode} 
                    onClick={() => navigate(`/dashboard/instansi/${ins.kode}`, { state: { instansi: ins } })}
                    className="group bg-white border border-gray-200 rounded-2xl p-4 hover:border-blue-300 hover:bg-gray-50/50 transition-all cursor-pointer flex flex-col gap-4">
                    {/* Header: Logo and Name */}
                    <div className="flex items-start gap-3">
                      {ins.logo ? (
                        <img src={ins.logo} alt={ins.nama} className="h-10 w-10 object-contain flex-shrink-0 rounded-xl bg-white border border-gray-100 p-1"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="h-10 w-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xs font-black text-gray-900 leading-tight uppercase group-hover:text-blue-700 transition-colors line-clamp-2">
                          #{((currentPage - 1) * PAGE_SIZE) + index + 1} - {ins.nama}
                        </h3>
                        {ins.peraturan_title && ins.peraturan_title.toUpperCase() !== ins.nama.toUpperCase() && (
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 line-clamp-1">
                            {ins.peraturan_title}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border',
                            ins.type === 'pusat' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100')}>
                            {ins.type === 'pusat' ? 'K/L Pusat' : 'Pemda'}
                          </span>
                          {ins.type === 'pusat' ? (
                            <span className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border', ins.tier.badgeBg, ins.tier.badgeText, ins.tier.badgeBorder)}>
                              {ins.tier.emoji} {ins.tier.label}
                            </span>
                          ) : (
                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-green-50 text-green-600 border border-green-100">
                              🏢 Ada TPP
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Pelamar</p>
                        {isLoading || !statEntry ? <p className="text-gray-300 text-sm">...</p> : isErr ? <p className="text-red-400 text-sm">-</p> : <p className="text-sm font-black text-gray-700">{fmt(statData?.total_pelamar || 0)}</p>}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Kuota</p>
                        {isLoading || !statEntry ? <p className="text-gray-300 text-sm">...</p> : isErr ? <p className="text-red-400 text-sm">-</p> : <p className="text-sm font-black text-gray-700">{fmt(statData?.total_formasi || 0)}</p>}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Keketatan</p>
                        {isLoading || !statEntry ? <p className="text-gray-300 text-sm">...</p> : isErr ? <p className="text-red-400 text-sm">-</p> : statData && statData.total_formasi > 0 ? (
                          <span className={cn('inline-block text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest', ratioColor(statData.ratio))}>
                            {statData.ratio >= 1 ? `${Math.round(statData.ratio)}:1` : '< 1:1'}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Hal {currentPage}/{totalPages} · {filtered.length} instansi
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)} className="h-9 w-9 rounded-xl border-gray-200">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                  const page = start + i;
                  return (
                    <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="icon"
                      onClick={() => setCurrentPage(page)}
                      className={cn('h-9 w-9 rounded-xl text-xs font-black',
                        currentPage === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-200')}>
                      {page}
                    </Button>
                  );
                })}
                <Button variant="outline" size="icon" disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)} className="h-9 w-9 rounded-xl border-gray-200">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
      </div> {/* End max-w-7xl */}
      </div> {/* End blur container */}

      {/* Overlay for Locked State */}
      {!isUnlocked && <LockedFeatureOverlay type="instansi" />}

      {/* Manual Loading / Error states shifted inside or handled as toast/alert if needed, 
          but for simplicity keeping them as conditional renders inside the background */}
      {loading && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center space-y-4">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
           <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Memuat Data...</p>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 flex flex-col items-center justify-center gap-4 bg-white/80 p-8 rounded-3xl backdrop-blur-sm border border-red-100">
           <p className="text-red-500 font-bold">{error}</p>
           <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
        </div>
      )}
    </div>
  );
}
