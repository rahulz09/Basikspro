import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ModelScore } from "./types";
import { playScoreReveal } from "./helpers";

interface Props {
  scores: ModelScore[]; speakerName: string; avg: number; isA: boolean;
  totalA: number; totalB: number; nameA: string; nameB: string;
}

export function ScoreCard({ scores, speakerName, avg, isA, totalA, totalB, nameA, nameB }: Props) {
  const [animScore, setAnimScore] = useState(0);

  useEffect(() => {
    playScoreReveal();
    let v = 0; const step = avg / 25;
    const t = setInterval(() => { v = Math.min(avg, +(v + step).toFixed(1)); setAnimScore(v); if (v >= avg) clearInterval(t); }, 60);
    return () => clearInterval(t);
  }, [avg]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}>
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", damping: 18, stiffness: 220 }}
        className="rounded-3xl overflow-hidden shadow-2xl w-full max-w-md mx-4"
        style={{ background: "white", backgroundImage: "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)", backgroundSize: "28px 28px" }}>

        <div className={`${isA ? "bg-blue-600" : "bg-rose-600"} px-6 py-3 flex items-center justify-between`}>
          <span className="text-white font-black text-base">{speakerName}'s Argument</span>
          <span className="text-white/80 text-xs font-bold uppercase tracking-wider">AI Score</span>
        </div>

        <div className="px-5 py-5">
          <div className="grid grid-cols-5 gap-2 mb-5">
            {scores.map((s, i) => (
              <motion.div key={s.name} className="flex flex-col items-center"
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12, type: "spring" }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center font-black text-xs text-white shadow-lg mb-1"
                  style={{ backgroundColor: s.color }}>{s.logo}</div>
                <span className="text-[9px] text-gray-500 font-semibold text-center leading-tight">{s.name}</span>
                <motion.span className="text-sm font-black text-gray-800 mt-0.5"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.12 + 0.35 }}>
                  {s.score.toFixed(1)}
                </motion.span>
                <div className="w-full mt-1.5 bg-gray-100 rounded-full overflow-hidden" style={{ height: 3 }}>
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: s.color }}
                    initial={{ width: "0%" }} animate={{ width: `${(s.score / 10) * 100}%` }}
                    transition={{ delay: i * 0.12 + 0.5, duration: 0.75, ease: "easeOut" }} />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="rounded-2xl p-4 text-center mb-4" style={{ backgroundColor: isA ? "#eff6ff" : "#fff1f2" }}>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Average Score</p>
            <motion.div className="text-5xl font-black tabular-nums" style={{ color: isA ? "#2563eb" : "#e11d48" }}
              initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: "spring", stiffness: 300 }}>
              {animScore.toFixed(1)}
            </motion.div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-xs text-blue-700 font-bold truncate">{nameA}</span>
              <span className="ml-auto text-blue-700 font-black text-sm tabular-nums">{totalA.toFixed(1)}</span>
            </div>
            <div className="flex-1 flex items-center gap-2 bg-rose-50 rounded-xl px-3 py-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-xs text-rose-700 font-bold truncate">{nameB}</span>
              <span className="ml-auto text-rose-700 font-black text-sm tabular-nums">{totalB.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
