/**
 * Filters known third-party console noise (wallet extensions, copy helpers, React dev hints).
 * Installed via inline <head> script so it runs before extension content scripts log.
 */
export const CONSOLE_NOISE_FILTER_PATTERNS = [
  "SerializableStateInvariantMiddleware",
  "MaxListenersExceededWarning",
  "ObjectMultiplex",
  "orphaned data for stream",
  "app-init-liveness",
  "background-liveness",
  "Download the React DevTools",
  "enable copy content js",
  "E.C.P is not enabled",
  "contentscript.js",
] as const;

/** Minified IIFE — must stay valid plain JS for dangerouslySetInnerHTML. */
export const CONSOLE_NOISE_FILTER_SCRIPT = `(function(){
  if(typeof window==="undefined"||window.__OMAYA_CONSOLE_FILTER__)return;
  window.__OMAYA_CONSOLE_FILTER__=1;
  var patterns=${JSON.stringify([...CONSOLE_NOISE_FILTER_PATTERNS])};
  function shouldSuppress(args){
    var text="";
    for(var i=0;i<args.length;i++){
      var a=args[i];
      if(a&&typeof a==="object"&&typeof a.message==="string") text+=a.message+" ";
      else text+=String(a)+" ";
    }
    for(var j=0;j<patterns.length;j++){
      if(text.indexOf(patterns[j])!==-1)return true;
    }
    return false;
  }
  ["log","info","warn","error","debug"].forEach(function(method){
    var original=console[method].bind(console);
    console[method]=function(){
      if(shouldSuppress(arguments))return;
      original.apply(console,arguments);
    };
  });
})();`;

const NOISE_PATTERNS = CONSOLE_NOISE_FILTER_PATTERNS.map(
  (fragment) => new RegExp(fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
);

function shouldSuppress(args: unknown[]): boolean {
  const text = args
    .map((arg) => {
      if (typeof arg === "string") return arg;
      if (arg instanceof Error) return arg.message;
      try {
        return JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    })
    .join(" ");
  return NOISE_PATTERNS.some((pattern) => pattern.test(text));
}

export function suppressKnownConsoleNoise() {
  if (typeof window === "undefined") return;
  if ((window as Window & { __OMAYA_CONSOLE_FILTER__?: number }).__OMAYA_CONSOLE_FILTER__) {
    return;
  }

  (window as Window & { __OMAYA_CONSOLE_FILTER__?: number }).__OMAYA_CONSOLE_FILTER__ = 1;

  (["log", "info", "warn", "error", "debug"] as const).forEach((method) => {
    const original = console[method].bind(console);
    console[method] = (...args: unknown[]) => {
      if (shouldSuppress(args)) return;
      original(...args);
    };
  });
}
