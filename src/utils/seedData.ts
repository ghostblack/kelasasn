import { collection, addDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const seedTryoutPackages = async () => {
  const tryoutsRef = collection(db, 'tryout_packages');

  const existingQuery = query(tryoutsRef, limit(1));
  const existingDocs = await getDocs(existingQuery);

  if (existingDocs.size > 0) {
    console.log('Try out packages already seeded');
    return;
  }

  const packages = [
    {
      name: 'Try Out SKD Gratis',
      description: 'Try out gratis untuk latihan dasar SKD CPNS 2026',
      price: 0,
      originalPrice: 25000,
      category: 'free',
      type: 'SKD',
      features: [
        'Soal Terbaru Sesuai FR 2024',
        'Pembahasan Detail',
        'Ranking Seluruh Indonesia',
      ],
      totalDuration: 110,
      twkQuestions: 30,
      tiuQuestions: 35,
      tkpQuestions: 45,
      totalQuestions: 110,
      passingGradeTWK: 65,
      passingGradeTIU: 80,
      passingGradeTKP: 166,
      questionIds: [],
      isActive: true,
      createdAt: new Date(),
    },
    {
      name: 'TRY OUT SKD PREMIUM - PART 1 KELAS ASN',
      description: 'Paket Premium Try Out SKD 2026 (Part 1, 2, & 3) ini dirancang khusus oleh Tim Kelas ASN...',
      price: 15000,
      originalPrice: 30000,
      category: 'premium',
      type: 'SKD',
      features: [
        'Soal Terbaru Sesuai FR 2024',
        'Pembahasan Detail Setiap Soal',
        'Ranking Seluruh Indonesia',
        'Akses Selama 30 Hari',
      ],
      totalDuration: 110,
      twkQuestions: 30,
      tiuQuestions: 35,
      tkpQuestions: 45,
      totalQuestions: 110,
      passingGradeTWK: 65,
      passingGradeTIU: 80,
      passingGradeTKP: 166,
      questionIds: [],
      isActive: true,
      isEarlyBirdActive: false,
      createdAt: new Date(),
    },
    {
      name: 'TRY OUT SKD PREMIUM - PART 2 KELAS ASN',
      description: 'Paket Premium Try Out SKD 2026 (Part 1, 2, & 3) ini dirancang khusus oleh Tim Kelas ASN...',
      price: 15000,
      originalPrice: 30000,
      category: 'premium',
      type: 'SKD',
      features: [
        'Simulasi CAT BKN Asli',
        'Soal Terbaru Sesuai FR 2024',
        'Pembahasan Detail Video',
        'Ranking Real-time',
      ],
      totalDuration: 100,
      twkQuestions: 30,
      tiuQuestions: 35,
      tkpQuestions: 45,
      totalQuestions: 110,
      passingGradeTWK: 65,
      passingGradeTIU: 80,
      passingGradeTKP: 166,
      questionIds: [],
      isActive: true,
      isEarlyBirdActive: false,
      createdAt: new Date(),
    },
    {
      name: 'TRY OUT SKD PREMIUM - PART 3 KELAS ASN',
      description: 'Paket Premium Try Out SKD 2026 (Part 1, 2, & 3) ini dirancang khusus oleh Tim Kelas ASN...',
      price: 15000,
      originalPrice: 30000,
      category: 'premium',
      type: 'SKD',
      features: [
        'Soal Update 2026',
        'Pembahasan Super Cepat',
        'Ranking Nasional Terkini',
      ],
      totalDuration: 100,
      twkQuestions: 30,
      tiuQuestions: 35,
      tkpQuestions: 45,
      totalQuestions: 110,
      passingGradeTWK: 65,
      passingGradeTIU: 80,
      passingGradeTKP: 166,
      questionIds: [],
      isActive: true,
      isEarlyBirdActive: false,
      createdAt: new Date(),
    },
    {
      name: 'PREMIUM ULTIMATE BUNDLING',
      description: '"Senjata Terlengkap untuk Lolos CPNS 2026 dalam Satu Genggaman" Ini bukan sekadar Try...',
      price: 20000,
      originalPrice: 60000,
      category: 'premium',
      type: 'BOTH',
      isBundle: true,
      isEarlyBirdActive: true,
      earlyBirdPrice: 20000,
      earlyBirdQuota: 200,
      currentSales: 15,
      features: [
        'Semua Try Out SKD Premium',
        'Akses Fitur VIP Instansi & Formasi',
        'Analisis Peluang Kelulusan AI',
        'Akses Selama 1 Tahun',
      ],
      totalDuration: 100,
      twkQuestions: 30,
      tiuQuestions: 35,
      tkpQuestions: 45,
      totalQuestions: 110,
      passingGradeTWK: 65,
      passingGradeTIU: 80,
      passingGradeTKP: 166,
      questionIds: [],
      isActive: true,
      createdAt: new Date(),
    },
  ];

  for (const pkg of packages) {
    await addDoc(tryoutsRef, pkg);
  }

  console.log('Try out packages seeded successfully');
};

export const seedJabatan = async () => {
  const jabatanRef = collection(db, 'jabatan');

  const existingQuery = query(jabatanRef, limit(1));
  const existingDocs = await getDocs(existingQuery);

  if (existingDocs.size > 0) {
    console.log('Jabatan already seeded');
    return;
  }

  const jabatan = [
    {
      kodeJabatan: 'TKN-2024-001',
      namaJabatan: 'Analis Sistem Informasi',
      instansi: 'Kementerian Komunikasi dan Informatika',
      formasi: 15,
      passingGrade: 350,
      kategori: 'Teknis',
      kualifikasi: [
        'S1 Teknik Informatika/Sistem Informasi',
        'IPK minimal 3.00',
        'Menguasai pemrograman dan database',
      ],
      relatedTryouts: [],
      createdAt: new Date(),
    },
    {
      kodeJabatan: 'KES-2024-002',
      namaJabatan: 'Dokter Umum',
      instansi: 'Kementerian Kesehatan',
      formasi: 50,
      passingGrade: 380,
      kategori: 'Kesehatan',
      kualifikasi: [
        'S1 Pendidikan Dokter + Profesi Dokter',
        'Memiliki STR aktif',
        'IPK minimal 2.75',
      ],
      relatedTryouts: [],
      createdAt: new Date(),
    },
    {
      kodeJabatan: 'PDK-2024-003',
      namaJabatan: 'Guru SD',
      instansi: 'Kementerian Pendidikan dan Kebudayaan',
      formasi: 100,
      passingGrade: 330,
      kategori: 'Pendidikan',
      kualifikasi: [
        'S1 Pendidikan Guru Sekolah Dasar (PGSD)',
        'Memiliki sertifikat pendidik',
        'IPK minimal 2.75',
      ],
      relatedTryouts: [],
      createdAt: new Date(),
    },
    {
      kodeJabatan: 'TKN-2024-004',
      namaJabatan: 'Teknisi Jaringan',
      instansi: 'Badan Siber dan Sandi Negara',
      formasi: 20,
      passingGrade: 360,
      kategori: 'Teknis',
      kualifikasi: [
        'D3/S1 Teknik Informatika/Jaringan',
        'Memiliki sertifikasi jaringan (CCNA/MTCNA)',
        'Pengalaman troubleshooting jaringan',
      ],
      relatedTryouts: [],
      createdAt: new Date(),
    },
    {
      kodeJabatan: 'KES-2024-005',
      namaJabatan: 'Perawat Ahli Pertama',
      instansi: 'Rumah Sakit Umum Daerah',
      formasi: 35,
      passingGrade: 340,
      kategori: 'Kesehatan',
      kualifikasi: [
        'D3/S1 Keperawatan',
        'Memiliki STR Perawat aktif',
        'Pengalaman kerja minimal 1 tahun',
      ],
      relatedTryouts: [],
      createdAt: new Date(),
    },
    {
      kodeJabatan: 'UMU-2024-006',
      namaJabatan: 'Analis Kebijakan Publik',
      instansi: 'Badan Perencanaan Pembangunan Nasional',
      formasi: 10,
      passingGrade: 370,
      kategori: 'Umum',
      kualifikasi: [
        'S1 Administrasi Publik/Ilmu Pemerintahan',
        'IPK minimal 3.00',
        'Kemampuan analisis dan riset yang baik',
      ],
      relatedTryouts: [],
      createdAt: new Date(),
    },
    {
      kodeJabatan: 'TKN-2024-007',
      namaJabatan: 'Pranata Komputer',
      instansi: 'Kementerian Dalam Negeri',
      formasi: 25,
      passingGrade: 345,
      kategori: 'Teknis',
      kualifikasi: [
        'D3/S1 Teknik Informatika',
        'Menguasai bahasa pemrograman',
        'Familiar dengan sistem operasi Linux/Windows Server',
      ],
      relatedTryouts: [],
      createdAt: new Date(),
    },
    {
      kodeJabatan: 'PDK-2024-008',
      namaJabatan: 'Dosen',
      instansi: 'Universitas Negeri Jakarta',
      formasi: 12,
      passingGrade: 385,
      kategori: 'Pendidikan',
      kualifikasi: [
        'S2/S3 sesuai bidang keilmuan',
        'IPK minimal 3.25',
        'Memiliki publikasi ilmiah',
      ],
      relatedTryouts: [],
      createdAt: new Date(),
    },
    {
      kodeJabatan: 'KES-2024-009',
      namaJabatan: 'Apoteker',
      instansi: 'Dinas Kesehatan Provinsi',
      formasi: 18,
      passingGrade: 365,
      kategori: 'Kesehatan',
      kualifikasi: [
        'S1 Farmasi + Profesi Apoteker',
        'Memiliki STRA aktif',
        'IPK minimal 2.75',
      ],
      relatedTryouts: [],
      createdAt: new Date(),
    },
    {
      kodeJabatan: 'UMU-2024-010',
      namaJabatan: 'Auditor',
      instansi: 'Badan Pemeriksa Keuangan',
      formasi: 30,
      passingGrade: 375,
      kategori: 'Umum',
      kualifikasi: [
        'S1 Akuntansi/Manajemen Keuangan',
        'IPK minimal 3.00',
        'Memiliki sertifikasi auditor (QIA/CA)',
      ],
      relatedTryouts: [],
      createdAt: new Date(),
    },
  ];

  for (const item of jabatan) {
    await addDoc(jabatanRef, item);
  }

  console.log('Jabatan seeded successfully');
};

export const seedAllData = async () => {
  try {
    console.log('Starting data seeding...');
    await seedTryoutPackages();
    await seedJabatan();
    console.log('All data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    throw error;
  }
};
