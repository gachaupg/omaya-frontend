export type ChatwootSettings = {
  hideMessageBubble?: boolean;
  position?: "left" | "right";
  type?: "standard" | "expanded_bubble";
  launcherTitle?: string;
  defaultPhoneCountryCode?: string;
  defaultPhoneDialCode?: string;
};

export type ChatwootSetUserPayload = {
  email?: string;
  name?: string;
  avatar_url?: string;
  phone_number?: string;
  country_code?: string;
  identifier_hash?: string;
};

declare global {
  interface Window {
    chatwootSettings?: ChatwootSettings;
    chatwootSDK?: {
      run: (config: { websiteToken: string; baseUrl: string }) => void;
    };
    $chatwoot?: {
      toggle: (state?: "open" | "close") => void;
      setUser: (identifier: string, user: ChatwootSetUserPayload) => void;
    };
  }
}

export {};
