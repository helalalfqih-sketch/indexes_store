import { defineTheme } from "@astryxdesign/core/theme";
export const storefrontTheme = defineTheme({
  name: "indexes-storefront",
  color: { accent: "#0758f9", neutralStyle: "cool" },
  typography: {
    body: { family: "Tajawal", fallbacks: "sans-serif" },
    heading: { family: "Tajawal", fallbacks: "sans-serif" },
  },
  radius: { base: 4, multiplier: 1 },
  tokens: {
    "--color-text-primary": ["#082347", "#082347"],
    "--color-background-surface": ["#ffffff", "#ffffff"],
  },
});
