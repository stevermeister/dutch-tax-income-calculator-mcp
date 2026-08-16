import { SELF } from "cloudflare:test";
import { describe, expect, it } from "vitest";

const MCP_URL = "https://example.com/mcp";
const JSON_RPC_HEADERS = {
  "content-type": "application/json",
  accept: "application/json, text/event-stream",
};

async function rpc(method: string, params?: unknown, id: number = 1): Promise<any> {
  const res = await SELF.fetch(MCP_URL, {
    method: "POST",
    headers: JSON_RPC_HEADERS,
    body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
  });
  // The streamable-HTTP transport frames its single response as an SSE
  // "message" event even for one-shot request/response pairs.
  const raw = await res.text();
  const dataLine = raw.split("\n").find((line: string) => line.startsWith("data:"));
  if (!dataLine) {
    throw new Error(`No SSE data line in response (status ${res.status}): ${raw}`);
  }
  return JSON.parse(dataLine.slice("data:".length).trim());
}

function toolPayload(envelope: any): any {
  return JSON.parse(envelope.result.content[0].text);
}

describe("worker HTTP surface", () => {
  it("serves a friendly message on the root path", async () => {
    const res = await SELF.fetch("https://example.com/");
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("/mcp");
    expect(text.toLowerCase()).toContain("not tax advice");
  });

  it("serves the setup instructions page at /mcp/setup.html", async () => {
    const res = await SELF.fetch("https://example.com/mcp/setup.html");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html).toContain("https://example.com/mcp");
    expect(html).toContain("mcp-remote");
    expect(html).toContain("claude_desktop_config.json");
    expect(html.toLowerCase()).toContain("not tax advice");
    expect(html).toContain("Connectors");
  });

  it("redirects the old extension-less /mcp/setup to /mcp/setup.html", async () => {
    const res = await SELF.fetch("https://example.com/mcp/setup", { redirect: "manual" });
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://example.com/mcp/setup.html");
  });

  it("serves the privacy policy at /mcp/privacy.html, linked from the setup page", async () => {
    const res = await SELF.fetch("https://example.com/mcp/privacy.html");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    const html = await res.text();
    expect(html.toLowerCase()).toContain("privacy policy");
    expect(html).toContain("Data collection");
    expect(html).toContain("Data retention");
    expect(html).toContain("Contact");

    const setupHtml = await (await SELF.fetch("https://example.com/mcp/setup.html")).text();
    expect(setupHtml).toContain("https://example.com/mcp/privacy.html");
  });

  it("redirects a browser landing on /mcp (or /mcp/) to the setup page", async () => {
    for (const path of ["/mcp", "/mcp/"]) {
      const res = await SELF.fetch(`https://example.com${path}`, {
        redirect: "manual",
        headers: { accept: "text/html,application/xhtml+xml" },
      });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toBe("https://example.com/mcp/setup.html");
    }
  });

  it("does not redirect an actual MCP client GET on /mcp (no text/html Accept)", async () => {
    const res = await SELF.fetch("https://example.com/mcp", {
      redirect: "manual",
      headers: { accept: "application/json, text/event-stream" },
    });
    expect(res.status).not.toBe(302);
  });

  it("serves real MCP traffic on /mcp/ (trailing slash) the same as /mcp", async () => {
    // Some connector UIs (and people) type the URL with a trailing slash.
    // A client that always calls the exact URL it was given must not 404.
    const res = await SELF.fetch("https://example.com/mcp/", {
      method: "POST",
      headers: JSON_RPC_HEADERS,
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    expect(res.status).toBe(200);
  });

  it("404s on OAuth well-known discovery paths instead of masking them with the friendly 200", async () => {
    // This server has no auth. A client probing these paths (as Claude Desktop's
    // connector UI does before deciding whether to attempt OAuth) needs a real
    // 404 to conclude "no auth here" — a 200 with an unrelated body sends it
    // into a broken registration attempt instead.
    for (const path of ["/.well-known/oauth-protected-resource", "/.well-known/oauth-authorization-server"]) {
      const res = await SELF.fetch(`https://example.com${path}`);
      expect(res.status).toBe(404);
    }
  });

  it("lists calculate_net_salary, calculate_gross_from_net and compare_scenarios tools", async () => {
    const body = await rpc("tools/list");
    const names = body.result.tools.map((t: { name: string }) => t.name);
    expect(names).toEqual(
      expect.arrayContaining(["calculate_net_salary", "calculate_gross_from_net", "compare_scenarios"])
    );
    for (const tool of body.result.tools) {
      expect(tool.description.toLowerCase()).toContain("not tax advice");
      expect(tool.title).toBeTruthy();
      expect(tool.annotations?.readOnlyHint).toBe(true);
    }
  });

  it("calculate_net_salary returns normalizedInput, result, breakdown, assumptions and permalink", async () => {
    const body = await rpc("tools/call", {
      name: "calculate_net_salary",
      arguments: { year: 2026, income: 36000, hours: 40 },
    });
    const payload = toolPayload(body);
    expect(payload.normalizedInput.year).toBe(2026);
    expect(payload.result.netYear).toBeCloseTo(31342.33, 2);
    expect(payload.breakdown).toHaveLength(4);
    expect(payload.assumptions[0]).toContain("not tax advice");
    expect(payload.permalink).toContain("https://thetax.nl/?");
    expect(payload.permalink).toContain("year=2026");
  });

  it("rejects an unsupported year with a clear isError result, not a silent fallback", async () => {
    const body = await rpc("tools/call", {
      name: "calculate_net_salary",
      arguments: { year: 1899, income: 36000 },
    });
    expect(body.result.isError).toBe(true);
    expect(body.result.content[0].text).toContain("Unsupported tax year 1899");
  });

  it("calculate_gross_from_net surfaces a plateau or a solved gross, and round-trips a forward calculation", async () => {
    const forward = await rpc("tools/call", {
      name: "calculate_net_salary",
      arguments: { year: 2026, income: 36000, hours: 40 },
    });
    const forwardPayload = toolPayload(forward);

    const reverse = await rpc("tools/call", {
      name: "calculate_gross_from_net",
      arguments: { year: 2026, targetNet: forwardPayload.result.netYear, hours: 40 },
    });
    const reversePayload = toolPayload(reverse);
    expect(reversePayload.breakdown).toHaveLength(4);
    expect(reversePayload.permalink).toContain("https://thetax.nl/?");
    if (reversePayload.result.plateau) {
      expect(reversePayload.result.grossLow).toBeLessThanOrEqual(36000);
      expect(reversePayload.result.grossHigh).toBeGreaterThanOrEqual(36000);
    } else {
      expect(reversePayload.result.grossYear).toBeCloseTo(36000, 0);
    }
  });

  it("calculate_gross_from_net surfaces the package's own error verbatim for an inconsistent request", async () => {
    const body = await rpc("tools/call", {
      name: "calculate_gross_from_net",
      arguments: { year: 2026, targetNet: 30000, holidayAllowanceIncluded: true },
    });
    expect(body.result.isError).toBe(true);
    expect(body.result.content[0].text).toContain(
      "holidayAllowanceIncluded requires options.allowance or options.ruling.checked"
    );
  });

  it("compare_scenarios returns a per-scenario breakdown and a markdown comparison table", async () => {
    const body = await rpc("tools/call", {
      name: "compare_scenarios",
      arguments: {
        scenarios: [
          { year: 2026, income: 36000, label: "Baseline" },
          { year: 2026, income: 50000, label: "Raise" },
        ],
      },
    });
    const payload = toolPayload(body);
    expect(payload.scenarios).toHaveLength(2);
    expect(payload.comparisonTable).toContain("Baseline");
    expect(payload.comparisonTable).toContain("Raise");
    expect(payload.assumptions[0]).toContain("not tax advice");
  });

  it("reads tax://brackets/{year} with data sourced from the package", async () => {
    const body = await rpc("resources/read", { uri: "tax://brackets/2026" });
    const payload = JSON.parse(body.result.contents[0].text);
    expect(payload.year).toBe(2026);
    expect(Array.isArray(payload.payrollTax)).toBe(true);
    expect(payload.rulingThreshold).toBeDefined();
  });

  it("rejects reading an unsupported year resource with a clear error", async () => {
    const body = await rpc("resources/read", { uri: "tax://brackets/1899" });
    expect(body.error?.message ?? "").toContain("Unsupported tax year 1899");
  });

  it("enforces the 60 req/min per-IP rate limit", async () => {
    const ip = "203.0.113.42";
    let last: Response | null = null;
    for (let i = 0; i < 61; i++) {
      last = await SELF.fetch("https://example.com/", { headers: { "cf-connecting-ip": ip } });
    }
    expect(last!.status).toBe(429);
    const body = await last!.json<{ error: string }>();
    expect(body.error).toBe("rate_limit_exceeded");
  });
});
