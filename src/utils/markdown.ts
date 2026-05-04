import type { Message, ExportOptions } from "./types";

export function toMarkdown(
  title: string,
  messages: Message[],
  options: ExportOptions,
): string {
  const filtered = filterMessages(messages, options);
  const sep = `\n\n${options.separator}\n\n`;
  const ts = options.includeMetadata;

  let out = `# ${title || "ChatGPT Conversation"}\n\n`;

  if (ts) {
    out += `> Exported at: ${new Date().toISOString().replace("T", " ").slice(0, 19)}\n`;
    out += `> Messages: ${filtered.length}\n\n`;
  }

  filtered.forEach((m, i) => {
    const timestamp = m.create_time
      ? new Date(m.create_time * 1000).toISOString().replace("T", " ").slice(0, 19)
      : "";

    out += `## ${formatRole(m.role)}${ts && timestamp ? " — " + timestamp : ""}\n\n`;
    out += m.content;
    if (i < filtered.length - 1) out += sep;
  });

  out += "\n";
  return out;
}

function filterMessages(
  messages: Message[],
  options: ExportOptions,
): Message[] {
  return messages.filter((m) => {
    switch (m.role) {
      case "user":
        return options.includeUser;
      case "assistant":
        return options.includeAssistant;
      case "system":
        return options.includeSystem;
      default:
        return true;
    }
  });
}

function formatRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
