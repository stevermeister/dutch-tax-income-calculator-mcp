const CONTROLLER = "Edviso BV";
const CONTACT_EMAIL = "stevermeister@gmail.com";
const LAST_UPDATED = "17 August 2026";

export function renderPrivacyPage(mcpUrl: string): string {
  const origin = new URL(mcpUrl).origin;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Privacy Policy — Dutch Tax Income Calculator MCP server</title>
<link rel="icon" type="image/png" href="${origin}/mcp/icon.png" />
<style>
  :root {
    color-scheme: light dark;
    --bg: #ffffff;
    --fg: #1a1a1a;
    --muted: #5b5b5b;
    --card: #f6f6f7;
    --border: #e2e2e2;
    --accent: #b3541e;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #14161a;
      --fg: #f0f0f0;
      --muted: #a3a3a3;
      --card: #1e2126;
      --border: #2c3038;
      --accent: #e8935b;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--fg);
    font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  }
  main { max-width: 720px; margin: 0 auto; padding: 48px 20px 80px; }
  h1 { font-size: 1.6rem; margin-bottom: 0.2em; }
  h2 { font-size: 1.1rem; margin-top: 2em; }
  p, li { color: var(--muted); }
  .updated { color: var(--muted); font-size: 0.9rem; margin-top: 0; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.92em; color: var(--fg); }
  .summary {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 16px 20px;
    margin: 20px 0;
  }
  .summary p { color: var(--fg); margin: 0.4em 0; }
  a { color: var(--accent); }
</style>
</head>
<body>
<main>
  <h1>Privacy Policy</h1>
  <p class="updated">Dutch Tax Income Calculator MCP server (<code>${mcpUrl}</code>) · Controller: ${CONTROLLER}
  · Last updated: ${LAST_UPDATED}</p>

  <div class="summary">
    <p><strong>In short:</strong> this server has no user accounts, no cookies, and no database. It computes
    a tax result from the numbers you provide and returns it — nothing about that request is stored or
    logged.</p>
  </div>

  <h2>Data collection</h2>
  <p>The server accepts calculation inputs (income figures, tax year, and similar parameters) with each tool
  call. These values are used only to compute the response for that single request. No account, sign-in,
  cookie, or personal identifier is required, requested, or set.</p>

  <h2>Usage and storage</h2>
  <p>Salary inputs, tool arguments, calculated results, and request bodies are never written to a log,
  database, or file. There is nothing to retrieve later because nothing is kept — the code path that would log
  this data doesn't exist. Your client's IP address is used only as a transient key for a rate limiter (60
  requests per minute per client), through a Cloudflare-managed counter; it is not stored beyond that rolling
  window and is never associated with request content.</p>
  <p>The hosting platform (Cloudflare) may capture standard, low-level operational metrics for reliability and
  abuse prevention — request counts, status codes, latency — the same as any web service running on its
  infrastructure. This is platform-level and does not include tool arguments or calculated values.</p>

  <h2>Cookies</h2>
  <p>None. This server sets no cookies and uses no browser or client-side storage.</p>

  <h2>Third-party sharing</h2>
  <p>None. This server doesn't call any third-party API and doesn't send request data anywhere except back to
  the client that made the request. All calculations run against the open-source
  <a href="https://www.npmjs.com/package/dutch-tax-income-calculator" rel="noopener">dutch-tax-income-calculator</a>
  package, in-process — no external network call is made to compute a result.</p>

  <h2>Data retention</h2>
  <p>None. There is no data store, so there is nothing to retain or delete.</p>

  <h2>Contact</h2>
  <p>Controller: ${CONTROLLER}. Questions or concerns about this policy:
  <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>. See also the
  <a href="${origin}/terms" rel="noopener">Terms of Service</a>.</p>
</main>
</body>
</html>
`;
}
