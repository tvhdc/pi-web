import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./useAgentSession.ts", import.meta.url), "utf8");

test("thinking level resolution prefers the user's per-model memory", () => {
  const helper = source.slice(
    source.indexOf("function desiredThinkingLevel("),
    source.indexOf("const PROMPT_SETTLE_INITIAL_DELAY_MS"),
  );
  assert.match(helper, /getModelPreference\(provider, modelId\)\.thinkingLevel/);
  // Memory wins over the config pin and the highest-supported fallback.
  assert.match(helper, /const remembered = getModelPreference/);
  assert.match(helper, /const pin = pins\[/);
  assert.match(helper, /highestThinkingLevel\(levels\[/);
  const remembered = helper.indexOf("remembered");
  assert.ok(remembered < helper.indexOf("const pin ="), "remembered must be checked before the pin");
  assert.ok(remembered < helper.indexOf("highestThinkingLevel("), "remembered must beat the fallback");
});

test("explicit level picks are stored for the current model", () => {
  const handler = source.slice(
    source.indexOf("const handleThinkingLevelChange = useCallback"),
    source.indexOf("const handleToolPresetChange = useCallback"),
  );
  assert.match(
    handler,
    /rememberThinkingLevel\(displayModel\.provider, displayModel\.modelId, level === "auto" \? undefined : level\)/,
  );
  // "auto" clears the memory before bailing out.
  assert.ok(
    handler.indexOf("rememberThinkingLevel") < handler.indexOf('if (level === "auto") return'),
    "the choice must be recorded even when it is auto",
  );
});
