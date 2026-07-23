/**
 * logger.ts - Logging disabled application-wide.
 */
type LogFn = (...args: unknown[]) => void;

const noop: LogFn = () => {};

class Logger {
  debug: LogFn = noop;
  info: LogFn = noop;
  warn: LogFn = noop;
  error: LogFn = noop;
  performance: LogFn = noop;
  api: LogFn = noop;
  redux: LogFn = noop;
  navigation: LogFn = noop;
}

export const logger = new Logger();

export const authLogger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

export const p2pLogger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

export const apiLogger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
};

export const performanceLogger = {
  start: () => 0,
  end: noop,
  measure: async <T>(_module: string, _operation: string, fn: () => Promise<T>) =>
    fn(),
};

export const LOGGING_ENV_VARS = {};

export default logger;
