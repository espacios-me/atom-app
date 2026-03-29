export const brandTokens = {
  color: {
    dark: "#0D0D0D",
    darkSoft: "#1A1A1A",
    light: "#F7F7F8",
    lightSoft: "#EFEFEF",
    text: "#0D0D0D",
    textInverted: "rgba(255,255,255,0.92)",
    muted: "#6E6E80",
    borderDark: "rgba(255,255,255,0.08)",
    borderLight: "rgba(0,0,0,0.07)",
  },
  radius: {
    sm: "8px",
    md: "12px",
  },
  spacing: {
    xs: "8px",
    sm: "12px",
    md: "16px",
    lg: "24px",
    xl: "32px",
  },
  font: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    mono: 'ui-monospace, "SF Mono", Menlo, Monaco, monospace',
  },
} as const;

export type BrandTokens = typeof brandTokens;
