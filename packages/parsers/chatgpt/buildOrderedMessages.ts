interface Message {
  id: string;
  parentId?: string;
}

interface AdjacencyMap {
  [parentId: string]: Message[];
}

function buildAdjacencyMap(messages: Message[]): AdjacencyMap {
  const map: AdjacencyMap = {};

  const hasParent = new Set<string>();
  for (const msg of messages) {
    if (msg.parentId) hasParent.add(msg.parentId);
  }

  for (const msg of messages) {
    const parentKey = msg.parentId ?? "__root__";
    if (!map[parentKey]) map[parentKey] = [];
    map[parentKey].push(msg);
  }

  return map;
}

function topologicalWalk(
  map: AdjacencyMap,
  startKey: string
): Message[] {
  const result: Message[] = [];
  const visited = new Set<string>();
  const stack = [startKey];

  while (stack.length > 0) {
    const key = stack.pop()!;
    const children = map[key];
    if (!children) continue;

    for (const msg of children) {
      if (visited.has(msg.id)) continue;
      visited.add(msg.id);
      result.push(msg);
      if (map[msg.id]) stack.push(msg.id);
    }
  }

  return result;
}

function collectOrphans(
  messages: Message[],
  visited: Set<string>
): Message[] {
  return messages.filter((m) => !visited.has(m.id));
}

export function buildOrderedMessages(messages: Message[]): Message[] {
  if (messages.length === 0) return [];

  const map = buildAdjacencyMap(messages);
  const ordered = topologicalWalk(map, "__root__");

  const visited = new Set(ordered.map((m) => m.id));
  const orphans = collectOrphans(messages, visited);

  return [...ordered, ...orphans];
}
