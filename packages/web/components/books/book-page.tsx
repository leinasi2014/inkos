"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getBook, listChapters, listTruthFiles } from "../../lib/api";
import { buildBookThreadId, getBookChapterHref, getBookMaterialsHref, getChiefHref, getBookTruthHref } from "../../lib/book-links";
import type { BookRecord, ChapterRecord, TruthFileRecord } from "../../lib/contracts";
import { useLiveEvents } from "../../lib/use-live-events";
import { WorkbenchHeader } from "../chrome/workbench-header";
import { ErrorPanel } from "../common/error-panel";
import { LoadingPanel } from "../common/loading-panel";
import { BookContextNav } from "./book-context-nav";

export function BookPage({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<BookRecord | null>(null);
  const [chapters, setChapters] = useState<ChapterRecord[]>([]);
  const [truthFiles, setTruthFiles] = useState<TruthFileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveVersion, setLiveVersion] = useState(0);
  const scheduleRef = useRef<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const [nextBook, nextChapters, nextTruthFiles] = await Promise.all([getBook(bookId), listChapters(bookId), listTruthFiles(bookId)]);
        setBook(nextBook);
        setChapters(nextChapters);
        setTruthFiles(nextTruthFiles);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "书籍总览加载失败");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [bookId, liveVersion]);

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
        eyebrow="Book Overview"
        title={book?.title ?? "书籍总览"}
        description={book?.summary ?? "正在加载书籍信息。"}
        actions={
          <div className="button-row">
            <Link className="button primary" href={getChiefHref(buildBookThreadId(bookId, "write"))}>
              打开 /chief
            </Link>
            <Link className="button" href={getBookMaterialsHref(bookId)}>
              素材中心
            </Link>
          </div>
        }
      />
      {loading ? <LoadingPanel title="加载书籍总览中..." /> : null}
      {error ? <ErrorPanel description={error} /> : null}
      {!loading && !error && book ? (
        <div className="books-layout">
          <section className="thread-main">
            <section className="metric-grid">
              <article className="metric-card">
                <div>当前章节</div>
                <div className="metric-value">{book.currentChapter}</div>
              </article>
              <article className="metric-card">
                <div>Materials</div>
                <div className="metric-value">{book.metrics.materials}</div>
              </article>
              <article className="metric-card">
                <div>Truth 问题</div>
                <div className="metric-value">{book.metrics.truthIssues}</div>
              </article>
            </section>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Chapters</p>
                  <h2 className="section-title">章节列表</h2>
                </div>
                <div className="status-pill active">{chapters.length} chapters</div>
              </div>
              <div className="table-list">
                {chapters.map((chapter) => (
                  <Link key={chapter.chapterNumber} href={getBookChapterHref(bookId, chapter.chapterNumber)} className="table-row link-row">
                    <div>
                      <strong>
                        第{chapter.chapterNumber}章 {chapter.title}
                      </strong>
                      <p>{chapter.status}</p>
                    </div>
                    <div>
                      <span className={`status-pill ${chapter.auditStatus === "passed" ? "success" : "warning"}`}>{chapter.auditStatus}</span>
                    </div>
                    <div>
                      <span className="subtle">{chapter.wordCount} 字</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Truth Files</p>
                  <h2 className="section-title">事实文件</h2>
                </div>
                <Link className="button" href={getBookTruthHref(bookId)}>
                  打开 Truth Center
                </Link>
              </div>
              <div className="quick-link-grid">
                {truthFiles.map((item) => (
                  <div key={item.fileName} className="mini-card">
                    <strong>{item.fileName}</strong>
                    <p>{item.note}</p>
                  </div>
                ))}
              </div>
            </section>
          </section>
          <aside className="inspector-stack">
            <BookContextNav book={book} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
