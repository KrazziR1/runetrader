// â”€â”€ SoundEngine.js â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// All sounds synthesized via Web Audio API â€” zero external files.
// Call initAudio() once on first user interaction, then use play*() anywhere.

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function isMuted() {
  try { return localStorage.getItem("rt_sound_muted") === "1"; } catch { return false; }
}

export function toggleMute() {
  const next = !isMuted();
  localStorage.setItem("rt_sound_muted", next ? "1" : "0");
  return next;
}

export function getSoundMuted() { return isMuted(); }

// â”€â”€ Utility: play a sequence of notes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function playTone(freq, startTime, duration, type = "sine", gainVal = 0.18, fadeOut = true) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(c.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(gainVal, startTime);
  if (fadeOut) gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}

// â”€â”€ Coin clink â€” small profit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function playCoinClink() {
  if (isMuted()) return;
  const c = getCtx();
  const now = c.currentTime;
  playTone(1046, now,        0.08, "triangle", 0.14);
  playTone(1318, now + 0.04, 0.08, "triangle", 0.10);
}

// â”€â”€ Big profit â€” 1M+ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function playBigProfit() {
  if (isMuted()) return;
  const c = getCtx();
  const now = c.currentTime;
  // Ascending arpeggio
  [523, 659, 784, 1047].forEach((freq, i) => {
    playTone(freq, now + i * 0.07, 0.15, "triangle", 0.12);
  });
}

// â”€â”€ Epic profit â€” 10M+ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function playEpicProfit() {
  if (isMuted()) return;
  const c = getCtx();
  const now = c.currentTime;
  // Full fanfare
  [392, 523, 659, 784, 1047, 1319].forEach((freq, i) => {
    playTone(freq, now + i * 0.06, 0.2, "triangle", 0.13);
  });
  // Low bass hit
  playTone(98, now, 0.4, "sawtooth", 0.08, true);
}

// â”€â”€ Level up â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function playLevelUp() {
  if (isMuted()) return;
  const c = getCtx();
  const now = c.currentTime;
  // Classic ascending + hold
  const notes = [523, 659, 784, 1047, 1319, 1047, 1319];
  notes.forEach((freq, i) => {
    playTone(freq, now + i * 0.08, i === notes.length - 1 ? 0.5 : 0.1, "triangle", 0.15);
  });
}

// â”€â”€ Quest complete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function playQuestComplete() {
  if (isMuted()) return;
  const c = getCtx();
  const now = c.currentTime;
  // Cheerful two-note chime
  playTone(784,  now,        0.12, "triangle", 0.15);
  playTone(1047, now + 0.12, 0.25, "triangle", 0.15);
  playTone(1319, now + 0.24, 0.35, "triangle", 0.13);
}

// â”€â”€ Quest nudge (soft ping) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function playNudge() {
  if (isMuted()) return;
  const c = getCtx();
  const now = c.currentTime;
  playTone(880, now, 0.06, "sine", 0.08);
  playTone(1100, now + 0.07, 0.1, "sine", 0.06);
}

// â”€â”€ Login chime (cinematic open) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function playLoginChime() {
  if (isMuted()) return;
  const c = getCtx();
  const now = c.currentTime;
  // Soft ascending pad
  [261, 329, 392, 523].forEach((freq, i) => {
    playTone(freq, now + i * 0.18, 0.6, "sine", 0.07);
  });
}

// â”€â”€ Init (call on first click/interaction to unlock AudioContext) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function initAudio() {
  try { getCtx(); } catch {}
}
