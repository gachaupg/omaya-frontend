/**
 * cookieUtils.ts - Safe cookie utilities for SSR compatibility
 */

export const cookieUtils = {
  setCookie: (name: string, value: string, options: {
    path?: string;
    maxAge?: number;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
  } = {}): void => {
    if (typeof document === 'undefined') return;
    
    const {
      path = '/',
      maxAge,
      secure = true,
      sameSite = 'strict'
    } = options;

    let cookieString = `${name}=${value}; path=${path}`;
    
    if (maxAge !== undefined) {
      cookieString += `; max-age=${maxAge}`;
    }
    
    if (secure) {
      cookieString += '; secure';
    }
    
    cookieString += `; samesite=${sameSite}`;
    
    document.cookie = cookieString;
  },

  getCookie: (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    
    if (parts.length === 2) {
      return parts.pop()?.split(';').shift() || null;
    }
    
    return null;
  },

  removeCookie: (name: string, path: string = '/'): void => {
    if (typeof document === 'undefined') return;
    
    document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
};
