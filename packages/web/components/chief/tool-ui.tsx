"use client";

import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { useEffect, useMemo, useState } from "react";
import { getDraft, getResource, getRun } from "../../lib/api";
import type { DraftArtifact, RunRecord, ToolAction, ToolPresentation } from "../../lib/contracts";
import { useConnectionStatus } from "../../lib/connection-status";
import { sendCommand } from "../../lib/ws-client";
import { getMaterialDraftDefaults, MaterialDraftCard, validateMaterialDraftFields } from "./material-draft-card";

interface ToolArgs {
  runId: string;
  threadId: string;
  toolEventId: string;
  toolName: string;
}

function createCommandId() {
  return `cmd_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function findTool(run: RunRecord | null, toolEventId: string) {
  return run?.toolPresentations.find((item) => item.toolEventId === toolEventId) ?? null;
}

function getToolTone(run: RunRecord | null, draft: DraftArtifact | null) {
  if (draft?.status === "draft") return "warning";
  if (draft?.status === "applied") return "success";
  if (draft?.status === "discarded" || draft?.status === "failed") return "danger";
  if (run?.status === "awaiting_approval") return "warning";
  if (run?.status === "completed") return "success";
  return "";
}

function isReadonlyAction(action: ToolAction, run: RunRecord | null, draft: DraftArtifact | null) {
  if (action.type === "navigate") return false;
  if (run?.status === "cancelled") return true;
  if (draft) return draft.status !== "draft";
  if (run?.status === "completed") return true;
  return false;
}

export function StandaloneToolCard({ args, liveVersion = 0 }: { args: ToolArgs; liveVersion?: number }) {
  const router = useRouter();
  const { canWrite } = useConnectionStatus();
  const [run, setRun] = useState<RunRecord | null>(null);
  const [draft, setDraft] = useState<DraftArtifact | null>(null);
  const [resourceText, setResourceText] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState("");
  const [materialEditMode, setMaterialEditMode] = useState(false);
  const [materialEditData, setMaterialEditData] = useState<Record<string, string>>({});
  const [materialEditErrors, setMaterialEditErrors] = useState<Record<string, string>>({});
  const tool = useMemo(() => findTool(run, args.toolEventId), [args.toolEventId, run]);

  useEffect(() => {
    async function load() {
      try {
        setActionError("");
        const currentRun = await getRun(args.runId);
        setRun(currentRun);
        const currentTool = findTool(currentRun, args.toolEventId);
        if (!currentTool) return;
        const payload = currentTool.previewPayload as Record<string, unknown>;
        if (typeof payload.draftId === "string") {
          const nextDraft = await getDraft(payload.draftId);
          setDraft(nextDraft);
          setMaterialEditData(getMaterialDraftDefaults(nextDraft));
          setMaterialEditErrors({});
          setMaterialEditMode(false);
        } else {
          setDraft(null);
          setMaterialEditData({});
          setMaterialEditErrors({});
          setMaterialEditMode(false);
        }
        if (currentTool.resourceRef?.refId) {
          const resource = await getResource(currentTool.resourceRef.refId);
          setResourceText(resource.content);
        } else {
          setResourceText("");
        }
        if (currentTool.toolName === "material.request-form" || currentTool.toolName === "book.create-form") {
          const defaults = (payload.defaults ?? {}) as Record<string, unknown>;
          setFormData(Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key, String(value ?? "")])));
          setFormErrors({});
        }
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "Tool UI 加载失败");
      }
    }

    void load();
  }, [args.runId, args.toolEventId, liveVersion]);

  if (!tool) {
    return <div className="tool-card">Tool UI 已失效或不存在。</div>;
  }

  async function handleAction(action: ToolAction) {
    try {
      setActionError("");
      setFormErrors({});
      if (action.type === "navigate" && action.navigateTo) {
        router.push(action.navigateTo);
        return;
      }

      if (action.confirmRequired && !window.confirm(`确认执行：${action.label}？`)) {
        return;
      }

      if (action.type === "submit") {
        if (!tool) {
          throw new Error("Tool UI 不存在，无法提交表单");
        }
        const nextErrors = validateForm(tool, formData);
        if (Object.keys(nextErrors).length > 0) {
          setFormErrors(nextErrors);
          return;
        }
        await sendCommand({
          commandId: createCommandId(),
          command: "submit_form",
          payload: {
            threadId: args.threadId,
            runId: args.runId,
            toolEventId: args.toolEventId,
            formData,
          },
        });
      } else if (action.type === "approve") {
        await sendCommand({
          commandId: createCommandId(),
          command: "approve_action",
          payload: {
            threadId: args.threadId,
            runId: args.runId,
            approvalId: action.actionId,
          },
        });
      } else if (action.type === "reject") {
        await sendCommand({
          commandId: createCommandId(),
          command: "reject_action",
          payload: {
            threadId: args.threadId,
            runId: args.runId,
            approvalId: action.actionId,
          },
        });
      } else if (action.type === "cancel") {
        await sendCommand({
          commandId: createCommandId(),
          command: "cancel_run",
          payload: {
            runId: args.runId,
          },
        });
      } else if (action.type === "apply" && draft) {
        await sendCommand({
          commandId: createCommandId(),
          command: "apply_draft",
          payload: {
            draftId: draft.draftId,
            revision: draft.revision,
            etag: draft.etag,
          },
        });
      } else if (action.type === "discard" && draft) {
        await sendCommand({
          commandId: createCommandId(),
          command: "discard_draft",
          payload: {
            draftId: draft.draftId,
            revision: draft.revision,
            etag: draft.etag,
          },
        });
      } else if (action.type === "regenerate" && draft) {
        await sendCommand({
          commandId: createCommandId(),
          command: "regenerate_draft",
          payload: {
            draftId: draft.draftId,
            revision: draft.revision,
            etag: draft.etag,
            instruction: "让候选更贴近当前卷冲突",
          },
        });
      } else if (action.type === "edit" && draft) {
        setMaterialEditMode(true);
        setMaterialEditData(getMaterialDraftDefaults(draft));
        return;
      }

      setRun(await getRun(args.runId));
      if (draft) {
        const nextDraft = await getDraft(draft.draftId);
        setDraft(nextDraft);
        setMaterialEditData(getMaterialDraftDefaults(nextDraft));
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "执行 Tool Action 失败");
    }
  }

  async function saveMaterialEdit() {
    if (!draft) return;
    const nextErrors = validateMaterialDraftFields(draft, materialEditData);
    if (Object.keys(nextErrors).length > 0) {
      setMaterialEditErrors(nextErrors);
      return;
    }

    try {
      setActionError("");
      await sendCommand({
        commandId: createCommandId(),
        command: "edit_draft",
        payload: {
          draftId: draft.draftId,
          revision: draft.revision,
          etag: draft.etag,
          changes: materialEditData,
        },
      });
      const nextDraft = await getDraft(draft.draftId);
      setDraft(nextDraft);
      setMaterialEditData(getMaterialDraftDefaults(nextDraft));
      setMaterialEditErrors({});
      setMaterialEditMode(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "保存编辑失败");
    }
  }

  return (
    <article className="tool-card">
      <header>
        <div className={`status-pill ${getToolTone(run, draft)}`}>
          {tool.toolName}
        </div>
      </header>
      <ToolCardBody
        tool={tool}
        draft={draft}
        resourceText={resourceText}
        formData={formData}
        formErrors={formErrors}
        onFormChange={setFormData}
        materialEditMode={materialEditMode}
        materialEditData={materialEditData}
        materialEditErrors={materialEditErrors}
        onMaterialEditChange={setMaterialEditData}
        onMaterialEditStart={() => {
          if (!draft) return;
          setMaterialEditMode(true);
          setMaterialEditData(getMaterialDraftDefaults(draft));
          setMaterialEditErrors({});
        }}
        onMaterialEditCancel={() => {
          if (!draft) return;
          setMaterialEditMode(false);
          setMaterialEditData(getMaterialDraftDefaults(draft));
          setMaterialEditErrors({});
        }}
        onMaterialEditSave={() => void saveMaterialEdit()}
      />
      {actionError ? <p className="subtle" role="alert">{actionError}</p> : null}
      <div className="tool-actions">
        {(tool.actions ?? []).map((action) => {
          // 使用 shadcn Button 组件替代原生 button
          const variant =
            action.type === "approve" || action.type === "apply" || action.type === "submit"
              ? "default"
              : action.type === "reject" || action.type === "discard"
                ? "destructive"
                : "outline";

          return (
            <Button
              key={action.actionId}
              type="button"
              variant={variant}
              size="sm"
              onClick={() => void handleAction(action)}
              disabled={(materialEditMode && action.type !== "navigate") || ((!canWrite && action.type !== "navigate") || isReadonlyAction(action, run, draft))}
            >
              {action.label}
            </Button>
          );
        })}
      </div>
    </article>
  );
}

function ToolCardBody({
  tool,
  draft,
  resourceText,
  formData,
  formErrors,
  onFormChange,
  materialEditMode,
  materialEditData,
  materialEditErrors,
  onMaterialEditChange,
  onMaterialEditStart,
  onMaterialEditCancel,
  onMaterialEditSave,
}: {
  tool: ToolPresentation;
  draft: DraftArtifact | null;
  resourceText: string;
  formData: Record<string, string>;
  formErrors: Record<string, string>;
  onFormChange: (value: Record<string, string>) => void;
  materialEditMode: boolean;
  materialEditData: Record<string, string>;
  materialEditErrors: Record<string, string>;
  onMaterialEditChange: (value: Record<string, string>) => void;
  onMaterialEditStart: () => void;
  onMaterialEditCancel: () => void;
  onMaterialEditSave: () => void;
}) {
  const payload = tool.previewPayload as Record<string, unknown>;

  if (tool.toolName === "chief.plan") {
    return (
      <div className="tool-grid">
        <strong>{String(payload.goal ?? "")}</strong>
        {"bookConfig" in payload ? (
          <div className="tool-grid two">
            <div className="panel">
              <strong>{String((payload.bookConfig as Record<string, unknown>).title ?? "")}</strong>
              <p>{String((payload.bookConfig as Record<string, unknown>).genre ?? "")}</p>
            </div>
            <div className="panel">
              <strong>{String((payload.bookConfig as Record<string, unknown>).targetChapter ?? "")} 章</strong>
              <p>{String((payload.bookConfig as Record<string, unknown>).premise ?? "")}</p>
            </div>
          </div>
        ) : null}
        {(payload.steps as string[] | undefined)?.map((step) => <div key={step}>{step}</div>)}
        <p>{String(payload.note ?? "")}</p>
      </div>
    );
  }

  if (tool.toolName === "chief.worker-trace") {
    const checkpoints = (payload.checkpoints as Array<{ label: string; status: string }> | undefined) ?? [];
    return (
      <div className="tool-grid">
        <strong>执行进度 {String(payload.progress ?? 0)}%</strong>
        <div className="tool-grid two">
          {checkpoints.map((item) => (
            <div key={item.label} className="panel">
              <strong>{item.label}</strong>
              <p>{item.status}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (tool.toolName === "chief.approval-request") {
    return (
      <div className="tool-grid">
        <strong>{String(payload.title ?? "")}</strong>
        <p>{String(payload.blockedBy ?? "")}</p>
        {resourceText ? <div className="panel">{resourceText}</div> : null}
      </div>
    );
  }

  if (tool.toolName === "material.request-form") {
    return renderStructuredForm(payload, formData, formErrors, onFormChange);
  }

  if (tool.toolName === "book.create-form") {
    return renderStructuredForm(payload, formData, formErrors, onFormChange);
  }

  if (tool.toolName === "book.create-result") {
    return (
      <div className="tool-grid">
        <strong>{String(payload.title ?? "新书已创建")}</strong>
        <div className="tool-grid two">
          <div className="panel">
            <strong>{String(payload.genre ?? "")}</strong>
            <p>{String(payload.targetChapter ?? "")} 章规划</p>
          </div>
          <div className="panel">
            <strong>{String(payload.nextAction ?? "")}</strong>
            <p>{String(payload.premise ?? "")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (tool.toolName === "chapter.audit-report") {
    const findings = (payload.findings as Array<{ title: string; detail: string }> | undefined) ?? [];
    return (
      <div className="tool-grid">
        <strong>{`第 ${String(payload.chapterNumber ?? "?")} 章审计诊断`}</strong>
        <p>{String(payload.blockedBy ?? "")}</p>
        <div className="panel">{String(payload.nextAction ?? "")}</div>
        {findings.length ? (
          <div className="tool-grid two">
            {findings.map((item) => (
              <div key={item.title} className="panel">
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="tool-grid">
      {draft ? <MaterialDraftCard draft={draft} editMode={materialEditMode} editValues={materialEditData} editErrors={materialEditErrors} saving={false} onChange={onMaterialEditChange} onStartEdit={onMaterialEditStart} onCancelEdit={onMaterialEditCancel} onSaveEdit={onMaterialEditSave} /> : <p>当前 Tool UI 暂无额外明细。</p>}
    </div>
  );
}

function renderStructuredForm(
  payload: Record<string, unknown>,
  formData: Record<string, string>,
  formErrors: Record<string, string>,
  onFormChange: (value: Record<string, string>) => void,
) {
  const fields =
    (payload.fields as Array<{ key: string; label: string; required?: boolean; placeholder?: string; multiline?: boolean }> | undefined) ?? [];

  return (
    <div className="tool-grid">
      {typeof payload.title === "string" ? <strong>{payload.title}</strong> : null}
      {fields.map((field) => {
        const value = formData[field.key] ?? "";
        const error = formErrors[field.key];
        return (
          <label key={field.key} className="form-field">
            <span>
              {field.label}
              {field.required ? " *" : ""}
            </span>
            {field.multiline ? (
              <textarea
                className={error ? "invalid" : ""}
                value={value}
                placeholder={field.placeholder}
                onChange={(event) => onFormChange({ ...formData, [field.key]: event.target.value })}
              />
            ) : (
              <input
                className={error ? "invalid" : ""}
                value={value}
                placeholder={field.placeholder}
                onChange={(event) => onFormChange({ ...formData, [field.key]: event.target.value })}
              />
            )}
            {error ? <small className="field-error">{error}</small> : null}
          </label>
        );
      })}
      {typeof payload.note === "string" ? <p>{payload.note}</p> : null}
    </div>
  );
}

function validateForm(tool: ToolPresentation, formData: Record<string, string>) {
  const payload = tool.previewPayload as Record<string, unknown>;
  const fields =
    (payload.fields as Array<{ key: string; label: string; required?: boolean }> | undefined) ?? [];
  const errors: Record<string, string> = {};

  for (const field of fields) {
    if (field.required && !String(formData[field.key] ?? "").trim()) {
      errors[field.key] = `${field.label}不能为空`;
    }
  }

  if (tool.toolName === "book.create-form") {
    const target = Number(formData.targetChapter ?? 0);
    if (!Number.isFinite(target) || target <= 0) {
      errors.targetChapter = "目标章节数必须是正整数";
    }
  }

  return errors;
}
