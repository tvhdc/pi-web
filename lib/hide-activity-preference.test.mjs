import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { tsconfigPaths: true });
const {
  HIDE_ACTIVITY_PREF_KEY,
  formatWorkedIn,
  isHideActivityEnabled,
  setHideActivityEnabled,
} = await jiti.import("./hide-activity-preference.ts");

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

test("missing hide-activity preference defaults to off", () => {
  assert.equal(isHideActivityEnabled(memoryStorage()), false);
  assert.equal(isHideActivityEnabled(null), false);
});

test("stored true folds thinking and tools", () => {
  const storage = memoryStorage({ [HIDE_ACTIVITY_PREF_KEY]: "true" });
  assert.equal(isHideActivityEnabled(storage), true);
});

test("toggle writes the localStorage flag", () => {
  const storage = memoryStorage();
  setHideActivityEnabled(true, storage);
  assert.equal(storage.getItem(HIDE_ACTIVITY_PREF_KEY), "true");
  assert.equal(isHideActivityEnabled(storage), true);
  setHideActivityEnabled(false, storage);
  assert.equal(isHideActivityEnabled(storage), false);
});

test("worked-in duration renders as padded minutes and seconds", () => {
  assert.equal(formatWorkedIn(0), "00:00");
  assert.equal(formatWorkedIn(5), "00:05");
  assert.equal(formatWorkedIn(63), "01:03");
  assert.equal(formatWorkedIn(3600), "60:00");
  assert.equal(formatWorkedIn(Number.NaN), "00:00");
  assert.equal(formatWorkedIn(-4), "00:00");
});
