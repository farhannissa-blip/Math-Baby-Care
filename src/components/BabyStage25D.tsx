import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  BabyActionState,
  BabyAppearance,
  BabyGender,
  BathingProgressState,
  BodyZoneId,
  CharacterEmotion,
  RoomDecorState,
  RoomId,
  STORE_ITEMS,
} from '../data/gameData';
import {
  COOKING_INGREDIENTS,
  COOKING_RECIPES,
  CookingFoodState,
  CookingRecipeDef,
  GardenBedPlantInstance,
  getPlantDef,
  getRecipeDef,
  getWorldLocationMeta,
  isGardenLocation,
  isOutdoorLocation,
  PersistentActiveFoodState,
  PLANT_CATALOG,
  PLANT_STAGE_LABELS,
  PLANT_STAGE_ORDER,
  PlantId,
  WorldLocationId,
} from '../data/worldAndActivityData';
import { BabyCharacterSVG } from './BabyCharacterSVG';
import {
  CharacterGrowthTransitionState,
  getCharacterProportionProfile,
  getCharacterScaleForStage,
} from '../data/lifeProgressionData';
import { sound } from '../utils/sound';

// REQUIREMENT A.2 & A.3: Fixed Portrait Internal Stage Design Units (390 x 620)
export const STAGE_DESIGN_WIDTH = 390;
export const STAGE_DESIGN_HEIGHT = 620;

export interface FloatingParticle {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

export type InWorldActivityState =
  | 'idle'
  | 'walkingToObject'
  | 'interacting'
  | 'playing'
  | 'holdingObject'
  | 'activityComplete';

export type InWorldObjectType =
  | 'bed'
  | 'teddy'
  | 'ball'
  | 'bookshelf'
  | 'kitchen'
  | 'toybox'
  | 'garden'
  | 'cilukba'
  | 'playground'
  | 'picnic'
  | 'nature'
  | 'door';

export interface InWorldActivityCommand {
  id: string;
  type: InWorldObjectType;
  subAction?: string;
  title: string;
  icon: string;
  activityDefId?: string;
  timestamp: number;
}

export interface InWorldActivityCompletionPayload {
  type: InWorldObjectType;
  subAction: string;
  title: string;
  icon: string;
  activityDefId?: string;
  happinessGain: number;
  xpGain: number;
  coinsGain: number;
  actionState: BabyActionState;
  speech: string;
}

interface BabyStage25DProps {
  currentRoom: RoomId;
  roomDecor: RoomDecorState;
  appearance: BabyAppearance;
  gender: BabyGender;
  level: number;
  characterScale?: number;
  growthTransition?: CharacterGrowthTransitionState | null;
  actionState: BabyActionState;
  isSleeping: boolean;
  needsSummary: {
    isHungry: boolean;
    isSleepy: boolean;
    isDirty: boolean;
    isSad: boolean;
  };
  emotion?: CharacterEmotion;
  cleanliness?: number;
  bathingProgress?: BathingProgressState;
  particles: FloatingParticle[];
  speechBubble: string | null;
  isAnyPanelOpen?: boolean;
  onStageModalOpenChange?: (isOpen: boolean) => void;
  onClickBaby: () => void;
  onToggleLamp: () => void;
  onPutBabyToSleepInCrib?: () => void;
  onWakeBabyFromCrib?: () => void;
  onQuickFeedMilk?: () => void;
  onQuickFeedPorridge?: () => void;
  onQuickBathAction?: (mode: 'full_bath' | 'diaper' | 'face' | 'hands') => void;
  onTowelDryBaby?: () => void;
  onUseToilet?: (mode: 'pee' | 'poop') => void;
  onApplySoapToZone?: (zone: BodyZoneId) => void;
  onRinseZoneWithShower?: (zone: BodyZoneId) => void;
  externalActivityCommand?: InWorldActivityCommand | null;
  onInWorldActivityComplete?: (payload: InWorldActivityCompletionPayload) => void;
  onInWorldCharacterReaction?: (
    actionState: BabyActionState,
    speech: string,
    particleEmoji?: string
  ) => void;
  // Expandable Outdoor Worlds, Persistent Garden & Realistic Kitchen Props
  plants?: GardenBedPlantInstance[];
  harvestInventory?: Record<string, number>;
  cookingInventory?: Record<string, number>;
  foodState?: PersistentActiveFoodState | null;
  onUpdatePlants?: (nextPlants: GardenBedPlantInstance[]) => void;
  onHarvestPlant?: (plantId: PlantId, bedIndex: number) => void;
  onUpdateFoodState?: (nextFoodState: PersistentActiveFoodState) => void;
  onConsumeCookedRecipe?: (recipe: CookingRecipeDef, usedHarvestIds: PlantId[]) => void;
  onCleanDirtyDish?: () => void;
  onBeachPicnicBite?: (hungerGain: number, happinessGain: number, foodLabel: string) => void;
  onCollectBeachShell?: (shellName: string) => void;
  onRequestLocationChange?: (targetLocation: WorldLocationId) => void;
}

export const BODY_ZONES_META: { id: BodyZoneId; label: string; shortLabel: string }[] = [
  { id: 'head', label: 'Kepala & Rambut', shortLabel: 'Kepala' },
  { id: 'body', label: 'Badan', shortLabel: 'Badan' },
  { id: 'leftArm', label: 'Lengan Kiri', shortLabel: 'Tangan Ki' },
  { id: 'rightArm', label: 'Lengan Kanan', shortLabel: 'Tangan Ka' },
  { id: 'leftLeg', label: 'Kaki Kiri', shortLabel: 'Kaki Ki' },
  { id: 'rightLeg', label: 'Kaki Kanan', shortLabel: 'Kaki Ka' },
];

// REQUIREMENT I: Structured Room Scene Objects in 390 x 620 Portrait Stage Coordinates
// Wall occupies top 45% (y: 0..279), Floor occupies bottom 55% (y: 279..620)
// Safe horizontal furniture margins: 5% left/right (x: 20..370)
export interface RoomSceneObjectDef {
  id: string;
  nama: string;
  x: number;
  y: number;
  lebar: number;
  tinggi: number;
  lapisan: 10 | 20 | 30;
  dekorasiAtauInteraktif: 'dekorasi' | 'interaktif';
  icon?: string;
  dotX?: number;
  dotY?: number;
}

export const ROOM_SCENE_OBJECTS: Record<string, RoomSceneObjectDef[]> = {
  bedroom: [
    { id: 'window_back', nama: 'Jendela Kamar', x: 124, y: 58, lebar: 100, tinggi: 112, lapisan: 10, dekorasiAtauInteraktif: 'dekorasi' },
    { id: 'wall_clock_painting', nama: 'Jam Dinding & Lukisan', x: 242, y: 46, lebar: 60, tinggi: 92, lapisan: 10, dekorasiAtauInteraktif: 'dekorasi' },
    { id: 'wall_shelf', nama: 'Rak Buku Cerita & Bendera', x: 244, y: 140, lebar: 132, tinggi: 68, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '📚', dotX: 366, dotY: 168 },
    { id: 'wardrobe_3d', nama: 'Lemari Pakaian 3D', x: 16, y: 118, lebar: 90, tinggi: 184, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '👗', dotX: 98, dotY: 130 },
    { id: 'nightstand_lamp', nama: 'Meja & Lampu Tidur', x: 108, y: 196, lebar: 48, tinggi: 120, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '💡', dotX: 148, dotY: 208 },
    { id: 'bed_main', nama: 'Tempat Tidur Kasur', x: 158, y: 218, lebar: 214, tinggi: 156, lapisan: 20, dekorasiAtauInteraktif: 'interaktif', icon: '🛏️', dotX: 360, dotY: 236 },
    { id: 'rug_floor', nama: 'Karpet Kamar', x: 52, y: 438, lebar: 286, tinggi: 108, lapisan: 20, dekorasiAtauInteraktif: 'dekorasi' },
  ],
  playroom: [
    { id: 'play_window', nama: 'Jendela Ruang Main', x: 24, y: 64, lebar: 102, tinggi: 108, lapisan: 10, dekorasiAtauInteraktif: 'dekorasi' },
    { id: 'abc_board', nama: 'Papan Edukasi ABC & 123', x: 140, y: 68, lebar: 132, tinggi: 80, lapisan: 10, dekorasiAtauInteraktif: 'dekorasi' },
    { id: 'toy_book_shelf', nama: 'Rak Mainan & Buku 3D', x: 214, y: 148, lebar: 156, tinggi: 178, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🧱', dotX: 358, dotY: 160 },
    { id: 'play_mat', nama: 'Karpet Bermain', x: 52, y: 436, lebar: 286, tinggi: 112, lapisan: 20, dekorasiAtauInteraktif: 'dekorasi' },
  ],
  kitchen: [
    { id: 'upper_cabinet', nama: 'Kabinet Atas & Microwave', x: 114, y: 48, lebar: 236, tinggi: 72, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '📖', dotX: 342, dotY: 58 },
    { id: 'fridge_3d', nama: 'Kulkas Interaktif 3 Rak', x: 16, y: 104, lebar: 94, tinggi: 214, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🧊', dotX: 102, dotY: 116 },
    { id: 'kitchen_counter', nama: 'Meja Dapur (Wastafel & Kompor)', x: 114, y: 176, lebar: 248, tinggi: 156, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🍳', dotX: 352, dotY: 188 },
    { id: 'highchair_3d', nama: 'Kursi Makan Bayi', x: 282, y: 254, lebar: 92, tinggi: 156, lapisan: 20, dekorasiAtauInteraktif: 'interaktif', icon: '🍽️', dotX: 364, dotY: 268 },
    { id: 'kitchen_rug', nama: 'Karpet Dapur', x: 64, y: 448, lebar: 262, tinggi: 96, lapisan: 20, dekorasiAtauInteraktif: 'dekorasi' },
  ],
  bathroom: [
    { id: 'mirror_sink', nama: 'Cermin & Wastafel', x: 18, y: 68, lebar: 108, tinggi: 196, lapisan: 10, dekorasiAtauInteraktif: 'dekorasi' },
    { id: 'toilet_3d', nama: 'Toilet Kamar Mandi (BAK & BAB)', x: 14, y: 274, lebar: 88, tinggi: 114, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🚽', dotX: 92, dotY: 286 },
    { id: 'bath_shelf', nama: 'Rak Sabun & Sampo', x: 144, y: 84, lebar: 118, tinggi: 68, lapisan: 10, dekorasiAtauInteraktif: 'dekorasi' },
    { id: 'towel_rack', nama: 'Gantungan Handuk Hangat', x: 274, y: 92, lebar: 92, tinggi: 102, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🧺', dotX: 356, dotY: 102 },
    { id: 'bathtub_back', nama: 'Bak Mandi 3 Lapis', x: 42, y: 392, lebar: 288, tinggi: 106, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🛁', dotX: 320, dotY: 404 },
    { id: 'bath_mat', nama: 'Keset Kamar Mandi', x: 78, y: 516, lebar: 216, tinggi: 56, lapisan: 20, dekorasiAtauInteraktif: 'dekorasi' },
  ],
  livingroom: [
    { id: 'living_window', nama: 'Jendela Ruang Keluarga', x: 24, y: 64, lebar: 116, tinggi: 110, lapisan: 10, dekorasiAtauInteraktif: 'dekorasi' },
    { id: 'family_frames', nama: 'Bingkai Foto Keluarga', x: 158, y: 68, lebar: 136, tinggi: 78, lapisan: 10, dekorasiAtauInteraktif: 'dekorasi' },
    { id: 'garden_corner', nama: 'Sudut Tanaman Hias', x: 18, y: 196, lebar: 84, tinggi: 132, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🪴', dotX: 94, dotY: 208 },
    { id: 'sofa_3d', nama: 'Sofa Keluarga 3D', x: 116, y: 212, lebar: 252, tinggi: 118, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🛋️', dotX: 358, dotY: 224 },
    { id: 'living_rug', nama: 'Karpet Keluarga', x: 54, y: 438, lebar: 282, tinggi: 108, lapisan: 20, dekorasiAtauInteraktif: 'dekorasi' },
  ],
  backyard_garden: [
    { id: 'seed_house', nama: 'Rumah Bibit & Peralatan Kebun', x: 18, y: 162, lebar: 112, tinggi: 132, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🏡', dotX: 120, dotY: 174 },
    { id: 'garden_corner', nama: 'Pot & Tanaman Hias', x: 286, y: 184, lebar: 84, tinggi: 132, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🌻', dotX: 360, dotY: 196 },
  ],
  flower_garden: [
    { id: 'seed_house', nama: 'Gazebo & Rak Bibit Bunga', x: 18, y: 162, lebar: 112, tinggi: 132, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🌺', dotX: 120, dotY: 174 },
    { id: 'garden_corner', nama: 'Pot Bunga Mekar', x: 286, y: 184, lebar: 84, tinggi: 132, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🌸', dotX: 360, dotY: 196 },
  ],
  vegetable_garden: [
    { id: 'seed_house', nama: 'Gudang Bibit Sayuran Segar', x: 18, y: 162, lebar: 112, tinggi: 132, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🥕', dotX: 120, dotY: 174 },
    { id: 'garden_corner', nama: 'Pot Tanaman Sayur', x: 286, y: 184, lebar: 84, tinggi: 132, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🍅', dotX: 360, dotY: 196 },
  ],
  front_yard: [
    { id: 'garden_corner', nama: 'Taman Bunga Teras', x: 20, y: 186, lebar: 84, tinggi: 132, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🪴', dotX: 96, dotY: 198 },
    { id: 'picnic_mat', nama: 'Tikar Santai Halaman Depan', x: 148, y: 312, lebar: 212, tinggi: 92, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🧺', dotX: 348, dotY: 324 },
  ],
  park: [
    { id: 'garden_corner', nama: 'Semak Bunga Taman Kota', x: 18, y: 186, lebar: 84, tinggi: 132, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🌸', dotX: 94, dotY: 198 },
    { id: 'picnic_mat', nama: 'Tikar Piknik & Keranjang Bekal', x: 82, y: 318, lebar: 226, tinggi: 96, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🧺', dotX: 298, dotY: 330 },
  ],
  playground: [
    { id: 'slide_3d', nama: 'Perosotan Taman Bermain', x: 18, y: 174, lebar: 148, tinggi: 148, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🛝', dotX: 156, dotY: 186 },
    { id: 'swing_3d', nama: 'Ayunan Taman Bermain', x: 222, y: 168, lebar: 148, tinggi: 154, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🎠', dotX: 360, dotY: 180 },
    { id: 'seesaw_3d', nama: 'Jungkat-Jungkit Taman', x: 92, y: 332, lebar: 206, tinggi: 88, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '⚖️', dotX: 288, dotY: 342 },
    { id: 'sandpit_3d', nama: 'Kotak Pasir & Istana Pasir', x: 78, y: 446, lebar: 234, tinggi: 96, lapisan: 20, dekorasiAtauInteraktif: 'interaktif', icon: '🏰', dotX: 300, dotY: 458 },
  ],
  beach: [
    { id: 'beach_umbrella', nama: 'Payung Pantai & Kursi Santai', x: 14, y: 184, lebar: 146, tinggi: 146, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🏖️', dotX: 148, dotY: 196 },
    { id: 'beach_sandcastle_spot', nama: 'Pasir Kosong (Istana Pasir)', x: 214, y: 274, lebar: 158, tinggi: 106, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🏰', dotX: 360, dotY: 286 },
    { id: 'beach_picnic_mat', nama: 'Tikar & Meja Piknik Pantai', x: 14, y: 374, lebar: 188, tinggi: 126, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🧺', dotX: 190, dotY: 386 },
    { id: 'seashell_shore', nama: 'Pasir Gali Kerang & Ember', x: 208, y: 404, lebar: 168, tinggi: 120, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🐚', dotX: 364, dotY: 416 },
  ],
  cultural_village: [
    { id: 'pendopo_joglo', nama: 'Pendopo Joglo & Panggung Tari Nusantara', x: 76, y: 112, lebar: 232, tinggi: 186, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🏛️', dotX: 298, dotY: 126 },
    { id: 'angklung_rack', nama: 'Rak Angklung Bambu Nusantara', x: 222, y: 342, lebar: 146, tinggi: 132, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🎶', dotX: 358, dotY: 354 },
    { id: 'garden_corner', nama: 'Taman Melati Desa Budaya', x: 14, y: 204, lebar: 84, tinggi: 132, lapisan: 10, dekorasiAtauInteraktif: 'interaktif', icon: '🌺', dotX: 90, dotY: 216 },
  ],
};

export const BabyStage25D: React.FC<BabyStage25DProps> = ({
  currentRoom,
  roomDecor,
  appearance,
  gender,
  level,
  characterScale,
  growthTransition,
  actionState,
  isSleeping,
  needsSummary,
  emotion = 'happy',
  cleanliness = 85,
  bathingProgress,
  particles,
  speechBubble,
  isAnyPanelOpen = false,
  onStageModalOpenChange,
  onClickBaby,
  onToggleLamp,
  onPutBabyToSleepInCrib,
  onWakeBabyFromCrib,
  onQuickFeedMilk,
  onQuickFeedPorridge,
  onQuickBathAction,
  onTowelDryBaby,
  onUseToilet,
  onApplySoapToZone,
  onRinseZoneWithShower,
  externalActivityCommand,
  onInWorldActivityComplete,
  onInWorldCharacterReaction,
  plants = [],
  harvestInventory = {} as Record<PlantId, number>,
  cookingInventory = {},
  foodState,
  onUpdatePlants,
  onHarvestPlant,
  onUpdateFoodState,
  onConsumeCookedRecipe,
  onCleanDirtyDish,
  onBeachPicnicBite,
  onCollectBeachShell,
  onRequestLocationChange,
}) => {
  const areaRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [stageScale, setStageScale] = useState<number>(1);
  const [stageWidth, setStageWidth] = useState<number>(STAGE_DESIGN_WIDTH);

  // Measure AREA ADEGAN via ResizeObserver using 100% uniform scaling (scaleX === scaleY) so furniture never stretches sideways on desktop/laptop while filling 100% of the screen
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const updateScale = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const scaleByHeight = rect.height / STAGE_DESIGN_HEIGHT;
        const scaleByWidth = rect.width / STAGE_DESIGN_WIDTH;
        if (rect.width / rect.height >= STAGE_DESIGN_WIDTH / STAGE_DESIGN_HEIGHT) {
          const nextScale = Number(Math.max(0.32, scaleByHeight).toFixed(4));
          const nextWidth = Math.max(STAGE_DESIGN_WIDTH, Math.round(rect.width / nextScale));
          setStageScale(nextScale);
          setStageWidth(nextWidth);
        } else {
          const nextScale = Number(Math.max(0.32, scaleByWidth).toFixed(4));
          setStageScale(nextScale);
          setStageWidth(STAGE_DESIGN_WIDTH);
        }
      }
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  // Smooth Drag-and-Drop, Tap-to-Move & Facing Direction States for Character
  // REQUIREMENT D.2: Baby stands in the lower-middle floor area (x: 50%, y: 76%) so baby never overlaps large back furniture
  const [isDragging, setIsDragging] = useState(false);
  const [babyPos, setBabyPos] = useState<{ x: number; y: number }>({ x: 50, y: 76 });
  const [facingLeft, setFacingLeft] = useState<boolean>(false);
  const [tapMoveMarker, setTapMoveMarker] = useState<{ x: number; y: number } | null>(null);
  const [showMiniJoystick, setShowMiniJoystick] = useState<boolean>(false);
  const targetPosRef = useRef<{ x: number; y: number }>({ x: 50, y: 76 });
  const pointerDownStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // ==================== SEAMLESS IN-WORLD ACTIVITY STATE MACHINE ====================
  const [activityState, setActivityState] = useState<InWorldActivityState>('idle');
  const [activeActivityType, setActiveActivityType] = useState<InWorldObjectType | null>(null);
  const [activeSubAction, setActiveSubAction] = useState<string>('');
  const [activeActivityTitle, setActiveActivityTitle] = useState<string>('');
  const [activeActivityIcon, setActiveActivityIcon] = useState<string>('🧸');
  const [activeActivityInstruction, setActiveActivityInstruction] = useState<string>('');
  const [activeActivityDefId, setActiveActivityDefId] = useState<string | undefined>(undefined);
  const [activityProgress, setActivityProgress] = useState<number>(0); // 0..100
  const [showActivityHint, setShowActivityHint] = useState<boolean>(false);

  // Small Floating Radial/Context Menu near tapped room objects (rendered as root Bottom Sheet when open)
  const [openObjectMenu, setOpenObjectMenu] = useState<{
    type: InWorldObjectType;
    x: number;
    y: number;
    title: string;
    icon: string;
    options: { id: string; label: string; emoji: string }[];
  } | null>(null);

  // Override character pose & held item during in-world activities
  const [overrideActionState, setOverrideActionState] = useState<BabyActionState | null>(null);
  const [heldPropEmoji, setHeldPropEmoji] = useState<string | null>(null);
  const walkDestinationRef = useRef<{ x: number; y: number } | null>(null);
  const onWalkArrivedRef = useRef<(() => void) | null>(null);

  // 1. CILUKBA (PEEKABOO) 4 VARIATIONS IN-WORLD STATE
  const [cilukbaVariation, setCilukbaVariation] = useState<1 | 2 | 3 | 4>(1);
  const [peekabooHandsCovered, setPeekabooHandsCovered] = useState<boolean>(false);
  const [pillowPos, setPillowPos] = useState<{ x: number; y: number }>({ x: 35, y: 72 });
  const [isDraggingPillow, setIsDraggingPillow] = useState<boolean>(false);
  const [pillowHidingBaby, setPillowHidingBaby] = useState<boolean>(false);
  const [blanketCornerPos, setBlanketCornerPos] = useState<{ x: number; y: number }>({ x: 63, y: 72 });
  const [isDraggingBlanket, setIsDraggingBlanket] = useState<boolean>(false);
  const [blanketHidingBaby, setBlanketHidingBaby] = useState<boolean>(false);
  const [cilukbaCount, setCilukbaCount] = useState<number>(0);

  // 2. TEDDY BEAR IN-WORLD STATE (REQUIREMENT D.3: On floor at left, not overlapping baby or ball)
  const [teddyPos, setTeddyPos] = useState<{ x: number; y: number }>({ x: 22, y: 81 });
  const [isDraggingTeddy, setIsDraggingTeddy] = useState<boolean>(false);
  const [teddyPose, setTeddyPose] = useState<'sitting' | 'sleeping' | 'hugged' | 'dancing'>('sitting');

  // 3. BALL IN-WORLD 2D PHYSICS STATE (REQUIREMENT D.3: On floor at right, not overlapping baby or teddy)
  const [ballPos, setBallPos] = useState<{ x: number; y: number }>({ x: 78, y: 82 });
  const ballVelRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const [ballRotation, setBallRotation] = useState<number>(0);
  const [isDraggingBall, setIsDraggingBall] = useState<boolean>(false);
  const ballDragPrevRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const [ballBounceCount, setBallBounceCount] = useState<number>(0);

  // 4. BOOKSHELF & STORYBOOK IN-WORLD STATE (Drag Book to Character + Flip Pages)
  const [selectedBook, setSelectedBook] = useState<{
    id: string;
    title: string;
    color: string;
    pages: string[];
  }>({
    id: 'book_kancil',
    title: 'Kisah Si Kancil & Kura-Kura',
    color: '#38BDF8',
    pages: [
      'Halaman 1: Di tepi hutan Nusantara yang rimbun, Si Kancil menyapa sahabatnya Kura-Kura.',
      'Halaman 2: Mereka berlomba menghitung buah apel merah di sepanjang sungai jernih!',
      'Halaman 3: Persahabatan dan kejujuran membuat semua hewan hutan hidup rukun dan gembira!',
    ],
  });
  const [bookPos, setBookPos] = useState<{ x: number; y: number }>({ x: 26, y: 54 });
  const [isDraggingBook, setIsDraggingBook] = useState<boolean>(false);
  const [bookOpenPage, setBookOpenPage] = useState<number>(0);
  const [isBookDelivered, setIsBookDelivered] = useState<boolean>(false);

  // 5. FULL INTERACTIVE KITCHEN STATE (12 Recipes, Fridge, Sink Wash, Prep Board, Stove Pot, Plating, Dining Table Eating, Dishwashing)
  const [activeRecipeId, setActiveRecipeId] = useState<string>(
    foodState?.activeRecipeId || 'vegetable_soup'
  );
  const [kitchenFoodStage, setKitchenFoodStage] = useState<CookingFoodState | 'none'>(
    foodState?.state || 'none'
  );
  const [fridgeOpen, setFridgeOpen] = useState<boolean>(false);
  const [showRecipeBookDrawer, setShowRecipeBookDrawer] = useState<boolean>(false);
  const [washedIngredients, setWashedIngredients] = useState<string[]>([]);
  const [preppedIngredients, setPreppedIngredients] = useState<string[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<{
    name: string;
    icon: string;
    ingredients: { id: string; name: string; emoji: string; startX: number; startY: number }[];
  }>({
    name: 'Bubur Susu Nusantara',
    icon: '🥣',
    ingredients: [
      { id: 'ing_rice', name: 'Beras Organik', emoji: '🌾', startX: 28, startY: 54 },
      { id: 'ing_milk', name: 'Susu Segar', emoji: '🥛', startX: 40, startY: 54 },
      { id: 'ing_carrot', name: 'Wortel Manis', emoji: '🥕', startX: 52, startY: 54 },
    ],
  });
  const [addedIngredients, setAddedIngredients] = useState<string[]>(
    foodState?.addedIngredients || []
  );
  const [draggingIngredient, setDraggingIngredient] = useState<{
    id: string;
    emoji: string;
    x: number;
    y: number;
  } | null>(null);
  const [potStirCount, setPotStirCount] = useState<number>(foodState?.stirCount || 0);
  const [isFoodCooked, setIsFoodCooked] = useState<boolean>(
    foodState?.state === 'cooked' || foodState?.state === 'plated' || foodState?.state === 'served'
  );
  const [cookedDishPos, setCookedDishPos] = useState<{ x: number; y: number }>({ x: 48, y: 42 });
  const [isDraggingDish, setIsDraggingDish] = useState<boolean>(false);
  const [bitesRemaining, setBitesRemaining] = useState<number>(foodState?.bitesRemaining ?? 3);
  const [dirtyPlateCount, setDirtyPlateCount] = useState<number>(foodState?.dirtyPlateCount ?? 0);
  const [sinkWashProgress, setSinkWashProgress] = useState<number>(0);

  // 6. TOY BOX & BLOCK STACKING IN-WORLD STATE (Stack blocks directly on the playroom/bedroom rug)
  const [stackedBlocks, setStackedBlocks] = useState<
    { id: number; label: string; color: string; x: number; y: number }[]
  >([]);
  const [looseBlocks, setLooseBlocks] = useState<
    { id: number; label: string; color: string; x: number; y: number }[]
  >([
    { id: 1, label: '1', color: '#FF8FAB', x: 62, y: 74 },
    { id: 2, label: '2', color: '#38BDF8', x: 70, y: 77 },
    { id: 3, label: '3', color: '#34D399', x: 78, y: 74 },
    { id: 4, label: 'A', color: '#FBBF24', x: 66, y: 82 },
  ]);
  const [draggingBlockId, setDraggingBlockId] = useState<number | null>(null);

  // 7. EXPANDABLE OUTDOOR GARDENS & 4-BED PERSISTENT GARDENING STATE
  const [gardenSoilDug, setGardenSoilDug] = useState<boolean>(false);
  const [gardenSeedPlanted, setGardenSeedPlanted] = useState<boolean>(false);
  const [gardenWaterLevel, setGardenWaterLevel] = useState<number>(0); // 0..3
  const [wateringCanPos, setWateringCanPos] = useState<{ x: number; y: number }>({ x: 82, y: 76 });
  const [isDraggingWateringCan, setIsDraggingWateringCan] = useState<boolean>(false);
  const [shovelPos, setShovelPos] = useState<{ x: number; y: number }>({ x: 18, y: 76 });
  const [isDraggingShovel, setIsDraggingShovel] = useState<boolean>(false);
  const [selectedSeedId, setSelectedSeedId] = useState<PlantId>('sunflower');
  const [showSeedRackDrawer, setShowSeedRackDrawer] = useState<boolean>(false);
  const [seedPacketPos, setSeedPacketPos] = useState<{ x: number; y: number }>({ x: 20, y: 72 });
  const [isDraggingSeedPacket, setIsDraggingSeedPacket] = useState<boolean>(false);
  const [gardenBugInspected, setGardenBugInspected] = useState<boolean>(false);
  const [vaseFlowers, setVaseFlowers] = useState<PlantId[]>(['sunflower', 'rose']);

  // 8. OUTDOOR PARK, PLAYGROUND, PICNIC & BEACH INTERACTIVE STATE
  const [picnicBlanketLaid, setPicnicBlanketLaid] = useState<boolean>(true);
  const [picnicFoods, setPicnicFoods] = useState<{ id: string; name: string; emoji: string }[]>([
    { id: 'pic_1', name: 'Stroberi Kebun', emoji: '🍓' },
    { id: 'pic_2', name: 'Jus Jeruk Segar', emoji: '🧃' },
  ]);
  const [playgroundSwingActive, setPlaygroundSwingActive] = useState<boolean>(false);
  const [playgroundSlideActive, setPlaygroundSlideActive] = useState<boolean>(false);
  const [onSwing, setOnSwing] = useState<boolean>(false);
  const [swingAngle, setSwingAngle] = useState<number>(0);
  const swingBoostRef = useRef<number>(1);
  const swingRewardGivenRef = useRef<boolean>(false);
  const swingRewardTimerRef = useRef<number | null>(null);
  const [slideAnimPhase, setSlideAnimPhase] = useState<'idle' | 'top' | 'sliding' | 'landing'>('idle');
  const [slidePose, setSlidePose] = useState<{
    x: number;
    y: number;
    tilt: number;
    scale: number;
  } | null>(null);
  const slideRafRef = useRef<number | null>(null);
  const [sandcastleStage, setSandcastleStage] = useState<number>(0); // 0 = empty sand before playing, 1..3 = built levels
  const [sandBuildProgress, setSandBuildProgress] = useState<number>(0); // 0..100 progressive build animation
  const [isBuildingSandcastle, setIsBuildingSandcastle] = useState<boolean>(false);
  const [sandBuildTick, setSandBuildTick] = useState<number>(0);
  const sandBuildRafRef = useRef<number | null>(null);
  const [onSeesaw, setOnSeesaw] = useState<boolean>(false);
  const [seesawAngle, setSeesawAngle] = useState<number>(0); // -20° (baby down) .. +22° (player pushed down, baby high up!)
  const seesawAngleRef = useRef<number>(0);
  const [isDraggingSeesaw, setIsDraggingSeesaw] = useState<boolean>(false);
  const seesawPhysicsRafRef = useRef<number | null>(null);
  const seesawPumpCountRef = useRef<number>(0);
  const seesawRewardGivenRef = useRef<boolean>(false);
  const seesawDragRef = useRef<{
    startY: number;
    startAngle: number;
    reachedHigh: boolean;
    maxMovedPx: number;
  } | null>(null);
  const [collectedShells, setCollectedShells] = useState<number>(0);
  const [beachActivityMode, setBeachActivityMode] = useState<
    'idle' | 'relaxing' | 'building_sandcastle' | 'eating_picnic' | 'digging_sand'
  >('idle');
  const [beachPicnicLevels, setBeachPicnicLevels] = useState<{
    cake: number;
    strawberry: number;
    apple: number;
    orange_juice: number;
  }>({ cake: 3, strawberry: 3, apple: 3, orange_juice: 3 });
  const beachPicnicLevelsRef = useRef(beachPicnicLevels);
  beachPicnicLevelsRef.current = beachPicnicLevels;
  const [activePicnicEatingItem, setActivePicnicEatingItem] = useState<
    null | 'cake' | 'strawberry' | 'apple' | 'orange_juice'
  >(null);
  const picnicEatTimerRef = useRef<number | null>(null);
  const [beachDiggingProgress, setBeachDiggingProgress] = useState<number>(0);
  const [beachDigTick, setBeachDigTick] = useState<number>(0);
  const beachDigRafRef = useRef<number | null>(null);
  const [dugShells, setDugShells] = useState<
    { id: string; name: string; variant: 'dara' | 'kipas' | 'aceh'; x: number; y: number }[]
  >([]);
  const [draggingShell, setDraggingShell] = useState<{ id: string; x: number; y: number } | null>(
    null
  );
  const [isOverShellBucket, setIsOverShellBucket] = useState<boolean>(false);
  const [recipeMissingShellNotice, setRecipeMissingShellNotice] = useState<string | null>(null);
  const beachShellStock = onCollectBeachShell
    ? cookingInventory.kerang ?? 0
    : collectedShells;

  // Room-specific interactive furniture placements
  const [inCrib, setInCrib] = useState<boolean>(isSleeping && currentRoom === 'bedroom');
  const [blanketPulled, setBlanketPulled] = useState<boolean>(isSleeping);
  const [inHighChair, setInHighChair] = useState<boolean>(false);
  const [inBathTub, setInBathTub] = useState<boolean>(false);
  const [onToilet, setOnToilet] = useState<boolean>(false);
  const [toiletActionMode, setToiletActionMode] = useState<'none' | 'pee' | 'poop' | 'flush'>('none');
  const [soapFoamActive, setSoapFoamActive] = useState<boolean>(false);
  const [waterSplashActive, setWaterSplashActive] = useState<boolean>(false);
  const [culturalActivityMode, setCulturalActivityMode] = useState<
    'idle' | 'playing_angklung' | 'traditional_dance'
  >('idle');
  const culturalTimerRef = useRef<number | null>(null);
  const angklungBeatRef = useRef<number>(0);

  const [hoveredDropZone, setHoveredDropZone] = useState<
    | null
    | 'crib'
    | 'highchair'
    | 'bathtub'
    | 'toilet'
    | 'slide'
    | 'swing'
    | 'sandpit'
    | 'seesaw'
    | 'beach_umbrella'
    | 'beach_sandcastle'
    | 'beach_picnic'
    | 'beach_dig'
    | 'cultural_angklung'
    | 'cultural_pendopo'
  >(null);

  // REQUIREMENT F.5: Interactive Bathroom Draggable Tools Stacked Vertically on Right Side of Stage with >= 12px Gap
  const [activeBathTool, setActiveBathTool] = useState<'none' | 'soap' | 'shower' | 'towel'>('none');
  const [showerHeadPos, setShowerHeadPos] = useState<{ x: number; y: number }>({ x: 84, y: 38 });
  const [soapBottlePos, setSoapBottlePos] = useState<{ x: number; y: number }>({ x: 84, y: 60 });
  const [towelPos, setTowelPos] = useState<{ x: number; y: number }>({ x: 84, y: 78 });
  const [towelDryProgress, setTowelDryProgress] = useState<number>(0);
  const towelDryStrokesRef = useRef<number>(0);
  const [showerWaterRunning, setShowerWaterRunning] = useState<boolean>(false);
  const [activeHoveredBodyZone, setActiveHoveredBodyZone] = useState<BodyZoneId | null>(null);
  const lastToolApplyRef = useRef<number>(0);

  // Notify parent App.tsx whenever an in-stage panel (Fridge, Recipe Book, Seed Rack, Object Context Menu) opens/closes
  const isLocalStageModalOpen = Boolean(
    fridgeOpen || showRecipeBookDrawer || showSeedRackDrawer || openObjectMenu
  );
  useEffect(() => {
    if (onStageModalOpenChange) {
      onStageModalOpenChange(isLocalStageModalOpen);
    }
  }, [isLocalStageModalOpen, onStageModalOpenChange]);

  // Close local stage modals if an external panel opens
  useEffect(() => {
    if (isAnyPanelOpen) {
      setOpenObjectMenu(null);
      setFridgeOpen(false);
      setShowRecipeBookDrawer(false);
      setShowSeedRackDrawer(false);
    }
  }, [isAnyPanelOpen]);

  // Sync external sleep state with crib placement in bedroom on top of bed_main mattress
  useEffect(() => {
    if (isSleeping && currentRoom === 'bedroom') {
      setInCrib(true);
      setBlanketPulled(true);
      targetPosRef.current = { x: 64, y: 45.8 };
      setBabyPos({ x: 64, y: 45.8 });
    } else if (!isSleeping && inCrib) {
      setBlanketPulled(false);
      setInCrib(false);
      targetPosRef.current = { x: 50, y: 76 };
      setBabyPos({ x: 50, y: 76 });
    }
  }, [isSleeping, currentRoom]);

  // Reset room-specific furniture placement when switching rooms smoothly
  useEffect(() => {
    setHoveredDropZone(null);
    setActiveBathTool('none');
    setShowerWaterRunning(false);
    setActiveHoveredBodyZone(null);
    setShowerHeadPos({ x: 84, y: 38 });
    setSoapBottlePos({ x: 84, y: 60 });
    setOpenObjectMenu(null);

    if (currentRoom !== 'bedroom') {
      setInCrib(false);
      setBlanketPulled(false);
    }
    if (currentRoom !== 'kitchen') {
      setInHighChair(false);
    }
    if (currentRoom !== 'bathroom') {
      setInBathTub(false);
      setOnToilet(false);
      setToiletActionMode('none');
      setSoapFoamActive(false);
    }
    if (currentRoom !== 'playground') {
      setOnSwing(false);
      setPlaygroundSwingActive(false);
      setPlaygroundSlideActive(false);
      setSlideAnimPhase('idle');
      setSlidePose(null);
      setSwingAngle(0);
      if (slideRafRef.current !== null) {
        cancelAnimationFrame(slideRafRef.current);
        slideRafRef.current = null;
      }
      if (swingRewardTimerRef.current !== null) {
        window.clearTimeout(swingRewardTimerRef.current);
        swingRewardTimerRef.current = null;
      }
      if (seesawPhysicsRafRef.current !== null) {
        cancelAnimationFrame(seesawPhysicsRafRef.current);
        seesawPhysicsRafRef.current = null;
      }
      setOnSeesaw(false);
      setIsDraggingSeesaw(false);
      seesawAngleRef.current = 0;
      setSeesawAngle(0);
    }
    if (currentRoom !== 'playground' && currentRoom !== 'beach') {
      if (sandBuildRafRef.current !== null) {
        cancelAnimationFrame(sandBuildRafRef.current);
        sandBuildRafRef.current = null;
      }
      setIsBuildingSandcastle(false);
    }
    if (currentRoom !== 'beach') {
      if (picnicEatTimerRef.current !== null) {
        window.clearTimeout(picnicEatTimerRef.current);
        picnicEatTimerRef.current = null;
      }
      if (beachDigRafRef.current !== null) {
        cancelAnimationFrame(beachDigRafRef.current);
        beachDigRafRef.current = null;
      }
      setBeachActivityMode('idle');
      setActivePicnicEatingItem(null);
      setDraggingShell(null);
      setIsOverShellBucket(false);
    }
    if (currentRoom !== 'cultural_village') {
      if (culturalTimerRef.current !== null) {
        window.clearTimeout(culturalTimerRef.current);
        culturalTimerRef.current = null;
      }
      setCulturalActivityMode('idle');
    }
    setRecipeMissingShellNotice(null);

    if (currentRoom === 'bedroom' && isSleeping) {
      targetPosRef.current = { x: 64, y: 45.8 };
      setBabyPos({ x: 64, y: 45.8 });
      setInCrib(true);
      setBlanketPulled(true);
    } else if (currentRoom === 'bathroom') {
      targetPosRef.current = { x: 48, y: 73 };
      setBabyPos({ x: 48, y: 73 });
      setInBathTub(true);
    } else {
      targetPosRef.current = { x: 50, y: 76 };
      setBabyPos({ x: 50, y: 76 });
    }
  }, [currentRoom]);

  // Smooth continuous pendulum animation loop while baby is sitting on the playground swing
  useEffect(() => {
    if (currentRoom !== 'playground' || (!onSwing && !playgroundSwingActive) || isDragging) {
      setSwingAngle(0);
      return;
    }
    let rafId = 0;
    const startTime = performance.now();
    const stepSwing = (now: number) => {
      const elapsedSec = (now - startTime) / 1000;
      // Gently settle push boost back toward steady comfortable swinging amplitude (1.0)
      if (swingBoostRef.current > 1.0) {
        swingBoostRef.current = Math.max(1.0, swingBoostRef.current - 0.0025);
      }
      // Smooth pendulum arc (~2.35s period, ±20° standard, up to ±30° when pushed!)
      const angleDeg = Math.sin(elapsedSec * 2.68) * (20 * swingBoostRef.current);
      setSwingAngle(angleDeg);
      rafId = requestAnimationFrame(stepSwing);
    };
    rafId = requestAnimationFrame(stepSwing);
    return () => cancelAnimationFrame(rafId);
  }, [currentRoom, onSwing, playgroundSwingActive, isDragging]);

  // Cleanup slide/sandcastle/seesaw animation frames and swing timer on unmount
  useEffect(() => {
    return () => {
      if (slideRafRef.current !== null) {
        cancelAnimationFrame(slideRafRef.current);
      }
      if (sandBuildRafRef.current !== null) {
        cancelAnimationFrame(sandBuildRafRef.current);
      }
      if (seesawPhysicsRafRef.current !== null) {
        cancelAnimationFrame(seesawPhysicsRafRef.current);
      }
      if (swingRewardTimerRef.current !== null) {
        window.clearTimeout(swingRewardTimerRef.current);
      }
      if (picnicEatTimerRef.current !== null) {
        window.clearTimeout(picnicEatTimerRef.current);
      }
      if (beachDigRafRef.current !== null) {
        cancelAnimationFrame(beachDigRafRef.current);
      }
    };
  }, []);

  // Smooth spring/lerp loop while dragging so baby never feels stiffly glued to cursor
  useEffect(() => {
    if (!isDragging) return;
    let rafId: number;
    const updatePosition = () => {
      setBabyPos((prev) => {
        const dx = targetPosRef.current.x - prev.x;
        const dy = targetPosRef.current.y - prev.y;
        return {
          x: prev.x + dx * 0.28,
          y: prev.y + dy * 0.28,
        };
      });
      rafId = requestAnimationFrame(updatePosition);
    };
    rafId = requestAnimationFrame(updatePosition);
    return () => cancelAnimationFrame(rafId);
  }, [isDragging]);

  // Smooth locomotion loop when character is walking/crawling to an interactive object or tapped floor position
  useEffect(() => {
    if (activityState !== 'walkingToObject' || !walkDestinationRef.current) return;
    let rafId: number;
    const stepWalk = () => {
      const dest = walkDestinationRef.current;
      if (!dest) return;
      setBabyPos((prev) => {
        const dx = dest.x - prev.x;
        const dy = dest.y - prev.y;
        if (Math.abs(dx) > 0.25) {
          setFacingLeft(dx < 0);
        }
        const dist = Math.hypot(dx, dy);
        if (dist < 1.2) {
          targetPosRef.current = { x: dest.x, y: dest.y };
          walkDestinationRef.current = null;
          setTapMoveMarker(null);
          setTimeout(() => {
            if (onWalkArrivedRef.current) {
              onWalkArrivedRef.current();
            }
          }, 30);
          return { x: dest.x, y: dest.y };
        }
        const speed = level === 1 ? 0.42 : level === 2 ? 0.72 : 1.05;
        let stepX = (dx / dist) * speed;
        let stepY = (dy / dist) * speed;

        // Simple obstacle avoidance around major upper-corner furniture/trees
        const candX = prev.x + stepX;
        const candY = prev.y + stepY;
        if (candY < 45 && (candX < 20 || candX > 82)) {
          stepY = Math.max(0.35, stepY);
        }

        const nx = Math.max(14, Math.min(86, prev.x + stepX));
        const ny = Math.max(38, Math.min(80, prev.y + stepY));
        targetPosRef.current = { x: nx, y: ny };
        return { x: nx, y: ny };
      });
      rafId = requestAnimationFrame(stepWalk);
    };
    rafId = requestAnimationFrame(stepWalk);
    return () => cancelAnimationFrame(rafId);
  }, [activityState, level]);

  // Real-time 2D physics loop for the interactive Ball inside the room / outdoor park
  useEffect(() => {
    if (isDraggingBall) return;
    let rafId: number;
    const stepBallPhysics = () => {
      const vel = ballVelRef.current;
      if (Math.abs(vel.vx) > 0.03 || Math.abs(vel.vy) > 0.03) {
        setBallPos((prev) => {
          let nx = prev.x + vel.vx;
          let ny = prev.y + vel.vy;
          // Bounce off room/park floor boundaries
          if (nx < 14 || nx > 86) {
            vel.vx = -vel.vx * 0.78;
            nx = Math.max(14, Math.min(86, nx));
            sound.playPop();
          }
          if (ny < 44 || ny > 79) {
            vel.vy = -vel.vy * 0.75;
            ny = Math.max(44, Math.min(79, ny));
            sound.playPop();
          }
          // Friction decay
          vel.vx *= 0.965;
          vel.vy *= 0.965;

          // Check if ball rolls near character -> character automatically kicks/catches!
          const distToBaby = Math.hypot(nx - babyPos.x, ny - (babyPos.y + 4));
          if (distToBaby < 9 && Math.hypot(vel.vx, vel.vy) > 0.35) {
            vel.vx = -vel.vx * 0.85 + (Math.random() - 0.5) * 0.9;
            vel.vy = -vel.vy * 0.85;
            sound.playCorrect();
            setOverrideActionState(level <= 2 ? 'playing' : 'happy_jump');
            if (onInWorldCharacterReaction) {
              onInWorldCharacterReaction(
                level <= 2 ? 'playing' : 'happy_jump',
                'Hore! Aku tangkap & tendang bolanya! ⚽✨',
                '⚽'
              );
            }
            if (activeActivityType === 'ball') {
              setBallBounceCount((c) => {
                const next = c + 1;
                setActivityProgress(Math.min(100, next * 34));
                return next;
              });
            }
          }

          return { x: nx, y: ny };
        });
        setBallRotation((r) => r + vel.vx * 14);
      }
      rafId = requestAnimationFrame(stepBallPhysics);
    };
    rafId = requestAnimationFrame(stepBallPhysics);
    return () => cancelAnimationFrame(rafId);
  }, [isDraggingBall, babyPos.x, babyPos.y, activeActivityType, level]);

  // Clamp coordinates within safe playable viewport
  const clampCoords = (xPct: number, yPct: number) => ({
    x: Math.max(8, Math.min(92, xPct)),
    y: Math.max(20, Math.min(82, yPct)),
  });

  // Detect drop zones per room (Responsive Stage Coordinates)
  const detectDropZone = (
    xPct: number,
    yPct: number
  ):
    | null
    | 'crib'
    | 'highchair'
    | 'bathtub'
    | 'toilet'
    | 'slide'
    | 'swing'
    | 'sandpit'
    | 'seesaw'
    | 'beach_umbrella'
    | 'beach_sandcastle'
    | 'beach_picnic'
    | 'beach_dig'
    | 'cultural_angklung'
    | 'cultural_pendopo' => {
    if (currentRoom === 'bedroom') {
      if (xPct >= 40 && xPct <= 95 && yPct >= 35 && yPct <= 70) {
        return 'crib';
      }
    } else if (currentRoom === 'kitchen') {
      if (xPct >= 58 && xPct <= 95 && yPct >= 42 && yPct <= 78) {
        return 'highchair';
      }
    } else if (currentRoom === 'bathroom') {
      if (xPct <= 34 && yPct >= 36 && yPct <= 68) {
        return 'toilet';
      }
      if (xPct >= 18 && xPct <= 82 && yPct >= 54 && yPct <= 86) {
        return 'bathtub';
      }
    } else if (currentRoom === 'playground') {
      const curExtraW = Math.max(0, stageWidth - STAGE_DESIGN_WIDTH);
      const pxX = (xPct / 100) * stageWidth;
      const pxY = (yPct / 100) * STAGE_DESIGN_HEIGHT;
      const slideX = 18 + Math.round(curExtraW * 0.12);
      const swingX = 222 + Math.round(curExtraW * 0.85);
      const seesawX = 92 + Math.round(curExtraW * 0.5);
      const sandpitX = 78 + Math.round(curExtraW * 0.5);
      if (
        pxX >= slideX - 20 &&
        pxX <= slideX + 148 + 22 &&
        pxY >= 174 - 28 &&
        pxY <= 174 + 148 + 22
      ) {
        return 'slide';
      }
      if (
        pxX >= swingX - 20 &&
        pxX <= swingX + 148 + 22 &&
        pxY >= 168 - 28 &&
        pxY <= 168 + 154 + 22
      ) {
        return 'swing';
      }
      if (
        pxX >= seesawX - 18 &&
        pxX <= seesawX + 206 + 18 &&
        pxY >= 332 - 20 &&
        pxY <= 332 + 88 + 18
      ) {
        return 'seesaw';
      }
      if (
        pxX >= sandpitX - 16 &&
        pxX <= sandpitX + 234 + 16 &&
        pxY >= 446 - 20 &&
        pxY <= 446 + 96 + 24
      ) {
        return 'sandpit';
      }
    } else if (currentRoom === 'beach') {
      const curExtraW = Math.max(0, stageWidth - STAGE_DESIGN_WIDTH);
      const pxX = (xPct / 100) * stageWidth;
      const pxY = (yPct / 100) * STAGE_DESIGN_HEIGHT;
      const umbrellaX = 14 + Math.round(curExtraW * 0.08);
      const sandSpotX = 214 + Math.round(curExtraW * 0.85);
      const picnicX = 14 + Math.round(curExtraW * 0.12);
      const shoreX = 208 + Math.round(curExtraW * 0.85);

      if (
        pxX >= umbrellaX - 14 &&
        pxX <= umbrellaX + 146 + 16 &&
        pxY >= 184 - 16 &&
        pxY <= 184 + 146 + 16
      ) {
        return 'beach_umbrella';
      }
      if (
        pxX >= picnicX - 14 &&
        pxX <= picnicX + 188 + 14 &&
        pxY >= 374 - 12 &&
        pxY <= 374 + 126 + 24
      ) {
        return 'beach_picnic';
      }
      if (
        pxX >= sandSpotX - 24 &&
        pxX <= sandSpotX + 158 + 20 &&
        pxY >= 264 &&
        pxY <= 388
      ) {
        return 'beach_sandcastle';
      }
      if (
        pxX >= shoreX - 24 &&
        pxX <= shoreX + 168 + 20 &&
        pxY >= 390 &&
        pxY <= 560
      ) {
        return 'beach_dig';
      }
      // Fallback on any remaining open sand area: upper sand builds sandcastle, lower sand digs for shells
      if (pxY >= 280 && pxY < 392) {
        return 'beach_sandcastle';
      }
      if (pxY >= 392) {
        return 'beach_dig';
      }
    } else if (currentRoom === 'cultural_village') {
      const curExtraW = Math.max(0, stageWidth - STAGE_DESIGN_WIDTH);
      const pxX = (xPct / 100) * stageWidth;
      const pxY = (yPct / 100) * STAGE_DESIGN_HEIGHT;
      const pendopoX = 76 + Math.round(curExtraW * 0.5);
      const angklungX = 222 + Math.round(curExtraW * 0.85);

      if (
        pxX >= angklungX - 24 &&
        pxX <= angklungX + 146 + 22 &&
        pxY >= 342 - 22 &&
        pxY <= 342 + 132 + 28
      ) {
        return 'cultural_angklung';
      }
      if (
        pxX >= pendopoX - 20 &&
        pxX <= pendopoX + 232 + 20 &&
        pxY >= 112 - 14 &&
        pxY <= 112 + 186 + 26
      ) {
        return 'cultural_pendopo';
      }
    }
    return null;
  };

  // Start realistic curved sliding animation down the playground slide (slide_3d)
  const startSlideRide = () => {
    if (slideRafRef.current !== null) {
      cancelAnimationFrame(slideRafRef.current);
      slideRafRef.current = null;
    }
    setOnSwing(false);
    setPlaygroundSwingActive(false);
    setOpenObjectMenu(null);
    setPlaygroundSlideActive(true);
    setSlideAnimPhase('top');
    setFacingLeft(false);
    setActivityState('playing');
    setOverrideActionState('laughing');
    sound.playLaugh();

    if (onInWorldCharacterReaction) {
      onInWorldCharacterReaction(
        'laughing',
        'Horee! Bersiap meluncur di perosotan! Wuuuush! 🛝✨',
        '🛝'
      );
    }

    const curExtraW = Math.max(0, stageWidth - STAGE_DESIGN_WIDTH);
    const slideX = 18 + Math.round(curExtraW * 0.12);
    const slideY = 174;
    const totalDuration = 1950;
    const startTime = performance.now();

    const animateSlide = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / totalDuration);

      let localX = 38;
      let localY = 22;
      let tilt = 0;
      const scale = 0.72;

      if (progress < 0.18) {
        // Phase 1: Perched joyfully at top platform & scooting onto chute lip
        const p = progress / 0.18;
        const ease = p * p * (3 - 2 * p);
        localX = 36 + ease * 12;
        localY = 26 + ease * 8;
        tilt = -ease * 18;
        setSlideAnimPhase('top');
      } else if (progress < 0.78) {
        // Phase 2: Gravity-accelerated smooth glide along exact yellow slide chute quadratic Bézier
        const u = (progress - 0.18) / 0.6;
        // Gravity acceleration then smooth flare near bottom exit
        const s =
          u < 0.72
            ? Math.pow(u / 0.72, 1.85) * 0.72
            : 0.72 + (1 - Math.pow(1 - (u - 0.72) / 0.28, 2)) * 0.28;
        const p0x = 48;
        const p0y = 34;
        const p1x = 84;
        const p1y = 88;
        const p2x = 130;
        const p2y = 134;
        const inv = 1 - s;
        localX = inv * inv * p0x + 2 * inv * s * p1x + s * s * p2x;
        localY = inv * inv * p0y + 2 * inv * s * p1y + s * s * p2y;
        // Lean slightly back in playful seated slide posture, then level out at exit
        tilt = -22 + s * 14;
        setSlideAnimPhase('sliding');
      } else {
        // Phase 3: Joyful bouncy hop off the end of the chute onto the grass
        const q = (progress - 0.78) / 0.22;
        const easeOut = 1 - Math.pow(1 - q, 2);
        localX = 130 + easeOut * 28;
        localY = 134 + easeOut * 20 - Math.sin(q * Math.PI) * 14;
        tilt = -8 * (1 - easeOut);
        setSlideAnimPhase('landing');
      }

      const stageXPct = Math.max(8, Math.min(92, ((slideX + localX) / stageWidth) * 100));
      const stageYPct = Math.max(12, Math.min(86, ((slideY + localY) / STAGE_DESIGN_HEIGHT) * 100));
      setSlidePose({ x: stageXPct, y: stageYPct, tilt, scale });

      if (progress < 1) {
        slideRafRef.current = requestAnimationFrame(animateSlide);
      } else {
        slideRafRef.current = null;
        const landX = Math.max(15, Math.min(85, ((slideX + 160) / stageWidth) * 100));
        const landY = Math.max(46, Math.min(76, ((slideY + 152) / STAGE_DESIGN_HEIGHT) * 100));
        targetPosRef.current = { x: landX, y: landY };
        setBabyPos({ x: landX, y: landY });
        setSlideAnimPhase('idle');
        setSlidePose(null);
        setPlaygroundSlideActive(false);
        sound.playPop();
        completeInWorldActivity(
          'playground',
          'slide',
          'Meluncur di Perosotan',
          '🛝',
          30,
          34,
          18,
          'laughing',
          'Wuuuush! Meluncur dari atas perosotan seru sekali! 🛝✨'
        );
      }
    };

    slideRafRef.current = requestAnimationFrame(animateSlide);
  };

  // Start sitting and swinging on the playground swing (swing_3d)
  const startSwingRide = () => {
    if (slideRafRef.current !== null) {
      cancelAnimationFrame(slideRafRef.current);
      slideRafRef.current = null;
    }
    setSlideAnimPhase('idle');
    setSlidePose(null);
    setPlaygroundSlideActive(false);
    setOpenObjectMenu(null);
    setOnSwing(true);
    setPlaygroundSwingActive(true);
    setFacingLeft(false);
    swingBoostRef.current = 1.25;
    swingRewardGivenRef.current = false;
    setActivityState('playing');
    setOverrideActionState('laughing');
    sound.playLaugh();

    if (onInWorldCharacterReaction) {
      onInWorldCharacterReaction(
        'laughing',
        'Asyik! Aku duduk di ayunan! Klik Dorong agar makin tinggi! 🎠✨',
        '🎠'
      );
    }

    if (swingRewardTimerRef.current !== null) {
      window.clearTimeout(swingRewardTimerRef.current);
      swingRewardTimerRef.current = null;
    }
    swingRewardTimerRef.current = window.setTimeout(() => {
      swingRewardTimerRef.current = null;
      if (!swingRewardGivenRef.current) {
        swingRewardGivenRef.current = true;
        completeInWorldActivity(
          'playground',
          'swing',
          'Bermain Ayunan Taman',
          '🎠',
          28,
          32,
          16,
          'laughing',
          'Berayun tinggi di udara segar taman membuatku sangat gembira! 🎠🌤️'
        );
      }
    }, 2400);
  };

  const pushSwingHarder = () => {
    swingBoostRef.current = 1.5;
    sound.playLaugh();
    setOverrideActionState('laughing');
    if (onInWorldCharacterReaction) {
      onInWorldCharacterReaction(
        'laughing',
        'Weee! Ayunannya makin tinggi! Seru sekali! 🎠💨',
        '🎠'
      );
    }
  };

  const dismountSwing = () => {
    sound.playClick();
    if (swingRewardTimerRef.current !== null) {
      window.clearTimeout(swingRewardTimerRef.current);
      swingRewardTimerRef.current = null;
    }
    setOnSwing(false);
    setPlaygroundSwingActive(false);
    setOverrideActionState(null);
    setActivityState('idle');
    const curExtraW = Math.max(0, stageWidth - STAGE_DESIGN_WIDTH);
    const swingX = 222 + Math.round(curExtraW * 0.85);
    const landX = Math.max(18, Math.min(84, ((swingX + 42) / stageWidth) * 100));
    targetPosRef.current = { x: landX, y: 68 };
    setBabyPos({ x: landX, y: 68 });
  };

  // Start step-by-step animated sandcastle building from flat empty sand (0% -> 100%)
  const startSandcastleBuild = () => {
    if (sandBuildRafRef.current !== null) {
      cancelAnimationFrame(sandBuildRafRef.current);
      sandBuildRafRef.current = null;
    }
    if (slideRafRef.current !== null) {
      cancelAnimationFrame(slideRafRef.current);
      slideRafRef.current = null;
    }
    setOnSwing(false);
    setPlaygroundSwingActive(false);
    setPlaygroundSlideActive(false);
    setSlideAnimPhase('idle');
    setSlidePose(null);
    setOpenObjectMenu(null);

    const targetLevel = sandcastleStage >= 3 ? 1 : Math.min(3, sandcastleStage + 1);
    if (sandcastleStage >= 3) {
      setSandcastleStage(0);
    }
    if (currentRoom === 'beach') {
      setBeachActivityMode('building_sandcastle');
    }
    setIsBuildingSandcastle(true);
    setSandBuildProgress(0);
    setSandBuildTick(0);
    setHeldPropEmoji('🪣');
    setActivityState('playing');
    setOverrideActionState('playing');
    setActiveActivityTitle('Membangun Istana Pasir');
    setActiveActivityIcon('🏰');
    setActiveActivityInstruction('Tahap 1: Menggali dan menumpuk pasir lembut dengan tangan... 🪣✨');
    sound.playPop();

    if (onInWorldCharacterReaction) {
      onInWorldCharacterReaction(
        'playing',
        'Yuk kita gali dan tumpuk pasirnya pelan-pelan dari awal! 🪣✨',
        '🪣'
      );
    }

    const totalDuration = 4200;
    const startTime = performance.now();
    let announcedPhase = 1;

    const stepBuild = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, (elapsed / totalDuration) * 100);
      setSandBuildProgress(pct);
      setSandBuildTick(elapsed / 1000);
      setActivityProgress(Math.round(pct));

      if (pct >= 24 && announcedPhase < 2) {
        announcedPhase = 2;
        sound.playClick();
        setActiveActivityInstruction('Tahap 2: Mencetak dinding dasar istana pasir dengan ember! 🧱');
        if (onInWorldCharacterReaction) {
          onInWorldCharacterReaction(
            'playing',
            'Tap! Tap! Dinding dasar istana pasir mulai terbentuk! 🧱',
            '🪣'
          );
        }
      } else if (pct >= 48 && announcedPhase < 3) {
        announcedPhase = 3;
        sound.playPop();
        setActiveActivityInstruction('Tahap 3: Membangun menara kiri & kanan yang kokoh! 🏰');
        if (onInWorldCharacterReaction) {
          onInWorldCharacterReaction(
            'playing',
            'Hore! Menara kiri dan kanan mulai berdiri tinggi! 🏰',
            '✨'
          );
        }
      } else if (pct >= 74 && announcedPhase < 4) {
        announcedPhase = 4;
        sound.playPop();
        setActiveActivityInstruction('Tahap 4: Membentuk gerbang, atap menara & bendera puncak! 🚩');
        if (onInWorldCharacterReaction) {
          onInWorldCharacterReaction(
            'laughing',
            'Sedikit lagi selesai! Pasang atap dan bendera istana! 🚩✨',
            '🚩'
          );
        }
      }

      if (pct < 100) {
        sandBuildRafRef.current = requestAnimationFrame(stepBuild);
      } else {
        sandBuildRafRef.current = null;
        setSandBuildProgress(100);
        setIsBuildingSandcastle(false);
        setSandcastleStage(targetLevel);
        setHeldPropEmoji(null);
        setBeachActivityMode('idle');
        completeInWorldActivity(
          'playground',
          'sandpit',
          'Membangun Istana Pasir',
          '🏰',
          26,
          32,
          16,
          'clap_hands',
          `Yeay! Istana pasir tingkat ${targetLevel} sudah jadi megah dari awal! 🏖️🏰✨`
        );
      }
    };

    sandBuildRafRef.current = requestAnimationFrame(stepBuild);
  };

  // Helper to cleanly stop any ongoing beach activity timers/animations
  const stopActiveBeachActivity = () => {
    if (picnicEatTimerRef.current !== null) {
      window.clearTimeout(picnicEatTimerRef.current);
      picnicEatTimerRef.current = null;
    }
    if (beachDigRafRef.current !== null) {
      cancelAnimationFrame(beachDigRafRef.current);
      beachDigRafRef.current = null;
    }
    if (sandBuildRafRef.current !== null) {
      cancelAnimationFrame(sandBuildRafRef.current);
      sandBuildRafRef.current = null;
    }
    setIsBuildingSandcastle(false);
    setActivePicnicEatingItem(null);
    setBeachActivityMode('idle');
    setHeldPropEmoji(null);
  };

  // Helper to cleanly stop any ongoing Desa Budaya Nusantara activity timers/poses
  const stopActiveCulturalActivity = () => {
    if (culturalTimerRef.current !== null) {
      window.clearTimeout(culturalTimerRef.current);
      culturalTimerRef.current = null;
    }
    setCulturalActivityMode('idle');
  };

  // Ensure cultural timers are cleared on unmount
  useEffect(() => {
    return () => {
      if (culturalTimerRef.current !== null) {
        window.clearTimeout(culturalTimerRef.current);
        culturalTimerRef.current = null;
      }
    };
  }, []);

  // Cultural Village Zone 1: Dragging/going to Angklung Rack to shake bamboo Angklung with melodic sound
  const startPlayAngklung = () => {
    stopActiveCulturalActivity();
    setOpenObjectMenu(null);
    const curExtraW = Math.max(0, stageWidth - STAGE_DESIGN_WIDTH);
    const angklungX = 222 + Math.round(curExtraW * 0.85);
    const playX = Number(
      Math.max(22, Math.min(84, ((angklungX - 18) / stageWidth) * 100)).toFixed(2)
    );
    const playY = Number((((342 + 82) / STAGE_DESIGN_HEIGHT) * 100).toFixed(2));
    targetPosRef.current = { x: playX, y: playY };
    setBabyPos({ x: playX, y: playY });
    setFacingLeft(false);
    setCulturalActivityMode('playing_angklung');
    setOverrideActionState('laughing');
    setActivityState('playing');
    setActiveActivityTitle('Bermain Angklung Bambu');
    setActiveActivityIcon('🎶');
    setActiveActivityInstruction(
      'Bayi menggoyangkan Angklung bambu dengan riang — dung-klung-klung! 🎶✨'
    );

    const melodySequence = [0, 2, 3, 4, 2, 1, 0];
    angklungBeatRef.current = 0;

    const playNextBeat = () => {
      const idx = angklungBeatRef.current;
      if (idx >= melodySequence.length) {
        culturalTimerRef.current = null;
        completeInWorldActivity(
          'nature',
          'play_angklung',
          'Bermain Angklung Bambu',
          '🎶',
          32,
          36,
          18,
          'laughing',
          'Klung-klung-klung! Merdu sekali suara Angklung bambu yang aku goyangkan! 🎶🎋✨'
        );
        return;
      }
      sound.playAngklungNote(melodySequence[idx]);
      angklungBeatRef.current = idx + 1;
      if (onInWorldCharacterReaction && (idx === 0 || idx === 3)) {
        onInWorldCharacterReaction(
          'laughing',
          idx === 0
            ? 'Klung-klung~ Aku menggoyangkan Angklung bambu! 🎶'
            : 'Dengar nada bambunya merdu sekali! 🎋🎵✨',
          '🎶'
        );
      }
      culturalTimerRef.current = window.setTimeout(playNextBeat, 520);
    };

    playNextBeat();
  };

  // Cultural Village Zone 2: Dragging/going to Pendopo Joglo to perform a graceful Nusantara traditional dance
  const startTraditionalDance = () => {
    stopActiveCulturalActivity();
    setOpenObjectMenu(null);
    const curExtraW = Math.max(0, stageWidth - STAGE_DESIGN_WIDTH);
    const pendopoX = 76 + Math.round(curExtraW * 0.5);
    const danceX = Number((((pendopoX + 116) / stageWidth) * 100).toFixed(2));
    const danceY = Number((((112 + 132) / STAGE_DESIGN_HEIGHT) * 100).toFixed(2));
    targetPosRef.current = { x: danceX, y: danceY };
    setBabyPos({ x: danceX, y: danceY });
    setFacingLeft(false);
    setCulturalActivityMode('traditional_dance');
    setOverrideActionState('dancing');
    setActivityState('playing');
    setActiveActivityTitle('Tari Tradisional di Pendopo');
    setActiveActivityIcon('💃');
    setActiveActivityInstruction(
      'Gemulai menari tradisional Nusantara dengan selendang batik di panggung Pendopo! 🏛️💃✨'
    );
    sound.playGamelanDance();
    if (onInWorldCharacterReaction) {
      onInWorldCharacterReaction(
        'dancing',
        'Lihat! Aku menari tradisional Nusantara di Pendopo dengan selendang batik! 💃🌺✨',
        '💃'
      );
    }
    culturalTimerRef.current = window.setTimeout(() => {
      sound.playGamelanDance();
      culturalTimerRef.current = null;
      completeInWorldActivity(
        'nature',
        'dance_nusantara',
        'Tari Tradisional Pendopo',
        '💃',
        34,
        40,
        20,
        'dancing',
        'Anggun dan ceria sekali menari tradisional Nusantara di Pendopo Joglo! 🏛️💃🌺'
      );
    }, 2400);
  };

  // Beach Zone 1: Dragging/going under the Beach Umbrella to relax
  const startBeachUmbrellaRelax = () => {
    stopActiveBeachActivity();
    setOpenObjectMenu(null);
    const curExtraW = Math.max(0, stageWidth - STAGE_DESIGN_WIDTH);
    const umbrellaX = 14 + Math.round(curExtraW * 0.08);
    const relaxX = Number((((umbrellaX + 76) / stageWidth) * 100).toFixed(2));
    const relaxY = Number((((184 + 94) / STAGE_DESIGN_HEIGHT) * 100).toFixed(2));
    targetPosRef.current = { x: relaxX, y: relaxY };
    setBabyPos({ x: relaxX, y: relaxY });
    setFacingLeft(false);
    setBeachActivityMode('relaxing');
    setOverrideActionState('big_smile');
    setActivityState('playing');
    setActiveActivityTitle('Bersantai di Payung Pantai');
    setActiveActivityIcon('🏖️');
    setActiveActivityInstruction('Menikmati angin pantai yang sejuk di bawah payung teduh... 🕶️🌊');
    sound.playPop();
    completeInWorldActivity(
      'nature',
      'beach_relax',
      'Bersantai di Bawah Payung Pantai',
      '🏖️',
      24,
      24,
      12,
      'big_smile',
      'Aah~ Teduh dan segar sekali bersantai di bawah payung pantai! 🏖️🕶️🌊'
    );
    // Keep character visibly lounging under the umbrella until dragged elsewhere
    setBeachActivityMode('relaxing');
  };

  // Beach Zone 2: Dragging to Open Sand Patch to build a Sandcastle from scratch with hand motions
  const startBeachSandcastleHere = () => {
    stopActiveBeachActivity();
    setOpenObjectMenu(null);
    const curExtraW = Math.max(0, stageWidth - STAGE_DESIGN_WIDTH);
    const sandSpotX = 214 + Math.round(curExtraW * 0.85);
    const builderX = Number((((sandSpotX + 22) / stageWidth) * 100).toFixed(2));
    const builderY = Number((((274 + 62) / STAGE_DESIGN_HEIGHT) * 100).toFixed(2));
    targetPosRef.current = { x: builderX, y: builderY };
    setBabyPos({ x: builderX, y: builderY });
    setFacingLeft(false);
    startSandcastleBuild();
  };

  // Beach Zone 3: Dragging onto the Picnic Mat & Table to eat cake, strawberry, apple & orange juice bit-by-bit (increasing Hunger!)
  const refillBeachPicnic = () => {
    sound.playPop();
    const fresh = { cake: 3, strawberry: 3, apple: 3, orange_juice: 3 };
    beachPicnicLevelsRef.current = fresh;
    setBeachPicnicLevels(fresh);
    if (onInWorldCharacterReaction) {
      onInWorldCharacterReaction(
        'big_smile',
        'Hidangan piknik pantai sudah diisi penuh lagi: Kue, Stroberi, Apel & Jus Jeruk! 🍰🍓🍎🍊',
        '🧺'
      );
    }
  };

  const startBeachPicnicEating = () => {
    stopActiveBeachActivity();
    setOpenObjectMenu(null);
    const curExtraW = Math.max(0, stageWidth - STAGE_DESIGN_WIDTH);
    const picnicX = 14 + Math.round(curExtraW * 0.12);
    const sitX = Number((((picnicX + 94) / stageWidth) * 100).toFixed(2));
    const sitY = Number((((374 + 18) / STAGE_DESIGN_HEIGHT) * 100).toFixed(2));
    targetPosRef.current = { x: sitX, y: sitY };
    setBabyPos({ x: sitX, y: sitY });
    setFacingLeft(false);

    // Auto-refill if picnic table is completely empty
    const currentLevels = beachPicnicLevelsRef.current;
    const totalLeft =
      currentLevels.cake +
      currentLevels.strawberry +
      currentLevels.apple +
      currentLevels.orange_juice;
    if (totalLeft <= 0) {
      const fresh = { cake: 3, strawberry: 3, apple: 3, orange_juice: 3 };
      beachPicnicLevelsRef.current = fresh;
      setBeachPicnicLevels(fresh);
    }

    setBeachActivityMode('eating_picnic');
    setOverrideActionState('eating');
    setActivityState('playing');
    setActiveActivityTitle('Piknik Pantai Lezat');
    setActiveActivityIcon('🧺');
    setActiveActivityInstruction(
      'Sedang menikmati kue, stroberi, apel & jus jeruk sedikit demi sedikit! Kenyang bertambah 😋'
    );
    sound.playClick();

    const itemOrder: {
      key: 'cake' | 'strawberry' | 'apple' | 'orange_juice';
      label: string;
      emoji: string;
      verb: string;
    }[] = [
      { key: 'cake', label: 'Kue Piknik', emoji: '🍰', verb: 'Nyam nyam! Makan kue lembut...' },
      { key: 'strawberry', label: 'Stroberi Segar', emoji: '🍓', verb: 'Manis segarnya stroberi!' },
      { key: 'apple', label: 'Apel Renyah', emoji: '🍎', verb: 'Kres! Gigit apel manis...' },
      { key: 'orange_juice', label: 'Jus Jeruk', emoji: '🍊', verb: 'Sluuurp! Minum jus jeruk segar...' },
    ];

    const takeNextPicnicBite = () => {
      const lv = beachPicnicLevelsRef.current;
      const nextFood = itemOrder.find((item) => lv[item.key] > 0);
      if (!nextFood) {
        picnicEatTimerRef.current = null;
        setActivePicnicEatingItem(null);
        setHeldPropEmoji(null);
        setBeachActivityMode('idle');
        completeInWorldActivity(
          'picnic',
          'beach_picnic_feast',
          'Piknik Pantai Selesai',
          '🧺',
          24,
          28,
          14,
          'big_smile',
          'Alhamdulillah kenyang banget! Kue, stroberi, apel & jus jeruk habis tak tersisa! 🍰🍓🍎🍊✨'
        );
        return;
      }

      const nextCount = Math.max(0, lv[nextFood.key] - 1);
      const updated = { ...lv, [nextFood.key]: nextCount };
      beachPicnicLevelsRef.current = updated;
      setBeachPicnicLevels(updated);
      setActivePicnicEatingItem(nextFood.key);
      setHeldPropEmoji(nextFood.emoji);
      setOverrideActionState('eating');
      sound.playEatDrink();

      if (onBeachPicnicBite) {
        onBeachPicnicBite(7, 4, nextFood.key);
      }

      const remainingAfter =
        updated.cake + updated.strawberry + updated.apple + updated.orange_juice;
      setActivityProgress(Math.round(((12 - remainingAfter) / 12) * 100));
      setActiveActivityInstruction(
        `${nextFood.emoji} ${nextFood.label} (Sisa ${nextCount}/3) • Kenyang +7%!`
      );
      if (onInWorldCharacterReaction) {
        onInWorldCharacterReaction(
          'eating',
          `${nextFood.verb} (+7% Kenyang!) ${nextFood.emoji}`,
          nextFood.emoji
        );
      }

      picnicEatTimerRef.current = window.setTimeout(takeNextPicnicBite, 1300);
    };

    picnicEatTimerRef.current = window.setTimeout(takeNextPicnicBite, 520);
  };

  // Beach Zone 4: Dragging onto the other sand area to dig with hands and unearth draggable seashells!
  const startBeachSandDigging = () => {
    stopActiveBeachActivity();
    setOpenObjectMenu(null);
    const curExtraW = Math.max(0, stageWidth - STAGE_DESIGN_WIDTH);
    const shoreX = 208 + Math.round(curExtraW * 0.85);
    const digX = Number((((shoreX + 28) / stageWidth) * 100).toFixed(2));
    const digY = Number((((404 + 52) / STAGE_DESIGN_HEIGHT) * 100).toFixed(2));
    targetPosRef.current = { x: digX, y: digY };
    setBabyPos({ x: digX, y: digY });
    setFacingLeft(false);

    setBeachActivityMode('digging_sand');
    setBeachDiggingProgress(0);
    setBeachDigTick(0);
    setOverrideActionState('playing');
    setActivityState('playing');
    setActiveActivityTitle('Menggali Pasir Cari Kerang');
    setActiveActivityIcon('🐚');
    setActiveActivityInstruction('Menggali-gali pasir pantai mencari kerang segar... 🏖️');
    sound.playPop();

    if (onInWorldCharacterReaction) {
      onInWorldCharacterReaction(
        'playing',
        'Ayo kita gali-gali pasirnya! Siapa tahu ada kerang di dalam! 🏖️✨',
        '✨'
      );
    }

    const totalDuration = 1850;
    const startTime = performance.now();

    const stepDig = (now: number) => {
      const elapsed = now - startTime;
      const pct = Math.min(100, (elapsed / totalDuration) * 100);
      setBeachDiggingProgress(pct);
      setBeachDigTick(elapsed / 1000);
      setActivityProgress(Math.round(pct));

      if (pct < 100) {
        beachDigRafRef.current = requestAnimationFrame(stepDig);
      } else {
        beachDigRafRef.current = null;
        setBeachDiggingProgress(100);
        setBeachActivityMode('idle');
        setOverrideActionState('happy_jump');
        sound.playCoin();

        const shellBaseX = Number((((shoreX + 64) / stageWidth) * 100).toFixed(2));
        const shellBaseY = Number((((404 + 92) / STAGE_DESIGN_HEIGHT) * 100).toFixed(2));
        const variants: { name: string; variant: 'dara' | 'kipas' | 'aceh' }[] = [
          { name: 'Kerang Dara Aceh', variant: 'dara' },
          { name: 'Kerang Kipas Pantai', variant: 'kipas' },
          { name: 'Kerang Mutiara Aceh', variant: 'aceh' },
        ];
        const pick1 = variants[Math.floor(Math.random() * variants.length)];
        const pick2 = variants[(Math.floor(Math.random() * variants.length) + 1) % variants.length];

        setDugShells((prev) => {
          const trimmed = prev.slice(-3);
          const nowId = Date.now();
          return [
            ...trimmed,
            {
              id: `shell_${nowId}_1`,
              name: pick1.name,
              variant: pick1.variant,
              x: Math.max(46, Math.min(76, shellBaseX - 6 + (Math.random() * 4 - 2))),
              y: Math.max(70, Math.min(84, shellBaseY - 2 + (Math.random() * 4 - 2))),
            },
            {
              id: `shell_${nowId}_2`,
              name: pick2.name,
              variant: pick2.variant,
              x: Math.max(52, Math.min(80, shellBaseX + 5 + (Math.random() * 4 - 2))),
              y: Math.max(72, Math.min(86, shellBaseY + 3 + (Math.random() * 3 - 1.5))),
            },
          ];
        });

        setActiveActivityInstruction(
          'Hore! Kerang keluar! Seret kerang 🐚 ke Ember 🪣 untuk persediaan masakan Aceh!'
        );
        if (onInWorldCharacterReaction) {
          onInWorldCharacterReaction(
            'happy_jump',
            'Yeay! Kerang keluar dari pasir! Seret kerangnya ke Ember 🪣 untuk dimasak jadi masakan Aceh! 🐚✨',
            '🐚'
          );
        }
      }
    };

    beachDigRafRef.current = requestAnimationFrame(stepDig);
  };

  // Collect a dragged shell into the Beach Shell Bucket -> adds to Aceh cooking inventory!
  const collectDugShellToBucket = (shellId: string, shellName: string) => {
    setDugShells((prev) => prev.filter((s) => s.id !== shellId));
    setCollectedShells((c) => c + 1);
    sound.playCoin();
    sound.playSplash();
    if (onCollectBeachShell) {
      onCollectBeachShell(shellName);
    }
    const nextStock = beachShellStock + 1;
    setActiveActivityTitle('Kerang Masuk Ember!');
    setActiveActivityIcon('🪣');
    setActiveActivityInstruction(
      `${shellName} masuk ember! Stok Kerang: ${nextStock} 🐚 — Siap dimasak ke menu Aceh di Dapur!`
    );
    if (onInWorldCharacterReaction) {
      onInWorldCharacterReaction(
        'clap_hands',
        `Asyik! ${shellName} terkumpul di ember (Stok: ${nextStock} 🐚)! Bisa dimasak jadi Mie Aceh & Kuah Pliek di Dapur! 🍜✨`,
        '🐚'
      );
    }
  };

  // Spring-gravity animation for the seesaw plank with elastic rubber-bumper bounce
  const runSeesawSpringTo = (targetAngle: number, initialVelocity = 0) => {
    if (seesawPhysicsRafRef.current !== null) {
      cancelAnimationFrame(seesawPhysicsRafRef.current);
      seesawPhysicsRafRef.current = null;
    }
    let angle = seesawAngleRef.current;
    let vel = initialVelocity;
    let lastTime = performance.now();

    const stepSpring = (now: number) => {
      const dt = Math.min(0.032, (now - lastTime) / 1000);
      lastTime = now;

      const stiffness = 36;
      const damping = 5.4;
      const accel = (targetAngle - angle) * stiffness - vel * damping;
      vel += accel * dt;
      angle += vel * dt;

      // Soft rubber cushion bounce at bottom limits (-20° and +22°)
      if (angle < -20) {
        angle = -20;
        if (Math.abs(vel) > 18) {
          vel = -vel * 0.42;
          sound.playPop();
        } else {
          vel = 0;
        }
      } else if (angle > 22) {
        angle = 22;
        if (Math.abs(vel) > 18) {
          vel = -vel * 0.38;
        } else {
          vel = 0;
        }
      }

      seesawAngleRef.current = angle;
      setSeesawAngle(angle);

      if (Math.abs(targetAngle - angle) < 0.18 && Math.abs(vel) < 0.6) {
        seesawAngleRef.current = targetAngle;
        setSeesawAngle(targetAngle);
        seesawPhysicsRafRef.current = null;
        return;
      }
      seesawPhysicsRafRef.current = requestAnimationFrame(stepSpring);
    };

    seesawPhysicsRafRef.current = requestAnimationFrame(stepSpring);
  };

  // Mount baby onto left seat of the playground seesaw (seesaw_3d)
  const startSeesawRide = () => {
    if (slideRafRef.current !== null) {
      cancelAnimationFrame(slideRafRef.current);
      slideRafRef.current = null;
    }
    if (sandBuildRafRef.current !== null) {
      cancelAnimationFrame(sandBuildRafRef.current);
      sandBuildRafRef.current = null;
    }
    setIsBuildingSandcastle(false);
    setHeldPropEmoji(null);
    setOnSwing(false);
    setPlaygroundSwingActive(false);
    setPlaygroundSlideActive(false);
    setSlideAnimPhase('idle');
    setSlidePose(null);
    setOpenObjectMenu(null);

    setOnSeesaw(true);
    setFacingLeft(false);
    seesawPumpCountRef.current = 0;
    seesawRewardGivenRef.current = false;
    setActivityState('playing');
    setOverrideActionState('laughing');
    sound.playLaugh();
    // Baby's weight smoothly settles the left side down (-18°) so player can drag the right end down!
    runSeesawSpringTo(-18, -32);

    if (onInWorldCharacterReaction) {
      onInWorldCharacterReaction(
        'laughing',
        'Asyik! Aku naik jungkat-jungkit! Seret ujung kanannya ke bawah ya! ⚖️👇',
        '⚖️'
      );
    }
  };

  const dismountSeesaw = () => {
    sound.playClick();
    setOnSeesaw(false);
    setIsDraggingSeesaw(false);
    setOverrideActionState(null);
    setActivityState('idle');
    runSeesawSpringTo(0, 12);
    const curExtraW = Math.max(0, stageWidth - STAGE_DESIGN_WIDTH);
    const seesawX = 92 + Math.round(curExtraW * 0.5);
    const landX = Math.max(18, Math.min(82, ((seesawX + 36) / stageWidth) * 100));
    targetPosRef.current = { x: landX, y: 69 };
    setBabyPos({ x: landX, y: 69 });
  };

  // Interactive downward drag handlers on the right end of the seesaw plank
  const handleSeesawPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!onSeesaw) return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture errors
    }
    if (seesawPhysicsRafRef.current !== null) {
      cancelAnimationFrame(seesawPhysicsRafRef.current);
      seesawPhysicsRafRef.current = null;
    }
    setIsDraggingSeesaw(true);
    seesawDragRef.current = {
      startY: e.clientY,
      startAngle: seesawAngleRef.current,
      reachedHigh: seesawAngleRef.current >= 10,
      maxMovedPx: 0,
    };
  };

  const handleSeesawPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSeesaw || !seesawDragRef.current) return;
    e.stopPropagation();
    const drag = seesawDragRef.current;
    const rawDy = e.clientY - drag.startY;
    drag.maxMovedPx = Math.max(drag.maxMovedPx, Math.abs(rawDy));

    // Normalize screen pixels to 620px design stage units so touch & mouse drag feel identical
    const visualScale = stageRef.current
      ? stageRef.current.getBoundingClientRect().height / STAGE_DESIGN_HEIGHT
      : 1;
    const stageDy = rawDy / Math.max(0.35, visualScale);

    // Dragging the right end DOWN (+stageDy) tilts the plank clockwise (+angle), lifting the baby on the left HIGH UP!
    const nextAngle = Math.max(-20, Math.min(22, drag.startAngle + stageDy * 0.85));
    seesawAngleRef.current = nextAngle;
    setSeesawAngle(nextAngle);

    if (nextAngle >= 10 && !drag.reachedHigh) {
      drag.reachedHigh = true;
      seesawPumpCountRef.current += 1;
      sound.playLaugh();
      setOverrideActionState('laughing');
      if (onInWorldCharacterReaction) {
        onInWorldCharacterReaction(
          'laughing',
          seesawPumpCountRef.current % 2 === 1
            ? 'Weee! Aku naik tinggi sekali! Hahaha! ⚖️✨'
            : 'Horee! Naik turun jungkat-jungkit seru banget! ⚖️🌟',
          '✨'
        );
      }
      if (seesawPumpCountRef.current >= 2 && !seesawRewardGivenRef.current) {
        seesawRewardGivenRef.current = true;
        completeInWorldActivity(
          'playground',
          'seesaw',
          'Bermain Jungkat-Jungkit',
          '⚖️',
          30,
          34,
          18,
          'laughing',
          'Jungkat-jungkit naik turun bersama sangat seru! ⚖️✨'
        );
      }
    } else if (nextAngle <= -10 && drag.reachedHigh) {
      drag.reachedHigh = false;
      sound.playPop();
    }
  };

  const handleSeesawPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSeesaw) return;
    e.stopPropagation();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture errors
    }
    const drag = seesawDragRef.current;
    seesawDragRef.current = null;
    setIsDraggingSeesaw(false);

    // Quick tap fallback: if player tapped without dragging far, give a fun automatic downward pump!
    if (drag && drag.maxMovedPx < 8) {
      seesawPumpCountRef.current += 1;
      sound.playLaugh();
      setOverrideActionState('laughing');
      if (onInWorldCharacterReaction) {
        onInWorldCharacterReaction(
          'laughing',
          'Weee! Aku melambung naik di jungkat-jungkit! ⚖️✨',
          '✨'
        );
      }
      runSeesawSpringTo(21, 95);
      window.setTimeout(() => {
        runSeesawSpringTo(-18, -55);
      }, 420);
      if (seesawPumpCountRef.current >= 2 && !seesawRewardGivenRef.current) {
        seesawRewardGivenRef.current = true;
        completeInWorldActivity(
          'playground',
          'seesaw',
          'Bermain Jungkat-Jungkit',
          '⚖️',
          30,
          34,
          18,
          'laughing',
          'Jungkat-jungkit naik turun bersama sangat seru! ⚖️✨'
        );
      }
      return;
    }

    // Release from drag: baby's weight smoothly springs the left end back down with playful bounce!
    runSeesawSpringTo(-18, -38);
  };

  // Perform toilet action (Buang Air Kecil / Buang Air Besar) on the toilet seat
  const performToiletAction = (mode: 'pee' | 'poop') => {
    setInBathTub(false);
    setOnToilet(true);
    setToiletActionMode(mode);
    targetPosRef.current = { x: 18, y: 58 };
    setBabyPos({ x: 18, y: 58 });
    setOverrideActionState('sitting');
    sound.playSplash();

    if (onInWorldCharacterReaction) {
      onInWorldCharacterReaction(
        'sitting',
        mode === 'poop'
          ? '🚽 Sedang buang air besar (BAB) di toilet... Eeeeng... 💩'
          : '🚽 Sedang buang air kecil (BAK) di toilet... Ssshhh... 💦',
        mode === 'poop' ? '💩' : '💦'
      );
    }

    setTimeout(() => {
      setToiletActionMode('flush');
      sound.playSplash();
      if (onUseToilet) {
        onUseToilet(mode);
      }
      setTimeout(() => {
        setToiletActionMode('none');
        setOverrideActionState(null);
      }, 1500);
    }, 1300);
  };

  // Detect which of the 6 body zones (head, body, leftArm, rightArm, leftLeg, rightLeg) a tool is over
  const detectCharacterBodyZone = (toolXPct: number, toolYPct: number): BodyZoneId | null => {
    const dx = toolXPct - babyPos.x;
    const dy = toolYPct - babyPos.y;

    if (Math.abs(dx) > 16 || dy < -28 || dy > 14) {
      return null;
    }

    if (dy < -8) {
      return 'head';
    }

    if (dy >= -8 && dy <= 4) {
      if (dx < -4.2) return 'leftArm';
      if (dx > 4.2) return 'rightArm';
      return 'body';
    }

    if (dx < 0) return 'leftLeg';
    return 'rightLeg';
  };

  // ==================== DRAGGABLE SOAP BOTTLE, SHOWER HEAD & TOWEL HANDLERS ====================
  const handleBathToolPointerDown = (
    tool: 'soap' | 'shower' | 'towel',
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setActiveBathTool(tool);
    if (tool === 'shower') {
      setShowerWaterRunning(true);
      sound.playSplash();
    } else if (tool === 'towel') {
      towelDryStrokesRef.current = 0;
      setTowelDryProgress(0);
      sound.playClick();
    } else {
      sound.playClick();
    }
  };

  const handleBathToolPointerMove = (
    tool: 'soap' | 'shower' | 'towel',
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (activeBathTool !== tool || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const rawXPct = Math.max(12, Math.min(88, ((e.clientX - rect.left) / rect.width) * 100));
    const rawYPct = Math.max(12, Math.min(86, ((e.clientY - rect.top) / rect.height) * 100));

    if (tool === 'soap') {
      setSoapBottlePos({ x: rawXPct, y: rawYPct });
      const hitZone = detectCharacterBodyZone(rawXPct, rawYPct + 4);
      setActiveHoveredBodyZone(hitZone);
      const now = Date.now();
      if (hitZone && now - lastToolApplyRef.current > 180) {
        lastToolApplyRef.current = now;
        setSoapFoamActive(true);
        if (onApplySoapToZone) {
          onApplySoapToZone(hitZone);
        }
      }
    } else if (tool === 'shower') {
      setShowerHeadPos({ x: rawXPct, y: rawYPct });
      const hitZone =
        detectCharacterBodyZone(rawXPct, rawYPct + 13) ||
        detectCharacterBodyZone(rawXPct, rawYPct + 6);
      setActiveHoveredBodyZone(hitZone);
      const now = Date.now();
      if (hitZone && now - lastToolApplyRef.current > 180) {
        lastToolApplyRef.current = now;
        setWaterSplashActive(true);
        if (onRinseZoneWithShower) {
          onRinseZoneWithShower(hitZone);
        }
      }
    } else if (tool === 'towel') {
      setTowelPos({ x: rawXPct, y: rawYPct });
      const hitZone =
        detectCharacterBodyZone(rawXPct, rawYPct) ||
        detectCharacterBodyZone(rawXPct, rawYPct + 5);
      setActiveHoveredBodyZone(hitZone);
      const now = Date.now();
      if (hitZone && now - lastToolApplyRef.current > 240) {
        lastToolApplyRef.current = now;
        sound.playPop();
        setSoapFoamActive(false);
        setWaterSplashActive(false);
        towelDryStrokesRef.current += 1;
        const strokes = towelDryStrokesRef.current;
        const prog = Math.min(100, strokes * 34);
        setTowelDryProgress(prog);

        if (strokes >= 3) {
          towelDryStrokesRef.current = 0;
          if (onTowelDryBaby) {
            onTowelDryBaby();
          }
          if (onInWorldCharacterReaction) {
            onInWorldCharacterReaction(
              'fresh',
              'Tubuhku sudah kering, hangat, dan wangi setelah dilap handuk lembut! 🧺✨',
              '✨'
            );
          }
        } else if (onInWorldCharacterReaction) {
          const zoneLabel =
            BODY_ZONES_META.find((z) => z.id === hitZone)?.label || 'tubuh';
          onInWorldCharacterReaction(
            'big_smile',
            `Mengeringkan ${zoneLabel.toLowerCase()} dengan handuk hangat... (${prog}%) 🧺✨`,
            '✨'
          );
        }
      }
    }
  };

  const handleBathToolPointerUp = (
    tool: 'soap' | 'shower' | 'towel',
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (activeBathTool !== tool) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture errors
    }
    setActiveBathTool('none');
    setActiveHoveredBodyZone(null);

    if (tool === 'soap') {
      setSoapBottlePos({ x: 84, y: 60 });
    } else if (tool === 'shower') {
      setShowerWaterRunning(false);
      setWaterSplashActive(false);
      setShowerHeadPos({ x: 84, y: 38 });
    } else if (tool === 'towel') {
      setTowelPos({ x: 84, y: 78 });
      setTimeout(() => setTowelDryProgress(0), 900);
    }
  };

  // Unified Pointer Down Handler for Baby Character (Touchscreen & Mouse)
  const handleBabyPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activeBathTool !== 'none') return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointerDownStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    setIsDragging(true);

    if (inCrib) {
      setBlanketPulled(false);
      setInCrib(false);
      if (isSleeping && onWakeBabyFromCrib) {
        onWakeBabyFromCrib();
      }
    }
    if (inHighChair) setInHighChair(false);
    if (inBathTub) setInBathTub(false);
    if (onToilet) {
      setOnToilet(false);
      setToiletActionMode('none');
    }
    if (onSwing || playgroundSwingActive) {
      if (swingRewardTimerRef.current !== null) {
        window.clearTimeout(swingRewardTimerRef.current);
        swingRewardTimerRef.current = null;
      }
      setOnSwing(false);
      setPlaygroundSwingActive(false);
    }
    if (slideAnimPhase !== 'idle') {
      if (slideRafRef.current !== null) {
        cancelAnimationFrame(slideRafRef.current);
        slideRafRef.current = null;
      }
      setSlideAnimPhase('idle');
      setSlidePose(null);
      setPlaygroundSlideActive(false);
    }
    if (isBuildingSandcastle) {
      if (sandBuildRafRef.current !== null) {
        cancelAnimationFrame(sandBuildRafRef.current);
        sandBuildRafRef.current = null;
      }
      setIsBuildingSandcastle(false);
      setHeldPropEmoji(null);
    }
    if (onSeesaw) {
      setOnSeesaw(false);
      setIsDraggingSeesaw(false);
      runSeesawSpringTo(0, 10);
    }
    if (beachActivityMode !== 'idle') {
      stopActiveBeachActivity();
    }
    if (culturalActivityMode !== 'idle') {
      stopActiveCulturalActivity();
    }
  };

  const handleBabyPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const rawXPct = ((e.clientX - rect.left) / rect.width) * 100;
    const rawYPct = ((e.clientY - rect.top) / rect.height) * 100;
    const clamped = clampCoords(rawXPct, rawYPct);
    if (Math.abs(clamped.x - babyPos.x) > 0.6) {
      setFacingLeft(clamped.x < babyPos.x);
    }
    targetPosRef.current = clamped;
    setHoveredDropZone(detectDropZone(clamped.x, clamped.y));
  };

  const handleBabyPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore pointer capture errors
    }

    const start = pointerDownStartRef.current;
    const movedDist = start
      ? Math.hypot(e.clientX - start.x, e.clientY - start.y)
      : 999;
    const elapsed = start ? Date.now() - start.time : 999;

    setIsDragging(false);
    const zone = detectDropZone(targetPosRef.current.x, targetPosRef.current.y);
    setHoveredDropZone(null);

    // Quick tap without dragging -> handle active in-world activity tap or normal click baby interaction
    if (movedDist < 12 && elapsed < 320) {
      // Cilukba Variasi 1 & 4: Tap character directly to cover/reveal face
      if (activeActivityType === 'cilukba' && (cilukbaVariation === 1 || cilukbaVariation === 4)) {
        if (!peekabooHandsCovered) {
          sound.playPop();
          setPeekabooHandsCovered(true);
          setActivityState('interacting');
          setActiveActivityInstruction('Sentuh karakter sekali lagi untuk membuka tangan: "CILUKBA!"');
          if (onInWorldCharacterReaction) {
            onInWorldCharacterReaction('playing', 'Ciluk... 🙈 (Sentuh aku lagi!)', '🙈');
          }
        } else {
          sound.playLaugh();
          setPeekabooHandsCovered(false);
          setActivityState('playing');
          setOverrideActionState('laughing');
          const nextCount = cilukbaCount + 1;
          setCilukbaCount(nextCount);
          const nextProg = Math.min(100, nextCount * 50);
          setActivityProgress(nextProg);
          if (onInWorldCharacterReaction) {
            onInWorldCharacterReaction('laughing', 'CILUK... BAAA!! Hahaha! ❤️⭐', '❤️');
          }
          if (nextProg >= 100) {
            completeInWorldActivity(
              'cilukba',
              `var_${cilukbaVariation}`,
              'Cilukba Ceria',
              '🙈',
              26,
              30,
              15,
              'laughing',
              'Cilukba seru sekali! Aku tertawa gembira! ❤️✨'
            );
          } else {
            setActiveActivityInstruction('Sentuh karakter lagi untuk Cilukba ronde kedua!');
          }
        }
        return;
      }

      // Ball activity: Tap character to kick/throw ball across the room/park
      if (activeActivityType === 'ball') {
        sound.playPop();
        const dirX = ballPos.x >= babyPos.x ? 1 : -1;
        ballVelRef.current = {
          vx: dirX * (1.8 + Math.random() * 1.1),
          vy: (Math.random() - 0.5) * 1.3,
        };
        setActivityState('playing');
        setOverrideActionState(level <= 2 ? 'playing' : 'happy_jump');
        const nextCount = ballBounceCount + 1;
        setBallBounceCount(nextCount);
        const nextProg = Math.min(100, nextCount * 34);
        setActivityProgress(nextProg);
        if (onInWorldCharacterReaction) {
          onInWorldCharacterReaction(
            level <= 2 ? 'playing' : 'happy_jump',
            'Tendang & lempar bolanya! ⚽✨',
            '⚽'
          );
        }
        if (nextProg >= 100) {
          completeInWorldActivity(
            'ball',
            activeSubAction || 'kick_ball',
            activeActivityTitle || 'Bermain Bola',
            '⚽',
            28,
            34,
            16,
            level <= 2 ? 'playing' : 'happy_jump',
            'Asyik! Bermain bola membuatku lincah & sehat! ⚽🌟'
          );
        }
        return;
      }

      onClickBaby();
      if (currentRoom === 'bedroom' && isSleeping) {
        setInCrib(true);
        setBlanketPulled(true);
        targetPosRef.current = { x: 64, y: 45.8 };
        setBabyPos({ x: 64, y: 45.8 });
      } else if (currentRoom === 'bathroom') {
        setInBathTub(true);
        targetPosRef.current = { x: 48, y: 73 };
        setBabyPos({ x: 48, y: 73 });
      }
      return;
    }

    // Check which drop zone the baby was released over
    if (zone === 'crib') {
      sound.playClick();
      setInCrib(true);
      setBlanketPulled(true);
      targetPosRef.current = { x: 64, y: 45.8 };
      setBabyPos({ x: 64, y: 45.8 });
      setTimeout(() => {
        if (onPutBabyToSleepInCrib) {
          onPutBabyToSleepInCrib();
        } else if (!isSleeping) {
          onToggleLamp();
        }
      }, 650);
    } else if (zone === 'highchair') {
      sound.playClick();
      setInHighChair(true);
      targetPosRef.current = { x: 78, y: 58 };
      setBabyPos({ x: 78, y: 58 });
    } else if (zone === 'toilet') {
      sound.playClick();
      setInBathTub(false);
      setOnToilet(true);
      targetPosRef.current = { x: 18, y: 58 };
      setBabyPos({ x: 18, y: 58 });
      setOpenObjectMenu({
        type: 'bed',
        x: 24,
        y: 44,
        title: 'Toilet Kamar Mandi',
        icon: '🚽',
        options: [
          { id: 'action_toilet_pee', label: 'Buang Air Kecil (BAK -20% Bersih)', emoji: '💦' },
          { id: 'action_toilet_poop', label: 'Buang Air Besar (BAB -32% Bersih)', emoji: '💩' },
          { id: 'action_enter_tub', label: 'Pindah ke Bak Mandi & Bersihkan', emoji: '🛁' },
          { id: 'action_bath_hands', label: 'Cuci Tangan dengan Sabun', emoji: '🧼' },
        ],
      });
    } else if (zone === 'bathtub') {
      sound.playSplash();
      setOnToilet(false);
      setInBathTub(true);
      setWaterSplashActive(true);
      setTimeout(() => setWaterSplashActive(false), 1400);
      targetPosRef.current = { x: 47, y: 73 };
      setBabyPos({ x: 47, y: 73 });
    } else if (zone === 'slide') {
      startSlideRide();
    } else if (zone === 'swing') {
      startSwingRide();
    } else if (zone === 'seesaw') {
      startSeesawRide();
    } else if (zone === 'sandpit') {
      targetPosRef.current = { x: 46, y: 68 };
      setBabyPos({ x: 46, y: 68 });
      startSandcastleBuild();
    } else if (zone === 'beach_umbrella') {
      startBeachUmbrellaRelax();
    } else if (zone === 'beach_sandcastle') {
      startBeachSandcastleHere();
    } else if (zone === 'beach_picnic') {
      startBeachPicnicEating();
    } else if (zone === 'beach_dig') {
      startBeachSandDigging();
    } else if (zone === 'cultural_angklung') {
      startPlayAngklung();
    } else if (zone === 'cultural_pendopo') {
      startTraditionalDance();
    } else {
      sound.playClick();
      const safeX = Math.max(18, Math.min(82, targetPosRef.current.x));
      const safeY = Math.max(48, Math.min(82, targetPosRef.current.y));
      targetPosRef.current = { x: safeX, y: safeY };
      setBabyPos({ x: safeX, y: safeY });
    }
  };

  // ==================== IN-WORLD LOCOMOTION, TAP-TO-MOVE & WALK-TO-DOOR TRANSITION ====================
  const walkCharacterTo = (destX: number, destY: number, onArrived: () => void) => {
    if (inCrib) {
      setInCrib(false);
      setBlanketPulled(false);
    }
    if (onSwing || playgroundSwingActive) {
      setOnSwing(false);
      setPlaygroundSwingActive(false);
    }
    if (onSeesaw) {
      setOnSeesaw(false);
      setIsDraggingSeesaw(false);
      runSeesawSpringTo(0, 10);
    }
    if (culturalActivityMode !== 'idle') {
      stopActiveCulturalActivity();
    }
    if (destX !== babyPos.x) {
      setFacingLeft(destX < babyPos.x);
    }
    const dist = Math.hypot(destX - babyPos.x, destY - babyPos.y);
    if (dist < 2.2) {
      onArrived();
      return;
    }
    setActivityState('walkingToObject');
    setOverrideActionState(level <= 2 ? 'crawling' : 'walking');
    walkDestinationRef.current = { x: destX, y: destY };
    onWalkArrivedRef.current = onArrived;
  };

  // Tap/click on the open floor/ground to walk character smoothly to that spot
  const handleStageFloorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging || isSleeping || currentRoom === 'bathroom') return;
    if (openObjectMenu || showSeedRackDrawer || showRecipeBookDrawer) {
      setOpenObjectMenu(null);
      setShowSeedRackDrawer(false);
      setShowRecipeBookDrawer(false);
      return;
    }
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const clickXPct = ((e.clientX - rect.left) / rect.width) * 100;
    const clickYPct = ((e.clientY - rect.top) / rect.height) * 100;

    // Only walk when clicking within the floor/ground walkable band (y: 44%..78%, x: 15%..85%)
    if (clickYPct < 43 || clickYPct > 79 || clickXPct < 14 || clickXPct > 86) return;

    sound.playClick();
    setTapMoveMarker({ x: clickXPct, y: clickYPct });
    walkCharacterTo(clickXPct, clickYPct, () => {
      setTapMoveMarker(null);
      if (!activeActivityType) {
        setActivityState('idle');
        setOverrideActionState(null);
      }
    });
  };

  // Directional Pad / Mini Joystick Nudge Handler
  const handleJoystickNudge = (dx: number, dy: number) => {
    if (isSleeping) return;
    const destX = Math.max(16, Math.min(84, babyPos.x + dx));
    const destY = Math.max(44, Math.min(78, babyPos.y + dy));
    setTapMoveMarker({ x: destX, y: destY });
    walkCharacterTo(destX, destY, () => {
      setTapMoveMarker(null);
      if (!activeActivityType) {
        setActivityState('idle');
        setOverrideActionState(null);
      }
    });
  };

  // Walk-to-Door Smooth Location Transition (Character walks to doorExitCoords before switching room)
  const handleWalkToDoorAndChangeLocation = (targetLocation: WorldLocationId) => {
    if (!onRequestLocationChange || targetLocation === currentRoom) return;
    sound.playClick();
    setOpenObjectMenu(null);
    const locMeta = getWorldLocationMeta(currentRoom);
    const targetMeta = getWorldLocationMeta(targetLocation);
    const doorCoords = locMeta.doorExitCoords;
    setActiveActivityTitle(`Menuju ${targetMeta.indonesianName}...`);
    setActiveActivityIcon(targetMeta.iconEmoji);
    setActiveActivityInstruction(
      `Karakter berjalan menuju pintu keluar ke ${targetMeta.indonesianName}...`
    );
    walkCharacterTo(doorCoords.x, doorCoords.y, () => {
      setActivityState('idle');
      setOverrideActionState(null);
      onRequestLocationChange(targetLocation);
    });
  };

  // ==================== 4-BED PERSISTENT OUTDOOR GARDENING HANDLERS ====================
  const handleDigGardenBed = (bedIndex: number) => {
    sound.playPop();
    const nextPlants = plants.map((bed) =>
      bed.bedIndex === bedIndex ? { ...bed, soilPrepared: true } : bed
    );
    if (onUpdatePlants) onUpdatePlants(nextPlants);
    setOverrideActionState('playing');
    setHeldPropEmoji('🪏');
    if (onInWorldCharacterReaction) {
      onInWorldCharacterReaction(
        'playing',
        `Menggali & menggemburkan tanah petak kebun #${bedIndex + 1}! 🪏🌱`,
        '🌱'
      );
    }
    setTimeout(() => {
      setOverrideActionState(null);
      setHeldPropEmoji(null);
    }, 1400);
  };

  const handlePlantSeedInBed = (bedIndex: number, plantIdToUse: PlantId) => {
    const plantDef = getPlantDef(plantIdToUse);
    sound.playPop();
    const now = Date.now();
    const nextPlants = plants.map((bed) =>
      bed.bedIndex === bedIndex
        ? {
            ...bed,
            soilPrepared: true,
            plantId: plantIdToUse,
            stage: 'Seed' as const,
            plantedAt: now,
            lastWateredAt: now,
            waterCount: 1,
            growthProgress: 12,
          }
        : bed
    );
    if (onUpdatePlants) onUpdatePlants(nextPlants);
    setOverrideActionState('playing');
    setHeldPropEmoji(plantDef.seedEmoji);
    if (onInWorldCharacterReaction) {
      onInWorldCharacterReaction(
        'clap_hands',
        `Menanam bibit ${plantDef.indonesianName} ${plantDef.iconEmoji} di petak #${bedIndex + 1}!`,
        plantDef.iconEmoji
      );
    }
    setTimeout(() => {
      setOverrideActionState(null);
      setHeldPropEmoji(null);
    }, 1500);
  };

  const handleWaterGardenBed = (bedIndex: number) => {
    const targetBed = plants.find((b) => b.bedIndex === bedIndex);
    if (!targetBed || !targetBed.plantId) return;
    sound.playSplash();
    const plantDef = getPlantDef(targetBed.plantId);
    const nextWaterCount = targetBed.waterCount + 1;
    const nextProgress = Math.min(100, targetBed.growthProgress + 24);
    const stageIdx = Math.min(
      5,
      Math.max(
        PLANT_STAGE_ORDER.indexOf(targetBed.stage),
        Math.floor((nextProgress / 100) * 5)
      )
    );
    const nextStage = PLANT_STAGE_ORDER[stageIdx];

    const nextPlants = plants.map((bed) =>
      bed.bedIndex === bedIndex
        ? {
            ...bed,
            lastWateredAt: Date.now(),
            waterCount: nextWaterCount,
            growthProgress: nextProgress,
            stage: nextStage,
          }
        : bed
    );
    if (onUpdatePlants) onUpdatePlants(nextPlants);
    setOverrideActionState('playing');
    setHeldPropEmoji('🚿');
    if (onInWorldCharacterReaction) {
      onInWorldCharacterReaction(
        'big_smile',
        `Menyiram ${plantDef.indonesianName}! Tanah segar & tumbuh ke tahap ${PLANT_STAGE_LABELS[nextStage].id}! 💧✨`,
        '💧'
      );
    }
  };

  const handleHarvestGardenBed = (bedIndex: number) => {
    const targetBed = plants.find((b) => b.bedIndex === bedIndex);
    if (!targetBed || !targetBed.plantId || targetBed.stage !== 'Harvestable') return;
    const harvestedId = targetBed.plantId;
    const plantDef = getPlantDef(harvestedId);
    sound.playLevelUp();

    if (onHarvestPlant) {
      onHarvestPlant(harvestedId, bedIndex);
    } else if (onUpdatePlants) {
      const nextPlants = plants.map((bed) =>
        bed.bedIndex === bedIndex
          ? {
              ...bed,
              plantId: null,
              soilPrepared: false,
              stage: 'Seed' as const,
              plantedAt: 0,
              lastWateredAt: 0,
              waterCount: 0,
              growthProgress: 0,
            }
          : bed
      );
      onUpdatePlants(nextPlants);
    }

    setOverrideActionState('happy_jump');
    setHeldPropEmoji(plantDef.harvestEmoji);
    completeInWorldActivity(
      'garden',
      `harvest_${harvestedId}`,
      `Panen ${plantDef.indonesianName}`,
      plantDef.harvestEmoji,
      28,
      34,
      18,
      'happy_jump',
      `Hore! Berhasil memanen ${plantDef.indonesianName} ${plantDef.harvestEmoji} segar ke Keranjang Panen!`
    );
  };

  // ==================== FULL INTERACTIVE KITCHEN WORKFLOW HANDLERS ====================
  const activeRecipeDef = getRecipeDef(activeRecipeId);

  const syncPersistentKitchenState = (partial: Partial<PersistentActiveFoodState>) => {
    if (!onUpdateFoodState) return;
    onUpdateFoodState({
      activeRecipeId,
      state: kitchenFoodStage,
      addedIngredients,
      stirCount: potStirCount,
      bitesRemaining,
      dirtyPlateCount,
      ...partial,
    });
  };

  const handleSelectKitchenRecipe = (recipe: CookingRecipeDef) => {
    sound.playClick();
    setActiveRecipeId(recipe.id);
    setShowRecipeBookDrawer(false);
    setFridgeOpen(true);
    setWashedIngredients([]);
    setPreppedIngredients([]);
    setAddedIngredients([]);
    setPotStirCount(0);
    setIsFoodCooked(false);
    setKitchenFoodStage('raw');
    setBitesRemaining(3);

    const mappedIngs = recipe.ingredients.map((ingId, idx) => {
      const def = COOKING_INGREDIENTS[ingId] || {
        id: ingId,
        name: ingId,
        indonesianName: ingId,
        emoji: '🥗',
      };
      return {
        id: def.id,
        name: def.indonesianName,
        emoji: def.emoji,
        startX: 16 + idx * 9,
        startY: 45,
      };
    });

    setSelectedRecipe({
      name: recipe.indonesianTitle,
      icon: recipe.iconEmoji,
      ingredients: mappedIngs,
    });

    syncPersistentKitchenState({
      activeRecipeId: recipe.id,
      state: 'raw',
      addedIngredients: [],
      stirCount: 0,
      bitesRemaining: 3,
    });

    if (onInWorldCharacterReaction) {
      onInWorldCharacterReaction(
        level <= 2 ? 'clap_hands' : 'cooking',
        level <= 2
          ? `Asyik! Aku menonton Kakak memasak ${recipe.indonesianTitle} ${recipe.iconEmoji}!`
          : `Ayo masak ${recipe.indonesianTitle} ${recipe.iconEmoji}! Ambil bahan dari Kulkas/Keranjang Kebun!`,
        recipe.iconEmoji
      );
    }
  };

  const handleWashIngredientAtSink = (ingId: string, ingName: string) => {
    sound.playSplash();
    setWashedIngredients((prev) => (prev.includes(ingId) ? prev : [...prev, ingId]));
    if (onInWorldCharacterReaction) {
      onInWorldCharacterReaction('playing', `Mencuci ${ingName} di wastafel sampai bersih & segar! 🚰💧`, '💧');
    }
  };

  const handlePrepIngredientOnBoard = (ingId: string, ingName: string) => {
    sound.playPop();
    setWashedIngredients((prev) => (prev.includes(ingId) ? prev : [...prev, ingId]));
    setPreppedIngredients((prev) => (prev.includes(ingId) ? prev : [...prev, ingId]));
    setKitchenFoodStage('prepared');
    syncPersistentKitchenState({ state: 'prepared' });
    if (onInWorldCharacterReaction) {
      onInWorldCharacterReaction(
        'cooking',
        `Menyiapkan & mencampur ${ingName} di talenan & mangkuk dapur! 🥣✨`,
        '🥣'
      );
    }
  };

  const handleStirStovePot = () => {
    sound.playSizzle();
    const nextStir = potStirCount + 1;
    setPotStirCount(nextStir);
    setActivityState('playing');
    setOverrideActionState(level <= 2 ? 'clap_hands' : 'cooking');
    setActivityProgress(Math.min(90, 50 + nextStir * 14));

    if (nextStir >= 3) {
      setIsFoodCooked(true);
      setKitchenFoodStage('cooked');
      setCookedDishPos({ x: 35, y: 31 });
      sound.playCorrect();
      syncPersistentKitchenState({ state: 'cooked', stirCount: nextStir });
      setActiveActivityInstruction(
        `READY! ${activeRecipeDef.indonesianTitle} sudah matang! Sentuh atau seret ke Piring di Meja Makan 🍽️!`
      );
      if (onInWorldCharacterReaction) {
        onInWorldCharacterReaction(
          'big_smile',
          `Harum sekali! ${activeRecipeDef.indonesianTitle} sudah READY! Ayo sajikan ke piring! 🍲✨`,
          '✨'
        );
      }
    } else {
      setKitchenFoodStage('cooking');
      syncPersistentKitchenState({ state: 'cooking', stirCount: nextStir });
      setActiveActivityInstruction(
        `Mengaduk masakan di kompor... (${nextStir}/3) Sentuh Panci lagi!`
      );
    }
  };

  const handleServeDishToTable = () => {
    sound.playCorrect();
    setIsDraggingDish(false);
    setKitchenFoodStage('served');
    setBitesRemaining(3);
    syncPersistentKitchenState({ state: 'served', bitesRemaining: 3 });
    walkCharacterTo(71, 56, () => {
      setInHighChair(true);
      setOverrideActionState('eating');
      setActiveActivityInstruction(
        `Makanan tersaji di Meja Makan! Sentuh Piring ${activeRecipeDef.iconEmoji} 3 kali untuk menyantap sampai habis!`
      );
    });
  };

  const handleTakeBiteAtTable = () => {
    sound.playEatDrink();
    const nextBites = Math.max(0, bitesRemaining - 1);
    setBitesRemaining(nextBites);
    setOverrideActionState('eating');

    if (nextBites > 0) {
      syncPersistentKitchenState({ state: 'served', bitesRemaining: nextBites });
      if (onInWorldCharacterReaction) {
        onInWorldCharacterReaction(
          'eating',
          `Nyam nyam! Suapan lezat ${activeRecipeDef.indonesianTitle}! (Sisa ${nextBites} suapan) 😋`,
          activeRecipeDef.iconEmoji
        );
      }
    } else {
      // Finished all 3 bites -> reward stats, increment dirty plate count!
      const nextDirty = dirtyPlateCount + 1;
      setDirtyPlateCount(nextDirty);
      setKitchenFoodStage('none');
      setIsFoodCooked(false);
      setAddedIngredients([]);
      setPotStirCount(0);
      syncPersistentKitchenState({
        state: 'none',
        addedIngredients: [],
        stirCount: 0,
        bitesRemaining: 0,
        dirtyPlateCount: nextDirty,
      });

      const usedHarvests = activeRecipeDef.ingredients
        .map((id) => COOKING_INGREDIENTS[id]?.fromGardenPlantId)
        .filter((p): p is PlantId => Boolean(p));

      if (onConsumeCookedRecipe) {
        onConsumeCookedRecipe(activeRecipeDef, usedHarvests);
      } else if (onQuickFeedPorridge) {
        onQuickFeedPorridge();
      }

      completeInWorldActivity(
        'kitchen',
        `cook_eat_${activeRecipeDef.id}`,
        `Memasak & Menyantap ${activeRecipeDef.indonesianTitle}`,
        activeRecipeDef.iconEmoji,
        activeRecipeDef.happinessRestore,
        activeRecipeDef.xpGain,
        22,
        'eating',
        `Alhamdulillah kenyang! ${activeRecipeDef.indonesianTitle} buatan sendiri habis tak tersisa! Sekarang piring kotornya bisa dicuci di wastafel 🚰✨`
      );
    }
  };

  const handleWashDirtyPlateAtSink = () => {
    if (dirtyPlateCount <= 0) return;
    sound.playSplash();
    const nextWash = sinkWashProgress + 1;
    if (nextWash < 2) {
      setSinkWashProgress(nextWash);
      if (onInWorldCharacterReaction) {
        onInWorldCharacterReaction('playing', 'Menggosok piring dengan sabun busa di wastafel... 🫧🍽️', '🫧');
      }
    } else {
      setSinkWashProgress(0);
      const nextDirty = Math.max(0, dirtyPlateCount - 1);
      setDirtyPlateCount(nextDirty);
      syncPersistentKitchenState({ dirtyPlateCount: nextDirty });
      if (onCleanDirtyDish) onCleanDirtyDish();
      sound.playCorrect();
      if (onInWorldCharacterReaction) {
        onInWorldCharacterReaction(
          'clap_hands',
          'Cling! Piring sudah dibilas air bersih dan berkilau di rak piring! ✨🍽️',
          '✨'
        );
      }
    }
  };

  const stopInWorldActivity = () => {
    walkDestinationRef.current = null;
    onWalkArrivedRef.current = null;
    setActivityState('idle');
    setActiveActivityType(null);
    setActiveSubAction('');
    setActiveActivityTitle('');
    setActiveActivityInstruction('');
    setActiveActivityDefId(undefined);
    setActivityProgress(0);
    setOverrideActionState(null);
    setHeldPropEmoji(null);
    setPeekabooHandsCovered(false);
    setPillowHidingBaby(false);
    setBlanketHidingBaby(false);
    setOpenObjectMenu(null);
    setShowActivityHint(false);
  };

  const completeInWorldActivity = (
    type: InWorldObjectType,
    subAction: string,
    title: string,
    icon: string,
    happinessGain: number,
    xpGain: number,
    coinsGain: number,
    finalActionState: BabyActionState,
    speech: string
  ) => {
    sound.playLevelUp();
    setActivityState('activityComplete');
    setActivityProgress(100);
    setOverrideActionState(finalActionState);
    setActiveActivityInstruction('Aktivitas selesai! Karakter sangat senang ✨');

    if (onInWorldActivityComplete) {
      onInWorldActivityComplete({
        type,
        subAction,
        title,
        icon,
        activityDefId: activeActivityDefId,
        happinessGain,
        xpGain,
        coinsGain,
        actionState: finalActionState,
        speech,
      });
    }

    setTimeout(() => {
      stopInWorldActivity();
    }, 2200);
  };

  // Start any of the Object-Based Activities, Outdoor Activities, or 4 Cilukba Variations directly in the scene
  const startInWorldObjectActivity = (
    type: InWorldObjectType,
    subAction: string,
    customTitle?: string,
    customIcon?: string,
    activityDefId?: string
  ) => {
    sound.playClick();
    setOpenObjectMenu(null);
    setShowActivityHint(false);
    setActiveActivityType(type);
    setActiveSubAction(subAction);
    setActiveActivityDefId(activityDefId);
    setActivityProgress(15);
    setPeekabooHandsCovered(false);
    setPillowHidingBaby(false);
    setBlanketHidingBaby(false);

    if (type === 'cilukba') {
      const varNum: 1 | 2 | 3 | 4 =
        subAction === 'var_2'
          ? 2
          : subAction === 'var_3'
          ? 3
          : subAction === 'var_4'
          ? 4
          : 1;
      setCilukbaVariation(varNum);
      setCilukbaCount(0);
      setActiveActivityTitle(customTitle || `Cilukba Variasi ${varNum}`);
      setActiveActivityIcon(customIcon || '🙈');

      if (varNum === 1) {
        setActivityState('interacting');
        setActiveActivityInstruction('Variasi 1: Sentuh karakter untuk menutup wajah dengan kedua tangan!');
        if (onInWorldCharacterReaction) {
          onInWorldCharacterReaction('playing', 'Ayo main Cilukba! Sentuh aku ya! 🙈', '🙈');
        }
      } else if (varNum === 2) {
        setPillowPos({ x: Math.max(22, babyPos.x - 16), y: babyPos.y + 2 });
        setActivityState('interacting');
        setActiveActivityInstruction('Variasi 2: Seret Bantal Empuk ke arah karakter untuk bersembunyi!');
        if (onInWorldCharacterReaction) {
          onInWorldCharacterReaction('curious_head_tilt', 'Seret bantal itu ke depanku untuk sembunyi! 枕✨', '🙈');
        }
      } else if (varNum === 3) {
        setBlanketHidingBaby(true);
        setBlanketCornerPos({ x: babyPos.x, y: babyPos.y });
        setActivityState('interacting');
        setActiveActivityInstruction('Variasi 3: Karakter sembunyi di balik selimut! Seret ujung selimut untuk membuka!');
        if (onInWorldCharacterReaction) {
          onInWorldCharacterReaction('playing', 'Hihi... aku sembunyi di balik selimut! Tarik selimutnya! 🛌', '🙈');
        }
      } else {
        setActivityState('interacting');
        setActiveActivityInstruction('Variasi 4: Tekan ikon 🙈 Ajak Cilukba di dekat karakter, lalu sentuh karakter!');
        if (onInWorldCharacterReaction) {
          onInWorldCharacterReaction('playing', 'Ajak aku Cilukba dengan tombol tangan di dekatku! 🤲', '🙈');
        }
      }
      return;
    }

    if (type === 'bed') {
      setActiveActivityTitle(customTitle || 'Aktivitas Tempat Tidur');
      setActiveActivityIcon(customIcon || '🛏️');
      walkCharacterTo(68, 52, () => {
        setInCrib(true);
        if (subAction === 'sleep') {
          setBlanketPulled(true);
          setActivityState('playing');
          if (onPutBabyToSleepInCrib) onPutBabyToSleepInCrib();
          completeInWorldActivity('bed', 'sleep', 'Tidur Nyenyak di Kasur', '🌙', 22, 24, 12, 'sleeping', 'Zzz... Nyaman sekali tidur di kasurku! 🌙');
        } else if (subAction === 'lie_down') {
          setBlanketPulled(true);
          setActivityState('interacting');
          setOverrideActionState('idle');
          setActiveActivityInstruction('Karakter berbaring santai di kasur. Sentuh selimut atau karakter untuk memeluk!');
          setTimeout(() => {
            completeInWorldActivity('bed', 'lie_down', 'Berbaring Santai', '🛏️', 20, 22, 10, 'loved', 'Segar rasanya berbaring santai di kasur empuk! ✨');
          }, 1800);
        } else if (subAction === 'read_bed') {
          setActivityState('holdingObject');
          setHeldPropEmoji('📖');
          setOverrideActionState('reading');
          setActiveActivityInstruction('Membaca buku cerita di atas kasur! Sentuh buku untuk membalik halaman.');
          setTimeout(() => {
            completeInWorldActivity('bed', 'read_bed', 'Membaca Buku di Kasur', '📖', 25, 28, 14, 'reading', 'Cerita sebelum tidur yang sangat seru! 📖✨');
          }, 2000);
        } else {
          setActivityState('holdingObject');
          setHeldPropEmoji('🧸');
          setOverrideActionState('loved');
          setActiveActivityInstruction('Bermain bersama boneka kesayangan di atas kasur!');
          setTimeout(() => {
            completeInWorldActivity('bed', 'play_plush', 'Bermain Boneka di Kasur', '🧸', 25, 26, 14, 'laughing', 'Bonekaku lembut dan hangat sekali! 🧸❤️');
          }, 1900);
        }
      });
      return;
    }

    if (type === 'teddy') {
      setActiveActivityTitle(customTitle || 'Boneka Teddy Bear');
      setActiveActivityIcon(customIcon || '🧸');
      walkCharacterTo(teddyPos.x + 5, teddyPos.y - 2, () => {
        if (subAction === 'hug_teddy') {
          setTeddyPose('hugged');
          setActivityState('holdingObject');
          setHeldPropEmoji('🧸');
          setOverrideActionState('loved');
          setActiveActivityInstruction('Karakter memeluk Teddy Bear erat-erat! Sentuh Teddy atau seret ke sekeliling.');
          if (onInWorldCharacterReaction) {
            onInWorldCharacterReaction('loved', 'Peluk Teddy Bear hangat sekali! 🧸💖', '❤️');
          }
          setTimeout(() => {
            completeInWorldActivity('teddy', 'hug_teddy', 'Memeluk Teddy Bear', '🧸', 26, 28, 14, 'loved', 'Aku sayang sekali sama Teddy Bear! 🧸❤️');
          }, 1900);
        } else if (subAction === 'play_teddy') {
          setTeddyPose('dancing');
          setActivityState('playing');
          setHeldPropEmoji('🧸');
          setOverrideActionState('dancing');
          setActiveActivityInstruction('Menari & bermain gembira bersama Teddy Bear di kamar!');
          setTimeout(() => {
            completeInWorldActivity('teddy', 'play_teddy', 'Bermain Bersama Teddy', '🧸', 28, 30, 15, 'laughing', 'Teddy Bear pintar menari bersamaku! 🧸🎶');
          }, 2000);
        } else if (subAction === 'sit_teddy') {
          setTeddyPose('sitting');
          setActivityState('interacting');
          setOverrideActionState('clap_hands');
          setActiveActivityInstruction('Teddy Bear didudukkan dengan rapi di atas karpet!');
          setTimeout(() => {
            completeInWorldActivity('teddy', 'sit_teddy', 'Mendudukkan Teddy Bear', '🧸', 20, 22, 12, 'big_smile', 'Duduk yang rapi ya Teddy manis! 🧸✨');
          }, 1600);
        } else {
          setTeddyPose('sleeping');
          setActivityState('interacting');
          setOverrideActionState('comfort_player');
          setActiveActivityInstruction('Menidurkan Teddy Bear sambil menepuk lembut...');
          setTimeout(() => {
            completeInWorldActivity('teddy', 'sleep_teddy', 'Menidurkan Teddy Bear', '🧸', 24, 26, 13, 'loved', 'Selamat bobo ya Teddy Bear kesayanganku! 🌙🧸');
          }, 1800);
        }
      });
      return;
    }

    if (type === 'ball') {
      setActiveActivityTitle(customTitle || 'Bermain Bola Interaktif');
      setActiveActivityIcon(customIcon || '⚽');
      setBallBounceCount(0);
      walkCharacterTo(Math.max(24, Math.min(76, ballPos.x - 8)), ballPos.y - 3, () => {
        setActivityState('playing');
        setOverrideActionState(level <= 2 ? 'playing' : 'happy_jump');
        const impulseX = subAction === 'roll_ball' ? 1.3 : 2.2;
        const impulseY = subAction === 'throw_ball' ? -1.4 : 0.6;
        ballVelRef.current = {
          vx: (ballPos.x >= babyPos.x ? 1 : -1) * impulseX,
          vy: impulseY,
        };
        setActiveActivityInstruction(
          'Seret & lempar bola ⚽ di lantai/rumput, atau sentuh karakter untuk menendang & menangkap bola!'
        );
        if (onInWorldCharacterReaction) {
          onInWorldCharacterReaction(
            level <= 2 ? 'playing' : 'happy_jump',
            'Ayo gelindingkan, lempar, dan tangkap bolanya! ⚽✨',
            '⚽'
          );
        }
      });
      return;
    }

    if (type === 'bookshelf') {
      setActiveActivityTitle(customTitle || 'Membaca Buku Cerita');
      setActiveActivityIcon(customIcon || '📚');
      const booksCatalog = [
        {
          id: 'book_kancil',
          title: 'Kisah Si Kancil & Kura-Kura',
          color: '#38BDF8',
          pages: [
            'Halaman 1: Di tepi hutan Nusantara yang rimbun, Si Kancil menyapa sahabatnya Kura-Kura.',
            'Halaman 2: Mereka berlomba menghitung buah apel merah di sepanjang sungai jernih!',
            'Halaman 3: Persahabatan dan kejujuran membuat semua hewan hutan hidup rukun dan gembira!',
          ],
        },
        {
          id: 'book_angkasa',
          title: 'Petualangan Bintang & Angka',
          color: '#A855F7',
          pages: [
            'Halaman 1: Malam hari di langit Nusantara bertabur 7 bintang emas yang berkilau.',
            'Halaman 2: 3 bintang besar ditambah 4 bintang kecil menjadi 7 bintang ceria!',
            'Halaman 3: Belajar berhitung sambil menatap langit malam sungguh menyenangkan!',
          ],
        },
        {
          id: 'book_budaya',
          title: 'Dongeng Nusantara Indah',
          color: '#F59E0B',
          pages: [
            'Halaman 1: Dari Sabang sampai Merauke, setiap daerah punya tarian dan baju adat indah.',
            'Halaman 2: Musik Angklung dan Gamelan berpadu merdu membawa senyuman.',
            'Halaman 3: Aku bangga mengenal budaya Nusantara sejak kecil!',
          ],
        },
      ];
      const chosen =
        subAction === 'pick_book_2'
          ? booksCatalog[1]
          : subAction === 'pick_book_3'
          ? booksCatalog[2]
          : booksCatalog[0];
      setSelectedBook(chosen);
      setBookOpenPage(0);
      setIsBookDelivered(false);
      const shelfX = currentRoom === 'playroom' ? 78 : 22;
      const shelfY = currentRoom === 'playroom' ? 46 : 48;
      setBookPos({ x: shelfX, y: shelfY });

      walkCharacterTo(48, 63, () => {
        if (subAction === 'read_now') {
          setIsBookDelivered(true);
          setBookPos({ x: 48, y: 60 });
          setActivityState('holdingObject');
          setHeldPropEmoji('📖');
          setOverrideActionState('reading');
          setActiveActivityInstruction('Sentuh halaman buku di samping karakter untuk membalik halaman (1/3)!');
        } else {
          setActivityState('interacting');
          setOverrideActionState('curious_head_tilt');
          setActiveActivityInstruction(
            `Seret buku "${chosen.title}" 📖 dari rak buku ke arah karakter untuk mulai membaca!`
          );
        }
      });
      return;
    }

    if (type === 'kitchen') {
      const matchedRec =
        COOKING_RECIPES.find((r) => r.id === subAction || subAction.includes(r.id)) ||
        (subAction === 'recipe_soup'
          ? getRecipeDef('vegetable_soup')
          : subAction === 'recipe_porridge'
          ? getRecipeDef('bubur_ayam')
          : activeRecipeDef);

      setActiveActivityTitle(customTitle || `Memasak ${matchedRec.indonesianTitle}`);
      setActiveActivityIcon(customIcon || matchedRec.iconEmoji);
      handleSelectKitchenRecipe(matchedRec);

      walkCharacterTo(45, 58, () => {
        setActivityState('interacting');
        setHeldPropEmoji(level <= 2 ? '🍼' : '🥄');
        setOverrideActionState(level <= 2 ? 'clap_hands' : 'cooking');
        setActiveActivityInstruction(
          level <= 2
            ? `Mode Bayi Aman: Sentuh bahan (${matchedRec.ingredients.map((id) => COOKING_INGREDIENTS[id]?.emoji || '🥗').join(' ')}) untuk meminta Kakak memasak!`
            : `Langkah 1: Cuci bahan di Wastafel 🚰 / siapkan di Talenan 🔪, lalu masukkan ke Panci Kompor 🍲!`
        );
      });
      return;
    }

    if (type === 'toybox') {
      setActiveActivityTitle(customTitle || 'Menyusun Balok & Mainan');
      setActiveActivityIcon(customIcon || '🧱');
      setStackedBlocks([]);
      setLooseBlocks([
        { id: 1, label: '1', color: '#FF8FAB', x: 62, y: 66 },
        { id: 2, label: '2', color: '#38BDF8', x: 70, y: 69 },
        { id: 3, label: '3', color: '#34D399', x: 78, y: 66 },
        { id: 4, label: '★', color: '#FBBF24', x: 66, y: 74 },
      ]);
      walkCharacterTo(48, 63, () => {
        if (subAction === 'tidy_toys') {
          setActivityState('interacting');
          setOverrideActionState('clap_hands');
          setActiveActivityInstruction('Sentuh atau seret balok-balok di lantai untuk merapikannya ke kotak mainan!');
        } else {
          setActivityState('playing');
          setHeldPropEmoji('🧱');
          setOverrideActionState('playing');
          setActiveActivityInstruction(
            'Seret atau sentuh 4 balok warna-warni di karpet untuk menyusun menara balok!'
          );
        }
      });
      return;
    }

    if (type === 'garden') {
      setActiveActivityTitle(customTitle || 'Berkebun & Merawat Tanaman');
      setActiveActivityIcon(customIcon || '🌱');
      setGardenSoilDug(subAction === 'water_plant' || subAction === 'pick_flower');
      setGardenSeedPlanted(subAction === 'water_plant' || subAction === 'pick_flower');
      setGardenWaterLevel(subAction === 'pick_flower' ? 3 : 0);
      setGardenBugInspected(false);
      setWateringCanPos({ x: 78, y: 68 });
      setSeedPacketPos({ x: 15, y: 65 });

      walkCharacterTo(42, 62, () => {
        setActivityState('interacting');
        setHeldPropEmoji('🌱');
        setOverrideActionState('playing');
        if (isGardenLocation(currentRoom)) {
          setActiveActivityInstruction(
            'Gunakan Sekop 🪏 untuk menggali petak tanah, pilih bibit dari Rak Bibit 🌱, dan siram dengan Gembor Air 🚿!'
          );
        } else if (subAction === 'inspect_bug') {
          setActiveActivityInstruction('Sentuh kepik/kupu-kupu kecil 🐞 di dekat tanaman untuk mengamatinya!');
        } else if (subAction === 'water_plant') {
          setActiveActivityInstruction('Seret Gembor Air 🚿 ke atas pot tanaman untuk menyiram bunga!');
        } else if (subAction === 'pick_flower') {
          setActiveActivityInstruction('Bunga sudah mekar indah! Sentuh bunga 🌸 di pot untuk memetiknya!');
        } else {
          setActiveActivityInstruction(
            'Langkah 1: Sentuh Pot Tanah 🪴 untuk menggali, lalu seret Kantong Bibit 🌱 & Gembor Air 🚿!'
          );
        }
      });
      return;
    }

    if (type === 'playground') {
      setActiveActivityTitle(customTitle || 'Bermain di Taman Bermain');
      setActiveActivityIcon(customIcon || '🛝');
      if (subAction === 'slide') {
        const curExtraW = Math.max(0, stageWidth - STAGE_DESIGN_WIDTH);
        const slideEntryX = Math.max(14, Math.min(50, ((18 + Math.round(curExtraW * 0.12) + 36) / stageWidth) * 100));
        walkCharacterTo(slideEntryX, 54, () => {
          setActiveActivityInstruction('Karakter memanjat tangga perosotan dan meluncur turun dengan gembira! 🛝');
          startSlideRide();
        });
      } else if (subAction === 'swing') {
        const curExtraW = Math.max(0, stageWidth - STAGE_DESIGN_WIDTH);
        const swingEntryX = Math.max(50, Math.min(86, ((222 + Math.round(curExtraW * 0.85) + 74) / stageWidth) * 100));
        walkCharacterTo(swingEntryX, 56, () => {
          setActiveActivityInstruction('Karakter duduk di ayunan dan berayun seru! Klik Dorong untuk mengayun lebih tinggi!');
          startSwingRide();
        });
      } else if (subAction === 'seesaw') {
        const curExtraW = Math.max(0, stageWidth - STAGE_DESIGN_WIDTH);
        const seesawEntryX = Math.max(18, Math.min(72, ((92 + Math.round(curExtraW * 0.5) + 36) / stageWidth) * 100));
        walkCharacterTo(seesawEntryX, 62, () => {
          setActiveActivityInstruction('Karakter duduk di jungkat-jungkit! Seret ujung kanan jungkat-jungkit ke bawah untuk bermain! ⚖️');
          startSeesawRide();
        });
      } else if (currentRoom === 'beach') {
        startBeachSandcastleHere();
      } else {
        walkCharacterTo(48, 68, () => {
          startSandcastleBuild();
        });
      }
      return;
    }

    if (type === 'picnic') {
      setActiveActivityTitle(customTitle || 'Piknik di Taman');
      setActiveActivityIcon(customIcon || '🧺');
      setPicnicBlanketLaid(true);
      walkCharacterTo(54, 65, () => {
        setActivityState('playing');
        setOverrideActionState('eating');
        setActiveActivityInstruction('Sentuh makanan di atas Tikar Piknik 🧺 untuk makan bersama di alam terbuka!');
      });
      return;
    }

    if (type === 'nature') {
      setActiveActivityTitle(customTitle || 'Eksplorasi Alam');
      setActiveActivityIcon(customIcon || '🦋');
      walkCharacterTo(48, 60, () => {
        setActivityState('playing');
        setOverrideActionState('curious_head_tilt');
        completeInWorldActivity(
          'nature',
          subAction || 'observe_nature',
          customTitle || 'Mengamati Kupu-Kupu & Burung',
          customIcon || '🦋',
          26,
          30,
          15,
          'big_smile',
          'Indahnya kupu-kupu dan kicau burung di udara segar luar ruangan! 🦋🐦🌿'
        );
      });
    }
  };

  // Trigger external activity commands sent from the Play Tray or "Let's Play!" button in App.tsx
  useEffect(() => {
    if (!externalActivityCommand) return;
    startInWorldObjectActivity(
      externalActivityCommand.type,
      externalActivityCommand.subAction || 'default',
      externalActivityCommand.title,
      externalActivityCommand.icon,
      externalActivityCommand.activityDefId
    );
  }, [externalActivityCommand]);

  // Furniture items equipped
  const wallItem =
    STORE_ITEMS.find((i) => i.id === roomDecor.wallpaper) ||
    STORE_ITEMS.find((i) => i.id === 'wall_warm_cream')!;
  const cribItem =
    STORE_ITEMS.find((i) => i.id === roomDecor.crib) ||
    STORE_ITEMS.find((i) => i.id === 'crib_classic_wood')!;
  const rugItem =
    STORE_ITEMS.find((i) => i.id === roomDecor.rug) ||
    STORE_ITEMS.find((i) => i.id === 'rug_mint_stripes')!;
  const lampItem =
    STORE_ITEMS.find((i) => i.id === roomDecor.lamp) ||
    STORE_ITEMS.find((i) => i.id === 'lamp_crescent_moon')!;
  const wallDecorItem =
    STORE_ITEMS.find((i) => i.id === roomDecor.wallDecor) ||
    STORE_ITEMS.find((i) => i.id === 'decor_bunting_pastel')!;
  const plushItem = roomDecor.plushDecor
    ? STORE_ITEMS.find((i) => i.id === roomDecor.plushDecor)
    : null;

  // Room-specific 2.5D lighting & surface palettes for all 13 Indoor, Garden & Outdoor Locations
  const getRoomWallColors = () => {
    const locMeta = getWorldLocationMeta(currentRoom);
    if (currentRoom === 'bedroom') {
      return {
        left: wallItem.primaryColor,
        right: wallItem.secondaryColor,
        floorTop: '#F3D9B1',
        floorBottom: '#D9B382',
      };
    }
    return {
      left: locMeta.skyOrWallLeft,
      right: locMeta.skyOrWallRight,
      floorTop: locMeta.groundTop,
      floorBottom: locMeta.groundBottom,
    };
  };

  const colors = getRoomWallColors();
  const isOutdoor = isOutdoorLocation(currentRoom);
  const isGarden = isGardenLocation(currentRoom);
  const currentLocationMeta = getWorldLocationMeta(currentRoom);

  // Horizontal distribution factor (0..1) so furniture spreads across wide desktop/laptop screens while keeping 1:1 width & height (never stretched sideways!)
  const extraStageWidth = Math.max(0, stageWidth - STAGE_DESIGN_WIDTH);
  const getObjectHorizontalAnchorFactor = (id: string): number => {
    switch (id) {
      case 'wardrobe_3d':
      case 'play_window':
      case 'garden_corner':
      case 'fridge_3d':
      case 'mirror_sink':
      case 'toilet_3d':
      case 'living_window':
      case 'seed_house':
      case 'slide_3d':
      case 'beach_umbrella':
        return 0.08;
      case 'beach_picnic_mat':
        return 0.12;
      case 'window_back':
        return 0.38;
      case 'wall_clock_painting':
        return 0.62;
      case 'nightstand_lamp':
      case 'bed_main':
        return 0.72;
      case 'wall_shelf':
      case 'toy_book_shelf':
      case 'highchair_3d':
      case 'towel_rack':
      case 'standing_lamp_plant':
      case 'swing_3d':
      case 'beach_sandcastle_spot':
      case 'seashell_shore':
      case 'angklung_rack':
        return 0.85;
      default:
        return 0.5;
    }
  };

  // REQUIREMENT I: Sort room scene objects by layer (10, 20, 30) and then by vertical Y position, shifting X proportionally on wider desktop stages without altering lebar/tinggi
  const sortedRoomObjects = [...(ROOM_SCENE_OBJECTS[currentRoom] || [])]
    .map((obj) => {
      const dx = Math.round(extraStageWidth * getObjectHorizontalAnchorFactor(obj.id));
      return {
        ...obj,
        x: obj.x + dx,
        dotX: obj.dotX !== undefined ? obj.dotX + dx : undefined,
      };
    })
    .sort((a, b) => a.lapisan - b.lapisan || a.y + a.tinggi - (b.y + b.tinggi));

  // Whether the character is currently sleeping or lying inside bed_main in the bedroom
  const effectiveInCrib =
    currentRoom === 'bedroom' &&
    (isSleeping || inCrib || (overrideActionState || actionState) === 'sleeping');

  // Exact stage coordinates for the character lying horizontally on bed_main's mattress & pillow (neck/collar pivot at x_local=96, y_local=66 so head rests at x_local=50..94 on pillow)
  const bedObj = sortedRoomObjects.find((o) => o.id === 'bed_main');
  const bedSleepPos = bedObj
    ? {
        x: Number((((bedObj.x + 96) / stageWidth) * 100).toFixed(2)),
        y: Number((((bedObj.y + 66) / STAGE_DESIGN_HEIGHT) * 100).toFixed(2)),
      }
    : { x: 65, y: 45.8 };

  // Exact bathtub X position for aligning Bathtub Layer 3 and the shower hose on any screen width
  const bathtubObj = sortedRoomObjects.find((o) => o.id === 'bathtub_back');
  const bathtubLeftPx = bathtubObj ? bathtubObj.x : 42 + Math.round(extraStageWidth * 0.5);

  // Exact toilet X/Y position for sitting on toilet_3d in bathroom
  const toiletObj = sortedRoomObjects.find((o) => o.id === 'toilet_3d');
  const toiletSeatPos = toiletObj
    ? {
        x: Number((((toiletObj.x + 48) / stageWidth) * 100).toFixed(2)),
        y: Number((((toiletObj.y + 72) / STAGE_DESIGN_HEIGHT) * 100).toFixed(2)),
      }
    : { x: 18, y: 56 };

  // Exact playground slide, swing, seesaw, sandpit & beach object refs for synchronized physics & overlays
  const slideObj = sortedRoomObjects.find((o) => o.id === 'slide_3d');
  const swingObj = sortedRoomObjects.find((o) => o.id === 'swing_3d');
  const seesawObj = sortedRoomObjects.find((o) => o.id === 'seesaw_3d');
  const sandpitObj = sortedRoomObjects.find((o) => o.id === 'sandpit_3d');
  const beachUmbrellaObj = sortedRoomObjects.find((o) => o.id === 'beach_umbrella');
  const beachSandcastleObj = sortedRoomObjects.find((o) => o.id === 'beach_sandcastle_spot');
  const beachPicnicObj = sortedRoomObjects.find((o) => o.id === 'beach_picnic_mat');
  const beachShoreObj = sortedRoomObjects.find((o) => o.id === 'seashell_shore');
  const pendopoObj = sortedRoomObjects.find((o) => o.id === 'pendopo_joglo');
  const angklungObj = sortedRoomObjects.find((o) => o.id === 'angklung_rack');

  // Compute SVG coordinates for the dynamic curved shower hose from wall mount to showerHeadPos
  const hoseStartSvgX = bathtubLeftPx + 170;
  const hoseStartSvgY = 132;
  const hoseEndSvgX = (showerHeadPos.x / 100) * stageWidth;
  const hoseEndSvgY = (showerHeadPos.y / 100) * STAGE_DESIGN_HEIGHT;
  const hoseCtrlSvgX = (hoseStartSvgX + hoseEndSvgX) / 2 - 22;
  const hoseCtrlSvgY = Math.max(hoseStartSvgY, hoseEndSvgY) + 48;

  const handleRoomObjectClick = (obj: RoomSceneObjectDef, e: React.MouseEvent) => {
    e.stopPropagation();
    if (obj.dekorasiAtauInteraktif !== 'interaktif') return;
    sound.playClick();

    if (obj.id === 'bed_main') {
      setOpenObjectMenu({
        type: 'bed',
        x: 70,
        y: 44,
        title: 'Tempat Tidur',
        icon: '🛏️',
        options: [
          { id: 'sleep', label: 'Tidur Nyenyak', emoji: '🌙' },
          { id: 'lie_down', label: 'Berbaring Santai', emoji: '🛏️' },
          { id: 'read_bed', label: 'Membaca Buku', emoji: '📖' },
          { id: 'play_plush', label: 'Main Boneka', emoji: '🧸' },
          ...(effectiveInCrib
            ? [{ id: 'wake_up', label: 'Bangun dari Kasur', emoji: '☀️' }]
            : []),
        ],
      });
    } else if (obj.id === 'nightstand_lamp') {
      setOpenObjectMenu({
        type: 'bed',
        x: 38,
        y: 38,
        title: 'Meja & Lampu Tidur',
        icon: '💡',
        options: [
          { id: 'action_toggle_lamp', label: 'Nyalakan / Redupkan Lampu', emoji: '💡' },
          { id: 'sleep', label: 'Tidur Malam Nyenyak', emoji: '🌙' },
          { id: 'read_bed', label: 'Baca Dongeng Malam', emoji: '📖' },
          { id: 'lie_down', label: 'Istirahat di Kasur', emoji: '🛏️' },
        ],
      });
    } else if (obj.id === 'wardrobe_3d') {
      setOpenObjectMenu({
        type: 'toybox',
        x: 24,
        y: 34,
        title: 'Lemari Pakaian 3D',
        icon: '👗',
        options: [
          { id: 'action_admire_clothes', label: 'Pilih Baju Bersih', emoji: '👕' },
          { id: 'action_mirror_pose', label: 'Bergaya Ceria', emoji: '✨' },
          { id: 'tidy_toys', label: 'Rapikan Isi Lemari', emoji: '🧺' },
          { id: 'stack_blocks', label: 'Susun Kotak Mainan', emoji: '🧱' },
        ],
      });
    } else if (obj.id === 'wall_shelf' || obj.id === 'toy_book_shelf') {
      setOpenObjectMenu({
        type: 'bookshelf',
        x: 55,
        y: 35,
        title: 'Rak Buku & Mainan',
        icon: '📚',
        options: [
          { id: 'pick_book_1', label: 'Kisah Si Kancil', emoji: '🦌' },
          { id: 'pick_book_2', label: 'Bintang & Angka', emoji: '🌟' },
          { id: 'pick_book_3', label: 'Dongeng Nusantara', emoji: '🏝️' },
          { id: 'read_now', label: 'Langsung Membaca', emoji: '📖' },
          { id: 'action_stack_blocks', label: 'Susun Menara Balok', emoji: '🧱' },
          { id: 'action_tidy_toys', label: 'Rapikan Mainan', emoji: '🧺' },
        ],
      });
    } else if (obj.id === 'upper_cabinet') {
      setShowRecipeBookDrawer((v) => !v);
    } else if (obj.id === 'fridge_3d') {
      setFridgeOpen((v) => !v);
    } else if (obj.id === 'kitchen_counter') {
      setOpenObjectMenu({
        type: 'kitchen',
        x: 54,
        y: 36,
        title: 'Meja Dapur & Kompor',
        icon: '🍳',
        options: [
          {
            id: activeRecipeId,
            label: `Masak ${activeRecipeDef.indonesianTitle}`,
            emoji: activeRecipeDef.iconEmoji,
          },
          { id: 'action_open_recipes', label: 'Buka Buku 12 Resep', emoji: '📖' },
          { id: 'action_open_fridge', label: 'Buka Kulkas 3 Rak', emoji: '🧊' },
          {
            id: 'action_wash_sink',
            label: dirtyPlateCount > 0 ? `Cuci Piring (${dirtyPlateCount})` : 'Cuci Bahan di Wastafel',
            emoji: '🚰',
          },
        ],
      });
    } else if (obj.id === 'highchair_3d') {
      setOpenObjectMenu({
        type: 'kitchen',
        x: 78,
        y: 48,
        title: 'Kursi Makan Bayi',
        icon: '🍽️',
        options: [
          ...(kitchenFoodStage === 'served'
            ? [
                {
                  id: 'action_eat_served',
                  label: `Suapi ${activeRecipeDef.indonesianTitle}`,
                  emoji: activeRecipeDef.iconEmoji,
                },
              ]
            : []),
          { id: 'action_feed_milk', label: 'Minum Susu Hangat', emoji: '🍼' },
          { id: 'action_feed_porridge', label: 'Makan Bubur Bergizi', emoji: '🥣' },
          {
            id: 'action_toggle_highchair',
            label: inHighChair ? 'Turun dari Kursi Makan' : 'Duduk di Kursi Makan',
            emoji: '🪑',
          },
          { id: 'action_open_fridge', label: 'Ambil Makanan Kulkas', emoji: '🧊' },
        ],
      });
    } else if (obj.id === 'towel_rack') {
      setOpenObjectMenu({
        type: 'bed',
        x: 74,
        y: 28,
        title: 'Gantungan Handuk Hangat',
        icon: '🧺',
        options: [
          { id: 'action_towel_dry', label: 'Keringkan Tubuh Bayi', emoji: '🧺' },
          { id: 'action_bath_face', label: 'Lap Wajah Segar', emoji: '💧' },
          { id: 'action_bath_hands', label: 'Cuci Tangan Bersih', emoji: '🫧' },
          { id: 'action_bath_full', label: 'Mandi Bersih Wangi', emoji: '🛁' },
        ],
      });
    } else if (obj.id === 'toilet_3d') {
      setOpenObjectMenu({
        type: 'bed',
        x: 24,
        y: 46,
        title: 'Toilet Kamar Mandi',
        icon: '🚽',
        options: [
          { id: 'action_toilet_pee', label: 'Buang Air Kecil (BAK -20% Bersih)', emoji: '💦' },
          { id: 'action_toilet_poop', label: 'Buang Air Besar (BAB -32% Bersih)', emoji: '💩' },
          { id: 'action_enter_tub', label: 'Pindah ke Bak Mandi & Bersihkan', emoji: '🛁' },
          { id: 'action_bath_hands', label: 'Cuci Tangan dengan Sabun', emoji: '🧼' },
        ],
      });
    } else if (obj.id === 'bathtub_back') {
      setOpenObjectMenu({
        type: 'bed',
        x: 52,
        y: 56,
        title: 'Bak Mandi Busa 3 Lapis',
        icon: '🛁',
        options: [
          { id: 'action_enter_tub', label: 'Masuk ke Bak Mandi', emoji: '🛁' },
          { id: 'action_bath_full', label: 'Mandi Busa Sabun', emoji: '🧼' },
          { id: 'action_bath_rinse', label: 'Bilas Air Shower Hangat', emoji: '🚿' },
          { id: 'action_towel_dry', label: 'Keringkan dengan Handuk', emoji: '🧺' },
        ],
      });
    } else if (obj.id === 'garden_corner') {
      setOpenObjectMenu({
        type: 'garden',
        x: 30,
        y: 48,
        title: 'Sudut Taman & Tanaman',
        icon: '🌱',
        options: [
          { id: 'plant_seed', label: 'Menanam Bibit', emoji: '🌱' },
          { id: 'water_plant', label: 'Menyiram Tanaman', emoji: '🚿' },
          { id: 'dig_soil', label: 'Menggali Tanah', emoji: '🪴' },
          { id: 'pick_flower', label: 'Memetik Bunga', emoji: '🌸' },
          { id: 'inspect_bug', label: 'Amati Kepik Kecil', emoji: '🐞' },
        ],
      });
    } else if (obj.id === 'sofa_3d') {
      setOpenObjectMenu({
        type: 'teddy',
        x: 62,
        y: 44,
        title: 'Sofa Ruang Keluarga',
        icon: '🛋️',
        options: [
          { id: 'action_sofa_relax', label: 'Duduk Bersantai', emoji: '🛋️' },
          { id: 'hug_teddy', label: 'Peluk Boneka Teddy', emoji: '🧸' },
          { id: 'action_read_book', label: 'Baca Buku Bersama', emoji: '📖' },
          { id: 'action_play_cilukba', label: 'Main Cilukba Keluarga', emoji: '🙈' },
        ],
      });
    } else if (obj.id === 'seed_house') {
      setShowSeedRackDrawer((v) => !v);
    } else if (obj.id === 'picnic_mat') {
      setOpenObjectMenu({
        type: 'picnic',
        x: 56,
        y: 54,
        title: 'Tikar Piknik & Keranjang Bekal',
        icon: '🧺',
        options: [
          { id: 'action_eat_picnic', label: 'Makan Bekal & Buah Segar', emoji: '🍓' },
          { id: 'eat_picnic', label: 'Siapkan Hidangan Piknik', emoji: '🧺' },
          { id: 'action_observe_butterfly', label: 'Amati Kupu-Kupu Taman', emoji: '🦋' },
          { id: 'action_kick_ball', label: 'Main Bola di Rumput', emoji: '⚽' },
        ],
      });
    } else if (
      obj.id === 'slide_3d' ||
      obj.id === 'swing_3d' ||
      obj.id === 'seesaw_3d' ||
      obj.id === 'sandpit_3d'
    ) {
      setOpenObjectMenu({
        type: 'playground',
        x: 50,
        y: 44,
        title: 'Wahana Taman Bermain',
        icon: '🛝',
        options: [
          { id: 'seesaw', label: 'Naik Jungkat-Jungkit', emoji: '⚖️' },
          { id: 'slide', label: 'Meluncur di Perosotan', emoji: '🛝' },
          { id: 'swing', label: 'Bermain Ayunan Taman', emoji: '🎠' },
          { id: 'sandpit', label: 'Bangun Istana Pasir', emoji: '🏰' },
        ],
      });
    } else if (
      obj.id === 'beach_umbrella' ||
      obj.id === 'beach_sandcastle_spot' ||
      obj.id === 'beach_picnic_mat' ||
      obj.id === 'seashell_shore'
    ) {
      setOpenObjectMenu({
        type: 'playground',
        x: 52,
        y: 46,
        title: 'Aktivitas Pantai Ceria',
        icon: '🏖️',
        options: [
          { id: 'action_beach_relax', label: 'Bersantai di Bawah Payung Pantai', emoji: '🏖️' },
          { id: 'sandpit', label: 'Bangun Istana Pasir dari Awal', emoji: '🏰' },
          { id: 'action_beach_picnic', label: 'Makan Piknik (Kue, Buah & Jus)', emoji: '🧺' },
          { id: 'action_dig_shells', label: 'Gali Pasir & Kumpulkan Kerang Aceh', emoji: '🐚' },
        ],
      });
    } else if (obj.id === 'pendopo_joglo' || obj.id === 'angklung_rack') {
      setOpenObjectMenu({
        type: 'nature',
        x: obj.id === 'angklung_rack' ? 68 : 50,
        y: obj.id === 'angklung_rack' ? 56 : 38,
        title:
          obj.id === 'angklung_rack'
            ? 'Rak Angklung Bambu Nusantara'
            : 'Pendopo Joglo Desa Budaya',
        icon: obj.id === 'angklung_rack' ? '🎶' : '🏛️',
        options: [
          { id: 'action_play_angklung', label: 'Main & Goyangkan Angklung', emoji: '🎶' },
          { id: 'action_dance_nusantara', label: 'Menari Tradisional di Pendopo', emoji: '💃' },
          { id: 'action_read_book', label: 'Baca Dongeng Nusantara', emoji: '📖' },
          { id: 'observe_nature', label: 'Jelajahi Taman Melati', emoji: '🌺' },
        ],
      });
    }
  };

  // Render an individual room object inside the 390x620 stage coordinate space
  const renderPortraitRoomObjectSvg = (obj: RoomSceneObjectDef) => {
    switch (obj.id) {
      case 'window_back':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            <rect x="3" y="4" width={obj.lebar} height={obj.tinggi} rx="10" fill="rgba(45,37,32,0.14)" />
            <rect
              x="0"
              y="0"
              width={obj.lebar}
              height={obj.tinggi}
              rx="10"
              fill={isSleeping ? '#0F172A' : '#BAE6FD'}
              stroke="#92400E"
              strokeWidth="5"
            />
            {isSleeping ? (
              <g>
                <circle cx="28" cy="28" r="11" fill="#FDE047" />
                <circle cx="34" cy="24" r="9" fill="#0F172A" />
                <circle cx="68" cy="24" r="2" fill="#FEF08A" />
                <circle cx="74" cy="56" r="2.5" fill="#FEF08A" />
              </g>
            ) : (
              <g>
                <circle cx="70" cy="26" r="13" fill="#FDE047" />
                <ellipse cx="32" cy="64" rx="20" ry="9" fill="#FFFFFF" opacity="0.92" />
                <ellipse cx="66" cy="76" rx="22" ry="10" fill="#FFFFFF" opacity="0.88" />
              </g>
            )}
            <line x1={obj.lebar / 2} y1="0" x2={obj.lebar / 2} y2={obj.tinggi} stroke="#92400E" strokeWidth="4" />
            <line x1="0" y1={obj.tinggi / 2} x2={obj.lebar} y2={obj.tinggi / 2} stroke="#92400E" strokeWidth="4" />
            <rect x="-6" y={obj.tinggi - 2} width={obj.lebar + 12} height="8" rx="3" fill="#FEF3C7" stroke="#2D2520" strokeWidth="2" />
            <path d={`M -4 0 Q 16 ${obj.tinggi / 2} -4 ${obj.tinggi} L -10 ${obj.tinggi} L -10 0 Z`} fill="#A7F3D0" stroke="#2D2520" strokeWidth="2" />
            <path d={`M ${obj.lebar + 4} 0 Q ${obj.lebar - 16} ${obj.tinggi / 2} ${obj.lebar + 4} ${obj.tinggi} L ${obj.lebar + 10} ${obj.tinggi} L ${obj.lebar + 10} 0 Z`} fill="#A7F3D0" stroke="#2D2520" strokeWidth="2" />
          </g>
        );

      case 'wall_clock_painting':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {/* Jam Dinding Utuh */}
            <circle cx="31" cy="24" r="21" fill="rgba(45,37,32,0.14)" />
            <circle cx="29" cy="22" r="20" fill="#FFFBEB" stroke="#92400E" strokeWidth="3.5" />
            <circle cx="29" cy="22" r="16" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.5" />
            <line x1="29" y1="22" x2="29" y2="11" stroke="#2D2520" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="29" y1="22" x2="38" y2="22" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
            <circle cx="29" cy="22" r="2.5" fill="#2D2520" />
            {/* Bingkai Lukisan Utuh */}
            <g transform="translate(2, 50)">
              <rect x="2" y="3" width="54" height="40" rx="5" fill="rgba(45,37,32,0.14)" />
              <rect x="0" y="0" width="54" height="40" rx="5" fill="#FDE68A" stroke="#78350F" strokeWidth="3" />
              <rect x="5" y="5" width="44" height="30" rx="2" fill="#BAE6FD" />
              <circle cx="16" cy="15" r="5" fill="#FBBF24" />
              <path d="M 6 34 Q 20 20 34 34 Z" fill="#34D399" />
              <path d="M 22 34 Q 36 22 48 34 Z" fill="#10B981" />
            </g>
          </g>
        );

      case 'wall_shelf':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {/* Bunting Flags Above Shelf */}
            <path d="M 0 4 Q 65 24 130 4" fill="none" stroke="#78350F" strokeWidth="2" />
            <polygon points="14,7 28,10 21,28" fill="#FF8FAB" stroke="#2D2520" strokeWidth="1.5" />
            <polygon points="44,12 58,13 51,31" fill="#A7F3D0" stroke="#2D2520" strokeWidth="1.5" />
            <polygon points="74,13 88,12 81,31" fill="#FDE047" stroke="#2D2520" strokeWidth="1.5" />
            <polygon points="102,10 116,7 109,28" fill="#93C5FD" stroke="#2D2520" strokeWidth="1.5" />
            {/* 3D Wall Shelf */}
            <g transform="translate(4, 34)">
              <rect x="2" y="30" width="120" height="6" rx="2" fill="rgba(45,37,32,0.15)" />
              <polygon points="0,22 10,15 126,15 116,22" fill="#FCD34D" stroke="#2D2520" strokeWidth="2" />
              <polygon points="116,22 126,15 126,25 116,32" fill="#78350F" stroke="#2D2520" strokeWidth="2" />
              <rect x="0" y="22" width="116" height="10" rx="2" fill="#B45309" stroke="#2D2520" strokeWidth="2" />
              <rect x="12" y="-2" width="12" height="24" rx="2" fill="#EF4444" stroke="#2D2520" strokeWidth="1.8" />
              <rect x="26" y="1" width="12" height="21" rx="2" fill="#3B82F6" stroke="#2D2520" strokeWidth="1.8" />
              <rect x="40" y="-3" width="13" height="25" rx="2" fill="#10B981" stroke="#2D2520" strokeWidth="1.8" />
              <rect x="68" y="3" width="18" height="19" rx="3" fill="#38BDF8" stroke="#2D2520" strokeWidth="1.8" />
              <rect x="90" y="5" width="18" height="17" rx="3" fill="#FF8FAB" stroke="#2D2520" strokeWidth="1.8" />
            </g>
          </g>
        );

      case 'wardrobe_3d':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {/* Contact Shadow on Floor */}
            <ellipse cx="44" cy="182" rx="48" ry="12" fill="url(#furnitureShadow)" />
            {/* Top Face */}
            <polygon points="0,12 16,0 90,0 74,12" fill="#FEF08A" stroke="#2D2520" strokeWidth="2.4" />
            {/* Right Depth Face */}
            <polygon points="74,12 90,0 90,166 74,178" fill="#D97706" stroke="#2D2520" strokeWidth="2.4" />
            {/* Front Face */}
            <rect x="0" y="12" width="74" height="166" rx="5" fill="#FDE68A" stroke="#2D2520" strokeWidth="2.8" />
            <rect x="6" y="20" width="28" height="112" rx="4" fill="#FEF3C7" stroke="#B45309" strokeWidth="2" />
            <rect x="40" y="20" width="28" height="112" rx="4" fill="#FEF3C7" stroke="#B45309" strokeWidth="2" />
            <circle cx="29" cy="76" r="3" fill="#D97706" stroke="#2D2520" strokeWidth="1.2" />
            <circle cx="45" cy="76" r="3" fill="#D97706" stroke="#2D2520" strokeWidth="1.2" />
            <rect x="6" y="138" width="62" height="30" rx="4" fill="#FCD34D" stroke="#2D2520" strokeWidth="2" />
            <circle cx="24" cy="153" r="2.8" fill="#92400E" />
            <circle cx="50" cy="153" r="2.8" fill="#92400E" />
          </g>
        );

      case 'nightstand_lamp':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {/* Lamp Warm Glow */}
            <circle cx="23" cy="26" r="54" fill="url(#lampWarmGlow)" pointerEvents="none" />
            {/* Lamp Shade & Stand */}
            <rect x="20" y="34" width="6" height="28" rx="2" fill="#78350F" stroke="#2D2520" strokeWidth="1.8" />
            <ellipse cx="23" cy="62" rx="12" ry="4" fill="#92400E" stroke="#2D2520" strokeWidth="1.8" />
            <path d="M 7 36 L 14 10 L 32 10 L 39 36 Z" fill={lampItem.primaryColor} stroke="#2D2520" strokeWidth="2.4" />
            {/* 3D Nightstand Table */}
            <g transform="translate(0, 56)">
              <ellipse cx="24" cy="64" rx="26" ry="8" fill="url(#furnitureShadow)" />
              <polygon points="0,8 10,0 48,0 38,8" fill="#FCD34D" stroke="#2D2520" strokeWidth="2.2" />
              <polygon points="38,8 48,0 48,52 38,60" fill="#92400E" stroke="#2D2520" strokeWidth="2.2" />
              <rect x="0" y="8" width="38" height="52" rx="4" fill="#D97706" stroke="#2D2520" strokeWidth="2.4" />
              <rect x="5" y="15" width="28" height="17" rx="3" fill="#FEF3C7" stroke="#2D2520" strokeWidth="1.6" />
              <circle cx="19" cy="23.5" r="2.5" fill="#92400E" />
              <rect x="5" y="36" width="28" height="17" rx="3" fill="#FEF3C7" stroke="#2D2520" strokeWidth="1.6" />
              <circle cx="19" cy="44.5" r="2.5" fill="#92400E" />
            </g>
          </g>
        );

      case 'bed_main':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {hoveredDropZone === 'crib' && (
              <ellipse
                cx="107"
                cy="105"
                rx="112"
                ry="54"
                fill="rgba(253, 224, 71, 0.30)"
                stroke="#F59E0B"
                strokeWidth="3"
                strokeDasharray="8 6"
              />
            )}
            {/* REQUIREMENT E.1: Bed is ~55% of stage width (214px), placed on floor with wall gap & floor shadow */}
            <ellipse cx="108" cy="146" rx="108" ry="22" fill="url(#furnitureShadow)" />
            {/* Headboard on Left (3D Top, Right, Front Faces) */}
            <polygon points="4,22 20,10 52,10 36,22" fill="#FDE68A" stroke="#2D2520" strokeWidth="2.4" />
            <polygon points="36,22 52,10 52,126 36,138" fill="#92400E" stroke="#2D2520" strokeWidth="2.4" />
            <rect x="4" y="22" width="32" height="116" rx="7" fill={cribItem.primaryColor} stroke="#2D2520" strokeWidth="2.8" />
            <circle cx="20" cy="44" r="6" fill="#FEF08A" stroke="#2D2520" strokeWidth="1.6" />
            {/* 3/4 Perspective Mattress Top Surface */}
            <polygon points="24,86 52,58 210,58 182,86" fill="#FFFDF9" stroke="#2D2520" strokeWidth="2.5" />
            <polygon points="78,86 104,58 206,58 180,86" fill="#FEF9C3" opacity="0.75" />
            {/* Pillow on Mattress Head (x_local=34..98, framing the sleeping head at x_local=50..94) */}
            <g transform="translate(34, 48)">
              <polygon points="0,28 16,8 64,8 48,28" fill="#FFFFFF" stroke="#64748B" strokeWidth="2.2" />
              <rect x="0" y="28" width="48" height="8" rx="4" fill="#E2E8F0" stroke="#64748B" strokeWidth="1.8" />
            </g>
            {/* Folded Green Blanket when Baby is NOT in Bed */}
            {!effectiveInCrib && (
              <g>
                <polygon points="102,86 126,60 206,60 182,86" fill="#34D399" stroke="#2D2520" strokeWidth="2.2" />
                <rect x="102" y="86" width="80" height="16" rx="4" fill="#10B981" stroke="#2D2520" strokeWidth="2.2" />
              </g>
            )}
            {/* Front Mattress Rim & Wooden Bed Frame */}
            <rect x="24" y="86" width="158" height="16" rx="4" fill="#F1F5F9" stroke="#2D2520" strokeWidth="2.2" />
            <rect x="20" y="100" width="164" height="36" rx="7" fill={cribItem.primaryColor} stroke="#2D2520" strokeWidth="2.8" />
            {/* Right Depth Face of Bed Frame */}
            <polygon points="184,100 212,72 212,108 184,136" fill="#92400E" stroke="#2D2520" strokeWidth="2.6" />
            <polygon points="182,86 210,58 210,74 182,102" fill="#CBD5E1" stroke="#2D2520" strokeWidth="2.2" />
            {/* 4 Wooden Bed Legs */}
            <rect x="26" y="135" width="12" height="18" rx="3" fill="#78350F" stroke="#2D2520" strokeWidth="2" />
            <rect x="166" y="135" width="12" height="18" rx="3" fill="#78350F" stroke="#2D2520" strokeWidth="2" />
            <rect x="196" y="106" width="11" height="16" rx="3" fill="#451A03" stroke="#2D2520" strokeWidth="2" />
          </g>
        );

      case 'rug_floor':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {/* REQUIREMENT E.3: Flat Perspective Carpet on Floor (No orange broken fence!) */}
            <polygon
              points={`0,${obj.tinggi} 34,0 ${obj.lebar},0 ${obj.lebar - 34},${obj.tinggi}`}
              fill={rugItem.primaryColor}
              stroke="#2D2520"
              strokeWidth="2.8"
            />
            <polygon
              points={`22,${obj.tinggi - 14} 48,14 ${obj.lebar - 22},14 ${obj.lebar - 48},${obj.tinggi - 14}`}
              fill={rugItem.secondaryColor}
              opacity="0.92"
            />
            <ellipse
              cx={obj.lebar / 2}
              cy={obj.tinggi / 2}
              rx={obj.lebar * 0.3}
              ry={obj.tinggi * 0.24}
              fill="none"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="2"
              strokeDasharray="6 5"
            />
          </g>
        );

      case 'upper_cabinet':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            <rect x="3" y="5" width={obj.lebar} height={obj.tinggi} rx="7" fill="rgba(45,37,32,0.14)" />
            <polygon points={`0,6 10,0 ${obj.lebar + 10},0 ${obj.lebar},6`} fill="#FEF3C7" stroke="#2D2520" strokeWidth="2" />
            <rect x="0" y="6" width={obj.lebar} height={obj.tinggi - 6} rx="6" fill="#FFFBEB" stroke="#2D2520" strokeWidth="2.6" />
            <line x1="74" y1="6" x2="74" y2={obj.tinggi} stroke="#2D2520" strokeWidth="2.2" />
            <line x1="148" y1="6" x2="148" y2={obj.tinggi} stroke="#2D2520" strokeWidth="2.2" />
            <rect x="64" y="28" width="4" height="20" rx="2" fill="#D97706" />
            <rect x="82" y="28" width="4" height="20" rx="2" fill="#D97706" />
            {/* Built-in Microwave */}
            <rect x="156" y="16" width="66" height="46" rx="5" fill="#334155" stroke="#2D2520" strokeWidth="2.2" />
            <rect x="162" y="22" width="42" height="34" rx="3" fill="#FEF08A" stroke="#2D2520" strokeWidth="1.6" />
            <circle cx="212" cy="30" r="3" fill="#34D399" />
            <circle cx="212" cy="42" r="3" fill="#38BDF8" />
          </g>
        );

      case 'fridge_3d':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            <ellipse cx="46" cy="212" rx="50" ry="13" fill="url(#furnitureShadow)" />
            <polygon points="0,12 16,0 94,0 78,12" fill="#D1FAE5" stroke="#2D2520" strokeWidth="2.4" />
            <polygon points="78,12 94,0 94,196 78,208" fill="#34D399" stroke="#2D2520" strokeWidth="2.4" />
            <rect x="0" y="12" width="78" height="196" rx="8" fill="#A7F3D0" stroke="#2D2520" strokeWidth="2.8" />
            <line x1="2" y1="84" x2="76" y2="84" stroke="#2D2520" strokeWidth="2.4" />
            <rect x="64" y="34" width="6" height="34" rx="3" fill="#FFFFFF" stroke="#2D2520" strokeWidth="1.6" />
            <rect x="64" y="98" width="6" height="46" rx="3" fill="#FFFFFF" stroke="#2D2520" strokeWidth="1.6" />
            <rect x="14" y="26" width="22" height="18" rx="3" fill="#FEF08A" stroke="#2D2520" strokeWidth="1.5" />
            <circle cx="25" cy="28" r="3" fill="#EF4444" />
          </g>
        );

      case 'kitchen_counter':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            <ellipse cx="122" cy="158" rx="126" ry="16" fill="url(#furnitureShadow)" />
            <polygon points="0,16 18,0 248,0 230,16" fill="#FDBA74" stroke="#2D2520" strokeWidth="2.5" />
            <rect x="0" y="16" width="230" height="10" rx="2" fill="#D97706" stroke="#2D2520" strokeWidth="2.2" />
            <rect x="4" y="26" width="222" height="122" rx="6" fill="#FFFBEB" stroke="#2D2520" strokeWidth="2.8" />
            <polygon points="226,26 244,10 244,132 226,148" fill="#D97706" stroke="#2D2520" strokeWidth="2.4" />
            {/* Sink on Left of Counter */}
            <ellipse cx="46" cy="10" rx="26" ry="6" fill="#BAE6FD" stroke="#2D2520" strokeWidth="2" />
            <path d="M 46 8 L 46 -8 Q 46 -16 54 -12" fill="none" stroke="#64748B" strokeWidth="3.5" strokeLinecap="round" />
            {/* Stove & Red Cooking Pot in Center */}
            <rect x="92" y="3" width="66" height="11" rx="3" fill="#334155" stroke="#2D2520" strokeWidth="2" />
            <rect x="104" y="-18" width="42" height="22" rx="5" fill="#EF4444" stroke="#2D2520" strokeWidth="2.2" />
            <ellipse cx="125" cy="-18" rx="21" ry="5" fill="#FCA5A5" stroke="#2D2520" strokeWidth="2" />
            {/* Cutting Board & Fruit Bowl on Right */}
            <rect x="174" y="3" width="42" height="10" rx="3" fill="#FDE68A" stroke="#2D2520" strokeWidth="1.8" />
            <circle cx="190" cy="0" r="6" fill="#EF4444" stroke="#2D2520" strokeWidth="1.5" />
            <circle cx="202" cy="1" r="5.5" fill="#F97316" stroke="#2D2520" strokeWidth="1.5" />
            {/* Cabinet Doors */}
            <rect x="14" y="36" width="62" height="100" rx="4" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
            <rect x="84" y="36" width="66" height="100" rx="4" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
            <rect x="158" y="36" width="58" height="100" rx="4" fill="#FEF3C7" stroke="#D97706" strokeWidth="2" />
          </g>
        );

      case 'highchair_3d':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            <ellipse cx="46" cy="154" rx="44" ry="12" fill="url(#furnitureShadow)" />
            <line x1="24" y1="84" x2="12" y2="150" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
            <line x1="68" y1="84" x2="80" y2="150" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
            <rect x="18" y="18" width="56" height="58" rx="10" fill="#FDE047" stroke="#2D2520" strokeWidth="2.6" />
            <rect x="10" y="64" width="72" height="14" rx="5" fill="#FFFDF9" stroke="#2D2520" strokeWidth="2.4" />
            <ellipse cx="46" cy="62" rx="14" ry="5" fill="#FF8FAB" stroke="#2D2520" strokeWidth="1.8" />
          </g>
        );

      case 'kitchen_rug':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            <polygon
              points={`0,${obj.tinggi} 26,0 ${obj.lebar},0 ${obj.lebar - 26},${obj.tinggi}`}
              fill="#FED7AA"
              stroke="#2D2520"
              strokeWidth="2.5"
            />
            <polygon
              points={`18,${obj.tinggi - 12} 38,12 ${obj.lebar - 18},12 ${obj.lebar - 38},${obj.tinggi - 12}`}
              fill="#FFEDD5"
            />
          </g>
        );

      case 'mirror_sink':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {/* REQUIREMENT F.6: Cermin & Wastafel Utuh di Dalam Stage */}
            {/* Oval Mirror */}
            <ellipse cx="56" cy="40" rx="30" ry="36" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="4.5" />
            <line x1="40" y1="20" x2="54" y2="42" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
            {/* Pedestal Sink Below Mirror */}
            <g transform="translate(16, 82)">
              <path d="M 32 22 L 32 10 Q 32 2 42 8" fill="none" stroke="#64748B" strokeWidth="3.8" strokeLinecap="round" />
              <polygon points="0,24 10,16 78,16 68,24" fill="#FFFFFF" stroke="#2D2520" strokeWidth="2.4" />
              <path d="M 4 24 Q 38 48 74 24 Z" fill="#F1F5F9" stroke="#2D2520" strokeWidth="2.5" />
              <rect x="28" y="40" width="22" height="58" rx="6" fill="#E2E8F0" stroke="#2D2520" strokeWidth="2.4" />
              <ellipse cx="39" cy="98" rx="20" ry="5.5" fill="#CBD5E1" stroke="#2D2520" strokeWidth="2.2" />
            </g>
          </g>
        );

      case 'toilet_3d':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {/* Drop-zone highlight when dragging baby over the toilet */}
            {hoveredDropZone === 'toilet' && (
              <ellipse
                cx="44"
                cy="74"
                rx="46"
                ry="32"
                fill="rgba(56, 189, 248, 0.28)"
                stroke="#0284C7"
                strokeWidth="3"
                strokeDasharray="6 5"
              />
            )}
            {/* Elliptical Floor Contact Shadow */}
            <ellipse cx="44" cy="108" rx="34" ry="10" fill="url(#furnitureShadow)" />
            {/* Toilet Water Tank (Back) */}
            <rect
              x="16"
              y="18"
              width="52"
              height="40"
              rx="6"
              fill="#F8FAFC"
              stroke="#2D2520"
              strokeWidth="2.6"
            />
            {/* Tank Top Lid */}
            <rect
              x="12"
              y="12"
              width="60"
              height="9"
              rx="4"
              fill="#E2E8F0"
              stroke="#2D2520"
              strokeWidth="2.4"
            />
            {/* Chrome Flush Handle */}
            <rect
              x="56"
              y="26"
              width="9"
              height="4.5"
              rx="2"
              fill="#38BDF8"
              stroke="#2D2520"
              strokeWidth="1.8"
            />
            {/* Raised Oval Toilet Lid */}
            <ellipse
              cx="42"
              cy="34"
              rx="20"
              ry="24"
              fill="#FFFFFF"
              stroke="#2D2520"
              strokeWidth="2.4"
            />
            {/* Toilet Pedestal Base */}
            <path
              d="M 26 68 L 62 68 L 56 106 Q 44 112 32 106 Z"
              fill="#E2E8F0"
              stroke="#2D2520"
              strokeWidth="2.6"
            />
            {/* Toilet Bowl Basin */}
            <path
              d="M 16 58 Q 44 66 72 58 L 66 84 Q 44 96 22 84 Z"
              fill="#FFFFFF"
              stroke="#2D2520"
              strokeWidth="2.6"
            />
            {/* Toilet Seat Ring */}
            <ellipse
              cx="44"
              cy="58"
              rx="28"
              ry="11"
              fill="#FEF08A"
              stroke="#2D2520"
              strokeWidth="2.6"
            />
            {/* Inner Water / Flush Animation inside Toilet Bowl */}
            <ellipse
              cx="44"
              cy="58"
              rx="18"
              ry="6.5"
              fill={
                toiletActionMode === 'poop'
                  ? '#B45309'
                  : toiletActionMode === 'pee'
                  ? '#FDE047'
                  : '#7DD3FC'
              }
              stroke="#2D2520"
              strokeWidth="1.8"
            />
            {/* Cute Toilet Paper Roll Holder on Side */}
            <rect
              x="72"
              y="44"
              width="14"
              height="18"
              rx="3"
              fill="#FFFFFF"
              stroke="#2D2520"
              strokeWidth="2"
            />
            <line x1="75" y1="54" x2="83" y2="54" stroke="#CBD5E1" strokeWidth="1.5" />
            <text
              x="44"
              y="101"
              textAnchor="middle"
              fill="#475569"
              fontSize="8.5"
              fontWeight="900"
            >
              TOILET
            </text>
          </g>
        );

      case 'bath_shelf':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {/* REQUIREMENT F.6: Rak Sabun & Sampo Utuh */}
            <polygon points="0,34 10,26 116,26 106,34" fill="#BAE6FD" stroke="#2D2520" strokeWidth="2.2" />
            <rect x="0" y="34" width="106" height="10" rx="3" fill="#38BDF8" stroke="#2D2520" strokeWidth="2.4" />
            <rect x="14" y="6" width="18" height="26" rx="5" fill="#F472B6" stroke="#2D2520" strokeWidth="2" />
            <rect x="38" y="2" width="20" height="30" rx="6" fill="#A7F3D0" stroke="#2D2520" strokeWidth="2" />
            <rect x="64" y="10" width="24" height="22" rx="5" fill="#FDE047" stroke="#2D2520" strokeWidth="2" />
            {/* Wall Shower Pipe Mount */}
            <circle cx="52" cy="60" r="8" fill="#94A3B8" stroke="#2D2520" strokeWidth="2.2" />
          </g>
        );

      case 'towel_rack':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {/* REQUIREMENT F.6: Gantungan Handuk Hangat (Handuk terangkat saat sedang diseret) */}
            <rect x="0" y="8" width="90" height="7" rx="3.5" fill="#94A3B8" stroke="#2D2520" strokeWidth="2.2" />
            {activeBathTool !== 'towel' && (
              <>
                <rect x="10" y="12" width="70" height="82" rx="8" fill="#FDE047" stroke="#2D2520" strokeWidth="2.6" />
                <rect x="10" y="74" width="70" height="10" fill="#F59E0B" />
                <text x="45" y="54" textAnchor="middle" fill="#92400E" fontSize="12" fontWeight="900">
                  HANDUK
                </text>
              </>
            )}
          </g>
        );

      case 'bathtub_back':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {/* REQUIREMENT F.1 & F.2: LAYER 1 (BELAKANG) — Sisi belakang bak mandi & permukaan air belakang (z-10) */}
            {hoveredDropZone === 'bathtub' && (
              <ellipse
                cx={obj.lebar / 2}
                cy="62"
                rx="150"
                ry="48"
                fill="rgba(56, 189, 248, 0.25)"
                stroke="#0284C7"
                strokeWidth="3"
                strokeDasharray="8 6"
              />
            )}
            {/* Floor Contact Shadow under Bathtub */}
            <ellipse cx={obj.lebar / 2} cy="96" rx="146" ry="20" fill="url(#furnitureShadow)" />
            {/* Bathtub Back Rim & Inner Basin Wall */}
            <path
              d={`M 10 24 Q ${obj.lebar / 2} 6 ${obj.lebar - 10} 24 L ${obj.lebar - 16} 76 Q ${obj.lebar / 2} 88 16 76 Z`}
              fill="#E2E8F0"
              stroke="#2D2520"
              strokeWidth="3"
            />
            {/* Back Rim Lip */}
            <path
              d={`M 4 22 Q ${obj.lebar / 2} 4 ${obj.lebar - 4} 22 Q ${obj.lebar} 30 ${obj.lebar - 10} 34 Q ${obj.lebar / 2} 18 10 34 Q 0 30 4 22 Z`}
              fill="#FFFFFF"
              stroke="#2D2520"
              strokeWidth="2.8"
            />
            {/* Warm Blue Water Surface Inside Back of Tub */}
            <ellipse
              cx={obj.lebar / 2}
              cy="44"
              rx={obj.lebar * 0.44}
              ry="18"
              fill="url(#bathWaterGrad)"
              stroke="#38BDF8"
              strokeWidth="2"
            />
            {/* Cute Rubber Duck Floating on Back Left Corner of Tub */}
            <g transform="translate(28, 16)">
              <ellipse cx="14" cy="18" rx="12" ry="8" fill="#FDE047" stroke="#2D2520" strokeWidth="2" />
              <circle cx="20" cy="10" r="7" fill="#FDE047" stroke="#2D2520" strokeWidth="2" />
              <polygon points="26,9 32,11 26,13" fill="#F97316" stroke="#2D2520" strokeWidth="1.2" />
              <circle cx="21" cy="8.5" r="1.5" fill="#2D2520" />
            </g>
          </g>
        );

      case 'bath_mat':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            <ellipse
              cx={obj.lebar / 2}
              cy={obj.tinggi / 2}
              rx={obj.lebar / 2}
              ry={obj.tinggi / 2}
              fill="#7DD3FC"
              stroke="#2D2520"
              strokeWidth="2.4"
            />
            <ellipse
              cx={obj.lebar / 2}
              cy={obj.tinggi / 2}
              rx={obj.lebar * 0.38}
              ry={obj.tinggi * 0.34}
              fill="#BAE6FD"
            />
          </g>
        );

      case 'living_window':
      case 'play_window':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            <rect x="0" y="0" width={obj.lebar} height={obj.tinggi} rx="10" fill="#BAE6FD" stroke="#D97706" strokeWidth="5" />
            <circle cx={obj.lebar - 28} cy="26" r="13" fill="#FDE047" />
            <line x1={obj.lebar / 2} y1="0" x2={obj.lebar / 2} y2={obj.tinggi} stroke="#D97706" strokeWidth="4" />
            <line x1="0" y1={obj.tinggi / 2} x2={obj.lebar} y2={obj.tinggi / 2} stroke="#D97706" strokeWidth="4" />
          </g>
        );

      case 'family_frames':
      case 'abc_board':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            <rect x="0" y="0" width={obj.lebar} height={obj.tinggi} rx="8" fill="#FFFBEB" stroke="#B45309" strokeWidth="4" />
            <text x={obj.lebar / 2} y="30" textAnchor="middle" fill="#D97706" fontSize="13" fontWeight="bold">
              {obj.id === 'abc_board' ? 'A B C • 1 2 3' : 'KELUARGA CERIA'}
            </text>
            <circle cx="32" cy="54" r="10" fill="#FF8FAB" stroke="#2D2520" strokeWidth="1.8" />
            <rect x="54" y="44" width="20" height="20" rx="4" fill="#34D399" stroke="#2D2520" strokeWidth="1.8" />
            <polygon points="96,44 108,64 84,64" fill="#38BDF8" stroke="#2D2520" strokeWidth="1.8" />
          </g>
        );

      case 'sofa_3d':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            <ellipse cx={obj.lebar / 2} cy={obj.tinggi - 6} rx={obj.lebar * 0.48} ry="14" fill="url(#furnitureShadow)" />
            <rect x="14" y="10" width={obj.lebar - 28} height="64" rx="14" fill="#FB7185" stroke="#2D2520" strokeWidth="2.8" />
            <rect x="0" y="38" width="24" height="58" rx="10" fill="#F43F5E" stroke="#2D2520" strokeWidth="2.6" />
            <rect x={obj.lebar - 24} y="38" width="24" height="58" rx="10" fill="#F43F5E" stroke="#2D2520" strokeWidth="2.6" />
            <rect x="18" y="56" width={obj.lebar - 36} height="36" rx="8" fill="#FDA4AF" stroke="#2D2520" strokeWidth="2.6" />
          </g>
        );

      case 'garden_corner':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            <ellipse cx="42" cy="122" rx="34" ry="10" fill="url(#furnitureShadow)" />
            <polygon points="18,68 66,68 58,118 26,118" fill="#D97706" stroke="#2D2520" strokeWidth="2.6" />
            <rect x="14" y="60" width="56" height="12" rx="4" fill="#B45309" stroke="#2D2520" strokeWidth="2.4" />
            <path d="M 42 60 Q 22 30 16 14 Q 36 24 42 60" fill="#22C55E" stroke="#2D2520" strokeWidth="2" />
            <path d="M 42 60 Q 62 28 68 12 Q 48 24 42 60" fill="#16A34A" stroke="#2D2520" strokeWidth="2" />
            <circle cx="42" cy="18" r="11" fill="#FF8FAB" stroke="#2D2520" strokeWidth="2" />
            <circle cx="42" cy="18" r="5" fill="#FDE047" />
          </g>
        );

      case 'toy_book_shelf':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            <ellipse cx={obj.lebar / 2} cy={obj.tinggi - 4} rx={obj.lebar * 0.48} ry="14" fill="url(#furnitureShadow)" />
            <polygon points={`0,14 18,0 ${obj.lebar},0 ${obj.lebar - 18},14`} fill="#FEF08A" stroke="#2D2520" strokeWidth="2.4" />
            <rect x="0" y="14" width={obj.lebar - 18} height={obj.tinggi - 20} rx="8" fill="#FDE68A" stroke="#2D2520" strokeWidth="2.8" />
            <rect x="10" y="26" width={obj.lebar - 38} height="58" rx="5" fill="#FEF3C7" stroke="#B45309" strokeWidth="2.2" />
            <rect x="10" y="96" width={obj.lebar - 38} height="62" rx="5" fill="#FEF3C7" stroke="#B45309" strokeWidth="2.2" />
            {/* 3D Blocks & Books Inside Cubbies */}
            <rect x="20" y="46" width="26" height="28" rx="4" fill="#FF8FAB" stroke="#2D2520" strokeWidth="2" />
            <rect x="54" y="46" width="26" height="28" rx="4" fill="#38BDF8" stroke="#2D2520" strokeWidth="2" />
            <rect x="88" y="46" width="26" height="28" rx="4" fill="#34D399" stroke="#2D2520" strokeWidth="2" />
            <rect x="20" y="108" width="14" height="44" rx="2" fill="#EF4444" stroke="#2D2520" strokeWidth="1.8" />
            <rect x="36" y="112" width="14" height="40" rx="2" fill="#3B82F6" stroke="#2D2520" strokeWidth="1.8" />
            <rect x="52" y="106" width="15" height="46" rx="2" fill="#10B981" stroke="#2D2520" strokeWidth="1.8" />
            <circle cx="110" cy="132" r="16" fill="#F97316" stroke="#2D2520" strokeWidth="2" />
          </g>
        );

      case 'living_rug':
      case 'play_mat':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            <polygon
              points={`0,${obj.tinggi} 28,0 ${obj.lebar},0 ${obj.lebar - 28},${obj.tinggi}`}
              fill={obj.id === 'play_mat' ? '#A7F3D0' : '#FBCFE8'}
              stroke="#2D2520"
              strokeWidth="2.6"
            />
            <polygon
              points={`18,${obj.tinggi - 12} 40,12 ${obj.lebar - 18},12 ${obj.lebar - 40},${obj.tinggi - 12}`}
              fill={obj.id === 'play_mat' ? '#D1FAE5' : '#FCE7F3'}
            />
          </g>
        );

      case 'seed_house':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            <ellipse cx={obj.lebar / 2} cy={obj.tinggi - 6} rx={obj.lebar * 0.48} ry="12" fill="url(#furnitureShadow)" />
            <polygon points={`4,42 ${obj.lebar / 2},4 ${obj.lebar - 4},42`} fill="#EF4444" stroke="#2D2520" strokeWidth="2.6" />
            <rect x="12" y="42" width={obj.lebar - 24} height={obj.tinggi - 50} rx="6" fill="#FFFBEB" stroke="#2D2520" strokeWidth="2.6" />
            <rect x="22" y="54" width="28" height="26" rx="4" fill="#BAE6FD" stroke="#2D2520" strokeWidth="2" />
            <rect x={obj.lebar - 50} y="62" width="28" height={obj.tinggi - 70} rx="4" fill="#D97706" stroke="#2D2520" strokeWidth="2.2" />
            <circle cx={obj.lebar - 28} cy="92" r="2.5" fill="#FEF08A" />
            <rect x="18" y="88" width="36" height="10" rx="3" fill="#86EFAC" stroke="#2D2520" strokeWidth="1.8" />
          </g>
        );

      case 'picnic_mat':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            <polygon
              points={`0,${obj.tinggi} 26,0 ${obj.lebar},0 ${obj.lebar - 26},${obj.tinggi}`}
              fill="#FDA4AF"
              stroke="#2D2520"
              strokeWidth="2.6"
            />
            <polygon
              points={`18,${obj.tinggi - 12} 38,12 ${obj.lebar - 18},12 ${obj.lebar - 38},${obj.tinggi - 12}`}
              fill="#FFE4E6"
              stroke="#F43F5E"
              strokeWidth="1.8"
              strokeDasharray="10 8"
            />
            {/* Picnic Basket on Mat */}
            <g transform={`translate(${obj.lebar * 0.62}, 14)`}>
              <ellipse cx="22" cy="34" rx="22" ry="7" fill="rgba(45,37,32,0.22)" />
              <rect x="4" y="12" width="36" height="22" rx="5" fill="#D97706" stroke="#2D2520" strokeWidth="2.2" />
              <rect x="2" y="8" width="40" height="7" rx="3" fill="#FDE68A" stroke="#2D2520" strokeWidth="2" />
              <path d="M 12 8 Q 22 -4 32 8" fill="none" stroke="#78350F" strokeWidth="2.5" />
            </g>
          </g>
        );

      case 'slide_3d':
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {/* Glowing Drop-Zone Highlight when dragging baby over the slide */}
            {hoveredDropZone === 'slide' && (
              <g>
                <rect
                  x="-6"
                  y="4"
                  width={obj.lebar + 12}
                  height={obj.tinggi - 4}
                  rx="22"
                  fill="rgba(250, 204, 21, 0.24)"
                  stroke="#EA580C"
                  strokeWidth="3"
                  strokeDasharray="7 5"
                />
                <rect
                  x="10"
                  y="-16"
                  width="128"
                  height="20"
                  rx="10"
                  fill="#FFFDF9"
                  stroke="#2D2520"
                  strokeWidth="1.8"
                />
                <text
                  x="74"
                  y="-3"
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="800"
                  fill="#2D2520"
                >
                  🛝 Lepas untuk Meluncur!
                </text>
              </g>
            )}
            <ellipse cx={obj.lebar / 2} cy={obj.tinggi - 8} rx={obj.lebar * 0.46} ry="14" fill="url(#furnitureShadow)" />
            {/* Ladder on Left */}
            <line x1="18" y1="36" x2="10" y2={obj.tinggi - 12} stroke="#92400E" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="42" y1="36" x2="34" y2={obj.tinggi - 12} stroke="#92400E" strokeWidth="4.5" strokeLinecap="round" />
            <line x1="16" y1="58" x2="40" y2="58" stroke="#D97706" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="14" y1="82" x2="38" y2="82" stroke="#D97706" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="12" y1="106" x2="36" y2="106" stroke="#D97706" strokeWidth="3.5" strokeLinecap="round" />
            {/* Top Safety Handrail Arch */}
            <path
              d="M 14 26 L 14 11 Q 34 2 52 14 L 52 26"
              fill="none"
              stroke="#0284C7"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Top Platform */}
            <rect x="12" y="24" width="44" height="14" rx="4" fill="#38BDF8" stroke="#2D2520" strokeWidth="2.4" />
            {/* Back Chute Wall / Shadow */}
            <path
              d={`M 50 26 Q 92 80 ${obj.lebar - 6} ${obj.tinggi - 22} L ${obj.lebar - 10} ${obj.tinggi - 16} Q 86 86 46 32 Z`}
              fill="#EAB308"
              stroke="#2D2520"
              strokeWidth="2"
            />
            {/* Main Yellow Slide Chute */}
            <path
              d={`M 48 30 Q 88 86 ${obj.lebar - 10} ${obj.tinggi - 18} L ${obj.lebar - 26} ${obj.tinggi - 10} Q 72 94 36 38 Z`}
              fill="#FACC15"
              stroke="#2D2520"
              strokeWidth="2.8"
            />
            {/* Glossy Slide Shine Line */}
            <path
              d={`M 45 36 Q 82 88 ${obj.lebar - 19} ${obj.tinggi - 15}`}
              fill="none"
              stroke="rgba(255,255,255,0.68)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        );

      case 'swing_3d': {
        const activeAngle =
          currentRoom === 'playground' && (onSwing || playgroundSwingActive) && !isDragging
            ? swingAngle
            : 0;
        const swingRad = (activeAngle * Math.PI) / 180;
        const shadowShiftX = -Math.sin(swingRad) * 42;
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {/* Glowing Drop-Zone Highlight when dragging baby over the swing */}
            {hoveredDropZone === 'swing' && (
              <g>
                <rect
                  x="-6"
                  y="2"
                  width={obj.lebar + 12}
                  height={obj.tinggi - 2}
                  rx="22"
                  fill="rgba(56, 189, 248, 0.24)"
                  stroke="#0284C7"
                  strokeWidth="3"
                  strokeDasharray="7 5"
                />
                <rect
                  x="10"
                  y="-18"
                  width="128"
                  height="20"
                  rx="10"
                  fill="#FFFDF9"
                  stroke="#2D2520"
                  strokeWidth="1.8"
                />
                <text
                  x="74"
                  y="-5"
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="800"
                  fill="#2D2520"
                >
                  🎠 Lepas untuk Berayun!
                </text>
              </g>
            )}
            {/* Static A-frame shadow + dynamic moving swing shadow */}
            <ellipse cx={obj.lebar / 2} cy={obj.tinggi - 8} rx={obj.lebar * 0.46} ry="14" fill="url(#furnitureShadow)" />
            <ellipse
              cx={obj.lebar / 2 + shadowShiftX}
              cy={obj.tinggi - 10}
              rx={28 - Math.abs(activeAngle) * 0.25}
              ry="7"
              fill="rgba(45, 37, 32, 0.2)"
            />
            {/* A-Frame Wooden Posts (Stationary) */}
            <line x1="20" y1="14" x2="8" y2={obj.tinggi - 12} stroke="#B45309" strokeWidth="5" strokeLinecap="round" />
            <line x1="20" y1="14" x2="44" y2={obj.tinggi - 12} stroke="#92400E" strokeWidth="4.5" strokeLinecap="round" />
            <line x1={obj.lebar - 20} y1="14" x2={obj.lebar - 44} y2={obj.tinggi - 12} stroke="#92400E" strokeWidth="4.5" strokeLinecap="round" />
            <line x1={obj.lebar - 20} y1="14" x2={obj.lebar - 8} y2={obj.tinggi - 12} stroke="#B45309" strokeWidth="5" strokeLinecap="round" />
            {/* Swinging Pendulum Group (Ropes + Seat) pivoting smoothly around top crossbar center */}
            <g transform={`rotate(${activeAngle}, ${obj.lebar / 2}, 18)`}>
              {/* Back Ropes */}
              <line x1={obj.lebar / 2 - 18} y1="18" x2={obj.lebar / 2 - 18} y2="104" stroke="#475569" strokeWidth="2.8" />
              <line x1={obj.lebar / 2 + 18} y1="18" x2={obj.lebar / 2 + 18} y2="104" stroke="#475569" strokeWidth="2.8" />
              {/* Subtle Motion Breeze Arcs while swinging */}
              {Math.abs(activeAngle) > 8 && (
                <g opacity="0.72">
                  <path
                    d={
                      activeAngle > 0
                        ? `M ${obj.lebar / 2 + 30} 82 Q ${obj.lebar / 2 + 40} 96 ${obj.lebar / 2 + 32} 112`
                        : `M ${obj.lebar / 2 - 30} 82 Q ${obj.lebar / 2 - 40} 96 ${obj.lebar / 2 - 32} 112`
                    }
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </g>
              )}
              {/* Blue Swing Seat Board */}
              <rect
                x={obj.lebar / 2 - 26}
                y="102"
                width="52"
                height="12"
                rx="5"
                fill="#38BDF8"
                stroke="#2D2520"
                strokeWidth="2.4"
              />
              {/* Rope Attachment Rings on Seat */}
              <circle cx={obj.lebar / 2 - 18} cy="103" r="3" fill="#CBD5E1" stroke="#2D2520" strokeWidth="1.4" />
              <circle cx={obj.lebar / 2 + 18} cy="103" r="3" fill="#CBD5E1" stroke="#2D2520" strokeWidth="1.4" />
            </g>
            {/* Top Red Crossbar & Metal Swing Hooks */}
            <rect x="12" y="10" width={obj.lebar - 24} height="10" rx="4" fill="#EF4444" stroke="#2D2520" strokeWidth="2.4" />
            <circle cx={obj.lebar / 2 - 18} cy="19" r="3.2" fill="#E2E8F0" stroke="#2D2520" strokeWidth="1.5" />
            <circle cx={obj.lebar / 2 + 18} cy="19" r="3.2" fill="#E2E8F0" stroke="#2D2520" strokeWidth="1.5" />
          </g>
        );
      }

      case 'seesaw_3d': {
        const activeTilt = currentRoom === 'playground' ? seesawAngle : 0;
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {/* Drop-zone highlight when dragging baby over the seesaw */}
            {hoveredDropZone === 'seesaw' && (
              <g>
                <rect
                  x="-6"
                  y="2"
                  width={obj.lebar + 12}
                  height={obj.tinggi - 2}
                  rx="20"
                  fill="rgba(251, 113, 133, 0.22)"
                  stroke="#E11D48"
                  strokeWidth="3"
                  strokeDasharray="7 5"
                />
                <rect
                  x={obj.lebar / 2 - 86}
                  y="-18"
                  width="172"
                  height="20"
                  rx="10"
                  fill="#FFFDF9"
                  stroke="#2D2520"
                  strokeWidth="1.8"
                />
                <text
                  x={obj.lebar / 2}
                  y="-5"
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="800"
                  fill="#2D2520"
                >
                  ⚖️ Lepas untuk Jungkat-Jungkit!
                </text>
              </g>
            )}
            {/* Elliptical Grass Shadow */}
            <ellipse cx="103" cy="78" rx="84" ry="10" fill="url(#furnitureShadow)" />
            {/* Rubber Bumper Cushions Under Left & Right Ends */}
            <rect x="18" y="70" width="22" height="9" rx="4.5" fill="#475569" stroke="#2D2520" strokeWidth="1.8" />
            <rect x="166" y="70" width="22" height="9" rx="4.5" fill="#475569" stroke="#2D2520" strokeWidth="1.8" />
            {/* Center Triangular Fulcrum Stand */}
            <polygon
              points="83,78 103,42 123,78"
              fill="#EA580C"
              stroke="#2D2520"
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
            <polygon points="94,76 103,56 112,76" fill="#FED7AA" stroke="#2D2520" strokeWidth="1.6" />
            {/* Tilting Seesaw Plank, Seats & Back Handlebars */}
            <g transform={`rotate(${activeTilt}, 103, 48)`}>
              {/* Main Colorful Plank */}
              <rect
                x="12"
                y="42"
                width="182"
                height="12"
                rx="6"
                fill="#FB7185"
                stroke="#2D2520"
                strokeWidth="2.5"
              />
              {/* Bright Yellow Center Decorative Stripe */}
              <rect x="74" y="44" width="58" height="8" rx="3" fill="#FACC15" opacity="0.92" />
              {/* Left Seat Pad (Baby Seat) */}
              <rect x="18" y="35" width="34" height="8" rx="4" fill="#38BDF8" stroke="#2D2520" strokeWidth="2.1" />
              {/* Left Handlebar Arch */}
              <path
                d="M 55 42 L 55 25 Q 55 20 60 20 L 64 20"
                fill="none"
                stroke="#475569"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              {/* Right Seat Pad (Interactive Player Push/Drag Seat) */}
              <rect x="154" y="35" width="34" height="8" rx="4" fill="#34D399" stroke="#2D2520" strokeWidth="2.1" />
              {/* Right Handlebar Arch */}
              <path
                d="M 151 42 L 151 25 Q 151 20 146 20 L 142 20"
                fill="none"
                stroke="#475569"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </g>
            {/* Metallic Pivot Axle Bolt */}
            <circle cx="103" cy="48" r="6" fill="#E2E8F0" stroke="#2D2520" strokeWidth="2.2" />
            <circle cx="103" cy="48" r="2.2" fill="#475569" />
          </g>
        );
      }

      case 'sandpit_3d': {
        const activeProgress = isBuildingSandcastle
          ? sandBuildProgress
          : sandcastleStage > 0
          ? 100
          : 0;
        const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
        const moundP = clamp01(activeProgress / 24);
        const baseP = clamp01((activeProgress - 20) / 26);
        const leftTowerP = clamp01((activeProgress - 44) / 16);
        const rightTowerP = clamp01((activeProgress - 57) / 16);
        const detailP = clamp01((activeProgress - 71) / 19);
        const flagP = clamp01((activeProgress - 88) / 12);
        const scoopAngle = isBuildingSandcastle ? Math.sin(sandBuildTick * 9) * 24 : 0;
        const bucketHopY = isBuildingSandcastle ? -Math.abs(Math.sin(sandBuildTick * 7)) * 7 : 0;
        const effectiveLv = Math.max(1, sandcastleStage + (isBuildingSandcastle ? 1 : 0));

        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {/* Drop-zone highlight when dragging baby over the sandbox */}
            {hoveredDropZone === 'sandpit' && (
              <g>
                <polygon
                  points={`-6,${obj.tinggi + 4} 20,8 ${obj.lebar + 6},8 ${obj.lebar - 20},${obj.tinggi + 4}`}
                  fill="rgba(251, 191, 36, 0.25)"
                  stroke="#D97706"
                  strokeWidth="3"
                  strokeDasharray="7 5"
                />
                <rect
                  x={obj.lebar / 2 - 70}
                  y="-18"
                  width="140"
                  height="20"
                  rx="10"
                  fill="#FFFDF9"
                  stroke="#2D2520"
                  strokeWidth="1.8"
                />
                <text
                  x={obj.lebar / 2}
                  y="-5"
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="800"
                  fill="#2D2520"
                >
                  🏰 Lepas untuk Main Pasir!
                </text>
              </g>
            )}

            {/* Wooden Sandbox Frame Filled with Soft Golden Sand */}
            <polygon
              points={`0,${obj.tinggi} 24,14 ${obj.lebar},14 ${obj.lebar - 24},${obj.tinggi}`}
              fill="#FDE68A"
              stroke="#B45309"
              strokeWidth="4"
            />
            {/* Soft Sand Surface Ripples */}
            <path
              d="M 38 42 Q 66 36 92 42 M 138 74 Q 168 68 194 74 M 48 76 Q 74 71 98 76"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.45"
            />

            {/* Resting or Active Sand Bucket & Blue Shovel */}
            <g transform={`translate(34, ${46 + bucketHopY})`}>
              {/* Red Sand Bucket */}
              <polygon
                points="4,10 22,10 19,28 7,28"
                fill="#EF4444"
                stroke="#2D2520"
                strokeWidth="2"
              />
              <ellipse cx="13" cy="10" rx="9" ry="3" fill="#FCA5A5" stroke="#2D2520" strokeWidth="1.6" />
              <path d="M 5 10 Q 13 0 21 10" fill="none" stroke="#2D2520" strokeWidth="1.6" />
              {/* Blue Shovel (scoops rhythmically while building!) */}
              <g transform={`translate(24, 16) rotate(${scoopAngle})`}>
                <line x1="0" y1="-10" x2="0" y2="8" stroke="#0284C7" strokeWidth="3.2" strokeLinecap="round" />
                <path d="M -5 7 L 5 7 L 3 16 Q 0 19 -3 16 Z" fill="#38BDF8" stroke="#2D2520" strokeWidth="1.6" />
                <circle cx="0" cy="-12" r="3" fill="#38BDF8" stroke="#2D2520" strokeWidth="1.5" />
              </g>
            </g>

            {/* PROGRESSIVE SANDCASTLE CONSTRUCTION (Starts empty at 0% -> grows step by step to 100%) */}
            <g transform={`translate(${obj.lebar * 0.36}, 14)`}>
              {/* Phase 1: Soft Sand Mound growing up from flat sand */}
              {moundP > 0 && (
                <g transform={`translate(32, 54) scale(${0.5 + 0.5 * moundP}, ${moundP}) translate(-32, -54)`}>
                  <path
                    d="M -6 54 Q 10 34 32 34 Q 54 34 70 54 Z"
                    fill="#FCD34D"
                    stroke="#B45309"
                    strokeWidth="2"
                  />
                </g>
              )}

              {/* Phase 2: Central Sandcastle Base Wall rising smoothly */}
              {baseP > 0 && (
                <g transform={`translate(32, 52) scale(1, ${baseP}) translate(-32, -52)`}>
                  <rect x="8" y="24" width="48" height="28" rx="4" fill="#F59E0B" stroke="#2D2520" strokeWidth="2" />
                  {/* Battlement Merlons along top wall */}
                  <rect x="14" y="19" width="8" height="7" rx="1.5" fill="#F59E0B" stroke="#2D2520" strokeWidth="1.6" />
                  <rect x="28" y="19" width="8" height="7" rx="1.5" fill="#F59E0B" stroke="#2D2520" strokeWidth="1.6" />
                  <rect x="42" y="19" width="8" height="7" rx="1.5" fill="#F59E0B" stroke="#2D2520" strokeWidth="1.6" />
                </g>
              )}

              {/* Phase 3A: Left Sand Tower rising smoothly */}
              {leftTowerP > 0 && (
                <g transform={`translate(10, 52) scale(1, ${leftTowerP}) translate(-10, -52)`}>
                  <rect x="2" y="14" width="16" height="38" rx="3" fill="#FBBF24" stroke="#2D2520" strokeWidth="2" />
                  <rect x="7" y="24" width="6" height="8" rx="3" fill="#92400E" />
                </g>
              )}

              {/* Phase 3B: Right Sand Tower rising smoothly */}
              {rightTowerP > 0 && (
                <g transform={`translate(54, 52) scale(1, ${rightTowerP}) translate(-54, -52)`}>
                  <rect x="46" y="14" width="16" height="38" rx="3" fill="#FBBF24" stroke="#2D2520" strokeWidth="2" />
                  <rect x="51" y="24" width="6" height="8" rx="3" fill="#92400E" />
                </g>
              )}

              {/* Phase 4: Arched Gate & Red Turret Cone Roofs popping onto towers */}
              {detailP > 0 && (
                <g>
                  <path
                    d="M 24 52 L 24 36 Q 32 29 40 36 L 40 52 Z"
                    fill="#78350F"
                    opacity={detailP}
                  />
                  <g transform={`translate(10, 14) scale(${detailP}) translate(-10, -14)`}>
                    <polygon points="0,14 10,1 20,14" fill="#EF4444" stroke="#2D2520" strokeWidth="1.8" />
                  </g>
                  <g transform={`translate(54, 14) scale(${detailP}) translate(-54, -14)`}>
                    <polygon points="44,14 54,1 64,14" fill="#EF4444" stroke="#2D2520" strokeWidth="1.8" />
                  </g>
                </g>
              )}

              {/* Phase 5: Central Spire (Lv2+), Waving Flags, Seashells & Sparkles */}
              {flagP > 0 && (
                <g opacity={flagP}>
                  {effectiveLv >= 2 && (
                    <g transform={`translate(32, 24) scale(${flagP}) translate(-32, -24)`}>
                      <rect x="25" y="4" width="14" height="20" rx="2" fill="#FBBF24" stroke="#2D2520" strokeWidth="1.8" />
                      <polygon points="23,5 32,-6 41,5" fill="#0EA5E9" stroke="#2D2520" strokeWidth="1.8" />
                      <line x1="32" y1="-6" x2="32" y2="-16" stroke="#2D2520" strokeWidth="1.6" />
                      <polygon points="32,-16 42,-12 32,-8" fill="#FACC15" stroke="#2D2520" strokeWidth="1.2" />
                    </g>
                  )}
                  {/* Left & Right Tower Flags */}
                  <line x1="10" y1="1" x2="10" y2="-9" stroke="#2D2520" strokeWidth="1.5" />
                  <polygon points="10,-9 18,-6 10,-3" fill="#38BDF8" stroke="#2D2520" strokeWidth="1" />
                  <line x1="54" y1="1" x2="54" y2="-9" stroke="#2D2520" strokeWidth="1.5" />
                  <polygon points="54,-9 62,-6 54,-3" fill="#F472B6" stroke="#2D2520" strokeWidth="1" />
                  {/* Decorative Pastel Shells on Base */}
                  <circle cx="14" cy="51" r="3" fill="#FBCFE8" stroke="#2D2520" strokeWidth="1.2" />
                  <circle cx="50" cy="51" r="3" fill="#BAE6FD" stroke="#2D2520" strokeWidth="1.2" />
                </g>
              )}

              {/* Animated Flying Golden Sand Grains & Puffs while Building */}
              {isBuildingSandcastle && (
                <g>
                  {[0, 1, 2, 3, 4].map((idx) => {
                    const phase = ((sandBuildTick * 2.4 + idx * 0.22) % 1);
                    const gx = 8 + idx * 12 + Math.sin(phase * Math.PI * 2) * 8;
                    const gy = 48 - Math.sin(phase * Math.PI) * 32;
                    return (
                      <circle
                        key={idx}
                        cx={gx}
                        cy={gy}
                        r={2.2 + (idx % 2) * 0.9}
                        fill={idx % 2 === 0 ? '#F59E0B' : '#FEF08A'}
                        opacity={1 - Math.abs(phase - 0.5) * 1.8}
                      />
                    );
                  })}
                </g>
              )}
            </g>
          </g>
        );
      }

      case 'beach_umbrella': {
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {hoveredDropZone === 'beach_umbrella' && (
              <ellipse
                cx={obj.lebar / 2}
                cy={obj.tinggi - 26}
                rx="74"
                ry="30"
                fill="rgba(56, 189, 248, 0.28)"
                stroke="#0284C7"
                strokeWidth="3"
                strokeDasharray="7 5"
              />
            )}
            {/* Cool Shaded Shadow Under Umbrella */}
            <ellipse cx="74" cy={obj.tinggi - 18} rx="64" ry="18" fill="url(#furnitureShadow)" />
            {/* Cozy Striped Beach Lounger Towel & White Head Pillow */}
            <polygon
              points="16,136 40,98 134,98 112,136"
              fill="#38BDF8"
              stroke="#2D2520"
              strokeWidth="2.4"
            />
            <polygon points="34,136 56,98 76,98 54,136" fill="#E0F2FE" opacity="0.88" />
            <polygon points="78,136 100,98 116,98 94,136" fill="#FDE047" opacity="0.85" />
            {/* Soft Beach Pillow */}
            <rect
              x="44"
              y="102"
              width="34"
              height="14"
              rx="6"
              fill="#FFFDF9"
              stroke="#2D2520"
              strokeWidth="2"
            />
            {/* Umbrella Pole */}
            <line x1="74" y1="34" x2="64" y2="124" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
            {/* Striped Coral & Cream Canopy */}
            <path d="M 8 48 Q 74 -8 140 48 Z" fill="#FB7185" stroke="#2D2520" strokeWidth="2.6" />
            <path d="M 38 48 Q 74 2 110 48 Z" fill="#FFFDF9" stroke="#2D2520" strokeWidth="2" />
            <path d="M 60 48 Q 74 10 88 48 Z" fill="#FBBF24" stroke="#2D2520" strokeWidth="1.6" />
            <circle cx="74" cy="14" r="4.5" fill="#FDE047" stroke="#2D2520" strokeWidth="1.8" />
          </g>
        );
      }

      case 'beach_sandcastle_spot': {
        const activeProgress = isBuildingSandcastle
          ? sandBuildProgress
          : sandcastleStage > 0
          ? 100
          : 0;
        const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
        const moundP = clamp01(activeProgress / 24);
        const baseP = clamp01((activeProgress - 20) / 26);
        const towerP = clamp01((activeProgress - 46) / 24);
        const roofP = clamp01((activeProgress - 72) / 20);
        const flagP = clamp01((activeProgress - 88) / 12);
        const effectiveLv = Math.max(1, sandcastleStage + (isBuildingSandcastle ? 1 : 0));

        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {hoveredDropZone === 'beach_sandcastle' && (
              <ellipse
                cx={obj.lebar / 2}
                cy={obj.tinggi / 2 + 12}
                rx="78"
                ry="40"
                fill="rgba(251, 191, 36, 0.34)"
                stroke="#D97706"
                strokeWidth="3"
                strokeDasharray="7 5"
              />
            )}
            {/* Soft Open Golden Sand Patch */}
            <ellipse
              cx={obj.lebar / 2}
              cy={obj.tinggi - 24}
              rx="70"
              ry="24"
              fill="#FDE68A"
              stroke="#D97706"
              strokeWidth="2"
              strokeDasharray={activeProgress === 0 ? '5 4' : undefined}
            />
            <path d="M 28 84 Q 54 78 80 84" fill="none" stroke="#F59E0B" strokeWidth="1.6" opacity="0.7" />
            <path d="M 88 90 Q 112 85 134 90" fill="none" stroke="#F59E0B" strokeWidth="1.6" opacity="0.7" />

            {/* Progressive Sandcastle (Completely Empty Flat Sand Before Dragging -> Builds Piece by Piece!) */}
            <g transform="translate(52, 24)">
              {activeProgress === 0 && !isBuildingSandcastle ? (
                /* Flat Empty Sand Patch with Resting Red Bucket & Blue Shovel waiting to build */
                <g transform="translate(30, 38)">
                  <ellipse cx="14" cy="22" rx="22" ry="6" fill="#FCD34D" opacity="0.7" />
                  <polygon points="4,4 22,4 19,21 7,21" fill="#EF4444" stroke="#2D2520" strokeWidth="1.9" />
                  <ellipse cx="13" cy="4" rx="9" ry="2.8" fill="#FCA5A5" stroke="#2D2520" strokeWidth="1.5" />
                  <line x1="25" y1="4" x2="30" y2="21" stroke="#0284C7" strokeWidth="2.8" strokeLinecap="round" />
                  <path d="M 27 19 L 34 19 L 32 25 L 28 25 Z" fill="#38BDF8" stroke="#2D2520" strokeWidth="1.4" />
                </g>
              ) : (
                <g>
                  {/* Step 1: Growing Sand Mound */}
                  {moundP > 0 && (
                    <g transform={`translate(38, 64) scale(${0.45 + 0.55 * moundP}, ${moundP}) translate(-38, -64)`}>
                      <path d="M -2 64 Q 38 36 78 64 Z" fill="#FCD34D" stroke="#B45309" strokeWidth="2" />
                    </g>
                  )}
                  {/* Step 2: Base Castle Wall */}
                  {baseP > 0 && (
                    <g transform={`translate(38, 64) scale(1, ${baseP}) translate(-38, -64)`}>
                      <rect x="8" y="32" width="60" height="32" rx="4" fill="#F59E0B" stroke="#2D2520" strokeWidth="2.2" />
                      <rect x="16" y="25" width="9" height="8" rx="1.5" fill="#F59E0B" stroke="#2D2520" strokeWidth="1.6" />
                      <rect x="33" y="25" width="10" height="8" rx="1.5" fill="#F59E0B" stroke="#2D2520" strokeWidth="1.6" />
                      <rect x="51" y="25" width="9" height="8" rx="1.5" fill="#F59E0B" stroke="#2D2520" strokeWidth="1.6" />
                    </g>
                  )}
                  {/* Step 3: Left & Right Side Towers (plus Tall Center Keep at Lv.2+) */}
                  {towerP > 0 && (
                    <g transform={`translate(38, 64) scale(1, ${towerP}) translate(-38, -64)`}>
                      <rect x="0" y="20" width="18" height="44" rx="3" fill="#FBBF24" stroke="#2D2520" strokeWidth="2" />
                      <rect x="58" y="20" width="18" height="44" rx="3" fill="#FBBF24" stroke="#2D2520" strokeWidth="2" />
                      {effectiveLv >= 2 && (
                        <rect x="27" y="10" width="22" height="30" rx="3" fill="#FDE047" stroke="#2D2520" strokeWidth="2" />
                      )}
                    </g>
                  )}
                  {/* Step 4: Arched Gate & Pointed Coral Roofs */}
                  {roofP > 0 && (
                    <g opacity={roofP}>
                      <path d="M 30 64 L 30 46 Q 38 38 46 46 L 46 64 Z" fill="#78350F" stroke="#2D2520" strokeWidth="1.6" />
                      <polygon points="-2,20 9,4 20,20" fill="#EF4444" stroke="#2D2520" strokeWidth="1.9" />
                      <polygon points="56,20 67,4 78,20" fill="#EF4444" stroke="#2D2520" strokeWidth="1.9" />
                      {effectiveLv >= 2 && (
                        <polygon points="24,10 38,-6 52,10" fill="#FB7185" stroke="#2D2520" strokeWidth="1.9" />
                      )}
                    </g>
                  )}
                  {/* Step 5: Fluttering Peak Flag */}
                  {flagP > 0 && (
                    <g opacity={flagP}>
                      <line x1="38" y1={effectiveLv >= 2 ? -6 : 24} x2="38" y2={effectiveLv >= 2 ? -20 : 8} stroke="#2D2520" strokeWidth="2" />
                      <polygon
                        points={effectiveLv >= 2 ? '38,-20 53,-14 38,-9' : '38,8 53,14 38,19'}
                        fill="#38BDF8"
                        stroke="#2D2520"
                        strokeWidth="1.5"
                      />
                    </g>
                  )}
                  {/* Flying Sand Sparkles while Building */}
                  {isBuildingSandcastle && (
                    <g>
                      {[0, 1, 2, 3].map((idx) => {
                        const phase = (sandBuildTick * 2.8 + idx * 0.25) % 1;
                        return (
                          <circle
                            key={idx}
                            cx={12 + idx * 17}
                            cy={54 - Math.sin(phase * Math.PI) * 34}
                            r="2.8"
                            fill="#FEF08A"
                            stroke="#D97706"
                            strokeWidth="0.8"
                            opacity={1 - Math.abs(phase - 0.5) * 1.8}
                          />
                        );
                      })}
                    </g>
                  )}
                </g>
              )}
            </g>
          </g>
        );
      }

      case 'beach_picnic_mat': {
        const cakeLv = beachPicnicLevels.cake;
        const strawLv = beachPicnicLevels.strawberry;
        const appleLv = beachPicnicLevels.apple;
        const juiceLv = beachPicnicLevels.orange_juice;
        const juiceFillH = juiceLv === 3 ? 19 : juiceLv === 2 ? 12.5 : juiceLv === 1 ? 6 : 0;

        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {hoveredDropZone === 'beach_picnic' && (
              <ellipse
                cx={obj.lebar / 2}
                cy={obj.tinggi / 2 + 12}
                rx="96"
                ry="54"
                fill="rgba(244, 63, 94, 0.24)"
                stroke="#E11D48"
                strokeWidth="3"
                strokeDasharray="7 5"
              />
            )}
            {/* Red & Cream Checkered Beach Picnic Mat (Tikar Piknik) */}
            <polygon
              points="18,44 170,44 186,118 2,118"
              fill="#FFFDF9"
              stroke="#2D2520"
              strokeWidth="2.5"
            />
            <polygon points="18,44 56,44 48,118 2,118" fill="#FDA4AF" opacity="0.65" />
            <polygon points="94,44 132,44 140,118 94,118" fill="#FDA4AF" opacity="0.65" />
            <polygon points="10,80 178,80 182,100 6,100" fill="#FB7185" opacity="0.42" />
            {/* Woven Mat Border Stripes */}
            <line x1="18" y1="44" x2="170" y2="44" stroke="#E11D48" strokeWidth="3" />
            <line x1="2" y1="118" x2="186" y2="118" stroke="#E11D48" strokeWidth="3" />

            {/* Low Wooden Picnic Table on Top of Mat (Meja Piknik) */}
            <g transform="translate(20, 48)">
              {/* Table Legs */}
              <rect x="12" y="34" width="10" height="22" rx="2.5" fill="#92400E" stroke="#2D2520" strokeWidth="2" />
              <rect x="126" y="34" width="10" height="22" rx="2.5" fill="#92400E" stroke="#2D2520" strokeWidth="2" />
              {/* Wooden Tabletop */}
              <polygon
                points="6,10 142,10 148,40 0,40"
                fill="#D97706"
                stroke="#2D2520"
                strokeWidth="2.4"
              />
              <polygon points="8,12 140,12 144,34 4,34" fill="#F59E0B" />
              <line x1="6" y1="22" x2="142" y2="22" stroke="#B45309" strokeWidth="1.2" opacity="0.55" />

              {/* 1. KUE PIKNIK (Depletes 3 -> 2 -> 1 -> 0 crumbs) */}
              <g transform="translate(26, 22)">
                {activePicnicEatingItem === 'cake' && (
                  <circle cx="0" cy="-4" r="15" fill="#FEF08A" opacity="0.55" />
                )}
                <ellipse cx="0" cy="4" rx="15" ry="6" fill="#FFFDF9" stroke="#2D2520" strokeWidth="1.6" />
                {cakeLv >= 3 ? (
                  <g>
                    <rect x="-11" y="-10" width="22" height="13" rx="3" fill="#FDE68A" stroke="#2D2520" strokeWidth="1.6" />
                    <path d="M -11 -4 Q -6 0 0 -4 Q 6 0 11 -4 L 11 -10 L -11 -10 Z" fill="#F472B6" stroke="#2D2520" strokeWidth="1.4" />
                    <circle cx="0" cy="-12" r="3" fill="#EF4444" stroke="#2D2520" strokeWidth="1.2" />
                  </g>
                ) : cakeLv === 2 ? (
                  <g>
                    <rect x="-11" y="-10" width="15" height="13" rx="2.5" fill="#FDE68A" stroke="#2D2520" strokeWidth="1.6" />
                    <path d="M -11 -4 Q -5 0 4 -4 L 4 -10 L -11 -10 Z" fill="#F472B6" stroke="#2D2520" strokeWidth="1.4" />
                    <circle cx="-3" cy="-12" r="2.6" fill="#EF4444" stroke="#2D2520" strokeWidth="1.2" />
                  </g>
                ) : cakeLv === 1 ? (
                  <g>
                    <polygon points="-8,3 4,3 2,-9 -8,-6" fill="#FDE68A" stroke="#2D2520" strokeWidth="1.6" />
                    <line x1="-8" y1="-5" x2="2" y2="-8" stroke="#F472B6" strokeWidth="3.5" strokeLinecap="round" />
                  </g>
                ) : (
                  <g fill="#D97706">
                    <circle cx="-4" cy="3" r="1.4" />
                    <circle cx="3" cy="2" r="1.2" />
                    <circle cx="0" cy="5" r="1.1" />
                  </g>
                )}
              </g>

              {/* 2. STRAWBERRY PLATE (3 -> 2 -> 1 -> 0) */}
              <g transform="translate(61, 23)">
                {activePicnicEatingItem === 'strawberry' && (
                  <circle cx="0" cy="-4" r="14" fill="#FEF08A" opacity="0.55" />
                )}
                <ellipse cx="0" cy="4" rx="14" ry="5.5" fill="#FFFDF9" stroke="#2D2520" strokeWidth="1.6" />
                {strawLv >= 1 && (
                  <g transform="translate(-6, -2)">
                    <path d="M -4 -3 Q 0 -6 4 -3 Q 4 4 0 6 Q -4 4 -4 -3 Z" fill="#EF4444" stroke="#2D2520" strokeWidth="1.3" />
                    <path d="M -3 -4 L 0 -6 L 3 -4" fill="#22C55E" stroke="#15803D" strokeWidth="1.2" />
                  </g>
                )}
                {strawLv >= 2 && (
                  <g transform="translate(5, -2)">
                    <path d="M -4 -3 Q 0 -6 4 -3 Q 4 4 0 6 Q -4 4 -4 -3 Z" fill="#F43F5E" stroke="#2D2520" strokeWidth="1.3" />
                    <path d="M -3 -4 L 0 -6 L 3 -4" fill="#22C55E" stroke="#15803D" strokeWidth="1.2" />
                  </g>
                )}
                {strawLv >= 3 && (
                  <g transform="translate(0, -7)">
                    <path d="M -4 -3 Q 0 -6 4 -3 Q 4 4 0 6 Q -4 4 -4 -3 Z" fill="#DC2626" stroke="#2D2520" strokeWidth="1.3" />
                    <path d="M -3 -4 L 0 -6 L 3 -4" fill="#22C55E" stroke="#15803D" strokeWidth="1.2" />
                  </g>
                )}
              </g>

              {/* 3. APEL MERAH (Whole -> 1 Bite -> Half -> Apple Core) */}
              <g transform="translate(94, 22)">
                {activePicnicEatingItem === 'apple' && (
                  <circle cx="0" cy="-4" r="13" fill="#FEF08A" opacity="0.55" />
                )}
                <ellipse cx="0" cy="5" rx="11" ry="4.5" fill="#FFFDF9" stroke="#2D2520" strokeWidth="1.5" />
                {appleLv >= 3 ? (
                  <g>
                    <circle cx="0" cy="-3" r="8" fill="#EF4444" stroke="#2D2520" strokeWidth="1.6" />
                    <line x1="0" y1="-11" x2="1" y2="-15" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" />
                    <ellipse cx="4.5" cy="-13" rx="3.5" ry="2" fill="#22C55E" stroke="#2D2520" strokeWidth="1" />
                  </g>
                ) : appleLv === 2 ? (
                  <g>
                    <path d="M 0 -11 C -7 -11 -9 -4 -7 3 C -5 6 2 6 5 3 C 2 1 2 -5 5 -8 C 3 -10 2 -11 0 -11 Z" fill="#EF4444" stroke="#2D2520" strokeWidth="1.6" />
                    <path d="M 4 -8 C 1.5 -5 1.5 1 4.5 3" fill="none" stroke="#FEF3C7" strokeWidth="2.6" />
                    <line x1="0" y1="-11" x2="1" y2="-15" stroke="#78350F" strokeWidth="1.8" />
                  </g>
                ) : appleLv === 1 ? (
                  <g>
                    <path d="M -3 -10 L 3 -10 L 1.5 -3 L 3 4 L -3 4 L -1.5 -3 Z" fill="#FEF3C7" stroke="#2D2520" strokeWidth="1.4" />
                    <path d="M -4 -10 Q 0 -12 4 -10" fill="none" stroke="#EF4444" strokeWidth="2.4" strokeLinecap="round" />
                    <path d="M -4 4 Q 0 6 4 4" fill="none" stroke="#EF4444" strokeWidth="2.4" strokeLinecap="round" />
                  </g>
                ) : (
                  <g>
                    <line x1="-1" y1="-4" x2="1" y2="3" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="0" cy="0" r="1.2" fill="#2D2520" />
                  </g>
                )}
              </g>

              {/* 4. JUS JERUK (Tall Glass whose orange juice level visibly drops 3 -> 2 -> 1 -> 0) */}
              <g transform="translate(124, 18)">
                {activePicnicEatingItem === 'orange_juice' && (
                  <circle cx="0" cy="-4" r="14" fill="#FEF08A" opacity="0.55" />
                )}
                {/* Striped Straw */}
                <line x1="2" y1="-16" x2="8" y2="-23" stroke="#EF4444" strokeWidth="2.6" strokeLinecap="round" />
                <line x1="0" y1="4" x2="2" y2="-16" stroke="#FB7185" strokeWidth="2.2" />
                {/* Glass Body */}
                <polygon
                  points="-8,-14 8,-14 6,8 -6,8"
                  fill="rgba(224,242,254,0.68)"
                  stroke="#2D2520"
                  strokeWidth="1.8"
                />
                {/* Orange Juice Liquid Level */}
                {juiceFillH > 0 && (
                  <rect
                    x="-6"
                    y={7 - juiceFillH}
                    width="12"
                    height={juiceFillH}
                    rx="1.5"
                    fill="#FB923C"
                    stroke="#EA580C"
                    strokeWidth="1"
                  />
                )}
                {/* Cute Orange Slice on Rim */}
                <circle cx="-7" cy="-13" r="4" fill="#F97316" stroke="#2D2520" strokeWidth="1.2" />
                <circle cx="-7" cy="-13" r="2.2" fill="#FDE047" />
              </g>
            </g>
          </g>
        );
      }

      case 'seashell_shore': {
        const isDiggingNow = beachActivityMode === 'digging_sand';
        const holeScale = isDiggingNow
          ? Math.max(0.25, beachDiggingProgress / 100)
          : dugShells.length > 0
          ? 1
          : 0;

        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {hoveredDropZone === 'beach_dig' && (
              <ellipse
                cx="64"
                cy="66"
                rx="64"
                ry="38"
                fill="rgba(245, 158, 11, 0.28)"
                stroke="#B45309"
                strokeWidth="3"
                strokeDasharray="7 5"
              />
            )}
            {/* Damp Coastal Sand Digging Patch */}
            <ellipse
              cx="64"
              cy="74"
              rx="58"
              ry="28"
              fill="#FDE68A"
              stroke="#D97706"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
            {/* Decorative Starfish on Shoreline */}
            <polygon
              points="26,56 29,63 36,63 30,68 32,75 26,70 20,75 22,68 16,63 23,63"
              fill="#FB7185"
              stroke="#2D2520"
              strokeWidth="1.4"
            />

            {/* Dug Sand Hole & Flying Sand Grains */}
            {holeScale > 0 && (
              <g transform={`translate(62, 76) scale(${holeScale}) translate(-62, -76)`}>
                <ellipse cx="62" cy="76" rx="22" ry="11" fill="#B45309" opacity="0.55" stroke="#78350F" strokeWidth="1.8" />
                <ellipse cx="62" cy="79" rx="16" ry="7" fill="#78350F" opacity="0.45" />
                <path d="M 38 72 Q 46 64 54 70" fill="#FCD34D" stroke="#B45309" strokeWidth="1.4" />
                <path d="M 70 70 Q 78 63 86 72" fill="#FCD34D" stroke="#B45309" strokeWidth="1.4" />
              </g>
            )}
            {isDiggingNow && (
              <g>
                {[0, 1, 2, 3].map((idx) => {
                  const p = (beachDigTick * 3.4 + idx * 0.24) % 1;
                  return (
                    <circle
                      key={idx}
                      cx={44 + idx * 12 + Math.sin(p * Math.PI) * (idx % 2 === 0 ? -8 : 8)}
                      cy={74 - Math.sin(p * Math.PI) * 32}
                      r="3"
                      fill="#FDE047"
                      stroke="#B45309"
                      strokeWidth="0.9"
                      opacity={1 - Math.abs(p - 0.5) * 1.8}
                    />
                  );
                })}
              </g>
            )}

            {/* INTERACTIVE SHELL BUCKET (EMBER KERANG) ON RIGHT SIDE — GLOWS WHEN DRAGGING A SHELL! */}
            <g transform="translate(114, 46)">
              {(draggingShell || isOverShellBucket) && (
                <ellipse
                  cx="24"
                  cy="28"
                  rx="30"
                  ry="28"
                  fill={isOverShellBucket ? 'rgba(16, 185, 129, 0.34)' : 'rgba(56, 189, 248, 0.26)'}
                  stroke={isOverShellBucket ? '#059669' : '#0284C7'}
                  strokeWidth="3"
                  strokeDasharray="6 4"
                />
              )}
              {/* Shadow under bucket */}
              <ellipse cx="24" cy="48" rx="22" ry="6" fill="url(#furnitureShadow)" />
              {/* Bucket Handle */}
              <path d="M 6 14 Q 24 -8 42 14" fill="none" stroke="#2D2520" strokeWidth="2.8" strokeLinecap="round" />
              {/* Shells Visible Inside Bucket Top as You Collect Them! */}
              {beachShellStock >= 1 && (
                <ellipse cx="17" cy="13" rx="7" ry="4.5" fill="#FBCFE8" stroke="#2D2520" strokeWidth="1.4" />
              )}
              {beachShellStock >= 2 && (
                <ellipse cx="29" cy="12" rx="7" ry="4.5" fill="#FEF08A" stroke="#2D2520" strokeWidth="1.4" />
              )}
              {beachShellStock >= 3 && (
                <ellipse cx="23" cy="9" rx="6.5" ry="4" fill="#FED7AA" stroke="#2D2520" strokeWidth="1.4" />
              )}
              {/* Teal & Yellow Striped Beach Bucket Body */}
              <polygon
                points="4,14 44,14 38,47 10,47"
                fill="#0EA5E9"
                stroke="#2D2520"
                strokeWidth="2.4"
              />
              <polygon points="6,26 42,26 40,34 8,34" fill="#FDE047" stroke="#2D2520" strokeWidth="1.4" />
              {/* Rim */}
              <rect x="2" y="11" width="44" height="6" rx="3" fill="#38BDF8" stroke="#2D2520" strokeWidth="2.2" />
              {/* Cute Shell Emblem on Bucket */}
              <text x="24" y="34" textAnchor="middle" fontSize="11">🐚</text>
            </g>
          </g>
        );
      }

      case 'pendopo_joglo': {
        const isDancingHere =
          currentRoom === 'cultural_village' && culturalActivityMode === 'traditional_dance';
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {/* Drop-zone highlight when dragging baby over Pendopo */}
            {hoveredDropZone === 'cultural_pendopo' && (
              <rect
                x="-6"
                y="2"
                width={obj.lebar + 12}
                height={obj.tinggi + 2}
                rx="18"
                fill="rgba(251,191,36,0.22)"
                stroke="#D97706"
                strokeWidth="3"
                strokeDasharray="7 5"
              />
            )}
            {/* Warm golden dance stage glow when baby performs traditional dance */}
            {isDancingHere && (
              <ellipse
                cx={obj.lebar / 2}
                cy="146"
                rx="78"
                ry="28"
                fill="rgba(253, 224, 71, 0.36)"
              />
            )}
            <ellipse
              cx={obj.lebar / 2}
              cy={obj.tinggi - 8}
              rx={obj.lebar * 0.48}
              ry="14"
              fill="url(#furnitureShadow)"
            />
            {/* Tiered Joglo Roof (Tajug + Limasan) */}
            <polygon
              points={`28,50 ${obj.lebar / 2},4 ${obj.lebar - 28},50`}
              fill="#9A3412"
              stroke="#2D2520"
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
            {/* Gold Crown Finial (Mustaka) */}
            <path
              d={`M ${obj.lebar / 2} 0 L ${obj.lebar / 2 + 5} 7 L ${obj.lebar / 2} 12 L ${obj.lebar / 2 - 5} 7 Z`}
              fill="#FACC15"
              stroke="#2D2520"
              strokeWidth="1.6"
            />
            <polygon
              points={`2,78 ${obj.lebar / 2},34 ${obj.lebar - 2},78`}
              fill="#D97706"
              stroke="#2D2520"
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
            {/* Carved Golden Eave Trim */}
            <rect
              x="12"
              y="74"
              width={obj.lebar - 24}
              height="7"
              rx="2.5"
              fill="#F59E0B"
              stroke="#2D2520"
              strokeWidth="1.8"
            />
            {/* Four Teak Pillars (Saka Guru) with Open Center Stage */}
            <rect x="22" y="80" width="11" height="78" fill="#78350F" stroke="#2D2520" strokeWidth="2.2" />
            <rect x="44" y="80" width="8" height="72" fill="#92400E" stroke="#2D2520" strokeWidth="1.6" />
            <rect
              x={obj.lebar - 52}
              y="80"
              width="8"
              height="72"
              fill="#92400E"
              stroke="#2D2520"
              strokeWidth="1.6"
            />
            <rect
              x={obj.lebar - 33}
              y="80"
              width="11"
              height="78"
              fill="#78350F"
              stroke="#2D2520"
              strokeWidth="2.2"
            />
            {/* Hanging Red-Gold Batik Valance Drapes at Left & Right Corners */}
            <path
              d={`M 33 81 Q 46 96 58 81 M ${obj.lebar - 58} 81 Q ${obj.lebar - 46} 96 ${obj.lebar - 33} 81`}
              fill="#DC2626"
              stroke="#2D2520"
              strokeWidth="1.8"
            />
            {/* Elevated Wooden Stage Platform & Batik Dance Carpet in Open Center */}
            <rect
              x="10"
              y="150"
              width={obj.lebar - 20}
              height="20"
              rx="5"
              fill="#FDE68A"
              stroke="#2D2520"
              strokeWidth="2.4"
            />
            <rect
              x="52"
              y="147"
              width={obj.lebar - 104}
              height="10"
              rx="3"
              fill="#B91C1C"
              stroke="#FACC15"
              strokeWidth="1.6"
            />
            {/* Stone Entry Step */}
            <rect
              x={obj.lebar / 2 - 28}
              y="168"
              width="56"
              height="9"
              rx="3"
              fill="#E5E7EB"
              stroke="#2D2520"
              strokeWidth="2"
            />
            {/* Traditional Gong tucked on Left Side of Pendopo Stage */}
            <g transform="translate(36, 114)">
              <rect x="0" y="0" width="32" height="36" fill="none" stroke="#78350F" strokeWidth="3.2" rx="2" />
              <circle cx="16" cy="20" r="11" fill="#FACC15" stroke="#2D2520" strokeWidth="2" />
              <circle cx="16" cy="20" r="4" fill="#B45309" stroke="#2D2520" strokeWidth="1.4" />
            </g>
            {/* Traditional Kenong / Saron Gamelan tucked on Right Side */}
            <g transform={`translate(${obj.lebar - 72}, 134)`}>
              <rect x="0" y="6" width="34" height="12" rx="3" fill="#991B1B" stroke="#2D2520" strokeWidth="1.8" />
              <circle cx="9" cy="6" r="5" fill="#FACC15" stroke="#2D2520" strokeWidth="1.5" />
              <circle cx="25" cy="6" r="5" fill="#FACC15" stroke="#2D2520" strokeWidth="1.5" />
              <circle cx="9" cy="6" r="1.8" fill="#B45309" />
              <circle cx="25" cy="6" r="1.8" fill="#B45309" />
            </g>
          </g>
        );
      }

      case 'angklung_rack': {
        const isPlayingHere =
          currentRoom === 'cultural_village' && culturalActivityMode === 'playing_angklung';
        const tubes = [
          { x: 24, h: 66, w: 18 },
          { x: 46, h: 58, w: 17 },
          { x: 67, h: 50, w: 16 },
          { x: 87, h: 43, w: 15 },
          { x: 106, h: 36, w: 14 },
        ];
        return (
          <g key={obj.id} transform={`translate(${obj.x}, ${obj.y})`}>
            {/* Drop-zone highlight when dragging baby over Angklung rack */}
            {hoveredDropZone === 'cultural_angklung' && (
              <rect
                x="-6"
                y="-4"
                width={obj.lebar + 12}
                height={obj.tinggi + 8}
                rx="16"
                fill="rgba(251,191,36,0.24)"
                stroke="#D97706"
                strokeWidth="3"
                strokeDasharray="7 5"
              />
            )}
            {/* Ground shadow */}
            <ellipse
              cx={obj.lebar / 2}
              cy={obj.tinggi - 8}
              rx={obj.lebar * 0.46}
              ry="12"
              fill="url(#furnitureShadow)"
            />
            {/* Red-Gold Batik Mat beneath Angklung Stand */}
            <ellipse
              cx={obj.lebar / 2}
              cy={obj.tinggi - 12}
              rx="62"
              ry="12"
              fill="#B91C1C"
              stroke="#FACC15"
              strokeWidth="2"
            />
            {/* Bamboo Stand Frame (A-frame Legs + Top Hanging Bar) */}
            <line x1="16" y1="22" x2="8" y2="118" stroke="#92400E" strokeWidth="6" strokeLinecap="round" />
            <line x1="16" y1="22" x2="8" y2="118" stroke="#D97706" strokeWidth="2.8" strokeLinecap="round" />
            <line x1="130" y1="22" x2="138" y2="118" stroke="#92400E" strokeWidth="6" strokeLinecap="round" />
            <line x1="130" y1="22" x2="138" y2="118" stroke="#D97706" strokeWidth="2.8" strokeLinecap="round" />
            {/* Lower Stabilizer Bamboo Rail */}
            <rect x="10" y="102" width="126" height="7" rx="3.5" fill="#B45309" stroke="#2D2520" strokeWidth="2" />
            {/* Top Bamboo Crossbar where Angklungs Hang */}
            <rect x="10" y="18" width="126" height="9" rx="4.5" fill="#D97706" stroke="#2D2520" strokeWidth="2.2" />
            {/* Decorative Rattan Lashings on Corners */}
            <rect x="12" y="17" width="8" height="11" rx="2" fill="#78350F" stroke="#2D2520" strokeWidth="1.4" />
            <rect x="126" y="17" width="8" height="11" rx="2" fill="#78350F" stroke="#2D2520" strokeWidth="1.4" />

            {/* 5 Graduated Traditional Hanging Bamboo Angklung Instruments */}
            {tubes.map((t, idx) => {
              const topY = 27;
              const bottomY = topY + t.h;
              const leftTubeH = t.h * 0.84;
              const rightTubeH = t.h * 0.62;
              return (
                <g
                  key={idx}
                  className={isPlayingHere && idx === 2 ? 'animate-angklung-shake' : ''}
                  style={{ transformOrigin: `${t.x + t.w / 2}px ${topY}px` }}
                >
                  {/* Hanging cord */}
                  <line
                    x1={t.x + t.w / 2}
                    y1="24"
                    x2={t.x + t.w / 2}
                    y2={topY + 4}
                    stroke="#2D2520"
                    strokeWidth="1.6"
                  />
                  {/* Outer thin bamboo frame */}
                  <rect
                    x={t.x}
                    y={topY + 4}
                    width={t.w}
                    height={t.h - 4}
                    rx="2"
                    fill="none"
                    stroke="#78350F"
                    strokeWidth="2.2"
                  />
                  {/* Tall bamboo resonator tube (left) with beveled top */}
                  <path
                    d={`M ${t.x + 2.5} ${bottomY - 4} L ${t.x + 2.5} ${bottomY - leftTubeH + 4} L ${t.x + t.w * 0.48} ${bottomY - leftTubeH} L ${t.x + t.w * 0.48} ${bottomY - 4} Z`}
                    fill="#FDE68A"
                    stroke="#2D2520"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  {/* Short octave bamboo resonator tube (right) */}
                  <path
                    d={`M ${t.x + t.w * 0.54} ${bottomY - 4} L ${t.x + t.w * 0.54} ${bottomY - rightTubeH + 3} L ${t.x + t.w - 2.5} ${bottomY - rightTubeH} L ${t.x + t.w - 2.5} ${bottomY - 4} Z`}
                    fill="#FCD34D"
                    stroke="#2D2520"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  {/* Bamboo base slider bar */}
                  <rect
                    x={t.x - 1.5}
                    y={bottomY - 6}
                    width={t.w + 3}
                    height="6"
                    rx="2"
                    fill="#B45309"
                    stroke="#2D2520"
                    strokeWidth="1.6"
                  />
                  {/* Rattan cross binding */}
                  <line
                    x1={t.x}
                    y1={bottomY - t.h * 0.36}
                    x2={t.x + t.w}
                    y2={bottomY - t.h * 0.36}
                    stroke="#78350F"
                    strokeWidth="1.8"
                  />
                </g>
              );
            })}

            {/* Musical vibration waves around the rack while baby plays Angklung */}
            {isPlayingHere && (
              <g>
                <path
                  d="M 4 50 Q -4 62 4 74"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
                <path
                  d="M 142 46 Q 150 58 142 70"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
                <text x="72" y="12" textAnchor="middle" fontSize="14">
                  🎵 🎶
                </text>
              </g>
            )}

            {/* Carved wooden nameplate */}
            <rect
              x="36"
              y="108"
              width="74"
              height="16"
              rx="6"
              fill="#FFFBEB"
              stroke="#78350F"
              strokeWidth="1.8"
            />
            <text
              x="73"
              y="119"
              textAnchor="middle"
              fontSize="9"
              fontWeight="800"
              fill="#78350F"
            >
              ANGKLUNG
            </text>
          </g>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      ref={areaRef}
      onClick={handleStageFloorClick}
      style={{
        background: `linear-gradient(180deg, ${colors.right} 0%, ${colors.right} 45%, ${colors.floorTop} 45%, ${colors.floorBottom} 100%)`,
      }}
      className="relative w-full h-full overflow-hidden rounded-t-3xl flex items-center justify-center select-none touch-none"
    >
      {/* ==================== INTERNAL UNIFORM-SCALED STAGE (stageWidth x 620) SCALED 1:1 SO FURNITURE NEVER STRETCHES SIDEWAYS ON DESKTOP/LAPTOP ==================== */}
      <div
        ref={stageRef}
        style={{
          width: `${stageWidth}px`,
          height: `${STAGE_DESIGN_HEIGHT}px`,
          transform: `scale(${stageScale})`,
          transformOrigin: 'center center',
        }}
        className="relative shrink-0 overflow-hidden"
      >
        {/* ==================== LAYER 0 (z-0): FULL-SCREEN ROOM ARCHITECTURE & OUTDOOR SCENERY (stageWidth x 620, 1:1 UNIFORM ASPECT RATIO) ==================== */}
        <svg
          viewBox={`0 0 ${stageWidth} ${STAGE_DESIGN_HEIGHT}`}
          className="absolute inset-0 w-full h-full z-0 pointer-events-none"
        >
          <defs>
            <linearGradient id="stageFloorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.floorTop} />
              <stop offset="100%" stopColor={colors.floorBottom} />
            </linearGradient>
            <linearGradient id="outdoorSkyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colors.left} />
              <stop offset="100%" stopColor={colors.right} />
            </linearGradient>
            <radialGradient id="furnitureShadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(35,25,18,0.30)" />
              <stop offset="100%" stopColor="rgba(35,25,18,0)" />
            </radialGradient>
            <radialGradient id="lampWarmGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(253, 224, 71, 0.58)" />
              <stop offset="55%" stopColor="rgba(251, 191, 36, 0.22)" />
              <stop offset="100%" stopColor="rgba(253, 224, 71, 0)" />
            </radialGradient>
            <linearGradient id="bathWaterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7DD3FC" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
          </defs>

          {!isOutdoor ? (
            <g>
              {/* REQUIREMENT A.4: Wall = Top 45% (y: 0..279), Floor = Bottom 55% (y: 279..620) */}
              <polygon
                points="0,0 54,0 54,279 0,342"
                fill={colors.left}
                stroke="#C8B6A6"
                strokeWidth="2"
              />
              <rect
                x="54"
                y="0"
                width={stageWidth - 54}
                height="279"
                fill={colors.right}
                stroke="#C8B6A6"
                strokeWidth="2"
              />
              {/* Subtle Decorative Wallpaper Stripes / Wainscoting on Back Wall across full stageWidth */}
              <g stroke="rgba(45,37,32,0.05)" strokeWidth="2">
                {Array.from(
                  { length: Math.max(8, Math.floor((stageWidth - 70) / 40)) },
                  (_, idx) => 90 + idx * 40
                ).map((wx) => (
                  <line key={wx} x1={wx} y1="0" x2={wx} y2="269" />
                ))}
              </g>
              <polygon
                points={`0,342 54,279 ${stageWidth},279 ${stageWidth},620 0,620`}
                fill="url(#stageFloorGrad)"
                stroke="#B8A390"
                strokeWidth="2.5"
              />
              {/* Subtle Perspective Floor Plank Lines spanning full stageWidth */}
              <g stroke="rgba(45,37,32,0.09)" strokeWidth="1.5">
                <line x1="54" y1="279" x2="0" y2="342" />
                {[0.2, 0.4, 0.6, 0.8, 0.94].map((ratio, idx) => {
                  const topX = Math.round(54 + (stageWidth - 54) * ratio);
                  const botX = Math.round(stageWidth * ratio + (ratio - 0.5) * 90);
                  return <line key={idx} x1={topX} y1="279" x2={botX} y2="620" />;
                })}
                <line x1="24" y1="335" x2={stageWidth} y2="335" />
                <line x1="0" y1="400" x2={stageWidth} y2="400" />
                <line x1="0" y1="470" x2={stageWidth} y2="470" />
                <line x1="0" y1="545" x2={stageWidth} y2="545" />
              </g>
              {/* Baseboard Molding */}
              <polygon points="0,332 54,269 54,279 0,342" fill="#FFFDF9" stroke="#C8B6A6" strokeWidth="1.5" />
              <rect x="54" y="269" width={stageWidth - 54} height="10" fill="#FFFDF9" stroke="#C8B6A6" strokeWidth="1.5" />
            </g>
          ) : (
            <g>
              {/* Outdoor Sky (Top 45% = 0..279) & Ground (Bottom 55% = 279..620) */}
              <rect x="0" y="0" width={stageWidth} height="279" fill="url(#outdoorSkyGrad)" />
              <circle cx={stageWidth - 62} cy="54" r="26" fill="#FDE047" stroke="#F59E0B" strokeWidth="2.5" />
              <g fill="#FFFFFF" opacity="0.9">
                <ellipse cx={Math.round(stageWidth * 0.2)} cy="56" rx="34" ry="13" />
                <ellipse cx={Math.round(stageWidth * 0.54)} cy="44" rx="40" ry="14" />
              </g>
              {currentRoom === 'beach' ? (
                <g>
                  <rect x="0" y="195" width={stageWidth} height="84" fill="#0284C7" />
                  <path
                    d={`M 0 235 Q ${Math.round(stageWidth * 0.25)} 224 ${Math.round(stageWidth * 0.5)} 235 T ${stageWidth} 235 L ${stageWidth} 282 L 0 282 Z`}
                    fill="#38BDF8"
                  />
                </g>
              ) : (
                <g>
                  <path
                    d={`M 0 235 Q ${Math.round(stageWidth * 0.25)} 180 ${Math.round(stageWidth * 0.54)} 225 T ${stageWidth} 215 L ${stageWidth} 282 L 0 282 Z`}
                    fill="#6EE7B7"
                    stroke="#10B981"
                    strokeWidth="2"
                  />
                  <path
                    d={`M 0 252 Q ${Math.round(stageWidth * 0.33)} 210 ${Math.round(stageWidth * 0.68)} 245 T ${stageWidth} 238 L ${stageWidth} 282 L 0 282 Z`}
                    fill="#34D399"
                    stroke="#059669"
                    strokeWidth="2"
                  />
                </g>
              )}
              <rect x="0" y="279" width={stageWidth} height="341" fill="url(#stageFloorGrad)" stroke="#15803D" strokeWidth="2.5" />
              {/* Outdoor Tree on Right Horizon */}
              {currentRoom !== 'beach' && (
                <g transform={`translate(${stageWidth - 94}, 128)`}>
                  <rect x="26" y="72" width="18" height="72" rx="4" fill="#92400E" stroke="#2D2520" strokeWidth="2.2" />
                  <circle cx="35" cy="48" r="34" fill="#22C55E" stroke="#2D2520" strokeWidth="2.4" />
                  <circle cx="18" cy="62" r="24" fill="#16A34A" stroke="#2D2520" strokeWidth="2" />
                  <circle cx="52" cy="62" r="24" fill="#4ADE80" stroke="#2D2520" strokeWidth="2" />
                </g>
              )}
            </g>
          )}
        </svg>

        {/* ==================== LAYERS 10 & 20 (z-[10] & z-[20]): STRUCTURED ROOM OBJECTS SORTED BY LAYER & Y (1:1 UNIFORM PROPORTIONS) ==================== */}
        {([10, 20] as const).map((layerNum) => (
          <svg
            key={`svg-layer-${layerNum}`}
            viewBox={`0 0 ${stageWidth} ${STAGE_DESIGN_HEIGHT}`}
            style={{ zIndex: layerNum }}
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            {sortedRoomObjects
              .filter((o) => o.lapisan === layerNum)
              .map((obj) => renderPortraitRoomObjectSvg(obj))}

            {/* Dynamic Curved Flexible Shower Hose in Bathroom on Layer 20 */}
            {layerNum === 20 && currentRoom === 'bathroom' && (
              <g>
                <path
                  d={`M ${hoseStartSvgX} ${hoseStartSvgY} Q ${hoseCtrlSvgX} ${hoseCtrlSvgY} ${hoseEndSvgX} ${hoseEndSvgY}`}
                  fill="none"
                  stroke="#2D2520"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d={`M ${hoseStartSvgX} ${hoseStartSvgY} Q ${hoseCtrlSvgX} ${hoseCtrlSvgY} ${hoseEndSvgX} ${hoseEndSvgY}`}
                  fill="none"
                  stroke="#CBD5E1"
                  strokeWidth="3.5"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                />
              </g>
            )}
          </svg>
        ))}

        {/* ==================== REQUIREMENT H: FULL-OBJECT TOUCH HIT AREAS (z-[12..22]) & SMALL 24px CORNER PULSING DOTS (z-[40]) ==================== */}
        {sortedRoomObjects
          .filter((o) => o.dekorasiAtauInteraktif === 'interaktif')
          .map((obj) => (
            <React.Fragment key={`hit-${obj.id}`}>
              {/* Direct touch/drag area covering the object itself */}
              <div
                onPointerDown={(e) => {
                  if (obj.id === 'towel_rack' && currentRoom === 'bathroom') {
                    pointerDownStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
                    handleBathToolPointerDown('towel', e);
                  }
                }}
                onPointerMove={(e) => {
                  if (obj.id === 'towel_rack' && activeBathTool === 'towel') {
                    handleBathToolPointerMove('towel', e);
                  }
                }}
                onPointerUp={(e) => {
                  if (obj.id === 'towel_rack' && activeBathTool === 'towel') {
                    const start = pointerDownStartRef.current;
                    const dist = start ? Math.hypot(e.clientX - start.x, e.clientY - start.y) : 999;
                    handleBathToolPointerUp('towel', e);
                    if (dist < 10) {
                      handleRoomObjectClick(obj, e as unknown as React.MouseEvent);
                    }
                  }
                }}
                onClick={(e) => {
                  if (obj.id === 'towel_rack' && currentRoom === 'bathroom') return;
                  handleRoomObjectClick(obj, e);
                }}
                style={{
                  left: `${obj.x}px`,
                  top: `${obj.y}px`,
                  width: `${obj.lebar}px`,
                  height: `${obj.tinggi}px`,
                  zIndex: obj.lapisan + 2,
                }}
                className={`absolute rounded-xl ${
                  obj.id === 'towel_rack' ? 'cursor-grab active:cursor-grabbing touch-none select-none' : 'cursor-pointer'
                }`}
                title={
                  obj.id === 'towel_rack'
                    ? 'Seret Handuk ke tubuh bayi untuk mengeringkan, atau klik untuk menu!'
                    : obj.nama
                }
              />

              {/* REQUIREMENT H.1, H.2, H.3: Small 24px pulsing dot at top-right corner of interactive object, hidden when any panel is open */}
              {!isAnyPanelOpen && !isLocalStageModalOpen && obj.dotX !== undefined && obj.dotY !== undefined && (
                <button
                  onClick={(e) => handleRoomObjectClick(obj, e)}
                  style={{
                    left: `${obj.dotX}px`,
                    top: `${obj.dotY}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="group absolute z-[40] w-6 h-6 rounded-full bg-amber-300/95 hover:bg-amber-400 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center justify-center transition-transform active:scale-90"
                  title={obj.nama}
                >
                  <span className="w-2 h-2 rounded-full bg-[#2D2520] animate-ping" />
                  <span className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-[#2D2520] text-[#FFFDF9] text-[10px] font-bold whitespace-nowrap shadow">
                    {obj.nama}
                  </span>
                </button>
              )}
            </React.Fragment>
          ))}

        {/* ==================== REQUIREMENT E.5 & C.3: TOP-SLOT SPEECH BUBBLE (z-[40], MAX 85% WIDTH, NEVER COVERS BABY FACE, HIDDEN WHEN PANEL OPEN) ==================== */}
        {!isAnyPanelOpen && !isLocalStageModalOpen && (
          <div
            style={{ transform: 'translate(-50%, 0)' }}
            className="absolute top-2.5 left-1/2 z-[40] w-[85%] max-w-[330px] flex flex-col items-center gap-1 pointer-events-none"
          >
            {Boolean(growthTransition?.isTransitioning) && growthTransition && (
              <div className="px-3 py-1 rounded-2xl bg-amber-200 text-[#2D2520] border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-[11px] font-extrabold text-center leading-tight">
                ✨ Bertumbuh Tinggi: {Math.round(growthTransition.fromScale * 100)}% →{' '}
                {Math.round(growthTransition.toScale * 100)}% Tinggi Dewasa!
              </div>
            )}

            {speechBubble ? (
              <div className="px-3.5 py-1.5 rounded-2xl bg-[#FFFDF9]/95 border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] text-[11px] font-bold text-[#2D2520] w-full whitespace-normal break-words text-center leading-snug">
                {speechBubble}
              </div>
            ) : needsSummary.isSleepy && !isSleeping && !isDragging && currentRoom === 'bedroom' ? (
              <div className="px-3 py-1 rounded-2xl bg-indigo-950/90 text-amber-200 border-2 border-amber-300 shadow-[0_2px_0_#2D2520] text-[11px] font-bold text-center">
                🌙 Mengantuk... Sentuh &amp; Seret ke Kasur!
              </div>
            ) : emotion === 'bored' && !isSleeping ? (
              <div className="px-3 py-1 rounded-2xl bg-amber-100 text-amber-900 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-[11px] font-bold text-center">
                🧸 Bosan... Ajak Aku Bermain!
              </div>
            ) : cleanliness < 55 && !isSleeping && currentRoom !== 'bathroom' ? (
              <div className="px-3 py-1 rounded-2xl bg-sky-100 text-sky-900 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-[11px] font-bold text-center">
                🛁 Tubuh Kotor... Ayo Mandi Bersih!
              </div>
            ) : null}
          </div>
        )}

        {/* Night/Sleep Dimming Scrim Inside Stage */}
        {isSleeping && (
          <div className="absolute inset-0 z-[18] bg-slate-950/40 pointer-events-none transition-opacity duration-500" />
        )}

          {/* ==================== F.5 DRAGGABLE & PRESSABLE BATHROOM TOOLS STACKED VERTICALLY ON RIGHT SIDE (>= 12px SPACING, MIN-H 44px, NO OVERLAP, NO DUPLICATE "SABUN" TEXT) ==================== */}
          {currentRoom === 'bathroom' && !isAnyPanelOpen && !isLocalStageModalOpen && (
            <>
              {/* 1. DRAGGABLE & PRESSABLE SHOWER HEAD (TOP OF RIGHT COLUMN: y=38%) */}
              <div
                onPointerDown={(e) => handleBathToolPointerDown('shower', e)}
                onPointerMove={(e) => handleBathToolPointerMove('shower', e)}
                onPointerUp={(e) => handleBathToolPointerUp('shower', e)}
                onPointerCancel={(e) => handleBathToolPointerUp('shower', e)}
                style={{
                  left: `${showerHeadPos.x}%`,
                  top: `${showerHeadPos.y}%`,
                  transform: 'translate(-50%, -30%)',
                }}
                className={`absolute z-[40] cursor-grab active:cursor-grabbing select-none touch-none flex flex-col items-center ${
                  activeBathTool === 'shower' ? 'scale-105' : 'hover:scale-105 transition-all duration-300'
                }`}
                title="Sentuh & Seret Kepala Shower ke arah tubuh untuk menyemprotkan air bilasan!"
              >
                <span className="mb-1 min-h-[28px] px-2.5 py-1 rounded-xl bg-sky-600 text-white border-2 border-[#2D2520] text-[10px] font-bold shadow flex items-center justify-center whitespace-nowrap">
                  {showerWaterRunning ? '🚿 Menyemprot' : '🚿 Seret Shower'}
                </span>

                <svg viewBox="0 0 120 180" className="w-16 h-24 overflow-visible">
                  <g>
                    <rect
                      x="48"
                      y="4"
                      width="24"
                      height="34"
                      rx="8"
                      fill="#94A3B8"
                      stroke="#2D2520"
                      strokeWidth="2.8"
                    />
                    <ellipse
                      cx="60"
                      cy="40"
                      rx="30"
                      ry="13"
                      fill="#E2E8F0"
                      stroke="#2D2520"
                      strokeWidth="3"
                    />
                    <ellipse
                      cx="60"
                      cy="44"
                      rx="24"
                      ry="8"
                      fill="#38BDF8"
                      stroke="#2D2520"
                      strokeWidth="2.2"
                    />
                    {[44, 52, 60, 68, 76].map((nx) => (
                      <circle key={nx} cx={nx} cy="44" r="2" fill="#0F172A" />
                    ))}
                  </g>

                  {showerWaterRunning && (
                    <g className="pointer-events-none">
                      <polygon
                        points="38,48 82,48 104,170 16,170"
                        fill="rgba(56, 189, 248, 0.24)"
                      />
                      <g
                        stroke="#38BDF8"
                        strokeWidth="2.6"
                        strokeDasharray="9 7"
                        strokeLinecap="round"
                      >
                        <line x1="44" y1="50" x2="26" y2="162" className="animate-pulse" />
                        <line x1="52" y1="52" x2="42" y2="168" />
                        <line x1="60" y1="52" x2="60" y2="172" className="animate-pulse" />
                        <line x1="68" y1="52" x2="78" y2="168" />
                        <line x1="76" y1="50" x2="94" y2="162" className="animate-pulse" />
                      </g>
                      <g fill="#7DD3FC" stroke="#0284C7" strokeWidth="1.2">
                        <circle cx="36" cy="125" r="3.5" className="animate-bounce" />
                        <circle cx="60" cy="140" r="4" className="animate-bounce" />
                        <circle cx="82" cy="128" r="3.5" className="animate-bounce" />
                        <ellipse cx="60" cy="168" rx="34" ry="7" fill="rgba(224,242,254,0.75)" />
                      </g>
                    </g>
                  )}
                </svg>
              </div>

              {/* 2. DRAGGABLE & PRESSABLE SOAP BOTTLE (BOTTOM OF RIGHT COLUMN: y=60%, >= 12px SPACING FROM SHOWER, NO DUPLICATE "SABUN" LABEL ON BOTTLE) */}
              <div
                onPointerDown={(e) => handleBathToolPointerDown('soap', e)}
                onPointerMove={(e) => handleBathToolPointerMove('soap', e)}
                onPointerUp={(e) => handleBathToolPointerUp('soap', e)}
                onPointerCancel={(e) => handleBathToolPointerUp('soap', e)}
                style={{
                  left: `${soapBottlePos.x}%`,
                  top: `${soapBottlePos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute z-[40] cursor-grab active:cursor-grabbing select-none touch-none flex flex-col items-center ${
                  activeBathTool === 'soap' ? 'scale-110' : 'hover:scale-105 transition-all duration-300'
                }`}
                title="Sentuh & Gosokkan Botol Sabun ke kepala, badan, tangan, dan kaki untuk mengeluarkan busa!"
              >
                <span className="mb-1 min-h-[28px] px-2.5 py-1 rounded-xl bg-pink-500 text-white border-2 border-[#2D2520] text-[10px] font-bold shadow flex items-center justify-center whitespace-nowrap">
                  {activeBathTool === 'soap' ? '🧼 Menggosok' : '🧼 Seret Sabun'}
                </span>
                <svg viewBox="0 0 90 104" className="w-12 h-14 overflow-visible">
                  <path
                    d="M 45 24 L 45 10 L 66 10"
                    fill="none"
                    stroke="#2D2520"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  <rect
                    x="35"
                    y="22"
                    width="20"
                    height="10"
                    rx="4"
                    fill="#E2E8F0"
                    stroke="#2D2520"
                    strokeWidth="2.5"
                  />
                  <rect
                    x="18"
                    y="32"
                    width="54"
                    height="62"
                    rx="18"
                    fill="#F472B6"
                    stroke="#2D2520"
                    strokeWidth="3.2"
                  />
                  {/* Decorative Bubble Icon on Bottle instead of duplicate "SABUN" text (F.5) */}
                  <rect
                    x="26"
                    y="45"
                    width="38"
                    height="32"
                    rx="8"
                    fill="#FFF1F2"
                    stroke="#2D2520"
                    strokeWidth="2"
                  />
                  <circle cx="41" cy="61" r="7" fill="#FBCFE8" stroke="#BE185D" strokeWidth="1.8" />
                  <circle cx="51" cy="56" r="4.5" fill="#FCE7F3" stroke="#BE185D" strokeWidth="1.5" />
                  {activeBathTool === 'soap' && (
                    <g fill="#FFFFFF" stroke="#BAE6FD" strokeWidth="1.5">
                      <circle cx="68" cy="16" r="7" className="animate-ping" />
                      <circle cx="24" cy="92" r="9" />
                      <circle cx="44" cy="96" r="11" />
                      <circle cx="64" cy="92" r="9" />
                    </g>
                  )}
                </svg>
              </div>

              {/* 3. DRAGGABLE & RUBBABLE WARM TOWEL (BOTTOM OF RIGHT COLUMN: y=78%, DRAG OVER BABY BODY TO DRY!) */}
              <div
                onPointerDown={(e) => handleBathToolPointerDown('towel', e)}
                onPointerMove={(e) => handleBathToolPointerMove('towel', e)}
                onPointerUp={(e) => handleBathToolPointerUp('towel', e)}
                onPointerCancel={(e) => handleBathToolPointerUp('towel', e)}
                style={{
                  left: `${towelPos.x}%`,
                  top: `${towelPos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute z-[42] cursor-grab active:cursor-grabbing select-none touch-none flex flex-col items-center ${
                  activeBathTool === 'towel' ? 'scale-110' : 'hover:scale-105 transition-all duration-300'
                }`}
                title="Sentuh & Seret Handuk Hangat ke tubuh bayi untuk mengeringkan air & busa setelah mandi!"
              >
                <span className="mb-1 min-h-[28px] px-2.5 py-1 rounded-xl bg-amber-400 text-[#2D2520] border-2 border-[#2D2520] text-[10px] font-bold shadow flex items-center justify-center whitespace-nowrap">
                  {activeBathTool === 'towel'
                    ? towelDryProgress > 0
                      ? `🧺 Mengeringkan (${towelDryProgress}%)`
                      : '🧺 Usapkan ke Bayi!'
                    : '🧺 Seret Handuk'}
                </span>
                <svg viewBox="0 0 96 86" className="w-14 h-12 overflow-visible drop-shadow">
                  {/* Soft Folded Fluffy Yellow Bath Towel */}
                  <rect
                    x="10"
                    y="10"
                    width="76"
                    height="58"
                    rx="12"
                    fill="#FDE047"
                    stroke="#2D2520"
                    strokeWidth="3.2"
                  />
                  {/* Bottom Fold & Fringe Stripe */}
                  <rect
                    x="10"
                    y="48"
                    width="76"
                    height="10"
                    fill="#F59E0B"
                    stroke="#2D2520"
                    strokeWidth="2"
                  />
                  {/* Fluffy Texture Stitching Lines */}
                  <line
                    x1="24"
                    y1="24"
                    x2="72"
                    y2="24"
                    stroke="#FEF08A"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <text
                    x="48"
                    y="41"
                    textAnchor="middle"
                    fill="#92400E"
                    fontSize="11"
                    fontWeight="900"
                  >
                    HANDUK
                  </text>
                  {activeBathTool === 'towel' && (
                    <g>
                      <circle cx="16" cy="14" r="5" fill="#FEF08A" className="animate-ping" />
                      <text x="78" y="18" fontSize="14">
                        ✨
                      </text>
                      <text x="6" y="76" fontSize="13">
                        ✨
                      </text>
                    </g>
                  )}
                </svg>
              </div>
            </>
          )}

          {/* ==================== TAP-TO-MOVE TARGET FLOOR RIPPLE INDICATOR ==================== */}
          {tapMoveMarker && (
            <div
              style={{
                left: `${tapMoveMarker.x}%`,
                top: `${tapMoveMarker.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute z-[20] pointer-events-none flex items-center justify-center"
            >
              <div className="w-9 h-4 rounded-full border-2 border-amber-400 bg-amber-200/45 animate-ping" />
              <div className="absolute w-5 h-2.5 rounded-full bg-amber-400/80 border border-[#2D2520]" />
            </div>
          )}

          {/* ==================== IN-SCENE DOOR / GATE / PATH LOCATION TRANSITION ICON (24px PULSING DOT + HOVER TOOLTIP) ==================== */}
          {onRequestLocationChange && currentRoom !== 'bathroom' && !isAnyPanelOpen && !isLocalStageModalOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                sound.playClick();
                const connected = currentLocationMeta.connectedLocations;
                setOpenObjectMenu({
                  type: 'door',
                  x: currentLocationMeta.doorExitCoords.x,
                  y: Math.max(25, currentLocationMeta.doorExitCoords.y - 10),
                  title: isOutdoor ? 'Gerbang & Jalan Tujuan' : 'Pintu Keluar Ruangan',
                  icon: isOutdoor ? '🚪🌿' : '🚪',
                  options: connected.map((locId) => {
                    const m = getWorldLocationMeta(locId);
                    return {
                      id: locId,
                      label: `Ke ${m.indonesianName}`,
                      emoji: m.iconEmoji,
                    };
                  }),
                });
              }}
              style={{
                left: `${currentLocationMeta.doorExitCoords.x}%`,
                top: `${currentLocationMeta.doorExitCoords.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="group absolute z-[40] w-6 h-6 rounded-full bg-amber-300/95 hover:bg-amber-400 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center justify-center transition-transform hover:scale-110"
              title={isOutdoor ? 'Pindah Area' : 'Pintu Keluar Ruangan'}
            >
              <span className="w-2 h-2 rounded-full bg-[#2D2520] animate-ping" />
              <span className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-[#2D2520] text-[#FFFDF9] text-[10px] font-bold whitespace-nowrap shadow">
                {isOutdoor ? 'Pindah Area' : 'Pintu Keluar'}
              </span>
            </button>
          )}

          {/* ==================== COMPACT OPTIONAL DIRECTIONAL MINI-JOYSTICK (BOTTOM-LEFT) ==================== */}
          {currentRoom !== 'bathroom' && !isSleeping && !isAnyPanelOpen && !isLocalStageModalOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2 left-2 z-[40] flex flex-col items-start gap-1"
            >
              {showMiniJoystick && (
                <div className="bg-[#FFFDF9]/90 backdrop-blur-sm border-2 border-[#2D2520] rounded-2xl p-1.5 shadow-[0_3px_0_#2D2520] grid grid-cols-3 gap-1 w-24 h-24">
                  <div />
                  <button
                    onClick={() => handleJoystickNudge(0, -7)}
                    className="rounded-lg bg-amber-100 hover:bg-amber-200 border border-[#2D2520] text-xs font-bold flex items-center justify-center active:scale-90"
                    title="Jalan ke Atas"
                  >
                    ▲
                  </button>
                  <div />
                  <button
                    onClick={() => handleJoystickNudge(-9, 0)}
                    className="rounded-lg bg-amber-100 hover:bg-amber-200 border border-[#2D2520] text-xs font-bold flex items-center justify-center active:scale-90"
                    title="Jalan ke Kiri"
                  >
                    ◀
                  </button>
                  <div className="flex items-center justify-center text-[10px] font-bold text-[#6E6259]">
                    👣
                  </div>
                  <button
                    onClick={() => handleJoystickNudge(9, 0)}
                    className="rounded-lg bg-amber-100 hover:bg-amber-200 border border-[#2D2520] text-xs font-bold flex items-center justify-center active:scale-90"
                    title="Jalan ke Kanan"
                  >
                    ▶
                  </button>
                  <div />
                  <button
                    onClick={() => handleJoystickNudge(0, 7)}
                    className="rounded-lg bg-amber-100 hover:bg-amber-200 border border-[#2D2520] text-xs font-bold flex items-center justify-center active:scale-90"
                    title="Jalan ke Bawah"
                  >
                    ▼
                  </button>
                  <div />
                </div>
              )}
              <button
                onClick={() => setShowMiniJoystick((v) => !v)}
                className="w-7 h-7 rounded-full bg-[#FFFDF9]/90 hover:bg-amber-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-[11px] font-bold text-[#2D2520] flex items-center justify-center"
                title="Sentuh lantai untuk berjalan, atau buka tombol arah gerak"
              >
                <span>🕹️</span>
              </button>
            </div>
          )}

          {/* ==================== D.1 & D.2 PROPORTIONAL BABY CHARACTER LAYER (22%-28% OF STAGE HEIGHT = ~136px-174px, SMALLER THAN BED/BATHTUB/WARDROBE, LAYER 30 SORTED BY Y) ==================== */}
          {(() => {
            const officialStageScale = characterScale ?? getCharacterScaleForStage(level);
            const proportionProfile = getCharacterProportionProfile(level);
            const isTransitioningGrowth = Boolean(growthTransition?.isTransitioning);
            const isSlidingNow =
              currentRoom === 'playground' &&
              slideAnimPhase !== 'idle' &&
              slidePose !== null &&
              !isDragging;
            const isSwingingNow =
              currentRoom === 'playground' &&
              (onSwing || playgroundSwingActive) &&
              !isDragging &&
              Boolean(swingObj);
            const isOnSeesawNow =
              currentRoom === 'playground' &&
              onSeesaw &&
              !isDragging &&
              Boolean(seesawObj);

            // Compute exact pendulum coordinates on TOP surface of blue swing seat (local y=104 -> radius 86px from pivot y=18)
            let swingSeatXPct = babyPos.x;
            let swingSeatYPct = babyPos.y;
            if (isSwingingNow && swingObj) {
              const pivotX = swingObj.x + swingObj.lebar / 2;
              const pivotY = swingObj.y + 18;
              const seatRadius = 86;
              const rad = (swingAngle * Math.PI) / 180;
              const sx = pivotX - Math.sin(rad) * seatRadius;
              const sy = pivotY + Math.cos(rad) * seatRadius;
              swingSeatXPct = Number(((sx / stageWidth) * 100).toFixed(2));
              swingSeatYPct = Number(((sy / STAGE_DESIGN_HEIGHT) * 100).toFixed(2));
            }

            // Compute exact rotated TOP surface of left blue seesaw seat pad (local x=35, y=38 -> offset dx=-68, dy=-10 from pivot 103,48)
            let seesawSeatXPct = babyPos.x;
            let seesawSeatYPct = babyPos.y;
            if (isOnSeesawNow && seesawObj) {
              const pivotX = seesawObj.x + 103;
              const pivotY = seesawObj.y + 48;
              const dx = -68;
              const dy = -10;
              const rad = (seesawAngle * Math.PI) / 180;
              const sx = pivotX + dx * Math.cos(rad) - dy * Math.sin(rad);
              const sy = pivotY + dx * Math.sin(rad) + dy * Math.cos(rad);
              seesawSeatXPct = Number(((sx / stageWidth) * 100).toFixed(2));
              seesawSeatYPct = Number(((sy / STAGE_DESIGN_HEIGHT) * 100).toFixed(2));
            }

            const isSeatedOnPlaygroundProp = isSlidingNow || isSwingingNow || isOnSeesawNow;

            // Section D.1: Baby height is 22% to 28% of 620 stage height (~136px to 174px).
            // Base container is 136x160px (25.8% of 620 stage height). We remap age scale 0.30..1.00 into 0.85..1.08 so all 7 age stages remain visually distinct while staying strictly within 22%..28% of stage height!
            const proportionalVisualScale = effectiveInCrib
              ? 0.76
              : isSlidingNow && slidePose
              ? slidePose.scale
              : isSwingingNow
              ? 0.64
              : isOnSeesawNow
              ? 0.66
              : onToilet && currentRoom === 'bathroom'
              ? 0.8
              : inBathTub && currentRoom === 'bathroom'
              ? 0.88
              : Number((0.84 + ((officialStageScale - 0.3) / 0.7) * 0.24).toFixed(3));

            const renderedBabyX =
              effectiveInCrib && !isDragging
                ? bedSleepPos.x
                : isSlidingNow && slidePose
                ? slidePose.x
                : isSwingingNow
                ? swingSeatXPct
                : isOnSeesawNow
                ? seesawSeatXPct
                : onToilet && currentRoom === 'bathroom' && !isDragging
                ? toiletSeatPos.x
                : inBathTub && currentRoom === 'bathroom' && !isDragging
                ? Number((((bathtubLeftPx + 144) / stageWidth) * 100).toFixed(2))
                : babyPos.x;
            const renderedBabyY =
              effectiveInCrib && !isDragging
                ? bedSleepPos.y
                : isSlidingNow && slidePose
                ? slidePose.y
                : isSwingingNow
                ? swingSeatYPct
                : isOnSeesawNow
                ? seesawSeatYPct
                : onToilet && currentRoom === 'bathroom' && !isDragging
                ? toiletSeatPos.y
                : babyPos.y;

            const babyZIndex =
              effectiveInCrib && !isDragging
                ? 28
                : isSeatedOnPlaygroundProp
                ? 32
                : 30 + Math.round((renderedBabyY / 100) * 8);

            const propTiltDeg =
              isSlidingNow && slidePose
                ? slidePose.tilt
                : isSwingingNow
                ? swingAngle
                : isOnSeesawNow
                ? seesawAngle * 0.45
                : 0;

            return (
              <div
                onPointerDown={handleBabyPointerDown}
                onPointerMove={handleBabyPointerMove}
                onPointerUp={handleBabyPointerUp}
                onPointerCancel={handleBabyPointerUp}
                style={{
                  left: `${renderedBabyX}%`,
                  top: `${renderedBabyY}%`,
                  transformOrigin: isSeatedOnPlaygroundProp ? '50% 90%' : '50% 68%',
                  transform:
                    effectiveInCrib && !isDragging
                      ? 'translate(-50%, -50%)'
                      : isSeatedOnPlaygroundProp
                      ? `translate(-50%, -90%) rotate(${propTiltDeg.toFixed(2)}deg)`
                      : propTiltDeg !== 0
                      ? `translate(-50%, -68%) rotate(${propTiltDeg.toFixed(2)}deg)`
                      : 'translate(-50%, -68%)',
                  zIndex: babyZIndex,
                }}
                className={`absolute flex flex-col items-center justify-end ${
                  isDragging
                    ? 'scale-105'
                    : isSeatedOnPlaygroundProp
                    ? ''
                    : 'transition-all duration-500 ease-out'
                }`}
              >
                {/* Joyful Sparkles when Baby is Lifted High Up on the Seesaw */}
                {isOnSeesawNow && seesawAngle >= 8 && (
                  <div
                    aria-hidden="true"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none z-20 select-none"
                  >
                    <span className="text-sm animate-bounce">✨</span>
                    <span className="text-xs animate-pulse">🌟</span>
                  </div>
                )}
                {/* Floating Musical Notes while Baby shakes the Bamboo Angklung */}
                {currentRoom === 'cultural_village' &&
                  !isDragging &&
                  culturalActivityMode === 'playing_angklung' && (
                    <div
                      aria-hidden="true"
                      className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 pointer-events-none z-20 select-none"
                    >
                      <span className="text-sm animate-bounce">🎵</span>
                      <span className="text-base animate-pulse">🎶</span>
                      <span className="text-xs animate-bounce">✨</span>
                    </div>
                  )}
                {/* Golden Dance Sparkles & Melati Petals while Baby performs Traditional Dance on Pendopo */}
                {currentRoom === 'cultural_village' &&
                  !isDragging &&
                  culturalActivityMode === 'traditional_dance' && (
                    <div
                      aria-hidden="true"
                      className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none z-20 select-none"
                    >
                      <span className="text-xs animate-pulse">✨</span>
                      <span className="text-sm animate-bounce">🌺</span>
                      <span className="text-xs animate-pulse">✨</span>
                    </div>
                  )}
                {/* Sliding Speed Wind & Sparkle Trail while swoosh-sliding down the chute */}
                {isSlidingNow && slideAnimPhase === 'sliding' && (
                  <div
                    aria-hidden="true"
                    className="absolute -left-7 top-4 flex flex-col items-start gap-1 pointer-events-none z-20 select-none"
                  >
                    <span className="text-sm animate-pulse">💨</span>
                    <span className="text-xs -mt-1 ml-2 animate-bounce">✨</span>
                  </div>
                )}
                {/* Floating Toilet Action Pill when Baby is Sitting on the Toilet */}
                {currentRoom === 'bathroom' && onToilet && !isDragging && (
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute -top-11 left-1/2 -translate-x-1/2 z-[45] flex items-center gap-1 bg-[#FFFDF9]/95 border-2 border-[#2D2520] rounded-2xl px-2 py-1 shadow-[0_3px_0_#2D2520] whitespace-nowrap"
                  >
                    <button
                      onClick={() => performToiletAction('pee')}
                      className="px-2 py-1 rounded-xl bg-sky-200 hover:bg-sky-300 active:scale-95 border border-[#2D2520] text-[10px] font-bold text-[#2D2520] flex items-center gap-1 cursor-pointer"
                      title="Buang Air Kecil (BAK - Kebersihan turun 20%)"
                    >
                      <span>💦</span>
                      <span>BAK</span>
                    </button>
                    <button
                      onClick={() => performToiletAction('poop')}
                      className="px-2 py-1 rounded-xl bg-amber-200 hover:bg-amber-300 active:scale-95 border border-[#2D2520] text-[10px] font-bold text-[#2D2520] flex items-center gap-1 cursor-pointer"
                      title="Buang Air Besar (BAB - Kebersihan turun 32%)"
                    >
                      <span>💩</span>
                      <span>BAB</span>
                    </button>
                    <button
                      onClick={() => {
                        setOnToilet(false);
                        setInBathTub(true);
                        targetPosRef.current = { x: 47, y: 73 };
                        setBabyPos({ x: 47, y: 73 });
                        sound.playSplash();
                      }}
                      className="px-2 py-1 rounded-xl bg-emerald-200 hover:bg-emerald-300 active:scale-95 border border-[#2D2520] text-[10px] font-bold text-[#2D2520] flex items-center gap-1 cursor-pointer"
                      title="Pindah ke Bak Mandi untuk dibersihkan"
                    >
                      <span>🛁</span>
                      <span>Mandi</span>
                    </button>
                  </div>
                )}
                {/* Fallback Soft Floating Zzz Particles when sleeping outside the bedroom bed */}
                {(isSleeping || effectiveInCrib) &&
                  !(currentRoom === 'bedroom' && effectiveInCrib && !isDragging && bedObj) && (
                    <div
                      className="absolute -top-6 left-1/2 -translate-x-1/2 w-20 h-16 pointer-events-none z-20 overflow-visible"
                      aria-hidden="true"
                    >
                      <span
                        className="absolute bottom-0 left-3 font-display text-xs font-extrabold text-amber-100 animate-zzz-1"
                        style={{
                          textShadow:
                            '0 1px 4px rgba(30,27,75,0.55), 0 0 8px rgba(254,240,138,0.55)',
                        }}
                      >
                        z
                      </span>
                      <span
                        className="absolute bottom-1 left-6 font-display text-sm font-extrabold text-indigo-100 animate-zzz-2"
                        style={{
                          textShadow:
                            '0 1px 4px rgba(30,27,75,0.55), 0 0 8px rgba(199,210,254,0.6)',
                        }}
                      >
                        Z
                      </span>
                      <span
                        className="absolute bottom-2 left-8 font-display text-base font-extrabold text-amber-200 animate-zzz-3"
                        style={{
                          textShadow:
                            '0 2px 6px rgba(30,27,75,0.55), 0 0 10px rgba(253,230,138,0.55)',
                        }}
                      >
                        z
                      </span>
                    </div>
                  )}

                {/* Gradual Growth Transition Soft Aura & Sparkle Particles */}
                {isTransitioningGrowth && (
                  <div className="absolute inset-x-0 bottom-2 h-36 flex items-end justify-center pointer-events-none z-0">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-t from-amber-300/65 via-yellow-200/45 to-pink-200/20 blur-md animate-pulse" />
                    <span className="absolute bottom-8 left-2 text-lg animate-bounce">✨</span>
                    <span className="absolute bottom-16 right-2 text-lg animate-bounce">🌟</span>
                  </div>
                )}

                {/* Floating Action Particles (Hearts, Bubbles, Coins, Stars) */}
                <div className="absolute inset-0 pointer-events-none overflow-visible z-20">
                  {particles.map((p) => (
                    <span
                      key={p.id}
                      style={{ left: `${p.x}%`, top: `${p.y}%` }}
                      className="absolute text-xl animate-particle-rise"
                    >
                      {p.emoji}
                    </span>
                  ))}
                </div>

                {/* Character Sprite with Bottom-Center Foot Anchor & Proportional 22%-28% Stage Height */}
                <div
                  style={{
                    transform:
                      facingLeft &&
                      !effectiveInCrib &&
                      !inBathTub &&
                      !isSlidingNow &&
                      !isSwingingNow &&
                      !isOnSeesawNow
                        ? 'scaleX(-1)'
                        : 'scaleX(1)',
                    transformOrigin: effectiveInCrib ? '50% 50%' : '50% 91.5%',
                  }}
                  className="relative z-10 transition-transform duration-200"
                  title={`Stage ${level}: Tinggi ${proportionProfile.relativeHeightPercent}% Dewasa (Scale ${officialStageScale.toFixed(2)})`}
                >
                  <BabyCharacterSVG
                    appearance={appearance}
                    gender={gender}
                    level={level}
                    actionState={
                      effectiveInCrib
                        ? 'sleeping'
                        : isSlidingNow || isSwingingNow || isOnSeesawNow
                        ? 'laughing'
                        : overrideActionState || actionState
                    }
                    isSleeping={isSleeping || effectiveInCrib}
                    needsSummary={needsSummary}
                    sizeClass="w-[136px] h-[160px]"
                    applyAgeProportionScale={true}
                    customVisualScale={proportionalVisualScale}
                    isCarried={isDragging}
                    inCrib={effectiveInCrib}
                    blanketPulled={blanketPulled || effectiveInCrib}
                    blanketColor="#34D399"
                    inBathTub={inBathTub && currentRoom === 'bathroom'}
                    soapFoamActive={soapFoamActive}
                    emotion={emotion}
                    cleanliness={cleanliness}
                    bathingProgress={bathingProgress}
                    isShowerRinsing={showerWaterRunning && activeHoveredBodyZone !== null}
                    peekabooHandsCovered={peekabooHandsCovered}
                    heldPropEmoji={heldPropEmoji}
                    seatedOnProp={
                      isSwingingNow
                        ? 'swing'
                        : isSlidingNow
                        ? 'slide'
                        : isOnSeesawNow
                        ? 'seesaw'
                        : null
                    }
                    beachPose={
                      currentRoom === 'beach' && !isDragging
                        ? beachActivityMode === 'idle'
                          ? null
                          : beachActivityMode
                        : null
                    }
                    culturalPose={
                      currentRoom === 'cultural_village' && !isDragging
                        ? culturalActivityMode === 'idle'
                          ? null
                          : culturalActivityMode
                        : null
                    }
                  />
                </div>

                {/* CILUKBA VARIASI 4: 24px PULSING DOT NEAR CHARACTER (Hidden when any panel is open or sleeping) */}
                {!isSleeping &&
                  !effectiveInCrib &&
                  currentRoom !== 'bathroom' &&
                  !isAnyPanelOpen &&
                  !isLocalStageModalOpen && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playPop();
                      setActiveActivityType('cilukba');
                      setCilukbaVariation(4);
                      setActiveActivityTitle('Cilukba Variasi 4');
                      setActiveActivityIcon('🙈');
                      setPeekabooHandsCovered(true);
                      setActivityState('interacting');
                      setActiveActivityInstruction(
                        'Karakter menutup wajahnya! Sentuh karakter untuk membuka tangan & tertawa!'
                      );
                      if (onInWorldCharacterReaction) {
                        onInWorldCharacterReaction(
                          'playing',
                          'Ciluk... 🙈 (Sentuh aku untuk Cilukba!)',
                          '🙈'
                        );
                      }
                    }}
                    style={{
                      bottom: '88px',
                    }}
                    className="group absolute -right-2 z-[40] w-6 h-6 rounded-full bg-amber-300/95 hover:bg-amber-400 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center justify-center active:translate-y-0.5 transition-all"
                    title="Ajak Cilukba!"
                  >
                    <span className="text-[11px]">🙈</span>
                    <span className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-[#2D2520] text-[#FFFDF9] text-[10px] font-bold whitespace-nowrap shadow">
                      Cilukba
                    </span>
                  </button>
                )}
              </div>
            );
          })()}

          {/* ==================== E.2 BED LAYER 3 (PULLED-UP 3D GREEN QUILT BLANKET & FRONT WOODEN BED FRAME AT Z-[35] COVERING ONLY CHEST TO FEET x=104..208 SO FACE AT x=50..94 IS 100% VISIBLE) ==================== */}
          {currentRoom === 'bedroom' && effectiveInCrib && !isDragging && bedObj && (
            <svg
              viewBox="0 0 214 156"
              style={{
                left: `${bedObj.x}px`,
                top: `${bedObj.y}px`,
                width: `${bedObj.lebar}px`,
                height: `${bedObj.tinggi}px`,
              }}
              className="absolute z-[35] pointer-events-none overflow-visible"
            >
              {/* Pulled-up 3D Perspective Green Quilt Blanket Covering ONLY Chest, Torso & Legs (x=104..208), leaving Head & Face on Pillow (x=48..96) 100% Uncovered! */}
              <g
                className="animate-blanket-breathe"
                style={{ transformBox: 'fill-box', transformOrigin: '50% 95%' }}
              >
                {/* Soft Blanket Top Surface draped from chest (x=104..122) to foot of bed (x=182..208) */}
                <path
                  d="M 104 86 Q 112 56 124 56 L 208 58 L 182 86 Z"
                  fill="#34D399"
                  stroke="#2D2520"
                  strokeWidth="2.5"
                />
                {/* Soft Light-Green Collar Fold at Character's Chest/Shoulders (x=102..126) */}
                <path
                  d="M 102 86 L 120 56 L 132 56 L 114 86 Z"
                  fill="#A7F3D0"
                  stroke="#2D2520"
                  strokeWidth="2.2"
                />
                {/* Front Hanging Drape of Blanket over Front Mattress Edge */}
                <rect
                  x="104"
                  y="86"
                  width="78"
                  height="16"
                  rx="4"
                  fill="#10B981"
                  stroke="#2D2520"
                  strokeWidth="2.4"
                />
                {/* Decorative Quilt Stitching & Star Dots */}
                <line
                  x1="142"
                  y1="57"
                  x2="124"
                  y2="84"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                />
                <line
                  x1="172"
                  y1="58"
                  x2="154"
                  y2="84"
                  stroke="rgba(255,255,255,0.6)"
                  strokeWidth="2"
                  strokeDasharray="5 4"
                />
                <circle cx="146" cy="70" r="3.5" fill="#FEF08A" />
                <circle cx="174" cy="72" r="3.5" fill="#FEF08A" />
              </g>
              {/* Front Wooden Bed Frame & Legs in front of Mattress so Character is 100% Inside the Bed */}
              <rect
                x="20"
                y="100"
                width="164"
                height="36"
                rx="7"
                fill={cribItem.primaryColor}
                stroke="#2D2520"
                strokeWidth="2.8"
              />
              <polygon
                points="184,100 212,72 212,108 184,136"
                fill="#92400E"
                stroke="#2D2520"
                strokeWidth="2.6"
              />
              <rect x="26" y="135" width="12" height="18" rx="3" fill="#78350F" stroke="#2D2520" strokeWidth="2" />
              <rect x="166" y="135" width="12" height="18" rx="3" fill="#78350F" stroke="#2D2520" strokeWidth="2" />
              <rect x="196" y="106" width="11" height="16" rx="3" fill="#451A03" stroke="#2D2520" strokeWidth="2" />
            </svg>
          )}

          {/* ==================== E.3 SLOW-FLOATING DREAMY 'ZZZ' PARTICLES ABOVE THE BED WHILE SLEEPING (Z-[38]) ==================== */}
          {currentRoom === 'bedroom' && effectiveInCrib && !isDragging && bedObj && (
            <div
              aria-hidden="true"
              style={{
                left: `${bedObj.x + bedObj.lebar * 0.22}px`,
                top: `${bedObj.y - 38}px`,
                width: `${bedObj.lebar * 0.66}px`,
                height: '112px',
              }}
              className="absolute z-[38] pointer-events-none overflow-visible select-none"
            >
              <span
                className="absolute bottom-5 left-5 font-display text-xs font-extrabold tracking-wide text-amber-100 animate-zzz-1"
                style={{
                  textShadow:
                    '0 1px 4px rgba(30,27,75,0.6), 0 0 8px rgba(254,240,138,0.55)',
                }}
              >
                z
              </span>
              <span
                className="absolute bottom-7 left-9 font-display text-sm font-extrabold tracking-wide text-indigo-100 animate-zzz-2"
                style={{
                  textShadow:
                    '0 2px 5px rgba(30,27,75,0.6), 0 0 10px rgba(199,210,254,0.65)',
                }}
              >
                z
              </span>
              <span
                className="absolute bottom-8 left-12 font-display text-lg font-extrabold tracking-wide text-amber-200 animate-zzz-3"
                style={{
                  textShadow:
                    '0 2px 6px rgba(30,27,75,0.62), 0 0 12px rgba(253,230,138,0.6)',
                }}
              >
                Z
              </span>
              <span
                className="absolute bottom-9 left-7 font-display text-base font-extrabold tracking-wide text-violet-100 animate-zzz-4"
                style={{
                  textShadow:
                    '0 2px 6px rgba(30,27,75,0.58), 0 0 10px rgba(221,214,254,0.65)',
                }}
              >
                Z
              </span>
              <span
                className="absolute bottom-6 left-16 text-[10px] text-amber-200/90 animate-sleep-sparkle-1"
                style={{
                  textShadow: '0 0 8px rgba(254,240,138,0.85)',
                }}
              >
                ✦
              </span>
              <span
                className="absolute bottom-10 left-3 text-[9px] text-indigo-200/90 animate-sleep-sparkle-2"
                style={{
                  textShadow: '0 0 8px rgba(199,210,254,0.85)',
                }}
              >
                ✦
              </span>
            </div>
          )}

          {/* ==================== E.4 PLAYGROUND & BEACH PROGRESSIVE SANDCASTLE BUILD PROGRESS BADGE (Z-[45]) ==================== */}
          {isBuildingSandcastle &&
            ((currentRoom === 'playground' && sandpitObj) ||
              (currentRoom === 'beach' && beachSandcastleObj)) && (
              <div
                style={{
                  left:
                    currentRoom === 'playground' && sandpitObj
                      ? `${sandpitObj.x + sandpitObj.lebar / 2}px`
                      : `${(beachSandcastleObj?.x ?? 214) + 84}px`,
                  top:
                    currentRoom === 'playground' && sandpitObj
                      ? `${sandpitObj.y - 26}px`
                      : `${(beachSandcastleObj?.y ?? 274) - 22}px`,
                  transform: 'translateX(-50%)',
                }}
                className="absolute z-[45] pointer-events-none flex flex-col items-center gap-1 bg-[#FFFDF9]/95 border-2 border-[#2D2520] rounded-2xl px-2.5 py-1 shadow-[0_3px_0_#2D2520] whitespace-nowrap"
              >
                <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#2D2520]">
                  <span>🏰</span>
                  <span>Membangun Istana Pasir... {Math.round(sandBuildProgress)}%</span>
                </div>
                <div className="w-36 h-1.5 rounded-full bg-amber-100 border border-[#2D2520]/40 overflow-hidden">
                  <div
                    style={{ width: `${Math.round(sandBuildProgress)}%` }}
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                  />
                </div>
              </div>
            )}

          {/* ==================== E.4.B BEACH SAND DIGGING PROGRESS BADGE (Z-[45]) ==================== */}
          {currentRoom === 'beach' && beachActivityMode === 'digging_sand' && beachShoreObj && (
            <div
              style={{
                left: `${beachShoreObj.x + 68}px`,
                top: `${beachShoreObj.y - 18}px`,
                transform: 'translateX(-50%)',
              }}
              className="absolute z-[45] pointer-events-none flex flex-col items-center gap-1 bg-[#FFFDF9]/95 border-2 border-[#2D2520] rounded-2xl px-2.5 py-1 shadow-[0_3px_0_#2D2520] whitespace-nowrap"
            >
              <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#2D2520]">
                <span>🐚</span>
                <span>Menggali Pasir... {Math.round(beachDiggingProgress)}%</span>
              </div>
              <div className="w-32 h-1.5 rounded-full bg-amber-100 border border-[#2D2520]/40 overflow-hidden">
                <div
                  style={{ width: `${Math.round(beachDiggingProgress)}%` }}
                  className="h-full bg-gradient-to-r from-sky-400 to-amber-400 rounded-full"
                />
              </div>
            </div>
          )}

          {/* ==================== E.4.C BEACH DRAG DROP-ZONE LABELS WHEN DRAGGING BABY ==================== */}
          {currentRoom === 'beach' && isDragging && !isAnyPanelOpen && !isLocalStageModalOpen && (
            <>
              {beachUmbrellaObj && (
                <div
                  style={{
                    left: `${beachUmbrellaObj.x + beachUmbrellaObj.lebar / 2}px`,
                    top: `${beachUmbrellaObj.y + 84}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute z-[44] pointer-events-none px-2 py-0.5 rounded-xl border-2 border-[#2D2520] text-[10px] font-extrabold whitespace-nowrap shadow ${
                    hoveredDropZone === 'beach_umbrella'
                      ? 'bg-sky-400 text-[#2D2520] scale-105'
                      : 'bg-[#FFFDF9]/90 text-[#2D2520]'
                  }`}
                >
                  🏖️ Bersantai di Payung
                </div>
              )}
              {beachSandcastleObj && (
                <div
                  style={{
                    left: `${beachSandcastleObj.x + beachSandcastleObj.lebar / 2}px`,
                    top: `${beachSandcastleObj.y + 22}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute z-[44] pointer-events-none px-2 py-0.5 rounded-xl border-2 border-[#2D2520] text-[10px] font-extrabold whitespace-nowrap shadow ${
                    hoveredDropZone === 'beach_sandcastle'
                      ? 'bg-amber-400 text-[#2D2520] scale-105'
                      : 'bg-[#FFFDF9]/90 text-[#2D2520]'
                  }`}
                >
                  🏰 Bangun Istana Pasir
                </div>
              )}
              {beachPicnicObj && (
                <div
                  style={{
                    left: `${beachPicnicObj.x + beachPicnicObj.lebar / 2}px`,
                    top: `${beachPicnicObj.y + 24}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute z-[44] pointer-events-none px-2 py-0.5 rounded-xl border-2 border-[#2D2520] text-[10px] font-extrabold whitespace-nowrap shadow ${
                    hoveredDropZone === 'beach_picnic'
                      ? 'bg-rose-400 text-white scale-105'
                      : 'bg-[#FFFDF9]/90 text-[#2D2520]'
                  }`}
                >
                  🧺 Makan di Tikar Piknik
                </div>
              )}
              {beachShoreObj && (
                <div
                  style={{
                    left: `${beachShoreObj.x + 64}px`,
                    top: `${beachShoreObj.y + 28}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`absolute z-[44] pointer-events-none px-2 py-0.5 rounded-xl border-2 border-[#2D2520] text-[10px] font-extrabold whitespace-nowrap shadow ${
                    hoveredDropZone === 'beach_dig'
                      ? 'bg-emerald-400 text-[#2D2520] scale-105'
                      : 'bg-[#FFFDF9]/90 text-[#2D2520]'
                  }`}
                >
                  🐚 Gali Pasir Cari Kerang
                </div>
              )}
            </>
          )}

          {/* ==================== E.4.C.2 CULTURAL VILLAGE DRAG DROP-ZONE LABELS WHEN DRAGGING BABY ==================== */}
          {currentRoom === 'cultural_village' &&
            isDragging &&
            !isAnyPanelOpen &&
            !isLocalStageModalOpen && (
              <>
                {pendopoObj && (
                  <div
                    style={{
                      left: `${pendopoObj.x + pendopoObj.lebar / 2}px`,
                      top: `${pendopoObj.y + 114}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute z-[44] pointer-events-none px-2.5 py-0.5 rounded-xl border-2 border-[#2D2520] text-[10px] font-extrabold whitespace-nowrap shadow ${
                      hoveredDropZone === 'cultural_pendopo'
                        ? 'bg-amber-400 text-[#2D2520] scale-105'
                        : 'bg-[#FFFDF9]/92 text-[#2D2520]'
                    }`}
                  >
                    💃 Menari Tradisional di Pendopo
                  </div>
                )}
                {angklungObj && (
                  <div
                    style={{
                      left: `${angklungObj.x + angklungObj.lebar / 2}px`,
                      top: `${angklungObj.y + 12}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute z-[44] pointer-events-none px-2.5 py-0.5 rounded-xl border-2 border-[#2D2520] text-[10px] font-extrabold whitespace-nowrap shadow ${
                      hoveredDropZone === 'cultural_angklung'
                        ? 'bg-emerald-400 text-[#2D2520] scale-105'
                        : 'bg-[#FFFDF9]/92 text-[#2D2520]'
                    }`}
                  >
                    🎶 Goyangkan Angklung Bambu
                  </div>
                )}
              </>
            )}

          {/* ==================== E.4.D BEACH UNEARTHED DRAGGABLE SEASHELLS (DRAG TO EMBER KERANG!) ==================== */}
          {currentRoom === 'beach' &&
            !isAnyPanelOpen &&
            !isLocalStageModalOpen &&
            dugShells.map((shell) => {
              const isThisDragging = draggingShell?.id === shell.id;
              const curX = isThisDragging ? draggingShell.x : shell.x;
              const curY = isThisDragging ? draggingShell.y : shell.y;
              const shellFill =
                shell.variant === 'dara'
                  ? '#FBCFE8'
                  : shell.variant === 'kipas'
                  ? '#FEF08A'
                  : '#FED7AA';
              const shellStripe =
                shell.variant === 'dara'
                  ? '#DB2777'
                  : shell.variant === 'kipas'
                  ? '#D97706'
                  : '#EA580C';

              return (
                <div
                  key={shell.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    pointerDownStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
                    setDraggingShell({ id: shell.id, x: shell.x, y: shell.y });
                    sound.playClick();
                  }}
                  onPointerMove={(e) => {
                    if (!draggingShell || draggingShell.id !== shell.id || !stageRef.current) return;
                    const rect = stageRef.current.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) return;
                    const xPct = Math.max(6, Math.min(94, ((e.clientX - rect.left) / rect.width) * 100));
                    const yPct = Math.max(30, Math.min(92, ((e.clientY - rect.top) / rect.height) * 100));
                    setDraggingShell({ id: shell.id, x: xPct, y: yPct });

                    if (beachShoreObj) {
                      const pxX = (xPct / 100) * stageWidth;
                      const pxY = (yPct / 100) * STAGE_DESIGN_HEIGHT;
                      const bucketCx = beachShoreObj.x + 138;
                      const bucketCy = beachShoreObj.y + 74;
                      setIsOverShellBucket(Math.hypot(pxX - bucketCx, pxY - bucketCy) < 52);
                    }
                  }}
                  onPointerUp={(e) => {
                    try {
                      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                    } catch {
                      // ignore
                    }
                    const start = pointerDownStartRef.current;
                    const moved = start ? Math.hypot(e.clientX - start.x, e.clientY - start.y) : 999;

                    let droppedInBucket = false;
                    if (draggingShell && draggingShell.id === shell.id && beachShoreObj) {
                      const pxX = (draggingShell.x / 100) * stageWidth;
                      const pxY = (draggingShell.y / 100) * STAGE_DESIGN_HEIGHT;
                      const bucketCx = beachShoreObj.x + 138;
                      const bucketCy = beachShoreObj.y + 74;
                      if (Math.hypot(pxX - bucketCx, pxY - bucketCy) < 58) {
                        droppedInBucket = true;
                      }
                    }

                    setDraggingShell(null);
                    setIsOverShellBucket(false);

                    if (droppedInBucket) {
                      collectDugShellToBucket(shell.id, shell.name);
                    } else if (moved < 10) {
                      sound.playPop();
                      if (onInWorldCharacterReaction) {
                        onInWorldCharacterReaction(
                          'curious_head_tilt',
                          `Seret ${shell.name} 🐚 ini ke Ember Biru 🪣 di kanan ya!`,
                          '🪣'
                        );
                      }
                    }
                  }}
                  onPointerCancel={() => {
                    setDraggingShell(null);
                    setIsOverShellBucket(false);
                  }}
                  style={{
                    left: `${curX}%`,
                    top: `${curY}%`,
                    transform: isThisDragging
                      ? 'translate(-50%, -50%) scale(1.22)'
                      : 'translate(-50%, -50%)',
                  }}
                  className={`absolute z-[42] cursor-grab active:cursor-grabbing select-none touch-none flex flex-col items-center ${
                    isThisDragging ? '' : 'animate-shell-pop'
                  }`}
                  title={`Seret ${shell.name} ke Ember Kerang 🪣 untuk persediaan masakan Aceh!`}
                >
                  <svg viewBox="0 0 40 34" className="w-9 h-8 drop-shadow-[0_3px_2px_rgba(45,37,32,0.35)]">
                    <path
                      d="M 20 30 C 8 30 3 21 4 13 C 6 6 12 3 20 3 C 28 3 34 6 36 13 C 37 21 32 30 20 30 Z"
                      fill={shellFill}
                      stroke="#2D2520"
                      strokeWidth="2.4"
                    />
                    <path d="M 20 29 L 11 7 M 20 29 L 20 4 M 20 29 L 29 7" stroke={shellStripe} strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
                    <ellipse cx="20" cy="28" rx="6" ry="3" fill="#FFFDF9" stroke="#2D2520" strokeWidth="1.6" />
                  </svg>
                  <span className="-mt-1 px-1.5 py-0.2 rounded-lg bg-[#FFFDF9]/95 border border-[#2D2520] text-[8px] font-extrabold text-[#2D2520] whitespace-nowrap shadow-sm">
                    {isThisDragging ? '➡️ Ember 🪣' : 'Seret 🐚'}
                  </span>
                </div>
              );
            })}

          {/* ==================== E.4 PLAYGROUND FRONT DEPTH OVERLAYS (SLIDE CHUTE RAIL & SWING SEAT/ROPE FRONT LAYER AT Z-[35] + SWING CONTROLS AT Z-[45]) ==================== */}
          {currentRoom === 'playground' &&
            slideAnimPhase === 'sliding' &&
            !isDragging &&
            slideObj && (
              <svg
                viewBox={`0 0 ${slideObj.lebar} ${slideObj.tinggi}`}
                style={{
                  left: `${slideObj.x}px`,
                  top: `${slideObj.y}px`,
                  width: `${slideObj.lebar}px`,
                  height: `${slideObj.tinggi}px`,
                }}
                className="absolute z-[35] pointer-events-none overflow-visible"
              >
                {/* Outer Front Guardrail Edge of Yellow Chute so Baby Appears Tucked Inside the Slide */}
                <path
                  d={`M 36 38 Q 72 94 ${slideObj.lebar - 26} ${slideObj.tinggi - 10}`}
                  fill="none"
                  stroke="#FACC15"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d={`M 36 38 Q 72 94 ${slideObj.lebar - 26} ${slideObj.tinggi - 10}`}
                  fill="none"
                  stroke="#2D2520"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            )}

          {currentRoom === 'playground' &&
            (onSwing || playgroundSwingActive) &&
            !isDragging &&
            swingObj && (
              <>
                {/* Front Swing Rope Grips & Front Seat Lip Synchronized with Pendulum Angle */}
                <svg
                  viewBox={`0 0 ${swingObj.lebar} ${swingObj.tinggi}`}
                  style={{
                    left: `${swingObj.x}px`,
                    top: `${swingObj.y}px`,
                    width: `${swingObj.lebar}px`,
                    height: `${swingObj.tinggi}px`,
                  }}
                  className="absolute z-[35] pointer-events-none overflow-visible"
                >
                  <g transform={`rotate(${swingAngle}, ${swingObj.lebar / 2}, 18)`}>
                    {/* Front Rope Segments held near Baby's Hands */}
                    <line
                      x1={swingObj.lebar / 2 - 18}
                      y1="56"
                      x2={swingObj.lebar / 2 - 18}
                      y2="105"
                      stroke="#475569"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <line
                      x1={swingObj.lebar / 2 + 18}
                      y1="56"
                      x2={swingObj.lebar / 2 + 18}
                      y2="105"
                      stroke="#475569"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* Front Edge Lip of Blue Swing Seat */}
                    <rect
                      x={swingObj.lebar / 2 - 26}
                      y="105"
                      width="52"
                      height="9"
                      rx="4.5"
                      fill="#0EA5E9"
                      stroke="#2D2520"
                      strokeWidth="2.2"
                    />
                  </g>
                </svg>

                {/* Steady Floating Action Pill Above Swing Frame so Player Can Easily Push or Dismount */}
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    left: `${swingObj.x + swingObj.lebar / 2}px`,
                    top: `${Math.max(12, swingObj.y - 34)}px`,
                    transform: 'translateX(-50%)',
                  }}
                  className="absolute z-[45] flex items-center gap-1.5 bg-[#FFFDF9]/95 border-2 border-[#2D2520] rounded-2xl px-2 py-1 shadow-[0_3px_0_#2D2520] whitespace-nowrap"
                >
                  <button
                    onClick={pushSwingHarder}
                    className="px-2.5 py-1 rounded-xl bg-sky-200 hover:bg-sky-300 active:scale-95 border border-[#2D2520] text-[10px] font-bold text-[#2D2520] flex items-center gap-1 cursor-pointer"
                    title="Dorong ayunan agar mengayun lebih tinggi!"
                  >
                    <span>💨</span>
                    <span>Dorong!</span>
                  </button>
                  <button
                    onClick={dismountSwing}
                    className="px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 active:scale-95 border border-[#2D2520] text-[10px] font-bold text-[#2D2520] flex items-center gap-1 cursor-pointer"
                    title="Turunkan bayi dari ayunan"
                  >
                    <span>⬇️</span>
                    <span>Turun</span>
                  </button>
                </div>
              </>
            )}

          {/* ==================== E.5 PLAYGROUND SEESAW FRONT HANDLEBAR & DRAGGABLE RIGHT-END HANDLE (Z-[35] & Z-[45]) ==================== */}
          {currentRoom === 'playground' &&
            onSeesaw &&
            !isDragging &&
            seesawObj &&
            (() => {
              const pivotX = seesawObj.x + 103;
              const pivotY = seesawObj.y + 48;
              const rad = (seesawAngle * Math.PI) / 180;
              // Exact rotated position of the right seat (interactive player drag handle!)
              const rightEndX = pivotX + 69 * Math.cos(rad) - -14 * Math.sin(rad);
              const rightEndY = pivotY + 69 * Math.sin(rad) + -14 * Math.cos(rad);
              return (
                <>
                  {/* Front Handlebar & Left Seat Front Rim in front of Baby */}
                  <svg
                    viewBox={`0 0 ${seesawObj.lebar} ${seesawObj.tinggi}`}
                    style={{
                      left: `${seesawObj.x}px`,
                      top: `${seesawObj.y}px`,
                      width: `${seesawObj.lebar}px`,
                      height: `${seesawObj.tinggi}px`,
                    }}
                    className="absolute z-[35] pointer-events-none overflow-visible"
                  >
                    <g transform={`rotate(${seesawAngle}, 103, 48)`}>
                      <path
                        d="M 55 42 L 55 25 Q 55 20 60 20 L 65 20"
                        fill="none"
                        stroke="#334155"
                        strokeWidth="3.4"
                        strokeLinecap="round"
                      />
                      <rect
                        x="18"
                        y="39"
                        width="34"
                        height="6"
                        rx="3"
                        fill="#0EA5E9"
                        stroke="#2D2520"
                        strokeWidth="1.8"
                      />
                    </g>
                  </svg>

                  {/* Draggable Right-End Seesaw Handle (Player drags DOWN to lift baby UP & play!) */}
                  <div
                    onPointerDown={handleSeesawPointerDown}
                    onPointerMove={handleSeesawPointerMove}
                    onPointerUp={handleSeesawPointerUp}
                    onPointerCancel={handleSeesawPointerUp}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      left: `${rightEndX}px`,
                      top: `${rightEndY}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute z-[45] touch-none select-none cursor-grab active:cursor-grabbing flex flex-col items-center justify-center px-2.5 py-1.5 rounded-2xl border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] transition-colors ${
                      isDraggingSeesaw
                        ? 'bg-emerald-300 scale-105'
                        : 'bg-amber-200/95 hover:bg-amber-300 animate-bounce'
                    }`}
                    title="Seret ke bawah untuk menggerakkan jungkat-jungkit!"
                  >
                    <span className="text-[10px] font-extrabold text-[#2D2520] leading-tight whitespace-nowrap flex items-center gap-1">
                      <span>{isDraggingSeesaw ? '✋' : '👇'}</span>
                      <span>{isDraggingSeesaw ? 'Tarik Turun!' : 'Seret Turun'}</span>
                    </span>
                  </div>

                  {/* Steady Dismount Pill right above the seesaw pivot */}
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      left: `${seesawObj.x + 103}px`,
                      top: `${Math.max(12, seesawObj.y - 24)}px`,
                      transform: 'translateX(-50%)',
                    }}
                    className="absolute z-[45] flex items-center gap-1 bg-[#FFFDF9]/95 border-2 border-[#2D2520] rounded-2xl px-2 py-0.5 shadow-[0_3px_0_#2D2520] whitespace-nowrap"
                  >
                    <button
                      onClick={dismountSeesaw}
                      className="px-2 py-0.5 rounded-xl bg-amber-100 hover:bg-amber-200 active:scale-95 border border-[#2D2520] text-[10px] font-bold text-[#2D2520] flex items-center gap-1 cursor-pointer"
                      title="Turunkan bayi dari jungkat-jungkit"
                    >
                      <span>⬇️</span>
                      <span>Turun</span>
                    </button>
                  </div>
                </>
              );
            })()}

          {/* ==================== F.1 BATHTUB LAYER 3 (SHORT FRONT TUB WALL & TRANSLUCENT WATER — MAX 18% OF STAGE HEIGHT = 66px AT Z-[35] SO >70% OF BABY BODY IS VISIBLE ABOVE RIM) ==================== */}
          {currentRoom === 'bathroom' && (
            <svg
              viewBox="0 0 288 66"
              style={{
                left: `${bathtubLeftPx}px`,
                top: '432px',
                width: '288px',
                height: '66px',
              }}
              className="absolute z-[35] pointer-events-none overflow-visible drop-shadow-sm"
            >
              {/* Translucent Blue Water Surface Covering Only Lower Waist/Legs Inside Tub */}
              <path
                d="M 12 8 Q 88 2 144 8 Q 200 14 276 8 L 270 38 Q 144 46 18 38 Z"
                fill="rgba(56, 189, 248, 0.52)"
              />
              {/* Gentle Water Ripples & Surface Bubbles */}
              <path
                d="M 28 12 Q 86 6 144 12 T 260 11"
                fill="none"
                stroke="#E0F2FE"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              <g fill="#FFFFFF" opacity="0.92">
                <circle cx="52" cy="9" r="6" />
                <circle cx="65" cy="11" r="4.5" />
                <circle cx="118" cy="10" r="5.5" />
                <circle cx="176" cy="9" r="6.5" />
                <circle cx="192" cy="11" r="5" />
                <circle cx="236" cy="9" r="5.5" />
              </g>
              {/* Water Splash Droplets when Rinsing or Splashing */}
              {(waterSplashActive || showerWaterRunning) && (
                <g fill="#7DD3FC" stroke="#0284C7" strokeWidth="1.2">
                  <circle cx="88" cy="-4" r="4" className="animate-bounce" />
                  <circle cx="144" cy="-7" r="4.5" className="animate-bounce" />
                  <circle cx="202" cy="-4" r="4" className="animate-bounce" />
                </g>
              )}
              {/* SHORT Front Bathtub Wall (Only 42px Acrylic Front Wall so Baby's Head, Chest, Torso & Arms are 100% Visible Above Rim!) */}
              <path
                d="M 8 14 Q 144 22 280 14 L 268 54 Q 144 62 20 54 Z"
                fill="#FFFDF9"
                stroke="#2D2520"
                strokeWidth="3.2"
              />
              {/* Front Rim Top Lip Highlight */}
              <path
                d="M 4 12 Q 144 20 284 12 Q 286 19 278 21 Q 144 29 10 21 Q 2 19 4 12 Z"
                fill="#F1F5F9"
                stroke="#2D2520"
                strokeWidth="2.8"
              />
              {/* Clawfoot Gold Front Feet */}
              <ellipse cx="44" cy="58" rx="14" ry="5.5" fill="#F59E0B" stroke="#2D2520" strokeWidth="2.4" />
              <ellipse cx="244" cy="58" rx="14" ry="5.5" fill="#F59E0B" stroke="#2D2520" strokeWidth="2.4" />
            </svg>
          )}

          {/* ==================== SEAMLESS IN-WORLD INTERACTIVE PROPS & TOYS (D.3: ~40% OF BABY HEIGHT, LAYER 30 SORTED BY Y, DOTS HIDDEN WHEN ANY PANEL IS OPEN) ==================== */}

          {/* 1. CILUKBA VARIASI 2 (DRAGGABLE PILLOW IN BEDROOM) & VARIASI 3 (DRAGGABLE BLANKET) */}
          {(currentRoom === 'bedroom' || activeActivityType === 'cilukba') && (
            <>
              {/* Draggable Soft Pillow for Cilukba Variasi 2 */}
              <div
                onPointerDown={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  setIsDraggingPillow(true);
                  sound.playClick();
                  if (activeActivityType !== 'cilukba') {
                    setActiveActivityType('cilukba');
                    setCilukbaVariation(2);
                    setActiveActivityTitle('Cilukba Bantal');
                    setActiveActivityIcon('🙈');
                    setActivityState('interacting');
                    setActiveActivityInstruction(
                      'Seret bantal ke depan wajah karakter untuk sembunyi, lalu geser bantal untuk Cilukba!'
                    );
                  }
                }}
                onPointerMove={(e) => {
                  if (!isDraggingPillow || !stageRef.current) return;
                  const rect = stageRef.current.getBoundingClientRect();
                  const xPct = Math.max(15, Math.min(85, ((e.clientX - rect.left) / rect.width) * 100));
                  const yPct = Math.max(30, Math.min(78, ((e.clientY - rect.top) / rect.height) * 100));
                  setPillowPos({ x: xPct, y: yPct });
                  const distToBaby = Math.hypot(xPct - babyPos.x, yPct - (babyPos.y - 4));
                  if (distToBaby < 9 && !pillowHidingBaby) {
                    setPillowHidingBaby(true);
                    sound.playPop();
                    setActiveActivityInstruction(
                      'Karakter sembunyi di balik bantal! Sekarang geser bantal menjauh untuk "CILUKBA!"'
                    );
                  } else if (distToBaby > 14 && pillowHidingBaby) {
                    setPillowHidingBaby(false);
                    sound.playLaugh();
                    setActivityState('playing');
                    setOverrideActionState('laughing');
                    const nextCount = cilukbaCount + 1;
                    setCilukbaCount(nextCount);
                    const nextProg = Math.min(100, nextCount * 50);
                    setActivityProgress(nextProg);
                    if (onInWorldCharacterReaction) {
                      onInWorldCharacterReaction('laughing', 'CILUK... BAA dari balik bantal! Hahaha! ❤️⭐', '❤️');
                    }
                    if (nextProg >= 100) {
                      completeInWorldActivity(
                        'cilukba',
                        'var_2',
                        'Cilukba di Balik Bantal',
                        '🙈',
                        28,
                        32,
                        16,
                        'laughing',
                        'Cilukba di balik bantal empuk seru sekali! ❤️✨'
                      );
                    }
                  }
                }}
                onPointerUp={(e) => {
                  if (!isDraggingPillow) return;
                  try {
                    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                  } catch {
                    // ignore
                  }
                  setIsDraggingPillow(false);
                }}
                style={{
                  left: `${pillowPos.x}%`,
                  top: `${pillowPos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="group absolute z-[20] cursor-grab active:cursor-grabbing select-none touch-none flex flex-col items-center"
                title="Bantal Empuk (Seret ke dekat karakter untuk Cilukba!)"
              >
                <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-[#2D2520] text-[#FFFDF9] text-[10px] font-bold whitespace-nowrap shadow">
                  {pillowHidingBaby ? '🙈 Sembunyi!' : 'Bantal Cilukba'}
                </span>
                <svg viewBox="0 0 90 64" className="w-12 h-9 drop-shadow-sm">
                  <rect
                    x="6"
                    y="8"
                    width="78"
                    height="48"
                    rx="18"
                    fill="#FFF1F2"
                    stroke="#2D2520"
                    strokeWidth="3"
                  />
                  <rect
                    x="14"
                    y="15"
                    width="62"
                    height="34"
                    rx="12"
                    fill="#FFE4E6"
                    stroke="#F43F5E"
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                  />
                  <path d="M 35 32 Q 45 38 55 32" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>

              {/* Draggable Blanket Overlay for Cilukba Variasi 3 */}
              {(activeActivityType === 'cilukba' && cilukbaVariation === 3) || blanketHidingBaby ? (
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    setIsDraggingBlanket(true);
                    sound.playClick();
                  }}
                  onPointerMove={(e) => {
                    if (!isDraggingBlanket || !stageRef.current) return;
                    const rect = stageRef.current.getBoundingClientRect();
                    const xPct = Math.max(15, Math.min(85, ((e.clientX - rect.left) / rect.width) * 100));
                    const yPct = Math.max(28, Math.min(80, ((e.clientY - rect.top) / rect.height) * 100));
                    setBlanketCornerPos({ x: xPct, y: yPct });
                    const dist = Math.hypot(xPct - babyPos.x, yPct - babyPos.y);
                    if (dist > 13 && blanketHidingBaby) {
                      setBlanketHidingBaby(false);
                      sound.playLaugh();
                      setActivityState('playing');
                      setOverrideActionState('laughing');
                      if (onInWorldCharacterReaction) {
                        onInWorldCharacterReaction('laughing', 'CILUKBA!! Selimutnya terbuka! Hahaha! ❤️🌟', '⭐');
                      }
                      completeInWorldActivity(
                        'cilukba',
                        'var_3',
                        'Cilukba di Balik Selimut',
                        '🛌',
                        28,
                        32,
                        16,
                        'laughing',
                        'Cilukba di balik selimut hangat membuatku tertawa riang! 🛌❤️'
                      );
                    }
                  }}
                  onPointerUp={(e) => {
                    if (!isDraggingBlanket) return;
                    try {
                      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                    } catch {
                      // ignore
                    }
                    setIsDraggingBlanket(false);
                  }}
                  style={{
                    left: `${blanketCornerPos.x}%`,
                    top: `${blanketCornerPos.y}%`,
                    transform: 'translate(-50%, -45%)',
                  }}
                  className="absolute z-[35] cursor-grab active:cursor-grabbing select-none touch-none flex flex-col items-center"
                  title="Seret ujung selimut untuk membuka & melihat karakter!"
                >
                  <svg viewBox="0 0 150 110" className="w-28 h-20 drop-shadow-lg">
                    <path
                      d="M 12 20 Q 75 6 138 20 L 144 96 Q 75 106 8 96 Z"
                      fill="#34D399"
                      stroke="#2D2520"
                      strokeWidth="3.2"
                    />
                    <path
                      d="M 22 36 L 128 36 M 20 68 L 130 68"
                      stroke="#D1FAE5"
                      strokeWidth="2.5"
                      strokeDasharray="8 6"
                    />
                    <text x="75" y="56" textAnchor="middle" fill="#064E3B" fontSize="11" fontWeight="bold">
                      🛌 Seret Selimut!
                    </text>
                  </svg>
                </div>
              ) : null}
            </>
          )}

          {/* 2. D.3 INTERACTIVE TEDDY BEAR ON FLOOR (~40% OF BABY HEIGHT = 56px, ELLIPTICAL SHADOW, LAYER 30 SORTED BY Y) */}
          {(currentRoom === 'bedroom' || currentRoom === 'playroom' || currentRoom === 'livingroom') && (
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                pointerDownStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
                setIsDraggingTeddy(true);
              }}
              onPointerMove={(e) => {
                if (!isDraggingTeddy || !stageRef.current) return;
                const rect = stageRef.current.getBoundingClientRect();
                const xPct = Math.max(14, Math.min(86, ((e.clientX - rect.left) / rect.width) * 100));
                const yPct = Math.max(54, Math.min(88, ((e.clientY - rect.top) / rect.height) * 100));
                setTeddyPos({ x: xPct, y: yPct });
              }}
              onPointerUp={(e) => {
                if (!isDraggingTeddy) return;
                try {
                  (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                } catch {
                  // ignore
                }
                setIsDraggingTeddy(false);
                const start = pointerDownStartRef.current;
                const dist = start ? Math.hypot(e.clientX - start.x, e.clientY - start.y) : 999;
                if (dist < 10) {
                  sound.playClick();
                  setOpenObjectMenu({
                    type: 'teddy',
                    x: teddyPos.x,
                    y: Math.max(26, teddyPos.y - 12),
                    title: 'Teddy Bear',
                    icon: '🧸',
                    options: [
                      { id: 'hug_teddy', label: 'Memeluk Teddy', emoji: '🤗' },
                      { id: 'play_teddy', label: 'Ajak Bermain', emoji: '🎶' },
                      { id: 'sit_teddy', label: 'Mendudukkan', emoji: '🧸' },
                      { id: 'sleep_teddy', label: 'Menidurkan', emoji: '🌙' },
                    ],
                  });
                } else {
                  const distToBaby = Math.hypot(teddyPos.x - babyPos.x, teddyPos.y - babyPos.y);
                  if (distToBaby < 11) {
                    startInWorldObjectActivity('teddy', 'hug_teddy', 'Memeluk Teddy Bear', '🧸');
                  }
                }
              }}
              style={{
                left: `${teddyPos.x}%`,
                top: `${teddyPos.y}%`,
                transform: 'translate(-50%, -88%)',
                zIndex: 30 + Math.round((teddyPos.y / 100) * 8),
              }}
              className={`group absolute cursor-grab active:cursor-grabbing select-none touch-none flex flex-col items-center ${
                teddyPose === 'dancing' ? 'animate-bounce' : ''
              }`}
              title="Sentuh Teddy Bear untuk menu interaksi atau seret ke arah karakter!"
            >
              <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-[#2D2520] text-[#FFFDF9] text-[10px] font-bold whitespace-nowrap shadow">
                Boneka Teddy
              </span>
              <svg
                viewBox="0 0 80 96"
                className={`w-12 h-14 transition-transform ${
                  teddyPose === 'sleeping' ? 'rotate-90' : ''
                }`}
              >
                {/* Elliptical Floor Contact Shadow directly underneath Teddy Bear */}
                <ellipse cx="40" cy="86" rx="28" ry="8" fill="rgba(45, 37, 32, 0.25)" />
                <circle cx="20" cy="20" r="11" fill="#B45309" stroke="#2D2520" strokeWidth="2.5" />
                <circle cx="60" cy="20" r="11" fill="#B45309" stroke="#2D2520" strokeWidth="2.5" />
                <ellipse cx="40" cy="60" rx="22" ry="22" fill="#D97706" stroke="#2D2520" strokeWidth="2.8" />
                <circle cx="40" cy="32" r="19" fill="#D97706" stroke="#2D2520" strokeWidth="2.8" />
                <ellipse cx="40" cy="36" rx="9" ry="6.5" fill="#FEF3C7" />
                {teddyPose === 'sleeping' ? (
                  <>
                    <path d="M 30 28 Q 33 31 36 28" fill="none" stroke="#2D2520" strokeWidth="2.2" />
                    <path d="M 44 28 Q 47 31 50 28" fill="none" stroke="#2D2520" strokeWidth="2.2" />
                  </>
                ) : (
                  <>
                    <circle cx="33" cy="28" r="2.6" fill="#2D2520" />
                    <circle cx="47" cy="28" r="2.6" fill="#2D2520" />
                  </>
                )}
                <circle cx="40" cy="34" r="3" fill="#2D2520" />
                <path d="M 30 48 L 50 48" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
              </svg>
            </div>
          )}

          {/* 3. D.3 INTERACTIVE BALL ON FLOOR (~40% OF BABY HEIGHT = 48px, ELLIPTICAL SHADOW, LAYER 30 SORTED BY Y) */}
          {(currentRoom === 'playroom' ||
            currentRoom === 'livingroom' ||
            currentRoom === 'bedroom' ||
            currentRoom === 'park' ||
            currentRoom === 'playground' ||
            currentRoom === 'backyard_garden' ||
            currentRoom === 'front_yard' ||
            currentRoom === 'beach') && (
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                pointerDownStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
                ballDragPrevRef.current = { x: ballPos.x, y: ballPos.y, time: Date.now() };
                ballVelRef.current = { vx: 0, vy: 0 };
                setIsDraggingBall(true);
              }}
              onPointerMove={(e) => {
                if (!isDraggingBall || !stageRef.current) return;
                const rect = stageRef.current.getBoundingClientRect();
                const xPct = Math.max(14, Math.min(86, ((e.clientX - rect.left) / rect.width) * 100));
                const yPct = Math.max(54, Math.min(88, ((e.clientY - rect.top) / rect.height) * 100));
                const now = Date.now();
                if (ballDragPrevRef.current) {
                  const dt = Math.max(12, now - ballDragPrevRef.current.time);
                  ballVelRef.current = {
                    vx: ((xPct - ballDragPrevRef.current.x) / dt) * 18,
                    vy: ((yPct - ballDragPrevRef.current.y) / dt) * 18,
                  };
                }
                ballDragPrevRef.current = { x: xPct, y: yPct, time: now };
                setBallPos({ x: xPct, y: yPct });
              }}
              onPointerUp={(e) => {
                if (!isDraggingBall) return;
                try {
                  (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                } catch {
                  // ignore
                }
                setIsDraggingBall(false);
                const start = pointerDownStartRef.current;
                const dist = start ? Math.hypot(e.clientX - start.x, e.clientY - start.y) : 999;
                if (dist < 10) {
                  sound.playClick();
                  setOpenObjectMenu({
                    type: 'ball',
                    x: ballPos.x,
                    y: Math.max(28, ballPos.y - 12),
                    title: 'Bola Interaktif',
                    icon: '⚽',
                    options: [
                      { id: 'kick_ball', label: 'Menendang Bola', emoji: '🦵' },
                      { id: 'throw_ball', label: 'Melempar Bola', emoji: '🤾' },
                      { id: 'catch_ball', label: 'Menangkap Bola', emoji: '🤲' },
                      { id: 'roll_ball', label: 'Menggelindingkan', emoji: '⚽' },
                    ],
                  });
                } else {
                  sound.playPop();
                }
              }}
              style={{
                left: `${ballPos.x}%`,
                top: `${ballPos.y}%`,
                transform: 'translate(-50%, -88%)',
                zIndex: 30 + Math.round((ballPos.y / 100) * 8),
              }}
              className="group absolute cursor-grab active:cursor-grabbing select-none touch-none flex flex-col items-center"
              title="Sentuh Bola untuk menu atau lempar/geser bola langsung di lantai!"
            >
              <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-[#2D2520] text-[#FFFDF9] text-[10px] font-bold whitespace-nowrap shadow">
                Bola Mainan
              </span>
              <div className="relative flex flex-col items-center">
                <svg
                  viewBox="0 0 64 64"
                  style={{ transform: `rotate(${ballRotation}deg)` }}
                  className="w-11 h-11 relative z-10"
                >
                  <circle cx="32" cy="32" r="28" fill="#38BDF8" stroke="#2D2520" strokeWidth="3.2" />
                  <path d="M 10 22 Q 32 34 54 22" fill="none" stroke="#FDE047" strokeWidth="5" />
                  <path d="M 12 44 Q 32 32 52 44" fill="none" stroke="#FF8FAB" strokeWidth="5" />
                  <circle cx="22" cy="18" r="5" fill="#FFFFFF" opacity="0.65" />
                </svg>
                {/* Elliptical Contact Shadow on Floor */}
                <div className="w-10 h-2.5 -mt-1 rounded-full bg-[#2D2520]/25 pointer-events-none" />
              </div>
            </div>
          )}

          {/* 4. DRAGGABLE STORYBOOK + PAGE FLIPPING WHEN BOOKSHELF ACTIVITY IS ACTIVE */}
          {(currentRoom === 'bedroom' || currentRoom === 'playroom') && activeActivityType === 'bookshelf' && (
            <>
              {!isBookDelivered ? (
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    setIsDraggingBook(true);
                    sound.playClick();
                  }}
                  onPointerMove={(e) => {
                    if (!isDraggingBook || !stageRef.current) return;
                    const rect = stageRef.current.getBoundingClientRect();
                    const xPct = Math.max(14, Math.min(86, ((e.clientX - rect.left) / rect.width) * 100));
                    const yPct = Math.max(26, Math.min(78, ((e.clientY - rect.top) / rect.height) * 100));
                    setBookPos({ x: xPct, y: yPct });
                    if (Math.hypot(xPct - babyPos.x, yPct - babyPos.y) < 11) {
                      setIsDraggingBook(false);
                      setIsBookDelivered(true);
                      sound.playCorrect();
                      setActivityState('holdingObject');
                      setHeldPropEmoji('📖');
                      setOverrideActionState('reading');
                      setActivityProgress(40);
                      setActiveActivityInstruction(
                        'Buku sudah dipegang karakter! Sentuh halaman buku di sampingnya untuk membalik halaman!'
                      );
                    }
                  }}
                  onPointerUp={(e) => {
                    if (!isDraggingBook) return;
                    try {
                      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                    } catch {
                      // ignore
                    }
                    setIsDraggingBook(false);
                  }}
                  style={{
                    left: `${bookPos.x}%`,
                    top: `${bookPos.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute z-[40] cursor-grab active:cursor-grabbing select-none touch-none flex flex-col items-center animate-bounce"
                >
                  <span className="mb-1 px-2 py-0.5 rounded-full bg-sky-600 text-white border border-[#2D2520] text-[10px] font-bold shadow">
                    📖 Seret Buku ke Karakter!
                  </span>
                  <div
                    style={{ backgroundColor: selectedBook.color }}
                    className="w-12 h-14 rounded-lg border-2 border-[#2D2520] shadow-md flex items-center justify-center text-2xl"
                  >
                    📘
                  </div>
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playClick();
                    const nextPage = bookOpenPage + 1;
                    if (nextPage < selectedBook.pages.length) {
                      setBookOpenPage(nextPage);
                      setActivityState('playing');
                      setActivityProgress(Math.min(95, (nextPage + 1) * 33));
                      setActiveActivityInstruction(
                        `Halaman ${nextPage + 1}/${selectedBook.pages.length} — Sentuh buku lagi untuk membalik halaman!`
                      );
                      if (onInWorldCharacterReaction) {
                        onInWorldCharacterReaction('reading', selectedBook.pages[nextPage], '📖');
                      }
                    } else {
                      completeInWorldActivity(
                        'bookshelf',
                        selectedBook.id,
                        `Membaca: ${selectedBook.title}`,
                        '📖',
                        28,
                        35,
                        18,
                        'reading',
                        `Selesai membaca "${selectedBook.title}"! Aku makin pintar! 📚✨`
                      );
                    }
                  }}
                  style={{
                    left: `${Math.min(76, babyPos.x + 17)}%`,
                    top: `${Math.max(34, babyPos.y - 6)}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute z-[40] max-w-[180px] bg-[#FFFDF9]/95 hover:bg-amber-50 border-2 border-[#2D2520] rounded-2xl p-2 shadow-[0_3px_0_#2D2520] text-left transition-transform active:scale-95"
                  title="Sentuh halaman buku untuk membalik ke halaman berikutnya!"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold text-sky-800 truncate">
                      📖 {selectedBook.title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 border border-[#2D2520] text-[9px] font-bold">
                      Hal {bookOpenPage + 1}/{selectedBook.pages.length}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#2D2520] font-semibold leading-snug">
                    {selectedBook.pages[bookOpenPage]}
                  </p>
                  <div className="mt-1 text-[9px] font-bold text-emerald-700 flex items-center justify-end gap-1">
                    <span>👆 Balik Halaman</span>
                  </div>
                </button>
              )}
            </>
          )}

          {/* 5. KITCHEN IN-SCENE COOKING WORKFLOW & SMALL 24px PULSING DOTS (Hidden when any panel is open) */}
          {currentRoom === 'kitchen' && (
            <>
              {!isAnyPanelOpen && !isLocalStageModalOpen && (
                <>
                  {/* Kitchen Sink Pulsing Dot */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (dirtyPlateCount > 0) {
                        handleWashDirtyPlateAtSink();
                        return;
                      }
                      const nextUnwashed = selectedRecipe.ingredients.find(
                        (i) => !washedIngredients.includes(i.id)
                      );
                      if (nextUnwashed) {
                        handleWashIngredientAtSink(nextUnwashed.id, nextUnwashed.name);
                      } else {
                        sound.playSplash();
                        if (onInWorldCharacterReaction) {
                          onInWorldCharacterReaction(
                            'playing',
                            'Air keran wastafel mengalir segar! Semua bahan sudah bersih dicuci! 🚰💧',
                            '💧'
                          );
                        }
                      }
                    }}
                    style={{ left: '54%', top: '34%', transform: 'translate(-50%, -50%)' }}
                    className={`group absolute z-[40] w-6 h-6 rounded-full border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center justify-center transition-transform hover:scale-110 ${
                      dirtyPlateCount > 0
                        ? 'bg-sky-300 text-sky-950 animate-bounce'
                        : 'bg-amber-300/95 hover:bg-amber-400 text-[#2D2520]'
                    }`}
                    title="Wastafel Cuci Bahan & Piring"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#2D2520] animate-ping" />
                    <span className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-[#2D2520] text-[#FFFDF9] text-[10px] font-bold whitespace-nowrap shadow">
                      {dirtyPlateCount > 0 ? `Cuci Piring (${dirtyPlateCount})` : 'Wastafel Cuci'}
                    </span>
                  </button>

                  {/* Recipe Book (12 Recipes) Pulsing Dot */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playClick();
                      setShowRecipeBookDrawer((v) => !v);
                    }}
                    style={{ left: '58%', top: '12%', transform: 'translate(-50%, -50%)' }}
                    className="group absolute z-[40] w-6 h-6 rounded-full bg-amber-300/95 hover:bg-amber-400 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center justify-center transition-transform hover:scale-110"
                    title="Buka Buku 12 Resep Masakan & Hasil Panen Kebun!"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#2D2520] animate-ping" />
                    <span className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-lg bg-[#2D2520] text-[#FFFDF9] text-[10px] font-bold whitespace-nowrap shadow">
                      Buku 12 Resep ({activeRecipeDef.iconEmoji})
                    </span>
                  </button>
                </>
              )}

          {/* Station F: Dining Table / Highchair Plate & 3-Bite Visual Eating (x=76%, y=52%) */}
          {kitchenFoodStage === 'served' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTakeBiteAtTable();
              }}
              style={{ left: '76%', top: '52%', transform: 'translate(-50%, -50%)' }}
              className="absolute z-25 px-3 py-1.5 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-[#2D2520] border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] text-xs font-bold flex items-center gap-1.5 animate-bounce"
              title="Sentuh Mangkuk di Kursi Makan Bayi untuk menyuapi hidangan!"
            >
              <span className="text-base">{activeRecipeDef.iconEmoji}</span>
              <span>Suapi Bayi ({bitesRemaining}/3 Suapan) 😋</span>
            </button>
          )}

          {/* Active Kitchen Cooking Ingredients, Stove Stirring & Plating */}
          {activeActivityType === 'kitchen' && (
            <>
              {/* Draggable & Tappable Ingredients on Kitchen Counter */}
              {selectedRecipe.ingredients.map((ing) => {
                if (addedIngredients.includes(ing.id)) return null;
                const isThisDragging = draggingIngredient?.id === ing.id;
                const curX = isThisDragging ? draggingIngredient.x : ing.startX;
                const curY = isThisDragging ? draggingIngredient.y : ing.startY;
                const isWashed = washedIngredients.includes(ing.id);
                const isPrepped = preppedIngredients.includes(ing.id);
                const plantKey = COOKING_INGREDIENTS[ing.id]?.fromGardenPlantId;
                const gardenCount = plantKey ? harvestInventory[plantKey] || 0 : 0;
                const isBeachShellIng = ing.id === 'kerang';
                const shellStockBadge = isBeachShellIng ? beachShellStock : 0;

                return (
                  <div
                    key={ing.id}
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                      pointerDownStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
                      setDraggingIngredient({ id: ing.id, emoji: ing.emoji, x: ing.startX, y: ing.startY });
                      sound.playClick();
                    }}
                    onPointerMove={(e) => {
                      if (!draggingIngredient || draggingIngredient.id !== ing.id || !stageRef.current) return;
                      const rect = stageRef.current.getBoundingClientRect();
                      const xPct = Math.max(10, Math.min(88, ((e.clientX - rect.left) / rect.width) * 100));
                      const yPct = Math.max(18, Math.min(78, ((e.clientY - rect.top) / rect.height) * 100));
                      setDraggingIngredient({ id: ing.id, emoji: ing.emoji, x: xPct, y: yPct });

                      // Dragging over Sink (x=28%, y=38%) washes the ingredient!
                      if (Math.hypot(xPct - 28, yPct - 38) < 8 && !isWashed) {
                        handleWashIngredientAtSink(ing.id, ing.name);
                      }
                      // Dragging over Cutting Board (x=66%, y=38%) preps/chops the ingredient!
                      if (Math.hypot(xPct - 66, yPct - 38) < 8 && !isPrepped) {
                        handlePrepIngredientOnBoard(ing.id, ing.name);
                      }
                      // Dragging into the Red Pot on the Stove (x=48%, y=36%) adds it to the pot!
                      if (Math.hypot(xPct - 48, yPct - 36) < 10) {
                        setDraggingIngredient(null);
                        sound.playSplash();
                        setAddedIngredients((prev) => {
                          const next = [...prev, ing.id];
                          setKitchenFoodStage('cooking');
                          setActivityProgress(Math.min(60, next.length * 20));
                          if (next.length >= selectedRecipe.ingredients.length) {
                            setActiveActivityInstruction(
                              'Semua bahan masuk panci! Sekarang sentuh Panci Merah 🍲 3 kali untuk mengaduk sampai matang!'
                            );
                          }
                          return next;
                        });
                      }
                    }}
                    onPointerUp={(e) => {
                      try {
                        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                      } catch {
                        // ignore
                      }
                      const start = pointerDownStartRef.current;
                      const dist = start ? Math.hypot(e.clientX - start.x, e.clientY - start.y) : 999;
                      setDraggingIngredient(null);
                      // Also allow tapping ingredient directly to wash -> prep -> add to pot smoothly
                      if (dist < 10) {
                        if (!isWashed) {
                          handleWashIngredientAtSink(ing.id, ing.name);
                        } else if (!isPrepped) {
                          handlePrepIngredientOnBoard(ing.id, ing.name);
                        } else {
                          sound.playSplash();
                          setAddedIngredients((prev) => {
                            const next = [...prev, ing.id];
                            setKitchenFoodStage('cooking');
                            setActivityProgress(Math.min(60, next.length * 20));
                            if (next.length >= selectedRecipe.ingredients.length) {
                              setActiveActivityInstruction(
                                'Semua bahan masuk panci! Sentuh Panci 🍲 3 kali untuk mengaduk!'
                              );
                            }
                            return next;
                          });
                        }
                      }
                    }}
                    style={{
                      left: `${curX}%`,
                      top: `${curY}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className="absolute z-25 cursor-grab active:cursor-grabbing select-none touch-none flex flex-col items-center"
                    title={`Seret ${ing.name} ke Wastafel 🚰, Talenan 🔪, lalu Panci Kompor 🍲 (atau sentuh bertahap)!`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full border-2 border-[#2D2520] shadow flex items-center justify-center text-xl relative ${
                        isPrepped
                          ? 'bg-emerald-100'
                          : isWashed
                          ? 'bg-sky-100'
                          : 'bg-white'
                      }`}
                    >
                      {ing.emoji}
                      {gardenCount > 0 && (
                        <span
                          className="absolute -top-1 -right-1 px-1 rounded-full bg-emerald-600 text-white text-[8px] font-bold border border-[#2D2520]"
                          title="Bahan segar dari hasil panen kebunmu!"
                        >
                          🌱{gardenCount}
                        </span>
                      )}
                      {isBeachShellIng && (
                        <span
                          className="absolute -top-1 -right-1 px-1 rounded-full bg-sky-600 text-white text-[8px] font-bold border border-[#2D2520]"
                          title="Kerang segar hasil menggali di Pantai untuk masakan Aceh!"
                        >
                          🏖️{shellStockBadge}
                        </span>
                      )}
                    </div>
                    <span className="mt-0.5 px-1.5 py-0.2 rounded bg-amber-100 border border-[#2D2520] text-[9px] font-bold whitespace-nowrap">
                      {isPrepped ? `🔪 ${ing.name}` : isWashed ? `💧 ${ing.name}` : ing.name}
                    </span>
                  </div>
                );
              })}

              {/* Interactive Cooking Pot on Stove (Tap to Stir 3 times with steam & sizzle) */}
              {addedIngredients.length >= selectedRecipe.ingredients.length && !isFoodCooked && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStirStovePot();
                  }}
                  style={{ left: '48%', top: '28%', transform: 'translate(-50%, -50%)' }}
                  className="absolute z-25 px-3 py-1.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] text-xs font-bold animate-bounce flex items-center gap-1"
                >
                  <span>🥄♨️</span>
                  <span>Aduk Panci ({potStirCount}/3)</span>
                </button>
              )}

              {/* Draggable & Tappable Cooked Dish with "READY!" Indicator to Serve to Highchair or Character */}
              {isFoodCooked && kitchenFoodStage !== 'served' && (
                <div
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    pointerDownStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
                    setIsDraggingDish(true);
                    sound.playClick();
                  }}
                  onPointerMove={(e) => {
                    if (!isDraggingDish || !stageRef.current) return;
                    const rect = stageRef.current.getBoundingClientRect();
                    const xPct = Math.max(14, Math.min(86, ((e.clientX - rect.left) / rect.width) * 100));
                    const yPct = Math.max(24, Math.min(78, ((e.clientY - rect.top) / rect.height) * 100));
                    setCookedDishPos({ x: xPct, y: yPct });
                    // Drop onto Highchair (x=76%, y=52%) or Character
                    if (
                      Math.hypot(xPct - 76, yPct - 52) < 12 ||
                      Math.hypot(xPct - babyPos.x, yPct - babyPos.y) < 12
                    ) {
                      handleServeDishToTable();
                    }
                  }}
                  onPointerUp={(e) => {
                    if (!isDraggingDish) return;
                    try {
                      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                    } catch {
                      // ignore
                    }
                    setIsDraggingDish(false);
                    const start = pointerDownStartRef.current;
                    const dist = start ? Math.hypot(e.clientX - start.x, e.clientY - start.y) : 999;
                    if (dist < 10) {
                      handleServeDishToTable();
                    }
                  }}
                  style={{
                    left: `${cookedDishPos.x}%`,
                    top: `${cookedDishPos.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute z-25 cursor-grab active:cursor-grabbing select-none touch-none flex flex-col items-center animate-bounce"
                >
                  <span className="mb-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white border border-[#2D2520] text-[10px] font-bold shadow">
                    ✨ Matang! Sentuh / Seret ke Kursi Makan 🍽️
                  </span>
                  <div className="w-12 h-12 rounded-full bg-amber-100 border-2 border-[#2D2520] shadow-md flex items-center justify-center text-2xl">
                    {activeRecipeDef.iconEmoji}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

          {/* 6. IN-SCENE BLOCK STACKING WHEN TOYBOX ACTIVITY IS ACTIVE */}
          {(currentRoom === 'playroom' || currentRoom === 'bedroom') && activeActivityType === 'toybox' && (
            <>
              <div
                style={{ left: '54%', top: '70%', transform: 'translate(-50%, -100%)' }}
                className="absolute z-[32] flex flex-col-reverse items-center pointer-events-none"
              >
                <div className="px-2 py-0.5 rounded bg-amber-100/90 border border-[#2D2520] text-[9px] font-bold text-[#2D2520] mt-1">
                  Menara ({stackedBlocks.length}/4)
                </div>
                {stackedBlocks.map((b) => (
                  <div
                    key={b.id}
                    style={{ backgroundColor: b.color }}
                    className="w-10 h-10 rounded-lg border-2 border-[#2D2520] shadow flex items-center justify-center font-display font-bold text-sm text-[#2D2520] -mb-0.5 transition-all"
                  >
                    {b.label}
                  </div>
                ))}
              </div>

              {looseBlocks.map((b) => (
                <div
                  key={b.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                    setDraggingBlockId(b.id);
                    sound.playClick();
                  }}
                  onPointerMove={(e) => {
                    if (draggingBlockId !== b.id || !stageRef.current) return;
                    const rect = stageRef.current.getBoundingClientRect();
                    const xPct = Math.max(16, Math.min(84, ((e.clientX - rect.left) / rect.width) * 100));
                    const yPct = Math.max(52, Math.min(80, ((e.clientY - rect.top) / rect.height) * 100));
                    setLooseBlocks((prev) =>
                      prev.map((item) => (item.id === b.id ? { ...item, x: xPct, y: yPct } : item))
                    );
                  }}
                  onPointerUp={(e) => {
                    if (draggingBlockId !== b.id) return;
                    try {
                      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                    } catch {
                      // ignore
                    }
                    setDraggingBlockId(null);
                    sound.playPop();
                    setLooseBlocks((prev) => prev.filter((item) => item.id !== b.id));
                    setStackedBlocks((prev) => {
                      const next = [...prev, b];
                      const prog = Math.min(100, next.length * 25);
                      setActivityProgress(prog);
                      if (onInWorldCharacterReaction) {
                        onInWorldCharacterReaction(
                          'clap_hands',
                          `Balok ${b.label} tersusun rapi! (${next.length}/4) 🧱✨`,
                          '⭐'
                        );
                      }
                      if (next.length >= 4) {
                        completeInWorldActivity(
                          'toybox',
                          activeSubAction || 'stack_blocks',
                          activeActivityTitle || 'Menyusun Menara Balok',
                          '🧱',
                          28,
                          34,
                          17,
                          'clap_hands',
                          'Hore! Menara 4 balok kita berdiri tinggi di atas karpet! 🧱🌟'
                        );
                      }
                      return next;
                    });
                  }}
                  style={{
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    backgroundColor: b.color,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 30 + Math.round((b.y / 100) * 8),
                  }}
                  className="absolute w-11 h-11 rounded-xl border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] cursor-grab active:cursor-grabbing flex items-center justify-center font-display font-bold text-base text-[#2D2520] hover:scale-110 transition-transform"
                  title="Sentuh atau seret balok ini untuk menyusun menara!"
                >
                  {b.label}
                </div>
              ))}
            </>
          )}

          {/* 7. INTERACTIVE GARDEN & NATURE CORNER IN LIVING ROOM */}
          {currentRoom === 'livingroom' && (
            <>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeActivityType === 'garden') {
                    if (!gardenSoilDug) {
                      sound.playPop();
                      setGardenSoilDug(true);
                      setActivityProgress(30);
                      setActiveActivityInstruction(
                        'Tanah sudah digali! Sekarang seret Kantong Bibit 🌱 ke dalam pot!'
                      );
                      return;
                    }
                    if (gardenWaterLevel >= 2) {
                      sound.playCorrect();
                      completeInWorldActivity(
                        'garden',
                        'pick_flower',
                        'Berkebun & Memetik Bunga',
                        '🌸',
                        28,
                        34,
                        18,
                        'loved',
                        'Bunga mekar harum sekali di sudut taman kita! 🌸✨'
                      );
                      return;
                    }
                  }
                  sound.playClick();
                  setOpenObjectMenu({
                    type: 'garden',
                    x: 20,
                    y: 46,
                    title: 'Sudut Taman & Tanaman',
                    icon: '🌱',
                    options: [
                      { id: 'plant_seed', label: 'Menanam Bibit', emoji: '🌱' },
                      { id: 'water_plant', label: 'Menyiram Tanaman', emoji: '🚿' },
                      { id: 'dig_soil', label: 'Menggali Tanah', emoji: '🪴' },
                      { id: 'pick_flower', label: 'Memetik Bunga', emoji: '🌸' },
                      { id: 'inspect_bug', label: 'Amati Kepik Kecil', emoji: '🐞' },
                    ],
                  });
                }}
                style={{ left: '84%', top: '42%', transform: 'translate(-50%, -50%)' }}
                className="absolute z-[20] cursor-pointer flex flex-col items-center group"
                title="Sentuh Tanaman/Taman untuk berkebun langsung di ruangan!"
              >
                {gardenWaterLevel >= 2 && (
                  <div className="text-2xl animate-bounce -mb-1">🌸🌺</div>
                )}
              </div>

              {!isAnyPanelOpen && !isLocalStageModalOpen && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playCorrect();
                    setGardenBugInspected(true);
                    if (onInWorldCharacterReaction) {
                      onInWorldCharacterReaction(
                        'curious_head_tilt',
                        'Wah, ada kepik merah kecil 🐞 hinggap di daun tanaman kita!',
                        '🐞'
                      );
                    }
                    if (activeActivityType === 'garden') {
                      completeInWorldActivity(
                        'garden',
                        'inspect_bug',
                        'Mengamati Serangga Taman',
                        '🐞',
                        26,
                        32,
                        15,
                        'big_smile',
                        'Kepik kecil itu lucu dan ramah sekali! 🐞🌿'
                      );
                    }
                  }}
                  style={{ left: '88%', top: '34%', transform: 'translate(-50%, -50%)' }}
                  className={`group absolute z-[40] w-6 h-6 rounded-full bg-amber-100/95 border-2 border-[#2D2520] shadow flex items-center justify-center text-xs hover:scale-125 transition-transform ${
                    gardenBugInspected ? 'animate-ping' : 'animate-bounce'
                  }`}
                  title="Sentuh Kepik Kecil untuk mengamati serangga virtual!"
                >
                  🐞
                </button>
              )}

              {activeActivityType === 'garden' && (
                <>
                  {!gardenSeedPlanted && (
                    <div
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                        setIsDraggingSeedPacket(true);
                        sound.playClick();
                      }}
                      onPointerMove={(e) => {
                        if (!isDraggingSeedPacket || !stageRef.current) return;
                        const rect = stageRef.current.getBoundingClientRect();
                        const xPct = Math.max(10, Math.min(86, ((e.clientX - rect.left) / rect.width) * 100));
                        const yPct = Math.max(26, Math.min(78, ((e.clientY - rect.top) / rect.height) * 100));
                        setSeedPacketPos({ x: xPct, y: yPct });
                        if (Math.hypot(xPct - 84, yPct - 42) < 12) {
                          setIsDraggingSeedPacket(false);
                          setGardenSoilDug(true);
                          setGardenSeedPlanted(true);
                          sound.playPop();
                          setActivityProgress(60);
                          setActiveActivityInstruction(
                            'Bibit sudah ditanam! Sekarang seret Gembor Air 🚿 ke atas pot untuk menyiram!'
                          );
                        }
                      }}
                      onPointerUp={(e) => {
                        if (!isDraggingSeedPacket) return;
                        try {
                          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                        } catch {
                          // ignore
                        }
                        setIsDraggingSeedPacket(false);
                      }}
                      style={{
                        left: `${seedPacketPos.x}%`,
                        top: `${seedPacketPos.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute z-[40] cursor-grab active:cursor-grabbing select-none touch-none flex flex-col items-center"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-100 border-2 border-[#2D2520] shadow flex items-center justify-center text-xl">
                        🌱
                      </div>
                      <span className="mt-0.5 px-1.5 py-0.2 rounded bg-white border border-[#2D2520] text-[9px] font-bold">
                        Seret Bibit
                      </span>
                    </div>
                  )}

                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                      setIsDraggingWateringCan(true);
                      sound.playClick();
                    }}
                    onPointerMove={(e) => {
                      if (!isDraggingWateringCan || !stageRef.current) return;
                      const rect = stageRef.current.getBoundingClientRect();
                      const xPct = Math.max(10, Math.min(86, ((e.clientX - rect.left) / rect.width) * 100));
                      const yPct = Math.max(26, Math.min(78, ((e.clientY - rect.top) / rect.height) * 100));
                      setWateringCanPos({ x: xPct, y: yPct });
                      if (Math.hypot(xPct - 84, yPct - 42) < 12) {
                        const now = Date.now();
                        if (now - lastToolApplyRef.current > 450) {
                          lastToolApplyRef.current = now;
                          sound.playSplash();
                          setGardenSeedPlanted(true);
                          setGardenWaterLevel((w) => {
                            const next = w + 1;
                            setActivityProgress(Math.min(95, 60 + next * 18));
                            if (next >= 2) {
                              setActiveActivityInstruction(
                                'Bunga sudah mekar! Sentuh bunga 🌸 di pot untuk memetiknya!'
                              );
                            }
                            return next;
                          });
                        }
                      }
                    }}
                    onPointerUp={(e) => {
                      if (!isDraggingWateringCan) return;
                      try {
                        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                      } catch {
                        // ignore
                      }
                      setIsDraggingWateringCan(false);
                    }}
                    style={{
                      left: `${wateringCanPos.x}%`,
                      top: `${wateringCanPos.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className="absolute z-[40] cursor-grab active:cursor-grabbing select-none touch-none flex flex-col items-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-sky-100 border-2 border-[#2D2520] shadow flex items-center justify-center text-xl">
                      🚿
                    </div>
                    <span className="mt-0.5 px-1.5 py-0.2 rounded bg-white border border-[#2D2520] text-[9px] font-bold">
                      Siram Tanaman
                    </span>
                  </div>
                </>
              )}
            </>
          )}

          {/* 8. EXPANDABLE OUTDOOR GARDENS: 4 PERSISTENT SOIL BEDS, SEED RACK TRIGGER, SHOVEL, WATERING CAN & HARVEST BASKET */}
          {isGarden && (
            <>
              {!isAnyPanelOpen && !isLocalStageModalOpen && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playClick();
                      setShowSeedRackDrawer((v) => !v);
                    }}
                    style={{ left: '22%', top: '34%', transform: 'translate(-50%, -50%)' }}
                    className="absolute z-[40] px-2.5 py-1 rounded-2xl bg-emerald-200 hover:bg-emerald-300 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-[10px] font-bold text-[#2D2520] flex items-center gap-1"
                    title="Buka Rak 10 Bibit Bunga & Sayuran!"
                  >
                    <span>🌱</span>
                    <span>Rak 10 Bibit ({getPlantDef(selectedSeedId).iconEmoji})</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playClick();
                      const totalHarvest = Object.values(harvestInventory).reduce((a, b) => a + (b || 0), 0);
                      if (onInWorldCharacterReaction) {
                        onInWorldCharacterReaction(
                          'big_smile',
                          `Keranjang Panen berisi ${totalHarvest} hasil kebun segar! Bisa dimasak di Dapur atau dibawa Piknik! 🧺🍅🌻`,
                          '🧺'
                        );
                      }
                    }}
                    style={{ left: '84%', top: '56%', transform: 'translate(-50%, -50%)' }}
                    className="absolute z-[40] px-2 py-1 rounded-2xl bg-amber-100 hover:bg-amber-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-[10px] font-bold text-[#2D2520] flex flex-col items-center"
                    title="Keranjang Panen Kebun"
                  >
                    <span className="text-base">🧺</span>
                    <span>
                      Panen ({Object.values(harvestInventory).reduce((a, b) => a + (b || 0), 0)})
                    </span>
                  </button>
                </>
              )}

              {[0, 1, 2, 3].map((bedIdx) => {
                const bed = plants.find((b) => b.bedIndex === bedIdx) || {
                  bedIndex: bedIdx,
                  soilPrepared: false,
                  plantId: null,
                  stage: 'Seed' as const,
                  plantedAt: 0,
                  lastWateredAt: 0,
                  waterCount: 0,
                  growthProgress: 0,
                };
                const bedX = 24 + bedIdx * 17;
                const bedY = 66;
                const plantDef = bed.plantId ? getPlantDef(bed.plantId) : null;
                const stageLabel = PLANT_STAGE_LABELS[bed.stage]?.id || bed.stage;

                return (
                  <div
                    key={bedIdx}
                    onClick={(e) => {
                      e.stopPropagation();
                      walkCharacterTo(bedX, bedY - 5, () => {
                        if (!bed.soilPrepared) {
                          handleDigGardenBed(bedIdx);
                        } else if (!bed.plantId) {
                          handlePlantSeedInBed(bedIdx, selectedSeedId);
                        } else if (bed.stage === 'Harvestable') {
                          handleHarvestGardenBed(bedIdx);
                        } else {
                          handleWaterGardenBed(bedIdx);
                        }
                      });
                    }}
                    style={{ left: `${bedX}%`, top: `${bedY}%`, transform: 'translate(-50%, -50%)' }}
                    className="absolute z-[20] cursor-pointer flex flex-col items-center group"
                    title={
                      !bed.soilPrepared
                        ? `Petak #${bedIdx + 1}: Sentuh atau seret Sekop 🪏 untuk menggali tanah!`
                        : !bed.plantId
                        ? `Petak #${bedIdx + 1}: Tanah gembur! Sentuh untuk menanam bibit ${getPlantDef(selectedSeedId).indonesianName}!`
                        : bed.stage === 'Harvestable'
                        ? `Petak #${bedIdx + 1}: ${plantDef?.indonesianName} siap dipanen! Sentuh untuk memanen ke keranjang!`
                        : `Petak #${bedIdx + 1}: ${plantDef?.indonesianName} (${stageLabel} - ${bed.growthProgress}%). Sentuh atau seret Gembor Air 🚿 untuk menyiram!`
                    }
                  >
                    {bed.plantId && plantDef && (
                      <div className="flex flex-col items-center -mb-2 z-10">
                        {bed.stage === 'Seed' && <span className="text-base">🌰</span>}
                        {bed.stage === 'Sprout' && <span className="text-xl animate-pulse">🌱</span>}
                        {bed.stage === 'Small Plant' && <span className="text-2xl">🌿</span>}
                        {bed.stage === 'Growing Plant' && (
                          <span className="text-2xl">🪴{plantDef.iconEmoji}</span>
                        )}
                        {bed.stage === 'Mature Plant' && (
                          <span className="text-3xl">{plantDef.iconEmoji}</span>
                        )}
                        {bed.stage === 'Harvestable' && (
                          <div className="flex flex-col items-center animate-bounce">
                            <span className="px-1.5 py-0.2 rounded-full bg-amber-300 border border-[#2D2520] text-[8px] font-bold text-[#2D2520] shadow">
                              ✨ PANEN!
                            </span>
                            <span className="text-2xl">{plantDef.harvestEmoji}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <svg viewBox="0 0 110 48" className="w-16 h-8 drop-shadow">
                      <ellipse
                        cx="55"
                        cy="26"
                        rx="48"
                        ry="16"
                        fill={
                          bed.waterCount > 0 && Date.now() - bed.lastWateredAt < 60000
                            ? '#5C4033'
                            : bed.soilPrepared
                            ? '#78350F'
                            : '#A16207'
                        }
                        stroke="#2D2520"
                        strokeWidth="2.8"
                      />
                      {bed.soilPrepared && (
                        <g stroke="#451A03" strokeWidth="2" strokeLinecap="round" opacity="0.65">
                          <line x1="25" y1="22" x2="85" y2="22" strokeDasharray="6 5" />
                          <line x1="22" y1="29" x2="88" y2="29" strokeDasharray="6 5" />
                        </g>
                      )}
                    </svg>

                    <span className="-mt-1 px-1 py-0.2 rounded-full bg-[#FFFDF9]/95 border border-[#2D2520] text-[8px] font-bold text-[#2D2520] shadow whitespace-nowrap">
                      {!bed.soilPrepared
                        ? `🪏 Gali #${bedIdx + 1}`
                        : !bed.plantId
                        ? `🌱 Tanam ${getPlantDef(selectedSeedId).iconEmoji}`
                        : bed.stage === 'Harvestable'
                        ? `🧺 Panen`
                        : `💧 ${bed.growthProgress}%`}
                    </span>
                  </div>
                );
              })}

              {/* Draggable Garden Shovel Tool */}
              <div
                onPointerDown={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  setIsDraggingShovel(true);
                  sound.playClick();
                }}
                onPointerMove={(e) => {
                  if (!isDraggingShovel || !stageRef.current) return;
                  const rect = stageRef.current.getBoundingClientRect();
                  const xPct = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
                  const yPct = Math.max(25, Math.min(80, ((e.clientY - rect.top) / rect.height) * 100));
                  setShovelPos({ x: xPct, y: yPct });
                  [0, 1, 2, 3].forEach((bIdx) => {
                    const bx = 24 + bIdx * 17;
                    const by = 66;
                    const bed = plants.find((p) => p.bedIndex === bIdx);
                    if (Math.hypot(xPct - bx, yPct - by) < 8 && bed && !bed.soilPrepared) {
                      handleDigGardenBed(bIdx);
                    }
                  });
                }}
                onPointerUp={(e) => {
                  if (!isDraggingShovel) return;
                  try {
                    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                  } catch {
                    // ignore
                  }
                  setIsDraggingShovel(false);
                  setShovelPos({ x: 14, y: 74 });
                }}
                style={{
                  left: `${shovelPos.x}%`,
                  top: `${shovelPos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute z-[40] cursor-grab active:cursor-grabbing select-none touch-none flex flex-col items-center"
                title="Seret Sekop 🪏 ke petak tanah untuk menggali & menggemburkan tanah!"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 border-2 border-[#2D2520] shadow flex items-center justify-center text-lg">
                  🪏
                </div>
                <span className="mt-0.5 px-1 py-0.2 rounded bg-white border border-[#2D2520] text-[8px] font-bold">
                  Sekop
                </span>
              </div>

              {/* Draggable Garden Watering Can Tool */}
              <div
                onPointerDown={(e) => {
                  e.stopPropagation();
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  setIsDraggingWateringCan(true);
                  sound.playClick();
                }}
                onPointerMove={(e) => {
                  if (!isDraggingWateringCan || !stageRef.current) return;
                  const rect = stageRef.current.getBoundingClientRect();
                  const xPct = Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100));
                  const yPct = Math.max(25, Math.min(80, ((e.clientY - rect.top) / rect.height) * 100));
                  setWateringCanPos({ x: xPct, y: yPct });
                  const now = Date.now();
                  if (now - lastToolApplyRef.current > 600) {
                    [0, 1, 2, 3].forEach((bIdx) => {
                      const bx = 24 + bIdx * 17;
                      const by = 66;
                      const bed = plants.find((p) => p.bedIndex === bIdx);
                      if (Math.hypot(xPct - bx, yPct - by) < 8 && bed && bed.plantId) {
                        lastToolApplyRef.current = now;
                        handleWaterGardenBed(bIdx);
                      }
                    });
                  }
                }}
                onPointerUp={(e) => {
                  if (!isDraggingWateringCan) return;
                  try {
                    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
                  } catch {
                    // ignore
                  }
                  setIsDraggingWateringCan(false);
                  setWateringCanPos({ x: 86, y: 74 });
                }}
                style={{
                  left: `${wateringCanPos.x}%`,
                  top: `${wateringCanPos.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="absolute z-[40] cursor-grab active:cursor-grabbing select-none touch-none flex flex-col items-center"
                title="Seret Gembor Air 🚿 ke atas tanaman untuk menyiram!"
              >
                <div className="w-9 h-9 rounded-full bg-sky-100 border-2 border-[#2D2520] shadow flex items-center justify-center text-lg relative">
                  🚿
                  {isDraggingWateringCan && (
                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs animate-bounce">
                      💧💧
                    </span>
                  )}
                </div>
                <span className="mt-0.5 px-1 py-0.2 rounded bg-white border border-[#2D2520] text-[8px] font-bold">
                  Gembor
                </span>
              </div>
            </>
          )}

          {/* 9. OUTDOOR NATURE BUTTERFLIES & BIRDS */}
          {isOutdoor && currentRoom !== 'beach' && !isAnyPanelOpen && !isLocalStageModalOpen && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startInWorldObjectActivity('nature', 'butterfly', 'Mengejar Kupu-Kupu Taman', '🦋');
                }}
                style={{ left: '64%', top: '34%', transform: 'translate(-50%, -50%)' }}
                className="absolute z-[35] text-xl animate-bounce hover:scale-125 transition-transform"
                title="Sentuh Kupu-Kupu untuk mengamati & bermain!"
              >
                🦋
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startInWorldObjectActivity('nature', 'bird', 'Mendengarkan Kicau Burung', '🐦');
                }}
                style={{ left: '84%', top: '28%', transform: 'translate(-50%, -50%)' }}
                className="absolute z-[35] text-xl hover:scale-125 transition-transform"
                title="Sentuh Burung Kecil untuk menyapa & mendengarkan kicauannya!"
              >
                🐦
              </button>
            </>
          )}

          {/* 10. PARK PICNIC BLANKET & OUTDOOR EATING */}
          {currentRoom === 'park' && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                walkCharacterTo(55, 65, () => {
                  sound.playEatDrink();
                  setOverrideActionState('eating');
                  completeInWorldActivity(
                    'picnic',
                    'eat_picnic',
                    'Piknik & Makan Bersama di Taman',
                    '🧺',
                    30,
                    35,
                    18,
                    'eating',
                    'Piknik di atas rumput taman sambil menikmati buah & bekal segar seru sekali! 🧺🍓🧃'
                  );
                });
              }}
              style={{ left: '56%', top: '72%', transform: 'translate(-50%, -50%)' }}
              className="absolute z-[20] cursor-pointer flex flex-col items-center group"
              title="Sentuh Tikar Piknik untuk duduk & makan bekal di taman!"
            >
              <div className="flex items-center gap-1.5 mb-0.5 z-10">
                <span className="text-lg group-hover:scale-110 transition-transform">🧺</span>
                {picnicFoods.map((f) => (
                  <span key={f.id} className="text-lg animate-bounce">
                    {f.emoji}
                  </span>
                ))}
              </div>
              <span className="px-2 py-0.5 rounded-full bg-white/90 border border-[#2D2520] text-[9px] font-bold text-rose-950 shadow">
                🧺 Tikar Piknik
              </span>
            </div>
          )}

          {/* 11. FRONT YARD FLOWER VASE, BEACH SEASHELLS & CULTURAL VILLAGE ANGKLUNG PAVILION */}
          {currentRoom === 'front_yard' && !isAnyPanelOpen && !isLocalStageModalOpen && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                sound.playCorrect();
                const flowerOptions: PlantId[] = ['sunflower', 'rose', 'tulip', 'daisy'];
                const nextFlower = flowerOptions[vaseFlowers.length % flowerOptions.length];
                setVaseFlowers((prev) => [...prev.slice(-3), nextFlower]);
                completeInWorldActivity(
                  'nature',
                  'arrange_vase',
                  'Merangkai Bunga di Vas Halaman',
                  '🏺',
                  26,
                  30,
                  15,
                  'loved',
                  'Vas bunga di teras rumah tampak cantik dan harum dengan bunga hasil kebun! 🌻🌹🌷'
                );
              }}
              style={{ left: '30%', top: '58%', transform: 'translate(-50%, -50%)' }}
              className="absolute z-[35] px-2 py-1 rounded-2xl bg-pink-100/95 hover:bg-pink-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-[10px] font-bold text-[#2D2520] flex items-center gap-1"
              title="Sentuh Vas Bunga Teras untuk menghias dengan bunga kebun!"
            >
              <span className="text-base">
                🏺{vaseFlowers.map((fid) => getPlantDef(fid).harvestEmoji).join('')}
              </span>
              <span>Vas Bunga</span>
            </button>
          )}

          {currentRoom === 'beach' && !isAnyPanelOpen && !isLocalStageModalOpen && (
            <>
              {/* Picnic Refill Button when all 4 picnic foods have been eaten */}
              {beachPicnicObj &&
                beachPicnicLevels.cake +
                  beachPicnicLevels.strawberry +
                  beachPicnicLevels.apple +
                  beachPicnicLevels.orange_juice ===
                  0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      refillBeachPicnic();
                    }}
                    style={{
                      left: `${beachPicnicObj.x + beachPicnicObj.lebar / 2}px`,
                      top: `${beachPicnicObj.y + 114}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className="absolute z-[36] px-2.5 py-1 rounded-2xl bg-rose-100 hover:bg-rose-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-[10px] font-extrabold text-[#2D2520] flex items-center gap-1 cursor-pointer"
                  >
                    <span>🧺</span>
                    <span>Isi Ulang Piknik</span>
                  </button>
                )}

              {/* Shell Bucket Stock Pill & 1-Tap Go Cook Aceh Food Shortcut */}
              {beachShoreObj && (
                <div
                  style={{
                    left: `${beachShoreObj.x + 124}px`,
                    top: `${beachShoreObj.y + 114}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className="absolute z-[36] flex items-center gap-1"
                >
                  <div
                    className={`px-2 py-0.5 rounded-xl border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-[10px] font-extrabold whitespace-nowrap flex items-center gap-1 ${
                      isOverShellBucket
                        ? 'bg-emerald-300 text-[#2D2520] scale-105'
                        : 'bg-sky-100/95 text-[#2D2520]'
                    }`}
                  >
                    <span>🪣</span>
                    <span>
                      {isOverShellBucket ? 'Lepas Kerang!' : `Kerang: ${beachShellStock}`}
                    </span>
                  </div>
                  {beachShellStock > 0 && onRequestLocationChange && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playClick();
                        onRequestLocationChange('kitchen');
                        setTimeout(() => setShowRecipeBookDrawer(true), 240);
                      }}
                      className="px-2 py-0.5 rounded-xl bg-amber-300 hover:bg-amber-400 active:scale-95 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-[10px] font-extrabold text-[#2D2520] whitespace-nowrap cursor-pointer"
                      title="Bawa Kerang ke Dapur untuk dimasak jadi Menu Makanan Aceh!"
                    >
                      🍜 Masak Aceh
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {currentRoom === 'cultural_village' &&
            !isDragging &&
            !isAnyPanelOpen &&
            !isLocalStageModalOpen && (
              <>
                {pendopoObj && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startTraditionalDance();
                    }}
                    style={{
                      left: `${pendopoObj.x + pendopoObj.lebar / 2}px`,
                      top: `${pendopoObj.y + pendopoObj.tinggi + 10}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute z-[35] px-2.5 py-1 rounded-2xl border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-[10px] font-bold text-[#2D2520] flex items-center gap-1 cursor-pointer transition-transform active:scale-95 ${
                      culturalActivityMode === 'traditional_dance'
                        ? 'bg-rose-200 hover:bg-rose-300'
                        : 'bg-amber-200/95 hover:bg-amber-300'
                    }`}
                    title="Seret bayi ke Pendopo atau sentuh untuk menari tradisional Nusantara!"
                  >
                    <span className="text-sm">💃</span>
                    <span>
                      {culturalActivityMode === 'traditional_dance'
                        ? 'Menari Lagi'
                        : 'Tari Tradisional'}
                    </span>
                  </button>
                )}
                {angklungObj && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startPlayAngklung();
                    }}
                    style={{
                      left: `${angklungObj.x + angklungObj.lebar / 2}px`,
                      top: `${angklungObj.y + angklungObj.tinggi + 8}px`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute z-[35] px-2.5 py-1 rounded-2xl border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-[10px] font-bold text-[#2D2520] flex items-center gap-1 cursor-pointer transition-transform active:scale-95 ${
                      culturalActivityMode === 'playing_angklung'
                        ? 'bg-emerald-200 hover:bg-emerald-300'
                        : 'bg-amber-100/95 hover:bg-amber-200'
                    }`}
                    title="Seret bayi ke Rak Angklung atau sentuh untuk menggoyangkan Angklung!"
                  >
                    <span className="text-sm">🎶</span>
                    <span>
                      {culturalActivityMode === 'playing_angklung'
                        ? 'Goyangkan Lagi'
                        : 'Main Angklung'}
                    </span>
                  </button>
                )}
              </>
            )}

          {/* ==================== MINIMAL FLOATING IN-WORLD ACTIVITY HUD PILL (BOTTOM OF STAGE WHEN ACTIVE) ==================== */}
          {activityState !== 'idle' && currentRoom !== 'bathroom' && !isAnyPanelOpen && !isLocalStageModalOpen && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-[40] w-[92%] max-w-[350px] bg-[#FFFDF9]/95 backdrop-blur-sm border-2 border-[#2D2520] rounded-2xl px-2.5 py-1.5 shadow-[0_3px_0_#2D2520] pointer-events-auto">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base shrink-0">{activeActivityIcon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-display text-[11px] font-bold text-[#2D2520] truncate">
                        {activeActivityTitle}
                      </span>
                    </div>
                    <p className="text-[9px] font-semibold text-[#5C5248] truncate">
                      {activeActivityInstruction}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {activeActivityType === 'cilukba' && (
                    <div className="flex items-center gap-0.5 mr-0.5">
                      {([1, 2, 3, 4] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => startInWorldObjectActivity('cilukba', `var_${v}`, `Cilukba Variasi ${v}`, '🙈')}
                          className={`w-5 h-5 rounded-full border border-[#2D2520] text-[9px] font-bold ${
                            cilukbaVariation === v
                              ? 'bg-amber-400 text-[#2D2520]'
                              : 'bg-white text-[#6E6259]'
                          }`}
                          title={`Cilukba Variasi ${v}`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setShowActivityHint((h) => !h)}
                    className="w-6 h-6 rounded-full bg-sky-100 hover:bg-sky-200 border border-[#2D2520] text-[10px] font-bold text-sky-900 flex items-center justify-center"
                    title="Petunjuk Interaksi"
                  >
                    ?
                  </button>
                  <button
                    onClick={stopInWorldActivity}
                    className="w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 border border-[#2D2520] text-[10px] font-bold text-white flex items-center justify-center"
                    title="Keluar dari Aktivitas"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="mt-1 w-full h-1.5 rounded-full bg-[#E5DEC9] overflow-hidden border border-[#2D2520]/30">
                <div
                  style={{ width: `${Math.max(10, activityProgress)}%` }}
                  className="h-full bg-emerald-500 transition-all duration-300"
                />
              </div>

              {showActivityHint && (
                <div className="mt-1 pt-1 border-t border-[#E5DEC9] text-[9px] font-semibold text-[#2D2520]">
                  💡 Sentuh atau seret objek langsung di dalam ruangan!
                </div>
              )}
            </div>
          )}
        </div>

      {/* ==================== B & C. ROOT-LEVEL PORTAL BOTTOM SHEETS (Z-INDEX 100 OVERLAY, 110 PANEL MAX-H 48dvh, 120 44x44px CLOSE BUTTON, 2-COLUMN BUTTON GRID) ==================== */}
      {typeof document !== 'undefined' &&
        fridgeOpen &&
        createPortal(
          <>
            <div
              onClick={() => setFridgeOpen(false)}
              className="fixed inset-0 z-[100] bg-black/35 backdrop-blur-[1px]"
            />
            <div
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-x-0 bottom-14 z-[110] mx-auto w-full max-w-2xl max-h-[48dvh] bg-[#FFFDF9] border-t-3 border-x-3 border-[#2D2520] rounded-t-3xl shadow-[0_-6px_0_#2D2520] flex flex-col overflow-hidden"
            >
              <div className="sticky top-0 z-[115] bg-[#E0F2FE] border-b-2 border-[#2D2520] px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
                <div className="min-w-0 pr-2">
                  <h4 className="font-display text-sm sm:text-base font-bold text-[#2D2520] line-clamp-2 leading-tight">
                    🧊 Kulkas Interaktif 3 Rak
                  </h4>
                  <p className="text-[11px] text-[#5C5248] font-semibold truncate">
                    Sentuh makanan segar untuk langsung menyuapi bayi
                  </p>
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    setFridgeOpen(false);
                  }}
                  aria-label="Tutup Kulkas"
                  className="relative z-[120] w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center justify-center text-lg font-extrabold shrink-0"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 overflow-y-auto space-y-2.5">
                {[
                  {
                    shelfTitle: 'Rak 1 • Minuman & Susu Segar',
                    items: [
                      {
                        id: 'milk',
                        name: 'Susu Hangat',
                        emoji: '🥛',
                        desc: '+22 Lapar • Langsung Minum',
                        action: () => {
                          sound.playEatDrink();
                          if (onQuickFeedMilk) onQuickFeedMilk();
                          setOverrideActionState('eating');
                          if (onInWorldCharacterReaction) {
                            onInWorldCharacterReaction(
                              'eating',
                              'Nyam gluk gluk! Susu segar dari kulkas enak dan bergizi! 🥛✨',
                              '🥛'
                            );
                          }
                          setFridgeOpen(false);
                        },
                      },
                      {
                        id: 'juice',
                        name: 'Jus Buah Segar',
                        emoji: '🧃',
                        desc: '+20 Lapar • Segar & Manis',
                        action: () => {
                          sound.playEatDrink();
                          if (onQuickFeedMilk) onQuickFeedMilk();
                          setOverrideActionState('eating');
                          if (onInWorldCharacterReaction) {
                            onInWorldCharacterReaction(
                              'eating',
                              'Segarnya Jus Buah dingin dari kulkas! Nyam nyam! 🧃🍓',
                              '🧃'
                            );
                          }
                          setFridgeOpen(false);
                        },
                      },
                    ],
                  },
                  {
                    shelfTitle: 'Rak 2 • Buah Segar & Telur',
                    items: [
                      {
                        id: 'fruit',
                        name: 'Apel & Stroberi',
                        emoji: '🍎🍓',
                        desc: '+24 Lapar • Kaya Vitamin',
                        action: () => {
                          sound.playEatDrink();
                          if (onQuickFeedPorridge) onQuickFeedPorridge();
                          setOverrideActionState('eating');
                          if (onInWorldCharacterReaction) {
                            onInWorldCharacterReaction(
                              'eating',
                              'Nyam! Buah apel dan stroberi segar manis sekali! 🍎🍓✨',
                              '🍓'
                            );
                          }
                          setFridgeOpen(false);
                        },
                      },
                      {
                        id: 'eggs',
                        name: 'Telur Segar',
                        emoji: '🥚',
                        desc: '+24 Lapar • Protein Tinggi',
                        action: () => {
                          sound.playEatDrink();
                          if (onQuickFeedPorridge) onQuickFeedPorridge();
                          setOverrideActionState('eating');
                          if (onInWorldCharacterReaction) {
                            onInWorldCharacterReaction(
                              'eating',
                              'Nyam nyam! Telur rebus hangat dari dapur lezat sekali! 🥚😋',
                              '🥚'
                            );
                          }
                          setFridgeOpen(false);
                        },
                      },
                    ],
                  },
                  {
                    shelfTitle: 'Rak 3 • Sayuran & Bubur Bayi',
                    items: [
                      {
                        id: 'veggies',
                        name: 'Wortel & Brokoli',
                        emoji: '🥕🥦',
                        desc: '+25 Lapar • Sayur Sehat',
                        action: () => {
                          sound.playEatDrink();
                          if (onQuickFeedPorridge) onQuickFeedPorridge();
                          setOverrideActionState('eating');
                          if (onInWorldCharacterReaction) {
                            onInWorldCharacterReaction(
                              'eating',
                              'Sup wortel dan brokoli segar membuat tubuhku sehat! 🥕🥦💚',
                              '🥦'
                            );
                          }
                          setFridgeOpen(false);
                        },
                      },
                      {
                        id: 'porridge',
                        name: 'Bubur Bayi',
                        emoji: '🥣',
                        desc: '+26 Lapar • Lembut & Hangat',
                        action: () => {
                          sound.playEatDrink();
                          if (onQuickFeedPorridge) onQuickFeedPorridge();
                          setOverrideActionState('eating');
                          if (onInWorldCharacterReaction) {
                            onInWorldCharacterReaction(
                              'eating',
                              'Nyam nyam! Bubur bayi hangat favoritku! 🥣❤️',
                              '🥣'
                            );
                          }
                          setFridgeOpen(false);
                        },
                      },
                    ],
                  },
                ].map((shelf) => (
                  <div
                    key={shelf.shelfTitle}
                    className="bg-[#F8FAFC] border-2 border-[#2D2520] rounded-2xl p-2"
                  >
                    <div className="text-[11px] font-extrabold text-sky-900 mb-1.5">
                      {shelf.shelfTitle}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {shelf.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={item.action}
                          className="min-h-[56px] p-2 rounded-xl bg-amber-50 hover:bg-amber-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center gap-2 text-left active:scale-95 transition-all"
                        >
                          <span className="text-2xl shrink-0">{item.emoji}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#2D2520] leading-tight">
                              {item.name}
                            </div>
                            <div className="text-[10px] font-semibold text-emerald-800 leading-tight">
                              {item.desc}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>,
          document.body
        )}

      {typeof document !== 'undefined' &&
        showRecipeBookDrawer &&
        createPortal(
          <>
            <div
              onClick={() => setShowRecipeBookDrawer(false)}
              className="fixed inset-0 z-[100] bg-black/35 backdrop-blur-[1px]"
            />
            <div
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-x-0 bottom-14 z-[110] mx-auto w-full max-w-2xl max-h-[48dvh] bg-[#FFFDF9] border-t-3 border-x-3 border-[#2D2520] rounded-t-3xl shadow-[0_-6px_0_#2D2520] flex flex-col overflow-hidden"
            >
              <div className="sticky top-0 z-[115] bg-amber-100 border-b-2 border-[#2D2520] px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
                <div className="min-w-0 pr-2">
                  <h4 className="font-display text-sm sm:text-base font-bold text-[#2D2520] line-clamp-2 leading-tight">
                    📖 Buku Resep Dapur &amp; Masakan Aceh
                  </h4>
                  <p className="text-[11px] text-[#6E6259] font-semibold truncate">
                    Stok Kerang Pantai: 🐚 {beachShellStock} • Pilih resep untuk dimasak di kompor
                  </p>
                </div>
                <button
                  onClick={() => {
                    setRecipeMissingShellNotice(null);
                    setShowRecipeBookDrawer(false);
                  }}
                  aria-label="Tutup Buku Resep"
                  className="relative z-[120] w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center justify-center text-lg font-extrabold shrink-0"
                >
                  ✕
                </button>
              </div>
              {recipeMissingShellNotice && (
                <div className="mx-3 mt-2.5 px-3 py-2 rounded-2xl bg-sky-100 border-2 border-[#2D2520] flex items-center justify-between gap-2 shrink-0">
                  <span className="text-[11px] font-bold text-[#2D2520] leading-snug">
                    {recipeMissingShellNotice}
                  </span>
                  {onRequestLocationChange && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        setRecipeMissingShellNotice(null);
                        setShowRecipeBookDrawer(false);
                        onRequestLocationChange('beach');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-300 hover:bg-amber-400 border-2 border-[#2D2520] text-[10px] font-extrabold text-[#2D2520] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      🏖️ Ke Pantai
                    </button>
                  )}
                </div>
              )}
              <div className="p-3 overflow-y-auto grid grid-cols-2 gap-2">
                {COOKING_RECIPES.map((rec) => {
                  const isSelected = rec.id === activeRecipeId;
                  const needsShell = rec.ingredients.includes('kerang');
                  const lacksShell = needsShell && beachShellStock <= 0;
                  return (
                    <button
                      key={rec.id}
                      onClick={() => {
                        if (lacksShell) {
                          sound.playClick();
                          setRecipeMissingShellNotice(
                            `Resep ${rec.indonesianTitle} butuh Kerang Pantai 🐚! Gali pasir & masukkan kerang ke Ember di Pantai dulu ya.`
                          );
                          return;
                        }
                        setRecipeMissingShellNotice(null);
                        startInWorldObjectActivity(
                          'kitchen',
                          rec.id,
                          `Memasak ${rec.indonesianTitle}`,
                          rec.iconEmoji
                        );
                        setShowRecipeBookDrawer(false);
                      }}
                      className={`min-h-[56px] p-2 rounded-xl border-2 text-left transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-amber-200 border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                          : lacksShell
                          ? 'bg-slate-100/90 hover:bg-sky-50 border-[#2D2520]/70'
                          : needsShell
                          ? 'bg-emerald-50 hover:bg-emerald-100 border-[#2D2520]'
                          : 'bg-amber-50/80 hover:bg-amber-100 border-[#2D2520]'
                      }`}
                    >
                      <span className="text-xl shrink-0">{rec.iconEmoji}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#2D2520] leading-tight">
                          {rec.indonesianTitle}
                        </div>
                        <div className="text-[10px] font-semibold text-[#6E6259] leading-tight">
                          {rec.ingredients
                            .map((ingId) => COOKING_INGREDIENTS[ingId]?.emoji || '🥗')
                            .join(' ')}{' '}
                          • +{rec.hungerRestore} Lapar
                        </div>
                        {needsShell && (
                          <div
                            className={`mt-0.5 text-[9px] font-extrabold ${
                              lacksShell ? 'text-rose-600' : 'text-emerald-700'
                            }`}
                          >
                            {lacksShell
                              ? '🐚 Stok Kerang: 0 (Cari di Pantai)'
                              : `✨ Menu Aceh • 🐚 Stok: ${beachShellStock}`}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>,
          document.body
        )}

      {typeof document !== 'undefined' &&
        showSeedRackDrawer &&
        createPortal(
          <>
            <div
              onClick={() => setShowSeedRackDrawer(false)}
              className="fixed inset-0 z-[100] bg-black/35 backdrop-blur-[1px]"
            />
            <div
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-x-0 bottom-14 z-[110] mx-auto w-full max-w-2xl max-h-[48dvh] bg-[#FFFDF9] border-t-3 border-x-3 border-[#2D2520] rounded-t-3xl shadow-[0_-6px_0_#2D2520] flex flex-col overflow-hidden"
            >
              <div className="sticky top-0 z-[115] bg-emerald-100 border-b-2 border-[#2D2520] px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
                <div className="min-w-0 pr-2">
                  <h4 className="font-display text-sm sm:text-base font-bold text-[#2D2520] line-clamp-2 leading-tight">
                    🌱 Rak 10 Bibit Tanaman Kebun
                  </h4>
                  <p className="text-[11px] text-[#6E6259] font-semibold truncate">
                    Pilih bibit lalu sentuh petak tanah untuk menanam
                  </p>
                </div>
                <button
                  onClick={() => setShowSeedRackDrawer(false)}
                  aria-label="Tutup Rak Bibit"
                  className="relative z-[120] w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center justify-center text-lg font-extrabold shrink-0"
                >
                  ✕
                </button>
              </div>
              <div className="p-3 overflow-y-auto grid grid-cols-2 gap-2">
                {PLANT_CATALOG.map((p) => {
                  const isSel = p.id === selectedSeedId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedSeedId(p.id);
                        setShowSeedRackDrawer(false);
                      }}
                      className={`min-h-[56px] p-2 rounded-xl border-2 text-left flex items-center gap-2 transition-all ${
                        isSel
                          ? 'bg-emerald-200 border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                          : 'bg-emerald-50/80 hover:bg-emerald-100 border-[#2D2520]'
                      }`}
                    >
                      <span className="text-xl shrink-0">{p.iconEmoji}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#2D2520] leading-tight">
                          {p.indonesianName}
                        </div>
                        <div className="text-[10px] font-semibold text-[#6E6259]">
                          Panen: {harvestInventory[p.id] || 0}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>,
          document.body
        )}

      {typeof document !== 'undefined' &&
        openObjectMenu &&
        createPortal(
          <>
            <div
              onClick={() => setOpenObjectMenu(null)}
              className="fixed inset-0 z-[100] bg-black/35 backdrop-blur-[1px]"
            />
            <div
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-x-0 bottom-14 z-[110] mx-auto w-full max-w-2xl max-h-[48dvh] bg-[#FFFDF9] border-t-3 border-x-3 border-[#2D2520] rounded-t-3xl shadow-[0_-6px_0_#2D2520] flex flex-col overflow-hidden"
            >
              <div className="sticky top-0 z-[115] bg-amber-100 border-b-2 border-[#2D2520] px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
                <div className="min-w-0 pr-2">
                  <h4 className="font-display text-sm sm:text-base font-bold text-[#2D2520] line-clamp-2 leading-tight flex items-center gap-1.5">
                    <span>{openObjectMenu.icon}</span>
                    <span>{openObjectMenu.title}</span>
                  </h4>
                  <p className="text-[11px] text-[#6E6259] font-semibold truncate">
                    Pilih aksi interaksi langsung di ruangan
                  </p>
                </div>
                <button
                  onClick={() => setOpenObjectMenu(null)}
                  aria-label="Tutup Menu Objek"
                  className="relative z-[120] w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-rose-500 hover:bg-rose-600 active:scale-95 text-white border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center justify-center text-lg font-extrabold shrink-0"
                >
                  ✕
                </button>
              </div>
              <div className="p-3 overflow-y-auto grid grid-cols-2 gap-2">
                {openObjectMenu.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      const menuType = openObjectMenu.type;
                      setOpenObjectMenu(null);

                      if (menuType === 'door') {
                        handleWalkToDoorAndChangeLocation(opt.id as WorldLocationId);
                        return;
                      }
                      if (opt.id === 'wake_up') {
                        setInCrib(false);
                        setBlanketPulled(false);
                        if (onWakeBabyFromCrib) onWakeBabyFromCrib();
                        return;
                      }
                      if (opt.id === 'action_toggle_lamp') {
                        onToggleLamp();
                        return;
                      }
                      if (opt.id === 'action_admire_clothes') {
                        if (onInWorldCharacterReaction) {
                          onInWorldCharacterReaction(
                            'happy_jump',
                            'Lemari pakaianku penuh baju bersih dan rapi! 👕✨',
                            '👕'
                          );
                        }
                        return;
                      }
                      if (opt.id === 'action_mirror_pose') {
                        if (onInWorldCharacterReaction) {
                          onInWorldCharacterReaction(
                            'dancing',
                            'Lihat gayaku di depan lemari! Keren dan rapi sekali! ✨🌟',
                            '✨'
                          );
                        }
                        return;
                      }
                      if (opt.id === 'action_stack_blocks') {
                        startInWorldObjectActivity('toybox', 'stack_blocks', opt.label, opt.emoji);
                        return;
                      }
                      if (opt.id === 'action_tidy_toys') {
                        startInWorldObjectActivity('toybox', 'tidy_toys', opt.label, opt.emoji);
                        return;
                      }
                      if (opt.id === 'action_open_recipes') {
                        setShowRecipeBookDrawer(true);
                        return;
                      }
                      if (opt.id === 'action_open_fridge') {
                        setFridgeOpen(true);
                        return;
                      }
                      if (opt.id === 'action_wash_sink') {
                        if (dirtyPlateCount > 0) {
                          handleWashDirtyPlateAtSink();
                        } else {
                          const nextUnwashed = selectedRecipe.ingredients.find(
                            (i) => !washedIngredients.includes(i.id)
                          );
                          if (nextUnwashed) {
                            handleWashIngredientAtSink(nextUnwashed.id, nextUnwashed.name);
                          } else {
                            sound.playSplash();
                            if (onInWorldCharacterReaction) {
                              onInWorldCharacterReaction(
                                'playing',
                                'Air keran wastafel mengalir segar! Semua bahan sudah bersih! 🚰💧',
                                '💧'
                              );
                            }
                          }
                        }
                        return;
                      }
                      if (opt.id === 'action_eat_served') {
                        handleTakeBiteAtTable();
                        return;
                      }
                      if (opt.id === 'action_feed_milk') {
                        setInHighChair(true);
                        if (onQuickFeedMilk) onQuickFeedMilk();
                        return;
                      }
                      if (opt.id === 'action_feed_porridge') {
                        setInHighChair(true);
                        if (onQuickFeedPorridge) onQuickFeedPorridge();
                        return;
                      }
                      if (opt.id === 'action_toggle_highchair') {
                        setInHighChair((v) => !v);
                        if (onInWorldCharacterReaction) {
                          onInWorldCharacterReaction(
                            'big_smile',
                            !inHighChair
                              ? 'Duduk rapi di kursi makan siap menikmati hidangan bergizi! 🍽️😋'
                              : 'Selesai duduk di kursi makan! ✨',
                            '🍽️'
                          );
                        }
                        return;
                      }
                      if (opt.id === 'action_towel_dry') {
                        if (onTowelDryBaby) onTowelDryBaby();
                        if (onInWorldCharacterReaction) {
                          onInWorldCharacterReaction(
                            'big_smile',
                            'Handuk hangat dan lembut mengeringkan tubuhku setelah mandi! 🧺✨',
                            '🧺'
                          );
                        }
                        return;
                      }
                      if (opt.id === 'action_bath_face') {
                        if (onQuickBathAction) onQuickBathAction('face');
                        return;
                      }
                      if (opt.id === 'action_bath_hands') {
                        if (onQuickBathAction) onQuickBathAction('hands');
                        return;
                      }
                      if (opt.id === 'action_bath_full') {
                        setInBathTub(true);
                        setSoapFoamActive(true);
                        if (onQuickBathAction) onQuickBathAction('full_bath');
                        return;
                      }
                      if (opt.id === 'action_bath_rinse') {
                        setInBathTub(true);
                        setWaterSplashActive(true);
                        setSoapFoamActive(false);
                        sound.playSplash();
                        if (onQuickBathAction) onQuickBathAction('full_bath');
                        setTimeout(() => setWaterSplashActive(false), 1800);
                        return;
                      }
                      if (opt.id === 'action_toilet_pee') {
                        performToiletAction('pee');
                        return;
                      }
                      if (opt.id === 'action_toilet_poop') {
                        performToiletAction('poop');
                        return;
                      }
                      if (opt.id === 'action_enter_tub') {
                        setOnToilet(false);
                        setInBathTub(true);
                        targetPosRef.current = { x: 47, y: 73 };
                        setBabyPos({ x: 47, y: 73 });
                        sound.playSplash();
                        if (onInWorldCharacterReaction) {
                          onInWorldCharacterReaction(
                            'bathing',
                            'Air hangat di bak mandi segar sekali! Seret sabun & shower ya! 🛁🫧',
                            '🫧'
                          );
                        }
                        return;
                      }
                      if (opt.id === 'action_sofa_relax') {
                        walkCharacterTo(58, 62, () => {
                          if (onInWorldCharacterReaction) {
                            onInWorldCharacterReaction(
                              'clap_hands',
                              'Sofa ruang keluarga empuk dan nyaman sekali! 🛋️❤️',
                              '🛋️'
                            );
                          }
                        });
                        return;
                      }
                      if (opt.id === 'action_read_book') {
                        startInWorldObjectActivity('bookshelf', 'read_now', opt.label, opt.emoji);
                        return;
                      }
                      if (opt.id === 'action_play_cilukba') {
                        startInWorldObjectActivity('cilukba', 'var_1', opt.label, opt.emoji);
                        return;
                      }
                      if (opt.id === 'action_eat_picnic') {
                        walkCharacterTo(54, 68, () => {
                          sound.playEatDrink();
                          setOverrideActionState('eating');
                          completeInWorldActivity(
                            'picnic',
                            'eat_picnic',
                            'Piknik & Makan Bersama di Taman',
                            '🧺',
                            30,
                            35,
                            18,
                            'eating',
                            'Piknik di atas rumput sambil menikmati buah & bekal segar seru sekali! 🧺🍓🧃'
                          );
                        });
                        return;
                      }
                      if (opt.id === 'action_observe_butterfly') {
                        startInWorldObjectActivity('nature', 'butterfly', opt.label, opt.emoji);
                        return;
                      }
                      if (opt.id === 'action_kick_ball') {
                        startInWorldObjectActivity('ball', 'kick_ball', opt.label, opt.emoji);
                        return;
                      }
                      if (opt.id === 'action_collect_shells' || opt.id === 'action_dig_shells') {
                        startBeachSandDigging();
                        return;
                      }
                      if (opt.id === 'action_beach_picnic') {
                        startBeachPicnicEating();
                        return;
                      }
                      if (opt.id === 'action_beach_relax') {
                        startBeachUmbrellaRelax();
                        return;
                      }
                      if (opt.id === 'action_play_angklung') {
                        startPlayAngklung();
                        return;
                      }
                      if (opt.id === 'action_dance_nusantara') {
                        startTraditionalDance();
                        return;
                      }

                      startInWorldObjectActivity(
                        menuType,
                        opt.id,
                        opt.label,
                        opt.emoji
                      );
                    }}
                    className="min-h-[56px] px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-left text-xs font-bold text-[#2D2520] flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <span className="text-xl shrink-0">{opt.emoji}</span>
                    <span className="leading-tight">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
};

