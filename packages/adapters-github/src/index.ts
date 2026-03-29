import type { IssueSummary, PullRequestSummary, RepoSummary } from "../../schemas/src";

export interface GitHubAdapterOptions {
  token?: string;
  apiBaseUrl?: string;
}

export class GitHubReadAdapter {
  private readonly token?: string;
  private readonly apiBaseUrl: string;

  constructor(options: GitHubAdapterOptions) {
    this.token = options.token;
    this.apiBaseUrl = options.apiBaseUrl ?? "https://api.github.com";
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      headers: {
        Accept: "application/vnd.github+json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API read failed: ${response.status}`);
    }

    return (await response.json()) as T;
  }

  async listOrgRepos(org: string): Promise<RepoSummary[]> {
    const repos = await this.request<any[]>(`/orgs/${org}/repos?per_page=20&sort=updated`);
    return repos.map((repo) => ({
      id: repo.id,
      name: repo.name,
      private: repo.private,
      defaultBranch: repo.default_branch,
      openIssuesCount: repo.open_issues_count,
      updatedAt: repo.updated_at,
      url: repo.html_url,
    }));
  }

  async listOpenPullRequests(owner: string, repo: string): Promise<PullRequestSummary[]> {
    const prs = await this.request<any[]>(`/repos/${owner}/${repo}/pulls?state=open&per_page=20`);
    return prs.map((pr) => ({
      id: pr.id,
      title: pr.title,
      state: pr.state,
      author: pr.user?.login ?? "unknown",
      updatedAt: pr.updated_at,
      url: pr.html_url,
    }));
  }

  async listOpenIssues(owner: string, repo: string): Promise<IssueSummary[]> {
    const issues = await this.request<any[]>(`/repos/${owner}/${repo}/issues?state=open&per_page=20`);
    return issues
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        id: issue.id,
        title: issue.title,
        state: issue.state,
        updatedAt: issue.updated_at,
        url: issue.html_url,
      }));
  }
}
