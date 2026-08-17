import {
  DEVELOPER_MODE,
  PLUGINS_TAB,
  BROWSE_PLUGINS,
  NEW_PLUGIN_FORM,
  CONNECT_CONFIRM as CHATGPT_CONNECT_CONFIRM,
} from "./chatgpt-screenshots";
import {
  CONNECTORS_ADD_MENU,
  ADD_CUSTOM_CONNECTOR_FORM,
  CONNECT_CONFIRM as CLAUDE_CONNECT_CONFIRM,
} from "./claude-screenshots";

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
<title>Connect the Dutch Tax Calculator to Claude or ChatGPT</title>
<link rel="icon" type="image/png" href="${new URL(mcpUrl).origin}/mcp/icon.png" />
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
    --step-bg: #ffffff;
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
      --step-bg: #1a1c20;
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
    max-width: 780px;
    margin: 0 auto;
    padding: 48px 20px 80px;
  }
  h1 { font-size: 1.7rem; margin-bottom: 0.3em; }
  h2 { font-size: 1.3rem; margin: 0 0 0.2em; }
  p { color: var(--muted); }
  .lede { font-size: 1.05rem; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.92em; }
  .url-box {
    display: block;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 16px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    color: var(--accent);
    font-size: 1.1rem;
    margin: 10px 0 4px;
    word-break: break-all;
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
  .app-card {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    margin: 28px 0;
    background: var(--card);
  }
  .app-card h2 { display: flex; align-items: center; gap: 10px; }
  .badge {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 2px 10px;
  }
  ol.steps { padding-left: 1.3em; margin: 1em 0 0; }
  ol.steps li { margin: 0 0 22px; color: var(--fg); }
  ol.steps li p { margin: 4px 0 0; }
  .screenshot {
    margin-top: 10px;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    background: var(--step-bg);
  }
  .screenshot img { display: block; width: 100%; }
  ul.features { color: var(--muted); padding-left: 1.2em; }
  ul.features li { margin: 0.3em 0; }
  ul.features li code { color: var(--fg); }
  .prompts { list-style: none; padding: 0; margin: 14px 0 0; }
  .prompts li {
    background: var(--card);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: 8px;
    padding: 12px 16px;
    margin: 10px 0;
    color: var(--fg);
    font-size: 0.95rem;
  }
  a { color: var(--accent); }
  details {
    margin-top: 3em;
    border-top: 1px solid var(--border);
    padding-top: 1.2em;
  }
  summary { cursor: pointer; font-weight: 600; color: var(--fg); }
  details pre {
    background: var(--code-bg);
    color: var(--code-fg);
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    font-size: 0.85rem;
    line-height: 1.5;
    margin-top: 1em;
  }
  footer { margin-top: 2em; color: var(--muted); font-size: 0.85rem; }
</style>
</head>
<body>
<main>
  <h1>Dutch Tax Income Calculator</h1>
  <p class="lede">Ask Claude or ChatGPT a question about Dutch salary, tax, or take-home pay, and get a real
  answer computed from the official brackets — no spreadsheet, no manually looking up rates. Setup takes about
  two minutes.</p>

  <div class="warn">Indicative only — not tax advice. Confirm with a qualified Dutch tax advisor or the
  Belastingdienst before acting on any number this returns.</div>

  <p><strong>Server address</strong> — you'll paste this into Claude or ChatGPT below:</p>
  <div class="url-box">${mcpUrl}</div>

  <p style="margin-top:28px;"><strong>Once connected, just ask things like:</strong></p>
  <ul class="prompts">
    <li>"What's my net salary if I earn €65,000 gross in 2026?"</li>
    <li>"How much do I need to earn gross to take home €3,500 a month?"</li>
    <li>"Compare my take-home pay at €50k vs €60k gross, with and without the 30% ruling"</li>
    <li>"What are the 2026 Dutch payroll tax brackets?"</li>
  </ul>

  <section class="app-card">
    <h2>Claude <span class="badge">Claude.ai &amp; Claude Desktop</span></h2>
    <ol class="steps">
      <li>Open <strong>Settings → Connectors</strong>, click <strong>Add</strong> (top right), then
        <strong>Add custom connector</strong>.
        <div class="screenshot"><img src="${CONNECTORS_ADD_MENU}" alt="Claude Settings → Connectors page, with the Add menu open showing Browse connectors and Add custom connector" /></div>
      </li>
      <li>Enter a name (e.g. "Dutch Tax Calculator") in the first field, and the server address from above
        in the second field. Leave <strong>Advanced settings</strong> (OAuth Client ID / Secret) empty — this
        server doesn't need them — then click <strong>Add</strong>.
        <div class="screenshot"><img src="${ADD_CUSTOM_CONNECTOR_FORM}" alt="Claude Add custom connector dialog filled in with a name and the server URL" /></div>
      </li>
      <li>Click <strong>Connect</strong>.
        <div class="screenshot"><img src="${CLAUDE_CONNECT_CONFIRM}" alt="Claude connector detail page showing a Connect button before the connector is connected" /></div>
      </li>
      <li>In any chat, open the <strong>+</strong> menu and turn the connector on to start using it.</li>
    </ol>
  </section>

  <section class="app-card">
    <h2>ChatGPT <span class="badge">Web, Developer mode required</span></h2>
    <ol class="steps">
      <li>Go to <strong>Settings → Security and login</strong> and turn on <strong>Developer mode</strong>
        (only needs to be done once). ChatGPT will flag it as elevated risk — that's expected, it's what
        gates custom/unverified connectors like this one.
        <div class="screenshot"><img src="${DEVELOPER_MODE}" alt="ChatGPT Settings → Security and login, with the Developer mode toggle turned on" /></div>
      </li>
      <li>Go to <strong>Settings → Plugins</strong>.
        <div class="screenshot"><img src="${PLUGINS_TAB}" alt="ChatGPT Settings → Plugins page, listing installed plugins and a Browse plugins entry" /></div>
      </li>
      <li>Click <strong>Browse plugins</strong>, then the <strong>+</strong> button in the top right.
        <div class="screenshot"><img src="${BROWSE_PLUGINS}" alt="ChatGPT Plugins gallery with a + button in the top right to add a new plugin" /></div>
      </li>
      <li>Fill in the form: a <strong>Name</strong> (e.g. "Dutch Income Tax"), under <strong>Connection</strong>
        choose <strong>Server URL</strong> and paste the server address from above, set
        <strong>Authentication</strong> to <strong>No Auth</strong>, tick <strong>"I understand and want to
        continue"</strong>, then click <strong>Create</strong>.
        <div class="screenshot"><img src="${NEW_PLUGIN_FORM}" alt="ChatGPT New Plugin form filled in with name, server URL, and No Auth selected" /></div>
      </li>
      <li>Click <strong>Connect</strong> in the confirmation popup.
        <div class="screenshot"><img src="${CHATGPT_CONNECT_CONFIRM}" alt="ChatGPT confirmation popup to add the plugin, with a Connect button" /></div>
      </li>
      <li>It's now in your installed plugins — use it from the Plugins (<strong>@</strong>) menu in any chat.</li>
    </ol>
  </section>

  <h2 style="margin-top:2.5em;">What it can do</h2>
  <ul class="features">
    <li>Calculate net salary from gross income, for any supported tax year</li>
    <li>Work backwards from a target net salary to find the matching gross</li>
    <li>Compare 2–5 salary scenarios side by side (different years, hours, 30% ruling, etc.)</li>
    <li>Look up the official payroll tax, social security, and credit brackets for a given year</li>
  </ul>

  <details>
    <summary>For developers</summary>
    <p>Streamable HTTP MCP transport, no authentication, rate-limited to 60 requests/minute per client.</p>

    <p><code>claude_desktop_config.json</code> (manual config via the
    <a href="https://www.npmjs.com/package/mcp-remote" rel="noopener">mcp-remote</a> bridge):</p>
    <pre>${escapeHtml(claudeDesktopConfig)}</pre>

    <p><code>mcp.json</code> (VS Code, Cursor, and other clients supporting the standard config format):</p>
    <pre>${escapeHtml(mcpJsonConfig)}</pre>

    <p>Source and README: <a href="${REPO_URL}" rel="noopener">${REPO_URL}</a></p>
  </details>

  <footer>No request bodies, tool arguments, or calculated amounts are ever logged. ·
    <a href="${new URL(mcpUrl).origin}/mcp/privacy.html" rel="noopener">Privacy Policy</a> ·
    <a href="${new URL(mcpUrl).origin}/mcp/terms.html" rel="noopener">Terms of Service</a></footer>
</main>
</body>
</html>
`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch] as string);
}
