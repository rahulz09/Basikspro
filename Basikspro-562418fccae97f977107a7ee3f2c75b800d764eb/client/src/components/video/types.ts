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
