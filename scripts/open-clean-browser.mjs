/**
 * Opens the dev app in a browser without extensions (no MetaMask contentscript noise).
 * Usage: npm run browser:clean
 * Optional: PORT=3001 npm run browser:clean
 */
import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { platform } from "node:os";

const port = process.env.PORT || "3000";
const url = `http://localhost:${port}`;

const winChromePaths = [
  process.env.LOCALAPPDATA
    ? `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`
    : null,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean);

const winEdgePaths = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

function run(command) {
  exec(command, (err) => {
    if (err) {
      console.error("Failed to launch browser:", err.message);
      console.error(`Open manually: ${url}`);
      console.error(
        "Tip: use Chrome/Edge with --disable-extensions to hide wallet extension warnings."
      );
      process.exit(1);
    }
  });
}

function launchWindows() {
  const chrome = winChromePaths.find((p) => existsSync(p));
  if (chrome) {
    run(`"${chrome}" --disable-extensions --new-window "${url}"`);
    console.log(`Opened Chrome (no extensions): ${url}`);
    return;
  }

  const edge = winEdgePaths.find((p) => existsSync(p));
  if (edge) {
    run(`"${edge}" --disable-extensions --new-window "${url}"`);
    console.log(`Opened Edge (no extensions): ${url}`);
    return;
  }

  run(`start "" chrome --disable-extensions "${url}"`);
  console.log(`Attempted Chrome via PATH: ${url}`);
}

function launchMac() {
  run(
    `open -na "Google Chrome" --args --disable-extensions --new-window "${url}"`
  );
  console.log(`Opened Chrome (no extensions): ${url}`);
}

function launchLinux() {
  run(`google-chrome --disable-extensions --new-window "${url}"`);
  console.log(`Opened Chrome (no extensions): ${url}`);
}

console.log(
  "Wallet extension warnings (contentscript.js / ObjectMultiplex) cannot be removed from app code."
);
console.log("Opening a clean browser window without extensions...\n");

switch (platform()) {
  case "win32":
    launchWindows();
    break;
  case "darwin":
    launchMac();
    break;
  default:
    launchLinux();
    break;
}
