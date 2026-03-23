import { SSCASNFormation, SSCASNResponse } from '../types/sscasn';

// ====================================================
// Semua request sekarang diarahkan ke Netlify Function
// /api/sscasn/* → netlify/functions/sscasn-proxy.ts
// yang kemudian fetch langsung ke server BKN.
// Tidak ada lagi CORS proxy pihak ketiga! 🚀
// ====================================================
const PROXY_BASE = '/api/sscasn';

// Browser-side in-memory cache (layer kedua setelah server cache)
const BROWSER_CACHE = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 menit

async function fetchWithCache<T>(path: string): Promise<T> {
  const cached = BROWSER_CACHE.get(path);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T;
  }

  const res = await fetch(`${PROXY_BASE}${path}`);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);
  const data: T = await res.json();
  BROWSER_CACHE.set(path, { data, timestamp: Date.now() });
  return data;
}

/**
 * Fetch semua halaman dari endpoint paginated secara paralel (batch 20).
 * API membatasi per_page = 100, jadi limit=7000 tidak berfungsi.
 */
async function fetchAllPages<T>(basePath: string, perPage = 100): Promise<T[]> {
  // Cek cache untuk full dataset
  const cacheKey = `__all__${basePath}`;
  const cached = BROWSER_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data as T[];
  }

  // Ambil halaman 1 dulu untuk mengetahui total
  const first = await fetchWithCache<any>(`${basePath}?limit=${perPage}&page=1`);
  const totalItems: number = first?.pagination?.total_items ?? 0;
  const totalPages = Math.ceil(totalItems / perPage);

  let allData: T[] = [...(first?.data ?? [])];

  if (totalPages > 1) {
    // Fetch semua halaman sisanya secara paralel, batch 20 halaman sekaligus
    const BATCH = 20;
    for (let start = 2; start <= totalPages; start += BATCH) {
      const end = Math.min(start + BATCH - 1, totalPages);
      const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      const results = await Promise.all(
        pageNumbers.map(p => fetchWithCache<any>(`${basePath}?limit=${perPage}&page=${p}`))
      );
      results.forEach(r => {
        if (r?.data) allData = allData.concat(r.data);
      });
    }
  }

  BROWSER_CACHE.set(cacheKey, { data: allData, timestamp: Date.now() });
  return allData;
}

export interface FilterOptions {
  instansi_kode?: string;
  jabatan_kode?: string;
  pendidikan_kode?: string;
  level?: string;
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
