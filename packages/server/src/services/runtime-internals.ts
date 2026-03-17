import type { ChapterAuditRecord, DraftArtifact, ResourceRecord, RunRecord, SkillRef, ToolAction, ToolPresentation } from "../contracts.js";
import { InkOSError } from "../errors.js";
import { createId, nowIso, weakEtag } from "../id.js";

export function createSkillRef(skillId: string): SkillRef {
  return {
    skillId,
    skillVersion: "1.0.0",
    skillHash: skillId.replace(/[^a-z]/gi, "").slice(0, 12).padEnd(12, "0"),
    source: "project",
  };
}

export function createRunRecord(
  threadId: string,
  input: Partial<RunRecord> & Pick<RunRecord, "status" | "summary" | "skillsLocked">,
): RunRecord {
  return {
    runId: createId("run"),
    threadId,
    ...(input.bookId ? { bookId: input.bookId } : {}),
    ...(input.chapterNumber ? { chapterNumber: input.chapterNumber } : {}),
    status: input.status,
    startedAt: nowIso(),
    ...(input.endedAt ? { endedAt: input.endedAt } : {}),
    ...(input.currentStepId ? { currentStepId: input.currentStepId } : {}),
    ...(input.stepCount ? { stepCount: input.stepCount } : {}),
    ...(input.estimatedDuration ? { estimatedDuration: input.estimatedDuration } : {}),
    eventCursor: 0,
    ...(input.pendingApprovalId ? { pendingApprovalId: input.pendingApprovalId } : {}),
    ...(input.activeCommandId ? { activeCommandId: input.activeCommandId } : {}),
    lastPersistedAt: nowIso(),
    skillsLocked: input.skillsLocked,
    ...(input.error ? { error: input.error } : {}),
    summary: input.summary,
    toolPresentations: input.toolPresentations ?? [],
  };
}

type ToolPresentationOptions = {
  readonly resourceRef?: NonNullable<ToolPresentation["resourceRef"]>;
};

export function createToolPresentation(
  runId: string,
  toolName: string,
  previewPayload: unknown,
  actions: ToolAction[],
  options?: ToolPresentationOptions,
): ToolPresentation {
  return {
    toolEventId: createId("tool"),
    runId,
    toolName,
    toolSchemaVersion: "1.0.0",
    previewPayload,
    actions,
    skillId: toolName.split(".")[0] ?? "chief",
    skillVersion: "1.0.0",
    ...(toolName === "chief.plan" ? { upgradeHint: "chief" as const } : {}),
    ...(options?.resourceRef ? { resourceRef: options.resourceRef } : {}),
  };
}

export function createTextResource(content: string, refId = createId("res")): ResourceRecord {
  return {
    refId,
    type: "text",
    uri: `/api/v1/resources/${refId}`,
    content,
    createdAt: nowIso(),
  };
}

export function createMaterialFormTool(
  runId: string,
  input: {
    bookId?: string;
    type: "character" | "faction" | "location";
    title: string;
    note?: string;
    draftId?: string;
    fields: ReadonlyArray<{
      key: string;
      label: string;
      required?: boolean;
      placeholder?: string;
      multiline?: boolean;
    }>;
    defaults?: Record<string, string>;
  },
): ToolPresentation {
  return createToolPresentation(
    runId,
    "material.request-form",
    {
      bookId: input.bookId,
      type: input.type,
      draftId: input.draftId,
      title: input.title,
      fields: input.fields,
      defaults: input.defaults ?? {},
      note: input.note ?? "补齐参数后生成结构化素材候选。",
    },
    [
      { actionId: createId("submit"), type: "submit", label: "生成候选" },
      { actionId: createId("cancel"), type: "cancel", label: "取消" },
    ],
  );
}

export function createMaterialResultTool(
  runId: string,
  input: { draftId: string; bookId: string; hasConflicts?: boolean },
): ToolPresentation {
  return createToolPresentation(runId, "material.table-result", { draftId: input.draftId, bookId: input.bookId }, [
    {
      actionId: createId("apply"),
      type: "apply",
      label: input.hasConflicts ? "确认覆盖保存" : "应用保存",
      confirmRequired: input.hasConflicts ? true : undefined,
      riskLevel: "medium",
    },
    { actionId: createId("regen"), type: "regenerate", label: "重写生成" },
    { actionId: createId("edit"), type: "edit", label: "编辑草案" },
    { actionId: createId("discard"), type: "discard", label: "丢弃", confirmRequired: true, riskLevel: "medium" },
    { actionId: createId("nav"), type: "navigate", label: "跳转素材中心", navigateTo: `/books/${input.bookId}/materials` },
  ]);
}

export function createBookFormTool(
  runId: string,
  defaults: {
    title?: string;
    genre?: string;
    targetChapter?: number;
    premise?: string;
  } = {},
): ToolPresentation {
  return createToolPresentation(
    runId,
    "book.create-form",
    {
      title: "补充建书信息",
      fields: [
        { key: "title", label: "书名", required: true, placeholder: "例如：吞天魔帝" },
        { key: "genre", label: "题材", required: true, placeholder: "例如：玄幻 / 科幻 / 历史" },
        { key: "targetChapter", label: "目标章节数", required: true, placeholder: "例如：200" },
        { key: "premise", label: "核心设定", required: true, multiline: true, placeholder: "一句话描述主冲突、世界观或主角目标" },
      ],
      defaults: {
        title: defaults.title ?? "",
        genre: defaults.genre ?? "",
        targetChapter: String(defaults.targetChapter ?? 200),
        premise: defaults.premise ?? "",
      },
      note: "先补齐最小必填项，server 再生成建书计划。",
    },
    [
      { actionId: createId("submit"), type: "submit", label: "生成建书计划" },
      { actionId: createId("cancel"), type: "cancel", label: "取消" },
    ],
  );
}

export function createBookResultTool(
  runId: string,
  book: {
    bookId: string;
    title: string;
    genre: string;
    targetChapter: number;
    premise: string;
  },
): ToolPresentation {
  return createToolPresentation(
    runId,
    "book.create-result",
    {
      ...book,
      nextAction: "先补 truth / materials，再开始第1章。",
    },
    [
      { actionId: createId("nav"), type: "navigate", label: "查看书籍", navigateTo: `/books/${book.bookId}` },
      { actionId: createId("chief"), type: "navigate", label: "进入主线程", navigateTo: `/chief?threadId=thread_${book.bookId}_write` },
      { actionId: createId("books"), type: "navigate", label: "返回书籍列表", navigateTo: "/books" },
    ],
  );
}

export function createAuditReportTool(runId: string, audit: ChapterAuditRecord, bookId: string): ToolPresentation {
  return createToolPresentation(
    runId,
    "chapter.audit-report",
    {
      bookId,
      chapterNumber: audit.chapterNumber,
      status: audit.status,
      summary: audit.summary,
      blockedBy: audit.blockedBy,
      nextAction: audit.nextAction,
      findings: audit.findings,
    },
    [
      { actionId: createId("nav"), type: "navigate", label: "查看原文", navigateTo: `/books/${bookId}/chapters/${audit.chapterNumber}` },
      { actionId: createId("repair"), type: "navigate", label: "一键修订", navigateTo: `/chief?threadId=thread_${bookId}_write` },
      { actionId: createId("book"), type: "navigate", label: "查看书籍总览", navigateTo: `/books/${bookId}` },
    ],
  );
}

export function ensureDraftVersion(draft: DraftArtifact, revision?: number, etag?: string): void {
  if (revision !== draft.revision || etag !== draft.etag) {
    throw new InkOSError("DRAFT.CONFLICT", "草案版本冲突", { statusCode: 409, details: { latest: draft } });
  }
}

export function hydrateRunToolPresentations(run: RunRecord): RunRecord {
  if (run.toolPresentations.length > 0) return run;

  if (run.runId === "run_write_001") {
    return {
      ...run,
      ...(run.bookId ? {} : { bookId: "book_001" }),
      ...(run.chapterNumber ? {} : { chapterNumber: 12 }),
      toolPresentations: [
        {
          toolEventId: "tool_trace_001",
          runId: run.runId,
          toolName: "chief.worker-trace",
          toolSchemaVersion: "1.0.0",
          previewPayload: {
            chapterNumber: 12,
            progress: 72,
            checkpoints: [
              { label: "Writer", status: "completed" },
              { label: "Auditor", status: "completed" },
              { label: "Reviser", status: "awaiting_approval" },
            ],
            liveNotes: ["writer 已产出第13章草稿", "auditor 发现第12章衔接冲突", "reviser 等待你确认修订策略"],
          },
          actions: [{ actionId: "cancel_write_001", type: "cancel", label: "取消执行", confirmRequired: true, riskLevel: "medium" }],
          skillId: "chief",
          skillVersion: "1.0.0",
        },
        {
          toolEventId: "tool_approval_001",
          runId: run.runId,
          toolName: "chief.approval-request",
          toolSchemaVersion: "1.0.0",
          previewPayload: {
            chapterNumber: 12,
            title: "是否按修订建议继续第13章？",
            blockedBy: "第12章人物位置和阵纹触发时序存在冲突，若直接续写会扩大返工范围。",
            riskLevel: "medium",
            impact: "会更新第13章草稿和 truth 摘要",
          },
          resourceRef: {
            refId: "res_audit_001",
            type: "text",
            uri: "/api/v1/resources/res_audit_001",
          },
          actions: [
            { actionId: "approval_write_001", type: "approve", label: "批准继续" },
            { actionId: "reject_write_001", type: "reject", label: "拒绝并停止" },
            { actionId: "goto_book_001", type: "navigate", label: "查看审计详情", navigateTo: "/books/book_001" },
          ],
          skillId: "chief",
          skillVersion: "1.0.0",
        },
      ],
    };
  }

  if (run.runId === "run_material_001" || run.runId === "run_material_002") {
    const draftId = run.runId === "run_material_001" ? "draft_character_001" : "draft_character_002";
    const bookId = run.runId === "run_material_001" ? "book_001" : "book_002";
    return {
      ...run,
      toolPresentations: [createMaterialResultTool(run.runId, { draftId, bookId })],
    };
  }

  return run;
}
