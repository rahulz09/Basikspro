import { useState } from "react";
import { FileText, Loader2, Wand2, Edit2, RotateCcw, ArrowRight } from "lucide-react";
import { useUpdateProject, useUpdateDialogue, useGenerateScript, useRewriteDialogue } from "@/hooks/use-projects";

export function Step2Script({ project, onNext }: { project: any; onNext: () => void }) {
  const generateScript = useGenerateScript();
  const updateProject = useUpdateProject();
  const updateDialogue = useUpdateDialogue();
  const rewriteDialogue = useRewriteDialogue();
  const [speakerA, setSpeakerA] = useState(project.speakerAName);
  const [speakerB, setSpeakerB] = useState(project.speakerBName);
  const [narrator, setNarrator] = useState(project.speakerNarratorName || "Narrator");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [rewritingId, setRewritingId] = useState<number | null>(null);
  const [rwInstr, setRwInstr] = useState("");
  const [withoutNarrator, setWithoutNarrator] = useState(false);

  const saveNames = () => {
    const updates: any = { id: project.id };
    if (speakerA !== project.speakerAName) updates.speakerAName = speakerA;
    if (speakerB !== project.speakerBName) updates.speakerBName = speakerB;
    if (narrator !== project.speakerNarratorName) updates.speakerNarratorName = narrator;
    if (Object.keys(updates).length > 1) updateProject.mutate(updates);
  };

  if (!project.dialogues?.length) return (
    <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto py-16">
      <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-indigo-600/20 rounded-full flex items-center justify-center mb-6 ring-2 ring-primary/10">
        <FileText className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-display font-bold text-white mb-3">Generate Script</h2>
      <p className="text-muted-foreground mb-7 text-sm leading-relaxed">AI will draft the debate{withoutNarrator ? " (Speaker A & B only, no narrator)" : " with narrator intro for each argument round"}.</p>
      <div className="glass-panel rounded-xl px-5 py-3 mb-5 border border-primary/10">
        <p className="text-primary text-xs font-bold tracking-wider uppercase mb-0.5">Topic</p>
        <p className="text-white text-sm font-medium">"{project.topic}"</p>
      </div>
      <label className="flex items-center gap-2.5 cursor-pointer mb-7 select-none">
        <button onClick={() => setWithoutNarrator(v => !v)} className={`w-9 h-[18px] rounded-full relative transition-all ${withoutNarrator ? "bg-amber-500" : "bg-white/20"}`}>
          <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[2px] transition-all ${withoutNarrator ? "left-[18px]" : "left-[2px]"}`} />
        </button>
        <span className="text-sm text-gray-300">Without Narrator <span className="text-gray-500 text-xs">(A & B conversation only)</span></span>
      </label>
      <button onClick={() => generateScript.mutateAsync({ projectId: project.id, context: localStorage.getItem(`ctx-${project.id}`) || undefined, withoutNarrator })} disabled={generateScript.isPending} className="px-7 py-3.5 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold rounded-xl flex items-center gap-2 hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] transition-shadow">
        {generateScript.isPending ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><Wand2 className="w-5 h-5" /> Generate Script with AI</>}
      </button>
    </div>
  );

  const dialogues: any[] = [...(project.dialogues || [])].sort((a: any, b: any) => a.sequence - b.sequence);
  const speakerColor = (s: string) => s === "A" ? "indigo" : s === "B" ? "cyan" : "amber";

  const Cell = ({ d }: { d: any }) => {
    const col = speakerColor(d.speaker);
    const gradientFrom = col === "indigo" ? "from-indigo-500 to-indigo-700" : col === "cyan" ? "from-cyan-500 to-cyan-700" : "from-amber-500 to-amber-700";
    const textCol = col === "indigo" ? "text-indigo-400" : col === "cyan" ? "text-cyan-400" : "text-amber-400";

    if (editingId === d.id) return (
      <div className="p-3 space-y-2">
        <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full h-24 glass-input p-2 rounded-lg resize-none text-white text-sm" autoFocus />
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs text-gray-400">Cancel</button>
          <button onClick={async () => { await updateDialogue.mutateAsync({ id: d.id, projectId: project.id, text: editText }); setEditingId(null); }} disabled={updateDialogue.isPending} className="px-2 py-1 text-xs bg-primary text-white rounded">{updateDialogue.isPending ? "..." : "Save"}</button>
        </div>
      </div>
    );
    if (rewritingId === d.id) return (
      <div className="p-3 space-y-2">
        <div className="p-2 bg-black/30 rounded text-gray-400 text-[11px] line-clamp-2">"{d.text}"</div>
        <input value={rwInstr} onChange={e => setRwInstr(e.target.value)} placeholder={d.speaker === "N" ? "Make it more dramatic..." : "Make it more aggressive..."} className="w-full glass-input p-2 rounded text-white text-xs" autoFocus />
        <div className="flex justify-end gap-2">
          <button onClick={() => setRewritingId(null)} className="px-2 py-1 text-xs text-gray-400">Cancel</button>
          <button onClick={async () => { await rewriteDialogue.mutateAsync({ dialogueId: d.id, projectId: project.id, instructions: rwInstr }); setRewritingId(null); setRwInstr(""); }} disabled={!rwInstr || rewriteDialogue.isPending} className={`px-2 py-1 text-xs text-white rounded bg-gradient-to-r ${gradientFrom} flex items-center gap-1`}>
            {rewriteDialogue.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} AI Rewrite
          </button>
        </div>
      </div>
    );
    return (
      <div className="p-3 group relative">
        <p className="text-gray-100 text-xs sm:text-sm leading-relaxed">{d.text}</p>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
          <button onClick={() => { setEditingId(d.id); setEditText(d.text); }} className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded"><Edit2 className="w-3 h-3" /></button>
          <button onClick={() => setRewritingId(d.id)} className={`p-1 hover:bg-white/10 rounded ${textCol}`}><Wand2 className="w-3 h-3" /></button>
        </div>
      </div>
    );
  };

  const rounds: { narrator?: any; speakerA?: any; speakerB?: any }[] = [];
  let cur: { narrator?: any; speakerA?: any; speakerB?: any } = {};
  for (const d of dialogues) {
    if (d.speaker === "N") {
      if (cur.speakerA || cur.speakerB || cur.narrator) { rounds.push(cur); cur = {}; }
      cur.narrator = d;
    } else if (d.speaker === "A") {
      if (cur.speakerA) { rounds.push(cur); cur = { narrator: undefined }; }
      cur.speakerA = d;
    } else {
      cur.speakerB = d; rounds.push(cur); cur = {};
    }
  }
  if (cur.narrator || cur.speakerA || cur.speakerB) rounds.push(cur);

  return (
    <div className="max-w-4xl mx-auto flex flex-col" style={{ height: "calc(100vh - 130px)" }}>
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div>
          <h2 className="text-xl font-display font-bold text-white">Script Editor</h2>
          <p className="text-muted-foreground text-xs">Click any line to edit • AI-rewrite available</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 glass-panel px-3 py-1.5 rounded-xl border border-white/10">
            <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center font-bold text-[9px]">A</span>
            <input value={speakerA} onChange={e => setSpeakerA(e.target.value)} onBlur={saveNames} className="bg-transparent text-white text-xs font-bold w-20 focus:outline-none" />
            <span className="text-white/20">|</span>
            <span className="w-4 h-4 rounded-full bg-cyan-500/30 text-cyan-300 flex items-center justify-center font-bold text-[9px]">B</span>
            <input value={speakerB} onChange={e => setSpeakerB(e.target.value)} onBlur={saveNames} className="bg-transparent text-white text-xs font-bold w-20 focus:outline-none" />
            <span className="text-white/20">|</span>
            <span className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 flex items-center justify-center font-bold text-[9px]">N</span>
            <input value={narrator} onChange={e => setNarrator(e.target.value)} onBlur={saveNames} className="bg-transparent text-amber-300 text-xs font-bold w-16 focus:outline-none" />
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <button onClick={() => setWithoutNarrator(v => !v)} className={`w-8 h-[16px] rounded-full relative transition-all ${withoutNarrator ? "bg-amber-500" : "bg-white/20"}`}>
              <div className={`w-3 h-3 bg-white rounded-full absolute top-[2px] transition-all ${withoutNarrator ? "left-[18px]" : "left-[2px]"}`} />
            </button>
            <span className="text-[10px] text-gray-400">No Narrator</span>
          </label>
          <button onClick={() => generateScript.mutateAsync({ projectId: project.id, context: localStorage.getItem(`ctx-${project.id}`) || undefined, withoutNarrator })} disabled={generateScript.isPending} className="px-3 py-2 text-xs border border-white/20 text-gray-300 rounded-xl hover:bg-white/5 flex items-center gap-1.5">
            {generateScript.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />} Regenerate
          </button>
          <button onClick={onNext} className="px-5 py-2 bg-white text-black font-bold rounded-xl text-sm hover:bg-gray-200 flex items-center gap-1.5">Next <ArrowRight className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {rounds.map((round, i) => (
          <div key={i} className="rounded-2xl border border-white/10 overflow-hidden glass-panel">
            <div className="px-4 py-2.5 bg-white/5 border-b border-white/10 flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Argument {i + 1}</span>
              {round.narrator && <span className="text-[9px] text-amber-500/70 ml-auto">with narrator intro</span>}
            </div>
            {round.narrator && (
              <div className="border-b border-amber-500/15 bg-amber-500/[0.04] px-4 py-1 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[9px] shrink-0">N</span>
                <span className="text-amber-400/60 text-[10px] font-bold">{narrator}</span>
              </div>
            )}
            {round.narrator && <div className="border-b border-amber-500/10"><Cell d={round.narrator} /></div>}
            <div className="grid grid-cols-2">
              <div className="border-r border-white/5">
                <div className="px-3 py-1.5 border-b border-indigo-500/20 bg-indigo-500/[0.04] flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-[9px]">A</span>
                  <span className="text-indigo-300/70 text-[10px] font-bold">{speakerA}</span>
                </div>
                {round.speakerA ? <Cell d={round.speakerA} /> : <div className="p-4 text-gray-600 text-xs italic text-center">—</div>}
              </div>
              <div>
                <div className="px-3 py-1.5 border-b border-cyan-500/20 bg-cyan-500/[0.04] flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-[9px]">B</span>
                  <span className="text-cyan-300/70 text-[10px] font-bold">{speakerB}</span>
                </div>
                {round.speakerB ? <Cell d={round.speakerB} /> : <div className="p-4 text-gray-600 text-xs italic text-center">—</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
