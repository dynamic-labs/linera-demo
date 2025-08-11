(() => {
  const shouldMark = (url) => {
    try {
      const u = new URL(url, document.baseURI);
      return /\.dynamicauth\.com$/.test(u.hostname) || u.hostname === "relay.dynamicauth.com";
    } catch {
      return false;
    }
  };

  // Ensure any iframe created gets credentialless before navigation
  try {
    const desc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "src");
    if (desc && desc.set) {
      const origSet = desc.set;
      Object.defineProperty(HTMLIFrameElement.prototype, "src", {
        configurable: true,
        enumerable: desc.enumerable,
        get: desc.get,
        set(value) {
          if (shouldMark(value)) {
            try {
              this.credentialless = true;
            } catch { }
          }
          return origSet.call(this, value);
        },
      });
    }
  } catch { }

  // Patch setAttribute('src', ...) as well
  try {
    const origSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      if (
        this instanceof HTMLIFrameElement &&
        name &&
        name.toLowerCase() === "src" &&
        shouldMark(value)
      ) {
        try {
          this.credentialless = true;
        } catch { }
      }
      return origSetAttribute.call(this, name, value);
    };
  } catch { }

  // As a fallback, observe inserted iframes and mark them before they navigate next
  try {
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node instanceof HTMLIFrameElement) {
            try {
              node.credentialless = true;
            } catch { }
          } else if (node && node.querySelectorAll) {
            node
              .querySelectorAll("iframe")
              .forEach((f) => {
                try {
                  f.credentialless = true;
                } catch { }
              });
          }
        }
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  } catch { }
})();

