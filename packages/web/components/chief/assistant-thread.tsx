"use client";

import {
  Thread,
  Composer,
  AssistantActionBar,
  UserActionBar,
} from "@assistant-ui/react-ui";
import { MessagePrimitive } from "@assistant-ui/react";
import { useAuiState } from "@assistant-ui/react";
import { useEffect, useRef, useState } from "react";
import { buildInitialMessages } from "../../lib/assistant-messages";
import { AssistantRuntimeShell } from "../../lib/assistant-runtime";
import { getRun, getThreadMessages } from "../../lib/api";
import type { MessageRecord, RunRecord } from "../../lib/contracts";
import { useLiveEvents } from "../../lib/use-live-events";
import { AssistantToolPart } from "./assistant-tool-part";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

// 自定义消息组件 - 使用 MessagePrimitive，支持 Markdown 渲染
function CustomMessage() {
  const role = useAuiState((state) => state.message.role);

  return (
    <MessagePrimitive.Root className={`message-bubble ${role === "user" ? "user" : "assistant"}`}>
      <MessagePrimitive.Parts components={{ tools: { Override: AssistantToolPart as any } }} />
    </MessagePrimitive.Root>
  );
}

// 自定义欢迎页 - 使用 AuiIf 条件渲染
function CustomWelcome() {
  return (
    <div className="empty-state">
      <strong>开始新对话</strong>
      <p>发送消息启动主线程，assistant-ui runtime 将处理响应。</p>
    </div>
  );
}

export function AssistantThread({ threadId, runId }: { threadId: string; runId?: string }) {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [run, setRun] = useState<RunRecord | null>(null);
  const [loadError, setLoadError] = useState<string>("");
  const [liveVersion, setLiveVersion] = useState(0);
  const [lastEventLabel, setLastEventLabel] = useState("等待实时事件");
  const scheduleRef = useRef<number | null>(null);

  // 加载初始消息
  useEffect(() => {
    async function load() {
      try {
        setLoadError("");
        setMessages(await getThreadMessages(threadId));
        setRun(runId ? await getRun(runId) : null);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "加载运行时失败");
      }
    }

    void load();
  }, [liveVersion, runId, threadId]);

  // 实时事件监听
  useLiveEvents({
    enabled: Boolean(threadId),
    initialCursor: run?.eventCursor ?? 0,
    threadIds: threadId ? [threadId] : [],
    isRelevant: (event) => event.threadId === threadId || (runId ? event.runId === runId : false),
    onEvent: (event) => {
      setLastEventLabel(`${event.event} · #${event.cursor}`);
      if (scheduleRef.current) return;
      scheduleRef.current = window.setTimeout(() => {
        scheduleRef.current = null;
        setLiveVersion((value) => value + 1);
      }, 120);
    },
    onError: (error) => {
      setLoadError(error.message);
    },
  });

  useEffect(() => () => {
    if (scheduleRef.current) window.clearTimeout(scheduleRef.current);
  }, []);

  return (
    <AssistantRuntimeShell
      key={`${threadId}-${liveVersion}`}
      threadId={threadId}
      initialMessages={buildInitialMessages(messages, run) as any}
    >
      <section className="grid gap-4">
        {/* 状态指示器 - 使用 shadcn Badge */}
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <Badge variant={loadError ? "destructive" : run?.status === "completed" ? "secondary" : "outline"}>
              {loadError
                ? `加载失败：${loadError}`
                : `run ${run ? run.status : "loading"} · ${run?.toolPresentations.length ?? 0} 个 Tool UI`
              }
            </Badge>
            <span className="text-xs text-muted-foreground">live stream: {lastEventLabel}</span>
          </div>
        </Card>

        {/* Thread 组件 - 使用 @assistant-ui/react-ui 的高层组件 */}
        <Thread
          components={{
            UserMessage: CustomMessage,
            AssistantMessage: CustomMessage,
            ThreadWelcome: CustomWelcome,
          }}
        />

        {/* ActionBar：复制、重新生成等操作按钮 */}
        <AssistantActionBar />
        <UserActionBar />

        {/* Composer 组件 */}
        <Composer
          placeholder="继续追问 / 补充上下文"
          sendLabel="发送到主线程"
        />
      </section>
    </AssistantRuntimeShell>
  );
}
