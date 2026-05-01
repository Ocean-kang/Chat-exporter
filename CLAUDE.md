# CLAUDE.md

## Project

Chat Exporter (Data-Layer Extraction First)

This project extracts conversations from ChatGPT by reading internal structured data instead of DOM.

---

## Hard Constraints (Must Follow)

- NEVER use DOM parsing as primary method
- ALWAYS attempt data-layer extraction first
- DO NOT use querySelector unless explicitly asked
- DO NOT output large code unless requested
- DO NOT rewrite entire files for small changes

---

## Token Efficiency Rules (Critical)

- Only output changed code blocks, not full files
- Prefer diffs over full rewrites
- Keep responses under 200 lines unless necessary
- Avoid repeating context already in repository
- Use concise explanations

---

## Architecture

packages/
  core/        → types and shared logic
  parsers/     → platform-specific extraction
  exporters/   → output formats
  cli/         → entry point

---

## Data Source (ChatGPT)

Primary:

window.__NEXT_DATA__

Expected path:

props.pageProps.conversation

---

## Data Model

```ts
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
