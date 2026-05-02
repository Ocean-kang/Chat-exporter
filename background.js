chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  console.log("[exporter:background] message received", { type: msg.type });

  // ── EXPORT: resolve active ChatGPT tab and forward ──
  if (msg.type === "EXPORT") {
    (async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        console.log("[exporter:background] forwarding EXPORT to tab", {
          id: tab?.id,
          url: tab?.url,
        });

        if (!tab?.url?.startsWith("https://chatgpt.com")) {
          console.warn("[exporter:background] not a ChatGPT tab");
          sendResponse({ ok: false, error: "not on chatgpt.com" });
          return;
        }

        const response = await chrome.tabs.sendMessage(tab.id, { type: "EXPORT" });
        console.log("[exporter:background] content response", response);
        sendResponse({ ok: true, ...response });
      } catch (err) {
        console.error("[exporter:background] EXPORT routing failed", err);
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true; // async sendResponse
  }

  // ── DOWNLOAD: create markdown file and trigger download ──
  if (msg.type === "DOWNLOAD") {
    console.log("[exporter:background] DOWNLOAD received", {
      filename: msg.filename,
      contentLength: msg.content?.length,
    });

    try {
      const content = msg.content || "";
      console.log("[download] blob size:", content.length, "bytes");

      // Use data URL instead of blob URL — blob URLs are invalidated
      // when the MV3 service worker terminates, silently failing the download.
      const dataUrl =
        "data:text/markdown;charset=utf-8," + encodeURIComponent(content);

      console.log("[download] handler triggered, invoking chrome.downloads.download");
      chrome.downloads.download(
        {
          url: dataUrl,
          filename: msg.filename || "chat.md",
          saveAs: false,
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error("[exporter:background] download failed", chrome.runtime.lastError);
            sendResponse({ ok: false, error: chrome.runtime.lastError.message });
          } else {
            console.log("[download] download invoked, id:", downloadId);
            sendResponse({ ok: true, downloadId });
          }
        }
      );
    } catch (err) {
      console.error("[exporter:background] download error", err);
      sendResponse({ ok: false, error: err.message });
    }

    return true;
  }
});
