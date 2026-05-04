/**
 * Robust filename generator with three-tier fallback:
 * 1. Conversation title (Unicode-safe)
 * 2. First user message (trimmed to 60 chars)
 * 3. Timestamp fallback
 */
export function generateFilename(
  title?: string,
  firstUserMessage?: string,
  template?: string,
): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10);
  const timeStr = date.toISOString().slice(11, 19).replace(/:/g, "-");

  let base = "";

  if (title?.trim()) {
    base = sanitize(title.trim());
  }

  if (!base && firstUserMessage?.trim()) {
    base = sanitize(firstUserMessage.trim().slice(0, 60));
  }

  if (!base) {
    base = `chatgpt-export-${dateStr}`;
  }

  if (template) {
    base = template
      .replace(/\{title\}/g, base)
      .replace(/\{date\}/g, dateStr)
      .replace(/\{time\}/g, timeStr);
  }

  return base.endsWith(".md") ? base : base + ".md";
}

/**
 * Sanitize a string for cross-platform filesystem safety.
 * Preserves Unicode (Chinese, Japanese, emoji, etc.)
 * Replaces only truly invalid characters with "_".
 */
export function sanitize(str: string): string {
  return (
    str
      .replace(/[\\/:*?"<>|]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100)
  );
}
