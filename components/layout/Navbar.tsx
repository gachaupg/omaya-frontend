"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, Check, Settings, LogOut, User } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/features/auth/store";
import {
  initializeAuth,
  getUserProfile,
  logout,
} from "@/features/auth/slices/authSlice";
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
      className={`${
        active
          ? "text-[#1D8751]" // Active link in green
          : isTransparent
          ? "text-gray-900 dark:text-white" // Dark in light mode, white in dark mode when navbar is transparent
          : "dark:text-white text-gray-900" // Theme-based when navbar has background
      } hover:text-[#1D8751] transition-colors duration-200 text-xs md:text-xs lg:text-base xl:text-base 2xl:text-lg`}
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
      className={`block py-2 transition-colors duration-200 text-lg ${active
        ? "text-[#1D8751]"
        : "dark:text-white text-gray-900 hover:text-[#1D8751]"
        }`}
      onClick={onClick}
    >
      {children}
    </Link>
  );
};

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
    px-3 py-1 rounded-[22px] transition-colors duration-200 text-sm md:text-base 2xl:text-lg
    ${fullWidth ? "w-full" : ""}`}
  >
    {children}
  </button>
);

const LanguageSelector = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ctx = useLanguageOptional();
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

  return (
    <div className="relative">
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
          className="fill-white ml-0.5 sm:ml-1 lg:ml-1 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3 md:h-3 lg:w-4 lg:h-4"
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
          <div className="fixed sm:absolute right-3 sm:right-0 top-14 sm:top-auto sm:mt-2 w-[180px] sm:w-[200px] lg:w-[250px] dark:bg-[var(--card-color)] bg-white dark:border-[#35353E] border-gray-200 rounded-lg shadow-lg z-50 max-w-[calc(100vw-1.5rem)] sm:max-w-none">
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
                    <span className="text-[10px] sm:text-[10px] lg:text-[10px] text-[#1D8751]">✓</span>
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

const ThemeSelector = ({ isTransparentNavbar }: { isTransparentNavbar: boolean }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const selectTheme = (selectedTheme: "light" | "dark" | "deem") => {
    if (selectedTheme === "deem") {
      // Don't update anything for deem yet - just close dropdown
      setDropdownOpen(false);
      return;
    }
    setTheme(selectedTheme);
    setDropdownOpen(false);
  };

  const getThemeIcon = () => {
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
    <div className="relative">
      <div
        className={`flex items-center justify-center cursor-pointer min-h-[44px] sm:min-h-0 lg:min-h-0 px-1 sm:px-0 lg:px-0 ${
          isTransparentNavbar ? "text-white" : "dark:text-white text-gray-900"
        }`}
        onClick={toggleDropdown}
      >
        {getThemeIcon()}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          className={`ml-0.5 sm:ml-1 lg:ml-1 w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3 md:h-3 lg:w-4 lg:h-4 ${
            isTransparentNavbar ? "fill-white" : "fill-current"
          }`}
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
          <div className="fixed sm:absolute right-3 sm:right-0 top-14 sm:top-auto sm:mt-2 w-[180px] sm:w-[200px] lg:w-[250px] dark:bg-[var(--card-color)] bg-white dark:border-[#35353E] border-gray-200 rounded-lg shadow-lg z-50 max-w-[calc(100vw-1.5rem)] sm:max-w-none">
            <button
              className="block w-full text-left px-3 sm:px-4 lg:px-4 py-2.5 sm:py-2 lg:py-2 dark:text-white text-gray-900 dark:hover:bg-[#35353E] hover:bg-gray-100 min-h-[44px] sm:min-h-0 lg:min-h-0 flex items-center transition-colors"
              onClick={() => selectTheme("light")}
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
                  <span className="text-sm sm:text-sm lg:text-sm">Deem</span>
                </div>
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
  const [mobileDepositDropdownOpen, setMobileDepositDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const [cachedProfilePhoto, setCachedProfilePhoto] = useState<string | null>(null);

  const {
    isAuthenticated,
    profile: userProfile,
    user,
  } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const depositDropdownRef = useRef<HTMLDivElement>(null);
  const profileModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  // Load cached profile photo from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("profile_photo");
      if (cached) {
        setCachedProfilePhoto(cached);
      }
    }
  }, []);

  useEffect(() => {
    // ✅ Only fetch profile if we don't have it (prevents refetch on every navigation)
    if (isAuthenticated && !userProfile) {
      dispatch(getUserProfile());
    }
  }, [isAuthenticated, dispatch, userProfile]);

  // Cache profile photo in localStorage when it's available
  useEffect(() => {
    if (userProfile?.photo && typeof window !== "undefined") {
      localStorage.setItem("profile_photo", userProfile.photo);
      setCachedProfilePhoto(userProfile.photo);
    }
  }, [userProfile?.photo]);

  // Reset image error when profile photo changes
  useEffect(() => {
    setProfileImageError(false);
  }, [userProfile?.photo, cachedProfilePhoto]);

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
      // Home page: transparent initially, dark on scroll (original behavior)
      return scrolled
        ? "dark:bg-[var(--bg-color)] bg-white/95 backdrop-blur-sm"
        : "bg-transparent";
    } else if (isAboutPage) {
      // About page: dark green background to match hero section
      return scrolled
        ? "dark:bg-[var(--bg-color)] bg-white/95 backdrop-blur-sm shadow-sm"
        : "bg-[#0E5531] dark:bg-[#0E5531]";
    } else if (isDashboardPage) {
      // Dashboard pages: always have solid background for visibility
      return scrolled
        ? "dark:bg-[var(--bg-color)] bg-white/95 backdrop-blur-sm shadow-sm"
        : "dark:bg-[var(--bg-color)]/80 bg-white/80 backdrop-blur-sm";
    } else {
      // Other pages: smart background based on scroll
      return scrolled
        ? "dark:bg-[var(--bg-color)] bg-white/95 backdrop-blur-sm shadow-sm"
        : "dark:bg-transparent bg-white/80 backdrop-blur-sm";
    }
  };

  // Check if navbar should show white text (transparent on home page or about page when not scrolled)
  const isTransparentNavbar = (pathname === "/" && !scrolled) || (pathname === "/about" && !scrolled);

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

    if ((isHomePage && isNotScrolled) || (isAboutPage && isNotScrolled)) {
      // Home page or About page, not scrolled: white logo for transparent/green background
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

  // Don't render theme-dependent content until mounted
  if (!mounted) {
    return (
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isTransparentNavbar
          ? "bg-transparent"
          : "bg-white dark:bg-gray-900 shadow-lg"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

  const toggleImageModal = () => {
    setShowImagePreview(prev => !prev);
  };

  const closeImageModal = () => {
    setShowImagePreview(false);
  };



  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 md:px-4 md:py-2.5 lg:px-8 lg:py-4 xl:px-12 2xl:px-20 transition-all duration-300 ${getNavbarBackground()}`}
      >
        <div className="flex items-center min-w-0 flex-1">
          <Link href="/" className="mr-4 sm:mr-8 md:mr-6 lg:mr-12 xl:mr-20 flex-shrink-0">
            {/* Optimized logo selection using memoized config */}
            {logoConfig && (
              <Image
                src={logoConfig.src}
                alt={logoConfig.alt}
                width={150}
                height={40}
                className="h-auto w-20 sm:w-28 md:w-32 lg:w-40 2xl:w-48 dark:brightness-0 dark:invert"
                priority
              />
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1 md:space-x-1.5 lg:space-x-4 xl:space-x-5 2xl:space-x-8 flex-shrink-0">
            <NavLink href="/" isTransparent={isTransparentNavbar} pathname={pathname}>
              Home
            </NavLink>
            {isAuthenticated && (
              <NavLink href="/dashboard" isTransparent={isTransparentNavbar} pathname={pathname}>
                Dashboard
              </NavLink>
            )}
            <NavLink href="/market" isTransparent={isTransparentNavbar} pathname={pathname}>
              Market
            </NavLink>
            <NavLink href="/rates" isTransparent={isTransparentNavbar} pathname={pathname}>
              Rates
            </NavLink>
            <NavLink href="/blog" isTransparent={isTransparentNavbar} pathname={pathname}>
              Blog
            </NavLink>
            <NavLink href="/about" isTransparent={isTransparentNavbar} pathname={pathname}>
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

            <NavLink href="/contactUs" isTransparent={isTransparentNavbar} pathname={pathname}>
              <span className="hidden lg:inline">Contact us</span>
              <span className="lg:hidden">Contact</span>
            </NavLink>
          </div>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-1 md:space-x-1.5 lg:space-x-3 xl:space-x-4 2xl:space-x-6 relative flex-shrink-0">
          {isAuthenticated ? (
            <div className="flex items-center space-x-1 md:space-x-1.5 lg:space-x-4">
              <div className="" ref={depositDropdownRef}>
                <button
                  onClick={toggleDepositDropdown}
                  className="flex items-center bg-[#1D8751] hover:bg-[#13B562] text-white px-2 py-1 md:px-3 md:py-1.5 lg:px-5 lg:py-2 xl:px-6 rounded-[10px] transition-colors duration-200 text-xs md:text-xs lg:text-base xl:text-base 2xl:text-lg"
                >
                  <svg
                    className="mr-0.5 md:mr-1 lg:mr-2 w-3 h-3 md:w-3.5 md:h-3.5 lg:w-5 lg:h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                      stroke="#FFB800"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 10l5 5 5-5"
                      stroke="#FFB800"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 15V3"
                      stroke="#FFB800"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Deposit
                </button>

                {/* Deposit Dropdown */}
                {depositDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-md dark:bg-[#1E2329] bg-white dark:border-[#35353E] border-gray-200 border rounded shadow-xl z-[9999]">
                    <div className="p-6">
                      {/* Exchange Option */}
                      <Link
                        href="/dashboard/express-exchange"
                        className="block mb-3"
                        onClick={() => {
                          setDepositDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center rounded-lg transition-colors duration-200 group">
                          <div className="flex items-center justify-center mr-4">
                            <svg
                              width="45"
                              height="40"
                              viewBox="0 0 45 40"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M28 12 L14 12 L18 8"
                                stroke="#F79330"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M17 20 L31 20 L27 24"
                                stroke="#1D8751"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="dark:text-white text-gray-900 font-medium text-base mb-1">
                              Express Exchange
                            </h4>
                            <p className="dark:text-gray-400 text-gray-600 text-sm">
                              Trade cryptocurrencies on the exchange with
                              advanced tools and features for optimal
                              transactions
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 dark:text-gray-400 text-gray-500 group-hover:text-[#1D8751] transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </Link>

                      {/* MoneyX Option */}
                      <Link
                        href="/dashboard/exchange"
                        className="block mb-3"
                        onClick={() => {
                          setDepositDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center transition-colors duration-200 group">
                          <div className="w-10 h-10 flex items-center justify-center mr-4">
                            <svg
                              width="100"
                              height="100"
                              viewBox="0 0 100 100"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <rect
                                x="20"
                                y="25"
                                width="60"
                                height="40"
                                rx="5"
                                fill="none"
                                stroke="#1D8751"
                                strokeWidth="4"
                              />
                              <path
                                d="M30 45 L40 55 L70 25"
                                stroke="#1D8751"
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                              />
                              <circle
                                cx="50"
                                cy="70"
                                r="8"
                                fill="#1D8751"
                              />
                              <path
                                d="M50 65 L50 75 M45 70 L55 70"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="dark:text-white text-gray-900 font-medium text-base mb-1">
                              MoneyX
                            </h4>
                            <p className="dark:text-gray-400 text-gray-600 text-sm">
                              Transfer money between different payment methods
                              quickly and securely
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 dark:text-gray-400 text-gray-500 group-hover:text-[#1D8751] transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </Link>

                      {/* P2P Option */}
                      <Link
                        href="/dashboard/p2p"
                        className="block mb-3"
                        onClick={() => {
                          setDepositDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center rounded-lg transition-colors duration-200 group">
                          <div className="w-10 h-10 flex items-center justify-center mr-4">
                            <svg
                              width="120"
                              height="120"
                              viewBox="0 0 120 120"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle
                                cx="40"
                                cy="30"
                                r="10"
                                stroke="#1C8F4D"
                                strokeWidth="6"
                                fill="none"
                              />
                              <path
                                d="M58 22 A22 22 0 0 1 58 38"
                                fill="none"
                                stroke="#1C8F4D"
                                strokeWidth="6"
                                strokeLinecap="round"
                              />
                              <path
                                d="M20 90 Q20 65 45 65"
                                fill="none"
                                stroke="#1C8F4D"
                                strokeWidth="6"
                                strokeLinecap="round"
                              />
                              <path
                                d="M70 85 A20 20 0 0 1 110 85"
                                fill="none"
                                stroke="#F49A29"
                                strokeWidth="6"
                                strokeLinecap="round"
                              />
                              <path
                                d="M110 85 L104 80 M110 85 L108 77"
                                stroke="#F49A29"
                                strokeWidth="6"
                                strokeLinecap="round"
                              />
                              <path
                                d="M110 85 A20 20 0 0 1 70 85"
                                fill="none"
                                stroke="#F49A29"
                                strokeWidth="6"
                                strokeLinecap="round"
                              />
                              <path
                                d="M70 85 L75 90 M70 85 L67 93"
                                stroke="#F49A29"
                                strokeWidth="6"
                                strokeLinecap="round"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="dark:text-white text-gray-900 font-medium text-base mb-1">
                              P2P
                            </h4>
                            <p className="dark:text-gray-400 text-gray-600 text-sm">
                              Buy and sell cryptocurrencies directly with
                              flexible payment methods
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 dark:text-gray-400 text-gray-500 group-hover:text-[#1D8751] transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </Link>

                      {/* Swap Option */}
                      <Link
                        href="/dashboard/swap"
                        className="block"
                        onClick={() => {
                          setDepositDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center transition-colors duration-200 group">
                          <div className="w-10 h-10 flex items-center justify-center mr-4">
                            <svg
                              width="100"
                              height="100"
                              viewBox="0 0 100 100"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M30 70H20V30H60V40"
                                fill="none"
                                stroke="#1C8F4D"
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <polygon
                                points="30,60 20,70 30,80"
                                fill="#1D8751"
                              />
                              <path
                                d="M70 30H80V70H40V60"
                                fill="none"
                                stroke="#F49A29"
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <polygon
                                points="70,40 80,30 70,20"
                                fill="#F79330"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="dark:text-white text-gray-900 font-medium text-base mb-1">
                              Swap
                            </h4>
                            <p className="dark:text-gray-400 text-gray-600 text-sm">
                              Exchange one cryptocurrency for another instantly
                              and securely within your wallet
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 dark:text-gray-400 text-gray-500 group-hover:text-[#1D8751] transition-colors"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative flex-shrink-0" ref={profileModalRef}>
                <button
                  onClick={toggleProfileModal}
                  className="text-white focus:outline-none relative"
                >
                  {(userProfile?.photo || cachedProfilePhoto) && !profileImageError ? (
                    <img
                      src={userProfile?.photo || cachedProfilePhoto || ""}
                      alt="Profile"
                      className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full object-cover"
                      onError={() => {
                        setProfileImageError(true);
                        if (typeof window !== "undefined") {
                          localStorage.removeItem("profile_photo");
                          setCachedProfilePhoto(null);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center bg-[#1D8751] border-2 border-white">
                      <User className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                  )}
                  {/* Verification Badge - positioned on top of profile image */}
                  <span className="absolute -top-0.5 -right-0.5 md:-top-0.5 md:-right-0.5 lg:-top-1 lg:-right-1 inline-flex items-center justify-center w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5 z-10">
                    <svg width="20" height="20" viewBox="0 0 20 20" className="absolute w-4 h-4 md:w-4 md:h-4 lg:w-5 lg:h-5">
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
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 w-2 h-2 md:w-2.5 md:h-2.5 lg:w-2.5 lg:h-2.5">
                      <path
                        d="M2 5L4 7L8 3"
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>

                {/* Profile Modal */}
                {profileModalOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 dark:bg-[var(--card-color)] bg-white border dark:border-[#35353E] border-gray-200 rounded-lg shadow-xl z-[9999]">
                    <div className="p-4">
                      {/* User Info */}
                      <div className="flex items-center mb-4 pb-4 border-b dark:border-[#35353E] border-gray-200">
                        <div className="mr-3 relative">
                          <button className="relative" onClick={toggleImageModal}>
                            {(userProfile?.photo || cachedProfilePhoto) && !profileImageError ? (
                              <>
                                <img
                                  src={userProfile?.photo || cachedProfilePhoto || ""}
                                  alt="Profile"
                                  className="w-12 h-12 rounded-full object-cover"
                                  onError={() => {
                                    setProfileImageError(true);
                                    // Clear invalid cached photo
                                    if (typeof window !== "undefined") {
                                      localStorage.removeItem("profile_photo");
                                      setCachedProfilePhoto(null);
                                    }
                                  }}
                                />
                                {/* Verification Badge */}
                                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 z-10">
                                  <svg width="20" height="20" viewBox="0 0 20 20" className="absolute">
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
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                                    <path
                                      d="M2 5L4 7L8 3"
                                      stroke="#FFFFFF"
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </span>
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
                          href="/dashboard/account"
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

          <div className="flex items-center space-x-1 sm:space-x-1.5 md:space-x-1.5 lg:space-x-3 xl:space-x-4 2xl:space-x-6">
            <LanguageSelector />
            <ThemeSelector isTransparentNavbar={isTransparentNavbar} />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`md:hidden p-1.5 sm:p-2 rounded-md focus:outline-none ${
            isTransparentNavbar
              ? "text-white" // White when navbar is transparent
              : "dark:text-white text-gray-900" // Theme-based when navbar has background
          }`}
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? (
            <X size={20} className="sm:w-6 sm:h-6" />
          ) : (
            <Menu size={20} className="sm:w-6 sm:h-6" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={toggleMobileMenu}
          />
          <div
            className={`fixed top-14 sm:top-16 left-0 right-0 z-50 md:hidden p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-lg transition-all duration-300 dark:bg-[var(--bg-color)] bg-white max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto`}
          >
            <MobileNavLink href="/" onClick={toggleMobileMenu} pathname={pathname}>
              Home
            </MobileNavLink>
            {isAuthenticated && (
              <MobileNavLink href="/dashboard" onClick={toggleMobileMenu} pathname={pathname}>
                Dashboard
              </MobileNavLink>
            )}
            <MobileNavLink href="/market" onClick={toggleMobileMenu} pathname={pathname}>
              Market
            </MobileNavLink>
            <MobileNavLink href="/rates" onClick={toggleMobileMenu} pathname={pathname}>
              Rates
            </MobileNavLink>
            <MobileNavLink href="/blog" onClick={toggleMobileMenu} pathname={pathname}>
              Blog
            </MobileNavLink>
            <MobileNavLink href="/about" onClick={toggleMobileMenu} pathname={pathname}>
              About Us
            </MobileNavLink>
            <MobileNavLink href="/contactUs" onClick={toggleMobileMenu} pathname={pathname}>
              Contact us
            </MobileNavLink>

            <div className="flex flex-col space-y-4 pt-4">
              {isAuthenticated ? (
                <>
                  <div className="relative">
                    <button
                      onClick={toggleMobileDepositDropdown}
                      className="flex items-center justify-center w-full bg-[#1D8751] hover:bg-[#13B562] text-white px-6 py-2 rounded-full transition-colors duration-200 text-base min-h-[44px]"
                    >
                      <svg
                        className="mr-2"
                        width="20"
                        height="20"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                          stroke="#FFB800"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M7 10l5 5 5-5"
                          stroke="#FFB800"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M12 15V3"
                          stroke="#FFB800"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Deposit
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
                        <div className="fixed inset-x-4 top-20 sm:top-24 z-[70] md:hidden dark:bg-[var(--card-color)] bg-white dark:border-[#35353E] border-gray-200 rounded-xl shadow-xl overflow-hidden">
                          <div className="p-4 sm:p-6">
                            {/* Exchange Option */}
                            <Link
                              href="/dashboard/express-exchange"
                              className="block mb-4 last:mb-0"
                              onClick={() => {
                                setMobileDepositDropdownOpen(false);
                                toggleMobileMenu();
                              }}
                            >
                              <div className="flex items-center rounded-lg transition-colors duration-200 group dark:hover:bg-[#35353E] hover:bg-gray-100 p-3">
                                <div className="flex items-center justify-center mr-4 flex-shrink-0">
                                  <svg
                                    width="45"
                                    height="40"
                                    viewBox="0 0 45 40"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M28 12 L14 12 L18 8"
                                      stroke="#F79330"
                                      strokeWidth="4"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M17 20 L31 20 L27 24"
                                      stroke="#1D8751"
                                      strokeWidth="4"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="dark:text-white text-gray-900 font-medium text-base mb-1">
                                    Exchange
                                  </h4>
                                  <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">
                                    Trade cryptocurrencies on the exchange with
                                    advanced tools and features for optimal
                                    transactions
                                  </p>
                                </div>
                                <svg
                                  className="w-5 h-5 dark:text-gray-400 text-gray-500 group-hover:text-[#1D8751] transition-colors flex-shrink-0 ml-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </div>
                            </Link>

                            {/* P2P Option */}
                            <Link
                              href="/dashboard/p2p"
                              className="block mb-4 last:mb-0"
                              onClick={() => {
                                setMobileDepositDropdownOpen(false);
                                toggleMobileMenu();
                              }}
                            >
                              <div className="flex items-center rounded-lg transition-colors duration-200 group dark:hover:bg-[#35353E] hover:bg-gray-100 p-3">
                                <div className="w-10 h-10 flex items-center justify-center mr-4 flex-shrink-0">
                                  <svg
                                    width="120"
                                    height="120"
                                    viewBox="0 0 120 120"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <circle
                                      cx="40"
                                      cy="30"
                                      r="10"
                                      stroke="#1C8F4D"
                                      strokeWidth="6"
                                      fill="none"
                                    />
                                    <path
                                      d="M58 22 A22 22 0 0 1 58 38"
                                      fill="none"
                                      stroke="#1C8F4D"
                                      strokeWidth="6"
                                      strokeLinecap="round"
                                    />
                                    <path
                                      d="M20 90 Q20 65 45 65"
                                      fill="none"
                                      stroke="#1C8F4D"
                                      strokeWidth="6"
                                      strokeLinecap="round"
                                    />
                                    <path
                                      d="M70 85 A20 20 0 0 1 110 85"
                                      fill="none"
                                      stroke="#F49A29"
                                      strokeWidth="6"
                                      strokeLinecap="round"
                                    />
                                    <path
                                      d="M110 85 L104 80 M110 85 L108 77"
                                      stroke="#F49A29"
                                      strokeWidth="6"
                                      strokeLinecap="round"
                                    />
                                    <path
                                      d="M110 85 A20 20 0 0 1 70 85"
                                      fill="none"
                                      stroke="#F49A29"
                                      strokeWidth="6"
                                      strokeLinecap="round"
                                    />
                                    <path
                                      d="M70 85 L75 90 M70 85 L67 93"
                                      stroke="#F49A29"
                                      strokeWidth="6"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="dark:text-white text-gray-900 font-medium text-base mb-1">
                                    P2P
                                  </h4>
                                  <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">
                                    Buy and sell cryptocurrencies directly with
                                    flexible payment methods
                                  </p>
                                </div>
                                <svg
                                  className="w-5 h-5 dark:text-gray-400 text-gray-500 group-hover:text-[#1D8751] transition-colors flex-shrink-0 ml-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </div>
                            </Link>

                            {/* Swap Option */}
                            <Link
                              href="/dashboard/swap"
                              className="block mb-4 last:mb-0"
                              onClick={() => {
                                setMobileDepositDropdownOpen(false);
                                toggleMobileMenu();
                              }}
                            >
                              <div className="flex items-center rounded-lg transition-colors duration-200 group dark:hover:bg-[#35353E] hover:bg-gray-100 p-3">
                                <div className="w-10 h-10 flex items-center justify-center mr-4 flex-shrink-0">
                                  <svg
                                    width="100"
                                    height="100"
                                    viewBox="0 0 100 100"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M30 70H20V30H60V40"
                                      fill="none"
                                      stroke="#1C8F4D"
                                      strokeWidth="5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <polygon
                                      points="30,60 20,70 30,80"
                                      fill="#1D8751"
                                    />
                                    <path
                                      d="M70 30H80V70H40V60"
                                      fill="none"
                                      stroke="#F49A29"
                                      strokeWidth="5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <polygon
                                      points="70,40 80,30 70,20"
                                      fill="#F79330"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="dark:text-white text-gray-900 font-medium text-base mb-1">
                                    Swap
                                  </h4>
                                  <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">
                                    Exchange one cryptocurrency for another instantly
                                    and securely within your wallet
                                  </p>
                                </div>
                                <svg
                                  className="w-5 h-5 dark:text-gray-400 text-gray-500 group-hover:text-[#1D8751] transition-colors flex-shrink-0 ml-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </div>
                            </Link>

                            {/* MoneyX Option */}
                            <Link
                              href="/dashboard/exchange"
                              className="block mb-4 last:mb-0"
                              onClick={() => {
                                setMobileDepositDropdownOpen(false);
                                toggleMobileMenu();
                              }}
                            >
                              <div className="flex items-center rounded-lg transition-colors duration-200 group dark:hover:bg-[#35353E] hover:bg-gray-100 p-3">
                                <div className="w-10 h-10 flex items-center justify-center mr-4 flex-shrink-0">
                                  <svg
                                    width="100"
                                    height="100"
                                    viewBox="0 0 100 100"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <rect
                                      x="20"
                                      y="25"
                                      width="60"
                                      height="40"
                                      rx="5"
                                      fill="none"
                                      stroke="#1D8751"
                                      strokeWidth="4"
                                    />
                                    <path
                                      d="M30 45 L40 55 L70 25"
                                      stroke="#1D8751"
                                      strokeWidth="4"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      fill="none"
                                    />
                                    <circle
                                      cx="50"
                                      cy="70"
                                      r="8"
                                      fill="#1D8751"
                                    />
                                    <path
                                      d="M50 65 L50 75 M45 70 L55 70"
                                      stroke="white"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="dark:text-white text-gray-900 font-medium text-base mb-1">
                                    MoneyX
                                  </h4>
                                  <p className="dark:text-gray-400 text-gray-600 text-sm leading-relaxed">
                                    Transfer money between different payment methods
                                    quickly and securely
                                  </p>
                                </div>
                                <svg
                                  className="w-5 h-5 dark:text-gray-400 text-gray-500 group-hover:text-[#1D8751] transition-colors flex-shrink-0 ml-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </div>
                            </Link>
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
                    <div className="flex items-center space-x-3 justify-between w-full">
                      <div>
                        <Link
                          href="/dashboard/account"
                          onClick={toggleMobileMenu}
                          className="text-white relative inline-block"
                        >
                          {(userProfile?.photo || cachedProfilePhoto) && !profileImageError ? (
                            <>
                              <img
                                src={userProfile?.photo || cachedProfilePhoto || ""}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover"
                                onError={() => {
                                  setProfileImageError(true);
                                  // Clear invalid cached photo
                                  if (typeof window !== "undefined") {
                                    localStorage.removeItem("profile_photo");
                                    setCachedProfilePhoto(null);
                                  }
                                }}
                              />
                              {/* Verification Badge */}
                              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 z-10">
                                <svg width="20" height="20" viewBox="0 0 20 20" className="absolute">
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
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                                  <path
                                    d="M2 5L4 7L8 3"
                                    stroke="#FFFFFF"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </span>
                            </>
                          ) : (
                            <DefaultProfileIcon />
                          )}
                        </Link>
                      </div>
                      <div className="text-left">
                        <h4 className="text-white font-medium text-sm">
                          {user?.first_name && user?.last_name
                            ? `${user.first_name} ${user.last_name}`
                            : user?.email}
                        </h4>
                        <p className="text-gray-400 text-xs">{user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Profile Modal */}
                  {profileModalOpen && (
                    <div className="fixed inset-0 z-[9999] md:hidden">
                      <div
                        className="absolute inset-0 bg-black bg-opacity-50"
                        onClick={() => setProfileModalOpen(false)}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-[#1E2329] border-t border-[#35353E] rounded-t-lg">
                        <div className="p-6">
                          {/* User Info */}
                          <div className="flex items-center mb-6">
                            <div className="mr-4 relative">
                              {(userProfile?.photo || cachedProfilePhoto) && !profileImageError ? (
                                <>
                                  <img
                                    src={userProfile?.photo || cachedProfilePhoto || ""}
                                    alt="Profile"
                                    className="w-16 h-16 rounded-full object-cover border-2 border-white"
                                    onError={() => {
                                      setProfileImageError(true);
                                      // Clear invalid cached photo
                                      if (typeof window !== "undefined") {
                                        localStorage.removeItem("profile_photo");
                                        setCachedProfilePhoto(null);
                                      }
                                    }}
                                  />
                                  {/* Verification Badge */}
                                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-6 h-6 z-10">
                                    <svg width="24" height="24" viewBox="0 0 24 24" className="absolute">
                                      <circle cx="12" cy="12" r="11" fill="white" />
                                      <circle cx="12" cy="12" r="9" fill="#1D8751" />
                                      {/* Serrated edge using small circles */}
                                      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => {
                                        const rad = (angle * Math.PI) / 180;
                                        const x = 12 + 10 * Math.cos(rad);
                                        const y = 12 + 10 * Math.sin(rad);
                                        return <circle key={angle} cx={x} cy={y} r="1.2" fill="white" />;
                                      })}
                                    </svg>
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                                      <path
                                        d="M2.5 6L5 8.5L9.5 4"
                                        stroke="#FFFFFF"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </svg>
                                  </span>
                                </>
                              ) : (
                                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-[#1D8751] border-2 border-white">
                                  <User className="w-8 h-8 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="text-white font-medium text-lg">
                                {user?.first_name} {user?.last_name}
                              </h4>
                              <p className="text-gray-400 text-sm">
                                {user?.email}
                              </p>
                            </div>
                          </div>

                          {/* Menu Items */}
                          <div className="space-y-4">
                            <Link
                              href="/dashboard/account"
                              className="flex items-center w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-[#35353E] rounded-lg transition-colors duration-200"
                              onClick={() => setProfileModalOpen(false)}
                            >
                              <User size={20} className="mr-4" />
                              <span className="text-base">Account</span>
                            </Link>

                            <Link
                              href="/dashboard/settings"
                              className="flex items-center w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-[#35353E] rounded-lg transition-colors duration-200"
                              onClick={() => setProfileModalOpen(false)}
                            >
                              <Settings size={20} className="mr-4" />
                              <span className="text-base">Settings</span>
                            </Link>

                            <button
                              onClick={handleLogout}
                              className="flex items-center w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-[#35353E] rounded-lg transition-colors duration-200"
                            >
                              <LogOut size={20} className="mr-4" />
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
              <LanguageSelector />
              <ThemeSelector isTransparentNavbar={isTransparentNavbar} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
