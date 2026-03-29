import { CloudflareReadAdapter } from "../../../../packages/adapters-cloudflare/src";
import { renderShell } from "./render";

export async function cloudflarePage(accountId?: string, token?: string): Promise<string> {
  if (!accountId) {
    return renderShell(
      "cloudflare",
      `<h1>Cloudflare summary</h1><p class="muted">Set CLOUDFLARE_ACCOUNT_ID for live read-only summaries.</p>`,
    );
  }

  const adapter = new CloudflareReadAdapter({ accountId, apiToken: token });

  try {
    const [workers, pages] = await Promise.all([adapter.listWorkers(), adapter.listPagesProjects()]);

    const workerRows = workers
      .slice(0, 10)
      .map((worker) => `<tr><td>${worker.name}</td><td>${worker.usageModel ?? "-"}</td><td>${worker.lastModified}</td></tr>`)
      .join("");

    return renderShell(
      "cloudflare",
      `<h1>Cloudflare summary</h1>
       <p class="muted">Account: ${accountId}</p>
       <section class="grid">
         <article class="card"><div class="muted">Workers</div><div class="kpi">${workers.length}</div></article>
         <article class="card"><div class="muted">Pages projects</div><div class="kpi">${pages.length}</div></article>
         <article class="card"><div class="muted">Deployment mode</div><div class="kpi">Read-only</div></article>
       </section>
       <article class="card">
         <table class="table"><thead><tr><th>Worker</th><th>Model</th><th>Last modified</th></tr></thead><tbody>${workerRows}</tbody></table>
       </article>`,
    );
  } catch (error) {
    return renderShell(
      "cloudflare",
      `<h1>Cloudflare summary</h1><p class="muted">Unable to load Cloudflare data: ${(error as Error).message}</p>`,
    );
  }
}
