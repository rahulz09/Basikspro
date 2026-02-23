import { motion } from "framer-motion";

const HEIGHTS = [30, 60, 100, 70, 120, 50, 80, 110, 40, 90, 60, 130, 70, 50, 100];

export function WaveformBars({ color }: { color: string }) {
  return (
    <div className="flex items-end gap-px h-7">
      {HEIGHTS.map((h, i) => (
        <motion.div key={i} className={`w-[3px] rounded-full ${color}`}
          animate={{ height: [`${h * 0.3}%`, `${Math.min(100, h * 0.7)}%`, `${h * 0.3}%`] }}
          transition={{ repeat: Infinity, duration: 0.35 + i * 0.04, ease: "easeInOut" }} />
      ))}
    </div>
  );
}
