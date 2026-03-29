import { handleComs } from "./coms/handler";

// espacios.me — Cloudflare Worker
// Serves all static HTML pages with proper routing

interface Env {
  ASSETS: Fetcher;
  GITHUB_TOKEN?: string;
  GITHUB_ORG?: string;
  GITHUB_REPO?: string;
  CLOUDFLARE_API_TOKEN?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  GEMINI_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const comsResponse = await handleComs(request, env);
    if (comsResponse) {
      return comsResponse;
    }

    // Route /atom → atom-landing.html
    if (path === "/atom" || path === "/atom/") {
      url.pathname = "/atom-landing.html";
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    // Route /privacy → espacios-privacy.html
    if (path === "/privacy" || path === "/privacy/") {
      url.pathname = "/espacios-privacy.html";
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    // Route /terms → espacios-terms.html
    if (path === "/terms" || path === "/terms/") {
      url.pathname = "/espacios-terms.html";
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    // Route /atom/privacy → atom-privacy.html
    if (path === "/atom/privacy" || path === "/atom/privacy/") {
      url.pathname = "/atom-privacy.html";
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    // Route /atom/terms → atom-terms.html
    if (path === "/atom/terms" || path === "/atom/terms/") {
      url.pathname = "/atom-terms.html";
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }


    // Route /espacvios/me-marketing-guildelines → espacios-me-marketing-guidelines.html
    if (path === "/espacvios/me-marketing-guildelines" || path === "/espacvios/me-marketing-guildelines/" ||
        path === "/espacios/me-marketing-guidelines" || path === "/espacios/me-marketing-guidelines/" ||
        path === "/me-marketing-guidelines" || path === "/me-marketing-guidelines/") {
      url.pathname = "/espacios-me-marketing-guidelines.html";
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

        // Route /botspace → botspace.html
    if (path === "/botspace" || path === "/botspace/") {
      url.pathname = "/botspace.html";
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }
        // Route /drive → drive.html
    if (path === "/drive" || path === "/drive/") {
      url.pathname = "/drive.html";
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    // Governance overlay routes
    // Route /bot → botspace.html (operator command surface)
    if (path === "/bot" || path === "/bot/") {
      url.pathname = "/botspace.html";
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    // Route /mcp → drive.html (machine protocol surface placeholder)
    if (path === "/mcp" || path === "/mcp/") {
      url.pathname = "/drive.html";
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    // Route /admin → /coms (executive/operator dashboard entry)
    if (path === "/admin" || path === "/admin/") {
      return Response.redirect(`${url.origin}/coms`, 302);
    }

    // Root → espacios-main.html
    if (path === "/" || path === "") {
      url.pathname = "/espacios-main.html";
      return env.ASSETS.fetch(new Request(url.toString(), request));
    }

    // All other paths — try assets directly (e.g. /espacios-main.html)
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
// Success Test: Auto-deploy is active
