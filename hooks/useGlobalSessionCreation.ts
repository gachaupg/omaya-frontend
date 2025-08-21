"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import { AppDispatch } from "../store";
import { createDeviceSession, fetchDeviceSessions } from "../features/settings/slices/settingsSlice";
import { CreateDeviceSessionPayload } from "../features/settings/types";
import { DeviceSession } from "../features/settings/types";
import { getCurrentIPAddress, getLocationFromIP } from "../features/settings/utils/sessionUtils";
import { showToast } from "../lib/utils/toast";

// Helper functions for device info
const getDeviceType = (): string => {
  const userAgent = navigator.userAgent;
  if (/Android/i.test(userAgent)) return "Android";
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Mac/i.test(userAgent)) return "macOS";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "Unknown";
};

const getBrowserInfo = (userAgent: string): string => {
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  return "Unknown Browser";
};

export const useGlobalSessionCreation = () => {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  
  // Get authentication state
  const { isAuthenticated } = useSelector((state: any) => state.auth);
  
  // Get existing sessions from Redux state
  const existingSessions = useSelector((state: any) => state.settings.deviceSessions);
  
  // Track if session creation has been attempted
  const hasAttemptedSessionCreation = useRef(false);
  
  // Track session creation attempts to prevent infinite loops
  const sessionCreationAttempts = useRef(0);
  const maxSessionCreationAttempts = 3;

  const createSession = async () => {
    // Prevent multiple session creation attempts
    if (hasAttemptedSessionCreation.current) {
      console.log("Global session creation already attempted, skipping...");
      return;
    }
    
    // Prevent too many session creation attempts
    if (sessionCreationAttempts.current >= maxSessionCreationAttempts) {
      console.log("Maximum global session creation attempts reached, skipping...");
      return;
    }

    // Only proceed if user is authenticated
    if (!isAuthenticated) {
      console.log("User not authenticated, skipping global session creation...");
      return;
    }

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log("Not in browser environment, skipping global session creation...");
      return;
    }

    // Skip session creation on certain paths that might cause issues
    if (pathname && (pathname.includes('/auth/') || pathname.includes('/login') || pathname.includes('/register'))) {
      console.log("Skipping global session creation on auth pages:", pathname);
      return;
    }

    console.log("Starting global session creation process...");
    hasAttemptedSessionCreation.current = true;
    sessionCreationAttempts.current += 1;

    try {
      // Get IP address and location
      const ipAddress = await getCurrentIPAddress();
      const location = await getLocationFromIP(ipAddress);

      console.log("Retrieved IP and location for global session:", { ipAddress, location });

      // Check if we already have sessions loaded
      let currentSessions = existingSessions;
      
      // If no sessions are loaded, fetch them first
      if (!currentSessions || currentSessions.length === 0) {
        try {
          console.log("Fetching existing sessions for global check...");
          const sessionsResponse = await dispatch(fetchDeviceSessions()).unwrap();
          currentSessions = sessionsResponse || [];
          console.log("Fetched sessions for global check:", currentSessions.length);
        } catch (error) {
          console.warn("Failed to fetch existing sessions for global check, proceeding with creation:", error);
          currentSessions = [];
        }
      }

      // Check if a session with the same IP address already exists
      const existingSessionWithSameIP = currentSessions.find((session: DeviceSession) => 
        session.ip_address === ipAddress && session.is_active
      );

      if (existingSessionWithSameIP) {
        console.log("Global: Session with IP address already exists:", existingSessionWithSameIP);
        console.log("Global: Skipping session creation to avoid duplicates");
        showToast.info("Session already exists for this device");
        return; // Don't create a new session if one with the same IP already exists
      }

      const payload: CreateDeviceSessionPayload = {
        ip_address: ipAddress,
        location: location,
        browser: getBrowserInfo(navigator.userAgent),
        sign_in_time: new Date().toISOString(),
        user_agent: navigator.userAgent,
        device_type: getDeviceType(),
      };

      console.log("Creating new global device session with payload:", payload);
      
      // Use a timeout to prevent blocking
      const sessionPromise = dispatch(createDeviceSession(payload)).unwrap();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Global session creation timeout')), 10000)
      );
      
      await Promise.race([sessionPromise, timeoutPromise]);
      console.log("Global session created successfully");
      showToast.success("Device session created successfully");
    } catch (error) {
      console.error("Failed to create global device session:", error);
      // Don't reset the flag on auth errors to prevent retries
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status !== 401 && status !== 403) {
          hasAttemptedSessionCreation.current = false;
        }
      }
    }
  };

  useEffect(() => {
    // Only create device session once when component mounts
    // and only if we haven't already attempted it and user is authenticated
    if (!hasAttemptedSessionCreation.current && isAuthenticated) {
      console.log("Setting up global session creation...");
      // Add a delay to ensure the page is fully loaded and stable
      const timer = setTimeout(() => {
        // Use requestIdleCallback if available, otherwise setTimeout
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            createSession();
          });
        } else {
          createSession();
        }
      }, 2000); // Delay to ensure page is stable

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, pathname]); // Added pathname to dependencies

  return { createSession };
};
