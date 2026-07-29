// lib/sanityConfig.ts
// Centralized Sanity configuration with validation
import { resolveSanityConfig } from '@/config/sanity';

export const getSanityConfig = () => {
  // Server: SANITY_* / NEXT_PUBLIC_SANITY_* env (ECS-injected).
  // Browser: window.__RUNTIME_CONFIG__ (same mechanism as the API base URL).
  const { projectId, dataset, apiVersion, token } = resolveSanityConfig();

  const isConfigured = Boolean(projectId && projectId !== '');

  return {
    projectId,
    dataset,
    apiVersion,
    token,
    isConfigured,
  };
};

export const validateSanityConfig = () => {
  const config = getSanityConfig();
  
  if (!config.isConfigured) {
        return false;
  }
  
  return true;
};
