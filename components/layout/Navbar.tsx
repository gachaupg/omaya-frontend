"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Moon, Sun, Menu, X } from "lucide-react";

export default function Navbar() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

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
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-4 sm:px-6 md:px-12 transition-all duration-300 ${
          scrolled ? "bg-[#1D1D23]" : "bg-transparent"
        }`}
      >
        <div className="flex items-center">
          <Link href="/" className="mr-4 md:mr-10">
          {scrolled?  
            <Image
              src="https://res.cloudinary.com/dam1sxczj/image/upload/v1747133499/Omaya_green-logo_yva2ah.png"
              alt="OMAYA Exchange"
              width={150}
              height={40}
              className="h-auto w-32 md:w-40"
              priority
            /> :
            <Image
            src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746538269/Frame_q3pwt7.png"
            alt="OMAYA Exchange"
            width={150}
            height={40}
            className="h-auto w-32 md:w-40"
            priority
          />
          }

          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6 lg:space-x-8">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/market">Market</NavLink>
            <NavLink href="/rates">Rates</NavLink>
            <NavLink href="/blog">Blog</NavLink>
          </div>
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <AuthButton variant="primary">Register</AuthButton>
          <AuthButton variant="secondary">Log In</AuthButton>
          
          <div className="flex items-center space-x-4">
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
        <div className={`fixed top-16 left-0 right-0 z-40 md:hidden p-6 space-y-6 shadow-lg transition-all duration-300 bg-[#1D1D23]`}>
          <MobileNavLink href="/" onClick={toggleMobileMenu}>Home</MobileNavLink>
          <MobileNavLink href="/dashboard" onClick={toggleMobileMenu}>Dashboard</MobileNavLink>
          <MobileNavLink href="/market" onClick={toggleMobileMenu}>Market</MobileNavLink>
          <MobileNavLink href="/rates" onClick={toggleMobileMenu}>Rates</MobileNavLink>
          <MobileNavLink href="/blog" onClick={toggleMobileMenu}>Blog</MobileNavLink>
          
          <div className="flex flex-col space-y-4 pt-4">
            <AuthButton variant="primary" fullWidth>Register</AuthButton>
            <AuthButton variant="secondary" fullWidth>Log In</AuthButton>
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

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link
    href={href}
    className="text-white hover:text-[#1D8751] transition-colors duration-200 text-sm lg:text-base"
  >
    {children}
  </Link>
);

const MobileNavLink = ({ href, children, onClick }: { href: string; children: React.ReactNode; onClick: () => void }) => (
  <Link
    href={href}
    className="block text-white hover:text-[#1D8751] py-2 transition-colors duration-200 text-lg"
    onClick={onClick}
  >
    {children}
  </Link>
);

const AuthButton = ({ variant, children, fullWidth = false }: { variant: "primary" | "secondary"; children: React.ReactNode; fullWidth?: boolean }) => (
  <button
    className={`${variant === "primary" ? "bg-[#0E5531] hover:bg-[#13B562]" : "bg-transparent border border-[#13B562]"} 
    text-white px-4 py-2 rounded-md transition-colors duration-200 text-sm md:text-base
    ${fullWidth ? "w-full" : ""}`}
  >
    {children}
  </button>
);

const LanguageSelector = () => (
  <div className="flex items-center justify-center cursor-pointer">
    <Image
      src="https://res.cloudinary.com/dam1sxczj/image/upload/v1746538734/united_kingdom_zud79x.png"
      alt="English"
      width={24}
      height={24}
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
);

const ThemeToggle = ({ theme, toggleTheme }: { theme: "light" | "dark"; toggleTheme: () => void }) => (
  <button onClick={toggleTheme} className="text-white bg-transparent p-1">
    {theme === "light" ? (
      <Moon size={20} className="text-[#13b562]" />
    ) : (
      <Sun size={20} />
    )}
  </button>
);