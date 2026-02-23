import { motion, AnimatePresence } from "framer-motion";
import { CP } from "../types";
import { fmt, hexToRgba } from "../helpers";
import { BOX_PAD, TEXT_SIZES } from "../constants";
import { WaveformBars } from "../WaveformBars";
import { SubtitleBox } from "../SubtitleBox";
import { SubtitleText } from "../SubtitleText";
import { ArgumentTracker } from "../ArgumentTracker";

const FONT_MAP: Record<string, string> = {
  impact: "'Impact','Arial Narrow',sans-serif",
  sans:   "'Inter','Helvetica Neue',sans-serif",
  serif:  "Georgia,'Times New Roman',serif",
  mono:   "'Courier New',Courier,monospace",
};

export function Style7({ project, current, isA, isNarrator, cfg, timerSeconds, isSpeaking, totA, totB, wordIdx, setCfg }: CP) {
  const dialogues: any[] = project.dialogues || [];
  const currentIdx = dialogues.findIndex((d: any) => d.text === current.text && d.speaker === current.speaker);
  const fontFamily = FONT_MAP[cfg.fontStyle || "impact"];
  const nameGap = cfg.nameGap ?? 16;

  // Speaker accent colors (configurable, fall back to defaults)
  const colorA = cfg.colorA || "#4ade80";
  const colorB = cfg.colorB || "#f472b6";
  const glowStrength = (cfg.nameGlowIntensity ?? 70) / 100;

  // Derive dark background for score boxes from speaker colors
  const bgA = hexToRgba(colorA, 0.18);
  const bgB = hexToRgba(colorB, 0.18);
  const borderA = hexToRgba(colorA, 0.6);
  const borderB = hexToRgba(colorB, 0.6);

  // Glow for active name — scaled by glowStrength
  const glowA = glowStrength > 0
    ? `0 0 ${Math.round(10 * glowStrength)}px ${colorA}, 0 0 ${Math.round(24 * glowStrength)}px ${hexToRgba(colorA, 0.5)}`
    : "none";
  const glowB = glowStrength > 0
    ? `0 0 ${Math.round(10 * glowStrength)}px ${colorB}, 0 0 ${Math.round(24 * glowStrength)}px ${hexToRgba(colorB, 0.5)}`
    : "none";

  return (
    <>
      {/* Subtle color gradient tint matching active speaker */}
      <motion.div className="absolute inset-0 z-10 pointer-events-none"
        animate={{ background: isA && isSpeaking
          ? `linear-gradient(to right, ${hexToRgba(colorA, 0.10)}, rgba(0,0,0,0) 55%)`
          : !isA && isSpeaking
          ? `linear-gradient(to left, ${hexToRgba(colorB, 0.10)}, rgba(0,0,0,0) 55%)`
          : "none" }}
        transition={{ duration: 0.6 }} />

      {/* ── TOP BAR ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-stretch justify-between pointer-events-none">

        {/* LEFT: Score A (+ timer when A is speaking) */}
        <motion.div drag dragMomentum={false} className="pointer-events-auto flex items-stretch cursor-move">
          {cfg.showScores && (
            <motion.div
              animate={{ boxShadow: isA && isSpeaking ? `0 0 20px 2px ${hexToRgba(colorA, 0.45)}` : "none" }}
              className="flex items-center gap-2 px-3 py-2 font-black text-white text-xl sm:text-2xl tabular-nums select-none"
              style={{ backgroundColor: bgA, border: `1px solid ${borderA}`, fontFamily }}>
              <span style={{ color: colorA }}>{totA.toFixed(0)}</span>
              {cfg.showTimer && !isNarrator && isA && isSpeaking && (
                <span className="text-sm sm:text-base font-bold tabular-nums italic" style={{ color: hexToRgba(colorA, 0.7) }}>{fmt(timerSeconds)}</span>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* CENTER: Speaker names with active glow / inactive dim */}
        {cfg.showTopic && (
          <motion.div drag dragMomentum={false} className="pointer-events-auto flex items-center cursor-move"
            style={{ gap: nameGap }}>

            {/* Speaker A name */}
            <motion.span
              animate={{
                opacity: isSpeaking ? (isA ? 1 : 0.35) : 0.65,
                textShadow: isA && isSpeaking ? glowA : "none",
                scale: isA && isSpeaking ? 1.06 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="font-black text-lg sm:text-2xl md:text-3xl uppercase tracking-wide select-none drop-shadow-sm"
              style={{ fontFamily, color: colorA }}>
              {project.speakerAName}
            </motion.span>

            {/* Speaker B name */}
            <motion.span
              animate={{
                opacity: isSpeaking ? (!isA ? 1 : 0.35) : 0.65,
                textShadow: !isA && isSpeaking ? glowB : "none",
                scale: !isA && isSpeaking ? 1.06 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="font-black text-lg sm:text-2xl md:text-3xl uppercase tracking-wide select-none drop-shadow-sm"
              style={{ fontFamily, color: colorB }}>
              {project.speakerBName}
            </motion.span>
          </motion.div>
        )}

        {/* RIGHT: Score B (+ timer when B is speaking) */}
        <motion.div drag dragMomentum={false} className="pointer-events-auto flex items-stretch cursor-move">
          {cfg.showScores && (
            <motion.div
              animate={{ boxShadow: !isA && isSpeaking ? `0 0 20px 2px ${hexToRgba(colorB, 0.45)}` : "none" }}
              className="flex items-center gap-2 px-3 py-2 font-black text-white text-xl sm:text-2xl tabular-nums select-none"
              style={{ backgroundColor: bgB, border: `1px solid ${borderB}`, fontFamily }}>
              {cfg.showTimer && !isNarrator && !isA && isSpeaking && (
                <span className="text-sm sm:text-base font-bold tabular-nums italic" style={{ color: hexToRgba(colorB, 0.7) }}>{fmt(timerSeconds)}</span>
              )}
              <span style={{ color: colorB }}>{totB.toFixed(0)}</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Argument tracker — left (A) */}
      {cfg.showArgTracker !== false && (
        <ArgumentTracker
          dialogues={dialogues} currentIdx={currentIdx}
          speaker="A" side="left"
          activeColor={hexToRgba(colorA, 0.9)}
          inactiveColor={hexToRgba(colorA, 0.18)}
        />
      )}

      {/* Argument tracker — right (B) */}
      {cfg.showArgTracker !== false && (
        <ArgumentTracker
          dialogues={dialogues} currentIdx={currentIdx}
          speaker="B" side="right"
          activeColor={hexToRgba(colorB, 0.9)}
          inactiveColor={hexToRgba(colorB, 0.18)}
        />
      )}

      {/* Waveform */}
      {cfg.showWaveform && isSpeaking && !isNarrator && (
        <motion.div drag dragMomentum={false}
          className="absolute bottom-[30%] z-20 cursor-move pointer-events-auto"
          style={{ [isA ? "left" : "right"]: "8%" }}>
          <WaveformBars
            color={isA ? colorA : colorB}
            variant={cfg.waveformStyle || "bars"}
          />
        </motion.div>
      )}

      {/* Subtitle */}
      {cfg.showTranscript && current.text && (
        <SubtitleBox cfg={cfg} setCfg={setCfg} isA={isA} isNarrator={isNarrator} isSpeaking={isSpeaking}>
          <AnimatePresence mode="wait">
            <motion.div key={current.text}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
              className={`${BOX_PAD[cfg.textSize]} rounded-lg border-2 backdrop-blur-lg`}
              style={{
                backgroundColor: hexToRgba(isNarrator ? cfg.narratorColor : (isA ? "#052e16" : "#4c0519"), cfg.subBgOpacity / 100),
                borderColor: isNarrator ? cfg.narratorBorderColor : hexToRgba(isA ? colorA : colorB, 0.55),
                boxShadow: isSpeaking && !isNarrator
                  ? `0 0 16px ${hexToRgba(isA ? colorA : colorB, 0.3)}`
                  : "none",
                fontFamily,
              }}>
              <SubtitleText text={current.text} wordIdx={wordIdx} isSpeaking={isSpeaking}
                textClass={`text-white leading-snug font-bold uppercase tracking-wide ${TEXT_SIZES[cfg.textSize]}`}
                subMode={cfg.subMode} isNarrator={isNarrator} />
            </motion.div>
          </AnimatePresence>
        </SubtitleBox>
      )}
    </>
  );
}
