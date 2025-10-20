"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { setSuppress401Errors } from "@/lib/utils/errorHandler";

/**
 * Component to suppress 401 errors on the home page
 * This prevents unauthenticated users from seeing error messages
 */
export function HomePage401Suppressor({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  useEffect(() => {
    // Suppress 401 errors when on home page
    const isHomePage = pathname === '/';
    setSuppress401Errors(isHomePage);
    
    return () => {
      // Clean up - don't suppress on other pages
      if (isHomePage) {
        setSuppress401Errors(false);
      }
    };
  }, [pathname]);
  
  return <>{children}</>;
}

