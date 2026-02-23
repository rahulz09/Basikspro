import { motion } from "framer-motion";

const HEIGHTS = [30, 60, 100, 70, 120, 50, 80, 110, 40, 90, 60, 130, 70, 50, 100];
const LINE_H  = [55, 80, 70, 90, 60, 85, 75, 90, 65, 80, 70, 55];

interface Props {
  /** Either a Tailwind bg-class (e.g. "bg-blue-400") or a hex color (e.g. "#4ade80") */
  color: string;
  variant?: "bars" | "pulse" | "line";
}

/** Resolve a color value usable in style.backgroundColor / style.borderColor.
 *  Accepts hex strings directly; maps common Tailwind class names to rgba. */
function resolveHex(color: string, alpha = 1): string {
  if (color.startsWith("#")) {
    // Parse 6-digit hex and apply alpha
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  // Tailwind class → approximate rgba
  if (color.includes("green"))  return `rgba(74,222,128,${alpha})`;
  if (color.includes("pink"))   return `rgba(244,114,182,${alpha})`;
  if (color.includes("blue"))   return `rgba(96,165,250,${alpha})`;
  if (color.includes("rose"))   return `rgba(251,113,133,${alpha})`;
  if (color.includes("amber"))  return `rgba(251,191,36,${alpha})`;
  if (color.includes("white"))  return `rgba(255,255,255,${alpha})`;
  return `rgba(255,255,255,${alpha})`;
}

/** For bars / line variants: className for a Tailwind color, or undefined + inline style for hex. */
function colorProps(color: string) {
  if (color.startsWith("#")) {
    return { className: "", style: { backgroundColor: resolveHex(color) } };
  }
  return { className: color, style: {} };
}

export function WaveformBars({ color, variant = "bars" }: Props) {
  const cp = colorProps(color);

  // ── Bars — original animated bars ──
  if (variant === "bars") {
    return (
      <div className="flex items-end gap-px h-7">
        {HEIGHTS.map((h, i) => (
          <motion.div key={i}
            className={`w-[3px] rounded-full ${cp.className}`}
            style={cp.style}
            animate={{ height: [`${h * 0.3}%`, `${Math.min(100, h * 0.7)}%`, `${h * 0.3}%`] }}
            transition={{ repeat: Infinity, duration: 0.35 + i * 0.04, ease: "easeInOut" }} />
        ))}
      </div>
    );
  }

  // ── Pulse — concentric rings expanding outward ──
  if (variant === "pulse") {
    const ringColor = resolveHex(color, 0.85);
    const dotColor  = resolveHex(color, 0.95);
    return (
      <div className="relative flex items-center justify-center w-10 h-10">
        {[0, 1, 2].map(i => (
          <motion.div key={i}
            className="absolute rounded-full border-2"
            style={{ borderColor: ringColor, width: 12, height: 12 }}
            initial={{ scale: 1, opacity: 0.9 }}
            animate={{ scale: 2.2 + i * 0.6, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.45, ease: "easeOut" }} />
        ))}
        <motion.div
          className="w-3.5 h-3.5 rounded-full"
          style={{ backgroundColor: dotColor }}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut" }} />
      </div>
    );
  }

  // ── Line — thin vertical sticks (equalizer look) ──
  if (variant === "line") {
    return (
      <div className="flex items-end gap-[3px] h-7 w-[72px]">
        {LINE_H.map((h, i) => (
          <motion.div key={i}
            className={`w-[3px] rounded-sm ${cp.className}`}
            style={cp.style}
            animate={{ height: [`${h * 0.15}%`, `${h}%`, `${h * 0.15}%`] }}
            transition={{ repeat: Infinity, duration: 0.45 + i * 0.035, ease: "easeInOut" }} />
        ))}
      </div>
    );
  }

  return null;
}
