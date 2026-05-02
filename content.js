const script = document.createElement("script");
script.src = chrome.runtime.getURL("injected.js");
document.documentElement.appendChild(script);

window.addEventListener("message", (e) => {
  if (e.data?.type === "CHAT_DATA") {
    window.__CHAT_DATA__ = e.data.data;
    console.log("[exporter] captured");
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "EXPORT") {
    if (!window.__CHAT_DATA__) {
      alert("No data captured. Reload page.");
      return;
    }

    const md = window.convertToMarkdown(window.__CHAT_DATA__);

    chrome.runtime.sendMessage({
      type: "DOWNLOAD",
      content: md,
      filename: "chat.md"
    });
  }
});
