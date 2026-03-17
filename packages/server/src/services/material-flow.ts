import { InkOSError } from "../errors.js";
import type { AckEnvelope, DraftArtifact, MaterialRecord, RunRecord, ThreadRecord, ToolPresentation } from "../contracts.js";
import { createId, nowIso, weakEtag } from "../id.js";
import type { RuntimeFlowDeps } from "./runtime-flows.js";
import {
  createMaterialFormTool,
  createMaterialResultTool,
  createRunRecord,
  createSkillRef,
  ensureDraftVersion,
} from "./runtime-internals.js";

type MaterialType = "character" | "faction" | "location";

type MaterialField = {
  readonly key: string;
  readonly label: string;
  readonly required?: boolean;
  readonly placeholder?: string;
  readonly multiline?: boolean;
};

type MaterialConflict = {
  readonly materialId: string;
  readonly materialName: string;
  readonly note: string;
};

type MaterialPreview = {
  readonly type: MaterialType;
  readonly typeLabel: string;
  readonly title: string;
  readonly summary: string;
  readonly fit: string;
  readonly comparison: string;
  readonly anchor: string;
  readonly cards: ReadonlyArray<{ key: string; label: string; value: string }>;
  readonly fields: ReadonlyArray<MaterialField>;
  readonly formDefaults: Record<string, string>;
  readonly conflicts: ReadonlyArray<MaterialConflict>;
  readonly bridgeNote: string;
};

const MATERIAL_META: Record<MaterialType, { label: string; fields: ReadonlyArray<MaterialField> }> = {
  character: {
    label: "角色",
    fields: [
      { key: "name", label: "角色名", required: true, placeholder: "例如：裴烬" },
      { key: "archetype", label: "角色定位", required: true, placeholder: "例如：高压对位反派" },
      { key: "conflictDrive", label: "冲突驱动力", required: true, multiline: true, placeholder: "他为什么会持续给主线制造压力？" },
      { key: "secret", label: "隐藏筹码", required: false, multiline: true, placeholder: "角色真正掌握的秘密或底牌" },
      { key: "anchor", label: "书内锚点", required: false, placeholder: "例如：师徒线 / 第二卷法统争夺" },
    ],
  },
  faction: {
    label: "阵营",
    fields: [
      { key: "name", label: "阵营名", required: true, placeholder: "例如：玄都监律司" },
      { key: "publicFace", label: "表面立场", required: true, multiline: true, placeholder: "对外宣称的目标或形象" },
      { key: "hiddenAgenda", label: "隐藏议程", required: true, multiline: true, placeholder: "真正想争夺什么资源或权力" },
      { key: "leverage", label: "可动用资源", required: false, multiline: true, placeholder: "人脉、军力、法器或制度优势" },
      { key: "anchor", label: "书内锚点", required: false, placeholder: "例如：宗门线 / 皇城线" },
    ],
  },
  location: {
    label: "地点",
    fields: [
      { key: "name", label: "地点名", required: true, placeholder: "例如：陨星渡" },
      { key: "function", label: "剧情功能", required: true, multiline: true, placeholder: "这个地点负责承载什么冲突或转折" },
      { key: "atmosphere", label: "氛围特征", required: true, multiline: true, placeholder: "读者第一感受应该是什么" },
      { key: "hazard", label: "规则 / 风险", required: false, multiline: true, placeholder: "地点的特殊禁忌、代价或危险" },
      { key: "anchor", label: "书内锚点", required: false, placeholder: "例如：第二卷开场 / 主角逃亡线" },
    ],
  },
};

export function startMaterialRun(deps: RuntimeFlowDeps, commandId: string, thread: ThreadRecord, content: string): AckEnvelope {
  const run = createRunRecord(thread.threadId, {
    status: "planning",
    currentStepId: "collect_material_params",
    stepCount: 2,
    estimatedDuration: 25,
    summary: "先补参数，再生成结构化素材候选。",
    skillsLocked: { material: createSkillRef("material.generator") },
  });
  const type = inferMaterialType(content);
  const tool = createMaterialFormTool(run.runId, {
    bookId: thread.bookId,
    type,
    title: `补充${MATERIAL_META[type].label}参数`,
    note: "生成后会得到单卡结果；如存在同名冲突，会在保存前明确提示。",
    fields: MATERIAL_META[type].fields,
  });

  deps.store.saveRun({ ...run, toolPresentations: [tool] });
  deps.emitEvent(run.runId, thread.threadId, "run_started", { runId: run.runId, threadId: thread.threadId, stepCount: 2, estimatedDuration: 25 });
  deps.emitEvent(run.runId, thread.threadId, "tool_presented", tool);
  return { type: "ack", commandId, success: true, runId: run.runId };
}

export function submitMaterialForm(
  deps: RuntimeFlowDeps,
  commandId: string,
  run: RunRecord,
  thread: ThreadRecord,
  currentTool: ToolPresentation,
  formData: Record<string, unknown>,
): AckEnvelope {
  const payload = currentTool.previewPayload as Record<string, unknown>;
  const type = normalizeMaterialType(payload.type);
  // 素材草案会落 draft/material/truth，缺 bookId 时必须直接拒绝，不能再偷偷写进默认书。
  const bookId = requireThreadBookId(thread, "素材生成");
  const now = nowIso();
  const preview = buildMaterialPreview(deps, bookId, type, toStringMap(formData));
  const draft: DraftArtifact = {
    draftId: createId("draft"),
    type,
    bookId,
    status: "draft",
    revision: 1,
    sourceThreadId: thread.threadId,
    sourceRunId: run.runId,
    skillRef: createSkillRef("material.generator"),
    toolSchemaVersion: "1.0.0",
    preview,
    artifactSnapshotRefs: preview.conflicts.map((item) => item.materialId),
    etag: weakEtag(1),
    createdAt: now,
    updatedAt: now,
  };
  deps.store.saveDraft(draft);
  deps.syncBookDerivedState(bookId);

  const tool = createMaterialResultTool(run.runId, {
    draftId: draft.draftId,
    bookId,
    hasConflicts: preview.conflicts.length > 0,
  });
  const summary = preview.conflicts.length > 0
    ? `${preview.title} 候选已生成，但发现同名素材；保存时会要求确认覆盖。`
    : `${preview.title} 候选已经生成，可以直接应用保存或继续重写。`;
  const nextRun: RunRecord = {
    ...run,
    status: "completed",
    currentStepId: "completed",
    endedAt: now,
    lastPersistedAt: now,
    summary,
    toolPresentations: [tool],
  };
  deps.store.saveRun(nextRun);

  deps.emitEvent(run.runId, thread.threadId, "run_state_changed", { runId: run.runId, status: "executing", currentStepId: "generate_material" });
  deps.emitEvent(run.runId, thread.threadId, "tool_presented", tool);
  deps.emitEvent(run.runId, thread.threadId, "draft_state_changed", {
    draftId: draft.draftId,
    revision: draft.revision,
    status: draft.status,
    sourceRunId: run.runId,
  });
  deps.emitEvent(run.runId, thread.threadId, "run_completed", { runId: run.runId, summary });
  deps.store.saveMessage({
    messageId: createId("msg"),
    threadId: thread.threadId,
    role: "assistant",
    text: summary,
    createdAt: now,
  });
  return { type: "ack", commandId, success: true, runId: run.runId };
}

export function applyMaterialDraft(
  deps: RuntimeFlowDeps,
  commandId: string,
  draftId: string,
  revision?: number,
  etag?: string,
): AckEnvelope {
  const draft = deps.getDraft(draftId);
  ensureDraftVersion(draft, revision, etag);
  const preview = draft.preview as MaterialPreview;
  const now = nowIso();
  const conflictTargetId = preview.conflicts[0]?.materialId;
  const existing = conflictTargetId ? deps.store.getMaterial(draft.bookId, conflictTargetId) : null;

  const material: MaterialRecord = existing
    ? {
        ...existing,
        name: preview.title,
        status: "applied",
        sourceRunId: draft.sourceRunId,
        sourceThreadId: draft.sourceThreadId,
        provenance: "chief / draft_apply overwrite",
        note: `由 ${preview.typeLabel} 草案覆盖更新。`,
        payload: preview,
        updatedAt: now,
      }
    : {
        materialId: createId("mat"),
        bookId: draft.bookId,
        type: draft.type,
        name: preview.title,
        status: "applied",
        sourceRunId: draft.sourceRunId,
        sourceThreadId: draft.sourceThreadId,
        provenance: "chief / draft_apply",
        note: `由 ${preview.typeLabel} 草案应用生成。`,
        payload: preview,
        createdAt: now,
        updatedAt: now,
      };
  deps.store.saveMaterial(material);

  const nextDraft: DraftArtifact = {
    ...draft,
    status: "applied",
    revision: draft.revision + 1,
    etag: weakEtag(draft.revision + 1),
    updatedAt: now,
  };
  deps.store.saveDraft(nextDraft);
  syncMaterialsBridge(deps, draft.bookId, now);
  deps.syncBookDerivedState(draft.bookId);
  deps.emitEvent(nextDraft.sourceRunId, nextDraft.sourceThreadId, "draft_state_changed", {
    draftId: nextDraft.draftId,
    revision: nextDraft.revision,
    status: nextDraft.status,
    sourceRunId: nextDraft.sourceRunId,
  });
  return { type: "ack", commandId, success: true, runId: nextDraft.sourceRunId };
}

export function editMaterialDraft(
  deps: RuntimeFlowDeps,
  commandId: string,
  draftId: string,
  revision: number,
  etag: string,
  changes: Record<string, unknown>,
): AckEnvelope {
  const draft = deps.getDraft(draftId);
  ensureDraftVersion(draft, revision, etag);
  const preview = draft.preview as MaterialPreview;
  const nextPreview = buildMaterialPreview(deps, draft.bookId, normalizeMaterialType(draft.type), {
    ...preview.formDefaults,
    ...toStringMap(changes),
  });
  const nextDraft: DraftArtifact = {
    ...draft,
    revision: draft.revision + 1,
    etag: weakEtag(draft.revision + 1),
    preview: nextPreview,
    artifactSnapshotRefs: nextPreview.conflicts.map((item) => item.materialId),
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

export function regenerateMaterialDraft(
  deps: RuntimeFlowDeps,
  commandId: string,
  draftId: string,
  revision: number,
  etag: string,
  instruction?: string,
): AckEnvelope {
  const draft = deps.getDraft(draftId);
  ensureDraftVersion(draft, revision, etag);
  const preview = draft.preview as MaterialPreview;
  const regenerated = buildMaterialPreview(deps, draft.bookId, normalizeMaterialType(draft.type), preview.formDefaults, instruction);
  const nextDraft: DraftArtifact = {
    ...draft,
    revision: draft.revision + 1,
    etag: weakEtag(draft.revision + 1),
    preview: regenerated,
    artifactSnapshotRefs: regenerated.conflicts.map((item) => item.materialId),
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

function buildMaterialPreview(
  deps: RuntimeFlowDeps,
  bookId: string,
  type: MaterialType,
  formData: Record<string, string>,
  instruction?: string,
): MaterialPreview {
  const meta = MATERIAL_META[type];
  const defaults = normalizeMaterialDefaults(type, formData);
  const name = defaults.name || `未命名${meta.label}`;
  const conflicts = deps.store
    .listMaterials(bookId)
    .filter((item) => item.type === type && item.name.trim().toLowerCase() === name.trim().toLowerCase())
    .map((item) => ({
      materialId: item.materialId,
      materialName: item.name,
      note: `materials 中已存在同名${meta.label}，应用保存会覆盖该条记录。`,
    }));

  const cards = meta.fields
    .filter((field) => field.key !== "name")
    .map((field) => ({
      key: field.key,
      label: field.label,
      value: defaults[field.key] || "未填写",
    }));

  return {
    type,
    typeLabel: meta.label,
    title: name,
    summary: buildMaterialSummary(type, defaults),
    fit: buildMaterialFit(type, defaults, instruction),
    comparison:
      conflicts.length > 0
        ? `检测到 ${conflicts.length} 条同名${meta.label}。继续保存时会要求确认覆盖，避免 materials 与 truth bridge 漂移。`
        : `${meta.label}候选保持单卡结构，可以直接在 chat / chief 闭环处理。`,
    anchor: defaults.anchor,
    cards,
    fields: meta.fields,
    formDefaults: defaults,
    conflicts,
    bridgeNote: `应用后会回写 materials_summary.md，供后续写作与审计 bridge 使用。`,
  };
}

function normalizeMaterialDefaults(type: MaterialType, formData: Record<string, string>): Record<string, string> {
  const fields = MATERIAL_META[type].fields;
  return Object.fromEntries(fields.map((field) => [field.key, String(formData[field.key] ?? "").trim()]));
}

function buildMaterialSummary(type: MaterialType, values: Record<string, string>): string {
  switch (type) {
    case "character":
      return `${values.name} 被定位为 ${values.archetype}，核心压力来自“${values.conflictDrive}”。`;
    case "faction":
      return `${values.name} 对外呈现为“${values.publicFace}”，但真正推动剧情的是“${values.hiddenAgenda}”。`;
    case "location":
      return `${values.name} 的剧情功能是“${values.function}”，整体氛围偏“${values.atmosphere}”。`;
  }
}

function buildMaterialFit(type: MaterialType, values: Record<string, string>, instruction?: string): string {
  const suffix = instruction ? ` 已按补充要求“${instruction}”重写。` : "";
  switch (type) {
    case "character":
      return `这张角色卡优先服务 ${values.anchor || "当前主线"}，适合持续拉高人物关系压力。${suffix}`.trim();
    case "faction":
      return `该阵营会直接卷入 ${values.anchor || "当前故事主冲突"}，适合提供制度和资源层面的对抗。${suffix}`.trim();
    case "location":
      return `该地点适合挂接 ${values.anchor || "当前章节推进"}，能同时承载氛围和规则风险。${suffix}`.trim();
  }
}

function buildMaterialsSummary(materials: ReadonlyArray<MaterialRecord>): string {
  const grouped = {
    character: materials.filter((item) => item.type === "character"),
    faction: materials.filter((item) => item.type === "faction"),
    location: materials.filter((item) => item.type === "location"),
  };
  const lines = [
    "# Materials Summary",
    "",
    `- 已应用素材总数：${materials.length}`,
    "",
    "## Characters",
    ...formatMaterialGroup(grouped.character),
    "",
    "## Factions",
    ...formatMaterialGroup(grouped.faction),
    "",
    "## Locations",
    ...formatMaterialGroup(grouped.location),
  ];
  return lines.join("\n");
}

function formatMaterialGroup(items: ReadonlyArray<MaterialRecord>): string[] {
  if (items.length === 0) return ["- 暂无已应用素材"];
  return items.slice(0, 6).map((item) => {
    const preview = item.payload as Partial<MaterialPreview>;
    const anchor = typeof preview.anchor === "string" && preview.anchor ? ` / 锚点：${preview.anchor}` : "";
    return `- ${item.name}${anchor}`;
  });
}

function syncMaterialsBridge(deps: RuntimeFlowDeps, bookId: string, updatedAt: string): void {
  const existing = deps.store.getTruthFile(bookId, "materials_summary.md");
  const content = buildMaterialsSummary(deps.store.listMaterials(bookId));
  deps.store.saveTruthFile({
    bookId,
    fileName: "materials_summary.md",
    category: "bridge",
    note: `materials bridge 摘要，当前共 ${deps.store.listMaterials(bookId).length} 条已应用素材。`,
    content,
    createdAt: existing?.createdAt ?? updatedAt,
    updatedAt,
  });
}

function inferMaterialType(content: string): MaterialType {
  if (/阵营/.test(content)) return "faction";
  if (/地点|场景|地名/.test(content)) return "location";
  return "character";
}

function normalizeMaterialType(value: unknown): MaterialType {
  return value === "faction" || value === "location" ? value : "character";
}

function toStringMap(input: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, String(value ?? "")]));
}

function requireThreadBookId(thread: ThreadRecord, actionLabel: string): string {
  if (!thread.bookId) {
    throw new InkOSError("COMMAND.BOOK_CONTEXT_REQUIRED", `${actionLabel} 需要绑定 bookId 的线程上下文。`, { statusCode: 400 });
  }
  return thread.bookId;
}
