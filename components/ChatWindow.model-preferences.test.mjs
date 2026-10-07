import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./ChatWindow.tsx", import.meta.url), "utf8");

test("picking an AGENTS.md style stores it under the current model", () => {
  assert.match(
    source,
    /if \(displayModelValue\) rememberAgentStyle\(displayModelValue\.provider, displayModelValue\.modelId, style\);/,
  );
  assert.match(source, /onAgentStyleChange=\{isNew \? handleAgentStyleChange : undefined\}/);
});

test("switching the model in the composer restores that model's style once", () => {
  const restore = source.slice(
    source.indexOf("const stylePrefModelKeyRef"),
    source.indexOf("const handleAgentStyleChange"),
  );
  assert.match(restore, /if \(!isNew \|\| !onAgentStyleChange \|\| !displayModelValue\) return;/);
  assert.match(restore, /if \(stylePrefModelKeyRef\.current === key\) return;/);
  assert.match(restore, /const remembered = getModelPreference\(/);
  assert.match(restore, /if \(remembered !== undefined\) onAgentStyleChange\(remembered\);/);
});
