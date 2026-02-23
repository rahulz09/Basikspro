import { motion, AnimatePresence } from "framer-motion";
import { CP } from "../types";
import { fmt, hexToRgba } from "../helpers";
import { BOX_PAD, TEXT_SIZES } from "../constants";
import { WaveformBars } from "../WaveformBars";
import { SubtitleBox } from "../SubtitleBox";
import { SubtitleText } from "../SubtitleText";

export function Style4({ project, current, isA, isNarrator, cfg, timerSeconds, isSpeaking, totA, totB, wordIdx, setCfg }: CP) {
  return (
    <>
      <div className={`absolute inset-0 z-10 pointer-events-none transition-all duration-700 ${isA && isSpeaking ? "bg-gradient-to-r from-blue-600/25 via-transparent to-transparent" : !isA && isSpeaking ? "bg-gradient-to-l from-rose-600/25 via-transparent to-transparent" : ""}`} />

      {cfg.showTopic && (
        <motion.div drag dragMomentum={false} className="absolute top-4 left-1/2 -translate-x-1/2 z-20 cursor-move flex items-center gap-2">
          <span className="text-white/70 font-bold text-[10px] tracking-widest uppercase">{project.topic}</span>
          {cfg.showTimer && !isNarrator && (
            <div className="bg-yellow-500/90 px-3 py-0.5 rounded font-mono text-black font-black text-sm tabular-nums">{fmt(timerSeconds)}</div>
          )}
        </motion.div>
      )}

      <motion.div drag dragMomentum={false} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 cursor-move">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.5)]">
          <span className="text-white font-black text-lg">VS</span>
        </div>
      </motion.div>

      {cfg.showScores && (
        <>
          <motion.div drag dragMomentum={false} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 cursor-move">
            <div className={`bg-blue-600/80 backdrop-blur-lg rounded-2xl p-4 border border-blue-400/30 min-w-[90px] text-center transition-all ${isA && isSpeaking ? "shadow-[0_0_35px_rgba(59,130,246,0.6)] scale-105" : "opacity-80"}`}>
              <div className="text-white font-black text-3xl tabular-nums">{totA.toFixed(1)}</div>
              <div className="w-full h-px bg-white/30 my-2" />
              <div className="text-white font-bold text-xs">{project.speakerAName}</div>
              <div className="text-blue-200 text-[9px] tracking-wider mt-0.5">{cfg.roleA}</div>
              {cfg.showWaveform && isA && isSpeaking && <div className="mt-2 flex justify-center"><WaveformBars color="bg-white/70" /></div>}
            </div>
          </motion.div>
          <motion.div drag dragMomentum={false} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 cursor-move">
            <div className={`bg-rose-600/80 backdrop-blur-lg rounded-2xl p-4 border border-rose-400/30 min-w-[90px] text-center transition-all ${!isA && isSpeaking ? "shadow-[0_0_35px_rgba(239,68,68,0.6)] scale-105" : "opacity-80"}`}>
              <div className="text-white font-black text-3xl tabular-nums">{totB.toFixed(1)}</div>
              <div className="w-full h-px bg-white/30 my-2" />
              <div className="text-white font-bold text-xs">{project.speakerBName}</div>
              <div className="text-rose-200 text-[9px] tracking-wider mt-0.5">{cfg.roleB}</div>
              {cfg.showWaveform && !isA && isSpeaking && <div className="mt-2 flex justify-center"><WaveformBars color="bg-white/70" /></div>}
            </div>
          </motion.div>
        </>
      )}

      {cfg.showTranscript && current.text && (
        <SubtitleBox cfg={cfg} setCfg={setCfg} isA={isA} isNarrator={isNarrator} isSpeaking={isSpeaking}>
          <AnimatePresence mode="wait">
            <motion.div key={current.text} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
              className={`${BOX_PAD[cfg.textSize]} rounded-xl border shadow-2xl backdrop-blur-lg`}
              style={{ backgroundColor: hexToRgba(isNarrator ? cfg.narratorColor : cfg.subColor, cfg.subBgOpacity / 100), borderColor: hexToRgba(isNarrator ? cfg.narratorBorderColor : cfg.subBorderColor, 0.3) }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isNarrator ? "bg-amber-400" : isA ? "bg-blue-400" : "bg-rose-400"}`} />
                <span className={`text-[9px] font-bold tracking-wider uppercase ${isNarrator ? "text-amber-400" : isA ? "text-blue-400" : "text-rose-400"}`}>
                  {isNarrator ? project.speakerNarratorName : isA ? project.speakerAName : project.speakerBName}
                </span>
              </div>
              <SubtitleText text={current.text} wordIdx={wordIdx} isSpeaking={isSpeaking} textClass={`text-white leading-snug ${TEXT_SIZES[cfg.textSize]}`} subMode={cfg.subMode} isNarrator={isNarrator} />
            </motion.div>
          </AnimatePresence>
        </SubtitleBox>
      )}
    </>
  );
}
