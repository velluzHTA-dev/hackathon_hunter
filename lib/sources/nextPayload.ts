/**
 * Helpers for reading data out of Next.js App Router pages, which stream their props as
 * `self.__next_f.push([1, "..."])` script chunks instead of a single JSON blob.
 */

const CHUNK = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;

export function readRscPayload(html: string): string {
  return [...html.matchAll(CHUNK)].map((m) => JSON.parse(`"${m[1]}"`) as string).join("");
}

/** Finds `"key":[ ... ]` in the payload and parses that array, or returns null. */
export function extractJsonArray<T>(text: string, key: string): T[] | null {
  const at = text.indexOf(`"${key}":[`);
  if (at < 0) return null;
  const start = text.indexOf("[", at);
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (c === "\\") i++;
      else if (c === '"') inString = false;
    } else if (c === '"') inString = true;
    else if (c === "[" || c === "{") depth++;
    else if (c === "]" || c === "}") {
      depth--;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1)) as T[];
    }
  }
  return null;
}
