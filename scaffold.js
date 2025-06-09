#!/usr/bin/env node
/**
 * scaffold.js  – Project‑wide skeleton generator
 * ------------------------------------------------
 * Creates all missing directories & placeholder files for the
 * Crypto Exchange Web App front‑end (Next 15 + TypeScript).
 *
 * Safe to re‑run; existing files are left unchanged.
 */

const fs = require("fs");
const path = require("path");

const root = process.cwd();

/** Helper: create dir if it doesn’t exist */
function ensureDir(dir) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
}

/** Helper: create empty file with starter comment */
function ensureFile(file, comment = "") {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    ensureDir(path.dirname(file));
    fs.writeFileSync(full, comment.trimStart());
  }
}

/* -------------------------------------------------------------
 * 1. Directory & file inventory (keep in sync with design doc)
 * ----------------------------------------------------------- */
const inventory = [
  /* ─── Config & meta (root level) ─────────────────────────── */
  ".editorconfig",
  ".husky/pre-commit",
  ".husky/commit-msg",
  ".vscode/settings.json",
  ".github/workflows/ci.yml",
  "playwright.config.ts",
  "vitest.config.ts",

  /* ─── src root ───────────────────────────────────────────── */
  "src/app/(marketing)/layout.tsx",
  "src/app/(marketing)/page.tsx",
  "src/app/dashboard/layout.tsx",
  "src/app/dashboard/page.tsx",
  "src/app/admin/layout.tsx",
  "src/app/admin/page.tsx",

  /* components */
  "src/components/layout/Navbar.tsx",
  "src/components/layout/Sidebar.tsx",
  "src/components/layout/Footer.tsx",
  "src/components/ui/Button.tsx",
  "src/components/ui/Card.tsx",
  "src/components/charts/PriceChart.tsx",
  "src/components/charts/VolumeChart.tsx",

  /* generic hooks */
  "src/hooks/useDebounce.ts",
  "src/hooks/useInterval.ts",
  "src/hooks/useClickOutside.ts",

  /* lib helpers */
  "src/lib/apiClient.ts",
  "src/lib/auth.ts",
  "src/lib/constants.ts",
  "src/lib/sentry.ts",

  /* redux store */
  "src/store/index.ts",
  "src/store/rootReducer.ts",

  /* design tokens & styles */
  "src/styles/tailwind.css",
  "src/styles/tokens.ts",

  /* utils */
  "src/utils/formatters.ts",
  "src/utils/validators.ts",
  "src/utils/guards.ts",

  /* global types */
  "src/types/global.d.ts",

  /* tests folders */
  "src/tests/unit/.gitkeep",
  "src/tests/integration/.gitkeep",
  "src/tests/e2e/.gitkeep",

  /* ─── Feature domains (auth, markets, p2p, etc.) ─────────── */
  /* Auth */
  "src/features/auth/components/LoginForm.tsx",
  "src/features/auth/components/RegisterForm.tsx",
  "src/features/auth/components/ForgotPasswordForm.tsx",
  "src/features/auth/hooks/useAuthRedirect.ts",
  "src/features/auth/hooks/usePasswordStrength.ts",
  "src/features/auth/slices/authSlice.ts",
  "src/features/auth/api.ts",
  "src/features/auth/types.ts",

  /* Markets */
  "src/features/markets/components/MarketTable.tsx",
  "src/features/markets/hooks/useLiveMarkets.ts",
  "src/features/markets/slices/marketSlice.ts",
  "src/features/markets/api.ts",
  "src/features/markets/types.ts",

  /* P2P */
  "src/features/p2p/components/P2PLayout.tsx",
  "src/features/p2p/components/UserCard.tsx",
  "src/features/p2p/components/AdTable.tsx",
  "src/features/p2p/hooks/useAdFilter.ts",
  "src/features/p2p/hooks/useBalance.ts",
  "src/features/p2p/hooks/useOrderSocket.ts",
  "src/features/p2p/slices/adSlice.ts",
  "src/features/p2p/slices/orderSlice.ts",
  "src/features/p2p/api.ts",
  "src/features/p2p/types.ts",

  /* Exchange */
  "src/features/exchange/components/ExchangeForm.tsx",
  "src/features/exchange/components/DepositModal.tsx",
  "src/features/exchange/components/WithdrawModal.tsx",
  "src/features/exchange/hooks/useExchangeRates.ts",
  "src/features/exchange/slices/exchangeSlice.ts",
  "src/features/exchange/api.ts",
  "src/features/exchange/types.ts",

  /* Swap */
  "src/features/swap/components/SwapWidget.tsx",
  "src/features/swap/hooks/useSwapRates.ts",
  "src/features/swap/slices/swapSlice.ts",
  "src/features/swap/api.ts",
  "src/features/swap/types.ts",

  /* Admin */
  "src/features/admin/components/ClientTable.tsx",
  "src/features/admin/hooks/useAdminMetrics.ts",
  "src/features/admin/slices/clientSlice.ts",
  "src/features/admin/api.ts",
  "src/features/admin/types.ts",

  /* Settings */
  "src/features/settings/components/SettingsForm.tsx",
  "src/features/settings/hooks/useThemeToggle.ts",
  "src/features/settings/slices/settingsSlice.ts",
  "src/features/settings/types.ts",
];

/* -------------------------------------------------------------
 * 2. Create everything
 * ----------------------------------------------------------- */
inventory.forEach((item) => {
  if (item.endsWith("/.gitkeep")) {
    ensureDir(path.dirname(item));
    ensureFile(item); // create empty
  } else if (item.endsWith("/")) {
    ensureDir(item);
  } else if (item.includes(".")) {
    const comment =
      item.endsWith(".ts") || item.endsWith(".tsx")
        ? `/**\n * ${path.basename(item)} – auto‑generated placeholder\n */\n`
        : "";
    ensureFile(item, comment);
  } else {
    // folder without trailing slash (rare)
    ensureDir(item);
  }
});

