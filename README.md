# dutch-tax-income-calculator-mcp

A remote [MCP](https://modelcontextprotocol.io) server, deployed on Cloudflare Workers, that exposes the
[`dutch-tax-income-calculator`](https://www.npmjs.com/package/dutch-tax-income-calculator) npm package as MCP
tools and a resource. This server never reimplements Dutch tax logic or copies tax tables — every calculation is
delegated directly to the package.

> **Indicative only — not tax advice.** Every tool result includes this disclaimer. Confirm with a qualified
> Dutch tax advisor or the Belastingdienst before acting on any number this server returns.

## What it exposes

### Tools

- **`calculate_net_salary`** — gross → net, wraps the package's `SalaryPaycheck` class.
- **`calculate_gross_from_net`** — net → gross, wraps the package's `netToGross` solver. Because every internal
  amount is rounded to 2 decimals, more than one gross can round to the same net; when that happens the tool
  returns the package's own plateau bounds (`grossLow` / `grossHigh`) verbatim instead of guessing. If no gross
  produces the target net, the package's "no solution" error message is returned verbatim, unmodified.
- **`compare_scenarios`** — runs 2 to 5 `calculate_net_salary`-shaped scenarios side by side and returns a
  markdown comparison table alongside the per-scenario results.

Every tool result returns: `normalizedInput`, `result`, `breakdown[]` (payroll tax, social security, general
credit, labour credit), `assumptions[]`, and a `permalink` to the equivalent scenario on
[thetax.nl](https://thetax.nl/).

### Resource

- **`tax://brackets/{year}`** — reads `data.json` from the package directly: payroll tax, social security,
  general credit and labour credit brackets, plus 30% ruling thresholds, for the requested year.

`year` is validated against the years actually present in the package's `data.json` on every tool call and
resource read. An unsupported year always returns a clear, explicit error — never a silent fallback to the
nearest year.

## Stack

- [MCP TypeScript SDK v2](https://ts.sdk.modelcontextprotocol.io/v2/) (`@modelcontextprotocol/server`)
- [`createMcpHandler`](https://developers.cloudflare.com/agents/model-context-protocol/mcp-handler-api/) from
  `agents/mcp/server` (Cloudflare Agents SDK) as the entire Worker `fetch` handler — stateless, no Durable
  Objects, no `McpAgent`. `createMcpHandler` is given a **factory function** (`createServer`) that builds a
  fresh `McpServer` per request; no server or transport instance is ever held in module scope.
- [Zod v4](https://zod.dev/) for input validation
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) + [Vitest](https://vitest.dev/)
  (`@cloudflare/vitest-pool-workers`)

No Hono, no Express — `src/index.ts` is the whole HTTP layer.

## Rate limiting & privacy

- **60 requests/minute per client IP**, enforced via a Cloudflare [Rate Limiting
  binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) (`wrangler.jsonc`), on
  every request. Exceeding it returns `429` with a `Retry-After` header.
- **Zero logging of input values.** The handler never logs request bodies, tool arguments, or calculated
  amounts. The client IP is used only as an ephemeral rate-limit counter key, never stored or logged.
- Full policy at [`thetax.nl/privacy`](https://thetax.nl/privacy).

## Development

```bash
npm install
npm run dev        # wrangler dev, http://localhost:8787/mcp
npm test           # vitest (unit tests + Worker-level MCP/HTTP integration tests)
npm run typecheck
npm run deploy      # wrangler deploy
```

## Connecting a client

The server speaks the MCP Streamable HTTP transport at `/mcp`.

### Claude Desktop

Claude Desktop connects to remote MCP servers through the [`mcp-remote`](https://www.npmjs.com/package/mcp-remote)
bridge. Add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "dutch-tax-income-calculator": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://thetax.nl/mcp",
        "--transport",
        "http-only"
      ]
    }
  }
}
```

### `mcp.json` (VS Code, Cursor, and other clients supporting the standard config format)

```json
{
  "servers": {
    "dutch-tax-income-calculator": {
      "type": "http",
      "url": "https://thetax.nl/mcp"
    }
  }
}
```

Deployed at `thetax.nl/mcp` (path-scoped routes on the existing `thetax.nl` zone, not a custom domain — the
rest of the site is unaffected). A human-readable documentation page with these same instructions, plus the
full input/output schema for every tool, is served at [`thetax.nl/docs`](https://thetax.nl/docs). If you
deploy your own copy, replace the URL with the workers.dev subdomain `npm run deploy` assigns (or your own
domain/route).

## Project layout

```
src/
  index.ts          Worker fetch handler: per-IP rate limit + createMcpHandler(createServer)
  server.ts          createServer() factory — registers the 3 tools and the tax://brackets/{year} resource
  docs-page.ts        Renders the /docs page (setup instructions + full tool schemas)
  privacy-page.ts     Renders the /privacy policy
  terms-page.ts       Renders the /terms of service
  icon.ts             Base64-embedded PNG served at /mcp/icon.png
  env.ts             Env (RATE_LIMITER binding, OPENAI_APPS_CHALLENGE_TOKEN) type
  tax/
    schemas.ts        Zod v4 input schemas
    years.ts           Year validation against the package's constants.years
    paycheck.ts        Thin wrappers around SalaryPaycheck / netToGross — no tax logic here
    breakdown.ts       breakdown[] / assumptions[] builders
    permalink.ts       thetax.nl permalink builder
    compare.ts         Comparison table builder for compare_scenarios
test/                 Vitest unit tests + Worker-level MCP/HTTP integration tests
```

### Routes

| Path | Purpose |
|---|---|
| `/mcp` | MCP Streamable HTTP endpoint |
| `/docs` | Documentation: setup instructions + full tool schemas |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/mcp/icon.png` | Connector icon |
| `/.well-known/openai-apps-challenge` | OpenAI App Directory domain-verification token (404 until `OPENAI_APPS_CHALLENGE_TOKEN` is set) |

`/mcp/setup(.html)`, `/mcp/privacy.html`, and `/mcp/terms.html` redirect to the routes above for continuity.
