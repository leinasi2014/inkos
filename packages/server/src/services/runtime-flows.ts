import type { AckEnvelope, ChapterRecord, DraftArtifact, MaterialRecord, RunRecord, ThreadRecord } from "../contracts.js";
import { InkOSError } from "../errors.js";
import { createId, nowIso, weakEtag } from "../id.js";
import type { DatabaseStore } from "../store/database.js";
import {
  applyMaterialDraft,
  editMaterialDraft,
  regenerateMaterialDraft,
  startMaterialRun,
  submitMaterialForm,
} from "./material-flow.js";
import { buildChapterAuditRecord } from "./runtime-read-models.js";
import type { RuntimeLLM } from "./runtime-llm.js";
import {
  createBookFormTool,
  createBookResultTool,
  createAuditReportTool,
  createRunRecord,
  createSkillRef,
  createToolPresentation,
  ensureDraftVersion,
} from "./runtime-internals.js";

export interface RuntimeFlowDeps {
  readonly store: DatabaseStore;
  readonly llm: RuntimeLLM | null;
  readonly getThread: (threadId: string) => ThreadRecord;
  readonly getRun: (runId: string) => RunRecord;
  readonly getDraft: (draftId: string) => DraftArtifact;
  readonly syncBookDerivedState: (bookId: string) => void;
  readonly emitEvent: (runId: string, threadId: string, event: string, payload: unknown) => void;
}

export async function handleUserMessage(deps: RuntimeFlowDeps, commandId: string, threadId: string, content: string): Promise<AckEnvelope> {
  const thread = deps.getThread(threadId);
  deps.store.saveMessage({
    messageId: createId("msg"),
    threadId,
    role: "user",
    text: content,
    createdAt: nowIso(),
  });

  if (/(建书|新建.*书|建一本|做一本|开一本).*(书|小说)?|帮我建一本.*(书|小说)/.test(content)) {
    return startCreateBookRun(deps, commandId, thread, content);
  }
  if (/审计.*(没过|失败)|为什么.*(没过|失败)|为什么没过|审计为什么/.test(content)) {
    return startAuditDiagnosticRun(deps, commandId, thread, content);
  }
  if (/下一章|续写|写下一章/.test(content)) return startWriteRun(deps, commandId, thread);
  if (/(角色|阵营|地点)/.test(content)) return startMaterialRun(deps, commandId, thread, content);
  return await startQuickReplyRun(deps, commandId, thread, content);
}

export function submitForm(deps: RuntimeFlowDeps, commandId: string, runId: string, threadId: string, formData: Record<string, unknown>): AckEnvelope {
  const run = deps.getRun(runId);
  const thread = deps.getThread(threadId);
  const currentTool = run.toolPresentations[run.toolPresentations.length - 1];

  if (currentTool?.toolName === "book.create-form") {
    return submitBookCreateForm(deps, commandId, run, thread, formData);
  }
  if (currentTool?.toolName === "material.request-form") {
    return submitMaterialForm(deps, commandId, run, thread, currentTool, formData);
  }
  throw new InkOSError("COMMAND.INVALID_PAYLOAD", "当前 Tool UI 不支持提交表单", { statusCode: 400 });
}

export function approveAction(deps: RuntimeFlowDeps, commandId: string, runId: string, threadId: string, approvalId: string): AckEnvelope {
  const run = deps.getRun(runId);
  if (approvalId !== run.pendingApprovalId) {
    throw new InkOSError("COMMAND.INVALID_PAYLOAD", "approvalId 不匹配", { statusCode: 400 });
  }
  if (run.currentStepId === "confirm_plan") return completeCreateBookRun(deps, commandId, run, threadId);
  return completeWriteRun(deps, commandId, run, threadId);
}

export function cancelAction(deps: RuntimeFlowDeps, commandId: string, runId: string, threadId: string): AckEnvelope {
  const run = deps.getRun(runId);
  const currentTool = run.toolPresentations[run.toolPresentations.length - 1];
  if (run.currentStepId === "confirm_plan" && currentTool?.toolName === "chief.plan") {
    const payload = currentTool.previewPayload as Record<string, unknown>;
    const bookConfig = (payload.bookConfig ?? {}) as Record<string, unknown>;
    const formTool = createBookFormTool(runId, {
      title: String(bookConfig.title ?? ""),
      genre: String(bookConfig.genre ?? ""),
      targetChapter: Number(bookConfig.targetChapter ?? 200),
      premise: String(bookConfig.premise ?? ""),
    });
    const nextRun: RunRecord = {
      ...run,
      status: "planning",
      pendingApprovalId: undefined,
      currentStepId: "collect_book_params",
      lastPersistedAt: nowIso(),
      summary: "已返回参数编辑，可以重新调整建书信息。",
      toolPresentations: [formTool],
    };
    deps.store.saveRun(nextRun);
    deps.emitEvent(runId, threadId, "run_state_changed", { runId, status: nextRun.status, currentStepId: nextRun.currentStepId });
    deps.emitEvent(runId, threadId, "tool_presented", formTool);
    return { type: "ack", commandId, success: true, runId };
  }

  const nextRun: RunRecord = {
    ...run,
    status: "cancelled",
    endedAt: nowIso(),
    pendingApprovalId: undefined,
    currentStepId: "cancelled",
    lastPersistedAt: nowIso(),
    summary: "当前动作已取消，未落任何破坏性变更。",
  };
  deps.store.saveRun(nextRun);
  deps.emitEvent(runId, threadId, "run_cancelled", { runId });
  return { type: "ack", commandId, success: true, runId };
}

export function applyDraft(deps: RuntimeFlowDeps, commandId: string, draftId: string, revision?: number, etag?: string): AckEnvelope {
  const draft = deps.getDraft(draftId);
  if (draft.skillRef.skillId === "material.generator") {
    return applyMaterialDraft(deps, commandId, draftId, revision, etag);
  }
  ensureDraftVersion(draft, revision, etag);
  const nextDraft: DraftArtifact = {
    ...draft,
    status: "applied",
    revision: draft.revision + 1,
    etag: weakEtag(draft.revision + 1),
    updatedAt: nowIso(),
  };
  deps.store.saveDraft(nextDraft);

  const material: MaterialRecord = {
    materialId: createId("mat"),
    bookId: draft.bookId,
    type: nextDraft.type,
    name: String((nextDraft.preview as Record<string, unknown>).title ?? "未命名素材"),
    status: "applied",
    sourceRunId: nextDraft.sourceRunId,
    sourceThreadId: nextDraft.sourceThreadId,
    provenance: "chief / draft_apply",
    note: "由 DraftArtifact 应用生成。",
    payload: nextDraft.preview,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  deps.store.saveMaterial(material);
  deps.syncBookDerivedState(draft.bookId);
  deps.emitEvent(nextDraft.sourceRunId, nextDraft.sourceThreadId, "draft_state_changed", {
    draftId: nextDraft.draftId,
    revision: nextDraft.revision,
    status: nextDraft.status,
    sourceRunId: nextDraft.sourceRunId,
  });
  return { type: "ack", commandId, success: true, runId: nextDraft.sourceRunId };
}

export function discardDraft(deps: RuntimeFlowDeps, commandId: string, draftId: string): AckEnvelope {
  const draft = deps.getDraft(draftId);
  const nextDraft: DraftArtifact = {
    ...draft,
    status: "discarded",
    revision: draft.revision + 1,
    etag: weakEtag(draft.revision + 1),
    updatedAt: nowIso(),
  };
  deps.store.saveDraft(nextDraft);
  deps.syncBookDerivedState(draft.bookId);
  deps.emitEvent(nextDraft.sourceRunId, nextDraft.sourceThreadId, "draft_state_changed", {
    draftId: nextDraft.draftId,
    revision: nextDraft.revision,
    status: nextDraft.status,
    sourceRunId: nextDraft.sourceRunId,
  });
  return { type: "ack", commandId, success: true, runId: nextDraft.sourceRunId };
}

export function editDraft(
  deps: RuntimeFlowDeps,
  commandId: string,
  draftId: string,
  revision: number,
  etag: string,
  changes: Record<string, unknown>,
): AckEnvelope {
  const draft = deps.getDraft(draftId);
  if (draft.skillRef.skillId === "material.generator") {
    return editMaterialDraft(deps, commandId, draftId, revision, etag, changes);
  }
  ensureDraftVersion(draft, revision, etag);
  const nextDraft: DraftArtifact = {
    ...draft,
    revision: draft.revision + 1,
    etag: weakEtag(draft.revision + 1),
    preview: {
      ...(draft.preview as Record<string, unknown>),
      ...changes,
    },
    updatedAt: nowIso(),
  };
  deps.store.saveDraft(nextDraft);
  deps.emitEvent(nextDraft.sourceRunId, nextDraft.sourceThreadId, "draft_state_changed", {
    draftId: nextDraft.draftId,
    revision: nextDraft.revision,
    status: nextDraft.status,
    sourceRunId: nextDraft.sourceRunId,
  });
  return { type: "ack", commandId, success: true, runId: nextDraft.sourceRunId };
}

export function regenerateDraft(deps: RuntimeFlowDeps, commandId: string, draftId: string, instruction?: string): AckEnvelope {
  const draft = deps.getDraft(draftId);
  if (draft.skillRef.skillId === "material.generator") {
    return regenerateMaterialDraft(deps, commandId, draftId, instruction);
  }
  const preview = draft.preview as Record<string, unknown>;
  const nextDraft: DraftArtifact = {
    ...draft,
    revision: draft.revision + 1,
    etag: weakEtag(draft.revision + 1),
    preview: {
      ...preview,
      fit: `${String(preview.fit ?? "")} ${instruction ? `补充要求：${instruction}` : "已按当前上下文重写一轮。"}`.trim(),
    },
    updatedAt: nowIso(),
  };
  deps.store.saveDraft(nextDraft);
  deps.emitEvent(nextDraft.sourceRunId, nextDraft.sourceThreadId, "draft_state_changed", {
    draftId: nextDraft.draftId,
    revision: nextDraft.revision,
    status: nextDraft.status,
    sourceRunId: nextDraft.sourceRunId,
  });
  return { type: "ack", commandId, success: true, runId: nextDraft.sourceRunId };
}

export function cancelRun(deps: RuntimeFlowDeps, commandId: string, runId: string): AckEnvelope {
  const run = deps.getRun(runId);
  const nextRun: RunRecord = {
    ...run,
    status: "cancelled",
    endedAt: nowIso(),
    currentStepId: "cancelled",
    lastPersistedAt: nowIso(),
    summary: "执行已取消。",
  };
  deps.store.saveRun(nextRun);
  deps.emitEvent(runId, run.threadId, "run_cancelled", { runId });
  return { type: "ack", commandId, success: true, runId };
}

function startCreateBookRun(deps: RuntimeFlowDeps, commandId: string, thread: ThreadRecord, content: string): AckEnvelope {
  const inferredGenre = inferGenreFromPrompt(content);
  const run = createRunRecord(thread.threadId, {
    status: "planning",
    currentStepId: "collect_book_params",
    stepCount: 3,
    estimatedDuration: 24,
    summary: "先补齐书名、题材和章节目标，再生成建书计划。",
    skillsLocked: { chief: createSkillRef("chief.architect") },
  });
  const tool = createBookFormTool(run.runId, { genre: inferredGenre });

  deps.store.saveRun({ ...run, toolPresentations: [tool] });
  deps.emitEvent(run.runId, thread.threadId, "run_started", { runId: run.runId, threadId: thread.threadId, stepCount: 3, estimatedDuration: 24 });
  deps.emitEvent(run.runId, thread.threadId, "assistant_text_delta", { delta: "先补齐建书参数。", cursor: 1 });
  deps.emitEvent(run.runId, thread.threadId, "tool_presented", tool);
  return { type: "ack", commandId, success: true, runId: run.runId };
}

function startWriteRun(deps: RuntimeFlowDeps, commandId: string, thread: ThreadRecord): AckEnvelope {
  const run = createRunRecord(thread.threadId, {
    status: "awaiting_approval",
    currentStepId: "approval_gate",
    stepCount: 3,
    estimatedDuration: 180,
    pendingApprovalId: createId("approval"),
    summary: "writer 和 auditor 已跑完，当前需要你决定是否按修订建议继续写第13章。",
    skillsLocked: {
      writer: createSkillRef("chief.writer"),
      auditor: createSkillRef("chief.auditor"),
      reviser: createSkillRef("chief.reviser"),
    },
  });

  const traceTool = createToolPresentation(
    run.runId,
    "chief.worker-trace",
    {
      progress: 72,
      checkpoints: [
        { label: "Writer", status: "completed" },
        { label: "Auditor", status: "completed" },
        { label: "Reviser", status: "awaiting_approval" },
      ],
      liveNotes: ["writer 已产出第13章草稿", "auditor 发现第12章衔接冲突", "reviser 等待你确认修订策略"],
    },
    [{ actionId: createId("cancel"), type: "cancel", label: "取消执行", confirmRequired: true, riskLevel: "medium" }],
  );

  const approvalTool = createToolPresentation(
    run.runId,
    "chief.approval-request",
    {
      title: "是否按修订建议继续第13章？",
      blockedBy: "第12章人物位置和阵纹触发时序存在冲突，若直接续写会扩大返工范围。",
      riskLevel: "medium",
      impact: "会更新第13章草稿和 truth 摘要",
    },
    [
      { actionId: run.pendingApprovalId!, type: "approve", label: "批准继续" },
      { actionId: createId("reject"), type: "reject", label: "拒绝并停止" },
      { actionId: createId("nav"), type: "navigate", label: "查看审计详情", navigateTo: "/books/book_001" },
    ],
  );

  deps.store.saveRun({ ...run, toolPresentations: [traceTool, approvalTool] });
  deps.emitEvent(run.runId, thread.threadId, "run_started", { runId: run.runId, threadId: thread.threadId, stepCount: 3, estimatedDuration: 180 });
  deps.emitEvent(run.runId, thread.threadId, "run_state_changed", { runId: run.runId, status: "awaiting_approval", currentStepId: "approval_gate" });
  deps.emitEvent(run.runId, thread.threadId, "tool_presented", traceTool);
  deps.emitEvent(run.runId, thread.threadId, "tool_presented", approvalTool);
  return { type: "ack", commandId, success: true, runId: run.runId };
}

function startAuditDiagnosticRun(deps: RuntimeFlowDeps, commandId: string, thread: ThreadRecord, content: string): AckEnvelope {
  const bookId = thread.bookId ?? "book_001";
  const chapterMatch = content.match(/第\s*(\d+)\s*章/);
  const book = deps.store.getBook(bookId);
  const chapterNumber = chapterMatch ? Number(chapterMatch[1]) : Math.max(1, (book?.currentChapter ?? 1) - 1);
  const audit = buildChapterAuditRecord(deps.store, bookId, chapterNumber);

  if (!audit) {
    return startQuickReplyFallback(deps, commandId, thread, `第${chapterNumber}章当前没有可复盘的审计记录，建议先执行一次审计或回到 /chief 写作线程查看最近运行。`);
  }

  const run = createRunRecord(thread.threadId, {
    status: "completed",
    currentStepId: "completed",
    stepCount: 1,
    estimatedDuration: 8,
    endedAt: nowIso(),
    summary: `第${chapterNumber}章的审计阻塞点已经整理好了，可以直接查看原文或进入修订流。`,
    skillsLocked: { auditor: createSkillRef("chief.auditor") },
  });

  const tool = createAuditReportTool(run.runId, audit, bookId);
  deps.store.saveRun({ ...run, toolPresentations: [tool] });
  deps.emitEvent(run.runId, thread.threadId, "run_started", { runId: run.runId, threadId: thread.threadId, stepCount: 1, estimatedDuration: 8 });
  deps.emitEvent(run.runId, thread.threadId, "tool_presented", tool);
  deps.emitEvent(run.runId, thread.threadId, "run_completed", { runId: run.runId, summary: run.summary });
  deps.store.saveMessage({
    messageId: createId("msg"),
    threadId: thread.threadId,
    role: "assistant",
    text: run.summary,
    createdAt: nowIso(),
  });
  return { type: "ack", commandId, success: true, runId: run.runId };
}

async function startQuickReplyRun(deps: RuntimeFlowDeps, commandId: string, thread: ThreadRecord, content: string): Promise<AckEnvelope> {
  const summary = await buildQuickReplySummary(deps, thread, content);
  return startQuickReplyFallback(deps, commandId, thread, summary);
}

function startQuickReplyFallback(deps: RuntimeFlowDeps, commandId: string, thread: ThreadRecord, summary: string): AckEnvelope {
  const run = createRunRecord(thread.threadId, {
    status: "completed",
    currentStepId: "completed",
    stepCount: 1,
    estimatedDuration: 5,
    endedAt: nowIso(),
    summary,
    skillsLocked: { chief: createSkillRef("chief.architect") },
  });
  deps.store.saveRun(run);
  deps.emitEvent(run.runId, thread.threadId, "run_started", { runId: run.runId, threadId: thread.threadId, stepCount: 1, estimatedDuration: 5 });
  deps.emitEvent(run.runId, thread.threadId, "assistant_text_delta", { delta: run.summary, cursor: 1 });
  deps.emitEvent(run.runId, thread.threadId, "run_completed", { runId: run.runId, summary: run.summary });
  deps.store.saveMessage({
    messageId: createId("msg"),
    threadId: thread.threadId,
    role: "assistant",
    text: run.summary,
    createdAt: nowIso(),
  });
  return { type: "ack", commandId, success: true, runId: run.runId };
}

async function buildQuickReplySummary(deps: RuntimeFlowDeps, thread: ThreadRecord, content: string): Promise<string> {
  if (!deps.llm) {
    return `已收到你的请求：“${content}”。当前优先处理《吞天魔帝》的审计和 materials。`;
  }

  try {
    return await deps.llm.completeChiefReply({ thread, content });
  } catch {
    return `已收到你的请求：“${content}”。当前优先处理《吞天魔帝》的审计和 materials。`;
  }
}

function completeCreateBookRun(deps: RuntimeFlowDeps, commandId: string, run: RunRecord, threadId: string): AckEnvelope {
  const planTool = run.toolPresentations.find((tool) => tool.toolName === "chief.plan");
  const payload = (planTool?.previewPayload ?? {}) as Record<string, unknown>;
  const bookConfig = (payload.bookConfig ?? {}) as Record<string, unknown>;
  const title = String(bookConfig.title ?? "新建项目");
  const genre = String(bookConfig.genre ?? "玄幻");
  const targetChapter = Math.max(12, Number(bookConfig.targetChapter ?? 200));
  const premise = String(bookConfig.premise ?? "待补充核心设定");
  const bookId = createId("book");
  const createdAt = nowIso();
  deps.store.saveBook({
    id: bookId,
    title,
    genre,
    phase: "初始化",
    riskTone: "active",
    riskLabel: "刚创建",
    progressLabel: `0 / ${targetChapter} 章`,
    wordsLabel: "0 字",
    currentChapter: 1,
    targetChapter,
    nextAction: "先补设定，再开始第1章。",
    summary: `${premise} 默认 truth files 与 materials summary 已生成。`,
    metrics: { materials: 0, truthIssues: 0, pendingDrafts: 0 },
    createdAt,
    updatedAt: createdAt,
  });
  deps.store.saveChapter({
    bookId,
    chapterNumber: 1,
    title: "第1章 初始化占位",
    status: "draft",
    wordCount: 0,
    auditStatus: "pending",
    content: "建书完成后，这里会承接第1章草稿。",
    createdAt,
    updatedAt: createdAt,
  });
  deps.store.saveTruthFile({
    bookId,
    fileName: "book_manifest.md",
    category: "manifest",
    note: "书籍基础配置与总目标。",
    content: `# ${title}\n\n- 题材：${genre}\n- 目标章节：${targetChapter}\n- 核心设定：${premise}`,
    createdAt,
    updatedAt: createdAt,
  });
  deps.store.saveTruthFile({
    bookId,
    fileName: "character_roster.md",
    category: "character",
    note: "角色表骨架，后续由 materials 持续补齐。",
    content: "# Character Roster\n\n- 主角：待补\n- 对位角色：待补\n- 关键关系：待补",
    createdAt,
    updatedAt: createdAt,
  });
  deps.store.saveTruthFile({
    bookId,
    fileName: "materials_summary.md",
    category: "bridge",
    note: "当前阶段的 materials bridge strategy 摘要。",
    content: `# Materials Summary\n\n- 当前暂无已应用素材\n- 优先围绕“${premise}”补角色 / 阵营 / 地点`,
    createdAt,
    updatedAt: createdAt,
  });
  deps.store.saveThread({
    threadId: `thread_${bookId}_write`,
    scope: "book",
    title: `${title} / 写作主线程`,
    bookId,
    lastMessageAt: createdAt,
    archived: false,
    createdAt,
  });
  deps.store.saveThread({
    threadId: `thread_${bookId}_materials`,
    scope: "book",
    title: `${title} / 素材生成`,
    bookId,
    lastMessageAt: createdAt,
    archived: false,
    createdAt,
  });

  const resultTool = createBookResultTool(run.runId, { bookId, title, genre, targetChapter, premise });
  const nextRun: RunRecord = {
    ...run,
    status: "completed",
    endedAt: createdAt,
    pendingApprovalId: undefined,
    currentStepId: "completed",
    lastPersistedAt: createdAt,
    summary: `《${title}》建书完成，可以直接查看书籍总览。`,
    toolPresentations: [resultTool],
  };
  deps.store.saveRun(nextRun);
  deps.emitEvent(run.runId, threadId, "tool_presented", resultTool);
  deps.emitEvent(run.runId, threadId, "run_completed", { runId: run.runId, summary: nextRun.summary, bookId });
  deps.store.saveMessage({
    messageId: createId("msg"),
    threadId,
    role: "assistant",
    text: nextRun.summary,
    createdAt,
  });
  return { type: "ack", commandId, success: true, runId: run.runId };
}

function completeWriteRun(deps: RuntimeFlowDeps, commandId: string, run: RunRecord, threadId: string): AckEnvelope {
  const thread = deps.getThread(threadId);
  const bookId = thread.bookId ?? "book_001";
  const current = deps.store.getBook(bookId);
  const nextChapterNumber = current ? current.currentChapter + 1 : 1;
  const updatedAt = nowIso();
  if (current) {
    deps.store.saveBook({
      ...current,
      currentChapter: nextChapterNumber,
      progressLabel: `${nextChapterNumber} / ${current.targetChapter} 章`,
      nextAction: `回看第${nextChapterNumber}章草稿，并决定是否进入下一轮审计修订。`,
      updatedAt,
    });
  }

  const existingChapter = deps.store.getChapter(bookId, nextChapterNumber);
  if (!existingChapter) {
    const createdAt = updatedAt;
    const nextChapter: ChapterRecord = {
      bookId,
      chapterNumber: nextChapterNumber,
      title: `第${nextChapterNumber}章 断崖后的回火`,
      status: "ready",
      wordCount: 2860,
      auditStatus: "pending",
      content: `第${nextChapterNumber}章草稿已由写作闭环落库。当前版本聚焦师徒矛盾、断崖追逐和旧宗门暗线的第一次正面咬合。`,
      createdAt,
      updatedAt: createdAt,
    };
    deps.store.saveChapter(nextChapter);
  }

  const traceTool = createToolPresentation(
    run.runId,
    "chief.worker-trace",
    {
      progress: 100,
      checkpoints: [
        { label: "Writer", status: "completed" },
        { label: "Auditor", status: "completed" },
        { label: "Reviser", status: "completed" },
      ],
      liveNotes: [
        `第${nextChapterNumber}章草稿已落库`,
        "审计阻塞点已按审批意见处理",
        "章节工作台与书籍进度已同步刷新",
      ],
    },
    [],
  );

  const nextRun: RunRecord = {
    ...run,
    status: "completed",
    endedAt: updatedAt,
    pendingApprovalId: undefined,
    currentStepId: "completed",
    lastPersistedAt: updatedAt,
    summary: `已按修订建议继续执行，第${nextChapterNumber}章草稿和书籍进度都已刷新。`,
    toolPresentations: [traceTool],
  };
  deps.store.saveRun(nextRun);
  deps.emitEvent(run.runId, threadId, "run_completed", { runId: run.runId, summary: nextRun.summary });
  deps.store.saveMessage({
    messageId: createId("msg"),
    threadId,
    role: "assistant",
    text: nextRun.summary,
    createdAt: updatedAt,
  });
  return { type: "ack", commandId, success: true, runId: run.runId };
}

function submitBookCreateForm(
  deps: RuntimeFlowDeps,
  commandId: string,
  run: RunRecord,
  thread: ThreadRecord,
  formData: Record<string, unknown>,
): AckEnvelope {
  const title = String(formData.title ?? "").trim();
  const genre = String(formData.genre ?? "").trim();
  const targetChapter = Number(formData.targetChapter ?? 0);
  const premise = String(formData.premise ?? "").trim();

  if (!title || !genre || !premise || !Number.isFinite(targetChapter) || targetChapter <= 0) {
    throw new InkOSError("BOOK.INVALID_INPUT", "书名、题材、目标章节数、核心设定都是必填项。", { statusCode: 400 });
  }

  const duplicated = deps.store
    .listBooks()
    .some((book) => book.title.trim().toLowerCase() === title.toLowerCase());
  if (duplicated) {
    throw new InkOSError("BOOK.CONFLICT", `书名《${title}》已存在，请修改后再提交。`, { statusCode: 409 });
  }

  const approvalId = createId("approval");
  const planTool = createToolPresentation(
    run.runId,
    "chief.plan",
    {
      goal: `建立新书工程：《${title}》`,
      bookConfig: {
        title,
        genre,
        targetChapter,
        premise,
      },
      steps: [
        "创建 book manifest、character roster、materials summary 三个基础 truth 文件",
        "建立写作主线程和素材线程，供 /chief 与专页复用",
        "初始化第1章占位，等待正式写作流接入",
      ],
      note: "确认后 server 会写入 book / thread / truth file 基础记录。",
    },
    [
      { actionId: approvalId, type: "approve", label: "确认建书" },
      { actionId: createId("edit"), type: "reject", label: "返回修改" },
      { actionId: createId("nav"), type: "navigate", label: "查看书籍列表", navigateTo: "/books" },
    ],
  );

  const nextRun: RunRecord = {
    ...run,
    status: "awaiting_approval",
    currentStepId: "confirm_plan",
    pendingApprovalId: approvalId,
    lastPersistedAt: nowIso(),
    summary: `《${title}》建书计划已生成，等待确认。`,
    toolPresentations: [planTool],
  };
  deps.store.saveRun(nextRun);
  deps.emitEvent(run.runId, thread.threadId, "run_state_changed", {
    runId: run.runId,
    status: nextRun.status,
    currentStepId: nextRun.currentStepId,
  });
  deps.emitEvent(run.runId, thread.threadId, "tool_presented", planTool);
  return { type: "ack", commandId, success: true, runId: run.runId };
}

function inferGenreFromPrompt(content: string): string {
  if (/科幻/.test(content)) return "科幻";
  if (/历史/.test(content)) return "历史";
  if (/悬疑/.test(content)) return "悬疑";
  if (/仙侠/.test(content)) return "仙侠";
  if (/都市/.test(content)) return "都市";
  return /玄幻/.test(content) ? "玄幻" : "";
}
