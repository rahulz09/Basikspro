import { motion } from "framer-motion";
import { OverlayCfg } from "./types";

interface Props {
  cfg: OverlayCfg;
  setCfg: React.Dispatch<React.SetStateAction<OverlayCfg>>;
  children: React.ReactNode;
  extraBottom?: number;
  isA?: boolean;
  isNarrator?: boolean;
  isSpeaking?: boolean;
}

export function SubtitleBox({ cfg, setCfg, children, extraBottom = 0, isA = false, isNarrator = false, isSpeaking = false }: Props) {
  const getCanvasWidth = (el: HTMLElement): number => {
    let c: HTMLElement | null = el;
    while (c && !c.classList.contains("sub-canvas-root")) c = c.parentElement;
    return c?.getBoundingClientRect().width || 800;
  };

  const startWidthResize = (e: React.PointerEvent, side: "left" | "right") => {
    e.stopPropagation(); e.preventDefault();
    const startX = e.clientX;
    const startWidth = cfg.subWidth;
    const canvasWidth = getCanvasWidth(e.currentTarget as HTMLElement);
    const onMove = (me: PointerEvent) => {
      const dx = me.clientX - startX;
      const dxPct = (dx / canvasWidth) * 100;
      const newW = Math.max(15, Math.min(100, startWidth + (side === "right" ? dxPct * 2 : -dxPct * 2)));
      setCfg(c => ({ ...c, subWidth: +newW.toFixed(1) }));
    };
    const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const startHeightResize = (e: React.PointerEvent) => {
    e.stopPropagation(); e.preventDefault();
    const startY = e.clientY;
    const startH = cfg.subHeight;
    const onMove = (me: PointerEvent) => {
      const dy = startY - me.clientY;
      const newH = Math.max(40, Math.min(500, startH + dy));
      setCfg(c => ({ ...c, subHeight: +newH.toFixed(1) }));
    };
    const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <motion.div drag dragMomentum={false} dragElastic={0}
      className="absolute z-20 group"
      style={{ bottom: `calc(${cfg.subBottom}% + ${extraBottom}px)`, left: "50%", translateX: "-50%", width: `${cfg.subWidth}%`, maxWidth: 960 }}>

      <div className="relative cursor-move"
        style={cfg.subHeight > 0 ? { minHeight: cfg.subHeight } : undefined}>

        {children}

        {/* Pointer line toward active speaker */}
        {cfg.showPointerLine && !isNarrator && isSpeaking && (
          <div className="absolute pointer-events-none"
            style={{
              bottom: "50%",
              [isA ? "right" : "left"]: "100%",
              width: "120%",
              height: 2,
              background: `linear-gradient(to ${isA ? "left" : "right"}, ${isA ? "rgba(96,165,250,0.8)" : "rgba(251,113,133,0.8)"}, transparent)`,
              borderRadius: 2,
            }}
          />
        )}

        {/* Top-center height handle */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 z-40 cursor-ns-resize opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onPointerDown={startHeightResize} style={{ touchAction: "none" }}>
          <div className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-md bg-white/30 hover:bg-white/60 border border-white/40 hover:border-white/80 backdrop-blur-sm transition-all shadow">
            <div className="w-6 h-0.5 rounded-full bg-white/90" />
            <div className="w-4 h-0.5 rounded-full bg-white/70" />
          </div>
        </div>

        {/* Bottom-left width handle */}
        <div className="absolute bottom-1 left-1 z-40 w-5 h-5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/30 hover:bg-white/70 border border-white/40 hover:border-white/80 backdrop-blur-sm shadow flex items-center justify-center"
          onPointerDown={e => startWidthResize(e, "left")} style={{ touchAction: "none", cursor: "nesw-resize" }}>
          <svg width="8" height="8" viewBox="0 0 8 8" className="text-white"><path d="M0 8 L8 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M0 4 L4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/></svg>
        </div>

        {/* Bottom-right width handle */}
        <div className="absolute bottom-1 right-1 z-40 w-5 h-5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/30 hover:bg-white/70 border border-white/40 hover:border-white/80 backdrop-blur-sm shadow flex items-center justify-center"
          onPointerDown={e => startWidthResize(e, "right")} style={{ touchAction: "none", cursor: "nwse-resize" }}>
          <svg width="8" height="8" viewBox="0 0 8 8" className="text-white"><path d="M8 8 L0 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 4 L4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/></svg>
        </div>
      </div>
    </motion.div>
  );
}
