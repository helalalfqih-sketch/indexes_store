import { defineTheme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral";

/**
 * Indexes' teal identity expressed through Astryx's theme compiler. The
 * generated `indexes.css`/`indexes.js` files are committed for SSR so the
 * first paint uses the same tokens as the hydrated application.
 */
export const indexesTheme = defineTheme({
  name: "indexes",
  extends: neutralTheme,
  color: {
    accent: "#06758a",
    neutralStyle: "cool",
    contrast: "high",
  },
  typography: {
    scale: { base: 14, ratio: 1.2 },
    body: {
      family: "Tajawal",
      fallbacks: "ui-sans-serif, system-ui, sans-serif",
    },
    heading: {
      family: "Tajawal",
      fallbacks: "ui-sans-serif, system-ui, sans-serif",
    },
  },
  radius: { base: 4, multiplier: 1.5 },
});
