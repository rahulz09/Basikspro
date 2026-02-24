import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Settings, FileText, Mic, LayoutTemplate, ArrowLeft, Loader2, Video } from "lucide-react";
import { useProject } from "@/hooks/use-projects";
import { VideoConfigProvider } from "@/components/video/VideoConfigContext";
import { Step1Setup } from "./wizard/Step1Setup";
import { Step2Script } from "./wizard/Step2Script";
import { Step3Audio } from "./wizard/Step3Audio";
import { Step4Preview } from "./wizard/Step4Preview";

function WizardContent() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || "0");
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const [currentStep, setCurrentStep] = useState(parseInt(searchParams.get("step") || "1"));
  const { data: project, isLoading } = useProject(projectId);

  useEffect(() => {
    const url = `/projects/${projectId}?step=${currentStep}`;
    if (location !== url) window.history.replaceState(null, "", url);
  }, [currentStep, projectId, location]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary animate-spin" /></div>;
  if (!project) return <div className="min-h-screen flex items-center justify-center text-white">Project not found</div>;

  const steps = [
    { num: 1, title: "Setup", icon: Settings },
    { num: 2, title: "Script", icon: FileText },
    { num: 3, title: "Audio", icon: Mic },
    { num: 4, title: "Preview", icon: LayoutTemplate },
  ];

  return (
    <div className="min-h-screen flex flex-col max-w-[1600px] mx-auto">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 px-4 py-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 shrink-0">
          <button onClick={() => setLocation("/")} className="p-2 hover:bg-white/5 rounded-xl text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary to-indigo-600 rounded-lg flex items-center justify-center">
              <Video className="w-3.5 h-3.5 text-white" />
            </div>
            <h1 className="font-display font-bold text-sm text-white truncate max-w-[180px]">
              {project.topic !== "Untitled Debate" ? project.topic : "New Debate"}
            </h1>
          </div>
        </div>

        <nav className="flex-1 flex justify-center">
          <ol className="flex items-center bg-black/30 rounded-xl border border-white/5 p-1 gap-0.5">
            {steps.map((step) => {
              const isActive = currentStep === step.num;
              const isPast = currentStep > step.num;
              const Icon = step.icon;
              return (
                <li key={step.num}>
                  <button onClick={() => setCurrentStep(step.num)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isActive ? "bg-primary text-white shadow-md shadow-primary/30" : isPast ? "text-primary hover:bg-white/5" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}>
                    {isPast ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{step.title}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Spacer to balance left side */}
        <div className="w-[60px] shrink-0" />
      </header>

      <main className="flex-1 overflow-x-hidden overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="h-full">
            {currentStep === 1 && <div className="p-4 sm:p-6 lg:p-10"><Step1Setup project={project} onNext={() => setCurrentStep(2)} /></div>}
            {currentStep === 2 && <div className="p-4 sm:p-6 lg:p-10"><Step2Script project={project} onNext={() => setCurrentStep(3)} /></div>}
            {currentStep === 3 && <div className="p-4 sm:p-6 lg:p-10"><Step3Audio project={project} onNext={() => setCurrentStep(4)} /></div>}
            {currentStep === 4 && <Step4Preview project={project} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function Wizard() {
  return (
    <VideoConfigProvider>
      <WizardContent />
    </VideoConfigProvider>
  );
}
