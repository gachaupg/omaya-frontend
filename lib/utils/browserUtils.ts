export interface BrowserSession {
  time: string;
  location: string;
  ip: string;
  browser: string;
  userAgent: string;
  platform: string;
  language: string;
  screenResolution: string;
  timezone: string;
}

export const getBrowserInfo = (): BrowserSession => {
  if (typeof window === "undefined") {
    return {
      time: "Unknown",
      location: "Unknown",
      ip: "Unknown",
      browser: "Unknown",
      userAgent: "Unknown",
      platform: "Unknown",
      language: "Unknown",
      screenResolution: "Unknown",
      timezone: "Unknown",
    };
  }

  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const language = navigator.language;
  const screenResolution = `${screen.width}x${screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Detect browser
  let browser = "Unknown browser";
  if (userAgent.includes("Chrome")) {
    browser = "Chrome";
  } else if (userAgent.includes("Firefox")) {
    browser = "Firefox";
  } else if (userAgent.includes("Safari")) {
    browser = "Safari";
  } else if (userAgent.includes("Edge")) {
    browser = "Edge";
  } else if (userAgent.includes("Opera")) {
    browser = "Opera";
  } else if (userAgent.includes("MSIE") || userAgent.includes("Trident/")) {
    browser = "Internet Explorer";
  }

  // Detect OS
  let os = "";
  if (userAgent.includes("Windows")) {
    os = "Windows";
  } else if (userAgent.includes("Mac")) {
    os = "macOS";
  } else if (userAgent.includes("Linux")) {
    os = "Linux";
  } else if (userAgent.includes("Android")) {
    os = "Android";
  } else if (userAgent.includes("iOS")) {
    os = "iOS";
  }

  // Detect device type
  let deviceType = "";
  if (userAgent.includes("Mobile")) {
    deviceType = "Mobile";
  } else if (userAgent.includes("Tablet")) {
    deviceType = "Tablet";
  } else {
    deviceType = "Desktop";
  }

  const browserWithOS = `${browser} (${os} ${deviceType})`;

  // Get current time
  const now = new Date();
  const timeString = now.toLocaleString();

  return {
    time: timeString,
    location: "Your Location", // Will be updated with IP geolocation
    ip: "Your IP Address", // Will be updated with actual IP
    browser: browserWithOS,
    userAgent,
    platform,
    language,
    screenResolution,
    timezone,
  };
};

export const getCurrentSession = async (): Promise<BrowserSession> => {
  const browserInfo = getBrowserInfo();

  try {
    // Get IP address and location
    const ipResponse = await fetch("https://api.ipify.org?format=json");
    const ipData = await ipResponse.json();
    browserInfo.ip = ipData.ip;

    // Get location from IP
    const locationResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
    const locationData = await locationResponse.json();

    if (locationData.city && locationData.country_name) {
      browserInfo.location = `${locationData.city}, ${locationData.country_name}`;
    }
  } catch (error) {
    // Fallback to local data
    browserInfo.ip = "Local Network";
    browserInfo.location = "Local Network";
  }

  return browserInfo;
};

export const getActiveSessions = async (): Promise<BrowserSession[]> => {
  const currentSession = await getCurrentSession();

  // For now, return the current session
  // In a real app, you might store multiple sessions in localStorage or get from API
  const storedSessions = localStorage.getItem("browser_sessions");
  let sessions: BrowserSession[] = [];

  if (storedSessions) {
    try {
      sessions = JSON.parse(storedSessions);
    } catch (error) {
      console.log("Error parsing stored sessions:", error);
    }
  }

  // Add current session if not already present
  const sessionExists = sessions.some(
    (session) =>
      session.userAgent === currentSession.userAgent &&
      session.ip === currentSession.ip
  );

  if (!sessionExists) {
    sessions.unshift(currentSession);
  }

  // Store updated sessions
  localStorage.setItem("browser_sessions", JSON.stringify(sessions));

  return sessions;
};

export const clearAllSessions = (): void => {
  localStorage.removeItem("browser_sessions");
};

export const removeSession = (sessionToRemove: BrowserSession): void => {
  const storedSessions = localStorage.getItem("browser_sessions");
  if (storedSessions) {
    try {
      const sessions: BrowserSession[] = JSON.parse(storedSessions);
      const filteredSessions = sessions.filter(
        (session) =>
          !(
            session.userAgent === sessionToRemove.userAgent &&
            session.ip === sessionToRemove.ip
          )
      );
      localStorage.setItem(
        "browser_sessions",
        JSON.stringify(filteredSessions)
      );
    } catch (error) {
    }
  }
};
