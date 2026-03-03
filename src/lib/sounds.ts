"use client";

// Lightweight Web Audio API sound engine — no files needed
let audioCtx: AudioContext | null = null;
let enabled = false;

export function isSoundEnabled(): boolean {
  return enabled;
}

export function toggleSound(): boolean {
  enabled = !enabled;
  if (enabled && !audioCtx) {
    audioCtx = new AudioContext();
  }
  return enabled;
}

function getCtx(): AudioContext | null {
  if (!enabled) return null;
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// Soft click — for button presses, navigation
export function playClick() {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.value = 800;
  gain.gain.value = 0.03;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.08);
}

// Success chime — for completed actions
export function playSuccess() {
  const ctx = getCtx();
  if (!ctx) return;
  const notes = [523, 659, 784]; // C5, E5, G5
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.value = 0.025;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.2);
    osc.start(ctx.currentTime + i * 0.12);
    osc.stop(ctx.currentTime + i * 0.12 + 0.2);
  });
}

// Alert tone — for warnings/at-risk
export function playAlert() {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "triangle";
  osc.frequency.value = 440;
  osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.3);
  gain.gain.value = 0.03;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.3);
}

// Ambient hum — subtle background atmosphere (one-shot)
export function playAmbient() {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = "sine";
  osc.frequency.value = 220;
  gain.gain.value = 0.008;
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 2);
}
