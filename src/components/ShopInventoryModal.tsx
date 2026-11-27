import React, { useState } from 'react';
import {
  BabyAppearance,
  BabyGender,
  RoomDecorState,
  STORE_ITEMS,
  StoreCategory,
  StoreItem,
} from '../data/gameData';
import { BabyCharacterSVG } from './BabyCharacterSVG';
import {
  validateClothingPhaseAccess,
  validateFoodPhaseAccess,
} from '../data/nusantaraData';
import { sound } from '../utils/sound';
import { X, ShoppingBag, Package, Shirt, Eye, Lock } from 'lucide-react';

interface ShopInventoryModalProps {
  initialMode: 'shop' | 'inventory' | 'wardrobe';
  coins: number;
  level: number;
  gender: BabyGender;
  appearance: BabyAppearance;
  roomDecor: RoomDecorState;
  ownedClothes: string[];
  ownedToys: string[];
  ownedFurniture: string[];
  foodInventory: Record<string, number>;
  onBuyItem: (item: StoreItem) => void;
  onEquipClothing: (item: StoreItem) => void;
  onUnequipAccessory: (slot: 'hat' | 'glasses' | 'shoes') => void;
  onEquipFurniture: (item: StoreItem) => void;
  onUseFood: (item: StoreItem) => void;
  onUseToy: (item: StoreItem) => void;
  onUpdateAppearanceBasic: (partial: Partial<BabyAppearance>) => void;
  onClose: () => void;
}

export const ShopInventoryModal: React.FC<ShopInventoryModalProps> = ({
  initialMode,
  coins,
  level,
  gender,
  appearance,
  roomDecor,
  ownedClothes,
  ownedToys,
  ownedFurniture,
  foodInventory,
  onBuyItem,
  onEquipClothing,
  onUnequipAccessory,
  onEquipFurniture,
  onUseFood,
  onUseToy,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'shop' | 'inventory' | 'wardrobe'>(initialMode);
  const [category, setCategory] = useState<StoreCategory>('clothes');
  const [previewAppearance, setPreviewAppearance] = useState<BabyAppearance>(appearance);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const showTempBanner = (msg: string) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(null), 2400);
  };

  const isOwned = (item: StoreItem): boolean => {
    if (item.category === 'clothes') return ownedClothes.includes(item.id);
    if (item.category === 'toys') return ownedToys.includes(item.id);
    if (item.category === 'furniture') return ownedFurniture.includes(item.id);
    return (foodInventory[item.id] || 0) > 0;
  };

  const isEquipped = (item: StoreItem): boolean => {
    if (item.category === 'clothes') {
      return (
        appearance.equippedOutfit === item.id ||
        appearance.equippedHat === item.id ||
        appearance.equippedGlasses === item.id ||
        appearance.equippedShoes === item.id
      );
    }
    if (item.category === 'furniture') {
      return (
        roomDecor.crib === item.id ||
        roomDecor.rug === item.id ||
        roomDecor.lamp === item.id ||
        roomDecor.wallpaper === item.id ||
        roomDecor.wallDecor === item.id ||
        roomDecor.plushDecor === item.id
      );
    }
    return false;
  };

  const handlePreviewItem = (item: StoreItem) => {
    sound.playClick();
    if (item.category !== 'clothes') return;
    if (item.subCategory === 'outfit') {
      setPreviewAppearance((prev) => ({ ...prev, equippedOutfit: item.id }));
    } else if (item.subCategory === 'hat') {
      setPreviewAppearance((prev) => ({ ...prev, equippedHat: item.id }));
    } else if (item.subCategory === 'glasses') {
      setPreviewAppearance((prev) => ({ ...prev, equippedGlasses: item.id }));
    } else if (item.subCategory === 'shoes') {
      setPreviewAppearance((prev) => ({ ...prev, equippedShoes: item.id }));
    }
  };

  const filteredItems = STORE_ITEMS.filter((item) => {
    if (activeTab === 'wardrobe') {
      return item.category === 'clothes';
    }
    if (activeTab === 'inventory') {
      if (item.category !== category) return false;
      return isOwned(item);
    }
    return item.category === category;
  });

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
        className="fixed inset-x-0 bottom-14 z-[110] mx-auto w-full max-w-4xl max-h-[48dvh] bg-[#FFFDF9] border-t-3 border-x-3 border-[#2D2520] rounded-t-3xl shadow-[0_-8px_0_#2D2520] flex flex-col overflow-hidden"
      >
        {/* Sticky Top Bar with Mode Tabs, Coin Wallet & 44x44px Close (X) Button */}
        <div className="sticky top-0 z-[115] flex items-center justify-between gap-2 px-3 sm:px-5 py-2.5 bg-[#FCE7F3] border-b-2 border-[#2D2520] shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('shop');
              }}
              className={`px-3 py-1.5 rounded-xl font-display text-xs sm:text-sm font-bold border-2 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'shop'
                  ? 'bg-[#FF8FAB] text-[#2D2520] border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                  : 'bg-white text-[#6E6259] border-[#E5DEC9]'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Toko</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('inventory');
              }}
              className={`px-3 py-1.5 rounded-xl font-display text-xs sm:text-sm font-bold border-2 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'inventory'
                  ? 'bg-[#A7F3D0] text-[#2D2520] border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                  : 'bg-white text-[#6E6259] border-[#E5DEC9]'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Inventaris</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('wardrobe');
                setCategory('clothes');
              }}
              className={`px-3 py-1.5 rounded-xl font-display text-xs sm:text-sm font-bold border-2 flex items-center gap-1.5 shrink-0 ${
                activeTab === 'wardrobe'
                  ? 'bg-[#DDD6FE] text-[#2D2520] border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                  : 'bg-white text-[#6E6259] border-[#E5DEC9]'
              }`}
            >
              <Shirt className="w-4 h-4" />
              <span>Pakaian</span>
            </button>
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
              aria-label="Tutup Panel"
              title="Tutup (X)"
            >
              <X className="w-5 h-5 text-white stroke-[3]" />
            </button>
          </div>
        </div>

        {/* 4 Category Filter Tabs: Makanan, Pakaian, Mainan, Dekorasi */}
        {activeTab !== 'wardrobe' && (
          <div className="grid grid-cols-4 gap-1.5 px-3 sm:px-5 pt-2.5 shrink-0">
            {[
              { id: 'food', label: '🍼 Makanan' },
              { id: 'clothes', label: '👚 Pakaian' },
              { id: 'toys', label: '🧸 Mainan' },
              { id: 'furniture', label: '🛏️ Dekorasi' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  sound.playClick();
                  setCategory(cat.id as StoreCategory);
                }}
                className={`py-1.5 px-2 rounded-xl font-display text-xs sm:text-sm font-bold border-2 truncate ${
                  category === cat.id
                    ? 'bg-amber-300 text-[#2D2520] border-[#2D2520] shadow-[0_2px_0_#2D2520]'
                    : 'bg-white text-[#6E6259] border-[#E5DEC9]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {feedbackBanner && (
          <div className="mx-4 mt-2 px-3 py-1.5 rounded-xl bg-emerald-100 border-2 border-emerald-600 text-emerald-950 text-xs font-bold text-center shrink-0">
            {feedbackBanner}
          </div>
        )}

        {/* Main Content Split: Live Character Preview (Left) + Scrollable Item Grid (Right) */}
        <div className="flex-1 min-h-0 overflow-y-auto modal-scroll p-3 sm:p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Left Preview Card */}
          <div className="md:col-span-4 bg-[#FFFDF5] border-2 border-[#2D2520] rounded-2xl p-4 flex flex-col items-center justify-between">
            <div className="text-center">
              <div className="font-display text-sm font-bold text-[#2D2520]">
                Preview Karakter Bayi
              </div>
              <div className="text-xs text-[#6E6259]">
                Pakaian &amp; aksesori langsung terlihat pada tubuh bayi
              </div>
            </div>

            <div className="my-2">
              <BabyCharacterSVG
                appearance={previewAppearance}
                gender={gender}
                level={level}
                actionState="smiling"
                isSleeping={false}
                needsSummary={{ isHungry: false, isSleepy: false, isDirty: false, isSad: false }}
                sizeClass="w-40 h-48"
              />
            </div>

            {/* Quick Unequip Accessory Buttons */}
            <div className="w-full space-y-1.5">
              <div className="text-[11px] font-bold text-[#6E6259] text-center">
                Aksesori Terpasang:
              </div>
              <div className="flex flex-wrap justify-center gap-1.5">
                {appearance.equippedHat && (
                  <button
                    onClick={() => {
                      onUnequipAccessory('hat');
                      setPreviewAppearance((p) => ({ ...p, equippedHat: null }));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-100 border border-rose-400 text-xs font-bold text-rose-900"
                  >
                    Lepas Topi ✕
                  </button>
                )}
                {appearance.equippedGlasses && (
                  <button
                    onClick={() => {
                      onUnequipAccessory('glasses');
                      setPreviewAppearance((p) => ({ ...p, equippedGlasses: null }));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-100 border border-rose-400 text-xs font-bold text-rose-900"
                  >
                    Lepas Kacamata ✕
                  </button>
                )}
                {appearance.equippedShoes && (
                  <button
                    onClick={() => {
                      onUnequipAccessory('shoes');
                      setPreviewAppearance((p) => ({ ...p, equippedShoes: null }));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-100 border border-rose-400 text-xs font-bold text-rose-900"
                  >
                    Lepas Sepatu ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Items Grid */}
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
            {filteredItems.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-sm text-[#6E6259] bg-white rounded-2xl border-2 border-dashed border-[#E5DEC9]">
                Belum ada barang di kategori ini. Yuk beli di Toko dengan koin hasil belajar matematika!
              </div>
            ) : (
              filteredItems.map((item) => {
                const owned = isOwned(item);
                const equipped = isEquipped(item);
                const foodQty = item.category === 'food' ? foodInventory[item.id] || 0 : 0;
                const phaseValidation =
                  item.category === 'food'
                    ? validateFoodPhaseAccess(item.id, level)
                    : item.category === 'clothes'
                    ? validateClothingPhaseAccess(item.id, level)
                    : { allowed: true };
                const lockedByAge =
                  !phaseValidation.allowed || Boolean(item.minLevel && level < item.minLevel);

                const handleLockedItemMessage = () => {
                  sound.playWrong();
                  showTempBanner(
                    phaseValidation.reason ||
                      'Menu makanan Nusantara akan terbuka ketika aku tumbuh menjadi anak-anak.'
                  );
                };

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (lockedByAge) handleLockedItemMessage();
                    }}
                    className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between gap-2.5 shadow-sm ${
                      lockedByAge
                        ? 'bg-stone-100 border-stone-300 cursor-pointer'
                        : 'bg-white border-[#2D2520]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        style={{ backgroundColor: lockedByAge ? '#E7E5E4' : item.primaryColor }}
                        className="relative w-12 h-12 rounded-2xl border-2 border-[#2D2520] flex items-center justify-center text-2xl shrink-0"
                      >
                        {item.iconEmoji}
                        {lockedByAge && (
                          <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border border-[#2D2520] flex items-center justify-center">
                            <Lock className="w-3 h-3 text-[#2D2520]" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-display text-sm font-bold text-[#2D2520] truncate">
                            {item.name}
                          </h4>
                          {item.category === 'food' ? (
                            <span className="text-xs font-mono-num font-bold text-emerald-700 shrink-0">
                              Stok: {foodQty}
                            </span>
                          ) : owned ? (
                            <span className="text-[11px] font-bold text-emerald-700 shrink-0">
                              ✓ Dimiliki
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-[#6E6259] line-clamp-2 mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-stone-100">
                      <div className="text-xs font-mono-num font-bold text-[#B45309]">
                        {item.price === 0 ? 'Gratis' : `🪙 Rp ${item.price}`}
                        {item.minLevel ? ` · Lv.${item.minLevel}+` : ''}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {item.category === 'clothes' && (
                          <button
                            onClick={() => handlePreviewItem(item)}
                            className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-bold text-[#2D2520] flex items-center gap-1"
                            title="Coba Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>
                        )}

                        {/* Clothing & Furniture Equip or Buy */}
                        {(item.category === 'clothes' || item.category === 'furniture') && (
                          <>
                            {lockedByAge ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLockedItemMessage();
                                }}
                                className="px-3 py-1.5 rounded-xl bg-stone-200 text-stone-700 text-xs font-bold border border-stone-400 flex items-center gap-1"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Terkunci (Lv.{item.minLevel})</span>
                              </button>
                            ) : owned ? (
                              <button
                                onClick={() => {
                                  sound.playClick();
                                  if (item.category === 'clothes') {
                                    onEquipClothing(item);
                                    handlePreviewItem(item);
                                    showTempBanner(`${item.name} dikenakan pada karakter!`);
                                  } else {
                                    onEquipFurniture(item);
                                    showTempBanner(`${item.name} dipasang di kamar!`);
                                  }
                                }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${
                                  equipped
                                    ? 'bg-emerald-200 text-emerald-950 border-emerald-700'
                                    : 'bg-[#A7F3D0] text-[#2D2520] border-[#2D2520]'
                                }`}
                              >
                                {equipped ? '✓ Terpasang' : 'Pasang'}
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (coins < item.price) {
                                    sound.playWrong();
                                    showTempBanner(
                                      `Koin belum cukup! Butuh Rp ${item.price} (kurang Rp ${item.price - coins}). Jawab soal di Math Challenge!`
                                    );
                                    return;
                                  }
                                  sound.playCoin();
                                  onBuyItem(item);
                                  if (item.category === 'clothes') handlePreviewItem(item);
                                  showTempBanner(`Berhasil membeli ${item.name} seharga Rp ${item.price}!`);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-300 hover:bg-amber-400 text-[#2D2520] text-xs font-bold border-2 border-[#2D2520]"
                              >
                                Beli Rp {item.price}
                              </button>
                            )}
                          </>
                        )}

                        {/* Food Buy or Feed */}
                        {item.category === 'food' && (
                          <>
                            {lockedByAge ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLockedItemMessage();
                                }}
                                className="px-3 py-1.5 rounded-xl bg-stone-200 text-stone-700 text-xs font-bold border border-stone-400 flex items-center gap-1"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                <span>Terkunci (Lv.{item.minLevel})</span>
                              </button>
                            ) : (
                              <>
                                {activeTab === 'shop' ? (
                                  <button
                                    onClick={() => {
                                      if (coins < item.price) {
                                        sound.playWrong();
                                        showTempBanner(
                                          `Koin belum cukup! Butuh Rp ${item.price} (kurang Rp ${item.price - coins}). Jawab soal di Math Challenge!`
                                        );
                                        return;
                                      }
                                      sound.playCoin();
                                      onBuyItem(item);
                                      showTempBanner(`Membeli 1 ${item.name} seharga Rp ${item.price}!`);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-amber-300 hover:bg-amber-400 text-[#2D2520] text-xs font-bold border-2 border-[#2D2520]"
                                  >
                                    Beli Rp {item.price}
                                  </button>
                                ) : null}

                                {foodQty > 0 && (
                                  <button
                                    onClick={() => {
                                      onUseFood(item);
                                      showTempBanner(`Memberikan ${item.name}!`);
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold border-2 bg-[#FF8FAB] text-[#2D2520] border-[#2D2520]"
                                  >
                                    Berikan Makan
                                  </button>
                                )}
                              </>
                            )}
                          </>
                        )}

                        {/* Toys Buy or Play */}
                        {item.category === 'toys' && (
                          <>
                            {owned ? (
                              <button
                                onClick={() => {
                                  onUseToy(item);
                                  showTempBanner(`Bayi bermain gembira dengan ${item.name}!`);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-[#A7F3D0] text-[#2D2520] text-xs font-bold border-2 border-[#2D2520]"
                              >
                                Mainkan
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (coins < item.price) {
                                    sound.playWrong();
                                    showTempBanner(
                                      `Koin belum cukup! Butuh Rp ${item.price} (kurang Rp ${item.price - coins}). Jawab soal di Math Challenge!`
                                    );
                                    return;
                                  }
                                  sound.playCoin();
                                  onBuyItem(item);
                                  showTempBanner(`Berhasil membeli ${item.name} seharga Rp ${item.price}!`);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-amber-300 hover:bg-amber-400 text-[#2D2520] text-xs font-bold border-2 border-[#2D2520]"
                              >
                                Beli Rp {item.price}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
