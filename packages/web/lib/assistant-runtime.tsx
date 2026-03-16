"use client";

import { AssistantRuntimeProvider, type ThreadMessageLike, useLocalRuntime } from "@assistant-ui/react";
import { useMemo } from "react";
import { getRun } from "./api";
import { buildRuntimeResult } from "./assistant-messages";
import { sendCommand } from "./ws-client";

interface AssistantRuntimeShellProps {
  threadId: string;
  initialMessages: ThreadMessageLike[];
  children: React.ReactNode;
}

function randomCommandId() {
  return `cmd_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export function AssistantRuntimeShell({ threadId, initialMessages, children }: AssistantRuntimeShellProps) {
  const runtime = useLocalRuntime(
    useMemo(
      () =>
        ({
          async run({ messages }: { messages: Array<{ role: string; content?: Array<{ text?: string }> }> }) {
            const lastMessage = messages[messages.length - 1];
            const text = lastMessage?.content?.map((item) => item.text ?? "").join(" ").trim() ?? "";
            const ack = await sendCommand({
              commandId: randomCommandId(),
              command: "send_message",
              payload: {
                threadId,
                content: text,
              },
            });
            if (!ack.runId) {
              return { content: [{ type: "text", text: "命令已发送，但没有返回 runId。" }] };
            }
            const run = await getRun(ack.runId);
            return buildRuntimeResult(run);
          },
        }) as any,
      [threadId],
    ),
    {
      initialMessages: initialMessages as any,
    } as any,
  );

  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
}
