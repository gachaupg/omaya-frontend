"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Moon, Sun, Menu, X, Check } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/features/auth/store";
import {
  initializeAuth,
  getUserProfile,
  logout,
} from "@/features/auth/slices/authSlice";

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

export default function Navbar() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [depositDropdownOpen, setDepositDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const {
    isAuthenticated,
    profile: userProfile,
    user,
  } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch<AppDispatch>();
  const depositDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getUserProfile());
    }
  }, [isAuthenticated, dispatch]);

  console.log("profile", userProfile);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleDepositDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDepositDropdownOpen(!depositDropdownOpen);
  };

  const toggleProfileDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    setProfileDropdownOpen(!profileDropdownOpen);
  };

  //Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        depositDropdownRef.current &&
        !depositDropdownRef.current.contains(event.target as Node)
      ) {
        setDepositDropdownOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
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

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 sm:px-6 md:px-12 2xl:px-20 transition-all duration-300 ${
          scrolled ? "bg-[#1D1D23]" : "bg-transparent"
        }`}
      >
        <div className="flex items-center">
          <Link href="/" className="mr-4 md:mr-10">
            {scrolled ? (
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
                src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746538269/Frame_q3pwt7.png"
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
            <NavLink href="/">Home</NavLink>
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/market">Market</NavLink>
            <NavLink href="/rates">Rates</NavLink>
            <NavLink href="/blog">Blog</NavLink>
          </div>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4 2xl:space-x-6 relative">
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <div className="" ref={depositDropdownRef}>
                <button
                  onClick={toggleDepositDropdown}
                  className="flex items-center bg-[#1D8751] hover:bg-[#13B562] text-white px-6 py-2 rounded-full transition-colors duration-200 text-sm md:text-base 2xl:text-lg"
                >
                  <svg
                    className="mr-2"
                    width="20"
                    height="20"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M12 3v14m0 0l-5-5m5 5l5-5"
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
                  <div className="absolute top-full right-0 mt-2 w-md bg-[#1E2329] border border-[#35353E] rounded shadow-xl z-[9999]">
                    <div className="p-6">
                      {/* Exchange Option */}
                      <Link
                        href="/dashboard/exchange"
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
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                              <path
                                d="M17 20 L31 20 L27 24"
                                stroke="#1D8751"
                                strokeWidth="4"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-base mb-1">
                              Exchange
                            </h4>
                            <p className="text-gray-400 text-sm">
                              Trade cryptocurrencies on the exchange with
                              advanced tools and features for optimal
                              transactions
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover:text-[#1D8751] transition-colors"
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
                                stroke-linecap="round"
                              />
                              <path
                                d="M20 90 Q20 65 45 65"
                                fill="none"
                                stroke="#1C8F4D"
                                strokeWidth="6"
                                stroke-linecap="round"
                              />
                              <path
                                d="M70 85 A20 20 0 0 1 110 85"
                                fill="none"
                                stroke="#F49A29"
                                strokeWidth="6"
                                stroke-linecap="round"
                              />
                              <path
                                d="M110 85 L104 80 M110 85 L108 77"
                                stroke="#F49A29"
                                strokeWidth="6"
                                stroke-linecap="round"
                              />
                              <path
                                d="M110 85 A20 20 0 0 1 70 85"
                                fill="none"
                                stroke="#F49A29"
                                strokeWidth="6"
                                stroke-linecap="round"
                              />
                              <path
                                d="M70 85 L75 90 M70 85 L67 93"
                                stroke="#F49A29"
                                strokeWidth="6"
                                stroke-linecap="round"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-base mb-1">
                              P2P
                            </h4>
                            <p className="text-gray-400 text-sm">
                              Buy and sell cryptocurrencies directly with
                              flexible payment methods
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover:text-[#1D8751] transition-colors"
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
                                stroke-linecap="round"
                                stroke-linejoin="round"
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
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              />
                              <polygon
                                points="70,40 80,30 70,20"
                                fill="#F79330"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-base mb-1">
                              Swap
                            </h4>
                            <p className="text-gray-400 text-sm">
                              Exchange one cryptocurrency for another instantly
                              and securely within your wallet
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover:text-[#1D8751] transition-colors"
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

                      {/* Buy Option */}
                      <Link
                        href="/dashboard/buy"
                        className="block"
                        onClick={() => {
                          setDepositDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center transition-colors duration-200 group">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center mr-4">
                            <svg
                              width="50"
                              height="50"
                              viewBox="0 0 50 50"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <rect
                                x="8"
                                y="15"
                                width="34"
                                height="20"
                                rx="4"
                                ry="4"
                                stroke="#1C8F4D"
                                strokeWidth="3"
                                fill="none"
                              />
                              <rect
                                x="16"
                                y="24"
                                width="8"
                                height="4"
                                fill="#F49A29"
                                rx="1"
                                ry="1"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-medium text-base mb-1">
                              Buy
                            </h4>
                            <p className="text-gray-400 text-sm">
                              Buy crypto directly with cash, hassle-free and
                              suggested for new users
                            </p>
                          </div>
                          <svg
                            className="w-5 h-5 text-gray-400 group-hover:text-[#1D8751] transition-colors"
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

              <div className="relative" ref={profileDropdownRef}>
                <button
                  onClick={toggleProfileDropdown}
                  className="text-white focus:outline-none"
                >
                  {userProfile?.photo ? (
                    <img
                      src={userProfile.photo}
                      alt="Profile"
                      className="w-10 h-10 rounded-full border-2 border-white object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="cursor-pointer hover:opacity-80 transition-opacity">
                      <DefaultProfileIcon />
                    </div>
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

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-[#1E2329] border border-[#35353E] rounded-lg shadow-xl z-[9999] py-2">
                    <div className="px-4 py-3 border-b border-[#35353E]">
                      <p className="text-white font-medium text-sm">
                        {user?.first_name
                          ? `${user.first_name} ${user.last_name || ""}`
                          : "User"}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {user?.email || "user@example.com"}
                      </p>
                    </div>

                    <Link
                      href="/dashboard/account"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#35353E] hover:text-white transition-colors"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Account
                      </div>
                    </Link>

                    <Link
                      href="/dashboard/settings"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#35353E] hover:text-white transition-colors"
                      onClick={() => setProfileDropdownOpen(false)}
                    >
                      <div className="flex items-center">
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        Settings
                      </div>
                    </Link>

                    <div className="border-t border-[#35353E] mt-2 pt-2">
                      <button
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#35353E] hover:text-red-300 transition-colors"
                        onClick={() => {
                          dispatch(logout());
                          router.push("/auth/login");
                          setProfileDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Log Out
                        </div>
                      </button>
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
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2 rounded-md focus:outline-none"
          onClick={toggleMobileMenu}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className={`fixed top-16 left-0 right-0 z-40 md:hidden p-6 space-y-6 shadow-lg transition-all duration-300 bg-[#1D1D23]`}
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
                  <button
                    onClick={toggleProfileDropdown}
                    className="text-white focus:outline-none"
                  >
                    {userProfile?.photo ? (
                      <img
                        src={userProfile.photo}
                        alt="Profile"
                        className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      />
                    ) : (
                      <div className="cursor-pointer hover:opacity-80 transition-opacity">
                        <DefaultProfileIcon />
                      </div>
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

                  {/* Mobile Profile Dropdown */}
                  {profileDropdownOpen && (
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-[#1E2329] border border-[#35353E] rounded-lg shadow-xl z-[9999] py-2">
                      <div className="px-4 py-3 border-b border-[#35353E]">
                        <p className="text-white font-medium text-sm text-center">
                          {user?.first_name
                            ? `${user.first_name} ${user.last_name || ""}`
                            : "User"}
                        </p>
                        <p className="text-gray-400 text-xs text-center">
                          {user?.email || "user@example.com"}
                        </p>
                      </div>

                      <Link
                        href="/dashboard/account"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#35353E] hover:text-white transition-colors"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          toggleMobileMenu();
                        }}
                      >
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          Account
                        </div>
                      </Link>

                      <Link
                        href="/dashboard/settings"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#35353E] hover:text-white transition-colors"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          toggleMobileMenu();
                        }}
                      >
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Settings
                        </div>
                      </Link>

                      <div className="border-t border-[#35353E] mt-2 pt-2">
                        <button
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#35353E] hover:text-red-300 transition-colors"
                          onClick={() => {
                            dispatch(logout());
                            router.push("/auth/login");
                            setProfileDropdownOpen(false);
                            toggleMobileMenu();
                          }}
                        >
                          <div className="flex items-center">
                            <svg
                              className="w-4 h-4 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            Log Out
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
          </div>
        </div>
      )}
    </>
  );
}
const NavLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="text-white hover:text-[#1D8751] transition-colors duration-200 text-sm lg:text-base 2xl:text-lg"
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
    className="block text-white hover:text-[#1D8751] py-2 transition-colors duration-200 text-lg"
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
        ? "bg-[#0E5531] hover:bg-[#13B562]"
        : "bg-transparent border border-[#1D8751]"
    } 
    text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm md:text-base 2xl:text-lg
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

const ThemeToggle = ({
  theme,
  toggleTheme,
}: {
  theme: "light" | "dark";
  toggleTheme: () => void;
}) => (
  <button onClick={toggleTheme} className="text-white bg-transparent p-1">
    {theme === "light" ? (
      <Moon size={20} className="text-[#13b562]" />
    ) : (
      <Sun size={20} />
    )}
  </button>
);
