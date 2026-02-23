import { motion, AnimatePresence } from "framer-motion";
import { CP } from "../types";
import { fmt, hexToRgba } from "../helpers";
import { TEXT_SIZES } from "../constants";
import { WaveformBars } from "../WaveformBars";
import { SubtitleBox } from "../SubtitleBox";
import { SubtitleText } from "../SubtitleText";

export function Style1({ project, current, isA, isNarrator, cfg, timerSeconds, isSpeaking, totA, totB, wordIdx, setCfg }: CP) {
  return (
    <>
      {/* Top bar */}
      <motion.div drag dragMomentum={false} className="absolute top-0 left-0 right-0 z-20 cursor-move flex items-stretch">
        {cfg.showScores && (
          <div className="bg-blue-700/90 backdrop-blur-sm px-4 py-2.5 flex items-center justify-center min-w-[70px]">
            <span className="text-white font-black text-xl tabular-nums">{totA.toFixed(1)}</span>
          </div>
        )}
        {cfg.showTopic && (
          <div className="flex-1 bg-gray-900/85 backdrop-blur-sm flex items-center justify-center px-4 py-2.5">
            <span className="text-white font-black text-xs sm:text-sm tracking-widest uppercase text-center leading-tight">{project.topic}</span>
          </div>
        )}
        <div className="flex items-stretch">
          {cfg.showTimer && !isNarrator && (
            <div className="bg-gray-700/90 backdrop-blur-sm px-3 py-2.5 flex items-center justify-center">
              <span className="text-white font-mono font-bold text-base tabular-nums">{fmt(timerSeconds)}</span>
            </div>
          )}
          {cfg.showScores && (
            <div className="bg-purple-700/90 backdrop-blur-sm px-4 py-2.5 flex items-center justify-center min-w-[70px]">
              <span className="text-white font-black text-xl tabular-nums">{totB.toFixed(1)}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Role labels */}
      <motion.div drag dragMomentum={false} className="absolute z-20 cursor-move" style={{ top: 52, left: 0, right: 0 }}>
        <div className="flex justify-between px-4 sm:px-10">
          <span className={`font-black text-lg sm:text-2xl tracking-widest transition-all duration-300 ${isA && isSpeaking ? "text-blue-400 drop-shadow-[0_0_12px_rgba(96,165,250,0.9)]" : "text-blue-400/60"}`} style={{ fontStyle: "italic" }}>{cfg.roleA}</span>
          <span className={`font-black text-lg sm:text-2xl tracking-widest transition-all duration-300 ${!isA && isSpeaking ? "text-rose-400 drop-shadow-[0_0_12px_rgba(251,113,133,0.9)]" : "text-rose-400/60"}`} style={{ fontStyle: "italic" }}>{cfg.roleB}</span>
        </div>
      </motion.div>

      {cfg.showWaveform && isSpeaking && (
        <motion.div drag dragMomentum={false} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`absolute top-24 z-20 cursor-move ${isA ? "left-4" : "right-4"}`}>
          <WaveformBars color={isA ? "bg-blue-400" : "bg-rose-400"} />
        </motion.div>
      )}

      {cfg.showTranscript && current.text && (
        <SubtitleBox cfg={cfg} setCfg={setCfg} isA={isA} isNarrator={isNarrator} isSpeaking={isSpeaking}>
          <AnimatePresence mode="wait">
            <motion.div key={current.text} initial={{ opacity: 0, y: 12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.97 }}
              className="relative backdrop-blur-md rounded-2xl shadow-2xl border"
              style={{ padding: cfg.textSize === "small" ? "10px 16px" : cfg.textSize === "large" ? "18px 28px" : "14px 22px", backgroundColor: hexToRgba(isNarrator ? cfg.narratorColor : cfg.subColor, cfg.subBgOpacity / 100), borderColor: hexToRgba(isNarrator ? cfg.narratorBorderColor : cfg.subBorderColor, 0.3) }}>
              <div className={`absolute -bottom-2.5 ${isNarrator ? "left-1/2 -translate-x-1/2" : isA ? "left-10" : "right-10"} w-5 h-5 rotate-45 border-b border-r`}
                style={{ backgroundColor: hexToRgba(isNarrator ? cfg.narratorColor : cfg.subColor, cfg.subBgOpacity / 100), borderColor: hexToRgba(isNarrator ? cfg.narratorBorderColor : cfg.subBorderColor, 0.3) }} />
              {isNarrator && (
                <div className="flex items-center gap-1.5 mb-1 justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-[9px] font-bold tracking-wider uppercase text-amber-400">{project.speakerNarratorName}</span>
                </div>
              )}
              <SubtitleText text={current.text} wordIdx={wordIdx} isSpeaking={isSpeaking} textClass={`text-white text-center ${TEXT_SIZES[cfg.textSize]}`} subMode={cfg.subMode} isNarrator={isNarrator} />
            </motion.div>
          </AnimatePresence>
        </SubtitleBox>
      )}
    </>
  );
}
