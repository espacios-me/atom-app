import { commandCenterStyles } from "../../../../packages/design-system/src";
import type { DashboardCard } from "../../../../packages/schemas/src";

export function renderShell(active: "overview" | "github" | "cloudflare", content: string): string {
  const is = (route: typeof active) => (route === active ? "nav-link active" : "nav-link");

  return `<!doctype html>
  <html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Espacios Command Center</title>
    <style>${commandCenterStyles}</style>
  </head>
  <body>
    <div class="shell">
      <aside class="sidebar">
        <div class="wordmark">Espacios Command Center</div>
        <a class="${is("overview")}" href="/command-center">Overview</a>
        <a class="${is("github")}" href="/command-center/github">GitHub</a>
        <a class="${is("cloudflare")}" href="/command-center/cloudflare">Cloudflare</a>
        <a class="nav-link" href="/bot">/bot (next)</a>
        <a class="nav-link" href="/mcp">/mcp (next)</a>
        <a class="nav-link" href="/admin">/admin (next)</a>
      </aside>
      <main class="main">${content}</main>
    </div>
  </body>
  </html>`;
}

export function renderCards(cards: DashboardCard[]): string {
  return `<section class="grid">${cards
    .map(
      (card) => `<article class="card"><div class="muted">${card.label}</div><div class="kpi">${card.value}</div><div class="muted">${card.detail ?? ""}</div></article>`,
    )
    .join("")}</section>`;
}
