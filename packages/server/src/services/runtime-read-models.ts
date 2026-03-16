import type {
  AutomationLogEntry,
  AutomationOverview,
  AutomationQueueItem,
  ChapterAuditFinding,
  ChapterAuditRecord,
  ChapterAuditTrace,
  SettingsOverview,
} from "../contracts.js";
import type { ServerConfig } from "../config.js";
import type { DatabaseStore } from "../store/database.js";
import { countTruthIssues } from "./book-derived-state.js";

function formatQueueItemLabel(threadTitle: string): string {
  return threadTitle.replace(/\s*\/\s*/g, " / ").trim();
}

function getThreadTargetHref(thread: { threadId: string; bookId?: string }): string {
  if (thread.threadId.includes("materials") && thread.bookId) {
    return `/books/${thread.bookId}/materials`;
  }
  return `/chief?threadId=${thread.threadId}`;
}

function getRunLogCategory(threadId: string, status: string): AutomationLogEntry["category"] {
  if (status === "awaiting_approval") return "approval";
  if (threadId.includes("materials")) return "material";
  return "run";
}

function getRunLogLevel(status: string): AutomationLogEntry["level"] {
  if (status === "awaiting_approval" || status === "failed") return "warning";
  if (status === "completed") return "success";
  return "info";
}

function buildQueue(store: DatabaseStore): AutomationQueueItem[] {
  const threads = store.listThreads();
  const queue: AutomationQueueItem[] = [];
  const seen = new Set<string>();

  function pushQueueItem(item: AutomationQueueItem) {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    queue.push(item);
  }

  for (const thread of threads) {
    if (!thread.lastRunId) continue;
    const run = store.getRun(thread.lastRunId);
    if (!run) continue;

    if (run.status === "awaiting_approval") {
      pushQueueItem({
        id: `queue_${thread.threadId}`,
        task: formatQueueItemLabel(thread.title),
        note: run.summary,
        state: "blocked",
        scope: thread.bookId ?? thread.scope,
        targetHref: `/chief?threadId=${thread.threadId}`,
      });
      continue;
    }

    if (thread.threadId.includes("materials")) {
      const resultTool = run.toolPresentations.find((item) => item.toolName === "material.table-result");
      const draftId = typeof (resultTool?.previewPayload as { draftId?: unknown } | undefined)?.draftId === "string"
        ? String((resultTool?.previewPayload as { draftId: string }).draftId)
        : null;
      const draft = draftId ? store.getDraft(draftId) : null;
      if (draft?.status === "draft") {
        pushQueueItem({
          id: `queue_${draft.draftId}`,
          task: formatQueueItemLabel(thread.title),
          note: "素材候选已生成，等待应用保存或重写。",
          state: "running",
          scope: draft.bookId,
          targetHref: `/books/${draft.bookId}/materials`,
        });
      }
    }
  }

  for (const book of store.listBooks()) {
    const truthIssues = countTruthIssues(store.listTruthFiles(book.id));
    const pendingDrafts = store.listDrafts(book.id).filter((item) => item.status === "draft").length;

    if (truthIssues > 0) {
      pushQueueItem({
        id: `queue_truth_${book.id}`,
        task: `${book.title} / truth 对齐`,
        note: book.riskLabel,
        state: "blocked",
        scope: book.id,
        targetHref: `/books/${book.id}/truth`,
      });
    }

    if (pendingDrafts > 0) {
      pushQueueItem({
        id: `queue_material_${book.id}`,
        task: `${book.title} / materials 处理`,
        note: book.nextAction,
        state: "running",
        scope: book.id,
        targetHref: `/books/${book.id}/materials`,
      });
    }
  }

  pushQueueItem({
    id: "queue_truth_inspection",
    task: "Truth 漂移巡检",
    note: "自动检查 current_state 与章节推进是否偏离。",
    state: "queued",
    scope: "global",
    targetHref: "/automation",
  });

  return queue.slice(0, 6);
}

function buildRecentLogs(store: DatabaseStore): AutomationLogEntry[] {
  const logs: AutomationLogEntry[] = [];
  const threads = store.listThreads();

  for (const thread of threads.slice(0, 3)) {
    const messages = store.listMessages(thread.threadId);
    const latestMessage = messages.at(-1);
    if (latestMessage) {
      logs.push({
        id: `log_msg_${latestMessage.messageId}`,
        timestamp: latestMessage.createdAt,
        sourceLabel: formatQueueItemLabel(thread.title),
        category: "message",
        level: "info",
        text: `${thread.title}: ${latestMessage.text}`,
        targetHref: getThreadTargetHref(thread),
      });
    }

    if (thread.lastRunId) {
      const run = store.getRun(thread.lastRunId);
      if (run) {
        logs.push({
          id: `log_run_${run.runId}`,
          timestamp: run.lastPersistedAt,
          sourceLabel: formatQueueItemLabel(thread.title),
          category: getRunLogCategory(thread.threadId, run.status),
          level: getRunLogLevel(run.status),
          text: run.summary,
          targetHref: getThreadTargetHref(thread),
        });
      }
    }
  }

  for (const book of store.listBooks()) {
    const truthIssues = countTruthIssues(store.listTruthFiles(book.id));
    if (truthIssues === 0) continue;
    logs.push({
      id: `log_truth_${book.id}`,
      timestamp: book.updatedAt,
      sourceLabel: book.title,
      category: "truth",
      level: "warning",
      text: `${truthIssues} 个 truth 风险待处理，当前风险：${book.riskLabel}`,
      targetHref: `/books/${book.id}/truth`,
    });
  }

  return logs
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, 6);
}

export function buildAutomationOverview(store: DatabaseStore): AutomationOverview {
  const queue = buildQueue(store);

  return {
    daemonStatus: queue.some((item) => item.state === "blocked") ? "degraded" : "healthy",
    workerCount: 3,
    nextInspectionAt: "2026-03-16T10:30:00+08:00",
    writeCron: "*/30 * * * *",
    queue,
    recentLogs: buildRecentLogs(store),
  };
}

function extractAuditTrace(checkpoints: unknown, notes: unknown, runStatus: string): ChapterAuditTrace[] {
  const traceItems: ChapterAuditTrace[] = [];
  const typedCheckpoints = Array.isArray(checkpoints)
    ? checkpoints.filter((item): item is { label: string; status: string } => Boolean(item) && typeof item === "object" && "label" in item && "status" in item)
    : [];
  const typedNotes = Array.isArray(notes) ? notes.filter((item): item is string => typeof item === "string") : [];

  typedCheckpoints.forEach((item, index) => {
    const nextStatus = runStatus === "completed" && item.status === "awaiting_approval" ? "completed" : item.status;
    traceItems.push({
      label: item.label,
      status: nextStatus,
      note: typedNotes[index] ?? "当前步骤没有额外备注。",
    });
  });

  return traceItems;
}

export function buildChapterAuditRecord(store: DatabaseStore, bookId: string, chapterNumber: number): ChapterAuditRecord | null {
  const threads = store.listThreads({ bookId });
  const writeThread = threads.find((thread) => thread.threadId.includes("write"));
  if (!writeThread?.lastRunId) return null;

  const run = store.getRun(writeThread.lastRunId);
  const chapter = store.getChapter(bookId, chapterNumber);
  if (!run || !chapter) return null;

  const traceTool = run.toolPresentations.find((item) => item.toolName === "chief.worker-trace");
  const approvalTool = run.toolPresentations.find((item) => item.toolName === "chief.approval-request");
  const resourceRef = approvalTool?.resourceRef;
  const resourceText = resourceRef ? store.getResource(resourceRef.refId)?.content ?? "" : "";
  const preview = (approvalTool?.previewPayload as Record<string, unknown> | undefined) ?? {};
  const blockedBy = String(preview.blockedBy ?? (resourceText || chapter.auditStatus));

  const findings: ChapterAuditFinding[] = [
    {
      title: "章节审计状态",
      severity: chapter.auditStatus === "failed" ? "danger" : chapter.auditStatus === "pending" ? "warning" : "info",
      detail: `第 ${chapter.chapterNumber} 章当前标记为 ${chapter.auditStatus}。`,
    },
    {
      title: "阻塞点",
      severity: run.status === "awaiting_approval" ? "warning" : "info",
      detail: blockedBy,
    },
  ];

  if (resourceText) {
    findings.push({
      title: "审计细节",
      severity: "warning",
      detail: resourceText,
    });
  }

  return {
    bookId,
    chapterNumber,
    sourceRunId: run.runId,
    status: chapter.auditStatus === "failed" ? "failed" : run.status === "awaiting_approval" ? "awaiting_approval" : "pending",
    summary: run.summary,
    blockedBy,
    nextAction: run.status === "awaiting_approval" ? "回到 /chief 决定是否按修订建议继续。" : "继续观察后续审计回写。",
    findings,
    trace: extractAuditTrace(
      (traceTool?.previewPayload as Record<string, unknown> | undefined)?.checkpoints,
      (traceTool?.previewPayload as Record<string, unknown> | undefined)?.liveNotes,
      run.status,
    ),
    ...(resourceRef ? { resourceRef: { refId: resourceRef.refId, uri: resourceRef.uri } } : {}),
    updatedAt: run.lastPersistedAt,
  };
}

export function buildSettingsOverview(store: DatabaseStore, config: ServerConfig): SettingsOverview {
  const skills = new Map<string, SettingsOverview["skills"][number]>();

  for (const thread of store.listThreads()) {
    if (!thread.lastRunId) continue;
    const run = store.getRun(thread.lastRunId);
    if (!run) continue;

    for (const skill of Object.values(run.skillsLocked)) {
      skills.set(skill.skillId, {
        skillId: skill.skillId,
        note: thread.title,
        state: skill.skillId.includes("material") ? "experimental" : "stable",
        source: skill.source,
      });
    }
  }

  return {
    llm: {
      provider: config.llm.provider,
      baseUrl: config.llm.baseUrl,
      model: config.llm.model,
      fallbackModel: "glm-4.7",
      hasApiKey: Boolean(config.llm.apiKey),
    },
    notifications: [
      { label: "桌面通知", value: "开启" },
      { label: "高风险提醒", value: "开启" },
      { label: "日报", value: "工作日 20:00" },
    ],
    skills: Array.from(skills.values()).sort((left, right) => left.skillId.localeCompare(right.skillId)),
    advanced: [
      { label: "审批模式", value: "risk-gated" },
      { label: "数据库", value: config.databasePath },
      { label: "WebSocket", value: "/ws" },
      { label: "服务模式", value: config.mode },
    ],
  };
}
