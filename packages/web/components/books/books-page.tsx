"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listBooks } from "../../lib/api";
import { getBookMaterialsHref, getBookOverviewHref } from "../../lib/book-links";
import type { BookRecord } from "../../lib/contracts";
import { WorkbenchHeader } from "../chrome/workbench-header";
import { ErrorPanel } from "../common/error-panel";
import { LoadingPanel } from "../common/loading-panel";

export function BooksPage() {
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
        setError(nextError instanceof Error ? nextError.message : "书籍列表加载失败");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <div className="page-shell">
      <WorkbenchHeader
        eyebrow="Books"
        title="书籍列表"
        description="这一页负责所有书籍的全局视图、风险排序和快速进入书内工作台。"
        actions={<Link className="button primary" href="/chief">打开 /chief</Link>}
      />
      {loading ? <LoadingPanel title="加载书籍中..." /> : null}
      {error ? <ErrorPanel description={error} /> : null}
      {!loading && !error ? (
        <section className="books-layout">
          <section className="thread-main">
            <div className="book-grid">
              {books.map((book) => (
                <article key={book.id} className="book-card">
                  <div className={`status-pill ${book.riskTone}`}>{book.riskLabel}</div>
                  <h3>{book.title}</h3>
                  <p>{book.summary}</p>
                  <div className="book-meta">
                    <span>{book.progressLabel}</span>
                    <span>{book.wordsLabel}</span>
                  </div>
                  <div className="button-row">
                    <Link className="button primary" href={getBookOverviewHref(book.id)}>
                      查看书页
                    </Link>
                    <Link className="button" href={getBookMaterialsHref(book.id)}>
                      Materials
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
          <aside className="inspector-stack">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Priority</p>
                  <h2 className="section-title">当前优先级</h2>
                </div>
                <div className="status-pill warning">按风险排序</div>
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
        </section>
      ) : null}
    </div>
  );
}
