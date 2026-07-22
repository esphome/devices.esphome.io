// <yaml-include-action data-include="…"> — renders a small button that
// copies an ESPHome `!include github://…@branch` directive to the user's
// clipboard. The remark-yaml-include build-time plugin emits one of these
// right after every yaml code block that came from a `file=` fence.
//
// Loaded globally via Starlight's head config; plain ES2017+ to keep the
// bundle tiny (no framework, no transpilation).
(function () {
  "use strict";

  if (typeof window === "undefined" || !("customElements" in window)) return;
  if (window.customElements.get("yaml-include-action")) return;

  class YamlIncludeAction extends HTMLElement {
    connectedCallback() {
      if (this._wired) return;
      this._wired = true;

      var directive = this.getAttribute("data-include") || "";
      if (!directive) return;

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "yaml-include-copy";
      btn.title = directive;
      btn.textContent = "Copy !include";

      var self = this;
      btn.addEventListener("click", function () {
        if (!navigator.clipboard) {
          self._flash(btn, "Clipboard unavailable");
          return;
        }
        navigator.clipboard
          .writeText(directive)
          .then(function () {
            self._flash(btn, "Copied !include");
          })
          .catch(function () {
            self._flash(btn, "Copy failed");
          });
      });

      this.appendChild(btn);
    }

    _flash(btn, message) {
      var original = btn.textContent;
      btn.textContent = message;
      btn.classList.add("is-flashing");
      setTimeout(function () {
        btn.textContent = original;
        btn.classList.remove("is-flashing");
      }, 1500);
    }
  }

  window.customElements.define("yaml-include-action", YamlIncludeAction);
})();
