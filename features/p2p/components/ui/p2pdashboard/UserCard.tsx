import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Card from "../../Common/Card";
import Button from "../../Common/Button";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/store/rootReducer";
import { fetchMatchedTrades } from "@/features/p2p/slices/matchedTradesSlice";
import { AppDispatch } from "@/store";
import { toast } from "sonner";
import {
  updateProfileThunk,
  getP2PProfileThunk,
} from "../../../slices/orderSlice";
import { getUserProfile } from "@/features/auth/slices/authSlice";
import useSound from "use-sound";
import HelpSupportForm from "@/features/settings/components/HelpSupportForm";
import { useMatchedTradesWebSocket } from "../../../hooks/useMatchedTradesWebSocket";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

const UserCard = () => {
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = React.useState<string | null>(null);
  const { data: matchedTrades } = useSelector(
    (state: RootState) => state.matchedTrades
  );
  const { user, isAuthenticated } = useSelector(
    (state: RootState) => state.auth
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [prevMatchedCount, setPrevMatchedCount] = useState(0);
  const [lastUpdateSource, setLastUpdateSource] = useState<
    "websocket" | "http" | null
  >(null);
  const [showUpdateIndicator, setShowUpdateIndicator] = useState(false);

  // Use WebSocket for real-time matched trades updates with HTTP polling fallback
  const { isConnected: wsConnected, connectionError } =
    useMatchedTradesWebSocket({
      enabled: isAuthenticated,
      fallbackToPolling: true,
      pollingInterval: 30000, // 30 seconds fallback polling
    });

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch initial data via HTTP
      dispatch(fetchMatchedTrades(1));
      dispatch(getP2PProfileThunk())
        .unwrap()
        .then((response) => {
          if (response?.profile?.photo) {
            setProfileImage(response.profile.photo);
          }
        })
        .catch((error) => { });
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/notification.mp3");
      audioRef.current.volume = 0.3;
    }
  }, []);

  // Enable audio after first user interaction
  useEffect(() => {
    const enableAudio = () => setAudioEnabled(true);
    window.addEventListener("click", enableAudio, { once: true });
    return () => window.removeEventListener("click", enableAudio);
  }, []);

  // Log WebSocket connection status changes (suppress React StrictMode noise)
  const hasLoggedStatus = useRef(false);

  useEffect(() => {
    if (wsConnected && !hasLoggedStatus.current) {
      hasLoggedStatus.current = true;
    }
  }, [wsConnected]);

  // Monitor data updates and determine source
  useEffect(() => {
    if (!matchedTrades?.results) return;

    const currentCount = matchedTrades.results.length;

    // Detect if this is a new update
    if (currentCount !== prevMatchedCount && prevMatchedCount !== 0) {
      // Determine update source
      const updateSource = wsConnected ? "websocket" : "http";
      setLastUpdateSource(updateSource);

      // Log the actual trade data for debugging
      if (process.env.NODE_ENV === "development") {
      }

      // Show update indicator
      setShowUpdateIndicator(true);
      setTimeout(() => setShowUpdateIndicator(false), 2000);

      // Play audio for new trades
      if (audioEnabled && audioRef.current && currentCount > prevMatchedCount) {
        audioRef.current.play().catch((err) => { });
      }
    }

    setPrevMatchedCount(currentCount);
  }, [matchedTrades, wsConnected, audioEnabled, prevMatchedCount]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Image = e.target?.result as string;
        setProfileImage(base64Image);

        try {
          const formData = new FormData();
          formData.append("photo", file);

          await dispatch(updateProfileThunk(formData)).unwrap();
          // Refetch profile to get updated photo in P2P dashboard
          const response = await dispatch(getP2PProfileThunk()).unwrap();
          if (response?.profile?.photo) {
            setProfileImage(response.profile.photo);
          }
          // Also refresh global auth profile so navbar/other pages update without reload
          await dispatch(getUserProfile()).unwrap();
          toast.success("Profile image updated successfully");
        } catch (error: any) {
          toast.error(error?.message || "Failed to update profile image");
          // Revert the image if update fails
          setProfileImage(
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Ccircle cx='28' cy='28' r='28' fill='%23e5e7eb'/%3E%3Cg fill='%239ca3af'%3E%3Ccircle cx='28' cy='22' r='8'/%3E%3Cpath d='M28 32c-8 0-14 4-14 8v6c0 2 1 3 3 3h22c2 0 3-1 3-3v-6c0-4-6-8-14-8z'/%3E%3C/g%3E%3C/svg%3E"
          );
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card
      borderColor="border-[#35353E]"
      width="w-full"
      bgColor="bg-transparent"
      borderRadius="rounded-xl sm:rounded-xl lg:rounded-[20px]"
      className="p-3 sm:p-3 lg:p-2 dark:bg-[#18181D] bg-white overflow-hidden border border-[#35353E]"
    >
      {showHelpSupport ? (
        <div className="w-full mt-4">
          <button
            className="mb-2 sm:mb-4 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gray-200 dark:bg-[#35353E] dark:text-white rounded"
            onClick={() => setShowHelpSupport(false)}
          >
            Back
          </button>
          <HelpSupportForm />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between w-full gap-4 lg:gap-6">
          {/* Left Section: Avatar and Greeting */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* User Avatar with Edit Button */}
            <div className="relative">
              <div className="h-14 w-14 rounded-full overflow-hidden relative bg-gray-200 dark:bg-[#35353E] flex items-center justify-center">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt="User avatar"
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full object-cover object-center"
                    unoptimized={true}
                    onError={(
                      e: React.SyntheticEvent<HTMLImageElement, Event>
                    ) => {
                      const target = e.currentTarget;
                      target.onerror = null;
                      target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Ccircle cx='28' cy='28' r='28' fill='%23e5e7eb'/%3E%3Cg fill='%239ca3af'%3E%3Ccircle cx='28' cy='22' r='8'/%3E%3Cpath d='M28 32c-8 0-14 4-14 8v6c0 2 1 3 3 3h22c2 0 3-1 3-3v-6c0-4-6-8-14-8z'/%3E%3C/g%3E%3C/svg%3E";
                    }}
                  />
                ) : (
                  <div className="w-full h-full dark:bg-[#35353E] bg-[#E5E7EB] flex items-center justify-center">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                        stroke="currentColor"
                        className="text-[#788099]"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="7"
                        r="4"
                        stroke="currentColor"
                        className="text-[#788099]"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div
                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#1D8751] flex items-center justify-center cursor-pointer hover:bg-[#16663d] transition-colors"
                onClick={handleImageClick}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16 3L21 8L8 21H3V16L16 3Z"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
            </div>

            {/* User Info */}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold dark:text-[#FFFFFF] text-[#1D1D23]">
                  Hello, {user?.first_name} !
                </h2>
              </div>
              <div className="flex items-center gap-1">
                {user?.is_verified && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#1D8751] rounded-full flex items-center justify-center border-2 border-white">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="10" fill="#1D8751" />
                      <path
                        d="M6 10.5L9 13.5L14 8.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </div>
              {user?.is_verified ? (
                <span className="text-[#1D8751] flex items-center gap-1.5 text-xs sm:text-sm font-medium">
                  Verified Profile
                  <span className="inline-flex items-center justify-center w-5 h-5 flex-shrink-0" style={{ position: 'relative' }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" style={{ position: 'absolute' }}>
                      <circle cx="10" cy="10" r="9" fill="white" />
                      <circle cx="10" cy="10" r="7.5" fill="#1D8751" />
                      {/* Serrated edge using small circles */}
                      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => {
                        const rad = (angle * Math.PI) / 180;
                        const x = 10 + 8.5 * Math.cos(rad);
                        const y = 10 + 8.5 * Math.sin(rad);
                        return <circle key={angle} cx={x} cy={y} r="1" fill="white" />;
                      })}
                    </svg>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ position: 'relative', zIndex: 1 }}
                      className="flex-shrink-0"
                    >
                      <path
                        d="M2 5L4 7L8 3"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 text-xs sm:text-sm font-medium">
                  Unverified Profile
                </span>
              )}
              <div className="flex items-center gap-1.5">
                {/* Spacer or additional info if needed */}
              </div>
            </div>
          </div>

          {/* Center Section: User ID and User Type */}
          <div className="flex flex-row items-start gap-4 sm:gap-6 w-full lg:flex-1 lg:justify-center">
            {/* User ID */}
            <div className="text-left flex-1">
              <p className="text-xs dark:text-[#788099] text-[#788099] mb-1">User ID</p>
              <div className="flex items-center gap-2 justify-start">
                <p className="text-base font-bold dark:text-[#FFFFFF] text-[#1D1D23]">{user?.user_id}</p>
                <button className="cursor-pointer">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#F79330] cursor-pointer"
                    onClick={() => {
                      navigator.clipboard.writeText(user?.user_id || "");
                      toast.success("Copied to clipboard");
                    }}
                  >
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                  </svg>
                </button>
              </div>
            </div>

            {/* User Type */}
            <div className="text-left flex-1">
              <p className="text-xs text-[#788099] mb-1">User Type</p>
              <p className="text-base font-bold dark:text-[#FFFFFF] text-[#1D1D23]">
                {user?.user_type ? user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1) : ''}
              </p>
            </div>
          </div>

          {/* Right Section: Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-start sm:justify-center lg:justify-end w-full lg:w-auto">
            <Button
              borderRadius={24}
              className="sm:w-[130px]"
              height={36}
              variant="primary"
              size="sm"
              onClick={() => router.push("/adds?type=buy")}
            >
              + Post Buy Ad
            </Button>
            <Button
              borderRadius={24}
              className="sm:w-[130px]"
              height={36}
              variant="secondary"
              size="sm"
              onClick={() => router.push("/adds?type=sell")}
            >
              + Post Sell Ad
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className=" flex items-center justify-center p-0"
              onClick={() => router.push("/dashboard/notifications")}
              icon={
                <div className="w-10 h-10 rounded-full border border-[#1D8751] flex items-center justify-center p-1 relative">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
                      className="stroke-[#1D8751]"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
                      className="stroke-[#1D8751]"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {matchedTrades?.results &&
                    matchedTrades.results.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#E23D3A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {matchedTrades.results.length}
                      </span>
                    )}
                  {/* WebSocket connection indicator */}
                  {wsConnected ? (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#1D8751] rounded-full border border-white dark:border-[#18181D]"
                      title="Real-time WebSocket updates active"
                    />
                  ) : (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#F79330] rounded-full border border-white dark:border-[#18181D]"
                      title="Using HTTP polling (WebSocket unavailable)"
                    />
                  )}
                  {/* Update indicator pulse */}
                  {showUpdateIndicator && (
                    <span className="absolute inset-0 rounded-full bg-[#1D8751] opacity-75 animate-ping" />
                  )}
                </div>
              }
            />
            <Button
              variant="ghost"
              size="sm"
              className=" flex items-center justify-center p-0"
              onClick={() => router.push("/contactUs")}
              icon={
                <div className="w-10 h-10 rounded-[50%] border border-[#1D8751] flex items-center justify-center p-0">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      className="stroke-[#1D8751]"
                      strokeWidth="2"
                    />
                    <path
                      d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
                      className="stroke-[#1D8751]"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="17"
                      r="0.5"
                      className="fill-[#1D8751] stroke-[#1D8751]"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              }
            />
          </div>
        </div>
      )}
    </Card>
  );
};

export default UserCard;
