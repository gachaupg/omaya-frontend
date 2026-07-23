#!/usr/bin/env node
/**
 * Removes console.* call statements from TypeScript/JavaScript source files.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  "dist",
  "build",
  ".git",
  "coverage",
]);
const SKIP_FILES = new Set([
  path.normalize("scripts/remove-console-logs.js"),
  path.normalize("scripts/migrate-console-logs.js"),
]);
const EXT = new Set([".ts", ".tsx", ".js", ".jsx"]);
const CONSOLE_RE =
  /console\.(log|debug|info|warn|error|trace|group|groupCollapsed|groupEnd|table|dir|time|timeEnd|assert|clear|count|countReset)\s*\(/g;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (EXT.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function findMatchingParen(code, openIndex) {
  let depth = 1;
  let i = openIndex + 1;
  let inString = null;
  let escaped = false;

  while (i < code.length && depth > 0) {
    const ch = code[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === inString) inString = null;
      i++;
      continue;
    }

    if (ch === "'" || ch === '"' || ch === "`") {
      inString = ch;
      i++;
      continue;
    }

    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    i++;
  }

  return i;
}

function stripConsoleCalls(code) {
  let result = "";
  let lastIndex = 0;
  CONSOLE_RE.lastIndex = 0;
  let match;

  while ((match = CONSOLE_RE.exec(code)) !== null) {
    const start = match.index;
    const openParen = start + match[0].length - 1;
    let end = findMatchingParen(code, openParen);

    while (end < code.length && /\s/.test(code[end])) end++;
    if (code[end] === ";") end++;

    while (end < code.length && (code[end] === "\r" || code[end] === "\n")) end++;

    result += code.slice(lastIndex, start);
    lastIndex = end;
    CONSOLE_RE.lastIndex = end;
  }

  result += code.slice(lastIndex);
  return result;
}

function cleanEmptyBlocks(code) {
  return code
    .replace(/\n\s*if\s*\(\s*process\.env\.NODE_ENV\s*===\s*["']development["']\s*\)\s*\{\s*\}\s*\n/g, "\n")
    .replace(/\n\s*if\s*\(\s*!isProduction\s*\)\s*\{\s*\}\s*\n/g, "\n");
}

let changedFiles = 0;
let removedCount = 0;

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  if (SKIP_FILES.has(path.normalize(rel))) continue;

  const original = fs.readFileSync(file, "utf8");
  if (!original.includes("console.")) continue;

  const beforeMatches = (original.match(/console\./g) || []).length;
  let updated = stripConsoleCalls(original);
  updated = cleanEmptyBlocks(updated);

  if (updated !== original) {
    fs.writeFileSync(file, updated, "utf8");
    changedFiles++;
    removedCount += beforeMatches;
    console.log(`Cleaned ${rel}`);
  }
}

console.log(`Done. Updated ${changedFiles} files.`);
