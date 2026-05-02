// ── Inject page-context script (intercepts fetch/XHR) ──
function injectScript() {
  const target = document.documentElement || document.head || document.body;
  if (!target) {
    console.warn("[exporter:content] no injection target yet, retrying…");
    setTimeout(injectScript, 10);
    return;
  }
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("injected.js");
  script.onload = () => console.log("[exporter:content] injected.js loaded into page");
  script.onerror = () => console.error("[exporter:content] injected.js load FAILED");
  target.appendChild(script);
}
injectScript();

// ── Receive raw conversation data from injected.js ──
window.addEventListener("message", (e) => {
  if (e.data?.type === "CHAT_DATA") {
    const data = e.data.data;
    // Only update if payload contains a non-empty mapping
    if (data && data.mapping && Object.keys(data.mapping).length > 0) {
      window.__CHAT_DATA__ = data;
      console.log("[exporter:content] chat data captured", {
        title: data.title,
        mappingSize: Object.keys(data.mapping).length,
      });
    } else {
      console.warn("[exporter:content] ignoring invalid CHAT_DATA", {
        hasData: !!data,
        hasMapping: !!(data && data.mapping),
        mappingSize: data?.mapping ? Object.keys(data.mapping).length : 0,
      });
    }
  }
});

// ── generateSafeFilename — sanitize title for cross-platform filesystem safety ──
function generateSafeFilename(title) {
  const sanitized = (title || "").trim()
    .replace(/[\\/:*?"<>|]/g, "")   // remove filesystem-invalid chars
    .replace(/\s+/g, " ")           // collapse whitespace
    .slice(0, 60);                  // limit length

  if (!sanitized) {
    return "chatgpt-export-" + Date.now() + ".md";
  }
  return sanitized + ".md";
}

// ── parseConversation — extract ordered messages from API response DAG ──
function parseConversation(conv) {
  if (!conv || !conv.mapping) {
    console.error("[parse] conv or mapping is undefined, returning empty");
    return [];
  }
  const mapping = conv.mapping;
  console.log("[parse] mapping exists, keys:", Object.keys(mapping).length);
  const messages = {};

  const mappingKeys = Object.keys(mapping);
  console.log("[parse] raw mapping keys count:", mappingKeys.length);
  if (mappingKeys.length > 0) {
    console.log("[parse] first 3 mapping keys:", mappingKeys.slice(0, 3));
    // Dump first node that has a message
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

  function extractContent(msg) {
    const c = msg?.content;
    if (!c) return "";
    // content is a plain string
    if (typeof c === "string") return c;
    // content has parts array (legacy & current text messages)
    if (Array.isArray(c.parts)) {
      return c.parts
        .map((p) => {
          if (typeof p === "string") return p;
          if (p && typeof p === "object") return p.text || "";
          return "";
        })
        .join("\n");
    }
    // content has .text field
    if (typeof c.text === "string") return c.text;
    // content is itself an array
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
    // Skip system / tool messages
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

  // Build children index
  const children = {};
  for (const id in messages) children[id] = [];
  for (const id in messages) {
    const pid = messages[id].parentId;
    if (pid && children[pid]) children[pid].push(id);
  }

  // DFS walk from roots (messages with no parent or orphaned parent)
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

// ── toMarkdown — convert structured conversation to Markdown string ──
function toMarkdown(conv) {
  let out = `# ${conv.title || "ChatGPT Conversation"}\n\n`;

  const sep = "\n\n---\n\n";
  conv.messages.forEach((m, i) => {
    const ts = m.create_time
      ? new Date(m.create_time * 1000).toISOString().replace("T", " ").slice(0, 19)
      : "";

    out += `## ${m.role}${ts ? " — " + ts : ""}\n\n`;
    out += `${m.content}\n`;
    out += i < conv.messages.length - 1 ? sep : "\n";
  });

  return out;
}

// ── Handle EXPORT request from popup (routed via background) ──
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  console.log("[exporter:content] message received", { type: msg.type });

  if (msg.type !== "EXPORT") return;

  console.log("[exporter:content] EXPORT requested, starting pipeline");

  try {
    if (!window.__CHAT_DATA__) {
      console.warn("[exporter:content] no data captured");
      alert("No conversation data captured. Reload the ChatGPT page and try again.");
      sendResponse({ ok: false, error: "no data" });
      return;
    }

    const messages = parseConversation(window.__CHAT_DATA__);
    console.log("[exporter:content] parsed", messages.length, "messages");

    const md = toMarkdown({
      title: window.__CHAT_DATA__.title,
      messages,
    });

    console.log("[exporter:content] markdown generated, length:", md.length);
    console.log("[exporter:content] sending DOWNLOAD");
    chrome.runtime.sendMessage({
      type: "DOWNLOAD",
      content: md,
      filename: generateSafeFilename(window.__CHAT_DATA__.title),
    }).then(() => {
      console.log("[exporter:content] DOWNLOAD message sent");
      sendResponse({ ok: true, messageCount: messages.length });
    }).catch((err) => {
      console.error("[exporter:content] sendMessage DOWNLOAD failed", err);
      sendResponse({ ok: false, error: err.message });
    });
  } catch (err) {
    console.error("[exporter:content] export failed", err);
    alert("Export failed: " + err.message);
    sendResponse({ ok: false, error: err.message });
  }

  return true; // keep message port open for async sendResponse
});
