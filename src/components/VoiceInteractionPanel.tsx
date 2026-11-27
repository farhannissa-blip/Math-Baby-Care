import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  analyzeVoiceTranscript,
  MatchedVoiceReaction,
  speakCharacterVoiceResponse,
  stopCharacterVoiceOutput,
} from '../data/voiceResponses';
import { sound } from '../utils/sound';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  MessageCircleHeart,
  Send,
  X,
  ShieldCheck,
} from 'lucide-react';

// Browser SpeechRecognition Type Declarations
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface VoiceInteractionPanelProps {
  babyName: string;
  characterLevel: number;
  voiceFeatureEnabled: boolean;
  characterTtsEnabled: boolean;
  onToggleVoiceFeature: (enabled: boolean) => void;
  onToggleCharacterTts: (enabled: boolean) => void;
  onTriggerVoiceReaction: (reaction: MatchedVoiceReaction, spokenText: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

const QUICK_PHRASES = [
  { text: 'Sayang', label: '💖 "Sayang"', desc: 'Berikan kasih sayang hangat' },
  { text: 'Aku sayang kamu', label: '🥰 "Aku sayang kamu"', desc: 'Pelukan & hati gembira' },
  { text: 'Jangan sedih', label: '😊 "Jangan sedih"', desc: 'Senyum lebar & ceria' },
  { text: 'Ayo tersenyum', label: '🌟 "Ayo tersenyum"', desc: 'Tersenyum manis' },
  { text: 'Saya bersedih', label: '🤗 "Saya bersedih"', desc: 'Karakter menghiburmu' },
  { text: 'Ayo bermain', label: '🎈 "Ayo bermain"', desc: 'Lompat gembira bermain' },
  { text: 'Kamu pintar', label: '👏 "Kamu pintar"', desc: 'Tepuk tangan bangga' },
  { text: 'Ayo tidur', label: '🌙 "Ayo tidur"', desc: 'Menguap & siap bobo' },
];

export const VoiceInteractionPanel: React.FC<VoiceInteractionPanelProps> = ({
  babyName,
  characterLevel,
  voiceFeatureEnabled,
  characterTtsEnabled,
  onToggleVoiceFeature,
  onToggleCharacterTts,
  onTriggerVoiceReaction,
  onOpenChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [characterReply, setCharacterReply] = useState<string>('');
  const [manualTextInput, setManualTextInput] = useState<string>('');

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const processedTranscriptRef = useRef<boolean>(false);

  const setExpandedWithNotify = (next: boolean) => {
    setIsExpanded(next);
    if (onOpenChange) {
      onOpenChange(next);
    }
  };

  // Detect Web Speech API support on mount (never auto-starts microphone!)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecConstructor =
      (window as unknown as { SpeechRecognition?: new () => BrowserSpeechRecognition })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => BrowserSpeechRecognition })
        .webkitSpeechRecognition;

    if (!SpeechRecConstructor) {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
      stopCharacterVoiceOutput();
    };
  }, []);

  const processRecognizedUtterance = (spoken: string) => {
    const cleaned = spoken.trim();
    if (!cleaned) return;

    setRecognizedText(cleaned);
    const reaction = analyzeVoiceTranscript(cleaned, characterLevel, babyName);
    setCharacterReply(reaction.responseText);

    // Trigger character TTS voice output if enabled
    speakCharacterVoiceResponse(
      reaction.responseText,
      characterLevel,
      reaction.emotion,
      characterTtsEnabled
    );

    // Trigger character visual animation & needs reaction in parent
    onTriggerVoiceReaction(reaction, cleaned);
  };

  // Start listening ONLY when player explicitly clicks the Microphone button
  const handleStartListening = () => {
    if (!voiceFeatureEnabled) return;
    sound.playClick();
    setPermissionError(null);
    setRecognizedText('');

    if (typeof window === 'undefined') return;
    const SpeechRecConstructor =
      (window as unknown as { SpeechRecognition?: new () => BrowserSpeechRecognition })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => BrowserSpeechRecognition })
        .webkitSpeechRecognition;

    if (!SpeechRecConstructor) {
      setSpeechSupported(false);
      setPermissionError(
        'Fitur pengenalan suara mikrofon tidak tersedia di browser ini. Gunakan tombol kalimat cepat atau ketik ucapan di bawah!'
      );
      setExpandedWithNotify(true);
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }

      const recognition = new SpeechRecConstructor();
      recognition.lang = 'id-ID';
      recognition.continuous = false; // Single-utterance listening for privacy
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      processedTranscriptRef.current = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        if (!event.results || event.results.length === 0) return;
        const latestResult = event.results[event.results.length - 1];
        const transcript = latestResult[0]?.transcript || '';
        setRecognizedText(transcript);

        if (latestResult.isFinal && !processedTranscriptRef.current) {
          processedTranscriptRef.current = true;
          processRecognizedUtterance(transcript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setPermissionError(
            'Izin mikrofon ditolak atau diblokir. Kamu tetap bisa berbicara dengan tombol frasa cepat atau teks di bawah!'
          );
          setExpandedWithNotify(true);
        } else if (event.error === 'no-speech') {
          setPermissionError('Suara belum terdengar. Coba tekan mikrofon lagi atau pilih frasa cepat!');
        } else {
          setPermissionError('Mikrofon berhenti. Kamu juga bisa menggunakan tombol frasa cepat di bawah.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      setPermissionError(
        'Tidak dapat mengaktifkan mikrofon. Silakan gunakan tombol frasa cepat di bawah!'
      );
      setExpandedWithNotify(true);
    }
  };

  // Stop listening immediately when player clicks Stop
  const handleStopListening = () => {
    sound.playClick();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTextInput.trim()) return;
    processRecognizedUtterance(manualTextInput.trim());
    setManualTextInput('');
    setExpandedWithNotify(false);
  };

  return (
    <div className="pointer-events-auto flex items-center gap-1.5">
      {/* REQUIREMENT A.6: 48x48px Circular Microphone Button at Top-Left of Scene Area (Does NOT consume a full row) */}
      <button
        onClick={() => {
          sound.playClick();
          if (isListening) {
            handleStopListening();
            return;
          }
          setExpandedWithNotify(!isExpanded);
        }}
        aria-label={`Ajak Bicara ${babyName}`}
        title={`Ajak Bicara ${babyName} (Mikrofon & Frasa Suara Bahasa Indonesia)`}
        className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-full border-2 border-[#2D2520] shadow-[0_3px_0_#2D2520] flex items-center justify-center transition-transform active:translate-y-0.5 relative ${
          isListening
            ? 'bg-rose-600 text-white animate-pulse'
            : isExpanded
            ? 'bg-amber-300 text-[#2D2520]'
            : 'bg-gradient-to-br from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white'
        }`}
      >
        <Mic className="w-5 h-5 shrink-0" />
        {isListening && (
          <span className="absolute -inset-1 rounded-full border-2 border-rose-400 animate-ping pointer-events-none" />
        )}
      </button>

      {/*REQUIREMENT B & C: ROOT-LEVEL PORTAL BOTTOM SHEET (z-100 overlay, z-110 sheet max-h-[48dvh], z-120 44x44px X button) */}
      {isExpanded &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* Dark Backdrop Overlay (z-100) */}
            <div
              onClick={() => {
                if (isListening) handleStopListening();
                setExpandedWithNotify(false);
              }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-[1px]"
            />

            {/* Bottom Sheet (z-110, max 48% screen height, rounded-t-3xl, docked above bottom action bar) */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="fixed inset-x-0 bottom-[62px] z-[110] mx-auto w-full max-w-2xl max-h-[48dvh] bg-[#FFFDF9] border-t-3 border-x-3 border-[#2D2520] rounded-t-3xl shadow-[0_-6px_0_rgba(45,37,32,0.2)] flex flex-col overflow-hidden"
            >
              {/* Sticky Header with Concise Max-2-Line Title & 44x44px Close Button (z-120) */}
              <div className="sticky top-0 z-[115] bg-[#FFFDF9] px-3.5 py-2.5 border-b-2 border-[#E5DEC9] flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 border-2 border-[#2D2520] flex items-center justify-center text-rose-600 shrink-0">
                    <MessageCircleHeart className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-xs sm:text-sm font-bold text-[#2D2520] leading-tight line-clamp-2">
                      Ajak Bicara {babyName}
                    </h3>
                    <p className="text-[10px] text-[#6E6259] font-semibold truncate">
                      Bicara via mikrofon atau pilih kalimat kasih sayang
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Toggle Character TTS Voice Output */}
                  <button
                    onClick={() => {
                      sound.playClick();
                      const next = !characterTtsEnabled;
                      if (!next) stopCharacterVoiceOutput();
                      onToggleCharacterTts(next);
                    }}
                    className={`px-2 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1 ${
                      characterTtsEnabled
                        ? 'bg-emerald-100 border-[#2D2520] text-emerald-900'
                        : 'bg-stone-100 border-stone-400 text-stone-600'
                    }`}
                    title="Aktifkan/Nonaktifkan Suara Karakter"
                  >
                    {characterTtsEnabled ? (
                      <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <VolumeX className="w-3.5 h-3.5 text-stone-500" />
                    )}
                    <span className="hidden sm:inline">
                      {characterTtsEnabled ? 'Suara On' : 'Suara Off'}
                    </span>
                  </button>

                  {/* Toggle Entire Voice Recognition Feature On/Off */}
                  <button
                    onClick={() => {
                      sound.playClick();
                      if (isListening) handleStopListening();
                      onToggleVoiceFeature(!voiceFeatureEnabled);
                    }}
                    className={`px-2 py-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1 ${
                      voiceFeatureEnabled
                        ? 'bg-sky-100 border-[#2D2520] text-sky-900'
                        : 'bg-rose-100 border-rose-400 text-rose-800'
                    }`}
                    title="Aktifkan/Nonaktifkan Fitur Mikrofon"
                  >
                    {voiceFeatureEnabled ? (
                      <Mic className="w-3.5 h-3.5 text-sky-700" />
                    ) : (
                      <MicOff className="w-3.5 h-3.5 text-rose-700" />
                    )}
                    <span className="hidden sm:inline">
                      {voiceFeatureEnabled ? 'Mic On' : 'Mic Off'}
                    </span>
                  </button>

                  {/* 44x44px Close Button (X) at z-120 */}
                  <button
                    onClick={() => {
                      sound.playClick();
                      if (isListening) handleStopListening();
                      setExpandedWithNotify(false);
                    }}
                    aria-label="Tutup Panel Bicara"
                    className="relative z-[120] w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] flex items-center justify-center transition-transform shrink-0"
                  >
                    <X className="w-5 h-5 stroke-[2.8]" />
                  </button>
                </div>
              </div>

              {/* Scrollable Sheet Content */}
              <div className="p-3 overflow-y-auto space-y-2.5">
                {/* Start / Stop Microphone Action Bar */}
                {voiceFeatureEnabled && speechSupported ? (
                  <div className="flex items-center justify-between gap-2 bg-rose-50 border-2 border-[#2D2520] rounded-2xl p-2">
                    {!isListening ? (
                      <>
                        <span className="text-xs font-bold text-[#2D2520]">
                          🎤 Tekan untuk mulai bicara (id-ID):
                        </span>
                        <button
                          onClick={handleStartListening}
                          className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white border border-[#2D2520] font-display text-xs font-bold flex items-center gap-1.5 shadow-[0_2px_0_#2D2520]"
                        >
                          <Mic className="w-3.5 h-3.5" />
                          <span>Mulai Bicara</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                          <span className="text-xs font-bold text-rose-800">
                            Aku sedang mendengarkan...
                          </span>
                        </div>
                        <button
                          onClick={handleStopListening}
                          className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white border border-[#2D2520] font-display text-xs font-bold"
                        >
                          Berhenti
                        </button>
                      </>
                    )}
                  </div>
                ) : !speechSupported ? (
                  <div className="px-2.5 py-1.5 rounded-xl bg-amber-100 border border-amber-400 text-[11px] font-bold text-amber-900">
                    ℹ️ Pengenalan suara mikrofon tidak tersedia di browser ini. Gunakan tombol frasa cepat atau ketik kalimat di bawah!
                  </div>
                ) : (
                  <div className="px-2.5 py-1.5 rounded-xl bg-stone-100 border border-stone-300 text-[11px] font-bold text-stone-700">
                    🔒 Mikrofon dinonaktifkan. Kamu tetap dapat menggunakan tombol frasa cepat di bawah.
                  </div>
                )}

                {permissionError && (
                  <div className="px-2.5 py-1.5 rounded-xl bg-amber-50 border border-amber-400 text-[11px] font-semibold text-amber-900">
                    {permissionError}
                  </div>
                )}

                {(recognizedText || characterReply) && (
                  <div className="p-2.5 rounded-2xl bg-amber-50/90 border-2 border-[#2D2520] space-y-1">
                    {recognizedText && (
                      <div className="text-[11px] font-bold text-[#6E6259]">
                        🗣️ Ucapanmu:{' '}
                        <span className="text-[#2D2520]">&ldquo;{recognizedText}&rdquo;</span>
                      </div>
                    )}
                    {characterReply && (
                      <div className="text-xs font-bold text-rose-700">
                        💬 {babyName}: &ldquo;{characterReply}&rdquo;
                      </div>
                    )}
                  </div>
                )}

                {/* REQUIREMENT C.6: Clean 2-Column Grid of Action Buttons with Uniform Height (min-h-[56px]) */}
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_PHRASES.map((phrase) => (
                    <button
                      key={phrase.text}
                      onClick={() => {
                        processRecognizedUtterance(phrase.text);
                        setExpandedWithNotify(false);
                      }}
                      className="min-h-[56px] p-2 rounded-2xl bg-white hover:bg-pink-50 border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] text-left active:translate-y-0.5 transition-all flex flex-col justify-center"
                    >
                      <span className="font-display text-xs font-bold text-[#2D2520] leading-tight line-clamp-1">
                        {phrase.label}
                      </span>
                      <span className="text-[10px] font-semibold text-[#6E6259] leading-tight line-clamp-1 mt-0.5">
                        {phrase.desc}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Text Input Alternative for Accessibility / Any Custom Phrase */}
                <form onSubmit={handleManualSubmit} className="flex items-center gap-1.5 pt-0.5">
                  <input
                    type="text"
                    value={manualTextInput}
                    onChange={(e) => setManualTextInput(e.target.value)}
                    placeholder={`Ketik ucapan untuk ${babyName}...`}
                    className="flex-1 px-3 py-2 rounded-xl bg-white border-2 border-[#2D2520] text-xs font-semibold text-[#2D2520] focus:outline-none focus:bg-amber-50"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-500 text-[#2D2520] border-2 border-[#2D2520] shadow-[0_2px_0_#2D2520] font-display text-xs font-bold flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim</span>
                  </button>
                </form>

                {/* Privacy Guarantee Badge */}
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#6E6259]">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Privasi aman: Suara tidak pernah direkam atau disimpan.</span>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}
    </div>
  );
};

