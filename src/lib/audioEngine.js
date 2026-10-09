// No context, node, or sound exists until the Sound button grants this visit consent.
const FADE_SECONDS = 0.2;
const MASTER_LEVEL = 0.35;
let audioCtx = null;
let master = null;
let muted = true;
let suspendTimer;
let lastClick = -Infinity;
const droneNodes = [];
const sources = new Set();

export function getAudioContext() {
  return audioCtx;
}

function fadeTo(level) {
  const now = audioCtx.currentTime;
  const gain = master.gain;
  if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
  else {
    const held = gain.value;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(held, now);
  }
  gain.linearRampToValueAtTime(level, now + FADE_SECONDS);
}

async function updateOutput() {
  const context = audioCtx;
  if (!context) return false;
  clearTimeout(suspendTimer);
  if (muted || document.hidden) {
    fadeTo(0);
    // Fade first, then stop DSP work. A new toggle cancels this timer.
    suspendTimer = setTimeout(() => {
      if (audioCtx === context && (muted || document.hidden)) context.suspend().catch(() => {});
    }, FADE_SECONDS * 1000 + 20);
    return true;
  }
  await context.resume();
  if (audioCtx !== context || muted || document.hidden) return false;
  fadeTo(MASTER_LEVEL);
  return context.state === 'running';
}

function handleVisibility() {
  // Resumes only the existing, explicitly enabled context; never creates one.
  void updateOutput().catch(() => {});
}

export async function startSpaceDrone() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext || !navigator.userActivation?.isActive) return false;
    audioCtx = new AudioContext({ latencyHint: 'interactive' });
    master = audioCtx.createGain();
    master.gain.value = 0;
    master.connect(audioCtx.destination);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 110;
    filter.Q.value = 0.5;
    const droneGain = audioCtx.createGain();
    droneGain.gain.value = 0.1;
    filter.connect(droneGain).connect(master);
    droneNodes.push(master, filter, droneGain);

    for (const frequency of [43.65, 55]) {
      const oscillator = audioCtx.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(filter);
      oscillator.start();
      sources.add(oscillator);
    }
    const lfo = audioCtx.createOscillator();
    const depth = audioCtx.createGain();
    lfo.frequency.value = 0.07;
    depth.gain.value = 22;
    lfo.connect(depth).connect(filter.frequency);
    lfo.start();
    sources.add(lfo);
    droneNodes.push(depth);
    document.addEventListener('visibilitychange', handleVisibility);
  }
  return setMuted(false);
}

export function playRadioClick() {
  if (muted || !audioCtx || audioCtx.state !== 'running' || document.hidden) return false;
  const now = audioCtx.currentTime;
  // Keep rapid key repeats from stacking sharp transients.
  if (now - lastClick < 0.04) return false;
  lastClick = now;
  const oscillator = audioCtx.createOscillator();
  const highpass = audioCtx.createBiquadFilter();
  const lowpass = audioCtx.createBiquadFilter();
  const envelope = audioCtx.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = 1400;
  highpass.type = 'highpass';
  highpass.frequency.value = 700;
  highpass.Q.value = 0.5;
  // Soften the square wave's upper harmonics without loading a sample.
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 2600;
  lowpass.Q.value = 0.5;
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(0.04, now + 0.0008);
  envelope.gain.linearRampToValueAtTime(0, now + 0.005);
  oscillator.connect(highpass).connect(lowpass).connect(envelope).connect(master);
  sources.add(oscillator);
  oscillator.onended = () => {
    sources.delete(oscillator);
    [oscillator, highpass, lowpass, envelope].forEach(node => node.disconnect());
    oscillator.onended = null;
  };
  oscillator.start(now);
  oscillator.stop(now + 0.005);
  return true;
}

export function setMuted(value) {
  muted = Boolean(value);
  return updateOutput();
}

export function disposeAudio() {
  clearTimeout(suspendTimer);
  document.removeEventListener('visibilitychange', handleVisibility);
  sources.forEach(source => { source.stop(); source.disconnect(); });
  sources.clear();
  droneNodes.forEach(node => node.disconnect());
  droneNodes.length = 0;
  const context = audioCtx;
  audioCtx = master = null;
  muted = true;
  lastClick = -Infinity;
  if (context && context.state !== 'closed') void context.close().catch(() => {});
}

if (import.meta.hot) import.meta.hot.dispose(disposeAudio);
