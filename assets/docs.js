(() => {
  const root = document.documentElement;
  const body = document.body;
  const searchInput = document.querySelector("[data-search-input]");
  const searchResults = document.querySelector("[data-search-results]");
  const menuButton = document.querySelector("[data-menu-toggle]");
  const backdrop = document.querySelector("[data-drawer-backdrop]");
  const sidebar = document.querySelector("[data-sidebar]");
  const drawerMedia = window.matchMedia("(max-width: 1024px)");
  const sidebarKey = "interview-docs-sidebar-collapsed";
  const drawerBackground = [
    document.querySelector(".skip-link"),
    ...document.querySelectorAll(".topbar > :not([data-menu-toggle])"),
    ...document.querySelectorAll(".docs-layout > :not([data-sidebar])"),
  ].filter(Boolean);

  function setTheme(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem("interview-docs-theme", theme); } catch {}
  }

  document.querySelector("[data-theme-toggle]")?.addEventListener("click", () => {
    setTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });

  if (sidebar && menuButton) {
    sidebar.id ||= "site-sidebar";
    menuButton.setAttribute("aria-controls", sidebar.id);
  }

  function readSidebarCollapsed() {
    try { return localStorage.getItem(sidebarKey) === "1"; } catch { return false; }
  }

  function writeSidebarCollapsed(collapsed) {
    try { localStorage.setItem(sidebarKey, collapsed ? "1" : "0"); } catch {}
  }

  function setSidebarAvailability(available) {
    if (!sidebar) return;
    sidebar.setAttribute("aria-hidden", String(!available));
    sidebar.inert = !available;
  }

  function setDrawerBackgroundInert(inert) {
    drawerBackground.forEach((element) => { element.inert = inert; });
  }

  function setDrawer(open, restoreFocus = false) {
    const focusWasInSidebar = Boolean(sidebar?.contains(document.activeElement));
    body.classList.toggle("drawer-open", open);
    body.classList.remove("sidebar-collapsed");
    menuButton?.setAttribute("aria-expanded", String(open));
    menuButton?.setAttribute("aria-label", open ? "关闭文档导航" : "打开文档导航");
    if (menuButton) menuButton.textContent = open ? "×" : "☰";
    if (backdrop) backdrop.hidden = !open;
    if (open) {
      setDrawerBackgroundInert(true);
      setSidebarAvailability(true);
      sidebar?.querySelector("a")?.focus();
    } else {
      if (restoreFocus || focusWasInSidebar) menuButton?.focus();
      setSidebarAvailability(false);
      setDrawerBackgroundInert(false);
    }
  }

  function setDesktopSidebar(collapsed, persist = false) {
    const focusWasInSidebar = Boolean(sidebar?.contains(document.activeElement));
    body.classList.remove("drawer-open");
    body.classList.toggle("sidebar-collapsed", collapsed);
    setDrawerBackgroundInert(false);
    if (backdrop) backdrop.hidden = true;
    menuButton?.setAttribute("aria-expanded", String(!collapsed));
    menuButton?.setAttribute("aria-label", collapsed ? "展开文档导航" : "收起文档导航");
    if (menuButton) menuButton.textContent = collapsed ? "☰" : "‹";
    if (collapsed && focusWasInSidebar) menuButton?.focus();
    setSidebarAvailability(!collapsed);
    if (persist) writeSidebarCollapsed(collapsed);
  }

  function syncNavigationMode() {
    if (drawerMedia.matches) setDrawer(false);
    else setDesktopSidebar(readSidebarCollapsed());
  }

  menuButton?.addEventListener("click", () => {
    if (drawerMedia.matches) setDrawer(!body.classList.contains("drawer-open"));
    else setDesktopSidebar(!body.classList.contains("sidebar-collapsed"), true);
  });
  backdrop?.addEventListener("click", () => setDrawer(false, true));
  sidebar?.addEventListener("click", (event) => {
    if (drawerMedia.matches && event.target.closest("a")) setDrawer(false);
  });
  if (typeof drawerMedia.addEventListener === "function") drawerMedia.addEventListener("change", syncNavigationMode);
  else drawerMedia.addListener(syncNavigationMode);
  syncNavigationMode();

  document.querySelectorAll("[data-copy-code]").forEach((button) => {
    button.addEventListener("click", async () => {
      const code = button.closest(".code-block")?.querySelector("code")?.textContent ?? "";
      try {
        await navigator.clipboard.writeText(code);
        const original = button.textContent;
        button.textContent = "已复制";
        window.setTimeout(() => { button.textContent = original; }, 1400);
      } catch {
        button.textContent = "复制失败";
      }
    });
  });

  const tocLinks = [...document.querySelectorAll(".toc-link")];
  const observedHeadings = tocLinks
    .map((link) => document.getElementById(decodeURIComponent(link.hash.slice(1))))
    .filter(Boolean);
  if ("IntersectionObserver" in window && observedHeadings.length) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (!visible.length) return;
      const id = visible[0].target.id;
      tocLinks.forEach((link) => link.classList.toggle("active", decodeURIComponent(link.hash.slice(1)) === id));
    }, { rootMargin: "-70px 0px -72% 0px", threshold: [0, 1] });
    observedHeadings.forEach((heading) => observer.observe(heading));
  }

  const searchData = Array.isArray(window.__INTERVIEW_DOCS_SEARCH__) ? window.__INTERVIEW_DOCS_SEARCH__ : [];
  const isRepositoryPage = window.location.pathname.replaceAll("\\", "/").includes("/repositories/");
  function closeSearch() {
    if (searchResults) {
      searchResults.hidden = true;
      searchResults.replaceChildren();
    }
  }
  function search(query) {
    if (!searchResults) return;
    const terms = query.toLocaleLowerCase("zh-CN").trim().split(/\s+/).filter(Boolean);
    searchResults.replaceChildren();
    if (!terms.length) {
      searchResults.hidden = true;
      return;
    }
    const matches = searchData
      .map((item) => {
        const haystack = [item.title, item.headings.join(" "), item.text].join(" ").toLocaleLowerCase("zh-CN");
        const score = terms.reduce((total, term) => total + (item.title.toLocaleLowerCase("zh-CN").includes(term) ? 8 : 0) + (item.headings.join(" ").toLocaleLowerCase("zh-CN").includes(term) ? 4 : 0) + (haystack.includes(term) ? 1 : -20), 0);
        return { item, score };
      })
      .filter((entry) => entry.score >= terms.length)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
    if (!matches.length) {
      const empty = document.createElement("div");
      empty.className = "search-empty";
      empty.textContent = "没有找到匹配内容";
      searchResults.append(empty);
    } else {
      for (const { item } of matches) {
        const link = document.createElement("a");
        link.className = "search-result";
        link.href = isRepositoryPage ? "../" + item.href : item.href;
        const title = document.createElement("strong");
        title.textContent = item.title;
        const context = document.createElement("span");
        const matchedHeading = item.headings.find((heading) => terms.some((term) => heading.toLocaleLowerCase("zh-CN").includes(term)));
        context.textContent = matchedHeading || item.summary || "打开文档查看匹配内容";
        link.append(title, context);
        searchResults.append(link);
      }
    }
    searchResults.hidden = false;
  }
  searchInput?.addEventListener("input", () => search(searchInput.value));
  searchInput?.addEventListener("focus", () => {
    if (searchInput.value.trim()) search(searchInput.value);
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-shell")) closeSearch();
  });
  document.addEventListener("keydown", (event) => {
    if (drawerMedia.matches && body.classList.contains("drawer-open") && event.key === "Tab") {
      const sidebarItems = [...(sidebar?.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? [])];
      const firstItem = sidebarItems[0];
      const lastItem = sidebarItems.at(-1);
      if (!event.shiftKey && document.activeElement === menuButton && firstItem) {
        event.preventDefault();
        firstItem.focus();
      } else if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        menuButton?.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        menuButton?.focus();
      } else if (event.shiftKey && document.activeElement === menuButton && lastItem) {
        event.preventDefault();
        lastItem.focus();
      }
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
      event.preventDefault();
      if (drawerMedia.matches && body.classList.contains("drawer-open")) return;
      searchInput?.focus();
    }
    if (event.key === "Escape") {
      closeSearch();
      if (drawerMedia.matches && body.classList.contains("drawer-open")) setDrawer(false, true);
      searchInput?.blur();
    }
  });

  const accordionRoot = document.querySelector("[data-interview-accordion]");
  if (accordionRoot) {
    const topicSections = [...accordionRoot.querySelectorAll("[data-topic]")];
    const questions = [...accordionRoot.querySelectorAll("details")];
    const localSearch = document.querySelector("[data-accordion-search]");
    const status = document.querySelector("[data-accordion-status]");

    function visibleQuestions() {
      return questions.filter((question) => !question.hidden && !question.closest("[data-topic]")?.hidden);
    }

    function updateAccordionStatus() {
      if (!status) return;
      const visible = visibleQuestions();
      const openCount = visible.filter((question) => question.open).length;
      status.textContent = `当前显示 ${visible.length} 题，已展开 ${openCount} 题`;
    }

    function setVisibleQuestions(open) {
      visibleQuestions().forEach((question) => { question.open = open; });
      updateAccordionStatus();
    }

    document.querySelector("[data-accordion-expand]")?.addEventListener("click", () => setVisibleQuestions(true));
    document.querySelector("[data-accordion-collapse]")?.addEventListener("click", () => setVisibleQuestions(false));

    questions.forEach((question) => question.addEventListener("toggle", updateAccordionStatus));

    localSearch?.addEventListener("input", () => {
      const terms = localSearch.value.toLocaleLowerCase("zh-CN").trim().split(/\s+/).filter(Boolean);
      for (const topic of topicSections) {
        const topicQuestions = [...topic.querySelectorAll("details")];
        let matches = 0;
        for (const question of topicQuestions) {
          const text = question.textContent.toLocaleLowerCase("zh-CN");
          const matched = !terms.length || terms.every((term) => text.includes(term));
          question.hidden = !matched;
          if (matched) {
            matches += 1;
            if (terms.length) question.open = true;
          }
        }
        topic.hidden = matches === 0;
      }
      updateAccordionStatus();
    });

    updateAccordionStatus();
  }
})();
