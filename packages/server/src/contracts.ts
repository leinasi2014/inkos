import { z } from "zod";

export const ThreadScopeSchema = z.enum(["global", "book", "chapter", "quick"]);
export type ThreadScope = z.infer<typeof ThreadScopeSchema>;

export const RunStatusSchema = z.enum([
  "planning",
  "executing",
  "awaiting_approval",
  "completed",
  "failed",
  "cancelled",
]);
export type RunStatus = z.infer<typeof RunStatusSchema>;

export const SkillRefSchema = z.object({
  skillId: z.string().min(1),
  skillVersion: z.string().min(1),
  skillHash: z.string().min(1),
  source: z.enum(["project", "user", "builtin"]),
});
export type SkillRef = z.infer<typeof SkillRefSchema>;

export const ToolActionSchema = z.object({
  actionId: z.string().min(1),
  type: z.enum(["apply", "regenerate", "edit", "discard", "navigate", "retry", "approve", "reject", "submit", "cancel"]),
  label: z.string().min(1),
  navigateTo: z.string().optional(),
  confirmRequired: z.boolean().optional(),
  riskLevel: z.enum(["low", "medium", "high"]).optional(),
});
export type ToolAction = z.infer<typeof ToolActionSchema>;

export const ToolPresentationSchema = z.object({
  toolEventId: z.string().min(1),
  runId: z.string().min(1),
  toolName: z.string().min(1),
  toolSchemaVersion: z.string().min(1),
  previewPayload: z.unknown(),
  resourceRef: z
    .object({
      refId: z.string().min(1),
      type: z.enum(["text", "diff", "attachment"]),
      uri: z.string().min(1),
    })
    .optional(),
  actions: z.array(ToolActionSchema).optional(),
  skillId: z.string().min(1),
  skillVersion: z.string().min(1),
  upgradeHint: z.enum(["chief"]).optional(),
});
export type ToolPresentation = z.infer<typeof ToolPresentationSchema>;

export const RunErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  stepId: z.string().optional(),
  retryable: z.boolean(),
});
export type RunError = z.infer<typeof RunErrorSchema>;

export const RunRecordSchema = z.object({
  runId: z.string().min(1),
  threadId: z.string().min(1),
  // 写作 / 审计 run 需要显式绑定章节，读模型不能再靠“最近一次 run”猜测。
  bookId: z.string().min(1).optional(),
  chapterNumber: z.number().int().positive().optional(),
  status: RunStatusSchema,
  startedAt: z.string().min(1),
  endedAt: z.string().optional(),
  currentStepId: z.string().optional(),
  stepCount: z.number().int().positive().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  eventCursor: z.number().int().nonnegative(),
  pendingApprovalId: z.string().optional(),
  activeCommandId: z.string().optional(),
  lastPersistedAt: z.string().min(1),
  skillsLocked: z.record(SkillRefSchema),
  error: RunErrorSchema.optional(),
  summary: z.string(),
  toolPresentations: z.array(ToolPresentationSchema),
});
export type RunRecord = z.infer<typeof RunRecordSchema>;

export const ThreadRecordSchema = z.object({
  threadId: z.string().min(1),
  scope: ThreadScopeSchema,
  title: z.string().min(1),
  bookId: z.string().optional(),
  chapterNumber: z.number().int().positive().optional(),
  lastRunId: z.string().optional(),
  lastMessageAt: z.string().min(1),
  archived: z.boolean(),
  createdAt: z.string().min(1),
});
export type ThreadRecord = z.infer<typeof ThreadRecordSchema>;

export const MessageRecordSchema = z.object({
  messageId: z.string().min(1),
  threadId: z.string().min(1),
  role: z.enum(["user", "assistant", "system"]),
  text: z.string().min(1),
  createdAt: z.string().min(1),
});
export type MessageRecord = z.infer<typeof MessageRecordSchema>;

export const DraftArtifactSchema = z.object({
  draftId: z.string().min(1),
  type: z.string().min(1),
  bookId: z.string().min(1),
  status: z.enum(["draft", "applied", "discarded", "failed"]),
  revision: z.number().int().positive(),
  parentDraftId: z.string().optional(),
  sourceThreadId: z.string().min(1),
  sourceRunId: z.string().min(1),
  skillRef: SkillRefSchema,
  toolSchemaVersion: z.string().min(1),
  preview: z.unknown(),
  artifactSnapshotRefs: z.array(z.string()),
  etag: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});
export type DraftArtifact = z.infer<typeof DraftArtifactSchema>;

export const BookRecordSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  genre: z.string().min(1),
  phase: z.string().min(1),
  riskTone: z.string().min(1),
  riskLabel: z.string().min(1),
  progressLabel: z.string().min(1),
  wordsLabel: z.string().min(1),
  currentChapter: z.number().int().positive(),
  targetChapter: z.number().int().positive(),
  nextAction: z.string().min(1),
  summary: z.string().min(1),
  metrics: z.object({
    materials: z.number().int().nonnegative(),
    truthIssues: z.number().int().nonnegative(),
    pendingDrafts: z.number().int().nonnegative(),
  }),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});
export type BookRecord = z.infer<typeof BookRecordSchema>;

export const ChapterRecordSchema = z.object({
  bookId: z.string().min(1),
  chapterNumber: z.number().int().positive(),
  title: z.string().min(1),
  status: z.string().min(1),
  // 初始化占位章节允许 0 字，契约不能比真实数据更窄。
  wordCount: z.number().int().nonnegative(),
  auditStatus: z.string().min(1),
  content: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});
export type ChapterRecord = z.infer<typeof ChapterRecordSchema>;

export const TruthFileRecordSchema = z.object({
  bookId: z.string().min(1),
  fileName: z.string().min(1),
  category: z.string().min(1),
  note: z.string().min(1),
  content: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});
export type TruthFileRecord = z.infer<typeof TruthFileRecordSchema>;

export const MaterialRecordSchema = z.object({
  materialId: z.string().min(1),
  bookId: z.string().min(1),
  type: z.string().min(1),
  name: z.string().min(1),
  status: z.string().min(1),
  sourceRunId: z.string().min(1),
  sourceThreadId: z.string().min(1),
  provenance: z.string().min(1),
  note: z.string().min(1),
  payload: z.unknown(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});
export type MaterialRecord = z.infer<typeof MaterialRecordSchema>;

export const ResourceRecordSchema = z.object({
  refId: z.string().min(1),
  type: z.enum(["text", "diff", "attachment"]),
  uri: z.string().min(1),
  content: z.string().min(1),
  createdAt: z.string().min(1),
});
export type ResourceRecord = z.infer<typeof ResourceRecordSchema>;

export const EventRecordSchema = z.object({
  eventId: z.string().min(1),
  event: z.string().min(1),
  runId: z.string().min(1),
  threadId: z.string().min(1),
  payload: z.unknown(),
  cursor: z.number().int().nonnegative(),
  createdAt: z.string().min(1),
});
export type EventRecord = z.infer<typeof EventRecordSchema>;

export const ChapterAuditFindingSchema = z.object({
  title: z.string().min(1),
  severity: z.enum(["info", "warning", "danger"]),
  detail: z.string().min(1),
});
export type ChapterAuditFinding = z.infer<typeof ChapterAuditFindingSchema>;

export const ChapterAuditTraceSchema = z.object({
  label: z.string().min(1),
  status: z.string().min(1),
  note: z.string().min(1),
});
export type ChapterAuditTrace = z.infer<typeof ChapterAuditTraceSchema>;

export const ChapterAuditRecordSchema = z.object({
  bookId: z.string().min(1),
  chapterNumber: z.number().int().positive(),
  sourceRunId: z.string().min(1),
  status: z.enum(["passed", "pending", "failed", "awaiting_approval"]),
  summary: z.string().min(1),
  blockedBy: z.string().min(1),
  nextAction: z.string().min(1),
  findings: z.array(ChapterAuditFindingSchema),
  trace: z.array(ChapterAuditTraceSchema),
  resourceRef: z
    .object({
      refId: z.string().min(1),
      uri: z.string().min(1),
    })
    .optional(),
  updatedAt: z.string().min(1),
});
export type ChapterAuditRecord = z.infer<typeof ChapterAuditRecordSchema>;

export const AutomationQueueItemSchema = z.object({
  id: z.string().min(1),
  task: z.string().min(1),
  note: z.string().min(1),
  state: z.enum(["running", "blocked", "queued"]),
  scope: z.string().min(1),
  targetHref: z.string().min(1),
});
export type AutomationQueueItem = z.infer<typeof AutomationQueueItemSchema>;

export const AutomationLogEntrySchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().min(1),
  sourceLabel: z.string().min(1),
  category: z.enum(["message", "run", "approval", "material", "truth", "system"]),
  level: z.enum(["info", "success", "warning"]),
  text: z.string().min(1),
  targetHref: z.string().min(1).optional(),
});
export type AutomationLogEntry = z.infer<typeof AutomationLogEntrySchema>;

export const AutomationOverviewSchema = z.object({
  daemonStatus: z.enum(["healthy", "degraded"]),
  workerCount: z.number().int().nonnegative(),
  nextInspectionAt: z.string().min(1),
  writeCron: z.string().min(1),
  queue: z.array(AutomationQueueItemSchema),
  recentLogs: z.array(AutomationLogEntrySchema),
});
export type AutomationOverview = z.infer<typeof AutomationOverviewSchema>;

export const NotificationSettingSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});
export type NotificationSetting = z.infer<typeof NotificationSettingSchema>;

export const SkillStatusSchema = z.object({
  skillId: z.string().min(1),
  note: z.string().min(1),
  state: z.enum(["stable", "experimental"]),
  source: z.enum(["project", "user", "builtin"]),
});
export type SkillStatus = z.infer<typeof SkillStatusSchema>;

export const SettingsOverviewSchema = z.object({
  llm: z.object({
    provider: z.string().min(1),
    model: z.string().min(1),
    fallbackModel: z.string().min(1),
    hasApiKey: z.boolean(),
  }),
  notifications: z.array(NotificationSettingSchema),
  skills: z.array(SkillStatusSchema),
  advanced: z.array(
    z.object({
      label: z.string().min(1),
      value: z.string().min(1),
    }),
  ),
});
export type SettingsOverview = z.infer<typeof SettingsOverviewSchema>;

export const ProtectedSettingsOverviewSchema = z.object({
  llm: z.object({
    provider: z.string().min(1),
    baseUrl: z.string().min(1),
    model: z.string().min(1),
    fallbackModel: z.string().min(1),
    hasApiKey: z.boolean(),
  }),
  runtime: z.array(
    z.object({
      label: z.string().min(1),
      value: z.string().min(1),
    }),
  ),
});
export type ProtectedSettingsOverview = z.infer<typeof ProtectedSettingsOverviewSchema>;

const BaseCommandEnvelopeSchema = z.object({
  type: z.literal("command"),
  commandId: z.string().min(1),
});

export const CommandEnvelopeSchema = z.union([
  BaseCommandEnvelopeSchema.extend({
    command: z.literal("send_message"),
    payload: z.object({
      threadId: z.string().min(1),
      content: z.string().min(1),
    }),
  }),
  BaseCommandEnvelopeSchema.extend({
    command: z.literal("submit_form"),
    payload: z.object({
      threadId: z.string().min(1),
      runId: z.string().min(1),
      toolEventId: z.string().min(1),
      formData: z.record(z.unknown()),
    }),
  }),
  BaseCommandEnvelopeSchema.extend({
    command: z.enum(["approve_action", "reject_action", "cancel_action"]),
    payload: z.object({
      threadId: z.string().min(1),
      runId: z.string().min(1),
      approvalId: z.string().min(1),
    }),
  }),
  BaseCommandEnvelopeSchema.extend({
    command: z.literal("apply_draft"),
    payload: z.object({
      draftId: z.string().min(1),
      revision: z.number().int().positive(),
      etag: z.string().min(1),
    }),
  }),
  BaseCommandEnvelopeSchema.extend({
    command: z.literal("discard_draft"),
    payload: z.object({
      draftId: z.string().min(1),
      revision: z.number().int().positive(),
      etag: z.string().min(1),
    }),
  }),
  BaseCommandEnvelopeSchema.extend({
    command: z.literal("regenerate_draft"),
    payload: z.object({
      draftId: z.string().min(1),
      revision: z.number().int().positive(),
      etag: z.string().min(1),
      instruction: z.string().optional(),
    }),
  }),
  BaseCommandEnvelopeSchema.extend({
    command: z.literal("edit_draft"),
    payload: z.object({
      draftId: z.string().min(1),
      revision: z.number().int().positive(),
      etag: z.string().min(1),
      changes: z.record(z.unknown()),
    }),
  }),
  BaseCommandEnvelopeSchema.extend({
    command: z.literal("cancel_run"),
    payload: z.object({
      runId: z.string().min(1),
    }),
  }),
  BaseCommandEnvelopeSchema.extend({
    command: z.literal("resume"),
    payload: z.object({
      lastCursor: z.number().int().nonnegative(),
      threadIds: z.array(z.string().min(1)).optional(),
      // replay 必须分页，避免首次恢复时把整个历史一次性打爆 websocket。
      limit: z.number().int().positive().max(200).optional(),
    }),
  }),
]);

export type CommandEnvelope = z.infer<typeof CommandEnvelopeSchema>;

export interface AckEnvelope {
  readonly type: "ack";
  readonly commandId: string;
  readonly success: true;
  readonly runId?: string;
  readonly nextCursor?: number;
}

export interface EventEnvelope {
  readonly type: "event";
  readonly eventId: string;
  readonly event: string;
  readonly runId: string;
  readonly threadId: string;
  readonly cursor: number;
  readonly payload: unknown;
}
