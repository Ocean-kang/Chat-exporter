# CLAUDE.md

## Project

Chat Exporter (Browser Extension, Data-Layer First)

Extract ChatGPT conversations via network interception (fetch/XHR), not DOM.

---

## Hard Constraints

- NEVER use DOM scraping as primary method
- ALWAYS prefer network/data-layer extraction
- DO NOT rewrite entire files
- DO NOT output more than requested scope

---

## Token Efficiency Rules

- Output only diffs or new files
- Keep responses under 150 lines
- Avoid repeating existing code
- No explanations unless asked

---

## Architecture

extension/        → browser extension
packages/core     → types
packages/parsers  → data extraction
packages/exporters→ output formats

---

## Data Source

Primary:

/backend-api/conversation/:id

---

## Parsing Rules

- Messages stored as DAG
- Must reconstruct order via parentId
- Ignore empty messages
- Join content.parts with newline

---

## Output Rules

- Markdown must preserve code blocks
- No truncation

---

## Anti-Patterns

- querySelector scraping
- PDF export logic
- full file rewrites
