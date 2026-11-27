import React, { useEffect, useRef, useState } from 'react';
import {
  AgeActivityDefinition,
  ActivityMemoryRecord,
  getArchivedPastActivitiesForStage,
  getAvailableActivitiesForStage,
  INTERACTIVE_COOKING_RECIPES,
  INTERACTIVE_STORYBOOKS,
} from '../data/lifeProgressionData';
import {
  BabyActionState,
  BabyAppearance,
  BabyGender,
  getGrowthStage,
  RoomDecorState,
  STORE_ITEMS,
} from '../data/gameData';
import { regionalData, RegionId } from '../data/nusantaraData';
import { BabyCharacterSVG } from './BabyCharacterSVG';
import { speakCharacterVoiceResponse } from '../data/voiceResponses';
import { sound } from '../utils/sound';
import {
  X,
  Heart,
  Star,
  Clock,
  Archive,
  Play,
  RotateCcw,
  Volume2,
  CheckCircle2,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface LetsPlayTogetherModalProps {
  babyName: string;
  gender: BabyGender;
  level: number;
  appearance: BabyAppearance;
  roomDecor: RoomDecorState;
  completedActivities: string[];
  recentlyPlayedActivities: string[];
  favoriteActivities: string[];
  activityMemories: ActivityMemoryRecord[];
  onToggleFavoriteActivity: (activityId: string) => void;
  onCompleteActivitySession: (
    activity: AgeActivityDefinition,
    summaryText: string,
    scoreLabel: string,
    bonusFoodId?: string,
    bonusRegionId?: RegionId
  ) => void;
  onUpdateRoomDecor?: (partial: Partial<RoomDecorState>) => void;
  onClose: () => void;
}

type HubTab = 'available' | 'recent' | 'memories' | 'favorites';

const BALL_DESIGNS = [
  { id: 'soccer', name: 'Bola Sepak Klasik', emoji: '⚽', color: '#38BDF8', accent: '#0284C7' },
  { id: 'basket', name: 'Bola Basket Oranye', emoji: '🏀', color: '#FB923C', accent: '#C2410C' },
  { id: 'star', name: 'Bola Bintang Emas', emoji: '🌟', color: '#FACC15', accent: '#B45309' },
  { id: 'rainbow', name: 'Bola Pelangi Ceria', emoji: '🔮', color: '#F472B6', accent: '#9333EA' },
];

export const LetsPlayTogetherModal: React.FC<LetsPlayTogetherModalProps> = ({
  babyName,
  gender,
  level,
  appearance,
  roomDecor,
  completedActivities,
  recentlyPlayedActivities,
  favoriteActivities,
  activityMemories,
  onToggleFavoriteActivity,
  onCompleteActivitySession,
  onUpdateRoomDecor,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<HubTab>('available');
  const [selectedActivity, setSelectedActivity] = useState<AgeActivityDefinition | null>(null);
  const [charAction, setCharAction] = useState<BabyActionState>('idle');
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);
  const [sessionScore, setSessionScore] = useState<number>(0);

  const stageInfo = getGrowthStage(level);
  const availableList = getAvailableActivitiesForStage(level);
  const archivedPastList = getArchivedPastActivitiesForStage(level);

  // ==================== 1. PEEKABOO ("CILUKBA") STATE (STAGE 1-2) ====================
  const [handsCoveringFace, setHandsCoveringFace] = useState<boolean>(false);
  const [peekabooCount, setPeekabooCount] = useState<number>(0);

  // ==================== 2. SOFT TOY WATCHING / FOLLOW TOY STATE (STAGE 1-2) ====================
  const [toyPos, setToyPos] = useState<{ x: number; y: number }>({ x: 50, y: 45 });
  const [babyCrawlPos, setBabyCrawlPos] = useState<{ x: number; y: number }>({ x: 25, y: 65 });
  const [selectedHangingToy, setSelectedHangingToy] = useState<'🌟' | '🎠' | '🦋' | '🌙'>('🎠');

  // ==================== 3. LULLABY / MUSIC STUDIO PIANO STATE ====================
  const [selectedSongName, setSelectedSongName] = useState<string>('Bintang Kecil Bersinar');
  const [playedNotesCount, setPlayedNotesCount] = useState<number>(0);

  // ==================== 4. PAT-A-CAKE / HIDE THE TOY / TOWER BLOCKS STATE ====================
  const [patTargetHand, setPatTargetHand] = useState<'left' | 'right'>('left');
  const [hiddenToySpot, setHiddenToySpot] = useState<number>(1);
  const [revealedSpot, setRevealedSpot] = useState<number | null>(null);
  const [stackedBlocks, setStackedBlocks] = useState<
    { id: string; color: string; label: string }[]
  >([]);
  const [towerCollapsed, setTowerCollapsed] = useState<boolean>(false);

  // ==================== 5. BALL PLAY PHYSICS ENGINE STATE (STAGE 2, 4, 5, 6) ====================
  const ballArenaRef = useRef<HTMLDivElement | null>(null);
  const [ballMode, setBallMode] = useState<'catch' | 'goal' | 'bounce' | 'basket'>('catch');
  const [selectedBall, setSelectedBall] = useState(BALL_DESIGNS[0]);
  const [ballState, setBallState] = useState<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    isDragging: boolean;
    dragStartX: number;
    dragStartY: number;
  }>({
    x: 26,
    y: 72,
    vx: 0,
    vy: 0,
    isDragging: false,
    dragStartX: 26,
    dragStartY: 72,
  });

  // ==================== 6. STORYBOOK ADVENTURE READER STATE ====================
  const [selectedBookId, setSelectedBookId] = useState<string>(INTERACTIVE_STORYBOOKS[0].id);
  const [bookPageIndex, setBookPageIndex] = useState<number>(0);

  // ==================== 7. COOKING TOGETHER / MASTER COOKING STATE ====================
  const availableRecipes = INTERACTIVE_COOKING_RECIPES.filter((r) => level >= r.minStage);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(
    (availableRecipes[0] || INTERACTIVE_COOKING_RECIPES[0]).id
  );
  const [addedIngredients, setAddedIngredients] = useState<string[]>([]);
  const [stirProgress, setStirProgress] = useState<number>(0);
  const [plateColor, setPlateColor] = useState<string>('#FFFBEB');
  const [dishCooked, setDishCooked] = useState<boolean>(false);

  // ==================== 8. FINGER PAINTING & ART STUDIO CANVAS STATE ====================
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [paintColor, setPaintColor] = useState<string>('#F43F5E');
  const [isDrawingCanvas, setIsDrawingCanvas] = useState<boolean>(false);
  const [strokeCount, setStrokeCount] = useState<number>(0);

  // ==================== 9. GARDENING & BOTANICAL FARM STATE ====================
  const [gardenPlots, setGardenPlots] = useState<
    { id: number; seed: string; stage: 0 | 1 | 2 | 3 }[]
  >([
    { id: 1, seed: '🌻 Bunga Matahari', stage: 0 },
    { id: 2, seed: '🍅 Tomat Merah', stage: 0 },
    { id: 3, seed: '🌺 Anggrek Bulan', stage: 0 },
  ]);

  // ==================== 10. ANIMAL SOUNDS / SORTING TOYS / TEDDY CARE / PUZZLE / SCIENCE / PHOTO / BATIK / TRAVEL ====================
  const [sortedCount, setSortedCount] = useState<number>(0);
  const [teddyStep, setTeddyStep] = useState<number>(0);
  const [puzzleTiles, setPuzzleTiles] = useState<number[]>([1, 2, 0, 3]);
  const [scienceMix, setScienceMix] = useState<string[]>([]);
  const [treasureRevealed, setTreasureRevealed] = useState<number[]>([]);
  const [cameraFocusX, setCameraFocusX] = useState<number>(50);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [batikCells, setBatikCells] = useState<string[]>(Array(12).fill('#FEF3C7'));
  const [selectedTravelRegion, setSelectedTravelRegion] = useState<RegionId>('jogja');

  // Reset mini-game state when selecting a new activity
  const startActivitySession = (act: AgeActivityDefinition) => {
    sound.playClick();
    setSelectedActivity(act);
    setCharAction(act.characterPose);
    setSessionScore(0);
    setFeedbackBanner(`Ayo bermain ${act.indonesianTitle} bersama ${babyName}!`);
    setHandsCoveringFace(false);
    setPeekabooCount(0);
    setPlayedNotesCount(0);
    setStackedBlocks([]);
    setTowerCollapsed(false);
    setAddedIngredients([]);
    setStirProgress(0);
    setDishCooked(false);
    setBookPageIndex(0);
    setStrokeCount(0);
    setSortedCount(0);
    setTeddyStep(0);
    setPuzzleTiles([2, 0, 3, 1]);
    setScienceMix([]);
    setTreasureRevealed([]);
    setBallState({
      x: 24,
      y: 72,
      vx: 0,
      vy: 0,
      isDragging: false,
      dragStartX: 24,
      dragStartY: 72,
    });
  };

  // Smooth Crawling loop for Stage 2 Follow the Toy
  useEffect(() => {
    if (!selectedActivity || selectedActivity.mechanic !== 'follow_toy') return;
    const interval = window.setInterval(() => {
      setBabyCrawlPos((prev) => {
        const dx = toyPos.x - prev.x;
        const dy = toyPos.y - prev.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 7) {
          sound.playBabyLaugh();
          setCharAction('laughing');
          setSessionScore((s) => s + 1);
          setFeedbackBanner(`Hahaha! ${babyName} berhasil menangkap mainannya! 🎉`);
          setToyPos({
            x: 18 + Math.round(Math.random() * 64),
            y: 32 + Math.round(Math.random() * 42),
          });
          return prev;
        }
        setCharAction('crawling');
        return {
          x: prev.x + dx * 0.14,
          y: prev.y + dy * 0.14,
        };
      });
    }, 110);
    return () => clearInterval(interval);
  }, [selectedActivity, toyPos, babyName]);

  // Real-time 2D Ball Physics Loop (Velocity, Gravity, Wall Bounce, Character Catch & Return Throw, Goal/Basket Scoring)
  useEffect(() => {
    if (!selectedActivity || selectedActivity.mechanic !== 'ball_physics') return;
    let rafId: number;

    const stepPhysics = () => {
      setBallState((prev) => {
        if (prev.isDragging || (Math.abs(prev.vx) < 0.08 && Math.abs(prev.vy) < 0.08 && prev.y >= 76)) {
          return prev;
        }

        let nx = prev.x + prev.vx;
        let ny = prev.y + prev.vy;
        let nvx = prev.vx * 0.985;
        let nvy = prev.vy + 0.22; // Gravity

        // Left & Right Wall Bounces
        if (nx <= 8) {
          nx = 8;
          nvx = Math.abs(nvx) * 0.82;
          sound.playClick();
          if (ballMode === 'bounce') setSessionScore((s) => s + 1);
        } else if (nx >= 92) {
          nx = 92;
          nvx = -Math.abs(nvx) * 0.82;
          sound.playClick();
          if (ballMode === 'bounce') setSessionScore((s) => s + 1);
        }

        // Ceiling & Floor Bounces
        if (ny <= 12) {
          ny = 12;
          nvy = Math.abs(nvy) * 0.78;
          sound.playClick();
        } else if (ny >= 78) {
          ny = 78;
          if (Math.abs(nvy) > 0.8) {
            sound.playClick();
            if (ballMode === 'bounce') setSessionScore((s) => s + 1);
          }
          nvy = -Math.abs(nvy) * 0.68;
          nvx *= 0.9;
          if (Math.abs(nvy) < 0.45) nvy = 0;
        }

        // Check Goal Target (Right side x > 82, y between 45 and 78)
        if (ballMode === 'goal' && nx >= 82 && ny >= 44 && ny <= 78 && prev.vx > 0) {
          sound.playCorrect();
          setSessionScore((s) => s + 1);
          setCharAction('happy_jump');
          setFeedbackBanner(`⚽ GOOOL! Tendangan luar biasa bersama ${babyName}!`);
          return { ...prev, x: 24, y: 74, vx: 0, vy: 0 };
        }

        // Check Basket Hoop Target (Right side x between 74 and 88, y between 24 and 40)
        if (ballMode === 'basket' && nx >= 73 && nx <= 89 && ny >= 22 && ny <= 42 && nvy > 0) {
          sound.playCorrect();
          setSessionScore((s) => s + 2);
          setCharAction('clap_hands');
          setFeedbackBanner(`🏀 SWISH! Bola masuk ke keranjang dengan akurat!`);
          return { ...prev, x: 24, y: 74, vx: 0, vy: 0 };
        }

        // Character Catch & Throw Back (Character stands around x=66, y=58..76)
        if (
          ballMode === 'catch' &&
          Math.abs(nx - 66) < 11 &&
          ny >= 44 &&
          ny <= 78 &&
          prev.vx > 0.2
        ) {
          sound.playBabyLaugh();
          setSessionScore((s) => s + 1);
          setCharAction(level <= 2 ? 'crawling' : 'happy_jump');
          setFeedbackBanner(
            `🤲 Hap! ${babyName} menangkap bola lalu melemparkannya kembali kepadamu!`
          );
          // Character throws the ball back in a cheerful arc toward player (left side)
          return {
            ...prev,
            x: 56,
            y: 54,
            vx: -2.2 - Math.random() * 0.8,
            vy: -3.2,
          };
        }

        return {
          ...prev,
          x: nx,
          y: ny,
          vx: nvx,
          vy: nvy,
        };
      });
      rafId = requestAnimationFrame(stepPhysics);
    };

    rafId = requestAnimationFrame(stepPhysics);
    return () => cancelAnimationFrame(rafId);
  }, [selectedActivity, ballMode, babyName, level]);

  const handleFinishAndClaimActivity = (
    customSummary?: string,
    bonusFoodId?: string,
    bonusRegionId?: RegionId
  ) => {
    if (!selectedActivity) return;
    sound.playCorrect();
    const summary =
      customSummary ||
      `Menyelesaikan aktivitas ${selectedActivity.indonesianTitle} bersama ${babyName}.`;
    const scoreText = `Skor: ${Math.max(1, sessionScore)} Bintang`;
    onCompleteActivitySession(
      selectedActivity,
      summary,
      scoreText,
      bonusFoodId,
      bonusRegionId
    );
    setSelectedActivity(null);
  };

  // Finger Painting Canvas Pointer Drawing
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawingCanvas(true);
    ctx.strokeStyle = paintColor;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingCanvas) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleCanvasPointerUp = () => {
    if (!isDrawingCanvas) return;
    setIsDrawingCanvas(false);
    sound.playClick();
    setStrokeCount((c) => c + 1);
    setSessionScore((s) => s + 1);
    setCharAction('clap_hands');
    setFeedbackBanner(`🎨 Wah, goresan warna yang indah! ${babyName} ikut senang melukis!`);
  };

  const currentBook =
    INTERACTIVE_STORYBOOKS.find((b) => b.id === selectedBookId) || INTERACTIVE_STORYBOOKS[0];
  const currentBookPage = currentBook.pages[bookPageIndex] || currentBook.pages[0];

  const currentRecipe =
    INTERACTIVE_COOKING_RECIPES.find((r) => r.id === selectedRecipeId) ||
    INTERACTIVE_COOKING_RECIPES[0];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[1px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-x-0 bottom-14 z-[110] mx-auto w-full max-w-5xl max-h-[48dvh] bg-[#FFFDF9] border-t-3 border-x-3 border-[#2D2520] rounded-t-3xl shadow-[0_-8px_0_#2D2520] flex flex-col overflow-hidden"
      >
        {/* ==================== STICKY MODAL HEADER ==================== */}
        <div className="sticky top-0 z-[115] px-4 sm:px-5 py-2.5 bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200 border-b-2 border-[#2D2520] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">🎪</span>
            <div className="min-w-0">
              <h2 className="font-display text-xs sm:text-base font-extrabold text-[#2D2520] line-clamp-2 leading-tight">
                LET&apos;S PLAY TOGETHER! (Stage {level}/7 · {stageInfo.indonesianTitle})
              </h2>
              <p className="text-[10px] sm:text-xs font-semibold text-[#2D2520]/80 truncate">
                Aktivitas interaktif sesuai tahap usia {babyName}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              if (selectedActivity) {
                setSelectedActivity(null);
              } else {
                onClose();
              }
            }}
            className="relative z-[120] w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-rose-500 hover:bg-rose-600 text-white border-2 border-[#2D2520] flex items-center justify-center shrink-0 cursor-pointer"
            title={selectedActivity ? 'Kembali ke Daftar Aktivitas' : 'Tutup'}
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ==================== IF AN ACTIVITY IS ACTIVE: RENDER INTERACTIVE PLAY STAGE ==================== */}
        {selectedActivity ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Top Activity Status Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50 border-2 border-[#2D2520] rounded-2xl p-3">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">{selectedActivity.iconEmoji}</span>
                <div>
                  <div className="font-display text-sm sm:text-base font-bold text-[#2D2520]">
                    {selectedActivity.title} — {selectedActivity.indonesianTitle}
                  </div>
                  <div className="text-xs font-semibold text-[#6E6259]">
                    💡 {selectedActivity.interactionHint}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-white border-2 border-[#2D2520] font-mono-num text-xs font-bold text-amber-800">
                  ⭐ Aksi Berhasil: {sessionScore}
                </span>
                <button
                  onClick={() => handleFinishAndClaimActivity()}
                  className="px-4 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-500 text-[#2D2520] border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] font-display text-xs sm:text-sm font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Selesai &amp; Klaim (+{selectedActivity.coinReward} 🪙)</span>
                </button>
              </div>
            </div>

            {feedbackBanner && (
              <div className="px-4 py-2.5 rounded-2xl bg-white border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] text-xs sm:text-sm font-bold text-[#2D2520] flex items-center justify-between">
                <span>💬 {feedbackBanner}</span>
                <span className="text-xs font-mono-num text-emerald-700 font-bold">
                  +{selectedActivity.xpReward} XP
                </span>
              </div>
            )}

            {/* ==================== INTERACTIVE MINI-GAME ARENA ==================== */}
            <div
              className={`relative w-full min-h-[360px] rounded-3xl border-3 border-[#2D2520] bg-gradient-to-br ${selectedActivity.bgGradient} p-4 flex flex-col lg:flex-row items-center justify-between gap-6 overflow-hidden`}
            >
              {/* Left / Center: Live 2.5D Character Participating in the Activity */}
              <div className="relative flex flex-col items-center justify-center shrink-0">
                <div className="relative">
                  <BabyCharacterSVG
                    appearance={appearance}
                    gender={gender}
                    level={level}
                    actionState={charAction}
                    isSleeping={false}
                    needsSummary={{
                      isHungry: false,
                      isSleepy: false,
                      isDirty: false,
                      isSad: false,
                    }}
                    sizeClass="w-44 h-52 sm:w-52 sm:h-60"
                  />

                  {/* Peekaboo Hands Covering Baby's Face Overlay */}
                  {selectedActivity.mechanic === 'peekaboo' && handsCoveringFace && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="mt-2 px-5 py-4 rounded-full bg-amber-200/95 border-3 border-[#2D2520] shadow-lg text-4xl animate-pulse">
                        🤲🙈
                      </div>
                    </div>
                  )}
                </div>
                <span className="mt-1 px-3 py-1 rounded-full bg-white/90 border border-[#2D2520] font-display text-xs font-bold text-[#2D2520]">
                  {babyName} ({stageInfo.indonesianTitle})
                </span>
              </div>

              {/* Right: Mechanic-Specific Interactive Controls & Play Canvas */}
              <div className="flex-1 w-full bg-white/90 border-2 border-[#2D2520] rounded-2xl p-4 shadow-[0_4px_0_#2D2520]">
                {/* 1. MECHANIC: PEEKABOO (STAGE 1-2 EXCLUSIVE) */}
                {selectedActivity.mechanic === 'peekaboo' && (
                  <div className="text-center space-y-4 py-4">
                    <div className="text-sm font-bold text-[#2D2520]">
                      Putaran Cilukba: {peekabooCount} kali
                    </div>
                    <p className="text-xs font-semibold text-[#6E6259]">
                      Langkah 1: Tutup wajah dengan kedua tangan. Langkah 2: Tekan &ldquo;CILUKBA!&rdquo; untuk kejutan tawa!
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => {
                          sound.playClick();
                          setHandsCoveringFace(true);
                          setCharAction('curious_head_tilt');
                          setFeedbackBanner(`Ssst... Wajah ${babyName} tertutup tangan... Siap-siap!`);
                        }}
                        disabled={handsCoveringFace}
                        className={`px-5 py-3 rounded-2xl border-2 border-[#2D2520] font-display text-sm font-bold shadow-[0_4px_0_#2D2520] ${
                          handsCoveringFace
                            ? 'bg-stone-200 text-stone-500'
                            : 'bg-amber-300 hover:bg-amber-400 text-[#2D2520]'
                        }`}
                      >
                        🤲 1. Tutup Wajah (Ciluk...)
                      </button>

                      <button
                        onClick={() => {
                          sound.playBabyLaugh();
                          setHandsCoveringFace(false);
                          setPeekabooCount((c) => c + 1);
                          setSessionScore((s) => s + 1);
                          const reactions: BabyActionState[] = [
                            'laughing',
                            'big_smile',
                            'clap_hands',
                            'make_heart',
                          ];
                          setCharAction(reactions[peekabooCount % reactions.length]);
                          setFeedbackBanner(
                            `🎉 CILUK... BAA! Mata ${babyName} berbinar dan tertawa geli!`
                          );
                        }}
                        disabled={!handsCoveringFace}
                        className={`px-6 py-3 rounded-2xl border-2 border-[#2D2520] font-display text-sm font-bold shadow-[0_4px_0_#2D2520] ${
                          !handsCoveringFace
                            ? 'bg-stone-200 text-stone-500'
                            : 'bg-pink-400 hover:bg-pink-500 text-white animate-bounce'
                        }`}
                      >
                        🎉 2. CILUKBA! (Buka Tangan)
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. MECHANIC: LULLABY / GENTLE MUSIC / MUSIC STUDIO PIANO */}
                {selectedActivity.mechanic === 'lullaby_music' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-display text-xs sm:text-sm font-bold text-[#2D2520]">
                        🎵 Pilih Lagu Orisinal &amp; Tekan Tuts Piano Virtual:
                      </span>
                      <div className="flex gap-1.5">
                        {['Bintang Kecil Bersinar', 'Pelangi Nusantara', 'Mimpi Indah Sayang'].map(
                          (song) => (
                            <button
                              key={song}
                              onClick={() => {
                                sound.playSleepChime();
                                setSelectedSongName(song);
                                setFeedbackBanner(`🎶 Memutar melodi "${song}"...`);
                              }}
                              className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold ${
                                selectedSongName === song
                                  ? 'bg-indigo-600 text-white border-[#2D2520]'
                                  : 'bg-stone-100 text-[#2D2520] border-stone-300'
                              }`}
                            >
                              {song}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Interactive 8-Note Rainbow Xylophone / Piano Keys */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-2">
                      {[
                        { note: 'Do', color: 'bg-rose-400' },
                        { note: 'Re', color: 'bg-orange-400' },
                        { note: 'Mi', color: 'bg-amber-300' },
                        { note: 'Fa', color: 'bg-emerald-400' },
                        { note: 'Sol', color: 'bg-teal-400' },
                        { note: 'La', color: 'bg-sky-400' },
                        { note: 'Si', color: 'bg-indigo-400' },
                        { note: 'Do+', color: 'bg-pink-400' },
                      ].map((k, idx) => (
                        <button
                          key={k.note}
                          onClick={() => {
                            if (idx % 2 === 0) sound.playSleepChime();
                            else sound.playCorrect();
                            setPlayedNotesCount((n) => n + 1);
                            setSessionScore((s) => s + 1);
                            setCharAction(idx % 2 === 0 ? 'dancing' : 'clap_hands');
                            setFeedbackBanner(
                              `🎹 Nada ${k.note}! (${playedNotesCount + 1} ketukan melodi dimainkan)`
                            );
                          }}
                          className={`h-24 rounded-2xl ${k.color} hover:opacity-90 active:translate-y-1 border-2 border-[#2D2520] shadow-[0_4px_0_#2D2520] flex flex-col items-center justify-end pb-3 font-display text-xs font-extrabold text-[#2D2520]`}
                        >
                          <span>🎵</span>
                          <span>{k.note}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. MECHANIC: BABY TALK */}
                {selectedActivity.mechanic === 'baby_talk' && (
                  <div className="space-y-3">
                    <div className="font-display text-xs sm:text-sm font-bold text-[#2D2520]">
                      🎙️ Sentuh Kalimat Kasih Sayang untuk Berbicara dengan {babyName}:
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          phrase: 'Halo bayi sayang!',
                          reply: 'Baa~ Halo juga! Aku senang sekali mendengar suaramu!',
                          pose: 'make_heart' as BabyActionState,
                        },
                        {
                          phrase: 'Anak pintar & lucu!',
                          reply: 'Hehe! Terima kasih! Tepuk tangan gembira!',
                          pose: 'clap_hands' as BabyActionState,
                        },
                        {
                          phrase: 'Cilukba, senyum dong!',
                          reply: 'Hihihi! Aku sudah tersenyum lebar untukmu!',
                          pose: 'big_smile' as BabyActionState,
                        },
                        {
                          phrase: 'Peluk hangat dulu ya!',
                          reply: 'Sayang juga! Pelukanmu hangat sekali!',
                          pose: 'screen_touch' as BabyActionState,
                        },
                      ].map((item) => (
                        <button
                          key={item.phrase}
                          onClick={() => {
                            setCharAction(item.pose);
                            setSessionScore((s) => s + 1);
                            setFeedbackBanner(`💬 ${babyName}: "${item.reply}"`);
                            speakCharacterVoiceResponse(item.reply, level, 'love', true);
                          }}
                          className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] text-left text-xs font-bold text-[#2D2520]"
                        >
                          🗣️ &ldquo;{item.phrase}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. MECHANIC: SOFT TOY WATCHING (STAGE 1) */}
                {selectedActivity.mechanic === 'soft_toy_watch' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display text-xs sm:text-sm font-bold text-[#2D2520]">
                        🎠 Geser Mainan Gantung ke Kiri &amp; Kanan:
                      </span>
                      <div className="flex gap-1.5">
                        {(['🎠', '🌟', '🦋', '🌙'] as const).map((em) => (
                          <button
                            key={em}
                            onClick={() => setSelectedHangingToy(em)}
                            className={`w-8 h-8 rounded-xl border text-lg flex items-center justify-center ${
                              selectedHangingToy === em
                                ? 'bg-amber-200 border-[#2D2520]'
                                : 'bg-white border-stone-300'
                            }`}
                          >
                            {em}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative h-36 rounded-2xl bg-sky-50 border-2 border-[#2D2520] overflow-hidden flex flex-col items-center justify-center">
                      <div
                        style={{ left: `${toyPos.x}%` }}
                        className="absolute top-2 -translate-x-1/2 flex flex-col items-center transition-all duration-150"
                      >
                        <div className="w-0.5 h-8 bg-[#2D2520]" />
                        <div className="text-4xl animate-bounce">{selectedHangingToy}</div>
                      </div>
                      <div className="mt-16 text-xs font-bold text-[#6E6259]">
                        Mata &amp; tangan mungil {babyName} mengikuti posisi mainan ({toyPos.x}%)
                      </div>
                    </div>

                    <input
                      type="range"
                      min={15}
                      max={85}
                      value={toyPos.x}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setToyPos({ x: val, y: 45 });
                        setSessionScore((s) => s + 1);
                        setCharAction(val < 45 ? 'curious_head_tilt' : 'waving');
                        sound.playBabyBabble();
                      }}
                      className="w-full accent-pink-500 cursor-pointer"
                    />
                  </div>
                )}

                {/* 5. MECHANIC: FOLLOW THE TOY (STAGE 2 CRAWLING) */}
                {selectedActivity.mechanic === 'follow_toy' && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-[#2D2520]">
                      🚼 Klik/Sentuh area karpet di bawah untuk memindahkan mainan — {babyName} akan merangkak mengejarnya!
                    </div>
                    <div
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const xPct = Math.max(
                          12,
                          Math.min(88, Math.round(((e.clientX - rect.left) / rect.width) * 100))
                        );
                        const yPct = Math.max(
                          20,
                          Math.min(82, Math.round(((e.clientY - rect.top) / rect.height) * 100))
                        );
                        sound.playClick();
                        setToyPos({ x: xPct, y: yPct });
                      }}
                      className="relative h-48 rounded-2xl bg-emerald-50 border-2 border-[#2D2520] cursor-pointer overflow-hidden"
                    >
                      {/* Target Toy */}
                      <div
                        style={{ left: `${toyPos.x}%`, top: `${toyPos.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 text-3xl animate-bounce"
                      >
                        🧸
                      </div>
                      {/* Crawling Baby Marker */}
                      <div
                        style={{ left: `${babyCrawlPos.x}%`, top: `${babyCrawlPos.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full bg-amber-300 border-2 border-[#2D2520] text-xs font-bold shadow"
                      >
                        🚼 {babyName}
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. MECHANIC: PAT-A-CAKE (STAGE 2) */}
                {selectedActivity.mechanic === 'pat_a_cake' && (
                  <div className="text-center space-y-4 py-3">
                    <div className="text-xs sm:text-sm font-bold text-[#2D2520]">
                      👏 Sentuh Tangan Kiri &amp; Tangan Kanan secara bergantian sesuai giliran!
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => {
                          sound.playClick();
                          setPatTargetHand('right');
                          setSessionScore((s) => s + 1);
                          setCharAction('waving');
                          setFeedbackBanner('🖐️ Tepuk Tangan Kiri! Sekarang giliran Tangan Kanan!');
                        }}
                        className={`px-5 py-4 rounded-2xl border-2 border-[#2D2520] font-display text-sm font-bold shadow-[0_4px_0_#2D2520] ${
                          patTargetHand === 'left'
                            ? 'bg-pink-400 text-white animate-bounce'
                            : 'bg-stone-100 text-[#2D2520]'
                        }`}
                      >
                        🤚 Tangan Kiri
                      </button>

                      <button
                        onClick={() => {
                          sound.playBabyLaugh();
                          setPatTargetHand('left');
                          setSessionScore((s) => s + 1);
                          setCharAction('clap_hands');
                          setFeedbackBanner('👏 Plok-plok! Tepuk Tangan Kanan! Irama yang kompak!');
                        }}
                        className={`px-5 py-4 rounded-2xl border-2 border-[#2D2520] font-display text-sm font-bold shadow-[0_4px_0_#2D2520] ${
                          patTargetHand === 'right'
                            ? 'bg-amber-300 text-[#2D2520] animate-bounce'
                            : 'bg-stone-100 text-[#2D2520]'
                        }`}
                      >
                        ✋ Tangan Kanan
                      </button>
                    </div>
                  </div>
                )}

                {/* 7. MECHANIC: HIDE THE TOY (STAGE 2-3) */}
                {selectedActivity.mechanic === 'hide_the_toy' && (
                  <div className="space-y-3 text-center">
                    <div className="text-xs sm:text-sm font-bold text-[#2D2520]">
                      🛋️ Pilih salah satu Bantal untuk mencari di mana Boneka Bintang bersembunyi!
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-2">
                      {[0, 1, 2].map((spotIdx) => {
                        const isRevealed = revealedSpot === spotIdx;
                        const hasToy = spotIdx === hiddenToySpot;
                        return (
                          <button
                            key={spotIdx}
                            onClick={() => {
                              setRevealedSpot(spotIdx);
                              if (hasToy) {
                                sound.playBabyLaugh();
                                setSessionScore((s) => s + 1);
                                setCharAction('surprised');
                                setFeedbackBanner(
                                  `🌟 Ketemu! ${babyName} terkejut senang menemukan mainan di balik Bantal ${
                                    spotIdx + 1
                                  }!`
                                );
                                setTimeout(() => {
                                  setRevealedSpot(null);
                                  setHiddenToySpot(Math.floor(Math.random() * 3));
                                }, 1200);
                              } else {
                                sound.playClick();
                                setCharAction('curious_head_tilt');
                                setFeedbackBanner(
                                  `Hmm, bukan di Bantal ${spotIdx + 1}! Ayo buka bantal lainnya!`
                                );
                              }
                            }}
                            className="h-28 rounded-2xl bg-purple-100 hover:bg-purple-200 border-2 border-[#2D2520] shadow-[0_4px_0_#2D2520] flex flex-col items-center justify-center gap-1 font-display text-xs font-bold"
                          >
                            <span className="text-3xl">
                              {isRevealed ? (hasToy ? '🌟🧸' : '💨') : '🛋️'}
                            </span>
                            <span>Bantal {spotIdx + 1}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 8. MECHANIC: TOWER BLOCKS (STAGE 2-3) */}
                {selectedActivity.mechanic === 'tower_blocks' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-display text-xs sm:text-sm font-bold text-[#2D2520]">
                        🧱 Pilih Balok untuk Menyusun Menara ({stackedBlocks.length}/6):
                      </span>
                      <div className="flex gap-1.5">
                        {[
                          { label: 'Merah', color: '#F43F5E' },
                          { label: 'Kuning', color: '#FACC15' },
                          { label: 'Biru', color: '#38BDF8' },
                          { label: 'Hijau', color: '#34D399' },
                        ].map((b) => (
                          <button
                            key={b.label}
                            onClick={() => {
                              sound.playClick();
                              setTowerCollapsed(false);
                              if (stackedBlocks.length >= 6) {
                                sound.playBabyLaugh();
                                setTowerCollapsed(true);
                                setStackedBlocks([]);
                                setCharAction('laughing');
                                setFeedbackBanner(
                                  `💥 BRUK! Menara tinggi disentuh ${babyName} dan roboh dengan lucu!`
                                );
                                return;
                              }
                              setStackedBlocks((prev) => [
                                ...prev,
                                { id: `blk_${Date.now()}`, color: b.color, label: b.label },
                              ]);
                              setSessionScore((s) => s + 1);
                              setCharAction('clap_hands');
                            }}
                            style={{ backgroundColor: b.color }}
                            className="px-3 py-1.5 rounded-xl border-2 border-[#2D2520] font-display text-xs font-bold text-[#2D2520] shadow-[0_2px_0_#2D2520]"
                          >
                            + Balok {b.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Visual Block Tower Stack */}
                    <div className="h-44 rounded-2xl bg-amber-50 border-2 border-[#2D2520] flex flex-col-reverse items-center justify-start p-3 gap-1 overflow-hidden">
                      {towerCollapsed ? (
                        <div className="my-auto text-center font-display text-sm font-bold text-rose-600 animate-bounce">
                          💥🧱🧱🧱 Menara Roboh! Hahaha! Klik balok untuk menyusun lagi!
                        </div>
                      ) : stackedBlocks.length === 0 ? (
                        <div className="my-auto text-xs font-semibold text-[#6E6259]">
                          Klik tombol warna balok di atas untuk mulai menyusun menara!
                        </div>
                      ) : (
                        stackedBlocks.map((blk, i) => (
                          <div
                            key={blk.id}
                            style={{
                              backgroundColor: blk.color,
                              width: `${150 - i * 14}px`,
                            }}
                            className="h-6 rounded-lg border-2 border-[#2D2520] flex items-center justify-center text-[10px] font-bold text-[#2D2520] shadow"
                          >
                            {blk.label}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 9. MECHANIC: BALL PLAY PHYSICS (STAGE 2, 4, 5, 6) */}
                {selectedActivity.mechanic === 'ball_physics' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {/* 4 Modes Selector */}
                      <div className="flex flex-wrap gap-1">
                        {(
                          [
                            { id: 'catch', label: '1. Lempar & Tangkap' },
                            { id: 'goal', label: '2. Tendang ke Gawang' },
                            { id: 'bounce', label: '3. Pantulkan Bola' },
                            { id: 'basket', label: '4. Bola Keranjang' },
                          ] as const
                        ).map((m) => (
                          <button
                            key={m.id}
                            onClick={() => {
                              sound.playClick();
                              setBallMode(m.id);
                            }}
                            className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold ${
                              ballMode === m.id
                                ? 'bg-emerald-500 text-white border-[#2D2520]'
                                : 'bg-stone-100 text-[#2D2520] border-stone-300'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>

                      {/* Ball Design Motif Selector */}
                      <div className="flex items-center gap-1">
                        {BALL_DESIGNS.map((bd) => (
                          <button
                            key={bd.id}
                            onClick={() => setSelectedBall(bd)}
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center text-sm ${
                              selectedBall.id === bd.id
                                ? 'bg-amber-200 border-[#2D2520]'
                                : 'bg-white border-stone-300'
                            }`}
                            title={bd.name}
                          >
                            {bd.emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Physics Arena: Touch/Drag Ball & Release to Launch */}
                    <div
                      ref={ballArenaRef}
                      onPointerMove={(e) => {
                        if (!ballState.isDragging || !ballArenaRef.current) return;
                        const rect = ballArenaRef.current.getBoundingClientRect();
                        const xPct = Math.max(
                          8,
                          Math.min(85, ((e.clientX - rect.left) / rect.width) * 100)
                        );
                        const yPct = Math.max(
                          14,
                          Math.min(78, ((e.clientY - rect.top) / rect.height) * 100)
                        );
                        setBallState((prev) => ({ ...prev, x: xPct, y: yPct }));
                      }}
                      onPointerUp={() => {
                        if (!ballState.isDragging) return;
                        sound.playClick();
                        setBallState((prev) => {
                          const pullDx = prev.dragStartX - prev.x;
                          const pullDy = prev.dragStartY - prev.y;
                          // Launch either by slingshot pull or forward toss toward right
                          const launchVx =
                            Math.abs(pullDx) > 3 ? pullDx * 0.22 : 2.8 + Math.random() * 1.2;
                          const launchVy =
                            Math.abs(pullDy) > 3 ? pullDy * 0.22 : -3.4 - Math.random();
                          return {
                            ...prev,
                            isDragging: false,
                            vx: launchVx,
                            vy: launchVy,
                          };
                        });
                      }}
                      className="relative h-52 rounded-2xl bg-gradient-to-b from-sky-100 to-emerald-100 border-2 border-[#2D2520] overflow-hidden select-none touch-none"
                    >
                      <div className="absolute top-2 left-3 text-[11px] font-bold text-[#2D2520]/80">
                        👆 Sentuh, seret bola, lalu lepaskan! (Atau klik tombol Lempar/Tendang di bawah)
                      </div>

                      {/* Target Visuals per Mode */}
                      {ballMode === 'goal' && (
                        <div className="absolute right-1 bottom-4 w-14 h-24 border-4 border-white bg-white/30 rounded-l-xl flex items-center justify-center text-xs font-extrabold text-emerald-900">
                          🥅 GAWANG
                        </div>
                      )}
                      {ballMode === 'basket' && (
                        <div className="absolute right-4 top-8 w-14 h-10 border-4 border-orange-500 bg-orange-100/60 rounded-b-xl flex items-center justify-center text-xs font-extrabold text-orange-900">
                          🏀 RING
                        </div>
                      )}
                      {ballMode === 'catch' && (
                        <div className="absolute right-12 bottom-5 px-3 py-2 rounded-2xl bg-amber-200/90 border-2 border-[#2D2520] text-xs font-bold">
                          🤲 {babyName} Siap Menangkap!
                        </div>
                      )}

                      {/* Ball Ground Shadow */}
                      <div
                        style={{
                          left: `${ballState.x}%`,
                          top: '84%',
                          transform: `translate(-50%, -50%) scale(${Math.max(
                            0.45,
                            ballState.y / 80
                          )})`,
                        }}
                        className="absolute w-10 h-3 rounded-full bg-black/25 pointer-events-none"
                      />

                      {/* Draggable Physics Ball */}
                      <div
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          setBallState((prev) => ({
                            ...prev,
                            isDragging: true,
                            vx: 0,
                            vy: 0,
                            dragStartX: prev.x,
                            dragStartY: prev.y,
                          }));
                        }}
                        style={{
                          left: `${ballState.x}%`,
                          top: `${ballState.y}%`,
                          backgroundColor: selectedBall.color,
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-[#2D2520] shadow-md flex items-center justify-center text-2xl cursor-grab active:cursor-grabbing"
                      >
                        {selectedBall.emoji}
                      </div>
                    </div>

                    {/* Quick Launch Buttons for Convenience on All Devices */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          sound.playClick();
                          setCharAction('happy_jump');
                          setBallState({
                            x: 22,
                            y: 68,
                            vx: 3.1,
                            vy: ballMode === 'basket' ? -4.4 : -2.8,
                            isDragging: false,
                            dragStartX: 22,
                            dragStartY: 68,
                          });
                        }}
                        className="px-4 py-2 rounded-xl bg-amber-300 hover:bg-amber-400 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] font-display text-xs font-bold text-[#2D2520]"
                      >
                        🚀 Lempar / Tendang Bola Sekarang!
                      </button>

                      <button
                        onClick={() =>
                          setBallState({
                            x: 24,
                            y: 72,
                            vx: 0,
                            vy: 0,
                            isDragging: false,
                            dragStartX: 24,
                            dragStartY: 72,
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-[#2D2520] text-xs font-bold flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Posisi Bola</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 10. MECHANIC: STORYBOOK ADVENTURE READER (6 CATEGORIES + PAGE TURN + AUDIO) */}
                {selectedActivity.mechanic === 'storybook_reader' && (
                  <div className="space-y-3">
                    {/* Bookshelf Category Selector */}
                    <div className="flex flex-wrap gap-1.5">
                      {INTERACTIVE_STORYBOOKS.map((bk) => (
                        <button
                          key={bk.id}
                          onClick={() => {
                            sound.playClick();
                            setSelectedBookId(bk.id);
                            setBookPageIndex(0);
                            setCharAction('reading');
                          }}
                          className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1 ${
                            selectedBookId === bk.id
                              ? 'bg-amber-300 border-[#2D2520] text-[#2D2520] shadow-[0_2px_0_#2D2520]'
                              : 'bg-stone-100 border-stone-300 text-[#6E6259]'
                          }`}
                        >
                          <span>{bk.coverEmoji}</span>
                          <span>{bk.category}</span>
                        </button>
                      ))}
                    </div>

                    {/* Open Book Animated Page Spread */}
                    <div className="p-4 rounded-2xl bg-[#FFFBEB] border-2 border-[#2D2520] shadow-inner space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                        <span>
                          📖 {currentBook.title} ({currentBook.category})
                        </span>
                        <span>
                          Halaman {currentBookPage.pageNumber} / {currentBook.pages.length}
                        </span>
                      </div>

                      <div className="py-3 px-4 rounded-xl bg-white border border-amber-300 flex flex-col sm:flex-row items-center gap-4">
                        <div className="text-4xl sm:text-5xl animate-bounce shrink-0">
                          {currentBookPage.illustrationEmoji}
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-display text-sm font-bold text-[#2D2520]">
                            {currentBookPage.heading}
                          </h4>
                          <p className="text-xs sm:text-sm font-medium text-[#2D2520]/90 leading-relaxed">
                            {currentBookPage.text}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() =>
                            speakCharacterVoiceResponse(
                              `${currentBookPage.heading}. ${currentBookPage.text}`,
                              level,
                              'happy',
                              true
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 border border-[#2D2520] text-xs font-bold text-sky-900 flex items-center gap-1.5"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Bacakan Narasi Suara</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            disabled={bookPageIndex === 0}
                            onClick={() => {
                              sound.playClick();
                              setBookPageIndex((p) => Math.max(0, p - 1));
                            }}
                            className="px-3 py-1.5 rounded-xl bg-stone-200 disabled:opacity-40 border border-[#2D2520] text-xs font-bold"
                          >
                            ◀ Halaman Sebelumnya
                          </button>
                          <button
                            onClick={() => {
                              sound.playClick();
                              setSessionScore((s) => s + 1);
                              setFeedbackBanner(`💭 ${babyName}: "${currentBookPage.characterComment}"`);
                              if (bookPageIndex < currentBook.pages.length - 1) {
                                setBookPageIndex((p) => p + 1);
                              } else {
                                setCharAction('proud');
                              }
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-300 hover:bg-amber-400 border-2 border-[#2D2520] text-xs font-bold shadow-[0_2px_0_#2D2520]"
                          >
                            {bookPageIndex < currentBook.pages.length - 1
                              ? 'Balik Halaman Berikutnya ▶'
                              : '✨ Selesai Baca Buku!'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. MECHANIC: COOKING TOGETHER & MASTER COOKING */}
                {selectedActivity.mechanic === 'cooking_kitchen' && (
                  <div className="space-y-3">
                    {/* Recipe Picker */}
                    <div className="flex flex-wrap gap-1.5">
                      {availableRecipes.map((rec) => (
                        <button
                          key={rec.id}
                          onClick={() => {
                            sound.playClick();
                            setSelectedRecipeId(rec.id);
                            setAddedIngredients([]);
                            setStirProgress(0);
                            setDishCooked(false);
                          }}
                          className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1 ${
                            selectedRecipeId === rec.id
                              ? 'bg-orange-400 text-white border-[#2D2520]'
                              : 'bg-stone-100 text-[#2D2520] border-stone-300'
                          }`}
                        >
                          <span>{rec.iconEmoji}</span>
                          <span>{rec.name}</span>
                        </button>
                      ))}
                    </div>

                    <div className="p-3 rounded-2xl bg-orange-50 border-2 border-[#2D2520] space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-xs font-bold text-[#2D2520]">
                        <span>
                          🍳 Resep: {currentRecipe.name} ({currentRecipe.category} ·{' '}
                          {currentRecipe.regionOrigin})
                        </span>
                        <span>
                          Alat Masak: {currentRecipe.toolEmoji} {currentRecipe.toolName}
                        </span>
                      </div>

                      {/* Step 1: Click/Drag Ingredients to Cooking Table */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-[#6E6259]">
                          1. Masukkan Bahan:
                        </span>
                        {currentRecipe.ingredients.map((ing) => {
                          const isAdded = addedIngredients.includes(ing.id);
                          return (
                            <button
                              key={ing.id}
                              onClick={() => {
                                if (isAdded) return;
                                sound.playClick();
                                setAddedIngredients((prev) => [...prev, ing.id]);
                                setSessionScore((s) => s + 1);
                                setCharAction('cooking');
                                setFeedbackBanner(
                                  `🥣 Menambahkan ${ing.name} ke dalam ${currentRecipe.toolName}!`
                                );
                              }}
                              className={`px-3 py-1.5 rounded-xl border-2 text-xs font-bold flex items-center gap-1.5 ${
                                isAdded
                                  ? 'bg-emerald-100 border-emerald-600 text-emerald-900'
                                  : 'bg-white hover:bg-amber-100 border-[#2D2520]'
                              }`}
                            >
                              <span>{ing.emoji}</span>
                              <span>{ing.name}</span>
                              {isAdded && <span>✅</span>}
                            </button>
                          );
                        })}
                      </div>

                      {/* Step 2: Stir & Cook Progress */}
                      {addedIngredients.length === currentRecipe.ingredients.length &&
                        !dishCooked && (
                          <div className="flex items-center justify-between gap-3 pt-1">
                            <div className="flex-1 h-3 rounded-full bg-stone-200 border border-[#2D2520] overflow-hidden">
                              <div
                                style={{ width: `${stirProgress}%` }}
                                className="h-full bg-orange-500 transition-all"
                              />
                            </div>
                            <button
                              onClick={() => {
                                sound.playEatDrink();
                                const next = Math.min(100, stirProgress + 35);
                                setStirProgress(next);
                                setSessionScore((s) => s + 1);
                                if (next >= 100) {
                                  setDishCooked(true);
                                  setCharAction('proud');
                                  setFeedbackBanner(
                                    `🍽️ Harum sekali! ${currentRecipe.name} sudah matang dan siap disajikan!`
                                  );
                                }
                              }}
                              className="px-4 py-1.5 rounded-xl bg-amber-300 hover:bg-amber-400 border-2 border-[#2D2520] font-display text-xs font-bold shadow-[0_2px_0_#2D2520]"
                            >
                              🥄 2. Aduk &amp; Masak ({stirProgress}%)
                            </button>
                          </div>
                        )}

                      {/* Step 3: Plate Decoration & Claim Prepared Food into Inventory */}
                      {dishCooked && (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <div className="flex items-center gap-2">
                            <div
                              style={{ backgroundColor: plateColor }}
                              className="px-4 py-2 rounded-full border-2 border-[#2D2520] text-2xl shadow"
                            >
                              {currentRecipe.iconEmoji}✨
                            </div>
                            <div className="flex gap-1">
                              {['#FFFBEB', '#FCE7F3', '#E0F2FE', '#D1FAE5'].map((c) => (
                                <button
                                  key={c}
                                  onClick={() => setPlateColor(c)}
                                  style={{ backgroundColor: c }}
                                  className="w-6 h-6 rounded-full border border-[#2D2520]"
                                  title="Ganti Warna Piring Saji"
                                />
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              handleFinishAndClaimActivity(
                                `Berhasil memasak dan menyajikan ${currentRecipe.name} bersama ${babyName}!`,
                                currentRecipe.linkedStoreFoodId
                              )
                            }
                            className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-500 border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] font-display text-xs font-bold"
                          >
                            🍽️ Sajikan &amp; Simpan Masakan (+1 Stok Makanan)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 12. MECHANIC: FINGER PAINTING & ART STUDIO */}
                {selectedActivity.mechanic === 'finger_painting' && (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-display text-xs font-bold text-[#2D2520]">
                        🎨 Sentuh &amp; Seret di Kanvas untuk Melukis ({strokeCount} goresan):
                      </span>
                      <div className="flex items-center gap-1.5">
                        {['#F43F5E', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#2D2520'].map(
                          (col) => (
                            <button
                              key={col}
                              onClick={() => setPaintColor(col)}
                              style={{ backgroundColor: col }}
                              className={`w-6 h-6 rounded-full border-2 ${
                                paintColor === col
                                  ? 'border-[#2D2520] scale-110'
                                  : 'border-white'
                              }`}
                            />
                          )
                        )}
                      </div>
                    </div>

                    <canvas
                      ref={canvasRef}
                      width={460}
                      height={175}
                      onPointerDown={handleCanvasPointerDown}
                      onPointerMove={handleCanvasPointerMove}
                      onPointerUp={handleCanvasPointerUp}
                      className="w-full h-44 rounded-2xl bg-white border-2 border-[#2D2520] cursor-crosshair touch-none"
                    />
                  </div>
                )}

                {/* 13. MECHANIC: GARDENING & BOTANICAL FARM */}
                {selectedActivity.mechanic === 'gardening_farm' && (
                  <div className="space-y-3">
                    <div className="font-display text-xs sm:text-sm font-bold text-[#2D2520]">
                      🌱 Klik Pot Kebun untuk Menanam Benih, Menyiram Air, hingga Panen!
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {gardenPlots.map((plot) => {
                        const stageEmojis = ['🪴 Tanah Kosong', '🌱 Tunas Muda', '🌿 Berbunga', '🌻🍅 Siap Panen!'];
                        return (
                          <button
                            key={plot.id}
                            onClick={() => {
                              sound.playSplash();
                              setSessionScore((s) => s + 1);
                              setCharAction('clap_hands');
                              setGardenPlots((prev) =>
                                prev.map((p) =>
                                  p.id === plot.id
                                    ? {
                                        ...p,
                                        stage: ((p.stage + 1) % 4) as 0 | 1 | 2 | 3,
                                      }
                                    : p
                                )
                              );
                              setFeedbackBanner(
                                plot.stage === 2
                                  ? `🎉 Tanaman ${plot.seed} tumbuh subur dan siap dipanen!`
                                  : `💧 Menyiram dan merawat ${plot.seed} bersama ${babyName}!`
                              );
                            }}
                            className="p-3 rounded-2xl bg-lime-50 hover:bg-lime-100 border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] flex flex-col items-center gap-1.5 text-center"
                          >
                            <span className="text-xs font-bold text-emerald-900">{plot.seed}</span>
                            <span className="text-2xl">{stageEmojis[plot.stage].split(' ')[0]}</span>
                            <span className="text-[11px] font-bold text-[#2D2520]">
                              {plot.stage === 0
                                ? '1. Tanam Benih'
                                : plot.stage === 1
                                ? '2. Siram Air 💧'
                                : plot.stage === 2
                                ? '3. Beri Pupuk ☀️'
                                : '4. Panen Hasil! 🧺'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 14. MECHANIC: ANIMAL SOUNDS / SORTING TOYS / TEDDY CARE */}
                {selectedActivity.mechanic === 'animal_sounds' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { name: 'Kucing Lucu', emoji: '🐱', soundText: 'Meooong~!' },
                      { name: 'Anak Bebek', emoji: '🦆', soundText: 'Kwek kwek kwek!' },
                      { name: 'Sapi Perah', emoji: '🐮', soundText: 'Moooo~!' },
                      { name: 'Singa Kecil', emoji: '🦁', soundText: 'Raaawr hehe!' },
                    ].map((an) => (
                      <button
                        key={an.name}
                        onClick={() => {
                          sound.playBabyLaugh();
                          setSessionScore((s) => s + 1);
                          setCharAction('laughing');
                          setFeedbackBanner(
                            `${an.emoji} ${an.name}: "${an.soundText}" — ${babyName} menirukan suaranya dengan gembira!`
                          );
                          speakCharacterVoiceResponse(an.soundText, level, 'happy', true);
                        }}
                        className="p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] flex flex-col items-center gap-1"
                      >
                        <span className="text-3xl">{an.emoji}</span>
                        <span className="text-xs font-bold text-[#2D2520]">{an.name}</span>
                        <span className="text-[10px] font-semibold text-emerald-800">
                          &ldquo;{an.soundText}&rdquo;
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedActivity.mechanic === 'sorting_toys' && (
                  <div className="space-y-3 text-center">
                    <div className="text-xs sm:text-sm font-bold text-[#2D2520]">
                      🧺 Masukkan Mainan ke Kotak Warna yang Sesuai ({sortedCount} mainan rapi):
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { box: 'Kotak Merah', toy: '🚗 Mobil Merah', bg: 'bg-rose-100' },
                        { box: 'Kotak Kuning', toy: '🦆 Bebek Kuning', bg: 'bg-amber-100' },
                        { box: 'Kotak Biru', toy: '✈️ Pesawat Biru', bg: 'bg-sky-100' },
                      ].map((b) => (
                        <button
                          key={b.box}
                          onClick={() => {
                            sound.playCorrect();
                            setSortedCount((c) => c + 1);
                            setSessionScore((s) => s + 1);
                            setCharAction('clap_hands');
                            setFeedbackBanner(
                              `👏 Hore! ${b.toy} dimasukkan dengan rapi ke dalam ${b.box}!`
                            );
                          }}
                          className={`p-3 rounded-2xl ${b.bg} hover:opacity-90 border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] flex flex-col items-center gap-1 font-display text-xs font-bold`}
                        >
                          <span className="text-xl">{b.toy}</span>
                          <span>⬇ Masukkan ke {b.box}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedActivity.mechanic === 'teddy_care' && (
                  <div className="space-y-3 text-center">
                    <div className="text-xs sm:text-sm font-bold text-[#2D2520]">
                      🧸 Rawat Boneka Beruang Kesayangan Bersama {babyName}:
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { step: 1, label: '1. Gendong Boneka', emoji: '🤗🧸' },
                        { step: 2, label: '2. Pasang Selimut', emoji: '🧣🧸' },
                        { step: 3, label: '3. Tidurkan Nyenyak', emoji: '💤🧸' },
                      ].map((st) => (
                        <button
                          key={st.step}
                          onClick={() => {
                            sound.playSleepChime();
                            setTeddyStep(st.step);
                            setSessionScore((s) => s + 1);
                            setCharAction('loved');
                            setFeedbackBanner(
                              `💖 ${babyName} dengan lembut melakukan: ${st.label}! (${
                                teddyStep + 1
                              } aksi kasih sayang)`
                            );
                          }}
                          className="p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] flex flex-col items-center gap-1 font-display text-xs font-bold"
                        >
                          <span className="text-3xl">{st.emoji}</span>
                          <span>{st.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 15. MECHANIC: PUZZLE / DANCE / SCIENCE / TREASURE / PHOTO / HOME DESIGN / BATIK / TRAVEL */}
                {selectedActivity.mechanic === 'puzzle_board' && (
                  <div className="space-y-3 text-center">
                    <div className="text-xs font-bold text-[#2D2520]">
                      🧩 Klik Kepingan Puzzle untuk Menyusun Urutan Gambar Budaya Nusantara (1 - 2 - 3 - 4):
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                      {puzzleTiles.map((tileVal, idx) => {
                        const tileLabels = [
                          '1️⃣ Rumah Gadang',
                          '2️⃣ Candi Borobudur',
                          '3️⃣ Burung Cenderawasih',
                          '4️⃣ Wayang & Batik',
                        ];
                        return (
                          <button
                            key={tileVal}
                            onClick={() => {
                              sound.playClick();
                              const next = [...puzzleTiles];
                              const swapIdx = (idx + 1) % next.length;
                              [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
                              setPuzzleTiles(next);
                              setSessionScore((s) => s + 1);
                              if (next.every((v, i) => v === i)) {
                                sound.playCorrect();
                                setCharAction('proud');
                                setFeedbackBanner('🏆 Luar biasa! Puzzle Budaya Nusantara tersusun sempurna!');
                              }
                            }}
                            className={`p-3 rounded-xl border-2 border-[#2D2520] font-display text-xs font-bold ${
                              tileVal === idx ? 'bg-emerald-200' : 'bg-amber-100'
                            }`}
                          >
                            {tileLabels[tileVal]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedActivity.mechanic === 'dance_rhythm' && (
                  <div className="space-y-3 text-center">
                    <div className="text-xs font-bold text-[#2D2520]">
                      💃 Sentuh Gerakan Koreografi Sesuai Irama Musik!
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: '✨ Putar Badan', pose: 'dancing' as BabyActionState },
                        { label: '🙌 Lompat Irama', pose: 'happy_jump' as BabyActionState },
                        { label: '👏 Tepuk Harmoni', pose: 'clap_hands' as BabyActionState },
                        { label: '💖 Pose Hati', pose: 'make_heart' as BabyActionState },
                      ].map((mv) => (
                        <button
                          key={mv.label}
                          onClick={() => {
                            sound.playCorrect();
                            setCharAction(mv.pose);
                            setSessionScore((s) => s + 1);
                            setFeedbackBanner(`🎶 Gerakan ${mv.label} tampil kompak dan memukau!`);
                          }}
                          className="p-3 rounded-2xl bg-pink-100 hover:bg-pink-200 border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] font-display text-xs font-bold"
                        >
                          {mv.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedActivity.mechanic === 'science_lab' && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-[#2D2520]">
                      🔬 Pilih 2 Tabung Warna atau Eksperimen Magnet untuk Mengamati Reaksi Sains Aman:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'Merah', emoji: '🧪🔴' },
                        { id: 'Kuning', emoji: '🧪🟡' },
                        { id: 'Biru', emoji: '🧪🔵' },
                        { id: 'Magnet Utara-Selatan', emoji: '🧲⚡' },
                      ].map((exp) => (
                        <button
                          key={exp.id}
                          onClick={() => {
                            sound.playCorrect();
                            const next = [...scienceMix, exp.id].slice(-2);
                            setScienceMix(next);
                            setSessionScore((s) => s + 1);
                            setCharAction('studying');
                            setFeedbackBanner(
                              `🔬 Hasil pengamatan (${next.join(' + ')}): Warna & gaya magnet berinteraksi dengan menakjubkan!`
                            );
                          }}
                          className="px-3.5 py-2.5 rounded-2xl bg-cyan-50 hover:bg-cyan-100 border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] text-xs font-bold"
                        >
                          {exp.emoji} {exp.id}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedActivity.mechanic === 'treasure_hunt' && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-[#2D2520]">
                      🗺️ Jelajahi 4 Titik Peta untuk Menemukan Peti Harta Karun &amp; Teka-Teki Matematika:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {[
                        { id: 1, spot: '🌳 Bawah Pohon Rindang', prize: '💎 Permata Angka (4×5=20)' },
                        { id: 2, spot: '⛲ Air Mancur Taman', prize: '🪙 Koin Kuno (15+15=30)' },
                        { id: 3, spot: '📚 Sudut Rak Pustaka', prize: '📜 Peta Rahasia Nusantara' },
                        { id: 4, spot: '🌺 Kebun Bunga Mawar', prize: '👑 Mahkota Penjelajah' },
                      ].map((loc) => {
                        const found = treasureRevealed.includes(loc.id);
                        return (
                          <button
                            key={loc.id}
                            onClick={() => {
                              sound.playSurprise();
                              if (!found) setTreasureRevealed((p) => [...p, loc.id]);
                              setSessionScore((s) => s + 1);
                              setCharAction('happy_jump');
                              setFeedbackBanner(`🗺️ Ditemukan di ${loc.spot}: ${loc.prize}!`);
                            }}
                            className={`p-3 rounded-2xl border-2 border-[#2D2520] text-xs font-bold ${
                              found ? 'bg-amber-300' : 'bg-amber-50 hover:bg-amber-100'
                            }`}
                          >
                            {found ? loc.prize : loc.spot}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedActivity.mechanic === 'photography_cam' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-[#2D2520]">
                      <span>📷 Geser Sudut Bidikan Kamera &amp; Tekan Shutter ({capturedPhotos.length} foto):</span>
                      <span>Sudut: {cameraFocusX}°</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={90}
                      value={cameraFocusX}
                      onChange={(e) => setCameraFocusX(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                    <div className="flex flex-wrap gap-2">
                      {['🌅 Pantai Senja Bali', '⛰️ Lembah Harau Sumbar', '🏛️ Kota Tua Jakarta'].map(
                        (spot) => (
                          <button
                            key={spot}
                            onClick={() => {
                              sound.playCorrect();
                              setCapturedPhotos((p) => [...p, spot]);
                              setSessionScore((s) => s + 1);
                              setCharAction('proud');
                              setFeedbackBanner(
                                `📸 Klik! Foto "${spot}" (Sudut ${cameraFocusX}°) tersimpan di album fotografi!`
                              );
                            }}
                            className="px-3.5 py-2 rounded-xl bg-indigo-100 hover:bg-indigo-200 border-2 border-[#2D2520] text-xs font-bold"
                          >
                            📸 Potret: {spot}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {selectedActivity.mechanic === 'home_designer' && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-[#2D2520]">
                      🏡 Pilih Tema Desain Dinding &amp; Karpet Rumah Secara Langsung:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {STORE_ITEMS.filter((i) => i.category === 'furniture').map((furn) => (
                        <button
                          key={furn.id}
                          onClick={() => {
                            sound.playClick();
                            setSessionScore((s) => s + 1);
                            setCharAction('proud');
                            if (onUpdateRoomDecor && furn.subCategory) {
                              onUpdateRoomDecor({ [furn.subCategory]: furn.id });
                            }
                            setFeedbackBanner(
                              `🏡 Menerapkan desain interior "${furn.name}" ke dalam rumah!`
                            );
                          }}
                          className="p-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 border-2 border-[#2D2520] text-left text-xs font-bold flex items-center gap-2"
                        >
                          <span className="text-xl">{furn.iconEmoji}</span>
                          <span className="truncate">{furn.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedActivity.mechanic === 'batik_craft' && (
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-[#2D2520]">
                      👘 Klik Petak Kain untuk Membatik Motif Tradisional Nusantara:
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {batikCells.map((cellCol, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            sound.playClick();
                            const palette = ['#92400E', '#D97706', '#1E3A8A', '#065F46', '#FACC15'];
                            const nextCol = palette[(idx + sessionScore) % palette.length];
                            setBatikCells((prev) =>
                              prev.map((c, i) => (i === idx ? nextCol : c))
                            );
                            setSessionScore((s) => s + 1);
                            setCharAction('proud');
                          }}
                          style={{ backgroundColor: cellCol }}
                          className="h-12 rounded-xl border-2 border-[#2D2520] flex items-center justify-center text-sm shadow-inner"
                        >
                          ❖
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedActivity.mechanic === 'travel_nusantara' && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-[#2D2520]">
                      ✈️ Pilih Provinsi Destinasi Nusantara untuk Eksplorasi Budaya &amp; Kuliner:
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                      {(Object.keys(regionalData) as RegionId[]).map((regId) => {
                        const r = regionalData[regId];
                        return (
                          <button
                            key={regId}
                            onClick={() => {
                              sound.playCorrect();
                              setSelectedTravelRegion(regId);
                              setSessionScore((s) => s + 1);
                              setCharAction('waving');
                              setFeedbackBanner(
                                `✈️ Mengunjungi ${r.name}! Mengenal baju adat ${r.clothingName} dan kuliner khas daerah!`
                              );
                            }}
                            className={`px-2.5 py-1 rounded-xl border text-xs font-bold ${
                              selectedTravelRegion === regId
                                ? 'bg-emerald-500 text-white border-[#2D2520]'
                                : 'bg-white text-[#2D2520] border-[#2D2520]'
                            }`}
                          >
                            🌏 {r.name}
                          </button>
                        );
                      })}
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-400 flex items-center justify-between">
                      <div className="text-xs font-bold text-emerald-950">
                        📍 Destinasi: {regionalData[selectedTravelRegion].name} — Pakaian Adat:{' '}
                        {regionalData[selectedTravelRegion].clothingName}
                      </div>
                      <button
                        onClick={() =>
                          handleFinishAndClaimActivity(
                            `Menjelajahi budaya dan tradisi ${regionalData[selectedTravelRegion].name} bersama ${babyName}!`,
                            undefined,
                            selectedTravelRegion
                          )
                        }
                        className="px-3 py-1 rounded-lg bg-emerald-400 border border-[#2D2520] text-xs font-bold"
                      >
                        +1 Poin Budaya &amp; Klaim
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ==================== HUB MENU TABS (AVAILABLE, RECENT, MEMORIES, FAVORITES) ==================== */
          <>
            <div className="px-4 sm:px-6 pt-3 pb-2 bg-amber-50/70 border-b-2 border-stone-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    {
                      id: 'available',
                      label: `Available Activities (${availableList.length})`,
                      icon: <Play className="w-3.5 h-3.5" />,
                    },
                    {
                      id: 'recent',
                      label: `Recently Played (${recentlyPlayedActivities.length})`,
                      icon: <Clock className="w-3.5 h-3.5" />,
                    },
                    {
                      id: 'memories',
                      label: `Activity Memories & Arsip (${
                        activityMemories.length + archivedPastList.length
                      })`,
                      icon: <Archive className="w-3.5 h-3.5" />,
                    },
                    {
                      id: 'favorites',
                      label: `Favorite Activities (${favoriteActivities.length})`,
                      icon: <Heart className="w-3.5 h-3.5" />,
                    },
                  ] as const
                ).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      sound.playClick();
                      setActiveTab(t.id);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-display text-xs font-bold border-2 flex items-center gap-1.5 transition-all ${
                      activeTab === t.id
                        ? 'bg-[#FF8FAB] text-[#2D2520] border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                        : 'bg-white text-[#6E6259] border-stone-300 hover:border-[#2D2520]'
                    }`}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>

              <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {level > 2
                    ? 'Aktivitas bayi (Cilukba/Pat-a-Cake) otomatis dipindahkan ke Arsip Kenangan!'
                    : 'Aktivitas eksklusif sesuai usia saat ini!'}
                </span>
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {/* TAB 1: AVAILABLE ACTIVITIES FOR CURRENT STAGE */}
              {activeTab === 'available' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {availableList.map((act) => {
                    const isFav = favoriteActivities.includes(act.id);
                    const isCompleted = completedActivities.includes(act.id);
                    return (
                      <div
                        key={act.id}
                        className={`p-4 rounded-2xl border-2 border-[#2D2520] bg-gradient-to-br ${act.bgGradient} shadow-[0_4px_0_#2D2520] flex flex-col justify-between gap-3`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-3xl">{act.iconEmoji}</span>
                            <div className="flex items-center gap-1">
                              {isCompleted && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-200 border border-[#2D2520] text-[10px] font-bold text-emerald-950">
                                  ✓ Pernah Dimainkan
                                </span>
                              )}
                              <button
                                onClick={() => onToggleFavoriteActivity(act.id)}
                                className={`w-7 h-7 rounded-lg border border-[#2D2520] flex items-center justify-center ${
                                  isFav ? 'bg-rose-400 text-white' : 'bg-white text-stone-400'
                                }`}
                                title="Tandai Aktivitas Favorit"
                              >
                                <Heart className="w-3.5 h-3.5 fill-current" />
                              </button>
                            </div>
                          </div>

                          <h3 className="mt-2 font-display text-sm sm:text-base font-extrabold text-[#2D2520]">
                            {act.title}
                          </h3>
                          <div className="text-xs font-bold text-pink-700">
                            {act.indonesianTitle} · {act.stageLabel}
                          </div>
                          <p className="mt-1.5 text-xs font-medium text-[#2D2520]/85 leading-relaxed">
                            {act.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-[#2D2520]/15 flex items-center justify-between gap-2">
                          <span className="font-mono-num text-[11px] font-bold text-[#2D2520]">
                            +{act.xpReward} XP · +{act.coinReward} 🪙
                          </span>
                          <button
                            onClick={() => startActivitySession(act)}
                            className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-amber-200 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] font-display text-xs font-bold text-[#2D2520] flex items-center gap-1"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Main Sekarang!</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: RECENTLY PLAYED */}
              {activeTab === 'recent' && (
                <div className="space-y-3">
                  {recentlyPlayedActivities.length === 0 ? (
                    <div className="p-8 text-center text-sm font-bold text-[#6E6259]">
                      Belum ada aktivitas yang baru dimainkan. Ayo pilih aktivitas di tab Available Activities!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {recentlyPlayedActivities.map((actId) => {
                        const act = availableList.find((a) => a.id === actId);
                        if (!act) return null;
                        return (
                          <div
                            key={act.id}
                            className="p-4 rounded-2xl bg-white border-2 border-[#2D2520] shadow-[0_4px_0_#2D2520] flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{act.iconEmoji}</span>
                              <div>
                                <div className="font-display text-sm font-bold text-[#2D2520]">
                                  {act.title}
                                </div>
                                <div className="text-xs font-semibold text-[#6E6259]">
                                  {act.indonesianTitle}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => startActivitySession(act)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-300 border-2 border-[#2D2520] font-display text-xs font-bold"
                            >
                              Main Lagi
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ACTIVITY MEMORIES & ARCHIVED PAST-STAGE ACTIVITIES */}
              {activeTab === 'memories' && (
                <div className="space-y-6">
                  {/* Played Activity Memories Log */}
                  <div className="space-y-2.5">
                    <h3 className="font-display text-sm font-extrabold text-[#2D2520] flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-600" />
                      <span>Catatan Kenangan Aktivitas Bersama {babyName}:</span>
                    </h3>
                    {activityMemories.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-stone-100 border border-stone-300 text-xs font-semibold text-[#6E6259]">
                        Mainkan aktivitas untuk menyimpan kenangan seru bersama {babyName}!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {activityMemories.map((mem) => (
                          <div
                            key={mem.id}
                            className="p-3 rounded-2xl bg-amber-50 border-2 border-[#2D2520] flex items-start justify-between gap-2"
                          >
                            <div>
                              <div className="font-display text-xs font-bold text-[#2D2520]">
                                {mem.activityTitle} (Stage {mem.stageLevel})
                              </div>
                              <div className="text-xs text-[#6E6259]">{mem.summary}</div>
                              <div className="text-[10px] font-mono-num text-amber-800 font-bold mt-0.5">
                                📅 {mem.date} · {mem.scoreOrResult}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Archived Activities from Younger Stages (e.g. Peekaboo / Pat-a-Cake when character grows up) */}
                  <div className="space-y-2.5">
                    <h3 className="font-display text-sm font-extrabold text-[#2D2520] flex items-center gap-1.5">
                      <Archive className="w-4 h-4 text-purple-600" />
                      <span>
                        Arsip Kenangan Masa Kecil (Aktivitas Tahap Usia Sebelumnya yang Sudah Terlewati):
                      </span>
                    </h3>
                    {archivedPastList.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-stone-100 border border-stone-300 text-xs font-semibold text-[#6E6259]">
                        Saat {babyName} tumbuh lebih besar, aktivitas masa bayi seperti Cilukba dan Pat-a-Cake akan tersimpan di arsip kenangan ini.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {archivedPastList.map((past) => (
                          <div
                            key={past.id}
                            className="p-3 rounded-2xl bg-stone-100 border-2 border-stone-400 opacity-85 flex items-center gap-3"
                          >
                            <span className="text-2xl">{past.iconEmoji}</span>
                            <div>
                              <div className="font-display text-xs font-bold text-[#2D2520]">
                                {past.title}
                              </div>
                              <div className="text-[11px] font-semibold text-purple-800">
                                Kenangan {past.stageLabel}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: FAVORITE ACTIVITIES */}
              {activeTab === 'favorites' && (
                <div>
                  {favoriteActivities.length === 0 ? (
                    <div className="p-8 text-center text-sm font-bold text-[#6E6259]">
                      Klik ikon ❤️ pada kartu aktivitas untuk menambahkannya ke daftar Favorite Activities!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {availableList
                        .filter((a) => favoriteActivities.includes(a.id))
                        .map((act) => (
                          <div
                            key={act.id}
                            className={`p-4 rounded-2xl border-2 border-[#2D2520] bg-gradient-to-br ${act.bgGradient} shadow-[0_4px_0_#2D2520] flex items-center justify-between gap-3`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{act.iconEmoji}</span>
                              <div>
                                <div className="font-display text-sm font-bold text-[#2D2520]">
                                  {act.title}
                                </div>
                                <div className="text-xs font-semibold text-[#6E6259]">
                                  {act.indonesianTitle}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => startActivitySession(act)}
                              className="px-3 py-1.5 rounded-xl bg-white border-2 border-[#2D2520] font-display text-xs font-bold"
                            >
                              Main
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
