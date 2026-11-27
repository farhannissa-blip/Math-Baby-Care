import React, { useEffect, useState } from 'react';
import {
  GRADE_INFO,
  MathQuestion,
  generateQuestionForGrade,
} from '../data/mathEngine';
import { STORE_ITEMS, StoreItem } from '../data/gameData';
import { sound } from '../utils/sound';
import { X, Sparkles, CheckCircle2, HelpCircle, Trophy, Gift, Clock } from 'lucide-react';

interface MathChallengeModalProps {
  selectedGrade: number;
  coins: number;
  currentStreak: number;
  onSelectGrade: (grade: number) => void;
  onCorrectAnswer: (coinsEarned: number, xpEarned: number, grade: number, bonusLabel?: string) => void;
  onWrongAnswer: () => void;
  onGrantSurpriseItem: (item: StoreItem | null, bonusCoins: number) => void;
  ownedItemIds: string[];
  onClose: () => void;
}

export const MathChallengeModal: React.FC<MathChallengeModalProps> = ({
  selectedGrade,
  coins,
  currentStreak,
  onSelectGrade,
  onCorrectAnswer,
  onWrongAnswer,
  onGrantSurpriseItem,
  ownedItemIds,
  onClose,
}) => {
  const [question, setQuestion] = useState<MathQuestion>(() =>
    generateQuestionForGrade(selectedGrade)
  );
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [sessionCount, setSessionCount] = useState<number>(0);
  const [rewardMessage, setRewardMessage] = useState<string | null>(null);
  const [coinBurst, setCoinBurst] = useState<boolean>(false);

  // Ordering format state
  const [orderedPicked, setOrderedPicked] = useState<number[]>([]);

  // Matching format state
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [shuffledRight, setShuffledRight] = useState<{ id: string; text: string }[]>([]);

  // Gentle timer mode (optional, child-friendly)
  const [timerMode, setTimerMode] = useState<boolean>(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(30);

  // Math Surprise Chest modal state
  const [surpriseChestReady, setSurpriseChestReady] = useState<boolean>(false);
  const [chestOpenedResult, setChestOpenedResult] = useState<{
    item: StoreItem | null;
    coins: number;
  } | null>(null);

  const loadNewQuestion = (gradeToLoad: number) => {
    const q = generateQuestionForGrade(gradeToLoad);
    setQuestion(q);
    setAnswered(false);
    setIsCorrect(null);
    setSelectedOption('');
    setRewardMessage(null);
    setOrderedPicked([]);
    setSelectedLeftId(null);
    setMatchedIds([]);
    setSecondsLeft(30);

    if (q.format === 'matching' && q.matchingPairs) {
      const rights = q.matchingPairs.map((p) => ({ id: p.id, text: p.right }));
      setShuffledRight(rights.sort(() => Math.random() - 0.5));
    }
  };

  useEffect(() => {
    loadNewQuestion(selectedGrade);
  }, [selectedGrade]);

  // Gentle non-stressful timer countdown
  useEffect(() => {
    if (!timerMode || answered) return;
    const t = window.setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [timerMode, answered]);

  const handleGradeChange = (g: number) => {
    sound.playClick();
    onSelectGrade(g);
  };

  const evaluateSubmission = (answerValue: string) => {
    if (answered) return; // Prevent duplicate reward from same question
    setAnswered(true);
    setSelectedOption(answerValue);

    const correct = answerValue.trim() === question.correctAnswer.trim();
    setIsCorrect(correct);

    if (correct) {
      sound.playCorrect();
      sound.playCoin();
      setCoinBurst(true);
      setTimeout(() => setCoinBurst(false), 1300);

      const newSessionCount = sessionCount + 1;
      setSessionCount(newSessionCount);
      const newStreak = currentStreak + 1;

      let totalCoins = 10;
      let totalXp = 20;
      const bonuses: string[] = ['+Rp 10 Koin Jawaban Benar'];

      if (timerMode && secondsLeft > 0) {
        totalCoins += 5;
        bonuses.push('+Rp 5 Koin Cepat Tanggap');
      }

      if (newStreak > 0 && newStreak % 5 === 0) {
        totalCoins += 20;
        totalXp += 15;
        bonuses.push('🔥 Bonus 5 Beruntun (+Rp 20)!');
      }

      if (newSessionCount > 0 && newSessionCount % 10 === 0) {
        totalCoins += 30;
        totalXp += 25;
        bonuses.push('🏆 Selesai 10 Soal (+Rp 30 + Peti Kejutan)!');
        setSurpriseChestReady(true);
      }

      setRewardMessage(bonuses.join(' · '));
      onCorrectAnswer(totalCoins, totalXp, selectedGrade, bonuses.join(' '));
    } else {
      sound.playWrong();
      onWrongAnswer();
    }
  };

  // Ordering handler
  const handlePickOrderNumber = (num: number, idx: number) => {
    if (answered) return;
    sound.playClick();
    const next = [...orderedPicked, num];
    setOrderedPicked(next);
    if (question.orderingNumbers && next.length === question.orderingNumbers.length) {
      evaluateSubmission(next.join(', '));
    }
  };

  // Matching handler
  const handleMatchRightClick = (rightId: string) => {
    if (answered || !selectedLeftId) return;
    if (selectedLeftId === rightId) {
      sound.playCoin();
      const nextMatched = [...matchedIds, rightId];
      setMatchedIds(nextMatched);
      setSelectedLeftId(null);
      if (question.matchingPairs && nextMatched.length === question.matchingPairs.length) {
        evaluateSubmission('Selesai');
      }
    } else {
      sound.playWrong();
      setSelectedLeftId(null);
    }
  };

  const handleOpenSurpriseChest = () => {
    sound.playSurprise();
    const unownedRare = STORE_ITEMS.filter(
      (i) => i.category !== 'food' && !ownedItemIds.includes(i.id)
    );
    if (unownedRare.length > 0 && Math.random() < 0.65) {
      const picked = unownedRare[Math.floor(Math.random() * unownedRare.length)];
      setChestOpenedResult({ item: picked, coins: 25 });
      onGrantSurpriseItem(picked, 25);
    } else {
      setChestOpenedResult({ item: null, coins: 45 });
      onGrantSurpriseItem(null, 45);
    }
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
        className="fixed inset-x-0 bottom-14 z-[110] mx-auto w-full max-w-3xl max-h-[48dvh] bg-[#FFFDF9] border-t-3 border-x-3 border-[#2D2520] rounded-t-3xl shadow-[0_-8px_0_#2D2520] flex flex-col overflow-hidden"
      >
        {/* Coin Rain Celebration Overlay */}
        {coinBurst && (
          <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
            {[12, 26, 40, 55, 70, 84].map((leftPct, i) => (
              <span
                key={i}
                style={{ left: `${leftPct}%`, animationDelay: `${i * 0.08}s` }}
                className="absolute top-0 text-3xl animate-coin-fall"
              >
                🪙
              </span>
            ))}
          </div>
        )}

        {/* Sticky Top Header */}
        <div className="sticky top-0 z-[115] flex items-center justify-between gap-2 px-4 sm:px-5 py-2.5 bg-[#FEF3C7] border-b-2 border-[#2D2520] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">🧮</span>
            <div className="min-w-0">
              <h2 className="font-display text-xs sm:text-base font-bold text-[#2D2520] line-clamp-2 leading-tight">
                MATH CHALLENGE – RUANG BELAJAR CERIA
              </h2>
              <p className="text-[10px] sm:text-xs text-[#6E6259] truncate">
                Jawab soal matematika SD Kelas 1–6 untuk mendapatkan Koin &amp; Hadiah Kejutan!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="px-2.5 py-1 rounded-xl bg-white border-2 border-[#2D2520] font-mono-num text-xs sm:text-sm font-bold text-[#B45309] flex items-center gap-1 whitespace-nowrap">
              <span>🪙</span>
              <span>Rp {coins}</span>
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

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto modal-scroll p-4 sm:p-6 space-y-4">
          {/* Illustrated Study Desk Banner + Stats Strip */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-[#2D2520] h-28 sm:h-32 bg-amber-100">
            <img
              src="/src/assets/images/math_classroom_banner_1795023382414.jpg"
              alt="Meja Belajar Matematika"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#2D2520]/80 via-[#2D2520]/45 to-transparent flex items-center justify-between px-5">
              <div className="text-white space-y-1">
                <div className="text-xs font-semibold text-amber-300">
                  Pilih Kelas Bebas · Tanpa Penguncian Level
                </div>
                <div className="font-display text-lg sm:text-xl font-bold">
                  {GRADE_INFO[selectedGrade - 1]?.title}
                </div>
                <div className="text-xs text-stone-200 max-w-md">
                  {GRADE_INFO[selectedGrade - 1]?.subtitle}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 text-white">
                <div className="text-xs font-mono-num bg-black/40 px-3 py-1 rounded-lg">
                  Beruntun: 🔥 {currentStreak} · Sesi: {sessionCount}/10
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    setTimerMode(!timerMode);
                    setSecondsLeft(30);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                    timerMode
                      ? 'bg-amber-400 text-[#2D2520] border-[#2D2520]'
                      : 'bg-white/20 text-white border-white/40 hover:bg-white/30'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timerMode ? `Mode Cepat: ${secondsLeft}d (+5 Koin)` : 'Mode Waktu Santai'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Grade Selector Tabs (Kelas 1 - Kelas 6 SD) */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {GRADE_INFO.map((g) => {
              const active = selectedGrade === g.grade;
              return (
                <button
                  key={g.grade}
                  onClick={() => handleGradeChange(g.grade)}
                  className={`py-2 px-2.5 rounded-xl font-display text-xs sm:text-sm font-bold border-2 transition-transform whitespace-nowrap ${
                    active
                      ? 'bg-[#FF8FAB] text-[#2D2520] border-[#2D2520] shadow-[0_3px_0_#2D2520] -translate-y-0.5'
                      : 'bg-white text-[#6E6259] border-[#E5DEC9] hover:border-[#2D2520]'
                  }`}
                >
                  Kelas {g.grade} SD
                </button>
              );
            })}
          </div>

          {/* Question Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#2D2520] shadow-sm space-y-4">
            <div className="flex items-center justify-between text-xs text-[#6E6259]">
              <span>
                Materi: <strong className="text-[#2D2520]">{question.topic}</strong> · Tingkat:{' '}
                <strong className="text-[#2D2520]">{question.difficulty}</strong>
              </span>
              <span className="font-mono-num">Hadiah: +10 🪙</span>
            </div>

            <p className="text-base sm:text-lg font-bold text-[#2D2520] leading-relaxed">
              {question.prompt}
            </p>

            {/* Optional Visual Illustration Diagram */}
            {question.visualData && (
              <div className="p-4 rounded-2xl bg-[#FFFDF7] border-2 border-[#E5DEC9] flex flex-col items-center justify-center">
                {question.visualData.type === 'items' && (
                  <div className="flex flex-wrap items-center justify-center gap-3 text-2xl sm:text-3xl">
                    <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                      {Array.from({ length: question.visualData.countA || 0 }).map((_, i) => (
                        <span key={i}>{question.visualData?.emoji}</span>
                      ))}
                    </div>
                    <span className="font-display font-bold text-2xl text-[#2D2520]">
                      {question.visualData.operator}
                    </span>
                    <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-pink-50 border border-pink-200">
                      {Array.from({ length: question.visualData.countB || 0 }).map((_, i) => (
                        <span key={i}>{question.visualData?.emoji}</span>
                      ))}
                    </div>
                  </div>
                )}

                {question.visualData.type === 'clock' && (
                  <svg viewBox="0 0 140 140" className="w-32 h-32">
                    <circle cx="70" cy="70" r="60" fill="#FFFFFF" stroke="#2D2520" strokeWidth="4" />
                    {[12, 3, 6, 9].map((num) => {
                      const angle = ((num * 30 - 90) * Math.PI) / 180;
                      const x = 70 + 46 * Math.cos(angle);
                      const y = 74 + 46 * Math.sin(angle);
                      return (
                        <text
                          key={num}
                          x={x}
                          y={y}
                          textAnchor="middle"
                          className="text-xs font-bold fill-[#2D2520]"
                        >
                          {num}
                        </text>
                      );
                    })}
                    {/* Minute hand pointing to 12 */}
                    <line x1="70" y1="70" x2="70" y2="26" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
                    {/* Hour hand */}
                    {(() => {
                      const h = question.visualData?.hour || 3;
                      const rad = ((h * 30 - 90) * Math.PI) / 180;
                      const hx = 70 + 32 * Math.cos(rad);
                      const hy = 70 + 32 * Math.sin(rad);
                      return (
                        <line
                          x1="70"
                          y1="70"
                          x2={hx}
                          y2={hy}
                          stroke="#EF4444"
                          strokeWidth="5"
                          strokeLinecap="round"
                        />
                      );
                    })()}
                    <circle cx="70" cy="70" r="5" fill="#2D2520" />
                  </svg>
                )}

                {question.visualData.type === 'fraction_bar' && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex border-2 border-[#2D2520] rounded-lg overflow-hidden">
                      {Array.from({ length: question.visualData.denominator || 4 }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-10 h-10 sm:w-12 sm:h-12 border-r last:border-r-0 border-[#2D2520] ${
                            idx < (question.visualData?.numerator || 1)
                              ? 'bg-[#FF8FAB]'
                              : 'bg-white'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-[#6E6259]">
                      {question.visualData.numerator} bagian diwarnai dari {question.visualData.denominator} bagian
                    </span>
                  </div>
                )}

                {question.visualData.type === 'shape' && (
                  <svg viewBox="0 0 220 120" className="w-48 h-28">
                    {question.visualData.shapeName === 'persegi' && (
                      <g>
                        <rect x="65" y="15" width="90" height="90" fill="#A7F3D0" stroke="#2D2520" strokeWidth="3" />
                        {question.visualData.sideA && (
                          <text x="110" y="65" textAnchor="middle" className="text-xs font-bold fill-[#2D2520]">
                            s = {question.visualData.sideA} cm
                          </text>
                        )}
                      </g>
                    )}
                    {question.visualData.shapeName === 'persegi_panjang' && (
                      <g>
                        <rect x="35" y="22" width="150" height="76" fill="#BAE6FD" stroke="#2D2520" strokeWidth="3" />
                        {question.visualData.sideA && (
                          <>
                            <text x="110" y="16" textAnchor="middle" className="text-xs font-bold fill-[#2D2520]">
                              p = {question.visualData.sideA} cm
                            </text>
                            <text x="110" y="65" textAnchor="middle" className="text-xs font-bold fill-[#2D2520]">
                              l = {question.visualData.sideB} cm
                            </text>
                          </>
                        )}
                      </g>
                    )}
                    {question.visualData.shapeName === 'segitiga' && (
                      <g>
                        <polygon points="110,12 45,102 175,102" fill="#FDE68A" stroke="#2D2520" strokeWidth="3" />
                        {question.visualData.sideA && (
                          <text x="110" y="96" textAnchor="middle" className="text-xs font-bold fill-[#2D2520]">
                            a={question.visualData.sideA}cm, t={question.visualData.sideB}cm
                          </text>
                        )}
                      </g>
                    )}
                    {question.visualData.shapeName === 'lingkaran' && (
                      <g>
                        <circle cx="110" cy="60" r="45" fill="#FBCFE8" stroke="#2D2520" strokeWidth="3" />
                        {question.visualData.sideA && (
                          <>
                            <line x1="110" y1="60" x2="155" y2="60" stroke="#2D2520" strokeWidth="2.5" />
                            <text x="132" y="54" textAnchor="middle" className="text-xs font-bold fill-[#2D2520]">
                              r={question.visualData.sideA}
                            </text>
                          </>
                        )}
                      </g>
                    )}
                    {(question.visualData.shapeName === 'kubus' ||
                      question.visualData.shapeName === 'balok') && (
                      <g>
                        <rect x="55" y="34" width="85" height="68" fill="#C4B5FD" stroke="#2D2520" strokeWidth="3" />
                        <polygon points="55,34 80,14 165,14 140,34" fill="#DDD6FE" stroke="#2D2520" strokeWidth="3" />
                        <polygon points="140,34 165,14 165,82 140,102" fill="#A78BFA" stroke="#2D2520" strokeWidth="3" />
                        <text x="98" y="72" textAnchor="middle" className="text-xs font-bold fill-[#2D2520]">
                          {question.visualData.sideB
                            ? `${question.visualData.sideA}×${question.visualData.sideB}×${question.visualData.sideC}`
                            : `r = ${question.visualData.sideA} cm`}
                        </text>
                      </g>
                    )}
                  </svg>
                )}
              </div>
            )}

            {/* FORMAT 1: Ordering Numbers */}
            {question.format === 'ordering' && question.orderingNumbers && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div className="text-sm font-semibold text-[#2D2520]">
                    Urutan pilihanmu:{' '}
                    <span className="font-mono-num font-bold text-pink-600">
                      {orderedPicked.length > 0 ? orderedPicked.join(' → ') : '(Klik angka di bawah secara berurutan)'}
                    </span>
                  </div>
                  {!answered && orderedPicked.length > 0 && (
                    <button
                      onClick={() => setOrderedPicked([])}
                      className="text-xs font-bold text-rose-600 underline"
                    >
                      Ulangi
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {question.orderingNumbers.map((num, idx) => {
                    const alreadyPicked = orderedPicked.includes(num);
                    return (
                      <button
                        key={idx}
                        disabled={alreadyPicked || answered}
                        onClick={() => handlePickOrderNumber(num, idx)}
                        className={`py-3.5 rounded-xl font-mono-num text-lg font-bold border-2 transition-all ${
                          alreadyPicked
                            ? 'bg-stone-100 text-stone-400 border-stone-200'
                            : 'bg-white text-[#2D2520] border-[#2D2520] shadow-[0_3px_0_#2D2520] hover:bg-amber-100'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FORMAT 2: Matching Pairs */}
            {question.format === 'matching' && question.matchingPairs && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#6E6259]">1. Pilih Soal di Kiri:</div>
                  {question.matchingPairs.map((pair) => {
                    const isMatched = matchedIds.includes(pair.id);
                    const isSelected = selectedLeftId === pair.id;
                    return (
                      <button
                        key={pair.id}
                        disabled={isMatched || answered}
                        onClick={() => {
                          sound.playClick();
                          setSelectedLeftId(pair.id);
                        }}
                        className={`w-full py-3 px-3 rounded-xl text-sm font-bold border-2 text-left transition-all ${
                          isMatched
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-500'
                            : isSelected
                            ? 'bg-amber-200 text-[#2D2520] border-[#2D2520] shadow-[0_3px_0_#2D2520]'
                            : 'bg-white text-[#2D2520] border-[#E5DEC9] hover:border-[#2D2520]'
                        }`}
                      >
                        {isMatched ? '✓ ' : ''}
                        {pair.left}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#6E6259]">2. Pasangkan Jawaban di Kanan:</div>
                  {shuffledRight.map((r) => {
                    const isMatched = matchedIds.includes(r.id);
                    return (
                      <button
                        key={r.id}
                        disabled={isMatched || answered}
                        onClick={() => handleMatchRightClick(r.id)}
                        className={`w-full py-3 px-3 rounded-xl font-mono-num text-sm font-bold border-2 text-center transition-all ${
                          isMatched
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-500'
                            : 'bg-white text-[#2D2520] border-[#2D2520] shadow-[0_3px_0_#2D2520] hover:bg-pink-50'
                        }`}
                      >
                        {r.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FORMAT 3: Multiple Choice / Visual / Story / Fill Blank Options */}
            {question.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {question.options.map((opt, idx) => {
                  const isThisSelected = selectedOption === opt;
                  const isThisCorrect = opt === question.correctAnswer;
                  let btnStyle =
                    'bg-white text-[#2D2520] border-[#2D2520] shadow-[0_4px_0_#2D2520] hover:bg-amber-50';
                  if (answered) {
                    if (isThisCorrect) {
                      btnStyle = 'bg-emerald-200 text-emerald-950 border-emerald-700 shadow-none';
                    } else if (isThisSelected) {
                      btnStyle = 'bg-rose-200 text-rose-950 border-rose-700 shadow-none';
                    } else {
                      btnStyle = 'bg-stone-100 text-stone-400 border-stone-200 shadow-none';
                    }
                  }
                  return (
                    <button
                      key={idx}
                      disabled={answered}
                      onClick={() => evaluateSubmission(opt)}
                      className={`py-3.5 px-4 rounded-2xl font-bold text-base border-2 transition-all flex items-center justify-between ${btnStyle}`}
                    >
                      <span>
                        {String.fromCharCode(65 + idx)}. {opt}
                      </span>
                      {answered && isThisCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-700" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Educational Explanation Feedback Box */}
            {answered && (
              <div
                className={`p-4 rounded-2xl border-2 space-y-2 ${
                  isCorrect
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                    : 'bg-amber-50 border-amber-600 text-amber-950'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-display text-base font-bold flex items-center gap-2">
                    {isCorrect ? (
                      <>
                        <span>🌟</span>
                        <span>HEBAT! JAWABANMU BENAR!</span>
                      </>
                    ) : (
                      <>
                        <HelpCircle className="w-5 h-5 text-amber-700" />
                        <span>BELUM TEPAT – AYO KITA PELAJARI BERSAMA!</span>
                      </>
                    )}
                  </div>
                  {rewardMessage && (
                    <span className="text-xs font-bold text-emerald-800">{rewardMessage}</span>
                  )}
                </div>

                {!isCorrect && (
                  <p className="text-sm font-bold">
                    Jawaban yang benar adalah: <span className="underline">{question.correctAnswer}</span>
                  </p>
                )}

                <p className="text-xs sm:text-sm leading-relaxed">
                  <strong>Penjelasan Konsep:</strong> {question.explanation}
                </p>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      sound.playClick();
                      loadNewQuestion(selectedGrade);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-[#FF8FAB] text-[#2D2520] font-display font-bold text-sm border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] hover:brightness-105 active:translate-y-0.5"
                  >
                    Soal Berikutnya →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Surprise Reward Chest Trigger Banner */}
          {surpriseChestReady && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-100 via-pink-100 to-purple-100 border-2 border-[#2D2520] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl animate-bounce">🎁</span>
                <div>
                  <h3 className="font-display text-base font-bold text-[#2D2520]">
                    MATH REWARD SURPRISE TERBUKA!
                  </h3>
                  <p className="text-xs text-[#6E6259]">
                    Kamu sudah menyelesaikan 10 soal! Buka peti kejutan ramah anak sekarang!
                  </p>
                </div>
              </div>

              {!chestOpenedResult ? (
                <button
                  onClick={handleOpenSurpriseChest}
                  className="px-5 py-2.5 rounded-xl bg-amber-400 text-[#2D2520] font-display font-bold text-sm border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] flex items-center gap-2 whitespace-nowrap"
                >
                  <Gift className="w-4 h-4" />
                  <span>Buka Peti Kejutan!</span>
                </button>
              ) : (
                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border-2 border-[#2D2520]">
                  <span className="text-2xl">{chestOpenedResult.item ? chestOpenedResult.item.iconEmoji : '🪙'}</span>
                  <div className="text-xs font-bold text-[#2D2520]">
                    {chestOpenedResult.item
                      ? `Dapat ${chestOpenedResult.item.name} + ${chestOpenedResult.coins} Koin!`
                      : `Dapat Bonus Kejutan +${chestOpenedResult.coins} Koin!`}
                  </div>
                  <button
                    onClick={() => {
                      setSurpriseChestReady(false);
                      setChestOpenedResult(null);
                    }}
                    className="text-xs text-pink-600 font-bold underline ml-2"
                  >
                    Simpan
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
