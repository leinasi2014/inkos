"use client";

import type { DraftArtifact } from "../../lib/contracts";

type MaterialField = {
  key: string;
  label: string;
  required?: boolean;
  multiline?: boolean;
  placeholder?: string;
};

function getFields(draft: DraftArtifact): MaterialField[] {
  const preview = draft.preview as Record<string, unknown>;
  return Array.isArray(preview.fields) ? (preview.fields as MaterialField[]) : [];
}

export function getMaterialDraftDefaults(draft: DraftArtifact | null): Record<string, string> {
  if (!draft) return {};
  const preview = draft.preview as Record<string, unknown>;
  const defaults = preview.formDefaults;
  if (!defaults || typeof defaults !== "object") return {};
  return Object.fromEntries(Object.entries(defaults as Record<string, unknown>).map(([key, value]) => [key, String(value ?? "")]));
}

export function MaterialDraftCard({
  draft,
  editMode,
  editValues,
  editErrors,
  saving,
  onChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
}: {
  draft: DraftArtifact;
  editMode: boolean;
  editValues: Record<string, string>;
  editErrors: Record<string, string>;
  saving: boolean;
  onChange: (value: Record<string, string>) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
}) {
  const preview = draft.preview as Record<string, unknown>;
  const cards = Array.isArray(preview.cards) ? (preview.cards as Array<{ key: string; label: string; value: string }>) : [];
  const conflicts = Array.isArray(preview.conflicts)
    ? (preview.conflicts as Array<{ materialId: string; materialName: string; note: string }>)
    : [];
  const fields = getFields(draft);

  if (editMode) {
    return (
      <div className="tool-grid">
        <strong>编辑草案</strong>
        {fields.map((field) => {
          const value = editValues[field.key] ?? "";
          const error = editErrors[field.key];
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
                  onChange={(event) => onChange({ ...editValues, [field.key]: event.target.value })}
                />
              ) : (
                <input
                  className={error ? "invalid" : ""}
                  value={value}
                  placeholder={field.placeholder}
                  onChange={(event) => onChange({ ...editValues, [field.key]: event.target.value })}
                />
              )}
              {error ? <small className="field-error">{error}</small> : null}
            </label>
          );
        })}
        <div className="button-row">
          <button type="button" className="button primary" disabled={saving} onClick={onSaveEdit}>
            保存编辑
          </button>
          <button type="button" className="button" disabled={saving} onClick={onCancelEdit}>
            取消编辑
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tool-grid">
      <strong>{String(preview.title ?? "未命名候选")}</strong>
      <p>{String(preview.summary ?? preview.fit ?? "")}</p>
      {cards.length > 0 ? (
        <div className="tool-grid two">
          {cards.map((item) => (
            <div key={item.key} className="panel">
              <strong>{item.label}</strong>
              <p>{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}
      <div className="panel">{String(preview.comparison ?? "")}</div>
      {conflicts.length > 0 ? (
        <div className="tool-grid">
          <strong>冲突确认</strong>
          {conflicts.map((item) => (
            <div key={item.materialId} className="panel">
              <strong>{item.materialName}</strong>
              <p>{item.note}</p>
            </div>
          ))}
        </div>
      ) : null}
      {draft.status === "draft" ? (
        <div className="button-row">
          <button type="button" className="button" onClick={onStartEdit}>
            编辑草案内容
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function validateMaterialDraftFields(draft: DraftArtifact | null, values: Record<string, string>) {
  if (!draft) return {};
  const errors: Record<string, string> = {};
  for (const field of getFields(draft)) {
    if (field.required && !String(values[field.key] ?? "").trim()) {
      errors[field.key] = `${field.label}不能为空`;
    }
  }
  return errors;
}
