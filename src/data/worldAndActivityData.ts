// Expandable Outdoor Worlds, Persistent Garden Growth, Harvest Inventory, and Interactive Kitchen Cooking System

export type WorldLocationId =
  | 'bedroom'
  | 'livingroom'
  | 'kitchen'
  | 'bathroom'
  | 'playroom'
  | 'backyard_garden'
  | 'flower_garden'
  | 'vegetable_garden'
  | 'front_yard'
  | 'park'
  | 'playground'
  | 'beach'
  | 'cultural_village';

export interface WorldLocationMeta {
  id: WorldLocationId;
  name: string;
  indonesianName: string;
  icon: string;
  iconEmoji: string;
  category: 'indoor' | 'garden' | 'outdoor';
  bgColor: string;
  skyOrWallLeft: string;
  skyOrWallRight: string;
  groundTop: string;
  groundBottom: string;
  connectedLocations: WorldLocationId[];
  doorExitCoords: { x: number; y: number };
  defaultEntryCoords: { x: number; y: number };
  description: string;
}

export const WORLD_LOCATIONS: WorldLocationMeta[] = [
  {
    id: 'bedroom',
    name: 'Bedroom',
    indonesianName: 'Kamar Tidur',
    icon: '🛏️',
    iconEmoji: '🛏️',
    category: 'indoor',
    bgColor: '#FDE68A',
    skyOrWallLeft: '#FFF1E6',
    skyOrWallRight: '#FFE3D0',
    groundTop: '#F3D9B1',
    groundBottom: '#D9B382',
    connectedLocations: ['livingroom', 'playroom', 'bathroom', 'backyard_garden'],
    doorExitCoords: { x: 16, y: 58 },
    defaultEntryCoords: { x: 50, y: 62 },
    description: 'Kamar tidur hangat dengan boks/kasur, bantal cilukba, rak buku, dan boneka.',
  },
  {
    id: 'livingroom',
    name: 'Living Room',
    indonesianName: 'Ruang Keluarga',
    icon: '🛋️',
    iconEmoji: '🛋️',
    category: 'indoor',
    bgColor: '#FBCFE8',
    skyOrWallLeft: '#FFF3E0',
    skyOrWallRight: '#FFE0B2',
    groundTop: '#EAD1B1',
    groundBottom: '#CBB190',
    connectedLocations: ['bedroom', 'kitchen', 'front_yard', 'backyard_garden'],
    doorExitCoords: { x: 86, y: 58 },
    defaultEntryCoords: { x: 50, y: 63 },
    description: 'Ruang keluarga nyaman dengan sofa, karpet, vas bunga, dan pintu ke halaman.',
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    indonesianName: 'Dapur Interaktif',
    icon: '🍳',
    iconEmoji: '🍳',
    category: 'indoor',
    bgColor: '#FED7AA',
    skyOrWallLeft: '#FFFDE7',
    skyOrWallRight: '#FFF59D',
    groundTop: '#E5E7EB',
    groundBottom: '#D1D5DB',
    connectedLocations: ['livingroom', 'backyard_garden', 'vegetable_garden'],
    doorExitCoords: { x: 88, y: 58 },
    defaultEntryCoords: { x: 52, y: 64 },
    description: 'Dapur lengkap dengan kulkas, wastafel, meja persiapan, kompor, panci, dan meja makan.',
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    indonesianName: 'Kamar Mandi',
    icon: '🛁',
    iconEmoji: '🛁',
    category: 'indoor',
    bgColor: '#BAE6FD',
    skyOrWallLeft: '#E0F7FA',
    skyOrWallRight: '#B2EBF2',
    groundTop: '#E2E8F0',
    groundBottom: '#CBD5E1',
    connectedLocations: ['bedroom', 'livingroom'],
    doorExitCoords: { x: 16, y: 58 },
    defaultEntryCoords: { x: 50, y: 62 },
    description: 'Kamar mandi bersih dengan bak mandi, botol sabun busa, shower, dan handuk.',
  },
  {
    id: 'playroom',
    name: 'Playroom',
    indonesianName: 'Ruang Bermain',
    icon: '🧸',
    iconEmoji: '🧸',
    category: 'indoor',
    bgColor: '#A7F3D0',
    skyOrWallLeft: '#F3E5F5',
    skyOrWallRight: '#E1BEE7',
    groundTop: '#FDE68A',
    groundBottom: '#F59E0B',
    connectedLocations: ['bedroom', 'livingroom', 'playground', 'park'],
    doorExitCoords: { x: 16, y: 58 },
    defaultEntryCoords: { x: 50, y: 63 },
    description: 'Ruang bermain penuh balok susun, rak buku cerita, bola fisika, dan kotak mainan.',
  },
  {
    id: 'backyard_garden',
    name: 'Backyard Garden',
    indonesianName: 'Kebun Belakang',
    icon: '🏡',
    iconEmoji: '🏡',
    category: 'garden',
    bgColor: '#86EFAC',
    skyOrWallLeft: '#BAE6FD',
    skyOrWallRight: '#7DD3FC',
    groundTop: '#86EFAC',
    groundBottom: '#4ADE80',
    connectedLocations: ['livingroom', 'kitchen', 'flower_garden', 'vegetable_garden', 'park'],
    doorExitCoords: { x: 15, y: 55 },
    defaultEntryCoords: { x: 48, y: 66 },
    description: 'Halaman belakang rumah dengan bedeng kebun, rak bibit, sekop, gembor air, dan keranjang panen.',
  },
  {
    id: 'flower_garden',
    name: 'Flower Garden',
    indonesianName: 'Taman Bunga',
    icon: '🌻',
    iconEmoji: '🌻',
    category: 'garden',
    bgColor: '#F9A8D4',
    skyOrWallLeft: '#E0F2FE',
    skyOrWallRight: '#BAE6FD',
    groundTop: '#A7F3D0',
    groundBottom: '#34D399',
    connectedLocations: ['backyard_garden', 'vegetable_garden', 'park', 'livingroom'],
    doorExitCoords: { x: 15, y: 56 },
    defaultEntryCoords: { x: 50, y: 66 },
    description: 'Taman bunga warna-warni tempat menanam mawar, matahari, tulip, daisy, dan merangkai vas.',
  },
  {
    id: 'vegetable_garden',
    name: 'Vegetable Garden',
    indonesianName: 'Kebun Sayur',
    icon: '🥕',
    iconEmoji: '🥕',
    category: 'garden',
    bgColor: '#BEF264',
    skyOrWallLeft: '#E0F2FE',
    skyOrWallRight: '#7DD3FC',
    groundTop: '#BEF264',
    groundBottom: '#84CC16',
    connectedLocations: ['backyard_garden', 'kitchen', 'flower_garden'],
    doorExitCoords: { x: 15, y: 56 },
    defaultEntryCoords: { x: 50, y: 66 },
    description: 'Kebun sayur subur untuk menanam dan memanen tomat, wortel, jagung, cabai, dan stroberi.',
  },
  {
    id: 'front_yard',
    name: 'Front Yard',
    indonesianName: 'Halaman Depan',
    icon: '🌳',
    iconEmoji: '🌳',
    category: 'outdoor',
    bgColor: '#A7F3D0',
    skyOrWallLeft: '#DBEAFE',
    skyOrWallRight: '#93C5FD',
    groundTop: '#86EFAC',
    groundBottom: '#22C55E',
    connectedLocations: ['livingroom', 'park', 'playground', 'cultural_village'],
    doorExitCoords: { x: 50, y: 48 },
    defaultEntryCoords: { x: 50, y: 66 },
    description: 'Halaman depan rumah yang asri dengan pagar kayu, jalan setapak, bunga, dan kupu-kupu.',
  },
  {
    id: 'park',
    name: 'Park',
    indonesianName: 'Taman Kota & Piknik',
    icon: '🧺',
    iconEmoji: '🧺',
    category: 'outdoor',
    bgColor: '#6EE7B7',
    skyOrWallLeft: '#E0F2FE',
    skyOrWallRight: '#7DD3FC',
    groundTop: '#6EE7B7',
    groundBottom: '#10B981',
    connectedLocations: ['front_yard', 'playground', 'backyard_garden', 'beach'],
    doorExitCoords: { x: 14, y: 58 },
    defaultEntryCoords: { x: 48, y: 66 },
    description: 'Taman hijau luas untuk bermain bola, menggelar tikar piknik, mengamati kupu-kupu, dan berfoto.',
  },
  {
    id: 'playground',
    name: 'Playground',
    indonesianName: 'Taman Bermain',
    icon: '🛝',
    iconEmoji: '🛝',
    category: 'outdoor',
    bgColor: '#FDE047',
    skyOrWallLeft: '#E0F2FE',
    skyOrWallRight: '#93C5FD',
    groundTop: '#FDE68A',
    groundBottom: '#86EFAC',
    connectedLocations: ['park', 'front_yard', 'playroom', 'beach'],
    doorExitCoords: { x: 14, y: 58 },
    defaultEntryCoords: { x: 48, y: 66 },
    description: 'Area bermain outdoor dengan perosotan, ayunan, bak pasir virtual, dan bola.',
  },
  {
    id: 'beach',
    name: 'Beach',
    indonesianName: 'Pantai Tropis',
    icon: '🏖️',
    iconEmoji: '🏖️',
    category: 'outdoor',
    bgColor: '#7DD3FC',
    skyOrWallLeft: '#BAE6FD',
    skyOrWallRight: '#38BDF8',
    groundTop: '#FDE68A',
    groundBottom: '#F59E0B',
    connectedLocations: ['park', 'playground', 'cultural_village', 'front_yard'],
    doorExitCoords: { x: 14, y: 58 },
    defaultEntryCoords: { x: 48, y: 66 },
    description: 'Pantai pasir putih dengan ombak lembut, istana pasir, kerang, dan bola pantai.',
  },
  {
    id: 'cultural_village',
    name: 'Cultural Village',
    indonesianName: 'Desa Budaya Nusantara',
    icon: '🏛️',
    iconEmoji: '🏛️',
    category: 'outdoor',
    bgColor: '#FDBA74',
    skyOrWallLeft: '#FEF3C7',
    skyOrWallRight: '#FDE68A',
    groundTop: '#D9F99D',
    groundBottom: '#65A30D',
    connectedLocations: ['front_yard', 'park', 'beach', 'kitchen'],
    doorExitCoords: { x: 14, y: 58 },
    defaultEntryCoords: { x: 50, y: 66 },
    description: 'Desa budaya Nusantara dengan rumah adat, taman herbal, musik tradisional, dan kuliner.',
  },
];

export function getWorldLocationMeta(id: WorldLocationId): WorldLocationMeta {
  return WORLD_LOCATIONS.find((l) => l.id === id) || WORLD_LOCATIONS[0];
}

export function isGardenLocation(id: WorldLocationId): boolean {
  return id === 'backyard_garden' || id === 'flower_garden' || id === 'vegetable_garden';
}

export function isOutdoorLocation(id: WorldLocationId): boolean {
  const meta = getWorldLocationMeta(id);
  return meta.category === 'garden' || meta.category === 'outdoor';
}

// ==================== 10 PLANT TYPES & 6-STAGE PERSISTENT PLANT GROWTH SYSTEM ====================
export type PlantTypeId =
  | 'sunflower'
  | 'rose'
  | 'tulip'
  | 'daisy'
  | 'chili'
  | 'tomato'
  | 'carrot'
  | 'corn'
  | 'strawberry'
  | 'herbal';

export type PlantId = PlantTypeId;

export type PlantGrowthStage =
  | 'Seed'
  | 'Sprout'
  | 'Small Plant'
  | 'Growing Plant'
  | 'Mature Plant'
  | 'Harvestable';

export const PLANT_STAGE_ORDER: PlantGrowthStage[] = [
  'Seed',
  'Sprout',
  'Small Plant',
  'Growing Plant',
  'Mature Plant',
  'Harvestable',
];

export const PLANT_STAGE_LABELS: Record<PlantGrowthStage, { id: string; en: string }> = {
  Seed: { id: 'Bibit (Seed)', en: 'Seed' },
  Sprout: { id: 'Tunas (Sprout)', en: 'Sprout' },
  'Small Plant': { id: 'Tanaman Kecil', en: 'Small Plant' },
  'Growing Plant': { id: 'Bertumbuh', en: 'Growing Plant' },
  'Mature Plant': { id: 'Siap Berbunga/Buah', en: 'Mature Plant' },
  Harvestable: { id: 'Siap Panen! ✨', en: 'Harvestable' },
};

export interface PlantCatalogItem {
  id: PlantTypeId;
  name: string;
  indonesianName: string;
  category: 'flower' | 'vegetable' | 'fruit' | 'herb';
  seedEmoji: string;
  harvestEmoji: string;
  iconEmoji: string;
  color: string;
  harvestYield: number;
  coinValue: number;
  stageIntervalMs: number; // Virtual growth time per stage (also progresses offline)
}

export const PLANT_CATALOG: PlantCatalogItem[] = [
  {
    id: 'sunflower',
    name: 'Sunflower',
    indonesianName: 'Bunga Matahari',
    category: 'flower',
    seedEmoji: '🌻',
    harvestEmoji: '🌻',
    iconEmoji: '🌻',
    color: '#FACC15',
    harvestYield: 2,
    coinValue: 15,
    stageIntervalMs: 18000,
  },
  {
    id: 'rose',
    name: 'Rose',
    indonesianName: 'Bunga Mawar',
    category: 'flower',
    seedEmoji: '🌹',
    harvestEmoji: '🌹',
    iconEmoji: '🌹',
    color: '#F43F5E',
    harvestYield: 2,
    coinValue: 16,
    stageIntervalMs: 18000,
  },
  {
    id: 'tulip',
    name: 'Tulip',
    indonesianName: 'Bunga Tulip',
    category: 'flower',
    seedEmoji: '🌷',
    harvestEmoji: '🌷',
    iconEmoji: '🌷',
    color: '#EC4899',
    harvestYield: 2,
    coinValue: 16,
    stageIntervalMs: 18000,
  },
  {
    id: 'daisy',
    name: 'Daisy',
    indonesianName: 'Bunga Daisy',
    category: 'flower',
    seedEmoji: '🌼',
    harvestEmoji: '🌼',
    iconEmoji: '🌼',
    color: '#FEF08A',
    harvestYield: 3,
    coinValue: 14,
    stageIntervalMs: 16000,
  },
  {
    id: 'tomato',
    name: 'Tomato',
    indonesianName: 'Tomat Segar',
    category: 'vegetable',
    seedEmoji: '🍅',
    harvestEmoji: '🍅',
    iconEmoji: '🍅',
    color: '#EF4444',
    harvestYield: 3,
    coinValue: 15,
    stageIntervalMs: 18000,
  },
  {
    id: 'carrot',
    name: 'Carrot',
    indonesianName: 'Wortel Manis',
    category: 'vegetable',
    seedEmoji: '🥕',
    harvestEmoji: '🥕',
    iconEmoji: '🥕',
    color: '#F97316',
    harvestYield: 3,
    coinValue: 15,
    stageIntervalMs: 18000,
  },
  {
    id: 'corn',
    name: 'Corn',
    indonesianName: 'Jagung Manis',
    category: 'vegetable',
    seedEmoji: '🌽',
    harvestEmoji: '🌽',
    iconEmoji: '🌽',
    color: '#EAB308',
    harvestYield: 2,
    coinValue: 18,
    stageIntervalMs: 20000,
  },
  {
    id: 'chili',
    name: 'Chili',
    indonesianName: 'Cabai Merah',
    category: 'vegetable',
    seedEmoji: '🌶️',
    harvestEmoji: '🌶️',
    iconEmoji: '🌶️',
    color: '#DC2626',
    harvestYield: 3,
    coinValue: 16,
    stageIntervalMs: 18000,
  },
  {
    id: 'strawberry',
    name: 'Strawberry',
    indonesianName: 'Stroberi Manis',
    category: 'fruit',
    seedEmoji: '🍓',
    harvestEmoji: '🍓',
    iconEmoji: '🍓',
    color: '#FB7185',
    harvestYield: 3,
    coinValue: 18,
    stageIntervalMs: 18000,
  },
  {
    id: 'herbal',
    name: 'Herbal Plant',
    indonesianName: 'Tanaman Herbal',
    category: 'herb',
    seedEmoji: '🌿',
    harvestEmoji: '🌿',
    iconEmoji: '🌿',
    color: '#10B981',
    harvestYield: 3,
    coinValue: 15,
    stageIntervalMs: 16000,
  },
];

export function getPlantDef(plantId?: PlantTypeId | string | null): PlantCatalogItem {
  return PLANT_CATALOG.find((p) => p.id === plantId) || PLANT_CATALOG[0];
}

export interface GardenPlantRecord {
  bedIndex: number; // 0..3
  plantId: PlantTypeId | null;
  plantType?: PlantTypeId;
  plantedAt: number;
  stage: PlantGrowthStage;
  growthStage?: PlantGrowthStage;
  growthProgress: number; // 0..100
  lastWateredAt: number;
  waterCount: number;
  harvestReady?: boolean;
  soilPrepared: boolean;
  gardenPosition?: {
    locationId: WorldLocationId;
    bedIndex: number;
    x: number;
    y: number;
  };
}

export type GardenBedPlantInstance = GardenPlantRecord;
export type GardenPlantInstance = GardenPlantRecord;

// Compute updated plant growth stage based on virtual elapsed time & watering care (never dies permanently!)
export function evaluatePlantGrowth(
  plant: GardenPlantRecord,
  now = Date.now()
): GardenPlantRecord {
  const activePlantId = plant.plantId || plant.plantType || null;
  if (!activePlantId) {
    return {
      ...plant,
      plantId: null,
      stage: 'Seed',
      growthStage: 'Seed',
      growthProgress: 0,
      harvestReady: false,
    };
  }
  const catalog = PLANT_CATALOG.find((c) => c.id === activePlantId) || PLANT_CATALOG[0];
  const elapsedMs = Math.max(0, now - (plant.plantedAt || now));
  const currentStageVal = plant.stage || plant.growthStage || 'Seed';
  const waterBonusStages = Math.min(3, plant.waterCount);
  const timeStages = Math.floor(elapsedMs / catalog.stageIntervalMs);
  const rawStageIdx = Math.min(
    PLANT_STAGE_ORDER.length - 1,
    Math.max(PLANT_STAGE_ORDER.indexOf(currentStageVal), timeStages + waterBonusStages)
  );
  const cappedIdx =
    plant.waterCount === 0 && elapsedMs < 180000
      ? Math.min(3, rawStageIdx)
      : rawStageIdx;
  const nextStage = PLANT_STAGE_ORDER[cappedIdx];
  const nextProgress = Math.min(100, Math.max(plant.growthProgress || 0, Math.round((cappedIdx / 5) * 100)));
  return {
    ...plant,
    plantId: activePlantId,
    plantType: activePlantId,
    stage: nextStage,
    growthStage: nextStage,
    growthProgress: nextProgress,
    harvestReady: nextStage === 'Harvestable',
  };
}

// ==================== KITCHEN INTERACTIVE COOKING, RECIPES & FOOD STATE SYSTEM ====================
export type CookingFoodState =
  | 'none'
  | 'idle'
  | 'raw'
  | 'prepared'
  | 'cooking'
  | 'cooked'
  | 'plated'
  | 'served';

export interface CookingIngredientDef {
  id: string;
  name: string;
  indonesianName: string;
  emoji: string;
  preparedEmoji: string;
  source: 'refrigerator' | 'shelf' | 'garden' | 'beach';
  gardenPlantId?: PlantTypeId;
  fromGardenPlantId?: PlantTypeId;
}

export const COOKING_INGREDIENTS: Record<string, CookingIngredientDef> = {
  carrot: {
    id: 'carrot',
    name: 'Carrot',
    indonesianName: 'Wortel',
    emoji: '🥕',
    preparedEmoji: '🥕✨',
    source: 'garden',
    gardenPlantId: 'carrot',
    fromGardenPlantId: 'carrot',
  },
  tomato: {
    id: 'tomato',
    name: 'Tomato',
    indonesianName: 'Tomat',
    emoji: '🍅',
    preparedEmoji: '🍅✨',
    source: 'garden',
    gardenPlantId: 'tomato',
    fromGardenPlantId: 'tomato',
  },
  corn: {
    id: 'corn',
    name: 'Corn',
    indonesianName: 'Jagung',
    emoji: '🌽',
    preparedEmoji: '🌽✨',
    source: 'garden',
    gardenPlantId: 'corn',
    fromGardenPlantId: 'corn',
  },
  strawberry: {
    id: 'strawberry',
    name: 'Strawberry',
    indonesianName: 'Stroberi',
    emoji: '🍓',
    preparedEmoji: '🍓✨',
    source: 'garden',
    gardenPlantId: 'strawberry',
    fromGardenPlantId: 'strawberry',
  },
  chili: {
    id: 'chili',
    name: 'Chili',
    indonesianName: 'Cabai',
    emoji: '🌶️',
    preparedEmoji: '🌶️✨',
    source: 'garden',
    gardenPlantId: 'chili',
    fromGardenPlantId: 'chili',
  },
  herbal: {
    id: 'herbal',
    name: 'Herbs',
    indonesianName: 'Daun Herbal',
    emoji: '🌿',
    preparedEmoji: '🌿✨',
    source: 'garden',
    gardenPlantId: 'herbal',
    fromGardenPlantId: 'herbal',
  },
  potato: {
    id: 'potato',
    name: 'Potato',
    indonesianName: 'Kentang',
    emoji: '🥔',
    preparedEmoji: '🥔✨',
    source: 'shelf',
  },
  rice: {
    id: 'rice',
    name: 'Rice',
    indonesianName: 'Beras / Nasi',
    emoji: '🍚',
    preparedEmoji: '🍚✨',
    source: 'shelf',
  },
  egg: {
    id: 'egg',
    name: 'Egg',
    indonesianName: 'Telur',
    emoji: '🥚',
    preparedEmoji: '🥚✨',
    source: 'refrigerator',
  },
  milk: {
    id: 'milk',
    name: 'Milk',
    indonesianName: 'Susu Segar',
    emoji: '🥛',
    preparedEmoji: '🥛✨',
    source: 'refrigerator',
  },
  flour: {
    id: 'flour',
    name: 'Flour',
    indonesianName: 'Tepung',
    emoji: '🌾',
    preparedEmoji: '🌾✨',
    source: 'shelf',
  },
  cheese: {
    id: 'cheese',
    name: 'Cheese',
    indonesianName: 'Keju',
    emoji: '🧀',
    preparedEmoji: '🧀✨',
    source: 'refrigerator',
  },
  bread: {
    id: 'bread',
    name: 'Bread',
    indonesianName: 'Roti',
    emoji: '🍞',
    preparedEmoji: '🍞✨',
    source: 'shelf',
  },
  banana: {
    id: 'banana',
    name: 'Banana',
    indonesianName: 'Pisang',
    emoji: '🍌',
    preparedEmoji: '🍌✨',
    source: 'shelf',
  },
  chicken_stock: {
    id: 'chicken_stock',
    name: 'Savory Broth',
    indonesianName: 'Kaldu Ayam Simulasi',
    emoji: '🍲',
    preparedEmoji: '🍲✨',
    source: 'refrigerator',
  },
  noodle: {
    id: 'noodle',
    name: 'Noodles',
    indonesianName: 'Mie',
    emoji: '🍜',
    preparedEmoji: '🍜✨',
    source: 'shelf',
  },
  kerang: {
    id: 'kerang',
    name: 'Beach Clams',
    indonesianName: 'Kerang Pantai',
    emoji: '🐚',
    preparedEmoji: '🐚✨',
    source: 'beach',
  },
};

export interface CookingRecipeDef {
  id: string;
  name: string;
  indonesianName: string;
  indonesianTitle: string;
  category: 'international' | 'indonesian';
  regionAffinity?: string;
  dishEmoji: string;
  iconEmoji: string;
  ingredients: string[];
  minAutonomousLevel: number;
  hungerRestore: number;
  happinessGain: number;
  happinessRestore: number;
  healthRestore: number;
  xpGain: number;
  coinsReward: number;
}

export const COOKING_RECIPES: CookingRecipeDef[] = [
  {
    id: 'mie_aceh_kerang',
    name: 'Aceh Clam Noodles',
    indonesianName: 'Mie Aceh Kerang Spesial',
    indonesianTitle: 'Mie Aceh Kerang Spesial',
    category: 'indonesian',
    regionAffinity: 'aceh',
    dishEmoji: '🍜',
    iconEmoji: '🍜',
    ingredients: ['kerang', 'noodle', 'chili', 'tomato'],
    minAutonomousLevel: 3,
    hungerRestore: 48,
    happinessGain: 36,
    happinessRestore: 36,
    healthRestore: 22,
    xpGain: 34,
    coinsReward: 30,
  },
  {
    id: 'gulai_kerang_aceh',
    name: 'Aceh Spiced Clam Curry',
    indonesianName: 'Kuah Pliek Kerang Aceh',
    indonesianTitle: 'Kuah Pliek Kerang Aceh',
    category: 'indonesian',
    regionAffinity: 'aceh',
    dishEmoji: '🍛',
    iconEmoji: '🍛',
    ingredients: ['kerang', 'rice', 'chili', 'herbal'],
    minAutonomousLevel: 3,
    hungerRestore: 46,
    happinessGain: 35,
    happinessRestore: 35,
    healthRestore: 24,
    xpGain: 34,
    coinsReward: 30,
  },
  {
    id: 'vegetable_soup',
    name: 'Vegetable Soup',
    indonesianName: 'Sup Sayuran Kebun',
    indonesianTitle: 'Sup Sayuran Kebun',
    category: 'international',
    dishEmoji: '🍲',
    iconEmoji: '🍲',
    ingredients: ['carrot', 'potato', 'tomato', 'corn'],
    minAutonomousLevel: 3,
    hungerRestore: 38,
    happinessGain: 28,
    happinessRestore: 28,
    healthRestore: 18,
    xpGain: 25,
    coinsReward: 22,
  },
  {
    id: 'nasi_goreng',
    name: 'Indonesian Fried Rice',
    indonesianName: 'Nasi Goreng Spesial',
    indonesianTitle: 'Nasi Goreng Spesial',
    category: 'indonesian',
    regionAffinity: 'jawa',
    dishEmoji: '🍛',
    iconEmoji: '🍛',
    ingredients: ['rice', 'egg', 'tomato', 'carrot'],
    minAutonomousLevel: 4,
    hungerRestore: 42,
    happinessGain: 30,
    happinessRestore: 30,
    healthRestore: 16,
    xpGain: 28,
    coinsReward: 25,
  },
  {
    id: 'bubur_ayam',
    name: 'Chicken Porridge',
    indonesianName: 'Bubur Ayam Hangat',
    indonesianTitle: 'Bubur Ayam Hangat',
    category: 'indonesian',
    regionAffinity: 'jawa',
    dishEmoji: '🥣',
    iconEmoji: '🥣',
    ingredients: ['rice', 'chicken_stock', 'carrot'],
    minAutonomousLevel: 3,
    hungerRestore: 36,
    happinessGain: 26,
    happinessRestore: 26,
    healthRestore: 20,
    xpGain: 22,
    coinsReward: 20,
  },
  {
    id: 'soto_nusantara',
    name: 'Soto Nusantara',
    indonesianName: 'Soto Kuah Segar',
    indonesianTitle: 'Soto Kuah Segar',
    category: 'indonesian',
    regionAffinity: 'sumatra',
    dishEmoji: '🍜',
    iconEmoji: '🍜',
    ingredients: ['chicken_stock', 'potato', 'tomato', 'herbal'],
    minAutonomousLevel: 5,
    hungerRestore: 42,
    happinessGain: 32,
    happinessRestore: 32,
    healthRestore: 22,
    xpGain: 30,
    coinsReward: 26,
  },
  {
    id: 'gado_gado',
    name: 'Gado-Gado Salad',
    indonesianName: 'Gado-Gado Sayur Kebun',
    indonesianTitle: 'Gado-Gado Sayur Kebun',
    category: 'indonesian',
    regionAffinity: 'jawa',
    dishEmoji: '🥗',
    iconEmoji: '🥗',
    ingredients: ['carrot', 'potato', 'corn', 'egg'],
    minAutonomousLevel: 4,
    hungerRestore: 38,
    happinessGain: 28,
    happinessRestore: 28,
    healthRestore: 22,
    xpGain: 26,
    coinsReward: 24,
  },
  {
    id: 'mie_goreng',
    name: 'Fried Noodles',
    indonesianName: 'Mie Goreng Nusantara',
    indonesianTitle: 'Mie Goreng Nusantara',
    category: 'indonesian',
    regionAffinity: 'bali_nusra',
    dishEmoji: '🍝',
    iconEmoji: '🍝',
    ingredients: ['noodle', 'egg', 'carrot', 'tomato'],
    minAutonomousLevel: 4,
    hungerRestore: 40,
    happinessGain: 30,
    happinessRestore: 30,
    healthRestore: 16,
    xpGain: 26,
    coinsReward: 24,
  },
  {
    id: 'pancakes',
    name: 'Berry Pancakes',
    indonesianName: 'Panekuk Stroberi',
    indonesianTitle: 'Panekuk Stroberi',
    category: 'international',
    dishEmoji: '🥞',
    iconEmoji: '🥞',
    ingredients: ['flour', 'milk', 'egg', 'strawberry'],
    minAutonomousLevel: 3,
    hungerRestore: 35,
    happinessGain: 32,
    happinessRestore: 32,
    healthRestore: 15,
    xpGain: 24,
    coinsReward: 22,
  },
  {
    id: 'fruit_salad',
    name: 'Fresh Fruit Salad',
    indonesianName: 'Salad Buah Segar',
    indonesianTitle: 'Salad Buah Segar',
    category: 'international',
    dishEmoji: '🍧',
    iconEmoji: '🍧',
    ingredients: ['strawberry', 'banana', 'milk'],
    minAutonomousLevel: 3,
    hungerRestore: 30,
    happinessGain: 30,
    happinessRestore: 30,
    healthRestore: 24,
    xpGain: 20,
    coinsReward: 18,
  },
  {
    id: 'omelette',
    name: 'Garden Omelette',
    indonesianName: 'Telur Dadar Sayur',
    indonesianTitle: 'Telur Dadar Sayur',
    category: 'international',
    dishEmoji: '🍳',
    iconEmoji: '🍳',
    ingredients: ['egg', 'tomato', 'cheese'],
    minAutonomousLevel: 4,
    hungerRestore: 34,
    happinessGain: 26,
    happinessRestore: 26,
    healthRestore: 18,
    xpGain: 22,
    coinsReward: 20,
  },
  {
    id: 'carrot_cake',
    name: 'Carrot Cake',
    indonesianName: 'Kue Wortel Manis',
    indonesianTitle: 'Kue Wortel Manis',
    category: 'international',
    dishEmoji: '🍰',
    iconEmoji: '🍰',
    ingredients: ['carrot', 'flour', 'milk', 'egg'],
    minAutonomousLevel: 5,
    hungerRestore: 36,
    happinessGain: 34,
    happinessRestore: 34,
    healthRestore: 16,
    xpGain: 28,
    coinsReward: 26,
  },
  {
    id: 'pisang_goreng',
    name: 'Crispy Banana Treat',
    indonesianName: 'Pisang Goreng Hangat',
    indonesianTitle: 'Pisang Goreng Hangat',
    category: 'indonesian',
    regionAffinity: 'sulawesi',
    dishEmoji: '🍌',
    iconEmoji: '🍌',
    ingredients: ['banana', 'flour', 'milk'],
    minAutonomousLevel: 4,
    hungerRestore: 32,
    happinessGain: 30,
    happinessRestore: 30,
    healthRestore: 15,
    xpGain: 22,
    coinsReward: 20,
  },
  {
    id: 'sandwich',
    name: 'Cheese & Tomato Sandwich',
    indonesianName: 'Roti Lapis Keju Tomat',
    indonesianTitle: 'Roti Lapis Keju Tomat',
    category: 'international',
    dishEmoji: '🥪',
    iconEmoji: '🥪',
    ingredients: ['bread', 'cheese', 'tomato'],
    minAutonomousLevel: 3,
    hungerRestore: 34,
    happinessGain: 26,
    happinessRestore: 26,
    healthRestore: 18,
    xpGain: 20,
    coinsReward: 18,
  },
];

export function getRecipeDef(recipeId?: string | null): CookingRecipeDef {
  return COOKING_RECIPES.find((r) => r.id === recipeId) || COOKING_RECIPES[0];
}

// ==================== OBJECT-BASED INTERACTION METADATA ====================
export interface WorldInteractiveObjectMeta {
  objectId: string;
  objectType: string;
  locationId: WorldLocationId;
  position: { x: number; y: number };
  interactionState: string;
  animationState: string;
  interactionTrigger: 'tap' | 'drag' | 'tap_or_drag';
  minAgeLevel: number;
}

export interface PersistentActiveFoodState {
  recipeId?: string;
  activeRecipeId?: string | null;
  recipeName?: string;
  dishEmoji?: string;
  status?: CookingFoodState;
  state: CookingFoodState;
  addedIngredients: string[];
  washedIngredients?: string[];
  preparedIngredients?: string[];
  stirCount: number;
  bitesRemaining: number; // 3 -> 2 -> 1 -> 0 (dirty plate)
  plateDirty?: boolean;
  dirtyPlateCount: number;
}

export function createInitialActiveFoodState(): PersistentActiveFoodState {
  return {
    recipeId: 'vegetable_soup',
    activeRecipeId: 'vegetable_soup',
    recipeName: 'Sup Sayuran Kebun',
    dishEmoji: '🍲',
    status: 'none',
    state: 'none',
    addedIngredients: [],
    washedIngredients: [],
    preparedIngredients: [],
    stirCount: 0,
    bitesRemaining: 0,
    plateDirty: false,
    dirtyPlateCount: 0,
  };
}

export function createInitialPlants(): GardenPlantRecord[] {
  const now = Date.now();
  return [
    {
      bedIndex: 0,
      plantId: 'tomato',
      plantType: 'tomato',
      plantedAt: now - 60000,
      stage: 'Harvestable',
      growthStage: 'Harvestable',
      growthProgress: 100,
      lastWateredAt: now - 10000,
      waterCount: 3,
      harvestReady: true,
      soilPrepared: true,
      gardenPosition: { locationId: 'backyard_garden', bedIndex: 0, x: 28, y: 66 },
    },
    {
      bedIndex: 1,
      plantId: 'carrot',
      plantType: 'carrot',
      plantedAt: now - 35000,
      stage: 'Growing Plant',
      growthStage: 'Growing Plant',
      growthProgress: 68,
      lastWateredAt: now - 15000,
      waterCount: 2,
      harvestReady: false,
      soilPrepared: true,
      gardenPosition: { locationId: 'backyard_garden', bedIndex: 1, x: 43, y: 66 },
    },
    {
      bedIndex: 2,
      plantId: 'sunflower',
      plantType: 'sunflower',
      plantedAt: now - 60000,
      stage: 'Harvestable',
      growthStage: 'Harvestable',
      growthProgress: 100,
      lastWateredAt: now - 10000,
      waterCount: 3,
      harvestReady: true,
      soilPrepared: true,
      gardenPosition: { locationId: 'flower_garden', bedIndex: 2, x: 58, y: 66 },
    },
    {
      bedIndex: 3,
      plantId: null,
      plantedAt: 0,
      stage: 'Seed',
      growthStage: 'Seed',
      growthProgress: 0,
      lastWateredAt: 0,
      waterCount: 0,
      harvestReady: false,
      soilPrepared: false,
      gardenPosition: { locationId: 'vegetable_garden', bedIndex: 3, x: 73, y: 66 },
    },
  ];
}

export function createInitialHarvestInventory(): Record<string, number> {
  return {
    tomato: 3,
    carrot: 2,
    strawberry: 2,
    corn: 2,
    sunflower: 2,
    rose: 1,
    tulip: 1,
    daisy: 2,
    chili: 1,
    herbal: 2,
  };
}

export function createInitialCookingInventory(): Record<string, number> {
  return {
    potato: 4,
    rice: 5,
    egg: 5,
    milk: 4,
    flour: 4,
    cheese: 3,
    bread: 3,
    banana: 3,
    chicken_stock: 4,
    noodle: 4,
    kerang: 0,
  };
}


