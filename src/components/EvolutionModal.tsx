import React, { useEffect, useState } from 'react';
import {
  BabyActionState,
  BabyAppearance,
  BabyGender,
  getGrowthStage,
} from '../data/gameData';
import {
  evaluateRegionalIdentity,
  getClothingTitleForGender,
  LifePhase,
  NUSANTARA_CLOTHING,
  RegionalCultureEntry,
  RegionId,
} from '../data/nusantaraData';
import {
  getCharacterProportionProfile,
  getCharacterScaleForStage,
  getCumulativeThresholdDays,
  GROWING_UP_STAGE_CAPTIONS,
  STAGE_DISPLAY_META,
} from '../data/lifeProgressionData';
import { BabyCharacterSVG } from './BabyCharacterSVG';
import { sound } from '../utils/sound';
import { Sparkles, Award, Check, ArrowRight, Camera, Clock } from 'lucide-react';

interface EvolutionModalProps {
  babyName: string;
  gender: BabyGender;
  targetPhase: LifePhase;
  targetLevel: number;
  appearance: BabyAppearance;
  regionScores: Record<RegionId, number>;
  queueStepIndex?: number;
  queueTotalSteps?: number;
  onCompleteChildEvolution: () => void;
  onCompleteAdultEvolution: (chosenRegionId: RegionId, chosenClothingId: string) => void;
}

const STAGE_TRANSITION_CHOREOGRAPHY: Record<
  number,
  {
    transitionTitle: string;
    celebrationHeadline: string;
    transitionStory: string;
    beforePose: BabyActionState;
    morphPose: BabyActionState;
    afterPose: BabyActionState;
    badgeEmoji: string;
    highlightPoints: string[];
  }
> = {
  2: {
    transitionTitle: 'Newborn → Crawling Baby (Hari ke-7)',
    celebrationHeadline: 'Mulai Mengangkat Kepala & Merangkak Aktif!',
    transitionStory:
      'Setelah 7 hari pertama yang hangat di dalam bedong, kini tubuh mungilnya makin kuat! Ia membuka bedongnya, mengangkat kepala dengan ceria, dan mulai merangkak menjelajahi karpet kamar.',
    beforePose: 'smiling',
    morphPose: 'surprised',
    afterPose: 'crawling',
    badgeEmoji: '🚼',
    highlightPoints: [
      'Bebas dari kain bedong & mulai aktif tengkurap-merangkak',
      'Proporsi leher & lengan lebih kuat untuk menopang tubuh',
      'Membuka aktivitas baru: Follow the Toy & Roll the Ball!',
    ],
  },
  3: {
    transitionTitle: 'Crawling Baby → Toddler (Hari ke-21)',
    celebrationHeadline: 'Berdiri Tegak & Melangkah Pertama Kali!',
    transitionStory:
      'Setelah 14 hari rajin merangkak, kini kakinya makin kokoh! Ia berpegangan, berdiri tegak untuk pertama kalinya, lalu melangkah kecil sambil tertawa riang.',
    beforePose: 'crawling',
    morphPose: 'happy_jump',
    afterPose: 'walking',
    badgeEmoji: '👣',
    highlightPoints: [
      'Berdiri sendiri & mengambil langkah pertama sebagai Balita',
      'Rambut mulai tumbuh lebih tebal dengan pipi balita yang menggemaskan',
      'Membuka aktivitas baru: Build a Tower, Finger Painting & Animal Sounds!',
    ],
  },
  4: {
    transitionTitle: 'Toddler → Young Child (Hari ke-51)',
    celebrationHeadline: 'Tumbuh Lebih Tinggi & Mengenal Budaya Nusantara!',
    transitionStory:
      'Setelah 30 hari masa balita yang penuh warna, proporsi tubuhnya bertambah tinggi dan tegap! Kini ia siap membaca buku cerita serta mencicipi Jajanan & Pakaian Adat Nusantara.',
    beforePose: 'walking',
    morphPose: 'happy_jump',
    afterPose: 'dancing',
    badgeEmoji: '🎒',
    highlightPoints: [
      'Perubahan proporsi tubuh anak-anak yang lincah & ekspresif',
      'Fitur Nusantara Snacks & Traditional Clothing resmi terbuka!',
      'Membuka aktivitas baru: Mini Cooking, Read a Story & Mini Gardening!',
    ],
  },
  5: {
    transitionTitle: 'Young Child → Older Child (Hari ke-96)',
    celebrationHeadline: 'Anak Besar yang Mandiri, Cerdas & Kreatif!',
    transitionStory:
      'Setelah 45 hari bermain dan belajar sebagai anak kecil, kini penampilannya semakin mandiri! Postur tubuhnya makin jenjang dengan semangat bereksperimen sains dan musik.',
    beforePose: 'dancing',
    morphPose: 'surprised',
    afterPose: 'reading',
    badgeEmoji: '🔬',
    highlightPoints: [
      'Desain wajah & gaya rambut anak besar yang lebih rapi dan mandiri',
      'Kemampuan berpikir logis & eksplorasi sains meningkat pesat',
      'Membuka aktivitas baru: Science Experiment, Music Rhythm & Treasure Hunt!',
    ],
  },
  6: {
    transitionTitle: 'Older Child → Teenager (Hari ke-156)',
    celebrationHeadline: 'Memasuki Masa Remaja yang Penuh Bakat & Gaya!',
    transitionStory:
      'Setelah 60 hari tumbuh sebagai anak besar, kini ia bertransformasi menjadi Remaja! Garis wajahnya lebih tegas, rambutnya bervolume, dan ia memiliki hobi kreatif baru.',
    beforePose: 'reading',
    morphPose: 'dancing',
    afterPose: 'studying',
    badgeEmoji: '📸',
    highlightPoints: [
      'Postur tubuh remaja yang proporsional dengan gaya rambut dewasa muda',
      'Semakin mahir menyelesaikan tantangan Matematika & Budaya',
      'Membuka aktivitas remaja: Photography Mode & Cooking Challenge!',
    ],
  },
  7: {
    transitionTitle: 'Teenager → Adult (Hari ke-246 · ~8 Bulan)',
    celebrationHeadline: 'Perayaan Puncak Pertumbuhan Dewasa Nusantara!',
    transitionStory:
      'Perjalanan waktu nyata 246 hari (~8 bulan) telah tercapai! Dari bayi mungil yang dibedong, kini ia tumbuh menjadi sosok Dewasa yang mandiri, bijaksana, dan bangga akan identitas budaya Nusantara.',
    beforePose: 'studying',
    morphPose: 'surprised',
    afterPose: 'laughing',
    badgeEmoji: '👑',
    highlightPoints: [
      'Transformasi final Stage 7 Adult dengan evaluasi Pakaian Adat Nusantara',
      'Membuka Nusantara Regional Meals & fitur kehidupan dewasa lengkap',
      'Membuka aktivitas dewasa: Home Designer, Batik Art & Nusantara Travel!',
    ],
  },
};

export const EvolutionModal: React.FC<EvolutionModalProps> = ({
  babyName,
  gender,
  targetPhase,
  targetLevel,
  appearance,
  regionScores,
  queueStepIndex = 1,
  queueTotalSteps = 1,
  onCompleteChildEvolution,
  onCompleteAdultEvolution,
}) => {
  const prevLevel = Math.max(1, targetLevel - 1);
  const prevStageInfo = getGrowthStage(prevLevel);
  const newStageInfo = getGrowthStage(targetLevel);
  const prevScale = getCharacterScaleForStage(prevLevel);
  const nextScale = getCharacterScaleForStage(targetLevel);
  const prevProfile = getCharacterProportionProfile(prevLevel);
  const nextProfile = getCharacterProportionProfile(targetLevel);
  const choreography =
    STAGE_TRANSITION_CHOREOGRAPHY[targetLevel] || STAGE_TRANSITION_CHOREOGRAPHY[2];
  const captionMeta = GROWING_UP_STAGE_CAPTIONS[targetLevel] || GROWING_UP_STAGE_CAPTIONS[2];
  const stageMeta = STAGE_DISPLAY_META[targetLevel] || STAGE_DISPLAY_META[2];
  const milestoneDays = getCumulativeThresholdDays(targetLevel);

  // Gradual 3-second morphing animation state ('before' -> 'morphing' -> 'after')
  const [morphPhase, setMorphPhase] = useState<'before' | 'morphing' | 'after'>('before');
  const [animatedScale, setAnimatedScale] = useState<number>(prevScale);

  useEffect(() => {
    setMorphPhase('before');
    setAnimatedScale(prevScale);
    sound.playLevelUp();
    const t1 = window.setTimeout(() => {
      setMorphPhase('morphing');
      setAnimatedScale(nextScale);
    }, 650);
    const t2 = window.setTimeout(() => {
      setMorphPhase('after');
      setAnimatedScale(nextScale);
    }, 2850);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [targetLevel, prevScale, nextScale]);

  // Evaluate regionScores when evolving to Stage 7 (DEWASA)
  const evalResult = evaluateRegionalIdentity(regionScores);
  const isAdultEvolution = targetLevel >= 7 || targetPhase === 'DEWASA';

  const [step, setStep] = useState<'sparkle_intro' | 'revealed'>(
    isAdultEvolution ? 'sparkle_intro' : 'revealed'
  );
  const [selectedRegion, setSelectedRegion] = useState<RegionalCultureEntry>(
    evalResult.winningRegion || evalResult.candidateRegions[0]
  );

  const chosenClothing =
    NUSANTARA_CLOTHING.find((c) => c.id === selectedRegion.clothingId) || NUSANTARA_CLOTHING[0];
  const genderedClothingTitle = getClothingTitleForGender(chosenClothing, gender);

  const confettiPieces = [
    { left: '8%', top: '10%', emoji: '🎊', delay: '0s' },
    { left: '18%', top: '24%', emoji: '✨', delay: '0.2s' },
    { left: '82%', top: '12%', emoji: '🎉', delay: '0.1s' },
    { left: '88%', top: '28%', emoji: '🌟', delay: '0.3s' },
    { left: '14%', top: '68%', emoji: '🎈', delay: '0.15s' },
    { left: '84%', top: '70%', emoji: '✨', delay: '0.25s' },
  ];

  // ==================== STAGES 2..6 EVOLUTION ====================
  if (!isAdultEvolution) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
        <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto modal-scroll bg-[#FFFDF9] border-3 border-[#2D2520] rounded-3xl shadow-[0_12px_0_#2D2520] p-5 sm:p-6 text-center space-y-4 relative">
          {/* Multi-Stage Offline Catch-Up Banner if multiple stages were crossed */}
          {queueTotalSteps > 1 && (
            <div className="px-3.5 py-2 rounded-2xl bg-indigo-50 border-2 border-indigo-400 text-indigo-950 text-xs font-bold flex items-center justify-between">
              <span>⏳ Ringkasan Pertumbuhan Selama Kamu Offline</span>
              <span className="px-2 py-0.5 rounded-lg bg-indigo-200 border border-indigo-500">
                Tahap {queueStepIndex} dari {queueTotalSteps}
              </span>
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-200 border-2 border-[#2D2520] font-display text-xs font-bold text-[#2D2520]">
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>
              {choreography.badgeEmoji} {choreography.transitionTitle}
            </span>
          </div>

          <div className="space-y-1">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#2D2520]">
              Selamat! {babyName} kini tumbuh menjadi {newStageInfo.indonesianTitle}!
            </h2>
            <p className="text-xs font-bold text-amber-800">
              {choreography.celebrationHeadline}
            </p>
          </div>

          <div className="flex items-center justify-center flex-wrap gap-2 text-xs font-bold text-[#6E6259]">
            <span className="px-2.5 py-1 rounded-lg bg-stone-100 border border-[#2D2520]">
              Stage {prevLevel}: {prevStageInfo.indonesianTitle} ({prevProfile.relativeHeightPercent}% Tinggi)
            </span>
            <ArrowRight className="w-4 h-4 text-amber-600" />
            <span className="px-2.5 py-1 rounded-lg bg-amber-200 border border-[#2D2520] text-[#2D2520]">
              Stage {targetLevel}: {newStageInfo.indonesianTitle} ({nextProfile.relativeHeightPercent}% Tinggi · Hari ke-{milestoneDays})
            </span>
          </div>

          {/* Gradual 3-Second Character Transformation Stage with Bottom-Center Anchor & Height Ruler */}
          <div
            className={`relative pt-4 pb-3 px-3 rounded-3xl border-2 border-[#2D2520] bg-gradient-to-b ${stageMeta.roomThemeGradient} flex flex-col items-center justify-end min-h-[265px] overflow-hidden`}
          >
            {/* Left Vertical Height Ruler Lines (30% .. 100%) */}
            <div className="absolute left-3 top-4 bottom-10 w-14 border-l-2 border-dashed border-[#2D2520]/40 flex flex-col justify-between text-[9px] font-extrabold text-[#2D2520]/75 pointer-events-none">
              <div className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-[#2D2520]/50" />
                <span>100%</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-amber-600" />
                <span className="text-amber-900 bg-amber-200/90 px-1 rounded">
                  {Math.round(animatedScale * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-0.5 bg-[#2D2520]/50" />
                <span>30%</span>
              </div>
            </div>

            {confettiPieces.map((c, idx) => (
              <span
                key={idx}
                style={{ left: c.left, top: c.top, animationDelay: c.delay }}
                className="absolute text-xl sm:text-2xl animate-bounce pointer-events-none select-none"
              >
                {c.emoji}
              </span>
            ))}

            <div
              className={`absolute bottom-8 w-52 h-52 rounded-full bg-gradient-to-tr from-amber-300 via-yellow-100 to-pink-200 transition-all duration-1000 ${
                morphPhase === 'morphing'
                  ? 'scale-125 opacity-95 animate-pulse'
                  : 'scale-100 opacity-75'
              }`}
            />

            {/* Shared Floor Baseline Contact Line (characterAnchor = "bottomCenter") */}
            <div className="absolute bottom-9 inset-x-10 h-0.5 bg-[#2D2520]/25 rounded-full pointer-events-none" />

            <div
              className={`relative z-10 transition-all duration-700 ${
                morphPhase === 'morphing' ? 'brightness-115' : 'brightness-100'
              }`}
            >
              <BabyCharacterSVG
                appearance={appearance}
                gender={gender}
                level={morphPhase === 'before' ? prevLevel : targetLevel}
                actionState={
                  morphPhase === 'before'
                    ? choreography.beforePose
                    : morphPhase === 'morphing'
                    ? choreography.morphPose
                    : choreography.afterPose
                }
                isSleeping={false}
                needsSummary={{ isHungry: false, isSleepy: false, isDirty: false, isSad: false }}
                emotion="happy"
                sizeClass="w-48 h-56"
                applyAgeProportionScale={true}
                customVisualScale={animatedScale}
              />
            </div>

            <div className="relative z-10 mt-1 px-3 py-1 rounded-full bg-white/95 border border-[#2D2520] text-[11px] font-bold text-[#2D2520]">
              {morphPhase === 'before' &&
                `Tahap Sebelumnya: ${prevStageInfo.indonesianTitle} (Tinggi ${prevProfile.relativeHeightPercent}% · Rasio Kepala ${prevProfile.headToBodyRatio})...`}
              {morphPhase === 'morphing' &&
                `✨ Pertumbuhan Bertahap: Tinggi ${prevProfile.relativeHeightPercent}% → ${nextProfile.relativeHeightPercent}% (Scale ${prevScale.toFixed(2)} → ${nextScale.toFixed(2)})...`}
              {morphPhase === 'after' &&
                `🎉 ${babyName} (${newStageInfo.indonesianTitle} · Tinggi ${nextProfile.relativeHeightPercent}%) siap beraktivitas!`}
            </div>
          </div>

          {/* Narrative & Stage Highlights */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-[#2D2520] text-left space-y-2">
            <p className="text-xs text-[#2D2520] leading-relaxed font-medium">
              {choreography.transitionStory}
            </p>
            <div className="space-y-1 pt-1">
              {choreography.highlightPoints.map((pt, i) => (
                <div key={i} className="text-[11px] font-bold text-amber-950 flex items-start gap-1.5">
                  <span>🌟</span>
                  <span>{pt}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1.5">
              {newStageInfo.unlockedActivities.map((act) => (
                <span
                  key={act}
                  className="px-2.5 py-0.5 rounded-lg bg-white border border-[#2D2520] text-[11px] font-bold text-[#2D2520]"
                >
                  ✓ {act}
                </span>
              ))}
            </div>
          </div>

          {/* Automatic Memory Photo Saved Notice */}
          <div className="p-3 rounded-2xl bg-rose-50 border-2 border-[#2D2520] flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-200 border-2 border-[#2D2520] flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4 text-[#2D2520]" />
              </div>
              <div>
                <div className="font-display text-xs font-bold text-[#2D2520]">
                  📸 Foto Kenangan Otomatis Tersimpan ke Scrapbook!
                </div>
                <div className="text-[11px] text-[#6E6259]">
                  {captionMeta.title} · Latar: {stageMeta.roomBackgroundLabel}
                </div>
              </div>
            </div>
            <span className="px-2 py-1 rounded-lg bg-white border border-[#2D2520] text-[10px] font-bold text-[#2D2520] shrink-0">
              Hari ke-{milestoneDays}
            </span>
          </div>

          {/* Special Nusantara Unlock Notice at Stage 4 (Young Child) */}
          {targetLevel === 4 && (
            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-600 text-left space-y-1.5">
              <div className="font-display text-sm font-bold text-emerald-950">
                🎉 Fitur Budaya Nusantara Terbuka!
              </div>
              <p className="text-xs text-emerald-900">
                1. <strong>NUSANTARA SNACKS Terbuka!</strong> {babyName} kini dapat menikmati Timphan (Aceh), Surabi (Jawa Barat), Bakpia (Yogyakarta), dan jajanan Nusantara lainnya!
              </p>
              <p className="text-xs text-emerald-900">
                2. <strong>NUSANTARA TRADITIONAL CLOTHING Terbuka!</strong> Kamu bisa mengoleksi dan mengenakan Pakaian Adat seluruh Indonesia!
              </p>
            </div>
          )}

          <button
            onClick={() => {
              sound.playLevelUp();
              onCompleteChildEvolution();
            }}
            className="w-full py-3.5 rounded-2xl bg-[#34D399] text-[#2D2520] font-display text-base font-bold border-3 border-[#2D2520] shadow-[0_5px_0_#2D2520] hover:brightness-105"
          >
            {queueStepIndex < queueTotalSteps
              ? `Lanjut ke Tahap Pertumbuhan Berikutnya (${queueStepIndex + 1}/${queueTotalSteps}) →`
              : `Lanjutkan Petualangan ${babyName}! →`}
          </button>
        </div>
      </div>
    );
  }

  // ==================== STAGE 7: FASE DEWASA EVOLUTION (246-DAY FINAL CELEBRATION) ====================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto modal-scroll bg-[#FFFDF9] border-3 border-[#2D2520] rounded-3xl shadow-[0_12px_0_#2D2520] p-6 text-center space-y-4">
        {queueTotalSteps > 1 && (
          <div className="px-3.5 py-2 rounded-2xl bg-indigo-50 border-2 border-indigo-400 text-indigo-950 text-xs font-bold flex items-center justify-between">
            <span>⏳ Ringkasan Pertumbuhan Selama Kamu Offline</span>
            <span className="px-2 py-0.5 rounded-lg bg-indigo-200 border border-indigo-500">
              Tahap {queueStepIndex} dari {queueTotalSteps}
            </span>
          </div>
        )}

        {step === 'sparkle_intro' ? (
          /* STEPS 1–4: Teenager character in center -> Light & Star effect -> evaluating regionScores */
          <div className="space-y-5 py-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-300 border-2 border-[#2D2520] font-display text-xs font-bold text-[#2D2520]">
              <Clock className="w-4 h-4 text-[#2D2520]" />
              <span>✨ PERAYAAN 246 HARI (~8 BULAN) · STAGE 7 ADULT ✨</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2D2520]">
              Selamat! {babyName} Kini Tumbuh Menjadi Dewasa!
            </h2>
            <p className="text-xs sm:text-sm text-[#6E6259]">
              {choreography.transitionStory}
            </p>

            {/* Step 1 & 2: Previous stage morphing into Adult surrounded by glowing stars */}
            <div className="relative py-4 flex items-center justify-center">
              <div className="w-56 h-56 rounded-full bg-gradient-to-r from-amber-300 via-yellow-200 to-pink-300 animate-ping opacity-30 absolute" />
              <div className="w-52 h-52 rounded-full bg-amber-100 border-2 border-amber-400 absolute" />
              <span className="absolute top-2 left-1/4 text-3xl animate-bounce">🌟</span>
              <span className="absolute top-4 right-1/4 text-3xl animate-bounce">✨</span>
              <span className="absolute bottom-4 left-1/3 text-3xl animate-bounce">🎊</span>
              <BabyCharacterSVG
                appearance={appearance}
                gender={gender}
                level={morphPhase === 'before' ? 6 : 7}
                actionState={morphPhase === 'after' ? 'laughing' : 'surprised'}
                isSleeping={false}
                needsSummary={{ isHungry: false, isSleepy: false, isDirty: false, isSad: false }}
                sizeClass="w-44 h-52"
              />
            </div>

            {/* Tie-breaker or All-Zero Selector before transforming */}
            {evalResult.status === 'tie' && (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-[#2D2520] text-left space-y-2.5">
                <div className="font-display text-sm font-bold text-[#2D2520]">
                  ⚖️ Terdapat Skor Seri Tertinggi ({evalResult.highestScore} Poin)! Pilih Identitas Budaya Dewasa {babyName}:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {evalResult.candidateRegions.map((reg) => (
                    <button
                      key={reg.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedRegion(reg);
                      }}
                      className={`p-2.5 rounded-xl border-2 text-left text-xs font-bold ${
                        selectedRegion.id === reg.id
                          ? 'bg-amber-300 border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                          : 'bg-white border-[#E5DEC9]'
                      }`}
                    >
                      <div>{reg.landmarkOrIcon} {reg.name}</div>
                      <div className="text-[11px] text-[#6E6259]">{reg.clothingName}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {evalResult.status === 'all_zero' && (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-[#2D2520] text-left space-y-2.5">
                <div className="font-display text-sm font-bold text-[#2D2520]">
                  🇮🇩 Semua Poin Daerah Masih 0 – Pilih Pakaian Adat Default untuk {babyName}:
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto modal-scroll">
                  {evalResult.candidateRegions.map((reg) => (
                    <button
                      key={reg.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedRegion(reg);
                      }}
                      className={`p-2 rounded-xl border-2 text-left text-xs font-bold ${
                        selectedRegion.id === reg.id
                          ? 'bg-amber-300 border-[#2D2520]'
                          : 'bg-white border-[#E5DEC9]'
                      }`}
                    >
                      <div>{reg.landmarkOrIcon} {reg.name}</div>
                      <div className="text-[10px] text-[#6E6259]">{reg.clothingName}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {evalResult.status === 'single_winner' && evalResult.winningRegion && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-600 text-xs sm:text-sm font-bold text-emerald-950">
                🏆 Hasil Evaluasi `regionScores`: Provinsi <strong>{evalResult.winningRegion.name}</strong> memiliki poin tertinggi ({evalResult.highestScore} Poin)!
              </div>
            )}

            <button
              onClick={() => {
                sound.playSurprise();
                setStep('revealed');
              }}
              className="w-full py-3.5 rounded-2xl bg-[#FF8FAB] text-[#2D2520] font-display text-base font-bold border-3 border-[#2D2520] shadow-[0_5px_0_#2D2520]"
            >
              Transformasi &amp; Kenakan Pakaian Adat Dewasa! ✨
            </button>
          </div>
        ) : (
          /* STEPS 5–8: Adult character revealed wearing chosen traditional clothing + cultural info */
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-200 border-2 border-[#2D2520] font-display text-xs font-bold text-[#2D2520]">
              <Award className="w-4 h-4 text-emerald-800" />
              <span>STAGE 7 – ADULT (DEWASA · HARI KE-246)</span>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2D2520]">
              {babyName} Mengenakan {genderedClothingTitle} ({selectedRegion.name})
            </h2>

            {/* Step 5 & 6: Adult sprite wearing the evaluated regional traditional clothing */}
            <div className="relative py-3 flex items-center justify-center">
              <div className="absolute w-56 h-56 rounded-full bg-gradient-to-tr from-amber-200 via-yellow-100 to-emerald-200 opacity-80" />
              <BabyCharacterSVG
                appearance={{
                  ...appearance,
                  equippedOutfit: chosenClothing.id,
                  equippedHat: null,
                }}
                gender={gender}
                level={7}
                actionState="laughing"
                isSleeping={false}
                needsSummary={{ isHungry: false, isSleepy: false, isDirty: false, isSad: false }}
                emotion="fresh"
                sizeClass="w-48 h-56"
              />
            </div>

            {/* Automatic Scrapbook Memory Photo Saved Notice */}
            <div className="p-3 rounded-2xl bg-rose-50 border-2 border-[#2D2520] flex items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-200 border-2 border-[#2D2520] flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4 text-[#2D2520]" />
                </div>
                <div>
                  <div className="font-display text-xs font-bold text-[#2D2520]">
                    📸 Foto Puncak Kedewasaan Tersimpan di Album Scrapbook!
                  </div>
                  <div className="text-[11px] text-[#6E6259]">
                    {captionMeta.title} · Pakaian Adat {selectedRegion.name}
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 rounded-lg bg-white border border-[#2D2520] text-[10px] font-bold text-[#2D2520] shrink-0">
                Hari ke-246
              </span>
            </div>

            {/* Step 7 & 8: Region Name, Traditional Clothing Name, and Cultural Information */}
            <div className="p-4 rounded-2xl bg-[#FFFDF5] border-2 border-[#2D2520] text-left space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="font-display text-base font-bold text-[#2D2520]">
                  {selectedRegion.landmarkOrIcon} Daerah Asal: Provinsi {selectedRegion.name}
                </span>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300">
                  Pakaian Adat: {selectedRegion.clothingName}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#2D2520] leading-relaxed">
                <strong>Informasi Budaya:</strong> {selectedRegion.cultureDescription}
              </p>
              <p className="text-xs text-emerald-800 font-bold pt-1">
                🍛 Selain itu, kategori NUSANTARA REGIONAL MEALS ({selectedRegion.mealName}, Mie Aceh, Nasi Timbel, Gudeg, dll.) kini telah terbuka!
              </p>
            </div>

            <button
              onClick={() => {
                sound.playLevelUp();
                onCompleteAdultEvolution(selectedRegion.id, chosenClothing.id);
              }}
              className="w-full py-3.5 rounded-2xl bg-[#34D399] text-[#2D2520] font-display text-base font-bold border-3 border-[#2D2520] shadow-[0_5px_0_#2D2520] hover:brightness-105 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              <span>Simpan Identitas Budaya &amp; Lanjutkan Bermain!</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

