import React, { useEffect, useState } from 'react';
import {
  Activity,
  Award,
  BookOpen,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Heart,
  HeartPulse,
  Home,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  Thermometer,
  Wrench,
  X,
} from 'lucide-react';
import {
  BabyAppearance,
  BabyGender,
  GROWTH_STAGES,
  getGrowthStage,
} from '../data/gameData';
import {
  calculateRealTimeGrowthSnapshot,
  CharacterLifeData,
  getCharacterProportionProfile,
  getCharacterScaleForStage,
  getCumulativeThresholdDays,
  getOutgrownActivitiesForStage,
  getStageDurationDays,
  GROWING_UP_STAGE_CAPTIONS,
  GrowingUpStagePhotoMemory,
  growthConfig,
  IllnessStateId,
  STAGE_DISPLAY_META,
  TOTAL_ADULT_JOURNEY_DAYS,
} from '../data/lifeProgressionData';
import { BabyCharacterSVG } from './BabyCharacterSVG';
import { sound } from '../utils/sound';

// ============================================================================
// 1. 246-DAY REALISTIC SLOW LIFE GROWTH & "MY GROWING UP MEMORIES" SCRAPBOOK
// ============================================================================

interface GrowingUpMemoriesModalProps {
  babyName: string;
  gender: BabyGender;
  level: number;
  appearance: BabyAppearance;
  lifeData: CharacterLifeData;
  onClose: () => void;
  onCaptureCurrentStagePhoto: () => void;
}

export const GrowingUpMemoriesModal: React.FC<GrowingUpMemoriesModalProps> = ({
  babyName,
  gender,
  level,
  appearance,
  lifeData,
  onClose,
  onCaptureCurrentStagePhoto,
}) => {
  const clampedLevel = Math.max(1, Math.min(7, level));
  const [selectedMemoryStage, setSelectedMemoryStage] = useState<number>(clampedLevel);
  const [isFlippingPage, setIsFlippingPage] = useState(false);

  const createdAtTimestamp = lifeData.characterCreatedAt || lifeData.createdAt || Date.now();
  const growthSnapshot = calculateRealTimeGrowthSnapshot(createdAtTimestamp, Date.now(), growthConfig);

  const currentStageInfo = getGrowthStage(clampedLevel);
  const nextStageInfo = clampedLevel < 7 ? getGrowthStage(clampedLevel + 1) : null;
  const currentStageMeta = STAGE_DISPLAY_META[clampedLevel] || STAGE_DISPLAY_META[1];
  const nextStageMeta = clampedLevel < 7 ? STAGE_DISPLAY_META[clampedLevel + 1] : null;

  const findStageMemory = (stageLv: number): GrowingUpStagePhotoMemory | undefined =>
    lifeData.photoMemories.find((m) => m.stageLevel === stageLv);

  const activeCaptionInfo =
    GROWING_UP_STAGE_CAPTIONS[selectedMemoryStage] || GROWING_UP_STAGE_CAPTIONS[1];
  const activeStageMeta = STAGE_DISPLAY_META[selectedMemoryStage] || STAGE_DISPLAY_META[1];
  const activeMemory = findStageMemory(selectedMemoryStage);
  const isSelectedStageUnlocked = selectedMemoryStage <= clampedLevel;

  const outgrownActivities = getOutgrownActivitiesForStage(clampedLevel);

  const handleTurnScrapbookPage = (targetStage: number) => {
    const nextClamped = Math.max(1, Math.min(7, targetStage));
    if (nextClamped === selectedMemoryStage) return;
    sound.playClick();
    setIsFlippingPage(true);
    setSelectedMemoryStage(nextClamped);
    window.setTimeout(() => setIsFlippingPage(false), 450);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[1px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-x-0 bottom-14 z-[110] mx-auto w-full max-w-5xl max-h-[48dvh] bg-gradient-to-b from-amber-50 via-white to-rose-50 rounded-t-3xl border-t-3 border-x-3 border-[#2D2520] shadow-[0_-8px_0_#2D2520] overflow-hidden flex flex-col"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-[115] bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 px-4 py-2.5 text-white flex items-center justify-between gap-2 shadow-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40 shrink-0">
              <Calendar className="w-5 h-5 text-amber-100" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                  Siklus 246 Hari Waktu Nyata
                </span>
              </div>
              <h2 className="text-xs sm:text-base font-black tracking-tight line-clamp-2 leading-tight">
                MY GROWING UP MEMORIES — {babyName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-[120] w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-rose-600 hover:bg-rose-700 border-2 border-[#2D2520] flex items-center justify-center text-white transition cursor-pointer shrink-0"
            title="Tutup"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Requirement 5: Official Real-Time Growth Status & Next Stage Illustration Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-gradient-to-br from-amber-100/90 via-orange-50 to-rose-100/80 p-4 sm:p-5 rounded-3xl border-2 border-amber-300 shadow-sm">
            {/* Left 7 Cols: Official Growth Status Breakdown */}
            <div className="lg:col-span-7 bg-white/95 rounded-2xl p-4 sm:p-5 border-2 border-amber-200 shadow-sm flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2.5">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-md">
                    MY LITTLE BABY · STATUS PERTUMBUHAN WAKTU NYATA
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-slate-800 mt-1">
                    {babyName} — Stage {clampedLevel}: {currentStageMeta.englishTitle} ({currentStageMeta.indonesianTitle})
                  </h3>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex flex-col items-center justify-center font-black shadow-md shrink-0">
                  <span className="text-lg leading-none">{growthSnapshot.totalElapsedDays}</span>
                  <span className="text-[10px] uppercase tracking-wider">Days</span>
                </div>
              </div>

              {/* Structured Status Table matching Requirement 5 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Age / Usia Karakter</div>
                  <div className="text-sm font-black text-slate-800">
                    {growthSnapshot.totalElapsedDays} days old ({growthSnapshot.totalElapsedDays} hari)
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Current Stage / Tahap Saat Ini</div>
                  <div className="text-sm font-black text-amber-900">
                    {currentStageMeta.englishTitle} ({currentStageMeta.indonesianTitle})
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200">
                  <div className="text-[10px] font-bold uppercase text-slate-500">Time in Current Stage</div>
                  <div className="text-sm font-black text-slate-800">
                    {clampedLevel < 7
                      ? `${growthSnapshot.daysInCurrentStage} / ${growthSnapshot.stageDurationDays} days`
                      : `${growthSnapshot.daysInCurrentStage} days in Adult stage`}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50/90 border border-rose-200">
                  <div className="text-[10px] font-bold uppercase text-rose-700">
                    {nextStageMeta ? `Next Stage: ${nextStageMeta.englishTitle}` : 'Final Stage Reached'}
                  </div>
                  <div className="text-sm font-black text-rose-900">
                    {nextStageMeta
                      ? `Time Until Next Stage: ${growthSnapshot.daysRemainingInStage} days (${growthSnapshot.hoursRemainingInStage}j)`
                      : 'Stage 7 Adult (Puncak Pertumbuhan)'}
                  </div>
                </div>
              </div>

              {/* Real-Time Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className="text-slate-700">
                    Progress Bar ({currentStageMeta.englishTitle}{' '}
                    {nextStageMeta ? `→ ${nextStageMeta.englishTitle}` : 'Complete'}):
                  </span>
                  <span className="text-rose-700 text-sm">{growthSnapshot.stageProgressPercent}%</span>
                </div>
                <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden border border-slate-300 p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, growthSnapshot.stageProgressPercent)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span>
                    Lahir: {new Date(createdAtTimestamp).toLocaleDateString('id-ID')} · Total Perjalanan Dewasa: {growthSnapshot.overallAdultProgressPercent}% ({growthSnapshot.totalElapsedDays}/{TOTAL_ADULT_JOURNEY_DAYS} hari)
                  </span>
                  <span className="text-emerald-700 font-bold">
                    ⏱️ Murni Waktu Nyata (Real-Time)
                  </span>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Next Stage Character Illustration Preview & Schedule */}
            <div className="lg:col-span-5 bg-white/95 rounded-2xl p-4 border-2 border-amber-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  {nextStageInfo && nextStageMeta
                    ? `Ilustrasi Tahap Berikutnya: ${nextStageMeta.englishTitle}`
                    : 'Ilustrasi Tahap Puncak: Adult (Dewasa)'}
                </span>
                <span className="text-[11px] font-extrabold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-lg border border-rose-200">
                  {nextStageMeta
                    ? `Hari ke-${nextStageMeta.cumulativeStartDays}`
                    : 'Hari ke-246'}
                </span>
              </div>

              <div className="flex items-center gap-3 bg-gradient-to-b from-amber-50 via-sky-50 to-rose-50 rounded-2xl p-3 border border-amber-200">
                <div className="w-24 h-28 rounded-xl bg-white/90 border border-amber-200 flex items-center justify-center overflow-hidden shrink-0">
                  <div className="scale-[0.44] origin-center pointer-events-none">
                    <BabyCharacterSVG
                      appearance={appearance}
                      gender={gender}
                      level={Math.min(7, clampedLevel + 1)}
                      actionState={nextStageMeta ? nextStageMeta.defaultPose : 'laughing'}
                      isSleeping={false}
                      needsSummary={{
                        isHungry: false,
                        isSleepy: false,
                        isDirty: false,
                        isSad: false,
                      }}
                      emotion="happy"
                      cleanliness={100}
                    />
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="font-black text-slate-800 text-sm">
                    {nextStageInfo
                      ? `Stage ${clampedLevel + 1}: ${nextStageInfo.indonesianTitle}`
                      : `Stage 7: ${currentStageInfo.indonesianTitle}`}
                  </div>
                  <p className="text-[11px] text-slate-600 leading-snug">
                    {nextStageInfo
                      ? nextStageInfo.description
                      : 'Karakter telah mencapai usia dewasa penuh setelah 246 hari perjalanan pertumbuhan waktu nyata.'}
                  </p>
                  <div className="pt-1 flex flex-wrap gap-1">
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md border border-amber-300">
                      🔒 Tidak dapat dipercepat dengan koin/XP
                    </span>
                  </div>
                </div>
              </div>

              {/* 246-Day Official Stage Duration Pills */}
              <div className="mt-3 pt-2 border-t border-amber-100">
                <div className="text-[10px] font-extrabold uppercase text-slate-500 mb-1.5">
                  Jadwal Resmi Pertumbuhan 246 Hari (~8 Bulan):
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 text-center">
                  {[
                    { lv: 1, label: 'Newborn', dur: '7h' },
                    { lv: 2, label: 'Crawl', dur: '14h' },
                    { lv: 3, label: 'Toddler', dur: '30h' },
                    { lv: 4, label: 'Young', dur: '45h' },
                    { lv: 5, label: 'Older', dur: '60h' },
                    { lv: 6, label: 'Teen', dur: '90h' },
                    { lv: 7, label: 'Adult', dur: '246h+' },
                  ].map((item) => (
                    <div
                      key={item.lv}
                      className={`px-1 py-1 rounded-lg border text-[10px] font-bold ${
                        item.lv === clampedLevel
                          ? 'bg-amber-400 text-slate-950 border-amber-600 font-black'
                          : item.lv < clampedLevel
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      <div className="truncate">{item.label}</div>
                      <div className="text-[9px] opacity-85">{item.dur}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 1, 2, 4, 9 & 10: Side-by-Side 7-Stage Height, Scale & Anatomical Proportion Lineup Comparison (30% -> 100%) */}
          <div className="bg-white rounded-3xl border-3 border-amber-300 p-4 sm:p-5 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-3">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                  DYNAMIC BODY HEIGHT, SCALE &amp; ANATOMICAL PROPORTION SYSTEM
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-800 mt-1">
                  Perbandingan Tinggi Badan &amp; Proporsi Tubuh 7 Tahap Usia (30% → 100% Tinggi Dewasa)
                </h3>
                <p className="text-xs text-slate-600">
                  Seluruh tahap berdiri pada titik tumpu kaki yang sama (<code>characterAnchor = &quot;bottomCenter&quot;</code>) dengan perubahan tinggi, rasio kepala-tubuh, panjang tungkai, postur, dan pakaian sesuai usia.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-950 border border-amber-300">
                  Scale Saat Ini: {(lifeData.characterScale ?? getCharacterScaleForStage(clampedLevel)).toFixed(2)} (
                  {getCharacterProportionProfile(clampedLevel).relativeHeightPercent}%)
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-sky-100 text-sky-950 border border-sky-300">
                  Anchor: {lifeData.characterAnchor || 'bottomCenter'}
                </span>
              </div>
            </div>

            {/* Side-by-Side 7-Stage Height Lineup Canvas on Shared Bottom-Center Floor Line */}
            <div className="relative bg-gradient-to-b from-sky-50/70 via-amber-50/40 to-amber-100/70 rounded-2xl border-2 border-amber-200 pt-6 pb-3 px-2 sm:px-4 overflow-x-auto">
              {/* Background Horizontal Height Ruler Guide Lines (100%, 75%, 60%, 48%, 38%, 30%) */}
              <div className="relative min-w-[680px] h-52 flex items-end justify-between gap-1.5 pt-4 pb-1 px-6">
                {[
                  { pct: 100, topPct: 6, label: '100% (1.00)' },
                  { pct: 75, topPct: 28, label: '75% (0.75)' },
                  { pct: 48, topPct: 52, label: '48% (0.48)' },
                  { pct: 30, topPct: 68, label: '30% (0.30)' },
                ].map((line) => (
                  <div
                    key={line.pct}
                    style={{ top: `${line.topPct}%` }}
                    className="absolute inset-x-2 border-t border-dashed border-amber-400/70 flex items-center pointer-events-none"
                  >
                    <span className="-mt-3 px-1.5 py-0.2 rounded bg-white/90 text-[9px] font-extrabold text-amber-900 border border-amber-300">
                      {line.label}
                    </span>
                  </div>
                ))}

                {/* Shared Floor Baseline (bottomCenter Foot Contact Line) */}
                <div className="absolute bottom-2 inset-x-4 h-1 bg-amber-900/35 rounded-full pointer-events-none" />

                {GROWTH_STAGES.map((st) => {
                  const stageScale = getCharacterScaleForStage(st.level);
                  const propProfile = getCharacterProportionProfile(st.level);
                  const isCurrentStage = st.level === clampedLevel;
                  const isUnlockedStage = st.level <= clampedLevel;
                  const stMeta = STAGE_DISPLAY_META[st.level] || STAGE_DISPLAY_META[1];

                  return (
                    <button
                      key={st.level}
                      onClick={() => handleTurnScrapbookPage(st.level)}
                      className={`group relative flex-1 flex flex-col items-center justify-end h-full rounded-xl px-1 transition cursor-pointer ${
                        isCurrentStage
                          ? 'bg-amber-200/45 ring-2 ring-amber-500'
                          : 'hover:bg-white/60'
                      }`}
                      title={`Klik untuk membuka Scrapbook Stage ${st.level}: ${stMeta.englishTitle} (${propProfile.relativeHeightPercent}% Tinggi Dewasa)`}
                    >
                      {/* Height Percentage Pill Above Each Stage */}
                      <div
                        className={`mb-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-black border z-10 ${
                          isCurrentStage
                            ? 'bg-rose-500 text-white border-rose-700 shadow-xs'
                            : isUnlockedStage
                            ? 'bg-amber-100 text-amber-950 border-amber-300'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        {propProfile.relativeHeightPercent}% ({stageScale.toFixed(2)})
                      </div>

                      {/* Fixed Adult-Reference Bounding Box with bottomCenter Foot Anchor */}
                      <div className="relative w-24 h-40 flex items-end justify-center overflow-visible">
                        <BabyCharacterSVG
                          appearance={appearance}
                          gender={gender}
                          level={st.level}
                          actionState={st.level === 2 ? 'crawling' : 'idle'}
                          isSleeping={false}
                          needsSummary={{
                            isHungry: false,
                            isSleepy: false,
                            isDirty: false,
                            isSad: false,
                          }}
                          emotion="happy"
                          cleanliness={100}
                          sizeClass="w-28 h-36"
                          applyAgeProportionScale={true}
                          customVisualScale={stageScale}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Stage Labels & Anatomical Proportion Ratios Row Below Floor Baseline */}
              <div className="min-w-[680px] grid grid-cols-7 gap-1.5 pt-2 border-t border-amber-200/80 text-center px-6">
                {GROWTH_STAGES.map((st) => {
                  const propProfile = getCharacterProportionProfile(st.level);
                  const isCurrentStage = st.level === clampedLevel;
                  const stMeta = STAGE_DISPLAY_META[st.level] || STAGE_DISPLAY_META[1];
                  return (
                    <div
                      key={st.level}
                      className={`p-1.5 rounded-xl border text-[10px] ${
                        isCurrentStage
                          ? 'bg-amber-100 border-amber-500 font-black text-slate-900'
                          : 'bg-white/85 border-amber-200 text-slate-700'
                      }`}
                    >
                      <div className="font-black truncate">
                        {st.level}. {stMeta.englishTitle}
                      </div>
                      <div className="text-[9px] text-amber-800 font-bold truncate">
                        Kepala {propProfile.headToBodyRatio}
                      </div>
                      <div className="text-[9px] text-slate-500 truncate">
                        {propProfile.postureDescription}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Scrapbook Album with Page-Turning Animation (Requirement 7) */}
          <div className="bg-[#FFF9ED] rounded-3xl border-3 border-amber-400 p-4 sm:p-6 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-amber-200 pb-3">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-6 h-6 text-amber-700" />
                <div>
                  <h3 className="text-lg font-black text-slate-800">
                    Buku Scrapbook Kenangan Pertumbuhan ({babyName})
                  </h3>
                  <p className="text-xs text-slate-600">
                    Buka halaman demi halaman untuk melihat foto otomatis setiap tahap evolusi beserta tanggal, pose, pakaian, dan latar kamar!
                  </p>
                </div>
              </div>

              {/* Page-Turn Controls */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => handleTurnScrapbookPage(selectedMemoryStage - 1)}
                  disabled={selectedMemoryStage <= 1}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 disabled:opacity-40 border-2 border-amber-400 text-xs font-black text-slate-800 flex items-center gap-1 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Halaman Sebelumnya
                </button>
                <span className="px-3 py-1.5 rounded-xl bg-amber-200 border-2 border-amber-400 text-xs font-black text-amber-950">
                  Hal. {selectedMemoryStage} / 7
                </span>
                <button
                  onClick={() => handleTurnScrapbookPage(selectedMemoryStage + 1)}
                  disabled={selectedMemoryStage >= 7}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 disabled:opacity-40 border-2 border-amber-400 text-xs font-black text-slate-800 flex items-center gap-1 transition cursor-pointer"
                >
                  Halaman Berikutnya
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrapbook Open Spread with Page-Flip Animation */}
            <div
              className={`grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-white rounded-2xl border-2 border-amber-200 p-4 sm:p-5 shadow-inner ${
                isFlippingPage ? 'animate-page-flip' : ''
              }`}
            >
              {/* Left Scrapbook Page: Polaroid Frame with Room Background & Pose */}
              <div className="md:col-span-5 flex flex-col items-center">
                <div className="w-full max-w-xs bg-[#FFFDF7] p-4 pb-5 rounded-2xl border-2 border-amber-300 shadow-lg relative">
                  <div
                    className={`w-full h-56 bg-gradient-to-b ${activeStageMeta.roomThemeGradient} rounded-xl border border-amber-200 flex flex-col items-center justify-center overflow-hidden shadow-inner relative`}
                  >
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/85 border border-amber-300 text-[10px] font-bold text-slate-700">
                      🏠 {activeMemory?.roomBackground || activeStageMeta.roomBackgroundLabel}
                    </span>

                    {isSelectedStageUnlocked ? (
                      <div className="scale-75 origin-center mt-3">
                        <BabyCharacterSVG
                          appearance={{
                            ...appearance,
                            equippedOutfit:
                              activeMemory?.outfitId || appearance.equippedOutfit,
                          }}
                          gender={gender}
                          level={selectedMemoryStage}
                          actionState={activeMemory?.pose || activeCaptionInfo.pose || 'laughing'}
                          isSleeping={false}
                          needsSummary={{
                            isHungry: false,
                            isSleepy: false,
                            isDirty: false,
                            isSad: false,
                          }}
                          emotion="happy"
                          cleanliness={100}
                        />
                      </div>
                    ) : (
                      <div className="text-center p-6 text-slate-500">
                        <Clock className="w-10 h-10 mx-auto mb-2 opacity-60" />
                        <p className="text-sm font-black">
                          Halaman Tahap {selectedMemoryStage} Belum Terbuka
                        </p>
                        <p className="text-xs mt-1">
                          Terbuka otomatis saat usia waktu nyata mencapai{' '}
                          <strong>
                            {getCumulativeThresholdDays(selectedMemoryStage, growthConfig)} hari
                          </strong>
                          !
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-center">
                    <p className="font-black text-slate-800 text-base">
                      {activeCaptionInfo.title}
                    </p>
                    <p className="text-xs font-bold text-amber-700">
                      {activeCaptionInfo.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Scrapbook Page: Detailed Memory Journal Entry */}
              <div className="md:col-span-7 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-900 px-3 py-1 rounded-xl text-xs font-extrabold">
                    <Award className="w-4 h-4 text-amber-600" />
                    Lembar Scrapbook Tahap {selectedMemoryStage} — {activeStageMeta.englishTitle}
                  </div>
                  {selectedMemoryStage === clampedLevel && (
                    <button
                      onClick={onCaptureCurrentStagePhoto}
                      className="inline-flex items-center gap-1.5 text-xs text-amber-800 hover:text-amber-950 font-extrabold bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl border border-amber-300 transition cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Abadikan Ulang Pakaian & Pose Saat Ini
                    </button>
                  )}
                </div>

                <h4 className="text-xl font-black text-slate-800">
                  {getGrowthStage(selectedMemoryStage).indonesianTitle} (
                  {getGrowthStage(selectedMemoryStage).title})
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {activeCaptionInfo.caption} — {getGrowthStage(selectedMemoryStage).description}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="bg-amber-50/90 p-2.5 rounded-xl border border-amber-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Evolusi</p>
                    <p className="text-xs sm:text-sm font-black text-emerald-700">
                      {activeMemory ? activeMemory.unlockedDate : 'Belum Tercapai'}
                    </p>
                  </div>
                  <div className="bg-amber-50/90 p-2.5 rounded-xl border border-amber-200">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Durasi Tahap</p>
                    <p className="text-xs sm:text-sm font-black text-slate-800">
                      {selectedMemoryStage < 7
                        ? `${getStageDurationDays(selectedMemoryStage, growthConfig)} Hari Nyata`
                        : 'Tahap Permanen (246h+)'}
                    </p>
                  </div>
                  <div className="bg-amber-50/90 p-2.5 rounded-xl border border-amber-200 col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Pose & Latar Kamar</p>
                    <p className="text-xs font-black text-slate-800 truncate">
                      Pose: {activeMemory?.pose || activeCaptionInfo.pose}
                    </p>
                  </div>
                </div>

                <div className="bg-rose-50/80 p-3.5 rounded-2xl border border-rose-200">
                  <p className="text-xs font-extrabold text-rose-800 uppercase tracking-wider mb-1.5">
                    Kemampuan & Aktivitas yang Terbuka di Tahap Ini:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {getGrowthStage(selectedMemoryStage).unlockedActivities.map((act, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-bold bg-white text-rose-700 px-2.5 py-1 rounded-lg border border-rose-200"
                      >
                        ✨ {act}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 7-Stage Thumbnail Strip Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
              {GROWTH_STAGES.map((st) => {
                const isUnlocked = st.level <= clampedLevel;
                const isCurrent = st.level === clampedLevel;
                const isSelected = st.level === selectedMemoryStage;
                const mem = findStageMemory(st.level);
                const reqDays = getCumulativeThresholdDays(st.level, growthConfig);
                const meta = STAGE_DISPLAY_META[st.level] || STAGE_DISPLAY_META[1];

                return (
                  <button
                    key={st.level}
                    onClick={() => handleTurnScrapbookPage(st.level)}
                    className={`group relative rounded-2xl p-2 border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-100 to-rose-100 border-amber-500 shadow-md -translate-y-0.5'
                        : isUnlocked
                        ? 'bg-white hover:bg-amber-50/70 border-amber-200 shadow-2xs'
                        : 'bg-slate-100/80 border-slate-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                          isCurrent
                            ? 'bg-rose-500 text-white'
                            : isUnlocked
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        Stage {st.level}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        Hari {reqDays}
                      </span>
                    </div>

                    <div
                      className={`relative w-full h-24 rounded-xl bg-gradient-to-b ${meta.roomThemeGradient} border border-amber-200/80 flex items-center justify-center overflow-hidden my-1`}
                    >
                      {isUnlocked ? (
                        <div className="scale-[0.38] origin-center pointer-events-none">
                          <BabyCharacterSVG
                            appearance={{
                              ...appearance,
                              equippedOutfit: mem?.outfitId || appearance.equippedOutfit,
                            }}
                            gender={gender}
                            level={st.level}
                            actionState={mem?.pose || meta.defaultPose}
                            isSleeping={false}
                            needsSummary={{
                              isHungry: false,
                              isSleepy: false,
                              isDirty: false,
                              isSad: false,
                            }}
                            emotion="happy"
                            cleanliness={100}
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 p-1 text-center">
                          <Clock className="w-5 h-5 mb-0.5 opacity-60" />
                          <span className="text-[9px] font-bold">Hari ke-{reqDays}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-0.5">
                      <p className="text-[11px] font-black text-slate-800 truncate">
                        {meta.englishTitle}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {st.indonesianTitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Outgrown Childhood Activities Archive (Moved automatically to Memories when outgrown) */}
          <div className="bg-white rounded-3xl border-2 border-amber-200 p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Arsip Kenangan Aktivitas Masa Kecil ({outgrownActivities.length} Aktivitas Tersimpan)
                </h4>
                <p className="text-xs text-slate-600">
                  Aktivitas dari tahap usia sebelumnya yang sudah terlampaui otomatis tersimpan sebagai kenangan manis di sini.
                </p>
              </div>
              <span className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-xl border border-amber-300">
                Tahap Saat Ini: Stage {clampedLevel}
              </span>
            </div>

            {outgrownActivities.length === 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-slate-600 font-semibold">
                🌱 {babyName} masih berada di tahap awal ({currentStageInfo.indonesianTitle}). Saat {babyName} bertumbuh besar nanti, permainan masa bayi seperti Cilukba (Peekaboo) atau Merangkak Mengejar Mainan akan otomatis diarsipkan di album kenangan ini!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {outgrownActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200 flex items-start gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-xl shrink-0">
                      {act.iconEmoji}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-800 truncate">
                        {act.indonesianTitle} ({act.title})
                      </div>
                      <div className="text-[10px] font-bold text-amber-700">
                        Kenangan {act.stageLabel}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                        {act.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. CHILD-FRIENDLY HEALTHCARE, AMBULANCE & 2.5D VIRTUAL HOSPITAL MODAL
// ============================================================================

interface HealthcareAndHospitalModalProps {
  babyName: string;
  gender: BabyGender;
  level: number;
  appearance: BabyAppearance;
  lifeData: CharacterLifeData;
  onClose: () => void;
  onHomeCareAction: (
    careType: 'rest_bed' | 'warm_water' | 'virtual_syrup' | 'doctor_checkup'
  ) => void;
  onEnterHospital: () => void;
  onHospitalCareStep: (stepType: 'monitor' | 'nutrition' | 'comfort') => void;
  onDischargeFromHospital: () => void;
  onToggleIllnessEnabled: () => void;
  onSimulateIllnessState: (state: IllnessStateId) => void;
}

export const HealthcareAndHospitalModal: React.FC<HealthcareAndHospitalModalProps> = ({
  babyName,
  gender,
  level,
  appearance,
  lifeData,
  onClose,
  onHomeCareAction,
  onEnterHospital,
  onHospitalCareStep,
  onDischargeFromHospital,
  onToggleIllnessEnabled,
  onSimulateIllnessState,
}) => {
  const [doctorChecking, setDoctorChecking] = useState(false);
  const [doctorDiagnosisText, setDoctorDiagnosisText] = useState<string | null>(null);

  // Ambulance rescue sequence state: 0 = idle, 1 = calling, 2 = ambulance arriving, 3 = paramedics helping
  const [ambulancePhase, setAmbulancePhase] = useState<0 | 1 | 2 | 3>(0);
  const [careFeedback, setCareFeedback] = useState<string | null>(null);
  const [welcomeHomeBanner, setWelcomeHomeBanner] = useState(false);
  const [showTestControls, setShowTestControls] = useState(false);

  // Automatic gentle health recovery tick when inside virtual hospital
  useEffect(() => {
    if (lifeData.illnessState !== 'hospital_recovery') return;
    if (lifeData.health >= 100) return;

    const timer = window.setInterval(() => {
      onHospitalCareStep('monitor');
    }, 2800);
    return () => clearInterval(timer);
  }, [lifeData.illnessState, lifeData.health, onHospitalCareStep]);

  const handleCallVirtualDoctor = () => {
    setDoctorChecking(true);
    setDoctorDiagnosisText('Dokter Virtual sedang memeriksa detak jantung dan suhu tubuh...');
    window.setTimeout(() => {
      setDoctorChecking(false);
      setDoctorDiagnosisText(
        `Dokter Virtual: "${babyName} hanya membutuhkan istirahat hangat, air putih, dan kasih sayang. Kondisinya sudah mulai membaik!"`
      );
      onHomeCareAction('doctor_checkup');
    }, 2200);
  };

  const handleCallAmbulanceSequence = () => {
    setAmbulancePhase(1);
    window.setTimeout(() => {
      setAmbulancePhase(2);
    }, 1800);
    window.setTimeout(() => {
      setAmbulancePhase(3);
    }, 3800);
    window.setTimeout(() => {
      setAmbulancePhase(0);
      onEnterHospital();
    }, 5800);
  };

  const triggerHomeCare = (
    type: 'rest_bed' | 'warm_water' | 'virtual_syrup',
    message: string
  ) => {
    setCareFeedback(message);
    onHomeCareAction(type);
    window.setTimeout(() => setCareFeedback(null), 3200);
  };

  const handleCompleteHospitalDischarge = () => {
    setWelcomeHomeBanner(true);
    onDischargeFromHospital();
    window.setTimeout(() => {
      setWelcomeHomeBanner(false);
    }, 3500);
  };

  const hasImmunityShield =
    lifeData.recoveryUntil !== null && lifeData.recoveryUntil > Date.now();

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[1px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-x-0 bottom-14 z-[110] mx-auto w-full max-w-4xl max-h-[48dvh] bg-gradient-to-b from-sky-50 via-white to-emerald-50 rounded-t-3xl border-t-3 border-x-3 border-[#2D2520] shadow-[0_-8px_0_#2D2520] overflow-hidden flex flex-col"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-[115] bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-500 px-4 py-2.5 text-white flex items-center justify-between gap-2 shadow-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/40 shrink-0">
              <HeartPulse className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-md">
                  Virtual Healthcare
                </span>
                {hasImmunityShield && (
                  <span className="text-[10px] font-extrabold bg-emerald-400/30 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Imunitas Aktif
                  </span>
                )}
              </div>
              <h2 className="text-xs sm:text-base font-black tracking-tight line-clamp-2 leading-tight">
                PUSAT KESEHATAN &amp; RS VIRTUAL — {babyName}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="relative z-[120] w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-rose-600 hover:bg-rose-700 border-2 border-[#2D2520] flex items-center justify-center text-white transition cursor-pointer shrink-0"
            title="Tutup"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Welcome Home Celebration Banner */}
          {welcomeHomeBanner && (
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white p-5 rounded-3xl shadow-xl flex items-center justify-between animate-bounce">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Home className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-100">
                    WELCOME HOME CELEBRATION!
                  </p>
                  <h3 className="text-2xl font-black">
                    Selamat Pulang ke Rumah, {babyName}! 🎉
                  </h3>
                  <p className="text-sm text-emerald-50">
                    Kesehatan sudah 100% pulih dan mendapatkan perlindungan imunitas ekstra!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Top Health Bar & Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border-2 border-sky-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div
                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white font-black shadow-md ${
                  lifeData.health >= 80
                    ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
                    : lifeData.health >= 50
                    ? 'bg-gradient-to-br from-amber-400 to-orange-500'
                    : 'bg-gradient-to-br from-rose-400 to-pink-600'
                }`}
              >
                <span className="text-lg leading-none">{Math.round(lifeData.health)}%</span>
                <span className="text-[10px] uppercase">Sehat</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-500 uppercase">Tingkat Kesehatan</p>
                <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden my-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      lifeData.health >= 80
                        ? 'bg-emerald-500'
                        : lifeData.health >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.max(8, Math.round(lifeData.health))}%` }}
                  />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Status:{' '}
                  {lifeData.illnessState === 'healthy'
                    ? 'Sehat, Ceria & Aktif'
                    : lifeData.illnessState === 'mild'
                    ? 'Sakit Ringan (Butuh Istirahat di Rumah)'
                    : lifeData.illnessState === 'moderate'
                    ? 'Sakit Sedang (Panggil Dokter Virtual)'
                    : lifeData.illnessState === 'severe'
                    ? 'Butuh Bantuan Rumah Sakit Virtual'
                    : 'Dalam Perawatan Rumah Sakit Virtual'}
                </p>
              </div>
            </div>

            <div className="bg-sky-50/80 rounded-xl p-3 border border-sky-200 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-teal-600 shrink-0" />
              <div>
                <p className="text-xs font-extrabold text-slate-700">
                  Perlindungan Pasca-Perawatan
                </p>
                <p className="text-[11px] text-slate-600">
                  {hasImmunityShield
                    ? `${babyName} memiliki tameng imunitas aktif dan tidak akan jatuh sakit.`
                    : 'Menjaga kebersihan, tidur cukup, dan makan bergizi menjaga kesehatan tetap 100%.'}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-extrabold text-slate-700">
                  Fitur Simulasi Sakit
                </p>
                <p className="text-[11px] text-slate-500">
                  {lifeData.illnessEnabled
                    ? 'Aktif (Ramah anak & jarang terjadi)'
                    : 'Nonaktif (Karakter selalu sehat)'}
                </p>
              </div>
              <button
                onClick={onToggleIllnessEnabled}
                className={`px-3 py-1.5 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                  lifeData.illnessEnabled
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
                }`}
              >
                {lifeData.illnessEnabled ? 'AKTIF' : 'NONAKTIF'}
              </button>
            </div>
          </div>

          {/* Feedback Toast */}
          {careFeedback && (
            <div className="bg-emerald-100 border-2 border-emerald-400 text-emerald-900 px-4 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{careFeedback}</span>
            </div>
          )}

          {/* =================================================================
              VIEW A: AMBULANCE RESCUE SEQUENCE ANIMATION (WHEN CALLING AMBULANCE)
             ================================================================= */}
          {ambulancePhase > 0 && (
            <div className="bg-gradient-to-b from-sky-100 via-white to-amber-50 rounded-3xl border-4 border-rose-300 p-6 text-center space-y-5 shadow-xl">
              <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-800 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider">
                <PhoneCall className="w-4 h-4 animate-ping" />
                Tim Medis Ramah Anak Sedang Menuju Lokasi
              </div>

              <h3 className="text-2xl font-black text-slate-800">
                {ambulancePhase === 1 && '1. Menghubungi Ambulans Rumah Sakit Virtual...'}
                {ambulancePhase === 2 && '2. Wii-Uuu! Ambulans Tiba di Depan Rumah dengan Aman!'}
                {ambulancePhase === 3 &&
                  `3. Petugas Medis Ramah Membawa ${babyName} Menuju Ruang Perawatan...`}
              </h3>

              {/* 2.5D Animated SVG Ambulance Scene */}
              <div className="w-full h-56 bg-gradient-to-b from-sky-200 via-sky-100 to-slate-200 rounded-2xl border-2 border-sky-300 relative overflow-hidden flex items-center justify-center">
                {/* Road */}
                <div className="absolute bottom-0 inset-x-0 h-16 bg-slate-700 border-t-4 border-slate-400 flex items-center justify-around">
                  <div className="w-12 h-2 bg-amber-300 rounded" />
                  <div className="w-12 h-2 bg-amber-300 rounded" />
                  <div className="w-12 h-2 bg-amber-300 rounded" />
                  <div className="w-12 h-2 bg-amber-300 rounded" />
                </div>

                {/* Friendly 2.5D Ambulance SVG */}
                <svg
                  viewBox="0 0 320 160"
                  className="w-72 h-40 relative z-10 transition-transform duration-700 animate-bounce"
                >
                  {/* Soft siren glow */}
                  <circle
                    cx="175"
                    cy="26"
                    r="18"
                    fill="#F43F5E"
                    opacity="0.35"
                    className="animate-ping"
                  />
                  {/* Ambulance Body */}
                  <rect
                    x="45"
                    y="38"
                    width="175"
                    height="82"
                    rx="18"
                    fill="#FFFFFF"
                    stroke="#0284C7"
                    strokeWidth="4"
                  />
                  {/* Front Cab */}
                  <path
                    d="M215 58 L262 58 Q278 58 282 76 L288 102 Q290 120 272 120 L215 120 Z"
                    fill="#F8FAFC"
                    stroke="#0284C7"
                    strokeWidth="4"
                  />
                  {/* Cab Window */}
                  <path
                    d="M224 66 L258 66 Q268 66 272 82 L272 90 L224 90 Z"
                    fill="#BAE6FD"
                  />
                  {/* Red/Teal Friendly Stripe */}
                  <rect x="49" y="88" width="234" height="14" fill="#F43F5E" />
                  {/* Child-Friendly Medical Cross Emblem */}
                  <circle cx="125" cy="72" r="22" fill="#FEF2F2" stroke="#F43F5E" strokeWidth="3" />
                  <rect x="120" y="58" width="10" height="28" rx="3" fill="#F43F5E" />
                  <rect x="111" y="67" width="28" height="10" rx="3" fill="#F43F5E" />
                  {/* Siren Light on Top */}
                  <rect x="165" y="24" width="22" height="12" rx="6" fill="#F43F5E" />
                  {/* Wheels */}
                  <circle cx="95" cy="122" r="20" fill="#1E293B" />
                  <circle cx="95" cy="122" r="9" fill="#E2E8F0" />
                  <circle cx="245" cy="122" r="20" fill="#1E293B" />
                  <circle cx="245" cy="122" r="9" fill="#E2E8F0" />
                </svg>
              </div>

              <p className="text-sm font-bold text-slate-600">
                Jangan khawatir! Rumah Sakit Virtual sangat nyaman, hangat, dan ramah anak.
              </p>
            </div>
          )}

          {/* =================================================================
              VIEW B: 2.5D VIRTUAL HOSPITAL ROOM (WHEN IN HOSPITAL RECOVERY)
             ================================================================= */}
          {ambulancePhase === 0 && lifeData.illnessState === 'hospital_recovery' && (
            <div className="space-y-5">
              {/* 2.5D Isometric / Layered Hospital Room Scene */}
              <div className="relative w-full rounded-3xl border-4 border-sky-300 bg-gradient-to-b from-sky-100 via-teal-50/60 to-amber-50/70 p-4 sm:p-6 shadow-xl overflow-hidden">
                {/* Room Background Details: Sunny Window, Room Lamp, Doctor Desk, Health Monitor, Supply Shelf */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Left: 2.5D Hospital Bed with Character, Virtual Doctor & Health Monitor */}
                  <div className="lg:col-span-7 relative bg-gradient-to-b from-sky-50 to-emerald-50/70 rounded-2xl border-2 border-sky-200 p-4 min-h-[300px] flex flex-col justify-between overflow-hidden shadow-inner">
                    {/* Top Row inside Room: Window, Lamp & Live Health Monitor */}
                    <div className="flex items-start justify-between gap-3 z-10">
                      {/* Sunny Hospital Window */}
                      <div className="w-24 h-20 rounded-xl bg-gradient-to-b from-sky-300 to-sky-100 border-4 border-white shadow-md flex items-center justify-center relative overflow-hidden">
                        <Sun className="w-8 h-8 text-amber-300 animate-spin" style={{ animationDuration: '16s' }} />
                        <div className="absolute inset-x-0 top-1/2 h-1 bg-white/80" />
                        <div className="absolute inset-y-0 left-1/2 w-1 bg-white/80" />
                      </div>

                      {/* Warm Room Lamp */}
                      <div className="px-3 py-1.5 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-900 text-xs font-black flex items-center gap-1.5 shadow-xs">
                        <span>💡 Ruang Perawatan Ceria 2.5D</span>
                      </div>

                      {/* Health Monitor with Waveform Graph */}
                      <div className="w-36 bg-slate-900 text-emerald-400 p-2.5 rounded-xl border-2 border-slate-700 shadow-lg">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase">
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                            MONITOR
                          </span>
                          <span>{Math.round(lifeData.health)}%</span>
                        </div>
                        <svg viewBox="0 0 120 32" className="w-full h-7 mt-1">
                          <polyline
                            fill="none"
                            stroke="#34D399"
                            strokeWidth="2.5"
                            points="0,18 18,18 26,6 34,27 42,12 50,18 72,18 80,5 88,26 96,14 105,18 120,18"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Center: Patient Bed + Character + Virtual Doctor & Nurse */}
                    <div className="relative flex items-center justify-center my-2 py-2">
                      {/* Friendly Virtual Doctor SVG on Left */}
                      <div className="hidden sm:flex flex-col items-center mr-3 bg-white/90 p-2.5 rounded-2xl border border-sky-200 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-sky-100 border-2 border-sky-400 flex items-center justify-center text-2xl">
                          👨‍⚕️
                        </div>
                        <span className="text-[10px] font-black text-sky-900 mt-1">
                          Dokter Raka
                        </span>
                        <span className="text-[9px] text-emerald-700 font-bold">
                          Siap Merawat
                        </span>
                      </div>

                      {/* 2.5D Patient Bed Container */}
                      <div className="relative w-64 h-48 bg-gradient-to-b from-white to-sky-50 rounded-3xl border-4 border-sky-300 shadow-lg flex items-center justify-center overflow-hidden">
                        {/* Soft Pillow */}
                        <div className="absolute top-3 w-36 h-12 bg-white rounded-2xl border-2 border-sky-200 shadow-inner" />

                        {/* Character resting in bed */}
                        <div className="scale-[0.58] origin-center -mt-3">
                          <BabyCharacterSVG
                            appearance={appearance}
                            gender={gender}
                            level={level}
                            actionState={lifeData.health >= 100 ? 'big_smile' : 'idle'}
                            isSleeping={false}
                            needsSummary={{
                              isHungry: false,
                              isSleepy: false,
                              isDirty: false,
                              isSad: false,
                            }}
                            emotion={lifeData.health >= 100 ? 'happy' : 'fresh'}
                            cleanliness={100}
                          />
                        </div>

                        {/* Hospital Blanket covering lower half */}
                        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-r from-teal-300 via-sky-300 to-teal-300 border-t-4 border-white/90 flex items-center justify-center shadow-inner">
                          <div className="bg-white/80 px-3 py-1 rounded-full text-[11px] font-black text-teal-900 flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                            Kasur Pemulihan Hangat
                          </div>
                        </div>
                      </div>

                      {/* Friendly Virtual Nurse on Right */}
                      <div className="hidden sm:flex flex-col items-center ml-3 bg-white/90 p-2.5 rounded-2xl border border-rose-200 shadow-sm">
                        <div className="w-12 h-12 rounded-full bg-rose-100 border-2 border-rose-400 flex items-center justify-center text-2xl">
                          👩‍⚕️
                        </div>
                        <span className="text-[10px] font-black text-rose-900 mt-1">
                          Suster Sari
                        </span>
                        <span className="text-[9px] text-rose-700 font-bold">
                          Nutrisi & Senyum
                        </span>
                      </div>
                    </div>

                    {/* Bottom Furniture Bar: Doctor's Desk, Visitor Chair, Care Shelf */}
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 bg-white/80 px-3 py-2 rounded-xl border border-sky-200">
                      <span>🪑 Kursi Pendamping</span>
                      <span>🗂️ Meja Dokter Virtual</span>
                      <span>🧴 Rak Perawatan Anak</span>
                    </div>
                  </div>

                  {/* Right: Interactive Hospital Recovery Actions & Discharge */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white p-4 rounded-2xl border-2 border-teal-200 shadow-sm">
                      <span className="text-[11px] font-black uppercase tracking-wider text-teal-700 bg-teal-100 px-2.5 py-1 rounded-md">
                        Progres Pemulihan Rumah Sakit
                      </span>
                      <h3 className="text-lg font-black text-slate-800 mt-2">
                        {lifeData.health >= 100
                          ? `Hore! ${babyName} Sudah 100% Sembuh!`
                          : `Merawat ${babyName} Hingga Pulih Penuh`}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1">
                        {lifeData.health >= 100
                          ? 'Dokter Raka menyatakan karakter sudah sehat, ceria, dan siap kembali bermain di rumah!'
                          : 'Bantu Dokter Raka dan Suster Sari mempercepat pemulihan dengan tindakan perawatan di bawah ini:'}
                      </p>

                      {/* Progress Bar */}
                      <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden my-3">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 via-teal-400 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.round(lifeData.health)}%` }}
                        />
                      </div>

                      {/* Interactive Hospital Care Buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={() => onHospitalCareStep('monitor')}
                          disabled={lifeData.health >= 100}
                          className="w-full py-2.5 px-4 rounded-xl bg-sky-100 hover:bg-sky-200 disabled:opacity-50 text-sky-900 font-extrabold text-xs flex items-center justify-between border border-sky-300 transition cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-sky-600" />
                            Periksa Detak & Suhu dengan Stetoskop
                          </span>
                          <span className="bg-white px-2 py-0.5 rounded text-emerald-700 font-black">
                            +15% Sehat
                          </span>
                        </button>

                        <button
                          onClick={() => onHospitalCareStep('nutrition')}
                          disabled={lifeData.health >= 100}
                          className="w-full py-2.5 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 disabled:opacity-50 text-amber-900 font-extrabold text-xs flex items-center justify-between border border-amber-300 transition cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <span>🍲</span>
                            Berikan Sup Hangat & Air Mineral
                          </span>
                          <span className="bg-white px-2 py-0.5 rounded text-emerald-700 font-black">
                            +20% Sehat
                          </span>
                        </button>

                        <button
                          onClick={() => onHospitalCareStep('comfort')}
                          disabled={lifeData.health >= 100}
                          className="w-full py-2.5 px-4 rounded-xl bg-rose-100 hover:bg-rose-200 disabled:opacity-50 text-rose-900 font-extrabold text-xs flex items-center justify-between border border-rose-300 transition cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <Heart className="w-4 h-4 text-rose-600" />
                            Peluk & Bacakan Cerita Penyemangat
                          </span>
                          <span className="bg-white px-2 py-0.5 rounded text-emerald-700 font-black">
                            +20% Sehat
                          </span>
                        </button>
                      </div>

                      {/* Discharge / Return Home Button */}
                      {lifeData.health >= 100 && (
                        <button
                          onClick={handleCompleteHospitalDischarge}
                          className="w-full mt-4 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm shadow-lg flex items-center justify-center gap-2 animate-bounce cursor-pointer"
                        >
                          <Home className="w-5 h-5" />
                          PULANG KE RUMAH (WELCOME HOME!)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW C: SEVERE ILLNESS ALERT ("OH NO! YOUR FRIEND NEEDS HELP!")
             ================================================================= */}
          {ambulancePhase === 0 && lifeData.illnessState === 'severe' && (
            <div className="bg-gradient-to-b from-rose-50 via-white to-amber-50 rounded-3xl border-4 border-rose-400 p-6 text-center space-y-4 shadow-xl">
              <div className="inline-flex items-center gap-2 bg-rose-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow">
                <HeartPulse className="w-4 h-4" />
                Peringatan Perawatan Kesehatan Virtual
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-rose-700">
                OH NO! YOUR FRIEND NEEDS HELP!
              </h3>
              <p className="text-sm text-slate-700 max-w-xl mx-auto font-medium">
                {babyName} terlihat sangat lemas dan membutuhkan pemeriksaan lengkap di Rumah Sakit Virtual Ramah Anak agar bisa segera pulih kembali.
              </p>

              <div className="w-44 h-48 mx-auto bg-white rounded-3xl border-2 border-rose-200 flex items-center justify-center overflow-hidden shadow-inner">
                <div className="scale-[0.6] origin-center">
                  <BabyCharacterSVG
                    appearance={appearance}
                    gender={gender}
                    level={level}
                    actionState="sick"
                    isSleeping={false}
                    needsSummary={{
                      isHungry: false,
                      isSleepy: true,
                      isDirty: false,
                      isSad: false,
                    }}
                    emotion="sleepy"
                    cleanliness={100}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleCallAmbulanceSequence}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-black text-lg shadow-xl inline-flex items-center gap-3 transform hover:scale-105 transition cursor-pointer"
                >
                  <PhoneCall className="w-6 h-6 animate-bounce" />
                  CALL AMBULANCE (PANGGIL AMBULANS VIRTUAL)
                </button>
              </div>
            </div>
          )}

          {/* =================================================================
              VIEW D: HOME HEALTHCARE (HEALTHY, MILD, OR MODERATE ILLNESS)
             ================================================================= */}
          {ambulancePhase === 0 &&
            (lifeData.illnessState === 'healthy' ||
              lifeData.illnessState === 'mild' ||
              lifeData.illnessState === 'moderate') && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                {/* Left Character Health Preview */}
                <div className="lg:col-span-5 bg-gradient-to-b from-sky-50 via-white to-emerald-50 rounded-3xl border-2 border-sky-200 p-5 flex flex-col items-center text-center shadow-sm">
                  <span
                    className={`text-xs font-black px-3 py-1 rounded-full mb-2 ${
                      lifeData.illnessState === 'healthy'
                        ? 'bg-emerald-100 text-emerald-800'
                        : lifeData.illnessState === 'mild'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {lifeData.illnessState === 'healthy'
                      ? '✨ Kondisi Tubuh Prima!'
                      : lifeData.illnessState === 'mild'
                      ? '🌡️ Sakit Ringan — Butuh Istirahat Hangat'
                      : '🩺 Sakit Sedang — Disarankan Panggil Dokter Virtual'}
                  </span>

                  <div className="w-48 h-52 bg-white rounded-2xl border border-sky-200 flex items-center justify-center overflow-hidden my-2 shadow-inner">
                    <div className="scale-[0.65] origin-center">
                      <BabyCharacterSVG
                        appearance={appearance}
                        gender={gender}
                        level={level}
                        actionState={
                          lifeData.illnessState === 'healthy' ? 'big_smile' : 'sick'
                        }
                        isSleeping={false}
                        needsSummary={{
                          isHungry: false,
                          isSleepy: lifeData.illnessState !== 'healthy',
                          isDirty: false,
                          isSad: false,
                        }}
                        emotion={lifeData.illnessState === 'healthy' ? 'happy' : 'sleepy'}
                        cleanliness={100}
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-medium mt-1">
                    {lifeData.illnessState === 'healthy'
                      ? `${babyName} sangat sehat dan bersemangat untuk belajar matematika serta bermain bersama!`
                      : `${babyName} tampak sedikit lemas dan kurang bersemangat. Berikan perawatan hangat di rumah!`}
                  </p>
                </div>

                {/* Right Home Care Actions & Call Virtual Doctor */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="bg-white rounded-3xl border-2 border-sky-200 p-5 space-y-3 shadow-sm">
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                      <Thermometer className="w-5 h-5 text-rose-500" />
                      Tindakan Perawatan di Rumah (Home Care)
                    </h3>
                    <p className="text-xs text-slate-600">
                      Semua perawatan bersifat simulasi edukatif ramah anak tanpa menyebutkan nama atau dosis obat medis nyata.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() =>
                          triggerHomeCare(
                            'rest_bed',
                            `${babyName} dibaringkan di kasur dan diselimuti dengan hangat. (+15% Kesehatan)`
                          )
                        }
                        className="p-3.5 rounded-2xl bg-amber-50 hover:bg-amber-100 border-2 border-amber-200 text-left transition flex items-start gap-3 cursor-pointer"
                      >
                        <span className="text-2xl">🛌</span>
                        <div>
                          <p className="text-xs font-black text-slate-800">
                            Istirahat & Selimut Hangat
                          </p>
                          <p className="text-[11px] text-slate-600">
                            Membaringkan karakter di tempat tidur nyaman (+15% Sehat)
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          triggerHomeCare(
                            'warm_water',
                            `${babyName} meminum air hangat segar dan merasa lebih nyaman. (+15% Kesehatan)`
                          )
                        }
                        className="p-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100 border-2 border-sky-200 text-left transition flex items-start gap-3 cursor-pointer"
                      >
                        <span className="text-2xl">🍵</span>
                        <div>
                          <p className="text-xs font-black text-slate-800">
                            Berikan Air Hangat Virtual
                          </p>
                          <p className="text-[11px] text-slate-600">
                            Menjaga hidrasi tubuh agar kembali segar (+15% Sehat)
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() =>
                          triggerHomeCare(
                            'virtual_syrup',
                            `${babyName} meminum Sirup Madu Herbal Virtual yang manis. (+20% Kesehatan)`
                          )
                        }
                        className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 text-left transition flex items-start gap-3 cursor-pointer"
                      >
                        <span className="text-2xl">🍯</span>
                        <div>
                          <p className="text-xs font-black text-slate-800">
                            Sirup Madu Herbal Virtual
                          </p>
                          <p className="text-[11px] text-slate-600">
                            Perawatan simbolis ramah anak (+20% Sehat)
                          </p>
                        </div>
                      </button>

                      {/* CALL VIRTUAL DOCTOR button */}
                      <button
                        onClick={handleCallVirtualDoctor}
                        disabled={doctorChecking}
                        className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-sky-600 hover:from-teal-600 hover:to-sky-700 text-white text-left transition flex items-start gap-3 shadow-md cursor-pointer"
                      >
                        <Stethoscope className="w-7 h-7 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide">
                            CALL VIRTUAL DOCTOR
                          </p>
                          <p className="text-[11px] text-sky-100">
                            {doctorChecking
                              ? 'Dokter sedang memeriksa...'
                              : 'Panggil Dokter Virtual ke rumah (+30% Sehat)'}
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Virtual Doctor Checkup Animation / Diagnosis Result */}
                    {(doctorChecking || doctorDiagnosisText) && (
                      <div className="mt-3 p-4 rounded-2xl bg-sky-50 border-2 border-sky-300 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-sky-300 flex items-center justify-center text-2xl shrink-0">
                          👨‍⚕️
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-black text-sky-900">
                            Pemeriksaan Dokter Virtual (Stetoskop Ramah Anak)
                          </p>
                          <p className="text-xs text-slate-700 mt-0.5">{doctorDiagnosisText}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          {/* Collapsible Simulation Bar to Test Mild / Moderate / Severe Hospital Scenarios */}
          <div className="bg-slate-100 rounded-2xl border border-slate-300 overflow-hidden">
            <button
              onClick={() => setShowTestControls((prev) => !prev)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-left text-xs font-extrabold text-slate-600 hover:bg-slate-200/70 transition cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-500" />
                Mode Uji Coba Simulasi Kesehatan & Rumah Sakit Virtual
              </span>
              {showTestControls ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showTestControls && (
              <div className="p-4 bg-white border-t border-slate-200 space-y-2">
                <p className="text-xs text-slate-600">
                  Ingin mencoba fitur Dokter Virtual, Ambulans, atau Ruang Rumah Sakit 2.5D sekarang? Pilih skenario simulasi di bawah ini:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onSimulateIllnessState('healthy')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs border border-emerald-300 cursor-pointer"
                  >
                    Set Sehat 100%
                  </button>
                  <button
                    onClick={() => onSimulateIllnessState('mild')}
                    className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs border border-amber-300 cursor-pointer"
                  >
                    Uji Sakit Ringan (Home Care)
                  </button>
                  <button
                    onClick={() => onSimulateIllnessState('moderate')}
                    className="px-3 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-900 font-bold text-xs border border-orange-300 cursor-pointer"
                  >
                    Uji Sakit Sedang (Call Virtual Doctor)
                  </button>
                  <button
                    onClick={() => onSimulateIllnessState('severe')}
                    className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs border border-rose-300 cursor-pointer"
                  >
                    Uji Kondisi Serius (Call Ambulance)
                  </button>
                  <button
                    onClick={() => onSimulateIllnessState('hospital_recovery')}
                    className="px-3 py-1.5 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 font-bold text-xs border border-sky-300 cursor-pointer"
                  >
                    Langsung Masuk Ruang Rumah Sakit 2.5D
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
