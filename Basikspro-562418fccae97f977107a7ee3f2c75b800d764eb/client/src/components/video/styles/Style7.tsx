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

  // Active speaker colors
  const colorA = "#4ade80"; // green
  const colorB = "#f472b6"; // pink
  const activeColor = isA ? colorA : colorB;
  const bgA = "rgba(22,101,52,0.85)";   // dark green box
  const bgB = "rgba(127,29,29,0.85)";   // dark red box

  return (
    <>
      {/* Subtle color gradient tint matching active speaker */}
      <motion.div className="absolute inset-0 z-10 pointer-events-none"
        animate={{ background: isA && isSpeaking
          ? "linear-gradient(to right, rgba(22,163,74,0.12), rgba(0,0,0,0) 50%)"
          : !isA && isSpeaking
          ? "linear-gradient(to left, rgba(190,18,60,0.12), rgba(0,0,0,0) 50%)"
          : "none" }}
        transition={{ duration: 0.6 }} />

      {/* ── TOP BAR ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-stretch justify-between pointer-events-none">

        {/* LEFT: Score A (+ timer when A is speaking) */}
        <motion.div drag dragMomentum={false} className="pointer-events-auto flex items-stretch cursor-move">
          {cfg.showScores && (
            <motion.div
              animate={{ boxShadow: isA && isSpeaking ? `0 0 24px 4px rgba(74,222,128,0.5)` : "none" }}
              className="flex items-center gap-2 px-3 py-2 font-black text-white text-xl sm:text-2xl tabular-nums select-none"
              style={{ backgroundColor: bgA, fontFamily }}>
              <span>{totA.toFixed(0)}</span>
              {cfg.showTimer && !isNarrator && isA && isSpeaking && (
                <span className="text-sm sm:text-base font-bold text-green-200/80 tabular-nums italic">{fmt(timerSeconds)}</span>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* CENTER: Speaker names with active glow / inactive ghost */}
        {cfg.showTopic && (
          <motion.div drag dragMomentum={false} className="pointer-events-auto flex items-center cursor-move"
            style={{ gap: nameGap }}>
            {/* Speaker A name */}
            <motion.span
              animate={{
                opacity: (!isSpeaking || isA) ? 1 : 0.25,
                textShadow: isA && isSpeaking
                  ? `0 0 12px ${colorA}, 0 0 28px ${colorA}88, 0 0 4px #fff`
                  : "none",
                WebkitTextStroke: !isSpeaking || isA ? "0px" : `1.5px ${colorA}55`,
              }}
              transition={{ duration: 0.35 }}
              className="font-black text-lg sm:text-2xl md:text-3xl uppercase tracking-wide select-none"
              style={{
                fontFamily,
                color: isA && isSpeaking ? colorA : `${colorA}88`,
                WebkitTextFillColor: !isSpeaking || isA ? undefined : "transparent",
              }}>
              {project.speakerAName}
            </motion.span>

            {/* Speaker B name */}
            <motion.span
              animate={{
                opacity: (!isSpeaking || !isA) ? 1 : 0.25,
                textShadow: !isA && isSpeaking
                  ? `0 0 12px ${colorB}, 0 0 28px ${colorB}88, 0 0 4px #fff`
                  : "none",
                WebkitTextStroke: !isSpeaking || !isA ? "0px" : `1.5px ${colorB}55`,
              }}
              transition={{ duration: 0.35 }}
              className="font-black text-lg sm:text-2xl md:text-3xl uppercase tracking-wide select-none"
              style={{
                fontFamily,
                color: !isA && isSpeaking ? colorB : `${colorB}88`,
                WebkitTextFillColor: !isSpeaking || !isA ? undefined : "transparent",
              }}>
              {project.speakerBName}
            </motion.span>
          </motion.div>
        )}

        {/* RIGHT: Score B (+ timer when B is speaking) */}
        <motion.div drag dragMomentum={false} className="pointer-events-auto flex items-stretch cursor-move">
          {cfg.showScores && (
            <motion.div
              animate={{ boxShadow: !isA && isSpeaking ? `0 0 24px 4px rgba(244,114,182,0.5)` : "none" }}
              className="flex items-center gap-2 px-3 py-2 font-black text-white text-xl sm:text-2xl tabular-nums select-none"
              style={{ backgroundColor: bgB, fontFamily }}>
              {cfg.showTimer && !isNarrator && !isA && isSpeaking && (
                <span className="text-sm sm:text-base font-bold text-pink-200/80 tabular-nums italic">{fmt(timerSeconds)}</span>
              )}
              <span>{totB.toFixed(0)}</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Argument tracker — left (A) */}
      <ArgumentTracker
        dialogues={dialogues} currentIdx={currentIdx}
        speaker="A" side="left"
        activeColor="rgba(74,222,128,0.9)"
        inactiveColor="rgba(74,222,128,0.18)"
      />

      {/* Argument tracker — right (B) */}
      <ArgumentTracker
        dialogues={dialogues} currentIdx={currentIdx}
        speaker="B" side="right"
        activeColor="rgba(244,114,182,0.9)"
        inactiveColor="rgba(244,114,182,0.18)"
      />

      {/* Waveform */}
      {cfg.showWaveform && isSpeaking && !isNarrator && (
        <motion.div drag dragMomentum={false}
          className="absolute bottom-[30%] z-20 cursor-move pointer-events-auto"
          style={{ [isA ? "left" : "right"]: "8%" }}>
          <WaveformBars
            color={isA ? "bg-green-400/70" : "bg-pink-400/70"}
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
                borderColor: isNarrator ? cfg.narratorBorderColor : (isA ? colorA + "88" : colorB + "88"),
                boxShadow: isSpeaking && !isNarrator
                  ? `0 0 18px ${isA ? colorA + "44" : colorB + "44"}`
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
