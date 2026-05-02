(function () {
  function send(data) {
    window.postMessage({ type: "CHAT_DATA", data }, "*");
  }

  function capture(url, promise) {
    if (url.includes("/backend-api/conversation/")) {
      promise.then(send).catch(() => {});
    }
  }

  const origFetch = window.fetch;
  window.fetch = function (...args) {
    const res = origFetch.apply(this, args);
    capture(args[0], res.then(r => r.clone().json()));
    return res;
  };

  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, url) {
    this._url = url;
    return origOpen.apply(this, arguments);
  };

  const origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function () {
    this.addEventListener("load", () => {
      if (this._url.includes("/backend-api/conversation/")) {
        try {
          send(JSON.parse(this.responseText));
        } catch {}
      }
    });
    return origSend.apply(this, arguments);
  };
})();
