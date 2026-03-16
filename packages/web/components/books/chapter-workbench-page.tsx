"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getBook, getChapter, getChapterAudit, getResource } from "../../lib/api";
import { buildBookThreadId, getBookMaterialsHref, getChiefHref } from "../../lib/book-links";
import type { BookRecord, ChapterAuditRecord, ChapterRecord } from "../../lib/contracts";
import { useLiveEvents } from "../../lib/use-live-events";
import { WorkbenchHeader } from "../chrome/workbench-header";
import { ErrorPanel } from "../common/error-panel";
import { LoadingPanel } from "../common/loading-panel";
import { BookContextNav } from "./book-context-nav";

export function ChapterWorkbenchPage({ bookId, chapterNumber }: { bookId: string; chapterNumber: number }) {
  const [book, setBook] = useState<BookRecord | null>(null);
  const [chapter, setChapter] = useState<ChapterRecord | null>(null);
  const [audit, setAudit] = useState<ChapterAuditRecord | null>(null);
  const [auditResourceText, setAuditResourceText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveVersion, setLiveVersion] = useState(0);
  const scheduleRef = useRef<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const [nextBook, nextChapter, nextAudit] = await Promise.all([
          getBook(bookId),
          getChapter(bookId, chapterNumber),
          getChapterAudit(bookId, chapterNumber),
        ]);
        setBook(nextBook);
        setChapter(nextChapter);
        setAudit(nextAudit);
        if (nextAudit.resourceRef?.refId) {
          setAuditResourceText((await getResource(nextAudit.resourceRef.refId)).content);
        } else {
          setAuditResourceText("");
        }
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "章节工作台加载失败");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [bookId, chapterNumber, liveVersion]);

  useLiveEvents({
    enabled: Boolean(bookId),
    isRelevant: (event) => event.threadId.includes(bookId) || String(event.payload.bookId ?? "") === bookId,
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
        eyebrow="Chapter Workbench"
        title={`章节工作台 · 第 ${chapterNumber} 章`}
        description="章节页承载正文阅读、审计摘要和修订回路，不把全量多步事务塞回专页。"
        actions={
          <div className="button-row">
            <Link className="button primary" href={getChiefHref(buildBookThreadId(bookId, "write"))}>
              打开写作线程
            </Link>
            <Link className="button" href={getBookMaterialsHref(bookId)}>
              查看 Materials
            </Link>
          </div>
        }
      />
      {loading ? <LoadingPanel title="加载章节中..." /> : null}
      {error ? <ErrorPanel description={error} /> : null}
      {!loading && !error && book && chapter ? (
        <div className="books-layout">
          <section className="thread-main">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Chapter</p>
                  <h2 className="section-title">{chapter.title}</h2>
                </div>
                <div className={`status-pill ${chapter.auditStatus === "passed" ? "success" : "warning"}`}>{chapter.auditStatus}</div>
              </div>
              <div className="chapter-meta">
                <span>{chapter.status}</span>
                <span>{chapter.wordCount} 字</span>
              </div>
              <div className="reader-card">{chapter.content}</div>
            </section>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Audit</p>
                  <h2 className="section-title">审计摘要</h2>
                </div>
                <div className={`status-pill ${audit?.status === "failed" ? "danger" : audit?.status === "awaiting_approval" ? "warning" : "success"}`}>
                  {audit?.status ?? "missing"}
                </div>
              </div>
              {audit ? (
                <div className="timeline">
                  <div className="timeline-item">
                    <div>
                      <strong>summary</strong>
                      <p>{audit.summary}</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div>
                      <strong>blocked by</strong>
                      <p>{audit.blockedBy}</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div>
                      <strong>next action</strong>
                      <p>{audit.nextAction}</p>
                    </div>
                  </div>
                  {audit.findings.map((finding) => (
                    <div key={finding.title} className="timeline-item">
                      <div>
                        <strong>{finding.title}</strong>
                        <p>{finding.detail}</p>
                      </div>
                    </div>
                  ))}
                  {auditResourceText ? (
                    <div className="timeline-item">
                      <div>
                        <strong>resource</strong>
                        <p>{auditResourceText}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="empty-state">
                  <strong>当前没有可复盘审计卡</strong>
                  <p>该章节暂未绑定独立审计摘要。</p>
                </div>
              )}
            </section>
          </section>
          <aside className="inspector-stack">
            <BookContextNav book={book} />
            {audit?.trace?.length ? (
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">Trace</p>
                    <h2 className="section-title">执行轨迹</h2>
                  </div>
                  <div className="status-pill active">{audit.trace.length} steps</div>
                </div>
                <div className="timeline">
                  {audit.trace.map((item) => (
                    <div key={item.label} className="timeline-item">
                      <div>
                        <strong>{item.label} · {item.status}</strong>
                        <p>{item.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
