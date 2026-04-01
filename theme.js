(function () {
  /**
   * null = follow prefers-color-scheme (updates when the OS theme changes).
   * 'light' | 'dark' = visitor picked a segment; cleared on next OS appearance change.
   */
  var override = null;

  function systemIsDark() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function preference() {
    return override;
  }

  function effectiveIsDark(pref) {
    if (pref === "dark") return true;
    if (pref === "light") return false;
    return systemIsDark();
  }

  function motionOk() {
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function resolveUrl(u) {
    try {
      return new URL(u, window.location.href).href;
    } catch (e) {
      return u;
    }
  }

  function setScreenshotSrc(img, dark, animate) {
    var lightSrc = img.getAttribute("data-screenshot-light");
    var darkSrc = img.getAttribute("data-screenshot-dark");
    if (!lightSrc || !darkSrc) return;
    var next = dark ? darkSrc : lightSrc;
    if (resolveUrl(img.getAttribute("src") || "") === resolveUrl(next)) return;

    if (!animate || !motionOk()) {
      img.src = next;
      return;
    }

    window.clearTimeout(img._themeFadeFallback);
    img.style.opacity = "0.58";
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        var finished = false;
        var done = function () {
          if (finished) return;
          finished = true;
          img.style.opacity = "1";
        };
        img.addEventListener("load", done, { once: true });
        img.src = next;
        img._themeFadeFallback = window.setTimeout(done, 520);
      });
    });
  }

  function setDomTheme(pref) {
    if (pref === "light" || pref === "dark") {
      document.documentElement.setAttribute("data-theme", pref);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }

  function apply(pref, options) {
    var initial = options && options.initial;
    var dark = effectiveIsDark(pref);
    setDomTheme(pref);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";

    document.querySelectorAll("img[data-screenshot-light]").forEach(function (img) {
      setScreenshotSrc(img, dark, !initial);
    });

    var wrap = document.getElementById("theme-toggle-wrap");
    if (!wrap) return;
    wrap.querySelectorAll("[data-theme-choice]").forEach(function (btn) {
      var choice = btn.getAttribute("data-theme-choice");
      var active = (choice === "light" && !dark) || (choice === "dark" && dark);
      btn.setAttribute("aria-checked", active ? "true" : "false");
    });
  }

  function onSystemSchemeChange() {
    override = null;
    apply(null);
  }

  function subscribeSchemeChanges() {
    var mql = window.matchMedia("(prefers-color-scheme: dark)");
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onSystemSchemeChange);
    } else if (typeof mql.addListener === "function") {
      mql.addListener(onSystemSchemeChange);
    }
  }

  function init() {
    try {
      localStorage.removeItem("sunnyDaySiteTheme");
    } catch (e) {}

    apply(preference(), { initial: true });

    subscribeSchemeChanges();

    var wrap = document.getElementById("theme-toggle-wrap");
    if (!wrap) return;

    wrap.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-theme-choice]");
      if (!btn || !wrap.contains(btn)) return;
      var choice = btn.getAttribute("data-theme-choice");
      if (choice !== "light" && choice !== "dark") return;
      override = choice;
      apply(override);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
