/**
 * Race a promise with a timeout so slow/hanging API calls don't freeze the UI.
 * Use for any dispatch(fetch...()).unwrap() or similar that could block.
 */
const DEFAULT_MS = 15_000; // 15s – align with apiClient endpoint timeouts

export function withTimeout<T>(
  promise: Promise<T>,
  ms: number = DEFAULT_MS,
  message: string = "Request timeout"
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ]);
}
