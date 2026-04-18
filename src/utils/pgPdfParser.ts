/**
 * pgPdfParser.ts — Khusus format BKN Panselnas CPNS 2024
 *
 * Format PDF: "HASIL INTEGRASI SKD DAN SKB (RINCIAN) PENGADAAN CPNS 2024"
 *
 * Struktur per jabatan:
 *   Instansi     : XXXX - Nama Instansi
 *   Jabatan Formasi : JFxxxxxx - NAMA JABATAN
 *   Lokasi Formasi  : xxxxx - Lokasi
 *   Jenis Formasi   : X - UMUM / CUMLAUDE / dll
 *   Pendidikan      : S-1 XXX / D-IV XXX
 *
 * Struktur per peserta (diulang N kali):
 *   1. Tes Wawasan Kebangsaan (TWK)     [nilai]
 *   2. Tes Intelegensia Umum (TIU)      [nilai]  [SKD total]  [skala100]  [bobot40%]
 *   3. Tes Karakteristik Pribadi (TKP)  [nilai]
 *   1 - CAT       [nilai raw] [skala100] [bobot%] [bobot60%]
 *   2 - Tes Xxx   [nilai raw] [skala100] [bobot%] [bobot60%]
 *   ...
 *   [Total Nilai Akhir]  P/L   ← orang LULUS (passing)
 *                        T/L   ← orang gagal
 *
 * LOGIKA PG:
 *   - Peserta diurutkan oleh BKN dari nilai tertinggi ke terendah
 *   - Peserta P/L terakhir di setiap jabatan = Passing Grade
 */

// Dynamic import agar tidak masuk bundle user biasa
async function getPdfjsLib() {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
  return pdfjsLib;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ParsedPGRow {
  instansi_kode: string;   // ex: "4008" — dari header Instansi PDF
  instansi_nm: string;     // ex: "Badan Pemeriksa Keuangan"
  kode_jabatan: string;    // ex: "JP4291391" — dari header Jabatan Formasi PDF
  jabatan_nm: string;
  pendidikan_nm: string;
  formasi_nm: string;
  lokasi_nm: string;
  nilai_skd_twk: number | null;
  nilai_skd_tiu: number | null;
  nilai_skd_tkp: number | null;
  nilai_skd_total: number | null;
  skb_raw: string;
  skb_komponen: { nama: string; nilai: number; bobot?: number }[];
  nilai_skb_total: number | null;
  nilai_akhir: number | null;
  rank: number;          // urutan dalam blok jabatan (1=tertinggi)
  raw_line: string;      // baris P/L untuk debug
  is_pg: boolean;        // true = peringkat P/L terakhir di jabatan ini
  status: 'PL' | 'TL';  // P/L = lulus, T/L = tidak lulus
}

export interface ParsedPGResult {
  instansi_hint: string;
  tahun: number;
  rows: ParsedPGRow[];
  raw_text_preview: string;
  all_lines_preview: string;
  page_count: number;
}

// ─── PDF Text Extraction (visual order, all pages) ────────────────────────────

interface TextItem { str: string; x: number; y: number; height: number; }

export async function extractTextFromPDF(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<{ lines: string[]; pageCount: number; rawText: string }> {
  const pdfjsLib = await getPdfjsLib();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allLines: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    if (onProgress) onProgress(pageNum, pdf.numPages);

    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent({ includeMarkedContent: false } as any);

    const items: TextItem[] = [];
    for (const raw of content.items as any[]) {
      const str = (raw.str ?? '').trim();
      if (!str) continue;
      const x = raw.transform?.[4] ?? 0;
      const y = raw.transform?.[5] ?? 0;
      const height = Math.abs(raw.height ?? raw.transform?.[3] ?? 10);
      items.push({ str, x, y, height });
    }

    if (items.length === 0) {
      allLines.push(`---PAGE ${pageNum}---`);
      continue;
    }

    // Sort: Y descending (halaman PDF punya Y=0 di bawah, semakin tinggi = semakin atas)
    items.sort((a, b) => {
      const dy = b.y - a.y;
      if (Math.abs(dy) <= 4) return a.x - b.x; // sama baris → urutkan kiri ke kanan
      return dy;
    });

    // Group items ke baris berdasarkan Y yang berdekatan
    const lineGroups: TextItem[][] = [];
    let curGroup: TextItem[] = [items[0]];

    for (let i = 1; i < items.length; i++) {
      const prev = curGroup[curGroup.length - 1];
      const curr = items[i];
      const tolerance = Math.max(...curGroup.map(it => it.height)) * 0.55;
      if (Math.abs(curr.y - prev.y) <= Math.max(tolerance, 4)) {
        curGroup.push(curr);
      } else {
        lineGroups.push(curGroup);
        curGroup = [curr];
      }
    }
    lineGroups.push(curGroup);

    for (const grp of lineGroups) {
      grp.sort((a, b) => a.x - b.x);
      const lineStr = grp.map(it => it.str).join(' ').replace(/\s+/g, ' ').trim();
      if (lineStr) allLines.push(lineStr);
    }

    allLines.push(`---PAGE ${pageNum}---`);
  }

  const rawText = allLines.join('\n');
  return { lines: allLines, pageCount: pdf.numPages, rawText };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseNum(s: string): number | null {
  if (!s) return null;
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? null : n;
}

/** Ambil SEMUA angka dari sebuah baris teks */
function extractNums(line: string): number[] {
  return [...line.matchAll(/(\d{1,4}(?:[.,]\d{1,4})?)/g)]
    .map(m => parseNum(m[1]))
    .filter((n): n is number => n !== null);
}

/**
 * Ambil angka dari teks SETELAH posisi keyword ditemukan.
 * Ini kunci utama agar "1. Tes Wawasan Kebangsaan (TWK) 120"
 * tidak mengambil angka "1" (prefix nomor urut), melainkan "120".
 */
function extractNumsAfterKeyword(line: string, kwPattern: RegExp): number[] {
  const match = line.match(kwPattern);
  if (!match || match.index === undefined) return [];
  const afterText = line.slice(match.index + match[0].length);
  return extractNums(afterText);
}

/** Detect instansi name AND kode dari baris-baris awal PDF */
function detectInstansi(lines: string[]): { nm: string; kode: string } {
  for (const line of lines.slice(0, 60)) {
    if (line.startsWith('---PAGE')) continue;
    // Format BKN: "Instansi : 4008 - Badan Pemeriksa Keuangan 154"
    const m = line.match(/Instansi\s*:?\s*(\d+)\s*-\s*(.+?)(?:\s+\d+)?$/i);
    if (m) return { kode: m[1].trim(), nm: m[2].trim() };
    // Fallback: ambil nama dari baris yang tampak nama instansi
    if (/kementerian|badan|lembaga|komisi|mahkamah|kejaksaan|polri|tni\b|bps\b|bpk\b|pemerintah\s+kab/i.test(line)) {
      return { nm: line.trim(), kode: '' };
    }
  }
  return { nm: 'Tidak terdeteksi', kode: '' };
}

function detectTahun(rawText: string): number {
  const m = rawText.match(/cpns\s*(202[3-9])|pengadaan\s*(202[3-9])/i);
  if (m) return parseInt(m[1] ?? m[2]);
  const m2 = rawText.match(/\b(202[3-9])\b/);
  return m2 ? parseInt(m2[1]) : 2024;
}

// ─── State machine per orang ──────────────────────────────────────────────────

interface PersonAcc {
  twk: number | null;
  tiu: number | null;
  tkp: number | null;
  skdTotal: number | null;
  // SKB: kita hanya butuh total akhir SKB (Skor SKB pada skala 100)
  // Tidak perlu komponen per-instansi karena beda-beda
  skbTotal: number | null;      // ex: 77.63 (Skor SKB kolom "Total")
  skbDecimalsInSection: number[]; // semua desimal di SKB section untuk analisis
  nilaiAkhir: number | null;
  status: 'PL' | 'TL' | null;
  rank: number;
  rawLine: string;
}

function emptyPerson(rank: number): PersonAcc {
  return {
    twk: null, tiu: null, tkp: null, skdTotal: null,
    skbTotal: null, skbDecimalsInSection: [],
    nilaiAkhir: null, status: null, rank, rawLine: '',
  };
}

// ─── Main Parser ──────────────────────────────────────────────────────────────

export async function parsePGFromPDF(
  file: File,
  onProgress?: (page: number, total: number) => void,
): Promise<ParsedPGResult> {
  const { lines, pageCount, rawText } = await extractTextFromPDF(file, onProgress);

  const instansiInfo = detectInstansi(lines);
  const tahun = detectTahun(rawText);

  // ── State jabatan aktif
  let curJabatan = '';
  let curKodeJabatan = '';   // ex: "JP4291391"
  let curPendidikan = '';
  let curFormasi = 'Umum';
  let curLokasi = '';

  // instansi_kode & nm dari PDF header (sama untuk seluruh file)
  const instansi_kode = instansiInfo.kode;
  const instansi_nm   = instansiInfo.nm;

  // ── Akumulator per orang
  let personRank = 0;
  let person: PersonAcc = emptyPerson(0);
  let personStarted = false;

  // ── Semua baris PG yang sudah di-flush
  const allRows: ParsedPGRow[] = [];

  // Blok per jabatan: kumpulkan person-person, flush ke allRows saat jabatan berubah
  let jabatanPersons: PersonAcc[] = [];

  const flushPerson = () => {
    if (!personStarted) return;
    if (person.twk !== null || person.skbTotal !== null || person.nilaiAkhir !== null) {
      // Coba deduksi skbTotal dari decimals di section jika belum ditemukan
      if (person.skbTotal === null && person.skbDecimalsInSection.length >= 2) {
        // SKB total biasanya angka terbesar yang bukan nilai akhir (< nilaiAkhir)
        // dan > 30 (tidak mungkin SKB kontribusinya < 30)
        const candidates = person.skbDecimalsInSection
          .filter(n => n >= 30 && n <= 100 && n !== person.nilaiAkhir);
        if (candidates.length > 0) {
          person.skbTotal = Math.max(...candidates);
        }
      }
      jabatanPersons.push({ ...person });
    }
    personRank++;
    person = emptyPerson(personRank + 1);
    personStarted = false;
  };

  /**
   * Flush semua peserta yg terkumpul di jabatanPersons ke allRows.
   * Saat dipanggil akibat perubahan Pendidikan/Lokasi/Formasi,
   * gunakan parameter override agar data disimpan dengan state LAMA (sebelum update).
   */
  const flushJabatan = (
    snapshotPendidikan = curPendidikan,
    snapshotLokasi = curLokasi,
    snapshotFormasi = curFormasi,
  ) => {
    flushPerson();
    if (jabatanPersons.length === 0 || !curJabatan) {
      jabatanPersons = [];
      return;
    }

    // Cari P/L TERAKHIR sebelum T/L pertama muncul = passing grade sesungguhnya
    // BKN mengurutkan peserta dari nilai tertinggi ke terendah:
    //   [P/L, P/L, P/L (PG), T/L, T/L, ...]
    // "last P/L" di seluruh array bisa salah jika ada P/L sporadis setelah T/L
    // (misalnya THK-D atau kondisi khusus yang bisa meloloskan orang dengan syarat tertentu)
    const firstTLIdx = jabatanPersons.findIndex(p => p.status === 'TL');
    const pgCandidate = firstTLIdx > 0
      // Ada T/L → PG = P/L terakhir SEBELUM T/L pertama
      ? jabatanPersons.slice(0, firstTLIdx).filter(p => p.status === 'PL').at(-1)
      // Tidak ada T/L sama sekali → PG = P/L terakhir di seluruh blok
      : jabatanPersons.filter(p => p.status === 'PL').at(-1);

    jabatanPersons.forEach((p, idx) => {
      const isPG = pgCandidate !== undefined && p === pgCandidate;
      allRows.push({
        instansi_kode,
        instansi_nm,
        kode_jabatan: curKodeJabatan,
        jabatan_nm: curJabatan,
        pendidikan_nm: snapshotPendidikan,   // ← state LAMA
        formasi_nm: snapshotFormasi,         // ← state LAMA
        lokasi_nm: snapshotLokasi,           // ← state LAMA
        nilai_skd_twk: p.twk,
        nilai_skd_tiu: p.tiu,
        nilai_skd_tkp: p.tkp,
        // Prioritas: computed sum (selalu akurat jika 3 komponen ada)
        // Fallback: nilai yg diekstrak dari baris TIU (backup jika salah 1 komponen gagal)
        nilai_skd_total: (
          p.twk !== null && p.tiu !== null && p.tkp !== null
            ? p.twk + p.tiu + p.tkp   // ← PALING AKURAT: jumlah 3 komponen
            : p.skdTotal               // ← fallback dari baris TIU
        ),
        skb_raw: p.skbTotal !== null ? `SKB: ${p.skbTotal}` : '',
        skb_komponen: p.skbTotal !== null
          ? [{ nama: 'Skor SKB', nilai: p.skbTotal }]
          : [],
        nilai_skb_total: p.skbTotal,
        nilai_akhir: p.nilaiAkhir,
        rank: idx + 1,
        raw_line: p.rawLine,
        is_pg: isPG,
        status: p.status ?? 'TL',
      });
    });

    jabatanPersons = [];
    personRank = 0;
    person = emptyPerson(1);
    personStarted = false;
  };

  // ── Proses baris satu per satu
  for (const line of lines) {
    if (line.startsWith('---PAGE')) continue;

    const lo = line.toLowerCase();
    const nums = extractNums(line);

    // ── 1. HEADER JABATAN ─────────────────────────────────────────────────────
    // "Jabatan Formasi : JP4291391 - KONSELOR SDM 2"
    //                    └───── kode jabatan ────┘ └── nama jabatan ──┘
    const jabatanM = line.match(/Jabatan\s+Formasi\s*:?\s*([A-Z0-9]+)\s*-\s*(.+?)(?:\s+\d+\s*)?$/i);
    if (jabatanM) {
      flushJabatan();
      curKodeJabatan = jabatanM[1].trim();
      curJabatan     = jabatanM[2].replace(/\s+\d+$/, '').trim();
      curPendidikan  = '';  // reset, tunggu baris Pendidikan baru
      continue;
    }

    // "Jenis Formasi : 1 - UMUM 75"  — bisa berulang untuk jenis berbeda dalam jabatan sama
    const jenisM = line.match(/Jenis\s+Formasi\s*:?\s*\d+\s*-\s*(.+?)(?:\s+\d+\s*)?$/i);
    if (jenisM) {
      const rawJenis = jenisM[1].replace(/\s+\d+$/, '').trim();
      const fl = rawJenis.toLowerCase();
      let newFormasi = 'Umum'; // default
      // Guard: jika rawJenis cuma angka atau kosong (PDF menangkap count kolom) → tetap 'Umum'
      if (rawJenis && !/^\d+$/.test(rawJenis)) {
        if (fl.includes('cumlaude') || fl.includes('cum laude')) newFormasi = 'Cumlaude';
        else if (fl.includes('disabilitas') || fl.includes('thk-d')) newFormasi = 'Disabilitas';
        else if (fl.includes('putra') && fl.includes('papua')) newFormasi = 'Putra/i Papua';
        else if (fl.includes('putra') && fl.includes('kalimantan')) newFormasi = 'Putra/i Kalimantan';
        else if (fl.includes('diaspora')) newFormasi = 'Diaspora';
        else if (fl.includes('olahragawan')) newFormasi = 'Olahragawan';
        // Selain itu (UMUM, unknown) → stay 'Umum'
      }
      if (curFormasi !== newFormasi && jabatanPersons.length > 0) {
        flushJabatan(curPendidikan, curLokasi, curFormasi);
      }
      curFormasi = newFormasi;
      continue;
    }

    // "Lokasi Formasi : 40080183 - Regional Jawa 101" — lokasi beda = formasi beda
    const lokasiM = line.match(/Lokasi\s+Formasi\s*:?\s*\d+\s*-\s*(.+?)(?:\s+\d+\s*)?$/i);
    if (lokasiM) {
      const rawLokasi = lokasiM[1].replace(/\s+\d+$/, '').trim();
      // Validasi: lokasi harus punya teks bermakna (bukan hanya angka atau 1-2 karakter)
      // PDF kadang menangkap angka Jumlah kolom ("1","2") sebagai lokasi
      const newLokasi = rawLokasi.length > 2 && !/^\d+$/.test(rawLokasi) ? rawLokasi : '';
      if (curLokasi !== newLokasi && jabatanPersons.length > 0) {
        // Flush dengan state LAMA sebelum ganti lokasi
        flushJabatan(curPendidikan, curLokasi, curFormasi);
      }
      curLokasi = newLokasi;
      continue;
    }

    if (/^Pendidikan\b/i.test(line) && curJabatan) {
      // Regex menangani opsional titik dua "Pendidikan :" atau "Pendidikan "
      const pendM = line.match(/^Pendidikan\s*:?\s*(.+?)(?:\s+\d+\s*)?$/i);
      if (pendM) {
        const rawPend = pendM[1].replace(/\s+\d+$/, '').trim();
        // Guard: hindari parser menangkap angka kolom ("1", "2") sebagai pendidikan
        if (/^\d+$/.test(rawPend) || rawPend.length <= 2) {
          continue; // Abaikan baris ini, tunggu baris pendidikan yang sesungguhnya
        }
        
        // Membersihkan prefix dash "-" jika ada (misal: "Pendidikan : - S-1...")
        const newPend = rawPend.replace(/^-\s*/, '');

        if (curPendidikan && curPendidikan !== newPend && jabatanPersons.length > 0) {
          flushJabatan(curPendidikan, curLokasi, curFormasi);
        }
        curPendidikan = newPend;
      }
      continue;
    }

    if (!curJabatan) continue;
    if (/halaman|informasi hasil|per sub nilai|per jenis seleksi|total nilai akhir|subtotal|keterangan|no peserta|tanggal lahir|tanggal daftar/i.test(lo)) continue;
    if (/seleksi kompetensi dasar|seleksi kompetensi bidang|skor skd|skala 100|bobot 40|bobot 60|nilai\/ipk/i.test(lo)) continue;

    // ── 2. TWK — MARKER ORANG BARU (format daftar BKN/BPK) ────────────────────
    if (/wawasan kebangsaan|\bTWK\b/i.test(line)) {
      if (/\bTIU\b.{0,25}\bTKP\b/i.test(line) || /\bTKP\b.{0,25}\bTIU\b/i.test(line)) continue;
      flushPerson();
      personStarted = true;
      person = emptyPerson(personRank + 1);
      // Ambil angka SETELAH keyword TWK atau "Wawasan Kebangsaan"
      const afterNums = extractNumsAfterKeyword(line, /wawasan kebangsaan|\(?TWK\)?/i);
      // TWK range: 0-150 (BKN max TWK = 150)
      const twkVal = afterNums.find(n => n >= 0 && n <= 150);
      person.twk = twkVal ?? null;
      continue;
    }

    // ── HELPER: Quartet SKD extractor — universal untuk SEMUA format PDF ────────
    // Prinsip matematis BKN: TWK + TIU + TKP = Total (berlaku tanpa terkecuali)
    // - Format BKN/BPK: baris P/L tidak punya integer trio valid → quartet = null (aman)
    // - Format Tabel (DKI, dll): semua nilai ada di 1 baris P/L → quartet berhasil
    const extractSKDQuartet = (src: string) => {
      // Hanya ambil token integer murni 1-3 digit (bukan desimal, bukan tahun 4 digit)
      const ints = src.split(/\s+/).filter(t => /^\d{1,3}$/.test(t)).map(Number);
      for (let i = 0; i <= ints.length - 4; i++) {
        const [a, b, c, d] = ints.slice(i, i + 4);
        // TWK ≤0-150 | TIU ≤0-175 | TKP 76-225 | Total = a+b+c
        // Minimum total 286 (ambang BKN THK-D/Disabilitas, lebih rendah dari UMUM=311)
        // Ini mencegah false positive dari angka halaman/kolom/tanggal
        if (a <= 150 && b <= 175 && c >= 76 && c <= 225 && a + b + c === d && d >= 286)
          return { twk: a, tiu: b, tkp: c, skdTotal: d };
      }
      return null;
    };

    // Guard: jika belum ada orang aktif DAN baris ini bukan P/L/TL → skip
    // (baris P/L diizinkan lewat untuk ditangani unified handler di bawah)
    if (!personStarted && !/\bP\s*\/\s*L\b|\bT\s*\/\s*L\b/i.test(line)) continue;

    // ── 3. TIU ───────────────────────────────────────────────────────────────
    // "2. Tes Intelegensia Umum (TIU)  165  483  87.818  35.127"
    // ⚠️ SAMA: angka "2." harus diabaikan!
    if (/intelegensia umum|\bTIU\b/i.test(line)) {
      const afterNums = extractNumsAfterKeyword(line, /intelegensia umum|\(?TIU\)?/i);
      // TIU range: 0-175
      person.tiu = afterNums.find(n => n >= 0 && n <= 175) ?? null;
      // SKD total tercetak di baris TIU sebagai integer TWK+TIU+TKP (range 150-600)
      const tiuVal = person.tiu;
      const skdCandidate = afterNums.find(n =>
        n >= 150 && n <= 600 && Number.isInteger(n) && n !== tiuVal
      );
      if (skdCandidate) {
        // Validasi: kandidat harus >= TWK + TIU + TKP_min(76)
        // Kalau TWK sudah ada, kita bisa cek minimum yg masuk akal
        const minPlausible = (person.twk ?? 0) + (tiuVal ?? 0) + 76;
        if (skdCandidate >= minPlausible) person.skdTotal = skdCandidate;
      }
      continue;
    }

    // ── 4. TKP ───────────────────────────────────────────────────────────────
    // "3. Tes Karakteristik Pribadi (TKP)  198"
    // ⚠️ SAMA: angka "3." harus diabaikan!
    if (/karakteristik pribadi|\bTKP\b/i.test(line)) {
      const afterNums = extractNumsAfterKeyword(line, /karakteristik pribadi|\(?TKP\)?/i);
      // TKP range: 76-225 (BKN minimum TKP 76, max 225)
      // Min 76 menghindari angka kecil (nomor halaman, urutan, dll) terbaca sebagai TKP
      person.tkp = afterNums.find(n => n >= 76 && n <= 225) ?? null;
      continue;
    }

    // ── 5. SKB SECTION — kumpulkan semua desimal, cari total SKB ──────────────
    // Format BKN: baris komponen punya pola: "N - NamaKomp  [nilai]  [skala100]  [bobot%]  [kontribusi]"
    // SKB total muncul di SALAH SATU baris komponen: "N - Nama  [...]  [skb_total]  [skb_bobot60]"
    // Kita tidak perlu tahu komponen-komponennya, cukup total SKB-nya
    const skbCompM = line.match(/^\d+\s*[-–]\s*\S/);
    if (skbCompM && personStarted) {
      // Kumpulkan semua desimal di baris ini
      const decNums = [...line.matchAll(/(\d{1,3}[.,]\d{2,4})/g)]
        .map(m => parseNum(m[1]))
        .filter((n): n is number => n !== null && n > 0);
      
      decNums.forEach(n => person.skbDecimalsInSection.push(n));

      // Heuristik deteksi SKB total:
      // Baris yang punya 5+ angka biasanya punya (skb_total, skb_bobot60) di akhir
      // skb_total biasanya 30-100, dan skb_bobot60 = skb_total * 0.6 (dalam toleransi)
      if (decNums.length >= 5) {
        // Cari pair (a, b) di mana b ≈ a * 0.6 (toleransi 2%)
        for (let di = decNums.length - 2; di >= 0; di--) {
          const a = decNums[di];
          const b = decNums[di + 1];
          if (a >= 30 && a <= 100 && Math.abs(b - a * 0.6) < a * 0.05) {
            person.skbTotal = a;
            break;
          }
        }
      }
      continue;
    }

    // ── 6. P/L atau T/L — UNIVERSAL HANDLER (BKN list + tabel + format baru) ──
    const hasPL = /\bP\s*\/\s*L\b/i.test(line);
    const hasTL = /\bT\s*\/\s*L\b/i.test(line);

    if (hasPL || hasTL) {
      // Nilai akhir & desimal (SKB) — sama untuk semua format
      const decNums = [...line.matchAll(/(\d{2,3}[.,]\d{2,5})/g)]
        .map(m => parseNum(m[1]))
        .filter((n): n is number => n !== null && n >= 20 && n <= 200);
      const nilaiAkhir = decNums.length > 0 ? Math.max(...decNums) : null;

      if (personStarted) {
        // ── FORMAT DAFTAR (BKN/BPK): person sudah diakumulasi dari baris keyword
        person.status = hasPL ? 'PL' : 'TL';
        person.rawLine = line;
        if (nilaiAkhir !== null) person.nilaiAkhir = nilaiAkhir;
        // BONUS: jika keyword parsing ada yang bolong, coba quartet sebagai tambalan
        const q = extractSKDQuartet(line);
        if (q) {
          if (person.twk === null) person.twk = q.twk;
          if (person.tiu === null) person.tiu = q.tiu;
          if (person.tkp === null) person.tkp = q.tkp;
          if (person.skdTotal === null) person.skdTotal = q.skdTotal;
        }
      } else {
        // ── FORMAT TABEL / FORMAT BARU: tidak ada personStarted
        // Coba quartet extraction — jika berhasil, push langsung ke jabatanPersons
        const q = extractSKDQuartet(line);
        if (q && curJabatan) {
          // SKB: cari pair (a, b) di mana b ≈ a × 0.6
          let skbTotal: number | null = null;
          const skbCands = decNums.filter(n => n >= 30 && n <= 100 && n !== nilaiAkhir);
          for (let si = 0; si < skbCands.length - 1; si++) {
            const a = skbCands[si], b = skbCands[si + 1];
            if (Math.abs(b - a * 0.6) < a * 0.06) { skbTotal = a; break; }
          }
          personRank++;
          jabatanPersons.push({
            twk: q.twk, tiu: q.tiu, tkp: q.tkp, skdTotal: q.skdTotal,
            skbTotal, skbDecimalsInSection: decNums, nilaiAkhir,
            status: hasPL ? 'PL' : 'TL', rank: personRank, rawLine: line,
          });
        }
        // Jika quartet tidak berhasil (format benar-benar tidak dikenal), abaikan baris ini
      }
      continue;
    }

    // ── 7. Fallback: cek jika ada angka desimal yg tampak nilai akhir ─────────
    // Kadang nilai akhir ada di baris terpisah setelah SKB selesai
    if (nums.length === 1 && /^\d{2,3}[.,]\d{2,5}$/.test(line.trim()) && person.status) {
      const n = parseNum(line.trim());
      if (n && n > 0 && n <= 200) person.nilaiAkhir = n;
    }
  }

  // Flush terakhir
  flushJabatan();

  return {
    instansi_hint: instansi_nm,
    tahun,
    rows: allRows,
    raw_text_preview: rawText.slice(0, 3000),
    all_lines_preview: lines.slice(0, 300).join('\n'),
    page_count: pageCount,
  };
}
