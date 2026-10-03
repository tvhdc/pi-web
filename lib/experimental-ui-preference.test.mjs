import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { tsconfigPaths: true });
const {
  EXPERIMENTAL_UI_PREF_KEY,
  isExperimentalUiEnabled,
  setExperimentalUiEnabled,
} = await jiti.import("./experimental-ui-preference.ts");

function memoryStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem(key) {
      return Object.hasOwn(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    },
  };
}

test("missing experimental-ui preference defaults to off", () => {
  assert.equal(isExperimentalUiEnabled(memoryStorage()), false);
  assert.equal(isExperimentalUiEnabled(null), false);
});

test("stored true turns the experimental interface on", () => {
  const storage = memoryStorage({ [EXPERIMENTAL_UI_PREF_KEY]: "true" });
  assert.equal(isExperimentalUiEnabled(storage), true);
});

test("toggle writes the localStorage flag", () => {
  const storage = memoryStorage();
  setExperimentalUiEnabled(true, storage);
  assert.equal(storage.getItem(EXPERIMENTAL_UI_PREF_KEY), "true");
  assert.equal(isExperimentalUiEnabled(storage), true);
  setExperimentalUiEnabled(false, storage);
  assert.equal(isExperimentalUiEnabled(storage), false);
});
