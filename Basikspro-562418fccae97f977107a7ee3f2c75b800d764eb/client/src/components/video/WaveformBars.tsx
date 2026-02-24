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

// ── Bars with real audio ──────────────────────────────────────────────────────
function BarsReal({ color }: { color: string }) {
  const analyser = useAnalyser();
  const barsRef = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef(0);
  const dataRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!analyser) return;
    if (!dataRef.current) dataRef.current = new Uint8Array(analyser.frequencyBinCount);
    const data = dataRef.current;
    const smoothed = new Array(15).fill(0);

    function tick() {
      analyser!.getByteFrequencyData(data);
      for (let i = 0; i < 15; i++) {
        const bin = Math.floor(10 + i * 3.5);
        const val = Math.min(1, data[bin] / 180);
        smoothed[i] = smoothed[i] * 0.7 + val * 0.3;
        const h = 30 + smoothed[i] * 100;
        if (barsRef.current[i]) barsRef.current[i]!.style.height = `${h}%`;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser]);

  const cp = colorProps(color);

  if (!analyser) {
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

  return (
    <div className="flex items-end gap-px h-7">
      {HEIGHTS.map((_, i) => (
        <div key={i}
          ref={el => barsRef.current[i] = el}
          className={`w-[3px] rounded-full transition-[height] duration-75 ease-out ${cp.className}`}
          style={{ height: "30%", ...cp.style }} />
      ))}
    </div>
  );
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
    let smoothed = 0;
    let peakHold = 0;
    let peakTimer = 0;

    function tick() {
      analyser!.getByteFrequencyData(data);
      // Focus on speech frequencies (200Hz-4kHz range, bins ~10-60)
      const slice = data.slice(10, 60);
      const max = Math.max(...slice);
      const avg = slice.reduce((s, v) => s + v, 0) / slice.length;
      const level = Math.min(1, (max * 0.4 + avg * 0.6) / 200); // Calibrated for speech
      
      // Smooth with faster attack, slower release
      smoothed = level > smoothed ? smoothed * 0.5 + level * 0.5 : smoothed * 0.92 + level * 0.08;
      const pct = `${(smoothed * 100).toFixed(1)}%`;
      
      // Peak hold with 800ms hold time
      if (level > peakHold) {
        peakHold = level;
        peakTimer = 0;
      } else {
        peakTimer++;
        if (peakTimer > 48) peakHold *= 0.92; // Decay after hold
      }
      const peakPct = `${(peakHold * 100).toFixed(1)}%`;
      
      if (fillRef.current) fillRef.current.style.height = pct;
      if (peakRef.current) peakRef.current.style.bottom = peakPct;
      rafRef.current = requestAnimationFrame(tick);
    }
    tick();
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser]);

  const fillColor  = resolveHex(color, 0.85);
  const trackColor = resolveHex(color, 0.08);
  const peakColor  = resolveHex(color, 1);

  // Fallback simulated animation when no analyser is available
  if (!analyser) {
    const SIM = ["8%", "45%", "72%", "38%", "85%", "52%", "25%", "68%", "42%", "15%"] as const;
    const TIMES = [0, 0.12, 0.24, 0.38, 0.5, 0.62, 0.74, 0.84, 0.92, 1] as const;
    return (
      <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ width: 18, height: 80, backgroundColor: trackColor, border: `1px solid ${resolveHex(color, 0.2)}` }}>
        <motion.div
          ref={fillRef}
          className="absolute bottom-0 left-0 right-0"
          style={{ background: `linear-gradient(to top, ${fillColor}, ${peakColor} 90%)` }}
          animate={{ height: [...SIM] }}
          transition={{ repeat: Infinity, duration: 2.1, ease: "easeInOut", times: [...TIMES] }}
        />
        {[20, 40, 60, 80].map(p => (
          <div key={p} className="absolute left-0 right-0 pointer-events-none"
            style={{ bottom: `${p}%`, height: 1, backgroundColor: "rgba(0,0,0,0.25)" }} />
        ))}
        <motion.div
          className="absolute left-0 right-0"
          style={{ height: 2.5, backgroundColor: peakColor, boxShadow: `0 0 6px ${peakColor}` }}
          animate={{ bottom: [...SIM] }}
          transition={{ repeat: Infinity, duration: 2.1, ease: "easeInOut", times: [...TIMES] }}
        />
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ width: 18, height: 80, backgroundColor: trackColor, border: `1px solid ${resolveHex(color, 0.2)}` }}>
      {/* Main fill — height driven by RAF above */}
      <div ref={fillRef}
        className="absolute bottom-0 left-0 right-0 transition-[height] duration-75 ease-out"
        style={{ height: "0%", background: `linear-gradient(to top, ${fillColor}, ${peakColor} 90%)` }}
      />
      {/* Segment marks */}
      {[20, 40, 60, 80].map(p => (
        <div key={p} className="absolute left-0 right-0 pointer-events-none"
          style={{ bottom: `${p}%`, height: 1, backgroundColor: "rgba(0,0,0,0.25)" }} />
      ))}
      {/* Peak hold indicator */}
      <div ref={peakRef}
        className="absolute left-0 right-0 transition-[bottom] duration-100 ease-out"
        style={{ bottom: "0%", height: 2.5, backgroundColor: peakColor, boxShadow: `0 0 6px ${peakColor}` }}
      />
    </div>
  );
}

export function WaveformBars({ color, variant = "bars" }: Props) {
  const cp = colorProps(color);

  // ── Bars ──
  if (variant === "bars") {
    return <BarsReal color={color} />;
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
