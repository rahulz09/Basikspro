export const DEMO_BG = "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=2070&auto=format&fit=crop";

export const AI_MODELS = [
  { name: "Gemini",     color: "#4285f4", bg: "#e8f0fe", logo: "G"  },
  { name: "Claude",     color: "#d97706", bg: "#fef3e2", logo: "C"  },
  { name: "ElevenLabs", color: "#5a4fcf", bg: "#ede9fe", logo: "11" },
  { name: "DeepSeek",   color: "#0066ff", bg: "#e5f0ff", logo: "DS" },
  { name: "Grok",       color: "#111827", bg: "#f3f4f6", logo: "X"  },
];

export const TEXT_SIZES = { small: "text-xs sm:text-sm", medium: "text-sm sm:text-xl", large: "text-xl sm:text-3xl" };
export const BOX_PAD   = { small: "px-3 py-2", medium: "px-5 py-3", large: "px-7 py-4" };

export const AUDIO_PROVIDERS = [
  { id: "gemini",      name: "Gemini TTS",  badge: "Google", desc: "8 expressive AI voices" },
  { id: "elevenlabs",  name: "ElevenLabs",  badge: "Pro",    desc: "Ultra-realistic voices" },
];

export const GEMINI_VOICES = [
  { id: "Kore",   name: "Kore"   }, { id: "Charon", name: "Charon" },
  { id: "Fenrir", name: "Fenrir" }, { id: "Aoede",  name: "Aoede"  },
  { id: "Puck",   name: "Puck"   }, { id: "Leda",   name: "Leda"   },
  { id: "Zephyr", name: "Zephyr" }, { id: "Orus",   name: "Orus"   },
];

export const ELEVENLABS_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel"  },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella"   },
  { id: "ErXwobaYiN019PkySvjV",  name: "Antoni"  },
  { id: "MF3mGyEYCl7XYWbV9V6O",  name: "Elli"    },
  { id: "TxGEqnHWrfWFTfGW9XjX",  name: "Josh"    },
  { id: "VR6AewLTigWG4xSOukaG",  name: "Arnold"  },
  { id: "pNInz6obpgDQGcFmaJgB",  name: "Adam"    },
  { id: "yoZ06aMxZJJ28mfd3POQ",  name: "Sam"     },
];

export const DURATION_OPTIONS = [1, 5, 8, 15, 20, 25, 30, 40];

export function getVoicesForProvider(provider: string) {
  return provider === "elevenlabs" ? ELEVENLABS_VOICES : GEMINI_VOICES;
}
