import { renderCards, renderShell } from "./render";

export function overviewPage(): string {
  const cards = [
    { id: "repos", label: "GitHub repositories", value: "--", detail: "Connect token for live data" },
    { id: "pulls", label: "Open pull requests", value: "--", detail: "Read-only baseline" },
    { id: "workers", label: "Cloudflare Workers", value: "--", detail: "Awaiting account link" },
  ];

  const body = `
    <h1>Operational overview</h1>
    <p class="muted">Unified read-only status across GitHub and Cloudflare.</p>
    ${renderCards(cards)}
  `;

  return renderShell("overview", body);
}
