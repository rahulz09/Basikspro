import { motion } from "framer-motion";

const HEIGHTS = [30, 60, 100, 70, 120, 50, 80, 110, 40, 90, 60, 130, 70, 50, 100];
const LINE_H  = [55, 80, 70, 90, 60, 85, 75, 90, 65, 80, 70, 55];

// Simulated audio level sequences for 2-bar VU meter (left/right channel feel)
const METER_SEQ = [
  ["15%", "82%", "55%", "93%", "38%", "70%", "20%", "88%", "45%", "15%"],
  ["22%", "60%", "91%", "40%", "78%", "30%", "85%", "50%", "72%", "22%"],
] as const;
const METER_TIMES = [0, 0.1, 0.25, 0.4, 0.52, 0.64, 0.74, 0.84, 0.93, 1] as const;

export type WaveformVariant = "bars" | "pulse" | "line" | "meter";

interface Props {
  /** Either a Tailwind bg-class (e.g. "bg-blue-400") or a hex color (e.g. "#4ade80") */
  color: string;
  variant?: WaveformVariant;
}

/** Resolve a color value usable in style.backgroundColor / style.borderColor.
 *  Accepts hex strings directly; maps common Tailwind class names to rgba. */
function resolveHex(color: string, alpha = 1): string {
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (color.includes("green"))  return `rgba(74,222,128,${alpha})`;
  if (color.includes("pink"))   return `rgba(244,114,182,${alpha})`;
  if (color.includes("blue"))   return `rgba(96,165,250,${alpha})`;
  if (color.includes("rose"))   return `rgba(251,113,133,${alpha})`;
  if (color.includes("amber"))  return `rgba(251,191,36,${alpha})`;
  if (color.includes("white"))  return `rgba(255,255,255,${alpha})`;
  return `rgba(255,255,255,${alpha})`;
}

function colorProps(color: string) {
  if (color.startsWith("#")) return { className: "", style: { backgroundColor: resolveHex(color) } };
  return { className: color, style: {} };
}

export function WaveformBars({ color, variant = "bars" }: Props) {
  const cp = colorProps(color);

  // ── Bars — multiple animated height bars ──
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

  // ── Pulse — concentric rings ──
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

  // ── Line — thin upright equalizer sticks ──
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

  // ── Meter — 2 tall vertical VU-meter bars, fill bottom→top by simulated audio level ──
  if (variant === "meter") {
    const fillColor  = resolveHex(color, 0.92);
    const trackColor = resolveHex(color, 0.12);
    const peakColor  = resolveHex(color, 1);

    return (
      <div className="flex items-end gap-2">
        {METER_SEQ.map((seq, ch) => {
          const dur = 1.6 + ch * 0.35;
          return (
            <div key={ch} className="relative rounded overflow-hidden"
              style={{ width: 14, height: 68, backgroundColor: trackColor }}>

              {/* Main fill — grows from bottom */}
              <motion.div
                className="absolute bottom-0 left-0 right-0"
                style={{
                  background: `linear-gradient(to top, ${fillColor} 0%, ${resolveHex(color, 0.7)} 60%, ${peakColor} 85%)`,
                }}
                animate={{ height: [...seq] }}
                transition={{
                  repeat: Infinity, duration: dur, ease: "linear",
                  times: [...METER_TIMES],
                }}
              />

              {/* Segment dividers — classic VU meter look */}
              {[20, 40, 60, 80].map(pct => (
                <div key={pct}
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{ bottom: `${pct}%`, height: 1.5, backgroundColor: "rgba(0,0,0,0.35)" }}
                />
              ))}

              {/* Peak hold dot */}
              <motion.div
                className="absolute left-0 right-0"
                style={{ height: 2, backgroundColor: peakColor }}
                animate={{ bottom: [...seq] }}
                transition={{
                  repeat: Infinity, duration: dur, ease: "linear",
                  times: [...METER_TIMES],
                }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  return null;
}
