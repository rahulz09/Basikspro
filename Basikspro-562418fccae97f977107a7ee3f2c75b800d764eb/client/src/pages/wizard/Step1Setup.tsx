import { useState, useRef } from "react";
import { Settings, Upload, ArrowRight, Loader2 } from "lucide-react";
import { useUpdateProject } from "@/hooks/use-projects";
import { DURATION_OPTIONS } from "@/components/video/constants";

export function Step1Setup({ project, onNext }: { project: any; onNext: () => void }) {
  const upd = useUpdateProject();
  const ctxFileRef = useRef<HTMLInputElement>(null);
  const [topic, setTopic] = useState(project.topic === "Untitled Debate" ? "" : project.topic);
  const [duration, setDuration] = useState(project.duration || "8");
  const [model, setModel] = useState(project.model || "gemini-3-flash-preview");
  const [contextText, setContextText] = useState(() => localStorage.getItem(`ctx-${project.id}`) || "");
  const [ctxFileName, setCtxFileName] = useState("");

  const handleContextFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setCtxFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => {
      const cleaned = (ev.target?.result as string).slice(0, 8000);
      setContextText(cleaned);
      localStorage.setItem(`ctx-${project.id}`, cleaned);
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-xl mx-auto glass-panel p-6 sm:p-10 rounded-3xl">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-indigo-600/20 rounded-xl flex items-center justify-center ring-1 ring-primary/20">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Configure Debate</h2>
          <p className="text-muted-foreground text-xs">Set topic, duration, model & context</p>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-5" />

      <div className="space-y-7">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Debate Topic</label>
          <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="e.g. AI vs Human Creativity" className="w-full px-4 py-3 rounded-xl glass-input text-base focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Duration (minutes)</label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {DURATION_OPTIONS.map(d => (
              <button key={d} onClick={() => setDuration(String(d))} className={`py-2.5 rounded-xl font-bold text-sm border transition-all ${duration === String(d) ? "bg-primary/20 border-primary text-primary" : "bg-black/20 border-white/10 text-gray-400 hover:border-white/30"}`}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">AI Model</label>
          <div className="space-y-2">
            {[["gemini-3-flash-preview", "Gemini 3 Flash", "Fast"], ["gemini-3.1-pro-preview", "Gemini 3.1 Pro", "Smart"]].map(([mid, name, badge]) => (
              <div key={mid} onClick={() => setModel(mid)} className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 ${model === mid ? "bg-primary/10 border-primary" : "bg-black/20 border-white/10 hover:border-white/30"}`}>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${model === mid ? "border-primary" : "border-gray-500"}`}>{model === mid && <div className="w-2 h-2 bg-primary rounded-full" />}</div>
                <span className={`font-semibold text-sm flex-1 ${model === mid ? "text-white" : "text-gray-300"}`}>{name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${model === mid ? "bg-primary/20 text-primary" : "bg-white/10 text-gray-500"}`}>{badge}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Context File <span className="text-gray-500 font-normal">(optional — .txt or .pdf)</span></label>
          <div className="space-y-2">
            <button onClick={() => ctxFileRef.current?.click()} className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-gray-400 hover:border-primary/50 hover:text-white transition-all flex items-center justify-center gap-2 text-sm">
              <Upload className="w-4 h-4" />
              {ctxFileName ? <span className="text-primary font-medium">{ctxFileName}</span> : <span>Upload .txt or .pdf for AI context</span>}
            </button>
            <input ref={ctxFileRef} type="file" accept=".txt,.pdf,.md,.doc,.docx" className="hidden" onChange={handleContextFile} />
            {contextText && (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Context Preview</span>
                  <button onClick={() => { setContextText(""); setCtxFileName(""); localStorage.removeItem(`ctx-${project.id}`); }} className="text-[10px] text-gray-500 hover:text-red-400">Clear</button>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed line-clamp-3">{contextText}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={async () => { if (!topic.trim()) return; await upd.mutateAsync({ id: project.id, topic, duration, model }); onNext(); }} disabled={!topic.trim() || upd.isPending} className="flex items-center px-7 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50">
            {upd.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />} Continue <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
