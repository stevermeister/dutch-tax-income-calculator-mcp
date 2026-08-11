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

    if (url.pathname !== MCP_ROUTE) {
      return new Response(
        "dutch-tax-income-calculator MCP server. Connect your MCP client to " +
          `${MCP_ROUTE}. Indicative calculations only — not tax advice.`,
        { headers: { "content-type": "text/plain; charset=utf-8" } }
      );
    }

    return mcpHandler(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
