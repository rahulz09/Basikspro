import { createContext, useContext, useState, ReactNode } from "react";
import { OverlayCfg } from "./types";

const defaultConfig: OverlayCfg = {
  roleA: "SUPPORTER",
  roleB: "OPPONENT",
  textSize: "medium",
  showScores: true,
  showScoreCard: true,
  showTimer: true,
  showTopic: true,
  showWaveform: true,
  showTranscript: true,
  showNarrator: true,
  showPointerLine: false,
  pointerLineSide: "auto",
  bgOpacity: 100,
  subBottom: 12,
  subWidth: 80,
  subHeight: 0,
  subBgOpacity: 80,
  speakerAImage: "",
  speakerBImage: "",
  subMode: "word",
  subColor: "#0a0a14",
  subBorderColor: "#ffffff",
  narratorColor: "#451a03",
  narratorBorderColor: "#f59e0b",
  scoreCardStyle: "bar",
  waveformStyle: "bars",
  nameGap: 16,
  fontStyle: "impact",
  colorA: "#4ade80",
  colorB: "#f472b6",
  nameGlowIntensity: 70,
  showArgTracker: true,
  argTrackerSize: 12,
  nameSize: 24,
  waveformPosition: "bottom",
  waveformSize: 100,
  subBorderRadius: 12,
  subPadding: 16,
  subFontSize: 16,
  nameFontWeight: 700,
  showNameBackground: true,
  nameBackgroundOpacity: 80,
};

interface VideoConfigContextType {
  cfg: OverlayCfg;
  setCfg: (updates: Partial<OverlayCfg>) => void;
  resetCfg: () => void;
}

const VideoConfigContext = createContext<VideoConfigContextType | undefined>(undefined);

export function VideoConfigProvider({ children }: { children: ReactNode }) {
  const [cfg, setConfig] = useState<OverlayCfg>(defaultConfig);

  const setCfg = (updates: Partial<OverlayCfg>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const resetCfg = () => {
    setConfig(defaultConfig);
  };

  return (
    <VideoConfigContext.Provider value={{ cfg, setCfg, resetCfg }}>
      {children}
    </VideoConfigContext.Provider>
  );
}

export function useVideoConfig() {
  const context = useContext(VideoConfigContext);
  if (!context) {
    throw new Error("useVideoConfig must be used within VideoConfigProvider");
  }
  return context;
}
