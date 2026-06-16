type CameraAccessError = {
  code: "insecure" | "unsupported" | "denied" | "not_found" | "in_use" | "unknown";
  message: string;
};

const VIDEO_MIME_CANDIDATES = [
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
  "video/mp4",
];

export const KYC_VIDEO_RECORDING_SECONDS = 4;

/**
 * Progressive constraints — many laptop webcams fail when `facingMode: "user"` is
 * required (OverconstrainedError) while `{ video: true }` works on other sites.
 */
const KYC_CAMERA_CONSTRAINT_ATTEMPTS: MediaStreamConstraints[] = [
  {
    video: {
      facingMode: { ideal: "user" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  },
  {
    video: {
      facingMode: { ideal: "user" },
    },
    audio: false,
  },
  {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  },
  { video: true, audio: false },
];

type LegacyNavigator = Navigator & {
  getUserMedia?: (
    constraints: MediaStreamConstraints,
    success: (stream: MediaStream) => void,
    error: (err: unknown) => void
  ) => void;
  webkitGetUserMedia?: LegacyNavigator["getUserMedia"];
  mozGetUserMedia?: LegacyNavigator["getUserMedia"];
};

/** Polyfill mediaDevices.getUserMedia from legacy APIs (older Edge/Safari builds). */
function ensureMediaDevicesApi(): boolean {
  if (typeof navigator === "undefined") return false;

  const nav = navigator as LegacyNavigator;
  if (!navigator.mediaDevices) {
    (navigator as Navigator & { mediaDevices: MediaDevices }).mediaDevices =
      {} as MediaDevices;
  }

  if (!navigator.mediaDevices.getUserMedia) {
    const legacyFn =
      nav.getUserMedia || nav.webkitGetUserMedia || nav.mozGetUserMedia;
    if (legacyFn) {
      navigator.mediaDevices.getUserMedia = (constraints) =>
        new Promise((resolve, reject) => {
          legacyFn.call(
            navigator,
            constraints ?? { video: true, audio: false },
            resolve,
            reject
          );
        });
    }
  }

  return !!navigator.mediaDevices?.getUserMedia;
}

function isPermissionDenied(err: unknown): boolean {
  const name = (err as DOMException)?.name || "";
  const msg = String((err as Error)?.message || err || "").toLowerCase();
  return (
    name === "NotAllowedError" ||
    name === "PermissionDeniedError" ||
    msg.includes("permission")
  );
}

function getUserMediaWithTimeout(
  constraints: MediaStreamConstraints,
  timeoutMs = 12_000
): Promise<MediaStream> {
  return Promise.race([
    navigator.mediaDevices.getUserMedia(constraints),
    new Promise<MediaStream>((_, reject) => {
      setTimeout(
        () => reject(new Error("Camera request timed out")),
        timeoutMs
      );
    }),
  ]);
}

/** Request camera stream with laptop-friendly constraint fallbacks. */
export async function requestKycCameraStream(): Promise<MediaStream> {
  if (!ensureMediaDevicesApi()) {
    throw new Error("getUserMedia is not supported");
  }

  let lastError: unknown;

  for (const constraints of KYC_CAMERA_CONSTRAINT_ATTEMPTS) {
    try {
      const stream = await getUserMediaWithTimeout(constraints);
      if (stream.getVideoTracks().length === 0) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("No video track in camera stream");
      }
      return stream;
    } catch (err) {
      lastError = err;
      if (isPermissionDenied(err)) {
        throw err;
      }
    }
  }

  throw lastError ?? new Error("Could not open camera");
}

/** Attach a MediaStream to a video element and wait until playback can start. */
export async function attachStreamToVideoElement(
  video: HTMLVideoElement,
  stream: MediaStream,
  waitMs = 6000
): Promise<boolean> {
  if (video.srcObject !== stream) {
    video.srcObject = stream;
  }
  video.muted = true;
  video.playsInline = true;

  const tryPlay = async (): Promise<boolean> => {
    try {
      await video.play();
      return !video.paused && video.readyState >= 2;
    } catch {
      return false;
    }
  };

  if (await tryPlay()) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = async () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(await tryPlay());
    };
    const cleanup = () => {
      video.removeEventListener("loadedmetadata", finish);
      video.removeEventListener("canplay", finish);
      clearTimeout(timer);
    };

    video.addEventListener("loadedmetadata", finish);
    video.addEventListener("canplay", finish);

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(false);
    }, waitMs);

    if (video.readyState >= 2) {
      void finish();
    }
  });
}

export function getKycCameraAccessError(err?: unknown): CameraAccessError | null {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return null;
  }

  if (!window.isSecureContext) {
    return {
      code: "insecure",
      message:
        "Camera needs a secure page. Use HTTPS, or for local dev open http://localhost (not your PC IP address over HTTP).",
    };
  }

  if (!ensureMediaDevicesApi()) {
    return {
      code: "unsupported",
      message:
        "This browser does not support camera access. Try the latest Chrome, Edge, or Firefox.",
    };
  }

  if (!err) return null;

  const domErr = err as DOMException;
  const name = domErr?.name || "";
  const msg = String(domErr?.message || err || "").toLowerCase();

  if (name === "NotAllowedError" || name === "PermissionDeniedError" || msg.includes("permission")) {
    return {
      code: "denied",
      message:
        "Camera permission was blocked. Click the camera icon in your browser address bar and allow access, then refresh.",
    };
  }

  if (name === "NotFoundError" || name === "DevicesNotFoundError" || msg.includes("not found")) {
    return {
      code: "not_found",
      message: "No camera was found on this device.",
    };
  }

  if (name === "NotReadableError" || name === "TrackStartError" || msg.includes("in use")) {
    return {
      code: "in_use",
      message:
        "Camera is in use by another app (Zoom, Teams, etc.). Close it and try again.",
    };
  }

  if (
    name === "OverconstrainedError" ||
    name === "ConstraintNotSatisfiedError" ||
    msg.includes("overconstrained") ||
    msg.includes("constraint")
  ) {
    return {
      code: "unknown",
      message:
        "Your camera could not match the requested settings. Try “Retry camera” or use a different browser.",
    };
  }

  return {
    code: "unknown",
    message: "Could not open the camera. Check permissions and try again.",
  };
}

export function getSupportedKycVideoMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  return VIDEO_MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

export function kycVideoExtensionForMime(mimeType: string): string {
  if (mimeType.includes("mp4")) return "mp4";
  return "webm";
}

export function blobToKycVideoFile(blob: Blob, mimeType: string): File {
  const ext = kycVideoExtensionForMime(mimeType);
  return new File([blob], `face-verification.${ext}`, {
    type: mimeType || blob.type || `video/${ext}`,
  });
}

/** Still frame from recorded video (selfie image for KYC submit), center-cropped square. */
export async function extractKycPhotoFromVideoBlob(
  videoBlob: Blob,
  outputSize = 640
): Promise<string> {
  const url = URL.createObjectURL(videoBlob);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("Could not load recorded video"));
    });

    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    const seekTime =
      duration > 0 ? Math.min(duration * 0.5, Math.max(0, duration - 0.1)) : 0;

    if (seekTime > 0) {
      await Promise.race([
        new Promise<void>((resolve, reject) => {
          video.onseeked = () => resolve();
          video.onerror = () => reject(new Error("Could not seek recorded video"));
          video.currentTime = seekTime;
        }),
        new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error("Could not seek recorded video")), 3000);
        }),
      ]).catch(async () => {
        video.currentTime = 0;
        await new Promise<void>((resolve) => {
          video.onseeked = () => resolve();
          video.onerror = () => resolve();
        });
      });
    }

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;
    const side = Math.min(vw, vh);
    const sx = (vw - side) / 2;
    const sy = (vh - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not prepare photo canvas");

    ctx.drawImage(video, sx, sy, side, side, 0, 0, outputSize, outputSize);
    return canvas.toDataURL("image/jpeg", 0.92);
  } finally {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
    video.load();
  }
}
