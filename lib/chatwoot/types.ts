export type ChatwootSettings = {
  hideMessageBubble?: boolean;
  position?: "left" | "right";
  type?: "standard" | "expanded_bubble";
  launcherTitle?: string;
};

declare global {
  interface Window {
    chatwootSettings?: ChatwootSettings;
    chatwootSDK?: {
      run: (config: { websiteToken: string; baseUrl: string }) => void;
    };
    $chatwoot?: {
      toggle: (state?: "open" | "close") => void;
    };
  }
}

export {};
