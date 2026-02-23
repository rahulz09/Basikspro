import { motion, AnimatePresence } from "framer-motion";
import { CP } from "../types";
import { fmt, hexToRgba } from "../helpers";
import { TEXT_SIZES, BOX_PAD } from "../constants";
import { WaveformBars } from "../WaveformBars";
import { SubtitleBox } from "../SubtitleBox";
import { SubtitleText } from "../SubtitleText";

export function Style2({ project, current, isA, isNarrator, cfg, timerSeconds, isSpeaking, totA, totB, wordIdx, setCfg }: CP) {
  return (
    <>
      {cfg.showTopic && (
        <motion.div drag dragMomentum={false} className="absolute top-4 left-1/2 -translate-x-1/2 z-20 cursor-move">
          <div className="bg-black/60 backdrop-blur rounded-2xl border border-white/10 px-5 py-2 flex items-center gap-3">
            <span className="text-white font-bold text-xs uppercase tracking-wide">{project.topic}</span>
            {cfg.showTimer && !isNarrator && <><div className="w-px h-4 bg-white/20" /><span className="text-yellow-400 font-mono font-bold text-sm tabular-nums">{fmt(timerSeconds)}</span></>}
          </div>
        </motion.div>
      )}

      {cfg.showWaveform && isSpeaking && (
        <motion.div drag dragMomentum={false} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`absolute top-1/2 -translate-y-1/2 z-20 cursor-move ${isA ? "left-5" : "right-5"}`}>
          <WaveformBars color={isA ? "bg-blue-400" : "bg-rose-400"} />
        </motion.div>
      )}

      {cfg.showScores && (
        <motion.div drag dragMomentum={false} className="absolute bottom-12 left-0 right-0 z-20 cursor-move">
          <div className="flex">
            <div className={`flex-1 flex items-center gap-3 px-5 py-2.5 bg-blue-700/85 backdrop-blur-sm transition-all ${isA && isSpeaking ? "brightness-110" : ""}`}>
              <span className="text-white font-black text-xl tabular-nums">{totA.toFixed(1)}</span>
              <div><p className="text-white font-bold text-xs">{project.speakerAName}</p><p className="text-blue-200 text-[10px] tracking-wider">{cfg.roleA}</p></div>
              {isA && isSpeaking && cfg.showWaveform && <div className="ml-auto"><WaveformBars color="bg-blue-200" /></div>}
            </div>
            <div className="w-px bg-white/10" />
            <div className={`flex-1 flex items-center gap-3 px-5 py-2.5 bg-rose-700/85 backdrop-blur-sm flex-row-reverse transition-all ${!isA && isSpeaking ? "brightness-110" : ""}`}>
              <span className="text-white font-black text-xl tabular-nums">{totB.toFixed(1)}</span>
              <div className="text-right"><p className="text-white font-bold text-xs">{project.speakerBName}</p><p className="text-rose-200 text-[10px] tracking-wider">{cfg.roleB}</p></div>
              {!isA && isSpeaking && cfg.showWaveform && <div className="mr-auto"><WaveformBars color="bg-rose-200" /></div>}
            </div>
          </div>
        </motion.div>
      )}

      {cfg.showTranscript && current.text && (
        <SubtitleBox cfg={cfg} setCfg={setCfg} extraBottom={44} isA={isA} isNarrator={isNarrator} isSpeaking={isSpeaking}>
          <AnimatePresence mode="wait">
            <motion.div key={current.text} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              className={`backdrop-blur-xl border rounded-2xl shadow-2xl ${BOX_PAD[cfg.textSize]}`}
              style={{ backgroundColor: hexToRgba(isNarrator ? cfg.narratorColor : cfg.subColor, cfg.subBgOpacity / 100), borderColor: hexToRgba(isNarrator ? cfg.narratorBorderColor : cfg.subBorderColor, 0.3) }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-2 h-2 rounded-full ${isNarrator ? "bg-amber-400" : isA ? "bg-blue-400" : "bg-rose-400"}`} />
                <span className={`text-[10px] font-bold tracking-wider ${isNarrator ? "text-amber-400" : isA ? "text-blue-400" : "text-rose-400"}`}>
                  {isNarrator ? project.speakerNarratorName : isA ? project.speakerAName : project.speakerBName}
                </span>
              </div>
              <SubtitleText text={current.text} wordIdx={wordIdx} isSpeaking={isSpeaking} textClass={TEXT_SIZES[cfg.textSize]} subMode={cfg.subMode} isNarrator={isNarrator} />
            </motion.div>
          </AnimatePresence>
        </SubtitleBox>
      )}
    </>
  );
}
