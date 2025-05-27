import { User, AuthTokens } from '../types';

interface StoredProfile {
  user: User;
  tokens: AuthTokens;
}

const STORAGE_KEYS = {
  PROFILE: 'profile',
  USER_EMAIL: 'user_email',
} as const;

export const storage = {
  getProfile: (): StoredProfile | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  },

  setProfile: (profile: StoredProfile): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  },

  removeProfile: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
  },

  getUserEmail: (): string => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(STORAGE_KEYS.USER_EMAIL) || '';
  },

  setUserEmail: (email: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
  },

  removeUserEmail: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
  }
}; 