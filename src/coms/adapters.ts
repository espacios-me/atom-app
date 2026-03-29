import { CloudflareReadAdapter } from "../../packages/adapters-cloudflare/src";
import { GitHubReadAdapter } from "../../packages/adapters-github/src";
import type { Env, OverviewPayload } from "./types";

export async function getOverview(env: Env): Promise<OverviewPayload> {
  const org = env.GITHUB_ORG ?? "espacios-me";
  const repo = env.GITHUB_REPO ?? "-";

  let repositories = 0;
  let pullRequests = 0;
  let issues = 0;
  let workers = 0;
  let pagesProjects = 0;

  if (env.GITHUB_TOKEN) {
    const github = new GitHubReadAdapter({ token: env.GITHUB_TOKEN });
    const [repos, prs, issueItems] = await Promise.all([
      github.listOrgRepos(org),
      github.listOpenPullRequests(org, repo),
      github.listOpenIssues(org, repo),
    ]);
    repositories = repos.length;
    pullRequests = prs.length;
    issues = issueItems.length;
  }

  if (env.CLOUDFLARE_API_TOKEN && env.CLOUDFLARE_ACCOUNT_ID) {
    const cloudflare = new CloudflareReadAdapter({
      accountId: env.CLOUDFLARE_ACCOUNT_ID,
      apiToken: env.CLOUDFLARE_API_TOKEN,
    });
    const [workerItems, pageItems] = await Promise.all([cloudflare.listWorkers(), cloudflare.listPagesProjects()]);
    workers = workerItems.length;
    pagesProjects = pageItems.length;
  }

  return {
    github: { repositories, pullRequests, issues },
    cloudflare: { workers, pagesProjects },
    updatedAt: new Date().toISOString(),
  };
}

export async function getGeminiOpsNote(env: Env, overview: OverviewPayload): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    return "Add GEMINI_API_KEY to enable AI operational notes.";
  }

  const prompt = `You are the Espacios command center copilot. Return one concise operations note (max 24 words). Data: ${JSON.stringify(overview)}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    },
  );

  if (!response.ok) {
    return `Gemini unavailable (${response.status}).`;
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  return text || "Gemini returned no summary.";
}
