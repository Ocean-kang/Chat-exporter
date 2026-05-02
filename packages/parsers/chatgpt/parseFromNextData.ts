// Types — will move to packages/core when that package exists
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

// ChatGPT __NEXT_DATA__ internal shapes
interface NextDataMessage {
  id: string;
  author: { role: Role };
  content: { content_type: string; parts: string[] };
  create_time?: number;
}

interface NextDataNode {
  id: string;
  message: NextDataMessage | null;
  parent: string | null;
  children: string[];
}

interface NextDataMapping {
  [messageId: string]: NextDataNode;
}

interface NextDataConversation {
  id: string;
  title: string;
  create_time: number;
  current_node: string | null;
  mapping: NextDataMapping;
}

interface NextDataRoot {
  props: {
    pageProps: {
      conversation?: NextDataConversation;
    };
  };
}

function extractContent(parts: string[]): string {
  return parts.join("").trim();
}

function mapRole(raw: string): Role {
  if (raw === "system" || raw === "assistant" || raw === "user") return raw;
  return "system";
}

function mapMessage(node: NextDataNode): Message | null {
  const msg = node.message;
  if (!msg) return null;
  if (!msg.content?.parts?.length) return null;

  return {
    id: msg.id,
    role: mapRole(msg.author.role),
    content: extractContent(msg.content.parts),
    createdAt: msg.create_time,
    parentId: node.parent ?? undefined,
  };
}

function findRoot(mapping: NextDataMapping): NextDataNode | undefined {
  for (const key of Object.keys(mapping)) {
    const node = mapping[key];
    if (node.parent === null) return node;
  }
  return undefined;
}

function walkBranch(
  mapping: NextDataMapping,
  startId: string
): NextDataNode[] {
  const nodes: NextDataNode[] = [];
  let current: NextDataNode | undefined = mapping[startId];

  while (current) {
    nodes.push(current);
    const nextId = current.children?.[0];
    if (!nextId) break;
    current = mapping[nextId];
  }

  return nodes;
}

export function parseFromNextData(raw: unknown): Conversation | null {
  const data = raw as NextDataRoot;
  const conv = data?.props?.pageProps?.conversation;
  if (!conv?.mapping) return null;

  const { id, title, mapping, current_node } = conv;

  let startId: string | undefined = current_node ?? undefined;

  if (!startId) {
    const root = findRoot(mapping);
    if (!root) return null;
    startId = root.id;
  }

  const branch = walkBranch(mapping, startId);
  const messages: Message[] = [];

  for (const node of branch) {
    const msg = mapMessage(node);
    if (msg) messages.push(msg);
  }

  if (messages.length === 0) return null;

  return { id, title, messages };
}
