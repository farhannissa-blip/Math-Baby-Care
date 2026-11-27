// Complete Game Data, Catalogs, Growth Stages, Personalities, Store Items, and Save State Types
import { AudioSettings } from '../utils/sound';
import {
  INITIAL_REGION_SCORES,
  LifePhase,
  NUSANTARA_CLOTHING,
  NUSANTARA_MEALS,
  NUSANTARA_SNACKS,
  RegionId,
} from './nusantaraData';
import {
  CharacterLifeData,
  createInitialCharacterLifeData,
} from './lifeProgressionData';

import {
  COOKING_RECIPES,
  createInitialCookingInventory,
  createInitialHarvestInventory,
  createInitialPlants,
  GardenPlantRecord,
  PersistentActiveFoodState,
  WorldLocationId,
} from './worldAndActivityData';

export type BabyGender = 'girl' | 'boy';

export type BabyPersonalityId = 'playful' | 'sleepy' | 'cheerful' | 'curious' | 'music_lover';

export type RoomId = WorldLocationId;

export type BabyActionState =
  | 'idle'
  | 'smiling'
  | 'laughing'
  | 'crying'
  | 'yawning'
  | 'sleeping'
  | 'crawling'
  | 'sitting'
  | 'waving'
  | 'eating'
  | 'drinking'
  | 'playing'
  | 'bathing'
  | 'surprised'
  | 'sleepy'
  | 'loved'
  | 'carried'
  | 'waking_up'
  | 'hungry'
  | 'towel_drying'
  | 'bored'
  | 'fresh'
  | 'reading'
  | 'studying'
  | 'cooking'
  | 'dancing'
  | 'walking'
  | 'scratching_head'
  | 'make_heart'
  | 'big_smile'
  | 'comfort_player'
  | 'happy_jump'
  | 'clap_hands'
  | 'curious_head_tilt'
  | 'screen_touch'
  | 'blow_kiss'
  | 'sick'
  | 'proud';

export type CharacterEmotion = 'happy' | 'bored' | 'sad' | 'sleepy' | 'fresh';

export type BodyZoneId = 'head' | 'body' | 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';

export interface BathingZoneStatus {
  foam: number; // 0 - 100
  cleaned: boolean;
}

export type BathingProgressState = Record<BodyZoneId, BathingZoneStatus>;

export type HairStyleId =
  | 'kuncir_dua'
  | 'ikal_lembut'
  | 'jambul_lucu'
  | 'bob_poni'
  | 'keriting_gembul'
  | 'tipis_bayi';

export interface BabyAppearance {
  skinTone: string;
  hairStyle: HairStyleId;
  hairColor: string;
  eyeColor: string;
  equippedOutfit: string;     // clothing item id
  equippedHat: string | null; // hat/hair accessory item id
  equippedGlasses: string | null;
  equippedShoes: string | null;
}

export interface BabyNeeds {
  hunger: number;    // 0 - 100
  energy: number;    // 0 - 100
  hygiene: number;   // 0 - 100 (cleanliness)
  happiness: number; // 0 - 100
  health: number;    // 0 - 100
  love: number;      // 0 - 100 (social / affection)
}

export interface RoomDecorState {
  crib: string;
  rug: string;
  lamp: string;
  wallpaper: string;
  wallDecor: string;
  plushDecor: string | null;
}

export type StoreCategory = 'clothes' | 'food' | 'toys' | 'furniture';

export type ClothingSlot = 'outfit' | 'hat' | 'glasses' | 'shoes';
export type FurnitureSlot = 'crib' | 'rug' | 'lamp' | 'wallpaper' | 'wallDecor' | 'plushDecor';

export interface StoreItem {
  id: string;
  name: string;
  category: StoreCategory;
  subCategory?: ClothingSlot | FurnitureSlot;
  price: number;
  description: string;
  minLevel?: number;
  // Effects for food / toys
  hungerRestore?: number;
  energyRestore?: number;
  hygieneRestore?: number;
  happinessRestore?: number;
  healthRestore?: number;
  loveRestore?: number;
  xpGain?: number;
  // Visual styling data for rendering on baby or in room
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  pattern?: 'plain' | 'stars' | 'stripes' | 'floral' | 'animal_bunny' | 'animal_bear' | 'animal_dino' | 'doctor' | 'astronaut' | 'chef' | 'party';
  iconEmoji: string;
  isRare?: boolean;
}

export interface GrowthStageInfo {
  level: number;
  stageCode:
    | 'newborn'
    | 'crawling_baby'
    | 'toddler'
    | 'young_child'
    | 'older_child'
    | 'teenager'
    | 'adult';
  title: string;
  indonesianTitle: string;
  evolutionMessage: string;
  xpRequired: number;
  description: string;
  scale: number;
  unlockedActivities: string[];
  rewardCoins: number;
}

export interface PersonalityInfo {
  id: BabyPersonalityId;
  name: string;
  indonesianName: string;
  description: string;
  favoriteActivity: string;
  badgeColor: string;
}

export interface DailyMission {
  id: string;
  title: string;
  target: number;
  progress: number;
  rewardCoins: number;
  rewardXp: number;
  claimed: boolean;
  type: 'feed_milk' | 'bath' | 'play' | 'math_solve' | 'math_streak' | 'buy_item' | 'love_baby' | 'use_toy';
}

export interface BabyMemory {
  id: string;
  title: string;
  description: string;
  date: string;
  babyLevel: number;
  outfitId: string;
  badgeType: 'level_up' | 'costume' | 'math_master' | 'rare_item' | 'first_care';
}

export interface MathHistoryStats {
  totalSolved: number;
  totalCorrect: number;
  bestStreak: number;
  currentStreak: number;
  solvedByGrade: Record<number, number>;
}

export interface ConsumedFoodRecord {
  id: string;
  foodId: string;
  foodName: string;
  regionId?: RegionId;
  date: string;
}

export interface GameSaveState {
  version: number;
  initialized: boolean;
  playerName: string;
  babyName: string;
  gender: BabyGender;
  personality: BabyPersonalityId;
  appearance: BabyAppearance;
  level: number; // 1..7 corresponding to the 7 growth stages
  lifePhase: LifePhase;
  careXp: number;
  mathXp: number;
  coins: number;
  needs: BabyNeeds;
  currentEmotion: CharacterEmotion;
  bathingProgress: BathingProgressState;
  lastActivity: string;
  lastPlayTimestamp: number;
  freshUntilTimestamp: number;
  unlockedAnimations: string[];
  isSleeping: boolean;
  currentRoom: RoomId;
  selectedGrade: number; // 1 to 6
  ownedClothes: string[];
  ownedToys: string[];
  ownedFurniture: string[];
  foodInventory: Record<string, number>;
  roomDecor: RoomDecorState;
  regionScores: Record<RegionId, number>;
  consumedFoodHistory: ConsumedFoodRecord[];
  evaluatedAdultRegion: RegionId | null;
  evaluatedAdultClothingId: string | null;
  dailyMissions: DailyMission[];
  lastDailyReset: string; // YYYY-MM-DD
  loginStreak: number;
  lastLoginDate: string; // YYYY-MM-DD
  claimedLoginToday: boolean;
  memories: BabyMemory[];
  mathStats: MathHistoryStats;
  audioSettings: AudioSettings;
  graphicsQuality: 'low' | 'medium';
  lastUpdatedTimestamp: number;
  characterLifeData: CharacterLifeData;
  // Section 10: Expandable Outdoor Worlds, Garden & Kitchen Save State
  visitedLocations: RoomId[];
  currentLocation: RoomId;
  locationStates: Record<string, Record<string, unknown>>;
  gardenInventory: Record<string, number>;
  plants: GardenPlantRecord[];
  harvestInventory: Record<string, number>;
  cookingInventory: Record<string, number>;
  recipesUnlocked: string[];
  cookingHistory: Array<
    | string
    | {
        id: string;
        recipeId: string;
        recipeTitle: string;
        cookedAt: number;
        date: string;
      }
  >;
  foodState: PersistentActiveFoodState | null;
  activityHistory: Array<
    | string
    | {
        id: string;
        locationId: RoomId;
        activityType: string;
        title: string;
        timestamp: number;
      }
  >;
  objectStates: Record<string, string>;
}

export const SKIN_TONES = [
  { id: 'ivory', name: 'Krem Cerah', color: '#FFE3CE', cheek: '#FF9EBB' },
  { id: 'peach', name: 'Sawo Muda', color: '#F6C6A4', cheek: '#F48CA8' },
  { id: 'honey', name: 'Kuning Langsat', color: '#E5AE83', cheek: '#E57A96' },
  { id: 'caramel', name: 'Sawo Matang', color: '#C68B59', cheek: '#D66882' },
  { id: 'cocoa', name: 'Cokelat Manis', color: '#8F5B38', cheek: '#B8526B' },
];

export const HAIR_STYLES: { id: HairStyleId; name: string }[] = [
  { id: 'jambul_lucu', name: 'Jambul Menggemaskan' },
  { id: 'kuncir_dua', name: 'Kuncir Dua Pita' },
  { id: 'ikal_lembut', name: 'Ikal Bergelombang' },
  { id: 'bob_poni', name: 'Poni Rata Lucu' },
  { id: 'keriting_gembul', name: 'Keriting Gembul' },
  { id: 'tipis_bayi', name: 'Rambut Bayi Halus' },
];

export const HAIR_COLORS = [
  { id: 'black', name: 'Hitam Legam', color: '#272121' },
  { id: 'dark_brown', name: 'Cokelat Tua', color: '#4E342E' },
  { id: 'chestnut', name: 'Cokelat Madu', color: '#8D5524' },
  { id: 'golden', name: 'Pirang Keemasan', color: '#D49A3D' },
  { id: 'berry', name: 'Merah Berry', color: '#9E3B42' },
];

export const EYE_COLORS = [
  { id: 'brown', name: 'Cokelat Hangat', color: '#3E2723' },
  { id: 'blue', name: 'Biru Langit', color: '#2563EB' },
  { id: 'emerald', name: 'Hijau Zamrud', color: '#059669' },
  { id: 'hazel', name: 'Amber Madu', color: '#B45309' },
  { id: 'violet', name: 'Ungu Lavender', color: '#6D28D9' },
];

export const GROWTH_STAGES: GrowthStageInfo[] = [
  {
    level: 1,
    stageCode: 'newborn',
    title: 'STAGE 1 – NEWBORN BABY',
    indonesianTitle: 'Bayi Dibedong (Newborn)',
    evolutionMessage: 'Selamat datang! Bayi mungil yang dibedong lembut siap dirawat dengan penuh kasih sayang!',
    xpRequired: 0,
    description: 'Bayi baru lahir (30% tinggi dewasa) dengan kepala relatif besar dan tubuh mungil terbungkus kain bedong lembut.',
    scale: 0.30,
    unlockedActivities: ['Digendong Lembut', 'Minum Susu', 'Tidur di Kasur', 'Menggerakkan Tangan Kecil'],
    rewardCoins: 0,
  },
  {
    level: 2,
    stageCode: 'crawling_baby',
    title: 'STAGE 2 – CRAWLING BABY',
    indonesianTitle: 'Bayi Merangkak',
    evolutionMessage: 'Yeay! Bayimu sekarang sudah bisa merangkak!',
    xpRequired: 60,
    description: 'Tinggi 38% dari dewasa! Sudah lepas bedong, lengan dan kaki lebih aktif, bisa duduk dan merangkak di lantai.',
    scale: 0.38,
    unlockedActivities: ['Merangkak ke Depan', 'Duduk & Berguling', 'Bertepuk Tangan', 'Main di Karpet'],
    rewardCoins: 50,
  },
  {
    level: 3,
    stageCode: 'toddler',
    title: 'STAGE 3 – TODDLER',
    indonesianTitle: 'Balita Lincah',
    evolutionMessage: 'Hore! Si kecil sekarang tumbuh menjadi balita yang mulai belajar berjalan dan melompat kecil!',
    xpRequired: 140,
    description: 'Tinggi 48% dari dewasa! Tubuh mulai tegak, kaki mulai lebih panjang, berdiri dan berjalan langkah kecil.',
    scale: 0.48,
    unlockedActivities: ['Berjalan Langkah Kecil', 'Melompat Kecil', 'Makan di Meja Kecil', 'Mandi Interaktif'],
    rewardCoins: 80,
  },
  {
    level: 4,
    stageCode: 'young_child',
    title: 'STAGE 4 – YOUNG CHILD',
    indonesianTitle: 'Anak Kecil Pintar',
    evolutionMessage: 'Selamat! Si kecil sudah tumbuh menjadi anak yang pintar!',
    xpRequired: 240,
    description: 'Tinggi 60% dari dewasa! Kaki & lengan lebih panjang, postur tegak, membuka Nusantara Snacks & Pakaian Adat Nusantara.',
    scale: 0.60,
    unlockedActivities: ['Nusantara Snacks Terbuka!', 'Pakaian Adat Nusantara Terbuka!', 'Membaca Buku & Menari'],
    rewardCoins: 120,
  },
  {
    level: 5,
    stageCode: 'older_child',
    title: 'STAGE 5 – OLDER CHILD',
    indonesianTitle: 'Anak Mulai Besar',
    evolutionMessage: 'Luar biasa! Kini dia tumbuh menjadi anak usia sekolah yang aktif belajar dan berolahraga!',
    xpRequired: 360,
    description: 'Tinggi 75% dari dewasa! Proporsi tubuh mendekati remaja dengan jangkauan gerak luas untuk olahraga, membaca, dan sains.',
    scale: 0.75,
    unlockedActivities: ['Belajar & Menulis', 'Olahraga Ringan', 'Koleksi Budaya Nusantara'],
    rewardCoins: 160,
  },
  {
    level: 6,
    stageCode: 'teenager',
    title: 'STAGE 6 – TEENAGER',
    indonesianTitle: 'Remaja Mandiri',
    evolutionMessage: 'Hebat! Kini karakter kamu telah tumbuh menjadi remaja!',
    xpRequired: 500,
    description: 'Tinggi 90% dari dewasa! Postur tegak proporsional, gaya pakaian remaja, perangkat belajar virtual, dan memasak.',
    scale: 0.90,
    unlockedActivities: ['Postur Remaja Natural', 'Perangkat Belajar Virtual', 'Memasak Sederhana'],
    rewardCoins: 200,
  },
  {
    level: 7,
    stageCode: 'adult',
    title: 'STAGE 7 – ADULT',
    indonesianTitle: 'Dewasa – Duta Budaya Nusantara',
    evolutionMessage: 'Perjalanan panjang! Sekarang karakter kamu telah menjadi dewasa!',
    xpRequired: 660,
    description: 'Skala dasar 100% tinggi dewasa! Proporsi tubuh dewasa matang, Nusantara Regional Meals & Pakaian Adat Nusantara lengkap.',
    scale: 1.00,
    unlockedActivities: ['Nusantara Regional Meals Terbuka!', 'Evolusi Pakaian Adat Otomatis', 'Memasak Makanan Daerah'],
    rewardCoins: 280,
  },
];

export const PERSONALITIES: PersonalityInfo[] = [
  {
    id: 'playful',
    name: 'Playful Baby',
    indonesianName: 'Suka Bermain',
    description: 'Selalu bersemangat saat diajak bermain bola, cilukba, atau mainan.',
    favoriteActivity: 'Bermain & Cilukba (+25% Kebahagiaan)',
    badgeColor: '#FF8FAB',
  },
  {
    id: 'sleepy',
    name: 'Sleepy Baby',
    indonesianName: 'Mudah Mengantuk',
    description: 'Suka memeluk bantal empuk. Energi pulih lebih cepat saat tidur.',
    favoriteActivity: 'Tidur Nyenyak (+30% Pemulihan Energi)',
    badgeColor: '#A78BFA',
  },
  {
    id: 'cheerful',
    name: 'Cheerful Baby',
    indonesianName: 'Murah Senyum',
    description: 'Mudah tertawa dan sangat menyukai pelukan serta kasih sayang.',
    favoriteActivity: 'Kasih Sayang & Gelitik (+25% Love)',
    badgeColor: '#FBBF24',
  },
  {
    id: 'curious',
    name: 'Curious Baby',
    indonesianName: 'Rasa Ingin Tahu Tinggi',
    description: 'Suka mainan edukasi dan memberikan bonus XP saat belajar matematika.',
    favoriteActivity: 'Mainan Edukasi & Matematika (+25% XP)',
    badgeColor: '#38BDF8',
  },
  {
    id: 'music_lover',
    name: 'Music Lover',
    indonesianName: 'Pecinta Musik',
    description: 'Bergoyang gembira setiap kali mendengar musik atau kotak lagu.',
    favoriteActivity: 'Memutar Musik (+30% Happiness & Love)',
    badgeColor: '#34D399',
  },
];

export const STORE_ITEMS: StoreItem[] = [
  // ================= CLOTHING STORE: OUTFITS =================
  {
    id: 'outfit_pink_pastel',
    name: 'Romper Pastel Pink',
    category: 'clothes',
    subCategory: 'outfit',
    price: 0,
    description: 'Pakaian bayi lembut berwarna pastel pink dengan kancing mungil.',
    primaryColor: '#FFAFCC',
    secondaryColor: '#FFC8DD',
    pattern: 'plain',
    iconEmoji: '👚',
  },
  {
    id: 'outfit_blue_sky',
    name: 'Romper Biru Langit',
    category: 'clothes',
    subCategory: 'outfit',
    price: 0,
    description: 'Pakaian bayi nyaman berwarna biru langit cerah.',
    primaryColor: '#90E0EF',
    secondaryColor: '#CAF0F8',
    pattern: 'plain',
    iconEmoji: '👕',
  },
  {
    id: 'outfit_mint_stars',
    name: 'Baju Tidur Bintang Mint',
    category: 'clothes',
    subCategory: 'outfit',
    price: 150,
    description: 'Piyama hangat bermotif bintang emas agar tidur makin pulas.',
    primaryColor: '#A7F3D0',
    secondaryColor: '#FDE68A',
    pattern: 'stars',
    iconEmoji: '🌟',
  },
  {
    id: 'outfit_sailor_boy',
    name: 'Setelan Pelaut Cilik',
    category: 'clothes',
    subCategory: 'outfit',
    price: 180,
    description: 'Seragam kapten kapal lengkap dengan kerah garis biru putih.',
    primaryColor: '#1D4ED8',
    secondaryColor: '#FFFFFF',
    pattern: 'stripes',
    iconEmoji: '⚓',
  },
  {
    id: 'outfit_sakura_dress',
    name: 'Gaun Bunga Sakura',
    category: 'clothes',
    subCategory: 'outfit',
    price: 200,
    description: 'Gaun cantik bermotif kelopak bunga musim semi.',
    primaryColor: '#F472B6',
    secondaryColor: '#FBCFE8',
    pattern: 'floral',
    iconEmoji: '🌸',
  },
  {
    id: 'outfit_party_royal',
    name: 'Busana Pesta Kerajaan',
    category: 'clothes',
    subCategory: 'outfit',
    price: 250,
    description: 'Pakaian pesta mewah dengan aksen pita emas berkilau.',
    primaryColor: '#8B5CF6',
    secondaryColor: '#FBBF24',
    pattern: 'party',
    iconEmoji: '👑',
  },
  {
    id: 'outfit_bunny_costume',
    name: 'Kostum Kelinci Putih',
    category: 'clothes',
    subCategory: 'outfit',
    price: 280,
    description: 'Kostum hewan kelinci gembul yang sangat menggemaskan.',
    primaryColor: '#FFF1F2',
    secondaryColor: '#FDA4AF',
    pattern: 'animal_bunny',
    iconEmoji: '🐰',
  },
  {
    id: 'outfit_bear_costume',
    name: 'Kostum Beruang Madu',
    category: 'clothes',
    subCategory: 'outfit',
    price: 300,
    description: 'Kostum beruang cokelat hangat kesayangan anak-anak.',
    primaryColor: '#D97706',
    secondaryColor: '#FDE68A',
    pattern: 'animal_bear',
    iconEmoji: '🧸',
  },
  {
    id: 'outfit_dino_costume',
    name: 'Kostum Dino Hijau',
    category: 'clothes',
    subCategory: 'outfit',
    price: 350,
    description: 'Kostum dinosaurus ramah untuk penjelajah kecil!',
    primaryColor: '#10B981',
    secondaryColor: '#A7F3D0',
    pattern: 'animal_dino',
    iconEmoji: '🦖',
    isRare: true,
  },
  {
    id: 'outfit_doctor',
    name: 'Kostum Dokter Cilik',
    category: 'clothes',
    subCategory: 'outfit',
    price: 380,
    description: 'Jas putih dokter lengkap dengan stetoskop mini.',
    primaryColor: '#F8FAFC',
    secondaryColor: '#38BDF8',
    pattern: 'doctor',
    iconEmoji: '🩺',
  },
  {
    id: 'outfit_astronaut',
    name: 'Kostum Astronot Bintang',
    category: 'clothes',
    subCategory: 'outfit',
    price: 450,
    description: 'Seragam penjelajah luar angkasa juara matematika!',
    primaryColor: '#E2E8F0',
    secondaryColor: '#F97316',
    pattern: 'astronaut',
    iconEmoji: '🚀',
    isRare: true,
  },

  // ================= CLOTHING STORE: HATS / ACCESSORIES / SHOES =================
  {
    id: 'hat_ribbon_pink',
    name: 'Pita Rambut Merah Muda',
    category: 'clothes',
    subCategory: 'hat',
    price: 120,
    description: 'Pita manis yang membuat penampilan bayi makin imut.',
    primaryColor: '#EC4899',
    secondaryColor: '#FBCFE8',
    iconEmoji: '🎀',
  },
  {
    id: 'hat_crown_gold',
    name: 'Mahkota Bintang Emas',
    category: 'clothes',
    subCategory: 'hat',
    price: 250,
    description: 'Mahkota berkilau untuk juara berhitung matematika.',
    primaryColor: '#F59E0B',
    secondaryColor: '#FEF08A',
    iconEmoji: '👑',
    isRare: true,
  },
  {
    id: 'hat_bunny_ears',
    name: 'Topi Telinga Kelinci',
    category: 'clothes',
    subCategory: 'hat',
    price: 160,
    description: 'Topi rajut hangat dengan telinga kelinci panjang.',
    primaryColor: '#FFF1F2',
    secondaryColor: '#FB7185',
    iconEmoji: '🐰',
  },
  {
    id: 'hat_cap_explorer',
    name: 'Topi Petualang Ceria',
    category: 'clothes',
    subCategory: 'hat',
    price: 140,
    description: 'Topi kasual warna biru mint untuk bermain.',
    primaryColor: '#0EA5E9',
    secondaryColor: '#BAE6FD',
    iconEmoji: '🧢',
  },
  {
    id: 'glasses_star',
    name: 'Kacamata Bintang Ceria',
    category: 'clothes',
    subCategory: 'glasses',
    price: 130,
    description: 'Kacamata gaya berbentuk bintang yang lucu.',
    primaryColor: '#F43F5E',
    secondaryColor: '#FDE047',
    iconEmoji: '🕶️',
  },
  {
    id: 'glasses_smart',
    name: 'Kacamata Profesor Kecil',
    category: 'clothes',
    subCategory: 'glasses',
    price: 150,
    description: 'Kacamata bulat menggemaskan ala ilmuwan muda.',
    primaryColor: '#334155',
    secondaryColor: '#93C5FD',
    iconEmoji: '🤓',
  },
  {
    id: 'shoes_socks_mint',
    name: 'Kaus Kaki Hangat Mint',
    category: 'clothes',
    subCategory: 'shoes',
    price: 100,
    description: 'Kaus kaki lembut agar kaki bayi tetap hangat.',
    primaryColor: '#34D399',
    secondaryColor: '#D1FAE5',
    iconEmoji: '🧦',
  },
  {
    id: 'shoes_sneakers_red',
    name: 'Sepatu Balita Merah',
    category: 'clothes',
    subCategory: 'shoes',
    price: 150,
    description: 'Sepatu empuk untuk belajar melangkah dan berlari.',
    primaryColor: '#EF4444',
    secondaryColor: '#FFFFFF',
    iconEmoji: '👟',
  },

  // ================= FOOD STORE (BASIC BABY & CHILD FOODS) =================
  {
    id: 'food_milk',
    name: 'Susu Formula Hangat',
    category: 'food',
    price: 100,
    minLevel: 1,
    hungerRestore: 28,
    healthRestore: 6,
    loveRestore: 5,
    xpGain: 15,
    description: 'Botol susu hangat bergizi utama untuk Fase Bayi maupun Anak-Anak.',
    primaryColor: '#EFF6FF',
    secondaryColor: '#60A5FA',
    iconEmoji: '🍼',
  },
  {
    id: 'food_porridge',
    name: 'Bubur Polos Khusus Bayi',
    category: 'food',
    price: 120,
    minLevel: 1,
    hungerRestore: 34,
    healthRestore: 10,
    xpGain: 18,
    description: 'Bubur polos lembut yang aman dikonsumsi pada Fase Bayi (Level 1–3).',
    primaryColor: '#FEF3C7',
    secondaryColor: '#F59E0B',
    iconEmoji: '🥣',
  },
  {
    id: 'food_fruit_puree',
    name: 'Puree Buah Halus',
    category: 'food',
    price: 140,
    minLevel: 4,
    hungerRestore: 24,
    healthRestore: 10,
    happinessRestore: 8,
    xpGain: 16,
    description: 'Sari buah segar untuk Fase Anak-Anak (Level 4+).',
    primaryColor: '#FCE7F3',
    secondaryColor: '#F472B6',
    iconEmoji: '🍓',
  },
  {
    id: 'food_banana',
    name: 'Pisang Manis Lumat',
    category: 'food',
    price: 140,
    minLevel: 4,
    hungerRestore: 24,
    happinessRestore: 12,
    healthRestore: 5,
    xpGain: 16,
    description: 'Pisang manis lembut untuk Fase Anak-Anak (Level 4+).',
    primaryColor: '#FEF9C3',
    secondaryColor: '#EAB308',
    iconEmoji: '🍌',
  },
  {
    id: 'food_carrot',
    name: 'Wortel Kukus Lembut',
    category: 'food',
    price: 160,
    minLevel: 4,
    hungerRestore: 26,
    healthRestore: 15,
    xpGain: 18,
    description: 'Wortel sehat baik untuk mata pada Fase Anak-Anak (Level 4+).',
    primaryColor: '#FFEDD5',
    secondaryColor: '#F97316',
    iconEmoji: '🥕',
  },
  {
    id: 'food_apple',
    name: 'Apel Merah Segar',
    category: 'food',
    price: 160,
    minLevel: 4,
    hungerRestore: 25,
    healthRestore: 12,
    happinessRestore: 8,
    xpGain: 18,
    description: 'Potongan apel segar kaya serat untuk Fase Anak-Anak (Level 4+).',
    primaryColor: '#FEE2E2',
    secondaryColor: '#EF4444',
    iconEmoji: '🍎',
  },
  {
    id: 'food_biscuit',
    name: 'Biskuit Madu Anak',
    category: 'food',
    price: 180,
    minLevel: 4,
    hungerRestore: 22,
    happinessRestore: 18,
    xpGain: 20,
    description: 'Camilan biskuit renyah untuk Fase Anak-Anak (Level 4+).',
    primaryColor: '#FDE68A',
    secondaryColor: '#D97706',
    iconEmoji: '🍪',
  },
  {
    id: 'food_soup',
    name: 'Sup Ayam Sayur Balita',
    category: 'food',
    price: 250,
    minLevel: 4,
    hungerRestore: 45,
    healthRestore: 18,
    happinessRestore: 10,
    xpGain: 25,
    description: 'Makanan lengkap bergizi tinggi untuk balita aktif (Level 4+).',
    primaryColor: '#ECFCCB',
    secondaryColor: '#84CC16',
    iconEmoji: '🍲',
  },

  // ================= TOY STORE =================
  {
    id: 'toy_rattle',
    name: 'Kerincingan Bintang',
    category: 'toys',
    price: 0,
    happinessRestore: 18,
    loveRestore: 8,
    xpGain: 12,
    description: 'Mainan kerincingan warna-warni yang berbunyi gemerincing.',
    primaryColor: '#FDE047',
    secondaryColor: '#38BDF8',
    iconEmoji: '🪇',
  },
  {
    id: 'toy_teddy',
    name: 'Boneka Beruang Teddy',
    category: 'toys',
    price: 140,
    happinessRestore: 24,
    loveRestore: 15,
    xpGain: 16,
    description: 'Boneka beruang empuk untuk dipeluk saat bermain.',
    primaryColor: '#D97706',
    secondaryColor: '#FDE68A',
    iconEmoji: '🧸',
  },
  {
    id: 'toy_ball',
    name: 'Bola Pelangi Empuk',
    category: 'toys',
    price: 120,
    happinessRestore: 26,
    loveRestore: 10,
    xpGain: 16,
    description: 'Bola warna-warni untuk menggelinding dan melompat ceria.',
    primaryColor: '#EC4899',
    secondaryColor: '#38BDF8',
    iconEmoji: '⚽',
  },
  {
    id: 'toy_music_box',
    name: 'Kotak Musik Melodi',
    category: 'toys',
    price: 180,
    happinessRestore: 30,
    loveRestore: 16,
    xpGain: 20,
    description: 'Memutar nada indah yang membuat bayi menari bahagia.',
    primaryColor: '#A78BFA',
    secondaryColor: '#F472B6',
    iconEmoji: '🎵',
  },
  {
    id: 'toy_blocks',
    name: 'Balok Susun Angka',
    category: 'toys',
    price: 200,
    happinessRestore: 28,
    loveRestore: 12,
    xpGain: 25,
    description: 'Mainan edukasi menyusun angka dan bentuk geometri.',
    primaryColor: '#34D399',
    secondaryColor: '#FBBF24',
    iconEmoji: '🧱',
  },
  {
    id: 'toy_car',
    name: 'Mobil Kayu Ceria',
    category: 'toys',
    price: 220,
    happinessRestore: 30,
    loveRestore: 12,
    xpGain: 22,
    description: 'Mobil-mobilan kayu halus yang meluncur cepat.',
    primaryColor: '#EF4444',
    secondaryColor: '#FDE047',
    iconEmoji: '🚗',
  },
  {
    id: 'toy_bunny_doll',
    name: 'Boneka Kelinci Lullaby',
    category: 'toys',
    price: 260,
    happinessRestore: 32,
    loveRestore: 20,
    xpGain: 24,
    description: 'Boneka kelinci bertelinga panjang yang sangat lembut.',
    primaryColor: '#FBCFE8',
    secondaryColor: '#F472B6',
    iconEmoji: '🐇',
    isRare: true,
  },
  {
    id: 'toy_math_tablet',
    name: 'Papan Pintar Matematika',
    category: 'toys',
    price: 320,
    happinessRestore: 35,
    loveRestore: 18,
    xpGain: 35,
    description: 'Mainan edukasi interaktif yang melatih kecerdasan berhitung!',
    primaryColor: '#38BDF8',
    secondaryColor: '#818CF8',
    iconEmoji: '🧮',
    isRare: true,
  },

  // ================= BABY FURNITURE STORE =================
  {
    id: 'crib_classic_wood',
    name: 'Boks Kayu Klasik',
    category: 'furniture',
    subCategory: 'crib',
    price: 0,
    description: 'Tempat tidur bayi kayu hangat dengan selimut mint lembut.',
    primaryColor: '#B45309',
    secondaryColor: '#A7F3D0',
    iconEmoji: '🛏️',
  },
  {
    id: 'crib_pastel_cloud',
    name: 'Boks Awan Pastel',
    category: 'furniture',
    subCategory: 'crib',
    price: 260,
    description: 'Tempat tidur putih bersih dengan bantal awan biru muda.',
    primaryColor: '#F8FAFC',
    secondaryColor: '#93C5FD',
    iconEmoji: '☁️',
  },
  {
    id: 'crib_royal_pink',
    name: 'Boks Istana Bintang',
    category: 'furniture',
    subCategory: 'crib',
    price: 400,
    description: 'Tempat tidur mewah berhias kelambu pastel dan mahkota emas.',
    primaryColor: '#F472B6',
    secondaryColor: '#FDE047',
    iconEmoji: '🏰',
    isRare: true,
  },
  {
    id: 'rug_mint_stripes',
    name: 'Karpet Garis Mint',
    category: 'furniture',
    subCategory: 'rug',
    price: 0,
    description: 'Karpet rajut lembut berwarna hijau mint dan krem.',
    primaryColor: '#A7F3D0',
    secondaryColor: '#ECFDF5',
    iconEmoji: '🟩',
  },
  {
    id: 'rug_star_galaxy',
    name: 'Karpet Bintang Angkasa',
    category: 'furniture',
    subCategory: 'rug',
    price: 180,
    description: 'Karpet bundar biru malam dengan taburan bintang emas.',
    primaryColor: '#3B82F6',
    secondaryColor: '#FDE047',
    iconEmoji: '🌌',
  },
  {
    id: 'rug_sakura_pink',
    name: 'Karpet Kelopak Bunga',
    category: 'furniture',
    subCategory: 'rug',
    price: 200,
    description: 'Karpet pastel pink yang empuk untuk merangkak dan bermain.',
    primaryColor: '#FBB6CE',
    secondaryColor: '#FFF5F7',
    iconEmoji: '🌺',
  },
  {
    id: 'lamp_crescent_moon',
    name: 'Lampu Bulan Sabit',
    category: 'furniture',
    subCategory: 'lamp',
    price: 0,
    description: 'Lampu tidur berbentuk bulan sabit dengan cahaya hangat.',
    primaryColor: '#FBBF24',
    secondaryColor: '#FEF3C7',
    iconEmoji: '🌙',
  },
  {
    id: 'lamp_star_projector',
    name: 'Lampu Proyektor Bintang',
    category: 'furniture',
    subCategory: 'lamp',
    price: 220,
    description: 'Memancarkan kilau bintang lembut di kamar tidur bayi.',
    primaryColor: '#8B5CF6',
    secondaryColor: '#DDD6FE',
    iconEmoji: '✨',
  },
  {
    id: 'wall_warm_cream',
    name: 'Wallpaper Krem Hangat',
    category: 'furniture',
    subCategory: 'wallpaper',
    price: 0,
    description: 'Dinding kamar bernuansa krem terang yang menenangkan.',
    primaryColor: '#FFFDF7',
    secondaryColor: '#F5EFE6',
    iconEmoji: '🏠',
  },
  {
    id: 'wall_sky_blue',
    name: 'Wallpaper Awan Biru',
    category: 'furniture',
    subCategory: 'wallpaper',
    price: 160,
    description: 'Dinding biru muda segar dengan lukisan awan lembut.',
    primaryColor: '#E0F2FE',
    secondaryColor: '#BAE6FD',
    iconEmoji: '🌤️',
  },
  {
    id: 'wall_pastel_pink',
    name: 'Wallpaper Pastel Pink',
    category: 'furniture',
    subCategory: 'wallpaper',
    price: 160,
    description: 'Dinding merah muda lembut yang manis dan ceria.',
    primaryColor: '#FCE7F3',
    secondaryColor: '#FBCFE8',
    iconEmoji: '🌷',
  },
  {
    id: 'wall_mint_meadow',
    name: 'Wallpaper Hijau Mint',
    category: 'furniture',
    subCategory: 'wallpaper',
    price: 160,
    description: 'Dinding hijau mint sejuk seperti taman pagi.',
    primaryColor: '#D1FAE5',
    secondaryColor: '#A7F3D0',
    iconEmoji: '🌿',
  },
  {
    id: 'decor_bunting_pastel',
    name: 'Bendera Bunting Pastel',
    category: 'furniture',
    subCategory: 'wallDecor',
    price: 0,
    description: 'Hiasan bendera segitiga warna-warni di dinding kamar.',
    primaryColor: '#FF8FAB',
    secondaryColor: '#A7F3D0',
    iconEmoji: '🎏',
  },
  {
    id: 'decor_rainbow_art',
    name: 'Lukisan Pelangi & Angka',
    category: 'furniture',
    subCategory: 'wallDecor',
    price: 150,
    description: 'Bingkai lukisan pelangi ceria dan angka warna-warni.',
    primaryColor: '#F59E0B',
    secondaryColor: '#38BDF8',
    iconEmoji: '🌈',
  },
  {
    id: 'plush_giant_giraffe',
    name: 'Boneka Hias Jerapah',
    category: 'furniture',
    subCategory: 'plushDecor',
    price: 300,
    description: 'Boneka jerapah besar yang menghiasi sudut kamar bayi.',
    primaryColor: '#F59E0B',
    secondaryColor: '#78350F',
    iconEmoji: '🦒',
    isRare: true,
  },
  // ================= NUSANTARA CULTURAL ITEMS =================
  ...NUSANTARA_CLOTHING,
  ...NUSANTARA_SNACKS,
  ...NUSANTARA_MEALS,
];

export const LOGIN_REWARDS = [
  { day: 1, coins: 30, label: 'Hari 1', icon: '🪙' },
  { day: 2, coins: 40, label: 'Hari 2', icon: '🍼' },
  { day: 3, coins: 50, label: 'Hari 3', icon: '🌟' },
  { day: 4, coins: 60, label: 'Hari 4', icon: '🧸' },
  { day: 5, coins: 75, label: 'Hari 5', icon: '🎁' },
  { day: 6, coins: 90, label: 'Hari 6', icon: '👑' },
  { day: 7, coins: 150, label: 'Hari 7', icon: '🏆' },
];

export function createInitialMissions(): DailyMission[] {
  return [
    {
      id: 'mission_milk',
      title: 'Berikan makan atau susu 2 kali',
      target: 2,
      progress: 0,
      rewardCoins: 25,
      rewardXp: 20,
      claimed: false,
      type: 'feed_milk',
    },
    {
      id: 'mission_bath',
      title: 'Mandikan atau bersihkan bayi',
      target: 1,
      progress: 0,
      rewardCoins: 20,
      rewardXp: 15,
      claimed: false,
      type: 'bath',
    },
    {
      id: 'mission_play',
      title: 'Ajak bayi bermain 2 kali',
      target: 2,
      progress: 0,
      rewardCoins: 25,
      rewardXp: 20,
      claimed: false,
      type: 'play',
    },
    {
      id: 'mission_math_10',
      title: 'Jawab benar 5 soal matematika',
      target: 5,
      progress: 0,
      rewardCoins: 50,
      rewardXp: 35,
      claimed: false,
      type: 'math_solve',
    },
    {
      id: 'mission_streak_5',
      title: 'Jawab 3 soal benar berturut-turut',
      target: 3,
      progress: 0,
      rewardCoins: 35,
      rewardXp: 25,
      claimed: false,
      type: 'math_streak',
    },
    {
      id: 'mission_love',
      title: 'Berikan kasih sayang (usap/gendong) 3 kali',
      target: 3,
      progress: 0,
      rewardCoins: 25,
      rewardXp: 20,
      claimed: false,
      type: 'love_baby',
    },
    {
      id: 'mission_buy',
      title: 'Beli 1 barang di Toko',
      target: 1,
      progress: 0,
      rewardCoins: 30,
      rewardXp: 20,
      claimed: false,
      type: 'buy_item',
    },
  ];
}

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function getGrowthStage(level: number): GrowthStageInfo {
  const clamped = Math.max(1, Math.min(GROWTH_STAGES.length, level));
  return GROWTH_STAGES[clamped - 1];
}

export function getNextLevelXp(level: number): number {
  if (level >= GROWTH_STAGES.length) {
    return GROWTH_STAGES[GROWTH_STAGES.length - 1].xpRequired + (level - GROWTH_STAGES.length + 1) * 350;
  }
  return GROWTH_STAGES[level].xpRequired;
}

export function createInitialBathingProgress(): BathingProgressState {
  return {
    head: { foam: 0, cleaned: true },
    body: { foam: 0, cleaned: true },
    leftArm: { foam: 0, cleaned: true },
    rightArm: { foam: 0, cleaned: true },
    leftLeg: { foam: 0, cleaned: true },
    rightLeg: { foam: 0, cleaned: true },
  };
}

export function createDefaultSaveState(): GameSaveState {
  const today = getTodayDateString();
  return {
    version: 3,
    initialized: false,
    playerName: 'Kakak Pintar',
    babyName: 'Aisyah',
    gender: 'girl',
    personality: 'cheerful',
    appearance: {
      skinTone: SKIN_TONES[0].color,
      hairStyle: 'kuncir_dua',
      hairColor: HAIR_COLORS[0].color,
      eyeColor: EYE_COLORS[0].color,
      equippedOutfit: 'outfit_pink_pastel',
      equippedHat: null,
      equippedGlasses: null,
      equippedShoes: null,
    },
    level: 1,
    lifePhase: 'BAYI',
    careXp: 0,
    mathXp: 0,
    coins: 50,
    needs: {
      hunger: 84,
      energy: 88,
      hygiene: 86,
      happiness: 86,
      health: 95,
      love: 85,
    },
    currentEmotion: 'happy',
    bathingProgress: createInitialBathingProgress(),
    lastActivity: 'memulai_permainan',
    lastPlayTimestamp: Date.now(),
    freshUntilTimestamp: 0,
    unlockedAnimations: ['idle', 'sleeping', 'yawning', 'smiling', 'crying'],
    isSleeping: false,
    currentRoom: 'bedroom',
    selectedGrade: 1,
    ownedClothes: ['outfit_pink_pastel', 'outfit_blue_sky'],
    ownedToys: ['toy_rattle'],
    ownedFurniture: ['crib_classic_wood', 'rug_mint_stripes', 'lamp_crescent_moon', 'wall_warm_cream', 'decor_bunting_pastel'],
    foodInventory: {
      food_milk: 3,
      food_porridge: 2,
    },
    roomDecor: {
      crib: 'crib_classic_wood',
      rug: 'rug_mint_stripes',
      lamp: 'lamp_crescent_moon',
      wallpaper: 'wall_warm_cream',
      wallDecor: 'decor_bunting_pastel',
      plushDecor: null,
    },
    regionScores: { ...INITIAL_REGION_SCORES },
    consumedFoodHistory: [],
    evaluatedAdultRegion: null,
    evaluatedAdultClothingId: null,
    dailyMissions: createInitialMissions(),
    lastDailyReset: today,
    loginStreak: 1,
    lastLoginDate: today,
    claimedLoginToday: false,
    memories: [],
    mathStats: {
      totalSolved: 0,
      totalCorrect: 0,
      bestStreak: 0,
      currentStreak: 0,
      solvedByGrade: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    },
    audioSettings: {
      musicEnabled: true,
      sfxEnabled: true,
      musicVolume: 0.14,
      sfxVolume: 0.65,
      muted: false,
    },
    graphicsQuality: 'medium',
    lastUpdatedTimestamp: Date.now(),
    characterLifeData: createInitialCharacterLifeData(),
    visitedLocations: ['bedroom', 'livingroom', 'kitchen', 'bathroom', 'playroom', 'backyard_garden'],
    currentLocation: 'bedroom',
    locationStates: {},
    gardenInventory: createInitialHarvestInventory(),
    plants: createInitialPlants(),
    harvestInventory: createInitialHarvestInventory(),
    cookingInventory: createInitialCookingInventory(),
    recipesUnlocked: COOKING_RECIPES.map((r) => r.id),
    cookingHistory: [],
    foodState: null,
    activityHistory: [],
    objectStates: {},
  };
}
