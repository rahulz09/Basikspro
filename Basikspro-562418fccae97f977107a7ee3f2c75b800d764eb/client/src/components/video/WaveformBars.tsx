import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAnalyser } from "./AnalyserContext";

const HEIGHTS = [30, 60, 100, 70, 120, 50, 80, 110, 40, 90, 60, 130, 70, 50, 100];
const LINE_H  = [55, 80, 70, 90, 60, 85, 75, 90, 65, 80, 70, 55];

export type WaveformVariant = "bars" | "pulse" | "line" | "meter";

interface Props {
  /** Tailwind bg-class (e.g. "bg-blue-400") or hex (e.g. "#4ade80") */
  color: string;
  variant?: WaveformVariant;
}

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

// ── Single VU-meter bar driven by AnalyserNode (real audio) ──────────────────
function MeterBar({ color }: { color: string }) {
  const analyser = useAnalyser();
  const fillRef  = useRef<HTMLDivElement>(null);
  const peakRef  = useRef<HTMLDivElement>(null);
  const rafRef   = useRef(0);
  const dataRef  = useRef<Uint8Array | null>(null);

  // Real-audio RAF loop — updates DOM directly (no React re-render per frame)
  useEffect(() => {
    if (!analyser) return;
    if (!dataRef.current) dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    const data = dataRef.current;

    function tick() {
      analyser!.getByteFrequencyData(data);
      // RMS of frequency bins → normalised 0-1
      const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length);
      const level = Math.min(1, rms / 72); // 72 ≈ half RMS for speech
      const pct   = `${(level * 100).toFixed(1)}%`;
      if (fillRef.current) fillRef.current.style.height = pct;
      if (peakRef.current) peakRef.current.style.bottom = pct;
      rafRef.current = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser]);

  const fillColor  = resolveHex(color, 0.92);
  const trackColor = resolveHex(color, 0.12);
  const peakColor  = resolveHex(color, 1);

  // Fallback simulated animation when no analyser is available
  if (!analyser) {
    const SIM = ["12%", "78%", "50%", "92%", "35%", "68%", "20%", "85%", "45%", "12%"] as const;
    const TIMES = [0, 0.11, 0.25, 0.4, 0.53, 0.65, 0.75, 0.85, 0.93, 1] as const;
    return (
      <div className="relative rounded overflow-hidden" style={{ width: 14, height: 68, backgroundColor: trackColor }}>
        <motion.div
          ref={fillRef}
          className="absolute bottom-0 left-0 right-0"
          style={{ background: `linear-gradient(to top, ${fillColor}, ${peakColor} 85%)` }}
          animate={{ height: [...SIM] }}
          transition={{ repeat: Infinity, duration: 1.7, ease: "linear", times: [...TIMES] }}
        />
        {[25, 50, 75].map(p => (
          <div key={p} className="absolute left-0 right-0 pointer-events-none"
            style={{ bottom: `${p}%`, height: 1.5, backgroundColor: "rgba(0,0,0,0.3)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="relative rounded overflow-hidden" style={{ width: 14, height: 68, backgroundColor: trackColor }}>
      {/* Main fill — height driven by RAF above */}
      <div ref={fillRef}
        className="absolute bottom-0 left-0 right-0 transition-[height] duration-[40ms]"
        style={{ height: "0%", background: `linear-gradient(to top, ${fillColor}, ${peakColor} 85%)` }}
      />
      {/* Segment marks */}
      {[25, 50, 75].map(p => (
        <div key={p} className="absolute left-0 right-0 pointer-events-none"
          style={{ bottom: `${p}%`, height: 1.5, backgroundColor: "rgba(0,0,0,0.3)" }} />
      ))}
      {/* Peak hold dot */}
      <div ref={peakRef}
        className="absolute left-0 right-0 transition-[bottom] duration-[60ms]"
        style={{ bottom: "0%", height: 2, backgroundColor: peakColor }}
      />
    </div>
  );
}

export function WaveformBars({ color, variant = "bars" }: Props) {
  const cp = colorProps(color);

  // ── Bars ──
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

  // ── Pulse ──
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
        <motion.div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: dotColor }}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut" }} />
      </div>
    );
  }

  // ── Line — thin upright sticks ──
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

  // ── Meter — 1 tall VU bar, real audio level via AnalyserContext ──
  if (variant === "meter") {
    return <MeterBar color={color} />;
  }

  return null;
}
