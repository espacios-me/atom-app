# Deploying `/coms` on `espacios.me`

This repository now serves `/coms` directly from the main Cloudflare Worker (`src/index.ts`) so the command center can ship without replacing current surfaces.

## Routes

- `/coms` → command center UI (server-rendered HTML + client fetch)
- `/api/coms/overview` → backend aggregate of GitHub + Cloudflare summaries
- `/api/coms/insight` → Gemini-generated operational note from current overview

## Required secrets / vars (Wrangler)

Set these as Cloudflare Worker secrets/vars:

- `GITHUB_TOKEN` (read-only scopes)
- `GITHUB_ORG` (e.g. `espacios-me`)
- `GITHUB_REPO` (default focus repo)
- `CLOUDFLARE_API_TOKEN` (read-only account scope)
- `CLOUDFLARE_ACCOUNT_ID`
- `GEMINI_API_KEY` (for `/api/coms/insight`)

## Commands

```bash
# local
pnpm dev

# set secrets
wrangler secret put GITHUB_TOKEN
wrangler secret put CLOUDFLARE_API_TOKEN
wrangler secret put GEMINI_API_KEY

# set non-secret vars in wrangler.jsonc or dashboard
# deploy
pnpm deploy
```

## Security defaults

- Adapters are read-oriented only.
- No destructive cloud actions are implemented.
- Tokens are never rendered in UI.
- `/api/coms/*` returns summary payloads only.
