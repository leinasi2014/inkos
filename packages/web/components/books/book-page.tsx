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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

// 审计状态映射到 Badge variant
function getAuditVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "passed") return "secondary";
  return "outline";
}

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
    threadIds: [buildBookThreadId(bookId, "write"), buildBookThreadId(bookId, "materials")],
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
    <div className="space-y-4">
      <WorkbenchHeader
        eyebrow="Book Overview"
        title={book?.title ?? "书籍总览"}
        description={book?.summary ?? "正在加载书籍信息。"}
        actions={
          <div className="flex gap-2">
            <Button asChild><Link href={getChiefHref(buildBookThreadId(bookId, "write"))}>打开 /chief</Link></Button>
            <Button asChild variant="outline"><Link href={getBookMaterialsHref(bookId)}>素材中心</Link></Button>
          </div>
        }
      />
      {loading ? <LoadingPanel title="加载书籍总览中..." /> : null}
      {error ? <ErrorPanel description={error} /> : null}
      {!loading && !error && book ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <section className="space-y-4">
            {/* 统计卡片 - 使用 shadcn Card */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>当前章节</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{book.currentChapter}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Materials</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{book.metrics.materials}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Truth 问题</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{book.metrics.truthIssues}</div>
                </CardContent>
              </Card>
            </section>

            {/* 章节列表 - 使用 Card + Table */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Chapters</p>
                    <CardTitle className="text-lg">章节列表</CardTitle>
                  </div>
                  <Badge variant="secondary">{chapters.length} chapters</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {chapters.map((chapter) => (
                  <Link
                    key={chapter.chapterNumber}
                    href={getBookChapterHref(bookId, chapter.chapterNumber)}
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 items-center p-3 -mx-2 rounded-md transition-colors hover:bg-accent/50"
                  >
                    <div>
                      <div className="font-medium">
                        第{chapter.chapterNumber}章 {chapter.title}
                      </div>
                      <p className="text-sm text-muted-foreground">{chapter.status}</p>
                    </div>
                    <Badge variant={getAuditVariant(chapter.auditStatus)}>{chapter.auditStatus}</Badge>
                    <div className="text-sm text-muted-foreground">{chapter.wordCount} 字</div>
                  </Link>
                ))}
              </CardContent>
            </Card>

            {/* Truth Files - 使用 Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Truth Files</p>
                    <CardTitle className="text-lg">事实文件</CardTitle>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={getBookTruthHref(bookId)}>打开 Truth Center</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {truthFiles.map((item) => (
                    <Card key={item.fileName}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{item.fileName}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.note}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* 侧边栏 */}
          <aside className="space-y-4">
            <BookContextNav book={book} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
