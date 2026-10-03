export const EXPERIMENTAL_UI_PREF_KEY = "pi-experimental-ui";

// Broadcast so open transcripts re-render (one model label per turn, stats
// behind hover, calmer status line) as soon as the settings switch flips.
export const EXPERIMENTAL_UI_EVENT = "pi-experimental-ui-changed";

type ReadableStorage = Pick<Storage, "getItem"> | null | undefined;
type WritableStorage = Pick<Storage, "setItem"> | null | undefined;

export function isExperimentalUiEnabled(storage?: ReadableStorage): boolean {
  if (!storage) return false;
  return storage.getItem(EXPERIMENTAL_UI_PREF_KEY) === "true";
}

export function setExperimentalUiEnabled(enabled: boolean, storage?: WritableStorage): void {
  storage?.setItem(EXPERIMENTAL_UI_PREF_KEY, String(enabled));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EXPERIMENTAL_UI_EVENT));
}
