const CONTROLLER = "Edviso BV";
const CONTACT_EMAIL = "stevermeister@gmail.com";
const LAST_UPDATED = "17 August 2026";
const REPO_URL = "https://github.com/stevermeister/dutch-tax-income-calculator-mcp";

export function renderTermsPage(mcpUrl: string): string {
  const origin = new URL(mcpUrl).origin;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Terms of Service — Dutch Tax Income Calculator MCP server</title>
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
  <h1>Terms of Service</h1>
  <p class="updated">Dutch Tax Income Calculator MCP server (<code>${mcpUrl}</code>) · Provided by: ${CONTROLLER}
  · Last updated: ${LAST_UPDATED}</p>

  <div class="summary">
    <p><strong>In short:</strong> this is a free, indicative calculator, not tax advice, provided "as is" by
    ${CONTROLLER} with no warranty of accuracy. Don't rely on it for filing or financial decisions without
    independent confirmation.</p>
  </div>

  <h2>The service</h2>
  <p>${CONTROLLER} operates this server, which exposes Dutch salary/tax calculations — net-from-gross,
  gross-from-net, scenario comparisons, and official tax bracket lookups — over the Model Context Protocol,
  for use by AI assistants and their users. Every calculation is delegated to the open-source
  <a href="https://www.npmjs.com/package/dutch-tax-income-calculator" rel="noopener">dutch-tax-income-calculator</a>
  package; this server does not implement or alter the underlying tax logic.</p>

  <h2>Not tax advice</h2>
  <p>Results are indicative only. They are not tax, legal, or financial advice, and are not a substitute for
  guidance from a qualified Dutch tax advisor or the Belastingdienst. You are responsible for independently
  verifying any figure before relying on it.</p>

  <h2>No warranty</h2>
  <p>This service is provided "as is" and "as available," without warranties of any kind, express or implied,
  including as to accuracy, completeness, or fitness for a particular purpose. Tax rules change; a given tax
  year's brackets may be added, corrected, or become outdated between package updates.</p>

  <h2>Limitation of liability</h2>
  <p>To the maximum extent permitted by law, ${CONTROLLER} is not liable for any damages, losses, or costs
  arising from use of, or inability to use, this service, including any decision taken in reliance on a
  calculated result.</p>

  <h2>Availability and rate limits</h2>
  <p>The service is rate-limited to 60 requests per minute per client and may be modified, interrupted, or
  discontinued at any time without notice. No uptime guarantee is made.</p>

  <h2>Acceptable use</h2>
  <p>Don't attempt to circumvent the rate limit, use the service to attack or degrade the underlying
  infrastructure, or use it for any unlawful purpose.</p>

  <h2>Governing law</h2>
  <p>These terms are governed by the laws of the Netherlands, without regard to conflict-of-law principles.</p>

  <h2>Changes to these terms</h2>
  <p>These terms may be updated from time to time. Continued use of the service after a change constitutes
  acceptance of the updated terms.</p>

  <h2>Source and contact</h2>
  <p>Source code: <a href="${REPO_URL}" rel="noopener">${REPO_URL}</a>. Questions:
  <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>. See also the
  <a href="${origin}/privacy" rel="noopener">Privacy Policy</a>.</p>
</main>
</body>
</html>
`;
}
