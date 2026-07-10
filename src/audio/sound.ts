// Synthesized arcade sound effects for flashmind.
//
// Every sound is generated at runtime via WebAudio oscillators and short
// noise bursts — no audio files, no sampled sounds, no melodies or jingles
// that quote or evoke existing games. Each voice is a simple 1-2 note synth
// phrase, under 200ms, nothing looping.
//
// The AudioContext is created lazily, only after the first user gesture (see
// unlockAudio, wired from Layout). Loading the page therefore never creates
// a context and never triggers a browser autoplay warning. play() degrades
// silently until audio is unlocked.

export type SoundEvent = 'correct' | 'wrong' | 'gameover' | 'tick'

let ctx: AudioContext | null = null
let master: GainNode | null = null

// Session-only mute state. Default: sound ON. Never persisted to storage.
let muted = false

// Conservative overall level so a run of rapid answers never gets loud.
const MASTER_VOLUME = 0.35

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (ctx) return ctx
  const AC: typeof AudioContext | undefined =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = MASTER_VOLUME
  master.connect(ctx.destination)
  return ctx
}

// Create/resume the AudioContext. Call only from a user gesture handler.
// Safe to call repeatedly — a no-op once the context is running, and it
// re-arms the context if the browser suspended it after idle.
export function unlockAudio() {
  const c = ensureCtx()
  if (c && c.state === 'suspended') void c.resume()
}

export function isMuted(): boolean {
  return muted
}

export function setMuted(value: boolean): void {
  muted = value
}

export function toggleMuted(): boolean {
  muted = !muted
  return muted
}

// ---- synth primitives ----

function env(g: GainNode, start: number, dur: number, peak: number) {
  // quick attack, exponential decay to silence — short and clean.
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(peak, start + 0.006)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
}

function tone(
  c: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  peak: number,
) {
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  osc.connect(g)
  g.connect(dest)
  env(g, start, dur, peak)
  osc.start(start)
  osc.stop(start + dur + 0.03)
}

function sweep(
  c: AudioContext,
  dest: AudioNode,
  fromHz: number,
  toHz: number,
  start: number,
  dur: number,
  type: OscillatorType,
  peak: number,
) {
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(fromHz, start)
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), start + dur)
  osc.connect(g)
  g.connect(dest)
  env(g, start, dur, peak)
  osc.start(start)
  osc.stop(start + dur + 0.03)
}

function noiseBurst(
  c: AudioContext,
  dest: AudioNode,
  start: number,
  dur: number,
  peak: number,
  cutoff: number,
) {
  const len = Math.max(1, Math.floor(c.sampleRate * dur))
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buf
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = cutoff
  const g = c.createGain()
  src.connect(lp)
  lp.connect(g)
  g.connect(dest)
  g.gain.setValueAtTime(peak, start)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  src.start(start)
  src.stop(start + dur + 0.03)
}

// ---- per-event voices (all <200ms, no recognizable melody) ----

function playCorrect(c: AudioContext, dest: AudioNode, t: number) {
  // rising two-blip, ~160ms total. generic ascending tones, not any coin.
  tone(c, dest, 660, t, 0.07, 'triangle', 0.2)
  tone(c, dest, 990, t + 0.08, 0.08, 'triangle', 0.2)
}

function playWrong(c: AudioContext, dest: AudioNode, t: number) {
  // short low buzz with a touch of noise, ~140ms.
  tone(c, dest, 165, t, 0.14, 'square', 0.16)
  noiseBurst(c, dest, t, 0.12, 0.06, 500)
}

function playGameover(c: AudioContext, dest: AudioNode, t: number) {
  // smooth descending sweep, ~180ms. a glide, not a quoted jingle.
  sweep(c, dest, 400, 120, t, 0.18, 'triangle', 0.2)
}

function playTick(c: AudioContext, dest: AudioNode, t: number) {
  // subtle high blip on stimuli reveal, ~45ms, kept very quiet.
  tone(c, dest, 1200, t, 0.045, 'sine', 0.07)
}

export function play(event: SoundEvent) {
  if (muted) return
  const c = ctx
  if (!c || !master) return // audio not unlocked yet — never create here
  // the context is always created via a user gesture (see unlockAudio), so if
  // it is suspended here it is mid-resume from that same gesture — re-arm and
  // schedule anyway. a sub-frame delay on the first beep beats skipping it.
  if (c.state === 'suspended') void c.resume()
  const t = c.currentTime
  switch (event) {
    case 'correct':
      playCorrect(c, master, t)
      break
    case 'wrong':
      playWrong(c, master, t)
      break
    case 'gameover':
      playGameover(c, master, t)
      break
    case 'tick':
      playTick(c, master, t)
      break
  }
}