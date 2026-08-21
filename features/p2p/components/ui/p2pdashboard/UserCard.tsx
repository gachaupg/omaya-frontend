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
import { useMatchedTradesWsConnected } from "@/features/p2p/components/MatchedTradesWebSocketProvider";
import { selectPendingMatchedTradeNotificationCount } from "@/features/p2p/selectors";
import { cookieUtils } from "@/lib/utils/cookieUtils";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { checkKYCStatus } from "@/features/kyc/slices/kycSlice";
import { formatUserDisplayName } from "@/lib/utils/userDisplayName";
import {
  getCachedProfilePhoto,
  resolveProfilePhotoUserKey,
  setCachedProfilePhoto as persistProfilePhotoCache,
} from "@/lib/utils/profilePhotoCache";

const UserCard = () => {
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileImage, setProfileImage] = React.useState<string | null>(null);

  const matchedTrades = useSelector(
    (state: RootState) => state.matchedTrades.data
  );
  const pendingNotificationCount = useSelector(
    selectPendingMatchedTradeNotificationCount
  );
  const { user, isAuthenticated, profile } = useSelector(
    (state: RootState) => state.auth
  );
  const profilePhotoUserKey = resolveProfilePhotoUserKey(user);

  // Use profile.photo as fallback if profileImage is not set
  const displayImage = profileImage || profile?.photo || null;

  useEffect(() => {
    if (!isAuthenticated || !profilePhotoUserKey) {
      setProfileImage(null);
      return;
    }
    setProfileImage(getCachedProfilePhoto(profilePhotoUserKey));
  }, [isAuthenticated, profilePhotoUserKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onLogout = () => setProfileImage(null);
    window.addEventListener("logoutTriggered", onLogout);
    return () => window.removeEventListener("logoutTriggered", onLogout);
  }, []);

  const kycState = useSelector((state: RootState) => state.kyc);
  // KYC verification status from central KYC slice, fallback to user.is_verified
  const isVerified = kycState.isVerified !== undefined
    ? kycState.isVerified
    : (user?.is_verified ?? false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [prevMatchedCount, setPrevMatchedCount] = useState(0);
  const [lastUpdateSource, setLastUpdateSource] = useState<
    "websocket" | "http" | null
  >(null);
  const [showUpdateIndicator, setShowUpdateIndicator] = useState(false);

  // Matched-trades WebSocket lives in dashboard layout (MatchedTradesWebSocketProvider).
  const wsConnected = useMatchedTradesWsConnected();

  useEffect(() => {
    if (isAuthenticated) {
      // Fetch initial data via HTTP
      dispatch(fetchMatchedTrades(1));
      dispatch(getP2PProfileThunk())
        .unwrap()
        .then((response) => {
          if (response?.profile?.photo) {
            setProfileImage(response.profile.photo);
            if (profilePhotoUserKey) {
              persistProfilePhotoCache(profilePhotoUserKey, response.profile.photo);
              window.dispatchEvent(
                new CustomEvent("profilePhotoUpdated", {
                  detail: {
                    photoUrl: response.profile.photo,
                    userId: profilePhotoUserKey,
                  },
                })
              );
            }
          }
        })
        .catch((error) => { });

      // Ensure KYC status (is_verified) is up to date
      dispatch(checkKYCStatus());
    }
  }, [dispatch, isAuthenticated, profilePhotoUserKey]);

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
          // Refetch P2P profile to get updated photo in this card
          const response = await dispatch(getP2PProfileThunk()).unwrap();
          if (response?.profile?.photo) {
            setProfileImage(response.profile.photo);
            if (profilePhotoUserKey) {
              persistProfilePhotoCache(profilePhotoUserKey, response.profile.photo);
              window.dispatchEvent(
                new CustomEvent("profilePhotoUpdated", {
                  detail: {
                    photoUrl: response.profile.photo,
                    userId: profilePhotoUserKey,
                  },
                })
              );
            }
          }
          // Also refresh main auth profile so navbar/other pages update without reload
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
      borderColor="border-border dark:border-accent"
      width="w-full"
      bgColor="bg-transparent"
      borderRadius="rounded-xl sm:rounded-xl lg:rounded-[20px]"
      className="p-3 sm:p-3 lg:p-2 dark:bg-[#18181D] bg-white overflow-hidden border"
    >
      {showHelpSupport ? (
        <div className="w-full mt-4">
          <button
            className="mb-2 sm:mb-4 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-gray-200 dark:bg-accent dark:text-white rounded"
            onClick={() => setShowHelpSupport(false)}
          >
            Back
          </button>
          <HelpSupportForm />
        </div>
      ) : (
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between w-full gap-3 xl:gap-4">
          {/* Left Section: Avatar and Greeting */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* User Avatar with Edit Button */}
            <div className="relative">
              <div className="h-14 w-14 rounded-full overflow-hidden relative bg-gray-200 dark:bg-accent flex items-center justify-center">
                {displayImage ? (
                  <Image
                    src={displayImage}
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
                  <div className="w-full h-full dark:bg-accent bg-[#E5E7EB] flex items-center justify-center">
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
                <h2 className="text-base xl:text-sm font-bold dark:text-[#FFFFFF] text-[#1D1D23]">
                  Hello, {formatUserDisplayName(user?.first_name, user?.last_name)} !
                </h2>
              </div>
              {isVerified ? (
                <span className="text-[#1D8751] flex items-center gap-1.5 text-xs font-medium">
                  Verified Profile
                  <VerifiedBadge size={16} />
                </span>
              ) : (
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 text-xs font-medium">
                  Unverified Profile
                </span>
              )}
              <div className="flex items-center gap-1.5">
                {/* Spacer or additional info if needed */}
              </div>
            </div>
          </div>

          {/* Center Section: User ID and User Type */}
          <div className="flex flex-row items-start gap-4 sm:gap-6 w-full xl:flex-1 xl:justify-center">
            {/* User ID */}
            <div className="text-left flex-1 w-full sm:w-auto">
              <p className="text-[10px] xl:text-xs dark:text-[#788099] text-[#788099] mb-0.5">User ID</p>
              <div className="flex items-center gap-1.5 justify-start h-5 xl:h-5">
                <p className="text-sm xl:text-xs font-bold dark:text-[#FFFFFF] text-[#1D1D23] truncate min-w-0">{user?.user_id}</p>
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
                    className="text-warning cursor-pointer"
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
            <div className="text-left flex-1 w-full sm:w-auto">
              <p className="text-[10px] xl:text-xs dark:text-[#788099] text-[#788099] mb-0.5">User Type</p>
              <div className="flex items-center h-5">
                <p className="text-sm xl:text-xs font-bold dark:text-[#FFFFFF] text-[#1D1D23]">
                  {user?.user_type ? user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1) : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Right Section: Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-center sm:justify-start md:justify-center xl:justify-end w-full xl:w-auto mt-4 xl:mt-0">
            <Button
              borderRadius={24}
              className="flex-1 sm:flex-none sm:w-[120px] xl:w-[110px] min-w-[90px] text-xs xl:text-[11px]"
              height={32}
              variant="primary"
              size="sm"
              onClick={() => router.push("/adds?type=buy")}
            >
              + Post Buy Ad
            </Button>
            <Button
              borderRadius={24}
              className="flex-1 sm:flex-none sm:w-[120px] xl:w-[110px] min-w-[90px] text-xs xl:text-[11px]"
              height={32}
              variant="secondary"
              size="sm"
              onClick={() => router.push("/adds?type=sell")}
            >
              + Post Sell Ad
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center justify-center p-0"
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
                    {pendingNotificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[#E23D3A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {pendingNotificationCount}
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
                className="flex items-center justify-center p-0"
                onClick={() => router.push("/contactUs")}
                icon={
                  <div className="w-9 h-9 xl:w-8 xl:h-8 rounded-[50%] border border-[#1D8751] flex items-center justify-center p-0">
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
        </div>
      )}
    </Card>
  );
};

export default UserCard;
