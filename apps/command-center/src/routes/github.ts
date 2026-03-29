import { GitHubReadAdapter } from "../../../../packages/adapters-github/src";
import { renderShell } from "./render";

export async function githubPage(org?: string, repo?: string, token?: string): Promise<string> {
  if (!org || !repo) {
    return renderShell(
      "github",
      `<h1>GitHub summary</h1><p class="muted">Set GITHUB_ORG and GITHUB_REPO for live read-only summaries.</p>`,
    );
  }

  const adapter = new GitHubReadAdapter({ token });

  try {
    const [repos, pulls, issues] = await Promise.all([
      adapter.listOrgRepos(org),
      adapter.listOpenPullRequests(org, repo),
      adapter.listOpenIssues(org, repo),
    ]);

    const rows = repos
      .slice(0, 8)
      .map(
        (item) =>
          `<tr><td>${item.name}</td><td>${item.openIssuesCount}</td><td>${new Date(item.updatedAt).toISOString().slice(0, 10)}</td></tr>`,
      )
      .join("");

    return renderShell(
      "github",
      `<h1>GitHub summary</h1>
       <p class="muted">Org: ${org} · Repo focus: ${repo}</p>
       <section class="grid">
         <article class="card"><div class="muted">Repos tracked</div><div class="kpi">${repos.length}</div></article>
         <article class="card"><div class="muted">Open PRs</div><div class="kpi">${pulls.length}</div></article>
         <article class="card"><div class="muted">Open issues</div><div class="kpi">${issues.length}</div></article>
       </section>
       <article class="card">
         <table class="table"><thead><tr><th>Repository</th><th>Open issues</th><th>Updated</th></tr></thead><tbody>${rows}</tbody></table>
       </article>`,
    );
  } catch (error) {
    return renderShell("github", `<h1>GitHub summary</h1><p class="muted">Unable to load GitHub data: ${(error as Error).message}</p>`);
  }
}
