import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createJiti } from "jiti";

const {
  AGENT_STYLE_EMPTY_ID,
  MAX_AGENT_STYLE_CONTENT_LENGTH,
  MAX_AGENT_STYLE_NAME_LENGTH,
  createAgentStyle,
  deleteAgentStyle,
  listAgentStyles,
  resolveAgentStyleSelection,
  updateAgentStyle,
} = await createJiti(import.meta.url).import("./agent-styles.ts");

async function tempPath(t) {
  const root = await mkdtemp(join(tmpdir(), "pi-web-agent-styles-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return join(root, "agent-styles.json");
}

test("agent styles default to an empty list", async (t) => {
  const path = await tempPath(t);
  assert.deepEqual(listAgentStyles(path), []);
});

test("agent styles round-trip create/update/delete", async (t) => {
  const path = await tempPath(t);
  const created = createAgentStyle("Lite", "Chỉ thị gọn.", path);
  assert.ok(created.id);
  assert.equal(created.name, "Lite");
  assert.equal(created.content, "Chỉ thị gọn.");
  assert.deepEqual(listAgentStyles(path), [created]);

  const renamed = updateAgentStyle(created.id, { name: "Lite 2" }, path);
  assert.equal(renamed.name, "Lite 2");
  assert.equal(renamed.content, "Chỉ thị gọn.");

  const edited = updateAgentStyle(created.id, { content: "Mới." }, path);
  assert.equal(edited.name, "Lite 2");
  assert.equal(edited.content, "Mới.");

  deleteAgentStyle(created.id, path);
  assert.deepEqual(listAgentStyles(path), []);
  assert.throws(() => deleteAgentStyle(created.id, path), /Unknown agent style/);
});

test("agent style names are trimmed and length-bounded", async (t) => {
  const path = await tempPath(t);
  const created = createAgentStyle("  Gọn  ", "x", path);
  assert.equal(created.name, "Gọn");
  assert.throws(() => createAgentStyle(" ", "x", path), /name is required/);
  assert.throws(
    () => createAgentStyle("a".repeat(MAX_AGENT_STYLE_NAME_LENGTH + 1), "x", path),
    /at most/,
  );
});

test("agent style content is length-bounded and must be a string", async (t) => {
  const path = await tempPath(t);
  assert.throws(() => createAgentStyle("A", undefined, path), /content must be a string/);
  assert.throws(
    () => createAgentStyle("A", "a".repeat(MAX_AGENT_STYLE_CONTENT_LENGTH + 1), path),
    /at most/,
  );
});

test("resolveAgentStyleSelection maps default/empty/stored ids", async (t) => {
  const path = await tempPath(t);
  assert.equal(resolveAgentStyleSelection(undefined, path), undefined);
  assert.equal(resolveAgentStyleSelection(null, path), undefined);
  assert.equal(resolveAgentStyleSelection("default", path), undefined);
  assert.equal(resolveAgentStyleSelection(AGENT_STYLE_EMPTY_ID, path), null);
  const created = createAgentStyle("Lite", "Nội dung.", path);
  assert.equal(resolveAgentStyleSelection(created.id, path), "Nội dung.");
  assert.throws(() => resolveAgentStyleSelection("missing", path), /Unknown agent style/);
});

test("a damaged agent styles file fails closed", async (t) => {
  const path = await tempPath(t);
  await writeFile(path, "{ not json", "utf8");
  assert.throws(() => listAgentStyles(path), /Invalid agent styles/);
});
