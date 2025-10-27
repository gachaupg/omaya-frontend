// app/layout.tsx

import type { Metadata } from "next";
import { Geist, Geist_Mono, Mulish } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Providers from "./providers";
import { Toaster } from "@/components/ui/Toast";
import GlobalSessionManager from "@/components/GlobalSessionManager";

// Load all three fonts with CSS-variable support
const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});
const mulish = Mulish({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mulish",
});

export const metadata: Metadata = {
  title: "Omaya Exchange",
  description: "Omaya Exchange is a platform for buying and selling cryptocurrencies.",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "32x32",
        type: "image/x-icon",
      },
      {
        url: "https://res.cloudinary.com/pitz/image/upload/v1761576566/Omaya_green-logo_yva2ah_1_huqqlj.webp",
        sizes: "32x32",
        type: "image/webp",
      },
      {
        url: "https://res.cloudinary.com/pitz/image/upload/v1761576566/Omaya_green-logo_yva2ah_1_huqqlj.webp",
        sizes: "16x16",
        type: "image/webp",
      },
    ],
    shortcut: "/favicon.ico",
    apple: "https://res.cloudinary.com/pitz/image/upload/v1761576566/Omaya_green-logo_yva2ah_1_huqqlj.webp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${mulish.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <GlobalSessionManager />
          <Navbar />
          {children}
          <Footer />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
