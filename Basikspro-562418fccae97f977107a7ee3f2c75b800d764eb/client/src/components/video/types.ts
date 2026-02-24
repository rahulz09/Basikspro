export type Phase = "idle" | "speaking" | "scoring";
export type TextSize = "small" | "medium" | "large";

export interface OverlayCfg {
  roleA: string; roleB: string;
  textSize: TextSize;
  showScores: boolean; showScoreCard: boolean; showTimer: boolean; showTopic: boolean;
  showWaveform: boolean; showTranscript: boolean; showNarrator: boolean;
  showPointerLine: boolean;
  pointerLineSide: "auto" | "left" | "right"; // "auto" follows speaker side
  bgOpacity: number;
  subBottom: number; subWidth: number; subHeight: number; subBgOpacity: number;
  speakerAImage: string; speakerBImage: string;
  subMode: "word" | "word2" | "line";
  subColor: string; subBorderColor: string;
  narratorColor: string; narratorBorderColor: string;
  scoreCardStyle: "grid" | "bar";
  waveformStyle: "bars" | "pulse" | "line" | "meter";
  nameGap: number;
  fontStyle: "impact" | "sans" | "serif" | "mono";
  colorA: string;
  colorB: string;
  nameGlowIntensity: number;
  showArgTracker: boolean;
  argTrackerSize: number;
  // New customization options
  nameSize: number; // px, default 24
  waveformPosition: "top" | "bottom" | "side"; // default "bottom"
  waveformSize: number; // scale 50-150%, default 100
  subBorderRadius: number; // px, default 12
  subPadding: number; // px, default 16
  subFontSize: number; // px, default 16
  nameFontWeight: number; // 400-900, default 700
  showNameBackground: boolean; // default true
  nameBackgroundOpacity: number; // 0-100, default 80
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
