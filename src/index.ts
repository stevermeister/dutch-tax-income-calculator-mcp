import { createMcpHandler } from "agents/mcp/server";

import { createServer } from "./server";
import { renderSetupPage } from "./setup-page";
import { renderPrivacyPage } from "./privacy-page";
import { ICON_PNG_BASE64 } from "./icon";
import type { Env } from "./env";

const MCP_ROUTE = "/mcp";
// .html on purpose: Angular's default service-worker config (thetax.nl's
// main app runs one) only treats extension-less URLs as SPA navigation
// routes to intercept from cache — a URL with a dot in the last segment
// falls through to the network, reaching this Worker instead of being
// served from the app shell's cache.
const SETUP_ROUTE = "/mcp/setup.html";
const LEGACY_SETUP_ROUTE = "/mcp/setup";
const PRIVACY_ROUTE = "/mcp/privacy.html";
const ICON_ROUTE = "/mcp/icon.png";

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
          `${MCP_ROUTE}. Setup instructions: ${url.origin}${SETUP_ROUTE}. Indicative calculations only — not tax advice.`,
        { headers: { "content-type": "text/plain; charset=utf-8" } }
      );
    }

    if (url.pathname === SETUP_ROUTE) {
      return new Response(renderSetupPage(`${url.origin}${MCP_ROUTE}`), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === PRIVACY_ROUTE) {
      return new Response(renderPrivacyPage(`${url.origin}${MCP_ROUTE}`), {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (url.pathname === ICON_ROUTE) {
      return new Response(ICON_BYTES, {
        headers: { "content-type": "image/png", "cache-control": "public, max-age=86400" },
      });
    }

    // Old extension-less URL: still susceptible to the service-worker
    // interception described above on a repeat visit, but redirects cleanly
    // for anyone hitting it fresh (no service worker installed yet).
    if (url.pathname === LEGACY_SETUP_ROUTE) {
      return Response.redirect(`${url.origin}${SETUP_ROUTE}`, 302);
    }

    // A browser navigating to /mcp directly — as opposed to an MCP client's
    // GET for the SSE stream, which asks for event-stream/json, not html —
    // is a person who landed on the wrong URL. Send them to the human
    // instructions instead of whatever the MCP handler would return.
    if (
      url.pathname === MCP_ROUTE &&
      request.method === "GET" &&
      (request.headers.get("accept") ?? "").includes("text/html")
    ) {
      return Response.redirect(`${url.origin}${SETUP_ROUTE}`, 302);
    }

    return mcpHandler(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
