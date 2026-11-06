// <remote-yaml-include url="..."> — fetches the URL when the element enters
// the DOM and renders the response as a yaml code block. GitHub blob/tree
// URLs are normalised to raw.githubusercontent.com so authors can paste the
// browsable URL straight from the address bar. Codeberg src/raw URLs and
// GitLab blob/raw URLs are normalised to their respective API raw endpoints,
// the only endpoints on either host that send an Access-Control-Allow-Origin
// header (the plain codeberg.org/gitlab.com raw endpoints do not, so a
// direct browser fetch would fail).
//
// Loaded globally via Starlight's head config; no build step. Plain ES2017+
// to keep the bundle tiny (no framework, no transpilation).
(function () {
  "use strict";

  if (typeof window === "undefined" || !("customElements" in window)) return;
  if (window.customElements.get("remote-yaml-include")) return;

  function rawifyUrl(url) {
    try {
      var u = new URL(url, window.location.href);
      if (u.hostname === "raw.githubusercontent.com") return url;

      if (u.hostname === "codeberg.org") {
        return rawifyCodeberg(url, u) || url;
      }

      if (u.hostname === "gitlab.com") {
        return rawifyGitlab(url, u) || url;
      }

      if (u.hostname !== "github.com") return url;
      // Map github.com /{owner}/{repo}/{blob|raw}/{ref}/{...path} to the
      // raw.githubusercontent.com canonical form. GitHub's "Copy raw URL"
      // button now emits the explicit /refs/heads/<branch>/ shape, so we
      // produce that for branches; commit SHAs go in plain; refs already in
      // /refs/{heads|tags}/ form are preserved.
      // Note: branch names containing "/" are inherently ambiguous from a
      // github.com URL — author should paste the raw URL directly.
      // Path segments are URL-decoded first so `%2F` in a branch name and
      // `%20` in a path round-trip correctly through `encodeURIComponent`.
      var rawSegments = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
      var parts = [];
      for (var i = 0; i < rawSegments.length; i++) {
        try {
          parts.push(decodeURIComponent(rawSegments[i]));
        } catch (_) {
          return url;
        }
      }
      if (parts.length < 5) return url;
      var owner = parts[0];
      var repo = parts[1];
      var kind = parts[2];
      if (kind !== "blob" && kind !== "raw") return url;

      var refPart, restStart;
      if (
        parts[3] === "refs" &&
        (parts[4] === "heads" || parts[4] === "tags") &&
        parts.length >= 7
      ) {
        refPart =
          "refs/" + parts[4] + "/" + encodeURIComponent(parts[5]);
        restStart = 6;
      } else if (/^[0-9a-f]{40}$/i.test(parts[3])) {
        refPart = parts[3];
        restStart = 4;
      } else {
        refPart = "refs/heads/" + encodeURIComponent(parts[3]);
        restStart = 4;
      }
      var restSegments = parts.slice(restStart).map(encodeURIComponent);
      return (
        "https://raw.githubusercontent.com/" +
        encodeURIComponent(owner) +
        "/" +
        encodeURIComponent(repo) +
        "/" +
        refPart +
        "/" +
        restSegments.join("/")
      );
    } catch (_) {
      return url;
    }
  }

  // Map codeberg.org /{owner}/{repo}/(src|raw)/(branch|tag|commit)/{ref}/{...path}
  // to the Codeberg API's raw endpoint - the plain codeberg.org raw endpoint
  // does not send Access-Control-Allow-Origin, so a browser fetch against it
  // would be blocked by CORS. Returns null (not a fallback) for anything that
  // isn't this exact shape (e.g. the legacy Gitea `/src/<ref>/<path>` form
  // with no branch/tag/commit segment) so the caller falls back to the
  // original url unchanged.
  function rawifyCodeberg(url, u) {
    var rawSegments = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
    var parts = [];
    for (var i = 0; i < rawSegments.length; i++) {
      try {
        parts.push(decodeURIComponent(rawSegments[i]));
      } catch (_) {
        return null;
      }
    }
    if (parts.length < 6) return null;
    var owner = parts[0];
    var repo = parts[1];
    var kind = parts[2];
    if (kind !== "src" && kind !== "raw") return null;
    var refKind = parts[3];
    if (refKind !== "branch" && refKind !== "tag" && refKind !== "commit") {
      return null;
    }
    var ref = parts[4];
    var pathSegments = parts.slice(5);
    if (!ref || pathSegments.length === 0) return null;

    return (
      "https://codeberg.org/api/v1/repos/" +
      encodeURIComponent(owner) +
      "/" +
      encodeURIComponent(repo) +
      "/raw/" +
      pathSegments.map(encodeURIComponent).join("/") +
      "?ref=" +
      encodeURIComponent(ref)
    );
  }

  // Map gitlab.com /{namespace...}/{repo}/-/(blob|raw)/{ref}/{...path} to the
  // GitLab API's raw endpoint - the plain gitlab.com raw endpoint does not
  // send Access-Control-Allow-Origin, so a browser fetch against it would be
  // blocked by CORS. Namespaces can be nested (group/subgroup/repo), so the
  // literal `-` separator segment is located rather than assumed to be at a
  // fixed position; it must be at index >= 2 (at least one namespace segment
  // plus the repo before it). Returns null (not a fallback) for anything
  // that isn't this exact shape so the caller falls back to the original url
  // unchanged. Per the GitLab API, the project (namespace/repo) and the file
  // path are each a single encoded path component - slashes become %2F.
  function rawifyGitlab(url, u) {
    var rawSegments = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
    var parts = [];
    for (var i = 0; i < rawSegments.length; i++) {
      try {
        parts.push(decodeURIComponent(rawSegments[i]));
      } catch (_) {
        return null;
      }
    }
    var dashIndex = -1;
    for (var j = 2; j < parts.length; j++) {
      if (parts[j] === "-") {
        dashIndex = j;
        break;
      }
    }
    if (dashIndex === -1) return null;
    var kind = parts[dashIndex + 1];
    if (kind !== "blob" && kind !== "raw") return null;
    var ref = parts[dashIndex + 2];
    var pathSegments = parts.slice(dashIndex + 3);
    if (!ref || pathSegments.length === 0) return null;
    var namespace = parts.slice(0, dashIndex - 1).join("/");
    var repo = parts[dashIndex - 1];
    var project = namespace + "/" + repo;
    var filePath = pathSegments.join("/");

    return (
      "https://gitlab.com/api/v4/projects/" +
      encodeURIComponent(project) +
      "/repository/files/" +
      encodeURIComponent(filePath) +
      "/raw?ref=" +
      encodeURIComponent(ref)
    );
  }

  function flashCopy(btn, value, idleLabel, successLabel) {
    if (!navigator.clipboard) {
      btn.textContent = "Clipboard unavailable";
      setTimeout(function () { btn.textContent = idleLabel; }, 1500);
      return;
    }
    navigator.clipboard
      .writeText(value)
      .then(function () {
        btn.textContent = successLabel;
        setTimeout(function () { btn.textContent = idleLabel; }, 1500);
      })
      .catch(function () {
        btn.textContent = "Copy failed";
        setTimeout(function () { btn.textContent = idleLabel; }, 1500);
      });
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // Lightweight YAML tokenizer → HTML matching Expressive Code's structure
  // (`<div class="ec-line"><div class="code"><span style="--0:...;--1:...">…</span>…</div></div>`)
  // so EC's existing CSS in ec.v4551.css colours the tokens, lays out the
  // box, and styles the scrollbar without us re-implementing any of it.
  // The hex pairs come from Starlight's Shiki theme (Night Owl-derived);
  // see the dark/light columns extracted from rendered file= blocks.
  var TOKEN_STYLE = {
    comment: "--0:#919F9F;--1:#5F636F;--0fs:italic;--1fs:italic",
    string:  "--0:#ECC48D;--1:#3B61B0",
    key:     "--0:#7FDBCA;--1:#111111",
    number:  "--0:#F78C6C;--1:#AA0982",
    boolean: "--0:#FF6A83;--1:#A24848",
    anchor:  "--0:#C792EA;--1:#8844AE",
    tag:     "--0:#C792EA;--1:#8844AE",
    punct:   "--0:#D6DEEB;--1:#403F53",
  };

  function highlightYaml(text) {
    var lines = text.split("\n");
    var out = "";
    for (var li = 0; li < lines.length; li++) {
      out +=
        '<div class="ec-line"><div class="code">' +
        highlightYamlLine(lines[li]) +
        "</div></div>";
    }
    return out;
  }

  function highlightYamlLine(line) {
    var html = "";
    var i = 0;
    var n = line.length;
    var seenKey = false;

    function plain(s) {
      // Plain text gets the default-foreground style so it tracks the theme.
      html +=
        '<span style="' + TOKEN_STYLE.punct + '">' + escapeHtml(s) + "</span>";
    }
    function tok(klass, s) {
      html +=
        '<span style="' + TOKEN_STYLE[klass] + '">' + escapeHtml(s) + "</span>";
    }
    function valueDelimAt(idx) {
      if (idx >= n) return true;
      var c = line.charAt(idx);
      return c === " " || c === "\t" || c === "," || c === "]" || c === "}" || c === "#";
    }
    function atValueStart(idx) {
      if (idx === 0) return true;
      var c = line.charAt(idx - 1);
      return c === " " || c === "\t" || c === ":" || c === "," || c === "[" || c === "{" || c === "-";
    }

    while (i < n) {
      var rest = line.slice(i);
      var c = line.charAt(i);
      var prev = i === 0 ? " " : line.charAt(i - 1);

      // Comment — '#' must be at start-of-line or follow whitespace.
      if (c === "#" && (i === 0 || /\s/.test(prev))) {
        tok("comment", rest);
        return html;
      }

      // Double-quoted string
      if (c === '"') {
        var m = rest.match(/^"(?:\\.|[^"\\])*"/);
        if (m) {
          tok("string", m[0]);
          i += m[0].length;
          continue;
        }
      }
      // Single-quoted string
      if (c === "'") {
        var m2 = rest.match(/^'(?:''|[^'])*'/);
        if (m2) {
          tok("string", m2[0]);
          i += m2[0].length;
          continue;
        }
      }
      // Anchor / alias
      if (c === "&" || c === "*") {
        var ma = rest.match(/^[&*][A-Za-z0-9_.\-]+/);
        if (ma) {
          tok("anchor", ma[0]);
          i += ma[0].length;
          continue;
        }
      }
      // Tag (!foo or !!str)
      if (c === "!") {
        var mt = rest.match(/^!{1,2}[A-Za-z0-9_.\-]+/);
        if (mt) {
          tok("tag", mt[0]);
          i += mt[0].length;
          continue;
        }
      }

      if (!seenKey) {
        var mk = rest.match(/^([A-Za-z_][\w.+\-]*)(\s*:)(?=\s|$)/);
        if (mk) {
          tok("key", mk[1]);
          plain(mk[2]);
          i += mk[0].length;
          seenKey = true;
          continue;
        }
      } else if (atValueStart(i)) {
        var mn = rest.match(
          /^-?(?:0x[0-9a-fA-F]+|0o[0-7]+|\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)/
        );
        if (mn && valueDelimAt(i + mn[0].length)) {
          tok("number", mn[0]);
          i += mn[0].length;
          continue;
        }
        var mb = rest.match(/^(true|false|null|yes|no|on|off|~)/i);
        if (mb && valueDelimAt(i + mb[0].length)) {
          tok("boolean", mb[0]);
          i += mb[0].length;
          continue;
        }
      }

      plain(c);
      i++;
    }
    return html;
  }

  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (Object.prototype.hasOwnProperty.call(attrs, k)) {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    if (text != null) node.textContent = text;
    return node;
  }

  var STATE = { idle: 0, loading: 1, ready: 2, error: 3 };

  class RemoteYamlInclude extends HTMLElement {
    connectedCallback() {
      if (this._wired) return;
      this._wired = true;
      var url = this.getAttribute("url");
      if (!url) {
        this._render(STATE.error, "Missing url attribute");
        return;
      }
      this._fetchAndRender(url);
    }

    _fetchAndRender(url) {
      var rawUrl = rawifyUrl(url);
      this._render(STATE.loading, "Loading " + url + "…", { url: url });

      var self = this;
      fetch(rawUrl, {
        credentials: "omit",
        redirect: "follow",
        referrerPolicy: "no-referrer",
      })
        .then(function (res) {
          if (!res.ok) {
            throw new Error("HTTP " + res.status + " " + res.statusText);
          }
          return res.text();
        })
        .then(function (text) {
          self._render(STATE.ready, text, { url: url });
        })
        .catch(function (err) {
          self._render(STATE.error, "Failed to load " + url + ": " + err.message, { url: url });
        });
    }

    _render(state, text, meta) {
      meta = meta || {};
      // Keep the host element light-DOM; Starlight CSS targets descendants.
      this.replaceChildren();

      var header = el("div", { class: "remote-yaml-header" });
      var label = el(
        "a",
        {
          class: "remote-yaml-source",
          href: meta.url || this.getAttribute("url") || "#",
          target: "_blank",
          rel: "noopener noreferrer",
          referrerpolicy: "no-referrer",
          title: "Open the upstream source",
        },
        meta.url || this.getAttribute("url") || ""
      );
      header.appendChild(label);

      if (state === STATE.ready) {
        var copy = el(
          "button",
          { type: "button", class: "remote-yaml-copy" },
          "Copy"
        );
        copy.addEventListener("click", function () {
          flashCopy(copy, text, "Copy", "Copied");
        });
        header.appendChild(copy);
      }
      this.appendChild(header);

      // Render the code block inside Expressive Code's exact DOM structure
      // (div.expressive-code > figure.frame > figcaption.header + pre.code).
      // The build-time remark plugin emits a hidden EC trigger on this page
      // so EC's stylesheet is loaded; our element then inherits the same
      // background, fonts, scrollbar, and token colours as a `file=` block.
      var ec = el("div", { class: "expressive-code" });
      var fig = el("figure", { class: "frame not-content" });
      fig.appendChild(el("figcaption", { class: "header" }));

      var pre = el("pre", {
        "data-language": "yaml",
        tabindex: "0",
        class: "remote-yaml-body",
      });
      pre.dataset.state =
        state === STATE.loading
          ? "loading"
          : state === STATE.error
          ? "error"
          : "ready";
      var code = el("code");
      if (state === STATE.ready) {
        code.innerHTML = highlightYaml(text);
      } else {
        code.textContent = text;
      }
      pre.appendChild(code);
      fig.appendChild(pre);
      ec.appendChild(fig);
      this.appendChild(ec);
    }
  }

  window.customElements.define("remote-yaml-include", RemoteYamlInclude);
})();
