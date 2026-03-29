import { brandTokens as t } from "./tokens";

export const commandCenterStyles = `
:root {
  color-scheme: dark;
  --dark: ${t.color.dark};
  --dark-soft: ${t.color.darkSoft};
  --light: ${t.color.light};
  --muted: ${t.color.muted};
  --text-inverted: ${t.color.textInverted};
  --border-dark: ${t.color.borderDark};
  --font-sans: ${t.font.sans};
  --font-mono: ${t.font.mono};
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: var(--font-sans);
  background: radial-gradient(circle at top, #171717, var(--dark));
  color: var(--text-inverted);
}
a { color: inherit; text-decoration: none; }
.shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px 1fr;
}
.sidebar {
  border-right: 1px solid var(--border-dark);
  padding: 24px 16px;
}
.wordmark {
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 24px;
}
.nav-link {
  display: block;
  padding: 10px 12px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.62);
  margin-bottom: 8px;
}
.nav-link.active,
.nav-link:hover {
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.92);
}
.main {
  padding: 24px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.card {
  border: 1px solid var(--border-dark);
  background: rgba(255,255,255,0.02);
  border-radius: 12px;
  padding: 16px;
}
.kpi {
  font-size: 26px;
  letter-spacing: -0.03em;
  margin-top: 8px;
}
.muted { color: rgba(255,255,255,0.5); }
.table {
  margin-top: 12px;
  width: 100%;
  border-collapse: collapse;
}
.table th,
.table td {
  text-align: left;
  border-bottom: 1px solid var(--border-dark);
  padding: 10px 4px;
  font-size: 13px;
}
@media (max-width: 1024px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar { border-right: none; border-bottom: 1px solid var(--border-dark); }
  .grid { grid-template-columns: 1fr; }
}
`;
