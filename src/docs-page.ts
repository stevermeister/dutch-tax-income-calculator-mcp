import { z } from "zod";

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
import {
  CalculateNetSalaryInput,
  CalculateGrossFromNetInput,
  CompareScenariosInput,
} from "./tax/schemas";

const REPO_URL = "https://github.com/stevermeister/dutch-tax-income-calculator-mcp";
const SUPPORT_EMAIL = "stevermeister@gmail.com";

const OUTPUT_SHAPE_COMMON = `{
  "normalizedInput": { /* the validated input, with defaults filled in */ },
  "result": { /* full computed paycheck: grossYear, netYear, netMonth, incomeTax, ... */ },
  "breakdown": [
    { "label": "Payroll tax (loonbelasting)", "amountYear": -2916, "amountMonth": -243 },
    { "label": "Social security contributions (volksverzekeringen)", "amountYear": -9954, "amountMonth": -829.5 },
    { "label": "General tax credit (algemene heffingskorting)", "amountYear": 2714.29, "amountMonth": 226.19 },
    { "label": "Labour tax credit (arbeidskorting)", "amountYear": 5498.04, "amountMonth": 458.17 }
  ],
  "assumptions": [ "This result is indicative only and is not tax advice ...", "..." ],
  "permalink": "https://thetax.nl/?year=2026&startFrom=Year&salary=36000&..."
}`;

function escapeHtml(value: string): string {
  return value.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[ch] as string);
}

export function renderDocsPage(mcpUrl: string): string {
  const origin = new URL(mcpUrl).origin;

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
    { servers: { "dutch-tax-income-calculator": { type: "http", url: mcpUrl } } },
    null,
    2
  );

  const netSalarySchema = JSON.stringify(z.toJSONSchema(CalculateNetSalaryInput), null, 2);
  const grossFromNetSchema = JSON.stringify(z.toJSONSchema(CalculateGrossFromNetInput), null, 2);
  const compareScenariosSchema = JSON.stringify(z.toJSONSchema(CompareScenariosInput), null, 2);

  const claudeCodeCommand = `claude mcp add --transport http dutch-tax-income-calculator ${mcpUrl}`;
  const codexPrompt =
    `Add a remote MCP server to my Codex CLI config. Edit ~/.codex/config.toml ` +
    `(or ./.codex/config.toml for this project only) and add:\n\n` +
    `[mcp_servers.dutch-tax-income-calculator]\nurl = "${mcpUrl}"\n\n` +
    `No authentication is needed, so no bearer_token_env_var or http_headers are required. ` +
    `Then confirm the entry was added correctly.`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Dutch Tax Income Calculator — Documentation</title>
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
  main { max-width: 780px; margin: 0 auto; padding: 48px 20px 80px; }
  h1 { font-size: 1.7rem; margin-bottom: 0.3em; }
  h2 { font-size: 1.3rem; margin: 2em 0 0.2em; }
  h3 { font-size: 1.05rem; margin: 1.6em 0 0.3em; }
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
  .app-card h2 { display: flex; align-items: center; gap: 10px; margin-top: 0; }
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
  .copy-box {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: var(--code-bg);
    color: var(--code-fg);
    border-radius: 8px;
    padding: 14px 16px;
    margin: 10px 0 4px;
  }
  .copy-box code {
    flex: 1;
    color: var(--code-fg);
    font-size: 0.85rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }
  .copy-btn {
    flex-shrink: 0;
    background: var(--accent);
    color: #ffffff;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
  }
  .copy-btn:hover { opacity: 0.9; }
  details {
    margin-top: 1.4em;
    border-top: 1px solid var(--border);
    padding-top: 1.2em;
  }
  summary { cursor: pointer; font-weight: 600; color: var(--fg); }
  pre {
    background: var(--code-bg);
    color: var(--code-fg);
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    font-size: 0.82rem;
    line-height: 1.5;
    margin-top: 0.8em;
  }
  footer { margin-top: 2em; color: var(--muted); font-size: 0.85rem; }
</style>
</head>
<body>
<main>
  <h1>Dutch Tax Income Calculator</h1>
  <p class="lede">A remote MCP server that calculates Dutch net/gross salary, compares scenarios, and looks up
  official tax brackets, so an AI assistant can answer real salary and tax questions instead of guessing.
  Every calculation is delegated to the open-source
  <a href="https://www.npmjs.com/package/dutch-tax-income-calculator" rel="noopener">dutch-tax-income-calculator</a>
  package — this server never reimplements tax logic or tax tables itself.</p>

  <div class="warn">Indicative only — not tax advice. Confirm with a qualified Dutch tax advisor or the
  Belastingdienst before acting on any number this returns.</div>

  <p><strong>Server address</strong> — paste this into Claude or ChatGPT below:</p>
  <div class="url-box">${mcpUrl}</div>
  <p>All three tools are <strong>read-only and require no authentication</strong> — nothing is written,
  changed, or deleted, and there's no sign-in step.</p>

  <p style="margin-top:28px;"><strong>Example prompts, once connected:</strong></p>
  <ul class="prompts">
    <li>"What's my net salary if I earn €65,000 gross in 2026?"</li>
    <li>"How much do I need to earn gross to take home €3,500 a month?"</li>
    <li>"Compare my take-home pay at €50k vs €60k gross, with and without the 30% ruling"</li>
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

  <section class="app-card">
    <h2>Claude Code &amp; Codex CLI <span class="badge">Terminal</span></h2>
    <p>These are coding agents with shell/file access, so instead of clicking through settings, just hand
    them the command or prompt below and let them do it.</p>

    <h3>Claude Code</h3>
    <p>A real CLI command — run it directly in your terminal:</p>
    <div class="copy-box">
      <code id="claude-code-cmd">${escapeHtml(claudeCodeCommand)}</code>
      <button class="copy-btn" type="button" data-copy-target="claude-code-cmd">Copy</button>
    </div>

    <h3>Codex CLI</h3>
    <p>Codex's CLI only has a one-liner for local (stdio) servers; for a remote HTTP server like this one it
    needs a <code>config.toml</code> edit. Paste this into Codex chat and let it make the edit:</p>
    <div class="copy-box">
      <code id="codex-prompt">${escapeHtml(codexPrompt)}</code>
      <button class="copy-btn" type="button" data-copy-target="codex-prompt">Copy</button>
    </div>
  </section>

  <h2>What it can do</h2>
  <ul class="features">
    <li>Calculate net salary from gross income, for any supported tax year</li>
    <li>Work backwards from a target net salary to find the matching gross</li>
    <li>Compare 2–5 salary scenarios side by side (different years, hours, 30% ruling, etc.)</li>
    <li>Look up the official payroll tax, social security, and credit brackets for a given year</li>
  </ul>

  <h2>Tax year data</h2>
  <p>Every tool takes a <code>year</code> parameter. Supported years are exactly the years present in the
  <code>dutch-tax-income-calculator</code> package's bundled <code>data.json</code> — nothing is extrapolated
  or assumed for years outside that set. Passing an unsupported year returns a clear error listing which years
  are currently supported, never a silent fallback to the nearest year. The full bracket data for a given year
  is also readable directly as the <code>tax://brackets/{year}</code> MCP resource.</p>

  <h2>Tools: input and output</h2>

  <h3><code>calculate_net_salary</code></h3>
  <p>Gross → net for a given tax year. Input schema:</p>
  <pre>${escapeHtml(netSalarySchema)}</pre>
  <p>Output shape (<code>content[0].text</code>, JSON-encoded):</p>
  <pre>${escapeHtml(OUTPUT_SHAPE_COMMON)}</pre>

  <h3><code>calculate_gross_from_net</code></h3>
  <p>Net → gross. Input schema:</p>
  <pre>${escapeHtml(grossFromNetSchema)}</pre>
  <p>Output shape is the same as <code>calculate_net_salary</code>, except when rounding makes the gross
  non-unique or no gross produces the target net — see below.</p>
  <pre>{
  "normalizedInput": { /* ... */ },
  "result": { "plateau": true, "grossLow": 35999.5, "grossHigh": 36000.49 },
  "breakdown": [ /* computed at grossHigh */ ],
  "assumptions": [ "...", "Rounding to 2 decimals means more than one gross value produces this net income; ..." ],
  "permalink": "https://thetax.nl/?..."
}</pre>
  <p>If no gross produces the target net at all, the tool returns <code>isError: true</code> with the
  package's own error message verbatim (e.g. naming the nearest achievable net) — never a generic error.</p>

  <h3><code>compare_scenarios</code></h3>
  <p>2–5 scenarios, each shaped like <code>calculate_net_salary</code>'s input plus an optional
  <code>label</code>. Input schema:</p>
  <pre>${escapeHtml(compareScenariosSchema)}</pre>
  <pre>{
  "assumptions": [ "This result is indicative only and is not tax advice ..." ],
  "scenarios": [
    { "index": 1, "label": "Current", "normalizedInput": { /* ... */ }, "result": { /* ... */ }, "breakdown": [ /* ... */ ], "assumptions": [ /* ... */ ], "permalink": "..." },
    { "index": 2, "label": "After raise", "...": "..." }
  ],
  "comparisonTable": "| # | Label | Year | Gross/yr | Net/yr | Net/mo | Income tax | Effective tax rate |\\n|---|---|---|---|---|---|---|---|\\n| 1 | Current | 2026 | ... |"
}</pre>

  <details>
    <summary>Manual client config (VS Code, Cursor, raw MCP clients)</summary>
    <p><code>claude_desktop_config.json</code> (manual config via the
    <a href="https://www.npmjs.com/package/mcp-remote" rel="noopener">mcp-remote</a> bridge):</p>
    <pre>${escapeHtml(claudeDesktopConfig)}</pre>
    <p><code>mcp.json</code> (VS Code, Cursor, and other clients supporting the standard config format):</p>
    <pre>${escapeHtml(mcpJsonConfig)}</pre>
  </details>

  <h2>Rate limits and privacy</h2>
  <p>60 requests/minute per client, no authentication. No request bodies, tool arguments, or calculated
  amounts are ever logged — see the <a href="${origin}/privacy" rel="noopener">Privacy Policy</a> for details.</p>

  <h2>Support</h2>
  <p>Source and issue tracker: <a href="${REPO_URL}" rel="noopener">${REPO_URL}</a>. Contact:
  <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>

  <footer>
    <a href="${origin}/privacy" rel="noopener">Privacy Policy</a> ·
    <a href="${origin}/terms" rel="noopener">Terms of Service</a>
  </footer>
</main>
<script>
  document.querySelectorAll(".copy-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = document.getElementById(btn.getAttribute("data-copy-target"));
      if (!target) return;
      navigator.clipboard.writeText(target.textContent).then(function () {
        var original = btn.textContent;
        btn.textContent = "Copied!";
        setTimeout(function () {
          btn.textContent = original;
        }, 1500);
      });
    });
  });
</script>
</body>
</html>
`;
}
