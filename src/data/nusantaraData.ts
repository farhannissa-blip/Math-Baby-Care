// Database Budaya Nusantara: Makanan Khas Daerah, Pakaian Adat, Peta Budaya, dan Evaluasi Evolusi
import { BabyGender, StoreItem } from './gameData';

export type LifePhase = 'BAYI' | 'ANAK_ANAK' | 'DEWASA';

export type RegionId =
  | 'aceh'
  | 'sumut'
  | 'sumbar'
  | 'sumsel'
  | 'jakarta'
  | 'jabar'
  | 'jateng'
  | 'jogja'
  | 'jatim'
  | 'bali'
  | 'kalimantan'
  | 'sulsel'
  | 'maluku'
  | 'papua';

export interface RegionalCultureEntry {
  id: RegionId;
  name: string;
  island: string;
  mapCoords: { x: number; y: number }; // Coordinates on our SVG Indonesia Culture Map (0..800, 0..340)
  snackId: string;
  snackName: string;
  mealId: string;
  mealName: string;
  clothingId: string;
  clothingName: string;
  maleClothingTitle: string;
  femaleClothingTitle: string;
  cultureDescription: string;
  landmarkOrIcon: string;
  themeColor: string;
}

export interface NusantaraFoodItem extends StoreItem {
  regionId: RegionId;
  regionName: string;
  nusantaraCategory: 'snack' | 'meal';
  unlockPhase: 'ANAK_ANAK' | 'DEWASA';
  culturalFact: string;
}

export interface NusantaraClothingItem extends StoreItem {
  regionId: RegionId;
  regionName: string;
  unlockPhase: 'ANAK_ANAK' | 'DEWASA';
  maleTitle: string;
  femaleTitle: string;
  headpieceStyle:
    | 'aceh_crown'
    | 'sunda_siger'
    | 'jogja_blangkon'
    | 'minang_tanduk'
    | 'bali_udeng'
    | 'dayak_feathers'
    | 'papua_crown'
    | 'betawi_peci'
    | 'palembang_aesan'
    | 'bugis_bodo'
    | 'ulos_headband'
    | 'madura_odheng'
    | 'maluku_cele';
  culturalFact: string;
}

export function getLifePhaseFromLevel(level: number): LifePhase {
  if (level <= 3) return 'BAYI';
  if (level <= 6) return 'ANAK_ANAK';
  return 'DEWASA';
}

export function getLifePhaseLabel(phase: LifePhase): string {
  if (phase === 'BAYI') return 'Fase Bayi & Balita (Stage 1–3)';
  if (phase === 'ANAK_ANAK') return 'Fase Anak & Remaja (Stage 4–6)';
  return 'Fase Dewasa (Stage 7)';
}

export const INITIAL_REGION_SCORES: Record<RegionId, number> = {
  aceh: 0,
  sumut: 0,
  sumbar: 0,
  sumsel: 0,
  jakarta: 0,
  jabar: 0,
  jateng: 0,
  jogja: 0,
  jatim: 0,
  bali: 0,
  kalimantan: 0,
  sulsel: 0,
  maluku: 0,
  papua: 0,
};

// Struktur dasar regionalData yang diperluas mencakup provinsi-provinsi utama Nusantara
export const regionalData: Record<RegionId, RegionalCultureEntry> = {
  aceh: {
    id: 'aceh',
    name: 'Aceh',
    island: 'Sumatera',
    mapCoords: { x: 82, y: 86 },
    snackId: 'nusantara_snack_timphan',
    snackName: 'Timphan',
    mealId: 'nusantara_meal_mie_aceh',
    mealName: 'Mie Aceh',
    clothingId: 'adat_aceh_ulee_balang',
    clothingName: 'Ulee Balang',
    maleClothingTitle: 'Ulee Balang (Linto Baro)',
    femaleClothingTitle: 'Ulee Balang (Daro Baro)',
    cultureDescription:
      'Aceh dikenal sebagai Serambi Mekkah dengan tarian Saman yang kompak, kuliner kaya rempah, dan busana adat Ulee Balang bersulam benang emas.',
    landmarkOrIcon: '🕌',
    themeColor: '#F59E0B',
  },
  sumut: {
    id: 'sumut',
    name: 'Sumatera Utara',
    island: 'Sumatera',
    mapCoords: { x: 118, y: 122 },
    snackId: 'nusantara_snack_bika_ambon',
    snackName: 'Bika Ambon',
    mealId: 'nusantara_meal_soto_medan',
    mealName: 'Soto Medan',
    clothingId: 'adat_sumut_ulos',
    clothingName: 'Busana Adat Ulos Batak',
    maleClothingTitle: 'Ulos Ragidup & Sortali',
    femaleClothingTitle: 'Kebaya Ulos & Sortali Batak',
    cultureDescription:
      'Sumatera Utara terkenal dengan Danau Toba dan kain tenun Ulos yang melambangkan kehangatan serta kasih sayang keluarga.',
    landmarkOrIcon: '🌋',
    themeColor: '#EF4444',
  },
  sumbar: {
    id: 'sumbar',
    name: 'Sumatera Barat',
    island: 'Sumatera',
    mapCoords: { x: 142, y: 170 },
    snackId: 'nusantara_snack_lamang_tapai',
    snackName: 'Kue Пinyaram & Lamang',
    mealId: 'nusantara_meal_rendang',
    mealName: 'Rendang Minang',
    clothingId: 'adat_sumbar_bundo_kanduang',
    clothingName: 'Bundo Kanduang & Penghulu',
    maleClothingTitle: 'Busana Penghulu Minang',
    femaleClothingTitle: 'Bundo Kanduang Tingkuluak',
    cultureDescription:
      'Budaya Minangkabau memiliki Rumah Gadang beratap gonjong seperti tanduk kerbau dan masakan Rendang yang terkenal di seluruh dunia.',
    landmarkOrIcon: '🏠',
    themeColor: '#D97706',
  },
  sumsel: {
    id: 'sumsel',
    name: 'Sumatera Selatan',
    island: 'Sumatera',
    mapCoords: { x: 192, y: 206 },
    snackId: 'nusantara_snack_pempek_lenjer',
    snackName: 'Pempek Kecil',
    mealId: 'nusantara_meal_pempek_kapal',
    mealName: 'Pempek Kapal Selam & Tekwan',
    clothingId: 'adat_sumsel_aesan_gede',
    clothingName: 'Aesan Gede Palembang',
    maleClothingTitle: 'Aesan Gede Songket Putera',
    femaleClothingTitle: 'Aesan Gede Karsuhun Puteri',
    cultureDescription:
      'Sumatera Selatan terkenal dengan Jembatan Ampera di Sungai Musi, kain Songket berkilau emas, dan kelezatan olahan ikan Pempek.',
    landmarkOrIcon: '🌉',
    themeColor: '#E11D48',
  },
  jakarta: {
    id: 'jakarta',
    name: 'DKI Jakarta',
    island: 'Jawa',
    mapCoords: { x: 238, y: 256 },
    snackId: 'nusantara_snack_kue_cucur',
    snackName: 'Kue Rangi & Cucur Betawi',
    mealId: 'nusantara_meal_soto_betawi',
    mealName: 'Soto Betawi & Nasi Uduk',
    clothingId: 'adat_jakarta_betawi',
    clothingName: 'Sadariah & Kebaya Encim',
    maleClothingTitle: 'Baju Sadariah & Peci Merah',
    femaleClothingTitle: 'Kebaya Encim Betawi',
    cultureDescription:
      'Budaya Betawi di Jakarta kaya dengan kesenian Ondel-ondel, Tanjidor, serta perpaduan budaya pesisir yang ramah dan ceria.',
    landmarkOrIcon: '🗼',
    themeColor: '#F97316',
  },
  jabar: {
    id: 'jabar',
    name: 'Jawa Barat',
    island: 'Jawa',
    mapCoords: { x: 258, y: 270 },
    snackId: 'nusantara_snack_surabi',
    snackName: 'Surabi',
    mealId: 'nusantara_meal_nasi_timbel',
    mealName: 'Nasi Timbel',
    clothingId: 'adat_jabar_kebaya_sunda',
    clothingName: 'Kebaya Sunda',
    maleClothingTitle: 'Beskap Sunda & Bendo',
    femaleClothingTitle: 'Kebaya Sunda & Mahkota Siger',
    cultureDescription:
      'Tanah Pasundan di Jawa Barat terkenal dengan alat musik bambu Angklung yang mendunia, keramahan warga, serta kuliner Surabi dan Nasi Timbel.',
    landmarkOrIcon: '🎋',
    themeColor: '#10B981',
  },
  jateng: {
    id: 'jateng',
    name: 'Jawa Tengah',
    island: 'Jawa',
    mapCoords: { x: 298, y: 266 },
    snackId: 'nusantara_snack_klepon',
    snackName: 'Klepon Gula Aren',
    mealId: 'nusantara_meal_garang_asem',
    mealName: 'Nasi Liwet & Garang Asem',
    clothingId: 'adat_jateng_jawi_jangkep',
    clothingName: 'Jawi Jangkep & Kebaya Jawa',
    maleClothingTitle: 'Beskap Jawi Jangkep',
    femaleClothingTitle: 'Kebaya Beludru Jawa Tengah',
    cultureDescription:
      'Jawa Tengah memiliki Candi Borobudur yang megah, seni membatik tulis yang halus, dan musik gamelan yang menenangkan.',
    landmarkOrIcon: '🛕',
    themeColor: '#8B5CF6',
  },
  jogja: {
    id: 'jogja',
    name: 'Yogyakarta',
    island: 'Jawa',
    mapCoords: { x: 304, y: 284 },
    snackId: 'nusantara_snack_bakpia',
    snackName: 'Bakpia',
    mealId: 'nusantara_meal_gudeg',
    mealName: 'Gudeg',
    clothingId: 'adat_jogja_kesatrian',
    clothingName: 'Kesatrian',
    maleClothingTitle: 'Surjan Kesatrian & Blangkon',
    femaleClothingTitle: 'Kebaya Kesatrian Yogyakarta',
    cultureDescription:
      'Daerah Istimewa Yogyakarta merupakan kota pelajar dan budaya dengan Keraton Yogyakarta, Bakpia hangat, Gudeg nangka manis, dan busana Kesatrian.',
    landmarkOrIcon: '🏯',
    themeColor: '#A16207',
  },
  jatim: {
    id: 'jatim',
    name: 'Jawa Timur',
    island: 'Jawa',
    mapCoords: { x: 344, y: 274 },
    snackId: 'nusantara_snack_onde_onde',
    snackName: 'Onde-Onde Mojokerto',
    mealId: 'nusantara_meal_rawon',
    mealName: 'Rawon & Soto Lamongan',
    clothingId: 'adat_jatim_pesaan',
    clothingName: 'Pesa’an & Kebaya Rancongan',
    maleClothingTitle: 'Baju Pesa’an & Odheng',
    femaleClothingTitle: 'Kebaya Rancongan Jawa Timur',
    cultureDescription:
      'Jawa Timur memiliki Gunung Bromo yang indah, kesenian Reog Ponorogo, serta semangat masyarakat yang pemberani dan bersahabat.',
    landmarkOrIcon: '🦁',
    themeColor: '#DC2626',
  },
  bali: {
    id: 'bali',
    name: 'Bali',
    island: 'Bali & Nusa Tenggara',
    mapCoords: { x: 388, y: 284 },
    snackId: 'nusantara_snack_pie_susu',
    snackName: 'Pie Susu & Jaje Laklak',
    mealId: 'nusantara_meal_ayam_betutu',
    mealName: 'Nasi Campur & Ayam Betutu',
    clothingId: 'adat_bali_payas_agung',
    clothingName: 'Payas Agung Bali',
    maleClothingTitle: 'Payas Agung & Udeng Emas',
    femaleClothingTitle: 'Payas Agung Gelung Agung',
    cultureDescription:
      'Pulau Dewata Bali terkenal dengan seni tari Pendet dan Kecak, ukiran artistik, serta busana Payas Agung berhias mahkota keemasan.',
    landmarkOrIcon: '⛩️',
    themeColor: '#F59E0B',
  },
  kalimantan: {
    id: 'kalimantan',
    name: 'Kalimantan',
    island: 'Kalimantan',
    mapCoords: { x: 348, y: 158 },
    snackId: 'nusantara_snack_amplang',
    snackName: 'Amplang Ikan & Bingka',
    mealId: 'nusantara_meal_soto_banjar',
    mealName: 'Soto Banjar Harum',
    clothingId: 'adat_kalimantan_king_baba',
    clothingName: 'King Baba & King Bibinge',
    maleClothingTitle: 'King Baba Dayak & Bulu Enggang',
    femaleClothingTitle: 'King Bibinge Manik Kalimantan',
    cultureDescription:
      'Pulau Kalimantan memiliki hutan hujan tropis yang asri, sungai-sungai besar, serta hiasan manik-manik dan bulu burung Enggang yang indah.',
    landmarkOrIcon: '🦜',
    themeColor: '#059669',
  },
  sulsel: {
    id: 'sulsel',
    name: 'Sulawesi Selatan',
    island: 'Sulawesi',
    mapCoords: { x: 465, y: 215 },
    snackId: 'nusantara_snack_pisang_ijo',
    snackName: 'Es Pisang Ijo',
    mealId: 'nusantara_meal_coto_makassar',
    mealName: 'Coto Makassar & Ikan Bakar',
    clothingId: 'adat_sulsel_baju_bodo',
    clothingName: 'Baju Bodo & Jas Tutup',
    maleClothingTitle: 'Jas Tutup & Lipa Sabbe Bugis',
    femaleClothingTitle: 'Baju Bodo Sutera Makassar',
    cultureDescription:
      'Sulawesi Selatan terkenal dengan kapal layar tangguh Pinisi yang mengarungi samudra dan Baju Bodo, salah satu busana adat tertua di dunia.',
    landmarkOrIcon: '⛵',
    themeColor: '#EC4899',
  },
  maluku: {
    id: 'maluku',
    name: 'Maluku',
    island: 'Kepulauan Maluku',
    mapCoords: { x: 585, y: 192 },
    snackId: 'nusantara_snack_kue_bagea',
    snackName: 'Kue Bagea Sagu',
    mealId: 'nusantara_meal_ikan_kuah_kuning',
    mealName: 'Ikan Kuah Kuning & Kohu-Kohu',
    clothingId: 'adat_maluku_baju_cele',
    clothingName: 'Baju Cele Maluku',
    maleClothingTitle: 'Jas Merah & Baju Cele Putera',
    femaleClothingTitle: 'Baju Cele Motif Kotak Merah',
    cultureDescription:
      'Kepulauan Maluku dikenal sebagai Kepulauan Rempah dengan musik Tifa dan Totobuang, pantai biru jernih, serta Baju Cele bermotif garis kotak ceria.',
    landmarkOrIcon: '🏝️',
    themeColor: '#E11D48',
  },
  papua: {
    id: 'papua',
    name: 'Papua',
    island: 'Papua',
    mapCoords: { x: 700, y: 210 },
    snackId: 'nusantara_snack_kue_lontar',
    snackName: 'Kue Lontar Susu & Sagu Lempeng',
    mealId: 'nusantara_meal_papeda',
    mealName: 'Papeda & Ikan Kuah Kuning',
    clothingId: 'adat_papua_cenderawasih',
    clothingName: 'Busana Adat Cenderawasih Papua',
    maleClothingTitle: 'Busana Rumbai & Mahkota Kasuari',
    femaleClothingTitle: 'Busana Rumbai & Noken Papua',
    cultureDescription:
      'Tanah Papua merupakan rumah bagi burung Cenderawasih yang elok, tas rajut tradisional Noken (warisan UNESCO), dan puncak gunung bersalju abadi.',
    landmarkOrIcon: '🦅',
    themeColor: '#D97706',
  },
};

export const REGIONAL_LIST: RegionalCultureEntry[] = Object.values(regionalData);

// ============================================================================
// GENERATE NUSANTARA SNACKS (UNLOCKS AT ANAK-ANAK: LEVEL 4+)
// ============================================================================
export const NUSANTARA_SNACKS: NusantaraFoodItem[] = [
  {
    id: 'nusantara_snack_timphan',
    name: 'Timphan – Aceh',
    category: 'food',
    regionId: 'aceh',
    regionName: 'Aceh',
    nusantaraCategory: 'snack',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 160,
    hungerRestore: 28,
    happinessRestore: 16,
    healthRestore: 10,
    xpGain: 24,
    description: 'Kue pisang lembut berisi srikaya atau kelapa manis yang dibungkus daun pisang muda.',
    culturalFact: 'Timphan adalah hidangan kehormatan khas Aceh yang selalu disajikan saat hari raya dan acara keluarga.',
    primaryColor: '#A7F3D0',
    secondaryColor: '#10B981',
    iconEmoji: '🍃',
  },
  {
    id: 'nusantara_snack_surabi',
    name: 'Surabi – Jawa Barat',
    category: 'food',
    regionId: 'jabar',
    regionName: 'Jawa Barat',
    nusantaraCategory: 'snack',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 160,
    hungerRestore: 28,
    happinessRestore: 16,
    healthRestore: 10,
    xpGain: 24,
    description: 'Panekuk tradisional tepung beras yang dimasak di atas tungku tanah liat dengan kuah kinca gula aren.',
    culturalFact: 'Surabi Bandung dan Solo sudah dikenal sejak zaman dahulu sebagai kudapan pagi yang hangat.',
    primaryColor: '#FDE68A',
    secondaryColor: '#D97706',
    iconEmoji: '🥞',
  },
  {
    id: 'nusantara_snack_bakpia',
    name: 'Bakpia – Yogyakarta',
    category: 'food',
    regionId: 'jogja',
    regionName: 'Yogyakarta',
    nusantaraCategory: 'snack',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 160,
    hungerRestore: 28,
    happinessRestore: 16,
    healthRestore: 10,
    xpGain: 24,
    description: 'Kue panggang bundar berlapis tipis dengan isian kacang hijau manis yang lembut.',
    culturalFact: 'Bakpia Pathok di Yogyakarta melambangkan akulturasi budaya yang harmonis dan menjadi buah tangan favorit.',
    primaryColor: '#FEF3C7',
    secondaryColor: '#B45309',
    iconEmoji: '🥮',
  },
  {
    id: 'nusantara_snack_bika_ambon',
    name: 'Bika Ambon – Sumatera Utara',
    category: 'food',
    regionId: 'sumut',
    regionName: 'Sumatera Utara',
    nusantaraCategory: 'snack',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 180,
    hungerRestore: 30,
    happinessRestore: 16,
    healthRestore: 10,
    xpGain: 25,
    description: 'Kue kuning berongga seperti sarang lebah dengan aroma daun jeruk dan pandan yang harum.',
    culturalFact: 'Meski bernama Bika Ambon, kue ini berasal dari Kota Medan karena pertama kali populer di Jalan Ambon, Medan.',
    primaryColor: '#FEF08A',
    secondaryColor: '#CA8A04',
    iconEmoji: '🍯',
  },
  {
    id: 'nusantara_snack_lamang_tapai',
    name: 'Kue Pinyaram – Sumatera Barat',
    category: 'food',
    regionId: 'sumbar',
    regionName: 'Sumatera Barat',
    nusantaraCategory: 'snack',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 160,
    hungerRestore: 27,
    happinessRestore: 15,
    healthRestore: 10,
    xpGain: 24,
    description: 'Kue tradisional Minangkabau dari tepung beras dan gula aren yang manis legit.',
    culturalFact: 'Pinyaram selalu hadir dalam perayaan adat Minangkabau sebagai lambang keakraban.',
    primaryColor: '#FED7AA',
    secondaryColor: '#9A3412',
    iconEmoji: '🍪',
  },
  {
    id: 'nusantara_snack_pempek_lenjer',
    name: 'Pempek Kecil – Sumatera Selatan',
    category: 'food',
    regionId: 'sumsel',
    regionName: 'Sumatera Selatan',
    nusantaraCategory: 'snack',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 180,
    hungerRestore: 30,
    happinessRestore: 16,
    healthRestore: 12,
    xpGain: 25,
    description: 'Olahan ikan tenggiri dan sagu yang kenyal bergizi dengan kuah manis ramah anak.',
    culturalFact: 'Pempek telah ada di Palembang sejak masa Kesultanan Palembang Darussalam abad ke-16.',
    primaryColor: '#FFEDD5',
    secondaryColor: '#EA580C',
    iconEmoji: '🥟',
  },
  {
    id: 'nusantara_snack_kue_cucur',
    name: 'Kue Rangi & Cucur – DKI Jakarta',
    category: 'food',
    regionId: 'jakarta',
    regionName: 'DKI Jakarta',
    nusantaraCategory: 'snack',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 150,
    hungerRestore: 26,
    happinessRestore: 15,
    healthRestore: 8,
    xpGain: 22,
    description: 'Kue kelapa panggang khas Betawi dengan olesan gula merah kental yang harum.',
    culturalFact: 'Kue Rangi dan Kue Cucur merupakan jajanan klasik anak-anak Jakarta sejak tempo dulu.',
    primaryColor: '#FDE68A',
    secondaryColor: '#B45309',
    iconEmoji: '🧇',
  },
  {
    id: 'nusantara_snack_klepon',
    name: 'Klepon – Jawa Tengah',
    category: 'food',
    regionId: 'jateng',
    regionName: 'Jawa Tengah',
    nusantaraCategory: 'snack',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 150,
    hungerRestore: 26,
    happinessRestore: 18,
    healthRestore: 9,
    xpGain: 23,
    description: 'Bola-bola tepung ketan hijau pandan berisi gula merah cair dengan taburan kelapa parut.',
    culturalFact: 'Klepon mengajarkan filosofi kesederhanaan di luar namun menyimpan rasa manis di dalam.',
    primaryColor: '#BBF7D0',
    secondaryColor: '#16A34A',
    iconEmoji: '🟢',
  },
  {
    id: 'nusantara_snack_onde_onde',
    name: 'Onde-Onde – Jawa Timur',
    category: 'food',
    regionId: 'jatim',
    regionName: 'Jawa Timur',
    nusantaraCategory: 'snack',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 160,
    hungerRestore: 28,
    happinessRestore: 16,
    healthRestore: 10,
    xpGain: 24,
    description: 'Kue bulat berbalut biji wijen renyah dengan isian pasta kacang hijau lembut.',
    culturalFact: 'Kota Mojokerto di Jawa Timur terkenal sebagai kota Onde-onde sejak zaman Majapahit.',
    primaryColor: '#FEF3C7',
    secondaryColor: '#D97706',
    iconEmoji: '🧆',
  },
  {
    id: 'nusantara_snack_pie_susu',
    name: 'Pie Susu – Bali',
    category: 'food',
    regionId: 'bali',
    regionName: 'Bali',
    nusantaraCategory: 'snack',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 180,
    hungerRestore: 28,
    happinessRestore: 18,
    healthRestore: 10,
    xpGain: 25,
    description: 'Kue pai renyah tipis dengan fla susu manis lembut di bagian tengahnya.',
    culturalFact: 'Pie Susu Bali sangat disukai anak-anak karena teksturnya yang lembut dan kaya kalsium.',
    primaryColor: '#FEF9C3',
    secondaryColor: '#EAB308',
    iconEmoji: '🥧',
  },
  {
    id: 'nusantara_snack_amplang',
    name: 'Amplang Ikan – Kalimantan',
    category: 'food',
    regionId: 'kalimantan',
    regionName: 'Kalimantan',
    nusantaraCategory: 'snack',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 160,
    hungerRestore: 27,
    happinessRestore: 15,
    healthRestore: 12,
    xpGain: 24,
    description: 'Kerupuk ikan tenggiri atau pipih berbentuk bulat mungil yang gurih dan kaya protein.',
    culturalFact: 'Amplang berasal dari pesisir sungai dan laut Kalimantan yang kaya akan hasil ikan segar.',
    primaryColor: '#FFEDD5',
    secondaryColor: '#F97316',
    iconEmoji: '🍘',
  },
  {
    id: 'nusantara_snack_pisang_ijo',
    name: 'Pisang Ijo – Sulawesi Selatan',
    category: 'food',
    regionId: 'sulsel',
    regionName: 'Sulawesi Selatan',
    nusantaraCategory: 'snack',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 200,
    hungerRestore: 30,
    happinessRestore: 18,
    healthRestore: 11,
    xpGain: 25,
    description: 'Pisang raja manis berbalut adonan tepung hijau pandan dengan saus bubur sumsum lembut.',
    culturalFact: 'Pisang Ijo adalah hidangan penutup ikonik dari Makassar yang menyegarkan dan mengenyangkan.',
    primaryColor: '#DCFCE7',
    secondaryColor: '#EC4899',
    iconEmoji: '🍌',
  },
  {
    id: 'nusantara_snack_kue_bagea',
    name: 'Kue Bagea – Maluku',
    category: 'food',
    regionId: 'maluku',
    regionName: 'Maluku',
    nusantaraCategory: 'snack',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 160,
    hungerRestore: 27,
    happinessRestore: 15,
    healthRestore: 11,
    xpGain: 24,
    description: 'Kue sagu panggang berpadu kacang kenari dan kayu manis khas Kepulauan Maluku.',
    culturalFact: 'Pohon sagu dan kacang kenari tumbuh subur di Maluku dan menjadi sumber pangan bergizi.',
    primaryColor: '#F5EFE6',
    secondaryColor: '#A16207',
    iconEmoji: '🥜',
  },
  {
    id: 'nusantara_snack_kue_lontar',
    name: 'Kue Lontar – Papua',
    category: 'food',
    regionId: 'papua',
    regionName: 'Papua',
    nusantaraCategory: 'snack',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 200,
    hungerRestore: 30,
    happinessRestore: 18,
    healthRestore: 12,
    xpGain: 25,
    description: 'Pai susu besar yang dipanggang di dalam piring keramik antik khas masyarakat Papua.',
    culturalFact: 'Nama Kue Lontar berasal dari kata Belanda "Rond Taart" (kue bundar) yang diwariskan turun-temurun di Papua.',
    primaryColor: '#FEF08A',
    secondaryColor: '#D97706',
    iconEmoji: '🍮',
  },
];

// ============================================================================
// GENERATE NUSANTARA REGIONAL MEALS (UNLOCKS AT DEWASA: LEVEL 6+)
// ============================================================================
export const NUSANTARA_MEALS: NusantaraFoodItem[] = [
  {
    id: 'nusantara_meal_mie_aceh',
    name: 'Mie Aceh – Aceh',
    category: 'food',
    regionId: 'aceh',
    regionName: 'Aceh',
    nusantaraCategory: 'meal',
    unlockPhase: 'DEWASA',
    minLevel: 6,
    price: 250,
    hungerRestore: 52,
    happinessRestore: 22,
    healthRestore: 20,
    xpGain: 35,
    description: 'Mie kuning tebal dengan kuah kaldu rempah hangat, potongan daging, dan emping renyah.',
    culturalFact: 'Mie Aceh menunjukkan kekayaan rempah Nusantara di ujung barat Pulau Sumatera.',
    primaryColor: '#FED7AA',
    secondaryColor: '#EA580C',
    iconEmoji: '🍜',
  },
  {
    id: 'nusantara_meal_nasi_timbel',
    name: 'Nasi Timbel – Jawa Barat',
    category: 'food',
    regionId: 'jabar',
    regionName: 'Jawa Barat',
    nusantaraCategory: 'meal',
    unlockPhase: 'DEWASA',
    minLevel: 6,
    price: 250,
    hungerRestore: 52,
    happinessRestore: 22,
    healthRestore: 22,
    xpGain: 35,
    description: 'Nasi hangat berbungkus daun pisang dengan lauk ayam goreng, tahu, tempe, dan sayur asem segar.',
    culturalFact: 'Membungkus nasi panas di dalam daun pisang (timbel) menghasilkan aroma alami yang khas di tanah Sunda.',
    primaryColor: '#DCFCE7',
    secondaryColor: '#15803D',
    iconEmoji: '🍱',
  },
  {
    id: 'nusantara_meal_gudeg',
    name: 'Gudeg – Yogyakarta',
    category: 'food',
    regionId: 'jogja',
    regionName: 'Yogyakarta',
    nusantaraCategory: 'meal',
    unlockPhase: 'DEWASA',
    minLevel: 6,
    price: 250,
    hungerRestore: 52,
    happinessRestore: 24,
    healthRestore: 20,
    xpGain: 35,
    description: 'Hidangan nangka muda yang dimasak perlahan dengan santan dan gula aren, disajikan bersama telur pindang dan krecek.',
    culturalFact: 'Gudeg telah menjadi ikon kuliner Yogyakarta sejak pembangunan Kerajaan Mataram Islam pada abad ke-16.',
    primaryColor: '#FEF3C7',
    secondaryColor: '#92400E',
    iconEmoji: '🍛',
  },
  {
    id: 'nusantara_meal_soto_medan',
    name: 'Soto Medan – Sumatera Utara',
    category: 'food',
    regionId: 'sumut',
    regionName: 'Sumatera Utara',
    nusantaraCategory: 'meal',
    unlockPhase: 'DEWASA',
    minLevel: 6,
    price: 220,
    hungerRestore: 50,
    happinessRestore: 20,
    healthRestore: 20,
    xpGain: 34,
    description: 'Soto bersantan kuning keemasan yang gurih dengan suwiran ayam, perkedel kentang, dan tauge.',
    culturalFact: 'Soto Medan menggunakan rempah jintan dan bunga lawang yang memberikan kehangatan khas Sumatera Utara.',
    primaryColor: '#FEF9C3',
    secondaryColor: '#CA8A04',
    iconEmoji: '🍲',
  },
  {
    id: 'nusantara_meal_rendang',
    name: 'Rendang Minang – Sumatera Barat',
    category: 'food',
    regionId: 'sumbar',
    regionName: 'Sumatera Barat',
    nusantaraCategory: 'meal',
    unlockPhase: 'DEWASA',
    minLevel: 6,
    price: 300,
    hungerRestore: 55,
    happinessRestore: 25,
    healthRestore: 22,
    xpGain: 38,
    description: 'Daging sapi empuk yang dimasak lama dengan santan dan rempah-rempah pilihan Minangkabau.',
    culturalFact: 'Rendang memiliki filosofi kesabaran, kebijaksanaan, dan ketekunan dalam budaya masyarakat Minang.',
    primaryColor: '#FFEDD5',
    secondaryColor: '#9A3412',
    iconEmoji: '🥩',
  },
  {
    id: 'nusantara_meal_pempek_kapal',
    name: 'Pempek Kapal Selam – Sumatera Selatan',
    category: 'food',
    regionId: 'sumsel',
    regionName: 'Sumatera Selatan',
    nusantaraCategory: 'meal',
    unlockPhase: 'DEWASA',
    minLevel: 6,
    price: 250,
    hungerRestore: 50,
    happinessRestore: 22,
    healthRestore: 20,
    xpGain: 35,
    description: 'Pempek ikan ukuran besar berisi telur utuh dengan kuah dan potongan mentimun segar.',
    culturalFact: 'Dinamakan Kapal Selam karena adonan pempek berisi telur akan tenggelam dulu saat direbus sebelum mengapung ketika matang.',
    primaryColor: '#FEF3C7',
    secondaryColor: '#D97706',
    iconEmoji: '🥣',
  },
  {
    id: 'nusantara_meal_soto_betawi',
    name: 'Soto Betawi & Nasi Uduk – DKI Jakarta',
    category: 'food',
    regionId: 'jakarta',
    regionName: 'DKI Jakarta',
    nusantaraCategory: 'meal',
    unlockPhase: 'DEWASA',
    minLevel: 6,
    price: 250,
    hungerRestore: 50,
    happinessRestore: 22,
    healthRestore: 20,
    xpGain: 35,
    description: 'Kuah soto susu dan santan yang gurih disajikan dengan nasi uduk hangat dan emping.',
    culturalFact: 'Soto Betawi memadukan tradisi kuliner Nusantara dengan sentuhan susu segar yang creamy.',
    primaryColor: '#FFFBEB',
    secondaryColor: '#F59E0B',
    iconEmoji: '🍚',
  },
  {
    id: 'nusantara_meal_garang_asem',
    name: 'Nasi Liwet & Garang Asem – Jawa Tengah',
    category: 'food',
    regionId: 'jateng',
    regionName: 'Jawa Tengah',
    nusantaraCategory: 'meal',
    unlockPhase: 'DEWASA',
    minLevel: 6,
    price: 250,
    hungerRestore: 50,
    happinessRestore: 22,
    healthRestore: 22,
    xpGain: 35,
    description: 'Nasi gurih dimasak santan bersama ayam kukus daun pisang berkuah belimbing wuluh segar.',
    culturalFact: 'Nasi Liwet Solo dan Garang Asem Kudus menjadi simbol kebersamaan saat makan bersama.',
    primaryColor: '#ECFCCB',
    secondaryColor: '#65A30D',
    iconEmoji: '🍗',
  },
  {
    id: 'nusantara_meal_rawon',
    name: 'Rawon – Jawa Timur',
    category: 'food',
    regionId: 'jatim',
    regionName: 'Jawa Timur',
    nusantaraCategory: 'meal',
    unlockPhase: 'DEWASA',
    minLevel: 6,
    price: 275,
    hungerRestore: 52,
    happinessRestore: 23,
    healthRestore: 22,
    xpGain: 36,
    description: 'Sup daging berkuah hitam alami dari buah keluak pilihan dengan kecambah pendek dan telur asin.',
    culturalFact: 'Rawon dinobatkan sebagai salah satu sup terenak di dunia berkat cita rasa buah keluak yang unik.',
    primaryColor: '#E7E5E4',
    secondaryColor: '#44403C',
    iconEmoji: '🥘',
  },
  {
    id: 'nusantara_meal_ayam_betutu',
    name: 'Nasi Campur & Ayam Betutu – Bali',
    category: 'food',
    regionId: 'bali',
    regionName: 'Bali',
    nusantaraCategory: 'meal',
    unlockPhase: 'DEWASA',
    minLevel: 6,
    price: 275,
    hungerRestore: 52,
    happinessRestore: 24,
    healthRestore: 22,
    xpGain: 36,
    description: 'Olahan ayam berbumbu Base Genep khas Bali dengan sate lilit ikan dan sayur urap.',
    culturalFact: 'Base Genep merupakan racikan rempah lengkap Bali yang melambangkan keseimbangan rasa.',
    primaryColor: '#FEF08A',
    secondaryColor: '#EA580C',
    iconEmoji: '🍖',
  },
  {
    id: 'nusantara_meal_soto_banjar',
    name: 'Soto Banjar – Kalimantan',
    category: 'food',
    regionId: 'kalimantan',
    regionName: 'Kalimantan',
    nusantaraCategory: 'meal',
    unlockPhase: 'DEWASA',
    minLevel: 6,
    price: 250,
    hungerRestore: 50,
    happinessRestore: 22,
    healthRestore: 22,
    xpGain: 35,
    description: 'Soto ayam beraroma kayu manis dan pala yang disajikan bersama potongan ketupat dan perkedel.',
    culturalFact: 'Soto Banjar adalah kebanggaan kuliner masyarakat Kalimantan Selatan di tepian Sungai Martapura.',
    primaryColor: '#FEF9C3',
    secondaryColor: '#16A34A',
    iconEmoji: '🍜',
  },
  {
    id: 'nusantara_meal_coto_makassar',
    name: 'Coto Makassar – Sulawesi Selatan',
    category: 'food',
    regionId: 'sulsel',
    regionName: 'Sulawesi Selatan',
    nusantaraCategory: 'meal',
    unlockPhase: 'DEWASA',
    minLevel: 6,
    price: 275,
    hungerRestore: 52,
    happinessRestore: 23,
    healthRestore: 22,
    xpGain: 36,
    description: 'Sup kuah kacang tanah dan 40 macam rempah tradisional yang disajikan bersama ketupat atau buras.',
    culturalFact: 'Coto Makassar sudah disajikan sejak masa Kerajaan Gowa pada abad ke-16.',
    primaryColor: '#FED7AA',
    secondaryColor: '#B45309',
    iconEmoji: '🍲',
  },
  {
    id: 'nusantara_meal_ikan_kuah_kuning',
    name: 'Ikan Kuah Kuning – Maluku',
    category: 'food',
    regionId: 'maluku',
    regionName: 'Maluku',
    nusantaraCategory: 'meal',
    unlockPhase: 'DEWASA',
    minLevel: 6,
    price: 250,
    hungerRestore: 50,
    happinessRestore: 22,
    healthRestore: 25,
    xpGain: 35,
    description: 'Ikan tongkol atau kakap segar dalam kuah kunyit dan jeruk nipis dengan daun kemangi harum.',
    culturalFact: 'Laut Maluku yang jernih menghasilkan ikan segar berkualitas tinggi yang kaya Omega-3.',
    primaryColor: '#FEF08A',
    secondaryColor: '#0284C7',
    iconEmoji: '🐟',
  },
  {
    id: 'nusantara_meal_papeda',
    name: 'Papeda & Kuah Kuning – Papua',
    category: 'food',
    regionId: 'papua',
    regionName: 'Papua',
    nusantaraCategory: 'meal',
    unlockPhase: 'DEWASA',
    minLevel: 6,
    price: 275,
    hungerRestore: 52,
    happinessRestore: 24,
    healthRestore: 25,
    xpGain: 36,
    description: 'Bubur sagu hangat yang kenyal disajikan dengan ikan kuah kuning kunyit yang segar dan sehat.',
    culturalFact: 'Papeda diputar menggunakan dua garpu bambu khusus bernama Gata-gata dan sangat kaya serat.',
    primaryColor: '#E0F2FE',
    secondaryColor: '#F59E0B',
    iconEmoji: '🥣',
  },
];

// ============================================================================
// GENERATE NUSANTARA TRADITIONAL CLOTHING (UNLOCKS AT ANAK-ANAK: LEVEL 4+)
// ============================================================================
export const NUSANTARA_CLOTHING: NusantaraClothingItem[] = [
  {
    id: 'adat_aceh_ulee_balang',
    name: 'Ulee Balang – Aceh',
    category: 'clothes',
    subCategory: 'outfit',
    regionId: 'aceh',
    regionName: 'Aceh',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 350,
    maleTitle: 'Ulee Balang (Linto Baro)',
    femaleTitle: 'Ulee Balang (Daro Baro)',
    headpieceStyle: 'aceh_crown',
    description: 'Pakaian adat kebesaran Aceh dengan sulaman benang emas Kasab dan penutup kepala Meukeutop / Patam Dhoe.',
    culturalFact: 'Busana Ulee Balang memadukan warna hitam, merah, dan emas yang melambangkan keteguhan serta kemuliaan.',
    primaryColor: '#1E1B18',
    secondaryColor: '#F59E0B',
    accentColor: '#DC2626',
    iconEmoji: '👑',
  },
  {
    id: 'adat_jabar_kebaya_sunda',
    name: 'Kebaya Sunda – Jawa Barat',
    category: 'clothes',
    subCategory: 'outfit',
    regionId: 'jabar',
    regionName: 'Jawa Barat',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 350,
    maleTitle: 'Beskap Sunda & Bendo',
    femaleTitle: 'Kebaya Sunda & Mahkota Siger',
    headpieceStyle: 'sunda_siger',
    description: 'Busana anggun Jawa Barat dengan kain batik Rereng serta mahkota Siger Sunda / ikat kepala Bendo.',
    culturalFact: 'Kebaya dan Beskap Sunda melambangkan kesantunan, kehalusan budi, dan keselarasan dengan alam.',
    primaryColor: '#10B981',
    secondaryColor: '#FBBF24',
    accentColor: '#FEF3C7',
    iconEmoji: '🌺',
  },
  {
    id: 'adat_jogja_kesatrian',
    name: 'Kesatrian – Yogyakarta',
    category: 'clothes',
    subCategory: 'outfit',
    regionId: 'jogja',
    regionName: 'Yogyakarta',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 350,
    maleTitle: 'Surjan Kesatrian & Blangkon',
    femaleTitle: 'Kebaya Kesatrian Yogyakarta',
    headpieceStyle: 'jogja_blangkon',
    description: 'Busana adat Keraton Yogyakarta dengan motif lurik/batik klasik, kain jarik wiru, dan blangkon/sanggul.',
    culturalFact: 'Busana Kesatrian mengajarkan sikap ksatria yang jujur, bijaksana, dan menghormati sesama.',
    primaryColor: '#78350F',
    secondaryColor: '#D97706',
    accentColor: '#FEF3C7',
    iconEmoji: '🏯',
  },
  {
    id: 'adat_sumut_ulos',
    name: 'Busana Ulos – Sumatera Utara',
    category: 'clothes',
    subCategory: 'outfit',
    regionId: 'sumut',
    regionName: 'Sumatera Utara',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 320,
    maleTitle: 'Busana Adat Ulos & Sortali Putera',
    femaleTitle: 'Kebaya Ulos & Sortali Puteri',
    headpieceStyle: 'ulos_headband',
    description: 'Pakaian adat Batak dengan selempang kain tenun Ulos merah-hitam dan ikat kepala emas Sortali.',
    culturalFact: 'Ikat kepala Sortali dan kain Ulos melambangkan ikatan persaudaraan yang erat di Sumatera Utara.',
    primaryColor: '#991B1B',
    secondaryColor: '#1F2937',
    accentColor: '#FBBF24',
    iconEmoji: '🧣',
  },
  {
    id: 'adat_sumbar_bundo_kanduang',
    name: 'Bundo Kanduang – Sumatera Barat',
    category: 'clothes',
    subCategory: 'outfit',
    regionId: 'sumbar',
    regionName: 'Sumatera Barat',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 375,
    maleTitle: 'Busana Penghulu Minang',
    femaleTitle: 'Bundo Kanduang Tingkuluak Tanduak',
    headpieceStyle: 'minang_tanduk',
    description: 'Busana adat Minangkabau bersulam songket emas dengan penutup kepala Tingkuluak / Deta.',
    culturalFact: 'Penutup kepala Tingkuluak Tanduak menyerupai atap gonjong Rumah Gadang di Sumatera Barat.',
    primaryColor: '#B91C1C',
    secondaryColor: '#F59E0B',
    accentColor: '#FEF08A',
    iconEmoji: '🏠',
  },
  {
    id: 'adat_sumsel_aesan_gede',
    name: 'Aesan Gede – Sumatera Selatan',
    category: 'clothes',
    subCategory: 'outfit',
    regionId: 'sumsel',
    regionName: 'Sumatera Selatan',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 400,
    maleTitle: 'Aesan Gede Songket Putera',
    femaleTitle: 'Aesan Gede Mahkota Karsuhun',
    headpieceStyle: 'palembang_aesan',
    description: 'Busana keemasan Sriwijaya dengan kain Songket Palembang dan mahkota bunga cempaka emas.',
    culturalFact: 'Aesan Gede berarti hiasan kebesaran yang mencerminkan kejayaan Kerajaan Sriwijaya.',
    primaryColor: '#E11D48',
    secondaryColor: '#FACC15',
    accentColor: '#FEF08A',
    iconEmoji: '✨',
  },
  {
    id: 'adat_jakarta_betawi',
    name: 'Sadariah & Encim – DKI Jakarta',
    category: 'clothes',
    subCategory: 'outfit',
    regionId: 'jakarta',
    regionName: 'DKI Jakarta',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 300,
    maleTitle: 'Baju Sadariah, Sarung & Peci',
    femaleTitle: 'Kebaya Encim & Kerudung Betawi',
    headpieceStyle: 'betawi_peci',
    description: 'Busana khas Betawi yang nyaman dengan sarung kotak di leher atau kebaya bordir warna cerah.',
    culturalFact: 'Baju Sadariah dan Kebaya Encim sering dikenakan dalam acara Abang None dan festival budaya Jakarta.',
    primaryColor: '#F97316',
    secondaryColor: '#DC2626',
    accentColor: '#FEF3C7',
    iconEmoji: '🎭',
  },
  {
    id: 'adat_jateng_jawi_jangkep',
    name: 'Jawi Jangkep – Jawa Tengah',
    category: 'clothes',
    subCategory: 'outfit',
    regionId: 'jateng',
    regionName: 'Jawa Tengah',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 320,
    maleTitle: 'Beskap Jawi Jangkep & Blangkon Solo',
    femaleTitle: 'Kebaya Beludru Jawa Tengah',
    headpieceStyle: 'jogja_blangkon',
    description: 'Busana beludru hitam/ungu elegan berhias bros keemasan dan kain batik Parang.',
    culturalFact: 'Jawi Jangkep mengajarkan ketenangan sikap dan ketelitian dalam bertindak.',
    primaryColor: '#312E81',
    secondaryColor: '#FBBF24',
    accentColor: '#D97706',
    iconEmoji: '👘',
  },
  {
    id: 'adat_jatim_pesaan',
    name: 'Pesa’an & Rancongan – Jawa Timur',
    category: 'clothes',
    subCategory: 'outfit',
    regionId: 'jatim',
    regionName: 'Jawa Timur',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 320,
    maleTitle: 'Baju Pesa’an Garis Merah Putih',
    femaleTitle: 'Kebaya Rancongan Merah',
    headpieceStyle: 'madura_odheng',
    description: 'Busana khas Jawa Timur & Madura dengan kaos belang merah-putih, rompi hitam, dan ikat kepala Odheng.',
    culturalFact: 'Garis merah-putih tegas pada baju Pesa’an melambangkan semangat, keberanian, dan kerja keras.',
    primaryColor: '#DC2626',
    secondaryColor: '#1E293B',
    accentColor: '#FFFFFF',
    iconEmoji: '🧣',
  },
  {
    id: 'adat_bali_payas_agung',
    name: 'Payas Agung – Bali',
    category: 'clothes',
    subCategory: 'outfit',
    regionId: 'bali',
    regionName: 'Bali',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 400,
    maleTitle: 'Payas Agung & Udeng Prada Emas',
    femaleTitle: 'Payas Agung Mahkota Gelung',
    headpieceStyle: 'bali_udeng',
    description: 'Pakaian adat Bali berbalut kain Prada emas berkilau dan mahkota bunga Sandat keemasan.',
    culturalFact: 'Kain Prada Bali dihiasi motif emas yang melambangkan rasa syukur dan keindahan seni Pulau Bali.',
    primaryColor: '#D97706',
    secondaryColor: '#FDE047',
    accentColor: '#DC2626',
    iconEmoji: '⛩️',
  },
  {
    id: 'adat_kalimantan_king_baba',
    name: 'King Baba & Bibinge – Kalimantan',
    category: 'clothes',
    subCategory: 'outfit',
    regionId: 'kalimantan',
    regionName: 'Kalimantan',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 375,
    maleTitle: 'King Baba & Mahkota Bulu Enggang',
    femaleTitle: 'King Bibinge Manik Dayak',
    headpieceStyle: 'dayak_feathers',
    description: 'Rompi kulit kayu berhias manik-manik geometris warna-warni dan mahkota bulu burung Enggang.',
    culturalFact: 'Burung Enggang sangat dihormati masyarakat Dayak di Kalimantan sebagai simbol perdamaian dan kelestarian hutan.',
    primaryColor: '#065F46',
    secondaryColor: '#F59E0B',
    accentColor: '#EF4444',
    iconEmoji: '🪶',
  },
  {
    id: 'adat_sulsel_baju_bodo',
    name: 'Baju Bodo & Jas Tutup – Sulawesi Selatan',
    category: 'clothes',
    subCategory: 'outfit',
    regionId: 'sulsel',
    regionName: 'Sulawesi Selatan',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 375,
    maleTitle: 'Jas Tutup & Sarung Sutera Bugis',
    femaleTitle: 'Baju Bodo & Mahkota Saloko',
    headpieceStyle: 'bugis_bodo',
    description: 'Busana sutera Bugis-Makassar berwarna cerah dengan sarung tenun Lipa Sabbe dan perhiasan emas.',
    culturalFact: 'Baju Bodo dikenal sebagai salah satu busana tradisional tertua di dunia dengan potongan segi empat yang anggun.',
    primaryColor: '#EC4899',
    secondaryColor: '#FACC15',
    accentColor: '#FDE047',
    iconEmoji: '👑',
  },
  {
    id: 'adat_maluku_baju_cele',
    name: 'Baju Cele – Maluku',
    category: 'clothes',
    subCategory: 'outfit',
    regionId: 'maluku',
    regionName: 'Maluku',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 320,
    maleTitle: 'Jas Cele Merah & Kemeja Renda',
    femaleTitle: 'Baju Cele Kotak Merah Putih',
    headpieceStyle: 'maluku_cele',
    description: 'Busana merah cerah bermotif garis kotak-kotak putih dengan hiasan bunga Konde Lenso.',
    culturalFact: 'Warna merah pada Baju Cele Maluku melambangkan keceriaan, kehangatan, dan semangat hidup masyarakat kepulauan.',
    primaryColor: '#E11D48',
    secondaryColor: '#FFFFFF',
    accentColor: '#FBBF24',
    iconEmoji: '🌺',
  },
  {
    id: 'adat_papua_cenderawasih',
    name: 'Busana Adat Cenderawasih – Papua',
    category: 'clothes',
    subCategory: 'outfit',
    regionId: 'papua',
    regionName: 'Papua',
    unlockPhase: 'ANAK_ANAK',
    minLevel: 4,
    price: 400,
    maleTitle: 'Busana Rumbai & Mahkota Cenderawasih',
    femaleTitle: 'Busana Rumbai, Manik & Tas Noken',
    headpieceStyle: 'papua_crown',
    description: 'Busana serat alam rumbai dengan kalung manik-manik dan mahkota bulu indah khas Tanah Papua.',
    culturalFact: 'Busana adat Papua dibuat dari bahan alami ramah lingkungan dan dilengkapi tas rajut Noken.',
    primaryColor: '#B45309',
    secondaryColor: '#FDE047',
    accentColor: '#EF4444',
    iconEmoji: '🦅',
  },
];

// ============================================================================
// VALIDATION & REGIONAL EVALUATION FUNCTIONS
// ============================================================================

export function validateFoodPhaseAccess(
  foodId: string,
  level: number
): { allowed: boolean; reason?: string } {
  const phase = getLifePhaseFromLevel(level);
  const snack = NUSANTARA_SNACKS.find((s) => s.id === foodId);
  const meal = NUSANTARA_MEALS.find((m) => m.id === foodId);

  if (phase === 'BAYI') {
    if (snack || meal) {
      return {
        allowed: false,
        reason: 'Menu makanan Nusantara akan terbuka ketika aku tumbuh menjadi anak-anak.',
      };
    }
    // In BAYI phase, restrict to Susu (food_milk) and Bubur Polos Khusus Bayi (food_porridge)
    if (foodId !== 'food_milk' && foodId !== 'food_porridge') {
      return {
        allowed: false,
        reason: 'Pada Fase Bayi, aku hanya boleh mengonsumsi Susu dan Bubur polos khusus bayi.',
      };
    }
    return { allowed: true };
  }

  if (phase === 'ANAK_ANAK') {
    if (meal) {
      return {
        allowed: false,
        reason: 'Makanan berat Nusantara (Regional Meals) akan terbuka ketika aku tumbuh dewasa (Stage 7).',
      };
    }
    return { allowed: true };
  }

  // DEWASA phase can consume all snacks and meals
  return { allowed: true };
}

export function validateClothingPhaseAccess(
  clothingId: string,
  level: number
): { allowed: boolean; reason?: string } {
  const phase = getLifePhaseFromLevel(level);
  const adat = NUSANTARA_CLOTHING.find((c) => c.id === clothingId);
  if (adat && phase === 'BAYI') {
    return {
      allowed: false,
      reason: 'Pakaian Adat Nusantara baru dapat dibuka ketika karakter mencapai fase ANAK-ANAK (Level 4).',
    };
  }
  return { allowed: true };
}

export interface RegionalIdentityEvaluationResult {
  status: 'single_winner' | 'tie' | 'all_zero';
  highestScore: number;
  winningRegion: RegionalCultureEntry | null;
  candidateRegions: RegionalCultureEntry[];
  recommendedClothing: NusantaraClothingItem | null;
}

export function evaluateRegionalIdentity(
  regionScores: Record<RegionId, number>
): RegionalIdentityEvaluationResult {
  let maxScore = 0;
  for (const rId of Object.keys(regionalData) as RegionId[]) {
    const sc = regionScores[rId] || 0;
    if (sc > maxScore) {
      maxScore = sc;
    }
  }

  // Case 1: All scores are 0 -> Give default choices (Aceh, Jawa Barat, Yogyakarta, Bali, dll.)
  if (maxScore === 0) {
    return {
      status: 'all_zero',
      highestScore: 0,
      winningRegion: null,
      candidateRegions: REGIONAL_LIST,
      recommendedClothing: null,
    };
  }

  const topRegions = (Object.keys(regionalData) as RegionId[])
    .filter((rId) => (regionScores[rId] || 0) === maxScore)
    .map((rId) => regionalData[rId]);

  // Case 2: Single clear winner
  if (topRegions.length === 1) {
    const winner = topRegions[0];
    const clothing =
      NUSANTARA_CLOTHING.find((c) => c.id === winner.clothingId) || NUSANTARA_CLOTHING[0];
    return {
      status: 'single_winner',
      highestScore: maxScore,
      winningRegion: winner,
      candidateRegions: [winner],
      recommendedClothing: clothing,
    };
  }

  // Case 3: Tie between multiple top regions
  return {
    status: 'tie',
    highestScore: maxScore,
    winningRegion: null,
    candidateRegions: topRegions,
    recommendedClothing: null,
  };
}

export function getClothingTitleForGender(
  item: NusantaraClothingItem,
  gender: BabyGender
): string {
  return gender === 'boy' ? item.maleTitle : item.femaleTitle;
}
