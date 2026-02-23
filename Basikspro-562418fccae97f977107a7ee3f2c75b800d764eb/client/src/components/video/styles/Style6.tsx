import { motion, AnimatePresence } from "framer-motion";
import { CP } from "../types";
import { fmt, hexToRgba } from "../helpers";
import { TEXT_SIZES, BOX_PAD } from "../constants";
import { WaveformBars } from "../WaveformBars";
import { SubtitleBox } from "../SubtitleBox";
import { SubtitleText } from "../SubtitleText";

export function Style6({ project, current, isA, isNarrator, cfg, timerSeconds, isSpeaking, totA, totB, wordIdx, setCfg }: CP) {
  const activeName = isNarrator ? (project.speakerNarratorName || "Narrator") : isA ? project.speakerAName : project.speakerBName;
  const accentGrad = isNarrator ? "from-amber-500 to-orange-600" : isA ? "from-blue-500 to-indigo-700" : "from-rose-500 to-pink-700";
  const accentRing = isNarrator ? "ring-amber-400" : isA ? "ring-blue-400" : "ring-rose-400";
  const activeImg = isNarrator ? "" : isA ? cfg.speakerAImage : cfg.speakerBImage;

  return (
    <>
      <div className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 25%, rgba(0,0,0,0.65) 100%)" }} />

      <motion.div drag dragMomentum={false} className="absolute top-4 left-1/2 -translate-x-1/2 z-20 cursor-move flex items-center gap-2">
        {cfg.showTopic && (
          <div className="bg-black/70 backdrop-blur border border-white/10 rounded-2xl px-5 py-2">
            <span className="text-white font-bold text-xs tracking-wide">{project.topic}</span>
          </div>
        )}
        {cfg.showTimer && !isNarrator && (
          <div className="bg-black/70 backdrop-blur border border-white/10 rounded-xl px-3 py-2">
            <span className="text-yellow-400 font-mono font-bold text-sm tabular-nums">{fmt(timerSeconds)}</span>
          </div>
        )}
      </motion.div>

      {/* Center avatar */}
      <motion.div drag dragMomentum={false} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 cursor-move flex flex-col items-center">
        <motion.div
          animate={isSpeaking ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br ${accentGrad} flex items-center justify-center shadow-2xl ring-4 ring-offset-2 ring-offset-transparent ${isSpeaking ? accentRing : "ring-white/10"} overflow-hidden border-2 border-white/20`}>
          {activeImg ? (
            <img src={activeImg} alt={activeName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white font-black text-5xl">{activeName[0]?.toUpperCase()}</span>
          )}
        </motion.div>
        <motion.div className="mt-3 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-white font-black text-base drop-shadow-lg">{activeName}</p>
          <p className={`text-[10px] font-bold tracking-wider mt-0.5 ${isNarrator ? "text-amber-300" : isA ? "text-blue-300" : "text-rose-300"}`}>
            {isNarrator ? "NARRATOR" : isA ? cfg.roleA : cfg.roleB}
          </p>
        </motion.div>
        {cfg.showWaveform && isSpeaking && (
          <div className="mt-3">
            <WaveformBars color={isNarrator ? "bg-amber-400" : isA ? "bg-blue-400" : "bg-rose-400"} variant={cfg.waveformStyle} />
          </div>
        )}
      </motion.div>

      {cfg.showScores && (
        <motion.div drag dragMomentum={false} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 cursor-move space-y-2">
          <div className={`bg-blue-600/80 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-2 transition-all ${isA && isSpeaking && !isNarrator ? "ring-2 ring-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.4)]" : ""}`}>
            <span className="text-blue-200 text-[9px] font-bold truncate max-w-[60px]">{project.speakerAName}</span>
            <span className="text-white font-black text-sm tabular-nums ml-auto">{totA.toFixed(1)}</span>
          </div>
          <div className={`bg-rose-600/80 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-2 transition-all ${!isA && !isNarrator && isSpeaking ? "ring-2 ring-rose-400 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : ""}`}>
            <span className="text-rose-200 text-[9px] font-bold truncate max-w-[60px]">{project.speakerBName}</span>
            <span className="text-white font-black text-sm tabular-nums ml-auto">{totB.toFixed(1)}</span>
          </div>
        </motion.div>
      )}

      {cfg.showTranscript && current.text && (
        <SubtitleBox cfg={cfg} setCfg={setCfg} isA={isA} isNarrator={isNarrator} isSpeaking={isSpeaking}>
          <AnimatePresence mode="wait">
            <motion.div key={current.text} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className={`${BOX_PAD[cfg.textSize]} rounded-2xl shadow-2xl backdrop-blur-xl border`}
              style={{ backgroundColor: hexToRgba(isNarrator ? cfg.narratorColor : cfg.subColor, cfg.subBgOpacity / 100), borderColor: hexToRgba(isNarrator ? cfg.narratorBorderColor : cfg.subBorderColor, 0.3) }}>
              <SubtitleText text={current.text} wordIdx={wordIdx} isSpeaking={isSpeaking} textClass={`text-white text-center ${TEXT_SIZES[cfg.textSize]}`} subMode={cfg.subMode} isNarrator={isNarrator} />
            </motion.div>
          </AnimatePresence>
        </SubtitleBox>
      )}
    </>
  );
}
