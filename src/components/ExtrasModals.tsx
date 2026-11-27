import React, { useState } from 'react';
import {
  BabyAppearance,
  BabyGender,
  BabyMemory,
  DailyMission,
  getGrowthStage,
  LOGIN_REWARDS,
  MathHistoryStats,
} from '../data/gameData';
import {
  calculateRealTimeGrowthSnapshot,
  getOutgrownActivitiesForStage,
  growthConfig,
  STAGE_DISPLAY_META,
  TOTAL_ADULT_JOURNEY_DAYS,
} from '../data/lifeProgressionData';
import { AudioSettings, sound } from '../utils/sound';
import { BabyCharacterSVG } from './BabyCharacterSVG';
import { X, CheckCircle2, Calendar, Camera, Settings, Volume2, VolumeX, Trash2, HeartHandshake, Clock, Sparkles } from 'lucide-react';

// ============================================================================
// 1. DAILY MISSIONS & LOGIN REWARD MODAL
// ============================================================================
interface MissionsModalProps {
  missions: DailyMission[];
  loginStreak: number;
  claimedLoginToday: boolean;
  onClaimMission: (missionId: string) => void;
  onClaimLoginReward: () => void;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  missions,
  loginStreak,
  claimedLoginToday,
  onClaimMission,
  onClaimLoginReward,
  onClose,
}) => {
  return (
    <div
      onClick={() => {
        sound.playClick();
        onClose();
      }}
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[1px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-x-0 bottom-14 z-[110] mx-auto w-full max-w-3xl max-h-[48dvh] bg-[#FFFDF9] border-t-3 border-x-3 border-[#2D2520] rounded-t-3xl shadow-[0_-8px_0_#2D2520] flex flex-col overflow-hidden"
      >
        <div className="sticky top-0 z-[115] flex items-center justify-between gap-2 px-4 sm:px-5 py-2.5 bg-[#A7F3D0] border-b-2 border-[#2D2520] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-5 h-5 text-[#2D2520] shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display text-xs sm:text-base font-bold text-[#2D2520] line-clamp-2 leading-tight">
                MISI HARIAN &amp; HADIAH LOGIN
              </h2>
              <p className="text-[10px] sm:text-xs text-[#2D2520]/80 truncate">
                Selesaikan tugas merawat bayi &amp; belajar matematika setiap hari!
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="relative z-[120] w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white border-2 border-[#2D2520] flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Tutup"
            title="Tutup (X)"
          >
            <X className="w-5 h-5 text-white stroke-[3]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto modal-scroll p-4 sm:p-6 space-y-5">
          {/* 7-Day Login Reward Strip */}
          <div className="p-4 rounded-2xl bg-[#FEF3C7] border-2 border-[#2D2520] space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-display text-sm font-bold text-[#2D2520]">
                🎁 Kalender Hadiah Login Harian (Hari ke-{loginStreak})
              </div>
              {!claimedLoginToday ? (
                <button
                  onClick={() => {
                    sound.playSurprise();
                    onClaimLoginReward();
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#FF8FAB] text-[#2D2520] font-display text-xs font-bold border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520]"
                >
                  Ambil Hadiah Hari Ini!
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-800">
                  ✓ Hadiah Hari Ini Sudah Diambil
                </span>
              )}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {LOGIN_REWARDS.map((r) => {
                const activeDay = ((loginStreak - 1) % 7) + 1 === r.day;
                const passedDay = ((loginStreak - 1) % 7) + 1 > r.day;
                return (
                  <div
                    key={r.day}
                    className={`p-2 rounded-xl border-2 text-center flex flex-col items-center ${
                      activeDay
                        ? 'bg-white border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                        : passedDay
                        ? 'bg-emerald-100 border-emerald-500 opacity-80'
                        : 'bg-white/60 border-[#E5DEC9]'
                    }`}
                  >
                    <span className="text-[10px] font-bold text-[#6E6259]">{r.label}</span>
                    <span className="text-lg my-0.5">{r.icon}</span>
                    <span className="font-mono-num text-[11px] font-bold text-[#B45309]">
                      +{r.coins}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Missions List */}
          <div className="space-y-2.5">
            <h3 className="font-display text-sm font-bold text-[#2D2520]">
              Daftar Misi Harian
            </h3>
            {missions.map((m) => {
              const completed = m.progress >= m.target;
              const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
              return (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-white border-2 border-[#2D2520] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#2D2520]">{m.title}</span>
                      <span className="font-mono-num text-xs font-bold text-[#6E6259]">
                        {m.progress}/{m.target}
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-stone-100 border border-[#2D2520] overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-[#34D399] transition-all duration-300"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="text-xs font-mono-num font-bold text-[#B45309]">
                      +{m.rewardCoins} 🪙 · +{m.rewardXp} XP
                    </div>
                    {m.claimed ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Selesai
                      </span>
                    ) : completed ? (
                      <button
                        onClick={() => {
                          sound.playCoin();
                          onClaimMission(m.id);
                        }}
                        className="px-4 py-1.5 rounded-xl bg-amber-300 hover:bg-amber-400 text-[#2D2520] font-display text-xs font-bold border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520]"
                      >
                        Klaim Hadiah!
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-stone-100 text-[#6E6259] text-xs font-bold">
                        Belum Selesai
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. BABY MEMORIES ALBUM MODAL
// ============================================================================
interface MemoriesModalProps {
  memories: BabyMemory[];
  babyName: string;
  gender: BabyGender;
  level?: number;
  appearance: BabyAppearance;
  mathStats: MathHistoryStats;
  onClose: () => void;
}

export const MemoriesModal: React.FC<MemoriesModalProps> = ({
  memories,
  babyName,
  gender,
  level = 1,
  appearance,
  mathStats,
  onClose,
}) => {
  const clampedLevel = Math.max(1, Math.min(7, level));
  const outgrownActivities = getOutgrownActivitiesForStage(clampedLevel);

  return (
    <div
      onClick={() => {
        sound.playClick();
        onClose();
      }}
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[1px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-x-0 bottom-14 z-[110] mx-auto w-full max-w-3xl max-h-[48dvh] bg-[#FFFDF9] border-t-3 border-x-3 border-[#2D2520] rounded-t-3xl shadow-[0_-8px_0_#2D2520] flex flex-col overflow-hidden"
      >
        <div className="sticky top-0 z-[115] flex items-center justify-between gap-2 px-4 sm:px-5 py-2.5 bg-[#DDD6FE] border-b-2 border-[#2D2520] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Camera className="w-5 h-5 text-[#2D2520] shrink-0" />
            <div className="min-w-0">
              <h2 className="font-display text-xs sm:text-base font-bold text-[#2D2520] line-clamp-2 leading-tight">
                ALBUM KENANGAN {babyName.toUpperCase()}
              </h2>
              <p className="text-[10px] sm:text-xs text-[#2D2520]/80 truncate">
                Catatan perjalanan tumbuh kembang, aktivitas masa kecil &amp; prestasi belajar matematika
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="relative z-[120] w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white border-2 border-[#2D2520] flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Tutup"
            title="Tutup (X)"
          >
            <X className="w-5 h-5 text-white stroke-[3]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto modal-scroll p-4 sm:p-6 space-y-5">
          {/* Math & Care Summary Strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 border-2 border-[#2D2520] text-center">
              <div className="text-xs text-[#6E6259]">Total Soal Benar</div>
              <div className="font-mono-num text-xl font-bold text-[#2D2520]">
                {mathStats.totalCorrect} Soal
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-pink-50 border-2 border-[#2D2520] text-center">
              <div className="text-xs text-[#6E6259]">Rekor Beruntun</div>
              <div className="font-mono-num text-xl font-bold text-[#2D2520]">
                🔥 {mathStats.bestStreak}x
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 border-2 border-[#2D2520] text-center">
              <div className="text-xs text-[#6E6259]">Total Kenangan</div>
              <div className="font-mono-num text-xl font-bold text-[#2D2520]">
                📸 {memories.length}
              </div>
            </div>
          </div>

          {/* Memories Polaroid Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {memories.map((mem) => (
              <div
                key={mem.id}
                className="p-4 rounded-2xl bg-white border-2 border-[#2D2520] shadow-sm flex items-center gap-4"
              >
                <div className="w-20 h-24 rounded-xl bg-[#FFFDF5] border border-[#E5DEC9] flex items-center justify-center shrink-0 overflow-hidden">
                  <BabyCharacterSVG
                    appearance={{ ...appearance, equippedOutfit: mem.outfitId }}
                    gender={gender}
                    level={mem.babyLevel}
                    actionState="laughing"
                    isSleeping={false}
                    needsSummary={{ isHungry: false, isSleepy: false, isDirty: false, isSad: false }}
                    sizeClass="w-20 h-24"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] font-mono-num text-[#6E6259]">
                    {mem.date} · Stage {mem.babyLevel}
                  </div>
                  <h4 className="font-display text-sm font-bold text-[#2D2520]">{mem.title}</h4>
                  <p className="text-xs text-[#6E6259]">{mem.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Archived Outgrown Childhood Activities Section */}
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-[#2D2520] space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-[#2D2520] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-700" />
                <span>Arsip Aktivitas Masa Kecil yang Telah Terlampaui ({outgrownActivities.length})</span>
              </h3>
              <span className="text-[11px] font-bold text-amber-800">
                Stage Saat Ini: {clampedLevel}/7
              </span>
            </div>
            {outgrownActivities.length === 0 ? (
              <p className="text-xs text-[#6E6259]">
                Aktivitas khusus bayi seperti Cilukba (Peekaboo) akan berpindah ke arsip kenangan ini ketika {babyName} bertumbuh melewati usia aktivitas tersebut.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {outgrownActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-2.5 rounded-xl bg-white border border-[#2D2520] flex items-center gap-2.5"
                  >
                    <span className="text-xl">{act.iconEmoji}</span>
                    <div>
                      <div className="text-xs font-bold text-[#2D2520]">
                        {act.indonesianTitle} ({act.title})
                      </div>
                      <div className="text-[10px] text-[#6E6259]">
                        Kenangan {act.stageLabel}
                      </div>
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
// 3. PROFILE & RENAME BABY MODAL (WITH REAL-TIME 246-DAY GROWTH STATUS)
// ============================================================================
interface ProfileModalProps {
  playerName: string;
  babyName: string;
  gender: BabyGender;
  level: number;
  careXp: number;
  mathXp: number;
  characterCreatedAt?: number;
  appearance: BabyAppearance;
  evaluatedAdultRegionName: string | null;
  totalRegionalPoints: number;
  onUpdateNames: (newBabyName: string, newPlayerName: string) => void;
  onOpenNusantara: () => void;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  playerName,
  babyName,
  gender,
  level,
  careXp,
  mathXp,
  characterCreatedAt,
  appearance,
  evaluatedAdultRegionName,
  totalRegionalPoints,
  onUpdateNames,
  onOpenNusantara,
  onClose,
}) => {
  const [editBabyName, setEditBabyName] = useState(babyName);
  const [editPlayerName, setEditPlayerName] = useState(playerName);
  const [savedNotice, setSavedNotice] = useState(false);

  const clampedLevel = Math.max(1, Math.min(7, level));
  const currentStageInfo = getGrowthStage(clampedLevel);
  const currentStageMeta = STAGE_DISPLAY_META[clampedLevel] || STAGE_DISPLAY_META[1];
  const nextStageMeta = clampedLevel < 7 ? STAGE_DISPLAY_META[clampedLevel + 1] : null;
  const growthSnapshot = calculateRealTimeGrowthSnapshot(
    characterCreatedAt || Date.now(),
    Date.now(),
    growthConfig
  );

  const handleSave = () => {
    if (!editBabyName.trim()) return;
    sound.playCoin();
    onUpdateNames(editBabyName.trim(), editPlayerName.trim() || 'Kakak Pintar');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2200);
  };

  return (
    <div
      onClick={() => {
        sound.playClick();
        onClose();
      }}
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[1px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-x-0 bottom-14 z-[110] mx-auto w-full max-w-2xl max-h-[48dvh] bg-[#FFFDF9] border-t-3 border-x-3 border-[#2D2520] rounded-t-3xl shadow-[0_-8px_0_#2D2520] flex flex-col overflow-hidden"
      >
        <div className="sticky top-0 z-[115] flex items-center justify-between gap-2 px-4 sm:px-5 py-2.5 bg-[#FFAFCC] border-b-2 border-[#2D2520] shrink-0">
          <div className="min-w-0">
            <h2 className="font-display text-xs sm:text-base font-bold text-[#2D2520] line-clamp-2 leading-tight">
              PROFIL KARAKTER &amp; STATUS PERTUMBUHAN
            </h2>
            <p className="text-[10px] sm:text-xs text-[#2D2520]/80 truncate">
              Identitas {babyName}, Pertumbuhan Waktu Nyata 246 Hari, dan Budaya Nusantara
            </p>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="relative z-[120] w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white border-2 border-[#2D2520] flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Tutup"
            title="Tutup (X)"
          >
            <X className="w-5 h-5 text-white stroke-[3]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto modal-scroll p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-5 bg-[#FFFDF5] border-2 border-[#2D2520] rounded-2xl p-4 flex flex-col items-center justify-between">
            <div className="flex flex-col items-center">
              <BabyCharacterSVG
                appearance={appearance}
                gender={gender}
                level={clampedLevel}
                actionState="waving"
                isSleeping={false}
                needsSummary={{ isHungry: false, isSleepy: false, isDirty: false, isSad: false }}
                sizeClass="w-40 h-48"
              />
              <div className="font-display text-base font-bold text-[#2D2520] mt-2">
                {babyName}
              </div>
              <div className="text-xs font-bold text-pink-600">
                Stage {clampedLevel}: {currentStageMeta.englishTitle} ({currentStageInfo.indonesianTitle})
              </div>
            </div>

            {/* Real-Time Age Badge */}
            <div className="w-full mt-3 p-3 rounded-xl bg-amber-50 border border-[#2D2520] text-xs space-y-1">
              <div className="flex items-center justify-between font-bold text-[#2D2520]">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-700" />
                  Usia Waktu Nyata:
                </span>
                <span>{growthSnapshot.totalElapsedDays} days old</span>
              </div>
              <div className="w-full h-2.5 bg-white rounded-full border border-[#2D2520] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-rose-500"
                  style={{ width: `${Math.max(5, growthSnapshot.stageProgressPercent)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#6E6259] font-bold">
                <span>
                  {clampedLevel < 7
                    ? `Tahap ini: ${growthSnapshot.daysInCurrentStage}/${growthSnapshot.stageDurationDays} hari`
                    : 'Tahap Dewasa Tercapai'}
                </span>
                <span>{growthSnapshot.stageProgressPercent}%</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-7 space-y-4">
            {/* Official Real-Time Growth Status Card (Requirement 5) */}
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-[#2D2520] space-y-2 text-xs">
              <div className="font-display text-sm font-bold text-[#2D2520]">
                🌱 MY LITTLE BABY — Real-Time Growth Status
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E6259]">Age (Usia):</span>
                <strong className="text-[#2D2520]">{growthSnapshot.totalElapsedDays} days old</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E6259]">Current Stage:</span>
                <strong className="text-[#2D2520]">
                  {currentStageMeta.englishTitle} ({currentStageMeta.indonesianTitle})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E6259]">Time in Current Stage:</span>
                <strong className="font-mono-num text-[#2D2520]">
                  {clampedLevel < 7
                    ? `${growthSnapshot.daysInCurrentStage} / ${growthSnapshot.stageDurationDays} days`
                    : `${growthSnapshot.daysInCurrentStage} days`}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E6259]">Next Stage:</span>
                <strong className="text-rose-800">
                  {nextStageMeta
                    ? `${nextStageMeta.englishTitle} (${nextStageMeta.indonesianTitle})`
                    : 'Final Stage (Adult)'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E6259]">Time Until Next Stage:</span>
                <strong className="font-mono-num text-emerald-800">
                  {nextStageMeta
                    ? `${growthSnapshot.daysRemainingInStage} days (${growthSnapshot.hoursRemainingInStage}j)`
                    : 'Completed (246/' + TOTAL_ADULT_JOURNEY_DAYS + ' days)'}
                </strong>
              </div>
            </div>

            {/* Rename Form */}
            <div className="p-4 rounded-2xl bg-white border-2 border-[#2D2520] space-y-3">
              <div className="font-display text-sm font-bold text-[#2D2520]">
                ✏️ Ubah Nama Karakter &amp; Nama Pemain
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6E6259] mb-1">
                  Nama Karakter Kesayangan:
                </label>
                <input
                  type="text"
                  value={editBabyName}
                  maxLength={18}
                  onChange={(e) => setEditBabyName(e.target.value)}
                  placeholder="Masukkan nama bayi kesayanganmu"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] border-2 border-[#2D2520] font-display font-bold text-sm text-[#2D2520]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6E6259] mb-1">
                  Nama Pemain:
                </label>
                <input
                  type="text"
                  value={editPlayerName}
                  maxLength={20}
                  onChange={(e) => setEditPlayerName(e.target.value)}
                  placeholder="Masukkan nama pemain"
                  className="w-full px-3 py-2 rounded-xl bg-[#FFFDF9] border-2 border-[#2D2520] font-bold text-sm text-[#2D2520]"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                {savedNotice ? (
                  <span className="text-xs font-bold text-emerald-700">
                    ✓ Nama berhasil diperbarui &amp; disimpan!
                  </span>
                ) : (
                  <span className="text-[11px] text-[#6E6259]">Otomatis tersimpan di LocalStorage</span>
                )}
                <button
                  onClick={handleSave}
                  className="px-4 py-2 rounded-xl bg-[#34D399] text-[#2D2520] font-display text-xs font-bold border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520]"
                >
                  Simpan Nama
                </button>
              </div>
            </div>

            {/* Cultural Summary */}
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-[#2D2520] space-y-2 text-xs">
              <div className="font-display text-sm font-bold text-[#2D2520]">
                🇮🇩 Statistik Perawatan &amp; Budaya Nusantara
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E6259]">Poin Perawatan / Matematika:</span>
                <strong className="font-mono-num text-[#2D2520]">
                  {careXp} XP / {mathXp} XP
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E6259]">Total Poin Kuliner Daerah:</span>
                <strong className="font-mono-num text-amber-900">{totalRegionalPoints} Poin</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E6259]">Identitas Budaya Dewasa:</span>
                <strong className="text-emerald-800">
                  {evaluatedAdultRegionName || 'Menunggu Evolusi Dewasa (Hari ke-246)'}
                </strong>
              </div>
              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                  onOpenNusantara();
                }}
                className="w-full mt-2 py-2 rounded-xl bg-amber-300 text-[#2D2520] font-display text-xs font-bold border-2 border-[#2D2520]"
              >
                Buka Museum Nusantara Culture →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. SETTINGS & CHILD SAFETY MODAL
// ============================================================================
interface SettingsModalProps {
  audioSettings: AudioSettings;
  graphicsQuality: 'low' | 'medium';
  playerName: string;
  babyName: string;
  onUpdateAudio: (partial: Partial<AudioSettings>) => void;
  onUpdateGraphics: (q: 'low' | 'medium') => void;
  onUpdateNames: (newBabyName: string, newPlayerName: string) => void;
  onResetGame: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  audioSettings,
  graphicsQuality,
  playerName,
  babyName,
  onUpdateAudio,
  onUpdateGraphics,
  onUpdateNames,
  onResetGame,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const [tempBabyName, setTempBabyName] = useState(babyName);
  const [tempPlayerName, setTempPlayerName] = useState(playerName);
  const [renameSaved, setRenameSaved] = useState(false);

  return (
    <div
      onClick={() => {
        sound.playClick();
        onClose();
      }}
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[1px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed inset-x-0 bottom-14 z-[110] mx-auto w-full max-w-xl max-h-[48dvh] bg-[#FFFDF9] border-t-3 border-x-3 border-[#2D2520] rounded-t-3xl shadow-[0_-8px_0_#2D2520] flex flex-col overflow-hidden"
      >
        <div className="sticky top-0 z-[115] flex items-center justify-between gap-2 px-4 sm:px-5 py-2.5 bg-[#BAE6FD] border-b-2 border-[#2D2520] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Settings className="w-5 h-5 text-[#2D2520] shrink-0" />
            <h2 className="font-display text-xs sm:text-base font-bold text-[#2D2520] line-clamp-2 leading-tight">
              PENGATURAN &amp; PROFIL NAMA
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="relative z-[120] w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white border-2 border-[#2D2520] flex items-center justify-center shrink-0 cursor-pointer"
            aria-label="Tutup"
            title="Tutup (X)"
          >
            <X className="w-5 h-5 text-white stroke-[3]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto modal-scroll p-5 space-y-4">
          {/* Quick Rename Section */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#2D2520] space-y-2.5">
            <div className="font-display text-sm font-bold text-[#2D2520]">
              ✏️ Ganti Nama Bayi &amp; Nama Pemain
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-[#6E6259] mb-1">
                  Nama Bayi:
                </label>
                <input
                  type="text"
                  value={tempBabyName}
                  maxLength={18}
                  onChange={(e) => setTempBabyName(e.target.value)}
                  placeholder="Masukkan nama bayi kesayanganmu"
                  className="w-full px-3 py-1.5 rounded-xl bg-[#FFFDF9] border-2 border-[#2D2520] font-bold text-xs text-[#2D2520]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#6E6259] mb-1">
                  Nama Pemain:
                </label>
                <input
                  type="text"
                  value={tempPlayerName}
                  maxLength={20}
                  onChange={(e) => setTempPlayerName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#FFFDF9] border-2 border-[#2D2520] font-bold text-xs text-[#2D2520]"
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-bold text-emerald-700">
                {renameSaved ? '✓ Nama disimpan!' : ''}
              </span>
              <button
                onClick={() => {
                  if (!tempBabyName.trim()) return;
                  sound.playCoin();
                  onUpdateNames(tempBabyName.trim(), tempPlayerName.trim() || 'Kakak Pintar');
                  setRenameSaved(true);
                  setTimeout(() => setRenameSaved(false), 2000);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-[#34D399] text-[#2D2520] font-display text-xs font-bold border-2 border-[#2D2520]"
              >
                Simpan Nama Baru
              </button>
            </div>
          </div>

          {/* Audio Controls */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#2D2520] space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-bold text-[#2D2520]">
                Pengaturan Suara &amp; Musik
              </span>
              <button
                onClick={() => onUpdateAudio({ muted: !audioSettings.muted })}
                className={`px-3 py-1 rounded-xl text-xs font-bold border-2 flex items-center gap-1.5 ${
                  audioSettings.muted
                    ? 'bg-rose-100 text-rose-900 border-rose-500'
                    : 'bg-emerald-100 text-emerald-900 border-emerald-500'
                }`}
              >
                {audioSettings.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                <span>{audioSettings.muted ? 'Suara Dimatikan (Mute)' : 'Suara Aktif'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-xs font-bold text-[#2D2520] flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={audioSettings.musicEnabled}
                  onChange={(e) => onUpdateAudio({ musicEnabled: e.target.checked })}
                  className="w-4 h-4 accent-pink-500"
                />
                <span>Musik Latar Ceria (ON/OFF)</span>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={audioSettings.musicVolume}
                onChange={(e) => onUpdateAudio({ musicVolume: parseFloat(e.target.value) })}
                className="w-32 accent-pink-500"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <label className="text-xs font-bold text-[#2D2520] flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={audioSettings.sfxEnabled}
                  onChange={(e) => onUpdateAudio({ sfxEnabled: e.target.checked })}
                  className="w-4 h-4 accent-pink-500"
                />
                <span>Efek Suara Bayi &amp; Koin (ON/OFF)</span>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={audioSettings.sfxVolume}
                onChange={(e) => onUpdateAudio({ sfxVolume: parseFloat(e.target.value) })}
                className="w-32 accent-pink-500"
              />
            </div>
          </div>

          {/* Graphics & Language */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#2D2520] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2D2520]">Kualitas Grafis &amp; Partikel:</span>
              <div className="flex gap-2">
                {(['low', 'medium'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => onUpdateGraphics(q)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border-2 ${
                      graphicsQuality === q
                        ? 'bg-amber-300 border-[#2D2520]'
                        : 'bg-stone-100 border-stone-300'
                    }`}
                  >
                    {q === 'low' ? 'Low (Hemat Baterai)' : 'Medium (Penuh)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#2D2520]">Bahasa Permainan:</span>
              <span className="font-bold text-emerald-800">🇮🇩 Bahasa Indonesia (Default)</span>
            </div>
          </div>

          {/* Child-Friendly Break Reminder & Info */}
          <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-600 flex items-start gap-3">
            <HeartHandshake className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 space-y-1">
              <div className="font-bold">Pengingat Ramah Anak – {playerName} &amp; {babyName}</div>
              <p>
                Jangan lupa istirahatkan mata setiap 30 menit bermain ya! {babyName} akan tetap aman,
                sehat, dan menunggumu kembali tanpa hukuman meskipun kamu beristirahat.
              </p>
            </div>
          </div>

          {/* Reset Game with Confirmation */}
          <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-rose-950">Mulai Ulang / Reset Permainan</div>
              <div className="text-[11px] text-rose-800">
                Menghapus progres lokal dan membuat karakter bayi baru dari awal.
              </div>
            </div>
            {!confirmReset ? (
              <button
                onClick={() => setConfirmReset(true)}
                className="px-3.5 py-2 rounded-xl bg-white border-2 border-rose-500 text-xs font-bold text-rose-700 flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Reset Game</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onResetGame}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold"
                >
                  Ya, Hapus
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-xs font-bold"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
