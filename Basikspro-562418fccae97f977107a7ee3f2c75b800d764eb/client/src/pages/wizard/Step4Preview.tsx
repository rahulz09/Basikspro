import { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, LayoutTemplate, ArrowLeft, ArrowRight,
  Play, Square, Image as ImageIcon, Video, Download
} from "lucide-react";
import { useUpdateProject } from "@/hooks/use-projects";
import { OverlayCfg, Phase, TextSize, CP } from "@/components/video/types";
import { DEMO_BG, AI_MODELS } from "@/components/video/constants";
import { dialogueDuration, fmt, genScores, getAC, unlockAudio, playTransition, playCountdownBeep } from "@/components/video/helpers";
import { ScoreCard } from "@/components/video/ScoreCard";
import { Style1 } from "@/components/video/styles/Style1";
import { Style2 } from "@/components/video/styles/Style2";
import { Style3 } from "@/components/video/styles/Style3";
import { Style4 } from "@/components/video/styles/Style4";
import { Style5 } from "@/components/video/styles/Style5";
import { Style6 } from "@/components/video/styles/Style6";
import { Style7 } from "@/components/video/styles/Style7";

export function Step4Preview({ project }: { project: any }) {
  const dialogues: any[] = project.dialogues || [];
  const upd = useUpdateProject();
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(new Audio());
  const spkAImgRef = useRef<HTMLInputElement>(null);
  const spkBImgRef = useRef<HTMLInputElement>(null);
  const wordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(0);
  const [audioPlayFailed, setAudioPlayFailed] = useState(false);
  const [style, setStyle] = useState<1|2|3|4|5|6|7>(1);
  const [bg, setBg] = useState(project.backgroundImage || DEMO_BG);
  const [showSettings, setShowSettings] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [cfg, setCfg] = useState<OverlayCfg>({
    roleA: "SUPPORTER", roleB: "OPPONENT", textSize: "medium",
    showScores: true, showTimer: true, showTopic: true, showWaveform: true,
    showTranscript: true, showNarrator: true, showPointerLine: false,
    bgOpacity: 100, subBottom: 12, subWidth: 80, subHeight: 0, subBgOpacity: 80,
    speakerAImage: "", speakerBImage: "",
    subMode: "word", subColor: "#0a0a14", subBorderColor: "#ffffff",
    narratorColor: "#451a03", narratorBorderColor: "#f59e0b",
    scoreCardStyle: "bar", waveformStyle: "bars", nameGap: 16, fontStyle: "impact",
    colorA: "#4ade80", colorB: "#f472b6", nameGlowIntensity: 70, showArgTracker: true,
  });
  const [wordIdx, setWordIdx] = useState(-1);
  const [audioRemaining, setAudioRemaining] = useState(0);

  // Editable speaker names (local — saved to DB on blur)
  const [nameA, setNameA] = useState(project.speakerAName || "Speaker A");
  const [nameB, setNameB] = useState(project.speakerBName || "Speaker B");
  const [nameN, setNameN] = useState(project.speakerNarratorName || "Narrator");
  const saveNameA = () => { if (nameA !== project.speakerAName) upd.mutate({ id: project.id, speakerAName: nameA }); };
  const saveNameB = () => { if (nameB !== project.speakerBName) upd.mutate({ id: project.id, speakerBName: nameB }); };
  const saveNameN = () => { if (nameN !== project.speakerNarratorName) upd.mutate({ id: project.id, speakerNarratorName: nameN }); };

  // Pre-compute scores for all dialogues
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

  // ── Phase state machine ──
  useEffect(() => {
    if (phase === "idle") return;
    if (phase === "speaking" && currentIsNarrator && !cfg.showNarrator) {
      const next = nextNonNarr(idx + 1);
      if (next >= dialogues.length) { setPhase("idle"); return; }
      setIdx(next);
      setCountdown(dialogueDuration(dialogues[next].text));
      setAudioPlayFailed(false);
      return;
    }
    if (phase === "speaking") {
      if (currentHasAudio && !audioPlayFailed) return;
      if (countdown <= 0) {
        if (currentIsNarrator) {
          const next = nextNonNarr(idx + 1);
          if (next >= dialogues.length) { setPhase("idle"); return; }
          setIdx(next);
          setCountdown(dialogueDuration(dialogues[next].text));
          playTransition();
          return;
        }
        if (!cfg.showScores) {
          const next = nextNonNarr(idx + 1);
          if (next >= dialogues.length) { setPhase("idle"); return; }
          setIdx(next);
          setCountdown(dialogueDuration(dialogues[next].text));
          setAudioPlayFailed(false);
          playTransition();
          return;
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
        setIdx(next);
        setCountdown(dialogueDuration(dialogues[next].text));
        setAudioPlayFailed(false);
        playTransition();
        setPhase("speaking");
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [phase, countdown, idx, currentIsNarrator, currentHasAudio, dialogues, audioPlayFailed, cfg.showNarrator, cfg.showScores]);

  // ── Word-by-word subtitle reveal (no audio) ──
  useEffect(() => {
    if (wordTimerRef.current) clearInterval(wordTimerRef.current);
    if (phase === "speaking" && current.text && (!currentHasAudio || audioPlayFailed)) {
      const words = current.text.split(" ");
      const totalSecs = dialogueDuration(current.text);
      const msPerWord = Math.max(150, (totalSecs * 1000) / words.length);
      setWordIdx(0);
      let w = 0;
      wordTimerRef.current = setInterval(() => {
        w++;
        setWordIdx(w);
        if (w >= words.length && wordTimerRef.current) clearInterval(wordTimerRef.current);
      }, msPerWord);
    } else if (phase !== "speaking") {
      setWordIdx(-1);
    }
    return () => { if (wordTimerRef.current) clearInterval(wordTimerRef.current); };
  }, [phase, idx, currentHasAudio, audioPlayFailed]);

  // ── Preview audio playback ──
  useEffect(() => {
    const audio = previewAudioRef.current;
    audio.pause();
    audio.ontimeupdate = null;
    audio.onended = null;
    audio.onerror = null;
    setAudioRemaining(0);

    if (phase !== "speaking") return;
    const dl = dialogues[idx];
    if (!dl?.audioUrl) return;

    const isN = dl.speaker === "N";
    const words = dl.text.split(" ");

    audio.ontimeupdate = () => {
      const dur = audio.duration || 1;
      const ct = audio.currentTime;
      setAudioRemaining(Math.max(0, Math.round(dur - ct)));
      setWordIdx(Math.min(words.length, Math.ceil((ct / dur) * words.length)));
    };
    audio.onended = () => {
      setAudioRemaining(0);
      setWordIdx(words.length);
      if (isN) {
        const next = idx + 1;
        if (next >= dialogues.length) { setPhase("idle"); return; }
        setIdx(next);
        setCountdown(dialogueDuration(dialogues[next].text));
        playTransition();
      } else {
        setPhase("scoring");
      }
    };
    audio.onerror = () => { setAudioPlayFailed(true); };

    if (audio.src !== dl.audioUrl) {
      audio.src = dl.audioUrl;
      audio.load();
    } else {
      audio.currentTime = 0;
    }

    const playTimer = setTimeout(() => {
      audio.play().catch(() => { setAudioPlayFailed(true); });
    }, 80);

    return () => {
      clearTimeout(playTimer);
      audio.pause();
      audio.ontimeupdate = null;
      audio.onended = null;
      audio.onerror = null;
    };
  }, [phase, idx]);

  const handlePlay = () => {
    unlockAudio();
    if (phase !== "idle") {
      previewAudioRef.current.pause();
      setPhase("idle"); return;
    }
    if (!dialogues[idx]) return;
    setAudioPlayFailed(false);
    setCountdown(dialogueDuration(dialogues[idx].text));
    setPhase("speaking");
  };

  const handlePrev = () => {
    setAudioPlayFailed(false); setPhase("idle");
    setIdx(i => {
      let ni = Math.max(0, i - 1);
      while (ni > 0 && !cfg.showNarrator && dialogues[ni]?.speaker === "N") ni--;
      return ni;
    });
  };

  const handleNext = () => {
    setAudioPlayFailed(false); setPhase("idle");
    setIdx(i => {
      let ni = Math.min(dialogues.length - 1, i + 1);
      while (ni < dialogues.length - 1 && !cfg.showNarrator && dialogues[ni]?.speaker === "N") ni++;
      return ni;
    });
  };

  const handleBg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => { const url = ev.target?.result as string; setBg(url); upd.mutate({ id: project.id, backgroundImage: url }); };
    r.readAsDataURL(file);
  };

  const handleSpeakerImg = (speaker: "A" | "B") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => set(speaker === "A" ? "speakerAImage" : "speakerBImage", ev.target?.result as string);
    r.readAsDataURL(file);
  };

  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const handleRecord = async () => {
    if (isRecording) { mediaRecRef.current?.stop(); return; }
    if (isSafari || !navigator.mediaDevices?.getDisplayMedia) {
      const container = canvasContainerRef.current;
      if (container && document.fullscreenEnabled) await container.requestFullscreen().catch(() => {});
      alert("Safari me screen recording supported nahi hai browser se.\n\nSteps:\n1. Canvas fullscreen ho gaya hai\n2. Mac: QuickTime Player → File → New Screen Recording → canvas select karein\n3. iPhone/iPad: Control Centre → Screen Record button dabayein\n4. Debate play karein aur record karein");
      if (phase === "idle") { unlockAudio(); setAudioPlayFailed(false); setCountdown(dialogueDuration(dialogues[idx]?.text || "")); setPhase("speaking"); }
      return;
    }
    try {
      const container = canvasContainerRef.current;
      if (container && document.fullscreenEnabled) await container.requestFullscreen().catch(() => {});
      const constraints: any = { video: { frameRate: 30 }, audio: false };
      try { (constraints as any).preferCurrentTab = true; } catch {}
      const displayStream = await navigator.mediaDevices.getDisplayMedia(constraints);
      const combinedTracks = [...displayStream.getTracks()];
      try {
        const ac = getAC();
        if (ac) {
          const dest = ac.createMediaStreamDestination();
          const src = ac.createMediaElementSource(previewAudioRef.current);
          src.connect(dest); src.connect(ac.destination);
          dest.stream.getAudioTracks().forEach((t: MediaStreamTrack) => combinedTracks.push(t));
        }
      } catch { /* audio capture not critical */ }
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/mp4") ? "video/mp4" : "video/webm";
      const finalStream = new MediaStream(combinedTracks);
      const rec = new MediaRecorder(finalStream, { mimeType, videoBitsPerSecond: 8_000_000 });
      const chunks: Blob[] = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      rec.onstop = () => {
        finalStream.getTracks().forEach(t => t.stop());
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        const ext = mimeType.includes("mp4") ? "mp4" : "webm";
        const blob = new Blob(chunks, { type: mimeType });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `debate_${Date.now()}.${ext}`;
        a.click();
        setIsRecording(false);
      };
      rec.start(500);
      mediaRecRef.current = rec;
      setIsRecording(true);
      if (phase === "idle") { unlockAudio(); setAudioPlayFailed(false); setCountdown(dialogueDuration(dialogues[idx]?.text || "")); setPhase("speaking"); }
    } catch { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); }
  };

  const set = <K extends keyof OverlayCfg>(k: K, v: OverlayCfg[K]) => setCfg(c => ({ ...c, [k]: v }));
  const styleNames = ["", "Panel", "Bar", "News", "Arena", "Split", "Podcast", "Debate"];

  const timerSeconds = phase !== "speaking" ? 0 : isNarrator ? 0 : (currentHasAudio && audioRemaining > 0 ? audioRemaining : countdown);
  const displayProject = { ...project, speakerAName: nameA, speakerBName: nameB, speakerNarratorName: nameN };
  const canvasProps: CP = { project: displayProject, current, isA, isNarrator, cfg, timerSeconds, isSpeaking: phase === "speaking", totA, totB, wordIdx, setCfg };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-2.5">
      {/* Controls toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-teal-600/20 rounded-lg flex items-center justify-center ring-1 ring-emerald-500/20">
            <LayoutTemplate className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-display font-bold text-white leading-tight">Video Canvas</h2>
            <p className="text-muted-foreground text-[10px] hidden sm:block">Style · Overlay · Background · Record</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <div className="flex bg-black/40 rounded-lg border border-white/10 p-0.5 gap-0.5">
            {([1,2,3,4,5,6,7] as const).map(s => (
              <button key={s} onClick={() => setStyle(s)} className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${style === s ? "bg-primary text-white shadow-md shadow-primary/30" : "text-gray-500 hover:text-white"}`}>
                {styleNames[s]}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-white/10 mx-0.5 hidden sm:block" />
          <button onClick={() => setShowSettings(!showSettings)} className={`px-2.5 py-1.5 rounded-lg border text-[10px] flex items-center gap-1 font-medium transition-all ${showSettings ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-gray-400 hover:text-white hover:bg-white/5"}`}>
            <Settings className="w-3 h-3" /> Overlay
          </button>
          <button onClick={() => fileRef.current?.click()} className="px-2.5 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-[10px] flex items-center gap-1 font-medium">
            <ImageIcon className="w-3 h-3" /> BG
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleBg} />
          <input ref={spkAImgRef} type="file" accept="image/*" className="hidden" onChange={handleSpeakerImg("A")} />
          <input ref={spkBImgRef} type="file" accept="image/*" className="hidden" onChange={handleSpeakerImg("B")} />
          <button onClick={() => canvasContainerRef.current?.requestFullscreen().catch(() => {})} className="px-2.5 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-[10px] flex items-center gap-1 font-medium">
            <LayoutTemplate className="w-3 h-3" /> Full
          </button>
          <button onClick={handleRecord} className={`px-2.5 py-1.5 rounded-lg border text-[10px] flex items-center gap-1 font-bold transition-all ${isRecording ? "border-red-500 bg-red-500/20 text-red-400 animate-pulse" : "border-white/10 text-gray-400 hover:text-white hover:bg-white/5"}`}>
            {isRecording ? <><Square className="w-3 h-3" /> Stop</> : <><Video className="w-3 h-3" /> Record</>}
          </button>
          <button onClick={() => { const a = document.createElement("a"); a.href = bg; a.download = "background.jpg"; a.click(); }} className="px-2.5 py-1.5 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 text-[10px] flex items-center gap-1 font-medium">
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Canvas + Settings */}
      <div className="relative">
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="absolute right-0 top-0 z-30 glass-panel rounded-2xl p-3 overflow-y-auto space-y-4 shadow-2xl border border-white/10"
              style={{ width: "240px", maxHeight: "min(520px, 70vh)" }}>
              <p className="text-white font-bold text-xs uppercase tracking-wider">Overlay</p>

              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Text Size</p>
                <div className="flex gap-1">
                  {(["small", "medium", "large"] as TextSize[]).map(sz => (
                    <button key={sz} onClick={() => set("textSize", sz)} className={`flex-1 py-1 rounded-lg text-xs font-medium capitalize ${cfg.textSize === sz ? "bg-primary text-white" : "bg-white/10 text-gray-400"}`}>{sz}</button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Speaker Names</p>
                <div>
                  <p className="text-[10px] text-blue-400 mb-0.5">Speaker A</p>
                  <input value={nameA} onChange={e => setNameA(e.target.value)} onBlur={saveNameA} onKeyDown={e => e.key === "Enter" && saveNameA()} className="w-full glass-input px-2 py-1.5 rounded text-white text-xs" placeholder="Speaker A" />
                </div>
                <div>
                  <p className="text-[10px] text-rose-400 mb-0.5">Speaker B</p>
                  <input value={nameB} onChange={e => setNameB(e.target.value)} onBlur={saveNameB} onKeyDown={e => e.key === "Enter" && saveNameB()} className="w-full glass-input px-2 py-1.5 rounded text-white text-xs" placeholder="Speaker B" />
                </div>
                <div>
                  <p className="text-[10px] text-amber-400 mb-0.5">Narrator</p>
                  <input value={nameN} onChange={e => setNameN(e.target.value)} onBlur={saveNameN} onKeyDown={e => e.key === "Enter" && saveNameN()} className="w-full glass-input px-2 py-1.5 rounded text-white text-xs" placeholder="Narrator" />
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Roles</p>
                <div><p className="text-[10px] text-blue-400 mb-0.5">{nameA}</p><input value={cfg.roleA} onChange={e => set("roleA", e.target.value)} className="w-full glass-input px-2 py-1.5 rounded text-white text-xs" /></div>
                <div><p className="text-[10px] text-rose-400 mb-0.5">{nameB}</p><input value={cfg.roleB} onChange={e => set("roleB", e.target.value)} className="w-full glass-input px-2 py-1.5 rounded text-white text-xs" /></div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Scores (Live)</p>
                <div className="text-xs space-y-0.5">
                  <div className="flex justify-between"><span className="text-blue-400">{project.speakerAName}</span><span className="text-white font-bold tabular-nums">{totA.toFixed(1)}</span></div>
                  <div className="flex justify-between"><span className="text-rose-400">{project.speakerBName}</span><span className="text-white font-bold tabular-nums">{totB.toFixed(1)}</span></div>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">BG Opacity</p>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={100} value={cfg.bgOpacity} onChange={e => set("bgOpacity", parseInt(e.target.value))} className="flex-1 accent-primary h-1.5" />
                  <span className="text-xs text-gray-400 tabular-nums w-8 text-right">{cfg.bgOpacity}%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Subtitle Position</p>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-500 w-10">Bottom</span>
                  <input type="range" min={5} max={60} value={cfg.subBottom} onChange={e => set("subBottom", parseInt(e.target.value))} className="flex-1 accent-primary h-1.5" />
                  <span className="text-xs text-gray-400 tabular-nums w-8 text-right">{cfg.subBottom}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-500 w-10">Width</span>
                  <input type="range" min={30} max={100} value={cfg.subWidth} onChange={e => set("subWidth", parseInt(e.target.value))} className="flex-1 accent-primary h-1.5" />
                  <span className="text-xs text-gray-400 tabular-nums w-8 text-right">{cfg.subWidth}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-500 w-10">BG</span>
                  <input type="range" min={0} max={100} value={cfg.subBgOpacity} onChange={e => set("subBgOpacity", parseInt(e.target.value))} className="flex-1 accent-primary h-1.5" />
                  <span className="text-xs text-gray-400 tabular-nums w-8 text-right">{cfg.subBgOpacity}%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Subtitle Mode</p>
                <div className="flex gap-1 flex-wrap">
                  {([["word", "Full Para"], ["word2", "2-Line Roll"], ["line", "Line×Line"]] as const).map(([m, label]) => (
                    <button key={m} onClick={() => set("subMode", m)} className={`flex-1 py-1 rounded-lg text-[10px] font-medium transition-all ${cfg.subMode === m ? "bg-primary text-white" : "bg-white/10 text-gray-400 hover:text-white"}`}>
                      {label}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-gray-600">Hover box to show resize handles</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Colors</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {([
                    ["subColor", "Sub BG"],
                    ["subBorderColor", "Sub Border"],
                    ["narratorColor", "Narrator BG"],
                    ["narratorBorderColor", "Narrator Border"],
                  ] as [keyof OverlayCfg, string][]).map(([k, label]) => (
                    <div key={k}>
                      <p className="text-[9px] text-gray-500 mb-0.5">{label}</p>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                        <input type="color" value={cfg[k] as string} onChange={e => set(k, e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0" />
                        <span className="text-[9px] text-gray-400 font-mono">{cfg[k] as string}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Visibility</p>
                {([
                  ["showScores", "Scores"],
                  ["showNarrator", "Narrator"],
                  ["showTopic", "Topic"],
                  ["showTimer", "Timer"],
                  ["showWaveform", "Waveform"],
                  ["showTranscript", "Transcript"],
                  ["showPointerLine", "Pointer Line"],
                  ["showArgTracker", "Arg. Tracker"],
                ] as [keyof OverlayCfg, string][]).map(([k, label]) => (
                  <label key={k} className="flex items-center justify-between cursor-pointer py-0.5">
                    <span className="text-xs text-gray-300">{label}</span>
                    <button onClick={() => set(k, !cfg[k] as any)} className={`w-9 h-[18px] rounded-full relative transition-all ${cfg[k] ? "bg-primary" : "bg-white/20"}`}>
                      <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all ${cfg[k] ? "left-[18px]" : "left-[2px]"}`} />
                    </button>
                  </label>
                ))}
              </div>

              {/* ── Score Card Style ── */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Score Card Style</p>
                <div className="flex gap-1">
                  {([["bar", "Horizontal Bar"], ["grid", "Grid Cards"]] as const).map(([m, label]) => (
                    <button key={m} onClick={() => set("scoreCardStyle", m)} className={`flex-1 py-1 rounded-lg text-[10px] font-medium transition-all ${cfg.scoreCardStyle === m ? "bg-primary text-white" : "bg-white/10 text-gray-400 hover:text-white"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Waveform Style ── */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Waveform Style</p>
                <div className="flex gap-1">
                  {([["bars", "Bars"], ["pulse", "Pulse"], ["line", "Wave"]] as const).map(([m, label]) => (
                    <button key={m} onClick={() => set("waveformStyle", m)} className={`flex-1 py-1 rounded-lg text-[10px] font-medium transition-all ${cfg.waveformStyle === m ? "bg-primary text-white" : "bg-white/10 text-gray-400 hover:text-white"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Font Style ── */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Font Style</p>
                <div className="grid grid-cols-2 gap-1">
                  {([["impact", "Impact"], ["sans", "Sans"], ["serif", "Serif"], ["mono", "Mono"]] as const).map(([m, label]) => (
                    <button key={m} onClick={() => set("fontStyle", m)} className={`py-1 rounded-lg text-[10px] font-medium transition-all ${cfg.fontStyle === m ? "bg-primary text-white" : "bg-white/10 text-gray-400 hover:text-white"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Name Gap (Debate style) ── */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Name Gap <span className="text-gray-600">(Debate)</span></p>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={80} value={cfg.nameGap} onChange={e => set("nameGap", parseInt(e.target.value))} className="flex-1 accent-primary h-1.5" />
                  <span className="text-xs text-gray-400 tabular-nums w-8 text-right">{cfg.nameGap}px</span>
                </div>
              </div>

              {/* ── Debate Speaker Colors ── */}
              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Debate Colors</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <p className="text-[9px] text-gray-500 mb-0.5">Speaker A</p>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                      <input type="color" value={cfg.colorA} onChange={e => set("colorA", e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0" />
                      <span className="text-[9px] text-gray-400 font-mono">{cfg.colorA}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 mb-0.5">Speaker B</p>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
                      <input type="color" value={cfg.colorB} onChange={e => set("colorB", e.target.value)} className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0" />
                      <span className="text-[9px] text-gray-400 font-mono">{cfg.colorB}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] text-gray-500 w-14">Name Glow</span>
                  <input type="range" min={0} max={100} value={cfg.nameGlowIntensity} onChange={e => set("nameGlowIntensity", parseInt(e.target.value))} className="flex-1 accent-primary h-1.5" />
                  <span className="text-xs text-gray-400 tabular-nums w-8 text-right">{cfg.nameGlowIntensity}%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Speaker Images</p>
                <p className="text-[9px] text-gray-500">Used in Split & Podcast styles</p>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => spkAImgRef.current?.click()}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs hover:bg-indigo-500/20 transition-all">
                    <ImageIcon className="w-3 h-3" />
                    {cfg.speakerAImage ? <span className="text-indigo-400">✓ {project.speakerAName}</span> : <span>{project.speakerAName}</span>}
                  </button>
                  <button onClick={() => spkBImgRef.current?.click()}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs hover:bg-rose-500/20 transition-all">
                    <ImageIcon className="w-3 h-3" />
                    {cfg.speakerBImage ? <span className="text-rose-400">✓ {project.speakerBName}</span> : <span>{project.speakerBName}</span>}
                  </button>
                  {(cfg.speakerAImage || cfg.speakerBImage) && (
                    <button onClick={() => { set("speakerAImage", ""); set("speakerBImage", ""); }} className="text-[9px] text-gray-500 hover:text-red-400 text-left">Clear images</button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas — always 16:9 */}
        <div ref={canvasContainerRef} className="w-full aspect-video relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black sub-canvas-root">
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${bg})`, opacity: cfg.bgOpacity / 100 }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.4) 100%)" }} />

          {style === 1 && <Style1 {...canvasProps} />}
          {style === 2 && <Style2 {...canvasProps} />}
          {style === 3 && <Style3 {...canvasProps} />}
          {style === 4 && <Style4 {...canvasProps} />}
          {style === 5 && <Style5 {...canvasProps} />}
          {style === 6 && <Style6 {...canvasProps} />}
          {style === 7 && <Style7 {...canvasProps} />}

          <AnimatePresence>
            {phase === "scoring" && scoreData[idx] && !isNarrator && (
              <ScoreCard
                scores={scoreData[idx].modelScores}
                speakerName={isA ? nameA : nameB}
                avg={scoreData[idx].avg} isA={isA}
                totalA={totA} totalB={totB}
                nameA={nameA} nameB={nameB}
                style={cfg.scoreCardStyle}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {phase === "idle" && idx >= dialogues.length - 1 && dialogues.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
                <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 18, stiffness: 220 }}
                  className="text-center px-8 py-10 rounded-3xl border border-white/10 bg-black/60 max-w-sm">
                  <div className="text-4xl mb-3">🏆</div>
                  <h3 className="text-2xl font-black text-white mb-2">Debate Complete!</h3>
                  <div className="flex justify-center gap-4 mt-4 mb-5">
                    <div className="text-center">
                      <div className="text-3xl font-black text-blue-400 tabular-nums">{totA.toFixed(1)}</div>
                      <div className="text-xs text-blue-300 font-bold mt-0.5">{nameA}</div>
                    </div>
                    <div className="text-2xl font-black text-gray-500 self-center">vs</div>
                    <div className="text-center">
                      <div className="text-3xl font-black text-rose-400 tabular-nums">{totB.toFixed(1)}</div>
                      <div className="text-xs text-rose-300 font-bold mt-0.5">{nameB}</div>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mb-4">
                    {totA > totB ? `${nameA} wins!` : totB > totA ? `${nameB} wins!` : "It's a tie!"}
                  </p>
                  <button onClick={() => { setIdx(0); setPhase("idle"); }}
                    className="px-5 py-2 bg-white text-black font-bold rounded-xl text-sm hover:bg-gray-200">
                    Replay from Start
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Playback controls bar */}
      <div className="glass-panel rounded-2xl px-4 py-2.5 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <button onClick={handlePrev} disabled={idx === 0 || phase !== "idle"} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
          <button onClick={handlePlay} className={`px-5 py-1.5 font-bold rounded-xl text-sm flex items-center gap-1.5 transition-all ${phase !== "idle" ? "bg-red-500 text-white hover:bg-red-600" : "bg-primary text-white hover:bg-primary/90"}`}>
            {phase !== "idle" ? <><Square className="w-3.5 h-3.5" />Stop</> : <><Play className="w-3.5 h-3.5" />Play</>}
          </button>
          <button onClick={handleNext} disabled={idx >= dialogues.length - 1 || phase !== "idle"} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"><ArrowRight className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer" onClick={e => {
            if (phase !== "idle") return;
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            setIdx(Math.min(dialogues.length - 1, Math.max(0, Math.round(pct * (dialogues.length - 1)))));
          }}>
            <motion.div className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full"
              animate={{ width: `${dialogues.length > 0 ? ((idx + 1) / dialogues.length) * 100 : 0}%` }}
              transition={{ duration: 0.3 }} />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500 font-medium">
              {phase === "scoring" ? "Scoring…" : phase === "speaking" ? (isNarrator ? nameN : isA ? nameA : nameB) : "Paused"}
            </span>
            <span className="text-[10px] text-gray-600 tabular-nums">{idx + 1} / {dialogues.length}</span>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg tabular-nums font-mono font-bold text-sm transition-all ${phase === "speaking" && !isNarrator ? "bg-primary/20 text-primary" : "bg-white/5 text-gray-500"}`}>
          <span>{fmt(timerSeconds)}</span>
        </div>

        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${phase === "speaking" ? "bg-emerald-500/20 text-emerald-400" : phase === "scoring" ? "bg-amber-500/20 text-amber-400" : "bg-white/5 text-gray-600"}`}>
          {phase === "speaking" ? "Speaking" : phase === "scoring" ? "Scoring" : "Idle"}
        </div>

        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-white/10">
          <div className="text-center">
            <div className="text-xs font-black text-blue-400 tabular-nums">{totA.toFixed(1)}</div>
            <div className="text-[9px] text-gray-600 truncate max-w-[50px]">{nameA}</div>
          </div>
          <div className="text-xs text-gray-600 font-bold">vs</div>
          <div className="text-center">
            <div className="text-xs font-black text-rose-400 tabular-nums">{totB.toFixed(1)}</div>
            <div className="text-[9px] text-gray-600 truncate max-w-[50px]">{nameB}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
