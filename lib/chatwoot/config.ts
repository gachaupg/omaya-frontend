import {
  CHATWOOT_DEFAULT_PHONE_COUNTRY_CODE,
  CHATWOOT_DEFAULT_PHONE_DIAL_CODE,
} from "./defaultPhoneCountry";

export const CHATWOOT_SETTINGS = {
  hideMessageBubble: true,
  position: "right" as const,
  type: "standard" as const,
  launcherTitle: "Chat with us!",
  defaultPhoneCountryCode: CHATWOOT_DEFAULT_PHONE_COUNTRY_CODE,
  defaultPhoneDialCode: CHATWOOT_DEFAULT_PHONE_DIAL_CODE,
};
