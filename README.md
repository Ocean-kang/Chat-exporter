# Chat Exporter

Export ChatGPT conversations to clean Markdown — via network-layer interception, not DOM scraping.

## Features

- **Network-layer extraction** — intercepts `fetch`/`XHR` to capture raw API responses from `/backend-api/conversation/`
- **DAG-aware ordering** — reconstructs message order from ChatGPT's internal parent/child graph
- **Content filtering** — include or exclude User, Assistant, and System messages
- **Custom filenames** — editable filename with full Unicode support (Chinese, Japanese, emoji)
- **Filename template** — `{title}`, `{date}`, `{time}` placeholders
- **Live preview** — role badges and truncated message content, filter-aware
- **Export states** — idle / loading / success / error with clear visual feedback
- **Keyboard shortcut** — Enter to export (when not focused on an input)
- **Reset** — one-click restore defaults

## Installation

### Chrome / Edge / Brave (Chromium)

```bash
git clone <repo-url>
cd Chat-exporter
npm install
npm run build
```

Then:

1. Open `edge://extensions/` or `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` folder

### Firefox

Firefox supports Manifest V3. Load as a temporary add-on:

1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `dist/manifest.json`

## Usage

1. Open [chatgpt.com](https://chatgpt.com) and navigate to a conversation
2. Click the **Chat Exporter** icon in the toolbar
3. The popup shows:
   - **Filename** — editable, pre-filled from the conversation title
   - **Content** — toggle User / Assistant / System messages
   - **Advanced** — template, separator, metadata options
   - **Preview** — scrollable message list with role badges
   - **Export** — downloads the `.md` file

After a successful export, the popup closes automatically.

## File Naming

Three-tier fallback:

| Priority | Source | Example |
|----------|--------|---------|
| 1 | Conversation title | `今天和ChatGPT的对话.md` |
| 2 | First user message (60 chars) | `How do I refactor a React component.md` |
| 3 | Timestamp | `chatgpt-export-2026-05-04.md` |

Unicode characters are preserved. Only filesystem-invalid characters (`\`, `/`, `:`, `*`, `?`, `"`, `<`, `>`, `|`) are replaced with `_`.

## Output Format

```markdown
# Conversation Title

## User — 2026-05-04 12:30:00

Message content here...

---

## Assistant — 2026-05-04 12:30:05

Response content here...
```

When **Include metadata header** is enabled, the file includes export date and message count.

## Project Structure

```
Chat-exporter/
├── manifest.json          # MV3 extension manifest
├── background.js          # Service worker (download routing)
├── content.js             # Content script (data capture + relay)
├── injected.js            # Page-context script (fetch/XHR interception)
├── src/
│   ├── popup/             # React + TailwindCSS popup UI
│   │   ├── index.html
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── App.tsx
│   └── utils/             # TypeScript utilities (shared with popup build)
│       ├── types.ts
│       ├── parse.ts       # DAG → ordered Message[]
│       ├── markdown.ts    # Message[] → Markdown string
│       └── filename.ts    # Sanitization + template expansion
├── dist/                  # Built extension (load this into browser)
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## Development

```bash
npm run dev       # Watch mode — rebuilds popup on changes
npm run build     # Production build (popup + copy static files)
```

After rebuilding, reload the extension from the browser's extension management page.

## How It Works

```
injected.js  →  intercepts fetch/XHR on /backend-api/conversation/
                posts CHAT_DATA to content script via window.postMessage

content.js   →  injects injected.js into the page
                stores captured conversation data
                responds to GET_CHAT_DATA requests from the popup

popup        →  fetches conversation data from content script
                generates Markdown locally in the popup
                triggers download via chrome.downloads.download

background.js →  fallback download handler (kept for direct content-script exports)
```

## Known Issues

- **SPA navigation** — If you navigate between ChatGPT conversations without a full page reload, click the extension icon again to re-capture data.
- **Reload required** — After rebuilding, manually reload the extension from the extensions page.
- **ChatGPT domain changes** — The extension currently matches `chatgpt.com` and `chat.openai.com`. Update `manifest.json` if the domain changes.

## License

[MIT](LICENSE)
