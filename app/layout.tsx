// app/layout.tsx

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Providers from "./providers";
import { Toaster } from "@/components/ui/Toast";
import GlobalSessionManager from "@/components/GlobalSessionManager";

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
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
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
              
              // Prevent stretching at extreme zoom levels - aggressive fix
              (function() {
                let isRunning = false;
                
                function preventStretching() {
                  if (isRunning) return;
                  isRunning = true;
                  
                  try {
                    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
                    const bodyWidth = document.body.scrollWidth;
                    
                    // First, ensure body and html don't exceed viewport
                    if (document.body.scrollWidth > viewportWidth) {
                      document.body.style.maxWidth = viewportWidth + 'px';
                      document.body.style.overflowX = 'hidden';
                    }
                    
                    if (document.documentElement.scrollWidth > viewportWidth) {
                      document.documentElement.style.maxWidth = viewportWidth + 'px';
                      document.documentElement.style.overflowX = 'hidden';
                    }
                    
                    // Check all elements
                    const allElements = document.querySelectorAll('*:not(script):not(style):not(meta):not(link)');
                    
                    allElements.forEach(function(el) {
                      if (el instanceof HTMLElement) {
                        // Skip fixed and sticky positioned elements
                        const position = window.getComputedStyle(el).position;
                        if (position === 'fixed' || position === 'sticky') {
                          return;
                        }
                        
                        const rect = el.getBoundingClientRect();
                        const currentMaxWidth = window.getComputedStyle(el).maxWidth;
                        
                        // If element width exceeds viewport, constrain it
                        if (rect.width > viewportWidth) {
                          if (currentMaxWidth === 'none' || 
                              currentMaxWidth === '' || 
                              parseFloat(currentMaxWidth) > viewportWidth ||
                              currentMaxWidth.includes('vw')) {
                            el.style.setProperty('max-width', '100%', 'important');
                            el.style.setProperty('box-sizing', 'border-box', 'important');
                          }
                        }
                        
                        // Also check if element has width set to viewport units
                        const currentWidth = window.getComputedStyle(el).width;
                        if (currentWidth.includes('vw') && parseFloat(currentWidth) > 100) {
                          el.style.setProperty('width', '100%', 'important');
                        }
                      }
                    });
                  } catch (e) {
                    console.warn('Error preventing stretching:', e);
                  } finally {
                    isRunning = false;
                  }
                }
                
                // Run immediately
                preventStretching();
                
                // Run on load and resize
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', preventStretching);
                }
                
                window.addEventListener('resize', function() {
                  setTimeout(preventStretching, 10);
                });
                
                // Use MutationObserver to catch dynamically added content
                const observer = new MutationObserver(function(mutations) {
                  let shouldRun = false;
                  mutations.forEach(function(mutation) {
                    if (mutation.addedNodes.length > 0) {
                      shouldRun = true;
                    }
                  });
                  if (shouldRun) {
                    setTimeout(preventStretching, 50);
                  }
                });
                
                observer.observe(document.body, {
                  childList: true,
                  subtree: true
                });
                
                // Also run periodically to catch any missed elements
                setInterval(preventStretching, 2000);
                
                // Run after delays to catch dynamically loaded content
                setTimeout(preventStretching, 100);
                setTimeout(preventStretching, 500);
                setTimeout(preventStretching, 1000);
                setTimeout(preventStretching, 2000);
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${mulish.variable} antialiased`}
        suppressHydrationWarning
      >
        <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, overflowX: 'hidden' }}>
          <Providers>
            <GlobalSessionManager />
            <Navbar />
            {children}
            <Footer />
            <Toaster />
          </Providers>
        </div>
      </body>
    </html>
  );
}
