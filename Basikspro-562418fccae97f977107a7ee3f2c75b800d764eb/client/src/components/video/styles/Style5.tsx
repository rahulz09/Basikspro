import { motion, AnimatePresence } from "framer-motion";
import { CP } from "../types";
import { fmt, hexToRgba } from "../helpers";
import { TEXT_SIZES, BOX_PAD } from "../constants";
import { WaveformBars } from "../WaveformBars";
import { SubtitleBox } from "../SubtitleBox";
import { SubtitleText } from "../SubtitleText";

export function Style5({ project, current, isA, isNarrator, cfg, timerSeconds, isSpeaking, totA, totB, wordIdx, setCfg }: CP) {
  return (
    <>
      {cfg.showTopic && (
        <motion.div drag dragMomentum={false} className="absolute top-4 left-1/2 -translate-x-1/2 z-20 cursor-move">
          <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-2 flex items-center gap-3">
            <span className="text-white font-bold text-xs">{project.topic}</span>
            {cfg.showTimer && !isNarrator && <><div className="w-px h-4 bg-white/20" /><span className="text-yellow-400 font-mono font-bold text-sm tabular-nums">{fmt(timerSeconds)}</span></>}
          </div>
        </motion.div>
      )}

      {/* Speaker A — left */}
      <motion.div drag dragMomentum={false} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 cursor-move">
        <motion.div animate={{ scale: isA && isSpeaking && !isNarrator ? 1.06 : 1 }} transition={{ duration: 0.3 }}
          className={`rounded-2xl overflow-hidden border-2 transition-all duration-300 ${isA && isSpeaking && !isNarrator ? "border-blue-400 shadow-[0_0_32px_rgba(59,130,246,0.55)]" : "border-white/10 opacity-75"}`}
          style={{ width: 120 }}>
          {cfg.speakerAImage ? (
            <img src={cfg.speakerAImage} alt={project.speakerAName} className="w-full object-cover" style={{ height: 150 }} />
          ) : (
            <div className="w-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-900" style={{ height: 150 }}>
              <span className="text-white font-black text-5xl">{project.speakerAName?.[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className="bg-blue-700/90 backdrop-blur px-3 py-2">
            <p className="text-white font-bold text-xs truncate">{project.speakerAName}</p>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-blue-200 text-[9px]">{cfg.roleA}</span>
              {cfg.showScores && <span className="text-white font-black text-sm tabular-nums">{totA.toFixed(1)}</span>}
            </div>
          </div>
          {isA && isSpeaking && !isNarrator && cfg.showWaveform && (
            <div className="bg-blue-900/90 py-1.5 flex justify-center"><WaveformBars color="bg-blue-300" /></div>
          )}
        </motion.div>
      </motion.div>

      {/* Speaker B — right */}
      <motion.div drag dragMomentum={false} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 cursor-move">
        <motion.div animate={{ scale: !isA && isSpeaking && !isNarrator ? 1.06 : 1 }} transition={{ duration: 0.3 }}
          className={`rounded-2xl overflow-hidden border-2 transition-all duration-300 ${!isA && isSpeaking && !isNarrator ? "border-rose-400 shadow-[0_0_32px_rgba(239,68,68,0.55)]" : "border-white/10 opacity-75"}`}
          style={{ width: 120 }}>
          {cfg.speakerBImage ? (
            <img src={cfg.speakerBImage} alt={project.speakerBName} className="w-full object-cover" style={{ height: 150 }} />
          ) : (
            <div className="w-full flex items-center justify-center bg-gradient-to-br from-rose-600 to-rose-900" style={{ height: 150 }}>
              <span className="text-white font-black text-5xl">{project.speakerBName?.[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className="bg-rose-700/90 backdrop-blur px-3 py-2">
            <p className="text-white font-bold text-xs truncate">{project.speakerBName}</p>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-rose-200 text-[9px]">{cfg.roleB}</span>
              {cfg.showScores && <span className="text-white font-black text-sm tabular-nums">{totB.toFixed(1)}</span>}
            </div>
          </div>
          {!isA && isSpeaking && !isNarrator && cfg.showWaveform && (
            <div className="bg-rose-900/90 py-1.5 flex justify-center"><WaveformBars color="bg-rose-300" /></div>
          )}
        </motion.div>
      </motion.div>

      {cfg.showTranscript && current.text && (
        <SubtitleBox cfg={cfg} setCfg={setCfg} isA={isA} isNarrator={isNarrator} isSpeaking={isSpeaking}>
          <AnimatePresence mode="wait">
            <motion.div key={current.text} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className={`${BOX_PAD[cfg.textSize]} rounded-2xl shadow-2xl backdrop-blur-xl border`}
              style={{ backgroundColor: hexToRgba(isNarrator ? cfg.narratorColor : cfg.subColor, cfg.subBgOpacity / 100), borderColor: hexToRgba(isNarrator ? cfg.narratorBorderColor : cfg.subBorderColor, 0.3) }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-2 h-2 rounded-full ${isNarrator ? "bg-amber-400" : isA ? "bg-blue-400" : "bg-rose-400"}`} />
                <span className={`text-[10px] font-bold tracking-wider ${isNarrator ? "text-amber-400" : isA ? "text-blue-400" : "text-rose-400"}`}>
                  {isNarrator ? project.speakerNarratorName : isA ? project.speakerAName : project.speakerBName}
                </span>
              </div>
              <SubtitleText text={current.text} wordIdx={wordIdx} isSpeaking={isSpeaking} textClass={`text-white ${TEXT_SIZES[cfg.textSize]}`} subMode={cfg.subMode} isNarrator={isNarrator} />
            </motion.div>
          </AnimatePresence>
        </SubtitleBox>
      )}
    </>
  );
}
