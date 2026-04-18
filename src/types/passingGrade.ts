import { Timestamp } from 'firebase/firestore';

// Komponen SKB bisa berbeda tiap instansi (CAT BKN, wawancara, psikotes, dll)
export interface SKBKomponen {
  nama: string;       // ex: "CAT BKN", "Wawancara", "Psikotes SKB"
  nilai: number;      // nilai komponen
  bobot?: number;     // bobot persentase kalau ada (ex: 40)
}

export interface PassingGrade {
  id?: string;

  // === Identifikasi Formasi (match dengan API BKN) ===
  instansi_kode: string;        // ex: "4008" — kode numerik instansi dari PDF
  instansi_nm: string;          // ex: "Badan Pemeriksa Keuangan"
  kode_jabatan: string;         // ex: "JP4291391" — kode jabatan dari PDF (key match API)
  jabatan_nm: string;           // ex: "KONSELOR SDM"
  pendidikan_nm: string;        // ex: "S-1 PSIKOLOGI"
  formasi_nm: string;           // ex: "Umum", "Cumlaude", "Disabilitas", "Putra/i Papua"
  lokasi_nm?: string;           // ex: "Regional Jawa" (opsional)

  // === Data Nilai CPNS 2024 ===
  tahun: number;                // 2024

  // SKD (Seleksi Kompetensi Dasar)
  nilai_skd_twk: number | null; // Tes Wawasan Kebangsaan
  nilai_skd_tiu: number | null; // Tes Intelegensia Umum
  nilai_skd_tkp: number | null; // Tes Karakteristik Pribadi
  nilai_skd_total: number | null;

  // SKB (Seleksi Kompetensi Bidang) - fleksibel per komponen
  skb_komponen: SKBKomponen[];  // list komponen SKB (bisa 1 atau lebih)
  nilai_skb_total: number | null; // Nilai akhir SKB (terintegrasi)

  // Nilai Akhir
  nilai_akhir: number | null;   // Nilai integrasi akhir

  // === Metadata ===
  sumber_pdf: string;           // Nama file PDF sumber
  catatan?: string;             // Catatan tambahan
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

export type PassingGradeInput = Omit<PassingGrade, 'id' | 'created_at' | 'updated_at'>;

export const FORMASI_NM_OPTIONS = [
  'Umum',
  'Cumlaude',
  'Disabilitas',
  'Putra/i Papua',
  'Putra/i Papua Barat',
  'Diaspora',
];

export const SKB_KOMPONEN_PRESETS: Record<string, string[]> = {
  'CAT BKN': ['CAT BKN'],
  'CAT + Wawancara': ['CAT BKN', 'Wawancara'],
  'CAT + Psikotes': ['CAT BKN', 'Psikotes SKB'],
  'CAT + Wawancara + Psikotes': ['CAT BKN', 'Wawancara', 'Psikotes SKB'],
  'Portofolio': ['Portofolio'],
  'Custom': [],
};
