// app/layout.tsx

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Providers from "./providers";
import { Toaster } from "@/components/ui/Toast";
import GlobalSessionManager from "@/components/GlobalSessionManager";
import FloatingChatButton from "@/components/ui/FloatingChatButton";
import P2PRejectionModalRoot from "@/components/P2PRejectionModalRoot";

// Load all three fonts from local assets for offline-friendly builds
const geistSans = localFont({
  src: [
    {
      path: "./fonts/GeistVariable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: [
    {
      path: "./fonts/GeistMonoVariable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

const mulish = localFont({
  src: [
    {
      path: "./fonts/Mulish-VariableFont_wght.ttf",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-mulish",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OMAYA.io |  Your Gateway to the Crypto World, Built on Trust & Security!",
  description: "Omaya Exchange is a platform for buying and selling cryptocurrencies.",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "32x32",
        type: "image/x-icon",
      },
      {
        url: "/assets/Omaya_green-logo_yva2ah_1_huqqlj.webp",
        sizes: "32x32",
        type: "image/webp",
      },
      {
        url: "/assets/Omaya_green-logo_yva2ah_1_huqqlj.webp",
        sizes: "16x16",
        type: "image/webp",
      },
    ],
    shortcut: "/favicon.ico",
    apple: "/assets/Omaya_green-logo_yva2ah_1_huqqlj.webp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Facebook SDK */}
        <script
          async
          defer
          crossOrigin="anonymous"
          src="https://connect.facebook.net/en_US/sdk.js"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.fbAsyncInit = function() {
                FB.init({
                  appId: '596315263341600',
                  cookie: true,
                  xfbml: true,
                  version: 'v18.0'
                });
              };
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${mulish.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>
          <P2PRejectionModalRoot />
          <GlobalSessionManager />
          <Navbar />
          {children}
          <Footer />
          <FloatingChatButton />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
