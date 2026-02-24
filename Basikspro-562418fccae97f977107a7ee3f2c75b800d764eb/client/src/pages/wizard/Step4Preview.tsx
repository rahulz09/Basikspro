import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Play, Square, Image as ImageIcon,
  Clapperboard, Settings2, Palette, Type, Eye, Radio, Users,
  Maximize2, LayoutTemplate, ChevronDown, CopyCheck, RotateCcw
} from "lucide-react";
import { useUpdateProject } from "@/hooks/use-projects";
import { OverlayCfg, Phase, TextSize, CP } from "@/components/video/types";
import { DEMO_BG } from "@/components/video/constants";
import {
  dialogueDuration, fmt, genScores, getAC, unlockAudio,
  playTransition, playCountdownBeep, getOrCreateMediaSource, getMediaAnalyser
} from "@/components/video/helpers";
import { AnalyserContext } from "@/components/video/AnalyserContext";
import { ScoreCard } from "@/components/video/ScoreCard";
import { Style1 } from "@/components/video/styles/Style1";
import { Style2 } from "@/components/video/styles/Style2";
import { Style3 } from "@/components/video/styles/Style3";
import { Style4 } from "@/components/video/styles/Style4";
import { Style5 } from "@/components/video/styles/Style5";
import { Style6 } from "@/components/video/styles/Style6";
import { Style7 } from "@/components/video/styles/Style7";

type TabId = "general" | "subtitles" | "names" | "colors" | "waveform" | "visibility";
type SegmentCfg = { style: 1 | 2 | 3 | 4 | 5 | 6 | 7; bgImage?: string };

const DEFAULT_CFG: OverlayCfg = {
  roleA: "SUPPORTER", roleB: "OPPONENT", textSize: "medium",
  showScores: true, showScoreCard: true, showTimer: true, showTopic: true, showWaveform: true,
  showTranscript: true, showNarrator: true, showPointerLine: false, pointerLineSide: "auto",
  bgOpacity: 100, subBottom: 12, subWidth: 80, subHeight: 0, subBgOpacity: 80,
  speakerAImage: "", speakerBImage: "",
  subMode: "word", subColor: "#0a0a14", subBorderColor: "#ffffff",
  narratorColor: "#451a03", narratorBorderColor: "#f59e0b",
  scoreCardStyle: "bar", waveformStyle: "bars", nameGap: 16, fontStyle: "impact",
  colorA: "#4ade80", colorB: "#f472b6", nameGlowIntensity: 70, showArgTracker: true,
  argTrackerSize: 12, nameSize: 24, waveformPosition: "bottom", waveformSize: 100,
  subBorderRadius: 12, subPadding: 16, subFontSize: 16,
  nameFontWeight: 700, showNameBackground: true, nameBackgroundOpacity: 80,
};

const STYLE_NAMES = ["", "Panel", "Bar", "News", "Arena", "Split", "Podcast", "Debate"];
const TABS: { id: TabId; label: string; icon: any }[] = [
  { id: "general",    label: "General",    icon: Settings2 },
  { id: "subtitles",  label: "Subtitles",  icon: Type },
  { id: "names",      label: "Names",      icon: Users },
  { id: "colors",     label: "Colors",     icon: Palette },
  { id: "waveform",   label: "Waveform",   icon: Radio },
  { id: "visibility", label: "Visibility", icon: Eye },
];

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`w-9 h-[18px] rounded-full relative transition-all shrink-0 ${on ? "bg-primary" : "bg-white/20"}`}>
      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all ${on ? "left-[18px]" : "left-[2px]"}`} />
    </button>
  );
}

function Slider({ label, min, max, value, onChange, unit = "" }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-300 tabular-nums font-mono">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(parseInt(e.target.value))} className="w-full accent-primary h-1.5 cursor-pointer" />
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-gray-400">{label}</span>
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0" />
        <span className="text-[9px] text-gray-400 font-mono">{value}</span>
      </div>
    </div>
  );
}

export function Step4Preview({ project }: { project: any }) {
  const dialogues: any[] = [...(project.dialogues || [])].sort((a, b) => a.sequence - b.sequence);
  const upd = useUpdateProject();
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(new Audio());
  const spkAImgRef = useRef<HTMLInputElement>(null);
  const spkBImgRef = useRef<HTMLInputElement>(null);
  const wordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const segBgRefs = useRef<Map<number, HTMLInputElement>>(new Map());
  const timelineRef = useRef<HTMLDivElement>(null);
  const showScoreCardRef = useRef(true);

  // Core playback state
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(0);
  const [audioPlayFailed, setAudioPlayFailed] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [wordIdx, setWordIdx] = useState(-1);
  const [audioRemaining, setAudioRemaining] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Global style & bg (defaults)
  const [style, setStyle] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [bg, setBg] = useState(project.backgroundImage || DEMO_BG);
  const [cfg, setCfg] = useState<OverlayCfg>(DEFAULT_CFG);
  // Keep ref in sync so audio onended closure always reads latest value
  showScoreCardRef.current = cfg.showScoreCard;

  // Per-segment overrides
  const [segmentCfg, setSegmentCfg] = useState<Map<number, SegmentCfg>>(new Map());
  const [activeSegPopup, setActiveSegPopup] = useState<number | null>(null); // dialogueId

  // Editor UI state
  const [activeTab, setActiveTab] = useState<TabId>("general");

  // Editable speaker names
  const [nameA, setNameA] = useState(project.speakerAName || "Speaker A");
  const [nameB, setNameB] = useState(project.speakerBName || "Speaker B");
  const [nameN, setNameN] = useState(project.speakerNarratorName || "Narrator");
  const saveNameA = () => { if (nameA !== project.speakerAName) upd.mutate({ id: project.id, speakerAName: nameA }); };
  const saveNameB = () => { if (nameB !== project.speakerBName) upd.mutate({ id: project.id, speakerBName: nameB }); };
  const saveNameN = () => { if (nameN !== project.speakerNarratorName) upd.mutate({ id: project.id, speakerNarratorName: nameN }); };

  // Effective style/bg for current dialogue (per-segment override or global)
  const currentDialogueId = dialogues[idx]?.id;
  const effectiveStyle = segmentCfg.get(currentDialogueId)?.style ?? style;
  const effectiveBg = segmentCfg.get(currentDialogueId)?.bgImage ?? bg;

  const set = useCallback(<K extends keyof OverlayCfg>(k: K, v: OverlayCfg[K]) => setCfg(c => ({ ...c, [k]: v })), []);

  const setSegStyle = (dialogueId: number, s: 1 | 2 | 3 | 4 | 5 | 6 | 7) =>
    setSegmentCfg(prev => { const m = new Map(prev); m.set(dialogueId, { ...m.get(dialogueId), style: s } as SegmentCfg); return m; });

  const setSegBg = (dialogueId: number, url: string) =>
    setSegmentCfg(prev => { const m = new Map(prev); m.set(dialogueId, { ...m.get(dialogueId), bgImage: url } as SegmentCfg); return m; });

  const clearSegBg = (dialogueId: number) =>
    setSegmentCfg(prev => { const m = new Map(prev); const cur = m.get(dialogueId); if (cur) { const { bgImage: _, ...rest } = cur; m.set(dialogueId, rest as SegmentCfg); } return m; });

  const applySegToAll = (dialogueId: number) => {
    const src = segmentCfg.get(dialogueId);
    if (!src) return;
    setSegmentCfg(prev => { const m = new Map(prev); dialogues.forEach(d => m.set(d.id, { ...src })); return m; });
  };

  const resetAllSegments = () => setSegmentCfg(new Map());

  // Scores
  const scoreData = useMemo(() => dialogues.map(d => {
    const ms = genScores(d.text);
    return { modelScores: ms, avg: +(ms.reduce((s: number, m: any) => s + m.score, 0) / ms.length).toFixed(1), speaker: d.speaker };
  }), [dialogues]);

  const completedTill = phase === "scoring" ? idx : idx - 1;
  const totA = useMemo(() => scoreData.filter((_: any, i: number) => i <= completedTill && scoreData[i].speaker === "A").reduce((s: number, d: any) => +(s + d.avg).toFixed(1), 0), [scoreData, completedTill]);
  const totB = useMemo(() => scoreData.filter((_: any, i: number) => i <= completedTill && scoreData[i].speaker === "B").reduce((s: number, d: any) => +(s + d.avg).toFixed(1), 0), [scoreData, completedTill]);

  const current = dialogues[idx] || { text: "", speaker: "A" };
  const isA = current.speaker === "A";
  const isNarrator = current.speaker === "N";
  const currentIsNarrator = dialogues[idx]?.speaker === "N";
  const currentHasAudio = !!dialogues[idx]?.audioUrl;

  const nextNonNarr = (from: number) => {
    let i = from;
    while (i < dialogues.length && !cfg.showNarrator && dialogues[i]?.speaker === "N") i++;
    return i;
  };

  // Phase state machine
  useEffect(() => {
    if (phase === "idle") return;
    if (phase === "speaking" && currentIsNarrator && !cfg.showNarrator) {
      const next = nextNonNarr(idx + 1);
      if (next >= dialogues.length) { setPhase("idle"); return; }
      setIdx(next); setCountdown(dialogueDuration(dialogues[next].text)); setAudioPlayFailed(false); return;
    }
    if (phase === "speaking") {
      if (currentHasAudio && !audioPlayFailed) return;
      if (countdown <= 0) {
        if (currentIsNarrator) {
          const next = nextNonNarr(idx + 1);
          if (next >= dialogues.length) { setPhase("idle"); return; }
          setIdx(next); setCountdown(dialogueDuration(dialogues[next].text)); playTransition(); return;
        }
        if (!cfg.showScores || !cfg.showScoreCard) {
          const next = nextNonNarr(idx + 1);
          if (next >= dialogues.length) { setPhase("idle"); return; }
          setIdx(next); setCountdown(dialogueDuration(dialogues[next].text)); setAudioPlayFailed(false); playTransition(); return;
        }
        setPhase("scoring"); return;
      }
      if (countdown <= 3) playCountdownBeep();
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (phase === "scoring") {
      const t = setTimeout(() => {
        const next = nextNonNarr(idx + 1);
        if (next >= dialogues.length) { setPhase("idle"); return; }
        setIdx(next); setCountdown(dialogueDuration(dialogues[next].text)); setAudioPlayFailed(false); playTransition(); setPhase("speaking");
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [phase, countdown, idx, currentIsNarrator, currentHasAudio, dialogues, audioPlayFailed, cfg.showNarrator, cfg.showScores, cfg.showScoreCard]);

  // Word-by-word subtitle
  useEffect(() => {
    if (wordTimerRef.current) clearInterval(wordTimerRef.current);
    if (phase === "speaking" && current.text && (!currentHasAudio || audioPlayFailed)) {
      const words = current.text.split(" ");
      const msPerWord = Math.max(150, (dialogueDuration(current.text) * 1000) / words.length);
      setWordIdx(0); let w = 0;
      wordTimerRef.current = setInterval(() => { w++; setWordIdx(w); if (w >= words.length && wordTimerRef.current) clearInterval(wordTimerRef.current); }, msPerWord);
    } else if (phase !== "speaking") setWordIdx(-1);
    return () => { if (wordTimerRef.current) clearInterval(wordTimerRef.current); };
  }, [phase, idx, currentHasAudio, audioPlayFailed]);

  // Audio playback
  useEffect(() => {
    const audio = previewAudioRef.current;
    audio.pause(); audio.ontimeupdate = null; audio.onended = null; audio.onerror = null; setAudioRemaining(0);
    if (phase !== "speaking") return;
    const dl = dialogues[idx];
    if (!dl?.audioUrl) return;
    const isN = dl.speaker === "N";
    const words = dl.text.split(" ");
    audio.ontimeupdate = () => {
      const dur = audio.duration || 1; const ct = audio.currentTime;
      setAudioRemaining(Math.max(0, Math.round(dur - ct)));
      setWordIdx(Math.min(words.length, Math.ceil((ct / dur) * words.length)));
    };
    audio.onended = () => {
      setAudioRemaining(0); setWordIdx(words.length);
      if (isN) {
        const next = idx + 1;
        if (next >= dialogues.length) { setPhase("idle"); return; }
        setIdx(next); setCountdown(dialogueDuration(dialogues[next].text)); playTransition();
      } else if (!showScoreCardRef.current) {
        // Score card off — skip scoring phase, jump straight to next segment
        const next = idx + 1;
        if (next >= dialogues.length) { setPhase("idle"); return; }
        setIdx(next); setCountdown(dialogueDuration(dialogues[next].text)); playTransition(); setPhase("speaking");
      } else {
        setPhase("scoring");
      }
    };
    audio.onerror = () => setAudioPlayFailed(true);
    if (audio.src !== dl.audioUrl) { audio.src = dl.audioUrl; audio.load(); } else audio.currentTime = 0;
    const t = setTimeout(() => audio.play().catch(() => setAudioPlayFailed(true)), 80);
    return () => { clearTimeout(t); audio.pause(); audio.ontimeupdate = null; audio.onended = null; audio.onerror = null; };
  }, [phase, idx]);

  // Scroll timeline to active segment
  useEffect(() => {
    if (!isExporting) {
      const el = timelineRef.current?.querySelector(`[data-seg-idx="${idx}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [idx, isExporting]);

  // Auto-stop recording when debate finishes during export
  useEffect(() => {
    if (isExporting && isRecording && phase === "idle" && idx >= dialogues.length - 1 && dialogues.length > 0) {
      // Small delay so the "Debate Complete" screen gets captured briefly
      const t = setTimeout(() => { mediaRecRef.current?.stop(); }, 1500);
      return () => clearTimeout(t);
    }
  }, [isExporting, isRecording, phase, idx, dialogues.length]);

  const handlePlay = () => {
    unlockAudio();
    if (!analyser) { const an = getMediaAnalyser(previewAudioRef.current); if (an) setAnalyser(an); }
    if (phase !== "idle") { previewAudioRef.current.pause(); setPhase("idle"); return; }
    if (!dialogues[idx]) return;
    setAudioPlayFailed(false); setCountdown(dialogueDuration(dialogues[idx].text)); setPhase("speaking");
  };

  const handlePrev = () => {
    setAudioPlayFailed(false); setPhase("idle");
    setIdx(i => { let ni = Math.max(0, i - 1); while (ni > 0 && !cfg.showNarrator && dialogues[ni]?.speaker === "N") ni--; return ni; });
  };

  const handleNextSeg = () => {
    setAudioPlayFailed(false); setPhase("idle");
    setIdx(i => { let ni = Math.min(dialogues.length - 1, i + 1); while (ni < dialogues.length - 1 && !cfg.showNarrator && dialogues[ni]?.speaker === "N") ni++; return ni; });
  };

  const handleBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => { const url = ev.target?.result as string; setBg(url); upd.mutate({ id: project.id, backgroundImage: url }); };
    r.readAsDataURL(file);
  };

  const handleSegBg = (dialogueId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader(); r.onload = ev => setSegBg(dialogueId, ev.target?.result as string); r.readAsDataURL(file);
  };

  const handleSpeakerImg = (speaker: "A" | "B") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader(); r.onload = ev => set(speaker === "A" ? "speakerAImage" : "speakerBImage", ev.target?.result as string); r.readAsDataURL(file);
  };

  const handleExport = async () => {
    // Stop if already recording
    if (isRecording) { mediaRecRef.current?.stop(); return; }

    try {
      unlockAudio();
      // Enter export mode — hides sidebar/timeline/toolbar, shows only canvas
      setIsExporting(true);
      // Seek to beginning
      setIdx(0); setPhase("idle"); setAudioPlayFailed(false);

      // Small delay to let React re-render (export mode CSS takes effect)
      await new Promise(r => setTimeout(r, 120));

      // Go fullscreen on just the canvas area
      const container = canvasContainerRef.current;
      if (container && document.fullscreenEnabled) await container.requestFullscreen().catch(() => {});

      // Capture current tab — Chrome 107+ picks this tab automatically, no dialog shown
      const constraints: any = { video: { frameRate: 30, width: 1920, height: 1080 }, audio: false };
      try { constraints.preferCurrentTab = true; constraints.selfBrowserSurface = "include"; } catch {}
      const displayStream = await navigator.mediaDevices.getDisplayMedia(constraints);

      // Mix in the audio from the preview player
      const combinedTracks = [...displayStream.getTracks()];
      try {
        const ac = getAC(); if (ac) {
          const dest = ac.createMediaStreamDestination();
          const src = getOrCreateMediaSource(previewAudioRef.current);
          if (src) src.connect(dest);
          dest.stream.getAudioTracks().forEach((t: MediaStreamTrack) => combinedTracks.push(t));
        }
      } catch {}

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm";
      const rec = new MediaRecorder(new MediaStream(combinedTracks), { mimeType, videoBitsPerSecond: 10_000_000 });
      const chunks: Blob[] = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      rec.onstop = () => {
        displayStream.getTracks().forEach(t => t.stop());
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        const blob = new Blob(chunks, { type: mimeType });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `debate_${Date.now()}.${mimeType.includes("mp4") ? "mp4" : "webm"}`;
        a.click();
        setIsRecording(false);
        setIsExporting(false);
      };

      rec.start(500);
      mediaRecRef.current = rec;
      setIsRecording(true);

      // Auto-start playback from segment 0
      await new Promise(r => setTimeout(r, 200));
      setCountdown(dialogueDuration(dialogues[0]?.text || ""));
      setPhase("speaking");
    } catch {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setIsExporting(false);
      setIsRecording(false);
    }
  };

  const timerSeconds = phase !== "speaking" ? 0 : isNarrator ? 0 : (currentHasAudio && audioRemaining > 0 ? audioRemaining : countdown);
  const displayProject = { ...project, speakerAName: nameA, speakerBName: nameB, speakerNarratorName: nameN };
  const canvasProps: CP = { project: displayProject, current, isA, isNarrator, cfg, timerSeconds, isSpeaking: phase === "speaking", totA, totB, wordIdx, setCfg };

  // ── Settings Tab Content ──────────────────────────────────────────────────
  const renderTab = () => {
    switch (activeTab) {
      case "general": return (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Global Style</p>
            <div className="grid grid-cols-2 gap-1">
              {([1, 2, 3, 4, 5, 6, 7] as const).map(s => (
                <button key={s} onClick={() => setStyle(s)} className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${style === s ? "bg-primary text-white" : "bg-white/10 text-gray-400 hover:text-white"}`}>
                  {STYLE_NAMES[s]}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Font Style</p>
            <div className="grid grid-cols-2 gap-1">
              {(["impact", "sans", "serif", "mono"] as const).map(f => (
                <button key={f} onClick={() => set("fontStyle", f)} className={`py-1.5 rounded-lg text-[10px] font-medium capitalize transition-all ${cfg.fontStyle === f ? "bg-primary text-white" : "bg-white/10 text-gray-400 hover:text-white"}`}>{f}</button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Score Card Style</p>
            <div className="flex gap-1">
              {([["bar", "Horiz. Bar"], ["grid", "Grid Cards"]] as const).map(([m, label]) => (
                <button key={m} onClick={() => set("scoreCardStyle", m)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${cfg.scoreCardStyle === m ? "bg-primary text-white" : "bg-white/10 text-gray-400 hover:text-white"}`}>{label}</button>
              ))}
            </div>
          </div>
          <Slider label="BG Opacity" min={0} max={100} value={cfg.bgOpacity} onChange={v => set("bgOpacity", v)} unit="%" />
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Text Size</p>
            <div className="flex gap-1">
              {(["small", "medium", "large"] as TextSize[]).map(sz => (
                <button key={sz} onClick={() => set("textSize", sz)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium capitalize ${cfg.textSize === sz ? "bg-primary text-white" : "bg-white/10 text-gray-400"}`}>{sz}</button>
              ))}
            </div>
          </div>
        </div>
      );

      case "subtitles": return (
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Subtitle Mode</p>
            <div className="flex gap-1">
              {([["word", "Full Para"], ["word2", "2-Line"], ["line", "Line×Line"]] as const).map(([m, label]) => (
                <button key={m} onClick={() => set("subMode", m)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${cfg.subMode === m ? "bg-primary text-white" : "bg-white/10 text-gray-400 hover:text-white"}`}>{label}</button>
              ))}
            </div>
          </div>
          <Slider label="Font Size" min={10} max={32} value={cfg.subFontSize} onChange={v => set("subFontSize", v)} unit="px" />
          <Slider label="Width" min={30} max={100} value={cfg.subWidth} onChange={v => set("subWidth", v)} unit="%" />
          <Slider label="Bottom" min={5} max={60} value={cfg.subBottom} onChange={v => set("subBottom", v)} unit="%" />
          <Slider label="BG Opacity" min={0} max={100} value={cfg.subBgOpacity} onChange={v => set("subBgOpacity", v)} unit="%" />
          <Slider label="Border Radius" min={0} max={32} value={cfg.subBorderRadius} onChange={v => set("subBorderRadius", v)} unit="px" />
          <Slider label="Padding" min={4} max={32} value={cfg.subPadding} onChange={v => set("subPadding", v)} unit="px" />
        </div>
      );

      case "names": return (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Speaker Names</p>
            {[["A", nameA, setNameA, saveNameA, "text-indigo-400"], ["B", nameB, setNameB, saveNameB, "text-cyan-400"], ["N", nameN, setNameN, saveNameN, "text-amber-400"]] .map(([sp, val, setVal, save, col]) => (
              <div key={sp as string}>
                <p className={`text-[10px] mb-0.5 ${col}`}>Speaker {sp}</p>
                <input value={val as string} onChange={e => (setVal as any)(e.target.value)} onBlur={save as any} onKeyDown={e => e.key === "Enter" && (save as any)()} className="w-full glass-input px-2 py-1.5 rounded text-white text-xs" />
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Roles</p>
            <div><p className="text-[10px] text-indigo-400 mb-0.5">{nameA}</p><input value={cfg.roleA} onChange={e => set("roleA", e.target.value)} className="w-full glass-input px-2 py-1.5 rounded text-white text-xs" /></div>
            <div><p className="text-[10px] text-cyan-400 mb-0.5">{nameB}</p><input value={cfg.roleB} onChange={e => set("roleB", e.target.value)} className="w-full glass-input px-2 py-1.5 rounded text-white text-xs" /></div>
          </div>
          <Slider label="Name Size" min={14} max={48} value={cfg.nameSize} onChange={v => set("nameSize", v)} unit="px" />
          <Slider label="Name Gap (Debate)" min={0} max={80} value={cfg.nameGap} onChange={v => set("nameGap", v)} unit="px" />
          <Slider label="Glow Intensity" min={0} max={100} value={cfg.nameGlowIntensity} onChange={v => set("nameGlowIntensity", v)} unit="%" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400">Name Background</span>
            <Toggle on={cfg.showNameBackground} onChange={() => set("showNameBackground", !cfg.showNameBackground)} />
          </div>
          {cfg.showNameBackground && <Slider label="Name BG Opacity" min={0} max={100} value={cfg.nameBackgroundOpacity} onChange={v => set("nameBackgroundOpacity", v)} unit="%" />}
          <div className="space-y-1.5">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Speaker Images</p>
            <p className="text-[9px] text-gray-500">Used in Split & Podcast styles</p>
            <button onClick={() => spkAImgRef.current?.click()} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs hover:bg-indigo-500/20 transition-all">
              <ImageIcon className="w-3 h-3" />{cfg.speakerAImage ? `✓ ${nameA}` : nameA}
            </button>
            <button onClick={() => spkBImgRef.current?.click()} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs hover:bg-rose-500/20 transition-all">
              <ImageIcon className="w-3 h-3" />{cfg.speakerBImage ? `✓ ${nameB}` : nameB}
            </button>
            {(cfg.speakerAImage || cfg.speakerBImage) && (
              <button onClick={() => { set("speakerAImage", ""); set("speakerBImage", ""); }} className="text-[9px] text-gray-500 hover:text-red-400">Clear images</button>
            )}
          </div>
        </div>
      );

      case "colors": return (
        <div className="space-y-3">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Speaker Colors</p>
          <ColorRow label="Speaker A" value={cfg.colorA} onChange={v => set("colorA", v)} />
          <ColorRow label="Speaker B" value={cfg.colorB} onChange={v => set("colorB", v)} />
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider pt-1">Subtitle</p>
          <ColorRow label="Sub Background" value={cfg.subColor} onChange={v => set("subColor", v)} />
          <ColorRow label="Sub Border" value={cfg.subBorderColor} onChange={v => set("subBorderColor", v)} />
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider pt-1">Narrator</p>
          <ColorRow label="Narrator BG" value={cfg.narratorColor} onChange={v => set("narratorColor", v)} />
          <ColorRow label="Narrator Border" value={cfg.narratorBorderColor} onChange={v => set("narratorBorderColor", v)} />
        </div>
      );

      case "waveform": return (
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Style</p>
            <div className="grid grid-cols-2 gap-1">
              {([["bars", "Bars"], ["pulse", "Pulse"], ["line", "Lines"], ["meter", "VU Meter"]] as const).map(([m, label]) => (
                <button key={m} onClick={() => set("waveformStyle", m as any)} className={`py-1.5 rounded-lg text-[10px] font-medium transition-all ${cfg.waveformStyle === m ? "bg-primary text-white" : "bg-white/10 text-gray-400 hover:text-white"}`}>{label}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Position</p>
            <div className="flex gap-1">
              {(["bottom", "top", "side"] as const).map(p => (
                <button key={p} onClick={() => set("waveformPosition", p)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium capitalize transition-all ${cfg.waveformPosition === p ? "bg-primary text-white" : "bg-white/10 text-gray-400 hover:text-white"}`}>{p}</button>
              ))}
            </div>
          </div>
          <Slider label="Size" min={50} max={150} value={cfg.waveformSize} onChange={v => set("waveformSize", v)} unit="%" />
        </div>
      );

      case "visibility": return (
        <div className="space-y-2">
          {([
            ["showScores",    "Scores (in video)"],
            ["showScoreCard", "Score Card (animation)"],
            ["showNarrator",  "Narrator"],
            ["showTopic",     "Topic"],
            ["showTimer",     "Timer"],
            ["showWaveform",  "Waveform"],
            ["showTranscript","Transcript"],
            ["showArgTracker","Arg. Tracker"],
          ] as [keyof OverlayCfg, string][]).map(([k, label]) => (
            <div key={k} className="flex items-center justify-between py-0.5">
              <span className="text-xs text-gray-300">{label}</span>
              <Toggle on={!!cfg[k]} onChange={() => set(k, !cfg[k] as any)} />
            </div>
          ))}
          {cfg.showArgTracker && <Slider label="Tracker Size" min={6} max={24} value={cfg.argTrackerSize} onChange={v => set("argTrackerSize", v)} unit="px" />}
          <div className="pt-1 border-t border-white/10">
            <div className="flex items-center justify-between py-0.5 mb-1.5">
              <span className="text-xs text-gray-300">Pointer Line</span>
              <Toggle on={cfg.showPointerLine} onChange={() => set("showPointerLine", !cfg.showPointerLine)} />
            </div>
            {cfg.showPointerLine && (
              <div className="space-y-1">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Pointer Side</p>
                <div className="flex gap-1">
                  {([["auto", "Auto"], ["left", "Left"], ["right", "Right"]] as const).map(([v, label]) => (
                    <button key={v} onClick={() => set("pointerLineSide", v)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${cfg.pointerLineSide === v ? "bg-primary text-white" : "bg-white/10 text-gray-400 hover:text-white"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col gap-0" style={{ height: "calc(100vh - 72px)" }}>

      {/* ── Top Toolbar — hidden during export so only canvas is visible ── */}
      {!isExporting && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-white/10 bg-black/20 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-lg flex items-center justify-center ring-1 ring-emerald-500/20">
              <LayoutTemplate className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">Video Editor</p>
              <p className="text-[10px] text-gray-500">{dialogues.length} segments</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-xs flex items-center gap-1.5 transition-all">
              <ImageIcon className="w-3.5 h-3.5" /> BG
            </button>
            <button onClick={() => canvasContainerRef.current?.requestFullscreen().catch(() => {})} className="px-3 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-xs flex items-center gap-1.5 transition-all">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleExport}
              className={`px-4 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 font-bold transition-all ${isRecording ? "border-red-500 bg-red-500/20 text-red-400 animate-pulse" : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}>
              {isRecording ? <><Square className="w-3.5 h-3.5" /> Stop Export</> : <><Clapperboard className="w-3.5 h-3.5" /> Export Video</>}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleBg} />
          <input ref={spkAImgRef} type="file" accept="image/*" className="hidden" onChange={handleSpeakerImg("A")} />
          <input ref={spkBImgRef} type="file" accept="image/*" className="hidden" onChange={handleSpeakerImg("B")} />
        </div>
      )}

      {/* ── Main 2-column area (sidebar + canvas) ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT SIDEBAR — hidden during export */}
        <div className={`w-[220px] shrink-0 border-r border-white/10 bg-black/30 flex flex-col overflow-hidden ${isExporting ? "hidden" : ""}`}>
          {/* Tab buttons */}
          <div className="flex flex-col gap-0.5 p-1.5 border-b border-white/10 shrink-0">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all text-left ${activeTab === t.id ? "bg-primary/20 text-primary border border-primary/30" : "text-gray-400 hover:text-white hover:bg-white/5"}`}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />{t.label}
                </button>
              );
            })}
          </div>
          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-3 text-xs">
            {renderTab()}
          </div>
          {/* Scores live display at bottom */}
          <div className="shrink-0 border-t border-white/10 px-3 py-2 flex items-center justify-between">
            <div className="text-center">
              <div className="text-sm font-black text-indigo-400 tabular-nums">{totA.toFixed(1)}</div>
              <div className="text-[9px] text-gray-500 truncate max-w-[70px]">{nameA}</div>
            </div>
            <div className="text-xs text-gray-600 font-bold">vs</div>
            <div className="text-center">
              <div className="text-sm font-black text-rose-400 tabular-nums">{totB.toFixed(1)}</div>
              <div className="text-[9px] text-gray-500 truncate max-w-[70px]">{nameB}</div>
            </div>
          </div>
        </div>

        {/* CENTER: Canvas + playback */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas */}
          <AnalyserContext.Provider value={analyser}>
            <div ref={canvasContainerRef} className="flex-1 relative bg-black sub-canvas-root overflow-hidden">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${effectiveBg})`, opacity: cfg.bgOpacity / 100 }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.4) 100%)" }} />

              {effectiveStyle === 1 && <Style1 {...canvasProps} />}
              {effectiveStyle === 2 && <Style2 {...canvasProps} />}
              {effectiveStyle === 3 && <Style3 {...canvasProps} />}
              {effectiveStyle === 4 && <Style4 {...canvasProps} />}
              {effectiveStyle === 5 && <Style5 {...canvasProps} />}
              {effectiveStyle === 6 && <Style6 {...canvasProps} />}
              {effectiveStyle === 7 && <Style7 {...canvasProps} />}

              <AnimatePresence>
                {cfg.showScoreCard && phase === "scoring" && scoreData[idx] && !isNarrator && (
                  <ScoreCard scores={scoreData[idx].modelScores} speakerName={isA ? nameA : nameB} avg={scoreData[idx].avg} isA={isA} totalA={totA} totalB={totB} nameA={nameA} nameB={nameB} style={cfg.scoreCardStyle} />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {phase === "idle" && idx >= dialogues.length - 1 && dialogues.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
                    <motion.div initial={{ scale: 0.85 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 18, stiffness: 220 }}
                      className="text-center px-8 py-10 rounded-3xl border border-white/10 bg-black/60 max-w-sm">
                      <div className="text-4xl mb-3">🏆</div>
                      <h3 className="text-2xl font-black text-white mb-4">Debate Complete!</h3>
                      <div className="flex justify-center gap-6 mb-5">
                        <div><div className="text-3xl font-black text-blue-400 tabular-nums">{totA.toFixed(1)}</div><div className="text-xs text-blue-300 font-bold mt-0.5">{nameA}</div></div>
                        <div className="text-2xl font-black text-gray-500 self-center">vs</div>
                        <div><div className="text-3xl font-black text-rose-400 tabular-nums">{totB.toFixed(1)}</div><div className="text-xs text-rose-300 font-bold mt-0.5">{nameB}</div></div>
                      </div>
                      <p className="text-gray-400 text-sm mb-4">{totA > totB ? `${nameA} wins!` : totB > totA ? `${nameB} wins!` : "It's a tie!"}</p>
                      <button onClick={() => { setIdx(0); setPhase("idle"); }} className="px-5 py-2 bg-white text-black font-bold rounded-xl text-sm hover:bg-gray-200">Replay</button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </AnalyserContext.Provider>

          {/* Playback bar — hidden during export */}
          <div className={`shrink-0 px-4 py-2.5 bg-black/40 border-t border-white/10 flex items-center gap-3 ${isExporting ? "hidden" : ""}`}>
            <div className="flex items-center gap-1.5">
              <button onClick={handlePrev} disabled={idx === 0 || phase !== "idle"} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"><ArrowLeft className="w-4 h-4" /></button>
              <button onClick={handlePlay} className={`px-4 py-1.5 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all ${phase !== "idle" ? "bg-red-500 text-white hover:bg-red-600" : "bg-gradient-to-r from-primary to-indigo-600 text-white"}`}>
                {phase !== "idle" ? <><Square className="w-3.5 h-3.5" />Stop</> : <><Play className="w-3.5 h-3.5" />Play</>}
              </button>
              <button onClick={handleNextSeg} disabled={idx >= dialogues.length - 1 || phase !== "idle"} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-all"><ArrowRight className="w-4 h-4" /></button>
            </div>

            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer" onClick={e => {
              if (phase !== "idle") return;
              const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
              setIdx(Math.min(dialogues.length - 1, Math.max(0, Math.round(((e.clientX - rect.left) / rect.width) * (dialogues.length - 1)))));
            }}>
              <motion.div className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full"
                animate={{ width: `${dialogues.length > 0 ? ((idx + 1) / dialogues.length) * 100 : 0}%` }} transition={{ duration: 0.3 }} />
            </div>

            <span className={`font-mono font-bold text-sm tabular-nums px-3 py-1 rounded-lg ${phase === "speaking" && !isNarrator ? "bg-primary/20 text-primary" : "bg-white/5 text-gray-500"}`}>{fmt(timerSeconds)}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${phase === "speaking" ? "bg-emerald-500/20 text-emerald-400" : phase === "scoring" ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-gray-600"}`}>
              {phase === "speaking" ? "● Live" : phase === "scoring" ? "⚡ Score" : "Idle"}
            </span>
            <span className="text-xs text-gray-500 tabular-nums">{idx + 1}/{dialogues.length}</span>
          </div>
        </div>
      </div>

      {/* ── TIMELINE — hidden during export ── */}
      {!isExporting && <div className="shrink-0 border-t border-white/10 bg-black/40" style={{ height: "130px" }}>
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Timeline</span>
          <span className="text-[10px] text-gray-600">— Click segment to jump · Gear icon for per-segment style &amp; BG</span>
        </div>
        <div ref={timelineRef} className="flex gap-1.5 overflow-x-auto px-3 py-2 h-[calc(100%-28px)]" style={{ scrollbarWidth: "thin" }}>
          {dialogues.map((d, i) => {
            const isActive = i === idx;
            const sc = segmentCfg.get(d.id);
            const hasBg = !!sc?.bgImage;
            const segStyle = sc?.style ?? style;
            const dur = Math.max(3, Math.ceil(d.text.split(" ").length / 2.5));
            const colBadge = d.speaker === "A" ? "bg-indigo-500/30 text-indigo-300 border-indigo-500/30" : d.speaker === "B" ? "bg-cyan-500/30 text-cyan-300 border-cyan-500/30" : "bg-amber-500/30 text-amber-300 border-amber-500/30";
            const cardBorder = isActive ? "border-primary shadow-[0_0_12px_rgba(124,58,237,0.5)] bg-primary/10" : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]";

            return (
              <div key={d.id} data-seg-idx={i} className={`relative shrink-0 flex flex-col gap-1 p-2 rounded-xl border cursor-pointer transition-all group ${cardBorder}`}
                style={{ width: `${Math.max(100, Math.min(200, dur * 8))}px`, minWidth: "100px" }}
                onClick={() => { if (phase === "idle") { setIdx(i); setActiveSegPopup(null); } }}>

                {/* Header row */}
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${colBadge}`}>{d.speaker}</span>
                  <div className="flex items-center gap-1">
                    {hasBg && <span className="text-[9px]">🖼</span>}
                    {d.audioUrl && <span className="text-[9px] text-emerald-400">🎵</span>}
                    <span className="text-[9px] text-gray-500 font-mono">{dur}s</span>
                    <span className="text-[9px] bg-white/10 px-1 rounded text-gray-400">S{segStyle}</span>
                  </div>
                </div>

                {/* Text preview */}
                <p className="text-[9px] text-gray-400 leading-tight line-clamp-2 flex-1">{d.text}</p>

                {/* Gear icon — opens per-segment popup */}
                <button
                  onClick={e => { e.stopPropagation(); setActiveSegPopup(activeSegPopup === d.id ? null : d.id); }}
                  className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                  <ChevronDown className="w-3 h-3 text-gray-300" />
                </button>

                {/* Active indicator bar */}
                {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-b-xl" />}
              </div>
            );
          })}
        </div>
      </div>}

      {/* ── Per-segment popup ── */}
      <AnimatePresence>
        {activeSegPopup !== null && (() => {
          const d = dialogues.find(x => x.id === activeSegPopup);
          if (!d) return null;
          const segI = dialogues.indexOf(d);
          const sc = segmentCfg.get(d.id);

          return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-[140px] left-[240px] z-50 glass-panel rounded-2xl p-4 border border-white/20 shadow-2xl w-72"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-white">Segment {segI + 1} Settings</p>
                <button onClick={() => setActiveSegPopup(null)} className="text-gray-500 hover:text-white text-xs">✕</button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">Style Override</p>
                  <div className="grid grid-cols-4 gap-1">
                    {([1, 2, 3, 4, 5, 6, 7] as const).map(s => (
                      <button key={s} onClick={() => setSegStyle(d.id, s)}
                        className={`py-1.5 rounded-lg text-[9px] font-bold transition-all ${(sc?.style ?? style) === s ? "bg-primary text-white" : "bg-white/10 text-gray-400 hover:text-white"}`}>
                        {STYLE_NAMES[s]}
                      </button>
                    ))}
                    <button onClick={() => setSegmentCfg(prev => { const m = new Map(prev); const cur = m.get(d.id); if (cur) { const { style: _, ...rest } = cur; Object.keys(rest).length === 0 ? m.delete(d.id) : m.set(d.id, rest as SegmentCfg); } return m; })}
                      className="py-1.5 rounded-lg text-[9px] font-bold bg-white/5 text-gray-600 hover:text-gray-400 transition-all col-span-4">
                      ↩ Reset to Global (S{style})
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1.5">Background Override</p>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      const input = document.createElement("input"); input.type = "file"; input.accept = "image/*";
                      input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return; const r = new FileReader(); r.onload = ev => setSegBg(d.id, ev.target?.result as string); r.readAsDataURL(file); };
                      input.click();
                    }} className="flex-1 py-1.5 rounded-lg text-[10px] font-medium bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 flex items-center justify-center gap-1 transition-all">
                      <ImageIcon className="w-3 h-3" /> Upload BG
                    </button>
                    {sc?.bgImage && (
                      <button onClick={() => clearSegBg(d.id)} className="px-2 py-1.5 rounded-lg text-[10px] bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all">Clear</button>
                    )}
                  </div>
                  {sc?.bgImage && <div className="mt-2 h-12 rounded-lg bg-cover bg-center border border-white/10" style={{ backgroundImage: `url(${sc.bgImage})` }} />}
                  {!sc?.bgImage && <p className="text-[9px] text-gray-600 mt-1">Using global background</p>}
                </div>

                {/* Bulk actions */}
                <div className="pt-2 border-t border-white/10 flex gap-2">
                  <button onClick={() => { applySegToAll(d.id); setActiveSegPopup(null); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold bg-primary/20 text-primary hover:bg-primary/30 transition-all">
                    <CopyCheck className="w-3 h-3" /> Apply to All
                  </button>
                  <button onClick={() => { resetAllSegments(); setActiveSegPopup(null); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all">
                    <RotateCcw className="w-3 h-3" /> Reset All
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Click outside to close popup */}
      {activeSegPopup !== null && <div className="fixed inset-0 z-40" onClick={() => setActiveSegPopup(null)} />}
    </div>
  );
}
