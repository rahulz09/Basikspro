import { motion } from "framer-motion";
import { CP } from "../types";
import { fmt, hexToRgba } from "../helpers";
import { TEXT_SIZES } from "../constants";
import { WaveformBars } from "../WaveformBars";
import { SubtitleText } from "../SubtitleText";

export function Style3({ project, current, isA, isNarrator, cfg, timerSeconds, isSpeaking, totA, totB, wordIdx }: CP) {
  const activeName = isNarrator ? project.speakerNarratorName : isA ? project.speakerAName : project.speakerBName;
  const activeRole = isNarrator ? "NARRATOR" : isA ? cfg.roleA : cfg.roleB;

  return (
    <>
      <motion.div drag dragMomentum={false} className="absolute top-4 left-4 z-20 cursor-move flex items-center gap-2">
        <div className="flex items-center gap-1.5 bg-red-600 px-3 py-1 rounded">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-white font-black text-xs tracking-wider">LIVE</span>
        </div>
        {cfg.showTimer && !isNarrator && (
          <div className="bg-black/80 backdrop-blur px-3 py-1 rounded font-mono text-white font-bold text-sm tabular-nums">{fmt(timerSeconds)}</div>
        )}
      </motion.div>

      {cfg.showTopic && (
        <motion.div drag dragMomentum={false} className="absolute top-4 right-4 z-20 cursor-move">
          <div className="bg-white/95 px-4 py-1.5 rounded shadow-lg">
            <span className="text-gray-900 font-black text-xs tracking-wider uppercase">{project.topic}</span>
          </div>
        </motion.div>
      )}

      {cfg.showWaveform && isSpeaking && (
        <motion.div drag dragMomentum={false} className={`absolute top-1/2 -translate-y-1/2 z-20 cursor-move ${isA ? "left-5" : "right-5"}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <WaveformBars color={isA ? "bg-blue-400" : "bg-rose-400"} />
        </motion.div>
      )}

      <motion.div drag dragMomentum={false} className="absolute bottom-12 left-0 right-0 z-20 cursor-move">
        <div className="flex flex-col">
          <div className="flex items-stretch">
            <div className={`${isNarrator ? "bg-amber-600" : isA ? "bg-blue-600" : "bg-rose-600"} px-4 py-2`}>
              <p className="text-white font-black text-sm">{activeName}</p>
              <p className="text-white/70 text-[10px] font-bold tracking-wider">{activeRole}</p>
            </div>
            {cfg.showTranscript && current.text && (
              <div className="flex-1 backdrop-blur px-4 py-2 flex items-center"
                style={{ backgroundColor: hexToRgba(isNarrator ? cfg.narratorColor : cfg.subColor, cfg.subBgOpacity / 100) }}>
                <SubtitleText text={current.text} wordIdx={wordIdx} isSpeaking={isSpeaking} textClass={`text-white font-semibold leading-snug ${TEXT_SIZES[cfg.textSize]}`} subMode={cfg.subMode} isNarrator={isNarrator} />
              </div>
            )}
          </div>
          {cfg.showScores && (
            <div className="flex text-xs">
              <div className="bg-blue-800/90 px-4 py-1 flex items-center gap-2"><span className="text-blue-200 font-bold">{project.speakerAName}</span><span className="text-white font-black tabular-nums">{totA.toFixed(1)}</span></div>
              <div className="bg-gray-800/90 px-2 py-1 flex items-center"><span className="text-gray-400 font-bold">VS</span></div>
              <div className="bg-rose-800/90 px-4 py-1 flex items-center gap-2"><span className="text-rose-200 font-bold">{project.speakerBName}</span><span className="text-white font-black tabular-nums">{totB.toFixed(1)}</span></div>
              <div className="flex-1 bg-gray-900/90 px-3 py-1 flex items-center"><span className="text-gray-500 text-[9px] tracking-wider">GEMINI · CLAUDE · ELEVENLABS · DEEPSEEK · GROK AVG</span></div>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
