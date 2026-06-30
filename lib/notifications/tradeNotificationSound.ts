import { isNotificationSoundMuted } from "./notificationPreferences";

let lastPlayedAt = 0;
let audioContext: AudioContext | null = null;
let htmlAudio: HTMLAudioElement | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext) audioContext = new Ctx();
  return audioContext;
}

/** Short beep when notification.mp3 is missing or blocked. */
function playWebAudioBeep(volume = 0.35): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  void ctx.resume().then(() => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const end = ctx.currentTime + 0.35;
    gain.gain.exponentialRampToValueAtTime(0.001, end);
    osc.start(ctx.currentTime);
    osc.stop(end);
  });
}

function playHtmlAudio(volume = 0.35): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (!htmlAudio) {
    htmlAudio = new Audio("/sounds/notification.mp3");
    htmlAudio.preload = "auto";
  }
  htmlAudio.volume = volume;
  htmlAudio.currentTime = 0;
  return htmlAudio
    .play()
    .then(() => true)
    .catch(() => false);
}

/** Play trade notification sound (debounced, respects mute preference). */
export function playTradeNotificationSound(): void {
  if (typeof window === "undefined") return;
  if (isNotificationSoundMuted()) return;

  const now = Date.now();
  if (now - lastPlayedAt < 400) return;
  lastPlayedAt = now;

  void playHtmlAudio().then((played) => {
    if (!played) playWebAudioBeep();
  });
}
