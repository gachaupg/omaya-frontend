const noop = (..._args: unknown[]) => {};

export const logger = {
  warn: noop,
  error: noop,
  info: noop,
  debug: noop,
};
