export interface RepoSummary {
  id: number;
  name: string;
  private: boolean;
  defaultBranch: string;
  openIssuesCount: number;
  updatedAt: string;
  url: string;
}

export interface PullRequestSummary {
  id: number;
  title: string;
  state: "open" | "closed";
  author: string;
  updatedAt: string;
  url: string;
}

export interface IssueSummary {
  id: number;
  title: string;
  state: "open" | "closed";
  updatedAt: string;
  url: string;
}

export interface DeploymentSummary {
  id: string;
  environment: string;
  status: string;
  updatedAt: string;
}

export interface WorkerSummary {
  id: string;
  name: string;
  lastModified: string;
  usageModel?: string;
}

export interface PagesProjectSummary {
  id: string;
  name: string;
  subdomain: string;
  latestDeploymentStatus?: string;
}

export interface EnvironmentSummary {
  name: string;
  region?: string;
  status?: string;
}

export interface DashboardCard {
  id: string;
  label: string;
  value: string;
  detail?: string;
}
