import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Mic, Volume2, Play, Pause, Download, Loader2, Check, RefreshCw, AlignJustify, Captions, ArrowRight } from "lucide-react";
import { useUpdateProject, useGenerateTranscript } from "@/hooks/use-projects";
import { api, buildUrl } from "@shared/routes";
import { AUDIO_PROVIDERS, getVoicesForProvider } from "@/components/video/constants";

export function Step3Audio({ project, onNext }: { project: any; onNext: () => void }) {
  const upd = useUpdateProject();
  const queryClient = useQueryClient();
  const genTranscript = useGenerateTranscript();
  const defaultProvider = (project.audioProvider === "openai" || !project.audioProvider) ? "gemini" : project.audioProvider;
  const [provider, setProvider] = useState(defaultProvider);
  const voices = getVoicesForProvider(provider);
  const [voiceA, setVoiceA] = useState(project.speakerAVoice || voices[0]?.id);
  const [voiceB, setVoiceB] = useState(project.speakerBVoice || voices[1]?.id);
  const [voiceN, setVoiceN] = useState(project.speakerNarratorVoice || voices[2]?.id);
  const [generating, setGenerating] = useState<Set<number>>(new Set());
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [genProgress, setGenProgress] = useState(0);
  const [genBusy, setGenBusy] = useState(false);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [captionsDone, setCaptionsDone] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sortedDialogues: any[] = [...(project.dialogues || [])].sort((a, b) => a.sequence - b.sequence);
  const allDone = sortedDialogues.every((d: any) => d.audioUrl);
  const doneCount = sortedDialogues.filter((d: any) => d.audioUrl).length;

  const saveVoice = (key: string, val: string) => upd.mutate({ id: project.id, [key]: val });

  const switchProvider = (p: string) => {
    setProvider(p);
    const v = getVoicesForProvider(p);
    const a = v[0]?.id; const b = v[1]?.id; const n = v[2]?.id;
    setVoiceA(a); setVoiceB(b); setVoiceN(n);
    upd.mutate({ id: project.id, audioProvider: p, speakerAVoice: a, speakerBVoice: b, speakerNarratorVoice: n });
  };

  const genOne = async (dialogueId: number) => {
    setGenerating(prev => new Set(prev).add(dialogueId));
    setFailed(prev => { const s = new Set(prev); s.delete(dialogueId); return s; });
    try {
      const res = await fetch(buildUrl(api.ai.generateAudio.path, { id: dialogueId }), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", credentials: "include",
      });
      if (!res.ok) throw new Error("failed");
      queryClient.invalidateQueries({ queryKey: [api.projects.get.path, project.id] });
    } catch {
      setFailed(prev => new Set(prev).add(dialogueId));
    } finally {
      setGenerating(prev => { const s = new Set(prev); s.delete(dialogueId); return s; });
    }
  };

  const genAll = async () => {
    setGenBusy(true); setGenProgress(0);
    const total = sortedDialogues.length; let done = 0;
    await Promise.allSettled(sortedDialogues.map(async (d: any) => {
      setGenerating(prev => new Set(prev).add(d.id));
      try {
        await fetch(buildUrl(api.ai.generateAudio.path, { id: d.id }), {
          method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", credentials: "include",
        });
      } finally {
        done++; setGenProgress(Math.round((done / total) * 100));
        setGenerating(prev => { const s = new Set(prev); s.delete(d.id); return s; });
      }
    }));
    queryClient.invalidateQueries({ queryKey: [api.projects.get.path, project.id] });
    setGenBusy(false);
  };

  const playAudio = (d: any) => {
    if (playingId === d.id) { audioRef.current?.pause(); setPlayingId(null); return; }
    audioRef.current?.pause();
    const audio = new Audio(d.audioUrl); audioRef.current = audio;
    audio.onended = () => setPlayingId(null);
    audio.play(); setPlayingId(d.id);
  };

  const syncTranscripts = async () => {
    const withAudio = sortedDialogues.filter((d: any) => d.audioUrl && !d.transcript);
    await Promise.allSettled(withAudio.map((d: any) =>
      genTranscript.mutateAsync({ dialogueId: d.id, projectId: project.id })
    ));
  };

  const genSRT = () => {
    let srt = "", t = 0;
    sortedDialogues.forEach((d: any, i: number) => {
      const dur = Math.max(2, d.text.split(" ").length / 2.5);
      const fmtT = (s: number) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60), ms = Math.floor((s % 1) * 1000); return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms).padStart(3, "0")}`; };
      const name = d.speaker === "A" ? project.speakerAName : d.speaker === "B" ? project.speakerBName : project.speakerNarratorName;
      srt += `${i + 1}\n${fmtT(t)} --> ${fmtT(t + dur)}\n[${name}] ${d.transcript || d.text}\n\n`;
      t += dur + 0.5;
    });
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([srt], { type: "text/plain" }));
    a.download = `${project.topic.replace(/\s+/g, "_")}.srt`; a.click(); setCaptionsDone(true);
  };

  const speakerCfg = [
    { speaker: "A", name: project.speakerAName, voice: voiceA, colorBorder: "border-t-indigo-500", colorBg: "bg-indigo-500/20", colorText: "text-indigo-400", setVoice: (v: string) => { setVoiceA(v); saveVoice("speakerAVoice", v); } },
    { speaker: "B", name: project.speakerBName, voice: voiceB, colorBorder: "border-t-cyan-500", colorBg: "bg-cyan-500/20", colorText: "text-cyan-400", setVoice: (v: string) => { setVoiceB(v); saveVoice("speakerBVoice", v); } },
    { speaker: "N", name: project.speakerNarratorName || "Narrator", voice: voiceN, colorBorder: "border-t-amber-500", colorBg: "bg-amber-500/20", colorText: "text-amber-400", setVoice: (v: string) => { setVoiceN(v); saveVoice("speakerNarratorVoice", v); } },
  ];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-5" style={{ height: "calc(100vh - 130px)" }}>
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500/20 to-indigo-600/20 rounded-xl flex items-center justify-center ring-1 ring-violet-500/20">
            <Mic className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">Voice Synthesis</h2>
            <p className="text-muted-foreground text-xs">Pick provider & voices, generate in parallel</p>
          </div>
        </div>
        <button onClick={onNext} disabled={!allDone} className="px-5 py-2 bg-white text-black font-bold rounded-xl text-sm hover:bg-gray-200 disabled:opacity-40 flex items-center gap-1.5">Next <ArrowRight className="w-4 h-4" /></button>
      </div>

      <div className="glass-panel rounded-2xl p-4 shrink-0 space-y-4">
        <div className="flex gap-1.5 p-1 bg-black/30 rounded-xl">
          {AUDIO_PROVIDERS.map(p => (
            <button key={p.id} onClick={() => switchProvider(p.id)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${provider === p.id ? "bg-primary text-white shadow" : "text-gray-400 hover:text-white"}`}>
              {p.name} <span className="opacity-50 font-normal">— {p.desc}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {speakerCfg.map(sp => (
            <div key={sp.speaker} className={`rounded-xl border-t-2 ${sp.colorBorder} glass-panel p-3`}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className={`w-5 h-5 rounded-full ${sp.colorBg} ${sp.colorText} flex items-center justify-center font-bold text-[9px]`}>{sp.speaker}</span>
                <span className="text-white font-bold text-xs truncate">{sp.name}</span>
              </div>
              <select value={sp.voice} onChange={e => sp.setVoice(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-white/30 cursor-pointer">
                {voices.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={genAll} disabled={genBusy} className="px-5 py-2 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 hover:-translate-y-0.5 transition-all disabled:opacity-50">
            <Volume2 className="w-4 h-4" />
            {genBusy ? `Generating… ${genProgress}%` : allDone ? "Regenerate All" : "Generate All (Parallel)"}
          </button>
          {allDone && (
            <>
              <button onClick={syncTranscripts} disabled={genTranscript.isPending} className="px-4 py-2 bg-violet-600/80 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-violet-600">
                <AlignJustify className="w-3.5 h-3.5" /> {genTranscript.isPending ? "Syncing…" : "Sync Transcripts"}
              </button>
              <button onClick={genSRT} className="px-4 py-2 bg-emerald-600/80 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-emerald-600">
                <Captions className="w-3.5 h-3.5" /> {captionsDone ? "Download Again" : "Export SRT"}
              </button>
            </>
          )}
          <span className="ml-auto text-gray-500 text-xs">{doneCount}/{sortedDialogues.length} ready</span>
        </div>
        {genBusy && (
          <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300" style={{ width: `${genProgress}%` }} />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
        {sortedDialogues.map((d: any) => {
          const isGen = generating.has(d.id), isFail = failed.has(d.id), isPlay = playingId === d.id;
          const borderCol = isFail ? "border-red-500/40 bg-red-500/[0.04]" : d.speaker === "A" ? "border-indigo-500/20 bg-indigo-500/[0.03]" : d.speaker === "B" ? "border-cyan-500/20 bg-cyan-500/[0.03]" : "border-amber-500/20 bg-amber-500/[0.03]";
          const badgeCol = d.speaker === "A" ? "bg-indigo-500/20 text-indigo-400" : d.speaker === "B" ? "bg-cyan-500/20 text-cyan-400" : "bg-amber-500/20 text-amber-400";
          return (
            <div key={d.id} className={`flex items-center gap-2 p-2.5 rounded-xl border glass-panel text-xs ${borderCol}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0 ${badgeCol}`}>{d.speaker}</div>
              <p className="text-gray-300 flex-1 line-clamp-1">{d.transcript || d.text}</p>
              {isFail && <span className="text-red-400 text-[10px] font-bold shrink-0">Failed</span>}
              <div className="flex items-center gap-1 shrink-0">
                {d.audioUrl && (
                  <button onClick={() => playAudio(d)} className={`p-1 rounded-full ${isPlay ? "bg-primary/30 text-primary" : "text-gray-500 hover:text-white hover:bg-white/10"}`}>
                    {isPlay ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                )}
                {d.audioUrl && (
                  <a href={d.audioUrl} download={`${d.speaker}_${d.sequence ?? ""}.wav`} className="p-1 rounded-full text-gray-500 hover:text-white hover:bg-white/10">
                    <Download className="w-3 h-3" />
                  </a>
                )}
                <button onClick={() => genOne(d.id)} disabled={isGen} className={`p-1 rounded-full disabled:opacity-40 ${isFail ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-gray-500 hover:text-white hover:bg-white/10"}`}>
                  {isGen ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                </button>
                {!isFail && (d.audioUrl ? <Check className="w-3 h-3 text-green-400" /> : <span className="text-gray-600 text-[10px]">—</span>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
