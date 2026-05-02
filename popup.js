document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("export");
  if (!btn) {
    console.error("[exporter:popup] export button not found");
    return;
  }

  btn.addEventListener("click", async () => {
    console.log("[exporter:popup] export clicked");

    try {
      console.log("[exporter:popup] sending EXPORT to background");
      const response = await chrome.runtime.sendMessage({ type: "EXPORT" });
      console.log("[exporter:popup] EXPORT response", response);

      if (!response?.ok) {
        alert("Export failed: " + (response?.error || "unknown error"));
      }
    } catch (err) {
      console.error("[exporter:popup] sendMessage failed", err);
      alert(
        "Failed to export. Make sure you're on a ChatGPT conversation page and the page has fully loaded."
      );
    }
  });
});
