export function parseConversation(conv: any) {
  const mapping = conv.mapping;
  const messages: Record<string, any> = {};

  for (const id in mapping) {
    const msg = mapping[id].message;
    if (!msg) continue;
    messages[id] = {
      id,
      role: msg.author.role,
      content: msg.content.parts.join("\n"),
      parentId: mapping[id].parent
    };
  }

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
