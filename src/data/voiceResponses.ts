// Indonesian Voice Interaction, Emotional Response Engine & Child-Friendly TTS System
// NOTE: Strictly privacy-preserving — never records audio, never stores transcripts to LocalStorage,
// never sends conversation to external APIs, and only listens after explicit player action.

import { BabyActionState, CharacterEmotion } from '../data/gameData';
import { sound } from '../utils/sound';

export type VoiceAnimationType =
  | 'make_heart'
  | 'big_smile'
  | 'comfort_player'
  | 'happy_jump'
  | 'yawn'
  | 'clap_hands'
  | 'curious_head_tilt'
  | 'wave_hand'
  | 'screen_touch'
  | 'blow_kiss';

export type VoiceEmotionCategory =
  | 'love'
  | 'happy'
  | 'comforting'
  | 'excited'
  | 'sleepy'
  | 'proud'
  | 'curious'
  | 'greeting';

export interface VoiceResponseRule {
  id: string;
  label: string;
  quickButtonText?: string;
  keywords: string[];
  emotion: VoiceEmotionCategory;
  characterEmotionTarget: CharacterEmotion;
  animation: VoiceAnimationType;
  secondaryAnimation?: VoiceAnimationType;
  actionState: BabyActionState;
  response: string;
  responsesByStage: {
    bayi: string[];      // Stage 1 - 3 (Newborn, Crawling Baby, Toddler)
    anak: string[];      // Stage 4 - 5 (Young Child, Older Child)
    remajaDewasa: string[]; // Stage 6 - 7 (Teenager, Adult)
  };
  particleEmoji: string;
  needsDelta: {
    love?: number;
    happiness?: number;
    energy?: number;
  };
  xpGain: number;
}

// Required & Extensible Voice Trigger Configuration
export const voiceResponses: VoiceResponseRule[] = [
  {
    id: 'love_affection',
    label: 'Kasih Sayang ("Sayang")',
    quickButtonText: '💖 "Sayang"',
    keywords: [
      'sayang',
      'aku sayang kamu',
      'sayang kamu',
      'kamu lucu',
      'anak pintar',
      'gemas sekali',
      'gemas',
      'i love you',
      'love you',
      'cinta',
      'anak manis',
    ],
    emotion: 'love',
    characterEmotionTarget: 'happy',
    animation: 'make_heart',
    secondaryAnimation: 'screen_touch',
    actionState: 'make_heart',
    response: 'Sayang juga! Aku senang sekali!',
    responsesByStage: {
      bayi: [
        'Hehe... sayang juga! Aku senang sekali!',
        'Baa~ Sayang Kakak juga! Peluk hangat!',
      ],
      anak: [
        'Sayang juga! Aku senang sekali mendengarnya!',
        'Terima kasih Kak! Aku juga sayang sekali sama kamu!',
      ],
      remajaDewasa: [
        'Sayang juga! Terima kasih sudah selalu merawat dan menyayangiku!',
        'Aku senang sekali! Kasih sayangmu membuat hariku cerah!',
      ],
    },
    particleEmoji: '💖',
    needsDelta: { love: 18, happiness: 14 },
    xpGain: 15,
  },
  {
    id: 'cheer_up_character',
    label: 'Penyemangat ("Jangan Sedih")',
    quickButtonText: '😊 "Jangan sedih"',
    keywords: [
      'jangan sedih',
      'jangan menangis',
      'ayo tersenyum',
      'tersenyum',
      'semangat',
      'jangan murung',
      'senyum dong',
      'ceria',
    ],
    emotion: 'happy',
    characterEmotionTarget: 'happy',
    animation: 'big_smile',
    actionState: 'big_smile',
    response: 'Hehe! Aku sudah tersenyum!',
    responsesByStage: {
      bayi: [
        'Hehe! Aku sudah tersenyum lebar!',
        'Hihihi! Aku tidak sedih lagi, sudah tersenyum!',
      ],
      anak: [
        'Hehe! Aku sudah tersenyum! Terima kasih sudah menyemangatiku!',
        'Yeay! Sekarang aku sudah ceria dan tersenyum lagi!',
      ],
      remajaDewasa: [
        'Hehe! Aku sudah tersenyum! Kata-katamu membuatku kembali bersemangat!',
        'Terima kasih ya! Sekarang hatiku terasa hangat dan ceria kembali!',
      ],
    },
    particleEmoji: '🌟',
    needsDelta: { happiness: 20, love: 12 },
    xpGain: 15,
  },
  {
    id: 'player_feels_sad',
    label: 'Menghibur Pemain ("Saya Bersedih")',
    quickButtonText: '🤗 "Saya bersedih"',
    keywords: [
      'saya bersedih',
      'aku bersedih',
      'aku sedang sedih',
      'aku sedih',
      'saya sedih',
      'aku sedang tidak bersemangat',
      'tidak bersemangat',
      'aku ingin ditemani',
      'ingin ditemani',
      'aku sedang kecewa',
      'kecewa',
      'lelah',
      'capek',
    ],
    emotion: 'comforting',
    characterEmotionTarget: 'happy',
    animation: 'comfort_player',
    secondaryAnimation: 'screen_touch',
    actionState: 'comfort_player',
    response: 'Jangan merasa sendirian, ya. Semoga harimu menjadi lebih baik!',
    responsesByStage: {
      bayi: [
        'Jangan merasa sendirian, ya. Aku di sini menemanimu! Semoga harimu menjadi lebih baik!',
        'Peluk hangat untukmu! Aku ingin menghiburmu, semangat ya!',
      ],
      anak: [
        'Jangan merasa sendirian, ya. Semoga harimu menjadi lebih baik! Ayo kita bermain bersama!',
        'Kamu boleh beristirahat sebentar. Aku senang menemanimu, semangat ya!',
      ],
      remajaDewasa: [
        'Jangan merasa sendirian, ya. Kamu sudah berusaha dengan baik, semoga harimu menjadi lebih baik!',
        'Kamu boleh beristirahat sebentar dan menarik napas tenang. Aku selalu di sini menyemangatimu!',
      ],
    },
    particleEmoji: '💝',
    needsDelta: { love: 16, happiness: 10 },
    xpGain: 16,
  },
  {
    id: 'lets_play',
    label: 'Ajak Bermain ("Ayo Bermain")',
    quickButtonText: '🎈 "Ayo bermain"',
    keywords: [
      'ayo bermain',
      'mari bermain',
      'main yuk',
      'ayo main',
      'bermain bersama',
      'lompat',
      'menari',
    ],
    emotion: 'excited',
    characterEmotionTarget: 'happy',
    animation: 'happy_jump',
    actionState: 'happy_jump',
    response: 'Ayo! Kita bermain bersama!',
    responsesByStage: {
      bayi: [
        'Yeay! Ayo kita bermain bersama!',
        'Hore! Aku senang sekali diajak bermain!',
      ],
      anak: [
        'Ayo! Kita bermain dan bersenang-senang bersama!',
        'Asyik! Aku sudah siap bermain denganmu!',
      ],
      remajaDewasa: [
        'Ayo! Menyenangkan sekali bisa meluangkan waktu bermain bersama!',
        'Siap! Ayo kita bermain dan beraktivitas seru!',
      ],
    },
    particleEmoji: '🎈',
    needsDelta: { happiness: 22, love: 10 },
    xpGain: 15,
  },
  {
    id: 'praise_smart',
    label: 'Pujian ("Kamu Pintar")',
    quickButtonText: '👏 "Kamu pintar"',
    keywords: [
      'kamu pintar',
      'hebat',
      'kamu hebat',
      'pintar sekali',
      'anak hebat',
      'bagus sekali',
      'keren',
      'rajin',
    ],
    emotion: 'proud',
    characterEmotionTarget: 'happy',
    animation: 'clap_hands',
    actionState: 'clap_hands',
    response: 'Terima kasih! Aku akan terus rajin belajar!',
    responsesByStage: {
      bayi: [
        'Hehe, terima kasih! Tepuk tangan gembira!',
        'Yeay! Terima kasih pujiannya!',
      ],
      anak: [
        'Terima kasih! Aku senang belajar matematika dan budaya bersamamu!',
        'Wah, terima kasih! Aku jadi makin semangat belajar!',
      ],
      remajaDewasa: [
        'Terima kasih banyak! Dukunganmu membuatku terus semangat belajar hal baru!',
        'Terima kasih! Senang sekali bisa tumbuh pintar bersamamu!',
      ],
    },
    particleEmoji: '⭐',
    needsDelta: { happiness: 18, love: 14 },
    xpGain: 16,
  },
  {
    id: 'time_to_sleep',
    label: 'Waktu Tidur ("Ayo Tidur")',
    quickButtonText: '🌙 "Ayo tidur"',
    keywords: [
      'tidur',
      'ayo tidur',
      'waktunya tidur',
      'selamat malam',
      'mengantuk',
      'bobok',
      'istirahat',
    ],
    emotion: 'sleepy',
    characterEmotionTarget: 'sleepy',
    animation: 'yawn',
    actionState: 'yawning',
    response: 'Hoaam... Aku mulai mengantuk!',
    responsesByStage: {
      bayi: [
        'Hoaam... Aku mulai mengantuk! Peluk sebelum tidur ya...',
        'Hoaam... Mataku mulai berat, ayo istirahat!',
      ],
      anak: [
        'Hoaam... Aku mulai mengantuk! Jangan lupa bacakan cerita sebelum tidur ya!',
        'Selamat istirahat! Aku sudah mulai mengantuk...',
      ],
      remajaDewasa: [
        'Hoaam... Hari yang menyenangkan! Sekarang waktunya beristirahat dengan tenang.',
        'Aku mulai mengantuk. Terima kasih untuk hari yang indah ini!',
      ],
    },
    particleEmoji: '💤',
    needsDelta: { energy: 14, love: 8 },
    xpGain: 12,
  },
  {
    id: 'greeting_wave',
    label: 'Sapaan ("Halo")',
    quickButtonText: '👋 "Halo!"',
    keywords: [
      'halo',
      'hai',
      'selamat pagi',
      'selamat siang',
      'selamat sore',
      'apa kabar',
      'dadah',
    ],
    emotion: 'greeting',
    characterEmotionTarget: 'happy',
    animation: 'wave_hand',
    actionState: 'waving',
    response: 'Halo juga! Senang sekali mendengar suaramu!',
    responsesByStage: {
      bayi: ['Baa~ Halo juga! Senang melihatmu!'],
      anak: ['Halo juga! Senang sekali mendengar suaramu hari ini!'],
      remajaDewasa: ['Halo! Apa kabar? Senang sekali bisa mengobrol denganmu!'],
    },
    particleEmoji: '👋',
    needsDelta: { love: 10, happiness: 10 },
    xpGain: 10,
  },
  {
    id: 'blow_kiss_affection',
    label: 'Cium Jauh ("Muah / Peluk")',
    keywords: ['cium', 'muah', 'peluk', 'peluk hangat', 'kiss'],
    emotion: 'love',
    characterEmotionTarget: 'happy',
    animation: 'blow_kiss',
    actionState: 'blow_kiss',
    response: 'Muah! Peluk hangat untukmu!',
    responsesByStage: {
      bayi: ['Muah! Hehe, peluk hangat untuk Kakak!'],
      anak: ['Muah! Peluk hangat penuh sayang untukmu!'],
      remajaDewasa: ['Terima kasih! Peluk hangat dan doa terbaik untukmu!'],
    },
    particleEmoji: '💋',
    needsDelta: { love: 16, happiness: 12 },
    xpGain: 14,
  },
];

// Normalize Indonesian speech transcript for tolerant matching
function normalizeTranscript(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[.,!?'"\-:;()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface MatchedVoiceReaction {
  matchedRule: VoiceResponseRule | null;
  emotion: VoiceEmotionCategory;
  characterEmotionTarget: CharacterEmotion;
  animation: VoiceAnimationType;
  secondaryAnimation?: VoiceAnimationType;
  actionState: BabyActionState;
  responseText: string;
  particleEmoji: string;
  needsDelta: {
    love?: number;
    happiness?: number;
    energy?: number;
  };
  xpGain: number;
}

/**
 * Analyzes recognized Indonesian speech transcript and chooses the most appropriate
 * emotional reaction, animation, and age-adapted voice response.
 */
export function analyzeVoiceTranscript(
  transcript: string,
  characterLevel: number,
  babyName: string
): MatchedVoiceReaction {
  const cleaned = normalizeTranscript(transcript);
  const stageKey: 'bayi' | 'anak' | 'remajaDewasa' =
    characterLevel <= 3 ? 'bayi' : characterLevel <= 5 ? 'anak' : 'remajaDewasa';

  // Priority check: Specific multi-word phrases first, then single keywords
  let bestRule: VoiceResponseRule | null = null;
  let longestKeywordLength = 0;

  for (const rule of voiceResponses) {
    for (const kw of rule.keywords) {
      const normKw = normalizeTranscript(kw);
      // Match whole word or phrase boundaries or substring for compound Indonesian phrases
      const isMatch =
        cleaned === normKw ||
        cleaned.includes(normKw) ||
        cleaned.split(' ').includes(normKw);

      if (isMatch && normKw.length > longestKeywordLength) {
        bestRule = rule;
        longestKeywordLength = normKw.length;
      }
    }
  }

  if (bestRule) {
    const candidates = bestRule.responsesByStage[stageKey] || [bestRule.response];
    const chosenText = candidates[Math.floor(Math.random() * candidates.length)];
    return {
      matchedRule: bestRule,
      emotion: bestRule.emotion,
      characterEmotionTarget: bestRule.characterEmotionTarget,
      animation: bestRule.animation,
      secondaryAnimation: bestRule.secondaryAnimation,
      actionState: bestRule.actionState,
      responseText: chosenText,
      particleEmoji: bestRule.particleEmoji,
      needsDelta: bestRule.needsDelta,
      xpGain: bestRule.xpGain,
    };
  }

  // Fallback for unrecognized speech: Curious head tilt + gentle smile
  const fallbackTexts =
    stageKey === 'bayi'
      ? `Hmm? ${babyName} mendengarkan suaramu dengan penasaran sambil tersenyum!`
      : stageKey === 'anak'
      ? `Wah, suara kamu terdengar ramah! Aku senang mendengarkanmu berbicara!`
      : `Hmm, menarik sekali! Aku senang mendengarkan ceritamu!`;

  return {
    matchedRule: null,
    emotion: 'curious',
    characterEmotionTarget: 'happy',
    animation: 'curious_head_tilt',
    actionState: 'curious_head_tilt',
    responseText: fallbackTexts,
    particleEmoji: '✨',
    needsDelta: { love: 6, happiness: 6 },
    xpGain: 8,
  };
}

/**
 * Speaks the character's response aloud using Indonesian Text-to-Speech (Web Speech Synthesis API)
 * with pitch & rate tailored to the character's 7-stage age level, plus cute synthesized vocal cues.
 * Never throws or blocks gameplay if TTS is unavailable.
 */
export function speakCharacterVoiceResponse(
  text: string,
  level: number,
  emotion: VoiceEmotionCategory,
  voiceOutputEnabled: boolean
): void {
  // Always play a gentle musical/vocal cue appropriate to emotion
  if (emotion === 'love' || emotion === 'happy' || emotion === 'excited') {
    sound.playBabyLaugh();
  } else if (emotion === 'sleepy') {
    sound.playSleepChime();
  } else {
    sound.playBabyBabble();
  }

  if (!voiceOutputEnabled) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    const synth = window.speechSynthesis;
    // Cancel any overlapping utterance so responses never overlap
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'id-ID';

    // Select Indonesian voice if available
    const voices = synth.getVoices();
    const indonesianVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith('id')) ||
      voices.find((v) => v.lang.toLowerCase().includes('indones'));
    if (indonesianVoice) {
      utterance.voice = indonesianVoice;
    }

    // Age-appropriate pitch & rate across the 7 stages
    if (level <= 2) {
      // Newborn & Crawling Baby: high, gentle, sweet pitch
      utterance.pitch = 1.55;
      utterance.rate = 0.98;
    } else if (level <= 4) {
      // Toddler & Young Child: cheerful child pitch
      utterance.pitch = 1.38;
      utterance.rate = 1.02;
    } else if (level === 5) {
      // Older Child
      utterance.pitch = 1.22;
      utterance.rate = 1.02;
    } else {
      // Teenager & Adult: natural warm expressive voice
      utterance.pitch = 1.08;
      utterance.rate = 1.0;
    }

    utterance.volume = 0.9;
    synth.speak(utterance);
  } catch {
    // Gracefully ignore TTS errors on unsupported browsers
  }
}

export function stopCharacterVoiceOutput(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
  }
}
