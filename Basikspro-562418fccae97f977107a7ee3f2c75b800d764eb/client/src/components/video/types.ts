export type Phase = "idle" | "speaking" | "scoring";
export type TextSize = "small" | "medium" | "large";

export interface OverlayCfg {
  roleA: string; roleB: string;
  textSize: TextSize;
  showScores: boolean; showTimer: boolean; showTopic: boolean;
  showWaveform: boolean; showTranscript: boolean; showNarrator: boolean;
  showPointerLine: boolean;
  bgOpacity: number;
  subBottom: number; subWidth: number; subHeight: number; subBgOpacity: number;
  speakerAImage: string; speakerBImage: string;
  subMode: "word" | "word2" | "line";
  subColor: string; subBorderColor: string;
  narratorColor: string; narratorBorderColor: string;
  // New options
  scoreCardStyle: "grid" | "bar";
  waveformStyle: "bars" | "pulse" | "line";
  nameGap: number;
  fontStyle: "impact" | "sans" | "serif" | "mono";
  colorA: string;       // speaker A accent color, default "#4ade80"
  colorB: string;       // speaker B accent color, default "#f472b6"
  nameGlowIntensity: number; // 0-100
  showArgTracker: boolean;
}

export interface CP {
  project: any; current: any;
  isA: boolean; isNarrator: boolean;
  cfg: OverlayCfg;
  timerSeconds: number; isSpeaking: boolean;
  totA: number; totB: number;
  wordIdx: number;
  setCfg: React.Dispatch<React.SetStateAction<OverlayCfg>>;
}

export interface ModelScore {
  name: string; color: string; bg: string; logo: string; score: number;
}
