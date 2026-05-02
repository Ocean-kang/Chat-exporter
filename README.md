# Chat Exporter

Extract ChatGPT conversations to Markdown — via network-layer interception, not DOM scraping.

## Overview

Chat Exporter is a lightweight browser extension that captures ChatGPT conversation data directly from the API response and converts it into a clean, readable Markdown file. One click, one download.

It works by intercepting `fetch`/`XHR` requests to `/backend-api/conversation/`, so it always gets the raw, structured data — no scraping, no fragile selectors.

## Installation

### Chrome / Edge / Brave (Chromium-based)

1. Download or clone this repository.
2. Open `chrome://extensions` in your browser.
3. Enable **Developer mode** (toggle in the top-right corner).
4. Click **Load unpacked** and select the project folder.
5. The extension icon will appear in your toolbar — pin it for quick access.

### Firefox

Firefox supports Manifest V3 extensions. Load it as a temporary add-on:

1. Open `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on**.
3. Select the `manifest.json` file from the project folder.

## Usage

1. Navigate to [chatgpt.com](https://chatgpt.com) and open any conversation.
2. Click the **Chat Exporter** icon in your browser toolbar.
3. Press the **Export** button.
4. A `.md` file downloads automatically to your default downloads folder.

The exported Markdown includes the conversation title as an `# H1`, each message labeled by role (`## assistant`, `## user`) with an ISO timestamp, and full message content — code blocks included.

## Features

- **Network-layer extraction** — reads raw API responses, never touches the DOM
- **DAG-aware ordering** — reconstructs message order from ChatGPT's internal parent/child graph
- **Clean Markdown output** — headings, timestamps, role labels, preserved code blocks
- **Safe filenames** — titles are sanitized for cross-platform filesystem compatibility
- **Zero configuration** — install and export, no setup required

## How It Works

```
injected.js  →  intercepts fetch/XHR on /backend-api/conversation/
content.js   →  parses the DAG, rebuilds ordered messages, generates Markdown
background.js →  triggers the file download via chrome.downloads
popup.js     →  thin UI layer — one button
```

## License

[MIT](LICENSE)
