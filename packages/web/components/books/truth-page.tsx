"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getBook, listTruthFiles } from "../../lib/api";
import { buildBookThreadId } from "../../lib/book-links";
import type { BookRecord, TruthFileRecord } from "../../lib/contracts";
import { useLiveEvents } from "../../lib/use-live-events";
import { WorkbenchHeader } from "../chrome/workbench-header";
import { ErrorPanel } from "../common/error-panel";
import { LoadingPanel } from "../common/loading-panel";
import { BookContextNav } from "./book-context-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";

// 获取 drift 状态的 Badge variant
function getDriftVariant(hasDrift: boolean): "default" | "secondary" | "destructive" | "outline" {
  return hasDrift ? "outline" : "secondary";
}

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
    threadIds: [buildBookThreadId(bookId, "write"), buildBookThreadId(bookId, "materials")],
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
    <div className="space-y-4">
      <WorkbenchHeader
        eyebrow="Truth Center"
        title="Truth Files 中心"
        description="Truth 负责系统运行时事实状态，当前阶段先把浏览和边界定义清楚，不在这里做复杂事务。"
      />
      {loading ? <LoadingPanel title="加载 truth files 中..." /> : null}
      {error ? <ErrorPanel description={error} /> : null}
      {!loading && !error && book ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <section className="space-y-4">
            {/* 文件选择 - 使用 Tabs */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Files</p>
                    <CardTitle className="text-lg">7 个真相文件</CardTitle>
                  </div>
                  <Badge variant={getDriftVariant(driftCount > 0)}>{files.length} files</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedFileName} onValueChange={setSelectedFileName} className="w-full">
                  <TabsList className="flex flex-wrap h-auto gap-1">
                    {files.map((file) => (
                      <TabsTrigger key={file.fileName} value={file.fileName} className="data-[state=active]:bg-background">
                        {file.fileName}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* 文件内容 - 使用 Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Content</p>
                    <CardTitle className="text-lg">{selectedFile?.fileName ?? "未选择文件"}</CardTitle>
                  </div>
                  <Badge variant="outline">truth != materials</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedFile ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>category</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="font-medium">{selectedFile.category}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>updated</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="font-medium">{selectedFile.updatedAt.slice(11, 16)}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>drift</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <Badge variant={getDriftVariant(/待|冲突|drift/i.test(`${selectedFile.note} ${selectedFile.content}`))}>
                            {/待|冲突|drift/i.test(`${selectedFile.note} ${selectedFile.content}`) ? "needs-check" : "clean"}
                          </Badge>
                        </CardContent>
                      </Card>
                    </div>
                    <Separator />
                    <p className="text-sm text-muted-foreground">{selectedFile.note}</p>
                    <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap leading-relaxed">
                      {selectedFile.content}
                    </div>
                  </>
                ) : (
                  <div className="p-6 border border-dashed rounded-lg bg-muted/30 text-center">
                    <p className="font-medium">没有 truth 文件</p>
                    <p className="text-sm text-muted-foreground">当前书籍还未生成 truth 文件。</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* 侧边栏 */}
          <aside className="space-y-4">
            <BookContextNav book={book} />
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Runtime Facts</p>
                    <CardTitle className="text-lg">truth 边界</CardTitle>
                  </div>
                  <Badge variant={getDriftVariant(driftCount > 0)}>{driftCount} drift</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="font-medium">当前书籍</div>
                  <p className="text-sm text-muted-foreground">{book.title} · 第 {book.currentChapter} 章</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="font-medium">风险提醒</div>
                  <p className="text-sm text-muted-foreground">{book.riskLabel}</p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
