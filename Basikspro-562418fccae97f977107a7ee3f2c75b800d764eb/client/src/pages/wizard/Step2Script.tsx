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
    const bgHover = col === "indigo" ? "hover:bg-indigo-500/10" : col === "cyan" ? "hover:bg-cyan-500/10" : "hover:bg-amber-500/10";

    if (editingId === d.id) return (
      <div className="p-4 space-y-3 bg-black/20">
        <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full h-28 bg-white/5 border border-white/20 focus:border-primary/50 p-3 rounded-lg resize-none text-white text-sm leading-relaxed focus:outline-none transition-colors" autoFocus />
        <div className="flex justify-end gap-2">
          <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button onClick={async () => { await updateDialogue.mutateAsync({ id: d.id, projectId: project.id, text: editText }); setEditingId(null); }} disabled={updateDialogue.isPending} className="px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">{updateDialogue.isPending ? "Saving..." : "Save Changes"}</button>
        </div>
      </div>
    );
    if (rewritingId === d.id) return (
      <div className="p-4 space-y-3 bg-black/20">
        <div className="p-3 bg-black/40 rounded-lg border border-white/10">
          <p className="text-gray-300 text-xs leading-relaxed">"{d.text}"</p>
        </div>
        <input value={rwInstr} onChange={e => setRwInstr(e.target.value)} placeholder={d.speaker === "N" ? "e.g., Make it more dramatic and engaging..." : "e.g., Make it more persuasive and confident..."} className="w-full bg-white/5 border border-white/20 focus:border-primary/50 p-3 rounded-lg text-white text-sm focus:outline-none transition-colors placeholder:text-gray-500" autoFocus />
        <div className="flex justify-end gap-2">
          <button onClick={() => setRewritingId(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
          <button onClick={async () => { await rewriteDialogue.mutateAsync({ dialogueId: d.id, projectId: project.id, instructions: rwInstr }); setRewritingId(null); setRwInstr(""); }} disabled={!rwInstr || rewriteDialogue.isPending} className={`px-4 py-2 text-sm text-white rounded-lg font-medium flex items-center gap-2 bg-gradient-to-r ${gradientFrom} hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed`}>
            {rewriteDialogue.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Rewriting...</> : <><Wand2 className="w-4 h-4" /> AI Rewrite</>}
          </button>
        </div>
      </div>
    );
    return (
      <div className={`p-4 group relative transition-colors ${bgHover}`}>
        <p className="text-gray-100 text-sm leading-relaxed pr-20">{d.text}</p>
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 flex gap-1.5 transition-opacity">
          <button onClick={() => { setEditingId(d.id); setEditText(d.text); }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="Edit">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setRewritingId(d.id)} className={`p-2 hover:bg-white/10 rounded-lg transition-all ${textCol}`} title="AI Rewrite">
            <Wand2 className="w-4 h-4" />
          </button>
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
    <div className="max-w-5xl mx-auto flex flex-col" style={{ height: "calc(100vh - 130px)" }}>
      <div className="flex justify-between items-start mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-display font-bold text-white mb-1.5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-indigo-600/20 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            Script Editor
          </h2>
          <p className="text-muted-foreground text-sm">Click any dialogue to edit or use AI to rewrite</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => generateScript.mutateAsync({ projectId: project.id, context: localStorage.getItem(`ctx-${project.id}`) || undefined, withoutNarrator })} disabled={generateScript.isPending} className="px-4 py-2.5 text-sm border border-white/20 text-gray-300 rounded-xl hover:bg-white/5 hover:border-white/30 transition-all flex items-center gap-2">
            {generateScript.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} Regenerate
          </button>
          <button onClick={onNext} className="px-6 py-2.5 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold rounded-xl text-sm hover:shadow-[0_0_25px_rgba(124,58,237,0.4)] transition-all flex items-center gap-2">
            Next <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-white/10 p-4 mb-5 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-500/30">A</span>
              <input value={speakerA} onChange={e => setSpeakerA(e.target.value)} onBlur={saveNames} className="bg-white/5 border border-white/10 text-white text-sm font-semibold px-3 py-2 rounded-lg w-32 focus:outline-none focus:border-indigo-500/50 transition-colors" placeholder="Speaker A" />
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs border border-cyan-500/30">B</span>
              <input value={speakerB} onChange={e => setSpeakerB(e.target.value)} onBlur={saveNames} className="bg-white/5 border border-white/10 text-white text-sm font-semibold px-3 py-2 rounded-lg w-32 focus:outline-none focus:border-cyan-500/50 transition-colors" placeholder="Speaker B" />
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-500/30">N</span>
              <input value={narrator} onChange={e => setNarrator(e.target.value)} onBlur={saveNames} className="bg-white/5 border border-white/10 text-amber-300 text-sm font-semibold px-3 py-2 rounded-lg w-28 focus:outline-none focus:border-amber-500/50 transition-colors" placeholder="Narrator" />
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none glass-panel px-4 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 transition-colors">
            <button onClick={() => setWithoutNarrator(v => !v)} className={`w-10 h-5 rounded-full relative transition-all ${withoutNarrator ? "bg-amber-500" : "bg-white/20"}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-lg ${withoutNarrator ? "left-[22px]" : "left-0.5"}`} />
            </button>
            <span className="text-xs text-gray-300 font-medium">Without Narrator</span>
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-2">
        {rounds.map((round, i) => (
          <div key={i} className="rounded-2xl border border-white/10 overflow-hidden glass-panel shadow-xl">
            <div className="px-5 py-3 bg-gradient-to-r from-white/5 to-white/[0.02] border-b border-white/10 flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-black text-primary">{i + 1}</span>
              </div>
              <span className="text-sm font-bold text-white">Argument Round {i + 1}</span>
              {round.narrator && <span className="text-xs text-amber-400/70 ml-auto px-2 py-1 bg-amber-500/10 rounded-md border border-amber-500/20">+ Narrator</span>}
            </div>
            {round.narrator && (
              <>
                <div className="border-b border-amber-500/20 bg-gradient-to-r from-amber-500/[0.08] to-amber-500/[0.02] px-4 py-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-amber-500/25 text-amber-300 flex items-center justify-center font-bold text-xs border border-amber-500/30 shrink-0">N</span>
                  <span className="text-amber-300/80 text-xs font-bold">{narrator}</span>
                </div>
                <div className="border-b border-amber-500/10 bg-amber-500/[0.02]"><Cell d={round.narrator} /></div>
              </>
            )}
            <div className="grid grid-cols-2">
              <div className="border-r border-white/10">
                <div className="px-4 py-2 border-b border-indigo-500/20 bg-gradient-to-r from-indigo-500/[0.08] to-indigo-500/[0.02] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-500/25 text-indigo-300 flex items-center justify-center font-bold text-xs border border-indigo-500/30">A</span>
                  <span className="text-indigo-300/80 text-xs font-bold">{speakerA}</span>
                </div>
                {round.speakerA ? <Cell d={round.speakerA} /> : <div className="p-6 text-gray-600 text-xs italic text-center">No dialogue</div>}
              </div>
              <div>
                <div className="px-4 py-2 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-500/[0.08] to-cyan-500/[0.02] flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-cyan-500/25 text-cyan-300 flex items-center justify-center font-bold text-xs border border-cyan-500/30">B</span>
                  <span className="text-cyan-300/80 text-xs font-bold">{speakerB}</span>
                </div>
                {round.speakerB ? <Cell d={round.speakerB} /> : <div className="p-6 text-gray-600 text-xs italic text-center">No dialogue</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
