import React, { useEffect, useId, useState } from 'react';
import {
  BabyActionState,
  BabyAppearance,
  BabyGender,
  BathingProgressState,
  BodyZoneId,
  CharacterEmotion,
  getGrowthStage,
  SKIN_TONES,
  STORE_ITEMS,
} from '../data/gameData';
import {
  NUSANTARA_CLOTHING,
} from '../data/nusantaraData';

interface BabyCharacterSVGProps {
  appearance: BabyAppearance;
  gender: BabyGender;
  level: number;
  actionState: BabyActionState;
  isSleeping: boolean;
  needsSummary: {
    isHungry: boolean;
    isSleepy: boolean;
    isDirty: boolean;
    isSad: boolean;
  };
  emotion?: CharacterEmotion;
  cleanliness?: number; // 0 - 100
  bathingProgress?: BathingProgressState;
  isShowerRinsing?: boolean;
  onBodyZonePointerHit?: (zone: BodyZoneId) => void;
  onClickBaby?: () => void;
  sizeClass?: string;
  isCarried?: boolean;
  inCrib?: boolean;
  blanketPulled?: boolean;
  blanketColor?: string;
  inBathTub?: boolean;
  soapFoamActive?: boolean;
  peekabooHandsCovered?: boolean;
  heldPropEmoji?: string | null;
  applyAgeProportionScale?: boolean;
  customVisualScale?: number;
  seatedOnProp?: 'swing' | 'slide' | 'seesaw' | null;
  beachPose?: 'building_sandcastle' | 'digging_sand' | 'relaxing' | 'eating_picnic' | null;
  culturalPose?: 'playing_angklung' | 'traditional_dance' | null;
}

export const BabyCharacterSVG: React.FC<BabyCharacterSVGProps> = ({
  appearance,
  gender,
  level,
  actionState,
  isSleeping,
  needsSummary,
  emotion = 'happy',
  cleanliness = 85,
  bathingProgress,
  isShowerRinsing = false,
  onClickBaby,
  sizeClass = 'w-56 h-64 sm:w-64 sm:h-72',
  isCarried = false,
  inCrib = false,
  blanketPulled = false,
  blanketColor = '#F472B6',
  inBathTub = false,
  soapFoamActive = false,
  peekabooHandsCovered = false,
  heldPropEmoji = null,
  applyAgeProportionScale = false,
  customVisualScale,
  seatedOnProp = null,
  beachPose = null,
  culturalPose = null,
}) => {
  const uid = useId().replace(/:/g, '');
  const [blinking, setBlinking] = useState(false);

  // Automatic natural blinking
  useEffect(() => {
    if (isSleeping || actionState === 'sleeping') return;
    const blinkDelay = emotion === 'sleepy' ? 2100 : 3300;
    const blinkDuration = emotion === 'sleepy' ? 320 : 165;
    const interval = window.setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), blinkDuration);
    }, blinkDelay);
    return () => clearInterval(interval);
  }, [isSleeping, actionState, emotion]);

  const clampedLevel = Math.max(1, Math.min(7, level));
  const stage = getGrowthStage(clampedLevel);
  const skinObj = SKIN_TONES.find((s) => s.color === appearance.skinTone) || SKIN_TONES[0];
  const outfitItem =
    STORE_ITEMS.find((i) => i.id === appearance.equippedOutfit) ||
    STORE_ITEMS.find((i) => i.id === 'outfit_pink_pastel')!;
  const adatItem = NUSANTARA_CLOTHING.find((c) => c.id === appearance.equippedOutfit) || null;
  const hatItem = appearance.equippedHat
    ? STORE_ITEMS.find((i) => i.id === appearance.equippedHat)
    : null;
  const glassesItem = appearance.equippedGlasses
    ? STORE_ITEMS.find((i) => i.id === appearance.equippedGlasses)
    : null;
  const shoesItem = appearance.equippedShoes
    ? STORE_ITEMS.find((i) => i.id === appearance.equippedShoes)
    : null;

  // Stage flags (1..7)
  const isNewborn = clampedLevel === 1;        // Stage 1: Swaddled Newborn (30% height)
  const isCrawlingBaby = clampedLevel === 2;   // Stage 2: Crawling / Sitting Baby (38% height)
  const isToddler = clampedLevel === 3;        // Stage 3: Toddler (48% height)
  const isYoungChild = clampedLevel === 4;     // Stage 4: Young Child (60% height)
  const isOlderChild = clampedLevel === 5;     // Stage 5: Older Child (75% height)
  const isTeenager = clampedLevel === 6;       // Stage 6: Teenager (90% height)
  const isAdult = clampedLevel >= 7;           // Stage 7: Adult (100% height)

  // Section 1: Relative height scale guideline (0.30, 0.38, 0.48, 0.60, 0.75, 0.90, 1.00)
  const officialRelativeScale = customVisualScale ?? stage.scale;

  // Section 7: Age-adjusted animation system (never use newborn animation for toddler or toddler for adult)
  const normalizedActionState: BabyActionState =
    actionState === 'crawling' && clampedLevel >= 3
      ? 'walking'
      : (actionState === 'reading' || actionState === 'studying' || actionState === 'cooking') &&
        clampedLevel <= 2
      ? 'playing'
      : actionState === 'walking' && clampedLevel === 1
      ? 'waving'
      : actionState === 'walking' && clampedLevel === 2
      ? 'crawling'
      : actionState;

  const effectiveState: BabyActionState = isCarried
    ? 'carried'
    : isSleeping
    ? 'sleeping'
    : normalizedActionState !== 'idle'
    ? normalizedActionState
    : emotion === 'sleepy' || needsSummary.isSleepy
    ? 'sleepy'
    : needsSummary.isHungry
    ? 'hungry'
    : emotion === 'bored'
    ? 'bored'
    : emotion === 'sad' || needsSummary.isSad
    ? 'crying'
    : cleanliness < 50
    ? 'scratching_head'
    : emotion === 'fresh'
    ? 'fresh'
    : 'idle';

  // Determine container motion class for smooth age-appropriate transitions (Section 7)
  const motionClass =
    seatedOnProp === 'swing' || seatedOnProp === 'slide' || seatedOnProp === 'seesaw'
      ? ''
      : effectiveState === 'carried'
      ? 'animate-carried-sway'
      : effectiveState === 'waking_up'
      ? 'animate-waking-stretch'
      : effectiveState === 'sleepy' || effectiveState === 'yawning' || effectiveState === 'bored'
      ? 'animate-sleepy-nod'
      : effectiveState === 'sleeping'
      ? inCrib
        ? 'animate-sleep-breathe-lying'
        : 'animate-sleep-breathe'
      : isNewborn && (effectiveState === 'playing' || effectiveState === 'laughing' || effectiveState === 'dancing')
      ? 'animate-breathe' // Newborn has gentle limited movements
      : effectiveState === 'make_heart' ||
        effectiveState === 'screen_touch' ||
        effectiveState === 'blow_kiss'
      ? 'scale-105 transition-transform duration-500 animate-bounce-happy'
      : effectiveState === 'laughing' ||
        effectiveState === 'playing' ||
        effectiveState === 'loved' ||
        effectiveState === 'dancing' ||
        effectiveState === 'fresh' ||
        effectiveState === 'big_smile' ||
        effectiveState === 'happy_jump' ||
        effectiveState === 'clap_hands'
      ? 'animate-bounce-happy'
      : effectiveState === 'crawling' || effectiveState === 'walking'
      ? 'animate-crawl'
      : 'animate-breathe';

  // Section 2 & 4: Stage-specific anatomical proportions (Head-to-body ratio, neck, torso length, leg length, shoulder width)
  // All stages are bottom-anchored at foot ground line Y ≈ 244 so feet never float or sink!
  const geo = isNewborn
    ? {
        // Stage 1: Newborn (30% height — Head is very large relative to compact swaddled body, short limbs, bottom anchored at 242)
        headX: 56,
        headY: 64,
        headW: 128,
        headH: 112,
        headRx: 56,
        cheekBulge: 10.5,
        chinWidth: 29,
        neckW: 0,
        neckY: 168,
        neckH: 0,
        eyeY: 122,
        leftEyeX: 91,
        rightEyeX: 149,
        eyeR: 13.2,
        mouthY: 150,
        torsoTop: 164,
        torsoBottom: 238,
        shoulderHalf: 38,
        hipHalf: 43,
        legTop: 222,
        legH: 16,
        armY: 178,
        armRx: 10,
        armRy: 15.5,
      }
    : isCrawlingBaby
    ? {
        // Stage 2: Crawling Baby (38% height — Large head, puffy cheeks, active chubby limbs for crawling & sitting)
        headX: 59,
        headY: 54,
        headW: 122,
        headH: 107,
        headRx: 53,
        cheekBulge: 8.2,
        chinWidth: 27,
        neckW: 18,
        neckY: 155,
        neckH: 6,
        eyeY: 111,
        leftEyeX: 92,
        rightEyeX: 148,
        eyeR: 12.8,
        mouthY: 139,
        torsoTop: 156,
        torsoBottom: 222,
        shoulderHalf: 40.5,
        hipHalf: 44,
        legTop: 208,
        legH: 28,
        armY: 173,
        armRx: 11.8,
        armRy: 19.5,
      }
    : isToddler
    ? {
        // Stage 3: Toddler (48% height — Upright posture, longer legs, head still larger than older children)
        headX: 63,
        headY: 46,
        headW: 114,
        headH: 100,
        headRx: 49,
        cheekBulge: 4.5,
        chinWidth: 23.5,
        neckW: 21,
        neckY: 141,
        neckH: 10,
        eyeY: 100,
        leftEyeX: 94,
        rightEyeX: 146,
        eyeR: 12.1,
        mouthY: 127,
        torsoTop: 145,
        torsoBottom: 208,
        shoulderHalf: 42.5,
        hipHalf: 42,
        legTop: 196,
        legH: 45,
        armY: 165,
        armRx: 11.6,
        armRy: 22.5,
      }
    : isYoungChild
    ? {
        // Stage 4: Young Child (60% height — Taller torso, longer legs & arms, upright agile posture)
        headX: 67,
        headY: 36,
        headW: 106,
        headH: 94,
        headRx: 44,
        cheekBulge: 1.2,
        chinWidth: 20,
        neckW: 23,
        neckY: 125,
        neckH: 12,
        eyeY: 87,
        leftEyeX: 95,
        rightEyeX: 145,
        eyeR: 11.3,
        mouthY: 115,
        torsoTop: 131,
        torsoBottom: 199,
        shoulderHalf: 44.5,
        hipHalf: 41,
        legTop: 190,
        legH: 52,
        armY: 156,
        armRx: 11.4,
        armRy: 26,
      }
    : isOlderChild
    ? {
        // Stage 5: Older Child (75% height — Approaching teen proportions, athletic limb reach)
        headX: 70,
        headY: 28,
        headW: 100,
        headH: 89,
        headRx: 40,
        cheekBulge: -1.5,
        chinWidth: 17,
        neckW: 24,
        neckY: 113,
        neckH: 14,
        eyeY: 77,
        leftEyeX: 96,
        rightEyeX: 144,
        eyeR: 10.6,
        mouthY: 105,
        torsoTop: 121,
        torsoBottom: 194,
        shoulderHalf: 46.8,
        hipHalf: 40.5,
        legTop: 185,
        legH: 57,
        armY: 150,
        armRx: 11,
        armRy: 29,
      }
    : isTeenager
    ? {
        // Stage 6: Teenager (90% height — Near-adult height, upright posture, longer legs & torso)
        headX: 73,
        headY: 21,
        headW: 94,
        headH: 85,
        headRx: 36,
        cheekBulge: -3.8,
        chinWidth: 14.5,
        neckW: 26,
        neckY: 102,
        neckH: 16,
        eyeY: 68,
        leftEyeX: 98,
        rightEyeX: 142,
        eyeR: 9.8,
        mouthY: 95,
        torsoTop: 112,
        torsoBottom: 190,
        shoulderHalf: 49.5,
        hipHalf: 40,
        legTop: 182,
        legH: 60,
        armY: 144,
        armRx: 10.6,
        armRy: 32,
      }
    : {
        // Stage 7: Adult (100% base height — Full adult head-to-body ratio, tall posture, long legs)
        headX: 75,
        headY: 14,
        headW: 90,
        headH: 82,
        headRx: 33,
        cheekBulge: -5.2,
        chinWidth: 13,
        neckW: 28,
        neckY: 92,
        neckH: 18,
        eyeY: 60,
        leftEyeX: 99,
        rightEyeX: 141,
        eyeR: 9.3,
        mouthY: 87,
        torsoTop: 104,
        torsoBottom: 187,
        shoulderHalf: 53,
        hipHalf: 41.5,
        legTop: 179,
        legH: 65,
        armY: 138,
        armRx: 11,
        armRy: 34.5,
      };

  // Dynamic anatomical face contour path:
  // - Stages 1-2: Wide, soft forehead + bulging chubby lower baby cheeks + round soft chin
  // - Stages 3-4: Balanced, soft child oval
  // - Stages 5-7: Defined temples + slimmer cheekbones + tapered jawline and sculpted chin
  const faceContourPath = (() => {
    const cx = 120;
    const topY = geo.headY;
    const botY = geo.headY + geo.headH;
    const halfW = geo.headW / 2;
    const templeY = topY + geo.headH * 0.34;
    const cheekY = topY + geo.headH * 0.66;
    const jawY = topY + geo.headH * 0.86;
    const cheekHalfW = halfW + geo.cheekBulge;
    const jawHalfW = Math.max(geo.chinWidth + 8, halfW * 0.72 + geo.cheekBulge * 1.15);

    return [
      `M ${cx} ${topY}`,
      // Right forehead to temple
      `C ${cx + halfW * 0.84} ${topY}, ${cx + halfW} ${topY + geo.headH * 0.14}, ${cx + halfW} ${templeY}`,
      // Right temple to lower cheek (bulges outward on babies, tapers smoothly on teens/adults)
      `C ${cx + halfW} ${topY + geo.headH * 0.5}, ${cx + cheekHalfW} ${topY + geo.headH * 0.55}, ${cx + cheekHalfW} ${cheekY}`,
      // Right cheek to jawline and chin
      `C ${cx + cheekHalfW} ${jawY}, ${cx + jawHalfW} ${botY}, ${cx} ${botY}`,
      // Left chin and jawline to left cheek
      `C ${cx - jawHalfW} ${botY}, ${cx - cheekHalfW} ${jawY}, ${cx - cheekHalfW} ${cheekY}`,
      // Left cheek to left temple
      `C ${cx - cheekHalfW} ${topY + geo.headH * 0.55}, ${cx - halfW} ${topY + geo.headH * 0.5}, ${cx - halfW} ${templeY}`,
      // Left temple back to top crown
      `C ${cx - halfW} ${topY + geo.headH * 0.14}, ${cx - halfW * 0.84} ${topY}, ${cx} ${topY}`,
      'Z',
    ].join(' ');
  })();

  // Hair growth factor (0.0 at Stage 1 Newborn -> 1.0 at Stage 7 Adult)
  const hairGrowth = (clampedLevel - 1) / 6;

  const isSeatedOnSurface = (Boolean(seatedOnProp) || Boolean(beachPose)) && !isCarried && !inCrib;

  const isSeated =
    isSeatedOnSurface ||
    (isCrawlingBaby && effectiveState !== 'crawling' && !isCarried && !inCrib);

  // Child-friendly modest bath wrap when inside bathtub
  const isWearingBathWrap = inBathTub || effectiveState === 'bathing';
  const isTowelDrying = effectiveState === 'towel_drying';

  // Per-zone foam levels (from interactive bathing or general soapFoamActive)
  const foamHead = bathingProgress ? bathingProgress.head.foam : soapFoamActive ? 85 : 0;
  const foamBody = bathingProgress ? bathingProgress.body.foam : soapFoamActive ? 85 : 0;
  const foamLeftArm = bathingProgress ? bathingProgress.leftArm.foam : soapFoamActive ? 75 : 0;
  const foamRightArm = bathingProgress ? bathingProgress.rightArm.foam : soapFoamActive ? 75 : 0;
  const foamLeftLeg = bathingProgress ? bathingProgress.leftLeg.foam : soapFoamActive ? 70 : 0;
  const foamRightLeg = bathingProgress ? bathingProgress.rightLeg.foam : soapFoamActive ? 70 : 0;
  const anyFoam =
    foamHead > 5 ||
    foamBody > 5 ||
    foamLeftArm > 5 ||
    foamRightArm > 5 ||
    foamLeftLeg > 5 ||
    foamRightLeg > 5;

  // Visual smudge / messy state before bath when cleanliness is low
  const isDirtyBeforeBath = cleanliness < 55 && !anyFoam && !isShowerRinsing;
  const isFreshSparkling = (emotion === 'fresh' || cleanliness >= 90) && !isDirtyBeforeBath;

  return (
    <div
      onClick={onClickBaby}
      style={{
        transformOrigin: inCrib ? '50% 50%' : '50% 91.5%',
        transform: inCrib
          ? `scale(${applyAgeProportionScale ? Math.min(0.62, Math.max(0.46, officialRelativeScale * 0.62)) : 0.56}) rotate(-82deg)`
          : applyAgeProportionScale
          ? `scale(${officialRelativeScale})`
          : undefined,
      }}
      className={`relative select-none cursor-grab active:cursor-grabbing transition-transform duration-500 ${sizeClass} flex items-center justify-center group`}
    >
      <svg
        viewBox="0 0 240 270"
        className={`w-full h-full overflow-visible ${inCrib ? 'drop-shadow-[0_4px_6px_rgba(45,37,32,0.18)]' : 'drop-shadow-[0_14px_18px_rgba(45,37,32,0.22)]'} ${
          culturalPose === 'traditional_dance'
            ? 'animate-trad-dance-body'
            : culturalPose === 'playing_angklung'
            ? 'animate-beach-relax'
            : beachPose === 'relaxing'
            ? 'animate-beach-relax'
            : motionClass
        }`}
      >
        <defs>
          <radialGradient id={`shadowGrad_${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(35,25,20,0.34)" />
            <stop offset="65%" stopColor="rgba(35,25,20,0.14)" />
            <stop offset="100%" stopColor="rgba(35,25,20,0)" />
          </radialGradient>

          <radialGradient id={`skinVol_${uid}`} cx="38%" cy="30%" r="68%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
            <stop offset="55%" stopColor={skinObj.color} stopOpacity="0" />
            <stop offset="100%" stopColor="#5C3A21" stopOpacity="0.18" />
          </radialGradient>

          <radialGradient id={`cheekBlush_${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={skinObj.cheek} stopOpacity="0.72" />
            <stop offset="100%" stopColor={skinObj.cheek} stopOpacity="0" />
          </radialGradient>

          <radialGradient id={`irisGrad_${uid}`} cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
            <stop offset="40%" stopColor={appearance.eyeColor} stopOpacity="1" />
            <stop offset="100%" stopColor="#1E1B18" stopOpacity="0.9" />
          </radialGradient>

          <linearGradient id={`fabricShade_${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.24" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="100%" stopColor="#1C1917" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id={`pillowGrad_${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#E2E8F0" />
          </linearGradient>
        </defs>

        <g
          transform={
            inCrib
              ? `translate(0, ${135 - (geo.torsoTop + 2)})`
              : isSeatedOnSurface
              ? `translate(0, ${242 - geo.torsoBottom})`
              : undefined
          }
        >
        {/* ==================== 2.5D CONTACT SHADOW WHEN STANDING / CARRIED (Omitted in crib or seated on playground slide/swing) ==================== */}
        {!inCrib && !seatedOnProp && (
          <ellipse
            cx="120"
            cy={isCarried ? '258' : '247'}
            rx={isCarried ? '44' : '68'}
            ry={isCarried ? '10' : '16'}
            fill={`url(#shadowGrad_${uid})`}
            className="transition-all duration-300"
          />
        )}

        {/* Carrier Warm Lifting Aura when Picked Up / Dragged */}
        {isCarried && (
          <g opacity="0.88">
            <ellipse
              cx="120"
              cy="176"
              rx="66"
              ry="56"
              fill="none"
              stroke="#FDE047"
              strokeWidth="3"
              strokeDasharray="8 6"
            />
            <path
              d="M 52 174 Q 64 198 88 194"
              fill="none"
              stroke="#FBBF24"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M 188 174 Q 176 198 152 194"
              fill="none"
              stroke="#FBBF24"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Animal Costume Hood / Dino Back Spikes Behind Body (Stages 2..7) */}
        {!isNewborn && !isWearingBathWrap && outfitItem.pattern === 'animal_bunny' && (
          <g>
            <ellipse
              cx="94"
              cy={geo.headY - 12}
              rx="12"
              ry="28"
              transform={`rotate(-10 94 ${geo.headY - 12})`}
              fill={outfitItem.primaryColor}
              stroke="#2D2520"
              strokeWidth="2.8"
            />
            <ellipse
              cx="94"
              cy={geo.headY - 10}
              rx="6"
              ry="18"
              transform={`rotate(-10 94 ${geo.headY - 10})`}
              fill={outfitItem.secondaryColor}
            />
            <ellipse
              cx="146"
              cy={geo.headY - 12}
              rx="12"
              ry="28"
              transform={`rotate(10 146 ${geo.headY - 12})`}
              fill={outfitItem.primaryColor}
              stroke="#2D2520"
              strokeWidth="2.8"
            />
            <ellipse
              cx="146"
              cy={geo.headY - 10}
              rx="6"
              ry="18"
              transform={`rotate(10 146 ${geo.headY - 10})`}
              fill={outfitItem.secondaryColor}
            />
          </g>
        )}

        {!isNewborn && !isWearingBathWrap && outfitItem.pattern === 'animal_bear' && (
          <g>
            <circle
              cx={geo.headX + 10}
              cy={geo.headY + 8}
              r="16"
              fill={outfitItem.primaryColor}
              stroke="#2D2520"
              strokeWidth="2.8"
            />
            <circle cx={geo.headX + 10} cy={geo.headY + 8} r="9" fill={outfitItem.secondaryColor} />
            <circle
              cx={geo.headX + geo.headW - 10}
              cy={geo.headY + 8}
              r="16"
              fill={outfitItem.primaryColor}
              stroke="#2D2520"
              strokeWidth="2.8"
            />
            <circle
              cx={geo.headX + geo.headW - 10}
              cy={geo.headY + 8}
              r="9"
              fill={outfitItem.secondaryColor}
            />
          </g>
        )}

        {!isNewborn && !isWearingBathWrap && outfitItem.pattern === 'animal_dino' && (
          <g>
            <polygon
              points={`120,${geo.headY - 18} 110,${geo.headY} 130,${geo.headY}`}
              fill="#F59E0B"
              stroke="#2D2520"
              strokeWidth="2.5"
            />
            <path
              d="M 155 192 Q 192 192 196 170 Q 182 176 164 174 Z"
              fill={outfitItem.primaryColor}
              stroke="#2D2520"
              strokeWidth="2.8"
            />
          </g>
        )}

        {/* ==================== LEGS & FEET (Stage-Specific Geometry) ==================== */}
        {isNewborn ? (
          // STAGE 1: Newborn legs are tucked inside the soft swaddle bundle (unless bathing in tub)
          isWearingBathWrap ? (
            <g>
              <ellipse
                cx="96"
                cy="228"
                rx="16"
                ry="12"
                transform="rotate(-14 96 228)"
                fill={skinObj.color}
                stroke="#2D2520"
                strokeWidth="2.6"
              />
              <ellipse
                cx="144"
                cy="228"
                rx="16"
                ry="12"
                transform="rotate(14 144 228)"
                fill={skinObj.color}
                stroke="#2D2520"
                strokeWidth="2.6"
              />
            </g>
          ) : null
        ) : isSeated ? (
          // STAGE 2: Crawling / Sitting Baby Chubby Legs (or seated on playground swing / slide / seesaw — hip-anchored for all 7 stages!)
          (() => {
            const seatLegY = isSeatedOnSurface ? geo.torsoBottom + 1 : 226;
            const leftLegX = isSeatedOnSurface ? 120 - Math.max(22, geo.hipHalf * 0.72) : 86;
            const rightLegX = isSeatedOnSurface ? 120 + Math.max(22, geo.hipHalf * 0.72) : 154;
            return (
              <g>
                <g className={effectiveState === 'laughing' || seatedOnProp === 'swing' || seatedOnProp === 'seesaw' ? 'animate-limb-left' : ''}>
                  <ellipse
                    cx={leftLegX}
                    cy={seatLegY}
                    rx={isSeatedOnSurface ? 18 : 23}
                    ry={isSeatedOnSurface ? 13 : 15.5}
                    transform={`rotate(-12 ${leftLegX} ${seatLegY})`}
                    fill={shoesItem && !isWearingBathWrap ? shoesItem.primaryColor : skinObj.color}
                    stroke="#2D2520"
                    strokeWidth="2.8"
                  />
                  <ellipse
                    cx={leftLegX}
                    cy={seatLegY}
                    rx={isSeatedOnSurface ? 17 : 22}
                    ry={isSeatedOnSurface ? 12 : 14.5}
                    transform={`rotate(-12 ${leftLegX} ${seatLegY})`}
                    fill={`url(#skinVol_${uid})`}
                  />
                </g>

                <g className={effectiveState === 'laughing' || seatedOnProp === 'swing' || seatedOnProp === 'seesaw' ? 'animate-limb-right' : ''}>
                  <ellipse
                    cx={rightLegX}
                    cy={seatLegY}
                    rx={isSeatedOnSurface ? 18 : 23}
                    ry={isSeatedOnSurface ? 13 : 15.5}
                    transform={`rotate(12 ${rightLegX} ${seatLegY})`}
                    fill={shoesItem && !isWearingBathWrap ? shoesItem.primaryColor : skinObj.color}
                    stroke="#2D2520"
                    strokeWidth="2.8"
                  />
                  <ellipse
                    cx={rightLegX}
                    cy={seatLegY}
                    rx={isSeatedOnSurface ? 17 : 22}
                    ry={isSeatedOnSurface ? 12 : 14.5}
                    transform={`rotate(12 ${rightLegX} ${seatLegY})`}
                    fill={`url(#skinVol_${uid})`}
                  />
                </g>
              </g>
            );
          })()
        ) : (
          // STAGES 3..7: Standing / Walking / Teen / Adult Proportioned Legs (Bottom Anchored at Foot Y = 244)
          <g>
            {/* Left Leg */}
            <g
              className={
                isCarried || effectiveState === 'walking' || effectiveState === 'dancing'
                  ? 'animate-limb-left'
                  : ''
              }
            >
              <rect
                x="90"
                y={geo.legTop}
                width={isTeenager || isAdult ? '19' : '21'}
                height={geo.legH}
                rx="9.5"
                fill={
                  !isWearingBathWrap && (isTeenager || isAdult) && !adatItem
                    ? '#334155' // Teen/Adult trousers when not wearing sarong/adat
                    : !isWearingBathWrap && isAdult && adatItem
                    ? adatItem.secondaryColor
                    : skinObj.color
                }
                stroke="#2D2520"
                strokeWidth="2.8"
              />
              {/* Young/Older Child Socks */}
              {!isWearingBathWrap && (isYoungChild || isOlderChild) && (
                <rect
                  x="90"
                  y={geo.legTop + geo.legH - 16}
                  width="21"
                  height="14"
                  rx="4"
                  fill="#FFFFFF"
                  stroke="#2D2520"
                  strokeWidth="2"
                />
              )}
              <ellipse
                cx="99"
                cy={geo.legTop + geo.legH}
                rx="16"
                ry="9.5"
                fill={
                  shoesItem && !isWearingBathWrap
                    ? shoesItem.primaryColor
                    : !isWearingBathWrap && clampedLevel >= 4
                    ? '#475569'
                    : skinObj.color
                }
                stroke="#2D2520"
                strokeWidth="2.8"
              />
            </g>

            {/* Right Leg */}
            <g
              className={
                isCarried || effectiveState === 'walking' || effectiveState === 'dancing'
                  ? 'animate-limb-right'
                  : ''
              }
            >
              <rect
                x="130"
                y={geo.legTop}
                width={isTeenager || isAdult ? '19' : '21'}
                height={geo.legH}
                rx="9.5"
                fill={
                  !isWearingBathWrap && (isTeenager || isAdult) && !adatItem
                    ? '#334155'
                    : !isWearingBathWrap && isAdult && adatItem
                    ? adatItem.secondaryColor
                    : skinObj.color
                }
                stroke="#2D2520"
                strokeWidth="2.8"
              />
              {!isWearingBathWrap && (isYoungChild || isOlderChild) && (
                <rect
                  x="130"
                  y={geo.legTop + geo.legH - 16}
                  width="21"
                  height="14"
                  rx="4"
                  fill="#FFFFFF"
                  stroke="#2D2520"
                  strokeWidth="2"
                />
              )}
              <ellipse
                cx="141"
                cy={geo.legTop + geo.legH}
                rx="16"
                ry="9.5"
                fill={
                  shoesItem && !isWearingBathWrap
                    ? shoesItem.primaryColor
                    : !isWearingBathWrap && clampedLevel >= 4
                    ? '#475569'
                    : skinObj.color
                }
                stroke="#2D2520"
                strokeWidth="2.8"
              />
            </g>
          </g>
        )}

        {/* ==================== TORSO & STAGE-SPECIFIC CLOTHING SILHOUETTE (SECTION 6) ==================== */}
        <g>
          {/* Neck Shadow */}
          <ellipse
            cx="120"
            cy={geo.torsoTop + 2}
            rx="20"
            ry="7"
            fill="rgba(45,37,32,0.18)"
          />

          {isWearingBathWrap ? (
            // Child-Friendly Modest Bath Wrap / Swim Diaper for All Ages during Bathing
            <g>
              <path
                d={`M ${120 - geo.shoulderHalf} ${geo.torsoTop} C ${120 - geo.hipHalf - 6} ${
                  geo.torsoTop + 28
                }, ${120 - geo.hipHalf - 4} ${geo.torsoBottom - 6}, ${120 - 24} ${
                  geo.torsoBottom
                } L ${120 + 24} ${geo.torsoBottom} C ${120 + geo.hipHalf + 4} ${
                  geo.torsoBottom - 6
                }, ${120 + geo.hipHalf + 6} ${geo.torsoTop + 28}, ${120 + geo.shoulderHalf} ${
                  geo.torsoTop
                } Z`}
                fill={skinObj.color}
                stroke="#2D2520"
                strokeWidth="3"
              />
              <path
                d={`M ${120 - geo.shoulderHalf} ${geo.torsoTop} C ${120 - geo.hipHalf - 6} ${
                  geo.torsoTop + 28
                }, ${120 - geo.hipHalf - 4} ${geo.torsoBottom - 6}, ${120 - 24} ${
                  geo.torsoBottom
                } L ${120 + 24} ${geo.torsoBottom} C ${120 + geo.hipHalf + 4} ${
                  geo.torsoBottom - 6
                }, ${120 + geo.hipHalf + 6} ${geo.torsoTop + 28}, ${120 + geo.shoulderHalf} ${
                  geo.torsoTop
                } Z`}
                fill={`url(#skinVol_${uid})`}
              />
              {/* Modest Soft Aqua Bath Wrap Towel */}
              <path
                d={`M ${120 - geo.hipHalf} ${geo.torsoTop + 22} L ${120 + geo.hipHalf} ${
                  geo.torsoTop + 22
                } L ${120 + geo.hipHalf - 6} ${geo.torsoBottom + 2} L ${120 - geo.hipHalf + 6} ${
                  geo.torsoBottom + 2
                } Z`}
                fill="#BAE6FD"
                stroke="#2D2520"
                strokeWidth="2.8"
              />
              <line
                x1={120 - geo.hipHalf + 2}
                y1={geo.torsoTop + 28}
                x2={120 + geo.hipHalf - 2}
                y2={geo.torsoTop + 28}
                stroke="#38BDF8"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>
          ) : isTowelDrying ? (
            // Fluffy Hooded Bath Towel Drying Wrap
            <g>
              <path
                d={`M 70 ${geo.torsoTop - 4} C 64 178, 68 218, 92 224 L 148 224 C 172 218, 176 178, 170 ${
                  geo.torsoTop - 4
                } Z`}
                fill="#FEF3C7"
                stroke="#2D2520"
                strokeWidth="3.2"
              />
              <path
                d={`M 86 ${geo.torsoTop} L 120 222 L 154 ${geo.torsoTop}`}
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </g>
          ) : isNewborn ? (
            // ==================== STAGE 1: NEWBORN CLOTHING SPRITE (SWADDLE BUNDLE) ====================
            <g>
              {/* Rounded Cocoon Swaddle Body */}
              <path
                d="M 78 158 C 64 182, 68 236, 120 242 C 172 236, 176 182, 162 158 Z"
                fill={adatItem ? adatItem.primaryColor : outfitItem.primaryColor}
                stroke="#2D2520"
                strokeWidth="3.2"
              />
              <path
                d="M 78 158 C 64 182, 68 236, 120 242 C 172 236, 176 182, 162 158 Z"
                fill={`url(#fabricShade_${uid})`}
              />
              {/* Soft Diagonal Swaddle Fold Lines */}
              <path
                d="M 76 172 Q 120 198 162 170"
                fill="none"
                stroke={adatItem ? adatItem.secondaryColor : outfitItem.secondaryColor}
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M 80 174 L 154 220 M 160 174 L 88 212"
                fill="none"
                stroke="rgba(45,37,32,0.22)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              {/* Cute Satin Swaddle Bow Band around tummy */}
              <rect
                x="72"
                y="194"
                width="96"
                height="14"
                rx="7"
                fill={adatItem ? adatItem.accentColor || '#FACC15' : outfitItem.secondaryColor}
                stroke="#2D2520"
                strokeWidth="2.4"
              />
              <circle
                cx="120"
                cy="201"
                r="7"
                fill="#FFFDF9"
                stroke="#2D2520"
                strokeWidth="2.2"
              />
            </g>
          ) : (
            // ==================== STAGES 2..7: DISTINCT AGE-TAILORED CLOTHING SPRITES ====================
            <g>
              {/* Main Torso Garment */}
              <path
                d={`M ${120 - geo.shoulderHalf} ${geo.torsoTop} C ${120 - geo.hipHalf - 6} ${
                  geo.torsoTop + 26
                }, ${120 - geo.hipHalf - 4} ${geo.torsoBottom - 6}, ${120 - 26} ${
                  geo.torsoBottom
                } L ${120 + 26} ${geo.torsoBottom} C ${120 + geo.hipHalf + 4} ${
                  geo.torsoBottom - 6
                }, ${120 + geo.hipHalf + 6} ${geo.torsoTop + 26}, ${120 + geo.shoulderHalf} ${
                  geo.torsoTop
                } Z`}
                fill={adatItem ? adatItem.primaryColor : outfitItem.primaryColor}
                stroke="#2D2520"
                strokeWidth="3.2"
              />
              <path
                d={`M ${120 - geo.shoulderHalf} ${geo.torsoTop} C ${120 - geo.hipHalf - 6} ${
                  geo.torsoTop + 26
                }, ${120 - geo.hipHalf - 4} ${geo.torsoBottom - 6}, ${120 - 26} ${
                  geo.torsoBottom
                } L ${120 + 26} ${geo.torsoBottom} C ${120 + geo.hipHalf + 4} ${
                  geo.torsoBottom - 6
                }, ${120 + geo.hipHalf + 6} ${geo.torsoTop + 26}, ${120 + geo.shoulderHalf} ${
                  geo.torsoTop
                } Z`}
                fill={`url(#fabricShade_${uid})`}
                pointerEvents="none"
              />

              {/* Fabric Creases */}
              <path
                d={`M 90 ${geo.torsoTop + 18} Q 100 ${geo.torsoTop + 26} 95 ${
                  geo.torsoTop + 38
                } M 150 ${geo.torsoTop + 18} Q 140 ${geo.torsoTop + 26} 145 ${geo.torsoTop + 38}`}
                fill="none"
                stroke="rgba(45,37,32,0.16)"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* Stage 2 Crawling Baby Clothing Sprite: Soft Baby Bib & Snap Buttons */}
              {isCrawlingBaby && !adatItem && (
                <g>
                  <path
                    d={`M 96 ${geo.torsoTop + 2} C 96 ${geo.torsoTop + 28}, 144 ${
                      geo.torsoTop + 28
                    }, 144 ${geo.torsoTop + 2} Z`}
                    fill="#FFFDF9"
                    stroke="#2D2520"
                    strokeWidth="2.2"
                  />
                  <circle cx="120" cy={geo.torsoTop + 14} r="4.5" fill={outfitItem.secondaryColor} />
                  <circle cx="110" cy={geo.torsoBottom - 8} r="2.2" fill="#2D2520" />
                  <circle cx="120" cy={geo.torsoBottom - 8} r="2.2" fill="#2D2520" />
                  <circle cx="130" cy={geo.torsoBottom - 8} r="2.2" fill="#2D2520" />
                </g>
              )}

              {/* Stage 3 Toddler Clothing Sprite: Overalls Pocket & Suspenders */}
              {isToddler && !adatItem && (
                <g>
                  <line
                    x1="96"
                    y1={geo.torsoTop + 4}
                    x2="96"
                    y2={geo.torsoTop + 28}
                    stroke={outfitItem.secondaryColor}
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <line
                    x1="144"
                    y1={geo.torsoTop + 4}
                    x2="144"
                    y2={geo.torsoTop + 28}
                    stroke={outfitItem.secondaryColor}
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <rect
                    x="104"
                    y={geo.torsoTop + 28}
                    width="32"
                    height="22"
                    rx="6"
                    fill={outfitItem.secondaryColor}
                    stroke="#2D2520"
                    strokeWidth="2"
                  />
                </g>
              )}

              {/* Stage 4 & 5 Young Child & Older Child Clothing Sprites: Two-Piece Skirt/Shorts & School Vest */}
              {(isYoungChild || isOlderChild) && !adatItem && (
                <g>
                  <path
                    d={`M ${120 - geo.hipHalf + 2} ${geo.torsoBottom - 22} L ${
                      120 + geo.hipHalf - 2
                    } ${geo.torsoBottom - 22} L ${120 + geo.hipHalf - 6} ${
                      geo.torsoBottom + 2
                    } L ${120 - geo.hipHalf + 6} ${geo.torsoBottom + 2} Z`}
                    fill={outfitItem.secondaryColor}
                    stroke="#2D2520"
                    strokeWidth="2.5"
                  />
                  {isYoungChild && (
                    // Young Child cheerful pocket & button
                    <circle
                      cx="134"
                      cy={geo.torsoTop + 26}
                      r="5"
                      fill={outfitItem.secondaryColor}
                      stroke="#2D2520"
                      strokeWidth="1.8"
                    />
                  )}
                  {isOlderChild && (
                    // Older Child school-age tie / badge detail
                    <polygon
                      points={`120,${geo.torsoTop + 10} 114,${geo.torsoTop + 32} 120,${
                        geo.torsoTop + 38
                      } 126,${geo.torsoTop + 32}`}
                      fill="#EF4444"
                      stroke="#2D2520"
                      strokeWidth="1.8"
                    />
                  )}
                </g>
              )}

              {/* Stage 6 Teenager Clothing Sprite: Layered Jacket Lapels & Center Seam */}
              {isTeenager && !adatItem && (
                <g>
                  <line
                    x1="120"
                    y1={geo.torsoTop + 10}
                    x2="120"
                    y2={geo.torsoBottom}
                    stroke="#2D2520"
                    strokeWidth="2.8"
                  />
                  <path
                    d={`M 98 ${geo.torsoTop + 4} L 114 ${geo.torsoTop + 28} L 92 ${
                      geo.torsoTop + 26
                    } Z`}
                    fill={outfitItem.secondaryColor}
                    stroke="#2D2520"
                    strokeWidth="2"
                  />
                  <path
                    d={`M 142 ${geo.torsoTop + 4} L 126 ${geo.torsoTop + 28} L 148 ${
                      geo.torsoTop + 26
                    } Z`}
                    fill={outfitItem.secondaryColor}
                    stroke="#2D2520"
                    strokeWidth="2"
                  />
                </g>
              )}

              {/* Stage 7 Adult Clothing Sprite: Tailored Blazer/Tunic Belt & Sash */}
              {isAdult && !adatItem && (
                <g>
                  <line
                    x1="120"
                    y1={geo.torsoTop + 10}
                    x2="120"
                    y2={geo.torsoBottom}
                    stroke="#2D2520"
                    strokeWidth="2.4"
                  />
                  <rect
                    x={120 - geo.hipHalf + 3}
                    y={geo.torsoBottom - 16}
                    width={(geo.hipHalf - 3) * 2}
                    height="10"
                    rx="4"
                    fill={outfitItem.secondaryColor}
                    stroke="#2D2520"
                    strokeWidth="2"
                  />
                  <rect
                    x="114"
                    y={geo.torsoBottom - 17}
                    width="12"
                    height="12"
                    rx="2"
                    fill="#FACC15"
                    stroke="#2D2520"
                    strokeWidth="2"
                  />
                </g>
              )}

              {/* Collar */}
              <path
                d={`M 94 ${geo.torsoTop} Q 120 ${geo.torsoTop + 16} 146 ${geo.torsoTop}`}
                fill="none"
                stroke={adatItem ? adatItem.secondaryColor : outfitItem.secondaryColor}
                strokeWidth="6.5"
                strokeLinecap="round"
              />

              {/* Outfit Pattern Details */}
              {outfitItem.pattern === 'stars' && (
                <g fill={outfitItem.secondaryColor}>
                  <circle cx="105" cy={geo.torsoTop + 26} r="4" />
                  <circle cx="135" cy={geo.torsoTop + 24} r="4" />
                  <polygon
                    points={`120,${geo.torsoTop + 28} 123,${geo.torsoTop + 35} 130,${
                      geo.torsoTop + 35
                    } 124,${geo.torsoTop + 40} 126,${geo.torsoTop + 47} 120,${
                      geo.torsoTop + 42
                    } 114,${geo.torsoTop + 47} 116,${geo.torsoTop + 40} 110,${
                      geo.torsoTop + 35
                    } 117,${geo.torsoTop + 35}`}
                  />
                </g>
              )}

              {outfitItem.pattern === 'stripes' && (
                <g stroke={outfitItem.secondaryColor} strokeWidth="5">
                  <line x1="80" y1={geo.torsoTop + 22} x2="160" y2={geo.torsoTop + 22} />
                  <line x1="78" y1={geo.torsoTop + 38} x2="162" y2={geo.torsoTop + 38} />
                </g>
              )}

              {outfitItem.pattern === 'floral' && (
                <g>
                  <circle cx="120" cy={geo.torsoTop + 30} r="9" fill={outfitItem.secondaryColor} />
                  <circle cx="120" cy={geo.torsoTop + 30} r="4" fill="#FBBF24" />
                </g>
              )}

              {outfitItem.pattern === 'doctor' && (
                <g>
                  <path
                    d={`M 100 ${geo.torsoTop + 4} Q 100 ${geo.torsoTop + 32} 120 ${
                      geo.torsoTop + 32
                    } Q 140 ${geo.torsoTop + 32} 140 ${geo.torsoTop + 4}`}
                    fill="none"
                    stroke="#334155"
                    strokeWidth="3.5"
                  />
                  <circle
                    cx="120"
                    cy={geo.torsoTop + 38}
                    r="6"
                    fill="#38BDF8"
                    stroke="#334155"
                    strokeWidth="2.5"
                  />
                </g>
              )}

              {outfitItem.pattern === 'astronaut' && (
                <g>
                  <rect
                    x="102"
                    y={geo.torsoTop + 18}
                    width="36"
                    height="24"
                    rx="5"
                    fill="#1E293B"
                    stroke={outfitItem.secondaryColor}
                    strokeWidth="2.5"
                  />
                  <circle cx="112" cy={geo.torsoTop + 30} r="4" fill="#38BDF8" />
                  <circle cx="126" cy={geo.torsoTop + 30} r="4" fill="#F97316" />
                </g>
              )}

              {/* ==================== NUSANTARA TRADITIONAL CLOTHING SPRITES BY AGE STAGE (SECTION 6) ==================== */}
              {adatItem && (
                <g>
                  {/* Traditional kain / songket / batik lower wrap sized proportionally to stage */}
                  <path
                    d={`M ${120 - geo.hipHalf} ${geo.torsoBottom - (isAdult || isTeenager ? 32 : 24)} L ${
                      120 + geo.hipHalf
                    } ${geo.torsoBottom - (isAdult || isTeenager ? 32 : 24)} L ${120 + geo.hipHalf - 5} ${
                      geo.torsoBottom + (isAdult ? 12 : 6)
                    } L ${120 - geo.hipHalf + 5} ${geo.torsoBottom + (isAdult ? 12 : 6)} Z`}
                    fill={adatItem.secondaryColor}
                    stroke="#2D2520"
                    strokeWidth="2.6"
                  />
                  {/* Batik / Songket Diamond Motifs */}
                  <polygon
                    points={`104,${geo.torsoBottom - 10} 110,${geo.torsoBottom - 17} 116,${
                      geo.torsoBottom - 10
                    } 110,${geo.torsoBottom - 3}`}
                    fill={adatItem.primaryColor}
                  />
                  <polygon
                    points={`124,${geo.torsoBottom - 10} 130,${geo.torsoBottom - 17} 136,${
                      geo.torsoBottom - 10
                    } 130,${geo.torsoBottom - 3}`}
                    fill={adatItem.primaryColor}
                  />
                  {/* Ceremonial Selendang Sash (wider & ornate on Teenager & Adult stages) */}
                  <path
                    d={`M 88 ${geo.torsoTop + 2} L ${isAdult || isTeenager ? 108 : 102} ${geo.torsoTop} L 152 ${
                      geo.torsoBottom - 4
                    } L ${isAdult || isTeenager ? 132 : 138} ${geo.torsoBottom} Z`}
                    fill={adatItem.accentColor || '#FDE047'}
                    stroke="#2D2520"
                    strokeWidth="2.2"
                  />
                  {gender === 'girl' ? (
                    <g>
                      <circle
                        cx="120"
                        cy={geo.torsoTop + 16}
                        r={isAdult || isTeenager ? '7' : '5.5'}
                        fill="#FACC15"
                        stroke="#2D2520"
                        strokeWidth="2"
                      />
                      <circle
                        cx="120"
                        cy={geo.torsoTop + 30}
                        r="4.5"
                        fill="#FACC15"
                        stroke="#2D2520"
                        strokeWidth="1.8"
                      />
                    </g>
                  ) : (
                    <g>
                      <line
                        x1="120"
                        y1={geo.torsoTop + 2}
                        x2="120"
                        y2={geo.torsoBottom - 26}
                        stroke="#FACC15"
                        strokeWidth="3"
                      />
                      <circle cx="114" cy={geo.torsoTop + 16} r="3" fill="#FACC15" />
                      <circle cx="114" cy={geo.torsoTop + 30} r="3" fill="#FACC15" />
                    </g>
                  )}
                </g>
              )}

              {/* Stage 7 Adult Golden Ambassador Crest */}
              {isAdult && (
                <circle
                  cx="144"
                  cy={geo.torsoTop + 20}
                  r="7.5"
                  fill="#FBBF24"
                  stroke="#2D2520"
                  strokeWidth="2.2"
                />
              )}
            </g>
          )}

          {/* ==================== VISUAL SMUDGE SPOTS BEFORE BATH (WHEN CLEANLINESS < 55) ==================== */}
          {isDirtyBeforeBath && (
            <g opacity="0.62" fill="#92400E">
              <ellipse cx="104" cy={geo.torsoTop + 30} rx="9" ry="5.5" transform="rotate(-14 104 175)" />
              <circle cx="136" cy={geo.torsoTop + 42} r="5.5" />
              <circle cx="115" cy={geo.torsoTop + 48} r="4" />
            </g>
          )}
        </g>

        {/* ==================== ARTICULATED ARMS & HANDS ==================== */}
        {isNewborn && !isWearingBathWrap ? (
          // Stage 1 Newborn Tiny Hands Peeking from Swaddle Fold
          <g>
            <circle
              cx="92"
              cy="172"
              r="9.5"
              fill={skinObj.color}
              stroke="#2D2520"
              strokeWidth="2.6"
              className={effectiveState === 'waving' || effectiveState === 'hungry' ? 'animate-limb-left' : ''}
            />
            <circle
              cx="148"
              cy="172"
              r="9.5"
              fill={skinObj.color}
              stroke="#2D2520"
              strokeWidth="2.6"
              className={effectiveState === 'waving' || effectiveState === 'hungry' ? 'animate-limb-right' : ''}
            />
          </g>
        ) : (
          <g>
            {/* Flowing Traditional Batik Selendang (Sampur) behind Arms when Dancing at Pendopo */}
            {culturalPose === 'traditional_dance' && (
              <g className="animate-dance-selendang">
                <path
                  d={`M ${120 - geo.shoulderHalf - 4} ${geo.armY - 2} Q ${120 - geo.shoulderHalf - 34} ${geo.armY + 12} ${120 - geo.shoulderHalf - 28} ${geo.torsoBottom + 18} Q ${120 - geo.shoulderHalf - 16} ${geo.torsoBottom + 24} ${120 - geo.shoulderHalf - 8} ${geo.torsoBottom + 6} Z`}
                  fill="#F43F5E"
                  stroke="#FACC15"
                  strokeWidth="2.2"
                />
                <path
                  d={`M ${120 + geo.shoulderHalf + 4} ${geo.armY - 2} Q ${120 + geo.shoulderHalf + 34} ${geo.armY + 12} ${120 + geo.shoulderHalf + 28} ${geo.torsoBottom + 18} Q ${120 + geo.shoulderHalf + 16} ${geo.torsoBottom + 24} ${120 + geo.shoulderHalf + 8} ${geo.torsoBottom + 6} Z`}
                  fill="#F43F5E"
                  stroke="#FACC15"
                  strokeWidth="2.2"
                />
                {/* Golden Waist Sash Accent */}
                <path
                  d={`M ${120 - geo.hipHalf * 0.78} ${geo.torsoBottom - 16} Q 120 ${geo.torsoBottom - 10} ${120 + geo.hipHalf * 0.78} ${geo.torsoBottom - 16}`}
                  fill="none"
                  stroke="#FACC15"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* Left Arm */}
            <g
              className={
                culturalPose === 'playing_angklung'
                  ? 'animate-angklung-arm-left'
                  : culturalPose === 'traditional_dance'
                  ? 'animate-trad-dance-arm-left'
                  : beachPose === 'building_sandcastle'
                  ? 'animate-sand-build-left'
                  : beachPose === 'digging_sand'
                  ? 'animate-sand-dig-left'
                  : isCarried ||
                    effectiveState === 'waking_up' ||
                    effectiveState === 'laughing' ||
                    effectiveState === 'dancing' ||
                    effectiveState === 'happy_jump' ||
                    effectiveState === 'clap_hands' ||
                    effectiveState === 'big_smile'
                  ? 'animate-limb-left'
                  : ''
              }
            >
              <ellipse
                cx={
                  culturalPose === 'playing_angklung'
                    ? 98
                    : culturalPose === 'traditional_dance'
                    ? 120 - geo.shoulderHalf - 16
                    : beachPose === 'building_sandcastle' || beachPose === 'digging_sand'
                    ? 100
                    : effectiveState === 'make_heart' ||
                      effectiveState === 'clap_hands' ||
                      effectiveState === 'comfort_player'
                    ? 100
                    : 120 - geo.shoulderHalf - 10
                }
                cy={
                  culturalPose === 'playing_angklung'
                    ? geo.armY - 12
                    : culturalPose === 'traditional_dance'
                    ? geo.armY - 18
                    : beachPose === 'digging_sand'
                    ? geo.armY + 12
                    : beachPose === 'building_sandcastle'
                    ? geo.armY + 5
                    : beachPose === 'relaxing'
                    ? geo.armY + 4
                    : effectiveState === 'waking_up'
                    ? geo.torsoTop - 10
                    : effectiveState === 'make_heart' ||
                      effectiveState === 'clap_hands' ||
                      effectiveState === 'comfort_player'
                    ? geo.armY - 12
                    : effectiveState === 'waving' ||
                      effectiveState === 'laughing' ||
                      effectiveState === 'carried' ||
                      effectiveState === 'hungry' ||
                      effectiveState === 'dancing' ||
                      effectiveState === 'happy_jump' ||
                      effectiveState === 'big_smile'
                    ? geo.armY - 16
                    : geo.armY
                }
                rx={geo.armRx}
                ry={geo.armRy}
                transform={
                  culturalPose === 'playing_angklung'
                    ? `rotate(36 98 ${geo.armY - 12})`
                    : culturalPose === 'traditional_dance'
                    ? `rotate(-58 ${120 - geo.shoulderHalf - 16} ${geo.armY - 18})`
                    : beachPose === 'digging_sand'
                    ? `rotate(-26 100 ${geo.armY + 12})`
                    : beachPose === 'building_sandcastle'
                    ? `rotate(34 100 ${geo.armY + 5})`
                    : beachPose === 'relaxing'
                    ? `rotate(38 ${120 - geo.shoulderHalf - 10} ${geo.armY + 4})`
                    : effectiveState === 'waking_up'
                    ? `rotate(-65 ${120 - geo.shoulderHalf - 10} ${geo.torsoTop - 10})`
                    : effectiveState === 'make_heart' ||
                      effectiveState === 'clap_hands' ||
                      effectiveState === 'comfort_player'
                    ? `rotate(42 100 ${geo.armY - 12})`
                    : effectiveState === 'waving' ||
                      effectiveState === 'laughing' ||
                      effectiveState === 'carried' ||
                      effectiveState === 'dancing' ||
                      effectiveState === 'happy_jump' ||
                      effectiveState === 'big_smile'
                    ? `rotate(-45 ${120 - geo.shoulderHalf - 10} ${geo.armY - 16})`
                    : effectiveState === 'hungry'
                    ? `rotate(-28 ${120 - geo.shoulderHalf - 10} ${geo.armY - 16})`
                    : `rotate(22 ${120 - geo.shoulderHalf - 10} ${geo.armY})`
                }
                fill={skinObj.color}
                stroke="#2D2520"
                strokeWidth="2.8"
              />
              {/* Golden Bangle & Graceful Lentik Wrist Accent when Traditional Dancing */}
              {culturalPose === 'traditional_dance' && (
                <circle
                  cx={120 - geo.shoulderHalf - 28}
                  cy={geo.armY - 26}
                  r="4.2"
                  fill="#FACC15"
                  stroke="#92400E"
                  strokeWidth="1.5"
                />
              )}
              {/* Tiny Sand Puffs during Sandcastle Building / Digging */}
              {(beachPose === 'building_sandcastle' || beachPose === 'digging_sand') && (
                <g>
                  <circle cx="88" cy={geo.armY + 24} r="3.2" fill="#FDE047" opacity="0.88" />
                  <circle cx="96" cy={geo.armY + 28} r="2.4" fill="#F59E0B" opacity="0.82" />
                </g>
              )}
            </g>

            {/* Right Arm */}
            <g
              className={
                culturalPose === 'playing_angklung'
                  ? 'animate-angklung-arm-right'
                  : culturalPose === 'traditional_dance'
                  ? 'animate-trad-dance-arm-right'
                  : beachPose === 'building_sandcastle'
                  ? 'animate-sand-build-right'
                  : beachPose === 'digging_sand'
                  ? 'animate-sand-dig-right'
                  : beachPose === 'eating_picnic'
                  ? 'animate-picnic-eat-hand'
                  : isCarried ||
                    effectiveState === 'waking_up' ||
                    effectiveState === 'laughing' ||
                    effectiveState === 'dancing' ||
                    effectiveState === 'scratching_head' ||
                    effectiveState === 'happy_jump' ||
                    effectiveState === 'clap_hands' ||
                    effectiveState === 'big_smile' ||
                    effectiveState === 'waving'
                  ? 'animate-limb-right'
                  : ''
              }
            >
              <ellipse
                cx={
                  culturalPose === 'playing_angklung'
                    ? 142
                    : culturalPose === 'traditional_dance'
                    ? 120 + geo.shoulderHalf + 16
                    : beachPose === 'building_sandcastle' || beachPose === 'digging_sand'
                    ? 142
                    : beachPose === 'eating_picnic'
                    ? 136
                    : effectiveState === 'make_heart' ||
                      effectiveState === 'clap_hands' ||
                      effectiveState === 'comfort_player'
                    ? 140
                    : effectiveState === 'blow_kiss'
                    ? 130
                    : 120 + geo.shoulderHalf + 10
                }
                cy={
                  culturalPose === 'playing_angklung'
                    ? geo.armY + 2
                    : culturalPose === 'traditional_dance'
                    ? geo.armY - 14
                    : beachPose === 'digging_sand'
                    ? geo.armY + 12
                    : beachPose === 'building_sandcastle'
                    ? geo.armY + 4
                    : beachPose === 'eating_picnic'
                    ? geo.armY - 10
                    : beachPose === 'relaxing'
                    ? geo.armY + 4
                    : effectiveState === 'waking_up' || effectiveState === 'scratching_head'
                    ? geo.torsoTop - 12
                    : effectiveState === 'blow_kiss'
                    ? geo.mouthY + 6
                    : effectiveState === 'make_heart' ||
                      effectiveState === 'clap_hands' ||
                      effectiveState === 'comfort_player'
                    ? geo.armY - 12
                    : effectiveState === 'waving' ||
                      effectiveState === 'playing' ||
                      effectiveState === 'carried' ||
                      effectiveState === 'hungry' ||
                      effectiveState === 'dancing' ||
                      effectiveState === 'happy_jump' ||
                      effectiveState === 'big_smile'
                    ? geo.armY - 16
                    : geo.armY
                }
                rx={geo.armRx}
                ry={geo.armRy}
                transform={
                  culturalPose === 'playing_angklung'
                    ? `rotate(-40 142 ${geo.armY + 2})`
                    : culturalPose === 'traditional_dance'
                    ? `rotate(56 ${120 + geo.shoulderHalf + 16} ${geo.armY - 14})`
                    : beachPose === 'digging_sand'
                    ? `rotate(26 142 ${geo.armY + 12})`
                    : beachPose === 'building_sandcastle'
                    ? `rotate(-34 142 ${geo.armY + 4})`
                    : beachPose === 'eating_picnic'
                    ? `rotate(-52 136 ${geo.armY - 10})`
                    : beachPose === 'relaxing'
                    ? `rotate(-38 ${120 + geo.shoulderHalf + 10} ${geo.armY + 4})`
                    : effectiveState === 'waking_up' || effectiveState === 'scratching_head'
                    ? `rotate(68 ${120 + geo.shoulderHalf + 10} ${geo.torsoTop - 12})`
                    : effectiveState === 'make_heart' ||
                      effectiveState === 'clap_hands' ||
                      effectiveState === 'comfort_player'
                    ? `rotate(-42 140 ${geo.armY - 12})`
                    : effectiveState === 'blow_kiss'
                    ? `rotate(-55 130 ${geo.mouthY + 6})`
                    : effectiveState === 'waving' ||
                      effectiveState === 'playing' ||
                      effectiveState === 'carried' ||
                      effectiveState === 'dancing' ||
                      effectiveState === 'happy_jump' ||
                      effectiveState === 'big_smile'
                    ? `rotate(45 ${120 + geo.shoulderHalf + 10} ${geo.armY - 16})`
                    : effectiveState === 'hungry'
                    ? `rotate(28 ${120 + geo.shoulderHalf + 10} ${geo.armY - 16})`
                    : `rotate(-22 ${120 + geo.shoulderHalf + 10} ${geo.armY})`
                }
                fill={skinObj.color}
                stroke="#2D2520"
                strokeWidth="2.8"
              />
              {/* Golden Bangle Accent on Right Wrist when Traditional Dancing */}
              {culturalPose === 'traditional_dance' && (
                <circle
                  cx={120 + geo.shoulderHalf + 28}
                  cy={geo.armY - 22}
                  r="4.2"
                  fill="#FACC15"
                  stroke="#92400E"
                  strokeWidth="1.5"
                />
              )}
              {/* Mini Beach Shovel Held in Right Hand when Building Sandcastle or Digging Sand */}
              {(beachPose === 'building_sandcastle' || beachPose === 'digging_sand') && (
                <g transform={`translate(152, ${geo.armY + 14}) rotate(${beachPose === 'digging_sand' ? 28 : -16})`}>
                  <rect x="-2.5" y="-12" width="5" height="16" rx="2.5" fill="#38BDF8" stroke="#2D2520" strokeWidth="1.6" />
                  <path d="M -7 4 L 7 4 L 5 15 Q 0 18 -5 15 Z" fill="#FB7185" stroke="#2D2520" strokeWidth="1.8" />
                </g>
              )}
            </g>

            {/* Detailed Bamboo Angklung Held & Shaken in Front of Character */}
            {culturalPose === 'playing_angklung' && (
              <g
                transform={`translate(120, ${geo.armY - 6})`}
                className="animate-angklung-shake"
              >
                {/* Soundwave Vibration Arcs */}
                <path
                  d="M -29 -12 Q -35 0 -29 12"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <path
                  d="M 29 -12 Q 35 0 29 12"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                {/* Vertical Bamboo Frame Poles */}
                <rect x="-20" y="-26" width="4.5" height="48" rx="2" fill="#CA8A04" stroke="#2D2520" strokeWidth="1.6" />
                <rect x="15.5" y="-22" width="4.5" height="44" rx="2" fill="#CA8A04" stroke="#2D2520" strokeWidth="1.6" />
                {/* Horizontal Top & Base Crossbars */}
                <rect x="-23" y="-16" width="46" height="4.5" rx="2" fill="#EAB308" stroke="#2D2520" strokeWidth="1.5" />
                <rect x="-24" y="16" width="48" height="7" rx="3" fill="#B45309" stroke="#2D2520" strokeWidth="1.8" />
                {/* Twin Cut-Bevel Bamboo Resonator Tubes (Tall Left + Shorter Octave Right) */}
                <path
                  d="M -11 -28 L -11 16 L -2 16 L -2 -20 Q -6.5 -24 -11 -28 Z"
                  fill="#FDE047"
                  stroke="#2D2520"
                  strokeWidth="1.8"
                />
                <path
                  d="M 3 -19 L 3 16 L 11 16 L 11 -12 Q 7 -15 3 -19 Z"
                  fill="#FACC15"
                  stroke="#2D2520"
                  strokeWidth="1.8"
                />
                {/* Traditional Rattan Bindings */}
                <line x1="-22" y1="-14" x2="-15" y2="-14" stroke="#78350F" strokeWidth="2.5" />
                <line x1="15" y1="-14" x2="22" y2="-14" stroke="#78350F" strokeWidth="2.5" />
                <line x1="-22" y1="19" x2="22" y2="19" stroke="#FEF08A" strokeWidth="1.4" strokeDasharray="3 3" />
              </g>
            )}
          </g>
        )}

        {/* ==================== ANATOMICAL NECK (Stages 2..7) ==================== */}
        {geo.neckW > 0 && (
          <g>
            <rect
              x={120 - geo.neckW / 2}
              y={geo.neckY}
              width={geo.neckW}
              height={geo.neckH + 6}
              rx={geo.neckW * 0.35}
              fill={skinObj.color}
              stroke="#2D2520"
              strokeWidth="2.6"
            />
            {/* Soft under-chin cast shadow on the neck */}
            <path
              d={`M ${120 - geo.neckW / 2 + 2} ${geo.neckY + 2} Q 120 ${
                geo.neckY + geo.neckH * 0.75
              } ${120 + geo.neckW / 2 - 2} ${geo.neckY + 2} Z`}
              fill="#5C3A21"
              opacity="0.22"
            />
            {/* Subtle collarbone definition for Older Child, Teenager & Adult (Stages 5..7) */}
            {clampedLevel >= 5 && !isWearingBathWrap && (
              <path
                d={`M ${120 - geo.neckW * 0.7} ${geo.torsoTop + 4} Q 120 ${
                  geo.torsoTop + 8
                } ${120 + geo.neckW * 0.7} ${geo.torsoTop + 4}`}
                fill="none"
                stroke="#5C3A21"
                strokeWidth="1.8"
                strokeLinecap="round"
                opacity="0.35"
              />
            )}
          </g>
        )}

        {/* ==================== HEAD, FACE & EMOTIONAL EXPRESSIONS ==================== */}
        <g
          transform={
            effectiveState === 'curious_head_tilt'
              ? `rotate(8 120 ${geo.eyeY})`
              : effectiveState === 'comfort_player'
              ? `rotate(-5 120 ${geo.eyeY})`
              : undefined
          }
          className="transition-transform duration-300"
        >
          {/* ==================== BACK HAIR LAYER (Progressive Growth by Age & Gender, Stages 3..7) ==================== */}
          {clampedLevel >= 3 && (
            <g fill={appearance.hairColor} stroke="#2D2520" strokeWidth="2.8">
              {/* Long / Shoulder-Length Back Hair for Girls or Wavy/Bob styles */}
              {(gender === 'girl' ||
                appearance.hairStyle === 'bob_poni' ||
                appearance.hairStyle === 'ikal_lembut' ||
                appearance.hairStyle === 'kuncir_dua') && (
                <path
                  d={`M ${geo.headX - 4 - hairGrowth * 8} ${geo.headY + geo.headH * 0.42}
                      C ${geo.headX - 12 - hairGrowth * 14} ${geo.headY + geo.headH * 0.85},
                        ${geo.headX - 8 - hairGrowth * 16} ${
                    geo.headY + geo.headH + 10 + hairGrowth * 34
                  },
                        ${geo.headX + 12} ${geo.headY + geo.headH + 12 + hairGrowth * 36}
                      L ${geo.headX + geo.headW - 12} ${
                    geo.headY + geo.headH + 12 + hairGrowth * 36
                  }
                      C ${geo.headX + geo.headW + 8 + hairGrowth * 16} ${
                    geo.headY + geo.headH + 10 + hairGrowth * 34
                  },
                        ${geo.headX + geo.headW + 12 + hairGrowth * 14} ${
                    geo.headY + geo.headH * 0.85
                  },
                        ${geo.headX + geo.headW + 4 + hairGrowth * 8} ${
                    geo.headY + geo.headH * 0.42
                  }
                      Z`}
                />
              )}

              {/* Neat Layered Nape / Tapered Back Hair for Boys (Stages 4..7) */}
              {gender === 'boy' &&
                appearance.hairStyle !== 'bob_poni' &&
                appearance.hairStyle !== 'kuncir_dua' &&
                clampedLevel >= 4 && (
                  <path
                    d={`M ${geo.headX - 3} ${geo.headY + geo.headH * 0.45}
                        Q ${geo.headX - 7} ${geo.headY + geo.headH * 0.82} ${
                      geo.headX + 10
                    } ${geo.headY + geo.headH + 4 + hairGrowth * 8}
                        L ${geo.headX + geo.headW - 10} ${
                      geo.headY + geo.headH + 4 + hairGrowth * 8
                    }
                        Q ${geo.headX + geo.headW + 7} ${geo.headY + geo.headH * 0.82} ${
                      geo.headX + geo.headW + 3
                    } ${geo.headY + geo.headH * 0.45}
                        Z`}
                  />
                )}

              {/* Extra Bouncy Back Curls for Keriting Gembul at Stages 3..7 */}
              {appearance.hairStyle === 'keriting_gembul' && (
                <g>
                  <circle
                    cx={geo.headX - 4}
                    cy={geo.headY + geo.headH * 0.48}
                    r={12 + hairGrowth * 8}
                  />
                  <circle
                    cx={geo.headX + geo.headW + 4}
                    cy={geo.headY + geo.headH * 0.48}
                    r={12 + hairGrowth * 8}
                  />
                  {clampedLevel >= 4 && (
                    <>
                      <circle
                        cx={geo.headX - 2}
                        cy={geo.headY + geo.headH * 0.75}
                        r={10 + hairGrowth * 8}
                      />
                      <circle
                        cx={geo.headX + geo.headW + 2}
                        cy={geo.headY + geo.headH * 0.75}
                        r={10 + hairGrowth * 8}
                      />
                    </>
                  )}
                </g>
              )}
            </g>
          )}

          {/* Ears (Follow anatomical cheek/temple width per age stage) */}
          <circle
            cx={geo.headX - (clampedLevel <= 2 ? 4 : 2)}
            cy={geo.eyeY + 4}
            r={isTeenager || isAdult ? '10.5' : clampedLevel <= 2 ? '13.5' : '12'}
            fill={skinObj.color}
            stroke="#2D2520"
            strokeWidth="3"
          />
          <circle
            cx={geo.headX - (clampedLevel <= 2 ? 3 : 1)}
            cy={geo.eyeY + 4}
            r={isTeenager || isAdult ? '5' : '6'}
            fill={skinObj.cheek}
            opacity="0.58"
          />

          <circle
            cx={geo.headX + geo.headW + (clampedLevel <= 2 ? 4 : 2)}
            cy={geo.eyeY + 4}
            r={isTeenager || isAdult ? '10.5' : clampedLevel <= 2 ? '13.5' : '12'}
            fill={skinObj.color}
            stroke="#2D2520"
            strokeWidth="3"
          />
          <circle
            cx={geo.headX + geo.headW + (clampedLevel <= 2 ? 3 : 1)}
            cy={geo.eyeY + 4}
            r={isTeenager || isAdult ? '5' : '6'}
            fill={skinObj.cheek}
            opacity="0.58"
          />

          {/* Main Anatomical Head & Face Contour (Morphs from Chubby Baby Cheeks to Sculpted Teen/Adult Jawline) */}
          <path
            d={faceContourPath}
            fill={skinObj.color}
            stroke="#2D2520"
            strokeWidth="3.3"
            strokeLinejoin="round"
          />
          <path d={faceContourPath} fill={`url(#skinVol_${uid})`} pointerEvents="none" />

          {/* Baby Chubby Lower Cheek Pouch Highlights & Chin Dimple (Stages 1..2) */}
          {clampedLevel <= 2 && (
            <g pointerEvents="none" opacity="0.32">
              <path
                d={`M ${geo.headX - 2} ${geo.eyeY + 26} Q ${geo.headX + 10} ${
                  geo.headY + geo.headH - 12
                } ${geo.headX + 26} ${geo.headY + geo.headH - 8}`}
                fill="none"
                stroke="#5C3A21"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d={`M ${geo.headX + geo.headW + 2} ${geo.eyeY + 26} Q ${
                  geo.headX + geo.headW - 10
                } ${geo.headY + geo.headH - 12} ${geo.headX + geo.headW - 26} ${
                  geo.headY + geo.headH - 8
                }`}
                fill="none"
                stroke="#5C3A21"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Soft baby chin crease */}
              <path
                d={`M 115 ${geo.headY + geo.headH - 6} Q 120 ${
                  geo.headY + geo.headH - 3
                } 125 ${geo.headY + geo.headH - 6}`}
                fill="none"
                stroke="#5C3A21"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Mature Cheekbone & Jawline Contour Accent (Stages 5..7) */}
          {clampedLevel >= 5 && (
            <g pointerEvents="none" opacity="0.24">
              <path
                d={`M 114 ${geo.headY + geo.headH - 5} Q 120 ${
                  geo.headY + geo.headH - 2
                } 126 ${geo.headY + geo.headH - 5}`}
                fill="none"
                stroke="#5C3A21"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Forehead Specular Highlight */}
          <ellipse
            cx="106"
            cy={geo.headY + 16}
            rx={clampedLevel <= 2 ? '24' : '19'}
            ry={clampedLevel <= 2 ? '8.5' : '6.5'}
            transform={`rotate(-8 106 ${geo.headY + 16})`}
            fill="#FFFFFF"
            opacity="0.22"
            pointerEvents="none"
          />

          {/* Rosy Cheeks (Large round baby blush at Stages 1..2 -> soft oval cheekbone blush at Stages 5..7) */}
          <ellipse
            cx={geo.leftEyeX - (clampedLevel <= 2 ? 12 : 9)}
            cy={geo.eyeY + (clampedLevel <= 2 ? 18 : 15)}
            rx={clampedLevel <= 2 ? '17' : isTeenager || isAdult ? '11' : '14'}
            ry={clampedLevel <= 2 ? '12' : isTeenager || isAdult ? '7' : '9.5'}
            fill={`url(#cheekBlush_${uid})`}
          />
          <ellipse
            cx={geo.rightEyeX + (clampedLevel <= 2 ? 12 : 9)}
            cy={geo.eyeY + (clampedLevel <= 2 ? 18 : 15)}
            rx={clampedLevel <= 2 ? '17' : isTeenager || isAdult ? '11' : '14'}
            ry={clampedLevel <= 2 ? '12' : isTeenager || isAdult ? '7' : '9.5'}
            fill={`url(#cheekBlush_${uid})`}
          />

          {/* Subtle Cheek Smudge when Dirty Before Bath */}
          {isDirtyBeforeBath && (
            <ellipse
              cx={geo.rightEyeX + 10}
              cy={geo.eyeY + 18}
              rx="7"
              ry="4"
              fill="#92400E"
              opacity="0.48"
            />
          )}

          {/* ==================== EYEBROWS (Dynamic by Emotion & Age Thickness) ==================== */}
          {effectiveState === 'crying' ||
          effectiveState === 'sick' ||
          emotion === 'sad' ||
          isDirtyBeforeBath ? (
            <>
              <path
                d={`M ${geo.leftEyeX - 11} ${geo.eyeY - 16} Q ${geo.leftEyeX} ${
                  geo.eyeY - 11
                } ${geo.leftEyeX + 10} ${geo.eyeY - 20}`}
                fill="none"
                stroke={appearance.hairColor}
                strokeWidth={clampedLevel <= 2 ? '2.4' : '3.2'}
                strokeLinecap="round"
              />
              <path
                d={`M ${geo.rightEyeX - 10} ${geo.eyeY - 20} Q ${geo.rightEyeX} ${
                  geo.eyeY - 11
                } ${geo.rightEyeX + 11} ${geo.eyeY - 16}`}
                fill="none"
                stroke={appearance.hairColor}
                strokeWidth={clampedLevel <= 2 ? '2.4' : '3.2'}
                strokeLinecap="round"
              />
            </>
          ) : effectiveState === 'bored' || emotion === 'bored' ? (
            // Flat / Unimpressed Bored Eyebrows
            <>
              <line
                x1={geo.leftEyeX - 10}
                y1={geo.eyeY - 16}
                x2={geo.leftEyeX + 10}
                y2={geo.eyeY - 15}
                stroke={appearance.hairColor}
                strokeWidth={clampedLevel <= 2 ? '2.4' : '3.2'}
                strokeLinecap="round"
              />
              <line
                x1={geo.rightEyeX - 10}
                y1={geo.eyeY - 15}
                x2={geo.rightEyeX + 10}
                y2={geo.eyeY - 16}
                stroke={appearance.hairColor}
                strokeWidth={clampedLevel <= 2 ? '2.4' : '3.2'}
                strokeLinecap="round"
              />
            </>
          ) : (
            <>
              <path
                d={`M ${geo.leftEyeX - 11} ${geo.eyeY - 17} Q ${geo.leftEyeX} ${
                  geo.eyeY - 24
                } ${geo.leftEyeX + 10} ${geo.eyeY - 17}`}
                fill="none"
                stroke={appearance.hairColor}
                strokeWidth={clampedLevel <= 2 ? '2.4' : clampedLevel >= 6 ? '3.6' : '3.1'}
                strokeLinecap="round"
              />
              <path
                d={`M ${geo.rightEyeX - 10} ${geo.eyeY - 17} Q ${geo.rightEyeX} ${
                  geo.eyeY - 24
                } ${geo.rightEyeX + 11} ${geo.eyeY - 17}`}
                fill="none"
                stroke={appearance.hairColor}
                strokeWidth={clampedLevel <= 2 ? '2.4' : clampedLevel >= 6 ? '3.6' : '3.1'}
                strokeLinecap="round"
              />
            </>
          )}

          {/* ==================== EYES (Emotion & Age Responsive) ==================== */}
          {effectiveState === 'sleeping' || blinking ? (
            <g>
              <path
                d={`M ${geo.leftEyeX - 12} ${geo.eyeY} Q ${geo.leftEyeX} ${geo.eyeY + 10} ${
                  geo.leftEyeX + 12
                } ${geo.eyeY}`}
                fill="none"
                stroke="#2D2520"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
              <path
                d={`M ${geo.rightEyeX - 12} ${geo.eyeY} Q ${geo.rightEyeX} ${geo.eyeY + 10} ${
                  geo.rightEyeX + 12
                } ${geo.eyeY}`}
                fill="none"
                stroke="#2D2520"
                strokeWidth="3.4"
                strokeLinecap="round"
              />
            </g>
          ) : effectiveState === 'laughing' ||
            effectiveState === 'loved' ||
            effectiveState === 'waking_up' ||
            effectiveState === 'fresh' ||
            effectiveState === 'proud' ? (
            <g>
              <path
                d={`M ${geo.leftEyeX - 12} ${geo.eyeY + 4} Q ${geo.leftEyeX} ${geo.eyeY - 10} ${
                  geo.leftEyeX + 12
                } ${geo.eyeY + 4}`}
                fill="none"
                stroke="#2D2520"
                strokeWidth="3.8"
                strokeLinecap="round"
              />
              <path
                d={`M ${geo.rightEyeX - 12} ${geo.eyeY + 4} Q ${geo.rightEyeX} ${
                  geo.eyeY - 10
                } ${geo.rightEyeX + 12} ${geo.eyeY + 4}`}
                fill="none"
                stroke="#2D2520"
                strokeWidth="3.8"
                strokeLinecap="round"
              />
            </g>
          ) : effectiveState === 'sleepy' ||
            effectiveState === 'yawning' ||
            effectiveState === 'bored' ||
            effectiveState === 'sick' ? (
            // Half-Lidded Sleepy, Sick, or Bored Eyes
            <g>
              <circle
                cx={geo.leftEyeX}
                cy={geo.eyeY}
                r={geo.eyeR}
                fill="#FFFFFF"
                stroke="#2D2520"
                strokeWidth="2.6"
              />
              <circle
                cx={effectiveState === 'bored' ? geo.leftEyeX + 3 : geo.leftEyeX}
                cy={geo.eyeY + 1}
                r={geo.eyeR * 0.65}
                fill={`url(#irisGrad_${uid})`}
              />
              <circle
                cx={effectiveState === 'bored' ? geo.leftEyeX + 3 : geo.leftEyeX}
                cy={geo.eyeY + 1}
                r={geo.eyeR * 0.35}
                fill="#1E1B18"
              />
              <path
                d={`M ${geo.leftEyeX - geo.eyeR} ${geo.eyeY - 1} Q ${geo.leftEyeX} ${
                  geo.eyeY - geo.eyeR - 2
                } ${geo.leftEyeX + geo.eyeR} ${geo.eyeY - 1} Z`}
                fill={skinObj.color}
                stroke="#2D2520"
                strokeWidth="2.5"
              />

              <circle
                cx={geo.rightEyeX}
                cy={geo.eyeY}
                r={geo.eyeR}
                fill="#FFFFFF"
                stroke="#2D2520"
                strokeWidth="2.6"
              />
              <circle
                cx={effectiveState === 'bored' ? geo.rightEyeX + 3 : geo.rightEyeX}
                cy={geo.eyeY + 1}
                r={geo.eyeR * 0.65}
                fill={`url(#irisGrad_${uid})`}
              />
              <circle
                cx={effectiveState === 'bored' ? geo.rightEyeX + 3 : geo.rightEyeX}
                cy={geo.eyeY + 1}
                r={geo.eyeR * 0.35}
                fill="#1E1B18"
              />
              <path
                d={`M ${geo.rightEyeX - geo.eyeR} ${geo.eyeY - 1} Q ${geo.rightEyeX} ${
                  geo.eyeY - geo.eyeR - 2
                } ${geo.rightEyeX + geo.eyeR} ${geo.eyeY - 1} Z`}
                fill={skinObj.color}
                stroke="#2D2520"
                strokeWidth="2.5"
              />
            </g>
          ) : (
            // Detailed Glossy Eyes
            <g>
              <circle
                cx={geo.leftEyeX}
                cy={geo.eyeY}
                r={geo.eyeR}
                fill="#FFFFFF"
                stroke="#2D2520"
                strokeWidth="2.8"
              />
              <circle
                cx={effectiveState === 'hungry' ? geo.leftEyeX + 2 : geo.leftEyeX + 0.5}
                cy={geo.eyeY + 1}
                r={geo.eyeR * 0.7}
                fill={`url(#irisGrad_${uid})`}
              />
              <circle
                cx={effectiveState === 'hungry' ? geo.leftEyeX + 2 : geo.leftEyeX + 0.5}
                cy={geo.eyeY + 1}
                r={geo.eyeR * 0.37}
                fill="#141210"
              />
              <circle cx={geo.leftEyeX - 3.5} cy={geo.eyeY - 4} r="3.2" fill="#FFFFFF" />
              <circle cx={geo.leftEyeX + 3.5} cy={geo.eyeY + 4} r="1.6" fill="#FFFFFF" />

              <circle
                cx={geo.rightEyeX}
                cy={geo.eyeY}
                r={geo.eyeR}
                fill="#FFFFFF"
                stroke="#2D2520"
                strokeWidth="2.8"
              />
              <circle
                cx={effectiveState === 'hungry' ? geo.rightEyeX + 2 : geo.rightEyeX - 0.5}
                cy={geo.eyeY + 1}
                r={geo.eyeR * 0.7}
                fill={`url(#irisGrad_${uid})`}
              />
              <circle
                cx={effectiveState === 'hungry' ? geo.rightEyeX + 2 : geo.rightEyeX - 0.5}
                cy={geo.eyeY + 1}
                r={geo.eyeR * 0.37}
                fill="#141210"
              />
              <circle cx={geo.rightEyeX - 4} cy={geo.eyeY - 4} r="3.2" fill="#FFFFFF" />
              <circle cx={geo.rightEyeX + 3} cy={geo.eyeY + 4} r="1.6" fill="#FFFFFF" />

              {/* Extra Starry Eye Sparkles on Love / Big Smile / Proud Voice Reactions */}
              {(effectiveState === 'make_heart' ||
                effectiveState === 'screen_touch' ||
                effectiveState === 'big_smile' ||
                effectiveState === 'clap_hands' ||
                effectiveState === 'blow_kiss') && (
                <g fill="#FEF08A">
                  <circle cx={geo.leftEyeX + 3} cy={geo.eyeY - 3} r="2.2" className="animate-ping" />
                  <circle cx={geo.rightEyeX + 3} cy={geo.eyeY - 3} r="2.2" className="animate-ping" />
                </g>
              )}

              {gender === 'girl' && (
                <>
                  <line
                    x1={geo.leftEyeX - geo.eyeR}
                    y1={geo.eyeY - 6}
                    x2={geo.leftEyeX - geo.eyeR - 5}
                    y2={geo.eyeY - 11}
                    stroke="#2D2520"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  <line
                    x1={geo.rightEyeX + geo.eyeR}
                    y1={geo.eyeY - 6}
                    x2={geo.rightEyeX + geo.eyeR + 5}
                    y2={geo.eyeY - 11}
                    stroke="#2D2520"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </>
              )}
            </g>
          )}

          {/* Cozy Pastel Beach Sunglasses when Relaxing Under Beach Umbrella */}
          {beachPose === 'relaxing' && !isSleeping && (
            <g>
              <line
                x1={geo.leftEyeX + 12}
                y1={geo.eyeY - 2}
                x2={geo.rightEyeX - 12}
                y2={geo.eyeY - 2}
                stroke="#2D2520"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <rect
                x={geo.leftEyeX - 16}
                y={geo.eyeY - 11}
                width="30"
                height="20"
                rx="9"
                fill="#0F172A"
                fillOpacity="0.86"
                stroke="#FB7185"
                strokeWidth="3"
              />
              <rect
                x={geo.rightEyeX - 14}
                y={geo.eyeY - 11}
                width="30"
                height="20"
                rx="9"
                fill="#0F172A"
                fillOpacity="0.86"
                stroke="#FB7185"
                strokeWidth="3"
              />
              <line
                x1={geo.leftEyeX - 9}
                y1={geo.eyeY - 5}
                x2={geo.leftEyeX - 2}
                y2={geo.eyeY + 3}
                stroke="#7DD3FC"
                strokeWidth="2.4"
                strokeLinecap="round"
                opacity="0.75"
              />
              <line
                x1={geo.rightEyeX - 7}
                y1={geo.eyeY - 5}
                x2={geo.rightEyeX}
                y2={geo.eyeY + 3}
                stroke="#7DD3FC"
                strokeWidth="2.4"
                strokeLinecap="round"
                opacity="0.75"
              />
            </g>
          )}

          {/* Golden Nusantara Traditional Dance Crown (Siger & Melati) when Dancing at Pendopo */}
          {culturalPose === 'traditional_dance' && !isSleeping && (
            <g transform={`translate(120, ${geo.headY + 4})`}>
              <path
                d="M -30 4 Q -18 -14 0 -20 Q 18 -14 30 4 Q 16 -2 0 -4 Q -16 -2 -30 4 Z"
                fill="#FACC15"
                stroke="#2D2520"
                strokeWidth="2.2"
              />
              <circle cx="0" cy="-11" r="4" fill="#F43F5E" stroke="#2D2520" strokeWidth="1.4" />
              {/* White Jasmine (Bunga Melati) Accents */}
              <circle cx="-18" cy="-1" r="3.4" fill="#FFFDF9" stroke="#2D2520" strokeWidth="1.2" />
              <circle cx="18" cy="-1" r="3.4" fill="#FFFDF9" stroke="#2D2520" strokeWidth="1.2" />
              <circle cx="0" cy="-21" r="2.8" fill="#FEF08A" stroke="#2D2520" strokeWidth="1.2" />
            </g>
          )}

          {/* Nose (Tiny button nose for baby, emerging bridge for older child, defined bridge for Teen/Adult) */}
          {isTeenager || isAdult ? (
            <path
              d={`M 119 ${geo.eyeY + 3} L 116.5 ${geo.eyeY + 13} Q 120 ${geo.eyeY + 15.5} 123.5 ${
                geo.eyeY + 13
              }`}
              fill="none"
              stroke="#2D2520"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          ) : clampedLevel >= 4 ? (
            <path
              d={`M 119 ${geo.eyeY + 7} L 117 ${geo.eyeY + 12} Q 120 ${geo.eyeY + 14.5} 123 ${
                geo.eyeY + 12
              }`}
              fill="none"
              stroke="#2D2520"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          ) : (
            <path
              d={`M 116.5 ${geo.eyeY + 11} Q 120 ${geo.eyeY + 14.5} 123.5 ${geo.eyeY + 11}`}
              fill="none"
              stroke="#2D2520"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          )}

          {/* ==================== MOUTH BY EMOTION & ACTION ==================== */}
          {effectiveState === 'eating' ||
          effectiveState === 'yawning' ||
          effectiveState === 'surprised' ||
          effectiveState === 'hungry' ? (
            <g>
              <ellipse
                cx="120"
                cy={geo.mouthY}
                rx={effectiveState === 'hungry' ? '8' : '10.5'}
                ry={effectiveState === 'hungry' ? '8.5' : '11.5'}
                fill="#991B1B"
                stroke="#2D2520"
                strokeWidth="2.6"
              />
              <path
                d={`M 112 ${geo.mouthY + 4} Q 120 ${geo.mouthY - 2} 128 ${
                  geo.mouthY + 4
                } A 9 7 0 0 1 112 ${geo.mouthY + 4} Z`}
                fill="#FB7185"
              />
            </g>
          ) : effectiveState === 'crying' ||
            effectiveState === 'sick' ||
            emotion === 'sad' ||
            isDirtyBeforeBath ? (
            // Gently Murung / Uncomfortable Mouth
            <path
              d={`M 108 ${geo.mouthY + 4} Q 120 ${geo.mouthY - 5} 132 ${geo.mouthY + 4}`}
              fill="none"
              stroke="#2D2520"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ) : effectiveState === 'bored' || emotion === 'bored' ? (
            // Bored Slight Pout (Cemberut Ringan)
            <path
              d={`M 110 ${geo.mouthY + 2} Q 116 ${geo.mouthY - 2} 128 ${geo.mouthY + 3}`}
              fill="none"
              stroke="#2D2520"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ) : effectiveState === 'sleeping' ? (
            <ellipse
              cx="120"
              cy={geo.mouthY}
              rx="4.5"
              ry="3.2"
              fill="#FB7185"
              stroke="#2D2520"
              strokeWidth="2"
            />
          ) : effectiveState === 'laughing' ||
            effectiveState === 'smiling' ||
            effectiveState === 'playing' ||
            effectiveState === 'loved' ||
            effectiveState === 'carried' ||
            effectiveState === 'waking_up' ||
            effectiveState === 'fresh' ||
            effectiveState === 'make_heart' ||
            effectiveState === 'big_smile' ||
            effectiveState === 'happy_jump' ||
            effectiveState === 'clap_hands' ||
            effectiveState === 'screen_touch' ||
            effectiveState === 'blow_kiss' ||
            emotion === 'happy' ||
            emotion === 'fresh' ? (
            <g>
              <path
                d={`M 105 ${geo.mouthY - 4} Q 120 ${geo.mouthY + 15} 135 ${geo.mouthY - 4} Z`}
                fill="#991B1B"
                stroke="#2D2520"
                strokeWidth="2.6"
              />
              {/* Stage 1 Newborn has toothless gummy smile; Stage 2 has 2 tiny baby teeth; Stages 3..7 have full smile teeth */}
              {clampedLevel >= 2 && (
                <rect
                  x={clampedLevel === 2 ? '116' : '111'}
                  y={geo.mouthY - 3}
                  width={clampedLevel === 2 ? '8' : '18'}
                  height="4.5"
                  rx="1.5"
                  fill="#FFFFFF"
                />
              )}
              <path
                d={`M 111 ${geo.mouthY + 5} Q 120 ${geo.mouthY} 129 ${geo.mouthY + 5}`}
                fill="#FB7185"
              />
            </g>
          ) : (
            <path
              d={`M 109 ${geo.mouthY - 2} Q 120 ${geo.mouthY + 8} 131 ${geo.mouthY - 2}`}
              fill="none"
              stroke="#2D2520"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}

          {/* ==================== PROGRESSIVE 7-STAGE HAIRSTYLES (Grows with Age & Gender) ==================== */}
          <g
            transform={`translate(0, ${geo.headY - 47})`}
            fill={appearance.hairColor}
            stroke="#2D2520"
            strokeWidth="2.8"
          >
            {isNewborn ? (
              // STAGE 1 (NEWBORN): Fine, delicate wispy baby strands on the fontanelle/crown
              <g>
                <path
                  d="M 102 52 Q 114 33 126 48 M 115 50 Q 128 35 138 51 M 94 55 Q 104 41 112 52"
                  fill="none"
                  stroke={appearance.hairColor}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />
                {gender === 'girl' && (
                  <g>
                    <circle cx="142" cy="52" r="5" fill="#FF8FAB" stroke="#2D2520" strokeWidth="2" />
                    <circle cx="142" cy="52" r="2" fill="#FFF1F2" stroke="none" />
                  </g>
                )}
              </g>
            ) : isCrawlingBaby ? (
              // STAGE 2 (CRAWLING BABY): Thicker baby tufts & emerging style silhouette
              <g>
                {appearance.hairStyle === 'kuncir_dua' ? (
                  <>
                    <path d="M 82 58 Q 120 40 158 58 Q 138 50 120 56 Q 102 50 82 58 Z" />
                    <circle cx={geo.headX + 2} cy="66" r="9.5" />
                    <circle cx={geo.headX + geo.headW - 2} cy="66" r="9.5" />
                    <circle cx={geo.headX + 8} cy="66" r="3.8" fill="#FF8FAB" />
                    <circle cx={geo.headX + geo.headW - 8} cy="66" r="3.8" fill="#FF8FAB" />
                  </>
                ) : appearance.hairStyle === 'keriting_gembul' ? (
                  <g>
                    <circle cx="94" cy="52" r="11" />
                    <circle cx="114" cy="46" r="13" />
                    <circle cx="132" cy="47" r="12" />
                  </g>
                ) : (
                  <path d="M 90 54 C 98 28, 134 28, 132 50 C 144 36, 154 48, 142 57 Q 118 49 90 54 Z" />
                )}
              </g>
            ) : (
              // STAGES 3..7 (TODDLER -> CHILD -> TEENAGER -> ADULT): Full progressive hair volume & length
              <>
                {appearance.hairStyle === 'jambul_lucu' && (
                  <g>
                    {/* Crown & Side Fade for Toddler -> Mature Quiff/Layered Hair for Teen & Adult */}
                    <path
                      d={`M ${geo.headX + 4} ${68 + hairGrowth * 8}
                          C ${geo.headX} ${36 - hairGrowth * 8}, ${
                        geo.headX + geo.headW
                      } ${36 - hairGrowth * 8}, ${geo.headX + geo.headW - 4} ${68 + hairGrowth * 8}
                          Q ${146} ${52 + hairGrowth * 4} ${124} ${58 + hairGrowth * 4}
                          Q ${98} ${50 + hairGrowth * 4} ${geo.headX + 4} ${68 + hairGrowth * 8} Z`}
                    />
                    <path
                      d={`M 96 48 C 102 ${22 - hairGrowth * 8}, 138 ${
                        22 - hairGrowth * 8
                      }, 130 48 C 146 32, 158 46, 140 56 Z`}
                    />
                  </g>
                )}

                {appearance.hairStyle === 'kuncir_dua' && (
                  <g>
                    {/* Full Bangs & Crown */}
                    <path
                      d={`M ${geo.headX + 2} 68
                          C ${geo.headX + 4} ${36 - hairGrowth * 6}, ${
                        geo.headX + geo.headW - 4
                      } ${36 - hairGrowth * 6}, ${geo.headX + geo.headW - 2} 68
                          Q 142 54 120 64
                          Q 98 54 ${geo.headX + 2} 68 Z`}
                    />
                    {/* Twin Pigtails that grow from cute round puffs (Stage 3) to long flowing twin tails (Stages 5..7) */}
                    <ellipse
                      cx={geo.headX - 7 - hairGrowth * 4}
                      cy={74 + hairGrowth * 14}
                      rx={13 + hairGrowth * 3}
                      ry={14 + hairGrowth * 20}
                      transform={`rotate(${12 + hairGrowth * 8} ${geo.headX - 7} ${
                        74 + hairGrowth * 14
                      })`}
                    />
                    <ellipse
                      cx={geo.headX + geo.headW + 7 + hairGrowth * 4}
                      cy={74 + hairGrowth * 14}
                      rx={13 + hairGrowth * 3}
                      ry={14 + hairGrowth * 20}
                      transform={`rotate(-${12 + hairGrowth * 8} ${
                        geo.headX + geo.headW + 7
                      } ${74 + hairGrowth * 14})`}
                    />
                    <circle cx={geo.headX + 3} cy="71" r={5 + hairGrowth * 1.5} fill="#FF8FAB" />
                    <circle
                      cx={geo.headX + geo.headW - 3}
                      cy="71"
                      r={5 + hairGrowth * 1.5}
                      fill="#FF8FAB"
                    />
                  </g>
                )}

                {appearance.hairStyle === 'ikal_lembut' && (
                  <g>
                    <path
                      d={`M ${geo.headX} ${76 + hairGrowth * 10}
                          C ${geo.headX - 4} ${34 - hairGrowth * 6}, ${
                        geo.headX + geo.headW + 4
                      } ${34 - hairGrowth * 6}, ${geo.headX + geo.headW} ${76 + hairGrowth * 10}
                          C 156 58, 140 68, 120 59
                          C 100 68, 84 58, ${geo.headX} ${76 + hairGrowth * 10} Z`}
                    />
                    {/* Side wavy locks framing the face at Stages 4..7 */}
                    {clampedLevel >= 4 && (
                      <>
                        <path
                          d={`M ${geo.headX + 1} 72 Q ${geo.headX - 7} ${
                            92 + hairGrowth * 16
                          } ${geo.headX + 8} ${102 + hairGrowth * 22} Q ${geo.headX + 10} 84 ${
                            geo.headX + 8
                          } 68 Z`}
                        />
                        <path
                          d={`M ${geo.headX + geo.headW - 1} 72 Q ${
                            geo.headX + geo.headW + 7
                          } ${92 + hairGrowth * 16} ${geo.headX + geo.headW - 8} ${
                            102 + hairGrowth * 22
                          } Q ${geo.headX + geo.headW - 10} 84 ${
                            geo.headX + geo.headW - 8
                          } 68 Z`}
                        />
                      </>
                    )}
                  </g>
                )}

                {appearance.hairStyle === 'bob_poni' && (
                  <g>
                    <path
                      d={`M ${geo.headX - 3} ${84 + hairGrowth * 18}
                          C ${geo.headX - 6} ${34 - hairGrowth * 5}, ${
                        geo.headX + geo.headW + 6
                      } ${34 - hairGrowth * 5}, ${geo.headX + geo.headW + 3} ${
                        84 + hairGrowth * 18
                      }
                          L ${geo.headX + geo.headW - 9} ${70 + hairGrowth * 4}
                          L 146 76 L 120 70 L 94 76
                          L ${geo.headX + 9} ${70 + hairGrowth * 4} Z`}
                    />
                  </g>
                )}

                {appearance.hairStyle === 'keriting_gembul' && (
                  <g>
                    <circle cx={geo.headX + 14} cy="56" r={14 + hairGrowth * 4} />
                    <circle cx="105" cy={46 - hairGrowth * 3} r={16 + hairGrowth * 4} />
                    <circle cx="135" cy={46 - hairGrowth * 3} r={16 + hairGrowth * 4} />
                    <circle cx={geo.headX + geo.headW - 14} cy="56" r={14 + hairGrowth * 4} />
                    {clampedLevel >= 4 && (
                      <circle cx="120" cy={42 - hairGrowth * 4} r={15 + hairGrowth * 3} />
                    )}
                  </g>
                )}

                {appearance.hairStyle === 'tipis_bayi' && (
                  // Evolves from wispy toddler strands into a clean, modern textured crop/layered fringe at older stages
                  <g>
                    <path
                      d={`M ${geo.headX + 8} 64
                          C ${geo.headX + 10} ${40 - hairGrowth * 6}, ${
                        geo.headX + geo.headW - 10
                      } ${40 - hairGrowth * 6}, ${geo.headX + geo.headW - 8} 64
                          Q 142 54 120 58
                          Q 98 54 ${geo.headX + 8} 64 Z`}
                    />
                    <path
                      d="M 104 47 Q 116 28 128 44 M 116 46 Q 128 30 138 48"
                      fill="none"
                      stroke={appearance.hairColor}
                      strokeWidth="3.4"
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {/* Specular Hair Highlight Band for Healthy Glossy Hair (Stages 3..7) */}
                <path
                  d={`M ${geo.headX + 20} ${48 - hairGrowth * 2} Q 120 ${
                    38 - hairGrowth * 3
                  } ${geo.headX + geo.headW - 20} ${48 - hairGrowth * 2}`}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  opacity="0.22"
                  pointerEvents="none"
                />
              </>
            )}

            {/* Messy Stray Hair Tufts when Dirty Before Bath */}
            {isDirtyBeforeBath && (
              <path
                d="M 82 48 L 70 30 M 156 48 L 170 32 M 120 42 L 125 22"
                fill="none"
                stroke={appearance.hairColor}
                strokeWidth="3"
                strokeLinecap="round"
              />
            )}
          </g>

          {/* Equipped Glasses */}
          {glassesItem && (
            <g
              fill={
                glassesItem.id === 'glasses_star'
                  ? 'rgba(253, 224, 71, 0.35)'
                  : 'rgba(147, 197, 253, 0.25)'
              }
              stroke={glassesItem.primaryColor}
              strokeWidth="3.2"
            >
              <circle cx={geo.leftEyeX} cy={geo.eyeY} r="15" />
              <circle cx={geo.rightEyeX} cy={geo.eyeY} r="15" />
              <line x1={geo.leftEyeX + 15} y1={geo.eyeY} x2={geo.rightEyeX - 15} y2={geo.eyeY} />
            </g>
          )}

          {/* Equipped Hats */}
          {hatItem && !isWearingBathWrap && (
            <g transform={`translate(0, ${geo.headY - 47})`}>
              {hatItem.id === 'hat_ribbon_pink' && (
                <g transform="translate(142, 42) rotate(12)">
                  <polygon points="0,12 -16,0 -16,24" fill={hatItem.primaryColor} stroke="#2D2520" strokeWidth="2.5" />
                  <polygon points="0,12 16,0 16,24" fill={hatItem.primaryColor} stroke="#2D2520" strokeWidth="2.5" />
                  <circle cx="0" cy="12" r="5" fill={hatItem.secondaryColor} stroke="#2D2520" strokeWidth="2" />
                </g>
              )}

              {hatItem.id === 'hat_crown_gold' && (
                <polygon
                  points="88,52 94,22 110,38 120,18 130,38 146,22 152,52"
                  fill={hatItem.primaryColor}
                  stroke="#2D2520"
                  strokeWidth="2.8"
                />
              )}

              {hatItem.id === 'hat_bunny_ears' && (
                <g>
                  <ellipse cx="96" cy="24" rx="10" ry="26" fill={hatItem.primaryColor} stroke="#2D2520" strokeWidth="2.6" />
                  <ellipse cx="96" cy="26" rx="5" ry="18" fill={hatItem.secondaryColor} />
                  <ellipse cx="144" cy="24" rx="10" ry="26" fill={hatItem.primaryColor} stroke="#2D2520" strokeWidth="2.6" />
                  <ellipse cx="144" cy="26" rx="5" ry="18" fill={hatItem.secondaryColor} />
                </g>
              )}

              {hatItem.id === 'hat_cap_explorer' && (
                <g>
                  <path
                    d="M 72 60 C 72 30, 168 30, 168 60 Z"
                    fill={hatItem.primaryColor}
                    stroke="#2D2520"
                    strokeWidth="2.8"
                  />
                  <path
                    d="M 110 54 L 182 60 C 182 66, 140 68, 110 60 Z"
                    fill={hatItem.secondaryColor}
                    stroke="#2D2520"
                    strokeWidth="2.5"
                  />
                </g>
              )}
            </g>
          )}

          {/* Nusantara Traditional Headpieces */}
          {adatItem && !hatItem && !isWearingBathWrap && (
            <g transform={`translate(0, ${geo.headY - 47})`}>
              {(adatItem.headpieceStyle === 'aceh_crown' ||
                adatItem.headpieceStyle === 'palembang_aesan' ||
                adatItem.headpieceStyle === 'bugis_bodo') && (
                <g>
                  {gender === 'boy' ? (
                    <g>
                      <path
                        d="M 74 58 C 74 28, 166 28, 166 58 Z"
                        fill={adatItem.primaryColor}
                        stroke="#2D2520"
                        strokeWidth="2.8"
                      />
                      <rect x="72" y="48" width="96" height="12" rx="6" fill="#FACC15" stroke="#2D2520" strokeWidth="2.5" />
                      <polygon points="120,16 112,34 128,34" fill="#FACC15" stroke="#2D2520" strokeWidth="2.2" />
                    </g>
                  ) : (
                    <g>
                      <polygon
                        points="76,56 84,26 102,40 120,14 138,40 156,26 164,56"
                        fill="#FACC15"
                        stroke="#2D2520"
                        strokeWidth="2.8"
                      />
                      <circle cx="120" cy="42" r="6" fill="#E11D48" stroke="#2D2520" strokeWidth="2" />
                    </g>
                  )}
                </g>
              )}

              {(adatItem.headpieceStyle === 'sunda_siger' ||
                adatItem.headpieceStyle === 'bali_udeng') && (
                <g>
                  {gender === 'boy' ? (
                    <path
                      d="M 68 58 L 172 58 L 164 42 L 120 26 L 76 42 Z"
                      fill={adatItem.secondaryColor}
                      stroke="#2D2520"
                      strokeWidth="2.8"
                    />
                  ) : (
                    <path
                      d="M 72 56 Q 120 12 168 56 Z"
                      fill="#FACC15"
                      stroke="#2D2520"
                      strokeWidth="2.8"
                    />
                  )}
                </g>
              )}

              {adatItem.headpieceStyle === 'jogja_blangkon' && (
                <g>
                  {gender === 'boy' ? (
                    <g>
                      <path d="M 68 60 C 68 30, 172 30, 172 60 Z" fill="#78350F" stroke="#2D2520" strokeWidth="2.8" />
                      <path d="M 72 54 L 168 54" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
                    </g>
                  ) : (
                    <g>
                      <circle cx="120" cy="32" r="20" fill={appearance.hairColor} stroke="#2D2520" strokeWidth="2.8" />
                      <circle cx="120" cy="24" r="5.5" fill="#FACC15" stroke="#2D2520" strokeWidth="1.8" />
                    </g>
                  )}
                </g>
              )}

              {adatItem.headpieceStyle === 'minang_tanduk' && (
                <path
                  d="M 52 22 Q 86 52 120 38 Q 154 52 188 22 Q 168 60 120 56 Q 72 60 52 22 Z"
                  fill="#FACC15"
                  stroke="#2D2520"
                  strokeWidth="2.8"
                />
              )}

              {(adatItem.headpieceStyle === 'dayak_feathers' ||
                adatItem.headpieceStyle === 'papua_crown') && (
                <g>
                  <ellipse cx="102" cy="24" rx="7" ry="22" transform="rotate(-14 102 24)" fill="#FEF08A" stroke="#2D2520" strokeWidth="2.2" />
                  <ellipse cx="120" cy="20" rx="8" ry="26" fill="#F97316" stroke="#2D2520" strokeWidth="2.2" />
                  <ellipse cx="138" cy="24" rx="7" ry="22" transform="rotate(14 138 24)" fill="#FEF08A" stroke="#2D2520" strokeWidth="2.2" />
                  <rect x="68" y="46" width="104" height="12" rx="6" fill={adatItem.primaryColor} stroke="#2D2520" strokeWidth="2.5" />
                </g>
              )}

              {(adatItem.headpieceStyle === 'ulos_headband' ||
                adatItem.headpieceStyle === 'madura_odheng' ||
                adatItem.headpieceStyle === 'betawi_peci' ||
                adatItem.headpieceStyle === 'maluku_cele') && (
                <rect
                  x="68"
                  y="44"
                  width="104"
                  height="13"
                  rx="6"
                  fill={adatItem.primaryColor}
                  stroke="#2D2520"
                  strokeWidth="2.6"
                />
              )}
            </g>
          )}
        </g>

        {/* ==================== 6 INTERACTIVE BODY ZONE PROGRESSIVE SOAP FOAM LAYERS (COVERS ENTIRE BODY EXCEPT FACE) ==================== */}
        {/* 1. HEAD & HAIR FOAM ZONE (Leaves Face Clear!) */}
        {foamHead > 5 && (
          <g opacity={Math.min(1, 0.45 + (foamHead / 100) * 0.55)}>
            {/* Base layer (appears from first scrub) */}
            <circle cx={geo.headX + 6} cy={geo.headY + 14} r="16" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="2.2" />
            <circle cx="95" cy={geo.headY} r="19" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2.2" />
            <circle cx="120" cy={geo.headY - 6} r="23" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2.4" />
            <circle cx="145" cy={geo.headY} r="19" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="2.2" />
            <circle cx={geo.headX + geo.headW - 6} cy={geo.headY + 14} r="16" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2.2" />
            {/* Second progressive layer (foam >= 35%) */}
            {foamHead >= 35 && (
              <>
                <circle cx={geo.headX - 2} cy={geo.headY + 28} r="14" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2" />
                <circle cx={geo.headX + geo.headW + 2} cy={geo.headY + 28} r="14" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2" />
                <circle cx="106" cy={geo.headY - 12} r="16" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="2" />
                <circle cx="134" cy={geo.headY - 12} r="16" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2" />
              </>
            )}
            {/* Full thick shampoo crown & floating bubbles (foam >= 60%) */}
            {foamHead >= 60 && (
              <>
                <circle cx="120" cy={geo.headY - 20} r="15" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2" />
                <circle cx="84" cy={geo.headY - 16} r="6" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" className="animate-bounce" />
                <circle cx="158" cy={geo.headY - 18} r="5" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" className="animate-bounce" />
              </>
            )}
            <circle cx="114" cy={geo.headY - 10} r="5" fill="#FFFFFF" />
          </g>
        )}

        {/* 2. BODY / TORSO FOAM ZONE (Full Chest & Belly Coverage) */}
        {foamBody > 5 && (
          <g opacity={Math.min(1, 0.45 + (foamBody / 100) * 0.55)}>
            {/* Base layer */}
            <circle cx="96" cy={geo.torsoTop + 18} r="19" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="2.2" />
            <circle cx="120" cy={geo.torsoTop + 16} r="22" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2.2" />
            <circle cx="144" cy={geo.torsoTop + 18} r="19" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="2.2" />
            <circle cx="104" cy={geo.torsoTop + 40} r="20" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2.2" />
            <circle cx="136" cy={geo.torsoTop + 40} r="20" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="2.2" />
            {/* Second progressive layer (foam >= 35%) */}
            {foamBody >= 35 && (
              <>
                <circle cx="86" cy={geo.torsoTop + 34} r="17" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2" />
                <circle cx="120" cy={geo.torsoTop + 36} r="22" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2" />
                <circle cx="154" cy={geo.torsoTop + 34} r="17" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2" />
                <circle cx="100" cy={geo.torsoBottom - 8} r="18" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="2" />
                <circle cx="140" cy={geo.torsoBottom - 8} r="18" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2" />
              </>
            )}
            {/* Full thick torso foam & floating bubbles (foam >= 60%) */}
            {foamBody >= 60 && (
              <>
                <circle cx="120" cy={geo.torsoBottom - 6} r="20" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2" />
                <circle cx="110" cy={geo.torsoTop + 26} r="5" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.4" />
                <circle cx="132" cy={geo.torsoTop + 32} r="4.5" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.4" />
              </>
            )}
          </g>
        )}

        {/* 3. LEFT ARM FOAM ZONE */}
        {foamLeftArm > 5 && (
          <g opacity={Math.min(1, 0.45 + (foamLeftArm / 100) * 0.55)}>
            <circle cx={120 - geo.shoulderHalf - 6} cy={geo.armY - 8} r="15" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="2.2" />
            <circle cx={120 - geo.shoulderHalf - 11} cy={geo.armY + 6} r="15" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2.2" />
            {foamLeftArm >= 35 && (
              <>
                <circle cx={120 - geo.shoulderHalf - 14} cy={geo.armY + 18} r="14" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="2" />
                <circle cx={120 - geo.shoulderHalf - 4} cy={geo.armY + 2} r="13" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2" />
              </>
            )}
            {foamLeftArm >= 60 && (
              <circle cx={120 - geo.shoulderHalf - 24} cy={geo.armY - 4} r="5" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" className="animate-bounce" />
            )}
          </g>
        )}

        {/* 4. RIGHT ARM FOAM ZONE */}
        {foamRightArm > 5 && (
          <g opacity={Math.min(1, 0.45 + (foamRightArm / 100) * 0.55)}>
            <circle cx={120 + geo.shoulderHalf + 6} cy={geo.armY - 8} r="15" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="2.2" />
            <circle cx={120 + geo.shoulderHalf + 11} cy={geo.armY + 6} r="15" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2.2" />
            {foamRightArm >= 35 && (
              <>
                <circle cx={120 + geo.shoulderHalf + 14} cy={geo.armY + 18} r="14" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="2" />
                <circle cx={120 + geo.shoulderHalf + 4} cy={geo.armY + 2} r="13" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2" />
              </>
            )}
            {foamRightArm >= 60 && (
              <circle cx={120 + geo.shoulderHalf + 24} cy={geo.armY - 4} r="5" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1.5" className="animate-bounce" />
            )}
          </g>
        )}

        {/* 5. LEFT LEG FOAM ZONE */}
        {foamLeftLeg > 5 && (
          <g opacity={Math.min(1, 0.45 + (foamLeftLeg / 100) * 0.55)}>
            <circle cx="95" cy={geo.legTop + 12} r="16" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="2.2" />
            <circle cx="92" cy={geo.legTop + 26} r="15" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2.2" />
            {foamLeftLeg >= 35 && (
              <>
                <circle cx="88" cy={geo.legTop + Math.min(42, geo.legH)} r="15" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2" />
                <circle cx="102" cy={geo.legTop + 22} r="14" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="2" />
              </>
            )}
          </g>
        )}

        {/* 6. RIGHT LEG FOAM ZONE */}
        {foamRightLeg > 5 && (
          <g opacity={Math.min(1, 0.45 + (foamRightLeg / 100) * 0.55)}>
            <circle cx="145" cy={geo.legTop + 12} r="16" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="2.2" />
            <circle cx="148" cy={geo.legTop + 26} r="15" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2.2" />
            {foamRightLeg >= 35 && (
              <>
                <circle cx="152" cy={geo.legTop + Math.min(42, geo.legH)} r="15" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2" />
                <circle cx="138" cy={geo.legTop + 22} r="14" fill="#F0F9FF" stroke="#38BDF8" strokeWidth="2" />
              </>
            )}
          </g>
        )}

        {/* FLOATING MINI BUBBLES & SPARKLES WHEN FOAM IS ACTIVE */}
        {anyFoam && (
          <g className="pointer-events-none">
            <circle cx="58" cy={geo.torsoTop + 6} r="6.5" fill="rgba(224,242,254,0.85)" stroke="#38BDF8" strokeWidth="1.6" className="animate-bounce" />
            <circle cx="184" cy={geo.torsoTop + 2} r="7.5" fill="rgba(224,242,254,0.85)" stroke="#38BDF8" strokeWidth="1.6" className="animate-bounce" />
            <circle cx="66" cy={geo.headY + 10} r="5" fill="rgba(255,255,255,0.9)" stroke="#38BDF8" strokeWidth="1.4" className="animate-pulse" />
            <circle cx="176" cy={geo.headY + 14} r="5.5" fill="rgba(255,255,255,0.9)" stroke="#38BDF8" strokeWidth="1.4" className="animate-pulse" />
            <polygon points="64,124 67,130 73,132 67,134 64,140 61,134 55,132 61,130" fill="#FEF08A" stroke="#F59E0B" strokeWidth="0.8" className="animate-pulse" />
            <polygon points="178,116 181,122 187,124 181,126 178,132 175,126 169,124 175,122" fill="#FEF08A" stroke="#F59E0B" strokeWidth="0.8" className="animate-pulse" />
          </g>
        )}

        {/* ==================== WET DROPLETS & SHOWER RINSE EFFECT ==================== */}
        {isShowerRinsing && (
          <g fill="#38BDF8" opacity="0.85">
            <ellipse cx="88" cy={geo.headY + 25} rx="2.2" ry="5" className="animate-bounce" />
            <ellipse cx="152" cy={geo.headY + 28} rx="2.2" ry="5" className="animate-bounce" />
            <ellipse cx="105" cy={geo.torsoTop + 32} rx="2.2" ry="5" className="animate-bounce" />
            <ellipse cx="135" cy={geo.torsoTop + 36} rx="2.2" ry="5" className="animate-bounce" />
          </g>
        )}

        {/* ==================== FRESH AFTER-BATH SPARKLE AURA ==================== */}
        {isFreshSparkling && (
          <g fill="#FACC15" stroke="#2D2520" strokeWidth="1">
            <polygon
              points="46,66 50,74 58,76 50,80 46,88 42,80 34,76 42,74"
              className="animate-pulse"
            />
            <polygon
              points="194,54 197,60 204,62 197,65 194,72 191,65 184,62 191,60"
              className="animate-pulse"
            />
            <polygon
              points="188,162 191,168 198,170 191,173 188,180 185,173 178,170 185,168"
              className="animate-pulse"
            />
          </g>
        )}

        {/* ==================== AGE-APPROPRIATE ACTION PROPS ==================== */}
        {effectiveState === 'drinking' && (
          <g transform={`translate(115, ${geo.mouthY - 10}) rotate(-25)`}>
            <rect x="0" y="0" width="24" height="40" rx="7" fill="#EFF6FF" stroke="#2D2520" strokeWidth="2.5" />
            <rect x="2" y="10" width="20" height="26" rx="4" fill="#FFFBEB" />
            <rect x="4" y="-6" width="16" height="7" rx="2.5" fill="#38BDF8" stroke="#2D2520" strokeWidth="2" />
            <path d="M 8 -6 L 12 -16 L 16 -6 Z" fill="#FBBF24" stroke="#2D2520" strokeWidth="2" />
          </g>
        )}

        {effectiveState === 'eating' && (
          <g transform={`translate(132, ${geo.mouthY - 2})`}>
            <ellipse cx="26" cy="2" rx="13" ry="6.5" fill="#F472B6" stroke="#2D2520" strokeWidth="2" />
            <rect x="0" y="0" width="24" height="4.5" rx="2" fill="#E2E8F0" stroke="#2D2520" strokeWidth="1.6" />
          </g>
        )}

        {/* Reading Storybook / Textbook Prop (Stages 4..7) */}
        {effectiveState === 'reading' && (
          <g transform={`translate(88, ${geo.torsoTop + 26})`}>
            <path d="M 0 8 L 32 14 L 32 44 L 0 38 Z" fill="#38BDF8" stroke="#2D2520" strokeWidth="2.4" />
            <path d="M 64 8 L 32 14 L 32 44 L 64 38 Z" fill="#0284C7" stroke="#2D2520" strokeWidth="2.4" />
            <path d="M 4 5 L 32 12 L 60 5" fill="none" stroke="#FFFDF9" strokeWidth="3" />
          </g>
        )}

        {/* Virtual Learning Tablet / Notebook Prop (Stages 5..7) */}
        {effectiveState === 'studying' && (
          <g transform={`translate(92, ${geo.torsoTop + 24})`}>
            <rect x="0" y="0" width="56" height="38" rx="6" fill="#1E293B" stroke="#2D2520" strokeWidth="2.5" />
            <rect x="5" y="5" width="46" height="28" rx="3" fill="#38BDF8" />
            <text x="28" y="23" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="bold">
              1 + 2 = 3
            </text>
          </g>
        )}

        {/* Cooking Spatula & Pan Prop (Stages 6..7) */}
        {effectiveState === 'cooking' && (
          <g transform={`translate(148, ${geo.torsoTop + 12})`}>
            <rect x="14" y="0" width="5" height="34" rx="2" fill="#B45309" stroke="#2D2520" strokeWidth="1.8" />
            <rect x="8" y="-14" width="17" height="16" rx="3" fill="#94A3B8" stroke="#2D2520" strokeWidth="2" />
          </g>
        )}

        {/* ==================== VOICE REACTION OVERLAYS (MAKE HEART, SCREEN TOUCH, COMFORT, BLOW KISS) ==================== */}
        {/* 1. MAKE HEART ("SAYANG"): Glowing Heart Aura + Both Hands Forming a Heart Symbol */}
        {effectiveState === 'make_heart' && (
          <g className="pointer-events-none">
            {/* Soft Glowing Heart Light Aura around Chest */}
            <path
              d={`M 120 ${geo.torsoTop + 42} C 86 ${geo.torsoTop + 18}, 74 ${geo.torsoTop - 12}, 102 ${
                geo.torsoTop - 12
              } C 112 ${geo.torsoTop - 12}, 120 ${geo.torsoTop - 2}, 120 ${
                geo.torsoTop - 2
              } C 120 ${geo.torsoTop - 2}, 128 ${geo.torsoTop - 12}, 138 ${
                geo.torsoTop - 12
              } C 166 ${geo.torsoTop - 12}, 154 ${geo.torsoTop + 18}, 120 ${geo.torsoTop + 42} Z`}
              fill="rgba(244, 114, 182, 0.28)"
              stroke="#F472B6"
              strokeWidth="2.5"
              className="animate-pulse"
            />
            {/* Both Hands Meeting at Center Forming a Heart */}
            <circle
              cx="107"
              cy={geo.torsoTop + 14}
              r="8.5"
              fill={skinObj.color}
              stroke="#2D2520"
              strokeWidth="2.4"
            />
            <circle
              cx="133"
              cy={geo.torsoTop + 14}
              r="8.5"
              fill={skinObj.color}
              stroke="#2D2520"
              strokeWidth="2.4"
            />
            <path
              d={`M 120 ${geo.torsoTop + 26} C 106 ${geo.torsoTop + 16}, 101 ${
                geo.torsoTop + 2
              }, 112 ${geo.torsoTop + 2} C 117 ${geo.torsoTop + 2}, 120 ${
                geo.torsoTop + 7
              }, 120 ${geo.torsoTop + 7} C 120 ${geo.torsoTop + 7}, 123 ${
                geo.torsoTop + 2
              }, 128 ${geo.torsoTop + 2} C 139 ${geo.torsoTop + 2}, 134 ${
                geo.torsoTop + 16
              }, 120 ${geo.torsoTop + 26} Z`}
              fill="#FB7185"
              stroke="#2D2520"
              strokeWidth="2.4"
            />
          </g>
        )}

        {/* 2. SCREEN TOUCH ("SAYANG" / "SAYA BERSEDIH"): Perspective Enlarged Palm Touching Camera Screen */}
        {effectiveState === 'screen_touch' && (
          <g className="pointer-events-none">
            {/* Soft Touch Ripple Rings on the Camera Glass */}
            <circle
              cx="154"
              cy={geo.torsoTop + 8}
              r="34"
              fill="rgba(251, 113, 133, 0.16)"
              stroke="#F472B6"
              strokeWidth="2.5"
              className="animate-ping"
            />
            <circle
              cx="154"
              cy={geo.torsoTop + 8}
              r="26"
              fill="rgba(253, 224, 71, 0.25)"
              stroke="#FBBF24"
              strokeWidth="2"
            />
            {/* Enlarged Perspective Little Palm Pressing Gently Against the Screen */}
            <g transform={`translate(154, ${geo.torsoTop + 10})`}>
              {/* 5 Little Fingers */}
              <ellipse cx="-14" cy="-8" rx="4.5" ry="7" transform="rotate(-28 -14 -8)" fill={skinObj.color} stroke="#2D2520" strokeWidth="2.2" />
              <ellipse cx="-7" cy="-16" rx="4.5" ry="8.5" transform="rotate(-10 -7 -16)" fill={skinObj.color} stroke="#2D2520" strokeWidth="2.2" />
              <ellipse cx="1" cy="-18" rx="4.5" ry="9" fill={skinObj.color} stroke="#2D2520" strokeWidth="2.2" />
              <ellipse cx="9" cy="-15" rx="4.5" ry="8.5" transform="rotate(12 9 -15)" fill={skinObj.color} stroke="#2D2520" strokeWidth="2.2" />
              <ellipse cx="15" cy="-6" rx="4.2" ry="7" transform="rotate(28 15 -6)" fill={skinObj.color} stroke="#2D2520" strokeWidth="2.2" />
              {/* Main Palm */}
              <circle cx="0" cy="0" r="14" fill={skinObj.color} stroke="#2D2520" strokeWidth="2.6" />
              {/* Cute Heart Print on Palm */}
              <path
                d="M 0 6 C -6 1, -8 -4, -3 -4 C -1 -4, 0 -2, 0 -2 C 0 -2, 1 -4, 3 -4 C 8 -4, 6 1, 0 6 Z"
                fill="#FB7185"
              />
            </g>
          </g>
        )}

        {/* 3. COMFORT PLAYER ("SAYA BERSEDIH"): Warm Caring Heart & Open Comforting Hands */}
        {effectiveState === 'comfort_player' && (
          <g className="pointer-events-none">
            <circle
              cx="120"
              cy={geo.torsoTop + 16}
              r="22"
              fill="rgba(253, 224, 71, 0.28)"
              className="animate-pulse"
            />
            <path
              d={`M 120 ${geo.torsoTop + 26} C 108 ${geo.torsoTop + 16}, 104 ${
                geo.torsoTop + 4
              }, 113 ${geo.torsoTop + 4} C 117 ${geo.torsoTop + 4}, 120 ${
                geo.torsoTop + 8
              }, 120 ${geo.torsoTop + 8} C 120 ${geo.torsoTop + 8}, 123 ${
                geo.torsoTop + 4
              }, 127 ${geo.torsoTop + 4} C 136 ${geo.torsoTop + 4}, 132 ${
                geo.torsoTop + 16
              }, 120 ${geo.torsoTop + 26} Z`}
              fill="#F43F5E"
              stroke="#2D2520"
              strokeWidth="2.2"
            />
          </g>
        )}

        {/* 4. CLAP HANDS ("KAMU PINTAR") & BIG SMILE ("JANGAN SEDIH") SPARKLE BURSTS */}
        {(effectiveState === 'clap_hands' || effectiveState === 'big_smile') && (
          <g fill="#FACC15" stroke="#2D2520" strokeWidth="1.2" className="pointer-events-none">
            <polygon points="48,96 52,104 60,106 52,110 48,118 44,110 36,106 44,104" className="animate-bounce" />
            <polygon points="192,96 196,104 204,106 196,110 192,118 188,110 180,106 188,104" className="animate-bounce" />
          </g>
        )}

        {/* 5. CURIOUS HEAD TILT ("?") FLOATING INDICATOR */}
        {effectiveState === 'curious_head_tilt' && (
          <g transform={`translate(174, ${geo.headY + 6})`} className="pointer-events-none">
            <circle cx="14" cy="14" r="14" fill="#FEF3C7" stroke="#2D2520" strokeWidth="2.4" />
            <text x="14" y="20" textAnchor="middle" fill="#D97706" fontSize="16" fontWeight="bold">
              ?
            </text>
          </g>
        )}

        {/* 6. IN-WORLD PEEKABOO (CILUKBA): BOTH HANDS COVERING EYES / FACE */}
        {peekabooHandsCovered && (
          <g className="pointer-events-none">
            {/* Left arm & hand raised over left eye */}
            <path
              d={`M ${120 - geo.shoulderHalf + 8} ${geo.torsoTop + 20} Q 74 ${geo.eyeY + 18} 96 ${geo.eyeY}`}
              fill="none"
              stroke={skinObj.color}
              strokeWidth="15"
              strokeLinecap="round"
            />
            <path
              d={`M ${120 - geo.shoulderHalf + 8} ${geo.torsoTop + 20} Q 74 ${geo.eyeY + 18} 96 ${geo.eyeY}`}
              fill="none"
              stroke="#2D2520"
              strokeWidth="18"
              strokeLinecap="round"
              opacity="0.22"
            />
            {/* Right arm & hand raised over right eye */}
            <path
              d={`M ${120 + geo.shoulderHalf - 8} ${geo.torsoTop + 20} Q 166 ${geo.eyeY + 18} 144 ${geo.eyeY}`}
              fill="none"
              stroke={skinObj.color}
              strokeWidth="15"
              strokeLinecap="round"
            />
            <path
              d={`M ${120 + geo.shoulderHalf - 8} ${geo.torsoTop + 20} Q 166 ${geo.eyeY + 18} 144 ${geo.eyeY}`}
              fill="none"
              stroke="#2D2520"
              strokeWidth="18"
              strokeLinecap="round"
              opacity="0.22"
            />
            {/* Left Palm & Little Fingers covering left eye */}
            <g transform={`translate(99, ${geo.eyeY})`}>
              <ellipse cx="0" cy="0" rx="15" ry="12" fill={skinObj.color} stroke="#2D2520" strokeWidth="2.5" />
              <circle cx="-8" cy="-10" r="4" fill={skinObj.color} stroke="#2D2520" strokeWidth="2" />
              <circle cx="-1" cy="-12" r="4" fill={skinObj.color} stroke="#2D2520" strokeWidth="2" />
              <circle cx="6" cy="-11" r="4" fill={skinObj.color} stroke="#2D2520" strokeWidth="2" />
            </g>
            {/* Right Palm & Little Fingers covering right eye */}
            <g transform={`translate(141, ${geo.eyeY})`}>
              <ellipse cx="0" cy="0" rx="15" ry="12" fill={skinObj.color} stroke="#2D2520" strokeWidth="2.5" />
              <circle cx="-6" cy="-11" r="4" fill={skinObj.color} stroke="#2D2520" strokeWidth="2" />
              <circle cx="1" cy="-12" r="4" fill={skinObj.color} stroke="#2D2520" strokeWidth="2" />
              <circle cx="8" cy="-10" r="4" fill={skinObj.color} stroke="#2D2520" strokeWidth="2" />
            </g>
            {/* Floating "Ciluk...?" prompt badge */}
            <g transform={`translate(120, ${geo.headY - 12})`}>
              <rect x="-42" y="-16" width="84" height="24" rx="12" fill="#FEF3C7" stroke="#2D2520" strokeWidth="2.2" />
              <text x="0" y="0" textAnchor="middle" fill="#B45309" fontSize="11" fontWeight="bold">
                🙈 Ciluk...?
              </text>
            </g>
          </g>
        )}

        {/* 7. IN-WORLD HELD OBJECT PROP (holdingObject state) */}
        {heldPropEmoji && !peekabooHandsCovered && (
          <g transform={`translate(152, ${geo.torsoTop + 26})`} className="pointer-events-none">
            <circle cx="0" cy="0" r="20" fill="rgba(255, 253, 249, 0.92)" stroke="#2D2520" strokeWidth="2.4" />
            <text x="0" y="8" textAnchor="middle" fontSize="24">
              {heldPropEmoji}
            </text>
          </g>
        )}
        </g>
      </svg>
    </div>
  );
};
