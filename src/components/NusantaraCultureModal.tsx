import React, { useState } from 'react';
import {
  BabyAppearance,
  BabyGender,
  ConsumedFoodRecord,
  StoreItem,
} from '../data/gameData';
import {
  getClothingTitleForGender,
  getLifePhaseFromLevel,
  getLifePhaseLabel,
  NUSANTARA_CLOTHING,
  NUSANTARA_MEALS,
  NUSANTARA_SNACKS,
  NusantaraClothingItem,
  NusantaraFoodItem,
  REGIONAL_LIST,
  regionalData,
  RegionalCultureEntry,
  RegionId,
  validateClothingPhaseAccess,
  validateFoodPhaseAccess,
} from '../data/nusantaraData';
import { BabyCharacterSVG } from './BabyCharacterSVG';
import { sound } from '../utils/sound';
import { X, Lock, Utensils, Shirt, MapPin, Award, Sparkles, Eye } from 'lucide-react';

interface NusantaraCultureModalProps {
  babyName: string;
  gender: BabyGender;
  level: number;
  coins: number;
  appearance: BabyAppearance;
  regionScores: Record<RegionId, number>;
  foodInventory: Record<string, number>;
  ownedClothes: string[];
  consumedFoodHistory: ConsumedFoodRecord[];
  evaluatedAdultRegion: RegionId | null;
  onBuyFood: (item: NusantaraFoodItem) => void;
  onConsumeFood: (item: NusantaraFoodItem) => void;
  onBuyClothing: (item: NusantaraClothingItem) => void;
  onEquipClothing: (item: StoreItem) => void;
  onClose: () => void;
}

export const NusantaraCultureModal: React.FC<NusantaraCultureModalProps> = ({
  babyName,
  gender,
  level,
  coins,
  appearance,
  regionScores,
  foodInventory,
  ownedClothes,
  consumedFoodHistory,
  evaluatedAdultRegion,
  onBuyFood,
  onConsumeFood,
  onBuyClothing,
  onEquipClothing,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'food' | 'clothing' | 'map'>('food');
  const [foodFilter, setFoodFilter] = useState<'snack' | 'meal'>('snack');
  const [selectedRegionId, setSelectedRegionId] = useState<RegionId>('aceh');
  const [previewOutfitId, setPreviewOutfitId] = useState<string>(appearance.equippedOutfit);
  const [noticeBanner, setNoticeBanner] = useState<{ text: string; type: 'info' | 'lock' | 'success' } | null>(null);

  const lifePhase = getLifePhaseFromLevel(level);
  const selectedRegion: RegionalCultureEntry = regionalData[selectedRegionId] || regionalData.aceh;

  const showNotice = (text: string, type: 'info' | 'lock' | 'success' = 'info') => {
    setNoticeBanner({ text, type });
    setTimeout(() => setNoticeBanner(null), 3600);
  };

  const handleLockedFoodClick = (item: NusantaraFoodItem) => {
    sound.playWrong();
    if (lifePhase === 'BAYI') {
      showNotice(
        'Menu makanan Nusantara akan terbuka ketika aku tumbuh menjadi anak-anak.',
        'lock'
      );
    } else {
      showNotice(
        `Makanan berat "${item.name}" akan terbuka ketika ${babyName} tumbuh dewasa (Level 6).`,
        'lock'
      );
    }
  };

  const handleLockedClothingClick = () => {
    sound.playWrong();
    showNotice(
      `Pakaian Adat Nusantara akan terbuka ketika ${babyName} tumbuh menjadi anak-anak (Level 4).`,
      'lock'
    );
  };

  const totalRegionalPoints = (Object.values(regionScores) as number[]).reduce((a, b) => a + b, 0);

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
        className="fixed inset-x-0 bottom-14 z-[110] mx-auto w-full max-w-5xl max-h-[48dvh] bg-[#FFFDF9] border-t-3 border-x-3 border-[#2D2520] rounded-t-3xl shadow-[0_-8px_0_#2D2520] flex flex-col overflow-hidden"
      >
        {/* Sticky Top Header */}
        <div className="sticky top-0 z-[115] flex items-center justify-between gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-amber-200 via-orange-100 to-emerald-100 border-b-2 border-[#2D2520] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">🇮🇩</span>
            <div className="min-w-0">
              <h2 className="font-display text-xs sm:text-base font-bold text-[#2D2520] line-clamp-2 leading-tight">
                NUSANTARA CULTURE – MUSEUM BUDAYA &amp; KULINER
              </h2>
              <p className="text-[10px] sm:text-xs text-[#6E6259] truncate">
                {babyName} · <strong>{getLifePhaseLabel(lifePhase)}</strong> · Poin:{' '}
                <strong className="text-amber-900">{totalRegionalPoints}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-2.5 py-1 rounded-xl bg-white border-2 border-[#2D2520] font-mono-num text-xs sm:text-sm font-bold text-[#B45309] whitespace-nowrap">
              🪙 Rp {coins}
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
        </div>

        {/* 3 Main Category Tabs */}
        <div className="grid grid-cols-3 gap-2 px-5 pt-3">
          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('food');
            }}
            className={`py-2.5 px-3 rounded-xl font-display text-xs sm:text-sm font-bold border-2 flex items-center justify-center gap-2 ${
              activeTab === 'food'
                ? 'bg-[#FBBF24] text-[#2D2520] border-[#2D2520] shadow-[0_3px_0_#2D2520]'
                : 'bg-white text-[#6E6259] border-[#E5DEC9]'
            }`}
          >
            <Utensils className="w-4 h-4 shrink-0" />
            <span className="truncate">1. Traditional Food</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('clothing');
            }}
            className={`py-2.5 px-3 rounded-xl font-display text-xs sm:text-sm font-bold border-2 flex items-center justify-center gap-2 ${
              activeTab === 'clothing'
                ? 'bg-[#FF8FAB] text-[#2D2520] border-[#2D2520] shadow-[0_3px_0_#2D2520]'
                : 'bg-white text-[#6E6259] border-[#E5DEC9]'
            }`}
          >
            <Shirt className="w-4 h-4 shrink-0" />
            <span className="truncate">2. Traditional Clothing</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveTab('map');
            }}
            className={`py-2.5 px-3 rounded-xl font-display text-xs sm:text-sm font-bold border-2 flex items-center justify-center gap-2 ${
              activeTab === 'map'
                ? 'bg-[#34D399] text-[#2D2520] border-[#2D2520] shadow-[0_3px_0_#2D2520]'
                : 'bg-white text-[#6E6259] border-[#E5DEC9]'
            }`}
          >
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="truncate">3. Indonesian Culture Map</span>
          </button>
        </div>

        {/* Dynamic Notice / Lock Banner */}
        {noticeBanner && (
          <div
            className={`mx-5 mt-3 px-4 py-2.5 rounded-2xl border-2 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 ${
              noticeBanner.type === 'lock'
                ? 'bg-amber-100 border-amber-700 text-amber-950'
                : noticeBanner.type === 'success'
                ? 'bg-emerald-100 border-emerald-700 text-emerald-950'
                : 'bg-sky-100 border-sky-700 text-sky-950'
            }`}
          >
            {noticeBanner.type === 'lock' && <Lock className="w-4 h-4 shrink-0 text-amber-800" />}
            <span>{noticeBanner.text}</span>
          </div>
        )}

        {/* ==================== TAB 1: TRADITIONAL FOOD ==================== */}
        {activeTab === 'food' && (
          <div className="flex-1 overflow-y-auto modal-scroll p-4 sm:p-5 space-y-4">
            {/* Sub-filter: Nusantara Snacks vs Regional Meals */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FFFDF5] p-3 rounded-2xl border-2 border-[#E5DEC9]">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    setFoodFilter('snack');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-display text-xs font-bold border-2 flex items-center gap-1.5 ${
                    foodFilter === 'snack'
                      ? 'bg-amber-300 text-[#2D2520] border-[#2D2520]'
                      : 'bg-white text-[#6E6259] border-[#E5DEC9]'
                  }`}
                >
                  {lifePhase === 'BAYI' && <Lock className="w-3.5 h-3.5" />}
                  <span>🥞 NUSANTARA SNACKS (Fase Anak-Anak Lv.4+)</span>
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setFoodFilter('meal');
                  }}
                  className={`px-3.5 py-1.5 rounded-xl font-display text-xs font-bold border-2 flex items-center gap-1.5 ${
                    foodFilter === 'meal'
                      ? 'bg-orange-300 text-[#2D2520] border-[#2D2520]'
                      : 'bg-white text-[#6E6259] border-[#E5DEC9]'
                  }`}
                >
                  {lifePhase !== 'DEWASA' && <Lock className="w-3.5 h-3.5" />}
                  <span>🍛 NUSANTARA REGIONAL MEALS (Fase Dewasa Lv.6)</span>
                </button>
              </div>
              <div className="text-[11px] text-[#6E6259]">
                💡 <strong>Aturan Poin:</strong> Konsumsi makanan menambah <strong>+1 Poin Daerah</strong> (membeli saja tidak menambah poin).
              </div>
            </div>

            {lifePhase === 'BAYI' && (
              <div
                onClick={() =>
                  showNotice(
                    'Menu makanan Nusantara akan terbuka ketika aku tumbuh menjadi anak-anak.',
                    'lock'
                  )
                }
                className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-500 flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-200 border-2 border-[#2D2520] flex items-center justify-center">
                    <Lock className="w-5 h-5 text-[#2D2520]" />
                  </div>
                  <div>
                    <div className="font-display text-sm font-bold text-[#2D2520]">
                      🔒 Fase Bayi (Level {level}): Makanan Khas Daerah Masih Terkunci
                    </div>
                    <div className="text-xs text-[#6E6259]">
                      &ldquo;Menu makanan Nusantara akan terbuka ketika aku tumbuh menjadi anak-anak.&rdquo; Saat ini {babyName} hanya mengonsumsi Susu dan Bubur Polos Khusus Bayi.
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-900 whitespace-nowrap">
                  Buka di Lv.4 →
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(foodFilter === 'snack' ? NUSANTARA_SNACKS : NUSANTARA_MEALS).map((food) => {
                const access = validateFoodPhaseAccess(food.id, level);
                const isLocked = !access.allowed;
                const stock = foodInventory[food.id] || 0;
                const currentRegScore = regionScores[food.regionId] || 0;

                return (
                  <div
                    key={food.id}
                    onClick={() => {
                      if (isLocked) handleLockedFoodClick(food);
                    }}
                    className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between gap-2.5 transition-all ${
                      isLocked
                        ? 'bg-stone-100/90 border-stone-300 cursor-pointer hover:bg-amber-50/60'
                        : 'bg-white border-[#2D2520] shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        style={{ backgroundColor: isLocked ? '#E7E5E4' : food.primaryColor }}
                        className="relative w-13 h-13 rounded-2xl border-2 border-[#2D2520] flex items-center justify-center text-2xl shrink-0"
                      >
                        <span>{food.iconEmoji}</span>
                        {isLocked && (
                          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-[#2D2520] flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5 text-[#2D2520]" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-display text-sm font-bold text-[#2D2520] truncate">
                            {food.name}
                          </h4>
                          <span className="text-[11px] font-mono-num font-bold text-emerald-800 shrink-0">
                            {food.regionName}: {currentRegScore} Poin
                          </span>
                        </div>
                        <p className="text-xs text-[#6E6259] mt-0.5">{food.description}</p>
                        <p className="text-[11px] text-amber-900 bg-amber-50/80 px-2 py-1 rounded-lg mt-1.5">
                          🏛️ <strong>Info Budaya:</strong> {food.culturalFact}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-200/70">
                      <div className="text-xs font-mono-num font-bold text-[#B45309]">
                        🪙 Rp {food.price} · +{food.hungerRestore}% Lapar · Stok: {stock}
                      </div>

                      {isLocked ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLockedFoodClick(food);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-stone-200 text-stone-700 text-xs font-bold border border-stone-400 flex items-center gap-1"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>
                            {food.unlockPhase === 'ANAK_ANAK' ? 'Terkunci (Anak-Anak)' : 'Terkunci (Dewasa)'}
                          </span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (coins < food.price) {
                                sound.playWrong();
                                showNotice(
                                  `Koin belum cukup! Butuh Rp ${food.price} (kurang Rp ${food.price - coins}). Jawab soal di Math Challenge!`,
                                  'lock'
                                );
                                return;
                              }
                              sound.playCoin();
                              onBuyFood(food);
                              showNotice(
                                `Membeli 1 ${food.name} seharga Rp ${food.price} ke Inventaris. (Konsumsi untuk +1 Poin ${food.regionName})`,
                                'info'
                              );
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-300 hover:bg-amber-400 text-[#2D2520] text-xs font-bold border-2 border-[#2D2520]"
                          >
                            Beli Rp {food.price}
                          </button>

                          <button
                            disabled={stock <= 0}
                            onClick={() => {
                              onConsumeFood(food);
                              showNotice(
                                `${babyName} lahap memakan ${food.name}! Poin Budaya ${food.regionName} +1!`,
                                'success'
                              );
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${
                              stock > 0
                                ? 'bg-[#34D399] hover:bg-emerald-400 text-[#2D2520] border-[#2D2520]'
                                : 'bg-stone-100 text-stone-400 border-stone-200'
                            }`}
                          >
                            Konsumsi (+1 Poin)
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: TRADITIONAL CLOTHING ==================== */}
        {activeTab === 'clothing' && (
          <div className="flex-1 overflow-y-auto modal-scroll p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Left Character Live Preview */}
            <div className="md:col-span-4 bg-[#FFFDF5] border-2 border-[#2D2520] rounded-2xl p-4 flex flex-col items-center justify-between">
              <div className="text-center">
                <div className="font-display text-sm font-bold text-[#2D2520]">
                  Preview Busana Adat {babyName}
                </div>
                <div className="text-xs text-[#6E6259]">
                  Variasi {gender === 'boy' ? 'Putera (Laki-laki)' : 'Puteri (Perempuan)'}
                </div>
              </div>

              <div className="my-2">
                <BabyCharacterSVG
                  appearance={{ ...appearance, equippedOutfit: previewOutfitId }}
                  gender={gender}
                  level={Math.max(4, level)}
                  actionState="smiling"
                  isSleeping={false}
                  needsSummary={{ isHungry: false, isSleepy: false, isDirty: false, isSad: false }}
                  sizeClass="w-44 h-52"
                />
              </div>

              <div className="text-center text-xs text-[#6E6259] bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                Saat {babyName} tumbuh <strong>DEWASA (Level 6)</strong>, pakaian adat dari daerah dengan poin tertinggi akan otomatis dikenakan!
              </div>
            </div>

            {/* Right Traditional Clothing List */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
              {NUSANTARA_CLOTHING.map((item) => {
                const access = validateClothingPhaseAccess(item.id, level);
                const isLocked = !access.allowed;
                const isOwned = ownedClothes.includes(item.id);
                const isEquipped = appearance.equippedOutfit === item.id;
                const genderedTitle = getClothingTitleForGender(item, gender);

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between gap-2.5 ${
                      isLocked
                        ? 'bg-stone-100 border-stone-300'
                        : 'bg-white border-[#2D2520] shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        style={{ backgroundColor: item.primaryColor }}
                        className="relative w-12 h-12 rounded-2xl border-2 border-[#2D2520] flex items-center justify-center text-2xl shrink-0 text-white"
                      >
                        <span>{item.iconEmoji}</span>
                        {isLocked && (
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border border-[#2D2520] flex items-center justify-center">
                            <Lock className="w-3 h-3 text-[#2D2520]" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold text-amber-800">
                            {item.regionName}
                          </span>
                          {isOwned && (
                            <span className="text-[11px] font-bold text-emerald-700">
                              ✓ Dikoleksi
                            </span>
                          )}
                        </div>
                        <h4 className="font-display text-sm font-bold text-[#2D2520] truncate">
                          {genderedTitle}
                        </h4>
                        <p className="text-xs text-[#6E6259] line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                      <span className="font-mono-num text-xs font-bold text-[#B45309]">
                        🪙 Rp {item.price}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            sound.playClick();
                            setPreviewOutfitId(item.id);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-bold text-[#2D2520] flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Coba</span>
                        </button>

                        {isLocked ? (
                          <button
                            onClick={handleLockedClothingClick}
                            className="px-3 py-1.5 rounded-xl bg-stone-200 text-stone-700 text-xs font-bold border border-stone-400 flex items-center gap-1"
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>Fase Anak-Anak</span>
                          </button>
                        ) : isOwned ? (
                          <button
                            onClick={() => {
                              sound.playClick();
                              onEquipClothing(item);
                              setPreviewOutfitId(item.id);
                              showNotice(`${babyName} mengenakan ${genderedTitle}!`, 'success');
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${
                              isEquipped
                                ? 'bg-emerald-200 text-emerald-950 border-emerald-700'
                                : 'bg-[#A7F3D0] text-[#2D2520] border-[#2D2520]'
                            }`}
                          >
                            {isEquipped ? '✓ Dipakai' : 'Kenakan'}
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (coins < item.price) {
                                sound.playWrong();
                                showNotice(
                                  `Koin belum cukup! Butuh Rp ${item.price} (kurang Rp ${item.price - coins}). Jawab soal di Math Challenge!`,
                                  'lock'
                                );
                                return;
                              }
                              sound.playCoin();
                              onBuyClothing(item);
                              setPreviewOutfitId(item.id);
                              showNotice(`Berhasil mengoleksi pakaian adat ${genderedTitle} seharga Rp ${item.price}!`, 'success');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-300 hover:bg-amber-400 text-[#2D2520] text-xs font-bold border-2 border-[#2D2520]"
                          >
                            Beli Rp {item.price}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== TAB 3: INDONESIAN CULTURE MAP ==================== */}
        {activeTab === 'map' && (
          <div className="flex-1 overflow-y-auto modal-scroll p-4 sm:p-5 space-y-4">
            {/* Interactive SVG Archipelago Map of Indonesia */}
            <div className="relative rounded-2xl bg-gradient-to-b from-sky-100 to-cyan-100 border-2 border-[#2D2520] p-3 overflow-hidden">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="font-display text-xs sm:text-sm font-bold text-[#2D2520]">
                  🗺️ Peta Interaktif Budaya Kepulauan Indonesia (Klik Titik Provinsi!)
                </span>
                {evaluatedAdultRegion && (
                  <span className="text-xs font-bold text-emerald-900 bg-emerald-200 px-2.5 py-0.5 rounded-lg border border-[#2D2520]">
                    🏆 Identitas Dewasa {babyName}: {regionalData[evaluatedAdultRegion]?.name}
                  </span>
                )}
              </div>

              <svg viewBox="0 0 800 320" className="w-full h-48 sm:h-56 select-none">
                {/* Stylized Indonesian Major Islands Shapes */}
                {/* Sumatera */}
                <path
                  d="M 55 68 C 85 55, 165 110, 215 195 C 195 225, 160 220, 120 165 C 85 125, 45 95, 55 68 Z"
                  fill="#86EFAC"
                  stroke="#15803D"
                  strokeWidth="3"
                />
                {/* Jawa */}
                <path
                  d="M 220 250 C 275 245, 340 255, 370 272 C 350 292, 260 290, 220 270 Z"
                  fill="#86EFAC"
                  stroke="#15803D"
                  strokeWidth="3"
                />
                {/* Bali & Nusa Tenggara */}
                <path
                  d="M 380 276 C 415 274, 470 278, 515 286 C 495 298, 410 296, 380 288 Z"
                  fill="#86EFAC"
                  stroke="#15803D"
                  strokeWidth="3"
                />
                {/* Kalimantan */}
                <path
                  d="M 285 115 C 330 85, 405 100, 415 165 C 395 205, 315 210, 285 170 Z"
                  fill="#86EFAC"
                  stroke="#15803D"
                  strokeWidth="3"
                />
                {/* Sulawesi */}
                <path
                  d="M 455 135 C 505 125, 515 165, 485 190 C 510 210, 485 240, 455 228 C 445 195, 445 160, 455 135 Z"
                  fill="#86EFAC"
                  stroke="#15803D"
                  strokeWidth="3"
                />
                {/* Kepulauan Maluku */}
                <path
                  d="M 565 155 C 595 150, 610 185, 595 210 C 570 210, 555 180, 565 155 Z"
                  fill="#86EFAC"
                  stroke="#15803D"
                  strokeWidth="3"
                />
                {/* Papua */}
                <path
                  d="M 635 165 C 685 145, 765 168, 775 235 C 735 255, 675 235, 635 195 Z"
                  fill="#86EFAC"
                  stroke="#15803D"
                  strokeWidth="3"
                />

                {/* Interactive Province Pins */}
                {REGIONAL_LIST.map((reg) => {
                  const isSelected = reg.id === selectedRegionId;
                  const score = regionScores[reg.id] || 0;
                  return (
                    <g
                      key={reg.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedRegionId(reg.id);
                      }}
                      className="cursor-pointer"
                    >
                      {isSelected && (
                        <circle
                          cx={reg.mapCoords.x}
                          cy={reg.mapCoords.y}
                          r="18"
                          fill="rgba(251, 191, 36, 0.45)"
                        />
                      )}
                      <circle
                        cx={reg.mapCoords.x}
                        cy={reg.mapCoords.y}
                        r={isSelected ? '11' : '8'}
                        fill={isSelected ? '#F43F5E' : score > 0 ? '#F59E0B' : '#FFFFFF'}
                        stroke="#2D2520"
                        strokeWidth="2.5"
                      />
                      <text
                        x={reg.mapCoords.x}
                        y={reg.mapCoords.y - 13}
                        textAnchor="middle"
                        className="text-[10px] font-bold fill-[#2D2520]"
                      >
                        {reg.name} {score > 0 ? `(${score})` : ''}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Quick Province Selector Buttons below Map */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {REGIONAL_LIST.map((reg) => {
                  const sc = regionScores[reg.id] || 0;
                  const active = reg.id === selectedRegionId;
                  return (
                    <button
                      key={reg.id}
                      onClick={() => {
                        sound.playClick();
                        setSelectedRegionId(reg.id);
                      }}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold border-2 transition-all ${
                        active
                          ? 'bg-[#FF8FAB] text-[#2D2520] border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                          : 'bg-white/90 text-[#2D2520] border-[#2D2520]/40 hover:border-[#2D2520]'
                      }`}
                    >
                      {reg.landmarkOrIcon} {reg.name}{' '}
                      <span className="font-mono-num text-amber-800">({sc})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Region Mini Museum Showcase Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-7 p-4 rounded-2xl bg-white border-2 border-[#2D2520] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{selectedRegion.landmarkOrIcon}</span>
                    <div>
                      <h3 className="font-display text-lg font-bold text-[#2D2520]">
                        Provinsi {selectedRegion.name}
                      </h3>
                      <div className="text-xs text-[#6E6259]">
                        Pulau {selectedRegion.island}
                      </div>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-amber-100 border-2 border-[#2D2520] font-mono-num text-xs font-bold text-[#2D2520]">
                    Afinitas Daerah: {regionScores[selectedRegion.id] || 0} Poin
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#2D2520] leading-relaxed bg-[#FFFDF5] p-3 rounded-xl border border-[#E5DEC9]">
                  {selectedRegion.cultureDescription}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-[11px] text-[#6E6259]">Makanan Ringan (Anak-Anak)</div>
                    <div className="font-bold text-[#2D2520] mt-0.5">🥞 {selectedRegion.snackName}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200">
                    <div className="text-[11px] text-[#6E6259]">Makanan Berat (Dewasa)</div>
                    <div className="font-bold text-[#2D2520] mt-0.5">🍛 {selectedRegion.mealName}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-pink-50 border border-pink-200">
                    <div className="text-[11px] text-[#6E6259]">Pakaian Adat Daerah</div>
                    <div className="font-bold text-[#2D2520] mt-0.5">
                      👘 {selectedRegion.clothingName}
                    </div>
                    <div className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                      {ownedClothes.includes(selectedRegion.clothingId)
                        ? '✓ Sudah Dikoleksi'
                        : 'Belum Dikoleksi'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Leaderboard of Regional Affinity Points (regionScores) */}
              <div className="md:col-span-5 p-4 rounded-2xl bg-[#FFFDF5] border-2 border-[#2D2520] flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center gap-2 font-display text-sm font-bold text-[#2D2520]">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>Statistik Poin Wilayah (regionScores)</span>
                  </div>
                  <p className="text-[11px] text-[#6E6259] mt-0.5">
                    Daerah dengan poin tertinggi akan menentukan Pakaian Adat otomatis saat {babyName} berevolusi menjadi Dewasa!
                  </p>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto modal-scroll pr-1">
                  {[...REGIONAL_LIST]
                    .sort((a, b) => (regionScores[b.id] || 0) - (regionScores[a.id] || 0))
                    .map((reg) => {
                      const sc = regionScores[reg.id] || 0;
                      return (
                        <div
                          key={reg.id}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-[#E5DEC9] text-xs"
                        >
                          <span className="font-bold text-[#2D2520]">
                            {reg.landmarkOrIcon} {reg.name}{' '}
                            <span className="text-[11px] font-normal text-[#6E6259]">
                              ({reg.clothingName})
                            </span>
                          </span>
                          <span className="font-mono-num font-bold text-amber-800">
                            {sc} Poin
                          </span>
                        </div>
                      );
                    })}
                </div>

                <div className="text-[11px] text-[#6E6259] border-t border-[#E5DEC9] pt-2">
                  Riwayat Konsumsi Kuliner Daerah: <strong>{consumedFoodHistory.length}x</strong>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
