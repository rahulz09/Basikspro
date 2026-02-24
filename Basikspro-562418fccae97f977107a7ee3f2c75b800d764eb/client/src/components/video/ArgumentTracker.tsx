import { motion } from "framer-motion";

interface Props {
  dialogues: any[];
  currentIdx: number;
  speaker: "A" | "B";
  side: "left" | "right";
  activeColor: string;
  inactiveColor: string;
  size?: number; // px, default 12
}

export function ArgumentTracker({ dialogues, currentIdx, speaker, side, activeColor, inactiveColor, size = 12 }: Props) {
  const speakerDialogues = dialogues
    .map((d: any, i: number) => ({ ...d, _idx: i }))
    .filter((d: any) => d.speaker === speaker);

  if (speakerDialogues.length === 0) return null;

  return (
    <div className={`absolute ${side === "left" ? "left-2" : "right-2"} top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5 items-center`}>
      {speakerDialogues.map((d: any, i: number) => {
        const completed = d._idx < currentIdx;
        const active = d._idx === currentIdx;
        return (
          <motion.div
            key={d.id || i}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: active ? 1.3 : 1, opacity: 1 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
            className="relative"
          >
            <div
              className={`rounded-sm transition-all duration-300 ${active ? "ring-2 ring-white/80 shadow-lg" : ""}`}
              style={{
                width: size, height: size,
                backgroundColor: completed || active ? activeColor : inactiveColor,
                boxShadow: active ? `0 0 ${size}px ${activeColor}` : "none",
              }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}
