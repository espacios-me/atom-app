# Security Audit — March 29, 2026

## Scope
- Backend runtime entrypoint and middleware configuration.
- WhatsApp webhook authentication and verification flow.

## Findings

### 1) Overly permissive CORS with credentials (High)
**Observed:** The API reflected any incoming `Origin` while also enabling `Access-Control-Allow-Credentials: true`.

**Risk:** Any third-party site could cause authenticated browsers to send credentialed cross-origin requests to the API.

**Remediation implemented:**
- Added an explicit origin allowlist controlled by `CORS_ALLOWED_ORIGINS` (comma-separated).
- Added safe local defaults for development only (`http://localhost:8081`, `http://localhost:3000`).
- Preflight requests from non-allowlisted origins now return `403`.

### 2) Predictable fallback webhook verify token (High)
**Observed:** WhatsApp webhook verification used a hardcoded fallback token when `WEBHOOK_VERIFY_TOKEN` was absent.

**Risk:** Deployments missing the environment variable could be exposed to unauthorized webhook verification attempts using a guessable value.

**Remediation implemented:**
- Removed fallback token behavior.
- Server now throws at startup when `WEBHOOK_VERIFY_TOKEN` is missing.

### 3) Missing webhook signature validation (Medium)
**Observed:** Incoming WhatsApp webhook POST requests were accepted without validating `X-Hub-Signature-256`.

**Risk:** Attackers could submit forged webhook events.

**Remediation implemented:**
- Added request raw-body capture in JSON middleware.
- Added optional HMAC SHA-256 signature validation when `WHATSAPP_APP_SECRET` is configured.
- Invalid/missing signatures now return `401`.

## Operational follow-ups
- Set `CORS_ALLOWED_ORIGINS` explicitly in each environment.
- Set `WHATSAPP_APP_SECRET` in production so signature verification is enforced.
- Rotate `WEBHOOK_VERIFY_TOKEN` and `WHATSAPP_TOKEN` as part of standard secret hygiene.
