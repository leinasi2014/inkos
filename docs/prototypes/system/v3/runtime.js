(function bootInkOsV3Runtime() {
  var source = window.inkosV3Mock;
  var app = document.getElementById("app");
  if (!source || !app) return;
  var iconMap = {
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

  var state = JSON.parse(JSON.stringify(source));
  var body = document.body;
  var page = body.dataset.page || "prototype-index";
  var root = body.dataset.root || "./";
  var params = new URLSearchParams(window.location.search);
  var themeStorageKey = "inkos-prototype-theme-v3";
  var systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  var lastViewportMode = window.innerWidth < 768 ? "mobile" : "desktop";

  if (params.get("book")) state.ui.activeBookId = params.get("book");
  if (params.get("thread")) state.ui.selectedThreadId = params.get("thread");
  if (params.get("truth")) state.ui.selectedTruthFileId = params.get("truth");
  if (params.get("section")) state.ui.settingsSection = params.get("section");
  if (params.get("modal")) state.ui.modalOpen = params.get("modal") === "1";

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function route(pageId, options) {
    var next = options || {};
    var query = new URLSearchParams();
    if (next.bookId) query.set("book", next.bookId);
    if (next.threadId) query.set("thread", next.threadId);
    if (next.chapter) query.set("chapter", String(next.chapter));
    if (next.truthId) query.set("truth", next.truthId);
    if (next.section) query.set("section", next.section);
    if (next.modal) query.set("modal", "1");
    var baseMap = {
      "prototype-index": root + "index.html",
      dashboard: root + "pages/dashboard/v3/index.html",
      chief: root + "pages/chief/v3/index.html",
      books: root + "pages/books/v3/index.html",
      "book-overview": root + "pages/book-overview/v3/index.html",
      "chapter-workbench": root + "pages/chapter-workbench/v3/index.html",
      "truth-center": root + "pages/truth-center/v3/index.html",
      "materials-center": root + "pages/materials-center/v3/index.html",
      "automation-center": root + "pages/automation-center/v3/index.html",
      settings: root + "pages/settings/v3/index.html"
    };
    return baseMap[pageId] + (query.toString() ? "?" + query.toString() : "");
  }

  function hrefFromNavigateTo(target) {
    if (!target) return route("prototype-index");
    if (target === "/books") return route("books");
    var chiefMatch = target.match(/^\/chief\?book=([^&]+)&thread=([^&]+)$/);
    if (chiefMatch) {
      return route("chief", {
        bookId: chiefMatch[1],
        threadId: chiefMatch[2]
      });
    }
    var chapterMatch = target.match(/^\/books\/([^/]+)\/chapters\/(\d+)$/);
    if (chapterMatch) {
      return route("chapter-workbench", {
        bookId: chapterMatch[1],
        chapter: Number(chapterMatch[2])
      });
    }
    var materialsMatch = target.match(/^\/books\/([^/]+)\/materials$/);
    if (materialsMatch) {
      return route("materials-center", { bookId: materialsMatch[1] });
    }
    return target;
  }

  function toneClass(tone) {
    if (tone === "danger" || tone === "failed") return "danger";
    if (tone === "warning" || tone === "awaiting_approval" || tone === "cancelled") return "warning";
    if (tone === "success" || tone === "completed" || tone === "applied") return "success";
    return "active";
  }

  function statusLabel(status) {
    var map = {
      awaiting_user_action: "等待决策",
      awaiting_approval: "等待审批",
      planning: "规划中",
      executing: "执行中",
      completed: "已完成",
      cancelled: "已取消",
      draft: "草案",
      applied: "已保存",
      discarded: "已丢弃",
      failed: "已失败",
      running: "运行中",
      blocked: "阻塞中",
      done: "已完成"
    };
    return map[status] || status;
  }

  function button(label, kind, extra) {
    return '<button class="button ' + (kind || "secondary") + '" type="button" ' + (extra || "") + ">" + escapeHtml(label) + "</button>";
  }

  function linkButton(label, kind, href, extra) {
    return '<a class="button ' + (kind || "secondary") + '" href="' + escapeHtml(href) + '" ' + (extra || "") + ">" + escapeHtml(label) + "</a>";
  }

  function chip(label, active, attr) {
    return '<button class="chip' + (active ? " active" : "") + '" type="button" ' + (attr || "") + ">" + escapeHtml(label) + "</button>";
  }

  function pill(label, tone) {
    return '<span class="status-pill ' + toneClass(tone) + '">' + escapeHtml(label) + "</span>";
  }

  function getBook(bookId) {
    var targetId = bookId || state.ui.activeBookId;
    return state.books.find(function (book) { return book.id === targetId; }) || state.books[0];
  }

  function getBookById(bookId) {
    return state.books.find(function (book) { return book.id === bookId; }) || null;
  }

  function getThread() {
    return state.chief.threads.find(function (thread) {
      return thread.threadId === state.ui.selectedThreadId;
    }) || state.chief.threads[0];
  }

  function getThreadById(threadId) {
    return state.chief.threads.find(function (thread) {
      return thread.threadId === threadId;
    }) || null;
  }

  function getThreadBookTitle(thread) {
    if (!thread || !thread.bookId) return "全局线程";
    var threadBook = getBookById(thread.bookId);
    return threadBook ? threadBook.title : thread.bookId;
  }

  function getMaterialResultTool(run) {
    if (!run || !run.toolPresentations) return null;
    return run.toolPresentations.find(function (tool) {
      return tool.toolName === "material.table-result";
    }) || null;
  }

  function getMaterialResultDraft(run) {
    var resultTool = getMaterialResultTool(run);
    if (!resultTool || !resultTool.previewPayload) return null;
    return getDraft(resultTool.previewPayload.draftId);
  }

  function hasMaterialResult(run) {
    return !!getMaterialResultDraft(run);
  }

  function getBookMaterialThread(bookId) {
    return state.chief.threads.find(function (thread) {
      if (thread.bookId !== bookId) return false;
      return !!getMaterialResultTool(getRunById(thread.lastRunId));
    }) || null;
  }

  function getModalSourceRun() {
    if (page === "chief") return getRun(getThread());
    if (page === "materials-center") {
      var materialThread = getBookMaterialThread(getBook().id);
      return materialThread ? getRunById(materialThread.lastRunId) : null;
    }
    return null;
  }

  function modalRequiresUpgrade(sourceRun) {
    if (!sourceRun) return false;
    var sourceThread = getThreadById(sourceRun.threadId);
    var actionCount = (sourceRun.toolPresentations || []).reduce(function (maxCount, tool) {
      return Math.max(maxCount, (tool.actions || []).length);
    }, 0);
    var hasUpgradeHint = (sourceRun.toolPresentations || []).some(function (tool) {
      return !!tool.upgradeHint;
    });
    return !!(
      hasUpgradeHint ||
      sourceRun.status === "awaiting_approval" ||
      (sourceThread && sourceThread.scope !== "quick") ||
      sourceRun.stepCount > 1 ||
      sourceRun.estimatedDuration > 30 ||
      actionCount > 2
    );
  }

  function getChiefThreadSwitchTarget(bookId) {
    var targetThread = state.chief.threads.find(function (thread) {
      return thread.bookId === bookId && !thread.archived;
    });
    return targetThread ? targetThread.threadId : state.ui.selectedThreadId;
  }

  function getRun(thread) {
    var threadId = (thread || getThread()).threadId;
    var runList = Object.keys(state.chief.runs).map(function (key) { return state.chief.runs[key]; });
    return runList.find(function (run) { return run.threadId === threadId; }) || runList[0];
  }

  function getRunById(runId) {
    return state.chief.runs[runId] || null;
  }

  function getDraft(draftId) {
    return state.drafts.find(function (item) { return item.draftId === draftId; }) || null;
  }

  function getToolDraftId(tool) {
    return tool && tool.previewPayload ? tool.previewPayload.draftId : null;
  }

  function getToolDraft(tool) {
    var draftId = getToolDraftId(tool);
    return draftId ? getDraft(draftId) : null;
  }

  function isMobileViewport() {
    return window.innerWidth < 768;
  }

  function isWriteLocked(actionType) {
    if (actionType === "navigate") return false;
    if (state.connection.state !== "connected") return true;
    if (isMobileViewport() && (page === "chief" || page === "materials-center" || page === "automation-center" || page === "settings")) {
      return actionType !== "cancel" && actionType !== "reject";
    }
    return false;
  }

  function deriveToolState(tool) {
    var currentDraft = getToolDraft(tool);
    if (currentDraft) {
      if (currentDraft.status === "draft") return "awaiting_user_action";
      return currentDraft.status;
    }
    var toolRun = getRunById(tool.runId) || getRun();
    if (toolRun && (toolRun.status === "failed" || toolRun.error)) return "failed";
    if (!toolRun) return "idle";
    if (toolRun.status === "cancelled") return "cancelled";
    if (tool.toolName === "chief.approval-request") {
      if (toolRun.status === "awaiting_approval") return "awaiting_user_action";
      if (toolRun.status === "completed") return "completed";
    }
    if (tool.toolName === "chief.worker-trace") {
      if (toolRun.status === "completed") return "completed";
      return "generating";
    }
    if (tool.toolName === "chief.plan") {
      if (toolRun.status === "planning") return "awaiting_user_action";
      if (toolRun.status === "completed") return "completed";
    }
    if (tool.toolName === "material.request-form" && toolRun.status === "completed" && hasMaterialResult(toolRun)) return "completed";
    if (tool.toolName === "chapter.audit-report" && toolRun.status === "completed") return "completed";
    return "idle";
  }

  function renderToolActions(tool) {
    var actions = tool.actions || [];
    var currentState = deriveToolState(tool);
    return actions.map(function (item) {
      if (item.type === "navigate" && item.navigateTo) {
        return linkButton(item.label, "ghost", hrefFromNavigateTo(item.navigateTo));
      }
      var kind = "secondary";
      if (item.type === "apply" || item.type === "approve" || item.type === "submit") kind = "primary";
      if (item.type === "discard" || item.type === "reject") kind = "danger";
      var terminalLocked =
        (currentState === "applied" || currentState === "discarded" || currentState === "completed" || currentState === "cancelled") &&
        item.type !== "navigate";
      if (currentState === "completed" && item.type === "retry") terminalLocked = false;
      if (currentState === "failed" && item.type === "retry") terminalLocked = false;
      var disabled = (isWriteLocked(item.type) || terminalLocked) ? ' disabled aria-disabled="true" title="当前状态不可写"' : "";
      var confirmRequired = item.confirmRequired ? ' data-confirm-required="true"' : "";
      return button(item.label, kind, 'data-tool-action="' + escapeHtml(item.actionId) + '" data-tool-type="' + escapeHtml(item.type) + '"' + confirmRequired + disabled);
    }).join("");
  }

  function renderConversation(thread, run) {
    var locked = isWriteLocked("approve");
    return '' +
      '<section class="panel">' +
        '<div class="panel-head"><div><p class="eyebrow">Conversation</p><h2 class="section-title">主线程对话</h2></div>' + pill("assistant-ui", "active") + '</div>' +
        '<div class="bubble-stack">' +
          (thread.messages || []).map(function (message) {
            return '<article class="bubble ' + escapeHtml(message.role) + '"><strong>' + escapeHtml(message.role === "user" ? "User" : "Chief") + '</strong><p>' + escapeHtml(message.text) + '</p></article>';
          }).join("") +
          '<article class="bubble assistant"><strong>Chief</strong><p>' + escapeHtml(run.summary) + '</p></article>' +
        '</div>' +
        '<div class="composer"><label class="field-label"><span>继续追问 / 补充上下文</span><textarea class="textarea" placeholder="例如：保留旧宗门暗线，但不要让师父直接摊牌。"' + (locked ? " disabled" : "") + '>请继续沿着当前线程推进，但先保证第12章和 truth 对齐。</textarea></label><div class="button-row">' +
          button("发送到主线程", "primary", 'data-tool-action="chief-send-message" data-tool-type="edit"' + (locked ? ' disabled aria-disabled="true" title="当前状态不可写"' : "")) +
          button("附加当前书籍上下文", "ghost", 'data-tool-action="chief-attach-context" data-tool-type="edit"' + (locked ? ' disabled aria-disabled="true" title="当前状态不可写"' : "")) +
        '</div></div>' +
      '</section>';
  }

  function renderToolCard(tool) {
    var stateLabel = deriveToolState(tool);
    var payload = tool.previewPayload || {};
    var bodyHtml = "";

    if (tool.toolName === "chief.plan") {
      bodyHtml =
        '<div class="quote-box"><strong>' + escapeHtml(payload.goal) + "</strong><p>" + escapeHtml(payload.note) + "</p></div>" +
        '<div class="timeline">' +
        (payload.steps || []).map(function (step) {
          return '<div class="timeline-item"><div><strong>' + escapeHtml(step) + "</strong></div></div>";
        }).join("") +
        "</div>";
    } else if (tool.toolName === "chief.worker-trace") {
      bodyHtml =
        '<div class="progress-track"><div class="progress-fill" style="width:' + escapeHtml(payload.progress || 0) + '%"></div></div>' +
        '<div class="checkpoint-grid">' +
        (payload.checkpoints || []).map(function (step) {
          return '<div class="mini-card"><strong>' + escapeHtml(step.label) + '</strong><p>' + escapeHtml(statusLabel(step.status)) + "</p></div>";
        }).join("") +
        "</div>" +
        '<div class="log-list">' +
        (payload.liveNotes || []).map(function (line) {
          return '<div class="log-row"><span>live</span><span>' + escapeHtml(line) + "</span></div>";
        }).join("") +
        "</div>";
    } else if (tool.toolName === "chief.approval-request") {
      bodyHtml =
        '<div class="info-box"><strong>' + escapeHtml(payload.title) + "</strong><p>" + escapeHtml(payload.blockedBy) + "</p></div>" +
        '<div class="mini-grid">' +
        '<div class="mini-card"><span class="subtle">风险等级</span><strong>' + escapeHtml(payload.riskLevel || "medium") + "</strong></div>" +
        '<div class="mini-card"><span class="subtle">影响范围</span><strong>' + escapeHtml(payload.impact || "回写章节草稿") + "</strong></div>" +
        "</div>";
    } else if (tool.toolName === "chapter.audit-report") {
      bodyHtml =
        '<div class="info-box"><strong>失败检查</strong><div class="list-stack">' +
        (payload.failedChecks || []).map(function (line) { return "<p>" + escapeHtml(line) + "</p>"; }).join("") +
        "</div></div>" +
        '<div class="info-box"><strong>修订建议</strong><div class="list-stack">' +
        (payload.recommendations || []).map(function (line) { return "<p>" + escapeHtml(line) + "</p>"; }).join("") +
        "</div></div>";
    } else if (tool.toolName === "chief.error-card") {
      bodyHtml =
        '<div class="info-box"><strong>' + escapeHtml(payload.title) + '</strong><p>' + escapeHtml(payload.detail) + '</p></div>' +
        '<div class="mini-grid">' +
        '<div class="mini-card"><span class="subtle">errorCode</span><strong>' + escapeHtml(payload.errorCode || "UNKNOWN") + "</strong></div>" +
        '<div class="mini-card"><span class="subtle">状态</span><strong>需要处理</strong></div>' +
        "</div>";
    } else if (tool.toolName === "material.request-form") {
      var formLocked = isWriteLocked("apply") || deriveToolState(tool) === "completed" || deriveToolState(tool) === "cancelled";
      bodyHtml =
        '<div class="field-grid">' +
        (payload.fields || []).map(function (field) {
          var isLong = field.label.indexOf("目标") >= 0 || field.label.indexOf("核心") >= 0;
          return '<label class="field-label"><span>' + escapeHtml(field.label) + '</span>' +
            (isLong
              ? '<textarea class="textarea" ' + (formLocked ? 'disabled' : '') + '>' + escapeHtml(field.value) + '</textarea>'
              : '<input class="field" type="text" value="' + escapeHtml(field.value) + '" ' + (formLocked ? 'disabled' : '') + ' />') +
          '</label>';
        }).join("") +
        '</div>';
    } else if (tool.toolName === "material.table-result") {
      var materialDraft = getToolDraft(tool);
      var draftPreview = materialDraft ? materialDraft.preview : { anchors: [] };
      bodyHtml =
        '<div class="quote-box"><strong>' + escapeHtml(payload.title) + '</strong><p>' + escapeHtml(payload.summary) + "</p></div>" +
        '<div class="mini-grid">' +
        (draftPreview.anchors || []).map(function (anchor) {
          return '<div class="mini-card"><strong>' + escapeHtml(anchor) + "</strong></div>";
        }).join("") +
        '</div><div class="info-box"><strong>候选比较</strong><p>' + escapeHtml((payload.comparison || []).join(" / ")) + '</p><p class="subtle">' + escapeHtml(payload.bridge || "") + "</p></div>";
    }

    return '' +
      '<section class="tool-card">' +
        '<div class="tool-head">' +
          '<div><p class="tool-name">' + escapeHtml(tool.toolName) + '</p><h3 class="panel-title">' + escapeHtml(statusLabel(stateLabel)) + '</h3></div>' +
          pill(statusLabel(stateLabel), stateLabel) +
        '</div>' +
        '<div class="tool-body">' + bodyHtml + '</div>' +
        '<div class="tool-actions">' + renderToolActions(tool) + (tool.upgradeHint ? linkButton("升级到 /chief", "ghost", route("chief", { bookId: getBook().id, threadId: (getRunById(tool.runId) || getRun()).threadId })) : "") + '</div>' +
      '</section>';
  }

  function renderBookQuickNav(book) {
    return '' +
      '<div class="book-nav">' +
        linkButton("书籍总览", "ghost", route("book-overview", { bookId: book.id })) +
        linkButton("章节页", "ghost", route("chapter-workbench", { bookId: book.id, chapter: book.currentChapter })) +
        linkButton("Truth", "ghost", route("truth-center", { bookId: book.id })) +
        linkButton("Materials", "ghost", route("materials-center", { bookId: book.id })) +
      '</div>';
  }

  function renderBookContextPanel(book) {
    return '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Entry</p><h2 class="section-title">书内导航</h2></div>' + pill("明确跳转", "active") + '</div>' + renderBookQuickNav(book) + '</section>';
  }

  function renderChiefBookSwitch(thread) {
    return '<div class="book-nav">' +
      state.books.map(function (book) {
        var isActiveBook = thread.bookId === book.id;
        return linkButton(book.title, isActiveBook ? "secondary tiny" : "ghost tiny", route("chief", {
          bookId: book.id,
          threadId: getChiefThreadSwitchTarget(book.id)
        }));
      }).join("") +
    '</div>';
  }

  function renderMobileBookNav(book) {
    return '<section class="mobile-context-nav panel"><div class="panel-head"><div><p class="eyebrow">Book Nav</p><h2 class="section-title">书内导航</h2></div>' + pill("移动端提权", "active") + '</div>' + renderBookQuickNav(book) + '</section>';
  }

  function renderMobileChiefSummary(thread, run, book) {
    var mobileTools = run.toolPresentations || [];
    if (getMaterialResultTool(run) && !hasMaterialResult(run)) {
      mobileTools = mobileTools.slice(0, 1);
    }
    return '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Mobile</p><h2 class="section-title">移动端只读摘要</h2></div>' + pill("只读 + 明确跳转", "warning") + '</div><p class="section-copy">移动端不承载完整 /chief 多步事务。这里只保留当前 run 状态、关键步骤和明确跳转入口。</p><div class="timeline">' +
      mobileTools.map(function (tool) {
        return '<div class="timeline-item"><div><strong>' + escapeHtml(tool.toolName) + '</strong><p>' + escapeHtml(statusLabel(deriveToolState(tool))) + '</p></div></div>';
      }).join("") +
      '</div><div class="button-row">' +
      linkButton("查看章节页", "ghost", route("chapter-workbench", { bookId: book.id, chapter: book.currentChapter })) +
      linkButton("打开书籍总览", "ghost", route("book-overview", { bookId: book.id })) +
      linkButton("打开 Truth", "ghost", route("truth-center", { bookId: book.id })) +
      '</div></section>';
  }

  function renderGlobalChiefSummary(run) {
    return '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Mobile</p><h2 class="section-title">全局线程摘要</h2></div>' + pill("无书籍绑定", "warning") + '</div><p class="section-copy">这是全局线程，不绑定具体书籍。移动端只保留状态摘要与返回入口。</p><div class="timeline">' +
      (run.toolPresentations || []).map(function (tool) {
        return '<div class="timeline-item"><div><strong>' + escapeHtml(tool.toolName) + '</strong><p>' + escapeHtml(statusLabel(deriveToolState(tool))) + '</p></div></div>';
      }).join("") +
      '</div><div class="button-row">' +
      linkButton("查看书籍列表", "primary", route("books")) +
      linkButton("回仪表盘", "ghost", route("dashboard")) +
      '</div></section>';
  }

  function renderMobileMaterialsSummary(book, currentDraft) {
    if (!currentDraft) {
      return '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Mobile</p><h2 class="section-title">素材只读摘要</h2></div>' + pill("当前无草案", "warning") + '</div><p class="section-copy">这本书当前还没有可比较的 materials 草案。移动端只保留返回书籍总览和章节页的入口。</p><div class="button-row">' +
        linkButton("回书籍总览", "primary", route("book-overview", { bookId: book.id })) +
        linkButton("查看章节页", "ghost", route("chapter-workbench", { bookId: book.id, chapter: book.currentChapter })) +
        '</div></section>';
    }
    return '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Mobile</p><h2 class="section-title">素材只读摘要</h2></div>' + pill("移动端不做管理", "warning") + '</div><p class="section-copy">移动端只看当前草案状态和来源，真正的比较、编辑、应用和重写都要求回桌面端完成。这里不再把你来回导到 /chief。</p><div class="timeline"><div class="timeline-item"><div><strong>draftId</strong><p>' + escapeHtml(currentDraft.draftId) + '</p></div></div><div class="timeline-item"><div><strong>status</strong><p>' + escapeHtml(statusLabel(currentDraft.status)) + '</p></div></div><div class="timeline-item"><div><strong>sourceRunId</strong><p>' + escapeHtml(currentDraft.sourceRunId) + '</p></div></div></div><div class="info-box"><strong>桌面端处理</strong><p>候选比较和保存动作只在桌面端 /chief 或 materials 工作流里开放，移动端仅保留阅读和返回入口。</p></div><div class="button-row">' +
      linkButton("回书籍总览", "primary", route("book-overview", { bookId: book.id })) +
      linkButton("查看章节页", "ghost", route("chapter-workbench", { bookId: book.id, chapter: book.currentChapter })) +
      '</div></section>';
  }

  function getQuickAssistPayload() {
    var sourceRun = getModalSourceRun();
    var upgrade = modalRequiresUpgrade(sourceRun);
    var base = upgrade ? state.quickAssist.upgrade : state.quickAssist.quick;
    if (!base) return state.quickAssist;
    return Object.assign({}, base, {
      sourceRunId: sourceRun ? sourceRun.runId : null,
      stepCount: sourceRun ? sourceRun.stepCount : 1,
      estimatedDuration: sourceRun ? sourceRun.estimatedDuration : 8,
      scope: sourceRun ? ((getThreadById(sourceRun.threadId) || {}).scope || "quick") : "quick",
      upgradeRequired: upgrade
    });
  }

  function renderDashboard() {
    var heroBook = getBook("book_001");
    return {
      eyebrow: "v3 Prototype",
      title: "仪表盘",
      description: "多书概览、待办事项、最近活动和明确入口都集中在这里。复杂事务不在此页完成，而是转交给 /chief 或专页。",
      actions: button("快速问答", "secondary", 'data-modal-open="1"') + linkButton("打开 /chief", "primary", route("chief", { bookId: heroBook.id, threadId: "thread_write_ch13" })),
      body:
        '<div class="dashboard-layout">' +
          '<div class="thread-main">' +
            '<section class="hero-card"><p class="eyebrow">Focus</p><h2>' + escapeHtml(state.dashboard.hero.title) + '</h2><p>' + escapeHtml(state.dashboard.hero.note) + '</p><div class="button-row">' +
              linkButton("诊断审计失败", "primary", route("chief", { bookId: heroBook.id, threadId: "thread_audit_ch12" })) +
              linkButton("查看第12章", "secondary", route("chapter-workbench", { bookId: heroBook.id, chapter: 12 })) +
            '</div></section>' +
            '<section class="metric-grid">' +
              state.books.map(function (book) {
                return '<article class="metric-card"><span class="subtle">' + escapeHtml(book.title) + '</span><strong>' + escapeHtml(book.progressLabel) + '</strong><p>' + escapeHtml(book.riskLabel) + '</p></article>';
              }).join("") +
            '</section>' +
            '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Portfolio</p><h2 class="section-title">当前待办</h2></div>' + pill("3 个需要处理", "warning") + '</div><div class="timeline">' +
              state.dashboard.todos.map(function (item) {
                return '<div class="timeline-item"><div><strong>' + escapeHtml(item.title) + '</strong><p>' + escapeHtml(item.note) + '</p><p class="subtle">' + escapeHtml(item.owner) + '</p></div></div>';
              }).join("") +
            '</div></section>' +
            '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Books</p><h2 class="section-title">书籍概览</h2></div>' + linkButton("查看全部书籍", "ghost", route("books")) + '</div><div class="table-list">' +
              state.books.map(function (book) {
                return '<div class="table-row"><div><strong>' + escapeHtml(book.title) + '</strong><p>' + escapeHtml(book.summary) + '</p></div><div>' + pill(book.riskLabel, book.riskTone) + '</div><div class="button-row">' +
                  linkButton("总编", "ghost tiny", route("chief", { bookId: book.id, threadId: getChiefThreadSwitchTarget(book.id) })) +
                  linkButton("书页", "ghost tiny", route("book-overview", { bookId: book.id })) +
                '</div></div>';
              }).join("") +
            '</div></section>' +
          '</div>' +
          '<aside class="inspector-stack">' +
            '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Now</p><h2 class="section-title">最近活动</h2></div>' + pill("事件流", "active") + '</div><div class="log-list">' +
              state.dashboard.activity.map(function (item) {
                return '<div class="log-row"><span>' + escapeHtml(item.when) + '</span><span>' + escapeHtml(item.title) + '</span></div>';
              }).join("") +
            '</div></section>' +
            '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Entry</p><h2 class="section-title">快速入口</h2></div>' + pill("明确跳转", "success") + '</div>' +
              renderBookQuickNav(heroBook) +
            '</section>' +
          '</aside>' +
        '</div>'
    };
  }

  function renderChief() {
    var thread = getThread();
    var book = thread.bookId ? getBook(thread.bookId) : null;
    if (book && state.ui.activeBookId !== book.id) state.ui.activeBookId = book.id;
    var run = getRun(thread);
    var mobileChief = isMobileViewport();
    var chiefTools = run.toolPresentations || [];
    if (getMaterialResultTool(run) && !hasMaterialResult(run)) {
      chiefTools = chiefTools.slice(0, 1);
    }
    return {
      eyebrow: "Chief Workspace",
      title: thread.title,
      description: "这里是 /chief 的主线程工作台。多步事务、审批、候选比较和 >30 秒任务都要在这里闭环。",
      actions: renderChiefBookSwitch(thread) + (book ? linkButton("打开书页", "secondary", route("book-overview", { bookId: book.id })) : linkButton("查看书籍列表", "secondary", route("books"))) + button("快速问答", "ghost", 'data-modal-open="1"'),
      body:
        '<div class="chief-layout">' +
          '<aside class="thread-rail">' +
            '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Threads</p><h2 class="section-title">主线程</h2></div>' + pill("持久线程", "active") + '</div><div class="info-box"><strong>快速切书</strong><p>直接切到对应书籍的主线程，不必先退回 /books。</p>' + renderChiefBookSwitch(thread) + '</div>' +
              state.chief.threads.map(function (item) {
                var threadBookTitle = getThreadBookTitle(item);
                return '<button class="thread-card' + (item.threadId === thread.threadId ? ' active' : '') + '" type="button" data-thread-id="' + escapeHtml(item.threadId) + '" data-state="' + escapeHtml(item.status) + '">' +
                  '<div class="thread-head"><strong>' + escapeHtml(item.title) + '</strong>' + pill(statusLabel(item.status), item.status) + '</div>' +
                  '<div class="inline-tags">' + pill(threadBookTitle, item.bookId ? "active" : "warning") + pill("scope: " + item.scope, "success") + '</div>' +
                  '<p>' + escapeHtml(item.summary) + '</p>' +
                  '<div class="thread-meta"><span class="subtle">' + escapeHtml(item.updatedAt) + '</span></div>' +
                '</button>';
              }).join("") +
            '</section>' +
          '</aside>' +
          '<section class="thread-main">' +
            renderConversation(thread, run) +
            '<section class="hero-card"><p class="eyebrow">Run</p><h2>' + escapeHtml(run.summary) + '</h2><p>stepCount=' + escapeHtml(run.stepCount) + ' / estimatedDuration=' + escapeHtml(run.estimatedDuration) + 's / currentStep=' + escapeHtml(run.currentStepId || run.currentStep) + '</p><div class="meta-row">' +
              pill(statusLabel(run.status), run.status) +
              (book ? pill(book.title, "active") : pill("全局线程", "warning")) +
              pill("scope: " + thread.scope, "success") +
            '</div></section>' +
            (mobileChief
              ? ((book ? renderMobileChiefSummary(thread, run, book) : renderGlobalChiefSummary(run)) + chiefTools.map(renderToolCard).join(""))
              : chiefTools.map(renderToolCard).join("")) +
          '</section>' +
          '<aside class="inspector-stack">' +
            (book
              ? '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Context</p><h2 class="section-title">当前书籍</h2></div>' + pill(book.riskLabel, book.riskTone) + '</div><p>' + escapeHtml(book.summary) + '</p>' + renderBookQuickNav(book) + '</section>'
              : '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Context</p><h2 class="section-title">全局上下文</h2></div>' + pill("未绑定书籍", "warning") + '</div><p>当前线程作用于系统级操作，不绑定单本书籍，因此这里只给出书籍列表和全局入口，不渲染伪造的书内导航。</p><div class="button-row">' + linkButton("查看书籍列表", "primary", route("books")) + linkButton("回仪表盘", "ghost", route("dashboard")) + '</div></section>') +
            '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Contract</p><h2 class="section-title">升级规则</h2></div>' + pill("server 驱动", "success") + '</div><div class="timeline"><div class="timeline-item"><div><strong>审批</strong><p>' + (run.status === "awaiting_approval" ? "当前 run 正等待审批，必须留在 /chief 里决策。" : "没有审批时，仍由 run 事实决定是否需要升级。") + '</p></div></div><div class="timeline-item"><div><strong>多步事务</strong><p>stepCount=' + escapeHtml(run.stepCount) + '；只要大于 1，就不留在 modal。</p></div></div><div class="timeline-item"><div><strong>长时任务</strong><p>estimatedDuration=' + escapeHtml(run.estimatedDuration) + 's；超过 30 秒就继续留在主线程跟踪。</p></div></div></div></section>' +
          '</aside>' +
        '</div>'
    };
  }

  function renderBooks() {
    return {
      eyebrow: "Books",
      title: "书籍列表",
      description: "这里管理所有书籍的状态和入口，不抢 /automation 的监控职责，也不替代 /chief 的多步交互。",
      actions: linkButton("新建书籍走 /chief", "primary", route("chief", { threadId: "thread_create_book" })),
      body:
        '<div class="books-layout">' +
          '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Catalog</p><h2 class="section-title">全部书籍</h2></div>' + pill(String(state.books.length) + " 本", "active") + '</div><div class="table-list">' +
            state.books.map(function (book) {
                return '<div class="table-row"><div><strong>' + escapeHtml(book.title) + '</strong><p>' + escapeHtml(book.nextAction) + '</p></div><div>' + pill(book.riskLabel, book.riskTone) + '</div><div class="button-row">' +
                  linkButton("总览", "ghost tiny", route("book-overview", { bookId: book.id })) +
                  linkButton("总编", "ghost tiny", route("chief", { bookId: book.id, threadId: getChiefThreadSwitchTarget(book.id) })) +
                '</div></div>';
              }).join("") +
          '</div></section>' +
          '<aside class="inspector-stack"><section class="panel"><div class="panel-head"><div><p class="eyebrow">Split</p><h2 class="section-title">页面边界</h2></div>' + pill("IA 明确", "success") + '</div><div class="timeline"><div class="timeline-item"><div><strong>/books</strong><p>看列表、状态、快速入口。</p></div></div><div class="timeline-item"><div><strong>/chief</strong><p>继续做建书、续写和审批。</p></div></div><div class="timeline-item"><div><strong>专页</strong><p>正文、truth、materials、automation 都跳到专页完成。</p></div></div></div></section></aside>' +
        '</div>'
    };
  }

  function renderBookOverview() {
    var book = getBook();
    return {
      eyebrow: "Book Overview",
      title: book.title,
      description: "单书总览只负责章节、truth 和 materials 的入口与状态，不承载长文本操作。",
      actions: linkButton("回 /chief", "secondary", route("chief", { bookId: book.id, threadId: "thread_write_ch13" })),
      body:
        '<div class="books-layout">' +
          renderMobileBookNav(book) +
          '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Overview</p><h2 class="section-title">' + escapeHtml(book.phase) + '</h2></div>' + pill(book.riskLabel, book.riskTone) + '</div><p>' + escapeHtml(book.summary) + '</p><section class="metric-grid"><article class="metric-card"><span class="subtle">当前章节</span><strong>' + escapeHtml(book.currentChapter) + '</strong><p>' + escapeHtml(book.progressLabel) + '</p></article><article class="metric-card"><span class="subtle">素材数</span><strong>' + escapeHtml(book.metrics.materials) + '</strong><p>待确认 ' + escapeHtml(book.metrics.pendingDrafts) + '</p></article><article class="metric-card"><span class="subtle">truth 问题</span><strong>' + escapeHtml(book.metrics.truthIssues) + '</strong><p>建议先在专页查看</p></article></section><div class="divider"></div><div class="table-list">' +
            book.chapters.map(function (chapter) {
              return '<div class="table-row"><div><strong>第 ' + escapeHtml(chapter.no) + ' 章 · ' + escapeHtml(chapter.title) + '</strong><p>' + escapeHtml(chapter.note) + '</p></div><div>' + pill(chapter.status, chapter.status === "通过" ? "success" : chapter.status === "待诊断" ? "warning" : "active") + '</div><div class="button-row">' + linkButton("章节页", "ghost tiny", route("chapter-workbench", { bookId: book.id, chapter: chapter.no })) + "</div></div>";
            }).join("") +
          '</div></section>' +
          '<aside class="inspector-stack">' + renderBookContextPanel(book) + '</aside>' +
        '</div>'
    };
  }

  function renderChapterWorkbench() {
    var book = getBook();
    var chapterNo = Number(params.get("chapter") || book.currentChapter || 12);
    return {
      eyebrow: "Chapter Workbench",
      title: book.title + " · 第 " + chapterNo + " 章",
      description: "章节页负责长正文阅读、审计详情和修订 diff。结构化摘要可以来自 /chief，但长文必须在这里完成。",
      actions: linkButton("返回 /chief", "secondary", route("chief", { bookId: book.id, threadId: "thread_audit_ch12" })),
      body:
        '<div class="chapter-layout">' +
          renderMobileBookNav(book) +
          '<section class="thread-main">' +
            '<article class="story-card"><p class="eyebrow">Reading Surface</p><h2 class="section-title">正文节选</h2><p>断崖前的风像刀，师父没有回头，只把那枚半亮的阵纹递给他。那不是完成启动的光，而是被压住的余烬，像一场尚未被允许的雷暴。</p><p>主角意识到，若此刻让阵纹彻底亮起，第十二章最后那句“山门钟声仍在身后”就会立刻失效。于是他只能把脚步停在断崖外沿，把冲突留到下一章真正推开。</p><p>这页保持 720px 阅读区，长文本阅读不和多步事务混在同一层里。</p></article>' +
            '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Revision Diff</p><h2 class="section-title">修订建议</h2></div>' + pill("长 diff 在专页", "warning") + '</div><div class="timeline"><div class="timeline-item"><div><strong>- 完全启动阵纹</strong><p>+ 半启动阵纹，保留到第13章再触发。</p></div></div><div class="timeline-item"><div><strong>- 已抵达断崖前厅</strong><p>+ 仍停在山门外沿，视线先看见断崖残碑。</p></div></div></div></section>' +
          '</section>' +
          '<aside class="inspector-stack">' +
            renderBookContextPanel(book) +
            renderToolCard(getRun(getThreadById("thread_audit_ch12")).toolPresentations[0]) +
            '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Next</p><h2 class="section-title">后续动作</h2></div>' + pill("回 /chief 执行", "success") + '</div><div class="button-row">' + linkButton("回主线程修订", "primary", route("chief", { bookId: book.id, threadId: "thread_write_ch13" })) + linkButton("查看 truth", "ghost", route("truth-center", { bookId: book.id })) + '</div></section>' +
          '</aside>' +
        '</div>'
    };
  }

  function renderTruthCenter() {
    var book = getBook();
    var selected = book.truthFiles.find(function (item) {
      return item.id === state.ui.selectedTruthFileId;
    }) || book.truthFiles[0];
    return {
      eyebrow: "Truth Files",
      title: book.title + " · Truth Center",
      description: "Truth Files 管理运行时事实，不直接替代 materials。这里优先做 7 个文件的浏览和编辑入口。",
      actions: linkButton("回书籍总览", "secondary", route("book-overview", { bookId: book.id })),
      body:
        '<div class="truth-layout">' +
          renderMobileBookNav(book) +
          '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Truth Files</p><h2 class="section-title">' + escapeHtml(selected.label) + '</h2></div>' + pill(selected.category, "active") + '</div><div class="truth-tabs">' +
            book.truthFiles.map(function (file) {
              return chip(file.label, file.id === selected.id, 'data-truth-id="' + escapeHtml(file.id) + '"');
            }).join("") +
          '</div><div class="info-box"><strong>文件说明</strong><p>' + escapeHtml(selected.note) + '</p></div><div class="mono-block"># ' + escapeHtml(selected.label) + '\n\n- bookId: ' + escapeHtml(book.id) + '\n- category: ' + escapeHtml(selected.category) + '\n- latest note: ' + escapeHtml(selected.note) + '\n- bridge: materials_summary.md 只作为摘要注入，不替代 truth file</div></section>' +
          '<aside class="inspector-stack">' + renderBookContextPanel(book) + '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Boundary</p><h2 class="section-title">职责边界</h2></div>' + pill("truth != materials", "warning") + '</div><div class="timeline"><div class="timeline-item"><div><strong>Truth</strong><p>系统运行时事实状态，建议谨慎编辑。</p></div></div><div class="timeline-item"><div><strong>Materials</strong><p>用户主导的创作素材，允许自由调整。</p></div></div></div><div class="button-row">' + linkButton("查看 Materials", "ghost", route("materials-center", { bookId: book.id })) + '</div></section></aside>' +
        '</div>'
    };
  }

  function renderMaterialsCenter() {
    var book = getBook();
    var selectedType = state.ui.selectedMaterialType;
    var filtered = book.materials.filter(function (item) {
      return item.type === selectedType;
    });
    var materialThread = getBookMaterialThread(book.id);
    var materialRun = materialThread ? getRunById(materialThread.lastRunId) : null;
    var currentDraft = getMaterialResultDraft(materialRun) || state.drafts.find(function (draft) {
      return draft.bookId === book.id && draft.type === selectedType;
    }) || null;
    var mobileMaterials = isMobileViewport();
    return {
      eyebrow: "Materials",
      title: book.title + " · Materials Center",
      description: "这里负责 materials 列表管理、来源追踪、状态查看。复杂候选比较仍可回到 /chief。",
      actions: materialThread ? linkButton("继续在 /chief 比较候选", "primary", route("chief", { bookId: book.id, threadId: materialThread.threadId })) : linkButton("回书籍总览", "primary", route("book-overview", { bookId: book.id })),
      body:
        '<div class="materials-layout">' +
          renderMobileBookNav(book) +
          '<section class="thread-main"><section class="panel"><div class="panel-head"><div><p class="eyebrow">Frozen Types</p><h2 class="section-title">首批 3 类素材</h2></div>' + pill("character / faction / location", "success") + '</div><div class="materials-filter">' +
            chip("character", selectedType === "character", 'data-material-type="character"') +
            chip("faction", selectedType === "faction", 'data-material-type="faction"') +
            chip("location", selectedType === "location", 'data-material-type="location"') +
          '</div><div class="table-list">' +
            filtered.map(function (item) {
              return '<div class="table-row"><div><strong>' + escapeHtml(item.name) + '</strong><p>' + escapeHtml(item.note) + '</p></div><div>' + pill(item.status, item.status) + '</div><div><span class="subtle">' + escapeHtml(item.provenance) + "</span></div></div>";
            }).join("") +
          '</div></section>' +
          (mobileMaterials
            ? (renderMobileMaterialsSummary(book, currentDraft) + (materialRun ? materialRun.toolPresentations.map(renderToolCard).join("") : ""))
            : '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Draft State</p><h2 class="section-title">当前草案</h2></div>' + pill(currentDraft ? statusLabel(currentDraft.status) : "暂无草案", currentDraft ? currentDraft.status : "warning") + '</div>' + (materialRun && hasMaterialResult(materialRun) ? renderToolCard(getMaterialResultTool(materialRun)) : '<div class="empty-box"><strong>尚未生成结果卡</strong><p>当前这本书还没有可复盘的候选结果。</p></div>') + '</section>') +
          '</section>' +
          '<aside class="inspector-stack">' + renderBookContextPanel(book) + '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Bridge</p><h2 class="section-title">来源追踪</h2></div>' + pill("materials_summary.md", "active") + '</div>' + (currentDraft ? '<div class="timeline"><div class="timeline-item"><div><strong>sourceThreadId</strong><p>' + escapeHtml(currentDraft.sourceThreadId) + '</p></div></div><div class="timeline-item"><div><strong>sourceRunId</strong><p>' + escapeHtml(currentDraft.sourceRunId) + '</p></div></div><div class="timeline-item"><div><strong>etag</strong><p>' + escapeHtml(currentDraft.etag) + '</p></div></div></div>' : '<div class="empty-box"><strong>暂无来源信息</strong><p>当前书籍还没有已生成的 materials 草案。</p></div>') + '</section></aside>' +
        '</div>'
    };
  }

  function renderAutomationCenter() {
    return {
      eyebrow: "Automation",
      title: "调度中心",
      description: "这一页只做守护进程状态、队列和历史监控，不承担写作或审批完成面。",
      actions: linkButton("回仪表盘", "secondary", route("dashboard")),
      body:
        '<div class="automation-layout">' +
          '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Daemon</p><h2 class="section-title">守护状态</h2></div>' + pill(state.automation.daemon.state, "success") + '</div><section class="metric-grid"><article class="metric-card"><span class="subtle">workers</span><strong>' + escapeHtml(state.automation.daemon.workers) + '</strong><p>并发写作能力</p></article><article class="metric-card"><span class="subtle">next inspection</span><strong>' + escapeHtml(state.automation.daemon.nextInspection) + '</strong><p>下一次巡检</p></article><article class="metric-card"><span class="subtle">write cron</span><strong>' + escapeHtml(state.automation.daemon.writeCron) + '</strong><p>写作节奏</p></article></section></section>' +
          '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Queue</p><h2 class="section-title">当前队列</h2></div>' + pill(String(state.automation.queue.length) + " jobs", "warning") + '</div><div class="table-list">' +
            state.automation.queue.map(function (job) {
              return '<div class="table-row"><div><strong>' + escapeHtml(job.task) + '</strong><p>' + escapeHtml(job.note) + '</p></div><div>' + pill(job.state, job.state === "running" ? "active" : "warning") + '</div><div><span class="subtle">' + escapeHtml(job.scope) + "</span></div></div>";
            }).join("") +
          '</div></section>' +
          '<aside class="inspector-stack"><section class="panel"><div class="panel-head"><div><p class="eyebrow">History</p><h2 class="section-title">最近日志</h2></div>' + pill("只读监控", "active") + '</div><div class="log-list">' +
            state.automation.logs.map(function (line, index) {
              return '<div class="log-row"><span>' + escapeHtml(String(index + 1)) + '</span><span>' + escapeHtml(line) + '</span></div>';
            }).join("") +
          '</div></section></aside>' +
        '</div>'
    };
  }

  function renderSettings() {
    var section = state.settings.sections.find(function (item) {
      return item.id === state.ui.settingsSection;
    }) || state.settings.sections[0];
    var content = "";
    if (section.id === "llm") {
      content = '<div class="mini-grid"><div class="mini-card"><span class="subtle">Chief</span><strong>' + escapeHtml(state.settings.llm.chief) + '</strong></div><div class="mini-card"><span class="subtle">Writer</span><strong>' + escapeHtml(state.settings.llm.writer) + '</strong></div><div class="mini-card"><span class="subtle">Auditor</span><strong>' + escapeHtml(state.settings.llm.auditor) + '</strong></div></div>';
    } else if (section.id === "notifications") {
      content = '<div class="mini-grid"><div class="mini-card"><span class="subtle">桌面通知</span><strong>' + escapeHtml(state.settings.notifications.desktop) + '</strong></div><div class="mini-card"><span class="subtle">高风险提醒</span><strong>' + escapeHtml(state.settings.notifications.highRisk) + '</strong></div><div class="mini-card"><span class="subtle">日报</span><strong>' + escapeHtml(state.settings.notifications.dailyDigest) + '</strong></div></div>';
    } else if (section.id === "skills") {
      content = '<div class="table-list">' + state.settings.skills.map(function (item) {
        return '<div class="table-row"><div><strong>' + escapeHtml(item.label) + '</strong><p>' + escapeHtml(item.note) + '</p></div><div>' + pill(item.track, item.track === "stable" ? "success" : "warning") + '</div><div><span class="subtle">' + escapeHtml(item.id) + "</span></div></div>";
      }).join("") + "</div>";
    } else {
      content = '<div class="mini-grid"><div class="mini-card"><span class="subtle">审批模式</span><strong>' + escapeHtml(state.settings.advanced.approvalMode) + '</strong></div><div class="mini-card"><span class="subtle">数据库</span><strong>' + escapeHtml(state.settings.advanced.dbPath) + '</strong></div><div class="mini-card"><span class="subtle">WebSocket</span><strong>' + escapeHtml(state.settings.advanced.wsEndpoint) + '</strong></div></div>';
    }

    return {
      eyebrow: "Settings",
      title: "设置中心",
      description: "设置页承载 LLM 配置、通知和高级选项。当前阶段只把职责和布局定义清楚，复杂实验不在这里完成。",
      actions: linkButton("回仪表盘", "secondary", route("dashboard")),
      body:
        '<div class="settings-layout">' +
          '<section class="panel"><div class="panel-head"><div><p class="eyebrow">Sections</p><h2 class="section-title">' + escapeHtml(section.label) + '</h2></div>' + pill("v3 baseline", "active") + '</div><div class="settings-tabs">' +
            state.settings.sections.map(function (item) {
              return chip(item.label, item.id === section.id, 'data-settings-section="' + escapeHtml(item.id) + '"');
            }).join("") +
          '</div><div class="divider"></div>' + content + '</section>' +
          '<aside class="inspector-stack"><section class="panel"><div class="panel-head"><div><p class="eyebrow">Boundary</p><h2 class="section-title">为什么在这里</h2></div>' + pill("非主工作台", "warning") + '</div><div class="timeline"><div class="timeline-item"><div><strong>模型路由</strong><p>配置在这里，执行仍回到 /chief 和专页验证。</p></div></div><div class="timeline-item"><div><strong>Skill 可见性</strong><p>用户能看到 track 和说明，但不在这里做复杂编排。</p></div></div></div></section></aside>' +
        '</div>'
    };
  }

  function renderPrototypeIndex() {
    var cards = [
      { pageId: "dashboard", label: "Dashboard", path: "/" },
      { pageId: "chief", label: "Chief", path: "/chief" },
      { pageId: "books", label: "Books", path: "/books" },
      { pageId: "book-overview", label: "Book Overview", path: "/books/:bookId" },
      { pageId: "chapter-workbench", label: "Chapter Workbench", path: "/books/:bookId/chapters/:chapterNo" },
      { pageId: "truth-center", label: "Truth Center", path: "/books/:bookId/truth" },
      { pageId: "materials-center", label: "Materials Center", path: "/books/:bookId/materials" },
      { pageId: "automation-center", label: "Automation Center", path: "/automation" },
      { pageId: "settings", label: "Settings", path: "/settings" }
    ];

    return {
      eyebrow: "Prototype Library",
      title: "InkOS v3 原型入口",
      description: "v3 页面全部使用独立的 system/v3 运行时与样式。v2 原型仍保留，但不再承担本轮设计迭代。",
      actions: linkButton("打开 Dashboard v3", "primary", route("dashboard")) + linkButton("查看 v2 Chief", "ghost", "./pages/chief/v2/index.html"),
      body:
        '<div class="books-layout">' +
          '<section class="thread-main"><section class="hero-card"><p class="eyebrow">Current Track</p><h2>v3 独立设计基线</h2><p>这轮不覆盖 v2，而是新建完整 v3 页面体系：新样式、新运行时、新页面职责。</p></section><section class="panel"><div class="panel-head"><div><p class="eyebrow">Pages</p><h2 class="section-title">v3 页面库</h2></div>' + pill("9 pages", "success") + '</div><div class="metric-grid">' +
            cards.map(function (card) {
              return '<a class="mini-card" href="' + escapeHtml(route(card.pageId)) + '"><strong>' + escapeHtml(card.label) + '</strong><p>' + escapeHtml(card.path) + '</p></a>';
            }).join("") +
          '</div></section></section>' +
          '<aside class="inspector-stack"><section class="panel"><div class="panel-head"><div><p class="eyebrow">Legacy</p><h2 class="section-title">v2 保留</h2></div>' + pill("不动旧代码", "warning") + '</div><div class="button-row">' + linkButton("Dashboard v2", "ghost", "./pages/dashboard/v2/index.html") + linkButton("Chief v2", "ghost", "./pages/chief/v2/index.html") + '</div></section></aside>' +
        '</div>'
    };
  }

  function renderConnectionBanner() {
    if (state.connection.state === "connected" && !state.ui.notice) return "";
    var tone = state.connection.state === "disconnected" ? "danger" : state.connection.state === "reconnecting" ? "warning" : "success";
    var text = state.connection.state === "reconnecting"
      ? "连接暂时中断，正在按 1s → 2s → 4s 指数退避重连；写操作已冻结。"
      : state.connection.state === "disconnected"
        ? "server 未启动。原型会切到只读引导态，不展示过期缓存。"
        : "当前为原型交互提示。";
    var notice = state.ui.notice
      ? '<div class="connection-banner ' + toneClass(state.ui.notice.tone || "active") + '"><strong>' + escapeHtml(state.ui.notice.message) + "</strong></div>"
      : "";
    return '<div class="connection-banner ' + tone + '"><div><strong>' + escapeHtml(state.connection.state) + '</strong><p class="section-copy">' + escapeHtml(text) + '</p></div>' + button("切回 connected", "ghost", 'data-connection-state="connected"') + '</div>' + notice;
  }

  function renderDisconnectedPage() {
    app.innerHTML =
      '<div class="v3-shell"><div class="global-rail"><div class="rail-stack"><div class="brand-mark" aria-hidden="true"></div></div><div class="utility-stack"><div class="theme-stack"></div></div></div><div class="main-frame"><section class="service-state"><p class="eyebrow">Service State</p><h2>InkOS Server 未启动</h2><p>按照 v3 需求，前端在 disconnected 状态下不展示过期缓存，也不允许任何写操作。</p><code>pnpm --filter @inkos/server dev</code><div class="button-row">' +
        button("切回 connected", "primary", 'data-connection-state="connected"') +
        linkButton("返回原型入口", "ghost", route("prototype-index")) +
      '</div></section></div></div>';
  }

  function resolveRailIcon(link) {
    var href = link.getAttribute("href") || "";
    if (href.includes("/dashboard/")) return iconMap.dashboard;
    if (href.includes("/chief/")) return iconMap.chief;
    if (href.includes("/books/") && !href.includes("/materials-center/")) return iconMap.books;
    if (href.includes("/materials-center/")) return iconMap.materials;
    if (href.includes("/automation-center/")) return iconMap.automation;
    if (href.includes("/settings/")) return iconMap.settings;
    return iconMap.dashboard;
  }

  function initRailIcons() {
    Array.from(app.querySelectorAll(".brand-mark")).forEach(function (mark) {
      mark.innerHTML = iconMap.brand;
    });
    Array.from(app.querySelectorAll(".rail-link, .mobile-nav a")).forEach(function (link) {
      var label = link.getAttribute("aria-label") || "导航";
      link.innerHTML = resolveRailIcon(link) + '<span class="sr-only">' + escapeHtml(label) + "</span>";
    });
  }

  function applyTheme(theme) {
    var normalized = theme === "dark" ? "dark" : "light";
    var nextTheme = normalized === "dark" ? "light" : "dark";
    body.dataset.theme = normalized;
    window.localStorage.setItem(themeStorageKey, normalized);
    Array.from(app.querySelectorAll(".theme-toggle")).forEach(function (buttonNode) {
      buttonNode.innerHTML = (normalized === "dark" ? iconMap.themeLight : iconMap.themeDark) + '<span class="sr-only">切换到' + (nextTheme === "dark" ? "暗色" : "浅色") + '主题</span>';
      buttonNode.setAttribute("aria-label", '切换到' + (nextTheme === "dark" ? "暗色" : "浅色") + "主题");
      buttonNode.setAttribute("title", '切换到' + (nextTheme === "dark" ? "暗色" : "浅色") + "主题");
    });
  }

  function initThemeToggle() {
    Array.from(app.querySelectorAll(".theme-stack")).forEach(function (stack) {
      stack.innerHTML = '<button class="theme-toggle" type="button"></button>';
    });
    var saved = window.localStorage.getItem(themeStorageKey);
    var initial = saved === "dark" || saved === "light" ? saved : (systemThemeQuery.matches ? "dark" : "light");
    applyTheme(initial);
  }

  function renderNav(activePage) {
    var items = [
      { pageId: "dashboard", label: "仪表盘" },
      { pageId: "chief", label: "总编" },
      { pageId: "books", label: "书籍" },
      { pageId: "automation-center", label: "调度" }
    ];
    return '' +
      '<aside class="global-rail"><div class="rail-stack">' +
        '<a class="brand-mark" href="' + escapeHtml(route("prototype-index")) + '" aria-label="原型入口"></a>' +
        items.map(function (item) {
          var isActive = activePage === item.pageId || ((activePage === "truth-center" || activePage === "materials-center" || activePage === "chapter-workbench" || activePage === "book-overview") && item.pageId === "books");
          return '<a class="rail-link' + (isActive ? ' active' : '') + '" href="' + escapeHtml(route(item.pageId, { bookId: state.ui.activeBookId })) + '" aria-label="' + escapeHtml(item.label) + '" aria-current="' + (isActive ? "page" : "false") + '"></a>';
        }).join("") +
      '</div><div class="utility-stack"><a class="rail-link' + (activePage === "settings" ? ' active' : '') + '" href="' + escapeHtml(route("settings", { bookId: state.ui.activeBookId })) + '" aria-label="设置" aria-current="' + (activePage === "settings" ? "page" : "false") + '"></a><div class="theme-stack"></div></div></aside>';
  }

  function renderTopbar(view) {
    return '' +
      '<header class="topbar">' +
        '<div class="topbar-copy"><p class="eyebrow">' + escapeHtml(view.eyebrow) + '</p><h1>' + escapeHtml(view.title) + '</h1><p>' + escapeHtml(view.description) + '</p></div>' +
        '<div class="topbar-actions">' +
          '<div class="segmented">' +
            '<button type="button" class="' + (state.connection.state === "connected" ? 'active' : '') + '" data-connection-state="connected">Connected</button>' +
            '<button type="button" class="' + (state.connection.state === "reconnecting" ? 'active' : '') + '" data-connection-state="reconnecting">Reconnecting</button>' +
            '<button type="button" class="' + (state.connection.state === "disconnected" ? 'active' : '') + '" data-connection-state="disconnected">Disconnected</button>' +
          '</div>' +
          (view.actions || "") +
        '</div>' +
      '</header>';
  }

  function renderMobileNav(activePage) {
    var items = [
      { pageId: "dashboard", label: "仪表盘" },
      { pageId: "chief", label: "总编" },
      { pageId: "books", label: "书籍" },
      { pageId: "automation-center", label: "调度" },
      { pageId: "settings", label: "设置" }
    ];
    var groupedActivePage = (activePage === "truth-center" || activePage === "materials-center" || activePage === "chapter-workbench" || activePage === "book-overview")
      ? "books"
      : activePage;
    return '<nav class="mobile-nav">' + items.map(function (item) {
      return '<a class="' + (groupedActivePage === item.pageId ? 'active' : '') + '" href="' + escapeHtml(route(item.pageId, { bookId: state.ui.activeBookId })) + '" aria-label="' + escapeHtml(item.label) + '"></a>';
    }).join("") + "</nav>";
  }

  function renderModal() {
    var modal = getQuickAssistPayload();
    var sendButton = modal.upgradeRequired
      ? ""
      : button("发送追问", "primary", 'data-modal-send="1"');
    return '' +
      '<div class="modal-backdrop' + (state.ui.modalOpen ? ' open' : '') + '" data-backdrop="1">' +
        '<section class="modal-card" role="dialog" aria-modal="true">' +
          '<p class="eyebrow">Assistant Modal</p><h2 class="section-title">' + escapeHtml(modal.title) + '</h2><p>' + escapeHtml(modal.description) + '</p>' +
          '<div class="bubble-stack"><article class="bubble user"><strong>User</strong><p>' + escapeHtml(modal.prompt) + '</p></article><article class="bubble assistant"><strong>Chief</strong><p>' + escapeHtml(modal.reply) + '</p></article></div>' +
          '<label class="field-label"><span>快速追问</span><textarea class="textarea" data-modal-input="1"' + (modal.upgradeRequired ? ' disabled' : '') + '>' + escapeHtml(modal.upgradeRequired ? "如果必须升级，请把我带到对应线程。" : "继续告诉我：如果只处理一件事，先做哪一步？") + '</textarea></label>' +
          (modal.upgradeRequired ? '<div class="info-box"><strong>server.upgradeHint = chief</strong><p>当前场景由 run 事实触发升级：scope=' + escapeHtml(modal.scope) + ' / stepCount=' + escapeHtml(modal.stepCount) + ' / estimatedDuration=' + escapeHtml(modal.estimatedDuration) + 's。</p></div>' : '<div class="info-box"><strong>轻问答留在当前页</strong><p>当前是 quick scope 且单步可完成，所以允许直接在 modal 内闭环。</p></div>') +
          '<div class="button-row">' +
            sendButton +
            button(modal.actions[0].label, "secondary", 'data-modal-close="1"') +
            linkButton(modal.actions[1].label, "primary", route(modal.actions[1].route.page, modal.actions[1].route)) +
          '</div>' +
        '</section>' +
      '</div>';
  }

  function renderShell(view) {
    app.innerHTML =
      '<div class="v3-shell">' +
        renderNav(page) +
        '<div class="main-frame">' +
          renderTopbar(view) +
          renderConnectionBanner() +
          '<main class="page">' + view.body + '</main>' +
        '</div>' +
        renderMobileNav(page) +
        renderModal() +
      '</div>';
    initRailIcons();
    initThemeToggle();
  }

  function handleToolAction(actionId, actionType) {
    if (actionId === "chief-send-message") {
      var activeThread = getThread();
      activeThread.messages = activeThread.messages || [];
      activeThread.messages.push({ role: "user", text: "请继续沿着当前线程推进，但先保证第12章和 truth 对齐。" });
      activeThread.messages.push({ role: "assistant", text: "已追加到主线程。我会继续保持旧宗门暗线，同时优先把第12章与 truth 的冲突消掉。" });
      state.ui.notice = { tone: "success", message: "消息已追加到主线程，已生成 mock 回复。" };
      return;
    }
    if (actionId === "chief-attach-context") {
      var contextThread = getThread();
      contextThread.messages = contextThread.messages || [];
      if (contextThread.bookId) {
        var contextBook = getBook(contextThread.bookId);
        contextThread.messages.push({ role: "assistant", text: "已附加上下文：" + contextBook.title + " / 当前章节 " + contextBook.currentChapter + " / truth 问题 " + contextBook.metrics.truthIssues + " / 待确认素材 " + contextBook.metrics.pendingDrafts + "。" });
        state.ui.notice = { tone: "active", message: "书籍上下文已附加到当前线程。" };
      } else {
        contextThread.messages.push({ role: "assistant", text: "已附加全局上下文：当前共有 " + state.books.length + " 本书，最高优先级风险仍在《吞天魔帝》第12章审计失败。" });
        state.ui.notice = { tone: "active", message: "全局上下文已附加到当前线程。" };
      }
      return;
    }
    if (actionId === "material-submit-form") {
      state.ui.notice = { tone: "success", message: "表单参数已提交，mock 已接受这轮 materials 生成边界。" };
      return;
    }
    if (actionId === "material-cancel-form") {
      state.ui.notice = { tone: "warning", message: "表单编辑已取消，当前参数恢复为展示态。" };
      return;
    }
    if (actionId === "confirm_create_book") {
      state.chief.runs.run_create_book_201.status = "completed";
      state.chief.runs.run_create_book_201.currentStepId = "completed";
      var createThread = getThreadById("thread_create_book");
      if (createThread) createThread.status = "completed";
      state.ui.notice = { tone: "success", message: "建书计划已确认，原型已模拟完成建书并可跳到书籍列表。" };
      return;
    }
    if (actionId === "confirm_book3_resume") {
      state.chief.runs.run_book3_021.status = "completed";
      state.chief.runs.run_book3_021.currentStepId = "completed";
      var book3Thread = getThreadById("thread_book3_resume");
      if (book3Thread) book3Thread.status = "completed";
      state.ui.notice = { tone: "success", message: "《折月长歌》第4章恢复计划已确认，原型已模拟进入可继续写作状态。" };
      return;
    }
    if (actionId === "retry_create_book_failed") {
      state.ui.selectedThreadId = "thread_create_book";
      state.chief.runs.run_create_book_201.status = "planning";
      state.chief.runs.run_create_book_201.currentStepId = "confirm_plan";
      state.ui.notice = { tone: "active", message: "已回到建书线程，准备修改参数后重新提交。" };
      return;
    }
    if (actionId === "start_revision_from_audit") {
      state.ui.selectedThreadId = "thread_write_ch13";
      state.ui.notice = { tone: "active", message: "已从审计结果切入修订主线程。" };
      return;
    }
    if (actionId === "apply_draft_character_18") {
      var draftItem = getDraft("draft_character_18");
      if (draftItem) draftItem.status = "applied";
      state.ui.notice = { tone: "success", message: "draft_character_18 已写入 materials，Tool UI 状态从 DraftArtifact.status 推导为 applied。" };
      return;
    }
    if (actionId === "apply_draft_fenxing_char_1") {
      var fenxingDraft = getDraft("draft_fenxing_char_1");
      if (fenxingDraft) fenxingDraft.status = "applied";
      state.ui.notice = { tone: "success", message: "draft_fenxing_char_1 已写入 materials，焚星录的竞争对手设定已保存。" };
      return;
    }
    if (actionId === "discard_draft_character_18") {
      var discardDraft = getDraft("draft_character_18");
      if (discardDraft) discardDraft.status = "discarded";
      state.ui.notice = { tone: "warning", message: "draft_character_18 已丢弃，当前卡片状态同步为 discarded。" };
      return;
    }
    if (actionId === "discard_draft_fenxing_char_1") {
      var discardFenxingDraft = getDraft("draft_fenxing_char_1");
      if (discardFenxingDraft) discardFenxingDraft.status = "discarded";
      state.ui.notice = { tone: "warning", message: "draft_fenxing_char_1 已丢弃，焚星录当前候选状态同步为 discarded。" };
      return;
    }
    if (actionId === "approve_run_write_301") {
      state.chief.runs.run_write_301.status = "completed";
      state.chief.runs.run_write_301.currentStepId = "completed";
      var writeThread = getThreadById("thread_write_ch13");
      if (writeThread) writeThread.status = "completed";
      state.ui.notice = { tone: "success", message: "已批准修订，run_write_301 进入 completed，可跳章节页复核最终结果。" };
      return;
    }
    if (actionId === "cancel_run_write_301") {
      state.chief.runs.run_write_301.status = "cancelled";
      state.chief.runs.run_write_301.currentStepId = "cancelled";
      var cancelledThread = getThreadById("thread_write_ch13");
      if (cancelledThread) cancelledThread.status = "cancelled";
      state.ui.notice = { tone: "warning", message: "run_write_301 已取消，当前线程停止继续修订。" };
      return;
    }
    if (actionId === "reject_run_write_301") {
      state.chief.runs.run_write_301.status = "planning";
      var reviewThread = getThreadById("thread_write_ch13");
      if (reviewThread) reviewThread.status = "awaiting_user_action";
      state.ui.notice = { tone: "warning", message: "已拒绝自动修订，请先人工查看第12章正文与 truth。" };
      return;
    }
    if (actionType === "regenerate") {
      state.ui.notice = { tone: "active", message: "原型已模拟重新生成请求；复杂候选比较仍建议回 /chief 继续。" };
      return;
    }
    if (actionType === "edit") {
      state.ui.notice = { tone: "active", message: "当前为结构化预览态；真实实现会把表单回填到 AssistantModal 或 /chief。" };
      return;
    }
    if (actionType === "approve") {
      state.ui.notice = { tone: "success", message: "动作已确认。" };
      return;
    }
    if (actionType === "submit") {
      state.ui.notice = { tone: "success", message: "提交动作已触发。" };
      return;
    }
    if (actionType === "cancel") {
      state.ui.notice = { tone: "warning", message: "已取消当前动作。" };
      return;
    }
    if (actionType === "reject" || actionType === "discard") {
      state.ui.notice = { tone: "warning", message: "动作已取消。" };
      return;
    }
    state.ui.notice = { tone: "active", message: "已触发 " + actionId + "。" };
  }

  function bind() {
    Array.from(app.querySelectorAll(".theme-toggle")).forEach(function (node) {
      node.addEventListener("click", function () {
        var nextTheme = body.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
      });
    });

    Array.from(app.querySelectorAll("[data-connection-state]")).forEach(function (node) {
      node.addEventListener("click", function (event) {
        event.preventDefault();
        state.connection.state = node.getAttribute("data-connection-state");
        state.ui.notice = null;
        render();
      });
    });

    Array.from(app.querySelectorAll("[data-modal-open]")).forEach(function (node) {
      node.addEventListener("click", function () {
        state.ui.modalOpen = true;
        render();
      });
    });

    Array.from(app.querySelectorAll("[data-modal-close]")).forEach(function (node) {
      node.addEventListener("click", function (event) {
        event.stopPropagation();
        state.ui.modalOpen = false;
        render();
      });
    });

    Array.from(app.querySelectorAll("[data-modal-send]")).forEach(function (node) {
      node.addEventListener("click", function () {
        var input = app.querySelector("[data-modal-input]");
        var draftText = input ? input.value.trim() : "";
        var quickModal = state.quickAssist.quick || state.quickAssist;
        if (!draftText) {
          state.ui.notice = { tone: "warning", message: "请先输入追问内容，再发送。" };
          render();
          return;
        }
        quickModal.prompt = draftText;
        quickModal.reply = "已收到这条轻问答 mock 追问。当前建议仍然是先处理《吞天魔帝》第12章审计失败，再继续第13章写作。";
        state.ui.notice = { tone: "success", message: "轻问答已提交，modal 内已生成 mock 回复。" };
        render();
      });
    });

    Array.from(app.querySelectorAll("[data-backdrop]")).forEach(function (node) {
      node.addEventListener("click", function (event) {
        if (event.target === node && node.getAttribute("data-backdrop") === "1") {
          state.ui.modalOpen = false;
          render();
        }
      });
    });

    Array.from(app.querySelectorAll("[data-thread-id]")).forEach(function (node) {
      node.addEventListener("click", function () {
        var nextThread = getThreadById(node.getAttribute("data-thread-id"));
        state.ui.selectedThreadId = node.getAttribute("data-thread-id");
        if (nextThread && nextThread.bookId) state.ui.activeBookId = nextThread.bookId;
        state.ui.notice = null;
        render();
      });
    });

    Array.from(app.querySelectorAll("[data-truth-id]")).forEach(function (node) {
      node.addEventListener("click", function () {
        state.ui.selectedTruthFileId = node.getAttribute("data-truth-id");
        render();
      });
    });

    Array.from(app.querySelectorAll("[data-material-type]")).forEach(function (node) {
      node.addEventListener("click", function () {
        state.ui.selectedMaterialType = node.getAttribute("data-material-type");
        render();
      });
    });

    Array.from(app.querySelectorAll("[data-settings-section]")).forEach(function (node) {
      node.addEventListener("click", function () {
        state.ui.settingsSection = node.getAttribute("data-settings-section");
        render();
      });
    });

    Array.from(app.querySelectorAll("[data-tool-action]")).forEach(function (node) {
      node.addEventListener("click", function () {
        if (node.hasAttribute("disabled")) return;
        if (node.getAttribute("data-confirm-required") === "true") {
          var confirmed = window.confirm("这是破坏性动作，确认继续吗？");
          if (!confirmed) return;
        }
        handleToolAction(node.getAttribute("data-tool-action"), node.getAttribute("data-tool-type"));
        render();
      });
    });
  }

  function render() {
    if (state.connection.state === "disconnected" && page !== "prototype-index") {
      renderDisconnectedPage();
      initRailIcons();
      initThemeToggle();
      bind();
      return;
    }
    var rendererMap = {
      "prototype-index": renderPrototypeIndex,
      dashboard: renderDashboard,
      chief: renderChief,
      books: renderBooks,
      "book-overview": renderBookOverview,
      "chapter-workbench": renderChapterWorkbench,
      "truth-center": renderTruthCenter,
      "materials-center": renderMaterialsCenter,
      "automation-center": renderAutomationCenter,
      settings: renderSettings
    };
    var view = (rendererMap[page] || renderPrototypeIndex)();
    renderShell(view);
    bind();
  }

  window.addEventListener("resize", function () {
    var nextViewportMode = isMobileViewport() ? "mobile" : "desktop";
    if (nextViewportMode === lastViewportMode) return;
    lastViewportMode = nextViewportMode;
    render();
  });

  render();
})();
