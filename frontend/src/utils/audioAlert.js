/**
 * Smooth, Pleasant Phone Call Ringtone Alert System
 */

let ringtoneAudioElement = null;
let ringtoneWebAudioLoop = null;

/**
 * Starts a smooth, pleasant phone call ringtone (looping while reminder is due)
 */
export function startCallRingtone() {
  stopCallRingtone();

  // 1. Play smooth ringtone.wav via HTML5 Audio element
  try {
    const audio = new Audio('/ringtone.wav');
    audio.loop = true;
    audio.volume = 0.65; // Pleasant, normal volume
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          ringtoneAudioElement = audio;
        })
        .catch((err) => {
          console.warn('HTML5 Audio restricted by browser, using Web Audio chime fallback:', err);
          startWebAudioSmoothRingtone();
        });
    }
  } catch (e) {
    console.warn('Audio tag error:', e);
    startWebAudioSmoothRingtone();
  }
}

/**
 * Fallback Web Audio API synthesizer for smooth, pleasant call chime
 */
function startWebAudioSmoothRingtone() {
  if (ringtoneWebAudioLoop) return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    let isPlaying = true;

    const playChimeSequence = () => {
      if (!isPlaying || ctx.state === 'closed') return;

      const now = ctx.currentTime;
      // Soft, pleasant phone chime notes: E5 (659Hz), G#5 (830Hz), B5 (987Hz), E6 (1318Hz)
      const notes = [
        { time: 0.00, freq: 659.25, dur: 0.30 },
        { time: 0.22, freq: 830.61, dur: 0.30 },
        { time: 0.44, freq: 987.77, dur: 0.35 },
        { time: 0.66, freq: 1318.51, dur: 0.60 },
      ];

      notes.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine'; // Pure smooth sine wave
        osc.frequency.setValueAtTime(n.freq, now + n.time);

        // Gentle envelope with smooth exponential decay
        gain.gain.setValueAtTime(0.001, now + n.time);
        gain.gain.linearRampToValueAtTime(0.22, now + n.time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + n.time);
        osc.stop(now + n.time + n.dur);
      });
    };

    // Play immediately and repeat every 2.6 seconds like a phone ring
    playChimeSequence();
    const interval = setInterval(playChimeSequence, 2600);

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
    console.warn('Web Audio smooth ringtone warning:', err);
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
 * Single chime for test buttons (plays 1 sequence of the smooth ringtone)
 */
export function playChimeSound() {
  startCallRingtone();
  setTimeout(() => {
    stopCallRingtone();
  }, 2500);
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
