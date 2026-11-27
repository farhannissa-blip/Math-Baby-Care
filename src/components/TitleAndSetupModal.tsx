import React, { useState } from 'react';
import {
  BabyAppearance,
  BabyGender,
  BabyPersonalityId,
  EYE_COLORS,
  HAIR_COLORS,
  HAIR_STYLES,
  PERSONALITIES,
  SKIN_TONES,
} from '../data/gameData';
import { BabyCharacterSVG } from './BabyCharacterSVG';
import { sound } from '../utils/sound';
import { Play, Sparkles, RotateCcw } from 'lucide-react';

interface TitleAndSetupModalProps {
  hasSavedGame: boolean;
  savedBabyName?: string;
  savedLevel?: number;
  onContinueGame: () => void;
  onStartNewGame: (config: {
    playerName: string;
    babyName: string;
    gender: BabyGender;
    personality: BabyPersonalityId;
    appearance: BabyAppearance;
  }) => void;
}

export const TitleAndSetupModal: React.FC<TitleAndSetupModalProps> = ({
  hasSavedGame,
  savedBabyName,
  savedLevel,
  onContinueGame,
  onStartNewGame,
}) => {
  const [step, setStep] = useState<'title' | 'customize'>('title');
  const [playerName, setPlayerName] = useState('Kakak Pintar');
  const [babyName, setBabyName] = useState('Aisyah');
  const [nameError, setNameError] = useState<string | null>(null);
  const [gender, setGender] = useState<BabyGender>('girl');
  const [personality, setPersonality] = useState<BabyPersonalityId>('cheerful');
  const [appearance, setAppearance] = useState<BabyAppearance>({
    skinTone: SKIN_TONES[0].color,
    hairStyle: 'kuncir_dua',
    hairColor: HAIR_COLORS[0].color,
    eyeColor: EYE_COLORS[0].color,
    equippedOutfit: 'outfit_pink_pastel',
    equippedHat: null,
    equippedGlasses: null,
    equippedShoes: null,
  });

  const handleSelectGender = (g: BabyGender) => {
    sound.playClick();
    setGender(g);
    if (g === 'girl') {
      if (!babyName || babyName === 'Bimo') setBabyName('Aisyah');
      setAppearance((prev) => ({
        ...prev,
        hairStyle: 'kuncir_dua',
        equippedOutfit: 'outfit_pink_pastel',
      }));
    } else {
      if (!babyName || babyName === 'Aisyah') setBabyName('Bimo');
      setAppearance((prev) => ({
        ...prev,
        hairStyle: 'jambul_lucu',
        equippedOutfit: 'outfit_blue_sky',
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen overflow-hidden bg-[#FFFDF9] flex items-center justify-center">
      {/* Illustrated Nursery Backdrop with Scrim */}
      <img
        src="/src/assets/images/title_nursery_backdrop_1795023382417.jpg"
        alt="My Little Baby Nursery"
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#2D2520]/45 via-[#2D2520]/30 to-[#2D2520]/70" />

      {step === 'title' ? (
        <div className="relative z-10 w-full max-w-4xl mx-4 p-6 sm:p-8 rounded-3xl bg-[#FFFDF9]/95 border-3 border-[#2D2520] shadow-[0_12px_0_#2D2520] flex flex-col items-center text-center space-y-5">
          {/* Bespoke SVG Title Lockup */}
          <div className="flex flex-col items-center">
            <svg viewBox="0 0 580 110" className="w-full max-w-lg h-24 overflow-visible">
              <defs>
                <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF8FAB" />
                  <stop offset="50%" stopColor="#FBBF24" />
                  <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
              </defs>
              <text
                x="290"
                y="56"
                textAnchor="middle"
                fill="url(#titleGrad)"
                stroke="#2D2520"
                strokeWidth="8"
                paintOrder="stroke"
                className="font-display text-[48px] font-bold tracking-wide"
              >
                MY LITTLE BABY
              </text>
              <rect
                x="115"
                y="70"
                width="350"
                height="32"
                rx="16"
                fill="#A7F3D0"
                stroke="#2D2520"
                strokeWidth="3"
              />
              <text
                x="290"
                y="91"
                textAnchor="middle"
                fill="#2D2520"
                className="font-display text-[17px] font-bold tracking-wider"
              >
                MATH &amp; CARE ADVENTURE
              </text>
            </svg>
          </div>

          {/* Animated Twin Babies Preview: Baby Girl & Baby Boy */}
          <div className="grid grid-cols-2 gap-6 sm:gap-12 items-center justify-center py-1">
            <div
              onClick={() => {
                handleSelectGender('girl');
                setStep('customize');
              }}
              className="flex flex-col items-center p-3 rounded-2xl bg-pink-50/90 border-2 border-[#2D2520] hover:scale-105 transition-transform cursor-pointer"
            >
              <BabyCharacterSVG
                appearance={{
                  skinTone: SKIN_TONES[0].color,
                  hairStyle: 'kuncir_dua',
                  hairColor: HAIR_COLORS[0].color,
                  eyeColor: EYE_COLORS[0].color,
                  equippedOutfit: 'outfit_pink_pastel',
                  equippedHat: 'hat_ribbon_pink',
                  equippedGlasses: null,
                  equippedShoes: null,
                }}
                gender="girl"
                level={2}
                actionState="waving"
                isSleeping={false}
                needsSummary={{ isHungry: false, isSleepy: false, isDirty: false, isSad: false }}
                sizeClass="w-32 h-36 sm:w-40 sm:h-44"
              />
              <span className="font-display text-sm sm:text-base font-bold text-[#2D2520] mt-1">
                👶🏻 Baby Girl
              </span>
            </div>

            <div
              onClick={() => {
                handleSelectGender('boy');
                setStep('customize');
              }}
              className="flex flex-col items-center p-3 rounded-2xl bg-sky-50/90 border-2 border-[#2D2520] hover:scale-105 transition-transform cursor-pointer"
            >
              <BabyCharacterSVG
                appearance={{
                  skinTone: SKIN_TONES[1].color,
                  hairStyle: 'jambul_lucu',
                  hairColor: HAIR_COLORS[1].color,
                  eyeColor: EYE_COLORS[0].color,
                  equippedOutfit: 'outfit_blue_sky',
                  equippedHat: 'hat_cap_explorer',
                  equippedGlasses: null,
                  equippedShoes: null,
                }}
                gender="boy"
                level={2}
                actionState="laughing"
                isSleeping={false}
                needsSummary={{ isHungry: false, isSleepy: false, isDirty: false, isSad: false }}
                sizeClass="w-32 h-36 sm:w-40 sm:h-44"
              />
              <span className="font-display text-sm sm:text-base font-bold text-[#2D2520] mt-1">
                👶🏼 Baby Boy
              </span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
            {hasSavedGame && (
              <button
                onClick={() => {
                  sound.playClick();
                  sound.startMusic();
                  onContinueGame();
                }}
                className="px-7 py-3.5 rounded-2xl bg-[#34D399] text-[#2D2520] font-display text-base sm:text-lg font-bold border-3 border-[#2D2520] shadow-[0_5px_0_#2D2520] hover:brightness-105 active:translate-y-0.5 flex items-center gap-2 whitespace-nowrap"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>
                  Lanjutkan ({savedBabyName} · Lv.{savedLevel})
                </span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick();
                setStep('customize');
              }}
              className="px-7 py-3.5 rounded-2xl bg-[#FF8FAB] text-[#2D2520] font-display text-base sm:text-lg font-bold border-3 border-[#2D2520] shadow-[0_5px_0_#2D2520] hover:brightness-105 active:translate-y-0.5 flex items-center gap-2 whitespace-nowrap"
            >
              <Sparkles className="w-5 h-5" />
              <span>{hasSavedGame ? 'Buat Bayi Baru' : 'Mulai Petualangan Baru'}</span>
            </button>
          </div>

          {/* Single Flat Control-Hint Line */}
          <p className="text-xs font-medium text-[#6E6259]">
            Sentuh / Klik untuk Merawat Bayi · Selesaikan Soal Matematika SD Kelas 1–6 untuk Koin · Otomatis Tersimpan
          </p>
        </div>
      ) : (
        /* STEP 2: CHARACTER CUSTOMIZATION STUDIO */
        <div className="relative z-10 w-full max-w-4xl max-h-[92vh] mx-3 bg-[#FFFDF9] border-3 border-[#2D2520] rounded-3xl shadow-[0_10px_0_#2D2520] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 bg-[#FEF3C7] border-b-2 border-[#2D2520]">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#2D2520]">
                PERSONALISASI BAYI KESAYANGANMU
              </h2>
              <p className="text-xs text-[#6E6259]">
                Pilih karakter, warna kulit, rambut, mata, pakaian awal, dan kepribadian unik!
              </p>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                setStep('title');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white border-2 border-[#2D2520] text-xs font-bold text-[#2D2520] flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kembali</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto modal-scroll p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Left Live Preview */}
            <div className="md:col-span-5 bg-[#FFFDF5] border-2 border-[#2D2520] rounded-2xl p-4 flex flex-col items-center justify-between">
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => handleSelectGender('girl')}
                  className={`flex-1 py-2 rounded-xl font-display text-sm font-bold border-2 ${
                    gender === 'girl'
                      ? 'bg-[#FF8FAB] text-[#2D2520] border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                      : 'bg-white text-[#6E6259] border-[#E5DEC9]'
                  }`}
                >
                  👧🏻 Bayi Perempuan
                </button>
                <button
                  onClick={() => handleSelectGender('boy')}
                  className={`flex-1 py-2 rounded-xl font-display text-sm font-bold border-2 ${
                    gender === 'boy'
                      ? 'bg-[#90E0EF] text-[#2D2520] border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                      : 'bg-white text-[#6E6259] border-[#E5DEC9]'
                  }`}
                >
                  👦🏻 Bayi Laki-laki
                </button>
              </div>

              <div className="my-2">
                <BabyCharacterSVG
                  appearance={appearance}
                  gender={gender}
                  level={1}
                  actionState="laughing"
                  isSleeping={false}
                  needsSummary={{ isHungry: false, isSleepy: false, isDirty: false, isSad: false }}
                  sizeClass="w-44 h-52"
                />
              </div>

              <div className="w-full space-y-2">
                <div>
                  <label className="block text-xs font-bold text-[#2D2520] mb-1">
                    Nama Bayi <span className="text-rose-600">* (Wajib)</span>:
                  </label>
                  <input
                    type="text"
                    required
                    value={babyName}
                    maxLength={18}
                    onChange={(e) => {
                      setBabyName(e.target.value);
                      if (e.target.value.trim()) setNameError(null);
                    }}
                    className={`w-full px-3 py-2 rounded-xl bg-white border-2 font-display font-bold text-sm text-[#2D2520] ${
                      nameError ? 'border-rose-600 bg-rose-50' : 'border-[#2D2520]'
                    }`}
                    placeholder="Masukkan nama bayi kesayanganmu"
                  />
                  {nameError && (
                    <p className="text-[11px] font-bold text-rose-600 mt-1">{nameError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#2D2520] mb-1">
                    Nama Pemain (Kakak/Bunda/Ayah):
                  </label>
                  <input
                    type="text"
                    required
                    value={playerName}
                    maxLength={20}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border-2 border-[#2D2520] font-bold text-sm text-[#2D2520]"
                    placeholder="Masukkan nama pemain"
                  />
                </div>
              </div>
            </div>

            {/* Right Customization Controls */}
            <div className="md:col-span-7 space-y-4">
              {/* 1. Skin Tone */}
              <div>
                <label className="block text-xs font-bold text-[#2D2520] mb-1.5">
                  1. Warna Kulit Bayi:
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {SKIN_TONES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        sound.playClick();
                        setAppearance((prev) => ({ ...prev, skinTone: s.color }));
                      }}
                      className={`px-3 py-1.5 rounded-xl border-2 flex items-center gap-2 text-xs font-bold ${
                        appearance.skinTone === s.color
                          ? 'border-[#2D2520] bg-amber-100 shadow-[0_2px_0_#2D2520]'
                          : 'border-[#E5DEC9] bg-white'
                      }`}
                    >
                      <span
                        style={{ backgroundColor: s.color }}
                        className="w-4 h-4 rounded-full border border-[#2D2520]"
                      />
                      <span>{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Hair Style & Color */}
              <div>
                <label className="block text-xs font-bold text-[#2D2520] mb-1.5">
                  2. Model &amp; Warna Rambut:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                  {HAIR_STYLES.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => {
                        sound.playClick();
                        setAppearance((prev) => ({ ...prev, hairStyle: h.id }));
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border-2 truncate ${
                        appearance.hairStyle === h.id
                          ? 'bg-[#FF8FAB] text-[#2D2520] border-[#2D2520]'
                          : 'bg-white text-[#6E6259] border-[#E5DEC9]'
                      }`}
                    >
                      {h.name}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {HAIR_COLORS.map((hc) => (
                    <button
                      key={hc.id}
                      onClick={() => {
                        sound.playClick();
                        setAppearance((prev) => ({ ...prev, hairColor: hc.color }));
                      }}
                      className={`px-2.5 py-1 rounded-lg border-2 flex items-center gap-1.5 text-xs font-bold ${
                        appearance.hairColor === hc.color
                          ? 'border-[#2D2520] bg-amber-100'
                          : 'border-[#E5DEC9] bg-white'
                      }`}
                    >
                      <span
                        style={{ backgroundColor: hc.color }}
                        className="w-3.5 h-3.5 rounded-full border border-[#2D2520]"
                      />
                      <span>{hc.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Eye Color & Starter Outfit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#2D2520] mb-1.5">
                    3. Warna Mata:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {EYE_COLORS.map((ec) => (
                      <button
                        key={ec.id}
                        onClick={() => {
                          sound.playClick();
                          setAppearance((prev) => ({ ...prev, eyeColor: ec.color }));
                        }}
                        className={`px-2.5 py-1 rounded-lg border-2 flex items-center gap-1.5 text-xs font-bold ${
                          appearance.eyeColor === ec.color
                            ? 'border-[#2D2520] bg-amber-100'
                            : 'border-[#E5DEC9] bg-white'
                        }`}
                      >
                        <span
                          style={{ backgroundColor: ec.color }}
                          className="w-3.5 h-3.5 rounded-full border border-[#2D2520]"
                        />
                        <span>{ec.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#2D2520] mb-1.5">
                    4. Pakaian Awal:
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setAppearance((prev) => ({ ...prev, equippedOutfit: 'outfit_pink_pastel' }));
                      }}
                      className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold border-2 ${
                        appearance.equippedOutfit === 'outfit_pink_pastel'
                          ? 'bg-pink-200 border-[#2D2520]'
                          : 'bg-white border-[#E5DEC9]'
                      }`}
                    >
                      👚 Pink Pastel
                    </button>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setAppearance((prev) => ({ ...prev, equippedOutfit: 'outfit_blue_sky' }));
                      }}
                      className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold border-2 ${
                        appearance.equippedOutfit === 'outfit_blue_sky'
                          ? 'bg-sky-200 border-[#2D2520]'
                          : 'bg-white border-[#E5DEC9]'
                      }`}
                    >
                      👕 Biru Langit
                    </button>
                  </div>
                </div>
              </div>

              {/* 5. Baby Personality */}
              <div>
                <label className="block text-xs font-bold text-[#2D2520] mb-1.5">
                  5. Kepribadian Unik Bayi (Baby Personality):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PERSONALITIES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        sound.playClick();
                        setPersonality(p.id);
                      }}
                      className={`p-2.5 rounded-xl border-2 text-left transition-all ${
                        personality === p.id
                          ? 'bg-amber-100 border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                          : 'bg-white border-[#E5DEC9]'
                      }`}
                    >
                      <div className="font-display text-xs font-bold text-[#2D2520]">
                        {p.name} ({p.indonesianName})
                      </div>
                      <div className="text-[11px] text-[#6E6259]">{p.favoriteActivity}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => {
                    if (!babyName.trim()) {
                      sound.playWrong();
                      setNameError('Wajib diisi: Masukkan nama bayi kesayanganmu terlebih dahulu!');
                      return;
                    }
                    sound.playLevelUp();
                    sound.startMusic();
                    onStartNewGame({
                      playerName: playerName.trim() || 'Kakak Pintar',
                      babyName: babyName.trim(),
                      gender,
                      personality,
                      appearance,
                    });
                  }}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#34D399] text-[#2D2520] font-display text-base font-bold border-3 border-[#2D2520] shadow-[0_5px_0_#2D2520] hover:brightness-105"
                >
                  Mulai Merawat {babyName.trim() || 'Bayi'} Sekarang! →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
