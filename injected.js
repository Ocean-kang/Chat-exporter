(function () {
  "use strict";

  console.log("[exporter:injected] active, patching fetch + XHR");

  function send(data) {
    console.log("[exporter:injected] posting CHAT_DATA", data?.title);
    window.postMessage({ type: "CHAT_DATA", data: data }, "*");
  }

  function getUrl(input) {
    if (typeof input === "string") return input;
    if (input instanceof Request) return input.url;
    if (input instanceof URL) return input.href;
    return "";
  }

  function match(url) {
    return typeof url === "string" && url.includes("/backend-api/conversation/");
  }

  // --- fetch ---
  var _fetch = window.fetch;
  window.fetch = function (input, init) {
    var url = getUrl(input);
    var res = _fetch.call(this, input, init);
    if (match(url)) {
      console.log("[exporter:injected] fetch intercepted", url);
      res
        .then(function (r) { return r.ok ? r.clone().json() : null; })
        .then(function (data) { if (data) send(data); })
        .catch(function (err) { console.error("[exporter:injected] fetch parse error", err); });
    }
    return res;
  };

  // --- XHR ---
  var _open = XMLHttpRequest.prototype.open;
  var _send = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this.__chatUrl = url;
    return _open.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function () {
    var self = this;
    if (match(self.__chatUrl) && (!self.responseType || self.responseType === "text" || self.responseType === "")) {
      self.addEventListener("load", function () {
        try {
          var data = JSON.parse(self.responseText);
          console.log("[exporter:injected] XHR intercepted", self.__chatUrl);
          send(data);
        } catch (e) {
          console.error("[exporter:injected] XHR parse error", e);
        }
      }, { once: true });
    }
    return _send.apply(this, arguments);
  };
})();
