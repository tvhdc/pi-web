/**
 * Idempotent postinstall patch that enforces `inputLimits.images.maxPerRequest`.
 *
 * Upstream pi-ai declares the limit in its types but never enforces it, and the
 * agent's actual request path is `ModelRuntime.streamSimple` in pi-coding-agent
 * (NOT the `streamSimple` in pi-ai/compat). Local vLLM servers reject a request
 * carrying more than N images across the whole transcript with
 * "At most 1 image(s) may be provided in one prompt", so once a session history
 * accumulates N+1 screenshots every later turn 400s.
 *
 * This patch adds `applyImageRequestLimit(model, transcript)` — keep the N most
 * recent images, replace older ones with a short text placeholder — and calls it
 * right after `normalizeContext(context)` in the request path.
 *
 * Two files are patched (both carry the same function, since the two packages
 * are versioned independently and neither imports the other's helper):
 *   - @earendil-works/pi-ai/dist/compat.js            (stream / streamSimple)
 *   - @earendil-works/pi-coding-agent/dist/core/model-runtime.js  (stream / streamSimple)
 *
 * Safe to run repeatedly: files already carrying the marker are skipped.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MARKER = "applyImageRequestLimit";

const FUNCTION_SOURCE = `/**
 * Fork patch: enforce \`inputLimits.images.maxPerRequest\`.
 *
 * Some providers (e.g. local vLLM servers) reject a request that carries more
 * than N images across the whole transcript ("At most 1 image(s) may be
 * provided in one prompt"). When the transcript is over the limit, keep the N
 * most recent images and replace the older ones with a short text placeholder
 * so the history stays coherent.
 */
function ${MARKER}(model, transcript) {
    const max = model && model.inputLimits && model.inputLimits.images && model.inputLimits.images.maxPerRequest;
    if (!max || max < 1) {
        return transcript;
    }
    const imageIndexes = [];
    for (const [messageIndex, message] of transcript.messages.entries()) {
        const content = message.content;
        if (!Array.isArray(content)) {
            continue;
        }
        for (const [blockIndex, block] of content.entries()) {
            if (block.type === "image") {
                imageIndexes.push({ messageIndex, blockIndex });
            }
        }
    }
    if (imageIndexes.length <= max) {
        return transcript;
    }
    const keep = new Set(imageIndexes.slice(-max).map((entry) => \`\${entry.messageIndex}:\${entry.blockIndex}\`));
    const messages = transcript.messages.map((message, messageIndex) => {
        const content = message.content;
        if (!Array.isArray(content) || !content.some((block) => block.type === "image")) {
            return message;
        }
        let replacedInMessage = 0;
        const nextContent = content.map((block, blockIndex) => {
            if (block.type !== "image" || keep.has(\`\${messageIndex}:\${blockIndex}\`)) {
                return block;
            }
            replacedInMessage += 1;
            return { type: "text", text: \`[image omitted: exceeds model limit of \${max} image(s) per request]\` };
        });
        if (replacedInMessage === 0) {
            return message;
        }
        return { ...message, content: nextContent };
    });
    return { ...transcript, messages };
}
`;

/**
 * Insert FUNCTION_SOURCE before `anchor`, then apply each (from, to)
 * replacement. Returns true if the file was changed, false if already patched
 * or the expected shape was not found.
 */
function patchFile(filePath, anchor, replacements) {
  let source = readFileSync(filePath, "utf8");
  if (source.includes(MARKER)) return false;
  if (!source.includes(anchor)) {
    console.warn(`[patch-pi-image-limit] skipped (anchor not found): ${filePath}`);
    return false;
  }
  source = source.replace(anchor, `${anchor}\n${FUNCTION_SOURCE}`, 1);
  for (const [from, to] of replacements) {
    source = source.split(from).join(to);
  }
  if (!source.includes(MARKER)) {
    console.warn(`[patch-pi-image-limit] no replacement applied: ${filePath}`);
    return false;
  }
  writeFileSync(filePath, source);
  console.log(`[patch-pi-image-limit] patched: ${filePath}`);
  return true;
}

/** Find every `dist/<rel>` file under a package dir (top-level + nested). */
function findFiles(packageDir, rel, depth = 0) {
  if (depth > 6 || !existsSync(packageDir)) return [];
  const found = [];
  let entries = [];
  try {
    entries = readdirSync(packageDir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const full = join(packageDir, entry.name);
    if (entry.name === "dist") {
      const candidate = join(full, rel);
      if (existsSync(candidate)) found.push(candidate);
    } else {
      found.push(...findFiles(full, rel, depth + 1));
    }
  }
  return found;
}

const earendil = join(resolve(dirname(fileURLToPath(import.meta.url)), ".."), "node_modules", "@earendil-works");
let patched = 0;

if (existsSync(earendil)) {
  // 1) pi-ai compat.js (stream / streamSimple)
  const compatRel = "compat.js";
  const compatRepl = [
    ["export function stream(model, context, options) {\n    const transcript = normalizeContext(context);",
     `export function stream(model, context, options) {\n    const transcript = ${MARKER}(model, normalizeContext(context));`],
    ["export function streamSimple(model, context, options) {\n    const transcript = normalizeContext(context);",
     `export function streamSimple(model, context, options) {\n    const transcript = ${MARKER}(model, normalizeContext(context));`],
  ];
  const compatAnchor = 'export function stream(model, context, options) {';
  // top-level + nested pi-ai copies
  for (const base of [join(earendil, "pi-ai"),
    ...readdirSync(earendil, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name !== "pi-ai")
      .map((e) => join(earendil, e.name, "node_modules", "@earendil-works", "pi-ai"))]) {
    for (const file of findFiles(base, compatRel)) {
      if (patchFile(file, compatAnchor, compatRepl)) patched += 1;
    }
  }

  // 2) pi-coding-agent model-runtime.js (stream / streamSimple) — the real agent path
  const mrRel = "core/model-runtime.js";
  const mrRepl = [
    ["const transcript = normalizeContext(context);",
     `const transcript = ${MARKER}(model, normalizeContext(context));`],
  ];
  const mrAnchor = 'import { RuntimeCredentials } from "./runtime-credentials.js";';
  for (const base of [join(earendil, "pi-coding-agent"),
    ...readdirSync(earendil, { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name !== "pi-coding-agent")
      .map((e) => join(earendil, e.name, "node_modules", "@earendil-works", "pi-coding-agent"))]) {
    for (const file of findFiles(base, mrRel)) {
      if (patchFile(file, mrAnchor, mrRepl)) patched += 1;
    }
  }
}
console.log(`[patch-pi-image-limit] done, ${patched} file(s) patched`);
