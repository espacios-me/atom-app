export interface Env {
  ASSETS: Fetcher;
  GITHUB_TOKEN?: string;
  GITHUB_ORG?: string;
  GITHUB_REPO?: string;
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  GEMINI_API_KEY?: string;
}

export interface OverviewPayload {
  github: {
    repositories: number;
    pullRequests: number;
    issues: number;
  };
  cloudflare: {
    workers: number;
    pagesProjects: number;
  };
  updatedAt: string;
}
