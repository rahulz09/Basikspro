import { AI_MODELS } from "./constants";

export function dialogueDuration(text: string) {
  return Math.max(5, Math.min(45, Math.round(text.split(/\s+/).length / 2.5)));
}

export function fmt(s: number) {
  const v = Math.max(0, s);
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  } catch { return `rgba(10,10,20,${alpha})`; }
}

function hashText(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) { h = ((h << 5) - h) + text.charCodeAt(i); h |= 0; }
  return Math.abs(h);
}

export function genScores(text: string) {
  const h = hashText(text);
  return AI_MODELS.map((m, i) => ({ ...m, score: +(6.2 + ((h * (i + 7)) % 32) / 10).toFixed(1) }));
}

// ── Web Audio ──────────────────────────────────────────────────────────────────
let _ac: AudioContext | null = null;

export function getAC(): AudioContext | null {
  try {
    if (!_ac) _ac = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (_ac.state === "suspended") _ac.resume().catch(() => {});
    return _ac;
  } catch { return null; }
}

export function unlockAudio() {
  const ac = getAC();
  if (ac && ac.state === "suspended") ac.resume().catch(() => {});
}

function playTone(freq: number, dur: number, vol = 0.25, type: OscillatorType = "sine") {
  try {
    const ac = getAC(); if (!ac) return;
    const osc = ac.createOscillator(); const g = ac.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.connect(g); g.connect(ac.destination);
    osc.start(); osc.stop(ac.currentTime + dur);
  } catch { /* audio blocked */ }
}

export function playScoreReveal() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.18, 0.3, "triangle"), i * 110));
}
export function playCountdownBeep() { playTone(440, 0.08, 0.18); }
export function playTransition() {
  [880, 1100].forEach((f, i) => setTimeout(() => playTone(f, 0.12, 0.2), i * 90));
}
