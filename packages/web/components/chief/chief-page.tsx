"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getBook, listThreads } from "../../lib/api";
import { getBookOverviewHref } from "../../lib/book-links";
import type { BookRecord, ThreadRecord } from "../../lib/contracts";
import { useLiveEvents } from "../../lib/use-live-events";
import { WorkbenchHeader } from "../chrome/workbench-header";
import { ErrorPanel } from "../common/error-panel";
import { LoadingPanel } from "../common/loading-panel";
import { BookContextNav } from "../books/book-context-nav";
import { AssistantThread } from "./assistant-thread";

export function ChiefPage({ initialThreadId }: { initialThreadId?: string }) {
  const [threads, setThreads] = useState<ThreadRecord[]>([]);
  const [activeBook, setActiveBook] = useState<BookRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveVersion, setLiveVersion] = useState(0);
  const scheduleRef = useRef<number | null>(null);
  const selectedThreadId = initialThreadId ?? "thread_book_001_write";

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const nextThreads = await listThreads();
        setThreads(nextThreads);
        const matchedThread = nextThreads.find((thread) => thread.threadId === selectedThreadId);
        setActiveBook(matchedThread?.bookId ? await getBook(matchedThread.bookId) : null);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "主线程加载失败");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [liveVersion, selectedThreadId]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.threadId === selectedThreadId) ?? null,
    [selectedThreadId, threads],
  );

  useLiveEvents({
    enabled: Boolean(selectedThreadId),
    threadIds: selectedThreadId ? [selectedThreadId] : [],
    isRelevant: (event) => event.threadId === selectedThreadId,
    onEvent: () => {
      if (scheduleRef.current) return;
      scheduleRef.current = window.setTimeout(() => {
        scheduleRef.current = null;
        setLiveVersion((value) => value + 1);
      }, 150);
    },
    onError: (nextError) => {
      setError(nextError.message);
    },
  });

  useEffect(() => () => {
    if (scheduleRef.current) window.clearTimeout(scheduleRef.current);
  }, []);

  return (
    <div className="page-shell">
      <WorkbenchHeader
        eyebrow="Chief"
        title="总编工作台"
        description="assistant-ui runtime 承载主线程，Tool UI 以服务端 ToolPresentation 为准，适合多步事务、审批和执行轨迹。"
        actions={activeBook ? <Link className="button" href={getBookOverviewHref(activeBook.id)}>打开书页</Link> : null}
      />
      {loading ? <LoadingPanel title="加载主线程中..." /> : null}
      {error ? <ErrorPanel description={error} /> : null}
      {!loading && !error ? (
        <div className="chief-layout">
          <aside className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Threads</p>
                <h2 className="section-title">主线程</h2>
              </div>
              <div className="status-pill active">持久线程</div>
            </div>
            <div className="thread-list">
              {threads.map((thread) => (
                <Link
                  key={thread.threadId}
                  href={`/chief?threadId=${thread.threadId}`}
                  className={`thread-item ${thread.threadId === selectedThreadId ? "active" : ""}`}
                >
                  <h3>{thread.title}</h3>
                  <p>{thread.scope}{thread.bookId ? ` / ${thread.bookId}` : ""}</p>
                </Link>
              ))}
            </div>
          </aside>
          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Conversation</p>
                <h2 className="section-title">{selectedThread?.title ?? "加载中..."}</h2>
              </div>
              <div className="status-pill warning">主完成面</div>
            </div>
            {selectedThread ? <AssistantThread threadId={selectedThread.threadId} runId={selectedThread.lastRunId} /> : null}
          </section>
          <aside className="inspector-stack">
            {activeBook ? <BookContextNav book={activeBook} /> : (
              <section className="panel empty-state">
                <strong>当前为全局线程</strong>
                <p>没有绑定具体书籍时，只展示全局上下文与多书协同信息。</p>
              </section>
            )}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
