export function parseConversation(conv: any) {
  if (!conv || !conv.mapping) {
    console.error("[parse] conv or mapping is undefined, returning empty");
    return [];
  }
  const mapping = conv.mapping;
  console.log("[parse] mapping exists, keys:", Object.keys(mapping).length);
  const messages: Record<string, any> = {};

  const mappingKeys = Object.keys(mapping);
  console.log("[parse] raw mapping keys count:", mappingKeys.length);
  if (mappingKeys.length > 0) {
    console.log("[parse] first 3 mapping keys:", mappingKeys.slice(0, 3));
    for (const id of mappingKeys) {
      const node = mapping[id];
      if (node?.message) {
        console.log("[parse] sample node with message:", {
          id,
          hasContent: !!node.message.content,
          contentType: typeof node.message.content,
          contentKeys: node.message.content ? Object.keys(node.message.content) : null,
          hasAuthor: !!node.message.author,
          authorRole: node.message.author?.role,
          hasParts: Array.isArray(node.message.content?.parts),
          parentId: node.parent,
        });
        break;
      }
    }
  }

  function extractContent(msg: any): string {
    const c = msg?.content;
    if (!c) return "";
    if (typeof c === "string") return c;
    if (Array.isArray(c.parts)) {
      return c.parts
        .map((p: any) => extractPartText(p))
        .filter((t: string) => t.length > 0)
        .join("\n");
    }
    if (typeof c.text === "string") return c.text;
    if (Array.isArray(c)) {
      return c
        .map((p: any) => extractPartText(p))
        .filter((t: string) => t.length > 0)
        .join("\n");
    }
    return "";
  }

  function extractPartText(p: any): string {
    if (typeof p === "string") return p;
    if (!p || typeof p !== "object") return "";
    // Skip non-text parts (image, file, audio references)
    const ct = p.content_type;
    if (ct && ct !== "text" && ct !== "code" && ct !== "execution_output" && ct !== "tether_browsing_display") return "";
    return p.text || "";
  }

  function isTextOrCodeType(ct: string): boolean {
    // Only text, code, and execution output — skip multimodal, tool_use, system_error
    return ct === "text" || ct === "code" || ct === "execution_output" || ct === "tether_browsing_display";
  }

  for (const id in mapping) {
    const node = mapping[id];
    const msg = node?.message;
    if (!msg) continue;

    const role = msg.author?.role || msg.role || "unknown";
    // Skip system / tool messages
    if (role === "system" || role === "tool") continue;

    // Skip non-text/code content types (file uploads, tool use, system errors)
    const contentType = msg.content?.content_type;
    if (contentType && !isTextOrCodeType(contentType)) continue;

    const content = extractContent(msg);
    if (!content && !msg.content) continue;

    messages[id] = {
      id,
      role,
      content,
      parentId: node.parent,
      create_time: msg.create_time,
    };
  }

  console.log("[parse] extracted message count:", Object.keys(messages).length);

  // Build children index from parentId edges
  const children: Record<string, string[]> = {};
  for (const id in messages) children[id] = [];
  for (const id in messages) {
    const pid = messages[id].parentId;
    if (pid && children[pid]) children[pid].push(id);
  }

  // DFS walk from root(s)
  const ordered: any[] = [];
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
