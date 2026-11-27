// Comprehensive Age-Based Entertainment, 246-Day Realistic Slow Life Real-Time Growth,
// Growing Up Memories Scrapbook Album, and Child-Friendly Virtual Healthcare / Hospital System Data

import { BabyActionState } from './gameData';

export type StageCodeId =
  | 'newborn'
  | 'crawlingBaby'
  | 'toddler'
  | 'youngChild'
  | 'olderChild'
  | 'teenager'
  | 'adult';

export type IllnessStateId = 'healthy' | 'mild' | 'moderate' | 'severe' | 'hospital_recovery';

export interface GrowthDurationConfig {
  newborn: number;      // 7 days
  crawlingBaby: number; // 14 days
  toddler: number;      // 30 days
  youngChild: number;   // 45 days
  olderChild: number;   // 60 days
  teenager: number;     // 90 days (Total to Adult = 246 days / ~8 months)
}

export const growthConfig: GrowthDurationConfig = {
  newborn: 7,
  crawlingBaby: 14,
  toddler: 30,
  youngChild: 45,
  olderChild: 60,
  teenager: 90,
};

export const TOTAL_ADULT_JOURNEY_DAYS = 246;
export const DAY_MS = 24 * 60 * 60 * 1000;

export const STAGE_CODE_ORDER: StageCodeId[] = [
  'newborn',
  'crawlingBaby',
  'toddler',
  'youngChild',
  'olderChild',
  'teenager',
  'adult',
];

export const STAGE_DISPLAY_META: Record<
  number,
  {
    code: StageCodeId;
    englishTitle: string;
    indonesianTitle: string;
    durationDays: number;
    cumulativeStartDays: number;
    nextEvolutionDays: number | null;
    defaultPose: BabyActionState;
    roomBackgroundLabel: string;
    roomThemeGradient: string;
  }
> = {
  1: {
    code: 'newborn',
    englishTitle: 'Newborn',
    indonesianTitle: 'Bayi Baru Lahir',
    durationDays: 7,
    cumulativeStartDays: 0,
    nextEvolutionDays: 7,
    defaultPose: 'smiling',
    roomBackgroundLabel: 'Kamar Boks Bayi Hangat (Nursery Crib)',
    roomThemeGradient: 'from-rose-100 via-amber-50 to-orange-100',
  },
  2: {
    code: 'crawlingBaby',
    englishTitle: 'Crawling Baby',
    indonesianTitle: 'Bayi Merangkak',
    durationDays: 14,
    cumulativeStartDays: 7,
    nextEvolutionDays: 21,
    defaultPose: 'crawling',
    roomBackgroundLabel: 'Karpet Bermain Lembut (Soft Playmat Room)',
    roomThemeGradient: 'from-amber-100 via-yellow-50 to-emerald-100',
  },
  3: {
    code: 'toddler',
    englishTitle: 'Toddler',
    indonesianTitle: 'Balita',
    durationDays: 30,
    cumulativeStartDays: 21,
    nextEvolutionDays: 51,
    defaultPose: 'walking',
    roomBackgroundLabel: 'Ruang Bermain Balok & Lukis (Toddler Playroom)',
    roomThemeGradient: 'from-sky-100 via-teal-50 to-emerald-100',
  },
  4: {
    code: 'youngChild',
    englishTitle: 'Young Child',
    indonesianTitle: 'Anak Kecil',
    durationDays: 45,
    cumulativeStartDays: 51,
    nextEvolutionDays: 96,
    defaultPose: 'dancing',
    roomBackgroundLabel: 'Taman Belajar & Buku Cerita (Story & Garden Corner)',
    roomThemeGradient: 'from-emerald-100 via-lime-50 to-sky-100',
  },
  5: {
    code: 'olderChild',
    englishTitle: 'Older Child',
    indonesianTitle: 'Anak yang Lebih Besar',
    durationDays: 60,
    cumulativeStartDays: 96,
    nextEvolutionDays: 156,
    defaultPose: 'reading',
    roomBackgroundLabel: 'Studio Sains & Musik Anak (Science & Music Studio)',
    roomThemeGradient: 'from-indigo-100 via-sky-50 to-violet-100',
  },
  6: {
    code: 'teenager',
    englishTitle: 'Teenager',
    indonesianTitle: 'Remaja',
    durationDays: 90,
    cumulativeStartDays: 156,
    nextEvolutionDays: 246,
    defaultPose: 'studying',
    roomBackgroundLabel: 'Kamar Kreatif Remaja Nusantara (Teen Creative Loft)',
    roomThemeGradient: 'from-violet-100 via-fuchsia-50 to-amber-100',
  },
  7: {
    code: 'adult',
    englishTitle: 'Adult',
    indonesianTitle: 'Dewasa',
    durationDays: 0,
    cumulativeStartDays: 246,
    nextEvolutionDays: null,
    defaultPose: 'laughing',
    roomBackgroundLabel: 'Paviliun Budaya Nusantara Mandiri (Nusantara Heritage Home)',
    roomThemeGradient: 'from-amber-100 via-orange-50 to-rose-100',
  },
};

export function levelToStageCode(level: number): StageCodeId {
  const clamped = Math.max(1, Math.min(7, level));
  return STAGE_CODE_ORDER[clamped - 1];
}

export function stageCodeToLevel(code: StageCodeId): number {
  const idx = STAGE_CODE_ORDER.indexOf(code);
  return idx >= 0 ? idx + 1 : 1;
}

export function getStageDurationDays(
  stageLevel: number,
  config: GrowthDurationConfig = growthConfig
): number {
  switch (stageLevel) {
    case 1:
      return config.newborn;      // 7 days
    case 2:
      return config.crawlingBaby; // 14 days (cumulative 21)
    case 3:
      return config.toddler;      // 30 days (cumulative 51)
    case 4:
      return config.youngChild;   // 45 days (cumulative 96)
    case 5:
      return config.olderChild;   // 60 days (cumulative 156)
    case 6:
      return config.teenager;     // 90 days (cumulative 246)
    default:
      return 0;                   // Stage 7 Adult is final permanent stage
  }
}

export function getCumulativeThresholdDays(
  targetStageLevel: number,
  config: GrowthDurationConfig = growthConfig
): number {
  // Returns how many total elapsed real-world days are required to reach targetStageLevel (1..7)
  // Stage 1: 0d, Stage 2: 7d, Stage 3: 21d, Stage 4: 51d, Stage 5: 96d, Stage 6: 156d, Stage 7: 246d
  let total = 0;
  for (let lv = 1; lv < targetStageLevel; lv++) {
    total += getStageDurationDays(lv, config);
  }
  return total;
}

export interface RealTimeGrowthSnapshot {
  characterCreatedAt: number;
  now: number;
  elapsedMs: number;
  totalElapsedDaysFloat: number;
  totalElapsedDays: number;
  currentStageLevel: number;
  currentStageCode: StageCodeId;
  stageStartedAt: number;
  stageDurationDays: number;
  nextEvolutionAt: number;
  daysInCurrentStageFloat: number;
  daysInCurrentStage: number;
  daysRemainingInStageFloat: number;
  daysRemainingInStage: number;
  hoursRemainingInStage: number;
  stageProgressPercent: number;
  overallAdultProgressPercent: number;
  isMaxStage: boolean;
}

export function calculateRealTimeGrowthSnapshot(
  characterCreatedAt: number,
  now: number = Date.now(),
  config: GrowthDurationConfig = growthConfig
): RealTimeGrowthSnapshot {
  const safeCreatedAt = Number.isFinite(characterCreatedAt) && characterCreatedAt > 0 ? characterCreatedAt : now;
  const elapsedMs = Math.max(0, now - safeCreatedAt);
  const totalElapsedDaysFloat = elapsedMs / DAY_MS;
  const totalElapsedDays = Math.floor(totalElapsedDaysFloat);

  let currentStageLevel = 1;
  for (let lv = 7; lv >= 1; lv--) {
    if (totalElapsedDaysFloat >= getCumulativeThresholdDays(lv, config)) {
      currentStageLevel = lv;
      break;
    }
  }

  const currentStageCode = levelToStageCode(currentStageLevel);
  const stageStartThresholdDays = getCumulativeThresholdDays(currentStageLevel, config);
  const stageStartedAt = safeCreatedAt + stageStartThresholdDays * DAY_MS;
  const isMaxStage = currentStageLevel >= 7;
  const stageDurationDays = isMaxStage ? 0 : getStageDurationDays(currentStageLevel, config);
  const nextEvolutionAt = isMaxStage
    ? stageStartedAt
    : stageStartedAt + stageDurationDays * DAY_MS;

  const daysInCurrentStageFloat = Math.max(0, totalElapsedDaysFloat - stageStartThresholdDays);
  const daysInCurrentStage = isMaxStage
    ? Math.floor(daysInCurrentStageFloat)
    : Math.min(stageDurationDays, Math.floor(daysInCurrentStageFloat));

  const remainingMs = isMaxStage ? 0 : Math.max(0, nextEvolutionAt - now);
  const daysRemainingInStageFloat = remainingMs / DAY_MS;
  const daysRemainingInStage = isMaxStage ? 0 : Math.ceil(daysRemainingInStageFloat);
  const hoursRemainingInStage = isMaxStage
    ? 0
    : Math.max(0, Math.floor((remainingMs % DAY_MS) / (60 * 60 * 1000)));

  const stageProgressPercent = isMaxStage
    ? 100
    : Math.min(100, Math.max(0, Math.round((daysInCurrentStageFloat / Math.max(1, stageDurationDays)) * 100)));

  const overallAdultProgressPercent = Math.min(
    100,
    Math.max(0, Math.round((totalElapsedDaysFloat / TOTAL_ADULT_JOURNEY_DAYS) * 100))
  );

  return {
    characterCreatedAt: safeCreatedAt,
    now,
    elapsedMs,
    totalElapsedDaysFloat,
    totalElapsedDays,
    currentStageLevel,
    currentStageCode,
    stageStartedAt,
    stageDurationDays,
    nextEvolutionAt,
    daysInCurrentStageFloat,
    daysInCurrentStage,
    daysRemainingInStageFloat,
    daysRemainingInStage,
    hoursRemainingInStage,
    stageProgressPercent,
    overallAdultProgressPercent,
    isMaxStage,
  };
}

export interface GrowingUpStagePhotoMemory {
  id: string;
  stageLevel: number;
  stageCode: StageCodeId;
  stageTitle: string;
  indonesianTitle: string;
  caption: string;
  unlockedDate: string;
  unlockedTimestamp: number;
  outfitId: string;
  ageDaysAtUnlock: number;
  pose?: BabyActionState;
  roomBackground?: string;
}

export interface ActivityMemoryRecord {
  id: string;
  activityId: string;
  activityTitle: string;
  stageLevel: number;
  stageTitle: string;
  date: string;
  summary: string;
  scoreOrResult?: string;
}

export type CharacterAnchorId = 'bottomCenter';

export interface CharacterProportionProfile {
  stageCode: StageCodeId;
  stageLevel: number;
  relativeScale: number; // 0.30 .. 1.00
  relativeHeightPercent: number; // 30 .. 100
  heightPercentLabel: string; // e.g. '30% Tinggi Dewasa'
  headToBodyRatio: string; // e.g. '1:2', '1:3.2', '1:7'
  headToBodyRatioLabel: string;
  postureDescription: string;
  limbLengthProfile: 'compact_swaddled' | 'chubby_crawling' | 'toddler_stepping' | 'young_balanced' | 'older_athletic' | 'teen_slender' | 'adult_full';
  postureProfile: 'lying_cradled' | 'crawling_seated' | 'early_upright' | 'active_upright' | 'agile_upright' | 'tall_upright' | 'mature_upright';
  furnitureProfileLabel: string;
  clothingSpriteProfile: string;
  animationRigProfile: string;
}

export interface CharacterGrowthTransitionState {
  isTransitioning: boolean;
  fromStage: StageCodeId;
  toStage: StageCodeId;
  fromScale: number;
  toScale: number;
  transitionStartedAt?: number;
  transitionDurationMs?: number;
  startedAt?: number;
  durationMs?: number;
}

export const CHARACTER_STAGE_SCALES: Record<StageCodeId, number> = {
  newborn: 0.30,
  crawlingBaby: 0.38,
  toddler: 0.48,
  youngChild: 0.60,
  olderChild: 0.75,
  teenager: 0.90,
  adult: 1.00,
};

export const CHARACTER_PROPORTION_PROFILES: Record<StageCodeId, CharacterProportionProfile> = {
  newborn: {
    stageCode: 'newborn',
    stageLevel: 1,
    relativeScale: 0.30,
    relativeHeightPercent: 30,
    heightPercentLabel: '30% dari tinggi dewasa',
    headToBodyRatio: '1:2',
    headToBodyRatioLabel: 'Kepala besar (~1:2), tubuh mungil dibedong',
    postureDescription: 'Dibedong Hangat',
    limbLengthProfile: 'compact_swaddled',
    postureProfile: 'lying_cradled',
    furnitureProfileLabel: 'Boks Bayi (Nursery Crib), Matras Bermain & Mainan Gantung',
    clothingSpriteProfile: 'newborn_swaddle_sprite',
    animationRigProfile: 'rig_newborn_gentle',
  },
  crawlingBaby: {
    stageCode: 'crawlingBaby',
    stageLevel: 2,
    relativeScale: 0.38,
    relativeHeightPercent: 38,
    heightPercentLabel: '38% dari tinggi dewasa',
    headToBodyRatio: '1:2.5',
    headToBodyRatioLabel: 'Kepala relatif besar (~1:2.5), pipi chubby, lengan & kaki aktif merangkak',
    postureDescription: 'Merangkak Aktif',
    limbLengthProfile: 'chubby_crawling',
    postureProfile: 'crawling_seated',
    furnitureProfileLabel: 'Boks Bayi Rendah, Karpet Merangkak & Mainan Lantai',
    clothingSpriteProfile: 'crawling_romper_sprite',
    animationRigProfile: 'rig_crawling_baby',
  },
  toddler: {
    stageCode: 'toddler',
    stageLevel: 3,
    relativeScale: 0.48,
    relativeHeightPercent: 48,
    heightPercentLabel: '48% dari tinggi dewasa',
    headToBodyRatio: '1:3.2',
    headToBodyRatioLabel: 'Proporsi balita (~1:3.2), tubuh mulai tegak, kaki lebih panjang',
    postureDescription: 'Melangkah Tegak',
    limbLengthProfile: 'toddler_stepping',
    postureProfile: 'early_upright',
    furnitureProfileLabel: 'Kasur Balita Rendah, Meja & Kursi Kecil, Rak Mainan Rendah',
    clothingSpriteProfile: 'toddler_overalls_sprite',
    animationRigProfile: 'rig_toddler_upright',
  },
  youngChild: {
    stageCode: 'youngChild',
    stageLevel: 4,
    relativeScale: 0.60,
    relativeHeightPercent: 60,
    heightPercentLabel: '60% dari tinggi dewasa',
    headToBodyRatio: '1:4.2',
    headToBodyRatioLabel: 'Proporsi anak kecil (~1:4.2), lengan & kaki memanjang, postur tegak aktif',
    postureDescription: 'Tegak Lincah',
    limbLengthProfile: 'young_balanced',
    postureProfile: 'active_upright',
    furnitureProfileLabel: 'Tempat Tidur Anak, Meja Belajar Anak, Rak Buku & Alat Memasak Anak',
    clothingSpriteProfile: 'young_child_outfit_sprite',
    animationRigProfile: 'rig_young_child_agile',
  },
  olderChild: {
    stageCode: 'olderChild',
    stageLevel: 5,
    relativeScale: 0.75,
    relativeHeightPercent: 75,
    heightPercentLabel: '75% dari tinggi dewasa',
    headToBodyRatio: '1:5.2',
    headToBodyRatioLabel: 'Proporsi anak besar (~1:5.2), jangkauan gerak luas, bahu & tungkai jenjang',
    postureDescription: 'Atletis Mandiri',
    limbLengthProfile: 'older_athletic',
    postureProfile: 'agile_upright',
    furnitureProfileLabel: 'Kasur Single, Meja Sains & Musik, Rak Buku Tinggi & Alat Olahraga',
    clothingSpriteProfile: 'older_child_uniform_sprite',
    animationRigProfile: 'rig_older_child_sport',
  },
  teenager: {
    stageCode: 'teenager',
    stageLevel: 6,
    relativeScale: 0.90,
    relativeHeightPercent: 90,
    heightPercentLabel: '90% dari tinggi dewasa',
    headToBodyRatio: '1:6.2',
    headToBodyRatioLabel: 'Proporsi remaja (~1:6.2), postur tinggi tegak mendekati dewasa',
    postureDescription: 'Tinggi Remaja',
    limbLengthProfile: 'teen_slender',
    postureProfile: 'tall_upright',
    furnitureProfileLabel: 'Tempat Tidur Remaja, Meja Belajar Kreatif, Lemari & Dekorasi Remaja',
    clothingSpriteProfile: 'teenager_layered_sprite',
    animationRigProfile: 'rig_teenager_expressive',
  },
  adult: {
    stageCode: 'adult',
    stageLevel: 7,
    relativeScale: 1.00,
    relativeHeightPercent: 100,
    heightPercentLabel: '100% tinggi karakter dewasa (Skala Dasar 1.00)',
    headToBodyRatio: '1:7',
    headToBodyRatioLabel: 'Proporsi dewasa penuh (~1:7), postur matang & pakaian adat Nusantara lengkap',
    postureDescription: 'Dewasa Penuh',
    limbLengthProfile: 'adult_full',
    postureProfile: 'mature_upright',
    furnitureProfileLabel: 'Tempat Tidur Dewasa, Meja & Kursi Dewasa, Lemari & Dapur Lengkap',
    clothingSpriteProfile: 'adult_heritage_sprite',
    animationRigProfile: 'rig_adult_full',
  },
};

export function getCharacterScaleForStage(stageOrLevel: StageCodeId | number): number {
  const code = typeof stageOrLevel === 'number' ? levelToStageCode(stageOrLevel) : stageOrLevel;
  return CHARACTER_STAGE_SCALES[code] ?? 0.30;
}

export function getCharacterProportionProfile(stageOrLevel: StageCodeId | number): CharacterProportionProfile {
  const code = typeof stageOrLevel === 'number' ? levelToStageCode(stageOrLevel) : stageOrLevel;
  return CHARACTER_PROPORTION_PROFILES[code] || CHARACTER_PROPORTION_PROFILES.newborn;
}

export interface CharacterLifeData {
  characterCreatedAt: number;
  currentStage: StageCodeId;
  createdAt: number;
  stageStartedAt: number;
  stageDurationDays: number;
  nextEvolutionAt: number;
  totalElapsedDays: number;
  totalAgeDays: number;
  lastGrowthCheckAt: number;
  devBonusSimulatedDays: number;

  // Section 9: Dynamic Body Height, Scale & Age-Based Visual Growth Data
  characterScale: number; // 0.30 | 0.38 | 0.48 | 0.60 | 0.75 | 0.90 | 1.00
  characterHeightStage: StageCodeId;
  characterProportionProfile: CharacterProportionProfile;
  characterVisualStage: number | StageCodeId; // 1..7 or StageCodeId
  characterAnchor: CharacterAnchorId; // 'bottomCenter'
  characterGrowthTransition: CharacterGrowthTransitionState | null;

  health: number;
  illnessState: IllnessStateId;
  recoveryUntil: number | null;
  illnessEnabled: boolean; // Player can disable illness events if desired

  unlockedActivities: string[];
  completedActivities: string[];
  recentlyPlayedActivities: string[];
  favoriteActivities: string[];
  activityMemories: ActivityMemoryRecord[];

  evolutionHistory: {
    stageLevel: number;
    stageCode: StageCodeId;
    reachedAt: number;
    date: string;
  }[];
  photoMemories: GrowingUpStagePhotoMemory[];
}

export const GROWING_UP_STAGE_CAPTIONS: Record<
  number,
  { title: string; subtitle: string; caption: string; pose: BabyActionState; roomBackground: string }
> = {
  1: {
    title: 'Foto Ketika Dibedong (Newborn)',
    subtitle: 'Hari ke-0 · Bayi Baru Lahir (Durasi 7 Hari)',
    caption: 'Tubuh mungil yang hangat terbungkus kain bedong lembut, tersenyum saat diajak bicara.',
    pose: 'smiling',
    roomBackground: 'Kamar Boks Bayi Hangat (Nursery Crib)',
  },
  2: {
    title: 'Foto Ketika Mulai Merangkak (Crawling Baby)',
    subtitle: 'Hari ke-7 · Bayi Merangkak (Durasi 14 Hari)',
    caption: 'Yeay! Sudah bebas dari bedong, mengangkat kepala, dan mulai aktif merangkak di karpet!',
    pose: 'crawling',
    roomBackground: 'Karpet Bermain Lembut (Soft Playmat Room)',
  },
  3: {
    title: 'Foto Ketika Menjadi Balita (Toddler)',
    subtitle: 'Hari ke-21 · Balita Ceria (Durasi 30 Hari)',
    caption: 'Mulai berdiri, mengambil langkah pertama, menyusun menara balok, dan melukis dengan jari!',
    pose: 'walking',
    roomBackground: 'Ruang Bermain Balok & Lukis (Toddler Playroom)',
  },
  4: {
    title: 'Foto Ketika Masuk Usia Anak Kecil (Young Child)',
    subtitle: 'Hari ke-51 · Anak Kecil Pintar (Durasi 45 Hari)',
    caption: 'Tumbuh lebih tinggi, senang membaca buku cerita, mengenal jajanan & baju adat Nusantara!',
    pose: 'dancing',
    roomBackground: 'Taman Belajar & Buku Cerita (Story & Garden Corner)',
  },
  5: {
    title: 'Foto Ketika Menjadi Anak Besar (Older Child)',
    subtitle: 'Hari ke-96 · Anak yang Lebih Besar (Durasi 60 Hari)',
    caption: 'Semakin mandiri, aktif di laboratorium sains virtual, studio musik, dan berburu harta karun!',
    pose: 'reading',
    roomBackground: 'Studio Sains & Musik Anak (Science & Music Studio)',
  },
  6: {
    title: 'Foto Ketika Remaja (Teenager)',
    subtitle: 'Hari ke-156 · Remaja Kreatif (Durasi 90 Hari)',
    caption: 'Penampilan remaja dengan hobi fotografi, tantangan memasak, dan eksplorasi budaya Nusantara!',
    pose: 'studying',
    roomBackground: 'Kamar Kreatif Remaja Nusantara (Teen Creative Loft)',
  },
  7: {
    title: 'Foto Ketika Dewasa (Adult)',
    subtitle: 'Hari ke-246 (~8 Bulan) · Dewasa Mandiri',
    caption: 'Puncak perjalanan panjang 246 hari! Tumbuh menjadi pribadi dewasa yang mandiri dan berbudaya Nusantara!',
    pose: 'laughing',
    roomBackground: 'Paviliun Budaya Nusantara Mandiri (Nusantara Heritage Home)',
  },
};

// ==================== AGE-BASED INTERACTIVE ACTIVITIES CATALOG ====================
export type InteractiveMechanicType =
  | 'peekaboo'
  | 'lullaby_music'
  | 'baby_talk'
  | 'soft_toy_watch'
  | 'follow_toy'
  | 'ball_physics'
  | 'pat_a_cake'
  | 'hide_the_toy'
  | 'tower_blocks'
  | 'cooking_kitchen'
  | 'finger_painting'
  | 'animal_sounds'
  | 'sorting_toys'
  | 'teddy_care'
  | 'storybook_reader'
  | 'gardening_farm'
  | 'puzzle_board'
  | 'dance_rhythm'
  | 'science_lab'
  | 'treasure_hunt'
  | 'photography_cam'
  | 'home_designer'
  | 'batik_craft'
  | 'travel_nusantara';

export interface AgeActivityDefinition {
  id: string;
  title: string;
  indonesianTitle: string;
  iconEmoji: string;
  minStage: number; // 1..7
  maxStage: number; // 1..7 (e.g. Peekaboo is 1..2 only!)
  stageLabel: string;
  mechanic: InteractiveMechanicType;
  characterPose: BabyActionState;
  description: string;
  interactionHint: string;
  bgGradient: string;
  xpReward: number;
  coinReward: number;
  happinessGain: number;
  loveGain: number;
}

export const AGE_ACTIVITIES_CATALOG: AgeActivityDefinition[] = [
  // ==================== STAGE 1: NEWBORN BABY (BAYI DIBEDONG) ====================
  {
    id: 'act_s1_peekaboo',
    title: 'Peekaboo – Cilukba',
    indonesianTitle: 'Cilukba Eksklusif Bayi',
    iconEmoji: '🙈',
    minStage: 1,
    maxStage: 2, // Disappears after baby stage!
    stageLabel: 'Khusus Bayi (Stage 1–2)',
    mechanic: 'peekaboo',
    characterPose: 'laughing',
    description: 'Tutup wajah dengan kedua tangan lalu tekan "Cilukba!" untuk melihat bayi tertawa gembira!',
    interactionHint: 'Sentuh tombol Tangan & Cilukba!',
    bgGradient: 'from-amber-100 to-pink-100',
    xpReward: 18,
    coinReward: 8,
    happinessGain: 24,
    loveGain: 16,
  },
  {
    id: 'act_s1_lullaby',
    title: 'Lullaby – Lagu Pengantar Tidur',
    indonesianTitle: 'Melodi Tidur Lembut',
    iconEmoji: '🎶',
    minStage: 1,
    maxStage: 2,
    stageLabel: 'Khusus Bayi (Stage 1–2)',
    mechanic: 'lullaby_music',
    characterPose: 'smiling',
    description: 'Pilih lagu pengantar tidur orisinal dan ketuk not musik sambil lampu tidur bersinar hangat.',
    interactionHint: 'Pilih lagu & sentuh not musik melayang!',
    bgGradient: 'from-indigo-100 to-purple-100',
    xpReward: 16,
    coinReward: 6,
    happinessGain: 20,
    loveGain: 18,
  },
  {
    id: 'act_s1_babytalk',
    title: 'Baby Talk – Ajak Bayi Bicara',
    indonesianTitle: 'Obrolan Kasih Bayi',
    iconEmoji: '🎙️',
    minStage: 1,
    maxStage: 2,
    stageLabel: 'Khusus Bayi (Stage 1–2)',
    mechanic: 'baby_talk',
    characterPose: 'make_heart',
    description: 'Ucapkan atau pilih sapaan penuh sayang dan lihat bayi merespons dengan tawa serta gerakan tangan.',
    interactionHint: 'Pilih frasa suara atau tekan mikrofon!',
    bgGradient: 'from-rose-100 to-amber-100',
    xpReward: 18,
    coinReward: 8,
    happinessGain: 22,
    loveGain: 22,
  },
  {
    id: 'act_s1_softtoy',
    title: 'Soft Toy Watching',
    indonesianTitle: 'Mainan Gantung Bergerak',
    iconEmoji: '🎠',
    minStage: 1,
    maxStage: 1,
    stageLabel: 'Eksklusif Newborn (Stage 1)',
    mechanic: 'soft_toy_watch',
    characterPose: 'waving',
    description: 'Gerakkan mainan gantung dari kiri ke kanan; mata dan tangan mungil bayi akan mengikuti arahnya!',
    interactionHint: 'Geser mainan gantung ke kiri & kanan!',
    bgGradient: 'from-sky-100 to-emerald-100',
    xpReward: 16,
    coinReward: 7,
    happinessGain: 20,
    loveGain: 15,
  },
  {
    id: 'act_s1_gentlemusic',
    title: 'Gentle Music',
    indonesianTitle: 'Instrumen Lonceng & Piano Bayi',
    iconEmoji: '🎹',
    minStage: 1,
    maxStage: 2,
    stageLabel: 'Khusus Bayi (Stage 1–2)',
    mechanic: 'lullaby_music',
    characterPose: 'clap_hands',
    description: 'Mainkan tuts piano mainan dan lonceng lembut agar bayi menggerakkan tangan mengikuti irama.',
    interactionHint: 'Tekan tuts instrumen warna-warni!',
    bgGradient: 'from-teal-100 to-amber-100',
    xpReward: 16,
    coinReward: 7,
    happinessGain: 22,
    loveGain: 14,
  },

  // ==================== STAGE 2: CRAWLING BABY (BAYI MERANGKAK) ====================
  {
    id: 'act_s2_followtoy',
    title: 'Follow the Toy',
    indonesianTitle: 'Merangkak Ikuti Mainan',
    iconEmoji: '🚼',
    minStage: 2,
    maxStage: 2,
    stageLabel: 'Eksklusif Stage 2 (Merangkak)',
    mechanic: 'follow_toy',
    characterPose: 'crawling',
    description: 'Sentuh lantai untuk menggerakkan mainan; bayi akan merangkak aktif mengejarnya hingga tertawa!',
    interactionHint: 'Sentuh/seret posisi mainan di karpet!',
    bgGradient: 'from-emerald-100 to-amber-100',
    xpReward: 20,
    coinReward: 10,
    happinessGain: 25,
    loveGain: 15,
  },
  {
    id: 'act_s2_ballrolling',
    title: 'Ball Rolling',
    indonesianTitle: 'Gelindingkan Bola Lembut',
    iconEmoji: '🥎',
    minStage: 2,
    maxStage: 2,
    stageLabel: 'Eksklusif Stage 2 (Merangkak)',
    mechanic: 'ball_physics',
    characterPose: 'crawling',
    description: 'Seret dan gelindingkan bola di lantai agar bayi merangkak mengejar dan menyentuh bolanya!',
    interactionHint: 'Seret & lepaskan bola untuk menggelinding!',
    bgGradient: 'from-sky-100 to-amber-100',
    xpReward: 20,
    coinReward: 10,
    happinessGain: 25,
    loveGain: 14,
  },
  {
    id: 'act_s2_patacake',
    title: 'Pat-a-Cake',
    indonesianTitle: 'Tepuk Tangan Berirama',
    iconEmoji: '👏',
    minStage: 2,
    maxStage: 2, // Disappears after baby stage!
    stageLabel: 'Eksklusif Stage 2 (Merangkak)',
    mechanic: 'pat_a_cake',
    characterPose: 'clap_hands',
    description: 'Sentuh tangan kiri dan kanan bayi secara bergantian mengikuti irama tepuk tangan ceria!',
    interactionHint: 'Ketuk tangan Kiri & Kanan sesuai irama!',
    bgGradient: 'from-pink-100 to-yellow-100',
    xpReward: 20,
    coinReward: 9,
    happinessGain: 24,
    loveGain: 18,
  },
  {
    id: 'act_s2_hidetoy',
    title: 'Hide the Toy',
    indonesianTitle: 'Sembunyikan Mainan di Bantal',
    iconEmoji: '🛋️',
    minStage: 2,
    maxStage: 3,
    stageLabel: 'Khusus Stage 2–3',
    mechanic: 'hide_the_toy',
    characterPose: 'surprised',
    description: 'Sembunyikan mainan di balik bantal atau selimut lalu bantu bayi menemukannya dengan kejutan lucu!',
    interactionHint: 'Pilih bantal untuk menyembunyikan & membuka mainan!',
    bgGradient: 'from-purple-100 to-amber-100',
    xpReward: 20,
    coinReward: 10,
    happinessGain: 24,
    loveGain: 15,
  },
  {
    id: 'act_s2_babyblocks',
    title: 'Baby Blocks',
    indonesianTitle: 'Menara Balok Warna-Warni',
    iconEmoji: '🧱',
    minStage: 2,
    maxStage: 2,
    stageLabel: 'Eksklusif Stage 2 (Merangkak)',
    mechanic: 'tower_blocks',
    characterPose: 'playing',
    description: 'Susun balok warna-warni menjadi menara lalu lihat bayi menyentuhnya hingga roboh dengan tawa lucu!',
    interactionHint: 'Klik/seret balok untuk menyusun menara!',
    bgGradient: 'from-amber-100 to-rose-100',
    xpReward: 20,
    coinReward: 10,
    happinessGain: 25,
    loveGain: 14,
  },

  // ==================== STAGE 3: TODDLER (BALITA) ====================
  {
    id: 'act_s3_buildtower',
    title: 'Build a Tower',
    indonesianTitle: 'Arsitek Balok Balita',
    iconEmoji: '🏗️',
    minStage: 3,
    maxStage: 3, // Replaced in older stages!
    stageLabel: 'Eksklusif Balita (Stage 3)',
    mechanic: 'tower_blocks',
    characterPose: 'playing',
    description: 'Pilih balok berdasarkan bentuk dan warna bersama balita untuk membangun menara tinggi!',
    interactionHint: 'Susun balok warna-warni setinggi mungkin!',
    bgGradient: 'from-amber-100 to-sky-100',
    xpReward: 22,
    coinReward: 12,
    happinessGain: 26,
    loveGain: 15,
  },
  {
    id: 'act_s3_pretendcook',
    title: 'Pretend Cooking',
    indonesianTitle: 'Masak-Masakan Balita',
    iconEmoji: '🥣',
    minStage: 3,
    maxStage: 3,
    stageLabel: 'Eksklusif Balita (Stage 3)',
    mechanic: 'cooking_kitchen',
    characterPose: 'cooking',
    description: 'Ajak balita mencampur bahan makanan sederhana, mengaduk di mangkuk, dan menghias piring!',
    interactionHint: 'Pilih resep, masukkan bahan & aduk!',
    bgGradient: 'from-orange-100 to-amber-100',
    xpReward: 22,
    coinReward: 12,
    happinessGain: 26,
    loveGain: 16,
  },
  {
    id: 'act_s3_fingerpaint',
    title: 'Finger Painting',
    indonesianTitle: 'Melukis dengan Jari',
    iconEmoji: '🎨',
    minStage: 3,
    maxStage: 4,
    stageLabel: 'Balita & Anak (Stage 3–4)',
    mechanic: 'finger_painting',
    characterPose: 'playing',
    description: 'Pilih warna cat air dan sentuh-seret jari di kanvas untuk menggambar bersama si kecil!',
    interactionHint: 'Pilih warna & seret jari di kanvas!',
    bgGradient: 'from-pink-100 to-sky-100',
    xpReward: 24,
    coinReward: 12,
    happinessGain: 28,
    loveGain: 16,
  },
  {
    id: 'act_s3_animalsounds',
    title: 'Animal Sounds',
    indonesianTitle: 'Meniru Suara Hewan Lucu',
    iconEmoji: '🦁',
    minStage: 3,
    maxStage: 3,
    stageLabel: 'Eksklusif Balita (Stage 3)',
    mechanic: 'animal_sounds',
    characterPose: 'laughing',
    description: 'Sentuh kartu hewan untuk mendengar suaranya dan lihat balita menirukan suara hewan dengan gembira!',
    interactionHint: 'Klik hewan untuk mendengar & meniru suaranya!',
    bgGradient: 'from-emerald-100 to-lime-100',
    xpReward: 22,
    coinReward: 11,
    happinessGain: 25,
    loveGain: 15,
  },
  {
    id: 'act_s3_sortingtoys',
    title: 'Sorting Toys',
    indonesianTitle: 'Merapikan Mainan Sesuai Warna',
    iconEmoji: '🧺',
    minStage: 3,
    maxStage: 3,
    stageLabel: 'Eksklusif Balita (Stage 3)',
    mechanic: 'sorting_toys',
    characterPose: 'clap_hands',
    description: 'Masukkan mainan ke kotak warna yang tepat bersama balita dan rayakan dengan tepuk tangan!',
    interactionHint: 'Cocokkan mainan ke kotak warna yang sesuai!',
    bgGradient: 'from-sky-100 to-indigo-100',
    xpReward: 23,
    coinReward: 12,
    happinessGain: 25,
    loveGain: 16,
  },
  {
    id: 'act_s3_teddycare',
    title: 'Teddy Bear Care',
    indonesianTitle: 'Merawat Boneka Beruang',
    iconEmoji: '🧸',
    minStage: 3,
    maxStage: 3,
    stageLabel: 'Eksklusif Balita (Stage 3)',
    mechanic: 'teddy_care',
    characterPose: 'loved',
    description: 'Bermain peran menggendong, menyelimuti, dan menidurkan boneka kesayangan bersama balita.',
    interactionHint: 'Beri pelukan, selimut & susu untuk boneka!',
    bgGradient: 'from-rose-100 to-amber-100',
    xpReward: 22,
    coinReward: 11,
    happinessGain: 26,
    loveGain: 20,
  },

  // ==================== STAGE 4: YOUNG CHILD (ANAK KECIL) ====================
  {
    id: 'act_s4_ballplay',
    title: 'Ball Play – Bermain Bola Interaktif',
    indonesianTitle: 'Fisika Bola: Lempar, Tendang & Basket',
    iconEmoji: '⚽',
    minStage: 4,
    maxStage: 5,
    stageLabel: 'Anak Kecil & Besar (Stage 4–5)',
    mechanic: 'ball_physics',
    characterPose: 'happy_jump',
    description: 'Tarik, arahkan, dan lepaskan bola dengan fisika pantulan nyata! Pilih mode Tangkap, Gawang, Pantul, atau Keranjang.',
    interactionHint: 'Tarik & lepaskan bola untuk melempar/menendang!',
    bgGradient: 'from-emerald-100 to-sky-100',
    xpReward: 28,
    coinReward: 16,
    happinessGain: 30,
    loveGain: 16,
  },
  {
    id: 'act_s4_storybook',
    title: 'Storybook Adventure – Membaca Buku',
    indonesianTitle: 'Rak Buku Cerita & Dongeng Nusantara',
    iconEmoji: '📖',
    minStage: 4,
    maxStage: 5,
    stageLabel: 'Anak Kecil & Besar (Stage 4–5)',
    mechanic: 'storybook_reader',
    characterPose: 'reading',
    description: 'Pilih buku dari 6 kategori (Hewan, Petualangan, Dongeng Nusantara, Persahabatan, Sains, Matematika) dan balik halamannya!',
    interactionHint: 'Pilih buku, balik halaman & dengarkan narasi!',
    bgGradient: 'from-amber-100 to-orange-100',
    xpReward: 28,
    coinReward: 15,
    happinessGain: 26,
    loveGain: 18,
  },
  {
    id: 'act_s4_cooking',
    title: 'Cooking Together – Memasak Bersama',
    indonesianTitle: 'Dapur Resep Nusantara & Camilan',
    iconEmoji: '🍳',
    minStage: 4,
    maxStage: 5,
    stageLabel: 'Anak Kecil & Besar (Stage 4–5)',
    mechanic: 'cooking_kitchen',
    characterPose: 'cooking',
    description: 'Pilih resep masakan Indonesia, siapkan bahan di meja, gunakan alat masak virtual, aduk, dan sajikan di piring cantik!',
    interactionHint: 'Pilih resep, masukkan bahan & masak bertahap!',
    bgGradient: 'from-orange-100 to-rose-100',
    xpReward: 30,
    coinReward: 18,
    happinessGain: 28,
    loveGain: 18,
  },
  {
    id: 'act_s4_gardening',
    title: 'Gardening – Berkebun',
    indonesianTitle: 'Menanam & Menyiram Kebun',
    iconEmoji: '🌱',
    minStage: 4,
    maxStage: 5,
    stageLabel: 'Anak Kecil & Besar (Stage 4–5)',
    mechanic: 'gardening_farm',
    characterPose: 'playing',
    description: 'Pilih benih tanaman, tanam di pot, siram dengan penyiram air hingga tumbuh berbunga dan siap dipanen!',
    interactionHint: 'Tanam benih, siram air & panen hasilnya!',
    bgGradient: 'from-lime-100 to-emerald-100',
    xpReward: 26,
    coinReward: 15,
    happinessGain: 26,
    loveGain: 16,
  },
  {
    id: 'act_s4_puzzle',
    title: 'Puzzle Adventure',
    indonesianTitle: 'Puzzle Budaya & Hewan Nusantara',
    iconEmoji: '🧩',
    minStage: 4,
    maxStage: 5,
    stageLabel: 'Anak Kecil & Besar (Stage 4–5)',
    mechanic: 'puzzle_board',
    characterPose: 'studying',
    description: 'Susun potongan gambar hewan, rumah adat, dan budaya Indonesia ke posisi yang tepat!',
    interactionHint: 'Klik/tukar kepingan puzzle hingga tersusun utuh!',
    bgGradient: 'from-sky-100 to-purple-100',
    xpReward: 28,
    coinReward: 16,
    happinessGain: 26,
    loveGain: 14,
  },
  {
    id: 'act_s4_dance',
    title: 'Dance Together',
    indonesianTitle: 'Menari Mengikuti Irama Lagu',
    iconEmoji: '💃',
    minStage: 4,
    maxStage: 5,
    stageLabel: 'Anak Kecil & Besar (Stage 4–5)',
    mechanic: 'dance_rhythm',
    characterPose: 'dancing',
    description: 'Pilih lagu ceria dan sentuh tombol gerakan tari sesuai ketukan irama bersama karakter!',
    interactionHint: 'Tekan tombol langkah tari sesuai ketukan!',
    bgGradient: 'from-pink-100 to-purple-100',
    xpReward: 26,
    coinReward: 15,
    happinessGain: 30,
    loveGain: 16,
  },

  // ==================== STAGE 5: OLDER CHILD (ANAK MULAI BESAR) ====================
  {
    id: 'act_s5_sportsclub',
    title: 'Sports Club',
    indonesianTitle: 'Klub Olahraga: Sepak Bola, Basket & Badminton',
    iconEmoji: '🏀',
    minStage: 5,
    maxStage: 5,
    stageLabel: 'Anak Mulai Besar (Stage 5)',
    mechanic: 'ball_physics',
    characterPose: 'happy_jump',
    description: 'Latihan ketangkasan sepak bola, basket, badminton, dan bowling dengan kontrol arah lemparan/tendangan!',
    interactionHint: 'Pilih cabang olahraga & bidik sasaran skor!',
    bgGradient: 'from-sky-100 to-emerald-100',
    xpReward: 32,
    coinReward: 18,
    happinessGain: 30,
    loveGain: 15,
  },
  {
    id: 'act_s5_sciencelab',
    title: 'Science Lab',
    indonesianTitle: 'Laboratorium Sains Virtual Aman',
    iconEmoji: '🔬',
    minStage: 5,
    maxStage: 5,
    stageLabel: 'Anak Mulai Besar (Stage 5)',
    mechanic: 'science_lab',
    characterPose: 'studying',
    description: 'Lakukan eksperimen pencampuran warna, gaya magnet, dan pengamatan pertumbuhan tanaman secara aman!',
    interactionHint: 'Campurkan tabung warna & uji magnet!',
    bgGradient: 'from-cyan-100 to-indigo-100',
    xpReward: 34,
    coinReward: 20,
    happinessGain: 28,
    loveGain: 14,
  },
  {
    id: 'act_s5_artstudio',
    title: 'Art Studio',
    indonesianTitle: 'Studio Lukis & Desain Kartu',
    iconEmoji: '🖌️',
    minStage: 5,
    maxStage: 5,
    stageLabel: 'Anak Mulai Besar (Stage 5)',
    mechanic: 'finger_painting',
    characterPose: 'playing',
    description: 'Lukis karya seni kanvas, buat kolase warna, dan simpan hasilnya ke dalam galeri kenangan!',
    interactionHint: 'Gunakan kuas warna & stiker bentuk di kanvas!',
    bgGradient: 'from-rose-100 to-amber-100',
    xpReward: 30,
    coinReward: 16,
    happinessGain: 28,
    loveGain: 15,
  },
  {
    id: 'act_s5_musicstudio',
    title: 'Music Studio',
    indonesianTitle: 'Studio Piano & Komposisi Irama',
    iconEmoji: '🎼',
    minStage: 5,
    maxStage: 5,
    stageLabel: 'Anak Mulai Besar (Stage 5)',
    mechanic: 'lullaby_music',
    characterPose: 'dancing',
    description: 'Mainkan oktaf piano virtual dan ciptakan melodi lagu orisinal bersama karakter!',
    interactionHint: 'Tekan tuts piano untuk memainkan melodi!',
    bgGradient: 'from-purple-100 to-pink-100',
    xpReward: 30,
    coinReward: 16,
    happinessGain: 28,
    loveGain: 16,
  },
  {
    id: 'act_s5_treasurehunt',
    title: 'Treasure Hunt',
    indonesianTitle: 'Perburuan Harta Karun & Teka-Teki',
    iconEmoji: '🗺️',
    minStage: 5,
    maxStage: 5,
    stageLabel: 'Anak Mulai Besar (Stage 5)',
    mechanic: 'treasure_hunt',
    characterPose: 'walking',
    description: 'Jelajahi peta taman dan rumah, pecahkan petunjuk matematika, dan temukan peti harta karun tersembunyi!',
    interactionHint: 'Klik lokasi peta & pecahkan kode peti!',
    bgGradient: 'from-amber-100 to-yellow-200',
    xpReward: 35,
    coinReward: 22,
    happinessGain: 30,
    loveGain: 15,
  },
  {
    id: 'act_s5_readingwriting',
    title: 'Reading & Writing Journal',
    indonesianTitle: 'Membaca Buku & Menulis Jurnal Petualangan',
    iconEmoji: '✍️',
    minStage: 5,
    maxStage: 5,
    stageLabel: 'Anak Mulai Besar (Stage 5)',
    mechanic: 'storybook_reader',
    characterPose: 'reading',
    description: 'Baca kisah pengetahuan dan tulis jurnal cerita pendek petualanganmu bersama karakter!',
    interactionHint: 'Baca halaman & rangkai kalimat jurnal!',
    bgGradient: 'from-amber-50 to-sky-100',
    xpReward: 32,
    coinReward: 18,
    happinessGain: 26,
    loveGain: 16,
  },

  // ==================== STAGE 6: TEENAGER (REMAJA) ====================
  {
    id: 'act_s6_cookingchallenge',
    title: 'Cooking Challenge',
    indonesianTitle: 'Tantangan Kuliner & Plating Remaja',
    iconEmoji: '👩‍🍳',
    minStage: 6,
    maxStage: 6,
    stageLabel: 'Remaja (Stage 6)',
    mechanic: 'cooking_kitchen',
    characterPose: 'cooking',
    description: 'Masak resep Nusantara yang lebih lengkap dengan urutan bahan, teknik memasak, dan dekorasi piring!',
    interactionHint: 'Ikuti urutan resep & hias sajian kuliner!',
    bgGradient: 'from-orange-100 to-amber-100',
    xpReward: 36,
    coinReward: 22,
    happinessGain: 30,
    loveGain: 16,
  },
  {
    id: 'act_s6_photography',
    title: 'Photography Adventure',
    indonesianTitle: 'Petualangan Fotografi & Album Sudut Kamera',
    iconEmoji: '📷',
    minStage: 6,
    maxStage: 6,
    stageLabel: 'Remaja (Stage 6)',
    mechanic: 'photography_cam',
    characterPose: 'waving',
    description: 'Pilih lokasi indah, atur fokus jendela bidik kamera, dan abadikan momen terbaik ke dalam album foto!',
    interactionHint: 'Geser bidikan kamera & tekan tombol Shutter!',
    bgGradient: 'from-sky-100 to-indigo-100',
    xpReward: 35,
    coinReward: 20,
    happinessGain: 30,
    loveGain: 16,
  },
  {
    id: 'act_s6_musicdance',
    title: 'Music & Dance Studio',
    indonesianTitle: 'Komposisi Musik & Koreografi Panggung',
    iconEmoji: '🎧',
    minStage: 6,
    maxStage: 6,
    stageLabel: 'Remaja (Stage 6)',
    mechanic: 'dance_rhythm',
    characterPose: 'dancing',
    description: 'Buat aransemen musik orisinal dan tampilkan koreografi pertunjukan virtual yang memukau!',
    interactionHint: 'Rangkai ketukan musik & gerakan koreografi!',
    bgGradient: 'from-fuchsia-100 to-purple-100',
    xpReward: 35,
    coinReward: 20,
    happinessGain: 32,
    loveGain: 16,
  },
  {
    id: 'act_s6_sportstournament',
    title: 'Sports Tournament',
    indonesianTitle: 'Turnamen Basket, Badminton & Sepak Bola',
    iconEmoji: '🏆',
    minStage: 6,
    maxStage: 6,
    stageLabel: 'Remaja (Stage 6)',
    mechanic: 'ball_physics',
    characterPose: 'happy_jump',
    description: 'Ikuti kejuaraan olahraga remaja dan cetak skor tertinggi dengan akurasi bidikan fisika!',
    interactionHint: 'Tarik, bidik & cetak rekor skor turnamen!',
    bgGradient: 'from-emerald-100 to-teal-100',
    xpReward: 38,
    coinReward: 24,
    happinessGain: 32,
    loveGain: 15,
  },
  {
    id: 'act_s6_creativeworkshop',
    title: 'Creative Workshop',
    indonesianTitle: 'Workshop Desain Pakaian & Kanvas Kreatif',
    iconEmoji: '✂️',
    minStage: 6,
    maxStage: 6,
    stageLabel: 'Remaja (Stage 6)',
    mechanic: 'batik_craft',
    characterPose: 'studying',
    description: 'Desain motif pakaian, hiasan kamar, dan karya seni kreatif di studio workshop remaja!',
    interactionHint: 'Pilih pola, warna & kreasikan desainmu!',
    bgGradient: 'from-pink-100 to-rose-100',
    xpReward: 36,
    coinReward: 20,
    happinessGain: 28,
    loveGain: 16,
  },
  {
    id: 'act_s6_travelexplore',
    title: 'Travel & Exploration',
    indonesianTitle: 'Eksplorasi Destinasi Budaya Nusantara',
    iconEmoji: '🧭',
    minStage: 6,
    maxStage: 6,
    stageLabel: 'Remaja (Stage 6)',
    mechanic: 'travel_nusantara',
    characterPose: 'walking',
    description: 'Kunjungi destinasi wisata Nusantara, pelajari tradisi & kuliner daerah, dan kumpulkan kartu budaya!',
    interactionHint: 'Pilih provinsi di peta Nusantara & jelajahi!',
    bgGradient: 'from-emerald-100 to-sky-100',
    xpReward: 38,
    coinReward: 24,
    happinessGain: 30,
    loveGain: 18,
  },
  {
    id: 'act_s6_strategyboard',
    title: 'Strategy & Board Games',
    indonesianTitle: 'Puzzle Logika, Strategi & Teka-Teki Matematika',
    iconEmoji: '♟️',
    minStage: 6,
    maxStage: 6,
    stageLabel: 'Remaja (Stage 6)',
    mechanic: 'puzzle_board',
    characterPose: 'studying',
    description: 'Asah logika dengan permainan papan strategi, puzzle matriks, dan tantangan matematika cepat!',
    interactionHint: 'Pecahkan langkah strategi & puzzle logika!',
    bgGradient: 'from-amber-100 to-stone-200',
    xpReward: 38,
    coinReward: 24,
    happinessGain: 28,
    loveGain: 15,
  },

  // ==================== STAGE 7: ADULT (DEWASA) ====================
  {
    id: 'act_s7_mastercooking',
    title: 'Master Cooking Nusantara',
    indonesianTitle: 'Adi-Kuliner Warisan Nusantara',
    iconEmoji: '🍲',
    minStage: 7,
    maxStage: 7,
    stageLabel: 'Dewasa (Stage 7)',
    mechanic: 'cooking_kitchen',
    characterPose: 'cooking',
    description: 'Racik hidangan legendaris Nusantara (Rendang, Gudeg, Papeda, Pempek) melalui tahapan autentik hingga penyajian!',
    interactionHint: 'Pilih resep Nusantara, racik bumbu & sajikan!',
    bgGradient: 'from-amber-100 to-orange-200',
    xpReward: 42,
    coinReward: 28,
    happinessGain: 32,
    loveGain: 20,
  },
  {
    id: 'act_s7_homedesigner',
    title: 'Home Designer',
    indonesianTitle: 'Arsitek & Desainer Interior Rumah',
    iconEmoji: '🏡',
    minStage: 7,
    maxStage: 7,
    stageLabel: 'Dewasa (Stage 7)',
    mechanic: 'home_designer',
    characterPose: 'smiling',
    description: 'Tata ulang konsep interior rumah, warna dinding, karpet, pencahayaan, dan dekorasi ruangan secara langsung!',
    interactionHint: 'Pilih palet dinding, furnitur & dekorasi rumah!',
    bgGradient: 'from-teal-100 to-emerald-100',
    xpReward: 40,
    coinReward: 25,
    happinessGain: 30,
    loveGain: 18,
  },
  {
    id: 'act_s7_culturalcrafts',
    title: 'Cultural Crafts – Membatik',
    indonesianTitle: 'Kriya Batik & Tenun Tradisional',
    iconEmoji: '👘',
    minStage: 7,
    maxStage: 7,
    stageLabel: 'Dewasa (Stage 7)',
    mechanic: 'batik_craft',
    characterPose: 'studying',
    description: 'Lukis pola canting batik dan motif tenun Nusantara, pilih pewarna alami, dan koleksi karya kriya daerah!',
    interactionHint: 'Pilih motif batik & warnai pola kain tradisional!',
    bgGradient: 'from-amber-100 to-rose-100',
    xpReward: 42,
    coinReward: 28,
    happinessGain: 32,
    loveGain: 20,
  },
  {
    id: 'act_s7_gardenfarm',
    title: 'Garden & Botanical Farm',
    indonesianTitle: 'Perkebunan & Taman Botani Nusantara',
    iconEmoji: '🌻',
    minStage: 7,
    maxStage: 7,
    stageLabel: 'Dewasa (Stage 7)',
    mechanic: 'gardening_farm',
    characterPose: 'playing',
    description: 'Kelola kebun tanaman rempah, bunga anggrek, dan buah segar dari penanaman hingga panen raya!',
    interactionHint: 'Tanam, rawat, siram & panen kebun botani!',
    bgGradient: 'from-emerald-100 to-lime-200',
    xpReward: 40,
    coinReward: 26,
    happinessGain: 30,
    loveGain: 18,
  },
  {
    id: 'act_s7_travelcollection',
    title: 'Travel Collection Nusantara',
    indonesianTitle: 'Ekspedisi & Koleksi Warisan Budaya Indonesia',
    iconEmoji: '✈️',
    minStage: 7,
    maxStage: 7,
    stageLabel: 'Dewasa (Stage 7)',
    mechanic: 'travel_nusantara',
    characterPose: 'waving',
    description: 'Jelajahi 13 daerah Nusantara, abadikan jurnal perjalanan, dan lengkapi ensiklopedia budaya Indonesia!',
    interactionHint: 'Pilih daerah tujuan ekspedisi budaya!',
    bgGradient: 'from-sky-100 to-amber-100',
    xpReward: 45,
    coinReward: 30,
    happinessGain: 34,
    loveGain: 20,
  },
  {
    id: 'act_s7_readingrelax',
    title: 'Reading & Relaxation',
    indonesianTitle: 'Literasi Pustaka & Relaksasi Musik',
    iconEmoji: '☕',
    minStage: 7,
    maxStage: 7,
    stageLabel: 'Dewasa (Stage 7)',
    mechanic: 'storybook_reader',
    characterPose: 'reading',
    description: 'Nikmati waktu santai membaca pustaka filosofi, sejarah Nusantara, dan sains sambil ditemani melodi tenang.',
    interactionHint: 'Pilih buku pustaka & nikmati halaman bacaan!',
    bgGradient: 'from-stone-100 to-amber-100',
    xpReward: 38,
    coinReward: 24,
    happinessGain: 30,
    loveGain: 18,
  },
];

export function getAvailableActivitiesForStage(stageLevel: number): AgeActivityDefinition[] {
  return AGE_ACTIVITIES_CATALOG.filter(
    (act) => stageLevel >= act.minStage && stageLevel <= act.maxStage
  );
}

export function getArchivedPastActivitiesForStage(stageLevel: number): AgeActivityDefinition[] {
  return AGE_ACTIVITIES_CATALOG.filter((act) => act.maxStage < stageLevel);
}

// ==================== INTERACTIVE COOKING RECIPES CATALOG ====================
export interface CookingRecipeStep {
  id: string;
  category: 'Indonesia' | 'Tradisional Nusantara' | 'Sederhana' | 'Kue & Camilan' | 'Minuman';
  name: string;
  regionOrigin: string;
  iconEmoji: string;
  minStage: number;
  ingredients: { id: string; name: string; emoji: string }[];
  toolName: string;
  toolEmoji: string;
  linkedStoreFoodId?: string; // Adds +1 to foodInventory or regional affinity when cooked!
  description: string;
}

export const INTERACTIVE_COOKING_RECIPES: CookingRecipeStep[] = [
  {
    id: 'rec_bubur_buah',
    category: 'Sederhana',
    name: 'Bubur Susu Pisang Madu',
    regionOrigin: 'Rumahan',
    iconEmoji: '🥣',
    minStage: 3,
    ingredients: [
      { id: 'ing_oat', name: 'Beras Halus', emoji: '🌾' },
      { id: 'ing_milk', name: 'Susu Hangat', emoji: '🥛' },
      { id: 'ing_banana', name: 'Pisang Manis', emoji: '🍌' },
    ],
    toolName: 'Mangkuk & Sendok Kayu',
    toolEmoji: '🥄',
    linkedStoreFoodId: 'food_porridge',
    description: 'Makanan lembut bergizi yang mudah diaduk dan dihias bersama balita.',
  },
  {
    id: 'rec_mie_aceh_kerang',
    category: 'Tradisional Nusantara',
    name: 'Mie Aceh Kerang Pantai',
    regionOrigin: 'Aceh',
    iconEmoji: '🍜',
    minStage: 3,
    ingredients: [
      { id: 'ing_kerang_pantai', name: 'Kerang Pantai Segar', emoji: '🐚' },
      { id: 'ing_mie_aceh', name: 'Mie Kuning Tebal', emoji: '🍜' },
      { id: 'ing_rempah_aceh', name: 'Bumbu Rempah Aceh', emoji: '🌶️' },
    ],
    toolName: 'Wajan Besi Aceh',
    toolEmoji: '🍳',
    linkedStoreFoodId: 'nusantara_meal_mie_aceh',
    description: 'Mie khas Aceh kaya rempah hangat yang dimasak bersama kerang segar hasil menggali di pantai.',
  },
  {
    id: 'rec_klepon_pandan',
    category: 'Kue & Camilan',
    name: 'Klepon Pandan Gula Aren',
    regionOrigin: 'Jawa Tengah & Yogyakarta',
    iconEmoji: '🟢',
    minStage: 4,
    ingredients: [
      { id: 'ing_riceflour', name: 'Tepung Ketan Pandan', emoji: '🌿' },
      { id: 'ing_palmsugar', name: 'Gula Merah Cair', emoji: '🍯' },
      { id: 'ing_coconut', name: 'Kelapa Parut', emoji: '🥥' },
    ],
    toolName: 'Panci Kukus Tradisional',
    toolEmoji: '♨️',
    linkedStoreFoodId: 'snack_jogja_bakpia',
    description: 'Kue bola ketan hijau berisi gula aren manis yang ditaburi kelapa parut.',
  },
  {
    id: 'rec_pisang_ijo',
    category: 'Minuman',
    name: 'Es Pisang Ijo Segar',
    regionOrigin: 'Sulawesi Selatan',
    iconEmoji: '🍧',
    minStage: 4,
    ingredients: [
      { id: 'ing_greenbanana', name: 'Pisang Balut Hijau', emoji: '🍌' },
      { id: 'ing_coconutmilk', name: 'Bubur Sumsum Santan', emoji: '🥥' },
      { id: 'ing_syrup', name: 'Sirup Merah & Es', emoji: '🧊' },
    ],
    toolName: 'Mangkuk Saji Dingin',
    toolEmoji: '🍨',
    linkedStoreFoodId: 'snack_sulsel_pisang_ijo',
    description: 'Hidangan penutup segar khas Makassar dengan pisang berbalut adonan pandan.',
  },
  {
    id: 'rec_nasi_goreng',
    category: 'Indonesia',
    name: 'Nasi Goreng Spesial Nusantara',
    regionOrigin: 'Nusantara',
    iconEmoji: '🍛',
    minStage: 4,
    ingredients: [
      { id: 'ing_rice', name: 'Nasi Putih Pulen', emoji: '🍚' },
      { id: 'ing_egg', name: 'Telur & Sayuran', emoji: '🥚' },
      { id: 'ing_spices', name: 'Bumbu & Kecap Manis', emoji: '🧄' },
    ],
    toolName: 'Wajan Penggorengan',
    toolEmoji: '🍳',
    linkedStoreFoodId: 'meal_jakarta_soto_betawi',
    description: 'Nasi goreng harum dengan telur mata sapi dan kerupuk renyah.',
  },
  {
    id: 'rec_rendang_minang',
    category: 'Tradisional Nusantara',
    name: 'Rendang Rempah Minangkabau',
    regionOrigin: 'Sumatera Barat',
    iconEmoji: '🥘',
    minStage: 6,
    ingredients: [
      { id: 'ing_beef', name: 'Daging Pilihan', emoji: '🥩' },
      { id: 'ing_santan', name: 'Santan Kelapa Kental', emoji: '🥥' },
      { id: 'ing_rempah', name: 'Rempah Lengkuas & Serai', emoji: '🌶️' },
    ],
    toolName: 'Kuali Tanah Liat',
    toolEmoji: '🍲',
    linkedStoreFoodId: 'meal_sumbar_rendang',
    description: 'Mahakarya kuliner Sumatera Barat yang dimasak perlahan dengan rempah pilihan.',
  },
  {
    id: 'rec_gudeg_jogja',
    category: 'Tradisional Nusantara',
    name: 'Gudeg Nangka Yogyakarta',
    regionOrigin: 'DI Yogyakarta',
    iconEmoji: '🍱',
    minStage: 7,
    ingredients: [
      { id: 'ing_jackfruit', name: 'Nangka Muda', emoji: '🍈' },
      { id: 'ing_arenga', name: 'Gula Aren & Daun Jati', emoji: '🍂' },
      { id: 'ing_santan_egg', name: 'Telur Pindang & Areh', emoji: '🥚' },
    ],
    toolName: 'Kendil Tradisional',
    toolEmoji: '🏺',
    linkedStoreFoodId: 'meal_jogja_gudeg',
    description: 'Masakan tradisional khas Yogyakarta dengan cita rasa manis gurih yang kaya budaya.',
  },
];

// ==================== INTERACTIVE STORYBOOK LIBRARY ====================
export interface InteractiveBookItem {
  id: string;
  category:
    | 'Cerita Hewan'
    | 'Petualangan'
    | 'Dongeng Nusantara'
    | 'Cerita Persahabatan'
    | 'Cerita Pengetahuan'
    | 'Cerita Matematika';
  title: string;
  coverEmoji: string;
  coverColor: string;
  pages: {
    pageNumber: number;
    illustrationEmoji: string;
    heading: string;
    text: string;
    characterComment: string;
  }[];
}

export const INTERACTIVE_STORYBOOKS: InteractiveBookItem[] = [
  {
    id: 'book_kancil_hewan',
    category: 'Cerita Hewan',
    title: 'Kancil & Sahabat Hutan Tropis',
    coverEmoji: '🦌',
    coverColor: '#34D399',
    pages: [
      {
        pageNumber: 1,
        illustrationEmoji: '🌳🦌🐦',
        heading: 'Pagi Cerah di Hutan Rimba',
        text: 'Di sebuah hutan tropis yang sejuk, Kancil kecil menyapa burung-burung yang bernyanyi di atas dahan pohon.',
        characterComment: 'Wah, hutannya hijau dan asri sekali!',
      },
      {
        pageNumber: 2,
        illustrationEmoji: '🐘🐢🤝',
        heading: 'Saling Membantu di Tepi Sungai',
        text: 'Kancil mengajak Gajah dan Kura-kura bekerja sama membangun jembatan kayu kecil agar semua hewan bisa menyeberang.',
        characterComment: 'Bekerja sama membuat pekerjaan berat jadi ringan!',
      },
      {
        pageNumber: 3,
        illustrationEmoji: '🍎🎉🌟',
        heading: 'Pesta Buah Bersama',
        text: 'Setelah jembatan selesai, seluruh penghuni hutan menikmati buah-buahan segar bersama dengan penuh sukacita.',
        characterComment: 'Cerita yang sangat menyenangkan! Aku suka berbagi!',
      },
    ],
  },
  {
    id: 'book_dongeng_nusantara',
    category: 'Dongeng Nusantara',
    title: 'Legenda Burung Cenderawasih Emas',
    coverEmoji: '🦚',
    coverColor: '#F59E0B',
    pages: [
      {
        pageNumber: 1,
        illustrationEmoji: '⛰️🌅🦚',
        heading: 'Cahaya dari Pegunungan Papua',
        text: 'Di ufuk timur Nusantara, hiduplah burung Cenderawasih dengan bulu berkilau bagaikan sinar matahari pagi.',
        characterComment: 'Bulu burung Cenderawasih indah sekali!',
      },
      {
        pageNumber: 2,
        illustrationEmoji: '🎶🌺✨',
        heading: 'Tarian Persaudaraan',
        text: 'Setiap pagi, Cenderawasih menari di atas pucuk pohon untuk mengingatkan warga desa agar selalu menjaga kelestarian alam.',
        characterComment: 'Kita juga harus menjaga alam Indonesia ya!',
      },
      {
        pageNumber: 3,
        illustrationEmoji: '🌈🌏💖',
        heading: 'Kebanggaan Nusantara',
        text: 'Hingga kini, keindahan Cenderawasih menjadi simbol kekayaan alam dan budaya Nusantara yang dikagumi dunia.',
        characterComment: 'Aku bangga sekali dengan budaya Nusantara!',
      },
    ],
  },
  {
    id: 'book_petualangan_pulau',
    category: 'Petualangan',
    title: 'Kapal Layar Penjelajah Kepulauan',
    coverEmoji: '⛵',
    coverColor: '#38BDF8',
    pages: [
      {
        pageNumber: 1,
        illustrationEmoji: '⛵🌊🧭',
        heading: 'Berlayar Menembus Ombak',
        text: 'Nakhoda cilik menyiapkan kompas dan membentangkan layar menuju pulau-pulau rempah di seberang lautan.',
        characterComment: 'Ayo kita berlayar melihat pulau baru!',
      },
      {
        pageNumber: 2,
        illustrationEmoji: '🐬🏝️🥥',
        heading: 'Ditemani Lumba-Lumba Ramah',
        text: 'Kawanan lumba-lumba melompat ceria di samping perahu, menunjukkan jalan menuju teluk berpasir putih.',
        characterComment: 'Lihat! Lumba-lumbanya pintar sekali!',
      },
      {
        pageNumber: 3,
        illustrationEmoji: '🗺️💎🎉',
        heading: 'Pulau Persahabatan',
        text: 'Sesampainya di pulau, para penjelajah disambut hangat dengan musik tradisional dan hidangan lezat.',
        characterComment: 'Petualangan yang seru sekali!',
      },
    ],
  },
  {
    id: 'book_persahabatan',
    category: 'Cerita Persahabatan',
    title: 'Taman Bunga Dua Sahabat',
    coverEmoji: '🌻',
    coverColor: '#F472B6',
    pages: [
      {
        pageNumber: 1,
        illustrationEmoji: '👧👦🌱',
        heading: 'Benih Kecil Harapan',
        text: 'Rani dan Bima menanam benih bunga matahari di halaman sekolah dan berjanji merawatnya setiap hari.',
        characterComment: 'Menanam bunga bersama sahabat pasti seru!',
      },
      {
        pageNumber: 2,
        illustrationEmoji: '🌧️☂️🌿',
        heading: 'Melindungi Tanaman Saat Hujan',
        text: 'Ketika hujan deras turun, mereka bekerja sama memberi penyangga kayu agar batang tanaman tetap tegak.',
        characterComment: 'Sahabat sejati selalu saling mendukung!',
      },
      {
        pageNumber: 3,
        illustrationEmoji: '🌻🐝💛',
        heading: 'Mekar dengan Indah',
        text: 'Bunga matahari akhirnya mekar kuning cerah, menghiasi taman dan membawa senyum bagi semua teman.',
        characterComment: 'Terima kasih sudah menjadi sahabat terbaikku!',
      },
    ],
  },
  {
    id: 'book_sains_pengetahuan',
    category: 'Cerita Pengetahuan',
    title: 'Rahasia Pelangi & Tetesan Hujan',
    coverEmoji: '🌈',
    coverColor: '#8B5CF6',
    pages: [
      {
        pageNumber: 1,
        illustrationEmoji: '☀️🌧️💧',
        heading: 'Ketika Matahari Bertemu Hujan',
        text: 'Tahukah kamu? Pelangi muncul ketika cahaya matahari melewati bintik-bintik air hujan di udara.',
        characterComment: 'Ooo, begitu cara pelangi terbentuk!',
      },
      {
        pageNumber: 2,
        illustrationEmoji: '🔺🌈✨',
        heading: 'Tujuh Warna Spektrum Cahaya',
        text: 'Tetesan air membiaskan cahaya putih menjadi Merah, Jingga, Kuning, Hijau, Biru, Nila, dan Ungu (Mejikuhibiniu).',
        characterComment: 'Me-Ji-Ku-Hi-Bi-Ni-U! Mudah diingat!',
      },
      {
        pageNumber: 3,
        illustrationEmoji: '🔭🌍💡',
        heading: 'Keajaiban Sains di Sekitar Kita',
        text: 'Dengan mengamati alam sekitar, kita bisa menemukan banyak ilmu pengetahuan yang menakjubkan setiap hari.',
        characterComment: 'Sains membuat aku makin penasaran dan pintar!',
      },
    ],
  },
  {
    id: 'book_cerita_matematika',
    category: 'Cerita Matematika',
    title: 'Misteri Toko Kue Angka Ajaib',
    coverEmoji: '🔢',
    coverColor: '#10B981',
    pages: [
      {
        pageNumber: 1,
        illustrationEmoji: '🧁🧁🧁',
        heading: 'Menghitung Loyang Kue',
        text: 'Pembuat kue memanggang 3 loyang kue, dan setiap loyang berisi 4 kue mangkuk. Berapa semuanya? 3 × 4 = 12 kue!',
        characterComment: '3 dikali 4 sama dengan 12 kue!',
      },
      {
        pageNumber: 2,
        illustrationEmoji: '🍰➗👧👦',
        heading: 'Berbagi Sama Rata',
        text: 'Jika 12 kue dibagikan sama rata kepada 4 anak, maka setiap anak mendapatkan 12 ÷ 4 = 3 kue lezat!',
        characterComment: 'Matematika sangat berguna untuk berbagi secara adil!',
      },
      {
        pageNumber: 3,
        illustrationEmoji: '🏆🪙🎓',
        heading: 'Ahli Matematika Cilik',
        text: 'Dengan berhitung setiap hari, kita bisa mengelola koin tabungan dan memecahkan teka-teki dengan cepat!',
        characterComment: 'Ayo kita main Math Challenge lagi nanti!',
      },
    ],
  },
];

export function getOutgrownActivitiesForStage(currentStageLevel: number): AgeActivityDefinition[] {
  return AGE_ACTIVITIES_CATALOG.filter((a) => currentStageLevel > a.maxStage);
}

export function createInitialCharacterLifeData(now = Date.now()): CharacterLifeData {
  const firstStageDays = getStageDurationDays(1);
  return {
    characterCreatedAt: now,
    currentStage: 'newborn',
    createdAt: now,
    stageStartedAt: now,
    stageDurationDays: firstStageDays,
    nextEvolutionAt: now + firstStageDays * DAY_MS,
    totalElapsedDays: 0,
    totalAgeDays: 0,
    lastGrowthCheckAt: now,
    devBonusSimulatedDays: 0,

    // Section 9: Dynamic Body Height, Scale & Age-Based Character Visual Growth
    characterScale: getCharacterScaleForStage('newborn'),
    characterHeightStage: 'newborn',
    characterProportionProfile: getCharacterProportionProfile('newborn'),
    characterVisualStage: 1,
    characterAnchor: 'bottomCenter',
    characterGrowthTransition: null,

    health: 95,
    illnessState: 'healthy',
    recoveryUntil: null,
    illnessEnabled: true,

    unlockedActivities: getAvailableActivitiesForStage(1).map((a) => a.id),
    completedActivities: [],
    recentlyPlayedActivities: [],
    favoriteActivities: [],
    activityMemories: [],

    evolutionHistory: [
      {
        stageLevel: 1,
        stageCode: 'newborn',
        reachedAt: now,
        date: new Date(now).toISOString().slice(0, 10),
      },
    ],
    photoMemories: [
      {
        id: `photo_stage_1_${now}`,
        stageLevel: 1,
        stageCode: 'newborn',
        stageTitle: 'Stage 1 – Newborn Baby',
        indonesianTitle: 'Bayi Baru Lahir (Bayi Dibedong)',
        caption: GROWING_UP_STAGE_CAPTIONS[1].caption,
        unlockedDate: new Date(now).toISOString().slice(0, 10),
        unlockedTimestamp: now,
        outfitId: 'outfit_pink_pastel',
        ageDaysAtUnlock: 0,
        pose: GROWING_UP_STAGE_CAPTIONS[1].pose,
        roomBackground: GROWING_UP_STAGE_CAPTIONS[1].roomBackground,
      },
    ],
  };
}
