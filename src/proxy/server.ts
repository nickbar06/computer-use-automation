import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { DEFAULT_PORT } from "../paths.ts";

export type TenantId = "riverside" | "northlake" | "lakecrest";

type MemberOk = { name: string; savings: string; checking: string; status: string };
type MemberDenied = { denied: true };

const TENANTS: Record<TenantId, { brand: string; find: string }> = {
  riverside: { brand: "Riverside Community CU", find: "Find Member" },
  northlake: { brand: "Northlake Credit Union", find: "Search Member" },
  lakecrest: { brand: "Lakecrest FCU", find: "🔍 Search" },
};

const MEMBERS: Record<string, MemberOk | MemberDenied> = {
  "12345": { name: "JANE M", savings: "4250.00", checking: "890.12", status: "ok" },
  "22222": { name: "PAT K", savings: "210.00", checking: "45.00", status: "ok" },
  "67890": { denied: true },
};

function isTenant(value: string | undefined): value is TenantId {
  return value === "riverside" || value === "northlake" || value === "lakecrest";
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function html(title: string, body: string): string {
  return `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html><head><title>${title}</title>
<style>
body{font-family:Tahoma,sans-serif;font-size:13px;background:#d4d0c8;margin:8px}
.bar{background:#003366;color:#fff;padding:8px 12px;font-weight:bold}
table.sheet{border-collapse:collapse;background:#fff}
table.sheet td{border:1px solid #808080;padding:4px 10px}
</style></head><body>${body}</body></html>`;
}

function lookupForm(tenant: TenantId, message = ""): string {
  const find = TENANTS[tenant].find;
  const notice = message ? `<p>${message}</p>` : "";
  return `${notice}
<table><tr><td>
<form method="POST" action="/lookup" target="workspace">
<label>Member ID<br><input name="member_id"></label>
<p><input type="submit" value="${find}"></p>
</form>
</td></tr></table>`;
}

function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  void dispatch(req, res).catch((err: unknown) => {
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end(String(err));
  });
}

async function dispatch(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const host = req.headers.host ?? "127.0.0.1";
  const url = new URL(req.url ?? "/", `http://${host}`);
  const cookies = parseCookies(req.headers.cookie);
  const tenant: TenantId = isTenant(url.searchParams.get("tenant") ?? undefined)
    ? (url.searchParams.get("tenant") as TenantId)
    : isTenant(cookies.tenant)
      ? cookies.tenant
      : "riverside";

  let fault = url.searchParams.has("fault")
    ? (url.searchParams.get("fault") ?? "")
    : (cookies.fault ?? "");

  const setCookies: string[] = [
    `tenant=${tenant}; Path=/`,
    `fault=${encodeURIComponent(fault)}; Path=/`,
  ];

  const send = (status: number, type: string, body: string, extra: Record<string, string> = {}) => {
    res.statusCode = status;
    res.setHeader("content-type", type);
    for (const c of setCookies) res.appendHeader("set-cookie", c);
    for (const [k, v] of Object.entries(extra)) res.setHeader(k, v);
    res.end(body);
  };

  const sendHtml = (status: number, title: string, body: string) =>
    send(status, "text/html; charset=utf-8", html(title, body));

  const redirect = (location: string) => send(303, "text/plain; charset=utf-8", "", { location });

  if (url.pathname === "/health") {
    send(200, "application/json; charset=utf-8", JSON.stringify({ ok: true }));
    return;
  }

  if (url.pathname === "/" && req.method === "GET") {
    send(
      200,
      "text/html; charset=utf-8",
      `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Frameset//EN" "http://www.w3.org/TR/html4/frameset.dtd">
<html><head><title>CoreLink Servicing 7.4</title></head>
<frameset rows="64,*">
<frame name="hdr" src="/chrome/header">
<frame name="workspace" src="/lookup">
</frameset>
<noframes><body>${lookupForm(tenant)}</body></noframes>
</html>`,
    );
    return;
  }

  if (url.pathname === "/chrome/header" && req.method === "GET") {
    sendHtml(
      200,
      "CoreLink",
      `<div class="bar">CoreLink Servicing 7.4 — ${TENANTS[tenant].brand} — operator T. BROOKS</div>`,
    );
    return;
  }

  if (url.pathname === "/lookup" && req.method === "GET") {
    if (fault === "timeout") {
      sendHtml(200, "Session", "<p>Session expired</p>");
      return;
    }
    if (fault === "dialog") {
      sendHtml(
        200,
        "Notice",
        `<p>System Notice</p>
<form method="GET" action="/lookup" target="workspace">
<input type="hidden" name="fault" value="">
<input type="submit" value="OK">
</form>`,
      );
      return;
    }
    sendHtml(200, "Lookup", lookupForm(tenant));
    return;
  }

  if (url.pathname === "/lookup" && req.method === "POST") {
    if (fault === "slow") await new Promise((r) => setTimeout(r, 2200));
    const fields = new URLSearchParams(await readBody(req));
    const memberId = (fields.get("member_id") ?? "").trim();
    if (!memberId || fault === "validation") {
      sendHtml(200, "Lookup", lookupForm(tenant, "Member ID is required."));
      return;
    }
    const rec = MEMBERS[memberId];
    if (fault === "permission" || rec && "denied" in rec) {
      redirect("/errors/denied");
      return;
    }
    if (fault === "not_found" || !rec) {
      redirect("/errors/not_found");
      return;
    }
    redirect(`/member/${memberId}`);
    return;
  }

  const memberMatch = url.pathname.match(/^\/member\/([^/]+)$/);
  if (memberMatch && req.method === "GET") {
    const id = memberMatch[1]!;
    const rec = MEMBERS[id];
    if (!rec || "denied" in rec) {
      redirect("/errors/denied");
      return;
    }
    sendHtml(
      200,
      "Member",
      `<p>Member name: ${rec.name}</p>
<table class="sheet">
<tr><td colspan="3">Member Snapshot</td></tr>
<tr><td>Product</td><td>Balance</td><td>Status</td></tr>
<tr><td>Savings</td><td>${rec.savings}</td><td>${rec.status}</td></tr>
<tr><td>Checking</td><td>${rec.checking}</td><td>${rec.status}</td></tr>
</table>
<form method="POST" action="/member/${id}/open" target="workspace">
<p><label>Opening amount<br><input name="amount"></label></p>
<p><input type="submit" value="Open Sub-Account"></p>
</form>`,
    );
    return;
  }

  const openMatch = url.pathname.match(/^\/member\/([^/]+)\/open$/);
  if (openMatch && req.method === "POST") {
    const id = openMatch[1]!;
    const fields = new URLSearchParams(await readBody(req));
    const amount = (fields.get("amount") ?? "").trim();
    if (!amount) {
      sendHtml(200, "Member", `<p>Amount is required.</p>${lookupForm(tenant)}`);
      return;
    }
    redirect(`/confirm/${id}`);
    return;
  }

  const confirmMatch = url.pathname.match(/^\/confirm\/([^/]+)$/);
  if (confirmMatch && req.method === "GET") {
    const id = confirmMatch[1]!;
    sendHtml(
      200,
      "Confirm",
      `<p>Sub-account opened</p>
<table class="sheet">
<tr><td>Account</td><td>4000${id.padStart(12, "0")}</td></tr>
</table>`,
    );
    return;
  }

  if (url.pathname === "/errors/not_found") {
    sendHtml(200, "Not found", "<h1>No matching member</h1><p>No matching member</p>");
    return;
  }

  if (url.pathname === "/errors/denied") {
    sendHtml(200, "Denied", "<p>Access denied</p>");
    return;
  }

  sendHtml(404, "Missing", "<p>Not found</p>");
}

export function createMockServer(): http.Server {
  return http.createServer(handleRequest);
}

export async function listenMock(
  port = DEFAULT_PORT,
  host = "127.0.0.1",
): Promise<{ origin: string; close: () => Promise<void> }> {
  const server = createMockServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });
  const addr = server.address();
  const actualPort = typeof addr === "object" && addr ? addr.port : port;
  return {
    origin: `http://${host}:${actualPort}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

export async function mainServe(port = DEFAULT_PORT, host = "127.0.0.1"): Promise<void> {
  const { origin } = await listenMock(port, host);
  console.log(`CoreLink mock listening on ${origin}`);
  await new Promise(() => {});
}
