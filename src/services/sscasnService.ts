import { SSCASNFormation, SSCASNResponse } from '../types/sscasn';

// ====================================================
// Semua request sekarang diarahkan ke Netlify Function
// /api/sscasn/* → netlify/functions/sscasn-proxy.ts
// yang kemudian fetch langsung ke server BKN.
// Tidak ada lagi CORS proxy pihak ketiga! 🚀
// ====================================================
const PROXY_BASE = '/api/sscasn';

const BROWSER_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 menit (Formasi)
const METADATA_TTL = 24 * 60 * 60 * 1000; // 24 jam (Instansi, Prodi, dsb)

async function fetchWithCache<T>(path: string, isMetadata = false): Promise<T> {
  const cacheKey = `sscasn_cache_${path}`;
  
  // 1. Check in-memory first
  const memCached = BROWSER_CACHE.get(path);
  if (memCached && Date.now() - memCached.timestamp < (isMetadata ? METADATA_TTL : CACHE_TTL)) {
    return memCached.data as T;
  }

  // 2. Metadata: Check localStorage (Persistence across refreshes)
  if (isMetadata) {
    try {
      const lsCached = localStorage.getItem(cacheKey);
      if (lsCached) {
        const parsed = JSON.parse(lsCached);
        if (Date.now() - parsed.timestamp < METADATA_TTL) {
          BROWSER_CACHE.set(path, parsed); // Sync to memory
          return parsed.data as T;
        }
      }
    } catch (e) { console.warn('LSCache read failed', e); }
  }

  const res = await fetch(`${PROXY_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
  const data: T = await res.json();
  
  const entry = { data, timestamp: Date.now() };
  BROWSER_CACHE.set(path, entry);
  if (isMetadata) {
    try { localStorage.setItem(cacheKey, JSON.stringify(entry)); } catch (e) {}
  }
  
  return data;
}

/**
 * Fetch semua halaman dari endpoint paginated secara paralel (batch 20).
 * API membatasi per_page = 100, jadi limit=7000 tidak berfungsi.
 */
async function fetchAllPages<T>(basePath: string, perPage = 100): Promise<T[]> {
  const cacheKey = `sscasn_cache___all__${basePath}`;
  
  // 1. Memory Check
  const memCached = BROWSER_CACHE.get(cacheKey);
  if (memCached && Date.now() - memCached.timestamp < METADATA_TTL) {
    return memCached.data as T[];
  }

  // 2. localStorage Check
  try {
    const lsCached = localStorage.getItem(cacheKey);
    if (lsCached) {
      const parsed = JSON.parse(lsCached);
      if (Date.now() - parsed.timestamp < METADATA_TTL) {
        BROWSER_CACHE.set(cacheKey, parsed);
        return parsed.data as T[];
      }
    }
  } catch (e) {}

  // 3. Fetch (Heavy)
  const first = await fetchWithCache<any>(`${basePath}?limit=${perPage}&page=1`, true);
  const totalItems: number = first?.pagination?.total_items ?? 0;
  const totalPages = Math.ceil(totalItems / perPage);

  let allData: T[] = [...(first?.data ?? [])];

  if (totalPages > 1) {
    const BATCH = 15; // Reduce batch size slightly to be kinder to BKN
    for (let start = 2; start <= totalPages; start += BATCH) {
      const end = Math.min(start + BATCH - 1, totalPages);
      const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      const results = await Promise.all(
        pageNumbers.map(p => fetchWithCache<any>(`${basePath}?limit=${perPage}&page=${p}`, true))
      );
      results.forEach(r => {
        if (r?.data) allData = allData.concat(r.data);
      });
    }
  }

  const entry = { data: allData, timestamp: Date.now() };
  BROWSER_CACHE.set(cacheKey, entry);
  try { localStorage.setItem(cacheKey, JSON.stringify(entry)); } catch (e) {}
  
  return allData;
}

export interface FilterOptions {
  instansi_kode?: string;
  jabatan_kode?: string;
  pendidikan_kode?: string;
  level?: string;
  wilayah?: string;
  min_gaji?: number;
  max_gaji?: number;
  sort?: 'jumlah_formasi' | 'jumlah_pelamar' | 'gaji_min' | 'gaji_max' | 'terketat' | 'tidak_ketat' | 'pelamar_sedikit' | 'none';
  order?: 'asc' | 'desc';
}

export const getFormasi = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  filters?: FilterOptions
): Promise<SSCASNResponse<SSCASNFormation>> => {
  const params = new URLSearchParams();
  params.set('page', page.toString());
  params.set('limit', limit.toString());
  if (search) params.set('search', search);

  if (filters) {
    if (filters.instansi_kode  && filters.instansi_kode  !== 'all') params.set('instansi_kode',  filters.instansi_kode);
    if (filters.jabatan_kode   && filters.jabatan_kode   !== 'all') params.set('jabatan_kode',   filters.jabatan_kode);
    if (filters.pendidikan_kode && filters.pendidikan_kode !== 'all') params.set('pendidikan_kode', filters.pendidikan_kode);
    if (filters.min_gaji) params.set('min_gaji', filters.min_gaji.toString());
    if (filters.max_gaji) params.set('max_gaji', filters.max_gaji.toString());
    if (filters.sort)  params.set('sort',  filters.sort);
    if (filters.order) params.set('order', filters.order);
  }

  return fetchWithCache<SSCASNResponse<SSCASNFormation>>(`/formasi?${params.toString()}`);
};

export const getInstansi = async (): Promise<any[]> => {
  // Coba limit 1000 — cek apakah semuanya masuk 1 page
  const first = await fetchWithCache<any>('/instansi?limit=100&page=1');
  const total = first?.pagination?.total_items ?? 0;
  const per   = first?.pagination?.per_page ?? 100;
  if (total <= per) return first?.data ?? [];
  return fetchAllPages<any>('/instansi');
};

export const getJabatan = async (): Promise<any[]> => {
  const first = await fetchWithCache<any>('/jabatan?limit=100&page=1');
  const total = first?.pagination?.total_items ?? 0;
  const per   = first?.pagination?.per_page ?? 100;
  if (total <= per) return first?.data ?? [];
  return fetchAllPages<any>('/jabatan');
};

export const getPendidikan = async (): Promise<any[]> => {
  // 6108 items total — harus fetch semua halaman (API cap per_page = 100)
  return fetchAllPages<any>('/pendidikan');
};

export const getFormasiById = async (id: string): Promise<SSCASNFormation> => {
  const result = await fetchWithCache<any>(`/formasi/${id}`);
  return result?.data;
};

export const sscasnService = {
  getFormasi,
  getFormasiById,
  getInstansi,
  getJabatan,
  getPendidikan,
};
