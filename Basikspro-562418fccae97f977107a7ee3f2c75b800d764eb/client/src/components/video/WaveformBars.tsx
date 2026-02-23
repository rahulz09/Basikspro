import { motion } from "framer-motion";

const HEIGHTS = [30, 60, 100, 70, 120, 50, 80, 110, 40, 90, 60, 130, 70, 50, 100];

interface Props {
  color: string;
  variant?: "bars" | "pulse" | "line";
}

export function WaveformBars({ color, variant = "bars" }: Props) {
  // Bars — original animated bars
  if (variant === "bars") {
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

  // Pulse — concentric rings expanding outward
  if (variant === "pulse") {
    const borderColor = color.replace("bg-", "border-").replace("/70", "/80").replace("/60", "/80");
    return (
      <div className="relative flex items-center justify-center w-10 h-10">
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            className={`absolute rounded-full border-2 ${borderColor}`}
            initial={{ scale: 1, opacity: 0.9 }}
            animate={{ scale: 2.2 + i * 0.6, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.45, ease: "easeOut" }}
            style={{ width: 12, height: 12 }} />
        ))}
        <motion.div className={`w-3.5 h-3.5 rounded-full ${color}`}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut" }} />
      </div>
    );
  }

  // Line — sine wave columns
  if (variant === "line") {
    const COUNT = 18;
    return (
      <div className="flex items-center gap-0.5 h-7 w-20">
        {Array.from({ length: COUNT }, (_, i) => {
          const base = Math.abs(Math.sin((i / COUNT) * Math.PI)) * 80 + 10;
          return (
            <motion.div key={i} className={`w-1 rounded-full ${color}`}
              animate={{ height: [`${base * 0.25 + 4}%`, `${Math.min(100, base + 4)}%`, `${base * 0.25 + 4}%`] }}
              transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.028, ease: "easeInOut" }} />
          );
        })}
      </div>
    );
  }

  return null;
}
