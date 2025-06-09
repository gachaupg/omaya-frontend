const isProduction = process.env.NODE_ENV === "production";

// Sensitive data patterns to sanitize
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /wallet.*address/i,
  /private/i,
  /auth/i,
];

const sanitizeData = (data: any): any => {
  if (!isProduction) return data; // Don't sanitize in development

  if (typeof data !== "object" || data === null) return data;

  const sanitized = { ...data };

  Object.keys(sanitized).forEach((key) => {
    if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(key))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof sanitized[key] === "object") {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });

  return sanitized;
};

export const logger = {
  warn: (message: string, meta?: any) => {
    const sanitizedMeta = meta ? sanitizeData(meta) : undefined;
    console.warn(message, sanitizedMeta);
  },
  error: (message: string, meta?: any) => {
    const sanitizedMeta = meta ? sanitizeData(meta) : undefined;
    console.error(message, sanitizedMeta);
  },
  info: (message: string, meta?: any) => {
    const sanitizedMeta = meta ? sanitizeData(meta) : undefined;
    console.info(message, sanitizedMeta);
  },
  debug: (message: string, meta?: any) => {
    // Debug logs only in development
    if (!isProduction) {
      console.debug(message, meta);
    }
  },
};
