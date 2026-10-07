import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { alias: { "@": process.cwd() } });
const {
  MODEL_PREFERENCES_KEY,
  getModelPreference,
  rememberAgentStyle,
  rememberThinkingLevel,
} = await jiti.import("./model-preferences.ts");

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    raw: () => map.get(MODEL_PREFERENCES_KEY) ?? null,
  };
}

test("remembers the thinking level per provider/model without collisions", () => {
  const store = fakeStorage();
  rememberThinkingLevel("huytran-local", "exl3", "xhigh", store);
  rememberThinkingLevel("huytran-local", "swift", "high", store);
  assert.equal(getModelPreference("huytran-local", "exl3", store).thinkingLevel, "xhigh");
  assert.equal(getModelPreference("huytran-local", "swift", store).thinkingLevel, "high");
  assert.deepEqual(getModelPreference("deepseek", "flash", store), {});
});

test("auto (undefined) clears the level but keeps the model's style", () => {
  const store = fakeStorage();
  rememberThinkingLevel("p", "m", "high", store);
  rememberAgentStyle("p", "m", "ponytail", store);
  rememberThinkingLevel("p", "m", undefined, store);
  const preference = getModelPreference("p", "m", store);
  assert.equal(preference.thinkingLevel, undefined);
  assert.equal(preference.agentStyle, "ponytail");
});

test("agent style distinguishes an explicit default (null) from never chosen", () => {
  const store = fakeStorage();
  assert.equal(getModelPreference("p", "m", store).agentStyle, undefined);
  rememberAgentStyle("p", "m", null, store);
  assert.equal(getModelPreference("p", "m", store).agentStyle, null);
  rememberAgentStyle("p", "m", "style-a", store);
  assert.equal(getModelPreference("p", "m", store).agentStyle, "style-a");
});

test("a fully cleared preference is dropped from the stored map", () => {
  const store = fakeStorage();
  rememberThinkingLevel("p", "m", "high", store);
  rememberThinkingLevel("p", "m", undefined, store);
  assert.deepEqual(JSON.parse(store.raw()), {});
});

test("corrupted or missing storage reads as no preference", () => {
  const broken = { getItem: () => "{not json", setItem: () => {} };
  assert.deepEqual(getModelPreference("p", "m", broken), {});
  const missing = { getItem: () => null, setItem: () => {} };
  assert.deepEqual(getModelPreference("p", "m", missing), {});
  // No window (SSR / node test env) must not throw either.
  assert.deepEqual(getModelPreference("p", "m"), {});
});

test("storage failures (private mode, quota) are ignored", () => {
  const throwing = {
    getItem: () => { throw new Error("denied"); },
    setItem: () => { throw new Error("quota"); },
  };
  assert.deepEqual(getModelPreference("p", "m", throwing), {});
  assert.doesNotThrow(() => rememberThinkingLevel("p", "m", "high", throwing));
  assert.doesNotThrow(() => rememberAgentStyle("p", "m", null, throwing));
});
