(() => {
  const storageKey = "kevinmamaqi-theme";
  const root = document.documentElement;
  const media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  root.dataset.js = "true";

  const savedTheme = () => {
    try {
      const theme = window.localStorage.getItem(storageKey);
      return theme === "light" || theme === "dark" ? theme : null;
    } catch {
      return null;
    }
  };

  const isDark = () => savedTheme() === "dark" || (!savedTheme() && Boolean(media?.matches));

  const updateControls = () => {
    const dark = isDark();
    document.querySelectorAll("[data-theme-toggle]").forEach((control) => {
      control.setAttribute("aria-pressed", String(dark));
      control.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    });

    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", dark ? "#17191B" : "#F7F3EC");
  };

  const setTheme = (theme) => {
    root.dataset.theme = theme;
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
      // Browsing can still continue when storage is unavailable.
    }
    updateControls();
  };

  const theme = savedTheme();
  if (theme) root.dataset.theme = theme;

  const attachControls = () => {
    document.querySelectorAll("[data-theme-toggle]").forEach((control) => {
      control.addEventListener("click", () => setTheme(isDark() ? "light" : "dark"));
    });
    updateControls();
  };

  const attachMenus = () => {
    document.querySelectorAll("[data-menu-toggle]").forEach((control) => {
      const header = control.closest(".site-header");
      const navigation = header?.querySelector(".nav");
      if (!header || !navigation) return;

      const setMenuOpen = (open) => {
        if (open) header.dataset.menuOpen = "true";
        else delete header.dataset.menuOpen;
        control.setAttribute("aria-expanded", String(open));
        control.querySelector(".sr-only")?.replaceChildren(open ? "Close navigation menu" : "Open navigation menu");
      };

      control.addEventListener("click", () => setMenuOpen(header.dataset.menuOpen !== "true"));
      navigation.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("a")) setMenuOpen(false);
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setMenuOpen(false);
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      attachControls();
      attachMenus();
    }, { once: true });
  } else {
    attachControls();
    attachMenus();
  }

  media?.addEventListener?.("change", () => {
    if (!savedTheme()) updateControls();
  });
})();
