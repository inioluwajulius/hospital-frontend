/**
 * Incoming-call ringtone, synthesised with the Web Audio API (no audio file or service).
 *
 * Browsers only allow sound after the person has interacted with the page. The audio
 * context is unlocked on the first click/tap/key press anywhere in the app, so ringing
 * normally just works; if the page was opened and never touched, start() reports
 * 'blocked' and the popup offers a button to turn the sound on.
 */

const RING_EVERY_MS = 3000;
const VOLUME = 0.2;

let ctx = null;
let loop = null;
let wanted = false; // a ring was requested and not stopped yet
let onChange = () => {};

const getContext = () => {
  if (ctx) return ctx;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx = new AudioCtx();
  return ctx;
};

// Two short bursts of a 440 + 480 Hz tone (the familiar telephone ring)
const ringOnce = () => {
  const now = ctx.currentTime;
  [0, 0.55].forEach((offset) => {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now + offset);
    gain.gain.linearRampToValueAtTime(VOLUME, now + offset + 0.03);
    gain.gain.setValueAtTime(VOLUME, now + offset + 0.4);
    gain.gain.linearRampToValueAtTime(0, now + offset + 0.45);
    gain.connect(ctx.destination);
    [440, 480].forEach((frequency) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = frequency;
      osc.connect(gain);
      osc.start(now + offset);
      osc.stop(now + offset + 0.46);
    });
  });
};

const setStatus = (status) => {
  if (typeof document !== 'undefined') document.body.dataset.ringtone = status;
  onChange(status);
};

const beginLoop = () => {
  if (loop || !wanted || ctx?.state !== 'running') return;
  ringOnce();
  loop = setInterval(ringOnce, RING_EVERY_MS);
  setStatus('playing');
};

const resume = async () => {
  const audio = getContext();
  if (!audio) return false;
  if (audio.state !== 'running') {
    // resume() can stay pending without a user gesture, so don't wait on it for long
    await Promise.race([audio.resume().catch(() => {}), new Promise((r) => setTimeout(r, 300))]);
  }
  return audio.state === 'running';
};

/** Start ringing. Calls back with 'playing' | 'blocked' | 'unsupported' | 'stopped'. */
export const startRingtone = async (statusCallback) => {
  onChange = statusCallback || (() => {});
  wanted = true;
  if (!getContext()) return setStatus('unsupported');
  if (await resume()) beginLoop();
  else if (wanted) setStatus('blocked');
};

/** Retry after the person tapped "turn on sound" (a user gesture) */
export const enableRingtone = async () => {
  if (await resume()) beginLoop();
};

export const stopRingtone = () => {
  wanted = false;
  clearInterval(loop);
  loop = null;
  setStatus('stopped');
};

// Unlock audio on the first interaction anywhere in the app, and resume a blocked ring then
if (typeof window !== 'undefined') {
  const unlock = () => { resume().then((ok) => { if (ok) beginLoop(); }); };
  ['pointerdown', 'keydown', 'touchend'].forEach((type) => window.addEventListener(type, unlock, { capture: true, passive: true }));
}
