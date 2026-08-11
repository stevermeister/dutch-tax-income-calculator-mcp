import { createMcpHandler } from "agents/mcp/server";

import { createServer } from "./server";
import type { Env } from "./env";

const MCP_ROUTE = "/mcp";

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

    const url = new URL(request.url);

    // Only the bare root gets the friendly landing message. Everything else —
    // including .well-known/oauth-* discovery paths — falls through to the
    // MCP handler so it 404s naturally; this server has no auth, and clients
    // that probe those well-known URLs need a real 404 to conclude that,
    // rather than a 200 with an unrelated body that sends them into a broken
    // OAuth registration attempt.
    if (url.pathname === "/") {
      return new Response(
        "dutch-tax-income-calculator MCP server. Connect your MCP client to " +
          `${MCP_ROUTE}. Indicative calculations only — not tax advice.`,
        { headers: { "content-type": "text/plain; charset=utf-8" } }
      );
    }

    return mcpHandler(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
