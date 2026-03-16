"use client";

import { StandaloneToolCard } from "./tool-ui";
import type { ToolMessageArg } from "../../lib/assistant-messages";

function isToolMessageArg(value: unknown): value is ToolMessageArg {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.runId === "string" &&
    typeof candidate.threadId === "string" &&
    typeof candidate.toolEventId === "string" &&
    typeof candidate.toolName === "string"
  );
}

export function AssistantToolPart({ args }: { args?: unknown }) {
  if (!isToolMessageArg(args)) {
    return <div className="tool-card">Tool UI 参数缺失，无法渲染。</div>;
  }

  return <StandaloneToolCard args={args} />;
}
