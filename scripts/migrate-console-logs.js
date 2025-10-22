#!/usr/bin/env node

/**
 * migrate-console-logs.js - Script to replace console.log with configurable logger
 *
 * This script:
 * 1. Finds all console.log statements in the codebase
 * 2. Replaces them with appropriate logger calls
 * 3. Maintains the same functionality but with configurable logging
 * 4. Preserves error handling and important logs
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const SRC_DIR = "./features";
const EXCLUDE_DIRS = ["node_modules", ".next", "dist", "build"];
const CONSOLE_PATTERNS = [
  /console\.log\(/g,
  /console\.debug\(/g,
  /console\.info\(/g,
  /console\.warn\(/g,
  /console\.error\(/g,
];

// Module mapping for logger selection
const MODULE_MAPPING = {
  "features/auth": "auth",
  "features/p2p": "p2p",
  "features/exchange": "exchange",
  "features/swap": "swap",
  "features/settings": "dashboard",
  "components/layout": "navigation",
  "lib/apiClient": "api",
  "lib/utils": "performance",
};

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(file)) {
        findFiles(filePath, fileList);
      }
    } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

function getModuleFromPath(filePath) {
  for (const [pathPattern, module] of Object.entries(MODULE_MAPPING)) {
    if (filePath.includes(pathPattern)) {
      return module;
    }
  }
  return "general";
}

function replaceConsoleLogs(content, filePath) {
  const module = getModuleFromPath(filePath);
  let modified = false;
  let newContent = content;

  // More sophisticated replacement that handles arguments properly
  const replacePattern = (pattern, loggerMethod) => {
    newContent = newContent.replace(pattern, (match, offset, string) => {
      // Check if it's already using logger
      const beforeMatch = string.substring(0, offset);
      if (beforeMatch.includes("logger.")) {
        return match;
      }

      // Find the matching closing parenthesis
      let parenCount = 0;
      let endIndex = offset + match.length;
      let foundEnd = false;

      for (let i = endIndex; i < string.length; i++) {
        if (string[i] === "(") parenCount++;
        else if (string[i] === ")") {
          if (parenCount === 0) {
            endIndex = i;
            foundEnd = true;
            break;
          }
          parenCount--;
        }
      }

      if (!foundEnd) return match;

      // Extract the arguments
      const args = string.substring(offset + match.length, endIndex);
      const trimmedArgs = args.trim();

      // Handle different argument patterns
      if (trimmedArgs === "") {
        // No arguments: console.log() -> logger.debug('module', '')
        modified = true;
        return `logger.${loggerMethod}('${module}', ''`;
      } else if (trimmedArgs.includes(",")) {
        // Multiple arguments: console.log(a, b, c) -> logger.debug('module', a, b, c)
        modified = true;
        return `logger.${loggerMethod}('${module}', ${trimmedArgs}`;
      } else {
        // Single argument: console.log(a) -> logger.debug('module', a)
        modified = true;
        return `logger.${loggerMethod}('${module}', ${trimmedArgs}`;
      }
    });
  };

  // Replace console methods
  replacePattern(/console\.log\(/g, "debug");
  replacePattern(/console\.debug\(/g, "debug");
  replacePattern(/console\.info\(/g, "info");
  replacePattern(/console\.warn\(/g, "warn");
  replacePattern(/console\.error\(/g, "error");

  return { content: newContent, modified };
}

function addLoggerImport(content) {
  // Check if logger is already imported
  if (
    content.includes("import { logger }") ||
    content.includes("import logger")
  ) {
    return content;
  }

  // Find the last import statement
  const importRegex = /import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm;
  const imports = content.match(importRegex);

  if (imports && imports.length > 0) {
    const lastImport = imports[imports.length - 1];
    const lastImportIndex = content.lastIndexOf(lastImport);
    const insertIndex = lastImportIndex + lastImport.length;

    return (
      content.slice(0, insertIndex) +
      "\nimport { logger } from '@/lib/utils/logger';\n" +
      content.slice(insertIndex)
    );
  }

  // If no imports found, add at the top
  return `import { logger } from '@/lib/utils/logger';\n\n${content}`;
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const { content: newContent, modified } = replaceConsoleLogs(
      content,
      filePath
    );

    if (modified) {
      const finalContent = addLoggerImport(newContent);
      fs.writeFileSync(filePath, finalContent, "utf8");
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log("🚀 Starting console.log migration...\n");

  const files = findFiles(SRC_DIR);
  let processedCount = 0;
  let updatedCount = 0;

  files.forEach((file) => {
    processedCount++;
    if (processFile(file)) {
      updatedCount++;
    }
  });

  console.log(`\n📊 Migration Summary:`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files updated: ${updatedCount}`);
  console.log(`   Files unchanged: ${processedCount - updatedCount}`);

  if (updatedCount > 0) {
    console.log(`\n✅ Migration completed successfully!`);
    console.log(`\n📝 Next steps:`);
    console.log(`   1. Test the application to ensure logging works`);
    console.log(`   2. Configure environment variables for production`);
    console.log(`   3. Remove any remaining console.log statements manually`);
  } else {
    console.log(`\n✅ No console.log statements found to migrate.`);
  }
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = { processFile, replaceConsoleLogs, addLoggerImport };
