/**
 * Audio Alert & Emergency Siren System for Customer Reminders
 */

let sirenAudioElement = null;
let sirenWebAudioNodes = null;

/**
 * Starts a loud, piercing emergency siren that loops while a reminder is due.
 * Uses both high-fidelity siren.wav and Web Audio API dual-oscillator wail.
 */
export function startReminderSiren() {
  stopReminderSiren();

  // 1. Play HTML5 Audio element with looping siren.wav
  try {
    const audio = new Audio('/siren.wav');
    audio.loop = true;
    audio.volume = 1.0;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          sirenAudioElement = audio;
        })
        .catch((err) => {
          console.warn('HTML5 Audio play restricted by browser policy, using Web Audio siren:', err);
          startWebAudioSiren();
        });
    }
  } catch (e) {
    console.warn('Audio element error:', e);
    startWebAudioSiren();
  }

  // 2. Also start Web Audio API dual-oscillator wail for maximum presence
  startWebAudioSiren();
}

function startWebAudioSiren() {
  if (sirenWebAudioNodes) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Siren primary oscillator (sawtooth for rich, penetrating harmonics)
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(820, now);

    // LFO modulator for classic emergency siren rise and fall (1.1 Hz wail)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(1.1, now);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(320, now); // Modulates ±320Hz (500Hz to 1140Hz)

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    // High master gain for full loudness
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.75, now);

    osc.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc.start(now);
    lfo.start(now);

    sirenWebAudioNodes = { ctx, osc, lfo, masterGain };
  } catch (err) {
    console.warn('Web Audio Siren initialization warning:', err);
  }
}

/**
 * Stops all siren playback immediately
 */
export function stopReminderSiren() {
  if (sirenAudioElement) {
    try {
      sirenAudioElement.pause();
      sirenAudioElement.currentTime = 0;
    } catch (e) {}
    sirenAudioElement = null;
  }

  if (sirenWebAudioNodes) {
    try {
      sirenWebAudioNodes.osc.stop();
      sirenWebAudioNodes.lfo.stop();
      sirenWebAudioNodes.ctx.close();
    } catch (e) {}
    sirenWebAudioNodes = null;
  }
}

/**
 * Siren preview chime for test buttons (plays 3.5s siren test)
 */
export function playChimeSound() {
  startReminderSiren();
  setTimeout(() => {
    stopReminderSiren();
  }, 3500);
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
