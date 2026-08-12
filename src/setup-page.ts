const REPO_URL = "https://github.com/stevermeister/dutch-tax-income-calculator-mcp";

export function renderSetupPage(mcpUrl: string): string {
  const claudeDesktopConfig = JSON.stringify(
    {
      mcpServers: {
        "dutch-tax-income-calculator": {
          command: "npx",
          args: ["mcp-remote", mcpUrl, "--transport", "http-only"],
        },
      },
    },
    null,
    2
  );

  const mcpJsonConfig = JSON.stringify(
    {
      servers: {
        "dutch-tax-income-calculator": {
          type: "http",
          url: mcpUrl,
        },
      },
    },
    null,
    2
  );

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Connect to the Dutch Tax MCP server</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: #ffffff;
    --fg: #1a1a1a;
    --muted: #5b5b5b;
    --card: #f6f6f7;
    --border: #e2e2e2;
    --accent: #b3541e;
    --code-bg: #1e1e1e;
    --code-fg: #e8e8e8;
    --warn-bg: #fff4e5;
    --warn-border: #f0c987;
    --warn-fg: #6b4400;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #14161a;
      --fg: #f0f0f0;
      --muted: #a3a3a3;
      --card: #1e2126;
      --border: #2c3038;
      --accent: #e8935b;
      --warn-bg: #2c2210;
      --warn-border: #6b4f14;
      --warn-fg: #f0c987;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--fg);
    font: 16px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  }
  main {
    max-width: 720px;
    margin: 0 auto;
    padding: 48px 20px 80px;
  }
  h1 { font-size: 1.7rem; margin-bottom: 0.3em; }
  h2 { font-size: 1.15rem; margin-top: 2.4em; border-top: 1px solid var(--border); padding-top: 1.4em; }
  p { color: var(--muted); }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.92em; }
  .endpoint {
    display: inline-block;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 14px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: var(--accent);
    font-size: 1.05rem;
    margin: 8px 0 4px;
  }
  .warn {
    background: var(--warn-bg);
    border: 1px solid var(--warn-border);
    color: var(--warn-fg);
    border-radius: 8px;
    padding: 14px 16px;
    margin: 20px 0;
    font-size: 0.95rem;
  }
  pre {
    background: var(--code-bg);
    color: var(--code-fg);
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    font-size: 0.85rem;
    line-height: 1.5;
  }
  ul { color: var(--muted); padding-left: 1.2em; }
  li { margin: 0.3em 0; }
  li code { color: var(--fg); }
  a { color: var(--accent); }
  footer { margin-top: 3em; color: var(--muted); font-size: 0.85rem; }
</style>
</head>
<body>
<main>
  <h1>Dutch Tax Income Calculator — MCP server</h1>
  <p>Connect any MCP client to the endpoint below to calculate Dutch net/gross salary, compare scenarios, and
  read official tax bracket data — all computed by the
  <a href="https://www.npmjs.com/package/dutch-tax-income-calculator" rel="noopener">dutch-tax-income-calculator</a>
  npm package, never reimplemented here.</p>

  <div class="warn">Indicative only — not tax advice. Confirm with a qualified Dutch tax advisor or the
  Belastingdienst before acting on any number this server returns.</div>

  <h2>Endpoint</h2>
  <div class="endpoint">${mcpUrl}</div>
  <p>Streamable HTTP transport. No authentication required. Rate-limited to 60 requests/minute per client.</p>

  <h2>Claude Desktop</h2>
  <p>Add this to your <code>claude_desktop_config.json</code> (Settings → Developer → Edit Config):</p>
  <pre>${escapeHtml(claudeDesktopConfig)}</pre>

  <h2>VS Code, Cursor, and other <code>mcp.json</code> clients</h2>
  <pre>${escapeHtml(mcpJsonConfig)}</pre>

  <h2>What's available</h2>
  <ul>
    <li><code>calculate_net_salary</code> — gross → net for a given tax year</li>
    <li><code>calculate_gross_from_net</code> — net → gross, including the package's own plateau / no-solution
      results when a net figure isn't uniquely (or at all) achievable</li>
    <li><code>compare_scenarios</code> — compare 2–5 salary scenarios side by side with a comparison table</li>
    <li><code>tax://brackets/{year}</code> — resource exposing the raw payroll tax, social security, and credit
      brackets for a given year</li>
  </ul>

  <h2>Privacy</h2>
  <p>No request bodies, tool arguments, or calculated amounts are ever logged.</p>

  <footer>Source and README: <a href="${REPO_URL}" rel="noopener">${REPO_URL}</a></footer>
</main>
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch] as string);
}
