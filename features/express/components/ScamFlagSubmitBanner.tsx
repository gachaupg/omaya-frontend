"use client";

import React from "react";
import ExpressSubmitAlertBanner from "@/features/express/components/ExpressSubmitAlertBanner";
import {
  SCAM_FLAG_BANNER_TITLE,
  SCAM_FLAG_USER_MESSAGE,
  isScamFlagUserMessage,
} from "@/lib/utils/scamFlagError";

type ScamFlagSubmitBannerProps = {
  message?: string | null;
  className?: string;
};

/** Account on-hold banner shown directly above submit buttons. */
const ScamFlagSubmitBanner: React.FC<ScamFlagSubmitBannerProps> = ({
  message,
  className = "",
}) => {
  if (!message || !isScamFlagUserMessage(message)) return null;

  return (
    <ExpressSubmitAlertBanner
      title={SCAM_FLAG_BANNER_TITLE}
      message={SCAM_FLAG_USER_MESSAGE}
      className={className}
      showSupportLink
    />
  );
};

export default ScamFlagSubmitBanner;
