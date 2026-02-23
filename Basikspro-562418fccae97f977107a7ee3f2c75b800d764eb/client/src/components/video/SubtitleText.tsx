import { motion, AnimatePresence } from "framer-motion";

const CHUNK_SIZE = 10;

function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]?/g) || [];
  return parts.map(s => s.trim()).filter(Boolean);
}

interface Props {
  text: string;
  wordIdx: number;
  isSpeaking: boolean;
  textClass: string;
  subMode?: "word" | "word2" | "line";
  isNarrator?: boolean;
}

export function SubtitleText({ text, wordIdx, isSpeaking, textClass, subMode, isNarrator }: Props) {
  const sentences = splitSentences(text);
  const words = text.split(" ");
  const italic = isNarrator ? " italic" : "";
  const colorClass = isNarrator ? " text-amber-200" : "";

  const useLineMode = subMode === "line" || (isNarrator && subMode !== "word" && subMode !== "word2");
  if (useLineMode) {
    if (!isSpeaking || wordIdx < 0 || sentences.length === 0) {
      return <p className={`font-bold leading-snug${italic}${colorClass} ${textClass} opacity-0 select-none`}>{"\u00A0"}</p>;
    }
    let cumWords = 0, sentIdx = sentences.length - 1;
    for (let i = 0; i < sentences.length; i++) {
      cumWords += sentences[i].split(" ").length;
      if (wordIdx <= cumWords) { sentIdx = i; break; }
    }
    return (
      <AnimatePresence mode="wait">
        <motion.p key={sentIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className={`font-bold leading-snug${italic}${colorClass} ${textClass}`}>
          {sentences[sentIdx]}
        </motion.p>
      </AnimatePresence>
    );
  }

  if (subMode === "word2") {
    const visibleCount = isSpeaking && wordIdx >= 0 ? Math.min(wordIdx, words.length) : 0;
    if (!isSpeaking || visibleCount === 0) {
      return <p className={`font-bold leading-snug${italic}${colorClass} ${textClass} opacity-0 select-none`}>{"\u00A0"}</p>;
    }
    const chunkIdx = Math.floor(Math.max(0, visibleCount - 1) / CHUNK_SIZE);
    const chunkStart = chunkIdx * CHUNK_SIZE;
    const chunkWords = words.slice(chunkStart, chunkStart + CHUNK_SIZE);
    const wordsInChunk = visibleCount - chunkStart;
    return (
      <p key={chunkIdx} className={`font-bold leading-snug${italic}${colorClass} ${textClass}`}
        style={{ animation: "subtitleChunkIn 0.18s ease" }}>
        {chunkWords.map((word, i) => (
          <span key={i} className={`transition-opacity duration-200 ${i < wordsInChunk ? "opacity-100" : "opacity-0"}`}>
            {word}{i < chunkWords.length - 1 ? " " : ""}
          </span>
        ))}
      </p>
    );
  }

  const visibleCount = isSpeaking && wordIdx >= 0 ? Math.min(wordIdx, words.length) : 0;
  return (
    <p className={`font-bold leading-snug${italic}${colorClass} ${textClass}`}>
      {words.map((word, i) => (
        <span key={i} className={`transition-opacity duration-150 ${i < visibleCount ? "opacity-100" : "opacity-0"}`}>
          {word}{i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </p>
  );
}
