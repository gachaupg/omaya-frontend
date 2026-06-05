/**
 * Normalizes P2P / support / appeal message payloads so image URLs render consistently.
 */

const pushImageField = (out: unknown[], field: unknown) => {
  if (field == null) return;
  if (Array.isArray(field)) {
    out.push(...field);
    return;
  }
  if (typeof field === "string" && field.trim()) {
    out.push(field.trim());
    return;
  }
  if (typeof field === "object") {
    out.push(field);
  }
};

export const coalesceMessageImages = (msg: any): unknown[] => {
  const out: unknown[] = [];
  pushImageField(out, msg?.images);
  pushImageField(out, msg?.uploaded_images);
  pushImageField(out, msg?.media);
  pushImageField(out, msg?.attachments);

  const pushUrl = (v: unknown) => {
    if (typeof v === "string" && v.trim()) out.push(v.trim());
  };

  pushUrl(msg?.support_document);
  pushUrl(msg?.screenshot);
  pushUrl(msg?.attachment);
  pushUrl(msg?.attachment_url);
  pushUrl(msg?.file_url);
  if (msg?.image && typeof msg.image === "string") pushUrl(msg.image);
  if (msg?.image_url && typeof msg.image_url === "string") pushUrl(msg.image_url);

  return out;
};

export const resolveMessageImageUrl = (img: unknown): string => {
  if (typeof img === "string" && img.trim()) return img.trim();
  if (img && typeof img === "object") {
    const o = img as Record<string, unknown>;
    const u =
      o.image_url ||
      o.image ||
      o.url ||
      o.file ||
      o.src ||
      (typeof o.path === "string" ? o.path : "");
    return typeof u === "string" ? u.trim() : "";
  }
  return "";
};

export const firstMessageImageUrl = (msg: any): string => {
  const items = coalesceMessageImages(msg);
  for (const item of items) {
    const url = resolveMessageImageUrl(item);
    if (url) return url;
  }
  return "";
};

/** True when at least one coalesced image resolves to a non-empty URL (avoids empty image rows). */
export const hasRenderableMessageImages = (msg: any): boolean =>
  coalesceMessageImages(msg).some((item) => !!resolveMessageImageUrl(item));

/** Treat API filler captions as empty when matching optimistic rows to server rows. */
export const normalizeMessageCaptionForDedupe = (raw: string): string => {
  const t = String(raw ?? "").trim();
  if (/^image$/i.test(t)) return "";
  return t;
};

/**
 * Hide filler labels only when real media is shown; otherwise keep caption so the bubble
 * is not blank (appeal/support often return content "Image" before attachment URLs exist).
 */
export const shouldHideBodyTextForMediaPlaceholder = (
  rawText: string,
  hasRenderableImages: boolean,
  hasRenderableAudios: boolean
): boolean => {
  const t = rawText.trim();
  if (!t) return true;
  if (/^image$/i.test(t)) return hasRenderableImages;
  if (/^voice\s*message$/i.test(t)) return hasRenderableAudios;
  return false;
};

/** mm:ss for recording timers and voice-note labels. */
export const formatRecordingDuration = (totalSeconds: number): string => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export type VoiceNoteItem = { id?: string; audio_url: string; duration?: number };

export const normalizeAudioList = (msg: any): VoiceNoteItem[] => {
  const rawList =
    Array.isArray(msg?.audios) && msg.audios.length > 0
      ? msg.audios
      : Array.isArray(msg?.uploaded_audios) && msg.uploaded_audios.length > 0
        ? msg.uploaded_audios
        : Array.isArray(msg?.voice_notes) && msg.voice_notes.length > 0
          ? msg.voice_notes
          : msg?.audio_url || msg?.audio || msg?.recording_url || msg?.voice_note
            ? [
                {
                  id: msg?.id,
                  audio_url:
                    msg?.audio_url ||
                    msg?.audio ||
                    msg?.recording_url ||
                    msg?.voice_note,
                  duration: msg?.duration,
                },
              ]
            : [];

  return rawList
    .map((a: any, idx: number) => {
      if (typeof a === "string") {
        return {
          id: `${msg?.id || "audio"}-${idx}`,
          audio_url: a,
          duration: msg?.duration,
        };
      }
      const audioUrl =
        a?.audio_url ||
        a?.audio ||
        a?.url ||
        a?.file ||
        a?.recording_url ||
        a?.voice_note ||
        "";
      return {
        id: a?.id || `${msg?.id || "audio"}-${idx}`,
        audio_url: audioUrl,
        duration: a?.duration ?? msg?.duration,
      };
    })
    .filter(
      (a: VoiceNoteItem) =>
        typeof a.audio_url === "string" && a.audio_url.trim() !== ""
    );
};
