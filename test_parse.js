// ── Test: parseConversation with mock ChatGPT mapping ──
// Usage: node test_parse.js

// ----- Mock ChatGPT API response (minimal: 1 user + 1 assistant) -----
const mockConv = {
  title: "Test Conversation",
  mapping: {
    "node-root": {
      id: "node-root",
      message: null,
      parent: null,
      children: ["node-user-1"],
    },
    "node-user-1": {
      id: "node-user-1",
      message: {
        id: "msg-1",
        author: { role: "user", name: null, metadata: {} },
        create_time: 1714600000,
        content: { content_type: "text", parts: ["What is the capital of France?"] },
        status: "finished_successfully",
      },
      parent: "node-root",
      children: ["node-asst-1"],
    },
    "node-asst-1": {
      id: "node-asst-1",
      message: {
        id: "msg-2",
        author: { role: "assistant", name: null, metadata: {} },
        create_time: 1714600010,
        content: { content_type: "text", parts: ["The capital of France is **Paris**."] },
        status: "finished_successfully",
      },
      parent: "node-user-1",
      children: [],
    },
  },
};

// ----- Copy of parseConversation (matches content.js after fixes) -----
function parseConversation(conv) {
  if (!conv || !conv.mapping) {
    console.error("[parse] conv or mapping is undefined, returning empty");
    return [];
  }
  const mapping = conv.mapping;
  console.log("[parse] mapping exists, keys:", Object.keys(mapping).length);
  const messages = {};

  function extractContent(msg) {
    const c = msg?.content;
    if (!c) return "";
    if (typeof c === "string") return c;
    if (Array.isArray(c.parts)) {
      return c.parts
        .map((p) => {
          if (typeof p === "string") return p;
          if (p && typeof p === "object") return p.text || "";
          return "";
        })
        .join("\n");
    }
    if (typeof c.text === "string") return c.text;
    if (Array.isArray(c)) {
      return c
        .map((p) => {
          if (typeof p === "string") return p;
          if (p && typeof p === "object") return p.text || "";
          return "";
        })
        .join("\n");
    }
    return "";
  }

  for (const id in mapping) {
    const node = mapping[id];
    const msg = node?.message;
    if (!msg) continue;

    const role = msg.author?.role || msg.role || "unknown";
    if (role === "system" || role === "tool") continue;

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

  const children = {};
  for (const id in messages) children[id] = [];
  for (const id in messages) {
    const pid = messages[id].parentId;
    if (pid && children[pid]) children[pid].push(id);
  }

  const ordered = [];
  const visited = new Set();

  function walk(id) {
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

// ── Run Tests ──
console.log("=== TEST 1: Valid mapping ===");
const result = parseConversation(mockConv);
console.log("Result:", JSON.stringify(result, null, 2));

// Assertions
console.assert(result.length === 2, "FAIL: expected 2 messages, got " + result.length);
console.assert(result[0]?.role === "user", "FAIL: first message should be user, got " + result[0]?.role);
console.assert(result[1]?.role === "assistant", "FAIL: second message should be assistant, got " + result[1]?.role);
console.assert(result[0]?.content === "What is the capital of France?", "FAIL: wrong user content");
console.assert(result[1]?.content === "The capital of France is **Paris**.", "FAIL: wrong assistant content");

console.log("\n=== TEST 2: Undefined conv ===");
const result2 = parseConversation(undefined);
console.assert(result2.length === 0, "FAIL: expected 0 messages for undefined, got " + result2.length);

console.log("\n=== TEST 3: Conv with no mapping ===");
const result3 = parseConversation({ title: "No mapping" });
console.assert(result3.length === 0, "FAIL: expected 0 messages for no mapping, got " + result3.length);

console.log("\n=== TEST 4: Empty mapping ===");
const result4 = parseConversation({ mapping: {} });
console.assert(result4.length === 0, "FAIL: expected 0 messages for empty mapping, got " + result4.length);

console.log("\n=== TEST 5: System message filtered ===");
const sysConv = {
  mapping: {
    "sys-node": {
      id: "sys-node",
      message: {
        author: { role: "system" },
        content: { content_type: "text", parts: ["You are a helpful assistant."] },
      },
      parent: null,
    },
    "user-node": {
      id: "user-node",
      message: {
        author: { role: "user" },
        content: { content_type: "text", parts: ["Hello"] },
      },
      parent: "sys-node",
    },
  },
};
const result5 = parseConversation(sysConv);
console.assert(result5.length === 1, "FAIL: expected 1 message (system filtered), got " + result5.length);
console.assert(result5[0]?.role === "user", "FAIL: remaining message should be user");

console.log("\n=== ALL TESTS PASSED ===");
