// Quick-start link generator for the "Adding Devices" contributing page.
// Plain vanilla JS — no framework. Loaded via <Head> in adding-devices.mdx.
(function () {
  "use strict";

  var DEFAULT_REPO = "devices.esphome.io";

  function slugify(value) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]+/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  // Accepts a bare username, `user/repo`, or any common GitHub URL form:
  //   octocat
  //   octocat/my-fork
  //   github.com/octocat
  //   https://github.com/octocat/devices.esphome.io
  //   https://github.com/octocat/my-fork.git
  // Returns { user, repo } where repo falls back to DEFAULT_REPO when not
  // specified in the input.
  function parseFork(value) {
    var v = value.trim();
    if (!v) return null;
    v = v.replace(/^https?:\/\//i, "");
    v = v.replace(/^(www\.)?github\.com\//i, "");
    var match = v.match(/^([^\/\?#\s]+)(?:\/([^\/\?#\s]+))?/);
    if (!match) return null;
    var user = match[1];
    var repo = (match[2] || DEFAULT_REPO).replace(/\.git$/i, "");
    return { user: user, repo: repo };
  }

  // YAML double-quoted scalar — safely encodes any string (including names
  // containing ':', '"', '#', newlines, etc.) so the emitted front matter
  // always parses.
  function yamlDoubleQuotedString(value) {
    return (
      '"' +
      String(value)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\r/g, "\\r")
        .replace(/\n/g, "\\n") +
      '"'
    );
  }

  function buildTemplate(name) {
    var today = new Date().toISOString().slice(0, 10);
    var fence = "```";
    return [
      "---",
      "title: " + yamlDoubleQuotedString(name),
      "date-published: " + today,
      "type: ",
      "standard: ",
      "board: ",
      "---",
      "",
      "<!-- Describe the device here. See the front-matter table on the contributing page for valid options. -->",
      "",
      "## Basic Configuration",
      "",
      fence + "yaml",
      "# Paste a working ESPHome YAML configuration here",
      fence,
      "",
    ].join("\n");
  }

  function update() {
    var userInput = document.getElementById("quickstart-username");
    var nameInput = document.getElementById("quickstart-device");
    var pathHint = document.getElementById("quickstart-path");
    var link = document.getElementById("quickstart-link");
    var placeholder = document.getElementById("quickstart-placeholder");
    if (!userInput || !nameInput || !link || !placeholder) {
      return;
    }

    var fork = parseFork(userInput.value);
    var name = nameInput.value.trim();
    var slug = slugify(name);

    if (fork && slug) {
      if (pathHint) {
        pathHint.textContent = "";
        pathHint.appendChild(document.createTextNode("File will be created in "));

        var repoCode = document.createElement("code");
        repoCode.textContent = fork.user + "/" + fork.repo;
        pathHint.appendChild(repoCode);

        pathHint.appendChild(document.createTextNode(" at "));

        var fileCode = document.createElement("code");
        fileCode.textContent = "src/docs/devices/" + slug + "/index.md";
        pathHint.appendChild(fileCode);
      }
      var params = new URLSearchParams({
        filename: slug + "/index.md",
        value: buildTemplate(name),
      });
      link.href =
        "https://github.com/" +
        encodeURIComponent(fork.user) +
        "/" +
        encodeURIComponent(fork.repo) +
        "/new/main/src/docs/devices?" +
        params.toString();
      link.style.display = "inline-block";
      placeholder.style.display = "none";
    } else {
      if (pathHint) {
        pathHint.innerHTML = "";
      }
      link.style.display = "none";
      placeholder.style.display = "inline-block";
    }
  }

  function attach() {
    var userInput = document.getElementById("quickstart-username");
    var nameInput = document.getElementById("quickstart-device");
    if (!userInput || !nameInput) {
      return;
    }
    // Avoid attaching twice if the script runs again after SPA navigation.
    if (userInput.dataset.quickstartBound === "1") {
      update();
      return;
    }
    userInput.dataset.quickstartBound = "1";
    nameInput.dataset.quickstartBound = "1";
    userInput.addEventListener("input", update);
    nameInput.addEventListener("input", update);
    update();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attach);
  } else {
    attach();
  }
})();
