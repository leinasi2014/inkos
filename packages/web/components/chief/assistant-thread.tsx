"use client";

import { MessagePrimitive, ThreadPrimitive } from "@assistant-ui/react";
import { useAuiState } from "@assistant-ui/react";
import { useEffect, useRef, useState } from "react";
import { buildInitialMessages } from "../../lib/assistant-messages";
import { AssistantRuntimeShell } from "../../lib/assistant-runtime";
import { getRun, getThreadMessages } from "../../lib/api";
import type { MessageRecord, RunRecord } from "../../lib/contracts";
import { useLiveEvents } from "../../lib/use-live-events";
import { sendCommand } from "../../lib/ws-client";
import { AssistantToolPart } from "./assistant-tool-part";

function ThreadMessage() {
  const role = useAuiState((state) => state.message.role);

  return (
    <MessagePrimitive.Root className={`message-bubble ${role === "user" ? "user" : "assistant"}`}>
      <MessagePrimitive.Parts components={{ tools: { Override: AssistantToolPart as any } }} />
    </MessagePrimitive.Root>
  );
}

export function AssistantThread({ threadId, runId }: { threadId: string; runId?: string }) {
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [run, setRun] = useState<RunRecord | null>(null);
  const [loadError, setLoadError] = useState<string>("");
  const [liveVersion, setLiveVersion] = useState(0);
  const [lastEventLabel, setLastEventLabel] = useState("等待实时事件");
  const [draftInput, setDraftInput] = useState("");
  const [sending, setSending] = useState(false);
  const scheduleRef = useRef<number | null>(null);

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

  useLiveEvents({
    enabled: Boolean(threadId),
    initialCursor: run?.eventCursor ?? 0,
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

  async function submitMessage() {
    const content = draftInput.trim();
    if (!content || sending) return;

    try {
      setSending(true);
      setLoadError("");
      const ack = await sendCommand({
        commandId: createCommandId(),
        command: "send_message",
        payload: {
          threadId,
          content,
        },
      });
      setDraftInput("");
      if (ack.runId) {
        setRun(await getRun(ack.runId));
      }
      setLiveVersion((value) => value + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "发送失败");
    } finally {
      setSending(false);
    }
  }

  async function stopRun() {
    if (!run || run.status === "completed" || run.status === "cancelled" || run.status === "failed" || sending) {
      return;
    }

    try {
      setSending(true);
      await sendCommand({
        commandId: createCommandId(),
        command: "cancel_run",
        payload: {
          runId: run.runId,
        },
      });
      setLiveVersion((value) => value + 1);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "停止失败");
    } finally {
      setSending(false);
    }
  }

  return (
    <AssistantRuntimeShell key={`${threadId}-${liveVersion}`} threadId={threadId} initialMessages={buildInitialMessages(messages, run) as any}>
      <section className="thread-panel">
        <div className={`status-pill ${loadError ? "danger" : run?.status === "completed" ? "success" : run?.status === "awaiting_approval" ? "warning" : ""}`}>
          {loadError ? `加载失败：${loadError}` : `run ${run ? run.status : "loading"} · ${run?.toolPresentations.length ?? 0} 个 Tool UI`}
        </div>
        <div className="subtle">live stream: {lastEventLabel}</div>
        <ThreadPrimitive.Root>
          <ThreadPrimitive.Viewport>
            <ThreadPrimitive.Messages components={{ Message: ThreadMessage as any }} />
          </ThreadPrimitive.Viewport>
        </ThreadPrimitive.Root>
        <form
          className="composer"
          onSubmit={(event) => {
            event.preventDefault();
            void submitMessage();
          }}
        >
          <textarea
            placeholder="继续追问 / 补充上下文"
            value={draftInput}
            onChange={(event) => setDraftInput(event.target.value)}
          />
          <div className="button-row">
            <button type="submit" className="button primary" disabled={!draftInput.trim() || sending}>
              发送到主线程
            </button>
            <button type="button" className="button" disabled={sending || !run || ["completed", "cancelled", "failed"].includes(run.status)} onClick={() => void stopRun()}>
              停止
            </button>
          </div>
        </form>
      </section>
    </AssistantRuntimeShell>
  );
}

function createCommandId() {
  return `cmd_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}
