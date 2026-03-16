import type { MessageRecord, RunRecord, ToolPresentation } from "./contracts";

export interface ToolMessageArg {
  runId: string;
  threadId: string;
  toolEventId: string;
  toolName: string;
}

function buildToolMessageArg(run: RunRecord, tool: ToolPresentation): ToolMessageArg {
  return {
    runId: run.runId,
    threadId: run.threadId,
    toolEventId: tool.toolEventId,
    toolName: tool.toolName,
  };
}

function buildRunContent(run: RunRecord) {
  const content: Array<Record<string, unknown>> = [];

  if (run.summary.trim()) {
    content.push({ type: "text", text: run.summary });
  }

  for (const tool of run.toolPresentations) {
    const args = buildToolMessageArg(run, tool);
    content.push({
      type: "tool-call",
      toolCallId: tool.toolEventId,
      toolName: tool.toolName,
      args,
      argsText: JSON.stringify(args),
    });
  }

  if (content.length > 0) {
    return content;
  }

  return [{ type: "text", text: "当前运行没有可展示的输出。" }];
}

export function buildInitialMessages(messages: MessageRecord[], run: RunRecord | null) {
  const mapped = messages.map((message) => ({
    id: message.messageId,
    role: message.role === "system" ? "assistant" : message.role,
    content: [{ type: "text", text: message.text }],
  }));

  if (!run) {
    return mapped;
  }

  return [
    ...mapped,
    {
      id: run.runId,
      role: "assistant",
      content: buildRunContent(run),
    },
  ];
}

export function buildRuntimeResult(run: RunRecord) {
  return {
    content: buildRunContent(run),
  };
}
