/**
 * High-Volume, Crisp Telephone Call Ringtone Engine
 * Engineered for maximum acoustic presence and unmistakable phone call alerting.
 */

let ringtoneAudioElement = null;
let ringtoneWebAudioLoop = null;

/**
 * Starts a loud, realistic incoming telephone double-ring
 * Cadence: Double ring ("Ring-Ring ... Ring-Ring") repeating while reminder is due
 */
export function startCallRingtone() {
  stopCallRingtone();

  // 1. Play HTML5 ringtone.wav at maximum 1.0 volume
  try {
    const audio = new Audio('/ringtone.wav');
    audio.loop = true;
    audio.volume = 1.0; // 100% Full Master Volume
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          ringtoneAudioElement = audio;
        })
        .catch((err) => {
          console.warn('HTML5 Audio restricted by browser, activating loud Web Audio ringtone:', err);
        });
    }
  } catch (e) {
    console.warn('Audio element error:', e);
  }

  // 2. Run High-Volume Web Audio Synthesizer (Loud Dual-Tone Phone Bell)
  startLoudWebAudioPhoneRing();
}

/**
 * High-Gain Web Audio Synthesizer for Authentic Loud Telephone Ringing
 * Emits double-ring burst: Ring 1 (450ms) -> Gap (200ms) -> Ring 2 (450ms) -> Pause (1900ms)
 */
function startLoudWebAudioPhoneRing() {
  if (ringtoneWebAudioLoop) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Dynamics compressor to maximize loudness without audio clipping
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-14, ctx.currentTime);
    compressor.knee.setValueAtTime(30, ctx.currentTime);
    compressor.ratio.setValueAtTime(12, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);
    compressor.connect(ctx.destination);

    // Master High-Gain Stage (0.90 master amplitude — over 4x louder than previous 0.22)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.90, ctx.currentTime);
    masterGain.connect(compressor);

    let isPlaying = true;

    // Helper: Play a single phone bell ring burst (440Hz + 480Hz + bright 880Hz overtone)
    const playRingBurst = (startTime, duration = 0.42) => {
      if (!isPlaying || ctx.state === 'closed') return;

      // Authentic telephone ring dual-tone frequencies with rich acoustic overtones
      const toneFreqs = [
        { freq: 440.0, type: 'triangle', gainFactor: 0.45 }, // Standard A4 bell tone
        { freq: 480.0, type: 'triangle', gainFactor: 0.45 }, // Standard US/AU telephone companion tone
        { freq: 880.0, type: 'sine', gainFactor: 0.25 },     // Upper harmonic for phone speaker clarity
        { freq: 1320.0, type: 'sine', gainFactor: 0.15 },    // Piercing acoustic presence
      ];

      // Tremolo LFO (20Hz warble for authentic telephone bell ring rattle)
      const tremolo = ctx.createOscillator();
      tremolo.frequency.setValueAtTime(20, startTime);
      const tremoloGain = ctx.createGain();
      tremoloGain.gain.setValueAtTime(0.35, startTime);
      tremolo.connect(tremoloGain);

      toneFreqs.forEach((t) => {
        const osc = ctx.createOscillator();
        const burstGain = ctx.createGain();

        osc.type = t.type;
        osc.frequency.setValueAtTime(t.freq, startTime);

        // Fast attack, sustained loud ring, clean exponential decay
        burstGain.gain.setValueAtTime(0.001, startTime);
        burstGain.gain.linearRampToValueAtTime(t.gainFactor, startTime + 0.02);
        burstGain.gain.setValueAtTime(t.gainFactor, startTime + duration - 0.03);
        burstGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

        tremoloGain.connect(burstGain.gain);

        osc.connect(burstGain);
        burstGain.connect(masterGain);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });

      tremolo.start(startTime);
      tremolo.stop(startTime + duration);
    };

    // Double-Ring Cadence sequence
    const triggerDoubleRingCycle = () => {
      if (!isPlaying || ctx.state === 'closed') return;
      const now = ctx.currentTime;

      // Ring 1 (0ms to 420ms)
      playRingBurst(now + 0.00, 0.42);

      // Ring 2 (620ms to 1040ms)
      playRingBurst(now + 0.62, 0.42);
    };

    // Trigger first double-ring immediately, repeat every 3 seconds
    triggerDoubleRingCycle();
    const interval = setInterval(triggerDoubleRingCycle, 3000);

    ringtoneWebAudioLoop = {
      ctx,
      interval,
      stop: () => {
        isPlaying = false;
        clearInterval(interval);
        try {
          ctx.close();
        } catch (e) {}
      },
    };
  } catch (err) {
    console.warn('Loud Web Audio ringtone warning:', err);
  }
}

/**
 * Stops ringtone immediately
 */
export function stopCallRingtone() {
  if (ringtoneAudioElement) {
    try {
      ringtoneAudioElement.pause();
      ringtoneAudioElement.currentTime = 0;
    } catch (e) {}
    ringtoneAudioElement = null;
  }

  if (ringtoneWebAudioLoop) {
    try {
      ringtoneWebAudioLoop.stop();
    } catch (e) {}
    ringtoneWebAudioLoop = null;
  }
}

/**
 * Alias helpers for backwards compatibility
 */
export const startReminderSiren = startCallRingtone;
export const stopReminderSiren = stopCallRingtone;

/**
 * Test chime / ringtone preview (plays 1 loud double-ring sequence)
 */
export function playChimeSound() {
  startCallRingtone();
  setTimeout(() => {
    stopCallRingtone();
  }, 2600);
}

/**
 * Trigger desktop browser notification if permitted
 */
export function triggerDesktopNotification(title, body) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/app-icon.png',
      });
    } catch (e) {
      console.warn('Notification error:', e);
    }
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission();
  }
}
