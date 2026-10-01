export const HIDE_ACTIVITY_PREF_KEY = "pi-hide-activity";

// Broadcast so an open transcript folds (or unfolds) the already-rendered
// process blocks as soon as the settings switch flips.
export const HIDE_ACTIVITY_EVENT = "pi-hide-activity-changed";

type ReadableStorage = Pick<Storage, "getItem"> | null | undefined;
type WritableStorage = Pick<Storage, "setItem"> | null | undefined;

export function isHideActivityEnabled(storage?: ReadableStorage): boolean {
  if (!storage) return false;
  return storage.getItem(HIDE_ACTIVITY_PREF_KEY) === "true";
}

export function setHideActivityEnabled(enabled: boolean, storage?: WritableStorage): void {
  storage?.setItem(HIDE_ACTIVITY_PREF_KEY, String(enabled));
  if (typeof window !== "undefined") window.dispatchEvent(new Event(HIDE_ACTIVITY_EVENT));
}

/** Whole seconds of a turn as `MM:SS`, two digits each — used by the "worked in" row. */
export function formatWorkedIn(totalSeconds: number): string {
  const seconds = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.round(totalSeconds) : 0;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}
