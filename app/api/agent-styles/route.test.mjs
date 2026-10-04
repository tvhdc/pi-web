import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { createJiti } from "jiti";

const agentDir = mkdtempSync(join(tmpdir(), "pi-web-agent-styles-agent-"));

process.env.PI_CODING_AGENT_DIR = agentDir;
delete process.env.PI_WEB_PASSWORD;
delete process.env.PI_WEB_ALLOWED_HOSTS;
delete process.env.PI_WEB_HOSTNAME;

after(() => {
  rmSync(agentDir, { recursive: true, force: true });
});

const jiti = createJiti(import.meta.url, {
  alias: { "@": process.cwd() },
  moduleCache: false,
});

function request(method, body) {
  return new Request("http://127.0.0.1:30142/api/agent-styles", {
    method,
    headers: {
      host: "127.0.0.1:30142",
      origin: "http://127.0.0.1:30142",
      "sec-fetch-site": "same-origin",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

test("GET returns an empty style list initially", async () => {
  const { GET } = await jiti.import("./route.ts");
  const response = await GET(request("GET"));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { styles: [] });
});

test("POST creates a style and it appears in GET", async () => {
  const { GET, POST } = await jiti.import("./route.ts");
  const created = await POST(request("POST", { name: "Lite", content: "Chỉ thị gọn." }));
  assert.equal(created.status, 201);
  const body = await created.json();
  assert.equal(body.style.name, "Lite");
  assert.ok(body.style.id);

  const listed = await GET(request("GET"));
  const styles = (await listed.json()).styles;
  assert.equal(styles.length, 1);
  assert.equal(styles[0].id, body.style.id);
});

test("POST rejects a missing name", async () => {
  const { POST } = await jiti.import("./route.ts");
  const response = await POST(request("POST", { content: "x" }));
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /name is required/);
});

test("PUT renames a style and 404s on unknown ids", async () => {
  const { POST, PUT } = await jiti.import("./route.ts");
  const created = await POST(request("POST", { name: "A", content: "x" }));
  const id = (await created.json()).style.id;

  const updated = await PUT(request("PUT", { id, name: "B" }));
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).style.name, "B");

  const missing = await PUT(request("PUT", { id: "nope", name: "C" }));
  assert.equal(missing.status, 404);
});

test("DELETE removes a style and 404s twice", async () => {
  const { POST, DELETE } = await jiti.import("./route.ts");
  const created = await POST(request("POST", { name: "A", content: "x" }));
  const id = (await created.json()).style.id;

  const removed = await DELETE(request("DELETE", { id }));
  assert.equal(removed.status, 200);
  assert.deepEqual(await removed.json(), { success: true });

  const again = await DELETE(request("DELETE", { id }));
  assert.equal(again.status, 404);
});
