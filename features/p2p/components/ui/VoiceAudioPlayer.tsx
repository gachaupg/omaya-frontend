"use client";

import React from "react";
import { formatRecordingDuration } from "@/features/p2p/utils/messageMedia";

type VoiceAudioPlayerProps = {
  src: string;
  duration?: number;
  className?: string;
  showDuration?: boolean;
};

/** Stable audio row — avoids reload flicker when parent chat re-renders from polling. */
export const VoiceAudioPlayer = React.memo(function VoiceAudioPlayer({
  src,
  duration,
  className = "max-w-full h-8 min-w-[180px]",
  showDuration = true,
}: VoiceAudioPlayerProps) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <audio
        key={src}
        controls
        className={className}
        src={src}
        preload="metadata"
      >
        Your browser does not support audio playback.
      </audio>
      {showDuration && typeof duration === "number" && duration > 0 && (
        <span className="text-[10px] opacity-75 tabular-nums whitespace-nowrap">
          {formatRecordingDuration(duration)}
        </span>
      )}
    </div>
  );
});
