// lib/sanityConfig.ts
// Centralized Sanity configuration with validation

export const getSanityConfig = () => {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2024-01-01';
  const token = process.env.NEXT_PUBLIC_SANITY_READ_TOKEN;

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
