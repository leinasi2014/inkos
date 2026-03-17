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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

// 状态映射到 Badge variant
function getAuditStatusVariant(status?: string): "default" | "secondary" | "destructive" | "outline" {
  if (!status) return "secondary";
  if (status === "failed") return "destructive";
  if (status === "awaiting_approval") return "outline";
  return "secondary";
}

function getChapterAuditVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  return status === "passed" ? "secondary" : "outline";
}

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
        eyebrow="Chapter Workbench"
        title={`章节工作台 · 第 ${chapterNumber} 章`}
        description="章节页承载正文阅读、审计摘要和修订回路，不把全量多步事务塞回专页。"
        actions={
          <div className="flex gap-2">
            <Button asChild><Link href={getChiefHref(buildBookThreadId(bookId, "write"))}>打开写作线程</Link></Button>
            <Button asChild variant="outline"><Link href={getBookMaterialsHref(bookId)}>查看 Materials</Link></Button>
          </div>
        }
      />
      {loading ? <LoadingPanel title="加载章节中..." /> : null}
      {error ? <ErrorPanel description={error} /> : null}
      {!loading && !error && book && chapter ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <section className="space-y-4">
            {/* 章节内容卡片 */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Chapter</p>
                    <CardTitle className="text-lg">{chapter.title}</CardTitle>
                  </div>
                  <Badge variant={getChapterAuditVariant(chapter.auditStatus)}>{chapter.auditStatus}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>{chapter.status}</span>
                  <span>·</span>
                  <span>{chapter.wordCount} 字</span>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap leading-relaxed">
                  {chapter.content}
                </div>
              </CardContent>
            </Card>

            {/* 审计摘要卡片 */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Audit</p>
                    <CardTitle className="text-lg">审计摘要</CardTitle>
                  </div>
                  <Badge variant={getAuditStatusVariant(audit?.status)}>
                    {audit?.status ?? "missing"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {audit ? (
                  <Tabs defaultValue="summary" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="summary">摘要</TabsTrigger>
                      <TabsTrigger value="findings">发现</TabsTrigger>
                      {auditResourceText && <TabsTrigger value="resource">资源</TabsTrigger>}
                    </TabsList>
                    <TabsContent value="summary" className="space-y-4">
                      <div className="space-y-1">
                        <div className="font-medium">Summary</div>
                        <p className="text-sm text-muted-foreground">{audit.summary}</p>
                      </div>
                      <Separator />
                      <div className="space-y-1">
                        <div className="font-medium">Blocked By</div>
                        <p className="text-sm text-muted-foreground">{audit.blockedBy}</p>
                      </div>
                      <Separator />
                      <div className="space-y-1">
                        <div className="font-medium">Next Action</div>
                        <p className="text-sm text-muted-foreground">{audit.nextAction}</p>
                      </div>
                    </TabsContent>
                    <TabsContent value="findings" className="space-y-3">
                      {audit.findings.map((finding, idx) => (
                        <div key={finding.title} className="space-y-1">
                          <div className="font-medium">{idx + 1}. {finding.title}</div>
                          <p className="text-sm text-muted-foreground">{finding.detail}</p>
                          {idx < audit.findings.length - 1 && <Separator className="mt-2" />}
                        </div>
                      ))}
                    </TabsContent>
                    {auditResourceText && (
                      <TabsContent value="resource">
                        <div className="space-y-1">
                          <div className="font-medium">Resource</div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{auditResourceText}</p>
                        </div>
                      </TabsContent>
                    )}
                  </Tabs>
                ) : (
                  <div className="p-6 border border-dashed rounded-lg bg-muted/30 text-center">
                    <p className="font-medium">当前没有可复盘审计卡</p>
                    <p className="text-sm text-muted-foreground">该章节暂未绑定独立审计摘要。</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 侧边栏 */}
          <aside className="space-y-4">
            <BookContextNav book={book} />
            {audit?.trace?.length ? (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Trace</p>
                      <CardTitle className="text-lg">执行轨迹</CardTitle>
                    </div>
                    <Badge variant="secondary">{audit.trace.length} steps</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {audit.trace.map((item, idx) => (
                    <div key={item.label} className="space-y-1">
                      <div className="font-medium text-sm">{item.label} · {item.status}</div>
                      <p className="text-sm text-muted-foreground">{item.note}</p>
                      {idx < audit.trace.length - 1 && <Separator className="mt-2" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}
          </aside>
        </div>
      ) : null}
    </div>
  );
}
