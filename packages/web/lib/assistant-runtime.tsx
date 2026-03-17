"use client";

import { AssistantRuntimeProvider, useLocalRuntime } from "@assistant-ui/react";
import { useMemo } from "react";
import type { ThreadMessageLike } from "@assistant-ui/react";
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

/**
 * Assistant UI Runtime 封装
 * 负责处理消息发送、WebSocket 通信和运行时状态管理
 */
export function AssistantRuntimeShell({ threadId, initialMessages, children }: AssistantRuntimeShellProps) {
  // 使用 useLocalRuntime 创建本地运行时
  const runtime = useLocalRuntime(
    useMemo(
      () =>
        ({
          // 核心运行逻辑：发送消息到 WebSocket 并获取响应
          async run({ messages }: { messages: Array<{ role: string; content?: Array<{ text?: string }> }> }) {
            const lastMessage = messages[messages.length - 1];
            const text = lastMessage?.content?.map((item) => item.text ?? "").join(" ").trim() ?? "";

            // 通过 WebSocket 发送命令
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

            // 获取运行结果并转换为 assistant-ui 格式
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
