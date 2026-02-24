export const DEMO_BG = "https://images.unsplash.com/photo-1577563908411-5077b6dc7624?q=80&w=2070&auto=format&fit=crop";

// SVG icons — simple, inline, no external URLs
const _ICONS: Record<string, string> = {
  Gemini: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 3C20 14 27 16 37 20C27 24 20 26 20 37C20 26 13 24 3 20C13 16 20 14 20 3Z" fill="#4285f4"/><path d="M20 3C20 14 27 16 37 20C27 24 20 26 20 37" fill="#ea4335" opacity="0.45"/></svg>`,
  Claude: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="10" fill="#d97706"/><path d="M27 13A11 11 0 1 0 27 27" stroke="white" stroke-width="3.5" stroke-linecap="round" fill="none"/></svg>`,
  ElevenLabs: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="10" fill="#5a4fcf"/><rect x="9" y="10" width="8" height="20" rx="4" fill="white"/><rect x="23" y="10" width="8" height="20" rx="4" fill="white"/></svg>`,
  DeepSeek: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="10" fill="#0055ee"/><path d="M11 11L11 29L21 29C27 29 31 25 31 20C31 15 27 11 21 11Z" fill="white"/><path d="M11 20L31 20" stroke="#0055ee" stroke-width="2"/></svg>`,
  Grok: `<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="10" fill="#111827"/><path d="M13 13L27 27M27 13L13 27" stroke="white" stroke-width="3.5" stroke-linecap="round"/></svg>`,
};

export const AI_MODELS = [
  { name: "Gemini",     color: "#4285f4", bg: "#e8f0fe", logo: "G",  iconSvg: _ICONS.Gemini     },
  { name: "Claude",     color: "#d97706", bg: "#fef3e2", logo: "C",  iconSvg: _ICONS.Claude     },
  { name: "ElevenLabs", color: "#5a4fcf", bg: "#ede9fe", logo: "11", iconSvg: _ICONS.ElevenLabs },
  { name: "DeepSeek",   color: "#0066ff", bg: "#e5f0ff", logo: "DS", iconSvg: _ICONS.DeepSeek   },
  { name: "Grok",       color: "#111827", bg: "#f3f4f6", logo: "X",  iconSvg: _ICONS.Grok       },
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
