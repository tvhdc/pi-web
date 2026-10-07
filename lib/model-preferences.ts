/**
 * Per-model UI preferences, persisted in localStorage under one JSON map.
 *
 * The user picks a thinking level and an AGENTS.md style per `provider/modelId`;
 * switching models must bring that model's own choices back instead of guessing
 * (carrying the previous model's level over, or resetting to "highest supported").
 *
 * Everything is best-effort: no window (SSR), blocked storage, or corrupted JSON
 * simply means "no remembered preference" — never an error.
 */

export interface ModelPreference {
  /** Thinking level the user explicitly picked; absent = no preference. */
  thinkingLevel?: string;
  /** New-session agent style: absent = never chosen, null = default, else style id. */
  agentStyle?: string | null;
}

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;
type StorageLike = ReadableStorage & WritableStorage;

export const MODEL_PREFERENCES_KEY = "pi-web:model-preferences";

function defaultStorage(): StorageLike | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function readAll(store?: ReadableStorage): Record<string, ModelPreference> {
  const storage = store ?? defaultStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(MODEL_PREFERENCES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Record<string, ModelPreference>;
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, ModelPreference>, store?: WritableStorage): void {
  const storage = store ?? defaultStorage();
  if (!storage) return;
  const cleaned = Object.fromEntries(
    Object.entries(all).filter(([, preference]) => preference && Object.keys(preference).length > 0),
  );
  try {
    storage.setItem(MODEL_PREFERENCES_KEY, JSON.stringify(cleaned));
  } catch {
    // Quota exceeded or private mode: preferences just do not persist.
  }
}

export function modelPreferenceKey(provider: string, modelId: string): string {
  return `${provider}/${modelId}`;
}

export function getModelPreference(provider: string, modelId: string, store?: ReadableStorage): ModelPreference {
  return readAll(store)[modelPreferenceKey(provider, modelId)] ?? {};
}

/** Remember the thinking level picked for a model; `undefined` clears it ("auto"). */
export function rememberThinkingLevel(
  provider: string,
  modelId: string,
  level: string | undefined,
  store?: StorageLike,
): void {
  const all = readAll(store);
  const key = modelPreferenceKey(provider, modelId);
  const preference = { ...(all[key] ?? {}) };
  if (level === undefined) delete preference.thinkingLevel;
  else preference.thinkingLevel = level;
  all[key] = preference;
  writeAll(all, store);
}

/**
 * Remember the new-session AGENTS.md style picked for a model.
 * `null` is stored as an explicit "default" choice (distinct from "never chosen").
 */
export function rememberAgentStyle(
  provider: string,
  modelId: string,
  style: string | null,
  store?: StorageLike,
): void {
  const all = readAll(store);
  const key = modelPreferenceKey(provider, modelId);
  all[key] = { ...(all[key] ?? {}), agentStyle: style };
  writeAll(all, store);
}
