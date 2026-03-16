"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listBooks } from "../../lib/api";
import { getBookOverviewHref } from "../../lib/book-links";
import type { BookRecord } from "../../lib/contracts";
import { WorkbenchHeader } from "../chrome/workbench-header";
import { ErrorPanel } from "../common/error-panel";
import { LoadingPanel } from "../common/loading-panel";

export function DashboardPage() {
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        setBooks(await listBooks());
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Dashboard 加载失败");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <div className="page-shell">
      <WorkbenchHeader eyebrow="Dashboard" title="仪表盘" description="以 v3 原型为参照的多书概览、风险分布和下一步动作。" />
      {loading ? <LoadingPanel title="加载仪表盘中..." /> : null}
      {error ? <ErrorPanel description={error} /> : null}
      {!loading && !error ? (
        <div className="books-layout">
          <section className="thread-main">
            <section className="metric-grid">
              <article className="metric-card">
                <div>在管书籍</div>
                <div className="metric-value">{books.length}</div>
              </article>
              <article className="metric-card">
                <div>待确认素材</div>
                <div className="metric-value">{books.reduce((sum, book) => sum + book.metrics.pendingDrafts, 0)}</div>
              </article>
              <article className="metric-card">
                <div>Truth 风险</div>
                <div className="metric-value">{books.reduce((sum, book) => sum + book.metrics.truthIssues, 0)}</div>
              </article>
            </section>
            <section className="book-grid">
              {books.map((book) => (
                <Link key={book.id} href={getBookOverviewHref(book.id)} className="book-card">
                  <div className={`status-pill ${book.riskTone}`}>{book.riskLabel}</div>
                  <h3>{book.title}</h3>
                  <p>{book.summary}</p>
                  <p>{book.progressLabel}</p>
                </Link>
              ))}
            </section>
          </section>
          <aside className="inspector-stack">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Recent Focus</p>
                  <h2 className="section-title">下一步动作</h2>
                </div>
                <div className="status-pill active">多书并行</div>
              </div>
              <div className="timeline">
                {books.slice(0, 3).map((book) => (
                  <div key={book.id} className="timeline-item">
                    <div>
                      <strong>{book.title}</strong>
                      <p>{book.nextAction}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
