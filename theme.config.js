/** @type {const} */
const themeColors = {
  // Core palette — bold dark minimal (matches Espacios/Atom reference UI)
  primary:    { light: '#FFFFFF', dark: '#FFFFFF' },       // white on dark = primary action
  background: { light: '#0A0A0A', dark: '#0A0A0A' },       // near-black
  surface:    { light: '#141414', dark: '#141414' },        // slightly lifted surface
  foreground: { light: '#FFFFFF', dark: '#FFFFFF' },        // pure white text
  muted:      { light: '#888888', dark: '#888888' },        // mid-grey for secondary text
  border:     { light: '#2A2A2A', dark: '#2A2A2A' },        // subtle dark border
  success:    { light: '#4ADE80', dark: '#4ADE80' },
  warning:    { light: '#FBBF24', dark: '#FBBF24' },
  error:      { light: '#F87171', dark: '#F87171' },
  // Semantic accent colors for data types
  memory:     { light: '#FFFFFF', dark: '#FFFFFF' },
  goal:       { light: '#4ADE80', dark: '#4ADE80' },
  reminder:   { light: '#FBBF24', dark: '#FBBF24' },
  behavior:   { light: '#F472B6', dark: '#F472B6' },
};

module.exports = { themeColors };
