import type { Message, RawChatData } from "./types";

export function parseConversation(conv: RawChatData): Message[] {
  if (!conv?.mapping) return [];
  const mapping = conv.mapping;

  function extractContent(msg: any): string {
    const c = msg?.content;
    if (!c) return "";
    if (typeof c === "string") return c;
    if (Array.isArray(c.parts)) {
      return c.parts
        .map((p: any) => {
          if (typeof p === "string") return p;
          if (p && typeof p === "object") return p.text || "";
          return "";
        })
        .join("\n");
    }
    if (typeof c.text === "string") return c.text;
    if (Array.isArray(c)) {
      return c
        .map((p: any) => {
          if (typeof p === "string") return p;
          if (p && typeof p === "object") return p.text || "";
          return "";
        })
        .join("\n");
    }
    return "";
  }

  const messages: Record<string, Message> = {};

  for (const id in mapping) {
    const node = mapping[id];
    const msg = node?.message;
    if (!msg) continue;

    const role = msg.author?.role || msg.role || "unknown";
    const content = extractContent(msg);

    messages[id] = {
      id,
      role,
      content,
      parentId: node.parent ?? undefined,
      create_time: msg.create_time,
    };
  }

  const children: Record<string, string[]> = {};
  for (const id in messages) children[id] = [];
  for (const id in messages) {
    const pid = messages[id].parentId;
    if (pid && children[pid]) children[pid].push(id);
  }

  const ordered: Message[] = [];
  const visited = new Set<string>();

  function walk(id: string) {
    if (visited.has(id) || !messages[id]) return;
    visited.add(id);
    ordered.push(messages[id]);
    for (const childId of children[id]) walk(childId);
  }

  for (const id in messages) {
    const pid = messages[id].parentId;
    if (pid == null || !messages[pid]) walk(id);
  }

  return ordered;
}
