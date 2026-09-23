import assert from "node:assert/strict";
import { after, test } from "node:test";
import { listenMock } from "../src/proxy/server.ts";

const mock = await listenMock(0);
after(() => mock.close());

async function text(path: string, init?: RequestInit): Promise<{ status: number; body: string }> {
  const res = await fetch(`${mock.origin}${path}`, init);
  return { status: res.status, body: await res.text() };
}

test("GET /health is ok", async () => {
  const res = await fetch(`${mock.origin}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test("POST lookup 12345 shows snapshot and savings", async () => {
  const { body } = await text("/lookup", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "member_id=12345",
    redirect: "follow",
  });
  assert.match(body, /Member Snapshot/);
  assert.match(body, /4250\.00/);
  assert.doesNotMatch(body, /id=/);
  assert.doesNotMatch(body, /data-testid/);
});

test("POST lookup 99999 is no matching member", async () => {
  const { body } = await text("/lookup", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "member_id=99999",
    redirect: "follow",
  });
  assert.match(body, /No matching member/);
});

test("POST lookup 67890 is access denied", async () => {
  const { body } = await text("/lookup", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "member_id=67890",
    redirect: "follow",
  });
  assert.match(body, /Access denied/);
});

test("GET /?tenant=northlake includes Search Member", async () => {
  const { body } = await text("/?tenant=northlake");
  assert.match(body, /Search Member/);
  assert.match(body, /frameset/i);
});

test("GET /?tenant=lakecrest includes emoji search", async () => {
  const { body } = await text("/?tenant=lakecrest");
  assert.match(body, /🔍 Search/);
});

test("GET /?fault=dialog shows System Notice", async () => {
  const { body } = await text("/lookup?fault=dialog");
  assert.match(body, /System Notice/);
  assert.match(body, /value="OK"/);
});
