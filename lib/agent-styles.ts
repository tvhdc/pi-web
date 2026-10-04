import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import { writePrivateFileAtomicSync } from "./atomic-file";

/**
 * Named AGENTS.md styles the user can pick when starting a new session
 * (Settings → "Agent styles", composer selector). Stored in the agent dir so
 * they follow the user, not a project. A style REPLACES all context files
 * (AGENTS.md/CLAUDE.md) for the new session; "empty" means no instructions.
 */

export interface AgentStyle {
  id: string;
  name: string;
  content: string;
}

export const AGENT_STYLE_EMPTY_ID = "empty";

export const MAX_AGENT_STYLE_NAME_LENGTH = 60;
export const MAX_AGENT_STYLE_CONTENT_LENGTH = 200_000;

type StoredAgentStyles = Record<string, unknown> & {
  version?: unknown;
  styles?: unknown;
};

export function getAgentStylesPath(agentDir = getAgentDir()): string {
  return join(agentDir, "agent-styles.json");
}

function readStoredStyles(stylesPath: string): StoredAgentStyles {
  if (!existsSync(stylesPath)) return {};
  // Throwing is deliberate: a damaged file must fail closed rather than be
  // silently replaced (same contract as subagent settings).
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(stylesPath, "utf8"));
  } catch (error) {
    throw new Error(`Invalid agent styles: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid agent styles: expected an object");
  }
  return parsed as StoredAgentStyles;
}

function readStyleList(stylesPath: string): AgentStyle[] {
  const stored = readStoredStyles(stylesPath);
  if (stored.styles === undefined) return [];
  if (!Array.isArray(stored.styles)) {
    throw new Error("Invalid agent styles: styles must be an array");
  }
  return stored.styles.map((entry): AgentStyle => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error("Invalid agent style entry");
    }
    const style = entry as Record<string, unknown>;
    if (typeof style.id !== "string" || style.id.length === 0
      || typeof style.name !== "string" || style.name.length === 0
      || typeof style.content !== "string") {
      throw new Error("Invalid agent style entry: id/name/content must be non-empty strings");
    }
    return { id: style.id, name: style.name, content: style.content };
  });
}

function writeStyleList(stylesPath: string, styles: AgentStyle[]): void {
  mkdirSync(dirname(stylesPath), { recursive: true });
  writePrivateFileAtomicSync(stylesPath, JSON.stringify({ version: 1, styles }, null, 2));
}

export function listAgentStyles(stylesPath = getAgentStylesPath()): AgentStyle[] {
  return readStyleList(stylesPath);
}

function validateName(name: unknown): string {
  if (typeof name !== "string" || name.trim().length === 0) {
    throw new Error("Agent style name is required");
  }
  const trimmed = name.trim();
  if (trimmed.length > MAX_AGENT_STYLE_NAME_LENGTH) {
    throw new Error(`Agent style name must be at most ${MAX_AGENT_STYLE_NAME_LENGTH} characters`);
  }
  return trimmed;
}

function validateContent(content: unknown): string {
  if (typeof content !== "string") {
    throw new Error("Agent style content must be a string");
  }
  if (content.length > MAX_AGENT_STYLE_CONTENT_LENGTH) {
    throw new Error(`Agent style content must be at most ${MAX_AGENT_STYLE_CONTENT_LENGTH} characters`);
  }
  return content;
}

export function createAgentStyle(
  name: unknown,
  content: unknown,
  stylesPath = getAgentStylesPath(),
): AgentStyle {
  const style: AgentStyle = { id: randomUUID(), name: validateName(name), content: validateContent(content) };
  const styles = readStyleList(stylesPath);
  styles.push(style);
  writeStyleList(stylesPath, styles);
  return style;
}

export function updateAgentStyle(
  id: string,
  patch: { name?: unknown; content?: unknown },
  stylesPath = getAgentStylesPath(),
): AgentStyle {
  const styles = readStyleList(stylesPath);
  const index = styles.findIndex((style) => style.id === id);
  if (index === -1) throw new Error(`Unknown agent style: ${id}`);
  const current = styles[index];
  const next: AgentStyle = {
    ...current,
    ...(patch.name !== undefined ? { name: validateName(patch.name) } : {}),
    ...(patch.content !== undefined ? { content: validateContent(patch.content) } : {}),
  };
  styles[index] = next;
  writeStyleList(stylesPath, styles);
  return next;
}

export function deleteAgentStyle(id: string, stylesPath = getAgentStylesPath()): void {
  const styles = readStyleList(stylesPath);
  const next = styles.filter((style) => style.id !== id);
  if (next.length === styles.length) throw new Error(`Unknown agent style: ${id}`);
  writeStyleList(stylesPath, next);
}

/**
 * Resolve a composer selection to the prompt content:
 * `undefined` keeps pi's normal context files, `null` means no instructions,
 * a string is the exact style content that replaces the context files.
 * The pseudo id "empty" resolves to null without needing a stored style.
 */
export function resolveAgentStyleSelection(
  selection: "default" | "empty" | string | null | undefined,
  stylesPath = getAgentStylesPath(),
): string | null | undefined {
  if (selection === undefined || selection === null || selection === "default") return undefined;
  if (selection === AGENT_STYLE_EMPTY_ID) return null;
  const style = readStyleList(stylesPath).find((entry) => entry.id === selection);
  if (!style) throw new Error(`Unknown agent style: ${selection}`);
  return style.content;
}
