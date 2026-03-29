import type { PagesProjectSummary, WorkerSummary } from "../../schemas/src";

export interface CloudflareAdapterOptions {
  accountId: string;
  apiToken?: string;
  apiBaseUrl?: string;
}

interface CloudflareEnvelope<T> {
  success: boolean;
  result: T;
}

export class CloudflareReadAdapter {
  private readonly accountId: string;
  private readonly apiToken?: string;
  private readonly apiBaseUrl: string;

  constructor(options: CloudflareAdapterOptions) {
    this.accountId = options.accountId;
    this.apiToken = options.apiToken;
    this.apiBaseUrl = options.apiBaseUrl ?? "https://api.cloudflare.com/client/v4";
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.apiBaseUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(this.apiToken ? { Authorization: `Bearer ${this.apiToken}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API read failed: ${response.status}`);
    }

    const data = (await response.json()) as CloudflareEnvelope<T>;
    return data.result;
  }

  async listWorkers(): Promise<WorkerSummary[]> {
    const workers = await this.request<any[]>(`/accounts/${this.accountId}/workers/scripts`);
    return workers.map((worker) => ({
      id: worker.id ?? worker.script,
      name: worker.id ?? worker.script,
      lastModified: worker.modified_on ?? "unknown",
      usageModel: worker.usage_model,
    }));
  }

  async listPagesProjects(): Promise<PagesProjectSummary[]> {
    const projects = await this.request<any[]>(`/accounts/${this.accountId}/pages/projects`);
    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      subdomain: project.subdomain,
      latestDeploymentStatus: project.latest_deployment?.status,
    }));
  }
}
