import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store";
import { createDeviceSession } from "../slices/settingsSlice";
import { CreateDeviceSessionPayload } from "../types";

export const useDeviceSession = () => {
  const dispatch = useDispatch<AppDispatch>();

  const getDeviceType = (): string => {
    const userAgent = navigator.userAgent;
    if (/Android/i.test(userAgent)) return "Android";
    if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
    if (/Windows/i.test(userAgent)) return "Windows";
    if (/Mac/i.test(userAgent)) return "macOS";
    if (/Linux/i.test(userAgent)) return "Linux";
    return "Unknown";
  };

  const getBrowserInfo = (): string => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Unknown Browser";
  };

  const createSession = async () => {
    try {
      let ipAddress = "Unknown";
      let location = "Unknown";

      try {
        // Get IP address
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          ipAddress = ipData.ip;

          // Get location from IP
          const locationResponse = await fetch(
            `https://ipapi.co/${ipAddress}/json/`
          );
          if (locationResponse.ok) {
            const locationData = await locationResponse.json();
            location = `${locationData.city || "Unknown"}, ${
              locationData.country_name || "Unknown"
            }`;
          }
        }
      } catch (error) {
        console.warn("Failed to get IP or location:", error);
        // Use fallback values
        ipAddress = "Unknown";
        location = "Unknown";
      }

      const payload: CreateDeviceSessionPayload = {
        ip_address: ipAddress,
        location: location,
        browser: getBrowserInfo(),
        sign_in_time: new Date().toISOString(),
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
      };

      await dispatch(createDeviceSession(payload)).unwrap();
    } catch (error) {
      console.error("Failed to create device session:", error);
    }
  };

  useEffect(() => {
    // Create device session when component mounts (user logs in)
    createSession();
  }, []);

  return { createSession };
};
