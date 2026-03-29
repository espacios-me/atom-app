# Espacios Command Center v1

## What was added

- `apps/command-center`: Cloudflare Worker app shell with three routes:
  - `/command-center` overview
  - `/command-center/github` GitHub read summary
  - `/command-center/cloudflare` Cloudflare read summary
- `packages/design-system`: initial design tokens/styles aligned to existing espacios.me dark minimal visual language.
- `packages/schemas`: shared typed models for repos, PRs, issues, deployments, workers, pages, environments, and dashboard cards.
- `packages/adapters-github`: read-only GitHub adapter with repo/PR/issue summary endpoints.
- `packages/adapters-cloudflare`: read-only Cloudflare adapter for workers + pages projects.
- `infrastructure/cloudflare/command-center.wrangler.jsonc`: deployment config starter.

## Why this architecture

- Keeps UI shell separate from provider adapters.
- Keeps provider contracts in `packages/schemas` for future `/bot`, `/mcp`, and `/admin` reuse.
- Defaults to read-only APIs and environment-based credentials.
- Allows independent hardening/extension without rewriting the app shell.

## Assumptions

- The command center can begin as a Worker-rendered HTML shell.
- Current token scopes are read-oriented and provided via environment variables.
- The visual language is based on current `espacios-main.html` style cues: restrained dark palette, subtle borders, and compact typography.

## What remains next

1. Add auth and role gates for operator access.
2. Add cached aggregation endpoints for GitHub and Cloudflare.
3. Add deployment/health rollups with event timelines.
4. Add `/bot`, `/mcp`, and `/admin` route surfaces into the same shell.
5. Add audit/event logging and policy enforcement for future command execution.

## Local run

```bash
pnpm --filter @espacios/command-center dev
```

## Deploy

```bash
pnpm --filter @espacios/command-center deploy
```
