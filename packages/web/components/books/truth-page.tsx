"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getBook, listTruthFiles } from "../../lib/api";
import type { BookRecord, TruthFileRecord } from "../../lib/contracts";
import { useLiveEvents } from "../../lib/use-live-events";
import { WorkbenchHeader } from "../chrome/workbench-header";
import { ErrorPanel } from "../common/error-panel";
import { LoadingPanel } from "../common/loading-panel";
import { BookContextNav } from "./book-context-nav";

export function TruthPage({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<BookRecord | null>(null);
  const [files, setFiles] = useState<TruthFileRecord[]>([]);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveVersion, setLiveVersion] = useState(0);
  const scheduleRef = useRef<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const [nextBook, nextFiles] = await Promise.all([getBook(bookId), listTruthFiles(bookId)]);
        setBook(nextBook);
        setFiles(nextFiles);
        setSelectedFileName(nextFiles[0]?.fileName ?? "");
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Truth files 加载失败");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [bookId, liveVersion]);

  const selectedFile = useMemo(
    () => files.find((item) => item.fileName === selectedFileName) ?? files[0] ?? null,
    [files, selectedFileName],
  );
  const driftCount = useMemo(() => files.filter((item) => /待|冲突|drift/i.test(`${item.note} ${item.content}`)).length, [files]);

  useLiveEvents({
    enabled: Boolean(bookId),
    isRelevant: (event) => event.threadId.includes(bookId) || String(event.payload.bookId ?? "") === bookId,
    onEvent: () => {
      if (scheduleRef.current) return;
      scheduleRef.current = window.setTimeout(() => {
        scheduleRef.current = null;
        setLiveVersion((value) => value + 1);
      }, 160);
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
        eyebrow="Truth Center"
        title="Truth Files 中心"
        description="Truth 负责系统运行时事实状态，当前阶段先把浏览和边界定义清楚，不在这里做复杂事务。"
      />
      {loading ? <LoadingPanel title="加载 truth files 中..." /> : null}
      {error ? <ErrorPanel description={error} /> : null}
      {!loading && !error && book ? (
        <div className="books-layout">
          <section className="thread-main truth-layout">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Files</p>
                  <h2 className="section-title">7 个真相文件</h2>
                </div>
                <div className={`status-pill ${driftCount > 0 ? "warning" : "success"}`}>{files.length} files</div>
              </div>
              <div className="settings-tabs">
                {files.map((file) => (
                  <button
                    key={file.fileName}
                    type="button"
                    className={file.fileName === selectedFile?.fileName ? "active" : ""}
                    onClick={() => setSelectedFileName(file.fileName)}
                  >
                    {file.fileName}
                  </button>
                ))}
              </div>
            </section>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Content</p>
                  <h2 className="section-title">{selectedFile?.fileName ?? "未选择文件"}</h2>
                </div>
                <div className="status-pill warning">truth != materials</div>
              </div>
              {selectedFile ? (
                <>
                  <div className="mini-grid">
                    <div className="mini-card">
                      <span className="subtle">category</span>
                      <strong>{selectedFile.category}</strong>
                    </div>
                    <div className="mini-card">
                      <span className="subtle">updated</span>
                      <strong>{selectedFile.updatedAt.slice(11, 16)}</strong>
                    </div>
                    <div className="mini-card">
                      <span className="subtle">drift</span>
                      <strong>{/待|冲突|drift/i.test(`${selectedFile.note} ${selectedFile.content}`) ? "needs-check" : "clean"}</strong>
                    </div>
                  </div>
                  <p>{selectedFile.note}</p>
                  <div className="reader-card">{selectedFile.content}</div>
                </>
              ) : (
                <div className="empty-state">
                  <strong>没有 truth 文件</strong>
                  <p>当前书籍还未生成 truth 文件。</p>
                </div>
              )}
            </section>
          </section>
          <aside className="inspector-stack">
            <BookContextNav book={book} />
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Runtime Facts</p>
                  <h2 className="section-title">truth 边界</h2>
                </div>
                <div className={`status-pill ${driftCount > 0 ? "warning" : "success"}`}>{driftCount} drift</div>
              </div>
              <div className="timeline">
                <div className="timeline-item">
                  <div>
                    <strong>当前书籍</strong>
                    <p>{book.title} · 第 {book.currentChapter} 章</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div>
                    <strong>风险提醒</strong>
                    <p>{book.riskLabel}</p>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
