export function parseConversation(conv: any) {
  const mapping = conv.mapping;
  const messages: any = {};

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

  return messages;
}
