export interface SkillRef {
  skillId: string;
  skillVersion: string;
  skillHash: string;
  source: "project" | "user" | "builtin";
}

export interface ToolAction {
  actionId: string;
  type: "apply" | "regenerate" | "edit" | "discard" | "navigate" | "retry" | "approve" | "reject" | "submit" | "cancel";
  label: string;
  navigateTo?: string;
  confirmRequired?: boolean;
  riskLevel?: "low" | "medium" | "high";
}

export interface ToolPresentation {
  toolEventId: string;
  runId: string;
  toolName: string;
  toolSchemaVersion: string;
  previewPayload: unknown;
  resourceRef?: {
    refId: string;
    type: "text" | "diff" | "attachment";
    uri: string;
  };
  actions?: ToolAction[];
  skillId: string;
  skillVersion: string;
  upgradeHint?: "chief";
}

export interface RunRecord {
  runId: string;
  threadId: string;
  status: "planning" | "executing" | "awaiting_approval" | "completed" | "failed" | "cancelled";
  startedAt: string;
  endedAt?: string;
  currentStepId?: string;
  stepCount?: number;
  estimatedDuration?: number;
  eventCursor: number;
  pendingApprovalId?: string;
  activeCommandId?: string;
  lastPersistedAt: string;
  skillsLocked: Record<string, SkillRef>;
  error?: {
    code: string;
    message: string;
    stepId?: string;
    retryable: boolean;
  };
  summary: string;
  toolPresentations: ToolPresentation[];
}

export interface ThreadRecord {
  threadId: string;
  scope: "global" | "book" | "chapter" | "quick";
  title: string;
  bookId?: string;
  chapterNumber?: number;
  lastRunId?: string;
  lastMessageAt: string;
  archived: boolean;
  createdAt: string;
}

export interface MessageRecord {
  messageId: string;
  threadId: string;
  role: "user" | "assistant" | "system";
  text: string;
  createdAt: string;
}

export interface DraftArtifact {
  draftId: string;
  type: string;
  bookId: string;
  status: "draft" | "applied" | "discarded" | "failed";
  revision: number;
  parentDraftId?: string;
  sourceThreadId: string;
  sourceRunId: string;
  skillRef: SkillRef;
  toolSchemaVersion: string;
  preview: Record<string, unknown>;
  artifactSnapshotRefs: string[];
  etag: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookRecord {
  id: string;
  title: string;
  genre: string;
  phase: string;
  riskTone: string;
  riskLabel: string;
  progressLabel: string;
  wordsLabel: string;
  currentChapter: number;
  targetChapter: number;
  nextAction: string;
  summary: string;
  metrics: {
    materials: number;
    truthIssues: number;
    pendingDrafts: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ChapterRecord {
  bookId: string;
  chapterNumber: number;
  title: string;
  status: string;
  wordCount: number;
  auditStatus: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface TruthFileRecord {
  bookId: string;
  fileName: string;
  category: string;
  note: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialRecord {
  materialId: string;
  bookId: string;
  type: string;
  name: string;
  status: string;
  sourceRunId: string;
  sourceThreadId: string;
  provenance: string;
  note: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceRecord {
  refId: string;
  type: "text" | "diff" | "attachment";
  uri: string;
  content: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface HealthRecord {
  ok: boolean;
  name: string;
}

export interface CommandAck {
  type: "ack";
  commandId: string;
  success: true;
  runId?: string;
}

export interface EventEnvelope {
  type: "event";
  eventId: string;
  event: string;
  runId: string;
  threadId: string;
  cursor: number;
  payload: Record<string, unknown>;
}

export interface ChapterAuditRecord {
  bookId: string;
  chapterNumber: number;
  sourceRunId: string;
  status: "passed" | "pending" | "failed" | "awaiting_approval";
  summary: string;
  blockedBy: string;
  nextAction: string;
  findings: Array<{
    title: string;
    severity: "info" | "warning" | "danger";
    detail: string;
  }>;
  trace: Array<{
    label: string;
    status: string;
    note: string;
  }>;
  resourceRef?: {
    refId: string;
    uri: string;
  };
  updatedAt: string;
}

export interface AutomationOverview {
  daemonStatus: "healthy" | "degraded";
  workerCount: number;
  nextInspectionAt: string;
  writeCron: string;
  queue: Array<{
    id: string;
    task: string;
    note: string;
    state: "running" | "blocked" | "queued";
    scope: string;
    targetHref: string;
  }>;
  recentLogs: Array<{
    id: string;
    timestamp: string;
    sourceLabel: string;
    category: "message" | "run" | "approval" | "material" | "truth" | "system";
    level: "info" | "success" | "warning";
    text: string;
    targetHref?: string;
  }>;
}

export interface SettingsOverview {
  llm: {
    provider: string;
    baseUrl: string;
    model: string;
    fallbackModel: string;
    hasApiKey: boolean;
  };
  notifications: Array<{
    label: string;
    value: string;
  }>;
  skills: Array<{
    skillId: string;
    note: string;
    state: "stable" | "experimental";
    source: "project" | "user" | "builtin";
  }>;
  advanced: Array<{
    label: string;
    value: string;
  }>;
}
