"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const DefaultProfileIcon = () => (
  <div
    className="w-10 h-10 rounded-full flex items-center justify-center bg-[#e5e7eb] border-2 border-white"
    dangerouslySetInnerHTML={{
      __html: `
        <svg width="40" height="40" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="100" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="2"/>
          <g fill="#9ca3af">
            <circle cx="100" cy="75" r="25"/>
            <path d="M100 110 C85 110, 60 120, 60 140 L60 160 C60 170, 65 175, 75 175 L125 175 C135 175, 140 170, 140 160 L140 140 C140 120, 115 110, 100 110 Z"/>
          </g>
        </svg>
      `,
    }}
  />
);

const NavLink = ({
  href,
  children,
  isTransparent = false,
}: {
  href: string;
  children: React.ReactNode;
  isTransparent?: boolean;
}) => (
  <Link
    href={href}
    className={`${
      isTransparent
        ? "text-white" // Always white when navbar is transparent
        : "dark:text-white text-gray-900" // Theme-based when navbar has background
    } hover:text-[#1D8751] transition-colors duration-200 text-sm lg:text-base 2xl:text-lg`}
  >
    {children}
  </Link>
);

const MobileNavLink = ({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <Link
    href={href}
    className="block dark:text-white text-gray-900 hover:text-[#1D8751] py-2 transition-colors duration-200 text-lg"
    onClick={onClick}
  >
    {children}
  </Link>
);

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
    className={`${
      variant === "primary"
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
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const selectLanguage = (language: string) => {
    setSelectedLanguage(language);
    setDropdownOpen(false);
  };

  return (
    <div className="relative ">
      <div
        className="flex items-center justify-center cursor-pointer"
        onClick={toggleDropdown}
      >
        <Image
          src={
            selectedLanguage === "English"
              ? "https://res.cloudinary.com/dam1sxczj/image/upload/v1746538734/united_kingdom_zud79x.png"
              : "https://res.cloudinary.com/dam1sxczj/image/upload/v1747216099/somali_jq5e97.png"
          }
          alt={selectedLanguage}
          width={32}
          height={32}
          className="rounded-full"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          className="fill-white"
          viewBox="0 0 16 16"
        >
          <path d="M1.5 6.5l6 6 6-6h-12z" />
        </svg>
      </div>
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-[300px] bg-[#18181D] border border-[#35353E] rounded-lg shadow-lg z-50">
          <button
            className="block w-full text-left px-4 py-2 text-white hover:bg-[#35353E]"
            onClick={() => selectLanguage("English")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746538734/united_kingdom_zud79x.png"
                  alt="English"
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <span className="text-sm">English</span>
              </div>
              {selectedLanguage === "English" && (
                <div className="w-4 h-4 rounded-full flex items-center justify-center">
                  <Check size={16} className="text-[#1D8751]" />
                </div>
              )}
            </div>
          </button>
          <button
            className="block w-full text-left px-4 py-2 text-white hover:bg-[#35353E]"
            onClick={() => selectLanguage("Somali")}
          >
            <div className="flex items-center justify-between gap-8">
              <div className="flex items-center space-x-2">
                <Image
                  src="https://res.cloudinary.com/dam1sxczj/image/upload/v1747216099/somali_jq5e97.png"
                  alt="Somali"
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <span className="text-sm">Somali</span>
              </div>
              {selectedLanguage === "Somali" && (
                <div className="w-4 h-4 rounded-full flex items-center justify-center">
                  <span className="text-[10px] text-[#1D8751]">✓</span>
                </div>
              )}
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [depositDropdownOpen, setDepositDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

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

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getUserProfile());
    }
  }, [isAuthenticated, dispatch]);

  console.log("profile", userProfile);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleDepositDropdown = () => {
    setDepositDropdownOpen(!depositDropdownOpen);
  };

  const toggleProfileModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setProfileModalOpen(!profileModalOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    setProfileModalOpen(false);
    router.push("/auth/login");
  };

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

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Clean up the event listener on component unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Smart navbar background logic based on page and scroll state
  const getNavbarBackground = () => {
    const isHomePage = pathname === "/";
    const isDashboardPage = pathname?.startsWith("/dashboard") || false;

    if (isHomePage) {
      // Home page: transparent initially, dark on scroll (original behavior)
      return scrolled
        ? "dark:bg-[#1D1D23] bg-white/95 backdrop-blur-sm"
        : "bg-transparent";
    } else if (isDashboardPage) {
      // Dashboard pages: always have solid background for visibility
      return scrolled
        ? "dark:bg-[#1D1D23] bg-white/95 backdrop-blur-sm shadow-sm"
        : "dark:bg-[#1D1D23]/80 bg-white/80 backdrop-blur-sm";
    } else {
      // Other pages: smart background based on scroll
      return scrolled
        ? "dark:bg-[#1D1D23] bg-white/95 backdrop-blur-sm shadow-sm"
        : "dark:bg-transparent bg-white/80 backdrop-blur-sm";
    }
  };

  // Check if navbar should show white text (transparent on home page)
  const isTransparentNavbar = pathname === "/" && !scrolled;
  const [theme, setTheme] = useState<{ mode: string } | null>({ mode: "dark" }); // Default to dark theme
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const getTheme = () => {
      try {
        const themeString = localStorage.getItem("theme");
        if (!themeString) return null;

        // Try to parse as JSON first (Redux format)
        try {
          const parsed = JSON.parse(themeString);
          if (parsed && typeof parsed === "object" && parsed.mode) {
            return parsed;
          }
        } catch (e) {
          // If JSON parse fails, treat as simple string (Context format)
          if (themeString === "light" || themeString === "dark") {
            return { mode: themeString };
          }
        }

        return null;
      } catch (error) {
        console.error("Error parsing theme from localStorage:", error);
        return null;
      }
    };

    // Set initial theme only after mounting
    setTheme(getTheme());

    // Listen for theme changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "theme") {
        setTheme(getTheme());
      }
    };

    // Listen for custom theme change events
    const handleThemeChange = () => {
      setTheme(getTheme());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("themeChange", handleThemeChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("themeChange", handleThemeChange);
    };
  }, []);

  console.log("theme", theme?.mode);
  
  // Don't render theme-dependent content until mounted
  if (!mounted) {
    return (
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isTransparentNavbar
          ? "bg-transparent"
          : "bg-white dark:bg-gray-900 shadow-lg"
      }`}>
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
  
  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 sm:px-6 md:px-12 2xl:px-20 transition-all duration-300 ${getNavbarBackground()}`}
      >
        <div className="flex items-center">
          <Link href="/" className="mr-4 md:mr-10">
            {/* Smart logo selection based on page, scroll state, and theme */}
            {pathname === "/" && !scrolled ? (
              // Home page, not scrolled: white logo for transparent background
              <Image
                src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746538269/Frame_q3pwt7.png"
                alt="OMAYA Exchange"
                width={150}
                height={40}
                className="h-auto w-32 md:w-40 2xl:w-48"
                priority
              />
            ) : // All other cases: green logo
            theme?.mode === "dark" ? (
              <Image
                src="https://res.cloudinary.com/dam1sxczj/image/upload/v1747133499/Omaya_green-logo_yva2ah.png"
                alt="OMAYA Exchange"
                width={150}
                height={40}
                className="h-auto w-32 md:w-40 2xl:w-48"
                priority
              />
            ) : (
              <Image
                src="https://res.cloudinary.com/pitz/image/upload/v1750838143/1446599b0a50473eb54aaee7c59988ecc0856b10_mmmmcl.png"
                alt="OMAYA Exchange"
                width={150}
                height={40}
                className="h-auto w-32 md:w-40 2xl:w-48"
                priority
              />
            )}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6 lg:space-x-8 2xl:space-x-12">
            <NavLink href="/" isTransparent={isTransparentNavbar}>
              Home
            </NavLink>
            <NavLink href="/dashboard" isTransparent={isTransparentNavbar}>
              Dashboard
            </NavLink>
            <NavLink href="/market" isTransparent={isTransparentNavbar}>
              Market
            </NavLink>
            <NavLink href="/rates" isTransparent={isTransparentNavbar}>
              Rates
            </NavLink>
            <NavLink href="/blog" isTransparent={isTransparentNavbar}>
              Blog
            </NavLink>
            {/* Show Contact us only on auth pages */}
            {/* {(pathname?.startsWith("/auth/login") || 
              pathname?.startsWith("/auth/register") || 
              pathname?.startsWith("/auth/forgotPassword") ||
              pathname?.startsWith("/auth/resetPassword")) && (
              <NavLink href="#" isTransparent={isTransparentNavbar}>
                Contact us
              </NavLink>
            )} */}

            <NavLink href="/contactUs" isTransparent={isTransparentNavbar}>
              Contact us
            </NavLink>
          </div>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4 2xl:space-x-6 relative">
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <div className="" ref={depositDropdownRef}>
                <button
                  onClick={toggleDepositDropdown}
                  className="flex items-center bg-[#1D8751] hover:bg-[#13B562] text-white px-6 py-2 rounded-[10px] transition-colors duration-200 text-sm md:text-base 2xl:text-lg"
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
                              Exchange
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

              <div className="relative" ref={profileModalRef}>
                <button
                  onClick={toggleProfileModal}
                  className="text-white focus:outline-none"
                >
                  {userProfile?.photo ? (
                    <img
                      src={userProfile.photo}
                      alt="Profile"
                      className="w-10 h-10 rounded-full border-2 border-white object-cover"
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
                </span>

                {/* Profile Modal */}
                {profileModalOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 dark:bg-[#1E2329] bg-white border dark:border-[#35353E] border-gray-200 rounded-lg shadow-xl z-[9999]">
                    <div className="p-4">
                      {/* User Info */}
                      <div className="flex items-center mb-4 pb-4 border-b dark:border-[#35353E] border-gray-200">
                        <div className="mr-3">
                          {userProfile?.photo ? (
                            <img
                              src={userProfile.photo}
                              alt="Profile"
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <DefaultProfileIcon />
                          )}
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
                          <User size={16} className="mr-3" />
                          <span className="text-sm">Account</span>
                        </Link>

                        <Link
                          href="/dashboard/settings"
                          className="flex items-center w-full px-3 py-2 dark:text-gray-300 text-gray-700 dark:hover:text-white hover:text-gray-900 dark:hover:bg-[#35353E] hover:bg-gray-100 rounded-md transition-colors duration-200"
                          onClick={() => setProfileModalOpen(false)}
                        >
                          <Settings size={16} className="mr-3" />
                          <span className="text-sm">Settings</span>
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

          <div className="flex items-center space-x-4 2xl:space-x-6">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={`md:hidden p-2 rounded-md focus:outline-none ${
            isTransparentNavbar
              ? "text-white" // White when navbar is transparent
              : "dark:text-white text-gray-900" // Theme-based when navbar has background
          }`}
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className={`fixed top-16 left-0 right-0 z-40 md:hidden p-6 space-y-6 shadow-lg transition-all duration-300 dark:bg-[#1D1D23] bg-white`}
        >
          <MobileNavLink href="/" onClick={toggleMobileMenu}>
            Home
          </MobileNavLink>
          <MobileNavLink href="/dashboard" onClick={toggleMobileMenu}>
            Dashboard
          </MobileNavLink>
          <MobileNavLink href="/market" onClick={toggleMobileMenu}>
            Market
          </MobileNavLink>
          <MobileNavLink href="/rates" onClick={toggleMobileMenu}>
            Rates
          </MobileNavLink>
          <MobileNavLink href="/blog" onClick={toggleMobileMenu}>
            Blog
          </MobileNavLink>
          {/* Show Contact us only on auth pages */}
          {(pathname?.startsWith("/auth/login") ||
            pathname?.startsWith("/auth/register") ||
            pathname?.startsWith("/auth/forgotPassword") ||
            pathname?.startsWith("/auth/resetPassword")) && (
            <MobileNavLink href="#" onClick={toggleMobileMenu}>
              Contact us
            </MobileNavLink>
          )}

          <div className="flex flex-col space-y-4 pt-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard/deposit" onClick={toggleMobileMenu}>
                  <button className="flex items-center w-full bg-[#1D8751] hover:bg-[#13B562] text-white px-6 py-2 rounded-full transition-colors duration-200 text-base">
                    <img
                      src="https://res.cloudinary.com/dam1sxczj/image/upload/v1748294216/deposit-new-f_okzshs.png"
                      alt=""
                    />
                    Deposit
                  </button>
                </Link>
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
                        className="text-white"
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
                          <div className="mr-4">
                            {userProfile?.photo ? (
                              <img
                                src={userProfile.photo}
                                alt="Profile"
                                className="w-16 h-16 rounded-full object-cover"
                              />
                            ) : (
                              <DefaultProfileIcon />
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
                <AuthButton variant="primary" fullWidth>
                  Register
                </AuthButton>
                <AuthButton variant="secondary" fullWidth>
                  Log In
                </AuthButton>
              </>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
      )}
    </>
  );
}