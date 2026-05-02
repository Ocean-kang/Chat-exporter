chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "DOWNLOAD") {
    const blob = new Blob([msg.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
      url,
      filename: msg.filename || "chat.md"
    });
  }
});
