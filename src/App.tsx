/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  BabyActionState,
  BabyAppearance,
  BabyGender,
  BabyMemory,
  BabyPersonalityId,
  BodyZoneId,
  CharacterEmotion,
  ConsumedFoodRecord,
  createDefaultSaveState,
  createInitialBathingProgress,
  createInitialMissions,
  GameSaveState,
  getGrowthStage,
  getNextLevelXp,
  getTodayDateString,
  GROWTH_STAGES,
  LOGIN_REWARDS,
  PERSONALITIES,
  STORE_ITEMS,
  StoreItem,
} from './data/gameData';
import {
  getClothingTitleForGender,
  getLifePhaseFromLevel,
  getLifePhaseLabel,
  INITIAL_REGION_SCORES,
  LifePhase,
  NUSANTARA_CLOTHING,
  NUSANTARA_MEALS,
  NUSANTARA_SNACKS,
  NusantaraClothingItem,
  NusantaraFoodItem,
  regionalData,
  RegionId,
  validateFoodPhaseAccess,
} from './data/nusantaraData';
import { AudioSettings, sound } from './utils/sound';
import {
  BabyStage25D,
  BODY_ZONES_META,
  FloatingParticle,
  InWorldActivityCommand,
  InWorldActivityCompletionPayload,
  InWorldObjectType,
} from './components/BabyStage25D';
import { TitleAndSetupModal } from './components/TitleAndSetupModal';
import { MathChallengeModal } from './components/MathChallengeModal';
import { ShopInventoryModal } from './components/ShopInventoryModal';
import {
  MemoriesModal,
  MissionsModal,
  ProfileModal,
  SettingsModal,
} from './components/ExtrasModals';
import { NusantaraCultureModal } from './components/NusantaraCultureModal';
import { EvolutionModal } from './components/EvolutionModal';
import { VoiceInteractionPanel } from './components/VoiceInteractionPanel';
import { MatchedVoiceReaction } from './data/voiceResponses';
import { LetsPlayTogetherModal } from './components/LetsPlayTogetherModal';
import {
  GrowingUpMemoriesModal,
  HealthcareAndHospitalModal,
} from './components/GrowingUpAndHospitalModal';
import {
  ActivityMemoryRecord,
  AgeActivityDefinition,
  calculateRealTimeGrowthSnapshot,
  createInitialCharacterLifeData,
  getAvailableActivitiesForStage,
  getCharacterProportionProfile,
  getCharacterScaleForStage,
  getCumulativeThresholdDays,
  getStageDurationDays,
  GROWING_UP_STAGE_CAPTIONS,
  GrowingUpStagePhotoMemory,
  growthConfig,
  IllnessStateId,
  levelToStageCode,
  STAGE_DISPLAY_META,
  TOTAL_ADULT_JOURNEY_DAYS,
} from './data/lifeProgressionData';
import {
  COOKING_RECIPES,
  CookingRecipeDef,
  createInitialActiveFoodState,
  createInitialCookingInventory,
  createInitialHarvestInventory,
  createInitialPlants,
  evaluatePlantGrowth,
  GardenPlantInstance,
  getPlantDef,
  getWorldLocationMeta,
  PersistentActiveFoodState,
  PlantId,
  WORLD_LOCATIONS,
  WorldLocationId,
} from './data/worldAndActivityData';
import {
  Calculator,
  ShoppingBag,
  Package,
  Shirt,
  Calendar,
  Camera,
  Settings,
  Volume2,
  VolumeX,
  Utensils,
  Moon,
  Bath,
  Gamepad2,
  Heart,
  HeartPulse,
  Home,
  Compass,
  Lock,
  UserCheck,
  Sparkles,
  LayoutGrid,
  X,
} from 'lucide-react';

const STORAGE_KEY = 'my_little_baby_math_care_save_v1';

type ActiveModal =
  | null
  | 'math'
  | 'shop'
  | 'inventory'
  | 'wardrobe'
  | 'nusantara'
  | 'missions'
  | 'memories'
  | 'profile'
  | 'settings'
  | 'lets_play'
  | 'growing_up'
  | 'healthcare';

type CareSubTray = null | 'feed' | 'bath' | 'play' | 'love' | 'menu';

const BODY_ZONE_LABELS: Record<BodyZoneId, string> = {
  head: 'Kepala & Rambut',
  body: 'Badan',
  leftArm: 'Lengan Kiri',
  rightArm: 'Lengan Kanan',
  leftLeg: 'Kaki Kiri',
  rightLeg: 'Kaki Kanan',
};

export function deriveCharacterEmotion(state: GameSaveState): CharacterEmotion {
  const now = Date.now();
  if (state.freshUntilTimestamp && now < state.freshUntilTimestamp && state.needs.hygiene >= 80) {
    return 'fresh';
  }
  if (state.needs.energy < 40) {
    return 'sleepy';
  }
  if (
    state.needs.hunger < 38 ||
    state.needs.hygiene < 38 ||
    state.needs.love < 35
  ) {
    return 'sad';
  }
  const minutesSincePlay = (now - (state.lastPlayTimestamp || now)) / (1000 * 60);
  if (state.needs.happiness < 55 || minutesSincePlay > 3.5) {
    return 'bored';
  }
  return 'happy';
}

export default function App() {
  const [gameState, setGameState] = useState<GameSaveState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<GameSaveState>;
        const defaults = createDefaultSaveState();
        const today = getTodayDateString();

        // Child-friendly offline need decay (never drops below 40!)
        const elapsedHours = Math.max(
          0,
          (Date.now() - (parsed.lastUpdatedTimestamp || Date.now())) / (1000 * 60 * 60)
        );
        const gentleDrop = Math.min(25, Math.floor(elapsedHours * 3));
        const parsedNeeds = parsed.needs || defaults.needs;

        const updatedNeeds = {
          hunger: Math.max(42, parsedNeeds.hunger - gentleDrop),
          energy: parsed.isSleeping
            ? Math.min(100, parsedNeeds.energy + gentleDrop * 2)
            : Math.max(45, parsedNeeds.energy - gentleDrop),
          hygiene: Math.max(45, parsedNeeds.hygiene - gentleDrop),
          happiness: Math.max(48, parsedNeeds.happiness - gentleDrop),
          health: Math.max(65, parsedNeeds.health - Math.floor(gentleDrop / 2)),
          love: Math.max(50, parsedNeeds.love - gentleDrop),
        };

        // Check daily reset
        let dailyMissions = parsed.dailyMissions || createInitialMissions();
        let claimedLoginToday = Boolean(parsed.claimedLoginToday);
        let loginStreak = parsed.loginStreak || 1;
        if (parsed.lastDailyReset !== today) {
          dailyMissions = createInitialMissions();
          claimedLoginToday = false;
          loginStreak = (parsed.loginStreak || 1) + 1;
        }

        const safeLevel = Math.max(1, Math.min(7, parsed.level || 1));
        const rawCreatedAt =
          parsed.characterLifeData?.characterCreatedAt ||
          parsed.characterLifeData?.createdAt ||
          Date.now();
        // Ensure legacy saves at a higher stage have a consistent characterCreatedAt timestamp so they never regress in age
        const minTimestampForSavedLevel =
          Date.now() - getCumulativeThresholdDays(safeLevel, growthConfig) * 24 * 60 * 60 * 1000;
        const safeCreatedAt = Math.min(rawCreatedAt, minTimestampForSavedLevel);

        const defaultLife = createInitialCharacterLifeData(safeCreatedAt);
        const mergedLifeData = {
          ...defaultLife,
          ...(parsed.characterLifeData || {}),
          characterCreatedAt: safeCreatedAt,
          createdAt: safeCreatedAt,
          currentStage: levelToStageCode(safeLevel),
        };

        const snapshot = calculateRealTimeGrowthSnapshot(safeCreatedAt, Date.now(), growthConfig);

        // Evaluate persistent garden plants with real-time catch-up
        const savedPlants =
          parsed.plants && parsed.plants.length === 4 ? parsed.plants : createInitialPlants();
        const evaluatedPlants = savedPlants.map((bed) => evaluatePlantGrowth(bed, Date.now()));

        const savedCurrentLoc = (parsed.currentRoom ||
          parsed.currentLocation ||
          'bedroom') as WorldLocationId;

        return {
          ...defaults,
          ...parsed,
          currentRoom: savedCurrentLoc,
          currentLocation: savedCurrentLoc,
          visitedLocations: parsed.visitedLocations || defaults.visitedLocations,
          locationStates: parsed.locationStates || {},
          gardenInventory: parsed.gardenInventory || defaults.gardenInventory,
          plants: evaluatedPlants,
          harvestInventory: {
            ...createInitialHarvestInventory(),
            ...(parsed.harvestInventory || {}),
          },
          cookingInventory: {
            ...createInitialCookingInventory(),
            ...(parsed.cookingInventory || {}),
          },
          recipesUnlocked:
            parsed.recipesUnlocked || COOKING_RECIPES.map((r) => r.id),
          cookingHistory: parsed.cookingHistory || [],
          foodState: parsed.foodState || createInitialActiveFoodState(),
          activityHistory: parsed.activityHistory || [],
          objectStates: parsed.objectStates || {},
          level: safeLevel,
          lifePhase: getLifePhaseFromLevel(safeLevel),
          regionScores: {
            ...INITIAL_REGION_SCORES,
            ...(parsed.regionScores || {}),
          },
          consumedFoodHistory: parsed.consumedFoodHistory || [],
          evaluatedAdultRegion: parsed.evaluatedAdultRegion ?? null,
          evaluatedAdultClothingId: parsed.evaluatedAdultClothingId ?? null,
          bathingProgress: parsed.bathingProgress || createInitialBathingProgress(),
          currentEmotion: parsed.currentEmotion || 'happy',
          lastActivity: parsed.lastActivity || 'idle',
          lastPlayTimestamp: parsed.lastPlayTimestamp || Date.now(),
          freshUntilTimestamp: parsed.freshUntilTimestamp || 0,
          unlockedAnimations:
            parsed.unlockedAnimations || ['sleeping', 'yawning', 'smiling', 'crying'],
          needs: updatedNeeds,
          dailyMissions,
          lastDailyReset: today,
          claimedLoginToday,
          loginStreak,
          lastUpdatedTimestamp: Date.now(),
          characterLifeData: {
            ...mergedLifeData,
            stageStartedAt: snapshot.stageStartedAt,
            stageDurationDays: snapshot.stageDurationDays,
            nextEvolutionAt: snapshot.nextEvolutionAt,
            totalElapsedDays: snapshot.totalElapsedDays,
            totalAgeDays: snapshot.totalElapsedDaysFloat,
            lastGrowthCheckAt: Date.now(),
            devBonusSimulatedDays: 0,
            characterScale: getCharacterScaleForStage(safeLevel),
            characterHeightStage: levelToStageCode(safeLevel),
            characterProportionProfile: getCharacterProportionProfile(safeLevel),
            characterVisualStage: levelToStageCode(safeLevel),
            characterAnchor: 'bottomCenter',
            characterGrowthTransition: null,
          },
        };
      }
    } catch {
      // Fallback to default
    }
    return createDefaultSaveState();
  });

  const [showTitleScreen, setShowTitleScreen] = useState<boolean>(!gameState.initialized);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [careTray, setCareTray] = useState<CareSubTray>(null);
  const [showWorldMapDrawer, setShowWorldMapDrawer] = useState<boolean>(false);
  const [stageModalOpen, setStageModalOpen] = useState<boolean>(false);
  const [voicePanelOpen, setVoicePanelOpen] = useState<boolean>(false);
  const [actionState, setActionState] = useState<BabyActionState>('idle');
  const [particles, setParticles] = useState<FloatingParticle[]>([]);
  const [speechBubble, setSpeechBubble] = useState<string | null>(null);
  const [levelUpBanner, setLevelUpBanner] = useState<string | null>(null);
  const [pendingEvolution, setPendingEvolution] = useState<{
    targetPhase: LifePhase;
    targetLevel: number;
    queueStepIndex: number;
    queueTotalSteps: number;
  } | null>(null);
  const [evolutionQueue, setEvolutionQueue] = useState<
    {
      targetPhase: LifePhase;
      targetLevel: number;
      queueStepIndex: number;
      queueTotalSteps: number;
    }[]
  >([]);
  const [voiceFeatureEnabled, setVoiceFeatureEnabled] = useState<boolean>(true);
  const [characterTtsEnabled, setCharacterTtsEnabled] = useState<boolean>(true);
  const [inWorldActivityCommand, setInWorldActivityCommand] =
    useState<InWorldActivityCommand | null>(null);

  const actionTimerRef = useRef<number | null>(null);
  const secondaryActionTimerRef = useRef<number | null>(null);
  const locationTabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const isExternalPanelOpen = Boolean(
    careTray || activeModal || showWorldMapDrawer || voicePanelOpen
  );
  const isAnyPanelOpen = Boolean(isExternalPanelOpen || stageModalOpen);

  // Auto-scroll active location tab into center view (G.2)
  useEffect(() => {
    const activeBtn = locationTabRefs.current[gameState.currentRoom];
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [gameState.currentRoom]);

  // Sync audio settings, derived emotion & persist state to LocalStorage
  useEffect(() => {
    sound.updateSettings(gameState.audioSettings);
    const derivedEmotion = deriveCharacterEmotion(gameState);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...gameState,
          currentEmotion: derivedEmotion,
          lastUpdatedTimestamp: Date.now(),
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [gameState]);

  // Real-Time 246-Day Timestamp-Based Growth Progression & Multi-Stage Offline Catch-Up
  useEffect(() => {
    if (showTitleScreen) return;
    if (gameState.level >= 7) return;

    const createdAt =
      gameState.characterLifeData.characterCreatedAt ||
      gameState.characterLifeData.createdAt ||
      Date.now();
    const snapshot = calculateRealTimeGrowthSnapshot(createdAt, Date.now(), growthConfig);

    // Check if real-world elapsed days crossed 1 or more stage thresholds
    if (snapshot.currentStageLevel > gameState.level) {
      const startLevel = gameState.level;
      const targetFinalLevel = snapshot.currentStageLevel;
      const stepsCount = targetFinalLevel - startLevel;
      const now = Date.now();
      const todayStr = getTodayDateString();

      const queuedTransitions: {
        targetPhase: LifePhase;
        targetLevel: number;
        queueStepIndex: number;
        queueTotalSteps: number;
      }[] = [];

      for (let lv = startLevel + 1; lv <= targetFinalLevel; lv++) {
        queuedTransitions.push({
          targetPhase: getLifePhaseFromLevel(lv),
          targetLevel: lv,
          queueStepIndex: lv - startLevel,
          queueTotalSteps: stepsCount,
        });
      }

      sound.playLevelUp();
      const latestStageInfo = getGrowthStage(targetFinalLevel);
      setLevelUpBanner(
        `🎉 Selamat! ${gameState.babyName} kini tumbuh menjadi ${latestStageInfo.indonesianTitle}!`
      );
      setTimeout(() => setLevelUpBanner(null), 6500);

      setGameState((prev) => {
        let bonusCoins = 0;
        const nextPhotos = [...prev.characterLifeData.photoMemories];
        const nextHistory = [...prev.characterLifeData.evolutionHistory];
        const nextMemories = [...prev.memories];
        const nextUnlockedActs = new Set(prev.characterLifeData.unlockedActivities || []);
        const nextUnlockedAnims = new Set(prev.unlockedAnimations || []);

        for (let lv = prev.level + 1; lv <= targetFinalLevel; lv++) {
          const stInfo = getGrowthStage(lv);
          const stCode = levelToStageCode(lv);
          const capMeta = GROWING_UP_STAGE_CAPTIONS[lv] || GROWING_UP_STAGE_CAPTIONS[2];
          const dispMeta = STAGE_DISPLAY_META[lv] || STAGE_DISPLAY_META[2];
          const reqDays = getCumulativeThresholdDays(lv, growthConfig);
          const milestoneTimestamp = createdAt + reqDays * 24 * 60 * 60 * 1000;
          const milestoneDateStr = new Date(milestoneTimestamp).toISOString().slice(0, 10);

          bonusCoins += stInfo.rewardCoins;

          if (lv === 2) {
            nextUnlockedAnims.add('crawling');
            nextUnlockedAnims.add('clapping');
          } else if (lv === 3) {
            nextUnlockedAnims.add('walking');
          } else if (lv === 4) {
            nextUnlockedAnims.add('reading');
            nextUnlockedAnims.add('dancing');
          } else if (lv === 5) {
            nextUnlockedAnims.add('studying');
          } else if (lv === 6) {
            nextUnlockedAnims.add('cooking');
          }

          getAvailableActivitiesForStage(lv).forEach((act) => nextUnlockedActs.add(act.id));

          if (!nextPhotos.some((p) => p.stageLevel === lv)) {
            nextPhotos.push({
              id: `photo_stage_${lv}_${now}`,
              stageLevel: lv,
              stageCode: stCode,
              stageTitle: stInfo.title,
              indonesianTitle: stInfo.indonesianTitle,
              caption: capMeta.caption || stInfo.evolutionMessage,
              unlockedDate: milestoneDateStr,
              unlockedTimestamp: milestoneTimestamp,
              outfitId: prev.appearance.equippedOutfit,
              ageDaysAtUnlock: reqDays,
              pose: capMeta.pose || dispMeta.defaultPose,
              roomBackground: capMeta.roomBackground || dispMeta.roomBackgroundLabel,
            });
          }

          if (!nextHistory.some((h) => h.stageLevel === lv)) {
            nextHistory.push({
              stageLevel: lv,
              stageCode: stCode,
              reachedAt: milestoneTimestamp,
              date: milestoneDateStr,
            });
          }

          nextMemories.unshift({
            id: `mem_rt_lv_${lv}_${now}`,
            title: `Selamat! ${prev.babyName} Tumbuh Menjadi ${stInfo.indonesianTitle}!`,
            description: `${prev.babyName} mencapai usia waktu nyata ${reqDays} hari dan tumbuh ke Stage ${lv} (${stInfo.title} · Tinggi ${getCharacterProportionProfile(lv).relativeHeightPercent}% Dewasa).`,
            date: todayStr,
            babyLevel: lv,
            outfitId: prev.appearance.equippedOutfit,
            badgeType: 'level_up',
          });
        }

        const nextStageCode = levelToStageCode(targetFinalLevel);
        return {
          ...prev,
          level: targetFinalLevel,
          lifePhase: getLifePhaseFromLevel(targetFinalLevel),
          coins: prev.coins + bonusCoins,
          unlockedAnimations: Array.from(nextUnlockedAnims),
          characterLifeData: {
            ...prev.characterLifeData,
            characterCreatedAt: createdAt,
            createdAt,
            currentStage: nextStageCode,
            stageStartedAt: snapshot.stageStartedAt,
            stageDurationDays: snapshot.stageDurationDays,
            nextEvolutionAt: snapshot.nextEvolutionAt,
            totalElapsedDays: snapshot.totalElapsedDays,
            totalAgeDays: snapshot.totalElapsedDaysFloat,
            lastGrowthCheckAt: now,
            unlockedActivities: Array.from(nextUnlockedActs),
            evolutionHistory: nextHistory,
            photoMemories: nextPhotos.sort((a, b) => a.stageLevel - b.stageLevel),
            characterScale: getCharacterScaleForStage(targetFinalLevel),
            characterHeightStage: nextStageCode,
            characterProportionProfile: getCharacterProportionProfile(targetFinalLevel),
            characterVisualStage: nextStageCode,
            characterAnchor: 'bottomCenter',
            characterGrowthTransition: {
              fromStage: levelToStageCode(prev.level),
              toStage: nextStageCode,
              fromScale: getCharacterScaleForStage(prev.level),
              toScale: getCharacterScaleForStage(targetFinalLevel),
              startedAt: now,
              durationMs: 3200,
              isTransitioning: true,
            },
          },
          memories: nextMemories,
        };
      });

      if (queuedTransitions.length > 0) {
        setPendingEvolution(queuedTransitions[0]);
        setEvolutionQueue(queuedTransitions.slice(1));
      }
    }
  }, [
    gameState.characterLifeData.totalAgeDays,
    gameState.characterLifeData.characterCreatedAt,
    gameState.level,
    showTitleScreen,
  ]);

  // Gradual realistic simulation loop (every 8.5 seconds) + dynamic emotion, healthcare & timestamp growth check
  useEffect(() => {
    if (showTitleScreen) return;

    const timer = window.setInterval(() => {
      setGameState((prev) => {
        const sleepMultiplier = prev.personality === 'sleepy' ? 1.3 : 1.0;
        const newEnergy = prev.isSleeping
          ? Math.min(100, prev.needs.energy + Math.round(4 * sleepMultiplier))
          : Math.max(15, prev.needs.energy - 1);

        const newHunger = Math.max(15, prev.needs.hunger - 1);
        const newHygiene = Math.max(15, prev.needs.hygiene - 1);
        const newHappiness = Math.max(15, prev.needs.happiness - (prev.isSleeping ? 0 : 1));
        const newLove = Math.max(20, prev.needs.love - (prev.isSleeping ? 0 : 1));

        // If hygiene drops below 65, mark zones as needing a bath again
        let nextBathingProgress = prev.bathingProgress;
        if (newHygiene < 60 && prev.needs.hygiene >= 60) {
          nextBathingProgress = {
            head: { foam: 0, cleaned: false },
            body: { foam: 0, cleaned: false },
            leftArm: { foam: 0, cleaned: false },
            rightArm: { foam: 0, cleaned: false },
            leftLeg: { foam: 0, cleaned: false },
            rightLeg: { foam: 0, cleaned: false },
          };
        }

        const avgCare = (newHunger + newEnergy + newHygiene) / 3;
        const hasImmunity =
          prev.characterLifeData.recoveryUntil !== null &&
          prev.characterLifeData.recoveryUntil > Date.now();

        let nextLifeHealth = prev.characterLifeData.health;
        let nextIllnessState = prev.characterLifeData.illnessState;

        if (!prev.characterLifeData.illnessEnabled || hasImmunity) {
          nextLifeHealth = Math.min(100, Math.max(85, nextLifeHealth + 2));
          if (nextIllnessState !== 'hospital_recovery') {
            nextIllnessState = 'healthy';
          }
        } else if (nextIllnessState !== 'hospital_recovery') {
          if (avgCare > 65) {
            nextLifeHealth = Math.min(100, nextLifeHealth + 1);
            if (nextLifeHealth >= 82) nextIllnessState = 'healthy';
          } else if (avgCare < 32) {
            nextLifeHealth = Math.max(25, nextLifeHealth - 1);
            if (nextLifeHealth < 38) {
              nextIllnessState = 'severe';
            } else if (nextLifeHealth < 58) {
              nextIllnessState = 'moderate';
            } else if (nextLifeHealth < 75) {
              nextIllnessState = 'mild';
            }
          }
        }

        const createdAt =
          prev.characterLifeData.characterCreatedAt ||
          prev.characterLifeData.createdAt ||
          Date.now();
        const snapshot = calculateRealTimeGrowthSnapshot(createdAt, Date.now(), growthConfig);

        const nextPlants = (prev.plants || createInitialPlants()).map((bed) =>
          evaluatePlantGrowth(bed, Date.now())
        );

        const nextCandidate: GameSaveState = {
          ...prev,
          plants: nextPlants,
          bathingProgress: nextBathingProgress,
          needs: {
            hunger: newHunger,
            energy: newEnergy,
            hygiene: newHygiene,
            happiness: newHappiness,
            health: Math.round(nextLifeHealth),
            love: newLove,
          },
          characterLifeData: {
            ...prev.characterLifeData,
            characterCreatedAt: createdAt,
            createdAt,
            stageStartedAt: snapshot.stageStartedAt,
            stageDurationDays: snapshot.stageDurationDays,
            nextEvolutionAt: snapshot.nextEvolutionAt,
            totalElapsedDays: snapshot.totalElapsedDays,
            totalAgeDays: snapshot.totalElapsedDaysFloat,
            lastGrowthCheckAt: Date.now(),
            health: nextLifeHealth,
            illnessState: nextIllnessState,
          },
        };

        return {
          ...nextCandidate,
          currentEmotion: deriveCharacterEmotion(nextCandidate),
        };
      });
    }, 8500);

    return () => clearInterval(timer);
  }, [showTitleScreen]);

  const spawnParticles = (emoji: string, count = 5) => {
    const maxCount = gameState.graphicsQuality === 'low' ? Math.min(2, count) : count;
    const created: FloatingParticle[] = Array.from({ length: maxCount }).map((_, idx) => ({
      id: `pt_${Date.now()}_${idx}_${Math.random()}`,
      emoji,
      x: 32 + Math.random() * 36,
      y: 25 + Math.random() * 35,
    }));
    setParticles((prev) => [...prev, ...created]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !created.some((c) => c.id === p.id)));
    }, 1600);
  };

  const triggerTemporaryAction = (
    state: BabyActionState,
    bubbleText: string,
    durationMs = 2600
  ) => {
    if (actionTimerRef.current) window.clearTimeout(actionTimerRef.current);
    if (secondaryActionTimerRef.current) window.clearTimeout(secondaryActionTimerRef.current);
    setActionState(state);
    setSpeechBubble(bubbleText);
    actionTimerRef.current = window.setTimeout(() => {
      setActionState('idle');
      setSpeechBubble(null);
      actionTimerRef.current = null;
    }, durationMs);
  };

  // ==================== VOICE INTERACTION & EMOTIONAL REACTION HANDLER ====================
  const handleTriggerVoiceReaction = (reaction: MatchedVoiceReaction) => {
    if (actionTimerRef.current) window.clearTimeout(actionTimerRef.current);
    if (secondaryActionTimerRef.current) window.clearTimeout(secondaryActionTimerRef.current);

    // Step 1: Primary Voice Reaction Animation & Speech Bubble
    setActionState(reaction.actionState);
    setSpeechBubble(`💬 ${reaction.responseText}`);
    spawnParticles(reaction.particleEmoji, 7);

    // Step 2: Optional Secondary Perspective Animation (e.g. screen_touch palm after make_heart or comfort_player)
    if (reaction.secondaryAnimation === 'screen_touch') {
      secondaryActionTimerRef.current = window.setTimeout(() => {
        setActionState('screen_touch');
        spawnParticles('💖', 5);
      }, 1700);
    }

    // Step 3: Return smoothly to idle state without stacking animations
    const totalDuration = reaction.secondaryAnimation ? 3900 : 3200;
    actionTimerRef.current = window.setTimeout(() => {
      setActionState('idle');
      setSpeechBubble(null);
      actionTimerRef.current = null;
    }, totalDuration);

    // Update character emotional needs & XP (Note: Spoken transcript is NEVER stored in LocalStorage)
    setGameState((prev) => {
      const nextState: GameSaveState = {
        ...prev,
        isSleeping: reaction.emotion === 'sleepy' ? prev.isSleeping : false,
        lastPlayTimestamp: Date.now(),
        needs: {
          ...prev.needs,
          love: Math.min(100, prev.needs.love + (reaction.needsDelta.love || 10)),
          happiness: Math.min(100, prev.needs.happiness + (reaction.needsDelta.happiness || 10)),
          energy: Math.min(100, prev.needs.energy + (reaction.needsDelta.energy || 0)),
        },
        dailyMissions: incrementMission(prev.dailyMissions, 'love_baby', 1),
      };
      return applyXpAndCheckLevel(nextState, reaction.xpGain, 0);
    });
  };

  // Rule 2: Playing math, earning coins, feeding, sleeping, or completing missions NEVER accelerates age or stage.
  // XP is tracked purely for care & math mastery statistics.
  const applyXpAndCheckLevel = (
    state: GameSaveState,
    careXpAdd: number,
    mathXpAdd: number
  ): GameSaveState => {
    const personalityBonus =
      state.personality === 'curious' && mathXpAdd > 0 ? Math.round(mathXpAdd * 0.25) : 0;
    const nextCareXp = state.careXp + careXpAdd;
    const nextMathXp = state.mathXp + mathXpAdd + personalityBonus;

    const updated: GameSaveState = {
      ...state,
      careXp: nextCareXp,
      mathXp: nextMathXp,
    };
    return {
      ...updated,
      currentEmotion: deriveCharacterEmotion(updated),
    };
  };

  // ==================== AGE-BASED ENTERTAINMENT ("LET'S PLAY TOGETHER!") HANDLERS ====================
  const handleToggleFavoriteActivity = (activityId: string) => {
    sound.playClick();
    setGameState((prev) => {
      const exists = prev.characterLifeData.favoriteActivities.includes(activityId);
      const nextFavs = exists
        ? prev.characterLifeData.favoriteActivities.filter((id) => id !== activityId)
        : [...prev.characterLifeData.favoriteActivities, activityId];
      return {
        ...prev,
        characterLifeData: {
          ...prev.characterLifeData,
          favoriteActivities: nextFavs,
        },
      };
    });
  };

  const handleCompleteActivitySession = (
    activity: AgeActivityDefinition,
    summaryText: string,
    scoreLabel: string,
    bonusFoodId?: string,
    bonusRegionId?: RegionId
  ) => {
    sound.playBabyLaugh();
    triggerTemporaryAction(
      activity.characterPose,
      `🎉 ${activity.indonesianTitle}: ${summaryText} (+${activity.coinReward} Coin)`,
      3500
    );
    spawnParticles(activity.iconEmoji, 6);

    setGameState((prev) => {
      const todayStr = getTodayDateString();
      const stageInfo = getGrowthStage(prev.level);

      const nextCompleted = prev.characterLifeData.completedActivities.includes(activity.id)
        ? prev.characterLifeData.completedActivities
        : [...prev.characterLifeData.completedActivities, activity.id];

      const nextRecent = [
        activity.id,
        ...prev.characterLifeData.recentlyPlayedActivities.filter((id) => id !== activity.id),
      ].slice(0, 12);

      const newActMemory: ActivityMemoryRecord = {
        id: `act_mem_${activity.id}_${Date.now()}`,
        activityId: activity.id,
        activityTitle: `${activity.iconEmoji} ${activity.indonesianTitle} (${activity.title})`,
        stageLevel: prev.level,
        stageTitle: stageInfo.indonesianTitle,
        date: todayStr,
        summary: summaryText,
        scoreOrResult: scoreLabel,
      };

      const nextFoodInventory = { ...prev.foodInventory };
      if (bonusFoodId) {
        nextFoodInventory[bonusFoodId] = (nextFoodInventory[bonusFoodId] || 0) + 1;
      }

      const nextRegionScores = { ...prev.regionScores };
      if (bonusRegionId) {
        nextRegionScores[bonusRegionId] = (nextRegionScores[bonusRegionId] || 0) + 1;
      }

      const nextState: GameSaveState = {
        ...prev,
        isSleeping: false,
        coins: prev.coins + activity.coinReward,
        lastPlayTimestamp: Date.now(),
        lastActivity: `lets_play_${activity.id}`,
        foodInventory: nextFoodInventory,
        regionScores: nextRegionScores,
        needs: {
          ...prev.needs,
          happiness: Math.min(100, prev.needs.happiness + activity.happinessGain),
          love: Math.min(100, prev.needs.love + activity.loveGain),
          energy: Math.max(15, prev.needs.energy - 3),
        },
        dailyMissions: incrementMission(prev.dailyMissions, 'play', 1),
        characterLifeData: {
          ...prev.characterLifeData,
          completedActivities: nextCompleted,
          recentlyPlayedActivities: nextRecent,
          activityMemories: [
            newActMemory,
            ...prev.characterLifeData.activityMemories,
          ].slice(0, 40),
        },
      };

      return applyXpAndCheckLevel(nextState, activity.xpReward, 0);
    });
  };

  // ==================== 246-DAY REAL-TIME GROWTH & GROWING UP MEMORIES HANDLERS ====================
  const handleCaptureCurrentStagePhoto = () => {
    sound.playClick();
    const now = Date.now();
    const todayStr = getTodayDateString();
    const stInfo = getGrowthStage(gameState.level);
    const capMeta = GROWING_UP_STAGE_CAPTIONS[gameState.level] || GROWING_UP_STAGE_CAPTIONS[1];
    const dispMeta = STAGE_DISPLAY_META[gameState.level] || STAGE_DISPLAY_META[1];

    setGameState((prev) => {
      const updatedPhoto: GrowingUpStagePhotoMemory = {
        id: `photo_stage_${prev.level}_${now}`,
        stageLevel: prev.level,
        stageCode: levelToStageCode(prev.level),
        stageTitle: stInfo.title,
        indonesianTitle: stInfo.indonesianTitle,
        caption: capMeta.caption || stInfo.evolutionMessage,
        unlockedDate: todayStr,
        unlockedTimestamp: now,
        outfitId: prev.appearance.equippedOutfit,
        ageDaysAtUnlock: Math.floor(prev.characterLifeData.totalAgeDays),
        pose: actionState === 'idle' ? capMeta.pose : actionState,
        roomBackground: capMeta.roomBackground || dispMeta.roomBackgroundLabel,
      };

      const filtered = prev.characterLifeData.photoMemories.filter(
        (p) => p.stageLevel !== prev.level
      );

      return {
        ...prev,
        characterLifeData: {
          ...prev.characterLifeData,
          photoMemories: [...filtered, updatedPhoto].sort(
            (a, b) => a.stageLevel - b.stageLevel
          ),
        },
      };
    });

    triggerTemporaryAction(
      'big_smile',
      `📸 Potret kenangan Tahap ${gameState.level} (${stInfo.indonesianTitle}) berhasil diperbarui!`,
      2800
    );
    spawnParticles('📸', 5);
  };

  // ==================== CHILD-FRIENDLY HEALTHCARE & 2.5D VIRTUAL HOSPITAL HANDLERS ====================
  const handleHomeCareAction = (
    careType: 'rest_bed' | 'warm_water' | 'virtual_syrup' | 'doctor_checkup'
  ) => {
    sound.playEatDrink();
    const healthBoost =
      careType === 'doctor_checkup'
        ? 30
        : careType === 'virtual_syrup'
        ? 20
        : 15;

    setGameState((prev) => {
      const nextHealth = Math.min(100, prev.characterLifeData.health + healthBoost);
      const nextIllness: IllnessStateId =
        nextHealth >= 82
          ? 'healthy'
          : nextHealth >= 60
          ? 'mild'
          : prev.characterLifeData.illnessState;

      const recoveredNow = nextIllness === 'healthy';

      return {
        ...prev,
        needs: {
          ...prev.needs,
          health: Math.round(nextHealth),
          energy: Math.min(100, prev.needs.energy + 12),
          love: Math.min(100, prev.needs.love + 10),
        },
        characterLifeData: {
          ...prev.characterLifeData,
          health: nextHealth,
          illnessState: nextIllness,
          recoveryUntil: recoveredNow ? Date.now() + 1000 * 60 * 25 : prev.characterLifeData.recoveryUntil,
        },
      };
    });
    spawnParticles('💚', 5);
  };

  const handleEnterHospital = () => {
    sound.playSleepChime();
    setGameState((prev) => ({
      ...prev,
      characterLifeData: {
        ...prev.characterLifeData,
        illnessState: 'hospital_recovery',
        health: Math.max(45, prev.characterLifeData.health),
      },
    }));
  };

  const handleHospitalCareStep = (stepType: 'monitor' | 'nutrition' | 'comfort') => {
    const boost = stepType === 'monitor' ? 12 : 20;
    setGameState((prev) => {
      const nextHealth = Math.min(100, prev.characterLifeData.health + boost);
      return {
        ...prev,
        needs: {
          ...prev.needs,
          health: Math.round(nextHealth),
          hunger: Math.min(100, prev.needs.hunger + 8),
          energy: Math.min(100, prev.needs.energy + 8),
          love: Math.min(100, prev.needs.love + 8),
        },
        characterLifeData: {
          ...prev.characterLifeData,
          health: nextHealth,
        },
      };
    });
  };

  const handleDischargeFromHospital = () => {
    sound.playLevelUp();
    const now = Date.now();
    setGameState((prev) => ({
      ...prev,
      needs: {
        hunger: Math.max(85, prev.needs.hunger),
        energy: Math.max(85, prev.needs.energy),
        hygiene: Math.max(85, prev.needs.hygiene),
        happiness: 100,
        health: 100,
        love: 100,
      },
      characterLifeData: {
        ...prev.characterLifeData,
        health: 100,
        illnessState: 'healthy',
        recoveryUntil: now + 1000 * 60 * 30, // 30-minute post-recovery immunity shield
      },
      memories: [
        {
          id: `mem_hospital_recovery_${now}`,
          title: `Welcome Home! ${prev.babyName} Pulih 100%!`,
          description: `${prev.babyName} selesai dirawat di Rumah Sakit Virtual 2.5D dan kembali ke rumah dengan tubuh sehat serta ceria!`,
          date: getTodayDateString(),
          babyLevel: prev.level,
          outfitId: prev.appearance.equippedOutfit,
          badgeType: 'first_care',
        },
        ...prev.memories,
      ],
    }));

    triggerTemporaryAction(
      'happy_jump',
      `🎉 Welcome Home! ${gameState.babyName} sudah 100% sehat dan kembali ke rumah!`,
      4000
    );
    spawnParticles('🎉', 8);
  };

  const handleToggleIllnessEnabled = () => {
    sound.playClick();
    setGameState((prev) => {
      const nextEnabled = !prev.characterLifeData.illnessEnabled;
      return {
        ...prev,
        needs: {
          ...prev.needs,
          health: nextEnabled ? prev.needs.health : 100,
        },
        characterLifeData: {
          ...prev.characterLifeData,
          illnessEnabled: nextEnabled,
          health: nextEnabled ? prev.characterLifeData.health : 100,
          illnessState: nextEnabled ? prev.characterLifeData.illnessState : 'healthy',
        },
      };
    });
  };

  const handleSimulateIllnessState = (targetState: IllnessStateId) => {
    sound.playClick();
    const healthForState: Record<IllnessStateId, number> = {
      healthy: 100,
      mild: 68,
      moderate: 52,
      severe: 34,
      hospital_recovery: 55,
    };
    const nextH = healthForState[targetState];
    setGameState((prev) => ({
      ...prev,
      needs: {
        ...prev.needs,
        health: nextH,
      },
      characterLifeData: {
        ...prev.characterLifeData,
        illnessEnabled: true,
        health: nextH,
        illnessState: targetState,
        recoveryUntil: targetState === 'healthy' ? Date.now() + 1000 * 60 * 15 : null,
      },
    }));
  };

  const incrementMission = (
    missions: GameSaveState['dailyMissions'],
    type: GameSaveState['dailyMissions'][0]['type'],
    amount = 1
  ) => {
    return missions.map((m) =>
      m.type === type ? { ...m, progress: Math.min(m.target, m.progress + amount) } : m
    );
  };

  // ==================== START NEW GAME ====================
  const handleStartNewGame = (config: {
    playerName: string;
    babyName: string;
    gender: BabyGender;
    personality: BabyPersonalityId;
    appearance: BabyAppearance;
  }) => {
    const fresh = createDefaultSaveState();
    const firstMemory: BabyMemory = {
      id: `mem_init_${Date.now()}`,
      title: `Selamat datang, ${config.babyName}!`,
      description: `Hari pertama ${config.playerName} merawat ${config.babyName} (Stage 1: Bayi Dibedong).`,
      date: getTodayDateString(),
      babyLevel: 1,
      outfitId: config.appearance.equippedOutfit,
      badgeType: 'first_care',
    };

    setGameState({
      ...fresh,
      initialized: true,
      playerName: config.playerName,
      babyName: config.babyName,
      gender: config.gender,
      personality: config.personality,
      appearance: config.appearance,
      memories: [firstMemory],
    });
    setShowTitleScreen(false);
    triggerTemporaryAction(
      'waving',
      `Selamat datang, ${config.babyName}! Halo Kak ${config.playerName}! 💕`,
      3200
    );
    spawnParticles('💕', 6);
  };

  // ==================== UPDATE NAMES (PROFILE / SETTINGS) ====================
  const handleUpdateNames = (newBabyName: string, newPlayerName: string) => {
    const cleanedBaby = newBabyName.trim();
    const cleanedPlayer = newPlayerName.trim();
    if (!cleanedBaby) return;

    setGameState((prev) => ({
      ...prev,
      babyName: cleanedBaby,
      playerName: cleanedPlayer || prev.playerName,
    }));
    triggerTemporaryAction('waving', `Selamat datang, ${cleanedBaby}! 💕`);
  };

  // ==================== EVOLUTION COMPLETION HANDLERS (WITH MULTI-STAGE QUEUE SUPPORT) ====================
  const triggerInWorldGrowthTransition = (targetLv: number) => {
    const prevLv = Math.max(1, targetLv - 1);
    const fromCode = levelToStageCode(prevLv);
    const toCode = levelToStageCode(targetLv);
    const fromScale = getCharacterScaleForStage(prevLv);
    const toScale = getCharacterScaleForStage(targetLv);
    const now = Date.now();

    setGameState((prev) => ({
      ...prev,
      characterLifeData: {
        ...prev.characterLifeData,
        characterScale: toScale,
        characterHeightStage: toCode,
        characterProportionProfile: getCharacterProportionProfile(targetLv),
        characterVisualStage: toCode,
        characterAnchor: 'bottomCenter',
        characterGrowthTransition: {
          fromStage: fromCode,
          toStage: toCode,
          fromScale,
          toScale,
          startedAt: now,
          durationMs: 3200,
          isTransitioning: true,
        },
      },
    }));

    window.setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        characterLifeData: {
          ...prev.characterLifeData,
          characterGrowthTransition: prev.characterLifeData.characterGrowthTransition
            ? {
                ...prev.characterLifeData.characterGrowthTransition,
                isTransitioning: false,
              }
            : null,
        },
      }));
    }, 3300);
  };

  const handleCompleteChildEvolution = () => {
    const completedLevel = pendingEvolution?.targetLevel || gameState.level;
    const stageInfo = getGrowthStage(completedLevel);
    if (evolutionQueue.length > 0) {
      const [nextInQueue, ...restQueue] = evolutionQueue;
      setPendingEvolution(nextInQueue);
      setEvolutionQueue(restQueue);
    } else {
      setPendingEvolution(null);
      triggerInWorldGrowthTransition(completedLevel);
      triggerTemporaryAction(
        'laughing',
        `Selamat! ${gameState.babyName} kini tumbuh menjadi ${stageInfo.indonesianTitle} (Tinggi ${getCharacterProportionProfile(completedLevel).relativeHeightPercent}% Dewasa)! 🎉`,
        3500
      );
      spawnParticles('🎉', 7);
    }
  };

  const handleCompleteAdultEvolution = (chosenRegionId: RegionId, chosenClothingId: string) => {
    const regionEntry = regionalData[chosenRegionId];
    const clothingItem = NUSANTARA_CLOTHING.find((c) => c.id === chosenClothingId);
    const clothingName = clothingItem
      ? getClothingTitleForGender(clothingItem, gameState.gender)
      : regionEntry.clothingName;

    setGameState((prev) => {
      const updatedClothes = prev.ownedClothes.includes(chosenClothingId)
        ? prev.ownedClothes
        : [...prev.ownedClothes, chosenClothingId];

      const adultMemory: BabyMemory = {
        id: `mem_adult_nusantara_${Date.now()}`,
        title: `${prev.babyName} Mengenakan ${clothingName} (${regionEntry.name})!`,
        description: `Perjalanan 246 hari (~8 bulan) tercapai! Sekarang ${prev.babyName} telah menjadi dewasa (Tinggi 100%) dan mengenakan pakaian adat ${clothingName} dari ${regionEntry.name}!`,
        date: getTodayDateString(),
        babyLevel: prev.level,
        outfitId: chosenClothingId,
        badgeType: 'costume',
      };

      return {
        ...prev,
        ownedClothes: updatedClothes,
        evaluatedAdultRegion: chosenRegionId,
        evaluatedAdultClothingId: chosenClothingId,
        appearance: {
          ...prev.appearance,
          equippedOutfit: chosenClothingId,
        },
        memories: [adultMemory, ...prev.memories],
      };
    });

    setPendingEvolution(null);
    setEvolutionQueue([]);
    triggerInWorldGrowthTransition(7);
    triggerTemporaryAction(
      'waving',
      `Perjalanan panjang 246 hari! Sekarang ${gameState.babyName} telah menjadi dewasa (Tinggi 100%) & memakai baju adat ${regionEntry.name}! 👑`,
      4000
    );
    spawnParticles('👑', 8);
  };

  // ==================== CARE ACTIONS ====================
  // 1. FEED (WITH AGE-UNLOCK VALIDATION & REGIONAL AFFINITY POINTS ON CONSUMPTION)
  const handleFeedItem = (food: StoreItem | NusantaraFoodItem) => {
    const access = validateFoodPhaseAccess(food.id, gameState.level);
    if (!access.allowed) {
      sound.playWrong();
      setSpeechBubble(
        access.reason ||
          'Menu makanan Nusantara akan terbuka ketika aku tumbuh menjadi anak-anak.'
      );
      setTimeout(() => setSpeechBubble(null), 3200);
      return;
    }

    const currentQty = gameState.foodInventory[food.id] || 0;
    if (currentQty <= 0) {
      sound.playWrong();
      setSpeechBubble(`Stok ${food.name} habis! Ayo beli di Toko atau Museum Budaya.`);
      setTimeout(() => setSpeechBubble(null), 2400);
      return;
    }

    const regionalFood = [...NUSANTARA_SNACKS, ...NUSANTARA_MEALS].find((r) => r.id === food.id);
    const currentPhase = getLifePhaseFromLevel(gameState.level);
    const shouldAddRegionPoint =
      Boolean(regionalFood) && (currentPhase === 'ANAK_ANAK' || currentPhase === 'DEWASA');

    sound.playEatDrink();
    const isDrink = food.id === 'food_milk';

    if (regionalFood && shouldAddRegionPoint) {
      triggerTemporaryAction(
        'eating',
        `Nyam! ${gameState.babyName} suka ${food.name} khas ${regionalFood.regionName}! (+1 Poin Budaya ${regionalFood.regionName}) ${food.iconEmoji}`,
        3200
      );
    } else {
      triggerTemporaryAction(
        isDrink ? 'drinking' : 'eating',
        `Nyam nyam! ${gameState.babyName} menikmati ${food.name}! ${food.iconEmoji}`
      );
    }
    spawnParticles(food.iconEmoji, 5);

    setGameState((prev) => {
      const updatedFood = {
        ...prev.foodInventory,
        [food.id]: Math.max(0, (prev.foodInventory[food.id] || 0) - 1),
      };

      const nextRegionScores = { ...prev.regionScores };
      const nextConsumedHistory: ConsumedFoodRecord[] = [...prev.consumedFoodHistory];

      if (regionalFood && shouldAddRegionPoint) {
        const regId = regionalFood.regionId;
        nextRegionScores[regId] = (nextRegionScores[regId] || 0) + 1;
        nextConsumedHistory.unshift({
          id: `cf_${Date.now()}_${Math.random()}`,
          foodId: regionalFood.id,
          foodName: regionalFood.name,
          regionId: regId,
          date: getTodayDateString(),
        });
      }

      const nextState: GameSaveState = {
        ...prev,
        isSleeping: false,
        currentRoom: 'kitchen',
        lastActivity: `feed_${food.id}`,
        foodInventory: updatedFood,
        regionScores: nextRegionScores,
        consumedFoodHistory: nextConsumedHistory,
        needs: {
          ...prev.needs,
          hunger: Math.min(100, prev.needs.hunger + (food.hungerRestore || 20)),
          health: Math.min(100, prev.needs.health + (food.healthRestore || 5)),
          happiness: Math.min(100, prev.needs.happiness + (food.happinessRestore || 5)),
          love: Math.min(100, prev.needs.love + (food.loveRestore || 4)),
        },
        dailyMissions: incrementMission(prev.dailyMissions, 'feed_milk', 1),
      };
      return applyXpAndCheckLevel(nextState, food.xpGain || 12, 0);
    });
  };

  // 2. SLEEP & CRIB INTERACTIONS
  const handleToggleSleep = () => {
    const nextSleeping = !gameState.isSleeping;
    if (nextSleeping) {
      sound.playSleepChime();
      setCareTray(null);
      setSpeechBubble(`Selamat tidur, ${gameState.babyName}... mimpi indah! 🌙`);
      setTimeout(() => setSpeechBubble(null), 2400);
      spawnParticles('💤', 4);
    } else {
      sound.playBabyBabble();
      triggerTemporaryAction(
        'waking_up',
        `Hoaam! ${gameState.babyName} meregangkan tubuh dan bangun segar! ☀️`,
        2600
      );
    }

    setGameState((prev) => ({
      ...prev,
      currentRoom: 'bedroom',
      isSleeping: nextSleeping,
      lastActivity: nextSleeping ? 'sleeping' : 'waking_up',
      needs: {
        ...prev.needs,
        energy: nextSleeping ? Math.min(100, prev.needs.energy + 18) : prev.needs.energy,
        health: nextSleeping ? Math.min(100, prev.needs.health + 5) : prev.needs.health,
      },
    }));
  };

  const handlePutBabyToSleepInCrib = () => {
    sound.playSleepChime();
    setCareTray(null);
    setSpeechBubble(
      `Selimut ditarik hangat... Selamat tidur di kasur, ${gameState.babyName}! 🌙`
    );
    setTimeout(() => setSpeechBubble(null), 2600);
    spawnParticles('💤', 5);
    setGameState((prev) => ({
      ...prev,
      currentRoom: 'bedroom',
      isSleeping: true,
      lastActivity: 'sleeping_in_crib',
      needs: {
        ...prev.needs,
        energy: Math.min(100, prev.needs.energy + 22),
        health: Math.min(100, prev.needs.health + 6),
        love: Math.min(100, prev.needs.love + 8),
      },
    }));
  };

  const handleWakeBabyFromCrib = () => {
    sound.playBabyBabble();
    triggerTemporaryAction(
      'waking_up',
      `Hoaam! ${gameState.babyName} bangun tidur dan siap bermain! ☀️`,
      2600
    );
    setGameState((prev) => ({
      ...prev,
      isSleeping: false,
      lastActivity: 'woke_up',
    }));
  };

  // 3. REALISTIC INTERACTIVE BATHING (6 BODY ZONES: SOAP FOAM -> SHOWER WATER RINSE -> FRESH)
  const handleApplySoapToZone = (zone: BodyZoneId) => {
    spawnParticles('🫧', 2);
    setActionState('bathing');
    setSpeechBubble(`Menggosok sabun busa di ${BODY_ZONE_LABELS[zone]} ${gameState.babyName}! 🧼🫧`);

    setGameState((prev) => {
      const prevZone = prev.bathingProgress[zone];
      const nextFoam = Math.min(100, prevZone.foam + 40);
      const nextZones: GameSaveState['bathingProgress'] = {
        ...prev.bathingProgress,
        [zone]: {
          foam: nextFoam,
          cleaned: prevZone.cleaned,
        },
      };
      return {
        ...prev,
        isSleeping: false,
        currentRoom: 'bathroom',
        lastActivity: `soap_${zone}`,
        bathingProgress: nextZones,
      };
    });
  };

  const handleRinseZoneWithShower = (zone: BodyZoneId) => {
    spawnParticles('💧', 2);
    setActionState('bathing');

    setGameState((prev) => {
      const prevZone = prev.bathingProgress[zone];
      const nextFoam = Math.max(0, prevZone.foam - 50);
      const nowClean = nextFoam === 0;

      const nextZones: GameSaveState['bathingProgress'] = {
        ...prev.bathingProgress,
        [zone]: {
          foam: nextFoam,
          cleaned: nowClean,
        },
      };

      const allZonesClean = (
        Object.values(nextZones) as { foam: number; cleaned: boolean }[]
      ).every((z) => z.cleaned && z.foam === 0);

      const nextHygiene = allZonesClean
        ? 100
        : Math.min(100, prev.needs.hygiene + (nowClean ? 12 : 6));
      const nextHappiness = Math.min(100, prev.needs.happiness + (allZonesClean ? 14 : 4));

      if (allZonesClean) {
        setSpeechBubble(
          `✨ Segar sekali! Seluruh tubuh ${prev.babyName} sudah dibilas bersih, wangi & berkilau!`
        );
        setActionState('fresh');
        setTimeout(() => {
          setActionState('idle');
          setSpeechBubble(null);
        }, 3200);
      } else {
        setSpeechBubble(
          `🚿 Membilas busa di ${BODY_ZONE_LABELS[zone]} dengan air shower hangat!`
        );
      }

      const nextState: GameSaveState = {
        ...prev,
        isSleeping: false,
        currentRoom: 'bathroom',
        lastActivity: allZonesClean ? 'bath_complete_fresh' : `rinse_${zone}`,
        freshUntilTimestamp: allZonesClean ? Date.now() + 1000 * 60 * 4 : prev.freshUntilTimestamp,
        bathingProgress: nextZones,
        needs: {
          ...prev.needs,
          hygiene: nextHygiene,
          happiness: nextHappiness,
          health: Math.min(100, prev.needs.health + 3),
        },
        dailyMissions: allZonesClean
          ? incrementMission(prev.dailyMissions, 'bath', 1)
          : prev.dailyMissions,
      };
      return applyXpAndCheckLevel(nextState, allZonesClean ? 16 : 4, 0);
    });
  };

  // Quick Bath Actions from Sub-Tray
  const handleHygieneAction = (mode: 'full_bath' | 'diaper' | 'face' | 'hands') => {
    sound.playSplash();
    const configs = {
      full_bath: {
        label: `Segarnya ${gameState.babyName} mandi busa dan dibilas bersih! 🛁🫧✨`,
        hygiene: 40,
        happy: 14,
        xp: 18,
        emoji: '🫧',
      },
      diaper: {
        label: `Popok ${gameState.babyName} sudah diganti bersih dan nyaman! 🧷✨`,
        hygiene: 25,
        happy: 8,
        xp: 14,
        emoji: '✨',
      },
      face: {
        label: `Wajah & rambut ${gameState.babyName} sudah dibersihkan dan harum! 😊`,
        hygiene: 18,
        happy: 8,
        xp: 10,
        emoji: '💧',
      },
      hands: {
        label: `Tangan ${gameState.babyName} bersih bebas kuman! 🧼`,
        hygiene: 16,
        happy: 6,
        xp: 10,
        emoji: '🧼',
      },
    };
    const cfg = configs[mode];

    triggerTemporaryAction(mode === 'full_bath' ? 'fresh' : 'bathing', cfg.label);
    spawnParticles(cfg.emoji, 6);

    setGameState((prev) => {
      const nextHygiene = Math.min(100, prev.needs.hygiene + cfg.hygiene);
      const isNowFresh = nextHygiene >= 88 || mode === 'full_bath';
      const nextState: GameSaveState = {
        ...prev,
        isSleeping: false,
        currentRoom: 'bathroom',
        lastActivity: `hygiene_${mode}`,
        freshUntilTimestamp: isNowFresh ? Date.now() + 1000 * 60 * 4 : prev.freshUntilTimestamp,
        bathingProgress: isNowFresh ? createInitialBathingProgress() : prev.bathingProgress,
        needs: {
          ...prev.needs,
          hygiene: nextHygiene,
          happiness: Math.min(100, prev.needs.happiness + cfg.happy),
          health: Math.min(100, prev.needs.health + 6),
        },
        dailyMissions: incrementMission(prev.dailyMissions, 'bath', 1),
      };
      return applyXpAndCheckLevel(nextState, cfg.xp, 0);
    });
  };

  const handleTowelDryBaby = () => {
    sound.playBabyLaugh();
    triggerTemporaryAction(
      'fresh',
      `Mengeringkan tubuh ${gameState.babyName} dengan handuk lembut & memakai pakaian bersih! Segar sekali! ✨`,
      2800
    );
    spawnParticles('✨', 6);
    setGameState((prev) => {
      const nextState: GameSaveState = {
        ...prev,
        isSleeping: false,
        currentRoom: 'bathroom',
        lastActivity: 'towel_dry_fresh',
        freshUntilTimestamp: Date.now() + 1000 * 60 * 5,
        bathingProgress: createInitialBathingProgress(),
        needs: {
          ...prev.needs,
          hygiene: 100,
          happiness: Math.min(100, prev.needs.happiness + 15),
          love: Math.min(100, prev.needs.love + 10),
        },
        dailyMissions: incrementMission(prev.dailyMissions, 'bath', 1),
      };
      return applyXpAndCheckLevel(nextState, 15, 0);
    });
  };

  const handleUseToilet = (mode: 'pee' | 'poop') => {
    sound.playSplash();
    const isPoop = mode === 'poop';
    const hygieneDecrease = isPoop ? 32 : 20;
    const actionLabel = isPoop
      ? `🚽 Lega rasanya ${gameState.babyName} sudah buang air besar (BAB) di toilet! Sekarang kebersihan menurun (-${hygieneDecrease}%), ayo bersihkan dengan sabun, shower & handuk! 🧼🚿🧺`
      : `🚽 Lega rasanya ${gameState.babyName} sudah buang air kecil (BAK) di toilet! Kebersihan menurun (-${hygieneDecrease}%), ayo bilas bersih tubuhnya! 🚿🧺`;

    triggerTemporaryAction('happy_jump', actionLabel, 3600);
    spawnParticles(isPoop ? '💩' : '💦', 5);

    setGameState((prev) => {
      const nextHygiene = Math.max(12, prev.needs.hygiene - hygieneDecrease);
      const soiledProgress: GameSaveState['bathingProgress'] = {
        ...prev.bathingProgress,
        body: { foam: 0, cleaned: false },
        leftLeg: { foam: 0, cleaned: false },
        rightLeg: { foam: 0, cleaned: false },
        ...(isPoop
          ? {
              leftArm: { foam: 0, cleaned: false },
              rightArm: { foam: 0, cleaned: false },
            }
          : {}),
      };

      const nextState: GameSaveState = {
        ...prev,
        isSleeping: false,
        currentRoom: 'bathroom',
        lastActivity: `toilet_${mode}`,
        freshUntilTimestamp: 0,
        bathingProgress: soiledProgress,
        needs: {
          ...prev.needs,
          hygiene: nextHygiene,
          happiness: Math.min(100, prev.needs.happiness + 12),
          health: Math.min(100, prev.needs.health + 8),
        },
      };
      return applyXpAndCheckLevel(nextState, 12, 5);
    });
  };

  // ==================== SEAMLESS IN-WORLD ACTIVITY LAUNCHER & COMPLETION ====================
  const handleStartInWorldActivity = (
    type: InWorldObjectType,
    subAction: string,
    title: string,
    icon: string,
    activityDefId?: string,
    preferredRoom?: GameSaveState['currentRoom']
  ) => {
    sound.playClick();
    setCareTray(null);
    setShowWorldMapDrawer(false);
    setActiveModal(null);
    if (preferredRoom && gameState.currentRoom !== preferredRoom) {
      setGameState((prev) => ({
        ...prev,
        isSleeping: false,
        currentRoom: preferredRoom,
        currentLocation: preferredRoom,
        visitedLocations: prev.visitedLocations.includes(preferredRoom)
          ? prev.visitedLocations
          : [...prev.visitedLocations, preferredRoom],
      }));
    } else if (gameState.isSleeping) {
      setGameState((prev) => ({
        ...prev,
        isSleeping: false,
      }));
    }
    setInWorldActivityCommand({
      id: `cmd_${type}_${subAction}_${Date.now()}`,
      type,
      subAction,
      title,
      icon,
      activityDefId,
      timestamp: Date.now(),
    });
  };

  // Smooth Location Switcher Handler (Updates currentRoom, currentLocation & visitedLocations)
  const handleChangeWorldLocation = (targetLocation: WorldLocationId) => {
    sound.playClick();
    setShowWorldMapDrawer(false);
    const meta = getWorldLocationMeta(targetLocation);
    setGameState((prev) => ({
      ...prev,
      isSleeping: targetLocation === 'bedroom' ? prev.isSleeping : false,
      currentRoom: targetLocation,
      currentLocation: targetLocation,
      visitedLocations: prev.visitedLocations.includes(targetLocation)
        ? prev.visitedLocations
        : [...prev.visitedLocations, targetLocation],
      locationStates: {
        ...prev.locationStates,
        [targetLocation]: {
          lastVisitedAt: Date.now(),
          visitCount: Number(prev.locationStates[targetLocation]?.visitCount || 0) + 1,
        },
      },
    }));
    triggerTemporaryAction(
      'waving',
      `${meta.iconEmoji} ${gameState.babyName} tiba di ${meta.indonesianName}!`,
      2200
    );
  };

  // Persistent 4-Bed Garden Handlers
  const handleUpdatePlants = (nextPlants: GardenPlantInstance[]) => {
    setGameState((prev) => ({
      ...prev,
      plants: nextPlants,
    }));
  };

  const handleHarvestPlant = (plantId: PlantId, bedIndex: number) => {
    const plantDef = getPlantDef(plantId);
    setGameState((prev) => {
      const nextPlants = prev.plants.map((bed) =>
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
      const nextHarvest = {
        ...prev.harvestInventory,
        [plantId]: (prev.harvestInventory[plantId] || 0) + 1,
      };
      return {
        ...prev,
        plants: nextPlants,
        harvestInventory: nextHarvest,
        coins: prev.coins + plantDef.coinValue,
      };
    });
  };

  // Persistent Full Kitchen Cooking, Eating & Dishwashing Handlers
  const handleUpdateFoodState = (nextFoodState: PersistentActiveFoodState) => {
    setGameState((prev) => ({
      ...prev,
      foodState: nextFoodState,
    }));
  };

  const handleConsumeCookedRecipe = (
    recipe: CookingRecipeDef,
    usedHarvestPlantIds: PlantId[]
  ) => {
    setGameState((prev) => {
      const nextHarvest = { ...prev.harvestInventory };
      usedHarvestPlantIds.forEach((pid) => {
        if ((nextHarvest[pid] || 0) > 0) {
          nextHarvest[pid] = Math.max(0, (nextHarvest[pid] || 0) - 1);
        }
      });

      const nextCookingInventory = { ...(prev.cookingInventory || {}) };
      if (recipe.ingredients.includes('kerang') && (nextCookingInventory.kerang || 0) > 0) {
        nextCookingInventory.kerang = Math.max(0, (nextCookingInventory.kerang || 0) - 1);
      }

      const nextRegionScores = { ...prev.regionScores };
      const currentPhase = getLifePhaseFromLevel(prev.level);
      if (
        recipe.regionAffinity &&
        (recipe.regionAffinity === 'aceh' ||
          currentPhase === 'ANAK_ANAK' ||
          currentPhase === 'DEWASA')
      ) {
        const regKey = recipe.regionAffinity as RegionId;
        if (regKey in nextRegionScores) {
          nextRegionScores[regKey] = (nextRegionScores[regKey] || 0) + 1;
        }
      }

      const nextState: GameSaveState = {
        ...prev,
        isSleeping: false,
        harvestInventory: nextHarvest,
        cookingInventory: nextCookingInventory,
        regionScores: nextRegionScores,
        cookingHistory: [
          {
            id: `cook_${recipe.id}_${Date.now()}`,
            recipeId: recipe.id,
            recipeTitle: recipe.indonesianTitle,
            cookedAt: Date.now(),
            date: getTodayDateString(),
          },
          ...(prev.cookingHistory || []),
        ].slice(0, 40),
        needs: {
          ...prev.needs,
          hunger: Math.min(100, prev.needs.hunger + recipe.hungerRestore),
          happiness: Math.min(100, prev.needs.happiness + recipe.happinessRestore),
          health: Math.min(100, prev.needs.health + recipe.healthRestore),
          love: Math.min(100, prev.needs.love + 12),
        },
        dailyMissions: incrementMission(prev.dailyMissions, 'feed_milk', 1),
      };
      return applyXpAndCheckLevel(nextState, recipe.xpGain, 0);
    });
  };

  // Beach Picnic Bite Handler: genuinely restores Hunger (persentase kenyang) bit-by-bit!
  const handleBeachPicnicBite = (
    hungerGain: number,
    happinessGain: number,
    foodLabel: string
  ) => {
    setGameState((prev) => {
      const nextHunger = Math.min(100, Math.round(prev.needs.hunger + hungerGain));
      const nextState: GameSaveState = {
        ...prev,
        isSleeping: false,
        lastActivity: `piknik_pantai_${foodLabel}`,
        needs: {
          ...prev.needs,
          hunger: nextHunger,
          happiness: Math.min(100, prev.needs.happiness + happinessGain),
          energy: Math.min(100, prev.needs.energy + 3),
        },
        dailyMissions: incrementMission(prev.dailyMissions, 'feed_milk', 1),
      };
      return applyXpAndCheckLevel(nextState, 5, 0);
    });
  };

  // Beach Shell Bucket Collection Handler: adds fresh beach kerang to persistent cookingInventory for Aceh cooking!
  const handleCollectBeachShell = (_shellName: string) => {
    setGameState((prev) => {
      const nextCookingInventory = {
        ...(prev.cookingInventory || {}),
        kerang: ((prev.cookingInventory || {}).kerang || 0) + 1,
      };
      const nextState: GameSaveState = {
        ...prev,
        coins: prev.coins + 5,
        cookingInventory: nextCookingInventory,
        lastActivity: 'kumpul_kerang_pantai',
        needs: {
          ...prev.needs,
          happiness: Math.min(100, prev.needs.happiness + 5),
        },
      };
      return applyXpAndCheckLevel(nextState, 8, 0);
    });
  };

  const handleCleanDirtyDish = () => {
    setGameState((prev) => {
      const nextState: GameSaveState = {
        ...prev,
        coins: prev.coins + 8,
        needs: {
          ...prev.needs,
          hygiene: Math.min(100, prev.needs.hygiene + 6),
          happiness: Math.min(100, prev.needs.happiness + 8),
        },
      };
      return applyXpAndCheckLevel(nextState, 12, 0);
    });
  };

  const handleCompleteInWorldActivity = (payload: InWorldActivityCompletionPayload) => {
    triggerTemporaryAction(payload.actionState, payload.speech, 3200);
    spawnParticles(payload.icon, 6);

    setGameState((prev) => {
      const todayStr = getTodayDateString();
      const stageInfo = getGrowthStage(prev.level);
      const actId = payload.activityDefId || `inworld_${payload.type}_${payload.subAction}`;

      const nextCompleted = prev.characterLifeData.completedActivities.includes(actId)
        ? prev.characterLifeData.completedActivities
        : [...prev.characterLifeData.completedActivities, actId];

      const nextRecent = [
        actId,
        ...prev.characterLifeData.recentlyPlayedActivities.filter((id) => id !== actId),
      ].slice(0, 12);

      const newActMemory: ActivityMemoryRecord = {
        id: `act_mem_${actId}_${Date.now()}`,
        activityId: actId,
        activityTitle: `${payload.icon} ${payload.title}`,
        stageLevel: prev.level,
        stageTitle: stageInfo.indonesianTitle,
        date: todayStr,
        summary: payload.speech,
        scoreOrResult: 'Selesai di Lingkungan Utama ✨',
      };

      const nextState: GameSaveState = {
        ...prev,
        isSleeping: payload.actionState === 'sleeping' ? true : prev.isSleeping,
        coins: prev.coins + payload.coinsGain,
        lastPlayTimestamp: Date.now(),
        lastActivity: `inworld_${payload.type}_${payload.subAction}`,
        activityHistory: [
          {
            id: `act_hist_${Date.now()}`,
            locationId: prev.currentRoom,
            activityType: payload.type,
            title: payload.title,
            timestamp: Date.now(),
          },
          ...(prev.activityHistory || []),
        ].slice(0, 50),
        needs: {
          ...prev.needs,
          happiness: Math.min(100, prev.needs.happiness + payload.happinessGain),
          love: Math.min(100, prev.needs.love + 14),
          energy: Math.max(15, prev.needs.energy - 2),
        },
        dailyMissions: incrementMission(prev.dailyMissions, 'play', 1),
        characterLifeData: {
          ...prev.characterLifeData,
          completedActivities: nextCompleted,
          recentlyPlayedActivities: nextRecent,
          activityMemories: [
            newActMemory,
            ...prev.characterLifeData.activityMemories,
          ].slice(0, 40),
        },
      };

      return applyXpAndCheckLevel(nextState, payload.xpGain, 0);
    });
  };

  // 4. PLAY, TOYS & AGE-SPECIFIC STAGE ACTIVITIES (SEAMLESS IN-WORLD)
  const handlePlayAction = (
    mode:
      | 'peekaboo'
      | 'tickle'
      | 'music'
      | 'ball'
      | 'toy'
      | 'crawling'
      | 'walking'
      | 'reading'
      | 'dancing'
      | 'studying'
      | 'cooking',
    toyItem?: StoreItem
  ) => {
    setCareTray(null);
    if (mode === 'peekaboo') {
      handleStartInWorldActivity('cilukba', 'var_1', 'Cilukba Ceria', '🙈');
      return;
    }
    if (mode === 'ball') {
      const targetRoom =
        gameState.currentRoom === 'kitchen' || gameState.currentRoom === 'bathroom'
          ? 'playroom'
          : gameState.currentRoom;
      handleStartInWorldActivity('ball', 'kick_ball', 'Bermain Bola Interaktif', '⚽', undefined, targetRoom);
      return;
    }
    if (mode === 'reading') {
      const targetRoom =
        gameState.currentRoom === 'bedroom' || gameState.currentRoom === 'playroom'
          ? gameState.currentRoom
          : 'playroom';
      handleStartInWorldActivity('bookshelf', 'pick_book_1', 'Membaca Buku Cerita', '📖', undefined, targetRoom);
      return;
    }
    if (mode === 'cooking') {
      handleStartInWorldActivity('kitchen', 'recipe_porridge', 'Memasak di Dapur', '🍳', undefined, 'kitchen');
      return;
    }

    sound.playBabyLaugh();
    const isPlayful = gameState.personality === 'playful';
    const isMusicLover = gameState.personality === 'music_lover';
    const bonusMult =
      (isPlayful && mode !== 'music') || (isMusicLover && (mode === 'music' || mode === 'dancing'))
        ? 1.25
        : 1.0;

    let label = `Hahaha! ${gameState.babyName} senang sekali bermain bersama! 🎉`;
    let baseHappy = 22;
    let baseLove = 10;
    let baseXp = 16;
    let emoji = '🎈';
    let targetAction: BabyActionState = 'playing';
    let hygieneCost = 3;

    if (mode === 'tickle') {
      label = `Hihihi geli! ${gameState.babyName} tertawa digelitik! 😆💕`;
      baseHappy = 24;
      baseLove = 14;
      emoji = '😆';
      targetAction = 'laughing';
    } else if (mode === 'music') {
      label = `La la la~ ${gameState.babyName} bertepuk tangan mengikuti irama musik! 🎵🎶`;
      baseHappy = 26;
      baseLove = 14;
      emoji = '🎵';
      targetAction = 'dancing';
    } else if (mode === 'crawling') {
      label = `Lihat! ${gameState.babyName} merangkak aktif mengejar mainan di karpet! 🚼✨`;
      baseHappy = 25;
      baseXp = 18;
      emoji = '🚼';
      targetAction = 'crawling';
      hygieneCost = 6;
    } else if (mode === 'walking') {
      label = `Tap tap! ${gameState.babyName} belajar melangkah dan melompat kecil! 👣🌟`;
      baseHappy = 26;
      baseXp = 19;
      emoji = '👣';
      targetAction = 'walking';
      hygieneCost = 6;
    } else if (mode === 'dancing') {
      label = `Asyik! ${gameState.babyName} menari ceria mengikuti irama lagu! 💃🎶`;
      baseHappy = 28;
      baseXp = 20;
      emoji = '🎶';
      targetAction = 'dancing';
      hygieneCost = 6;
    } else if (mode === 'studying') {
      label = `${gameState.babyName} belajar interaktif menggunakan tablet edukasi! 💻🚀`;
      baseHappy = 26;
      baseXp = 25;
      emoji = '💻';
      targetAction = 'studying';
      hygieneCost = 2;
    } else if (mode === 'toy' && toyItem) {
      label = `Asyik! ${gameState.babyName} suka bermain ${toyItem.name}! ${toyItem.iconEmoji}`;
      baseHappy = toyItem.happinessRestore || 25;
      baseLove = toyItem.loveRestore || 12;
      baseXp = toyItem.xpGain || 18;
      emoji = toyItem.iconEmoji;
    }

    triggerTemporaryAction(targetAction, label, 3000);
    spawnParticles(emoji, 6);

    setGameState((prev) => {
      const nextHygiene = Math.max(20, prev.needs.hygiene - hygieneCost);
      const nextState: GameSaveState = {
        ...prev,
        isSleeping: false,
        lastActivity: `play_${mode}`,
        lastPlayTimestamp: Date.now(),
        needs: {
          ...prev.needs,
          happiness: Math.min(100, prev.needs.happiness + Math.round(baseHappy * bonusMult)),
          love: Math.min(100, prev.needs.love + baseLove),
          energy: Math.max(10, prev.needs.energy - 3),
          hygiene: nextHygiene,
        },
        dailyMissions: incrementMission(prev.dailyMissions, 'play', 1),
      };
      return applyXpAndCheckLevel(nextState, baseXp, 0);
    });
  };

  // 5. LOVE & AFFECTION
  const handleLoveAction = (mode: 'cuddle' | 'pat_head' | 'talk' | 'bedtime_story') => {
    sound.playBabyBabble();
    const isCheerful = gameState.personality === 'cheerful';
    const mult = isCheerful ? 1.25 : 1.0;

    const labels = {
      cuddle: `Pelukan hangat membuat ${gameState.babyName} merasa sangat disayang! 🤗💖`,
      pat_head: `${gameState.babyName} tersenyum saat kepalanya diusap lembut! 🥰`,
      talk: `Aku senang mengobrol dengan Kak ${gameState.playerName}! 💬💕`,
      bedtime_story: `${gameState.babyName} mendengarkan cerita dongeng dengan tenang! 📖✨`,
    };

    triggerTemporaryAction('loved', labels[mode]);
    spawnParticles('💖', 6);

    setGameState((prev) => {
      const nextState: GameSaveState = {
        ...prev,
        lastActivity: `love_${mode}`,
        lastPlayTimestamp: Date.now(),
        needs: {
          ...prev.needs,
          love: Math.min(100, prev.needs.love + Math.round(24 * mult)),
          happiness: Math.min(100, prev.needs.happiness + 14),
          health: Math.min(100, prev.needs.health + 4),
        },
        dailyMissions: incrementMission(prev.dailyMissions, 'love_baby', 1),
      };
      return applyXpAndCheckLevel(nextState, 14, 0);
    });
  };

  // ==================== MATH CHALLENGE HANDLERS ====================
  const handleMathCorrect = (coinsEarned: number, xpEarned: number, grade: number) => {
    setSpeechBubble(`${gameState.babyName} mendapatkan Rp ${coinsEarned} koin! 🪙`);
    setTimeout(() => setSpeechBubble(null), 2600);

    setGameState((prev) => {
      const newStreak = prev.mathStats.currentStreak + 1;
      const bestStreak = Math.max(prev.mathStats.bestStreak, newStreak);
      const nextSolvedByGrade = {
        ...prev.mathStats.solvedByGrade,
        [grade]: (prev.mathStats.solvedByGrade[grade] || 0) + 1,
      };

      let missions = incrementMission(prev.dailyMissions, 'math_solve', 1);
      if (newStreak >= 3) {
        missions = missions.map((m) =>
          m.type === 'math_streak'
            ? { ...m, progress: Math.max(m.progress, Math.min(m.target, newStreak)) }
            : m
        );
      }

      const nextState: GameSaveState = {
        ...prev,
        coins: prev.coins + coinsEarned,
        dailyMissions: missions,
        lastActivity: `math_grade_${grade}`,
        mathStats: {
          totalSolved: prev.mathStats.totalSolved + 1,
          totalCorrect: prev.mathStats.totalCorrect + 1,
          currentStreak: newStreak,
          bestStreak,
          solvedByGrade: nextSolvedByGrade,
        },
      };
      return applyXpAndCheckLevel(nextState, 0, xpEarned);
    });
  };

  const handleMathWrong = () => {
    setGameState((prev) => ({
      ...prev,
      mathStats: {
        ...prev.mathStats,
        totalSolved: prev.mathStats.totalSolved + 1,
        currentStreak: 0,
      },
    }));
  };

  const handleGrantSurpriseItem = (item: StoreItem | null, bonusCoins: number) => {
    setGameState((prev) => {
      const nextClothes =
        item && item.category === 'clothes' && !prev.ownedClothes.includes(item.id)
          ? [...prev.ownedClothes, item.id]
          : prev.ownedClothes;
      const nextToys =
        item && item.category === 'toys' && !prev.ownedToys.includes(item.id)
          ? [...prev.ownedToys, item.id]
          : prev.ownedToys;
      const nextFurniture =
        item && item.category === 'furniture' && !prev.ownedFurniture.includes(item.id)
          ? [...prev.ownedFurniture, item.id]
          : prev.ownedFurniture;

      const memories = [...prev.memories];
      if (item) {
        memories.unshift({
          id: `mem_surprise_${Date.now()}`,
          title: `Hadiah Kejutan Matematika: ${item.name}!`,
          description: `${prev.babyName} mendapatkan ${item.name} dari Peti Kejutan Matematika.`,
          date: getTodayDateString(),
          babyLevel: prev.level,
          outfitId: prev.appearance.equippedOutfit,
          badgeType: 'rare_item',
        });
      }

      return {
        ...prev,
        coins: prev.coins + bonusCoins,
        ownedClothes: nextClothes,
        ownedToys: nextToys,
        ownedFurniture: nextFurniture,
        memories,
      };
    });
  };

  // ==================== SHOP & INVENTORY HANDLERS ====================
  const handleBuyItem = (item: StoreItem | NusantaraFoodItem | NusantaraClothingItem) => {
    if (item.category === 'food') {
      const check = validateFoodPhaseAccess(item.id, gameState.level);
      if (!check.allowed) {
        sound.playWrong();
        return;
      }
    }

    setGameState((prev) => {
      if (prev.coins < item.price) return prev;

      const nextCoins = prev.coins - item.price;
      let nextClothes = prev.ownedClothes;
      let nextToys = prev.ownedToys;
      let nextFurniture = prev.ownedFurniture;
      let nextFood = prev.foodInventory;
      const nextMemories = [...prev.memories];

      if (item.category === 'clothes' && !prev.ownedClothes.includes(item.id)) {
        nextClothes = [...prev.ownedClothes, item.id];
        nextMemories.unshift({
          id: `mem_cloth_${item.id}_${Date.now()}`,
          title: `Pakaian Baru: ${item.name}`,
          description: `Membeli ${item.name} untuk dikenakan oleh ${prev.babyName}.`,
          date: getTodayDateString(),
          babyLevel: prev.level,
          outfitId: item.subCategory === 'outfit' ? item.id : prev.appearance.equippedOutfit,
          badgeType: 'costume',
        });
      } else if (item.category === 'toys' && !prev.ownedToys.includes(item.id)) {
        nextToys = [...prev.ownedToys, item.id];
      } else if (item.category === 'furniture' && !prev.ownedFurniture.includes(item.id)) {
        nextFurniture = [...prev.ownedFurniture, item.id];
      } else if (item.category === 'food') {
        nextFood = {
          ...prev.foodInventory,
          [item.id]: (prev.foodInventory[item.id] || 0) + 1,
        };
      }

      const nextState: GameSaveState = {
        ...prev,
        coins: nextCoins,
        ownedClothes: nextClothes,
        ownedToys: nextToys,
        ownedFurniture: nextFurniture,
        foodInventory: nextFood,
        memories: nextMemories,
        dailyMissions: incrementMission(prev.dailyMissions, 'buy_item', 1),
      };
      return applyXpAndCheckLevel(nextState, 10, 0);
    });
  };

  const handleEquipClothing = (item: StoreItem) => {
    setGameState((prev) => {
      const nextApp = { ...prev.appearance };
      if (item.subCategory === 'outfit') nextApp.equippedOutfit = item.id;
      if (item.subCategory === 'hat') nextApp.equippedHat = item.id;
      if (item.subCategory === 'glasses') nextApp.equippedGlasses = item.id;
      if (item.subCategory === 'shoes') nextApp.equippedShoes = item.id;
      return { ...prev, appearance: nextApp };
    });
  };

  const handleUnequipAccessory = (slot: 'hat' | 'glasses' | 'shoes') => {
    sound.playClick();
    setGameState((prev) => {
      const nextApp = { ...prev.appearance };
      if (slot === 'hat') nextApp.equippedHat = null;
      if (slot === 'glasses') nextApp.equippedGlasses = null;
      if (slot === 'shoes') nextApp.equippedShoes = null;
      return { ...prev, appearance: nextApp };
    });
  };

  const handleEquipFurniture = (item: StoreItem) => {
    setGameState((prev) => {
      const nextDecor = { ...prev.roomDecor };
      if (item.subCategory === 'crib') nextDecor.crib = item.id;
      if (item.subCategory === 'rug') nextDecor.rug = item.id;
      if (item.subCategory === 'lamp') nextDecor.lamp = item.id;
      if (item.subCategory === 'wallpaper') nextDecor.wallpaper = item.id;
      if (item.subCategory === 'wallDecor') nextDecor.wallDecor = item.id;
      if (item.subCategory === 'plushDecor') nextDecor.plushDecor = item.id;
      return { ...prev, roomDecor: nextDecor, currentRoom: 'bedroom' };
    });
  };

  // ==================== MISSIONS & LOGIN REWARD ====================
  const handleClaimMission = (missionId: string) => {
    setGameState((prev) => {
      const target = prev.dailyMissions.find((m) => m.id === missionId);
      if (!target || target.claimed || target.progress < target.target) return prev;

      const updatedMissions = prev.dailyMissions.map((m) =>
        m.id === missionId ? { ...m, claimed: true } : m
      );
      const nextState: GameSaveState = {
        ...prev,
        coins: prev.coins + target.rewardCoins,
        dailyMissions: updatedMissions,
      };
      return applyXpAndCheckLevel(nextState, target.rewardXp, 0);
    });
  };

  const handleClaimLoginReward = () => {
    if (gameState.claimedLoginToday) return;
    const dayIndex = (gameState.loginStreak - 1) % 7;
    const reward = LOGIN_REWARDS[dayIndex] || LOGIN_REWARDS[0];
    setSpeechBubble(`${gameState.babyName} mendapatkan ${reward.coins} coin! 🪙`);
    setTimeout(() => setSpeechBubble(null), 2600);
    setGameState((prev) => ({
      ...prev,
      coins: prev.coins + reward.coins,
      claimedLoginToday: true,
    }));
    spawnParticles('🪙', 6);
  };

  // ==================== DERIVED DISPLAY VALUES ====================
  const currentStage = getGrowthStage(gameState.level);
  const currentLifePhase = getLifePhaseFromLevel(gameState.level);
  const currentPhaseLabel = getLifePhaseLabel(currentLifePhase);
  const realTimeGrowthSnapshot = calculateRealTimeGrowthSnapshot(
    gameState.characterLifeData.characterCreatedAt ||
      gameState.characterLifeData.createdAt ||
      Date.now(),
    Date.now(),
    growthConfig
  );
  const personalityInfo =
    PERSONALITIES.find((p) => p.id === gameState.personality) || PERSONALITIES[0];

  const activeEmotion = deriveCharacterEmotion(gameState);

  const emotionBadgeMeta: Record<
    CharacterEmotion,
    { label: string; emoji: string; bgClass: string }
  > = {
    happy: { label: 'Senang', emoji: '😊', bgClass: 'bg-emerald-100 text-emerald-900 border-emerald-500' },
    fresh: { label: 'Segar', emoji: '✨', bgClass: 'bg-sky-100 text-sky-900 border-sky-500' },
    bored: { label: 'Bosan (Ingin Main)', emoji: '🧸', bgClass: 'bg-amber-100 text-amber-900 border-amber-500' },
    sleepy: { label: 'Mengantuk', emoji: '🥱', bgClass: 'bg-indigo-100 text-indigo-900 border-indigo-500' },
    sad: { label: 'Sedih', emoji: '🥺', bgClass: 'bg-rose-100 text-rose-900 border-rose-500' },
  };
  const currentEmotionBadge = emotionBadgeMeta[activeEmotion];

  const totalRegionalPoints = (Object.values(gameState.regionScores) as number[]).reduce(
    (acc, val) => acc + val,
    0
  );

  const needsSummary = {
    isHungry: gameState.needs.hunger < 45,
    isSleepy: gameState.needs.energy < 40,
    isDirty: gameState.needs.hygiene < 55,
    isSad: gameState.needs.happiness < 45 || gameState.needs.love < 45,
  };

  const personalizedStatusAlert = needsSummary.isHungry
    ? `${gameState.babyName} sedang lapar.`
    : activeEmotion === 'bored'
    ? `${gameState.babyName} merasa bosan & ingin bermain.`
    : needsSummary.isDirty
    ? `${gameState.babyName} kurang nyaman & ingin mandi.`
    : needsSummary.isSleepy
    ? `${gameState.babyName} mulai mengantuk.`
    : null;

  const unclaimedMissionsCount =
    gameState.dailyMissions.filter((m) => m.progress >= m.target && !m.claimed).length +
    (!gameState.claimedLoginToday ? 1 : 0);

  if (showTitleScreen) {
    return (
      <TitleAndSetupModal
        hasSavedGame={gameState.initialized}
        savedBabyName={gameState.babyName}
        savedLevel={gameState.level}
        onContinueGame={() => {
          setShowTitleScreen(false);
          triggerTemporaryAction('waving', `Selamat datang, ${gameState.babyName}! 💕`);
        }}
        onStartNewGame={handleStartNewGame}
      />
    );
  }

  return (
    <div className="relative w-screen h-[100dvh] min-h-[100dvh] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] overflow-hidden bg-[#FFFDF9] select-none flex flex-col">
      {/* ==================== LEVEL UP FLOATING TOAST ==================== */}
      {levelUpBanner && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[120] px-5 py-2.5 rounded-2xl bg-amber-300 border-3 border-[#2D2520] shadow-[0_6px_0_#2D2520] font-display text-xs sm:text-base font-bold text-[#2D2520] animate-bounce">
          {levelUpBanner}
        </div>
      )}

      {/* ==================== BARIS 1: HUD ATAS RINGKAS (z-[60], tinggi otomatis) ==================== */}
      <header className="relative z-[60] w-full px-2 sm:px-3 pt-1 pb-1 flex flex-col gap-1 shrink-0 bg-[#FFFDF9] border-b-2 border-[#2D2520]">
        {/* SUB-BARIS 1A: Nama Karakter + Koin + Tombol Suara */}
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          {/* Left: Home + Compact Identity & Age Stage */}
          <div className="flex items-center gap-1 bg-[#FFFDF9] border-2 border-[#2D2520] rounded-xl px-1.5 py-0.5 shadow-[0_2px_0_#2D2520] shrink-0">
            <button
              onClick={() => {
                sound.playClick();
                setShowTitleScreen(true);
              }}
              className="w-7 h-7 rounded-lg bg-amber-100 border border-[#2D2520] flex items-center justify-center hover:bg-amber-200 shrink-0"
              title="Layar Utama"
            >
              <Home className="w-3.5 h-3.5 text-[#2D2520]" />
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setCareTray(null);
                setActiveModal('profile');
              }}
              className="text-left group hover:bg-amber-50/80 px-1 py-0.5 rounded-lg transition-colors shrink-0"
              title="Profil & Status Pertumbuhan Waktu Nyata"
            >
              <div className="flex items-center gap-1">
                <span className="font-display text-xs sm:text-sm font-bold text-[#2D2520] group-hover:text-pink-600 truncate max-w-[6.5rem] sm:max-w-[10rem]">
                  {gameState.babyName}
                </span>
                <span className="px-1.5 py-0.2 rounded bg-amber-200 border border-[#2D2520] font-display text-[9px] font-bold text-[#2D2520] whitespace-nowrap">
                  S{gameState.level}/7
                </span>
                <span
                  className={`px-1 py-0.2 rounded border text-[9px] font-bold flex items-center gap-0.5 ${currentEmotionBadge.bgClass}`}
                  title={currentEmotionBadge.label}
                >
                  <span>{currentEmotionBadge.emoji}</span>
                </span>
              </div>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                setCareTray(null);
                setActiveModal('growing_up');
              }}
              className="flex px-1.5 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 border border-[#2D2520] font-display text-[9px] font-bold text-[#2D2520] items-center gap-0.5 cursor-pointer shrink-0"
              title="Pertumbuhan 246 Hari & Album Kenangan"
            >
              <Calendar className="w-2.5 h-2.5 text-rose-600" />
              <span>{realTimeGrowthSnapshot.totalElapsedDays}h</span>
            </button>

            {gameState.characterLifeData.illnessState !== 'healthy' && (
              <button
                onClick={() => {
                  sound.playClick();
                  setCareTray(null);
                  setActiveModal('healthcare');
                }}
                className="px-1.5 py-0.5 rounded-lg bg-rose-500 text-white border border-[#2D2520] font-display text-[9px] font-bold flex items-center gap-0.5 animate-pulse cursor-pointer shrink-0"
                title="Pusat Kesehatan & RS Virtual"
              >
                <HeartPulse className="w-3 h-3" />
                <span>Rawat!</span>
              </button>
            )}
          </div>

          {/* Right: Koin + Tombol Suara */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                sound.playClick();
                setCareTray(null);
                setActiveModal('math');
              }}
              className="px-2 py-1 rounded-xl bg-[#FEF3C7] hover:bg-amber-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center gap-1"
              title="Klik untuk mencari Koin di Math Challenge!"
            >
              <span className="text-xs sm:text-sm">🪙</span>
              <span className="font-mono-num text-xs font-bold text-[#2D2520] whitespace-nowrap">
                Rp {gameState.coins}
              </span>
            </button>

            <button
              onClick={() => {
                const nextMuted = !gameState.audioSettings.muted;
                setGameState((p) => ({
                  ...p,
                  audioSettings: { ...p.audioSettings, muted: nextMuted },
                }));
              }}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#FFFDF9] border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center justify-center hover:bg-stone-100"
              aria-label="Tombol Suara"
            >
              {gameState.audioSettings.muted ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-600" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#2D2520]" />
              )}
            </button>
          </div>
        </div>

        {/* SUB-BARIS 1B (G.1 & G.2): Tab Lokasi Satu Baris Khusus Geser Horizontal + Auto-Scroll ke Tengah + Indikator Fade */}
        <div className="relative w-full bg-[#FFFDF9] border-2 border-[#2D2520] rounded-xl px-1.5 py-0.5 shadow-[0_2px_0_#2D2520] overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-[#FFFDF9] to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-[#FFFDF9] to-transparent z-10" />
          <div className="w-full flex items-center gap-1 overflow-x-auto snap-x snap-mandatory no-scrollbar">
            {(
              [
                { id: 'bedroom', label: 'Kamar', bg: '#FDE68A' },
                { id: 'kitchen', label: 'Dapur', bg: '#FED7AA' },
                { id: 'bathroom', label: 'Mandi', bg: '#BAE6FD' },
                { id: 'livingroom', label: 'Keluarga', bg: '#FBCFE8' },
                { id: 'playroom', label: 'Main', bg: '#A7F3D0' },
                { id: 'backyard_garden', label: '🌻 Kebun', bg: '#86EFAC' },
                { id: 'flower_garden', label: '🌷 Bunga', bg: '#F9A8D4' },
                { id: 'vegetable_garden', label: '🥕 Sayur', bg: '#BEF264' },
                { id: 'front_yard', label: '🏡 Halaman', bg: '#A7F3D0' },
                { id: 'park', label: '🧺 Taman', bg: '#6EE7B7' },
                { id: 'playground', label: '🛝 Wahana', bg: '#FDE047' },
                { id: 'beach', label: '🏖️ Pantai', bg: '#7DD3FC' },
                { id: 'cultural_village', label: '🏛️ Budaya', bg: '#FDBA74' },
              ] as const
            ).map((rm) => (
              <button
                key={rm.id}
                ref={(el) => {
                  locationTabRefs.current[rm.id] = el;
                }}
                onClick={() => handleChangeWorldLocation(rm.id)}
                className={`snap-center px-2 py-0.5 rounded-lg font-display text-[10px] sm:text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
                  gameState.currentRoom === rm.id
                    ? 'bg-[#FF8FAB] text-[#2D2520] border border-[#2D2520] shadow-[0_1px_0_#2D2520]'
                    : 'text-[#6E6259] hover:text-[#2D2520] hover:bg-stone-100'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full border border-[#2D2520] shrink-0"
                  style={{ backgroundColor: rm.bg }}
                />
                <span>{rm.label}</span>
              </button>
            ))}

            <button
              onClick={() => {
                sound.playClick();
                setShowWorldMapDrawer((v) => !v);
              }}
              className={`snap-center px-2 py-0.5 rounded-lg font-display text-[10px] sm:text-[11px] font-bold border border-[#2D2520] transition-all flex items-center gap-0.5 whitespace-nowrap shrink-0 ${
                showWorldMapDrawer
                  ? 'bg-emerald-400 text-[#2D2520]'
                  : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950'
              }`}
              title="Peta Dunia Virtual (13 Lokasi)"
            >
              <span>🗺️</span>
              <span>Peta 13 Lokasi</span>
            </button>
          </div>
        </div>

        {/* SUB-BARIS 1C (G.3): 6 Bar Status Ringkas (Lapar, Energi, Bersih, Senang, Sehat, Kasih) Ikon + Angka % + Bar Tipis */}
        <div className="grid grid-cols-6 gap-1 sm:gap-2 bg-[#FFFDF9] border-2 border-[#2D2520] rounded-xl px-2 py-0.5 shadow-[0_2px_0_#2D2520]">
          {[
            { key: 'hunger', label: 'Lapar', val: gameState.needs.hunger, icon: '🍼', color: '#F59E0B' },
            { key: 'energy', label: 'Energi', val: gameState.needs.energy, icon: '🌙', color: '#8B5CF6' },
            { key: 'hygiene', label: 'Bersih', val: gameState.needs.hygiene, icon: '🛁', color: '#38BDF8' },
            { key: 'happiness', label: 'Senang', val: gameState.needs.happiness, icon: '😊', color: '#34D399' },
            { key: 'health', label: 'Sehat', val: gameState.needs.health, icon: '💚', color: '#10B981' },
            { key: 'love', label: 'Kasih', val: gameState.needs.love, icon: '💖', color: '#FF8FAB' },
          ].map((n) => (
            <div key={n.key} className="flex flex-col gap-0.5 px-0.5" title={`${n.label}: ${n.val}%`}>
              <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-[#2D2520] leading-none">
                <span className="flex items-center gap-0.5 truncate">
                  <span>{n.icon}</span>
                  <span className="hidden sm:inline truncate">{n.label}</span>
                </span>
                <span
                  className={`font-mono-num ${
                    n.val < 40 ? 'text-rose-600 font-extrabold' : 'text-[#6E6259]'
                  }`}
                >
                  {n.val}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-stone-200 border border-[#2D2520] overflow-hidden">
                <div
                  style={{
                    width: `${n.val}%`,
                    backgroundColor: n.val < 35 ? '#EF4444' : n.color,
                  }}
                  className="h-full transition-all duration-300"
                />
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ==================== BARIS 2: AREA ADEGAN (flex-1 min-h-0, Tanpa Ruang Kosong Beige) ==================== */}
      <main className="relative flex-1 w-full min-h-0 flex items-stretch justify-center overflow-hidden">
        {/* Satu-satunya Tempat Ruangan Digambar (Stage 390x620 Terskala Utuh) */}
        <div className="relative flex-1 w-full h-full min-w-0 min-h-0 flex items-center justify-center overflow-hidden">
          <BabyStage25D
            currentRoom={gameState.currentRoom}
            roomDecor={gameState.roomDecor}
            appearance={gameState.appearance}
            gender={gameState.gender}
            level={gameState.level}
            characterScale={
              gameState.characterLifeData.characterScale ?? getCharacterScaleForStage(gameState.level)
            }
            growthTransition={gameState.characterLifeData.characterGrowthTransition}
            actionState={
              gameState.characterLifeData.illnessState !== 'healthy' && actionState === 'idle'
                ? 'sick'
                : actionState
            }
            isSleeping={gameState.isSleeping}
            needsSummary={needsSummary}
            emotion={activeEmotion}
            cleanliness={gameState.needs.hygiene}
            bathingProgress={gameState.bathingProgress}
            particles={particles}
            speechBubble={speechBubble || personalizedStatusAlert}
            onClickBaby={() => handleLoveAction('pat_head')}
            onToggleLamp={handleToggleSleep}
            onPutBabyToSleepInCrib={handlePutBabyToSleepInCrib}
            onWakeBabyFromCrib={handleWakeBabyFromCrib}
            onQuickFeedMilk={() => {
              const milkItem = STORE_ITEMS.find((i) => i.id === 'food_milk');
              if (milkItem) handleFeedItem(milkItem);
            }}
            onQuickFeedPorridge={() => {
              const porridgeItem = STORE_ITEMS.find((i) => i.id === 'food_porridge');
              if (porridgeItem) handleFeedItem(porridgeItem);
            }}
            onQuickBathAction={(mode) => handleHygieneAction(mode)}
            onTowelDryBaby={handleTowelDryBaby}
            onUseToilet={handleUseToilet}
            onApplySoapToZone={handleApplySoapToZone}
            onRinseZoneWithShower={handleRinseZoneWithShower}
            externalActivityCommand={inWorldActivityCommand}
            onInWorldActivityComplete={handleCompleteInWorldActivity}
            onInWorldCharacterReaction={(nextActState, speechText, emoji) => {
              triggerTemporaryAction(nextActState, speechText, 2400);
              if (emoji) spawnParticles(emoji, 5);
            }}
            plants={gameState.plants}
            harvestInventory={gameState.harvestInventory}
            cookingInventory={gameState.cookingInventory}
            foodState={gameState.foodState}
            onUpdatePlants={handleUpdatePlants}
            onHarvestPlant={handleHarvestPlant}
            onUpdateFoodState={handleUpdateFoodState}
            onConsumeCookedRecipe={handleConsumeCookedRecipe}
            onCleanDirtyDish={handleCleanDirtyDish}
            onBeachPicnicBite={handleBeachPicnicBite}
            onCollectBeachShell={handleCollectBeachShell}
            onRequestLocationChange={handleChangeWorldLocation}
            isAnyPanelOpen={isExternalPanelOpen}
            onStageModalOpenChange={setStageModalOpen}
          />

          {/* Floating Child-Friendly Illness Alert Banner when character needs care */}
          {gameState.characterLifeData.illnessState !== 'healthy' && !isAnyPanelOpen && (
            <div className="absolute top-2.5 right-2.5 z-[40]">
              <button
                onClick={() => {
                  sound.playClick();
                  setActiveModal('healthcare');
                }}
                className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 text-white font-display text-[11px] font-bold border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] flex items-center gap-1.5 animate-bounce cursor-pointer"
              >
                <HeartPulse className="w-4 h-4 shrink-0" />
                <span>
                  {gameState.characterLifeData.illnessState === 'severe'
                    ? 'Panggil Ambulans!'
                    : 'Rawat / Dokter'}
                </span>
              </button>
            </div>
          )}

          {/* ==================== A.6: TOMBOL IKON MIKROFON BULAT 48x48 PX DI POJOK KIRI ATAS AREA ADEGAN ==================== */}
          <div className="absolute top-2.5 left-2.5 z-[40]">
            <VoiceInteractionPanel
              babyName={gameState.babyName}
              characterLevel={gameState.level}
              voiceFeatureEnabled={voiceFeatureEnabled}
              characterTtsEnabled={characterTtsEnabled && !gameState.audioSettings.muted}
              onToggleVoiceFeature={setVoiceFeatureEnabled}
              onToggleCharacterTts={setCharacterTtsEnabled}
              onTriggerVoiceReaction={(reaction) => handleTriggerVoiceReaction(reaction)}
              onOpenChange={setVoicePanelOpen}
            />
          </div>
        </div>

        {/* ==================== PANEL SAMPING KANAN KHUSUS TABLET/DESKTOP LANDSCAPE ==================== */}
        <aside className="hidden lg:flex flex-col gap-1.5 max-h-full overflow-y-auto py-2 px-1.5 shrink-0 bg-[#FFFDF9] border-l-2 border-[#2D2520]">
          <button
            onClick={() => {
              sound.playClick();
              setCareTray(careTray === 'play' ? null : 'play');
            }}
            className="group px-2.5 py-1.5 rounded-xl bg-gradient-to-b from-pink-300 to-rose-300 hover:from-pink-400 hover:to-rose-400 text-[#2D2520] border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex flex-col items-center justify-center gap-0.5 cursor-pointer shrink-0"
          >
            <Gamepad2 className="w-4 h-4 text-[#2D2520]" />
            <span className="font-display text-[9px] font-bold leading-tight text-center">
              LET&apos;S PLAY!
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setCareTray(null);
              setActiveModal('math');
            }}
            className="group px-2.5 py-1.5 rounded-xl bg-[#FBBF24] hover:bg-amber-300 text-[#2D2520] border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex flex-col items-center justify-center gap-0.5 shrink-0"
          >
            <Calculator className="w-4 h-4 text-[#2D2520]" />
            <span className="font-display text-[9px] font-bold leading-tight text-center">
              MATH KOIN
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setCareTray(null);
              setActiveModal('growing_up');
            }}
            className="p-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-[#2D2520] border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex flex-col items-center gap-0.5 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span className="font-display text-[9px] font-bold text-center leading-tight">
              246 Hari
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setCareTray(null);
              setActiveModal('healthcare');
            }}
            className={`p-1.5 rounded-xl border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex flex-col items-center gap-0.5 cursor-pointer shrink-0 ${
              gameState.characterLifeData.illnessState === 'healthy'
                ? 'bg-sky-100 hover:bg-sky-200 text-[#2D2520]'
                : 'bg-rose-500 text-white animate-pulse'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span className="font-display text-[9px] font-bold text-center leading-tight">
              RS Virtual
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setCareTray(null);
              setActiveModal('nusantara');
            }}
            className="p-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-[#2D2520] border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex flex-col items-center gap-0.5 shrink-0"
          >
            <Compass className="w-4 h-4 text-emerald-700" />
            <span className="font-display text-[9px] font-bold text-center leading-tight">
              Nusantara
            </span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setCareTray(null);
              setActiveModal('shop');
            }}
            className="p-1.5 rounded-xl bg-[#FFFDF9] hover:bg-pink-100 text-[#2D2520] border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex flex-col items-center gap-0.5 shrink-0"
          >
            <ShoppingBag className="w-4 h-4 text-pink-600" />
            <span className="font-display text-[9px] font-bold">Toko</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setCareTray(null);
              setActiveModal('wardrobe');
            }}
            className="p-1.5 rounded-xl bg-[#FFFDF9] hover:bg-purple-100 text-[#2D2520] border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex flex-col items-center gap-0.5 shrink-0"
          >
            <Shirt className="w-4 h-4 text-purple-600" />
            <span className="font-display text-[9px] font-bold">Pakaian</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setCareTray(null);
              setActiveModal('missions');
            }}
            className="relative p-1.5 rounded-xl bg-[#FFFDF9] hover:bg-sky-100 text-[#2D2520] border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex flex-col items-center gap-0.5 shrink-0"
          >
            <Calendar className="w-4 h-4 text-sky-600" />
            <span className="font-display text-[9px] font-bold">Misi</span>
            {unclaimedMissionsCount > 0 && (
              <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono-num text-[9px] font-bold flex items-center justify-center border border-[#2D2520]">
                {unclaimedMissionsCount}
              </span>
            )}
          </button>
        </aside>
      </main>

      {/* ==================== F.4: PANEL INSTRUKSI MANDI & 6 BAGIAN TUBUH (GRID 3 KOLOM x 2 BARIS DI BAWAH AREA ADEGAN) ==================== */}
      {gameState.currentRoom === 'bathroom' && !isAnyPanelOpen && (
        <section className="relative z-[60] w-full max-h-[26dvh] shrink-0 bg-[#FFFDF9] border-t-2 border-[#2D2520] px-2.5 py-1.5">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="font-display text-[11px] sm:text-xs font-bold text-[#2D2520] truncate">
                🛁 Mandi: Gosok sabun 🧼 atau ketuk bagian tubuh, lalu bilas shower 🚿
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-sky-100 border border-[#2D2520] font-mono-num text-[10px] font-bold text-sky-900 shrink-0">
                Bersih {gameState.needs.hygiene}%
              </span>
            </div>
            {/* Grid 3 Kolom x 2 Baris (Tidak Terpotong & Tidak Menimpa Bak Mandi) */}
            <div className="grid grid-cols-3 gap-1.5">
              {BODY_ZONES_META.map((z) => {
                const st = gameState.bathingProgress[z.id];
                const isClean = st.cleaned;
                const isSoaped = st.foam >= 100 && !isClean;
                return (
                  <button
                    key={z.id}
                    onClick={() => {
                      if (!isSoaped && !isClean) {
                        handleApplySoapToZone(z.id);
                      } else if (isSoaped) {
                        handleRinseZoneWithShower(z.id);
                      } else {
                        handleApplySoapToZone(z.id);
                      }
                    }}
                    className={`px-2 py-1 rounded-xl border text-[10px] sm:text-[11px] font-bold flex items-center justify-between gap-1 transition-all ${
                      isClean
                        ? 'bg-emerald-100 border-emerald-700 text-emerald-950'
                        : isSoaped
                        ? 'bg-sky-100 border-sky-700 text-sky-950'
                        : 'bg-amber-50 hover:bg-amber-100 border-[#2D2520] text-[#2D2520]'
                    }`}
                  >
                    <span className="truncate">{z.shortLabel}</span>
                    <span className="shrink-0 text-xs">
                      {isClean ? '✨' : isSoaped ? '🫧' : `${Math.round(st.foam)}%`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ==================== C.2: SPACER OTOMATIS SAAT PANEL TERBUKA AGAR AREA ADEGAN MENYUSUT & BAYI TETAP UTUH DI ATAS PANEL ==================== */}
      {isAnyPanelOpen && (
        <div className="w-full h-[44dvh] shrink-0 transition-all duration-200 pointer-events-none" />
      )}

      {/* ==================== PETA DUNIA VIRTUAL 13 LOKASI (ROOT BOTTOM SHEET z-[100]..z-[120]) ==================== */}
      {showWorldMapDrawer && (
        <>
          <div
            onClick={() => setShowWorldMapDrawer(false)}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[1px]"
          />
          <div className="fixed inset-x-0 bottom-14 z-[110] mx-auto w-full max-w-2xl max-h-[48dvh] bg-[#FFFDF9] border-t-3 border-x-3 border-[#2D2520] rounded-t-3xl shadow-[0_-6px_0_#2D2520] flex flex-col overflow-hidden">
            <div className="sticky top-0 z-[115] bg-[#FFFDF9] px-4 py-2.5 border-b-2 border-[#E5DEC9] flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <h3 className="font-display text-xs sm:text-sm font-bold text-[#2D2520] line-clamp-2">
                  🗺️ Peta Dunia Virtual (13 Lokasi Indoor &amp; Outdoor)
                </h3>
                <p className="text-[10px] text-[#6E6259] truncate">
                  Lokasi saat ini: <strong>{getWorldLocationMeta(gameState.currentRoom).iconEmoji} {getWorldLocationMeta(gameState.currentRoom).indonesianName}</strong>
                </p>
              </div>
              <button
                onClick={() => setShowWorldMapDrawer(false)}
                className="relative z-[120] w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-rose-500 hover:bg-rose-600 text-white border-2 border-[#2D2520] font-bold flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="Tutup Peta"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
              {(
                [
                  { cat: 'indoor', label: '🏠 Dalam Rumah (Indoor Rooms)' },
                  { cat: 'garden', label: '🌻 Kebun & Taman Tanaman (Gardens)' },
                  { cat: 'outdoor', label: '🌤️ Dunia Luar Ruangan (Outdoor Worlds)' },
                ] as const
              ).map((group) => (
                <div key={group.cat}>
                  <div className="text-[10px] font-bold text-[#6E6259] uppercase tracking-wider mb-1">
                    {group.label}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {WORLD_LOCATIONS.filter((l) => l.category === group.cat).map((loc) => {
                      const isActive = gameState.currentRoom === loc.id;
                      const isVisited = gameState.visitedLocations?.includes(loc.id);
                      return (
                        <button
                          key={loc.id}
                          onClick={() => handleChangeWorldLocation(loc.id)}
                          className={`min-h-[56px] p-2 rounded-2xl border-2 text-left transition-all flex items-center gap-2 ${
                            isActive
                              ? 'bg-[#FF8FAB] border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                              : 'bg-amber-50/80 hover:bg-amber-100 border-[#2D2520]'
                          }`}
                        >
                          <span className="text-xl shrink-0">{loc.iconEmoji}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#2D2520] leading-tight">
                              {loc.indonesianName}
                            </div>
                            <div className="text-[9px] text-[#6E6259]">
                              {isActive ? '📍 Sedang di sini' : isVisited ? '✓ Pernah dikunjungi' : '✨ Baru'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ==================== C.1..C.6: PANEL BAWAH (BOTTOM SHEET MAKS 50% TINGGI LAYAR, STICKY HEADER, 44x44 X BUTTON, 2-COL GRID) ==================== */}
      {careTray && (
        <>
          {/* Overlay Gelap z-[100] — Ketuk di Luar Panel untuk Menutup */}
          <div
            onClick={() => setCareTray(null)}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[1px]"
          />

          <div className="fixed inset-x-0 bottom-14 z-[110] mx-auto w-full max-w-2xl max-h-[48dvh] rounded-t-3xl bg-[#FFFDF9] border-t-3 border-x-3 border-[#2D2520] shadow-[0_-8px_0_#2D2520] flex flex-col overflow-hidden">
            {/* Sticky Header & 44x44px Close Button (C.4 & C.5) */}
            <div className="sticky top-0 z-[115] bg-[#FFFDF9] px-4 py-2.5 border-b-2 border-stone-200 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FF8FAB] border border-[#2D2520] shrink-0" />
                <span className="font-display text-xs sm:text-sm font-bold text-[#2D2520] line-clamp-2 leading-tight">
                  {careTray === 'feed' && `🍼 Pilih Makanan (${gameState.babyName} · ${currentPhaseLabel})`}
                  {careTray === 'bath' && `🛁 Mandi & Kebersihan (${gameState.needs.hygiene}%)`}
                  {careTray === 'play' && `🧸 Aktivitas di Ruangan (${currentStage.indonesianTitle})`}
                  {careTray === 'love' && `💖 Berikan Kasih Sayang untuk ${gameState.babyName}`}
                  {careTray === 'menu' && `✨ Semua Menu & Fitur Petualangan`}
                </span>
              </div>
              <button
                onClick={() => setCareTray(null)}
                className="relative z-[120] w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-rose-500 hover:bg-rose-600 text-white border-2 border-[#2D2520] flex items-center justify-center shrink-0 cursor-pointer"
                aria-label="Tutup Panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 overflow-y-auto flex-1">
              {/* 1. FEED TRAY (Grid 2 Kolom Rapi, Tinggi Seragam) */}
              {careTray === 'feed' && (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setCareTray(null);
                        setActiveModal('nusantara');
                      }}
                      className="min-h-[48px] px-3 py-2 rounded-2xl bg-emerald-100 hover:bg-emerald-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-emerald-950 text-center"
                    >
                      🌏 Menu Kuliner Nusantara
                    </button>
                    <button
                      onClick={() => {
                        setCareTray(null);
                        setActiveModal('shop');
                      }}
                      className="min-h-[48px] px-3 py-2 rounded-2xl bg-pink-100 hover:bg-pink-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-pink-950 text-center"
                    >
                      + Beli Makanan di Toko
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {STORE_ITEMS.filter((i) => {
                      if (i.category !== 'food') return false;
                      if (i.id === 'food_milk' || i.id === 'food_porridge') return true;
                      const qty = gameState.foodInventory[i.id] || 0;
                      const check = validateFoodPhaseAccess(i.id, gameState.level);
                      return check.allowed && qty > 0;
                    }).map((food) => {
                      const qty = gameState.foodInventory[food.id] || 0;
                      const access = validateFoodPhaseAccess(food.id, gameState.level);
                      return (
                        <button
                          key={food.id}
                          onClick={() => handleFeedItem(food)}
                          className={`min-h-[56px] p-2.5 rounded-2xl border-2 flex items-center gap-2 text-left transition-all ${
                            qty > 0 && access.allowed
                              ? 'bg-white border-[#2D2520] hover:bg-amber-50 shadow-[0_2px_0_#2D2520]'
                              : 'bg-stone-100 border-stone-300 opacity-75'
                          }`}
                        >
                          <span className="text-2xl shrink-0">{food.iconEmoji}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#2D2520] leading-tight">
                              {food.name}
                            </div>
                            <div className="text-[10px] font-mono-num text-[#6E6259]">
                              Stok: {qty} · +{food.hungerRestore}%
                            </div>
                          </div>
                        </button>
                      );
                    })}

                    {currentLifePhase === 'BAYI' &&
                      NUSANTARA_SNACKS.slice(0, 2).map((lockedSnack) => (
                        <button
                          key={lockedSnack.id}
                          onClick={() => {
                            sound.playWrong();
                            setSpeechBubble(
                              'Menu makanan Nusantara akan terbuka ketika aku tumbuh menjadi anak-anak.'
                            );
                            setTimeout(() => setSpeechBubble(null), 3200);
                          }}
                          className="min-h-[56px] p-2.5 rounded-2xl border-2 border-stone-300 bg-stone-100 flex items-center gap-2 text-left opacity-85 hover:bg-rose-50"
                        >
                          <div className="relative shrink-0">
                            <span className="text-2xl grayscale">{lockedSnack.iconEmoji}</span>
                            <Lock className="w-3.5 h-3.5 text-rose-600 absolute -bottom-1 -right-1 bg-white rounded-full p-0.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[#2D2520] leading-tight">
                              🔒 {lockedSnack.name}
                            </div>
                            <div className="text-[10px] font-bold text-rose-600">
                              Terkunci (Stage 4+)
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* 2. BATH / HYGIENE TRAY (Grid 2 Kolom Rapi, Tinggi Seragam) */}
              {careTray === 'bath' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleHygieneAction('full_bath')}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] flex items-center justify-center text-center"
                  >
                    🛁 Mandi Busa &amp; Bilas (+40%)
                  </button>
                  <button
                    onClick={handleTowelDryBaby}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-pink-50 hover:bg-pink-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] flex items-center justify-center text-center"
                  >
                    🧣 Keringkan Handuk (100% Segar)
                  </button>
                  <button
                    onClick={() => handleHygieneAction('face')}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] flex items-center justify-center text-center"
                  >
                    💧 Cuci Wajah &amp; Rambut (+18%)
                  </button>
                  <button
                    onClick={() => handleHygieneAction('hands')}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] flex items-center justify-center text-center"
                  >
                    🧼 Cuci Tangan &amp; Kaki (+16%)
                  </button>
                </div>
              )}

              {/* 3. PLAY TRAY — SEAMLESS IN-WORLD ACTIVITIES (Grid 2 Kolom Rapi, Tinggi Seragam) */}
              {careTray === 'play' && (
                <div className="space-y-3">
                  <div className="text-[11px] font-semibold text-[#5C5248] bg-amber-50/80 border border-[#E5DEC9] rounded-xl px-2.5 py-1.5">
                    ✨ Pilih aktivitas untuk bermain <strong>langsung di ruangan utama</strong>!
                  </div>

                  {/* 4 Cilukba Variations Directly in Current Room */}
                  <div>
                    <div className="text-[10px] font-bold text-[#6E6259] uppercase tracking-wider mb-1.5">
                      🙈 4 Variasi Cilukba (Langsung di Ruangan)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          handleStartInWorldActivity('cilukba', 'var_1', 'Cilukba Tutup Wajah', '🙈')
                        }
                        className="min-h-[56px] p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] text-left flex items-center gap-2"
                      >
                        <span className="text-lg shrink-0">🙈</span>
                        <span>Var 1: Tutup Wajah</span>
                      </button>
                      <button
                        onClick={() =>
                          handleStartInWorldActivity('cilukba', 'var_2', 'Cilukba Balik Bantal', '☁️')
                        }
                        className="min-h-[56px] p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] text-left flex items-center gap-2"
                      >
                        <span className="text-lg shrink-0">☁️</span>
                        <span>Var 2: Balik Bantal</span>
                      </button>
                      <button
                        onClick={() =>
                          handleStartInWorldActivity('cilukba', 'var_3', 'Cilukba Balik Selimut', '🛌')
                        }
                        className="min-h-[56px] p-2.5 rounded-2xl bg-pink-50 hover:bg-pink-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] text-left flex items-center gap-2"
                      >
                        <span className="text-lg shrink-0">🛌</span>
                        <span>Var 3: Balik Selimut</span>
                      </button>
                      <button
                        onClick={() =>
                          handleStartInWorldActivity('cilukba', 'var_4', 'Ajak Karakter Cilukba', '🤲')
                        }
                        className="min-h-[56px] p-2.5 rounded-2xl bg-yellow-50 hover:bg-yellow-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] text-left flex items-center gap-2"
                      >
                        <span className="text-lg shrink-0">🤲</span>
                        <span>Var 4: Ajak Cilukba</span>
                      </button>
                    </div>
                  </div>

                  {/* Environment Object-Based Activities */}
                  <div>
                    <div className="text-[10px] font-bold text-[#6E6259] uppercase tracking-wider mb-1.5">
                      🏠 Aktivitas Objek Lingkungan &amp; Tahap Usia (Stage {gameState.level})
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() =>
                          handleStartInWorldActivity(
                            'teddy',
                            'hug_teddy',
                            'Bermain & Peluk Teddy Bear',
                            '🧸',
                            undefined,
                            gameState.currentRoom === 'kitchen' || gameState.currentRoom === 'bathroom'
                              ? 'bedroom'
                              : gameState.currentRoom
                          )
                        }
                        className="min-h-[56px] p-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] text-left flex items-center gap-2"
                      >
                        <span className="text-lg shrink-0">🧸</span>
                        <span>Teddy Bear (Peluk/Main)</span>
                      </button>

                      <button
                        onClick={() =>
                          handleStartInWorldActivity(
                            'ball',
                            'kick_ball',
                            'Bermain Bola Fisika',
                            '⚽',
                            undefined,
                            gameState.currentRoom === 'kitchen' || gameState.currentRoom === 'bathroom'
                              ? 'playroom'
                              : gameState.currentRoom
                          )
                        }
                        className="min-h-[56px] p-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] text-left flex items-center gap-2"
                      >
                        <span className="text-lg shrink-0">⚽</span>
                        <span>Main Bola (Tendang/Tangkap)</span>
                      </button>

                      <button
                        onClick={() =>
                          handleStartInWorldActivity(
                            'toybox',
                            'stack_blocks',
                            'Menyusun Menara Balok',
                            '🧱',
                            undefined,
                            gameState.currentRoom === 'bedroom' || gameState.currentRoom === 'playroom'
                              ? gameState.currentRoom
                              : 'playroom'
                          )
                        }
                        className="min-h-[56px] p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] text-left flex items-center gap-2"
                      >
                        <span className="text-lg shrink-0">🧱</span>
                        <span>Kotak Mainan &amp; Balok</span>
                      </button>

                      <button
                        onClick={() =>
                          handleStartInWorldActivity(
                            'bookshelf',
                            'pick_book_1',
                            'Membaca Buku Cerita',
                            '📚',
                            undefined,
                            gameState.currentRoom === 'bedroom' || gameState.currentRoom === 'playroom'
                              ? gameState.currentRoom
                              : 'playroom'
                          )
                        }
                        className="min-h-[56px] p-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] text-left flex items-center gap-2"
                      >
                        <span className="text-lg shrink-0">📚</span>
                        <span>Rak Buku &amp; Balik Halaman</span>
                      </button>

                      <button
                        onClick={() =>
                          handleStartInWorldActivity(
                            'bed',
                            'read_bed',
                            'Bersantai di Tempat Tidur',
                            '🛏️',
                            undefined,
                            'bedroom'
                          )
                        }
                        className="min-h-[56px] p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] text-left flex items-center gap-2"
                      >
                        <span className="text-lg shrink-0">🛏️</span>
                        <span>Kasur (Baring/Baca/Boneka)</span>
                      </button>

                      <button
                        onClick={() =>
                          handleStartInWorldActivity(
                            'kitchen',
                            'recipe_porridge',
                            'Memasak di Dapur',
                            '🍳',
                            undefined,
                            'kitchen'
                          )
                        }
                        className="min-h-[56px] p-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] text-left flex items-center gap-2"
                      >
                        <span className="text-lg shrink-0">🍳</span>
                        <span>Dapur (Seret Bahan &amp; Aduk)</span>
                      </button>

                      <button
                        onClick={() => {
                          handleChangeWorldLocation('backyard_garden');
                          setCareTray(null);
                        }}
                        className="min-h-[56px] p-2.5 rounded-2xl bg-lime-100 hover:bg-lime-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] text-left flex items-center gap-2"
                      >
                        <span className="text-lg shrink-0">🌻</span>
                        <span>Kebun Belakang (4 Petak)</span>
                      </button>

                      <button
                        onClick={() => {
                          handleChangeWorldLocation('playground');
                          setCareTray(null);
                        }}
                        className="min-h-[56px] p-2.5 rounded-2xl bg-cyan-100 hover:bg-cyan-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] text-left flex items-center gap-2"
                      >
                        <span className="text-lg shrink-0">🛝</span>
                        <span>Playground (Perosotan)</span>
                      </button>

                      <button
                        onClick={() => {
                          handleChangeWorldLocation('park');
                          setCareTray(null);
                        }}
                        className="min-h-[56px] p-2.5 rounded-2xl bg-emerald-100 hover:bg-emerald-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] text-left flex items-center gap-2"
                      >
                        <span className="text-lg shrink-0">🧺</span>
                        <span>Taman Kota (Piknik &amp; Alam)</span>
                      </button>

                      <button
                        onClick={() => {
                          handleChangeWorldLocation('beach');
                          setCareTray(null);
                        }}
                        className="min-h-[56px] p-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] text-left flex items-center gap-2"
                      >
                        <span className="text-lg shrink-0">🏖️</span>
                        <span>Pantai (Kerang &amp; Pasir)</span>
                      </button>

                      <button
                        onClick={() => {
                          handleChangeWorldLocation('cultural_village');
                          setCareTray(null);
                        }}
                        className="min-h-[56px] p-2.5 rounded-2xl bg-rose-100 hover:bg-rose-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] text-left flex items-center gap-2"
                      >
                        <span className="text-lg shrink-0">🏛️</span>
                        <span>Desa Budaya Nusantara</span>
                      </button>

                      <button
                        onClick={() => handlePlayAction('music')}
                        className="min-h-[56px] p-2.5 rounded-2xl bg-pink-100 hover:bg-pink-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] text-left flex items-center gap-2"
                      >
                        <span className="text-lg shrink-0">🎵</span>
                        <span>Menari &amp; Tepuk Musik</span>
                      </button>
                    </div>
                  </div>

                  {/* Age-Specific Exclusive Activities for Current Stage (2-Column Grid) */}
                  <div>
                    <div className="text-[10px] font-bold text-[#6E6259] uppercase tracking-wider mb-1.5">
                      🌟 Aktivitas Usia {currentStage.indonesianTitle} (Langsung di Ruangan)
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {getAvailableActivitiesForStage(gameState.level).map((act) => {
                        const mapMechanicToInWorld = (): {
                          type: InWorldObjectType;
                          sub: string;
                          room?: GameSaveState['currentRoom'];
                        } => {
                          if (act.id.includes('peekaboo')) return { type: 'cilukba', sub: 'var_1' };
                          if (act.id.includes('cooking')) return { type: 'kitchen', sub: 'recipe_porridge', room: 'kitchen' };
                          if (act.id.includes('garden')) return { type: 'garden', sub: 'plant_seed', room: 'livingroom' };
                          if (act.id.includes('story') || act.id.includes('read') || act.id.includes('study'))
                            return { type: 'bookshelf', sub: 'pick_book_1', room: 'playroom' };
                          if (act.id.includes('block') || act.id.includes('shape') || act.id.includes('craft'))
                            return { type: 'toybox', sub: 'stack_blocks', room: 'playroom' };
                          if (act.id.includes('ball') || act.id.includes('sport') || act.id.includes('crawl'))
                            return { type: 'ball', sub: 'kick_ball', room: 'playroom' };
                          return { type: 'teddy', sub: 'play_teddy' };
                        };
                        const mapped = mapMechanicToInWorld();
                        return (
                          <button
                            key={act.id}
                            onClick={() =>
                              handleStartInWorldActivity(
                                mapped.type,
                                mapped.sub,
                                act.indonesianTitle,
                                act.iconEmoji,
                                act.id,
                                mapped.room
                              )
                            }
                            className="min-h-[52px] px-2.5 py-2 rounded-2xl bg-white hover:bg-amber-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] flex items-center gap-2 text-left"
                          >
                            <span className="text-lg shrink-0">{act.iconEmoji}</span>
                            <span className="leading-tight">{act.indonesianTitle}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. LOVE TRAY (Grid 2 Kolom Rapi, Tinggi Seragam) */}
              {careTray === 'love' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleLoveAction('cuddle')}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-pink-50 hover:bg-pink-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] flex items-center justify-center text-center"
                  >
                    🤗 Gendong &amp; Peluk
                  </button>
                  <button
                    onClick={() => handleLoveAction('pat_head')}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] flex items-center justify-center text-center"
                  >
                    🥰 Usap Kepala
                  </button>
                  <button
                    onClick={() => handleLoveAction('talk')}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] flex items-center justify-center text-center"
                  >
                    💬 Ajak Berbicara
                  </button>
                  <button
                    onClick={() => handleLoveAction('bedtime_story')}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-xs font-bold text-[#2D2520] flex items-center justify-center text-center"
                  >
                    📖 Temani &amp; Dongeng
                  </button>
                </div>
              )}

              {/* 5. COLLAPSIBLE ALL-FEATURES BOTTOM SHEET MENU DRAWER (Grid 2 Kolom Rapi, Tinggi Seragam) */}
              {careTray === 'menu' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setCareTray('play');
                    }}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-gradient-to-b from-pink-200 to-rose-200 hover:from-pink-300 hover:to-rose-300 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center gap-2 text-left"
                  >
                    <Gamepad2 className="w-5 h-5 text-[#2D2520] shrink-0" />
                    <span className="font-display text-xs font-bold text-[#2D2520] leading-tight">
                      Let&apos;s Play!
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setCareTray(null);
                      setActiveModal('math');
                    }}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-amber-200 hover:bg-amber-300 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center gap-2 text-left"
                  >
                    <Calculator className="w-5 h-5 text-[#2D2520] shrink-0" />
                    <span className="font-display text-xs font-bold text-[#2D2520] leading-tight">
                      Math Challenge
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setCareTray(null);
                      setActiveModal('growing_up');
                    }}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-amber-100 hover:bg-amber-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center gap-2 text-left"
                  >
                    <Sparkles className="w-5 h-5 text-amber-700 shrink-0" />
                    <span className="font-display text-xs font-bold text-[#2D2520] leading-tight">
                      Album 246 Hari
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setCareTray(null);
                      setActiveModal('healthcare');
                    }}
                    className={`min-h-[56px] p-2.5 rounded-2xl border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center gap-2 text-left ${
                      gameState.characterLifeData.illnessState === 'healthy'
                        ? 'bg-sky-100 hover:bg-sky-200 text-[#2D2520]'
                        : 'bg-rose-500 text-white animate-pulse'
                    }`}
                  >
                    <HeartPulse className="w-5 h-5 shrink-0" />
                    <span className="font-display text-xs font-bold leading-tight">
                      RS Virtual
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setCareTray(null);
                      setActiveModal('nusantara');
                    }}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-emerald-100 hover:bg-emerald-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center gap-2 text-left"
                  >
                    <Compass className="w-5 h-5 text-emerald-700 shrink-0" />
                    <span className="font-display text-xs font-bold text-[#2D2520] leading-tight">
                      Budaya Nusantara
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setCareTray(null);
                      setActiveModal('shop');
                    }}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-pink-50 hover:bg-pink-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center gap-2 text-left"
                  >
                    <ShoppingBag className="w-5 h-5 text-pink-600 shrink-0" />
                    <span className="font-display text-xs font-bold text-[#2D2520] leading-tight">
                      Toko Item
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setCareTray(null);
                      setActiveModal('inventory');
                    }}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center gap-2 text-left"
                  >
                    <Package className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-display text-xs font-bold text-[#2D2520] leading-tight">
                      Inventaris
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setCareTray(null);
                      setActiveModal('wardrobe');
                    }}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center gap-2 text-left"
                  >
                    <Shirt className="w-5 h-5 text-purple-600 shrink-0" />
                    <span className="font-display text-xs font-bold text-[#2D2520] leading-tight">
                      Pakaian &amp; Rambut
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setCareTray(null);
                      setActiveModal('missions');
                    }}
                    className="relative min-h-[56px] p-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center gap-2 text-left"
                  >
                    <Calendar className="w-5 h-5 text-sky-600 shrink-0" />
                    <span className="font-display text-xs font-bold text-[#2D2520] leading-tight">
                      Misi Harian
                    </span>
                    {unclaimedMissionsCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white font-mono-num text-[10px] font-bold flex items-center justify-center border border-[#2D2520]">
                        {unclaimedMissionsCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setCareTray(null);
                      setActiveModal('memories');
                    }}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center gap-2 text-left"
                  >
                    <Camera className="w-5 h-5 text-amber-600 shrink-0" />
                    <span className="font-display text-xs font-bold text-[#2D2520] leading-tight">
                      Kenangan
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setCareTray(null);
                      setActiveModal('profile');
                    }}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-orange-50 hover:bg-orange-100 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center gap-2 text-left"
                  >
                    <UserCheck className="w-5 h-5 text-amber-700 shrink-0" />
                    <span className="font-display text-xs font-bold text-[#2D2520] leading-tight">
                      Profil Karakter
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playClick();
                      setCareTray(null);
                      setActiveModal('settings');
                    }}
                    className="min-h-[56px] p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center gap-2 text-left"
                  >
                    <Settings className="w-5 h-5 text-stone-700 shrink-0" />
                    <span className="font-display text-xs font-bold text-[#2D2520] leading-tight">
                      Pengaturan
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ==================== BARIS 3: MENU AKSI BAWAH (z-[60], Feed, Bangun/Sleep, Bath, Play, Love, Menu) ==================== */}
      <footer className="relative z-[60] w-full px-2 sm:px-3 py-1 bg-[#FFFDF9] border-t-2 border-[#2D2520] flex justify-center shrink-0">
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2.5 w-full max-w-2xl">
          {/* 1. FEED */}
          <button
            onClick={() => {
              sound.playClick();
              setGameState((p) => ({ ...p, currentRoom: 'kitchen' }));
              setCareTray(careTray === 'feed' ? null : 'feed');
            }}
            className={`py-1.5 px-1 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 transition-transform active:translate-y-0.5 ${
              careTray === 'feed'
                ? 'bg-amber-300 border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                : 'bg-amber-100 hover:bg-amber-200 border-[#2D2520]'
            }`}
          >
            <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D2520]" />
            <span className="font-display text-[11px] sm:text-xs font-bold text-[#2D2520]">
              Feed
            </span>
          </button>

          {/* 2. SLEEP */}
          <button
            onClick={handleToggleSleep}
            className={`py-1.5 px-1 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 transition-transform active:translate-y-0.5 ${
              gameState.isSleeping
                ? 'bg-indigo-300 border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                : 'bg-purple-100 hover:bg-purple-200 border-[#2D2520]'
            }`}
          >
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D2520]" />
            <span className="font-display text-[11px] sm:text-xs font-bold text-[#2D2520]">
              {gameState.isSleeping ? 'Bangun' : 'Sleep'}
            </span>
          </button>

          {/* 3. BATH */}
          <button
            onClick={() => {
              sound.playClick();
              setGameState((p) => ({ ...p, currentRoom: 'bathroom' }));
              setCareTray(careTray === 'bath' ? null : 'bath');
            }}
            className={`py-1.5 px-1 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 transition-transform active:translate-y-0.5 ${
              careTray === 'bath'
                ? 'bg-sky-300 border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                : 'bg-sky-100 hover:bg-sky-200 border-[#2D2520]'
            }`}
          >
            <Bath className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D2520]" />
            <span className="font-display text-[11px] sm:text-xs font-bold text-[#2D2520]">
              Bath
            </span>
          </button>

          {/* 4. PLAY */}
          <button
            onClick={() => {
              sound.playClick();
              setGameState((p) => ({ ...p, currentRoom: 'playroom' }));
              setCareTray(careTray === 'play' ? null : 'play');
            }}
            className={`py-1.5 px-1 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 transition-transform active:translate-y-0.5 ${
              careTray === 'play'
                ? 'bg-emerald-300 border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                : 'bg-emerald-100 hover:bg-emerald-200 border-[#2D2520]'
            }`}
          >
            <Gamepad2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D2520]" />
            <span className="font-display text-[11px] sm:text-xs font-bold text-[#2D2520]">
              Play
            </span>
          </button>

          {/* 5. LOVE */}
          <button
            onClick={() => {
              sound.playClick();
              setCareTray(careTray === 'love' ? null : 'love');
            }}
            className={`py-1.5 px-1 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 transition-transform active:translate-y-0.5 ${
              careTray === 'love'
                ? 'bg-pink-300 border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                : 'bg-pink-100 hover:bg-pink-200 border-[#2D2520]'
            }`}
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D2520]" />
            <span className="font-display text-[11px] sm:text-xs font-bold text-[#2D2520]">
              Love
            </span>
          </button>

          {/* 6. COLLAPSIBLE ALL-MENUS DRAWER BUTTON ("Menu / Fitur") */}
          <button
            onClick={() => {
              sound.playClick();
              setCareTray(careTray === 'menu' ? null : 'menu');
            }}
            className={`relative py-1.5 px-1 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 transition-transform active:translate-y-0.5 ${
              careTray === 'menu'
                ? 'bg-rose-300 border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                : 'bg-stone-100 hover:bg-stone-200 border-[#2D2520]'
            }`}
            title="Buka Semua Menu & Fitur (Toko, Pakaian, Budaya, RS Virtual, Album 246 Hari, Misi)"
          >
            <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5 text-[#2D2520]" />
            <span className="font-display text-[11px] sm:text-xs font-bold text-[#2D2520]">
              Menu
            </span>
            {(unclaimedMissionsCount > 0 ||
              gameState.characterLifeData.illnessState !== 'healthy') && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white font-mono-num text-[9px] font-bold flex items-center justify-center border border-[#2D2520]">
                {unclaimedMissionsCount > 0 ? unclaimedMissionsCount : '!'}
              </span>
            )}
          </button>
        </div>
      </footer>

      {/* ==================== GRADUAL EVOLUTION MODAL (STAGES 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7) ==================== */}
      {pendingEvolution && (
        <EvolutionModal
          babyName={gameState.babyName}
          gender={gameState.gender}
          targetPhase={pendingEvolution.targetPhase}
          targetLevel={pendingEvolution.targetLevel}
          appearance={gameState.appearance}
          regionScores={gameState.regionScores}
          queueStepIndex={pendingEvolution.queueStepIndex}
          queueTotalSteps={pendingEvolution.queueTotalSteps}
          onCompleteChildEvolution={handleCompleteChildEvolution}
          onCompleteAdultEvolution={handleCompleteAdultEvolution}
        />
      )}

      {/* ==================== ACTIVE MODALS ==================== */}
      {activeModal === 'lets_play' && (
        <LetsPlayTogetherModal
          babyName={gameState.babyName}
          gender={gameState.gender}
          level={gameState.level}
          appearance={gameState.appearance}
          roomDecor={gameState.roomDecor}
          completedActivities={gameState.characterLifeData.completedActivities}
          recentlyPlayedActivities={gameState.characterLifeData.recentlyPlayedActivities}
          favoriteActivities={gameState.characterLifeData.favoriteActivities}
          activityMemories={gameState.characterLifeData.activityMemories}
          onToggleFavoriteActivity={handleToggleFavoriteActivity}
          onCompleteActivitySession={handleCompleteActivitySession}
          onUpdateRoomDecor={(partial) =>
            setGameState((p) => ({
              ...p,
              roomDecor: { ...p.roomDecor, ...partial },
            }))
          }
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'growing_up' && (
        <GrowingUpMemoriesModal
          babyName={gameState.babyName}
          gender={gameState.gender}
          level={gameState.level}
          appearance={gameState.appearance}
          lifeData={gameState.characterLifeData}
          onClose={() => setActiveModal(null)}
          onCaptureCurrentStagePhoto={handleCaptureCurrentStagePhoto}
        />
      )}

      {activeModal === 'healthcare' && (
        <HealthcareAndHospitalModal
          babyName={gameState.babyName}
          gender={gameState.gender}
          level={gameState.level}
          appearance={gameState.appearance}
          lifeData={gameState.characterLifeData}
          onClose={() => setActiveModal(null)}
          onHomeCareAction={handleHomeCareAction}
          onEnterHospital={handleEnterHospital}
          onHospitalCareStep={handleHospitalCareStep}
          onDischargeFromHospital={handleDischargeFromHospital}
          onToggleIllnessEnabled={handleToggleIllnessEnabled}
          onSimulateIllnessState={handleSimulateIllnessState}
        />
      )}

      {activeModal === 'math' && (
        <MathChallengeModal
          selectedGrade={gameState.selectedGrade}
          coins={gameState.coins}
          currentStreak={gameState.mathStats.currentStreak}
          onSelectGrade={(g) => setGameState((p) => ({ ...p, selectedGrade: g }))}
          onCorrectAnswer={handleMathCorrect}
          onWrongAnswer={handleMathWrong}
          onGrantSurpriseItem={handleGrantSurpriseItem}
          ownedItemIds={[
            ...gameState.ownedClothes,
            ...gameState.ownedToys,
            ...gameState.ownedFurniture,
          ]}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'nusantara' && (
        <NusantaraCultureModal
          babyName={gameState.babyName}
          gender={gameState.gender}
          level={gameState.level}
          coins={gameState.coins}
          appearance={gameState.appearance}
          regionScores={gameState.regionScores}
          foodInventory={gameState.foodInventory}
          ownedClothes={gameState.ownedClothes}
          consumedFoodHistory={gameState.consumedFoodHistory}
          evaluatedAdultRegion={gameState.evaluatedAdultRegion}
          onBuyFood={(food) => handleBuyItem(food)}
          onConsumeFood={(food) => handleFeedItem(food)}
          onBuyClothing={(cloth) => handleBuyItem(cloth)}
          onEquipClothing={(cloth) => handleEquipClothing(cloth)}
          onClose={() => setActiveModal(null)}
        />
      )}

      {(activeModal === 'shop' || activeModal === 'inventory' || activeModal === 'wardrobe') && (
        <ShopInventoryModal
          initialMode={activeModal}
          coins={gameState.coins}
          level={gameState.level}
          gender={gameState.gender}
          appearance={gameState.appearance}
          roomDecor={gameState.roomDecor}
          ownedClothes={gameState.ownedClothes}
          ownedToys={gameState.ownedToys}
          ownedFurniture={gameState.ownedFurniture}
          foodInventory={gameState.foodInventory}
          onBuyItem={handleBuyItem}
          onEquipClothing={handleEquipClothing}
          onUnequipAccessory={handleUnequipAccessory}
          onEquipFurniture={handleEquipFurniture}
          onUseFood={handleFeedItem}
          onUseToy={(toy) => handlePlayAction('toy', toy)}
          onUpdateAppearanceBasic={(partial) =>
            setGameState((p) => ({ ...p, appearance: { ...p.appearance, ...partial } }))
          }
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'missions' && (
        <MissionsModal
          missions={gameState.dailyMissions}
          loginStreak={gameState.loginStreak}
          claimedLoginToday={gameState.claimedLoginToday}
          onClaimMission={handleClaimMission}
          onClaimLoginReward={handleClaimLoginReward}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'memories' && (
        <MemoriesModal
          memories={gameState.memories}
          babyName={gameState.babyName}
          gender={gameState.gender}
          level={gameState.level}
          appearance={gameState.appearance}
          mathStats={gameState.mathStats}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'profile' && (
        <ProfileModal
          playerName={gameState.playerName}
          babyName={gameState.babyName}
          gender={gameState.gender}
          level={gameState.level}
          careXp={gameState.careXp}
          mathXp={gameState.mathXp}
          characterCreatedAt={
            gameState.characterLifeData.characterCreatedAt ||
            gameState.characterLifeData.createdAt
          }
          appearance={gameState.appearance}
          evaluatedAdultRegionName={
            gameState.evaluatedAdultRegion
              ? regionalData[gameState.evaluatedAdultRegion]?.name || null
              : null
          }
          totalRegionalPoints={totalRegionalPoints}
          onUpdateNames={handleUpdateNames}
          onOpenNusantara={() => setActiveModal('nusantara')}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          audioSettings={gameState.audioSettings}
          graphicsQuality={gameState.graphicsQuality}
          playerName={gameState.playerName}
          babyName={gameState.babyName}
          onUpdateNames={handleUpdateNames}
          onUpdateAudio={(partial: Partial<AudioSettings>) =>
            setGameState((p) => ({
              ...p,
              audioSettings: { ...p.audioSettings, ...partial },
            }))
          }
          onUpdateGraphics={(q) => setGameState((p) => ({ ...p, graphicsQuality: q }))}
          onResetGame={() => {
            localStorage.removeItem(STORAGE_KEY);
            const def = createDefaultSaveState();
            setGameState(def);
            setActiveModal(null);
            setShowTitleScreen(true);
          }}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}
