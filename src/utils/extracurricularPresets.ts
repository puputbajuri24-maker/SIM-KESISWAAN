import { ExtracurricularCategory, Teacher } from '../types';

export interface ExtracurricularPreset {
  id: string;
  name: string;
  category: ExtracurricularCategory;
  description: string;
  defaultDay: 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu';
  defaultStartTime: string;
  defaultEndTime: string;
  defaultLocation: string;
  defaultQuota: number;
  vision: string;
  mission: string;
  target: string;
  badgeColor?: string;
}

export const EXTRACURRICULAR_PRESETS: ExtracurricularPreset[] = [
  // 1. Bela Negara & Kepemimpinan
  {
    id: 'pramuka',
    name: 'Pramuka (Gugus Depan)',
    category: 'Kepemimpinan',
    description: 'Pendidikan kepanduan, kedisiplinan, kemandirian, kepemimpinan regu, dan cinta alam tanah air.',
    defaultDay: 'Jumat',
    defaultStartTime: '15:30',
    defaultEndTime: '17:30',
    defaultLocation: 'Lapangan Utama & Sanggar Pramuka',
    defaultQuota: 80,
    vision: 'Membentuk tunas bangsa yang berkarakter tangguh, religius, berjiwa korsa, dan berwawasan lingkungan.',
    mission: '1. Menyelenggarakan latihan kepramukaan berjenjang. 2. Mengembangkan kemampuan survival dan leadership. 3. Melaksanakan bakti sosial masyarakat.',
    target: 'Meraih Juara Umum Lomba Tingkat (LT) Penegak dan mengirimkan kontingen Jambore/Raimuna.'
  },
  {
    id: 'paskibra',
    name: 'Paskibra (Pasukan Pengibar Bendera)',
    category: 'Bela Negara',
    description: 'Pelatihan peraturan baris berbaris (PBB), formasi pengibaran bendera, etika keprotokolan, dan kedisiplinan.',
    defaultDay: 'Senin',
    defaultStartTime: '15:30',
    defaultEndTime: '17:30',
    defaultLocation: 'Lapangan Utama',
    defaultQuota: 45,
    vision: 'Mencetak generasi muda berdisiplin tinggi, berjiwa patriotik, dan berkarakter kepemimpinan luhur.',
    mission: '1. Pembinaan mental, fisik, dan disiplin PBB. 2. Pengawalan upacara bendera madrasah. 3. Partisipasi lomba formasi PBB.',
    target: 'Menjadi petugas pengibar bendera HUT RI tingkat Kabupaten/Kota dan meraih juara LKBB.'
  },
  {
    id: 'pmr',
    name: 'PMR Wira (Palang Merah Remaja)',
    category: 'Sosial',
    description: 'Pelatihan pertolongan pertama pada kecelakaan (PPGD), donor darah, kesiapsiagaan bencana, dan aksi kemanusiaan.',
    defaultDay: 'Kamis',
    defaultStartTime: '15:30',
    defaultEndTime: '17:00',
    defaultLocation: 'Ruang UKS & Aula Kemanusiaan',
    defaultQuota: 50,
    vision: 'Mewujudkan relawan muda PMI yang cekatan, tanggap darurat, dan berhati mulia.',
    mission: '1. Menguasai 7 Prinsip Palang Merah & Pertolongan Pertama. 2. Mengelola posko kesehatan upacara. 3. Edukasi sanitasi dan donor darah.',
    target: 'Mempertahankan Akreditasi Madya/Utama PMR Wira dan menjuarai Lomba Cepat Tepat Pertolongan Pertama.'
  },
  {
    id: 'pks',
    name: 'Patroli Keamanan Sekolah (PKS)',
    category: 'Bela Negara',
    description: 'Penegakan ketertiban, pengaturan lalu lintas penyeberangan siswa, dan kedisiplinan lingkungan madrasah.',
    defaultDay: 'Selasa',
    defaultStartTime: '15:30',
    defaultEndTime: '17:00',
    defaultLocation: 'Gerbang Utama & Pos Keamanan',
    defaultQuota: 35,
    vision: 'Mewujudkan lingkungan madrasah yang aman, tertib, kondusif, dan taat peraturan lalu lintas.',
    mission: '1. Pelatihan 12 gerakan dasar lalu lintas. 2. Pengawalan zona selamat sekolah. 3. Pencegahan kenakalan remaja.',
    target: 'Menciptakan zero-incident kecelakaan penyeberangan di depan madrasah.'
  },

  // 2. Olahraga
  {
    id: 'futsal',
    name: 'Futsal & Sepakbola',
    category: 'Olahraga',
    description: 'Pengembangan fisik, teknik dasar olah bola, strategi permainan, kerja sama tim, dan sportivitas kompetisi.',
    defaultDay: 'Rabu',
    defaultStartTime: '15:30',
    defaultEndTime: '17:30',
    defaultLocation: 'Lapangan Futsal / GOR',
    defaultQuota: 40,
    vision: 'Mencetak atlet futsal pelajar yang berdaya saing tinggi, tangkas, dan menjunjung sportivitas.',
    mission: '1. Latihan fisik dan drill taktik modern teratur. 2. Mengikuti liga pelajar regional. 3. Membangun kekompakan tim.',
    target: 'Juara 1 Turnamen Futsal Antar-Madrasah/Sekolah Tingkat Kota/Kabupaten.'
  },
  {
    id: 'basket',
    name: 'Bola Basket (Putra & Putri)',
    category: 'Olahraga',
    description: 'Pelatihan dribbling, passing, shooting, defensive pattern, dan taktikal game play bola basket modern.',
    defaultDay: 'Selasa',
    defaultStartTime: '15:45',
    defaultEndTime: '17:45',
    defaultLocation: 'Hall Basket / Lapangan Basket',
    defaultQuota: 40,
    vision: 'Menjadi tim basket pelajar unggulan yang berprestasi di tingkat regional dengan etika bertanding prima.',
    mission: '1. Peningkatan fundamental skill basket. 2. Sparing partner rutin. 3. Mengikuti turnamen DBL / Popda.',
    target: 'Lolos ke babak Semifinal/Final turnamen resmi tingkat kota.'
  },
  {
    id: 'voli',
    name: 'Bola Voli',
    category: 'Olahraga',
    description: 'Latihan passing atas/bawah, smash tajam, blocking, rotasi posisi, dan kekompakan tim voli.',
    defaultDay: 'Kamis',
    defaultStartTime: '15:30',
    defaultEndTime: '17:30',
    defaultLocation: 'Lapangan Voli Outdoor',
    defaultQuota: 36,
    vision: 'Membentuk tim bola voli yang solid, berdaya juang tinggi, dan menguasai teknik modern.',
    mission: '1. Penguasaan teknik servis dan smash terarah. 2. Latihan fisik melompat dan kelincahan. 3. Mengikuti kejuaraan Popda.',
    target: 'Juara 1 Kejuaraan Bola Voli Antar-Pelajar.'
  },
  {
    id: 'bulutangkis',
    name: 'Bulutangkis (Badminton)',
    category: 'Olahraga',
    description: 'Pelatihan footwork, smash, dropshot, netting, dan ketahanan fisik pemain tunggal maupun ganda.',
    defaultDay: 'Senin',
    defaultStartTime: '15:30',
    defaultEndTime: '17:30',
    defaultLocation: 'Gedung Olahraga / Lapangan Indoor',
    defaultQuota: 30,
    vision: 'Melahirkan atlet bulutangkis muda yang lincah, bermental juara, dan berprestasi.',
    mission: '1. Drill footwork dan kelenturan tubuh. 2. Simulasi pertandingan tunggal/ganda. 3. Mengikuti O2SN.',
    target: 'Meraih medali emas O2SN Cabang Bulutangkis Tingkat Kabupaten/Kota.'
  },
  {
    id: 'silat',
    name: 'Pencak Silat (Seni & Tanding)',
    category: 'Olahraga',
    description: 'Pelestarian seni bela diri warisan nusantara, jurus baku, teknik tanding, dan pembentukan watak kesatria.',
    defaultDay: 'Sabtu',
    defaultStartTime: '08:00',
    defaultEndTime: '10:30',
    defaultLocation: 'Aula Utama Madrasah',
    defaultQuota: 45,
    vision: 'Menjadi wadah pembentukan insan beriman, berbudi pekerti luhur, dan berprestasi di arena silat.',
    mission: '1. Penguasaan jurus tunggal, ganda, dan tanding. 2. Pembinaan mental spiritual pesilat. 3. Partisipasi kejuaraan IPSI.',
    target: 'Menorehkan prestasi medali emas di Kejuaraan Pencak Silat Pelajar Nasional.'
  },
  {
    id: 'taekwondo',
    name: 'Taekwondo',
    category: 'Olahraga',
    description: 'Pelatihan seni bela diri Taekwondo (Kyorugi & Poomsae), kelenturan tendangan, dan ketahanan fisik.',
    defaultDay: 'Rabu',
    defaultStartTime: '15:30',
    defaultEndTime: '17:30',
    defaultLocation: 'Hall Olahraga',
    defaultQuota: 35,
    vision: 'Mencetak atlet bela diri yang disiplin, percaya diri, dan berprestasi kancah regional.',
    mission: '1. Pelatihan kyorugi dan poomsae resmi. 2. Ujian kenaikan sabuk berkala. 3. Keikutsertaan open tournament.',
    target: 'Meraih medali di Kejuaraan Taekwondo Pelajar tingkat Provinsi.'
  },
  {
    id: 'catur',
    name: 'Klub Catur & Strategi',
    category: 'Olahraga',
    description: 'Asah ketajaman berpikir logis, analisis taktik pembukaan, middle game, endgame catur standar dan cepat.',
    defaultDay: 'Kamis',
    defaultStartTime: '15:30',
    defaultEndTime: '17:00',
    defaultLocation: 'Ruang Multimedia 2',
    defaultQuota: 25,
    vision: 'Mencetak pecatur muda yang piawai dalam strategi, sabar, dan berintelektual tinggi.',
    mission: '1. Analisis notasi master catur dunia. 2. Turnamen catur internal rutin. 3. Partisipasi O2SN/Kejurda Percasi.',
    target: 'Meraih gelar juara O2SN Cabang Catur.'
  },

  // 3. Keagamaan & Karakter
  {
    id: 'tahfidz',
    name: 'Tahfidz & Tilawatil Qur\'an',
    category: 'Keagamaan',
    description: 'Bimbingan menghafal Al-Qur\'an metode mutqin, perbaikan makharijul huruf, tajwid, dan seni nagham tilawah.',
    defaultDay: 'Senin',
    defaultStartTime: '15:30',
    defaultEndTime: '17:00',
    defaultLocation: 'Masjid / Musholla Utama',
    defaultQuota: 60,
    vision: 'Melahirkan generasi Qur\'ani yang hafal, paham, mengamalkan, dan melantunkan Al-Qur\'an dengan indah.',
    mission: '1. Setoran hafalan rutin bersanad. 2. Pelatihan maqam nagham tilawah. 3. Mengikuti MTQ dan MHQ.',
    target: 'Mencetak hafiz/hafizah minimal 3-5 juz dan juara di ajang MTQ Pelajar.'
  },
  {
    id: 'hadrah',
    name: 'Hadrah, Rebana & Seni Shalawat',
    category: 'Keagamaan',
    description: 'Seni tabuhan rebana/hadrah banjari, vokal qashidah shalawat nabawiyah, dan aransemen musik islami.',
    defaultDay: 'Rabu',
    defaultStartTime: '15:30',
    defaultEndTime: '17:30',
    defaultLocation: 'Aula Seni Keagamaan',
    defaultQuota: 35,
    vision: 'Menumbuhkan rasa cinta kepada Nabi Muhammad SAW melalui syiar seni musik shalawat yang merdu.',
    mission: '1. Latihan ketukan terbang banjari/hadrah. 2. Vokal solo dan koor shalawat. 3. Tampil di peringatan hari besar islam.',
    target: 'Juara 1 Festival Festival Hadrah / Banjari Tingkat Pelajar.'
  },
  {
    id: 'kaligrafi',
    name: 'Khat & Kaligrafi Islam',
    category: 'Keagamaan',
    description: 'Seni menulis ayat suci dengan kaidah khat Naskhi, Tsuluts, Riq\'ah, Diwani, dan kreasi lukis kaligrafi dekorasi.',
    defaultDay: 'Kamis',
    defaultStartTime: '15:30',
    defaultEndTime: '17:00',
    defaultLocation: 'Studio Seni Rupa',
    defaultQuota: 30,
    vision: 'Melestarikan seni khat islamiah dengan keindahan estetika dan ketelitian kaidah tulisan Arab.',
    mission: '1. Pelatihan kaidah pena bambu dan kuas. 2. Eksplorasi media kanvas kaligrafi. 3. Pameran karya seni santri.',
    target: 'Meraih Juara di Cabang Kaligrafi MTQ Pelajar / Porseni Madrasah.'
  },
  {
    id: 'rohis',
    name: 'Rohis & Kajian Dai Muda (Khitabah)',
    category: 'Keagamaan',
    description: 'Pelatihan public speaking ceramah/kultum 3 bahasa (Indonesia, Arab, Inggris), leadership dakwah, dan kajian keislaman.',
    defaultDay: 'Jumat',
    defaultStartTime: '13:30',
    defaultEndTime: '15:00',
    defaultLocation: 'Masjid Madrasah',
    defaultQuota: 50,
    vision: 'Membentuk dai-daiyah muda yang santun, berwawasan moderasi beragama, dan cakap berkomunikasi di depan publik.',
    mission: '1. Pelatihan retorika dakwah dan penyusunan naskah pidato. 2. Praktik kultum jumat. 3. Mengikuti lomba ceramah Porseni.',
    target: 'Juara 1 Lomba Pidato Bahasa Arab / Dai Muda Tingkat Kota.'
  },

  // 4. Akademik & Bahasa
  {
    id: 'kir',
    name: 'KIR (Karya Ilmiah Remaja)',
    category: 'Akademik',
    description: 'Riset metodologi ilmiah, penulisan esai, eksperimen laboratorium sains dasar, dan inovasi sosial humaniora.',
    defaultDay: 'Selasa',
    defaultStartTime: '15:30',
    defaultEndTime: '17:00',
    defaultLocation: 'Laboratorium IPA Terpadu',
    defaultQuota: 35,
    vision: 'Melahirkan peneliti muda yang kritis, kreatif, objektif, dan solutif terhadap permasalahan masyarakat.',
    mission: '1. Bimbingan penulisan karya tulis ilmiah (KTI). 2. Penelitian lapangan & lab. 3. Mengikuti OPSI / MYRES / LKIR LIPI.',
    target: 'Menjadi Finalis dan Pemenang Medali di ajang MYRES (Madrasah Young Researchers Supercamp).'
  },
  {
    id: 'ksm',
    name: 'Olimpiade Sains (KSM / OSN Club)',
    category: 'Akademik',
    description: 'Bimbingan intensif soal-soal tingkat tinggi (HOTS) Matematika, Fisika, Biologi, Kimia, Ekonomi, dan Geografi.',
    defaultDay: 'Senin',
    defaultStartTime: '15:30',
    defaultEndTime: '17:30',
    defaultLocation: 'Ruang Bimbingan Olimpiade',
    defaultQuota: 40,
    vision: 'Mencetak juara olimpiade sains yang berdaya saing unggul di level nasional maupun internasional.',
    mission: '1. Pendalaman materi advanced sains. 2. Simulasi tryout olimpiade berkala. 3. Mengikuti seleksi KSM dan OSN resmi.',
    target: 'Lolos kontingen KSM Nasional Kemenag dan meraih medali OSN.'
  },
  {
    id: 'english_club',
    name: 'English Club & Debate Society',
    category: 'Akademik',
    description: 'Pengembangan kemampuan bahasa Inggris aktif melalui storytelling, speech, parliamentary debate, dan TOEFL prep.',
    defaultDay: 'Rabu',
    defaultStartTime: '15:30',
    defaultEndTime: '17:00',
    defaultLocation: 'Laboratorium Bahasa 1',
    defaultQuota: 40,
    vision: 'Menciptakan lingkungan berbahasa global yang komunikatif, kritis, dan berwawasan internasional.',
    mission: '1. English day & speech practice. 2. Latihan format debat parlementer (Asian/British). 3. Mengikuti National English Debate.',
    target: 'Juara 1 English Speech & Debate Competition tingkat Wilayah.'
  },
  {
    id: 'arabic_club',
    name: 'Arabic Club (Nadi Al-Lughah)',
    category: 'Akademik',
    description: 'Praktik muhadatsah (percakapan bahasa Arab), insya\', khitabah, baca kitab kuning, dan debatter Arabiyah.',
    defaultDay: 'Kamis',
    defaultStartTime: '15:30',
    defaultEndTime: '17:00',
    defaultLocation: 'Laboratorium Bahasa 2',
    defaultQuota: 35,
    vision: 'Menjadikan bahasa Arab sebagai bahasa yang dicintai, komunikatif, dan dikuasai dengan fasih oleh santri.',
    mission: '1. Muhadatsah yaumiyyah terstruktur. 2. Latihan qiroatul kutub. 3. Partisipasi lomba Musabaqah Debat Bahasa Arab.',
    target: 'Meraih Juara di ajang Festival Bahasa Arab Nasional.'
  },

  // 5. Teknologi & Media
  {
    id: 'robotik',
    name: 'Robotik, IoT & AI Club',
    category: 'Teknologi',
    description: 'Eksplorasi mikrokontroler Arduino/ESP32, sensor IoT, robot line follower, dan pengenalan Artificial Intelligence.',
    defaultDay: 'Rabu',
    defaultStartTime: '15:30',
    defaultEndTime: '17:30',
    defaultLocation: 'Laboratorium Komputer & IoT',
    defaultQuota: 30,
    vision: 'Melahirkan inovator muda teknologi yang siap bersaing dalam era revolusi digital dan kecerdasan buatan.',
    mission: '1. Pemrograman robotika dasar & perakitan mekanik. 2. Proyek IoT smart school. 3. Partisipasi Madrasah Robotics Competition.',
    target: 'Medali Emas Kontes Robot Nusantara (MRC Kemenag).'
  },
  {
    id: 'jurnalistik',
    name: 'Jurnalistik & Mading Madrasah',
    category: 'Seni',
    description: 'Peliputan berita kegiatan sekolah, wawancara, penulisan artikel, fotografi pers, dan pengelolaan buletin digital/mading.',
    defaultDay: 'Senin',
    defaultStartTime: '15:30',
    defaultEndTime: '17:00',
    defaultLocation: 'Ruang Redaksi Media Kesiswaan',
    defaultQuota: 30,
    vision: 'Mewujudkan media literasi sekolah yang informatif, edukatif, objektif, dan beretika jurnalistik.',
    mission: '1. Pelatihan 5W+1H dan penulisan feature. 2. Penerbitan majalah madrasah edisi semester. 3. Pengelolaan konten mading.',
    target: 'Menerbitkan Majalah Digital Madrasah berkala dan menjuarai Lomba Mading 3D.'
  },
  {
    id: 'multimedia',
    name: 'Multimedia',
    category: 'Teknologi',
    description: 'Pengembangan kemampuan multimedia, penyiaran podcast, produksi konten visual kreatif, editing audio video, dan desain grafis.',
    defaultDay: 'Jumat',
    defaultStartTime: '15:30',
    defaultEndTime: '17:30',
    defaultLocation: 'Studio Multimedia & Podcast',
    defaultQuota: 35,
    vision: 'Mencetak insan kreatif bidang multimedia yang cakap, berestetika, profesional, dan berakhlak mulia.',
    mission: '1. Penguasaan alat produksi audio-visual dan studio. 2. Produksi konten siaran podcast dan liputan. 3. Dokumentasi resmi kegiatan sekolah.',
    target: 'Mengelola Studio Podcast & Media Digital Kreatif Madrasah secara produktif.'
  },

  // 6. Seni & Budaya
  {
    id: 'musik',
    name: 'Seni Musik & Band Pelajar',
    category: 'Seni',
    description: 'Pembelajaran instrumen gitar, keyboard, drum, bass, vokal, dan aransemen lagu akustik/pop religi.',
    defaultDay: 'Selasa',
    defaultStartTime: '15:30',
    defaultEndTime: '17:30',
    defaultLocation: 'Studio Musik & Akustik',
    defaultQuota: 25,
    vision: 'Mengembangkan bakat musikalitas santri secara harmonis, berestetika tinggi, dan menghibur.',
    mission: '1. Pelatihan ritme dan harmoni tangga nada. 2. Penampilan acara pentas seni (Pensi). 3. Festival band pelajar.',
    target: 'Menjadi pengisi utama festival seni madrasah dan meraih gelar The Best Band di Pensi Pelajar.'
  },
  {
    id: 'tari',
    name: 'Seni Tari Tradisional & Kreasi Nusantara',
    category: 'Seni',
    description: 'Pelestarian gerak tari tradisional daerah nusantara (Saman, Ratoh Jaroe, Piring, dll.) dan kreasi tari islami.',
    defaultDay: 'Kamis',
    defaultStartTime: '15:30',
    defaultEndTime: '17:30',
    defaultLocation: 'Panggung Sanggar Seni',
    defaultQuota: 30,
    vision: 'Menjaga kelestarian warisan seni tari nusantara dengan keluwesan gerak dan keselarasan estetika.',
    mission: '1. Penguasaan wiraga, wirama, dan wirasa tari daerah. 2. Tim penyambut tamu kehormatan madrasah. 3. FLS2N.',
    target: 'Meraih Juara 1 FLS2N Tingkat Kota/Provinsi Cabang Seni Tari Tradisional.'
  },
  {
    id: 'paduan_suara',
    name: 'Paduan Suara & Vokal Harmoni (Choir)',
    category: 'Seni',
    description: 'Pelatihan teknik pernapasan diafragma, intonasi, solfeggio, harmoni suara Sopran-Alto-Tenor-Bass (SATB), dan lagu wajib.',
    defaultDay: 'Rabu',
    defaultStartTime: '15:30',
    defaultEndTime: '17:00',
    defaultLocation: 'Aula Utama / Ruang Vokal',
    defaultQuota: 40,
    vision: 'Menjadi tim paduan suara madrasah yang anggun, berpadu merdu, dan penuh khidmat.',
    mission: '1. Penguasaan lagu kebangsaan & mars madrasah. 2. Paduan suara upacara kenegaraan. 3. Lomba paduan suara FLS2N.',
    target: 'Petugas utama upacara peringatan Hari Kemerdekaan dan Hari Guru Nasional.'
  }
];

/**
 * Helper to find matching teacher for an extracurricular preset or name
 */
export const findMatchingTeacherForEkskul = (
  ekskulName: string,
  teachers: Teacher[]
): Teacher | undefined => {
  if (!ekskulName || !teachers || teachers.length === 0) return undefined;
  const targetLower = ekskulName.toLowerCase();

  // 1. Direct match in assignedExtracurriculars
  const directAssigned = teachers.find(t =>
    t.assignedExtracurriculars &&
    t.assignedExtracurriculars.some(item =>
      targetLower.includes(item.toLowerCase()) || item.toLowerCase().includes(targetLower)
    )
  );
  if (directAssigned) return directAssigned;

  // 2. Direct match in extracurricularName legacy field
  const legacyMatch = teachers.find(t =>
    t.extracurricularName &&
    (targetLower.includes(t.extracurricularName.toLowerCase()) ||
     t.extracurricularName.toLowerCase().includes(targetLower))
  );
  if (legacyMatch) return legacyMatch;

  // 3. Match in teacher's subject / role
  const subjectMatch = teachers.find(t => {
    const s = (t.subject || '').toLowerCase();
    const r = (t.role || '').toLowerCase();
    if (targetLower.includes('pramuka') && (s.includes('pramuka') || r.includes('pramuka'))) return true;
    if (targetLower.includes('pmr') && (s.includes('pmr') || s.includes('kesehatan') || r.includes('pmr'))) return true;
    if (targetLower.includes('paskibra') && (s.includes('paskibra') || s.includes('pbb') || r.includes('paskibra'))) return true;
    if (targetLower.includes('futsal') && (s.includes('olahraga') || s.includes('penjas') || s.includes('jasmani') || s.includes('futsal'))) return true;
    if (targetLower.includes('basket') && (s.includes('basket') || s.includes('olahraga') || s.includes('penjas'))) return true;
    if (targetLower.includes('robotik') && (s.includes('komputer') || s.includes('informatika') || s.includes('rpl') || s.includes('tkj') || s.includes('robotik'))) return true;
    if (targetLower.includes('kir') && (s.includes('ipa') || s.includes('fisika') || s.includes('biologi') || s.includes('kimia') || s.includes('kir'))) return true;
    if (targetLower.includes('tahfidz') && (s.includes('quran') || s.includes('pai') || s.includes('agama') || s.includes('tahfidz'))) return true;
    if (targetLower.includes('hadrah') && (s.includes('seni') || s.includes('agama') || s.includes('hadrah'))) return true;
    if (targetLower.includes('english') && (s.includes('inggris') || s.includes('english'))) return true;
    if (targetLower.includes('arabic') && (s.includes('arab') || s.includes('arabic'))) return true;
    return false;
  });

  return subjectMatch;
};
