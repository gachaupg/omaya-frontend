/**
 * tokens.ts – unified design palette (superset of main, Marketing & p2p)
 */
// src/styles/tokens.ts
export const tokens = {
  
  colors: {
    brand: {
      primary:   "#1D8751", // Brand-primary
      secondary: "#E23D3A", // Brand-secondary
      hero:      "#022E18", // Marketing hero variant
      lightGreen:"#13B562", // Marketing accent
      darkGreen: "#0E5531", // Marketing accent
    },
    dark: {
      background:    "#0A0A0A", // Dark-mode background
      card:          "#1D1D23", // Dark-mode card bg
      textTitle:     "#FFFFFF", // Dark-mode title text
      textBody:      "#788099", // Dark-mode body text
      border:        "#35353E", // Dark-mode border primary
      textSecondary: "#E23D3A", // Dark-mode secondary
    },
  },
} as const;