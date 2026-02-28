// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;

// Reuse a single AudioContext across all calls to avoid hitting browser limits
let _ctx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (!AudioContextClass) return null;
  if (!_ctx || _ctx.state === "closed") {
    _ctx = new AudioContextClass();
  }
  return _ctx;
}

export const playAudio = (type: 'success' | 'error') => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume context if it was suspended (e.g. browser autoplay policy)
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'success') {
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.setValueAtTime(1108.73, ctx.currentTime + 0.1); // C#6
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } else {
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }
};
