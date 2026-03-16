"use client";

import Link from "next/link";
import type { BookRecord } from "../../lib/contracts";
import {
  buildBookThreadId,
  getBookChapterHref,
  getBookMaterialsHref,
  getBookOverviewHref,
  getBookTruthHref,
  getChiefHref,
} from "../../lib/book-links";

export function BookContextNav({ book }: { book: BookRecord }) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">Entry</p>
          <h2 className="section-title">书内导航</h2>
        </div>
        <div className={`status-pill ${book.riskTone}`}>{book.riskLabel}</div>
      </div>
      <div className="quick-link-grid">
        <Link className="mini-card" href={getBookOverviewHref(book.id)}>
          <strong>书籍总览</strong>
          <p>进度、章节、truth 和 materials 总入口</p>
        </Link>
        <Link className="mini-card" href={getBookChapterHref(book.id, book.currentChapter)}>
          <strong>章节工作台</strong>
          <p>查看第 {book.currentChapter} 章正文与审计信息</p>
        </Link>
        <Link className="mini-card" href={getBookTruthHref(book.id)}>
          <strong>Truth Files</strong>
          <p>浏览 7 个真相文件及其状态</p>
        </Link>
        <Link className="mini-card" href={getBookMaterialsHref(book.id)}>
          <strong>Materials</strong>
          <p>查看草案状态、来源追踪与已落库素材</p>
        </Link>
        <Link className="mini-card" href={getChiefHref(buildBookThreadId(book.id, "write"))}>
          <strong>打开写作线程</strong>
          <p>回到 /chief 继续多步事务</p>
        </Link>
        <Link className="mini-card" href={getChiefHref(buildBookThreadId(book.id, "materials"))}>
          <strong>打开素材线程</strong>
          <p>继续生成与处理当前书的素材草案</p>
        </Link>
      </div>
    </section>
  );
}
