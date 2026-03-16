(function () {
  const themeStorageKey = "inkos-prototype-theme";
  const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const initialMock = window.inkosPrototypeMockData || { meta: { stateKey: "inkos-prototype-state-v2" } };
  const stateStorageKey = initialMock.meta?.stateKey || "inkos-prototype-state-v2";
  const iconMap = {
    brand:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4.5" width="16" height="15" rx="1.5"></rect><path d="M9 4.5v15"></path></svg>',
    dashboard:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1"></rect><rect x="13.5" y="3.5" width="7" height="7" rx="1"></rect><rect x="3.5" y="13.5" width="7" height="7" rx="1"></rect><rect x="13.5" y="13.5" width="7" height="7" rx="1"></rect></svg>',
    chief:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5l1.8 4.2 4.2 1.8-4.2 1.8-1.8 4.2-1.8-4.2-4.2-1.8 4.2-1.8z"></path><path d="M18 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"></path></svg>',
    books:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5.5a2 2 0 0 1 2-2h11v15.5H8a3 3 0 0 0-3 3z"></path><path d="M7 3.5v15.5"></path><path d="M8 19h10"></path></svg>',
    materials:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5l8 4.5-8 4.5-8-4.5z"></path><path d="M4 14.5l8 4.5 8-4.5"></path><path d="M4 9l8 4.5 8-4.5"></path></svg>',
    automation:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h4l2.5-5 3 10 2.5-5H20"></path></svg>',
    settings:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.6-.9 1 1 0 0 0-1.1.2l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.6 1 1 0 0 0-.2-1.1l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .6.9 1 1 0 0 0 1.1-.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.6z"></path></svg>',
    themeLight:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2.5v3"></path><path d="M12 18.5v3"></path><path d="M4.9 4.9l2.1 2.1"></path><path d="M17 17l2.1 2.1"></path><path d="M2.5 12h3"></path><path d="M18.5 12h3"></path><path d="M4.9 19.1l2.1-2.1"></path><path d="M17 7l2.1-2.1"></path></svg>',
    themeDark:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.5A8.5 8.5 0 1 1 8.5 4 7 7 0 0 0 20 15.5z"></path></svg>'
  };

  let state = loadState();

  function clone(value) {
    return window.structuredClone ? window.structuredClone(value) : JSON.parse(JSON.stringify(value));
  }

  function loadState() {
    const saved = window.localStorage.getItem(stateStorageKey);
    if (!saved) return clone(initialMock);
    try {
      return mergeState(clone(initialMock), JSON.parse(saved));
    } catch {
      return clone(initialMock);
    }
  }

  function mergeState(base, incoming) {
    if (!incoming || typeof incoming !== "object") return base;
    Object.keys(incoming).forEach((key) => {
      if (incoming[key] && typeof incoming[key] === "object" && !Array.isArray(incoming[key]) && base[key] && typeof base[key] === "object" && !Array.isArray(base[key])) {
        mergeState(base[key], incoming[key]);
      } else {
        base[key] = incoming[key];
      }
    });
    return base;
  }

  function persistState() {
    window.localStorage.setItem(stateStorageKey, JSON.stringify(state));
  }

  function updateState(mutator, options) {
    mutator(state);
    persistState();
    renderCurrentPage();
    if (options?.toast) showToast(options.toast, options.tone || "active");
  }

  function findBook(bookId) {
    return state.books.find((book) => book.id === bookId) || state.books[0];
  }

  function getActiveBook() {
    return findBook(state.ui.activeBookId || state.books[0]?.id);
  }

  function setActiveBook(bookId) {
    if (bookId && state.books.some((book) => book.id === bookId)) state.ui.activeBookId = bookId;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("zh-CN");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function badgeTone(tone) {
    return tone ? ` ${tone}` : "";
  }

  function renderBadge(tone, label) {
    return `<span class="status-badge${badgeTone(tone)}">${escapeHtml(label)}</span>`;
  }

  function renderChip(label, active) {
    return `<span class="chip${active ? " active" : ""}">${escapeHtml(label)}</span>`;
  }

  function renderActionLink(label, href, variant, size, bookId) {
    const attrs = [`class="btn btn-${variant || "ghost"} btn-${size || "sm"}"`, `href="${href}"`];
    if (bookId) attrs.push(`data-target-book="${bookId}"`);
    return `<a ${attrs.join(" ")}>${escapeHtml(label)}</a>`;
  }

  function renderActionButton(label, action, variant, size, extra) {
    return `<button class="btn btn-${variant || "secondary"} btn-${size || "sm"}" type="button" data-action="${action}"${extra ? ` ${extra}` : ""}>${escapeHtml(label)}</button>`;
  }

  function riskWeight(tone) {
    if (tone === "danger") return 3;
    if (tone === "warning") return 2;
    return 1;
  }

  function getPageQueryState(page) {
    return state.ui[page] || {};
  }

  function getSelectedChiefThread() {
    const threadId = state.ui.chief?.selectedThreadId;
    return state.chief?.threads?.find((thread) => thread.id === threadId) || state.chief?.threads?.[0] || null;
  }

  function getThreadBook(thread) {
    return thread?.bookId ? findBook(thread.bookId) : getActiveBook();
  }

  function getSelectedAutomationJob() {
    const selectedJobId = state.ui.automation?.selectedJobId;
    return state.automation.queue.find((job) => job.id === selectedJobId) || state.automation.history.find((job) => job.id === selectedJobId) || state.automation.queue[0] || state.automation.history[0] || null;
  }

  function getAutomationJobBook(job) {
    if (!job) return null;
    return state.books.find((book) => job.target.includes(book.title)) || null;
  }

  function getAutomationJobRoute(job) {
    if (!job) return "../../automation-center/v2/index.html";
    const task = String(job.task || "").toLowerCase();
    const target = String(job.target || "").toLowerCase();
    if (task.includes("truth") || target.includes("truth")) return "../../truth-center/v2/index.html";
    if (task.includes("summary") || task.includes("material") || target.includes("materials")) return "../../materials-center/v2/index.html";
    if (task.includes("audit") || task.includes("write") || /\/\s*ch\d+/i.test(target)) return "../../chapter-workbench/v2/index.html";
    return "../../book-overview/v2/index.html";
  }

  function getCandidateCompareCopy(book, type, candidateId) {
    const compare = book.materialsCenter?.quickCompareCopy || [];
    const set = getMaterialSet(book, type);
    const index = set.findIndex((candidate) => candidate.id === candidateId);
    return compare[index >= 0 ? index : 0] || compare[0] || "";
  }

  function getCandidateStatus(book, draftId) {
    return book.materialsCenter?.library?.find((entry) => entry.id === draftId)?.status || "draft";
  }

  function isResolvedDrift(note) {
    const text = String(note || "");
    return text.includes("已完成") || text.includes("已核对") || text.includes("已收束");
  }

  function renderBookRouteLinks(book, current) {
    const links = [
      { key: "overview", label: "书籍总览", href: "../../book-overview/v2/index.html" },
      { key: "chapters", label: "章节工作台", href: "../../chapter-workbench/v2/index.html" },
      { key: "truth", label: "Truth Center", href: "../../truth-center/v2/index.html" },
      { key: "materials", label: "Materials", href: "../../materials-center/v2/index.html" }
    ];
    return links
      .map((link) =>
        `<a class="nav-item${link.key === current ? " active" : ""}" href="${link.href}" data-target-book="${book.id}"><span>${escapeHtml(link.label)}</span><span class="mono">${escapeHtml(book.id)}</span></a>`
      )
      .join("");
  }

  function findMutableChiefBook(draft) {
    const threadId = draft.ui.chief?.selectedThreadId;
    const thread = draft.chief?.threads?.find((entry) => entry.id === threadId);
    return draft.books.find((entry) => entry.id === thread?.bookId) || draft.books.find((entry) => entry.id === draft.ui.activeBookId) || draft.books[0];
  }

  function renderSelectOptions(options, selected) {
    return options.map((option) => `<option${selected === option ? " selected" : ""}>${escapeHtml(option)}</option>`).join("");
  }

  function getQuickResponses(page) {
    if (page === "dashboard") return state.dashboard.quickResponses;
    if (page === "books") return ["如果今天只能推进两本，建议先处理《吞天魔帝》和《焚星录》。", "《折月长歌》应先止血，但收益不如前两本直接。"];
    if (page === "bookOverview") return ["建议先修第 13 章，因为它阻断继续写章。角色草案是 medium 风险可撤销写入，可在修完后再锁定。"];
    if (page === "chief") {
      const thread = getSelectedChiefThread();
      if (thread?.id === "thread_global_ops") {
        return [
          "当前最值得盯的是《吞天魔帝》第 13 章和《折月长歌》的 truth drift，这两项会直接拖慢今日产出。",
          "如果你只想处理一个系统动作，先把调度队列里的 audit recheck 跑完，再看是否需要重排 materials 刷新。"
        ];
      }
      if (thread?.id === "thread_book_001_ch13" || thread?.id === "thread_book_001_audit") {
        return [
          "这条线程里最短路径仍然是先拉开裴烬动机，再把阵纹触发后移半拍。",
          "如果你要继续推进这一章，建议在 /chief 里只做计划和审批，把正文深读留在章节页完成。"
        ];
      }
      if (thread?.id === "thread_materials_cleanup") {
        return [
          "如果卷一末段只锁一个对手，黎槿仍然最稳，因为她能直接把资源争夺和试炼压力绑在一起。",
          "这条线程更适合先锁角色，再决定是否补监管派系；材料库和生成细节留给 /materials 处理。"
        ];
      }
      return state.chief.replies;
    }
    if (page === "chapterWorkbench") return ["核心问题是“角色动机落点”和“机制触发时机”挤在一个节拍上。修订应优先拆开这两个动作。"];
    if (page === "truthCenter") return ["当前最明显的漂移点是“封印阵纹完全启动”的措辞，这会早于 truth 里记录的机制节奏。"];
    if (page === "materialsCenter") return getActiveBook().materialsCenter?.quickCompareCopy || ["当前草案里，第一候选和卷线衔接最好。"];
    if (page === "automation") return state.automation.quickResponses;
    if (page === "settings") return state.settings.quickResponses;
    return ["当前 mock 页面已接入统一状态源。"];
  }

  function getQuickResponse(page) {
    const list = getQuickResponses(page);
    const index = state.ui[page]?.quickResponseIndex || 0;
    return list[index % list.length];
  }

  function getMaterialSet(book, type) {
    const sets = book.materialsCenter?.generatedSets?.[type] || [[]];
    const index = book.materialsCenter?.generationIndex?.[type] || 0;
    return sets[index] || sets[0] || [];
  }

  function getSelectedCandidate(book, type) {
    const selectedId = book.materialsCenter?.selectedCandidateIds?.[type];
    return getMaterialSet(book, type).find((candidate) => candidate.id === selectedId) || getMaterialSet(book, type)[0];
  }

  function getApprovalSelected(book) {
    const selectedApprovalId = state.ui.bookOverview.selectedApprovalId;
    return book.approvals.find((item) => item.id === selectedApprovalId) || book.approvals[0] || null;
  }

  function mutateLibraryStatus(book, draftId, status) {
    const item = book.materialsCenter?.library?.find((entry) => entry.id === draftId);
    if (item) {
      item.status = status;
      item.updatedAt = "刚刚";
    }
  }

  function applyDraft(book, draftId) {
    mutateLibraryStatus(book, draftId, "applied");
    book.approvals = (book.approvals || []).filter((approval) => approval.draftId !== draftId);
    book.pendingDrafts = Math.max(0, (book.pendingDrafts || 0) - 1);
    book.lastActivity = "刚刚保存 materials";
    if (book.id === "book_001") {
      book.latestAction = "反派草案已保存，回到第 13 章修订";
      book.runSnapshot.status = "awaiting chapter revision";
      book.runSnapshot.next = "返回章节页处理第 13 章";
    } else {
      book.latestAction = "materials 草案已保存";
      book.runSnapshot.status = "saved";
      book.runSnapshot.next = book.chapterCurrent ? `可继续第 ${book.chapterCurrent} 章或后续写作` : "返回书籍页继续推进";
      if (book.pendingDrafts === 0 && book.riskTone !== "danger") {
        book.riskTone = "active";
        book.riskLabel = "低风险";
      }
    }
    if (book.pendingDrafts === 0) {
      book.healthAlerts = (book.healthAlerts || []).filter((item) => !String(item.title).includes("草案待保存"));
    }
  }

  function discardDraft(book, draftId) {
    mutateLibraryStatus(book, draftId, "discarded");
    book.approvals = (book.approvals || []).filter((approval) => approval.draftId !== draftId);
    book.pendingDrafts = Math.max(0, (book.pendingDrafts || 0) - 1);
    book.lastActivity = "刚刚取消草案";
  }

  function regenerateMaterialCandidates(book, type) {
    const current = book.materialsCenter.generationIndex[type] || 0;
    const total = book.materialsCenter.generatedSets[type]?.length || 1;
    book.materialsCenter.generationIndex[type] = (current + 1) % total;
    const nextCandidate = getMaterialSet(book, type)[0];
    if (nextCandidate) book.materialsCenter.selectedCandidateIds[type] = nextCandidate.id;
  }

  function createBook() {
    const nextNumber = state.books.length + state.archivedBooks.length + 1;
    const id = `book_${String(nextNumber).padStart(3, "0")}`;
    state.books.unshift({
      id,
      title: `新建项目 ${nextNumber}`,
      phase: "planning",
      phaseLabel: "planning",
      active: true,
      archived: false,
      riskTone: "active",
      riskLabel: "低风险",
      latestAction: "等待总编建书",
      lastActivity: "刚刚创建",
      lastEditedAt: "刚刚",
      chapterCurrent: 0,
      chapterTarget: 30,
      wordCount: 0,
      truthFilesCount: 0,
      materialsCount: 0,
      pendingDrafts: 0,
      nextAction: { title: "先完成建书和类型约束", body: "这个项目还没有上下文，需要总编先跑 create_book 流程。" },
      chapterActivity: [],
      healthAlerts: [],
      decisions: [],
      approvals: [],
      runSnapshot: { tool: "create_book", status: "idle", next: "进入 /chief 建书" }
    });
    setActiveBook(id);
  }

  function applyChapterRevision(book) {
    state.ui.chapterWorkbench.revisionApplied = true;
    const first = book.chapterActivity?.[0];
    if (first) {
      first.statusTone = "success";
      first.statusLabel = "revised";
      first.note = "修订草案已应用，等待最终复核";
    }
    book.latestAction = "章节修订已应用";
    book.runSnapshot.status = "revised";
    book.runSnapshot.next = "执行 re-audit";
    book.healthAlerts = (book.healthAlerts || []).filter((item) => item.title !== "第 13 章审计未通过");
  }

  function rerunAudit(book) {
    const first = book.chapterActivity?.[0];
    if (state.ui.chapterWorkbench.revisionApplied && first) {
      first.statusTone = "success";
      first.statusLabel = "final";
      first.note = "重新审计通过，truth 可同步";
      book.riskTone = "active";
      book.riskLabel = "低风险";
      book.latestAction = "第 13 章已通过重审";
      book.runSnapshot.status = "passed";
      book.runSnapshot.next = "可继续第 14 章";
    }
  }

  function resolveTruthDrift(book) {
    const file = book.truthCenter?.files?.find((entry) => entry.id === state.ui.truthCenter.selectedFileId) || book.truthCenter?.files?.[0];
    if (file) {
      file.driftNote = "当前文件已完成核对，漂移已收束。";
      file.changes = file.changes.map((change) => ({ ...change, tone: change.tone === "warning" ? "success" : change.tone }));
    }
    book.riskTone = "active";
    book.riskLabel = "低风险";
    book.latestAction = "truth drift 已处理";
  }

  function toggleDaemon() {
    state.automation.daemon.running = !state.automation.daemon.running;
    state.automation.logs.unshift(`[${state.automation.daemon.running ? "09:18" : "09:17"}] daemon ${state.automation.daemon.running ? "resumed" : "paused"} by operator`);
  }

  function inspectNow() {
    state.automation.logs.unshift("[09:20] manual inspection completed");
    state.automation.queue.unshift({ id: `job_${900 + state.automation.queue.length + 20}`, target: "全项目 / inspect", task: "manual_inspect", status: "running", tone: "active" });
  }

  function retryJob(jobId) {
    const job = state.automation.queue.find((entry) => entry.id === jobId) || state.automation.history.find((entry) => entry.id === jobId);
    if (job) {
      job.status = "running";
      job.tone = "active";
      state.automation.logs.unshift(`[09:22] ${job.task} retried for ${job.target}`);
    }
  }

  function cancelJob(jobId) {
    const job = state.automation.queue.find((entry) => entry.id === jobId);
    if (job) {
      job.status = "cancelled";
      job.tone = "danger";
      state.automation.logs.unshift(`[09:24] ${job.task} cancelled for ${job.target}`);
    }
  }

  function resolveRailIcon(link) {
    const href = link.getAttribute("href") || "";
    if (href.includes("/dashboard/")) return iconMap.dashboard;
    if (href.includes("/chief/")) return iconMap.chief;
    if (href.includes("/books/")) return iconMap.books;
    if (href.includes("/materials-center/")) return iconMap.materials;
    if (href.includes("/automation-center/")) return iconMap.automation;
    if (href.includes("/settings/")) return iconMap.settings;
    return iconMap.dashboard;
  }

  function initRailIcons() {
    document.querySelectorAll(".brand-mark").forEach((mark) => {
      mark.innerHTML = iconMap.brand;
    });
    document.querySelectorAll(".rail-link").forEach((link) => {
      const label = link.getAttribute("aria-label") || link.textContent.trim() || "导航";
      const isActive = link.classList.contains("active");
      link.setAttribute("aria-current", isActive ? "page" : "false");
      link.innerHTML = `${resolveRailIcon(link)}<span class="sr-only">${label}</span>`;
    });
  }

  function initRailLayout() {
    document.querySelectorAll(".global-rail").forEach((rail) => {
      const railStack = rail.querySelector(".rail-stack");
      const themeStack = rail.querySelector(".theme-stack");
      const settingsLink = Array.from(rail.querySelectorAll(".rail-link")).find((link) => (link.getAttribute("href") || "").includes("/settings/"));
      if (!railStack || !themeStack || !settingsLink || !railStack.contains(settingsLink)) return;
      let utilityStack = rail.querySelector(".utility-stack");
      if (!utilityStack) {
        utilityStack = document.createElement("div");
        utilityStack.className = "utility-stack";
        rail.insertBefore(utilityStack, themeStack);
      }
      utilityStack.appendChild(settingsLink);
      utilityStack.appendChild(themeStack);
    });
  }

  function applyTheme(theme) {
    const normalizedTheme = theme === "dark" ? "dark" : "light";
    const nextTheme = normalizedTheme === "dark" ? "light" : "dark";
    document.body.dataset.theme = normalizedTheme;
    document.querySelectorAll(".theme-toggle").forEach((button) => {
      button.innerHTML = `${normalizedTheme === "dark" ? iconMap.themeLight : iconMap.themeDark}<span class="sr-only">切换到${nextTheme === "dark" ? "暗色" : "浅色"}主题</span>`;
      button.setAttribute("aria-label", `切换到${nextTheme === "dark" ? "暗色" : "浅色"}主题`);
      button.setAttribute("title", `切换到${nextTheme === "dark" ? "暗色" : "浅色"}主题`);
    });
  }

  function initThemeToggle() {
    document.querySelectorAll(".theme-stack").forEach((stack) => {
      stack.innerHTML = '<button class="theme-toggle" type="button" aria-label="切换主题"></button>';
    });
    const saved = window.localStorage.getItem(themeStorageKey);
    const initial = saved === "dark" || saved === "light" ? saved : systemThemeQuery.matches ? "dark" : "light";
    applyTheme(initial);
  }

  function showToast(message, tone) {
    let viewport = document.querySelector(".toast-viewport");
    if (!viewport) {
      viewport = document.createElement("div");
      viewport.className = "toast-viewport";
      document.body.appendChild(viewport);
    }
    const toast = document.createElement("div");
    toast.className = `toast ${tone || "active"}`;
    toast.textContent = message;
    viewport.appendChild(toast);
    window.setTimeout(() => toast.remove(), 2800);
  }

  function ensureModal() {
    if (document.getElementById("chief-modal")) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      '<div class="quick-modal" id="chief-modal"><div class="quick-dialog"><div class="modal-head"></div><div class="modal-scroll"></div><div class="modal-footer"></div></div></div>'
    );
  }

  function setTopbar(copyHtml, actionsHtml) {
    const copy = document.querySelector(".topbar-copy");
    const actions = document.querySelector(".topbar-actions");
    if (copy) copy.innerHTML = copyHtml;
    if (actions) actions.innerHTML = actionsHtml;
  }

  function setContext(headHtml, bodyHtml) {
    const head = document.querySelector(".context-head");
    const body = document.querySelector(".context-scroll");
    if (head) head.innerHTML = headHtml;
    if (body) body.innerHTML = bodyHtml;
  }

  function setInspector(headHtml, bodyHtml) {
    const head = document.querySelector(".inspector > .panel-head");
    const body = document.querySelector(".inspector-scroll");
    if (head) head.innerHTML = headHtml;
    if (body) body.innerHTML = bodyHtml;
  }

  function setMain(html) {
    const main = document.querySelector(".workspace-scroll .workspace-inner");
    if (!main) return;
    main.classList.remove("ops-width", "fluid-width");
    if (document.body.dataset.page !== "chief") main.classList.remove("reading-width");
    const page = document.body.dataset.page;
    if (page === "automation-center" || page === "settings") main.classList.add("ops-width");
    if (page === "dashboard" || page === "books") main.classList.add("fluid-width");
    main.innerHTML = html;
  }

  function setDock(html) {
    const dock = document.querySelector(".workspace-dock .workspace-inner");
    if (dock) dock.innerHTML = html;
  }

  function setModal(title, description, textareaValue, responseHtml, pageKey) {
    ensureModal();
    const modal = document.getElementById("chief-modal");
    modal.querySelector(".modal-head").innerHTML = `<div><p class="eyebrow">Chief Quick Query</p><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></div>${renderActionButton("关闭", "close-modal", "ghost", "sm", 'data-close-modal')}`;
    modal.querySelector(".modal-scroll").innerHTML = `<label class="field-label"><span>问题</span><textarea class="textarea" data-quick-query="${pageKey}">${escapeHtml(textareaValue)}</textarea></label><div class="tool-card"><div class="tool-head"><strong>chief.quick-response</strong>${renderBadge("active", pageKey)}</div><div class="tool-body stack-8"><p>${escapeHtml(responseHtml)}</p></div></div>`;
    modal.querySelector(".modal-footer").innerHTML = `${renderActionLink("升级到 /chief", "../../chief/v2/index.html", "secondary", "md", getActiveBook().id)}${renderActionButton("发送问题", `send-query:${pageKey}`, "primary", "md")}`;
  }

  function renderDashboard() {
    const books = state.books.slice();
    const sorted = getPageQueryState("dashboard").sortByRisk ? books.sort((a, b) => riskWeight(b.riskTone) - riskWeight(a.riskTone)) : books;
    const filtered = getPageQueryState("dashboard").onlyActive ? sorted.filter((book) => book.active) : sorted;
    const topBook = filtered[0] || state.books[0];
    setTopbar(
      "<p class=\"eyebrow\">Project Dashboard</p><h1>项目总览</h1><p>多书运营、daemon 健康和最近一次生产链路都在这一页汇总，当前全部由共享 mock 状态驱动。</p>",
      `${renderActionButton("问总编", "open-chief-modal", "secondary", "md", 'data-open-modal="chief-modal"')}${renderActionButton("新建书籍", "create-book", "primary", "md")}`
    );
    setMain(`
      <section class="stats-grid">
        <article class="stat-card surface-card"><span>今日产出</span><strong class="mono">${formatNumber(state.dashboard.todayWords)}</strong><span>+${state.dashboard.runsToday} runs / ${state.dashboard.retries} retries</span></article>
        <article class="stat-card surface-card"><span>活跃书籍</span><strong class="mono">${state.books.filter((book) => book.active).length}</strong><span>${state.books.filter((book) => book.pendingDrafts > 0).length} 本待确认</span></article>
        <article class="stat-card surface-card"><span>守护状态</span><strong class="mono">${state.automation.daemon.running ? "RUNNING" : "PAUSED"}</strong><span>下一轮巡检 ${state.automation.daemon.nextInspection}</span></article>
        <article class="stat-card surface-card"><span>待处理风险</span><strong class="mono">${state.books.filter((book) => book.riskTone !== "active").length}</strong><span>${state.books.filter((book) => book.riskTone === "danger").length} 个高风险</span></article>
      </section>
      <section class="page-grid cols-2">
        <article class="hero-card stack-12"><div class="panel-head"><div><p class="eyebrow">Today</p><h2>今日主任务</h2></div>${renderBadge(topBook.riskTone, topBook.riskLabel)}</div><div class="quote-box">${escapeHtml(topBook.nextAction.title)}</div><p class="section-copy">${escapeHtml(topBook.nextAction.body)}</p><div class="action-row">${renderActionLink("打开总编工作台", "../../chief/v2/index.html", "primary", "md", topBook.id)}${renderActionLink("查看当前书籍", "../../book-overview/v2/index.html", "secondary", "md", topBook.id)}</div></article>
        <article class="panel stack-12"><div class="panel-head"><div><p class="eyebrow">Throughput</p><h2>运行吞吐</h2></div>${renderBadge("success", "稳定轨道")}</div><div class="kpi-strip"><div class="kpi"><strong class="mono">${state.dashboard.activeSteps}</strong><span>运行中的 steps</span></div><div class="kpi"><strong class="mono">${state.dashboard.runsToday}</strong><span>今日 run 数</span></div><div class="kpi"><strong class="mono">${state.dashboard.retries}</strong><span>中断重试</span></div><div class="kpi"><strong class="mono">${state.dashboard.passRate}</strong><span>一次通过率</span></div></div></article>
      </section>
      <section class="table-shell"><div class="tool-head"><strong>active.books</strong><div class="action-row">${renderActionButton(getPageQueryState("dashboard").sortByRisk ? "按最近活跃排序" : "按风险排序", "dashboard-toggle-sort", "ghost", "sm")}${renderActionButton(getPageQueryState("dashboard").onlyActive ? "显示全部" : "筛选活跃", "dashboard-toggle-active", "secondary", "sm")}</div></div><table class="data-table"><thead><tr><th>书籍</th><th>阶段</th><th>当前章节</th><th>最新动作</th><th>风险</th><th>入口</th></tr></thead><tbody>${filtered.map((book) => `<tr><td><strong>${escapeHtml(book.title)}</strong><div class="page-note mono">${escapeHtml(book.id)}</div></td><td>${escapeHtml(book.phaseLabel)}</td><td class="mono">${book.chapterCurrent || "-"}</td><td>${escapeHtml(book.latestAction)}</td><td>${renderBadge(book.riskTone, book.riskLabel)}</td><td><div class="inline-actions">${renderActionLink("总编", "../../chief/v2/index.html", "ghost", "sm", book.id)}${renderActionLink("书页", "../../book-overview/v2/index.html", "ghost", "sm", book.id)}</div></td></tr>`).join("")}</tbody></table></section>
      <section class="page-grid cols-2"><article class="list-shell"><div class="tool-head"><strong>recent.runs</strong><span class="page-note mono">last ${state.dashboard.recentRuns.length} runs</span></div>${state.dashboard.recentRuns.map((run) => `<div class="list-row three"><span class="status-dot ${run.tone}"></span><div><strong>${escapeHtml(run.title)}</strong><p>${escapeHtml(run.body)}</p></div><span class="mono">${escapeHtml(run.when)}</span></div>`).join("")}</article><article class="list-shell"><div class="tool-head"><strong>operator.notes</strong><span class="page-note">集中处理</span></div>${state.dashboard.operatorNotes.map((note) => `<div class="list-row two"><div><strong>${escapeHtml(note.title)}</strong><p>${escapeHtml(note.body)}</p></div>${renderActionLink(note.cta, note.route, "secondary", "sm", note.bookId)}</div>`).join("")}</article></section>
    `);
    setInspector(`<div><p class="eyebrow">Ops</p><h2>右侧监控</h2></div>${renderActionLink("展开", "../../automation-center/v2/index.html", "ghost", "sm")}`, `<section class="context-card stack-12"><div class="panel-head"><h3>daemon.summary</h3>${renderBadge(state.automation.daemon.running ? "success" : "warning", state.automation.daemon.running ? "running" : "paused")}</div><div class="note-table"><div class="row"><span>writeCron</span><strong class="mono">${escapeHtml(state.automation.daemon.writeCron)}</strong></div><div class="row"><span>并发书籍</span><strong class="mono">${escapeHtml(state.automation.daemon.workers)}</strong></div><div class="row"><span>下一次巡检</span><strong class="mono">${escapeHtml(state.automation.daemon.nextInspection)}</strong></div></div></section><section class="context-card stack-12"><div class="panel-head"><h3>risk.alerts</h3>${renderBadge("danger", String(state.books.filter((book) => book.riskTone !== "active").length))}</div><div class="list-shell">${state.books.filter((book) => book.riskTone !== "active").map((book) => `<div class="list-row three"><span class="status-dot ${book.riskTone}"></span><div><strong>${escapeHtml(book.title)} / ${escapeHtml(book.latestAction)}</strong><p>${escapeHtml(book.nextAction.body)}</p></div><span class="mono">${escapeHtml(book.riskLabel)}</span></div>`).join("")}</div></section>`);
    setModal("从仪表盘问总编", "复杂任务会升级到 `/chief`，这里只保留轻量查询。", getPageQueryState("dashboard").quickQuery, getQuickResponse("dashboard"), "dashboard");
  }

  function renderBooks() {
    const ui = getPageQueryState("books");
    const query = ui.search.trim().toLowerCase();
    const portfolio = [
      ...state.books,
      ...(ui.showArchived
        ? state.archivedBooks.map((book) => ({
            ...book,
            archived: true,
            active: false,
            phase: "archived",
            riskTone: "",
            riskLabel: "archived",
            latestAction: "已归档，仅保留摘要视图",
            lastActivity: "已归档",
            pendingDrafts: 0
          }))
        : [])
    ];
    const visibleBooks = portfolio.filter((book) => {
      if (ui.filter === "active" && !book.active) return false;
      if (!ui.showArchived && book.archived) return false;
      const haystack = `${book.title} ${book.id} ${book.phaseLabel}`.toLowerCase();
      return !query || haystack.includes(query);
    }).slice();
    if (ui.sort === "risk") visibleBooks.sort((a, b) => riskWeight(b.riskTone) - riskWeight(a.riskTone));
    if (ui.sort === "words") visibleBooks.sort((a, b) => b.wordCount - a.wordCount);
    setTopbar("<p class=\"eyebrow\">Books Index</p><h1>书籍目录</h1><p>这一页用共享 mock 数据管理全部书籍筛选、排序、归档显示和建书动作。</p>", `${renderActionButton("问总编", "open-chief-modal", "secondary", "md", 'data-open-modal="chief-modal"')}${renderActionButton("创建新书", "create-book", "primary", "md")}`);
    setMain(`<section class="table-shell"><div class="tool-head"><strong>books.table</strong><div class="action-row"><label class="field-label" style="min-width:240px"><span class="sr-only">搜索书籍</span><input class="field" type="search" data-input="books-search" value="${escapeHtml(ui.search)}" placeholder="搜索书名、ID、阶段" /></label><button class="chip${ui.filter === "all" ? " active" : ""}" type="button" data-action="books-filter:all">全部 ${state.books.length + state.archivedBooks.length}</button><button class="chip${ui.filter === "active" ? " active" : ""}" type="button" data-action="books-filter:active">活跃 ${state.books.filter((book) => book.active).length}</button>${renderActionButton(ui.sort === "recent" ? "排序：最近活跃" : ui.sort === "risk" ? "排序：风险优先" : "排序：词数优先", "books-cycle-sort", "ghost", "sm")}${renderActionButton(ui.showArchived ? "隐藏归档" : "显示归档", "books-toggle-archived", "ghost", "sm")}</div></div><table class="data-table"><thead><tr><th>书名</th><th>阶段</th><th>章节</th><th>词数</th><th>最后活动</th><th>风险</th><th>入口</th></tr></thead><tbody>${visibleBooks.map((book) => `<tr><td><strong>${escapeHtml(book.title)}</strong><div class="page-note mono">${escapeHtml(book.id)}</div></td><td>${renderBadge(book.archived ? "" : book.riskTone === "danger" ? "danger" : "", book.phaseLabel)}</td><td class="mono">${book.chapterCurrent} / ${book.chapterTarget}</td><td class="mono">${formatNumber(book.wordCount)}</td><td>${escapeHtml(book.lastActivity)}</td><td>${book.archived ? '<span class="page-note">已归档</span>' : renderBadge(book.riskTone, book.riskLabel)}</td><td><div class="inline-actions">${book.archived ? '<span class="page-note">摘要保留</span>' : `${renderActionLink("书页", "../../book-overview/v2/index.html", "ghost", "sm", book.id)}${renderActionLink("总编", "../../chief/v2/index.html", "ghost", "sm", book.id)}`}</div></td></tr>`).join("")}</tbody></table></section>`);
    setInspector(`<div><p class="eyebrow">Portfolio</p><h2>目录摘要</h2></div>${renderActionLink("回总览", "../../dashboard/v2/index.html", "ghost", "sm")}`, `<section class="context-card stack-12"><div class="panel-head"><h3>阶段分布</h3><span class="mono">${state.books.length + state.archivedBooks.length} books</span></div><div class="note-table"><div class="row"><span>drafting</span><strong class="mono">${state.books.filter((book) => book.phase === "drafting").length}</strong></div><div class="row"><span>materials</span><strong class="mono">${state.books.filter((book) => book.phase === "materials").length}</strong></div><div class="row"><span>truth cleanup</span><strong class="mono">${state.books.filter((book) => book.phase === "truth cleanup").length}</strong></div><div class="row"><span>archived</span><strong class="mono">${state.archivedBooks.length}</strong></div></div></section><section class="context-card stack-12"><div class="panel-head"><h3>待处理提醒</h3>${renderBadge("warning", String(state.books.filter((book) => book.pendingDrafts || book.riskTone !== "active").length))}</div><div class="list-shell">${state.books.filter((book) => book.pendingDrafts || book.riskTone !== "active").map((book) => `<div class="list-row three"><span class="status-dot ${book.riskTone === "active" ? "primary" : book.riskTone}"></span><div><strong>${escapeHtml(book.title)} / ${escapeHtml(book.latestAction)}</strong><p>${escapeHtml(book.nextAction.body)}</p></div><span class="mono">${escapeHtml(book.riskLabel)}</span></div>`).join("")}</div></section>`);
    setModal("从目录发起", "适合先做排序和筛选建议，复杂处理会跳到 `/chief`。", ui.quickQuery, getQuickResponse("books"), "books");
  }

  function renderBookOverview() {
    const book = getActiveBook();
    const selectedApproval = getApprovalSelected(book);
    setTopbar(`<p class="eyebrow">Book Overview</p><h1>${escapeHtml(book.title)}</h1><div class="meta-row">${renderChip(book.id, true)}${renderChip(book.phaseLabel)}${renderChip(`最近编辑：${book.lastEditedAt}`)}</div>`, `${renderActionButton("问总编", "open-chief-modal", "secondary", "md", 'data-open-modal="chief-modal"')}${renderActionLink("继续主线程", "../../chief/v2/index.html", "primary", "md", book.id)}`);
    setContext(`<div><p class="eyebrow">Book Navigation</p><h2>${escapeHtml(book.title)}</h2></div>${renderBadge(book.riskTone, book.phase)}`, `${renderActionLink("书籍总览", "../../book-overview/v2/index.html", "ghost", "sm", book.id)}${renderActionLink("章节工作台", "../../chapter-workbench/v2/index.html", "ghost", "sm", book.id)}${renderActionLink("Truth Center", "../../truth-center/v2/index.html", "ghost", "sm", book.id)}${renderActionLink("Materials", "../../materials-center/v2/index.html", "ghost", "sm", book.id)}`);
    setMain(`<section class="tool-card"><div class="tool-head"><strong>system.next-action</strong>${renderBadge(book.riskTone, book.riskLabel)}</div><div class="tool-body stack-8"><h2 style="margin:0;font-size:20px;line-height:1.25">${escapeHtml(book.nextAction.title)}</h2><p class="section-copy">${escapeHtml(book.nextAction.body)}</p></div><div class="tool-actions"><div class="action-row">${renderActionLink("打开章节工作台", "../../chapter-workbench/v2/index.html", "primary", "sm", book.id)}${renderActionLink("查看角色草案", "../../materials-center/v2/index.html", "secondary", "sm", book.id)}</div></div></section><section class="stats-grid"><article class="stat-card"><span>总词数</span><strong class="mono">${formatNumber(book.wordCount)}</strong><span>目标章节 ${book.chapterTarget}</span></article><article class="stat-card"><span>当前章节</span><strong class="mono">${book.chapterCurrent} / ${book.chapterTarget}</strong><span>${escapeHtml(book.latestAction)}</span></article><article class="stat-card"><span>truth files</span><strong class="mono">${book.truthFilesCount}</strong><span>最近 1 次增量同步</span></article><article class="stat-card"><span>materials</span><strong class="mono">${book.materialsCount}</strong><span>${book.pendingDrafts} 个草案待处理</span></article></section><section class="page-grid cols-2"><article class="table-shell"><div class="tool-head"><strong>chapter.activity</strong>${renderActionLink("展开到章节页", "../../chapter-workbench/v2/index.html", "ghost", "sm", book.id)}</div><table class="data-table"><thead><tr><th>章节</th><th>状态</th><th>最近动作</th></tr></thead><tbody>${(book.chapterActivity || []).map((chapter) => `<tr><td class="mono">${chapter.chapter}</td><td>${renderBadge(chapter.statusTone, chapter.statusLabel)}</td><td>${escapeHtml(chapter.note)}</td></tr>`).join("") || "<tr><td colspan=\"3\">暂无章节活动</td></tr>"}</tbody></table></article><article class="panel stack-12"><div class="panel-head"><div><p class="eyebrow">System Health</p><h2>书籍健康</h2></div>${renderBadge(book.riskTone, `${(book.healthAlerts || []).length} alerts`)}</div><div class="stack-8">${(book.healthAlerts || []).map((alert) => `<div class="card" style="border-color: var(--accent-${alert.tone === "warning" ? "warning" : alert.tone === "danger" ? "destructive" : "primary"})"><strong>${escapeHtml(alert.title)}</strong><p>${escapeHtml(alert.body)}</p></div>`).join("") || '<div class="card surface-card"><strong>当前没有阻断性告警</strong><p>这本书可以继续推进。</p></div>'}</div></article></section><section class="page-grid cols-2"><article class="panel stack-12"><div class="panel-head"><h2>truth & materials</h2><div class="action-row">${renderActionLink("Truth", "../../truth-center/v2/index.html", "secondary", "sm", book.id)}${renderActionLink("Materials", "../../materials-center/v2/index.html", "secondary", "sm", book.id)}</div></div><div class="note-table"><div class="row"><span>truth files</span><strong>${book.truthFilesCount} files</strong></div><div class="row"><span>materials</span><strong>${book.materialsCount} items</strong></div><div class="row"><span>pending drafts</span><strong>${book.pendingDrafts}</strong></div></div></article><article class="panel stack-12"><div class="panel-head"><h2>最近决策记录</h2><span class="mono">last ${(book.decisions || []).length}</span></div><div class="list-shell">${(book.decisions || []).map((item) => `<div class="list-row two"><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p></div><span class="mono">${escapeHtml(item.when)}</span></div>`).join("") || '<div class="list-row two"><div><strong>暂无决策记录</strong><p>这本书还没有保存的总编决策。</p></div><span class="mono">-</span></div>'}</div></article></section>`);
    setInspector(`<div><p class="eyebrow">Book Inspector</p><h2>右侧摘要</h2></div>${renderActionLink("去总编", "../../chief/v2/index.html", "ghost", "sm", book.id)}`, `<section class="context-card stack-12"><div class="panel-head"><h3>pending approvals</h3>${renderBadge("warning", String((book.approvals || []).length))}</div><div class="list-shell">${(book.approvals || []).map((approval) => `<button class="list-row two ${approval.id === selectedApproval?.id ? "surface-card" : ""}" type="button" data-action="book-select-approval:${approval.id}"><div><strong>${escapeHtml(approval.title)}</strong><p>${escapeHtml(approval.summary)}</p></div><span class="mono">${escapeHtml(approval.riskLabel)}</span></button>`).join("") || '<div class="list-row two"><div><strong>没有待确认内容</strong><p>当前书籍已没有挂起审批。</p></div><span class="mono">ok</span></div>'}</div>${selectedApproval ? `<div class="action-row">${renderActionButton("应用保存", `book-apply-approval:${selectedApproval.draftId}`, "primary", "sm")}${renderActionButton("重写生成", `book-regenerate-approval:${selectedApproval.type}`, "secondary", "sm")}</div>` : ""}</section><section class="context-card stack-12"><div class="panel-head"><h3>run snapshot</h3><span class="mono">${escapeHtml(book.lastEditedAt)}</span></div><div class="note-table"><div class="row"><span>最近 run</span><strong>${escapeHtml(book.runSnapshot.tool)}</strong></div><div class="row"><span>状态</span><strong>${escapeHtml(book.runSnapshot.status)}</strong></div><div class="row"><span>下一步</span><strong>${escapeHtml(book.runSnapshot.next)}</strong></div></div></section>`);
    setModal("在书籍上下文中提问", `当前默认绑定 ${book.title}。多步任务会升级到 /chief 主线程。`, getPageQueryState("bookOverview").quickQuery, getQuickResponse("bookOverview"), "bookOverview");
  }

  function renderChief() {
    const ui = getPageQueryState("chief");
    const query = ui.search.trim().toLowerCase();
    const allThreads = state.chief.threads.slice();
    const threads = allThreads.filter((thread) => {
      const book = thread.bookId ? findBook(thread.bookId) : null;
      const haystack = `${thread.title} ${thread.scope} ${thread.bookId || ""} ${book?.title || ""}`.toLowerCase();
      return !query || haystack.includes(query);
    });
    const selectedThread = threads.find((thread) => thread.id === ui.selectedThreadId) || allThreads.find((thread) => thread.id === ui.selectedThreadId) || allThreads[0];
    const book = getThreadBook(selectedThread);
    const selectedCandidate = getSelectedCandidate(book, "character");
    const candidateStatus = selectedCandidate ? getCandidateStatus(book, selectedCandidate.id) : "draft";
    const compareCopy = selectedCandidate ? getCandidateCompareCopy(book, "character", selectedCandidate.id) : "";
    const isMaterialsThread = selectedThread?.id === "thread_book_001_materials" || selectedThread?.id === "thread_materials_cleanup";
    const isOpsThread = selectedThread?.id === "thread_global_ops";
    const isAuditThread = selectedThread?.id === "thread_book_001_audit";
    const topbarActions = `${renderActionButton("快速操作", "open-chief-modal", "secondary", "md", 'data-open-modal="chief-modal"')}${selectedThread?.bookId ? renderActionLink("去书籍页", "../../book-overview/v2/index.html", "ghost", "md", book.id) : renderActionLink("看调度中心", "../../automation-center/v2/index.html", "ghost", "md")}`;

    setTopbar(
      `<p class="eyebrow">Chief Workspace</p><h1>${escapeHtml(selectedThread?.title || "总编工作台")}</h1><div class="meta-row">${renderChip(selectedThread?.bookId ? `书籍：${book.title}` : "全局线程", true)}${renderChip(`scope：${selectedThread?.scope || "global"}`)}${renderChip(`状态：${selectedThread?.statusLabel || "active"}`)}</div>`,
      topbarActions
    );
    setContext(
      `<div><p class="eyebrow">Chief Threads</p><h2>线程列表</h2></div>${renderActionButton("新建", "chief-new-thread", "secondary", "sm")}<label class="field-label"><span class="sr-only">搜索线程</span><input class="field" type="search" data-input="chief-search" value="${escapeHtml(ui.search)}" placeholder="搜索线程 / 书籍 / 章节" /></label>`,
      `<section class="stack-8"><p class="eyebrow">当前重点</p>${threads.map((thread) => `<button class="nav-item${thread.id === selectedThread?.id ? " active" : ""}" type="button" data-action="chief-select-thread:${thread.id}"><span>${escapeHtml(thread.title)}</span>${renderBadge(thread.statusTone, thread.statusLabel)}</button>`).join("")}</section>${selectedThread?.bookId ? `<section class="stack-8"><p class="eyebrow">书内导航</p>${renderBookRouteLinks(book, isMaterialsThread ? "materials" : isAuditThread ? "truth" : "overview")}</section><section class="card stack-8"><p class="eyebrow">上下文</p><strong>${escapeHtml(book.title)} / ${escapeHtml(book.phaseLabel)}</strong><p class="page-note">当前 thread 绑定 ${escapeHtml(book.id)}，最近动作：${escapeHtml(book.latestAction)}。</p></section>` : `<section class="card stack-8"><p class="eyebrow">全局上下文</p><strong>项目巡检 / 调度摘要</strong><p class="page-note">这条线程不绑定单本书，适合先看队列、失败聚类和跨书优先级。</p></section>`}`
    );

    if (isMaterialsThread) {
      const needsDecision = candidateStatus !== "applied";
      setMain(
        `<section class="decision-bar"><div><strong>当前 run：${needsDecision ? "等待批准保存" : "已完成保存"}</strong><div class="page-note">Chief → Character Skill → materials 草案</div></div><div class="action-row">${renderBadge(needsDecision ? "warning" : "success", needsDecision ? "awaiting approval" : "completed")}${renderActionButton("取消 run", "chief-cancel-run", "danger", "sm")}</div></section><section class="message-stream"><article class="message-row"><div class="message-mark">总</div><div class="message-copy"><div class="message-head"><strong>总编</strong><small>刚刚</small></div><p>这条线程只处理一个闭环：补参数、比对候选、决定是否写入 materials，并把保存影响说清楚。</p><div class="tool-card"><div class="tool-head"><strong>chief.plan</strong>${renderBadge("active", "4 steps")}</div><div class="tool-body stack-8"><ol class="stack-8"><li>读取 ${escapeHtml(book.id)} + materials 摘要</li><li>收敛反派定位与冲突边界</li><li>生成 3 个结构化候选</li><li>等待你应用保存或重写</li></ol></div></div></div></article><article class="message-row"><div class="message-mark">&gt;</div><div class="message-copy"><div class="message-head"><strong>你</strong><small>刚刚</small></div><p>${escapeHtml(book.id === "book_002" ? "给我一个卷一末段竞争对手，要求能直接推动试炼终局。" : "给我三个能进入第二卷的反派备选，必须能长期对抗主角，但不能撞现有势力设定。")}</p></div></article><article class="message-row"><div class="message-mark">总</div><div class="message-copy"><div class="message-head"><strong>总编</strong><small>参数已确认</small></div><div class="tool-card"><div class="tool-head"><strong>material.request-form</strong>${renderBadge("active", "submitted")}</div><div class="tool-body"><div class="tool-grid"><div class="card surface-card"><span>数量</span><strong>${book.materialsCenter.formDefaults.character.quantity}</strong></div><div class="card surface-card"><span>定位</span><strong>${escapeHtml(book.materialsCenter.formDefaults.character.positioning)}</strong></div><div class="card surface-card"><span>边界</span><strong>${escapeHtml(book.materialsCenter.formDefaults.character.constraints)}</strong></div></div></div><div class="tool-actions"><div class="action-row">${renderActionLink("去 Materials 调整", "../../materials-center/v2/index.html", "secondary", "sm", book.id)}${renderActionButton("保持当前参数", "chief-keep-form", "ghost", "sm")}</div></div></div></div></article><article class="message-row"><div class="message-mark">总</div><div class="message-copy"><div class="message-head"><strong>总编</strong><small>候选已生成</small></div><p>主线程保留判断摘要，完整库与结构化保存影响留给专页处理。</p><div class="quote-box">${escapeHtml(compareCopy || "当前候选之间的差异已汇总到检查器。")}</div><div class="tool-card"><div class="tool-head"><strong>material.table-result</strong>${renderBadge(needsDecision ? "warning" : "success", needsDecision ? "awaiting selection" : candidateStatus)}</div><div class="tool-body stack-12"><div class="candidate-grid">${getMaterialSet(book, "character").map((candidate) => `<button class="candidate-card${candidate.id === selectedCandidate?.id ? " active" : ""}" type="button" data-action="chief-select-candidate:${candidate.id}"><span class="mono">${escapeHtml(candidate.id.split("_").pop())}</span><strong>${escapeHtml(candidate.name)}</strong><p>${escapeHtml(candidate.summary)}</p></button>`).join("")}</div></div><div class="tool-actions"><div class="action-row">${needsDecision ? renderActionButton("应用保存", `chief-apply-candidate:${selectedCandidate?.id || ""}`, "primary", "sm") : renderActionLink("打开 Materials", "../../materials-center/v2/index.html", "primary", "sm", book.id)}${renderActionButton("重写生成", "chief-regenerate-character", "secondary", "sm")}${renderActionLink("去 Materials 调整", "../../materials-center/v2/index.html", "secondary", "sm", book.id)}${renderActionButton("取消", "chief-cancel-draft", "danger", "sm")}</div></div></div></div></article>${ui.quickResponseIndex > 0 ? `<article class="message-row"><div class="message-mark">&gt;</div><div class="message-copy"><div class="message-head"><strong>你</strong><small>刚刚</small></div><p>${escapeHtml(ui.composer)}</p></div></article><article class="message-row"><div class="message-mark">总</div><div class="message-copy"><div class="message-head"><strong>总编</strong><small>刚刚</small></div><p>${escapeHtml(getQuickResponse("chief"))}</p></div></article>` : ""}</section>`
      );
      setDock(
        `${needsDecision ? `<div class="decision-bar"><div><strong>下一步由你决定</strong><div class="page-note">当前选中 ${escapeHtml(selectedCandidate?.name || "候选")}。保存后将写入 materials/characters，并刷新 materials_summary。</div></div><div class="action-row">${renderActionButton("应用保存", `chief-apply-candidate:${selectedCandidate?.id || ""}`, "primary", "sm")}${renderActionButton("重写生成", "chief-regenerate-character", "secondary", "sm")}</div></div>` : `<div class="decision-bar"><div><strong>当前草案已落盘</strong><div class="page-note">${escapeHtml(selectedCandidate?.name || "当前候选")} 已进入 materials，可转到章节页继续推进写作链路。</div></div><div class="action-row">${renderBadge("success", "saved")}${renderActionLink("去章节页", "../../chapter-workbench/v2/index.html", "secondary", "sm", book.id)}</div></div>`}<div class="composer-shell"><textarea data-input="chief-composer" placeholder="继续追问候选差异，或让总编给出下一步推进建议……">${escapeHtml(ui.composer)}</textarea><div class="composer-meta"><div class="action-row">${renderChip(`当前上下文：${book.id}`)}${renderChip(`draftId：${selectedCandidate?.id || "none"}`)}</div><div class="action-row">${renderActionButton("附加上下文", "chief-attach-context", "secondary", "md")}${renderActionButton("发送", "chief-send", "primary", "md")}</div></div></div>`
      );
      setInspector(
        `<div><p class="eyebrow">Inspector</p><h2>候选检查器</h2></div>${renderBadge("active", "角色草案")}`,
        `<section class="context-card stack-12"><div class="panel-head"><h3>候选详情</h3><span class="mono">${escapeHtml(selectedCandidate?.id || "")}</span></div><div class="note-table"><div class="row"><span>名称</span><strong>${escapeHtml(selectedCandidate?.name || "-")}</strong></div><div class="row"><span>阵营</span><strong>${escapeHtml(selectedCandidate?.faction || "-")}</strong></div><div class="row"><span>主冲突</span><strong>${escapeHtml(selectedCandidate?.conflict || "-")}</strong></div><div class="row"><span>长期性</span><strong>${escapeHtml(selectedCandidate?.longevity || "-")}</strong></div><div class="row"><span>当前状态</span><strong>${escapeHtml(candidateStatus)}</strong></div></div></section><section class="context-card stack-12"><div class="panel-head"><h3>保存影响</h3>${renderBadge("warning", "medium risk")}</div><div class="timeline"><div class="timeline-item"><span class="timeline-bar primary"></span><div><strong>materials/characters 将新增 1 项</strong><p>状态为 applied，保留 sourceRunId 与 skill 快照。</p></div></div><div class="timeline-item"><span class="timeline-bar warning"></span><div><strong>materials_summary.md 会被刷新</strong><p>后续写章与分析默认读取更新后的摘要。</p></div></div></div></section><section class="context-card stack-12"><div class="panel-head"><h3>run.trace</h3><span class="mono">04 events</span></div><div class="list-shell"><div class="list-row three"><span class="status-dot success"></span><div><strong>chief.plan</strong><p>${escapeHtml(book.id)} 绑定成功</p></div><span class="mono">+1s</span></div><div class="list-row three"><span class="status-dot success"></span><div><strong>material.request-form</strong><p>表单参数已冻结</p></div><span class="mono">+8s</span></div><div class="list-row three"><span class="status-dot primary"></span><div><strong>material.table-result</strong><p>返回 3 个候选，等待操作</p></div><span class="mono">+19s</span></div></div></section>`
      );
      setModal("快速操作", "重型事务仍留在当前工作台执行，这里只做轻量追问和页面跳转。", "聚焦输入框", getQuickResponse("chief"), "chief");
      return;
    }

    if (isOpsThread) {
      const selectedJob = getSelectedAutomationJob();
      setMain(
        `<section class="decision-bar"><div><strong>当前主题：全项目巡检</strong><div class="page-note">把跨书风险收敛成可执行队列，再决定是否切到调度中心处理。</div></div><div class="action-row">${renderBadge("active", "global ops")}${renderActionLink("打开调度中心", "../../automation-center/v2/index.html", "secondary", "sm")}</div></section><section class="message-stream"><article class="message-row"><div class="message-mark">总</div><div class="message-copy"><div class="message-head"><strong>总编</strong><small>刚刚</small></div><p>我先汇总了当前跨书阻断，再把最值得你看的一项挂成下一步。</p><div class="tool-card"><div class="tool-head"><strong>chief.plan</strong>${renderBadge("active", "3 steps")}</div><div class="tool-body stack-8"><ol class="stack-8"><li>读取 dashboard + automation 队列</li><li>聚类今日失败与待确认草案</li><li>给出跨书优先级建议</li></ol></div></div></div></article><article class="message-row"><div class="message-mark">总</div><div class="message-copy"><div class="message-head"><strong>总编</strong><small>巡检完成</small></div><div class="tool-card"><div class="tool-head"><strong>chief.worker-trace</strong>${renderBadge("warning", "2 blockers")}</div><div class="tool-body stack-12"><div class="timeline">${state.automation.failureClusters.map((entry) => `<div class="timeline-item"><span class="timeline-bar ${entry.tone}"></span><div><strong>${escapeHtml(entry.title)}</strong><p>${escapeHtml(entry.body)}</p></div></div>`).join("")}</div><div class="quote-box">${escapeHtml(state.dashboard.operatorNotes[0]?.body || "当前没有额外的跨书异常。")}</div></div><div class="tool-actions"><div class="action-row">${renderActionLink("看调度队列", "../../automation-center/v2/index.html", "primary", "sm")}${renderActionLink("回仪表盘", "../../dashboard/v2/index.html", "secondary", "sm")}</div></div></div></div></article><article class="message-row"><div class="message-mark">&gt;</div><div class="message-copy"><div class="message-head"><strong>你</strong><small>刚刚</small></div><p>今天失败最多的模式是什么？</p></div></article>${ui.quickResponseIndex > 0 ? `<article class="message-row"><div class="message-mark">总</div><div class="message-copy"><div class="message-head"><strong>总编</strong><small>刚刚</small></div><p>${escapeHtml(getQuickResponse("chief"))}</p></div></article>` : ""}</section>`
      );
      setDock(
        `<div class="composer-shell"><textarea data-input="chief-composer" placeholder="继续追问跨书优先级、守护队列或失败聚类……">${escapeHtml(ui.composer)}</textarea><div class="composer-meta"><div class="action-row">${renderChip("当前上下文：global")}${renderChip(`job：${selectedJob?.id || "none"}`)}</div><div class="action-row">${renderActionButton("附加上下文", "chief-attach-context", "secondary", "md")}${renderActionButton("发送", "chief-send", "primary", "md")}</div></div></div>`
      );
      setInspector(
        `<div><p class="eyebrow">Inspector</p><h2>全局队列</h2></div>${renderBadge("warning", `${state.automation.queue.length} active`)}`,
        `<section class="context-card stack-12"><div class="panel-head"><h3>当前选中任务</h3><span class="mono">${escapeHtml(selectedJob?.id || "-")}</span></div><div class="note-table"><div class="row"><span>目标</span><strong>${escapeHtml(selectedJob?.target || "-")}</strong></div><div class="row"><span>任务</span><strong>${escapeHtml(selectedJob?.task || "-")}</strong></div><div class="row"><span>状态</span><strong>${escapeHtml(selectedJob?.status || "-")}</strong></div></div></section><section class="context-card stack-12"><div class="panel-head"><h3>今日待处理</h3>${renderBadge("warning", String(state.books.filter((entry) => entry.pendingDrafts || entry.riskTone !== "active").length))}</div><div class="list-shell">${state.books.filter((entry) => entry.pendingDrafts || entry.riskTone !== "active").map((entry) => `<div class="list-row three"><span class="status-dot ${entry.riskTone === "active" ? "primary" : entry.riskTone}"></span><div><strong>${escapeHtml(entry.title)}</strong><p>${escapeHtml(entry.latestAction)}</p></div><span class="mono">${escapeHtml(entry.riskLabel)}</span></div>`).join("")}</div></section>`
      );
      setModal("快速操作", "这里适合追问跨书优先级，不适合直接做守护配置修改。", "今天失败最多的模式是什么？", getQuickResponse("chief"), "chief");
      return;
    }

    const auditTone = isAuditThread ? "success" : state.ui.chapterWorkbench.revisionApplied ? "success" : "warning";
    const auditLabel = isAuditThread ? "completed" : state.ui.chapterWorkbench.revisionApplied ? "revision applied" : "awaiting revision";
    setMain(
      `<section class="decision-bar"><div><strong>当前主题：${escapeHtml(isAuditThread ? "审计结果复盘" : "继续推进章节链路")}</strong><div class="page-note">计划、诊断和下一步路由在这里做；正文深读仍然回章节页。</div></div><div class="action-row">${renderBadge(auditTone, auditLabel)}${renderActionButton("取消 run", "chief-cancel-run", "danger", "sm")}</div></section><section class="message-stream"><article class="message-row"><div class="message-mark">总</div><div class="message-copy"><div class="message-head"><strong>总编</strong><small>${escapeHtml(selectedThread?.updatedAt || "刚刚")}</small></div><p>${escapeHtml(isAuditThread ? "这条线程已经完成一次审计复盘，重点是把结论和后续页面入口保留下来。" : "这条线程负责把写章阻断拆成可执行的下一步，而不是在主线程里直接改正文。")}</p><div class="tool-card"><div class="tool-head"><strong>chief.plan</strong>${renderBadge("active", isAuditThread ? "completed" : "3 steps")}</div><div class="tool-body stack-8"><ol class="stack-8"><li>读取 ${escapeHtml(book.id)} / chapter_${String(book.chapterCurrent).padStart(3, "0")}</li><li>回放审计失败原因与 truth 约束</li><li>${escapeHtml(isAuditThread ? "保留诊断结论与页面入口" : "决定是回章节页修订还是转 truth 排查")}</li></ol></div></div></div></article><article class="message-row"><div class="message-mark">&gt;</div><div class="message-copy"><div class="message-head"><strong>你</strong><small>刚刚</small></div><p>${escapeHtml(isAuditThread ? "把这次审计失败的关键问题和下一步入口留给我。" : "继续处理第 13 章，但先告诉我最短修订路径。")}</p></div></article><article class="message-row"><div class="message-mark">总</div><div class="message-copy"><div class="message-head"><strong>总编</strong><small>结果已整理</small></div><div class="tool-card"><div class="tool-head"><strong>${isAuditThread ? "chief.worker-trace" : "chapter.audit-report"}</strong>${renderBadge(auditTone, auditLabel)}</div><div class="tool-body stack-12"><div class="timeline">${book.chapterWorkbench.auditIssues.map((issue) => `<div class="timeline-item"><span class="timeline-bar ${issue.tone}"></span><div><strong>${escapeHtml(issue.title)}</strong><p>${escapeHtml(issue.body)}</p></div></div>`).join("")}</div><div class="quote-box">${escapeHtml(book.chapterWorkbench.noteQuote)}</div></div><div class="tool-actions"><div class="action-row">${renderActionLink("去章节页深读", "../../chapter-workbench/v2/index.html", "primary", "sm", book.id)}${renderActionLink("查看 Truth", "../../truth-center/v2/index.html", "secondary", "sm", book.id)}</div></div></div></div></article>${ui.quickResponseIndex > 0 ? `<article class="message-row"><div class="message-mark">&gt;</div><div class="message-copy"><div class="message-head"><strong>你</strong><small>刚刚</small></div><p>${escapeHtml(ui.composer)}</p></div></article><article class="message-row"><div class="message-mark">总</div><div class="message-copy"><div class="message-head"><strong>总编</strong><small>刚刚</small></div><p>${escapeHtml(getQuickResponse("chief"))}</p></div></article>` : ""}</section>`
    );
    setDock(
      `<div class="decision-bar"><div><strong>${escapeHtml(isAuditThread ? "下一步是决定去哪里执行" : "下一步是去专页完成修订")}</strong><div class="page-note">${escapeHtml(book.chapterWorkbench.recommendation)}。正文、truth 和审批不在同一块区域硬挤。</div></div><div class="action-row">${renderActionLink("去章节页", "../../chapter-workbench/v2/index.html", "primary", "sm", book.id)}${renderActionLink("看 Truth", "../../truth-center/v2/index.html", "secondary", "sm", book.id)}</div></div><div class="composer-shell"><textarea data-input="chief-composer" placeholder="继续追问审计结论、truth 约束或下一步计划……">${escapeHtml(ui.composer)}</textarea><div class="composer-meta"><div class="action-row">${renderChip(`当前上下文：${book.id}`)}${renderChip(`chapter：${String(book.chapterCurrent).padStart(3, "0")}`)}</div><div class="action-row">${renderActionButton("附加上下文", "chief-attach-context", "secondary", "md")}${renderActionButton("发送", "chief-send", "primary", "md")}</div></div></div>`
    );
    setInspector(
      `<div><p class="eyebrow">Inspector</p><h2>章节检查器</h2></div>${renderBadge(auditTone, isAuditThread ? "已复盘" : "待修订")}`,
      `<section class="context-card stack-12"><div class="panel-head"><h3>修订路径</h3><span class="mono">${book.chapterWorkbench.revisionSteps.length} steps</span></div><div class="timeline">${book.chapterWorkbench.revisionSteps.map((step) => `<div class="timeline-item"><span class="timeline-bar ${step.tone}"></span><div><strong>${escapeHtml(step.title)}</strong><p>${escapeHtml(step.body)}</p></div></div>`).join("")}</div></section><section class="context-card stack-12"><div class="panel-head"><h3>关联 truth</h3><span class="mono">${book.chapterWorkbench.truthRefs.length} refs</span></div><div class="note-table">${book.chapterWorkbench.truthRefs.map((ref) => `<div class="row"><span>${escapeHtml(ref.label)}</span><strong>${escapeHtml(ref.value)}</strong></div>`).join("")}</div></section>`
    );
    setModal("快速操作", "这里更适合追问计划和阻断，不适合直接重写正文。", "继续告诉我这一章最短修订路径。", getQuickResponse("chief"), "chief");
  }

  function renderChapterWorkbench() {
    const book = getActiveBook();
    const chapter = book.chapterWorkbench || state.books[0].chapterWorkbench;
    const ui = getPageQueryState("chapterWorkbench");
    setTopbar(`<p class="eyebrow">Chapter Workbench</p><h1>${escapeHtml(chapter.title)}</h1><div class="meta-row">${renderChip(book.title, true)}${renderChip(`chapter_${String(book.chapterCurrent).padStart(3, "0")}`)}${renderChip(`最近 run：${book.lastEditedAt}`)}</div>`, `${renderActionButton("问总编", "open-chief-modal", "secondary", "md", 'data-open-modal="chief-modal"')}${renderActionButton("重新审计", "chapter-rerun-audit", "secondary", "md")}${renderActionLink("去总编修订", "../../chief/v2/index.html", "primary", "md", book.id)}`);
    setContext(`<div><p class="eyebrow">Chapter Tree</p><h2>${escapeHtml(book.title)}</h2></div>${renderBadge("warning", String(book.chapterCurrent))}`, `<section class="stack-8"><p class="eyebrow">书内导航</p>${renderBookRouteLinks(book, "chapters")}</section><section class="stack-8"><p class="eyebrow">章节目录</p>${(book.chapterActivity || []).map((chapterItem) => `<button class="nav-item${chapterItem.chapter === book.chapterCurrent ? " active" : ""}" type="button"><span>第 ${chapterItem.chapter} 章</span>${renderBadge(chapterItem.statusTone, chapterItem.statusLabel)}</button>`).join("")}</section>`);
    setMain(`<section class="panel stack-12"><div class="segment">${["reading", "audit", "revision"].map((tab) => `<button class="${ui.activeTab === tab ? "active" : ""}" type="button" data-action="chapter-tab:${tab}">${tab === "reading" ? "正文" : tab === "audit" ? "审计摘要" : "修订建议"}</button>`).join("")}</div></section>${ui.activeTab === "reading" ? `<section class="prose-shell reading-width">${chapter.reading.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</section>` : ""}${ui.activeTab === "audit" ? `<section class="tool-card"><div class="tool-head"><strong>chapter.audit-report</strong>${renderBadge(state.ui.chapterWorkbench.revisionApplied ? "success" : "warning", state.ui.chapterWorkbench.revisionApplied ? "passed after fix" : "failed")}</div><div class="tool-body stack-12"><div class="timeline">${chapter.auditIssues.map((issue) => `<div class="timeline-item"><span class="timeline-bar ${issue.tone}"></span><div><strong>${escapeHtml(issue.title)}</strong><p>${escapeHtml(issue.body)}</p></div></div>`).join("")}</div></div><div class="tool-actions"><div class="action-row">${renderActionButton("回到修订建议", "chapter-tab:revision", "secondary", "sm")}${renderActionButton("重新审计", "chapter-rerun-audit", "primary", "sm")}</div></div></section>` : ""}${ui.activeTab === "revision" ? `<section class="panel stack-12"><div class="panel-head"><h2>定点修订建议</h2>${renderBadge("active", "3 steps")}</div><div class="timeline">${chapter.revisionSteps.map((step) => `<div class="timeline-item"><span class="timeline-bar ${step.tone}"></span><div><strong>${escapeHtml(step.title)}</strong><p>${escapeHtml(step.body)}</p></div></div>`).join("")}</div><div class="action-row">${renderActionButton("应用修订草案", "chapter-apply-revision", "primary", "md")}${renderActionButton("重新审计", "chapter-rerun-audit", "secondary", "md")}</div></section>` : ""}`);
    setInspector(`<div><p class="eyebrow">Context</p><h2>右侧上下文</h2></div>${renderActionLink("Truth", "../../truth-center/v2/index.html", "ghost", "sm", book.id)}`, `<section class="context-card stack-12"><div class="panel-head"><h3>阅读侧注</h3>${renderBadge("warning", "需要慢一点")}</div><div class="quote-box">${escapeHtml(chapter.noteQuote)}</div><div class="note-table"><div class="row"><span>推荐处理</span><strong>${escapeHtml(chapter.recommendation)}</strong></div><div class="row"><span>可能波及</span><strong>${escapeHtml(chapter.impact)}</strong></div></div></section><section class="context-card stack-12"><div class="panel-head"><h3>关联 truth</h3><span class="mono">${chapter.truthRefs.length} refs</span></div><div class="note-table">${chapter.truthRefs.map((ref) => `<div class="row"><span>${escapeHtml(ref.label)}</span><strong>${escapeHtml(ref.value)}</strong></div>`).join("")}</div></section><section class="context-card stack-12"><div class="panel-head"><h3>chief shortcut</h3>${renderBadge("active", "book context")}</div><p>如果要直接执行 revise_chapter 或开审批流，跳到 /chief 更合适。</p>${renderActionLink("在总编中继续", "../../chief/v2/index.html", "primary", "md", book.id)}</section>`);
    setModal("分析这章失败原因", `当前上下文已绑定 ${book.id} / chapter_${String(book.chapterCurrent).padStart(3, "0")}。`, ui.quickQuery, getQuickResponse("chapterWorkbench"), "chapterWorkbench");
  }

  function renderTruthCenter() {
    const book = getActiveBook();
    const truth = book.truthCenter || state.books[0].truthCenter;
    const ui = getPageQueryState("truthCenter");
    const file = truth.files.find((entry) => entry.id === ui.selectedFileId) || truth.files[0];
    const resolved = isResolvedDrift(file.driftNote);
    const latestChange = file.changes[0];
    let content = `<section class="panel stack-12"><div class="segment">${["document", "changes", "entities"].map((tab) => `<button class="${ui.activeTab === tab ? "active" : ""}" type="button" data-action="truth-tab:${tab}">${tab === "document" ? "结构化事实" : tab === "changes" ? "最近变更" : "关联实体"}</button>`).join("")}</div></section>`;
    if (ui.activeTab === "document") {
      content += `<section class="page-grid cols-2"><article class="panel stack-12"><div class="panel-head"><div><p class="eyebrow">Document</p><h2>事实清单</h2></div>${renderBadge(resolved ? "success" : "warning", file.meta)}</div><div class="note-table"><div class="row"><span>文件 ID</span><strong class="mono">${escapeHtml(file.id)}</strong></div><div class="row"><span>书籍</span><strong>${escapeHtml(book.title)}</strong></div><div class="row"><span>最近变更</span><strong>${escapeHtml(latestChange?.title || "暂无")}</strong></div><div class="row"><span>实体数量</span><strong class="mono">${file.entities.length}</strong></div></div><div class="list-shell">${file.lines.map((line, index) => `<div class="list-row two"><div><strong>事实 ${index + 1}</strong><p>${escapeHtml(line)}</p></div><span class="mono">line ${index + 1}</span></div>`).join("")}</div></article><article class="panel stack-12"><div class="panel-head"><div><p class="eyebrow">Drift</p><h2>当前约束</h2></div>${renderBadge(resolved ? "success" : "warning", resolved ? "resolved" : "pending")}</div><div class="quote-box">${escapeHtml(file.driftNote)}</div><div class="list-shell">${file.entities.map((entity) => `<div class="list-row two"><div><strong>${escapeHtml(entity.entity)}</strong><p>${escapeHtml(entity.relation)}</p></div><span class="mono">${escapeHtml(entity.status)}</span></div>`).join("")}</div></article></section>`;
    }
    if (ui.activeTab === "changes") {
      content += `<section class="page-grid cols-2"><article class="panel stack-12"><div class="panel-head"><h2>变更时间线</h2><span class="mono">${file.changes.length} items</span></div><div class="timeline">${file.changes.map((change) => `<div class="timeline-item"><span class="timeline-bar ${change.tone}"></span><div><strong>${escapeHtml(change.title)}</strong><p>${escapeHtml(change.body)}</p></div></div>`).join("")}</div></article><article class="panel stack-12"><div class="panel-head"><h2>章节影响</h2>${renderBadge(book.riskTone, book.riskLabel)}</div><div class="note-table"><div class="row"><span>当前章节</span><strong class="mono">${String(book.chapterCurrent).padStart(3, "0")}</strong></div><div class="row"><span>最近动作</span><strong>${escapeHtml(book.latestAction)}</strong></div><div class="row"><span>下一步</span><strong>${escapeHtml(book.nextAction.title)}</strong></div></div><div class="quote-box">${escapeHtml(book.nextAction.body)}</div></article></section>`;
    }
    if (ui.activeTab === "entities") {
      content += `<section class="table-shell"><table class="data-table"><thead><tr><th>实体</th><th>关系</th><th>当前状态</th></tr></thead><tbody>${file.entities.map((entity) => `<tr><td><strong>${escapeHtml(entity.entity)}</strong></td><td>${escapeHtml(entity.relation)}</td><td class="mono">${escapeHtml(entity.status)}</td></tr>`).join("")}</tbody></table></section><section class="panel stack-12"><div class="panel-head"><h2>最近引用</h2><span class="mono">${truth.recentReferences.length} refs</span></div><div class="list-shell">${truth.recentReferences.map((ref) => `<div class="list-row two"><div><strong>${escapeHtml(ref.title)}</strong><p>${escapeHtml(ref.body)}</p></div><span class="mono">${escapeHtml(ref.when)}</span></div>`).join("")}</div></section>`;
    }
    setTopbar(`<p class="eyebrow">Truth Center</p><h1>${escapeHtml(file.title)}</h1><div class="meta-row">${renderChip(book.title, true)}${renderChip(file.meta)}${renderChip(resolved ? "drift resolved" : "drift pending")}</div>`, `${renderActionButton("问总编", "open-chief-modal", "secondary", "md", 'data-open-modal="chief-modal"')}${renderActionLink("看章节上下文", "../../chapter-workbench/v2/index.html", "ghost", "md", book.id)}`);
    setContext(`<div><p class="eyebrow">Truth Context</p><h2>${escapeHtml(book.title)}</h2></div>${renderBadge(resolved ? "success" : "warning", resolved ? "stable" : "pending drift")}`, `<section class="stack-8"><p class="eyebrow">书内导航</p>${renderBookRouteLinks(book, "truth")}</section><section class="stack-8"><div class="panel-head"><h3>Truth Files</h3>${renderBadge("", `${truth.files.length} files`)}</div>${truth.files.map((entry) => `<button class="nav-item${entry.id === file.id ? " active" : ""}" type="button" data-action="truth-select-file:${entry.id}"><span>${escapeHtml(entry.title)}</span><span class="mono">${escapeHtml(entry.meta)}</span></button>`).join("")}</section>`);
    setMain(content);
    setInspector(`<div><p class="eyebrow">Truth Inspector</p><h2>${escapeHtml(file.title)}</h2></div>${renderBadge(resolved ? "success" : "warning", resolved ? "resolved" : "needs review")}`, `<section class="context-card stack-12"><div class="panel-head"><h3>最近引用</h3><span class="mono">${truth.recentReferences.length}</span></div><div class="list-shell">${truth.recentReferences.map((ref) => `<div class="list-row two"><div><strong>${escapeHtml(ref.title)}</strong><p>${escapeHtml(ref.body)}</p></div><span class="mono">${escapeHtml(ref.when)}</span></div>`).join("")}</div></section><section class="context-card stack-12"><div class="panel-head"><h3>当前漂移</h3>${renderBadge(resolved ? "success" : "warning", resolved ? "已核对" : "待处理")}</div><div class="quote-box">${escapeHtml(file.driftNote)}</div><div class="action-row">${resolved ? renderBadge("success", "no action needed") : renderActionButton("标记已核对", "truth-resolve-drift", "primary", "sm")}${renderActionLink("回总编", "../../chief/v2/index.html", "secondary", "sm", book.id)}</div></section><section class="context-card stack-12"><div class="panel-head"><h3>最近变更</h3><span class="mono">${file.changes.length}</span></div><div class="timeline">${file.changes.slice(0, 2).map((change) => `<div class="timeline-item"><span class="timeline-bar ${change.tone}"></span><div><strong>${escapeHtml(change.title)}</strong><p>${escapeHtml(change.body)}</p></div></div>`).join("")}</div></section>`);
    setModal("在 truth 上下文里提问", "适合做一致性问题定位，不适合在这里直接重写整章。", ui.quickQuery, getQuickResponse("truthCenter"), "truthCenter");
  }

  function renderMaterialsCenter() {
    const book = getActiveBook();
    const ui = getPageQueryState("materialsCenter");
    const materials = book.materialsCenter || state.books[0].materialsCenter;
    const type = ui.selectedType;
    const currentSet = getMaterialSet(book, type);
    const currentCandidate = getSelectedCandidate(book, type) || currentSet[0];
    const form = materials.formDefaults[type];
    const libraryFilter = ui.libraryFilter;
    const libraryRows = (materials.library || []).filter((entry) => libraryFilter === "all" || entry.status === libraryFilter);
    const applyTarget = `materials/${type === "character" ? "characters" : type === "faction" ? "factions" : "locations"}`;
    const candidateStatus = currentCandidate ? getCandidateStatus(book, currentCandidate.id) : "draft";
    const candidateStatusTone = candidateStatus === "applied" ? "success" : candidateStatus === "discarded" ? "danger" : "warning";
    const compareCopy = type === "character" && currentCandidate ? getCandidateCompareCopy(book, type, currentCandidate.id) : "当前候选差异主要体现在冲突入口和长期延展性，适合结合右侧保存影响再决定是否落盘。";
    setTopbar(`<p class="eyebrow">Materials Center</p><h1>${escapeHtml(book.title)} / Materials</h1><div class="meta-row">${renderChip(type, true)}${renderChip(`${book.pendingDrafts} drafts`)}${renderChip(`source: ${materials.sourceRunId}`)}</div>`, `${renderActionButton("问总编", "open-chief-modal", "secondary", "md", 'data-open-modal="chief-modal"')}${renderActionLink("回总编工作台", "../../chief/v2/index.html", "primary", "md", book.id)}`);
    setContext(`<div><p class="eyebrow">Materials</p><h2>${escapeHtml(book.title)}</h2></div>${renderBadge(book.pendingDrafts ? "warning" : "success", `${book.pendingDrafts} drafts`)}`, `<section class="stack-8"><p class="eyebrow">书内导航</p>${renderBookRouteLinks(book, "materials")}</section><section class="stack-8"><p class="eyebrow">素材类型</p>${["character", "faction", "location"].map((entry) => `<button class="nav-item${entry === type ? " active" : ""}" type="button" data-action="materials-type:${entry}"><span>${entry === "character" ? "角色" : entry === "faction" ? "势力" : "地点"}</span><span class="mono">${getMaterialSet(book, entry).length} items</span></button>`).join("")}</section><section class="context-card stack-12"><div class="panel-head"><h3>素材库</h3><div class="action-row"><button class="chip${libraryFilter === "all" ? " active" : ""}" type="button" data-action="materials-filter:all">全部</button><button class="chip${libraryFilter === "draft" ? " active" : ""}" type="button" data-action="materials-filter:draft">草案</button><button class="chip${libraryFilter === "applied" ? " active" : ""}" type="button" data-action="materials-filter:applied">已保存</button><button class="chip${libraryFilter === "discarded" ? " active" : ""}" type="button" data-action="materials-filter:discarded">已取消</button></div></div><div class="list-shell">${libraryRows.length ? libraryRows.map((item) => `<div class="list-row two"><div><strong>${escapeHtml(item.name)}</strong><p>${escapeHtml(item.summary)}</p><p class="page-note mono">${escapeHtml(item.sourceRunId)} · ${escapeHtml(item.updatedAt)}</p></div>${renderBadge(item.status === "applied" ? "success" : item.status === "discarded" ? "danger" : "warning", item.status)}</div>`).join("") : '<div class="list-row two"><div><strong>当前筛选为空</strong><p>切换状态或重新生成候选即可看到内容。</p></div><span class="mono">-</span></div>'}</div></section>`);
    setMain(`<section class="panel stack-16"><div class="panel-head"><div><p class="eyebrow">Form</p><h2>${type === "character" ? "生成新角色" : type === "faction" ? "生成新势力" : "生成新地点"}</h2></div>${renderBadge("active", type)}</div><div class="field-grid single"><label class="field-label"><span>素材定位</span><input class="field" data-setting="materials-positioning" value="${escapeHtml(form.positioning)}" /></label><label class="field-label"><span>数量</span><input class="field" data-setting="materials-quantity" value="${escapeHtml(form.quantity)}" /></label><label class="field-label"><span>冲突要求</span><textarea class="textarea" data-setting="materials-constraints">${escapeHtml(form.constraints)}</textarea></label></div><div class="action-row">${renderActionButton("生成候选", "materials-generate", "primary", "md")}${renderActionButton("重置参数", "materials-reset", "secondary", "md")}</div></section><section class="tool-card"><div class="tool-head"><strong>[Tool: Generate ${type}]</strong>${renderBadge(candidateStatusTone, candidateStatus)}</div><div class="tool-body stack-12"><div class="note-table"><div class="row"><span>draftId</span><strong class="mono">${escapeHtml(currentCandidate?.id || "-")}</strong></div><div class="row"><span>applyTarget</span><strong class="mono">${escapeHtml(applyTarget)}</strong></div><div class="row"><span>sourceRun</span><strong class="mono">${escapeHtml(materials.sourceRunId)}</strong></div><div class="row"><span>sourceThread</span><strong class="mono">${escapeHtml(materials.sourceThreadId)}</strong></div></div><div class="quote-box">${escapeHtml(compareCopy)}</div><div class="candidate-grid">${currentSet.map((candidate) => `<button class="candidate-card${candidate.id === currentCandidate?.id ? " active" : ""}" type="button" data-action="materials-select-candidate:${candidate.id}"><span class="mono">${escapeHtml(candidate.id.split("_").pop())}</span><strong>${escapeHtml(candidate.name)}</strong><p>${escapeHtml(candidate.summary)}</p></button>`).join("")}</div><section class="page-grid cols-2"><article class="panel surface-card stack-12"><div class="panel-head"><div><p class="eyebrow">Selection</p><h2>${escapeHtml(currentCandidate?.name || "当前候选")}</h2></div>${renderBadge(currentCandidate?.tone || "active", currentCandidate?.faction || "-")}</div><p class="section-copy">${escapeHtml(currentCandidate?.summary || "当前没有候选。")}</p><div class="note-table"><div class="row"><span>所属阵营</span><strong>${escapeHtml(currentCandidate?.faction || "-")}</strong></div><div class="row"><span>冲突入口</span><strong>${escapeHtml(currentCandidate?.conflict || "-")}</strong></div><div class="row"><span>长期价值</span><strong>${escapeHtml(currentCandidate?.longevity || "-")}</strong></div></div></article><div class="code-shell"><pre>${escapeHtml(JSON.stringify({ draftId: currentCandidate?.id, status: candidateStatus, sourceRunId: materials.sourceRunId, applyTarget, candidate: currentCandidate ? { name: currentCandidate.name, faction: currentCandidate.faction, conflict: currentCandidate.conflict } : null }, null, 2))}</pre></div></section></div><div class="tool-actions"><div class="action-row">${renderActionButton("应用保存", `materials-apply:${currentCandidate?.id || ""}`, "success", "sm")}${renderActionButton("重写生成", "materials-regenerate", "secondary", "sm")}${renderActionButton("取消", `materials-discard:${currentCandidate?.id || ""}`, "ghost", "sm")}${renderActionLink("回总编线程", "../../chief/v2/index.html", "ghost", "sm", book.id)}</div></div></section>`);
    setInspector(`<div><p class="eyebrow">Materials Inspector</p><h2>${escapeHtml(currentCandidate?.name || "候选详情")}</h2></div>${renderBadge(candidateStatusTone, candidateStatus)}`, `<section class="context-card stack-12"><div class="panel-head"><h3>候选摘要</h3>${renderBadge(currentCandidate?.tone || "active", currentCandidate?.faction || "-")}</div><p>${escapeHtml(currentCandidate?.summary || "当前没有候选。")}</p><div class="note-table"><div class="row"><span>冲突入口</span><strong>${escapeHtml(currentCandidate?.conflict || "-")}</strong></div><div class="row"><span>长期价值</span><strong>${escapeHtml(currentCandidate?.longevity || "-")}</strong></div></div></section><section class="context-card stack-12"><h3>保存影响</h3><div class="timeline"><div class="timeline-item"><span class="timeline-bar primary"></span><div><strong>写入 ${escapeHtml(applyTarget)}</strong><p>新增 1 条 applied 项，同时保留 sourceThreadId 与 runId。</p></div></div><div class="timeline-item"><span class="timeline-bar warning"></span><div><strong>刷新 materials_summary.md</strong><p>后续章节与审计会读取新的摘要结果。</p></div></div></div></section><section class="context-card stack-12"><h3>来源 thread</h3><div class="note-table"><div class="row"><span>threadId</span><strong class="mono">${escapeHtml(materials.sourceThreadId)}</strong></div><div class="row"><span>runId</span><strong class="mono">${escapeHtml(materials.sourceRunId)}</strong></div><div class="row"><span>skill</span><strong class="mono">${escapeHtml(materials.skillVersion)}</strong></div></div>${renderActionLink("去总编复盘", "../../chief/v2/index.html", "secondary", "sm", book.id)}</section>`);
    setModal("在素材中心里提问", "当前更适合处理材料差异或保存影响。", ui.quickQuery, getQuickResponse("materialsCenter"), "materialsCenter");
  }

  function renderAutomationCenter() {
    const ui = getPageQueryState("automation");
    const daemon = state.automation.daemon;
    const rows = ui.activeTab === "history" ? state.automation.history : state.automation.queue;
    const selectedJob = getSelectedAutomationJob();
    const selectedBook = getAutomationJobBook(selectedJob);
    const selectedRoute = getAutomationJobRoute(selectedJob);
    setTopbar("<p class=\"eyebrow\">Automation Control</p><h1>调度中心</h1><p>这里负责队列、守护状态和失败聚类；跨页处理通过任务详情里的定位入口完成，不把长日志挤回主表。</p>", `${renderActionButton("问总编", "open-chief-modal", "secondary", "md", 'data-open-modal="chief-modal"')}${renderActionButton(daemon.running ? "暂停守护" : "恢复守护", "automation-toggle-daemon", daemon.running ? "danger" : "primary", "md")}${renderActionButton("立即巡检", "automation-inspect-now", "primary", "md")}`);
    setMain(`<section class="stats-grid compact-3"><article class="stat-card"><span>daemon</span><strong class="mono">${daemon.running ? "RUNNING" : "PAUSED"}</strong><span class="mono">uptime ${escapeHtml(daemon.uptime)}</span></article><article class="stat-card"><span>active workers</span><strong class="mono">${escapeHtml(daemon.workers)}</strong><span>下一次巡检 ${escapeHtml(daemon.nextInspection)}</span></article><article class="stat-card"><span>当日失败</span><strong class="mono">${escapeHtml(daemon.failuresToday)}</strong><span>集中在审计 / truth 阻断</span></article></section><section class="table-shell"><div class="tool-head"><strong>automation.jobs</strong><div class="action-row"><button class="chip${ui.activeTab === "queue" ? " active" : ""}" type="button" data-action="automation-tab:queue">Active Queue</button><button class="chip${ui.activeTab === "history" ? " active" : ""}" type="button" data-action="automation-tab:history">History</button><button class="chip${ui.activeTab === "schedules" ? " active" : ""}" type="button" data-action="automation-tab:schedules">Schedules</button></div></div>${ui.activeTab === "schedules" ? `<div class="panel stack-12"><div class="note-table"><div class="row"><span>writeCron</span><strong class="mono">${escapeHtml(daemon.writeCron)}</strong></div><div class="row"><span>radarCron</span><strong class="mono">${escapeHtml(daemon.radarCron)}</strong></div><div class="row"><span>daily cap</span><strong class="mono">${escapeHtml(daemon.dailyCap)}</strong></div></div></div>` : `<table class="data-table"><thead><tr><th>Job ID</th><th>目标</th><th>任务</th><th>状态</th><th>动作</th></tr></thead><tbody>${rows.map((job) => { const jobBook = getAutomationJobBook(job); return `<tr${job.id === selectedJob?.id ? ' class="data-row-active"' : ""}><td class="mono">${escapeHtml(job.id)}</td><td><strong>${escapeHtml(job.target)}</strong>${jobBook ? `<div class="page-note mono">${escapeHtml(jobBook.id)}</div>` : ""}</td><td>${escapeHtml(job.task)}</td><td>${renderBadge(job.tone, job.status)}</td><td><div class="inline-actions">${jobBook ? renderActionLink("定位", getAutomationJobRoute(job), "ghost", "sm", jobBook.id) : ""}${renderActionButton("重试", `automation-retry:${job.id}`, "ghost", "sm")}${renderActionButton("取消", `automation-cancel:${job.id}`, "ghost", "sm")}${renderActionButton("查看", `automation-view:${job.id}`, "ghost", "sm")}</div></td></tr>`; }).join("")}</tbody></table>`}</section><section class="page-grid cols-2"><article class="panel stack-12"><div class="panel-head"><h2>计划任务</h2><span class="mono">3 crons</span></div><div class="note-table"><div class="row"><span>writeCron</span><strong class="mono">${escapeHtml(daemon.writeCron)}</strong></div><div class="row"><span>radarCron</span><strong class="mono">${escapeHtml(daemon.radarCron)}</strong></div><div class="row"><span>daily cap</span><strong class="mono">${escapeHtml(daemon.dailyCap)}</strong></div></div></article><article class="panel surface-card"><pre>${escapeHtml(state.automation.logs.join("\n"))}</pre></article></section>`);
    setInspector(`<div><p class="eyebrow">Ops Inspector</p><h2>${escapeHtml(selectedJob?.id || "任务详情")}</h2></div>${selectedJob ? renderBadge(selectedJob.tone, selectedJob.status) : renderBadge("", "idle")}`, `${selectedJob ? `<section class="context-card stack-12"><div class="panel-head"><h3>任务详情</h3>${selectedBook ? renderActionLink("打开关联页面", selectedRoute, "secondary", "sm", selectedBook.id) : ""}</div><div class="note-table"><div class="row"><span>target</span><strong>${escapeHtml(selectedJob.target)}</strong></div><div class="row"><span>task</span><strong class="mono">${escapeHtml(selectedJob.task)}</strong></div><div class="row"><span>status</span><strong>${escapeHtml(selectedJob.status)}</strong></div><div class="row"><span>book</span><strong>${escapeHtml(selectedBook?.title || "全局任务")}</strong></div></div></section>` : ""}<section class="context-card stack-12"><div class="panel-head"><h3>recent failures</h3>${renderBadge("warning", `${state.automation.failureClusters.length} today`)}</div><div class="timeline">${state.automation.failureClusters.map((entry) => `<div class="timeline-item"><span class="timeline-bar ${entry.tone}"></span><div><strong>${escapeHtml(entry.title)}</strong><p>${escapeHtml(entry.body)}</p></div></div>`).join("")}</div></section><section class="context-card stack-12"><div class="panel-head"><h3>最近日志</h3><span class="mono">${Math.min(3, state.automation.logs.length)} lines</span></div><div class="list-shell">${state.automation.logs.slice(0, 3).map((line) => `<div class="list-row two"><div><strong>daemon.log</strong><p>${escapeHtml(line)}</p></div><span class="mono">latest</span></div>`).join("")}</div></section>`);
    setModal("在调度中心里提问", "适合追问失败聚类、队列优先级和当前守护策略。", ui.quickQuery, getQuickResponse("automation"), "automation");
  }

  function renderSettings() {
    const ui = getPageQueryState("settings");
    const values = state.settings.defaults;
    const section = ui.currentSection;
    const sectionLabels = state.settings.sections.map((item) => `<button class="nav-item${item.id === section ? " active" : ""}" type="button" data-action="settings-section:${item.id}">${escapeHtml(item.label)}</button>`).join("");
    setTopbar(`<p class="eyebrow">Settings</p><h1>${escapeHtml(state.settings.sections.find((item) => item.id === section)?.label || "General")}</h1><p>这里管理共享 mock 状态的默认参数。主区负责编辑，右侧只保留作用范围和保存风险，不再重复整块表单。</p>`, `${renderActionButton("问总编", "open-chief-modal", "secondary", "md", 'data-open-modal="chief-modal"')}${renderActionButton(ui.dirty ? "保存变更" : "已保存", "settings-save", "primary", "md")}`);
    setContext(`<div><p class="eyebrow">Settings Nav</p><h2>系统设置</h2></div>${renderBadge(ui.dirty ? "warning" : "success", ui.dirty ? "未保存" : "已保存")}`, `${sectionLabels}<section class="context-card stack-12"><h3>作用范围</h3><p>当前设置会影响全部 V2 原型页的共享 mock 状态，包括调度、书籍默认值和审批边界。</p><div class="note-table"><div class="row"><span>last saved</span><strong>${escapeHtml(state.settings.savedAt)}</strong></div><div class="row"><span>state key</span><strong class="mono">${escapeHtml(initialMock.meta?.stateKey || "inkos-prototype-state-v2")}</strong></div></div></section>`);
    let content = "";
    let inspectorTitle = "保存状态";
    let inspectorTone = ui.dirty ? "warning" : "success";
    let inspectorLabel = ui.dirty ? "unsaved changes" : "stable";
    let inspectorBody = `<section class="context-card stack-12"><h3>last saved</h3><div class="note-table"><div class="row"><span>时间</span><strong>${escapeHtml(state.settings.savedAt)}</strong></div><div class="row"><span>状态</span><strong>${ui.dirty ? "等待保存" : "已同步"}</strong></div></div></section>`;
    if (section === "general") {
      content = `<section class="page-grid cols-2"><article class="panel stack-16"><div class="panel-head"><div><p class="eyebrow">Workspace</p><h2>工作目录与节奏</h2></div>${renderBadge("active", "repo scoped")}</div><div class="field-grid single"><label class="field-label"><span>默认项目根目录</span><input class="field mono" data-setting="projectRoot" value="${escapeHtml(values.projectRoot)}" /></label><label class="field-label"><span>每日最大章节数</span><input class="field" data-setting="dailyMaxChapters" value="${escapeHtml(values.dailyMaxChapters)}" /></label><label class="field-label"><span>默认写作节奏</span><textarea class="textarea" data-setting="writingPace">${escapeHtml(values.writingPace)}</textarea></label></div></article><article class="panel stack-12"><div class="panel-head"><h2>生效说明</h2>${renderBadge(ui.dirty ? "warning" : "success", ui.dirty ? "pending save" : "stable")}</div><div class="timeline"><div class="timeline-item"><span class="timeline-bar primary"></span><div><strong>目录与写作节奏会立刻影响新开任务</strong><p>保存后，仪表盘、建书流程和调度默认值都以这里为准。</p></div></div><div class="timeline-item"><span class="timeline-bar warning"></span><div><strong>不建议把每日章节上限拉得过高</strong><p>这会让 daemon 与审计负担同时上升，容易产生连续返工。</p></div></div></div></article></section>`;
      inspectorTitle = "工作区摘要";
      inspectorBody = `<section class="context-card stack-12"><h3>当前摘要</h3><div class="note-table"><div class="row"><span>projectRoot</span><strong class="mono">${escapeHtml(values.projectRoot)}</strong></div><div class="row"><span>daily cap</span><strong>${escapeHtml(values.dailyMaxChapters)} chapters</strong></div></div></section><section class="context-card stack-12"><h3>建议</h3><p>优先把日常节奏和目录边界定稳，再去改模型路由；否则很难判断问题来自策略还是模型。</p></section>`;
    } else if (section === "project-defaults") {
      content = `<section class="page-grid cols-2"><article class="panel stack-16"><div class="panel-head"><div><p class="eyebrow">Book Template</p><h2>新书默认值</h2></div>${renderBadge("active", "new books")}</div><div class="field-grid single"><label class="field-label"><span>默认题材</span><input class="field" data-setting="defaultBookGenre" value="${escapeHtml(values.defaultBookGenre)}" /></label><label class="field-label"><span>默认总字数目标</span><input class="field" data-setting="defaultWordGoal" value="${escapeHtml(values.defaultWordGoal)}" /></label><label class="field-label"><span>默认写作节奏</span><textarea class="textarea" data-setting="writingPace">${escapeHtml(values.writingPace)}</textarea></label></div></article><article class="panel stack-12"><div class="panel-head"><h2>模板边界</h2><span class="mono">project scaffold</span></div><div class="timeline"><div class="timeline-item"><span class="timeline-bar primary"></span><div><strong>只作用于新项目</strong><p>已有书籍不会被这里回写，避免历史项目被默认值污染。</p></div></div><div class="timeline-item"><span class="timeline-bar warning"></span><div><strong>字数目标应和调度节奏匹配</strong><p>目标极高但日上限过低，会让 dashboard 的优先级提示长期失真。</p></div></div></div></article></section>`;
      inspectorTitle = "模板摘要";
      inspectorBody = `<section class="context-card stack-12"><h3>默认模板</h3><div class="note-table"><div class="row"><span>genre</span><strong>${escapeHtml(values.defaultBookGenre)}</strong></div><div class="row"><span>word goal</span><strong class="mono">${escapeHtml(values.defaultWordGoal)}</strong></div></div></section><section class="context-card stack-12"><h3>作用说明</h3><p>这里适合收敛建书时的初始值，不适合放运行中项目的特例规则。</p></section>`;
    } else if (section === "notifications") {
      content = `<section class="page-grid cols-2"><article class="panel stack-16"><div class="panel-head"><div><p class="eyebrow">Notifications</p><h2>通知与提醒</h2></div>${renderBadge("active", "operator alerts")}</div><div class="field-grid single"><label class="field-label"><span>桌面通知</span><select class="select" data-setting="desktopNotifications">${renderSelectOptions(["开启", "关闭"], values.desktopNotifications)}</select></label><label class="field-label"><span>高风险失败提醒</span><select class="select" data-setting="highRiskAlerts">${renderSelectOptions(["立即提醒", "仅汇总"], values.highRiskAlerts)}</select></label></div><div class="action-row">${renderActionButton("恢复默认", "settings-restore", "danger", "md")}</div></article><article class="panel stack-12"><div class="panel-head"><h2>提醒策略</h2><span class="mono">2 channels</span></div><div class="timeline"><div class="timeline-item"><span class="timeline-bar warning"></span><div><strong>高风险失败建议保持立即提醒</strong><p>truth drift 和 audit failed 都属于会阻断后续写作的事件，不适合延迟汇总。</p></div></div><div class="timeline-item"><span class="timeline-bar primary"></span><div><strong>普通运行信息可以只在仪表盘查看</strong><p>避免把队列成功消息也推成高频弹窗。</p></div></div></div></article></section>`;
      inspectorTitle = "提醒摘要";
      inspectorBody = `<section class="context-card stack-12"><h3>当前策略</h3><div class="note-table"><div class="row"><span>桌面通知</span><strong>${escapeHtml(values.desktopNotifications)}</strong></div><div class="row"><span>高风险失败</span><strong>${escapeHtml(values.highRiskAlerts)}</strong></div></div></section><section class="context-card stack-12"><h3>建议</h3><p>如果你想降低噪音，优先收敛普通日志，不要先关掉高风险提醒。</p></section>`;
    } else if (section === "model-routing") {
      content = `<section class="page-grid cols-2"><article class="panel stack-16"><div class="panel-head"><div><p class="eyebrow">Routing</p><h2>角色模型</h2></div>${renderBadge("active", "editable")}</div><div class="field-grid single"><label class="field-label"><span>Chief</span><input class="field mono" data-setting="chiefModel" value="${escapeHtml(values.chiefModel)}" /></label><label class="field-label"><span>Writer</span><input class="field mono" data-setting="writerModel" value="${escapeHtml(values.writerModel)}" /></label><label class="field-label"><span>Auditor</span><input class="field mono" data-setting="auditorModel" value="${escapeHtml(values.auditorModel)}" /></label></div></article><article class="panel stack-12"><div class="panel-head"><h2>职责边界</h2><span class="mono">3 roles</span></div><div class="timeline"><div class="timeline-item"><span class="timeline-bar primary"></span><div><strong>Chief 负责高风险收敛</strong><p>适合多步规划、审批和跨页决策，不该被降级成只输出一句建议。</p></div></div><div class="timeline-item"><span class="timeline-bar primary"></span><div><strong>Writer 负责持续产出</strong><p>重在稳定推进章节和材料初稿，而不是承担最终一致性裁决。</p></div></div><div class="timeline-item"><span class="timeline-bar warning"></span><div><strong>Auditor 负责阻断与回归</strong><p>如果这里频繁切换模型，审计结果会比写作结果更不稳定。</p></div></div></div></article></section>`;
      inspectorTitle = "路由守则";
      inspectorLabel = "routing active";
      inspectorTone = "active";
      inspectorBody = `<section class="context-card stack-12"><h3>当前路由</h3><div class="note-table"><div class="row"><span>Chief</span><strong class="mono">${escapeHtml(values.chiefModel)}</strong></div><div class="row"><span>Writer</span><strong class="mono">${escapeHtml(values.writerModel)}</strong></div><div class="row"><span>Auditor</span><strong class="mono">${escapeHtml(values.auditorModel)}</strong></div></div></section><section class="context-card stack-12"><h3>风险提示</h3><p>如果要做稳定性实验，先固定 Auditor，再观察 Writer；不要同时动三条路由。</p></section>`;
    } else {
      content = `<section class="page-grid cols-2"><article class="panel stack-16"><div class="panel-head"><div><p class="eyebrow">Advanced</p><h2>能力状态</h2></div>${renderBadge("success", "capabilities")}</div><div class="field-grid single"><label class="field-label"><span>character skill track</span><select class="select" data-setting="skillTrackCharacter">${renderSelectOptions(["stable", "experimental"], values.skillTrackCharacter)}</select></label><label class="field-label"><span>faction skill track</span><select class="select" data-setting="skillTrackFaction">${renderSelectOptions(["stable", "experimental"], values.skillTrackFaction)}</select></label><label class="field-label"><span>location skill track</span><select class="select" data-setting="skillTrackLocation">${renderSelectOptions(["stable", "experimental"], values.skillTrackLocation)}</select></label><label class="field-label"><span>审批策略</span><select class="select" data-setting="approvalMode">${renderSelectOptions(["破坏性动作必须确认", "低风险动作自动通过"], values.approvalMode)}</select></label></div></article><article class="panel stack-12"><div class="panel-head"><h2>策略说明</h2><span class="mono">skill gates</span></div><div class="timeline"><div class="timeline-item"><span class="timeline-bar primary"></span><div><strong>stable 适合默认链路</strong><p>章节、审计和常规 materials 应优先走稳定轨。</p></div></div><div class="timeline-item"><span class="timeline-bar warning"></span><div><strong>experimental 只适合局部试点</strong><p>尤其是 location 这类会影响 truth 与章节锚点的能力，不该默认全局启用。</p></div></div></div></article></section>`;
      inspectorTitle = "能力风险";
      inspectorBody = `<section class="context-card stack-12"><h3>skill track</h3><div class="note-table"><div class="row"><span>character</span><strong class="mono">${escapeHtml(values.skillTrackCharacter)}</strong></div><div class="row"><span>faction</span><strong class="mono">${escapeHtml(values.skillTrackFaction)}</strong></div><div class="row"><span>location</span><strong class="mono">${escapeHtml(values.skillTrackLocation)}</strong></div><div class="row"><span>审批策略</span><strong>${escapeHtml(values.approvalMode)}</strong></div></div></section><section class="context-card stack-12"><h3>建议</h3><p>把实验能力限定在单一维度上更容易回溯，否则很难判断问题来自 skill 还是 prompt 边界。</p></section>`;
    }
    setMain(content);
    setInspector(`<div><p class="eyebrow">Settings Inspector</p><h2>${escapeHtml(inspectorTitle)}</h2></div>${renderBadge(inspectorTone, inspectorLabel)}`, inspectorBody);
    setModal("在设置页里提问", "适合咨询默认参数、模型路由和审批边界。", ui.quickQuery, getQuickResponse("settings"), "settings");
  }

  function renderCurrentPage() {
    const page = document.body.dataset.page;
    if (!page) return;
    if (page === "dashboard") return renderDashboard();
    if (page === "books") return renderBooks();
    if (page === "book-overview") return renderBookOverview();
    if (page === "chief") return renderChief();
    if (page === "chapter-workbench") return renderChapterWorkbench();
    if (page === "truth-center") return renderTruthCenter();
    if (page === "materials-center") return renderMaterialsCenter();
    if (page === "automation-center") return renderAutomationCenter();
    if (page === "settings") return renderSettings();
  }

  function cycleSort(current) {
    if (current === "recent") return "risk";
    if (current === "risk") return "words";
    return "recent";
  }

  function handleAction(action) {
    const [name, value] = action.split(":");
    const book = getActiveBook();
    if (name === "dashboard-toggle-sort") return updateState((draft) => { draft.ui.dashboard.sortByRisk = !draft.ui.dashboard.sortByRisk; }, { toast: "已切换仪表盘排序方式" });
    if (name === "dashboard-toggle-active") return updateState((draft) => { draft.ui.dashboard.onlyActive = !draft.ui.dashboard.onlyActive; }, { toast: "已切换仪表盘筛选" });
    if (name === "create-book") return updateState(() => createBook(), { toast: "已创建新的 mock 书籍", tone: "success" });
    if (name === "books-filter") return updateState((draft) => { draft.ui.books.filter = value; }, null);
    if (name === "books-cycle-sort") return updateState((draft) => { draft.ui.books.sort = cycleSort(draft.ui.books.sort); }, { toast: "书籍排序已更新" });
    if (name === "books-toggle-archived") return updateState((draft) => { draft.ui.books.showArchived = !draft.ui.books.showArchived; }, { toast: "归档显示状态已更新" });
    if (name === "book-select-approval") return updateState((draft) => { draft.ui.bookOverview.selectedApprovalId = value; }, null);
    if (name === "book-apply-approval") return updateState(() => applyDraft(book, value), { toast: "草案已应用保存", tone: "success" });
    if (name === "book-regenerate-approval") return updateState(() => regenerateMaterialCandidates(book, value), { toast: "已重新生成候选" });
    if (name === "chief-new-thread") return updateState((draft) => { draft.chief.threads.unshift({ id: `thread_${Date.now()}`, title: "新的总编线程", scope: "global", bookId: null, statusTone: "active", statusLabel: "new", updatedAt: "刚刚" }); }, { toast: "已新建线程" });
    if (name === "chief-select-thread") return updateState((draft) => {
      draft.ui.chief.selectedThreadId = value;
      draft.ui.chief.quickResponseIndex = 0;
      const thread = draft.chief.threads.find((entry) => entry.id === value);
      if (thread?.bookId && draft.books.some((entry) => entry.id === thread.bookId)) draft.ui.activeBookId = thread.bookId;
    }, null);
    if (name === "chief-select-candidate") return updateState((draft) => { findMutableChiefBook(draft).materialsCenter.selectedCandidateIds.character = value; }, null);
    if (name === "chief-apply-candidate") return updateState((draft) => applyDraft(findMutableChiefBook(draft), value), { toast: "候选已保存到 materials", tone: "success" });
    if (name === "chief-regenerate-character") return updateState((draft) => regenerateMaterialCandidates(findMutableChiefBook(draft), "character"), { toast: "已重新生成角色候选" });
    if (name === "chief-cancel-draft") return updateState((draft) => { const targetBook = findMutableChiefBook(draft); discardDraft(targetBook, getSelectedCandidate(targetBook, "character")?.id); }, { toast: "当前草案已取消", tone: "warning" });
    if (name === "chief-cancel-run") return updateState((draft) => { draft.ui.chief.quickResponseIndex = 0; }, { toast: "当前 run 已取消", tone: "warning" });
    if (name === "chief-keep-form") return showToast("已保持当前参数，继续保留这轮生成边界。", "success");
    if (name === "chief-attach-context") return updateState((draft) => {
      const thread = draft.chief.threads.find((entry) => entry.id === draft.ui.chief.selectedThreadId);
      const targetBook = thread?.bookId ? draft.books.find((entry) => entry.id === thread.bookId) : null;
      const context = targetBook
        ? `[ctx book=${targetBook.id} chapter=${String(targetBook.chapterCurrent || 0).padStart(3, "0")} latest=${targetBook.latestAction}]`
        : `[ctx queue=${draft.automation.queue.length} failures=${draft.automation.failureClusters.length}]`;
      draft.ui.chief.composer = `${draft.ui.chief.composer ? `${draft.ui.chief.composer} ` : ""}${context}`.trim();
    }, { toast: "已附加当前上下文" });
    if (name === "chief-send") return updateState((draft) => { draft.ui.chief.quickResponseIndex += 1; }, { toast: "已追加到总编线程" });
    if (name === "chapter-tab") return updateState((draft) => { draft.ui.chapterWorkbench.activeTab = value; }, null);
    if (name === "chapter-apply-revision") return updateState(() => applyChapterRevision(book), { toast: "修订草案已应用", tone: "success" });
    if (name === "chapter-rerun-audit") return updateState(() => rerunAudit(book), { toast: state.ui.chapterWorkbench.revisionApplied ? "重新审计通过" : "已重新触发审计" });
    if (name === "truth-select-file") return updateState((draft) => { draft.ui.truthCenter.selectedFileId = value; }, null);
    if (name === "truth-tab") return updateState((draft) => { draft.ui.truthCenter.activeTab = value; }, null);
    if (name === "truth-resolve-drift") return updateState(() => resolveTruthDrift(book), { toast: "当前 drift 已标记处理", tone: "success" });
    if (name === "materials-type") return updateState((draft) => { draft.ui.materialsCenter.selectedType = value; }, null);
    if (name === "materials-filter") return updateState((draft) => { draft.ui.materialsCenter.libraryFilter = value; }, null);
    if (name === "materials-select-candidate") return updateState((draft) => { findBook(draft.ui.activeBookId).materialsCenter.selectedCandidateIds[draft.ui.materialsCenter.selectedType] = value; }, null);
    if (name === "materials-generate") return updateState(() => regenerateMaterialCandidates(book, state.ui.materialsCenter.selectedType), { toast: "已根据当前表单重新生成候选" });
    if (name === "materials-reset") return updateState((draft) => {
      const type = draft.ui.materialsCenter.selectedType;
      const baseBook = initialMock.books.find((entry) => entry.id === draft.ui.activeBookId) || initialMock.books[0];
      draft.books.find((entry) => entry.id === draft.ui.activeBookId).materialsCenter.formDefaults[type] = clone(baseBook.materialsCenter.formDefaults[type]);
    }, { toast: "表单已重置" });
    if (name === "materials-apply") return updateState(() => applyDraft(book, value), { toast: "素材草案已保存", tone: "success" });
    if (name === "materials-discard") return updateState(() => discardDraft(book, value), { toast: "素材草案已取消", tone: "warning" });
    if (name === "materials-regenerate") return updateState(() => regenerateMaterialCandidates(book, state.ui.materialsCenter.selectedType), { toast: "已重写当前候选" });
    if (name === "materials-edit-form") return showToast("表单已经在结果卡上方，可直接修改。", "active");
    if (name === "automation-toggle-daemon") return updateState(() => toggleDaemon(), { toast: state.automation.daemon.running ? "守护已暂停" : "守护已恢复" });
    if (name === "automation-inspect-now") return updateState((draft) => { inspectNow(); draft.ui.automation.activeTab = "queue"; draft.ui.automation.selectedJobId = draft.automation.queue[0]?.id || draft.ui.automation.selectedJobId; }, { toast: "已加入一次手动巡检" });
    if (name === "automation-tab") return updateState((draft) => {
      draft.ui.automation.activeTab = value;
      if (value === "queue") draft.ui.automation.selectedJobId = draft.automation.queue[0]?.id || draft.ui.automation.selectedJobId;
      if (value === "history") draft.ui.automation.selectedJobId = draft.automation.history[0]?.id || draft.ui.automation.selectedJobId;
    }, null);
    if (name === "automation-retry") return updateState((draft) => { retryJob(value); draft.ui.automation.selectedJobId = value; }, { toast: "任务已重试" });
    if (name === "automation-cancel") return updateState((draft) => { cancelJob(value); draft.ui.automation.selectedJobId = value; }, { toast: "任务已取消", tone: "warning" });
    if (name === "automation-view") return updateState((draft) => { draft.ui.automation.selectedJobId = value; }, { toast: `已切到 ${value} 的任务详情` });
    if (name === "settings-section") return updateState((draft) => { draft.ui.settings.currentSection = value; }, null);
    if (name === "settings-save") return updateState((draft) => { draft.ui.settings.dirty = false; draft.settings.savedAt = "刚刚"; }, { toast: "设置已保存", tone: "success" });
    if (name === "settings-restore") return updateState((draft) => { draft.settings.defaults = clone(initialMock.settings.defaults); draft.ui.settings.dirty = false; }, { toast: "当前设置已恢复默认" });
    if (name === "send-query") return updateState((draft) => { draft.ui[value].quickResponseIndex += 1; }, { toast: "总编已返回新的 mock 回复" });
  }

  function handleInput(target) {
    if (target.matches("[data-input='books-search']")) {
      state.ui.books.search = target.value;
      persistState();
      renderCurrentPage();
      return;
    }
    if (target.matches("[data-input='chief-search']")) {
      state.ui.chief.search = target.value;
      persistState();
      renderCurrentPage();
      return;
    }
    if (target.matches("[data-input='chief-composer']")) {
      state.ui.chief.composer = target.value;
      persistState();
      return;
    }
    const quickQuery = target.dataset.quickQuery;
    if (quickQuery && state.ui[quickQuery]) {
      state.ui[quickQuery].quickQuery = target.value;
      persistState();
    }
  }

  function handleChange(target) {
    const book = getActiveBook();
    if (target.dataset.setting && Object.prototype.hasOwnProperty.call(state.settings.defaults, target.dataset.setting)) {
      state.settings.defaults[target.dataset.setting] = target.value;
      state.ui.settings.dirty = true;
      persistState();
      renderCurrentPage();
      return;
    }
    if (target.matches("[data-setting='materials-positioning'], [data-setting='materials-quantity'], [data-setting='materials-constraints']")) {
      const type = state.ui.materialsCenter.selectedType;
      const map = { "materials-positioning": "positioning", "materials-quantity": "quantity", "materials-constraints": "constraints" };
      book.materialsCenter.formDefaults[type][map[target.dataset.setting]] = target.value;
      persistState();
    }
  }

  function wireEvents() {
    document.addEventListener("click", (event) => {
      const linkWithBook = event.target.closest("[data-target-book]");
      if (linkWithBook) {
        setActiveBook(linkWithBook.dataset.targetBook);
        persistState();
      }
      const themeToggle = event.target.closest(".theme-toggle");
      if (themeToggle) {
        const currentTheme = document.body.dataset.theme === "dark" ? "dark" : "light";
        const nextTheme = currentTheme === "dark" ? "light" : "dark";
        window.localStorage.setItem(themeStorageKey, nextTheme);
        applyTheme(nextTheme);
        return;
      }
      const openModal = event.target.closest("[data-open-modal]");
      if (openModal) {
        const modal = document.getElementById(openModal.dataset.openModal);
        if (modal) modal.classList.add("open");
        return;
      }
      const closeModal = event.target.closest("[data-close-modal]");
      if (closeModal) {
        closeModal.closest(".quick-modal")?.classList.remove("open");
        return;
      }
      const actionButton = event.target.closest("[data-action]");
      if (actionButton) {
        event.preventDefault();
        handleAction(actionButton.dataset.action);
      }
    });
    document.addEventListener("input", (event) => handleInput(event.target));
    document.addEventListener("change", (event) => handleChange(event.target));
    document.addEventListener("click", (event) => {
      if (event.target.classList.contains("quick-modal")) event.target.classList.remove("open");
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        document.querySelectorAll(".quick-modal.open").forEach((modal) => modal.classList.remove("open"));
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initRailIcons();
    initRailLayout();
    initThemeToggle();
    wireEvents();
    renderCurrentPage();
  });
})();
