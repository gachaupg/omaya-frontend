"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, Check, Settings, LogOut, User, ChevronDown, ChevronRight, AlignRight } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store/rootReducer";
import { AppDispatch } from "@/store";
import {
  initializeAuth,
  getUserProfile,
  logout,
  openKYCModal,
  checkKYCStatus,
} from "@/features/auth/slices/authSlice";
import { getP2PProfileThunk } from "@/features/p2p/slices/orderSlice";
import { useLanguageOptional } from "@/context/language";
import { useTheme } from "@/context/theme";

const DefaultProfileIcon = () => (
  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#1D8751] border-2 border-white">
    <User className="w-6 h-6 text-white" />
  </div>
);

const NavLink = ({
  href,
  children,
  isTransparent = false,
  pathname,
}: {
  href: string;
  children: React.ReactNode;
  isTransparent?: boolean;
  pathname?: string;
}) => {
  // Helper function to check if a link is active
  const isActive = () => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const active = isActive();

  return (
    <Link
      href={href}
      className={`${active
        ? "text-[#1D8751]" // Active link in green
        : isTransparent
          ? "text-gray-900 dark:text-white" // Dark in light mode, white in dark mode when navbar is transparent
          : "dark:text-white text-gray-900" // Theme-based when navbar has background
        } hover:text-[#1D8751] transition-colors duration-200 text-[11px] md:text-sm xl:text-base 2xl:text-lg whitespace-nowrap`}
    >
      {children}
    </Link>
  );
};

const MobileNavLink = ({
  href,
  children,
  onClick,
  pathname,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
  pathname?: string;
}) => {
  // Helper function to check if a link is active
  const isActive = () => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

  const active = isActive();

  return (
    <Link
      href={href}
      className={`block py-2 transition-colors duration-200 text-lg font-medium ${active
        ? "text-[#1D8751] dark:text-[#1D8751]"
        : "dark:text-white text-gray-900 hover:text-[#1D8751] dark:hover:text-[#1D8751]"
        }`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

interface DropdownItem {
  href: string;
  icon: string;
  title: string | React.ReactNode;
  description: string;
}

const AuthButton = ({
  variant,
  children,
  fullWidth = false,
}: {
  variant: "primary" | "secondary";
  children: React.ReactNode;
  fullWidth?: boolean;
}) => (
  <button
    className={`${variant === "primary"
      ? "bg-[#0E5531] hover:bg-[#13B562] text-white" // Primary button always has white text
      : "bg-transparent border border-[#1D8751] text-[#1D8751] hover:bg-[#1D8751] hover:text-white" // Secondary button with brand colors
      } 
    px-2 py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2 rounded-[22px] transition-colors duration-200 text-xs md:text-sm lg:text-base xl:text-base 2xl:text-lg whitespace-nowrap
    ${fullWidth ? "w-full" : ""}`}
  >
    {children}
  </button>
);

const LanguageSelector = ({ isMobile = false }: { isMobile?: boolean }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ctx = useLanguageOptional();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedLanguage, setSelectedLanguage] = useState(
    ctx?.locale === "so" ? "Somali" : "English"
  );

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const selectLanguage = (language: string) => {
    setSelectedLanguage(language);
    setDropdownOpen(false);
    try {
      const locale = language === "Somali" ? "so" : "en";
      if (ctx) {
        ctx.setLocale(locale as any);
      } else {
        document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
      }
    } catch { }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className="flex items-center justify-center cursor-pointer min-h-[44px] sm:min-h-0 lg:min-h-0 px-1 sm:px-0 lg:px-0"
        onClick={toggleDropdown}
      >
        <Image
          src={
            selectedLanguage === "English"
              ? "https://res.cloudinary.com/dam1sxczj/image/upload/v1746538734/united_kingdom_zud79x.png"
              : "https://res.cloudinary.com/dam1sxczj/image/upload/v1747216099/somali_jq5e97.png"
          }
          alt={selectedLanguage}
          width={24}
          height={24}
          className="rounded-full w-6 h-6 sm:w-7 sm:h-7 md:w-7 md:h-7 lg:w-8 lg:h-8"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          className="dark:fill-white text-gray-900 ml-0.5 sm:ml-1 lg:ml-1 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3 md:h-3 lg:w-4 lg:h-4"
          viewBox="0 0 16 16"
        >
          <path d="M1.5 6.5l6 6 6-6h-12z" />
        </svg>
      </div>
      {dropdownOpen && (
        <>
          {/* Backdrop for mobile */}
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onClick={() => setDropdownOpen(false)}
          />
          <div className={`absolute z-50 dark:bg-[var(--card-color)] bg-white dark:border-[#35353E] border-gray-200 rounded-lg shadow-lg w-[180px] sm:w-[200px] lg:w-[250px] max-w-[calc(100vw-1.5rem)] sm:max-w-none ${isMobile
            ? "bottom-full mb-2 left-1/2 -translate-x-1/2 origin-bottom"
            : "right-0 bottom-full mb-2 sm:mb-0 sm:bottom-auto sm:top-full sm:mt-2 origin-bottom sm:origin-top"
            }`}>
            <button
              className="block w-full text-left px-3 sm:px-4 lg:px-4 py-2.5 sm:py-2 lg:py-2 dark:text-white text-gray-900 dark:hover:bg-[#35353E] hover:bg-gray-100 min-h-[44px] sm:min-h-0 lg:min-h-0 flex items-center transition-colors"
              onClick={() => selectLanguage("English")}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2 sm:space-x-2 lg:space-x-2">
                  <Image
                    src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746538734/united_kingdom_zud79x.png"
                    alt="English"
                    width={20}
                    height={20}
                    className="rounded-full w-5 h-5 sm:w-5 sm:h-5 lg:w-5 lg:h-5 flex-shrink-0"
                  />
                  <span className="text-sm sm:text-sm lg:text-sm">English</span>
                </div>
                {selectedLanguage === "English" && (
                  <div className="w-4 h-4 sm:w-4 sm:h-4 lg:w-4 lg:h-4 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4 lg:h-4 text-[#1D8751]" />
                  </div>
                )}
              </div>
            </button>
            <button
              className="block w-full text-left px-3 sm:px-4 lg:px-4 py-2.5 sm:py-2 lg:py-2 dark:text-white text-gray-900 dark:hover:bg-[#35353E] hover:bg-gray-100 min-h-[44px] sm:min-h-0 lg:min-h-0 flex items-center transition-colors"
              onClick={() => selectLanguage("Somali")}
            >
              <div className="flex items-center justify-between w-full gap-2 sm:gap-4 lg:gap-8">
                <div className="flex items-center space-x-2 sm:space-x-2 lg:space-x-2">
                  <Image
                    src="https://res.cloudinary.com/dam1sxczj/image/upload/v1747216099/somali_jq5e97.png"
                    alt="Somali"
                    width={20}
                    height={20}
                    className="rounded-full w-5 h-5 sm:w-5 sm:h-5 lg:w-5 lg:h-5 flex-shrink-0"
                  />
                  <span className="text-sm sm:text-sm lg:text-sm">Somali</span>
                </div>
                {selectedLanguage === "Somali" && (
                  <div className="w-4 h-4 sm:w-4 sm:h-4 lg:w-4 lg:h-4 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] sm:text-[10px] lg:text-[10px] text-[#1D8751]">
                      ✓
                    </span>
                  </div>
                )}
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const ThemeSelector = ({
  isTransparentNavbar,
  isMobile = false,
}: {
  isTransparentNavbar: boolean;
  isMobile?: boolean;
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, setTheme, isDark } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const selectTheme = (selectedTheme: "light" | "dark" | "deem") => {
    setTheme(selectedTheme);
    setDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const getThemeIcon = () => {
    const iconClass = "w-5 h-5 sm:w-6 sm:h-6";
    if (theme === "dark") {
      return (
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-6 lg:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      );
    } else if (theme === "deem") {
      return (
        <svg
          className={iconClass}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      );
    } else {
      return (
        <svg
          className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-6 lg:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className={`flex items-center justify-center cursor-pointer min-h-[44px] sm:min-h-0 lg:min-h-0 px-1 sm:px-0 lg:px-0 border-none bg-transparent p-0 ${isTransparentNavbar
          ? isDark
            ? "text-white"
            : "text-gray-900"
          : "dark:text-white text-gray-900"
          }`}
        onClick={toggleDropdown}
      >
        {getThemeIcon()}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          className={`ml-0.5 sm:ml-1 lg:ml-1 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3 md:h-3 lg:w-4 lg:h-4 ${isTransparentNavbar ? "fill-white" : "fill-current"
            }`}
          viewBox="0 0 16 16"
        >
          <path d="M1.5 6.5l6 6 6-6h-12z" />
        </svg>
      </button>
      {dropdownOpen && (
        <>
          {/* Backdrop for all screen sizes */}
          <div
            className="fixed inset-0 z-[100] bg-black/20"
            onClick={() => setDropdownOpen(false)}
          />
          <div className={`absolute z-[101] dark:bg-[var(--card-color)] bg-white dark:border-[#35353E] border border-gray-200 rounded-lg shadow-lg w-[180px] sm:w-[200px] lg:w-[250px] max-w-[calc(100vw-1.5rem)] sm:max-w-none ${isMobile
            ? "bottom-full mb-2 left-1/2 -translate-x-1/2 origin-bottom"
            : "right-0 bottom-full mb-2 sm:mb-0 sm:bottom-auto sm:top-full sm:mt-2 origin-bottom sm:origin-top"
            }`}>
            <button
              className="block w-full text-left px-3 sm:px-4 lg:px-4 py-2.5 sm:py-2 lg:py-2 dark:text-white text-gray-900 dark:hover:bg-[#35353E] hover:bg-gray-100 min-h-[44px] sm:min-h-0 lg:min-h-0 flex items-center transition-colors"
              onClick={() => selectTheme("light")}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2 sm:space-x-2 lg:space-x-2">
                  <svg
                    className="w-5 h-5 sm:w-5 sm:h-5 lg:w-5 lg:h-5 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span className="text-sm sm:text-sm lg:text-sm">Light</span>
                </div>
                {theme === "light" && (
                  <div className="w-4 h-4 sm:w-4 sm:h-4 lg:w-4 lg:h-4 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4 lg:h-4 text-[#1D8751]" />
                  </div>
                )}
              </div>
            </button>
            <button
              className="block w-full text-left px-3 sm:px-4 lg:px-4 py-2.5 sm:py-2 lg:py-2 dark:text-white text-gray-900 dark:hover:bg-[#35353E] hover:bg-gray-100 min-h-[44px] sm:min-h-0 lg:min-h-0 flex items-center transition-colors"
              onClick={() => selectTheme("dark")}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2 sm:space-x-2 lg:space-x-2">
                  <svg
                    className="w-5 h-5 sm:w-5 sm:h-5 lg:w-5 lg:h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                  <span className="text-sm sm:text-sm lg:text-sm">Dark</span>
                </div>
                {theme === "dark" && (
                  <div className="w-4 h-4 sm:w-4 sm:h-4 lg:w-4 lg:h-4 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4 lg:h-4 text-[#1D8751]" />
                  </div>
                )}
              </div>
            </button>
            <button
              className="block w-full text-left px-3 sm:px-4 lg:px-4 py-2.5 sm:py-2 lg:py-2 dark:text-white text-gray-900 dark:hover:bg-[#35353E] hover:bg-gray-100 min-h-[44px] sm:min-h-0 lg:min-h-0 flex items-center transition-colors"
              onClick={() => selectTheme("deem")}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2 sm:space-x-2 lg:space-x-2">
                  <svg
                    className="w-5 h-5 sm:w-5 sm:h-5 lg:w-5 lg:h-5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span className="text-sm sm:text-sm lg:text-sm">Dim</span>
                </div>
                {theme === "deem" && (
                  <div className="w-4 h-4 sm:w-4 sm:h-4 lg:w-4 lg:h-4 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-4 lg:h-4 text-[#1D8751]" />
                  </div>
                )}
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default function Navbar() {
  const router = useRouter();
  const pathnameRaw = usePathname();
  // Convert null to undefined for type compatibility
  const pathname = pathnameRaw ?? undefined;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [depositDropdownOpen, setDepositDropdownOpen] = useState(false);
  const [mobileDepositDropdownOpen, setMobileDepositDropdownOpen] =
    useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const depositItems: DropdownItem[] = [
    {
      href: "/dashboard/express-exchange",
      icon: "https://res.cloudinary.com/pitz/image/upload/v1752243765/Vector_2_xauedx.png",
      title: (
        <span className="flex items-center gap-0.5">
          <span>E</span>
          <img
            className="mt-2 block dark:hidden"
            src="https://res.cloudinary.com/pitz/image/upload/v1764698096/Group_9_momvgo.png"
            alt=""
          />
          <img
            className="mt-2 hidden dark:block"
            src="https://res.cloudinary.com/pitz/image/upload/v1764698106/Group_8_hjhlxe.png"
            alt=""
          />
        </span>
      ),
      description: "Trade cryptocurrencies on the exchange with advanced tools and features for optimal transactions",
    },
    {
      href: "/dashboard/exchange",
      icon: "https://res.cloudinary.com/pitz/image/upload/v1764568507/uil_exchange_1_okxkvb.png",
      title: (
        <span className="flex items-center text-[#76777B] dark:text-white font-bold">
          Money{" "}
          <span className="inline-flex">
            <img src="/images/x.png" alt="X" className="dark:hidden inline-block" />
            <img src="/images/xwhite.png" alt="X" className="hidden dark:inline-block" />
          </span>
        </span>
      ),
      description: "Transfer money between different payment methods quickly and securely",
    },
    {
      href: "/dashboard/p2p",
      icon: "https://res.cloudinary.com/pitz/image/upload/v1747237692/users-profiles-left_e2oejc.png",
      title: "P2P",
      description: "Buy and sell cryptocurrencies directly with flexible payment methods",
    },
    {
      href: "/dashboard/swap",
      icon: "https://res.cloudinary.com/pitz/image/upload/v1747237691/Group_164002_fgt2kf.png",
      title: "Swap",
      description: "Exchange one cryptocurrency for another instantly and securely within your wallet",
    },
  ];

  const [profileImageError, setProfileImageError] = useState(false);
  const [cachedProfilePhoto, setCachedProfilePhoto] = useState<string | null>(
    () => {
      if (typeof window !== "undefined") {
        return localStorage.getItem("p2p_profile_image") || localStorage.getItem("profile_photo");
      }
      return null;
    }
  );

  const {
    isAuthenticated,
    profile: userProfile,
    user,
  } = useSelector((state: RootState) => state.auth);
  const kycState = useSelector((state: RootState) => state.kyc);
  const p2pProfile = useSelector((state: RootState) => state.p2pMarket?.getP2PProfile);
  const dispatch = useDispatch<AppDispatch>();
  const depositDropdownRef = useRef<HTMLDivElement>(null);
  const profileModalRef = useRef<HTMLDivElement>(null);
  const profileFetchRef = useRef<{ lastFetch: number; inProgress: boolean; hasFetched: boolean }>({ lastFetch: 0, inProgress: false, hasFetched: false });
  const p2pProfileFetchRef = useRef<{ lastFetch: number; inProgress: boolean; hasFetched: boolean }>({ lastFetch: 0, inProgress: false, hasFetched: false });

  // Use KYC state for verification status, fallback to user.is_verified
  const isVerified = kycState.isVerified !== undefined
    ? kycState.isVerified
    : (user?.is_verified ?? false);

  useEffect(() => {
    dispatch(initializeAuth());
    // Fetch KYC status to know if user is verified
    if (isAuthenticated) {
      dispatch(checkKYCStatus());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      // Ensure KYC status is up to date
      dispatch(checkKYCStatus());
    }
  }, [dispatch, isAuthenticated]);

  // Load cached profile photo from localStorage on mount (same keys as UserCard)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("profile_photo") || localStorage.getItem("p2p_profile_image");
      if (cached) {
        setCachedProfilePhoto(cached);
      }
    }
  }, []);

  // Listen for profile photo updates from other components (same as UserCard - no cache-busting to avoid reload flicker)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleProfilePhotoUpdate = (event: CustomEvent) => {
      const newPhotoUrl = event.detail?.photoUrl;
      if (newPhotoUrl) {
        setCachedProfilePhoto(newPhotoUrl);
        if (typeof window !== "undefined") {
          localStorage.setItem("profile_photo", newPhotoUrl);
          localStorage.setItem("p2p_profile_image", newPhotoUrl);
        }
        setProfileImageError(false);
        // Only refetch if not already fetching and not fetched recently (within 5 seconds)
        const now = Date.now();
        if (!profileFetchRef.current.inProgress && (now - profileFetchRef.current.lastFetch > 5000)) {
          profileFetchRef.current.inProgress = true;
          profileFetchRef.current.lastFetch = now;
          dispatch(getUserProfile()).finally(() => {
            profileFetchRef.current.inProgress = false;
          });
        }
      }
    };

    window.addEventListener('profilePhotoUpdated', handleProfilePhotoUpdate as EventListener);

    return () => {
      window.removeEventListener('profilePhotoUpdated', handleProfilePhotoUpdate as EventListener);
    };
  }, [dispatch]);

  // Reset fetch flags when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      profileFetchRef.current.hasFetched = false;
      profileFetchRef.current.lastFetch = 0;
      p2pProfileFetchRef.current.hasFetched = false;
      p2pProfileFetchRef.current.lastFetch = 0;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Fetch profile if we don't have it or if we have a cached photo but no profile
    // Prevent refetching if already fetching or fetched recently (within 60 seconds)
    // Only check once when authenticated, not on every userProfile/cachedProfilePhoto change
    if (isAuthenticated && !profileFetchRef.current.hasFetched && (!userProfile || (!userProfile.photo && cachedProfilePhoto))) {
      const now = Date.now();
      if (!profileFetchRef.current.inProgress && (now - profileFetchRef.current.lastFetch > 60000)) {
        profileFetchRef.current.inProgress = true;
        profileFetchRef.current.lastFetch = now;
        profileFetchRef.current.hasFetched = true;
        dispatch(getUserProfile()).finally(() => {
          profileFetchRef.current.inProgress = false;
        });
      }
    }
    // Mark as fetched if userProfile becomes available (from another source)
    if (userProfile && !profileFetchRef.current.hasFetched) {
      profileFetchRef.current.hasFetched = true;
    }
  }, [isAuthenticated, dispatch]); // Removed userProfile and cachedProfilePhoto from deps to prevent loops

  // Fetch P2P profile (same as UserCard) - provides profile photo that may not be in auth profile yet
  // Only fetch if not already fetched recently (within 60 seconds) and not already in progress
  useEffect(() => {
    if (isAuthenticated && !p2pProfileFetchRef.current.hasFetched) {
      const now = Date.now();
      // Only fetch if we don't have P2P profile data or if it's been more than 60 seconds since last fetch
      const shouldFetch = !p2pProfile?.profile || (now - p2pProfileFetchRef.current.lastFetch > 60000);
      if (shouldFetch && !p2pProfileFetchRef.current.inProgress) {
        p2pProfileFetchRef.current.inProgress = true;
        p2pProfileFetchRef.current.lastFetch = now;
        p2pProfileFetchRef.current.hasFetched = true;
        dispatch(getP2PProfileThunk())
          .unwrap()
          .then((response) => {
            if (response?.profile?.photo && typeof window !== "undefined") {
              const photo = response.profile.photo;
              localStorage.setItem("p2p_profile_image", photo);
              localStorage.setItem("profile_photo", photo);
              setCachedProfilePhoto(photo);
              setProfileImageError(false);
            }
          })
          .catch(() => {})
          .finally(() => {
            p2pProfileFetchRef.current.inProgress = false;
          });
      }
    }
    // Reset hasFetched flag if p2pProfile becomes available (from another source)
    if (p2pProfile?.profile && !p2pProfileFetchRef.current.hasFetched) {
      p2pProfileFetchRef.current.hasFetched = true;
    }
  }, [dispatch, isAuthenticated]); // Removed p2pProfile from deps to prevent loops

  // Sync P2P profile photo from Redux (when UserCard or Navbar fetches it) to localStorage and cached state
  useEffect(() => {
    const photo = p2pProfile?.profile?.photo;
    if (photo && typeof window !== "undefined") {
      const photoUrl = String(photo).trim();
      if (photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('/') || photoUrl.startsWith('data:'))) {
        localStorage.setItem("profile_photo", photoUrl);
        localStorage.setItem("p2p_profile_image", photoUrl);
        setCachedProfilePhoto(photoUrl);
        setProfileImageError(false);
      }
    }
  }, [p2pProfile?.profile?.photo]);

  // Cache auth profile photo in localStorage when it's available (sync both keys like UserCard)
  useEffect(() => {
    if (userProfile?.photo && typeof window !== "undefined") {
      const photoUrl = userProfile.photo.trim();
      if (photoUrl && (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('/') || photoUrl.startsWith('data:'))) {
        localStorage.setItem("profile_photo", photoUrl);
        localStorage.setItem("p2p_profile_image", photoUrl);
        setCachedProfilePhoto(photoUrl);
        setProfileImageError(false);
      }
    }
  }, [userProfile?.photo]);

  // Reset image error when profile photo changes
  useEffect(() => {
    const currentPhoto = userProfile?.photo || cachedProfilePhoto;
    if (currentPhoto) {
      // Reset error when we have a photo URL
      setProfileImageError(false);
    }
  }, [userProfile?.photo, cachedProfilePhoto]);

  // Reload cached photo on route change (dashboard) - check both keys like UserCard
  useEffect(() => {
    if (isAuthenticated && pathname?.startsWith('/dashboard') && typeof window !== 'undefined') {
      const cached = localStorage.getItem("profile_photo") || localStorage.getItem("p2p_profile_image");
      if (cached && !cachedProfilePhoto) {
        setCachedProfilePhoto(cached);
        setProfileImageError(false);
      }
    }
  }, [pathname, isAuthenticated, cachedProfilePhoto]);

  // Profile data available for rendering

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleDepositDropdown = () => {
    setDepositDropdownOpen(!depositDropdownOpen);
  };

  const toggleMobileDepositDropdown = () => {
    setMobileDepositDropdownOpen(!mobileDepositDropdownOpen);
  };

  const toggleProfileModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setProfileModalOpen(!profileModalOpen);
  };

  const closeProfileModal = () => {
    setProfileModalOpen(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    setProfileModalOpen(false);
    router.push("/auth/login");
  };

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  //Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        depositDropdownRef.current &&
        !depositDropdownRef.current.contains(event.target as Node)
      ) {
        setDepositDropdownOpen(false); // Close deposit dropdown
      }

      if (
        profileModalRef.current &&
        !profileModalRef.current.contains(event.target as Node)
      ) {
        setProfileModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close mobile deposit dropdown when mobile menu closes
  useEffect(() => {
    if (!mobileMenuOpen) {
      setMobileDepositDropdownOpen(false);
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 0;
          setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Smart navbar background logic based on page and scroll state
  const getNavbarBackground = () => {
    const isHomePage = pathname === "/";
    const isAboutPage = pathname === "/about";
    const isDashboardPage = pathname?.startsWith("/dashboard") || false;

    if (isHomePage) {
      // Home page: transparent initially, completely opaque on scroll
      return scrolled
        ? "dark:bg-[var(--bg-color)] bg-white backdrop-blur-sm"
        : "bg-transparent";
    } else if (isAboutPage) {
      // About page: always show solid white/dark background
      return "dark:bg-[var(--bg-color)] bg-white shadow-sm border-b border-gray-100 dark:border-transparent";
    } else if (isDashboardPage) {
      // Dashboard pages: always have solid background for visibility
      return scrolled
        ? "dark:bg-[var(--bg-color)] bg-white backdrop-blur-sm shadow-sm"
        : "dark:bg-[var(--bg-color)]/80 bg-white/80 backdrop-blur-sm";
    } else {
      // Other pages: smart background based on scroll
      return scrolled
        ? "dark:bg-[var(--bg-color)] bg-white backdrop-blur-sm shadow-sm"
        : "dark:bg-transparent bg-white/80 backdrop-blur-sm";
    }
  };

  // Check if navbar should show white text (only transparent on home page when not scrolled)
  const isTransparentNavbar = pathname === "/" && !scrolled;

  // Use theme context instead of manual localStorage parsing
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoize logo selection to prevent unnecessary re-renders
  const logoConfig = useMemo(() => {
    if (!mounted) return null;

    const isHomePage = pathname === "/";
    const isAboutPage = pathname === "/about";
    const isNotScrolled = !scrolled;
    const isDarkTheme = theme === "dark";

    if ((isHomePage && isNotScrolled)) {
      // Home page, not scrolled: white logo for transparent/green background
      return {
        src: "https://res.cloudinary.com/pitz/image/upload/v1764572384/bad9edd9da5201cb8f8f9cea35bf46f4fb541bd6_lplbyc.png",
        alt: "OMAYA Exchange",
      };
    } else if (isDarkTheme) {
      // Dark theme: green logo
      return {
        src: "https://res.cloudinary.com/pitz/image/upload/v1764572384/bad9edd9da5201cb8f8f9cea35bf46f4fb541bd6_lplbyc.png",
        alt: "OMAYA Exchange",
      };
    } else {
      // Light theme: default logo
      return {
        src: "https://res.cloudinary.com/pitz/image/upload/v1764572384/bad9edd9da5201cb8f8f9cea35bf46f4fb541bd6_lplbyc.png",
        alt: "OMAYA Exchange",
      };
    }
  }, [mounted, pathname, scrolled, theme]);

  const toggleImageModal = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    setShowImagePreview((prev) => !prev);
  };

  const closeImageModal = () => {
    setShowImagePreview(false);
  };

  // Handle navigation with verification check
  const handleProtectedNavigation = async (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Allow dashboard access for all users
    if (href === "/dashboard" || href === "/dashboard/") {
      return; // Allow navigation
    }

    // Check if this is a protected route
    const protectedRoutes = [
      "/dashboard/express-exchange",
      "/dashboard/exchange",
      "/dashboard/p2p",
      "/dashboard/swap",
      "/dashboard/settings",
    ];

    const isProtectedRoute = protectedRoutes.some(route => href.startsWith(route));

    if (isProtectedRoute && isAuthenticated) {
      // Check if user is verified
      const isUnverified = isVerified === false;

      if (isUnverified) {
        e.preventDefault();
        e.stopPropagation();

        // Double-check with API
        try {
          const result = await dispatch(checkKYCStatus()).unwrap();
          const kycStatus = result as any;

          if (kycStatus?.is_verified === false) {
            dispatch(openKYCModal());
            return;
          }
        } catch (error) {
          // If API check fails, use current state
          if (isVerified === false) {
            dispatch(openKYCModal());
            return;
          }
        }
      }
    }
  };

  // Don't render theme-dependent content until mounted
  if (!mounted) {
    return (
      <nav
        className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ${isTransparentNavbar
          ? "bg-transparent"
          : "bg-white dark:bg-gray-900 shadow-lg"
          }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Placeholder content during SSR */}
            <div className="flex items-center">
              <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <div>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 w-full flex items-center justify-between px-3 py-4 md:h-20 lg:h-auto md:px-4 md:py-2.5 lg:px-8 lg:py-4 xl:px-12 2xl:px-20 transition-all duration-300 ${getNavbarBackground()}`}
      >
        <div className="flex items-center min-w-0 flex-1">
          <Link
            href="/"
            className="mr-4 sm:mr-8 md:mr-6 lg:mr-12 xl:mr-20 shrink-0 flex items-center h-full"
          >
            {/* Optimized logo selection using memoized config */}
            {logoConfig && (
              <Image
                src={logoConfig.src}
                alt={logoConfig.alt}
                width={150}
                height={40}
                className="h-8 w-28 sm:h-auto sm:w-32 md:w-28 lg:w-36 xl:w-40 2xl:w-48 dark:brightness-0 dark:invert object-contain"
                priority
              />
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 md:space-x-2 lg:space-x-3 xl:space-x-4 2xl:space-x-6 shrink min-w-0">
            <NavLink
              href="/"
              isTransparent={isTransparentNavbar}
              pathname={pathname}
            >
              Home
            </NavLink>
            {isAuthenticated && (
              <NavLink
                href="/dashboard"
                isTransparent={isTransparentNavbar}
                pathname={pathname}
              >
                Dashboard
              </NavLink>
            )}
            <NavLink
              href="/market"
              isTransparent={isTransparentNavbar}
              pathname={pathname}
            >
              Market
            </NavLink>
            <NavLink
              href="/rates"
              isTransparent={isTransparentNavbar}
              pathname={pathname}
            >
              Rates
            </NavLink>
            <NavLink
              href="/blog"
              isTransparent={isTransparentNavbar}
              pathname={pathname}
            >
              Blog
            </NavLink>
            <NavLink
              href="/about"
              isTransparent={isTransparentNavbar}
              pathname={pathname}
            >
              <span className="hidden lg:inline">About Us</span>
              <span className="lg:hidden">About</span>
            </NavLink>
            {/* Show Contact us only on auth pages */}
            {/* {(pathname?.startsWith("/auth/login") || 
              pathname?.startsWith("/auth/register") || 
              pathname?.startsWith("/auth/forgotPassword") ||
              pathname?.startsWith("/auth/resetPassword")) && (
              <NavLink href="#" isTransparent={isTransparentNavbar} pathname={pathname}>
                Contact us
              </NavLink>
            )} */}

            <NavLink
              href="/contactUs"
              isTransparent={isTransparentNavbar}
              pathname={pathname}
            >
              <span className="hidden lg:inline">Contact Us</span>
              <span className="lg:hidden">Contact</span>
            </NavLink>
          </div>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-1 md:space-x-1.5 lg:space-x-2 xl:space-x-3 2xl:space-x-4 relative flex-shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center space-x-1 md:space-x-1.5 lg:space-x-2 xl:space-x-3 2xl:space-x-4">
              <div className="" ref={depositDropdownRef}>
                <button
                  onClick={toggleDepositDropdown}
                  className="flex items-center bg-[#1D8751] hover:bg-[#13B562] text-white px-2 py-1 md:px-2.5 md:py-1.5 lg:px-4 lg:py-2 xl:px-5 xl:py-2.5 rounded-[10px] transition-colors duration-200 text-xs md:text-xs lg:text-sm xl:text-base 2xl:text-lg whitespace-nowrap"
                >
                  Deposit
                  <ChevronDown className={`ml-1 md:ml-2 w-3 h-3 md:w-3.5 md:h-3.5 lg:w-5 lg:h-5 transition-transform duration-200 ${depositDropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {/* Deposit Dropdown */}
                {depositDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-[calc(100vw-2rem)] max-w-[400px] sm:w-[350px] md:w-[380px] lg:w-[400px] dark:bg-[#1E2329] bg-white dark:border-[#35353E] border-gray-200 border rounded shadow-xl z-[9999]">
                    <div className="p-3 sm:p-4">
                      {depositItems.map((item, index) => {
                        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                        return (
                          <Link
                            key={index}
                            href={item.href}
                            className="block mb-1 last:mb-0"
                            onClick={(e) => {
                              handleProtectedNavigation(e, item.href);
                              setDepositDropdownOpen(false);
                            }}
                          >
                            <div
                              className={`flex items-center rounded-lg transition-colors duration-200 group p-2 sm:p-3 ${isActive
                                ? "dark:bg-[#35353E] bg-gray-100"
                                : "dark:hover:bg-[#35353E] hover:bg-gray-50"
                                }`}
                            >
                              <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center mr-2 sm:mr-4 shrink-0">
                                <img
                                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                                  src={item.icon}
                                  alt=""
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="dark:text-white flex flex-row items-center text-[#727272] font-semibold text-sm sm:text-base mb-0.5">
                                  {item.title}
                                </h4>
                                <p className="dark:text-gray-400 text-gray-500 text-xs leading-relaxed line-clamp-2">
                                  {item.description}
                                </p>
                              </div>
                              <ChevronRight className="w-4 h-4 dark:text-gray-500 text-gray-400 group-hover:text-[#1D8751] transition-colors shrink-0 ml-2" />
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="relative flex-shrink-0" ref={profileModalRef}>
                <button
                  onClick={toggleProfileModal}
                  className="text-white focus:outline-none relative"
                >
                  {(p2pProfile?.profile?.photo || cachedProfilePhoto || userProfile?.photo) &&
                    !profileImageError ? (
                    <img
                      src={p2pProfile?.profile?.photo || cachedProfilePhoto || userProfile?.photo || ""}
                      alt="Profile"
                      className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-lg"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.onerror = null;
                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%231D8751'/%3E%3Cg fill='white'%3E%3Ccircle cx='20' cy='15' r='5'/%3E%3Cpath d='M20 22c-5 0-9 3-9 6v2c0 1 1 2 2 2h14c1 0 2-1 2-2v-2c0-3-4-6-9-6z'/%3E%3C/g%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center bg-[#1D8751] border-2 border-white dark:border-gray-600 shadow-lg">
                      <User className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                  )}
                  {/* Verification Badge - only show for verified users */}
                  {isVerified && (
                    <span className="absolute -top-0.5 -right-0.5 md:-top-0.5 md:-right-0.5 lg:-top-1 lg:-right-1 inline-flex items-center justify-center w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5 z-10">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        className="absolute w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5"
                      >
                        <circle cx="10" cy="10" r="9" fill="white" />
                        <circle cx="10" cy="10" r="7.5" fill="#1D8751" />
                        {/* Serrated edge using small circles */}
                        {[
                          0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330,
                        ].map((angle) => {
                          const rad = (angle * Math.PI) / 180;
                          const x = 10 + 8.5 * Math.cos(rad);
                          const y = 10 + 8.5 * Math.sin(rad);
                          return (
                            <circle
                              key={angle}
                              cx={x}
                              cy={y}
                              r="1"
                              fill="white"
                            />
                          );
                        })}
                      </svg>
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="relative z-10 w-2 h-2 md:w-2.5 md:h-2.5 lg:w-2.5 lg:h-2.5"
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
                  )}
                </button>

                {/* Profile Modal */}
                {profileModalOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 dark:bg-[var(--card-color)] bg-white border dark:border-[#35353E] border-gray-200 rounded-lg shadow-xl z-[9999]">
                    <div className="p-4">
                      {/* User Info */}
                      <div className="flex items-center mb-4 pb-4 border-b dark:border-[#35353E] border-gray-200">
                        <div className="mr-3 relative">
                          <button
                            className="relative cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={toggleImageModal}
                            type="button"
                          >
                            {(p2pProfile?.profile?.photo || cachedProfilePhoto || userProfile?.photo) &&
                              !profileImageError ? (
                              <>
                                <img
                                  src={
                                    p2pProfile?.profile?.photo ||
                                    cachedProfilePhoto ||
                                    userProfile?.photo ||
                                    ""
                                  }
                                  alt="Profile"
                                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600 shadow-lg"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    target.onerror = null;
                                    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Ccircle cx='24' cy='24' r='24' fill='%231D8751'/%3E%3Cg fill='white'%3E%3Ccircle cx='24' cy='18' r='6'/%3E%3Cpath d='M24 26c-6 0-10 4-10 7v3c0 1 1 2 2 2h16c1 0 2-1 2-2v-3c0-3-4-7-10-7z'/%3E%3C/g%3E%3C/svg%3E";
                                  }}
                                />
                                {/* Verification Badge - only show for verified users */}
                                {isVerified && (
                                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 z-10">
                                    <svg
                                      width="20"
                                      height="20"
                                      viewBox="0 0 20 20"
                                      className="absolute"
                                    >
                                      <circle
                                        cx="10"
                                        cy="10"
                                        r="9"
                                        fill="white"
                                      />
                                      <circle
                                        cx="10"
                                        cy="10"
                                        r="7.5"
                                        fill="#1D8751"
                                      />
                                      {/* Serrated edge using small circles */}
                                      {[
                                        0, 30, 60, 90, 120, 150, 180, 210, 240,
                                        270, 300, 330,
                                      ].map((angle) => {
                                        const rad = (angle * Math.PI) / 180;
                                        const x = 10 + 8.5 * Math.cos(rad);
                                        const y = 10 + 8.5 * Math.sin(rad);
                                        return (
                                          <circle
                                            key={angle}
                                            cx={x}
                                            cy={y}
                                            r="1"
                                            fill="white"
                                          />
                                        );
                                      })}
                                    </svg>
                                    <svg
                                      width="10"
                                      height="10"
                                      viewBox="0 0 10 10"
                                      fill="none"
                                      xmlns="http://www.w3.org/2000/svg"
                                      className="relative z-10"
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
                                )}
                              </>
                            ) : (
                              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#1D8751] border-2 border-white">
                                <User className="w-6 h-6 text-white" />
                              </div>
                            )}
                          </button>
                        </div>
                        <div>
                          <h4 className="dark:text-white text-gray-800 font-medium text-sm">
                            {user?.first_name} {user?.last_name}
                          </h4>
                          <p className="dark:text-gray-400 text-gray-600 text-xs">
                            {user?.email}
                          </p>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="space-y-2">
                        <Link
                          href="/dashboard/account?tab=profile"
                          className="flex items-center w-full px-3 py-2 dark:text-gray-300 text-gray-700 dark:hover:text-white hover:text-gray-900 dark:hover:bg-[#35353E] hover:bg-gray-100 rounded-md transition-colors duration-200"
                          onClick={() => setProfileModalOpen(false)}
                        >
                          <Settings size={16} className="mr-3" />
                          <span className="text-sm">Account settings</span>
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-3 py-2 dark:text-gray-300 text-gray-700 dark:hover:text-white hover:text-gray-900 dark:hover:bg-[#35353E] hover:bg-gray-100 rounded-md transition-colors duration-200"
                        >
                          <LogOut size={16} className="mr-3" />
                          <span className="text-sm">Logout</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <>
              <Link href="/auth/register">
                <AuthButton variant="primary">Register</AuthButton>
              </Link>
              <Link href="/auth/login">
                <AuthButton variant="secondary">Log In</AuthButton>
              </Link>
            </>
          )}

          <div className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-1.5 lg:space-x-2 xl:space-x-3 2xl:space-x-4">
            <LanguageSelector />
            <ThemeSelector isTransparentNavbar={isTransparentNavbar} />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`md:hidden p-1.5 sm:p-2 flex items-center justify-center rounded-md focus:outline-none transition-colors ${theme === "light"
            ? "text-black" // Always black in light mode
            : isTransparentNavbar
              ? "text-white" // White when navbar is transparent in dark mode
              : "text-white" // White in dark mode
            }`}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <AlignRight
            size={24}
            className={`sm:w-7 sm:h-7 ${theme === "light"
              ? "text-black"
              : isTransparentNavbar
                ? "text-white"
                : "text-white"
              }`}
            strokeWidth={2.5}
          />
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
          }`}
        onClick={toggleMobileMenu}
      />

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-[300px] z-[60] md:hidden p-6 space-y-6 shadow-2xl transition-transform duration-300 ease-in-out dark:bg-[var(--bg-color)] bg-white border-l border-border dark:border-accent overflow-y-auto ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={24} className="text-gray-900 dark:text-white" />
          </button>
        </div>
        <MobileNavLink
          href="/"
          onClick={toggleMobileMenu}
          pathname={pathname}
        >
          Home
        </MobileNavLink>
        {isAuthenticated && (
          <MobileNavLink
            href="/dashboard"
            onClick={toggleMobileMenu}
            pathname={pathname}
          >
            Dashboard
          </MobileNavLink>
        )}
        <MobileNavLink
          href="/market"
          onClick={toggleMobileMenu}
          pathname={pathname}
        >
          Market
        </MobileNavLink>
        <MobileNavLink
          href="/rates"
          onClick={toggleMobileMenu}
          pathname={pathname}
        >
          Rates
        </MobileNavLink>
        <MobileNavLink
          href="/blog"
          onClick={toggleMobileMenu}
          pathname={pathname}
        >
          Blog
        </MobileNavLink>
        <MobileNavLink
          href="/about"
          onClick={toggleMobileMenu}
          pathname={pathname}
        >
          About Us
        </MobileNavLink>
        <MobileNavLink
          href="/contactUs"
          onClick={toggleMobileMenu}
          pathname={pathname}
        >
          Contact Us
        </MobileNavLink>

        <div className="flex flex-col space-y-4 pt-4">
          {isAuthenticated ? (
            <>
              <div className="relative">
                <button
                  onClick={toggleMobileDepositDropdown}
                  className="flex items-center justify-center w-full bg-[#1D8751] hover:bg-[#13B562] text-white px-6 py-2 rounded-full transition-colors duration-200 text-base min-h-[44px]"
                >
                  Deposit
                  <ChevronDown className={`ml-2 w-5 h-5 transition-transform duration-200 ${mobileDepositDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Mobile Deposit Dropdown */}
                {mobileDepositDropdownOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 bg-black/50 z-[60] md:hidden"
                      onClick={toggleMobileDepositDropdown}
                    />
                    {/* Dropdown Menu */}
                        <div className="fixed inset-x-2 sm:inset-x-4 top-[4.5rem] sm:top-20 z-[70] md:hidden dark:bg-[var(--card-color)] bg-white dark:border-[#35353E] border-gray-200 border rounded-xl shadow-xl overflow-hidden max-h-[calc(100vh-6rem)] overflow-y-auto">
                          <div className="p-3 sm:p-4">
                            {depositItems.map((item, index) => {
                              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                              return (
                                <Link
                                  key={index}
                                  href={item.href}
                                  className="block mb-2 last:mb-0"
                                  onClick={(e) => {
                                    handleProtectedNavigation(e, item.href);
                                    setMobileDepositDropdownOpen(false);
                                    toggleMobileMenu();
                                  }}
                                >
                                  <div
                                    className={`flex items-center rounded-lg transition-colors duration-200 group p-2 sm:p-3 ${isActive
                                      ? "dark:bg-[#35353E] bg-gray-100"
                                      : "dark:hover:bg-[#35353E] hover:bg-gray-50"
                                      }`}
                                  >
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center mr-2 sm:mr-4 shrink-0">
                                      <img
                                        className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                                        src={item.icon}
                                        alt=""
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="dark:text-white flex flex-row items-center text-gray-900 font-medium text-sm sm:text-base mb-0.5 sm:mb-1">
                                        {item.title}
                                      </h4>
                                      <p className="dark:text-gray-400 text-gray-600 text-xs sm:text-sm leading-relaxed line-clamp-2">
                                        {item.description}
                                      </p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 dark:text-gray-400 text-gray-500 group-hover:text-[#1D8751] transition-colors shrink-0 ml-1 sm:ml-2" />
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                  </>
                )}
                  </div>
                  <div className="relative mt-4 flex justify-center">
                    {/* <button
                    onClick={toggleProfileModal}
                    className="text-white focus:outline-none"
                  >
                    {userProfile?.photo ? (
                      <img
                        src={userProfile.photo}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <DefaultProfileIcon />
                    )}
                  </button>
                  <span className="absolute bottom-0 right-0 w-5 h-5 bg-[#1D8751] rounded-full flex items-center justify-center border-2 border-white">
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
                  </span> */}
              </div>
              <div className="flex flex-col items-center space-y-3 mt-4">
                <button
                  onClick={toggleProfileModal}
                  className="flex items-start space-x-3 justify-between w-full text-left focus:outline-none"
                >
                  <div className="relative shrink-0 flex-shrink-0 flex-none self-start" style={{ width: 40, height: 40 }}>
                    {(p2pProfile?.profile?.photo || cachedProfilePhoto || userProfile?.photo) &&
                      !profileImageError ? (
                      <>
                        <img
                          src={
                            p2pProfile?.profile?.photo ||
                            cachedProfilePhoto ||
                            userProfile?.photo ||
                            ""
                          }
                          alt="Profile"
                          className="block w-full h-full rounded-full object-cover object-center border-2 border-white dark:border-gray-600 shadow-lg"
                          style={{ width: 40, height: 40, minWidth: 40, minHeight: 40 }}
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.onerror = null;
                            target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%231D8751'/%3E%3Cg fill='white'%3E%3Ccircle cx='20' cy='15' r='5'/%3E%3Cpath d='M20 22c-5 0-9 3-9 6v2c0 1 1 2 2 2h14c1 0 2-1 2-2v-2c0-3-4-6-9-6z'/%3E%3C/g%3E%3C/svg%3E";
                          }}
                        />
                        {/* Verification Badge - only show for verified users */}
                        {isVerified && (
                          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 z-10">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              className="absolute"
                            >
                              <circle cx="10" cy="10" r="9" fill="white" />
                              <circle
                                cx="10"
                                cy="10"
                                r="7.5"
                                fill="#1D8751"
                              />
                              {/* Serrated edge using small circles */}
                              {[
                                0, 30, 60, 90, 120, 150, 180, 210, 240, 270,
                                300, 330,
                              ].map((angle) => {
                                const rad = (angle * Math.PI) / 180;
                                const x = 10 + 8.5 * Math.cos(rad);
                                const y = 10 + 8.5 * Math.sin(rad);
                                return (
                                  <circle
                                    key={angle}
                                    cx={x}
                                    cy={y}
                                    r="1"
                                    fill="white"
                                  />
                                );
                              })}
                            </svg>
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 10 10"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="relative z-10"
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
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-[#1D8751] border-2 border-white dark:border-gray-600">
                        <DefaultProfileIcon />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <h4 className="dark:text-white text-gray-900 font-medium text-sm truncate">
                        {user?.first_name && user?.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user?.email}
                      </h4>
                      {isVerified && (
                        <span className="inline-flex items-center justify-center w-4 h-4 shrink-0">
                          <svg width="16" height="16" viewBox="0 0 20 20" className="absolute">
                            <circle cx="10" cy="10" r="9" fill="white" />
                            <circle cx="10" cy="10" r="7.5" fill="#1D8751" />
                            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => {
                              const rad = (angle * Math.PI) / 180;
                              const x = 10 + 8.5 * Math.cos(rad);
                              const y = 10 + 8.5 * Math.sin(rad);
                              return <circle key={angle} cx={x} cy={y} r="1" fill="white" />;
                            })}
                          </svg>
                          <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="relative z-10">
                            <path d="M2 5L4 7L8 3" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs truncate">{user?.email}</p>
                  </div>
                </button>
              </div>


                  {/* Mobile Profile Modal */}
                  {profileModalOpen && (
                    <div className="fixed inset-0 z-[9999] md:hidden pointer-events-auto">
                      <div
                        className="absolute inset-0 bg-gray-900/50 dark:bg-black/50 z-0 pointer-events-auto"
                        onClick={() => setProfileModalOpen(false)}
                      />
                      <div className="absolute bottom-0 left-0 right-0 z-10 bg-white dark:bg-[#1E2329] border-t border-gray-200 dark:border-accent rounded-t-lg pb-safe pointer-events-auto">
                        <div className="p-6 pb-8 pointer-events-auto">
                          {/* User Info */}
                          <div className="flex items-start mb-6 gap-4">
                            <div className="shrink-0 flex-shrink-0 flex-none self-start" style={{ width: 64, height: 64 }}>
                              <button
                                className="block w-full h-full rounded-full overflow-hidden border-2 border-white dark:border-gray-600 shadow-lg cursor-pointer hover:opacity-80 transition-opacity relative"
                                onClick={toggleImageModal}
                                type="button"
                              >
                                {(p2pProfile?.profile?.photo || cachedProfilePhoto || userProfile?.photo) &&
                                  !profileImageError ? (
                                  <>
                                    <img
                                      src={
                                        p2pProfile?.profile?.photo ||
                                        cachedProfilePhoto ||
                                        userProfile?.photo ||
                                        ""
                                      }
                                      alt="Profile"
                                      className="block w-full h-full object-cover object-center"
                                      style={{ width: 64, height: 64, minWidth: 64, minHeight: 64 }}
                                      onError={(e) => {
                                        const target = e.currentTarget;
                                        target.onerror = null;
                                        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='32' fill='%231D8751'/%3E%3Cg fill='white'%3E%3Ccircle cx='32' cy='24' r='8'/%3E%3Cpath d='M32 36c-8 0-14 5-14 10v4c0 1 1 2 2 2h24c1 0 2-1 2-2v-4c0-5-6-10-14-10z'/%3E%3C/g%3E%3C/svg%3E";
                                      }}
                                    />
                                    {/* Verification Badge - only show for verified users */}
                                    {isVerified && (
                                      <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-6 h-6 z-10">
                                        <svg
                                          width="24"
                                          height="24"
                                          viewBox="0 0 24 24"
                                          className="absolute"
                                        >
                                          <circle
                                            cx="12"
                                            cy="12"
                                            r="11"
                                            fill="white"
                                          />
                                          <circle
                                            cx="12"
                                            cy="12"
                                            r="9"
                                            fill="#1D8751"
                                          />
                                          {/* Serrated edge using small circles */}
                                          {[
                                            0, 30, 60, 90, 120, 150, 180, 210,
                                            240, 270, 300, 330,
                                          ].map((angle) => {
                                            const rad = (angle * Math.PI) / 180;
                                            const x = 12 + 10 * Math.cos(rad);
                                            const y = 12 + 10 * Math.sin(rad);
                                            return (
                                              <circle
                                                key={angle}
                                                cx={x}
                                                cy={y}
                                                r="1.2"
                                                fill="white"
                                              />
                                            );
                                          })}
                                        </svg>
                                        <svg
                                          width="12"
                                          height="12"
                                          viewBox="0 0 12 12"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="relative z-10"
                                        >
                                          <path
                                            d="M2.5 6L5 8.5L9.5 4"
                                            stroke="#FFFFFF"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <div className="w-full h-full rounded-full flex items-center justify-center bg-[#1D8751]">
                                    <User className="w-8 h-8 text-white" />
                                  </div>
                                )}
                              </button>
                            </div>
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <h4 className="text-gray-900 dark:text-white font-medium text-lg truncate" title={`${user?.first_name || ""} ${user?.last_name || ""}`.trim()}>
                                {user?.first_name} {user?.last_name}
                              </h4>
                              <p className="text-gray-500 dark:text-gray-400 text-sm truncate mt-0.5" title={user?.email}>
                                {user?.email}
                              </p>
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="space-y-3 relative" style={{zIndex: 10000}}>
                            <button
                              type="button"
                              onTouchEnd={(e) => {
                                e.preventDefault();
                                setProfileModalOpen(false);
                                setMobileMenuOpen(false);
                                setTimeout(() => router.push("/dashboard/account"), 100);
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                setProfileModalOpen(false);
                                setMobileMenuOpen(false);
                                router.push("/dashboard/account");
                              }}
                              className="flex items-center w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#35353E] rounded-lg transition-colors duration-200 active:bg-gray-200 dark:active:bg-[#2A2A2A] select-none"
                              style={{WebkitTapHighlightColor: 'rgba(0,0,0,0)'}}
                            >
                              <Settings size={20} className="mr-3 flex-shrink-0" />
                              <span className="text-base">Account settings</span>
                            </button>

                            <button
                              type="button"
                              onTouchEnd={(e) => {
                                e.preventDefault();
                                setProfileModalOpen(false);
                                setMobileMenuOpen(false);
                                setTimeout(() => handleLogout(), 100);
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                setProfileModalOpen(false);
                                setMobileMenuOpen(false);
                                handleLogout();
                              }}
                              className="flex items-center w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#35353E] rounded-lg transition-colors duration-200 active:bg-gray-200 dark:active:bg-[#2A2A2A] select-none"
                              style={{WebkitTapHighlightColor: 'rgba(0,0,0,0)'}}
                            >
                              <LogOut size={20} className="mr-3 flex-shrink-0" />
                              <span className="text-base">Logout</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
            </>
          ) : (
            <>
              <Link href="/auth/register" onClick={toggleMobileMenu}>
                <AuthButton variant="primary" fullWidth>
                  Register
                </AuthButton>
              </Link>
              <Link href="/auth/login" onClick={toggleMobileMenu}>
                <AuthButton variant="secondary" fullWidth>
                  Log In
                </AuthButton>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center justify-center gap-6 pt-4 border-t dark:border-gray-700 border-gray-200">
          <LanguageSelector isMobile={true} />
          <ThemeSelector isTransparentNavbar={isTransparentNavbar} isMobile={true} />
        </div>
      </div>


      {/* Image Preview Modal */}
      {
        showImagePreview &&
        (userProfile?.photo || cachedProfilePhoto) &&
        !profileImageError && (
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-75 p-4"
            onClick={() => setShowImagePreview(false)}
          >
            <div
              className="relative max-w-2xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowImagePreview(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
                aria-label="Close image preview"
              >
                <X size={24} className="w-6 h-6" />
              </button>
              <img
                src={userProfile?.photo || cachedProfilePhoto || ""}
                alt="Profile Preview"
                className="w-full h-auto rounded-lg shadow-2xl object-contain max-h-[90vh]"
                onError={() => {
                  setProfileImageError(true);
                  setShowImagePreview(false);
                }}
              />
            </div>
          </div>
        )
      }
    </div>
  );
}
