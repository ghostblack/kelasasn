export type ReviewCulture = 'green' | 'red' | 'neutral';

export interface InstansiReview {
  matcher: (nama: string) => boolean; // Function to match instansi name
  rating: number; // 1.0 to 5.0
  culture: ReviewCulture;
  summary: string;
  pros: string[];
  cons: string[];
}

export const INSTANSI_REVIEWS: InstansiReview[] = [
  {
    matcher: (n) => typeof n === 'string' && (n.includes('KEMENTERIAN KEUANGAN') || n.includes('KEUANGAN NEGARA')),
    rating: 4.8,
    culture: 'green',
    summary: 'Instansi "Sultan" dengan penghasilan tertinggi (Tukin/Kinerja), jenjang karir jelas, tapi beban kerja sangat tinggi dan aturan disiplin ketat.',
    pros: ['Gaji & Tukin tertinggi di antara K/L lain', 'Sistem IT dan fasilitas kerja sangat memadai', 'Beasiswa dan pengembangan diri terbuka lebar'],
    cons: ['Beban kerja dan tekanan sangat tinggi', 'Sering lembur di masa-masa tutup buku / pelaporan', 'Mutasi bisa ke seluruh pelosok Indonesia']
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('PEMERINTAH PROVINSI DKI JAKARTA')),
    rating: 4.9,
    culture: 'green',
    summary: 'Pemda dengan TPP tertinggi se-Indonesia. Anggaran melimpah, kesejahteraan terjamin tanpa perlu pindah pulau.',
    pros: ['Tambahan Penghasilan Pegawai (TPP) nomor 1 di Indonesia', 'Lokasi kerja tetap di ibukota (tidak akan dimutasi ke daerah terpencil)', 'Fasilitas kesehatan & transportasi pegawai terjamin'],
    cons: ['Biaya hidup Jakarta yang tinggi', 'Persaingan internal cukup ketat', 'Birokrasi pemda yang terkadang kaku']
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('KEMENTERIAN LUAR NEGERI')),
    rating: 4.7,
    culture: 'green',
    summary: 'Pilihan prestisius bagi yang ingin bekerja dalam lingkup internasional. Prestise tinggi tapi menuntut komitmen penempatan di luar negeri.',
    pros: ['Peluang penempatan di luar negeri (Diplomat)', 'Jaringan dan wawasan global', 'Tunjangan penghidupan luar negeri yang besar saat penugasan'],
    cons: ['Proses seleksi sangat panjang dan sulit', 'Harus siap ditempatkan di negara konflik/berbahaya', 'Jauh dari keluarga besar jika ditugaskan di luar']
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('KEMENTERIAN HUKUM DAN HAK ASASI MANUSIA') || n.includes('KEMENKUMHAM')),
    rating: 4.0,
    culture: 'neutral',
    summary: 'Instansi dengan formasi terbanyak tiap tahunnya, khususnya penjaga tahanan. Tukin standar, namun lingkungan kerja bervariasi tergantung satker.',
    pros: ['Formasi lulusan SMA/SMK sangat banyak', 'Penyebaran lokasi kerja merata dari Aceh hingga Papua', 'Solidaritas korps yang kuat'],
    cons: ['Lingkungan kerja (khususnya Lapas) bisa sangat rawan dan stres tinggi', 'Penempatan awal seringkali jauh dari daerah asal', 'Birokrasi hierarkis dan semi-militeristik di beberapa unit']
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('BADAN PENGAWASAN KEUANGAN DAN PEMBANGUNAN') || n.includes('BPKP')),
    rating: 4.5,
    culture: 'green',
    summary: 'Lembaga auditor internal negara dengan tukin kategori elit (Cat 5). Sangat cocok untuk akuntan/auditor dengan prospek cerah.',
    pros: ['Tukin sangat tinggi (Tier Adipati)', 'Pekerjaan berbasis kompetensi dan keahlian jelas (Auditor)', 'Fasilitas diklat sangat bagus'],
    cons: ['Beban audit akhir tahun bisa sangat menyita waktu', 'Risiko pekerjaan auditor (ancaman/intimidasi dari pihak yang diaudit)', 'Sering dinas luar kota meninggalkan keluarga']
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('KEMENTERIAN AGAMA')),
    rating: 3.8,
    culture: 'neutral',
    summary: 'Kementerian raksasa dengan kantor hingga tingkat kecamatan (KUA). Kesejahteraan menengah ke bawah, tapi sangat stabil dan dekat dengan masyarakat.',
    pros: ['Lokasi kerja bisa sangat dekat (Tingkat KUA/Kabupaten)', 'Lingkungan kerja lebih santai dan religius', 'Sangat stabil dan minim gejolak'],
    cons: ['Tukin relatif lebih rendah dibanding kementerian strategis lain', 'Sistem mutasi dan promosi berbasis senioritas masih terasa', 'Anggaran operasional per satker kecil terbatas']
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('PENGADILAN') || n.includes('MAHKAMAH AGUNG')),
    rating: 4.6,
    culture: 'green',
    summary: 'Bagi Calon Hakim (Cakim), ini adalah posisi prestisius dengan gaji dan tunjangan yang sangat besar setelah diangkat. Staf non-hakim memiliki standar tukin menengah.',
    pros: ['Tunjangan jabatan Hakim sangat tinggi', 'Prestise sosial yang luar biasa di masyarakat', 'Fasilitas dinas (rumah, kendaraan) untuk level pimpinan hakim penuh'],
    cons: ['Sering dimutasi antar pengadilan di seluruh pelosok negeri secara berkala', 'Beban mental memutus perkara yang berat', 'Staf non-hakim/panitera terkadang beban administrasinya tinggi']
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('PEMERINTAH KOTA') || n.includes('PEMERINTAH KABUPATEN')),
    rating: 3.5,
    culture: 'neutral',
    summary: 'Kehidupan ASN khas daerah. TPP sangat fluktuatif bervariasi tergantung Pendapatan Asli Daerah (PAD) masing-masing.',
    pros: ['Work-Life Balance umumnya sangat baik', 'Bisa mendaftar di daerah asal (tidak merantau)', 'Lingkungan sosial masyarakat lebih guyub dan saling kenal'],
    cons: ['TPP (pengganti Tukin) bisa sangat kecil di daerah terpencil', 'Fasilitas kerja dan IT di bawah standar pusat', 'Kuatnya pengaruh politik lokal (Pilkada) dalam rotasi/promosi jabatan']
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('KEMENTERIAN PEKERJAAN UMUM') || n.includes('PUPR')),
    rating: 4.3,
    culture: 'neutral',
    summary: 'Kementerian teknis ujung tombak pembangunan infrastruktur. Cocok untuk insinyur sipil yang tahan banting kerja lapangan.',
    pros: ['Tukin berada di tier atas', 'Kepuasan batin melihat hasil kerja fisik (jembatan, jalan, bendungan)', 'Kesempatan terlibat proyek strategis nasional'],
    cons: ['Kerja lapangan yang panas, berdebu, dan menguras fisik', 'Jam kerja proyek tidak menentu (sering lembur ngejar target)', 'Risiko mutasi ke site terpencil/site pembangunan']
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('KOMISI PEMILIHAN UMUM') || n.includes('KPU')),
    rating: 4.0,
    culture: 'neutral',
    summary: 'Lembaga penyelenggara Pemilu. Beban kerjanya sangat musiman dan berfluktuasi secara ekstrem antara tahun biasa dan tahun politik.',
    pros: [
      'Beban kerja sangat santai dan jadwal longgar di luar tahapan Pemilu/Pilkada', 
      'Terdapat insentif/honor tambahan saat pelaksanaan Pemilu', 
      'Sering mengadakan rapat/rakor di hotel saat persiapan tahapan'
    ],
    cons: [
      'Beban kerja fisik & mental sangat ekstrem (24/7) saat tahapan Pemilu menurut UU (Red Flag)', 
      'Risiko tekanan politik dan hukum dari peserta Pemilu yang sangat tinggi', 
      'Rawan dilaporkan ke DKPP jika terjadi kesalahan teknis sekecil apapun'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('BADAN PENGAWAS PEMILIHAN UMUM') || n.includes('BAWASLU')),
    rating: 3.9,
    culture: 'neutral',
    summary: 'Lembaga pengawas proses demokrasi. Karakternya mirip dengan KPU: sangat sibuk musiman.',
    pros: [
      'Beban kerja santai di luar tahun Pemilu', 
      'Kewenangan besar dalam menindak pelanggaran (rasa memiliki power)', 
      'Tidak se-melelahkan KPU dalam hal teknis logistik/cetak surat suara'
    ],
    cons: [
      'Lembur ekstrem dan tekanan tinggi saat tahapan Pemilu', 
      'Sering berhadapan langsung dengan peserta Pemilu yang marah / tidak terima', 
      'Tukin masih di kategori standar menengah'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('KEJAKSAAN AGUNG') || n.includes('KEJAKSAAN RI') || n.includes('KEJAKSAAN REPUBLIK')),
    rating: 4.7,
    culture: 'green',
    summary: 'Instansi penegak hukum prestisius selain Hakim. Sangat diincar sarjana hukum untuk posisi Pascasarjana/Calon Jaksa.',
    pros: [
      'Prestise sosial dan wibawa di masyarakat sangat tinggi (Seragam Jaksa)', 
      'Tunjangan jabatan Jaksa cukup besar selain gaji pokok', 
      'Power dan koneksi yang luas di wilayah penempatan'
    ],
    cons: [
      'Gaya birokrasi semi-militeristik, hierarki senioritas masih sangat kental', 
      'Mutasi mutlak seluruh Indonesia, sering pindah pindah cabang (Kejari/Kejati)', 
      'Risiko ancaman/intervensi dalam penanganan kasus kakap'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('AGRARIA DAN TATA RUANG') || n.includes('BPN')),
    rating: 4.2,
    culture: 'neutral',
    summary: 'Kementerian teknis yang sehari-hari urus sertifikat dan sengketa tanah masyarakat. Kerja pelayanan langsung.',
    pros: [
      'Standar kesejahteraan lumayan tinggi (Tukin kategori atas)', 
      'Ada penghasilan tambahan sah (Uang Sidang, Uang Ukur/Panitia Tanah)', 
      'Ilmu pertanahan sangat berguna untuk kehidupan pribadi'
    ],
    cons: [
      'Beban kerja super sibuk melayani masyarakat (Target PTSL, dll)', 
      'Rawan komplain hingga dimarahi masyarakat jika proses lambat', 
      'Risiko sengketa hukum perdata di pengadilan TUN akibat tumpang tindih lahan'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('BADAN PUSAT STATISTIK') || n.includes('BPS')),
    rating: 4.1,
    culture: 'neutral',
    summary: 'Instansi yang hidupnya bergelut dengan data. Cocok untuk yang teliti dan tipe pekerja di belakang layar.',
    pros: [
      'Budaya kerja jelas, terukur, dan saintifik', 
      'Lokasi kantor tersedia hingga level Kabupaten/Kota (tidak harus merantau jauh)', 
      'Cukup santai jika tidak sedang musim sensus nasional'
    ],
    cons: [
      'Kerja lapangan wajib dilakukan (naik gunung tembus hutan) saat musim Sensus/Survei Besar', 
      'Tenggat waktu pengumpulan data yang kaku & strict', 
      'Honor mitra statistik seringkali telat cair yang membuat pusing pengelola admin'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('METEOROLOGI, KLIMATOLOGI, DAN GEOFISIKA') || n.includes('BMKG')),
    rating: 3.8,
    culture: 'neutral',
    summary: 'Garda terdepan informasi cuaca, gempa, dan peringatan dini tsunami. Dibutuhkan keikhlasan menjaga keamanan negara dalam sunyi.',
    pros: [
      'Tugas mulia dan sangat vital bagi keselamatan jutaan orang', 
      'Ilmu yang spesifik dan kental dengan riset iklim/cuaca', 
      'Tidak berurusan langsung dengan konflik masyarakat/keuangan'
    ],
    cons: [
      'Sistem kerja shifting 24 jam sehari, 7 hari seminggu (termasuk hari raya)', 
      'Penempatan stasiun pengamat seringkali di pelosok terpencil (hutan/pantai terluar)', 
      'Gaji/Tukin standar di tengah tuntutan kesigapan 24 jam'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('BADAN PEMERIKSA KEUANGAN') || n.includes('BPK ')),
    rating: 4.8,
    culture: 'green',
    summary: 'Auditor Eksternal Negara "The Supreme Auditor". Pesaing Kemenkeu dalam hal kesejahteraan elit tertinggi di Indonesia.',
    pros: [
      'Tukin sangat tinggi dan elit (Kelas Kesultanan/Adipati tingkat atas)', 
      'Prestise sosial luar biasa sebagai pemeriksa kementerian dan pemda', 
      'Fasilitas, kendaraan dinas, dan penginapan saat penugasan sangat terjamin'
    ],
    cons: [
      'Risiko integritas tinggi (godaan suap saat memeriksa entitas daerah)', 
      'Mobilitas sangat tinggi (sering berpindah-pindah provinsi untuk mengaudit)', 
      'Tekanan kerja dan deadline Laporan Hasil Pemeriksaan (LHP) ketat'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('KOMISI PEMBERANTASAN KORUPSI') || n.includes('KPK')),
    rating: 4.9,
    culture: 'green',
    summary: 'Ujung tombak pemberantasan korupsi di Indonesia. Prestise integritas tanpa tanding namun menuntut pengorbanan sosial.',
    pros: [
      'Standar Gaji & Take Home Pay ASN KPK sangat tinggi (Sistem Single Salary)', 
      'Rasa bangga yang tak tergantikan menjaga negara dari koruptor', 
      'Sistem meritokrasi dan independensi kerja yang kuat'
    ],
    cons: [
      'Pengawasan integritas diri sendiri sangat ketat secara internal maupun publik', 
      'Risiko keselamatan diri dan keluarga (ancaman fisik maupun hukum pencemaran nama baik)', 
      'Pembatasan sosial kehidupan pribadi (tidak boleh bermewah-mewahan secara mencolok)'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('OTORITA IBU KOTA NUSANTARA') || n.includes('OTORITA IKN')),
    rating: 4.4,
    culture: 'neutral',
    summary: 'Pusat tonggak pembangunan ibu kota baru. Instansi eksklusif dengan target kerja "sprint" membangun peradaban.',
    pros: [
      'Kesejahteraan Otorita ditetapkan sangat tinggi di atas standar K/L biasa', 
      'Menjadi sejarah angkatan pertama yang merintis ibukota baru', 
      'Peluang karir progresif karena lembaganya masih baru dan butuh pemimpin muda'
    ],
    cons: [
      'Wajib bersedia pindah dan hidup permanen di IKN (Kalimantan Timur)', 
      'Beban kerja "sistem kejar tayang" untuk menyelesaikan grand design presiden', 
      'Fasilitas hiburan komersial di kota baru belum semasif Jakarta'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('BADAN INTELIJEN NEGARA') || n.includes('BIN')),
    rating: 4.5,
    culture: 'neutral',
    summary: 'Agen telik sandi rahasia milik sipil negara. Tidak dianjurkan bagi yang ingin "flexing" status ASN di media sosial.',
    pros: [
      'Karir eksklusif, jaringan elite nasional, dan informasi premium (Ring 1)', 
      'Tukin cukup tinggi ditambah tunjangan bahaya klandestin', 
      'Kesempatan operasi di berbagai spektrum politik dan ekonomi dalam/luar negeri'
    ],
    cons: [
      'Rahasia mutlak: Tidak bisa menceritakan pekerjaan ke keluarga sekalipun', 
      'Risiko infiltrasi dan ancaman yang sangat nyata (high-risk)', 
      'Disiplin super ketat layaknya militer'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('BADAN KEPEGAWAIAN NEGARA') || n.includes('BKN')),
    rating: 4.2,
    culture: 'green',
    summary: '"HRD-nya Negara". Instansi sentral yang menaungi seluruh kebijakan PNS di seluruh Indonesia dari rekrutmen hingga pensiun.',
    pros: [
      'Aturan terkait hak pegawai biasanya diimplementasikan paling disiplin di BKN sendiri', 
      'Work-life balance sangat terukur (kerja perkantoran/perumusan kebijakan)', 
      'Minimnya tekanan musuh publik/politik di luar musim perekrutan CPNS'
    ],
    cons: [
      'Beban kerja numpuk tinggi setiap kali musim pendaftaran CPNS/PPPK nasional dibuka', 
      'Sering menghadapi komplain PNS daerah/instansi lain yang masalah administrasinya tersendat', 
      'Anggaran tukin walau lumayan, tapi bukan level "Sultan" Kesultanan'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('BADAN SIBER DAN SANDI NEGARA') || n.includes('BSSN')),
    rating: 4.4,
    culture: 'green',
    summary: 'Lembaga pertahanan dunia maya. Surga untuk lulusan IT, Cyber Security, dan Kriptografi.',
    pros: [
      'Spesialisasi kemampuan IT sangat dihargai dan dimanfaatkan dengan baik', 
      'Banyak fasilitas pelatihan serangan siber bertaraf internasional', 
      'Nuansa kerja lebih modern (tech-savvy) dibanding kementerian konvensional'
    ],
    cons: [
      'Dituntut siaga 24 jam ketika infrastruktur nasional di-hack (Ransomware, dll)', 
      'Beban moral publik saat data warga negara bocor ke dark web', 
      'Karir struktural kadang terbatas jika latar belakang terlalu "tech" tanpa manajerial'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('PENDIDIKAN, KEBUDAYAAN') || n.includes('KEMENDIKBUD')),
    rating: 4.6,
    culture: 'green',
    summary: 'Sang pengatur pendidikan nasional. Banyak pelamar untuk posisi Dosen Universitas Negeri dan pegawai LLDIKTI.',
    pros: [
      'Bagi profesi Dosen: Flexibilitas waktu sangat tinggi dan prestige sosial', 
      'Kesempatan besar melanjutkan S2/S3 (Beasiswa & LPDP)', 
      'Lingkungan akademis yang mendorong inovasi (freedom to learn/research)'
    ],
    cons: [
      'Tukin staf birokrasi biasa (bukan dosen) masuk kategori umum Ksatria/Prajurit', 
      'Kewajiban publikasi jurnal bagi Dosen yang bisa bikin kepala pusing', 
      'Beban administrasi BKD (Beban Kerja Dosen) yang kerap gonta-ganti aturan'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('KEMENTERIAN KESEHATAN') || n.includes('KEMENKES')),
    rating: 4.1,
    culture: 'neutral',
    summary: 'Dominasi posisi tenaga medis di RS Vertikal dan staf teknis jaminan kesehatan. Cocok bagi Dokter/Perawat/Apoteker.',
    pros: [
      'Bagi nakes: ada tunjangan fungsional kesehatan, uang jaga, dan jasa pelayanan (Jaspel)', 
      'RS Kemenkes vertikal memiliki alat dan fasilitas kesehatan tercanggih se-Indonesia', 
      'Insentif tambahan besar saat ada program khusus/Wabah'
    ],
    cons: [
      'Sistem shifting Nakes (pagi/sore/malam) sangat melelahkan', 
      'Beban stres tinggi akibat menghadapi keluarga pasien dan menjaga nyawa rutin', 
      'Birokrasi klaim kesehatan rumit bagi tenaga admin RS'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('PERHUBUNGAN') || n.includes('KEMENHUB')),
    rating: 3.9,
    culture: 'neutral',
    summary: 'Pilar mobilitas jalur darat, air, dan udara. Banyak merekrut taruna lulusan perhubungan, namun terbuka puluhan disiplin ilmu lain.',
    pros: [
      'Kerja lapangan sangat dinamis (mengawas pelabuhan, bandara, atau stasiun kereta)', 
      'Khusus Polsuska/Darat: Wibawa petugas keamanan berseragam dinas perhubungan', 
      'Tukin lumayan, kadang plus "uang layar" untuk perhubungan laut'
    ],
    cons: [
      'Diwajibkan siaga/tidak libur di momen libur nasional (Mudik Lebaran, Nataru)', 
      'Mutasi lintas provinsi sangat sering bagi petugas operasional (syahbandar/dll)', 
      'Rawan mutasi ke bandara/pelabuhan perintis ujung negeri'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('SEKRETARIAT JENDERAL DPR') || n.includes('SEKRETARIAT JENDERAL MPR') || n.includes('SEKRETARIAT JENDERAL DPD')),
    rating: 4.5,
    culture: 'green',
    summary: 'Fasilitator administratif perwakilan rakyat di Senayan. Lokasi kerja elite di tengah Jakarta dengan tunjangan menarik.',
    pros: [
      'Kerja menetap! Markas besar selalu di gedung Senayan, Jakarta (Anti Mutasi Daerah)', 
      'Tukin dan uang sidang / uang lembur pembahasan RUU sangat baik', 
      'Akses jaringan politik tingkat tinggi'
    ],
    cons: [
      'Tekanan melayani anggota dewan dan ego-sektoral antar fraksi politik', 
      'Terikat oleh ritme kerja anggota DPR (bisa rapat sampai subuh)', 
      'Bisa stres tinggi akibat sorotan media dan unjuk rasa publik'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('BASARNAS') || n.includes('BADAN NASIONAL PENCARIAN DAN PERTOLONGAN')),
    rating: 4.3,
    culture: 'neutral',
    summary: 'Relawan berbayar negara penyelamat nyawa. Profesi bagi yang punya fisik kuat dan mental heroik.',
    pros: [
      'Pekerjaan murni heroik dan dihormati masyarakat (Rescue Team)', 
      'Kekuatan persaudaraan / solidaritas unit (esprit de corps) ekstrem nyaris militer', 
      'Tunjangan risiko kerja lapangan'
    ],
    cons: [
      'Red Flag Kematian: Profesi berisiko tinggi saat menyelam, mendaki tebing, dan cuaca ekstrem', 
      'Siaga 24 jam On-Call setiap saat terdengar kabar bencana', 
      'Tukin masih di kategori biasa, walau resiko dipertaruhkan tinggi'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('RISET DAN INOVASI NASIONAL') || n.includes('BRIN') || n.includes('LIPI')),
    rating: 4.6,
    culture: 'green',
    summary: 'Surganya para ilmuwan, peneliti, dan akademisi jenius. Iklim kerja murni riset dan sangat jauh dari hiruk pikuk birokrasi umum.',
    pros: [
      'Work-Life Balance sangat luar biasa (banyak peneliti bisa riset dari luar kantor/negeri)', 
      'Sangat mendukung studi lanjut (S2/S3) hingga Post-Doc ke universitas dunia', 
      'Iklim egaliter (tidak gila hormat) karena berbasis kepakaran'
    ],
    cons: [
      'Dana riset yang harus sering diperjuangkan sendiri lewat hibah/proposal', 
      'Tekanan berat untuk publish jurnal ilmiah internasional bereputasi (Scopus)', 
      'Bukan tempat yang cocok bagi yang suka kerja administratif/teknis rutin'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('KEMENTERIAN PERTAHANAN') || n.includes('KEMHAN')),
    rating: 4.1,
    culture: 'neutral',
    summary: 'Menjadi abdi negara sipil di tengah belantara prajurit loreng. Harus siap patuh pada komando atasan.',
    pros: [
      'Rasa nasionalisme tinggi, sering terlibat perumusan Alutsista atau industri pertahanan', 
      'Sistem yang sangat rapi dan komando yang jelas', 
      'Keamanan lokasi kerja terjamin (berada di dalam pangkalan / markas TNI)'
    ],
    cons: [
      'Hierarki dan disiplin militeristik sangat kental (banyak atasan langsung dari militer aktif)', 
      'Gaya tata rambut, seragam, dan kesamaptaan jauh lebih ketat dibanding kementerian biasa', 
      'Kerahasiaan dokumen negara tingkat dewa'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('PENDAYAGUNAAN APARATUR NEGARA') || n.includes('KEMENPAN') || n.includes('PAN RB')),
    rating: 4.7,
    culture: 'green',
    summary: 'Sang perumus kebijakan bagi seluruh PNS di Republik ini. Bisa dibilang bos-nya HRD Negara.',
    pros: [
      'Tukin elit golongan atas karena menjadi role model bagi instansi lain!', 
      'Ikut serta merumuskan besaran gaji, formasi, dan aturan bagi kementerian dan pemda lain', 
      'Posisi yang secara birokrasi sangat disegani/dicari oleh instansi lain saat mereka ingin usul kenaikan Tukin'
    ],
    cons: [
      'Harus paling disiplin memberi teladan Reformasi Birokrasi (RB) untuk nasional', 
      'Tuntutan inovasi kebijakan yang terus berubah bergantung rezim Menteri', 
      'Penolakan/kritik tajam publik setiap ada aturan baru terkait honorer atau tes CPNS'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('BADAN USAHA MILIK NEGARA') || n.includes('BUMN')),
    rating: 4.8,
    culture: 'green',
    summary: 'Wakil Pemerintah yang mengendalikan aset triliunan Rupiah milik perusahaan merah Republik. Penuh rapat tingkat tinggi dengan direksi korporat.',
    pros: [
      'Tukin sangat tinggi (Tier Kesultanan) dan prestise jabatan elit', 
      'Eksposur yang sangat luas di dunia bisnis dan korporasi (sering bertemu CEO/Direksi BUMN)', 
      'Fasilitas dan networking kelas eksekutif'
    ],
    cons: [
      'Tekanan mental mengurus restrukturisasi, utang, dan sengketa hukum di BUMN sakit', 
      'Intervensi politik/DPR yang sangat kuat dalam menentukan arah kebijakan BUMN', 
      'Lembur berat (Rapat Umum Pemegang Saham dll)'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('DALAM NEGERI') || n.includes('KEMENDAGRI')),
    rating: 4.4,
    culture: 'neutral',
    summary: 'Simpul urat nadi Pemerintahan Daerah dan Pusat. Penguasa para Kepala Daerah se-Indonesia.',
    pros: [
      'Birokrasi prestisius (IPDN) yang menghasilkan pamong praja nasional', 
      'Dihormati oleh seluruh Pemkab/Pemkot/Pemprov karena pegang izin, dana transfer, dan evaluasi Perda', 
      'Penempatan mayoritas di perkotaan besar/Pusat'
    ],
    cons: [
      'Suasana hierarkis "Senior-Junior" sangat terasa khususnya bagi lulusan pamong', 
      'Beban mengurus ribuan masalah pemerintahan daerah yang tak berujung', 
      'Tukin kategori standar atas, namun kalah saing dengan Kemenkeu'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('KOMUNIKASI DAN INFORMATIKA') || n.includes('KOMINFO')),
    rating: 4.0,
    culture: 'neutral',
    summary: 'Polisi internet dan pita lebar nasional. Pekerjaan di mana Anda seringkali harus menjadi bamper protes netizen.',
    pros: [
      'Tukin memadai dan lingkungan kerja yang diisi banyak SDM digital/kreatif', 
      'Menangani isu-isu masa depan (5G, AI, Satelit, Transformasi Digital)', 
      'Berbaur dengan start-up dan industri teknologi global'
    ],
    cons: [
      'Beban mental dihujat jutaan netizen se-Indonesia setiap ada kebijakan yang dianggap "blunder"', 
      'Panik 24/7 jika ada peretasan massal Pusat Data Nasional atau kebocoran ribuan NIK', 
      'Kerap bingung dengan pergantian regulasi PSE/Pinjol/Judi Online'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('PENGAWAS OBAT DAN MAKANAN') || n.includes('BPOM')),
    rating: 4.3,
    culture: 'neutral',
    summary: 'Pelindung tubuh masyarakat dari kosmetik palsu dan makanan racun. Setengah ilmuwan, setengah polisi sidak.',
    pros: [
      'Sangat dihormati oleh pengusaha dan produsen makanan/kosmetik se-Indonesia', 
      'Banyak kerja-kerja laboratorium yang terukur untuk lulusan farmasi/kimia', 
      'Ada kepuasan tersendiri saat membongkar pabrik skincare abal-abal'
    ],
    cons: [
      'Rawan digugat mafia kosmetik/pabrik obat jika menyegel produk mereka', 
      'Tuntutan pengujian sampel yang menumpuk tak ada habisnya', 
      'Sering turun razia mendadak bersama aparat kepolisian ke tempat-tempat kumuh/berbahaya'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('NARKOTIKA NASIONAL') || n.includes('BNN')),
    rating: 4.1,
    culture: 'neutral',
    summary: 'Tombak perang melawan kartel narkoba. Pekerjaan yang butuh nyali besar dan tak takut mati bagi intel/penyidiknya.',
    pros: [
      'Pekerjaan bernuansa laga/aksi seperti di film-film penegak hukum (bagi penyidik/intel)', 
      'Ada tunjangan bahaya dan fasilitas persenjataan mumpuni (bagi bagian penindakan)', 
      'Kepuasan menyelamatkan generasi muda bangsa'
    ],
    cons: [
      'Risiko nyawa: Berhadapan dengan sindikat bersenjata dan mafia narkoba transnasional', 
      'Rawan godaan suap "uang haram" narkoba yang nominalnya bisa tidak masuk akal', 
      'Tekanan mental menyedihkan saat harus menangani pecandu di fasilitas rehab'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('PENANGGULANGAN TERORISME') || n.includes('BNPT')),
    rating: 4.2,
    culture: 'neutral',
    summary: 'Ahli deradikalisasi dan kontra-terorisme sipil. Bekerja dalam senyap memetakan ideologi radikal.',
    pros: [
      'Tunjangan khusus yang lumayan besar karena risiko jabatan', 
      'Networking dengan intelijen global dan aparat khusus (Densus 88/TNI)', 
      'Banyak menganalisa pola dan ideologi menarik'
    ],
    cons: [
      'Kerja yang penuh kewaspadaan tinggi (tidak boleh sembrono bermedsos)', 
      'Rawan menjadi target kelompok ekstremis jika identitas terekspos', 
      'Ketegangan mental memantau ancaman bom/serangan yang bisa merusak nama negara sewaktu-waktu'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('PENANGGULANGAN BENCANA') || n.includes('BNPB')),
    rating: 4.1,
    culture: 'neutral',
    summary: 'Badan komando kedaruratan jika Indonesia dilanda letusan gunung, gempa, hingga tsunami. The Manager of Disaster.',
    pros: [
      'Tugas mulia menyalurkan triliunan bantuan dan membangun kembali harapan warga hancur', 
      'Gengsi tinggi saat menjadi kordinator bagi seluruh kementerian (TNI, PUPR, Mensos) di lokasi bencana', 
      'Dana darurat dan operasional sangat fleksibel demi kemanusiaan'
    ],
    cons: [
      'Red Flag Kematian/Stres: Wajib terbang pertama kali saat ada daerah yang baru saja luluh lantak', 
      'Pemandangan trauma/mayat massal di lokasi pasca-bencana bisa mengganggu mental', 
      'Sulit mengatur libur/cuti jika masuk musim hujan badai / rawan hidrometeorologi'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('SOSIAL') || n.includes('KEMENSOS')),
    rating: 3.7,
    culture: 'neutral',
    summary: 'Kementerian pelindung kaum papa, fakir miskin, dan program keluarga harapan. Banyak berhubungan dengan rakyat bawah.',
    pros: [
      'Pahala berlimpah jika bekerja benar (menyalurkan bansos ke perut orang kelaparan)', 
      'Sangat banyak unit pelayanan balai sosial (Rehabilitasi lansia, disabilitas, hingga korban narkoba)', 
      'Cocok untuk jiwa-jiwa relawan / lulusan kesejahteraan sosial'
    ],
    cons: [
      'Anggaran sangat raksasa (Bansos) sehingga "godaan" korupsi/potongan bansos di level bawah amat sangat rentan (Red Flag Reputasi)', 
      'Sering disorot / diserang media jika ada kekacauan data penerima BLT di daerah', 
      'Tukin kategori Menengah/Biasa, tidak semewah tupoksinya yang menyalurkan dana Triliunan'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('KELUARGA BERENCANA') || n.includes('BKKBN')),
    rating: 3.8,
    culture: 'green',
    summary: 'Sang pengendali ledakan populasi dan pembasmi stunting. Ujung tombaknya adalah penyuluh KB di lapangan.',
    pros: [
      'Formasi PLKB (Penyuluh Lapanan) menembus hingga seluruh pedesaan, tidak harus merantau jauh ke pusat kota', 
      'Kerja membaur dengan masyarakat ibu-ibu balita, minim konflik', 
      'Cukup santai dan stabil di tingkat daerah/bawah'
    ],
    cons: [
      'Penempatan staf lapangan seringkali ke pelosok desa/kecamatan terjauh', 
      'Terbebani obsesi target nasional penurunan stunting tahunan', 
      'Tukin/Tunjangan bagi penyuluh lapangan tergolong pas-pasan'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('PERDAGANGAN') || n.includes('KEMENDAG')),
    rating: 4.1,
    culture: 'neutral',
    summary: 'Pintu gerbang arus keluar masuk gula, beras, dan baja di pelabuhan negara ini. Penuh kuasa mengatur tata niaga.',
    pros: [
      'Wibawa elit bagi yang pegang otorisasi izin kuota ekspor / impor bagi pengusaha', 
      'Kesempatan penempatan di Atase Perdagangan luar negeri/kedutaan besar bernuansa diplomatik', 
      'Kantor berfasilitas elegan dan sering urusan dinas bernuansa bisnis raksasa'
    ],
    cons: [
      'Menjadi samsak publik/DPR saat harga minyak goreng atau beras naik tajam', 
      'Rawan diintervensi kartel impor raksasa', 
      'Gengsi tinggi namun tukin kategori Ksatria Kelas Menengah (tidak Top Sultan)'
    ]
  },
  {
    matcher: (n) => typeof n === 'string' && (n.includes('PERINDUSTRIAN') || n.includes('KEMENPERIN')),
    rating: 4.0,
    culture: 'neutral',
    summary: 'Regulator pabrik demi "Made in Indonesia". Urusan hari-harinya adalah relokasi pabrik, blokir IMEI, hingga regulasi TKDN.',
    pros: [
      'Tukin sangat stabil dan lingkungan kantor di pusat Jakarta elite bergengsi', 
      'Sering terlibat urusan bisnis korporasi global yang ingin buka pabrik di Indonesia (Apple, Tesla, Honda)', 
      'Memiliki unit pendidikan sekolah vokasi negeri/Politeknik yang stabil untuk formasi guru/dosennya'
    ],
    cons: [
      'Sering terjepit antara melindungi pengusaha / pekerja jika ada gelombang PHK massal', 
      'Kerap dimintai tolong hal teknis oleh publik seperti blokir IMEI hp luar negeri', 
      'Pergerakan karir sangat politis terikat asosiasi pengusaha dan investasi asing'
    ]
  }
];

// Helper fallback untuk instansi yang tidak masuk daftar di atas
export function getInstansiReview(nama: string, tierCat: string | null = null): InstansiReview {
  const found = INSTANSI_REVIEWS.find(r => r.matcher(nama.toUpperCase()));
  if (found) return found;

  // Generic fallback
  const isPemda = nama.toUpperCase().includes('PEMERINTAH');
  
  if (isPemda) {
    return {
      matcher: () => true,
      rating: 3.5,
      culture: 'neutral',
      summary: 'Instansi Pemerintah Daerah. Penghasilan utama selain gaji pokok berasal dari TPP (Tambahan Penghasilan Pegawai) yang besarannya disesuaikan kemampuan keuangan daerah (APBD).',
      pros: [
        'Sudah pasti ditempatkan di daerah yang dilamar (tidak akan random lempar ke luar provinsi)', 
        'Dekat dengan keluarga dan domisili asal', 
        'Lingkungan kerja umumnya lebih "guyub" dan santai dibanding beban kerja kementerian pusat'
      ],
      cons: [
        'Besaran TPP bisa sangat kecil atau tertunda jika kas daerah seret', 
        'Ruang gerak mutasi sangat terbatas hanya di dinas-dinas di kab/kota/provinsi yang sama', 
        'Sistem karir seringkali dipengaruhi kuat oleh elit politik lokal'
      ]
    };
  }

  // Fallback Kementerian/Lembaga Pusat berdasarkan Tier
  if (tierCat === '99' || tierCat === '5' || tierCat === '4') {
    return {
      matcher: () => true,
      rating: 4.5,
      culture: 'green',
      summary: 'Termasuk dalam Instansi Pusat tingkat atas. Menawarkan standar kesejahteraan ASN yang luar biasa tinggi dengan dukungan IT dan fasilitas mumpuni.',
      pros: [
        'Tukin sangat tinggi & cair tepat waktu (Golongan elit kementerian)', 
        'Fasilitas dinas, beasiswa, dan pengembangan karir sangat terbuka', 
        'Prestasi kerja lebih dihargai dengan sistem KPI yang jelas'
      ],
      cons: [
        'Umumnya formasi sedikit & keketatan persaingan pelamar sangat tinggi', 
        'Siap sedia dinas atau dirotasi melintasi pulau di seluruh wilayah Indonesia', 
        'Beban kerja dan tekanan sangat padat, sering dituntut kerja cepat'
      ]
    };
  } else if (tierCat === '3') {
    return {
      matcher: () => true,
      rating: 3.8,
      culture: 'neutral',
      summary: 'Instansi Pusat kelas menengah. Beban kerja stabil tanpa tekanan ekstrim, cocok untuk mengejar karir yang nyaman.',
      pros: [
        'Tukin lumayan mencukupi kebutuhan hidup layak di tingkat pusat', 
        'Tekanan kerja relatif normal (work-life balance masih bisa dijaga)', 
        'Jumlah pembukaan formasi biasanya cukup besar setiap tahun'
      ],
      cons: [
        'Jenjang kenaikan tukin cenderung agak lambat (menunggu evaluasi RB kementerian)', 
        'Fasilitas terkadang masih bergantung pada kebijakan pimpinan unit', 
        'Bisa sewaktu-waktu ada mutasi ke direktorat jenderal / kanwil luar daerah'
      ]
    };
  } else {
    // Tier 1, 2, atau tidak diketahui
    return {
      matcher: () => true,
      rating: 3.2,
      culture: 'neutral',
      summary: 'Termasuk dalam Lembaga/Kementerian yang belum mengalami kenaikan tukin signifikan. Cocok sebagai batu loncatan menjadi ASN.',
      pros: [
        'Persaingan pelamar biasanya lebih mudah karena kurang diminati', 
        'Beban kerja seringkali lebih sedikit dibanding kementerian besar', 
        'Peluang formasi lulusan spesifik lebih sering tersedia'
      ],
      cons: [
        'Tukin masih tergolong kecil / kategori terbawah di tingkat Pusat', 
        'Kemungkinan besar anggaran operasional kegiatan terbatas', 
        'Pengembangan karir vertikal mungkin cenderung stagnan'
      ]
    };
  }
}
