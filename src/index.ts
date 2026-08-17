import { createMcpHandler } from "agents/mcp/server";

import { createServer } from "./server";
import { renderDocsPage } from "./docs-page";
import { renderPrivacyPage } from "./privacy-page";
import { renderTermsPage } from "./terms-page";
import { ICON_PNG_BASE64 } from "./icon";
import type { Env } from "./env";

const MCP_ROUTE = "/mcp";
const DOCS_ROUTE = "/docs";
const PRIVACY_ROUTE = "/privacy";
const TERMS_ROUTE = "/terms";
const ICON_ROUTE = "/mcp/icon.png";
const OPENAI_CHALLENGE_ROUTE = "/.well-known/openai-apps-challenge";

// Paths content used to live at, before consolidating onto clean top-level
// URLs (/docs, /privacy, /terms) for the ChatGPT App Directory submission.
// Redirected, not removed, so anything that already linked the old paths
// keeps working.
const LEGACY_REDIRECTS: Record<string, string> = {
  "/mcp/setup": DOCS_ROUTE,
  "/mcp/setup.html": DOCS_ROUTE,
  "/mcp/privacy.html": PRIVACY_ROUTE,
  "/mcp/terms.html": TERMS_ROUTE,
};

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const ICON_BYTES = base64ToBytes(ICON_PNG_BASE64);

const mcpHandler = createMcpHandler(createServer, {
  route: MCP_ROUTE,
  responseMode: "json",
});

function rateLimitedResponse(): Response {
  return new Response(
    JSON.stringify({
      error: "rate_limit_exceeded",
      message: "Too many requests. Limit is 60 requests per minute per client.",
    }),
    {
      status: 429,
      headers: { "content-type": "application/json", "retry-after": "60" },
    }
  );
}

export default {
  async fetch(request, env, ctx) {
    // Per-IP rate limit, Cloudflare-managed counter — no request bodies or
    // input values are logged anywhere in this handler.
    const clientIp = request.headers.get("cf-connecting-ip") ?? "unknown";
    const { success } = await env.RATE_LIMITER.limit({ key: clientIp });
    if (!success) {
      return rateLimitedResponse();
    }

    // Normalize a trailing slash (e.g. "/mcp/" -> "/mcp") before routing.
    // People (and apparently some connector UIs) type the URL either way,
    // and a client that always calls the exact URL it was given — including
    // the slash — would otherwise 404 on every request.
    let url = new URL(request.url);
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url = new URL(url);
      url.pathname = url.pathname.slice(0, -1);
      request = new Request(url.toString(), request);
    }

    // Only the bare root gets the friendly landing message. Everything else —
    // including .well-known/oauth-* discovery paths — falls through to the
    // MCP handler so it 404s naturally; this server has no auth, and clients
    // that probe those well-known URLs need a real 404 to conclude that,
    // rather than a 200 with an unrelated body that sends them into a broken
    // OAuth registration attempt.
    if (url.pathname === "/") {
      return new Response(
        "dutch-tax-income-calculator MCP server. Connect your MCP client to " +
          `${MCP_ROUTE}. Docs: ${url.origin}${DOCS_ROUTE}. Indicative calculations only — not tax advice.`,
        { headers: { "content-type": "text/plain; charset=utf-8" } }
      );
    }

    if (url.pathname === DOCS_ROUTE) {
      return new Response(renderDocsPage(`${url.origin}${MCP_ROUTE}`), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === PRIVACY_ROUTE) {
      return new Response(renderPrivacyPage(`${url.origin}${MCP_ROUTE}`), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === TERMS_ROUTE) {
      return new Response(renderTermsPage(`${url.origin}${MCP_ROUTE}`), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === ICON_ROUTE) {
      return new Response(ICON_BYTES, {
        headers: { "content-type": "image/png", "cache-control": "public, max-age=86400" },
      });
    }

    if (url.pathname === OPENAI_CHALLENGE_ROUTE) {
      const token = env.OPENAI_APPS_CHALLENGE_TOKEN;
      if (!token) {
        return new Response("Not Found", { status: 404 });
      }
      // Exactly the token, nothing else: no JSON wrapper, no trailing newline.
      return new Response(token, { headers: { "content-type": "text/plain; charset=utf-8" } });
    }

    const legacyTarget = LEGACY_REDIRECTS[url.pathname];
    if (legacyTarget) {
      return Response.redirect(`${url.origin}${legacyTarget}`, 302);
    }

    // A browser navigating to /mcp directly — as opposed to an MCP client's
    // GET for the SSE stream, which asks for event-stream/json, not html —
    // is a person who landed on the wrong URL. Send them to the docs
    // instead of whatever the MCP handler would return.
    if (
      url.pathname === MCP_ROUTE &&
      request.method === "GET" &&
      (request.headers.get("accept") ?? "").includes("text/html")
    ) {
      return Response.redirect(`${url.origin}${DOCS_ROUTE}`, 302);
    }

    return mcpHandler(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
