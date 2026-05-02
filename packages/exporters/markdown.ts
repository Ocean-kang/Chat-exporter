export type Role = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt?: number;
  parentId?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
}

function formatTimestamp(ts?: number): string {
  if (!ts) return "";
  return new Date(ts * 1000).toISOString().replace("T", " ").slice(0, 19);
}

function roleLabel(role: Role): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function renderMessage(msg: Message): string {
  const ts = formatTimestamp(msg.createdAt);
  const header = ts
    ? `### ${roleLabel(msg.role)} (${ts})`
    : `### ${roleLabel(msg.role)}`;
  return `${header}\n\n${msg.content}\n`;
}

export function toMarkdown(conv: Conversation): string {
  const lines: string[] = [];
  lines.push(`# ${conv.title}\n`);
  for (const msg of conv.messages) {
    lines.push(renderMessage(msg));
  }
  return lines.join("\n");
}
