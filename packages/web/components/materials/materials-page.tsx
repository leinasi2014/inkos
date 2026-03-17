"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getBook, listDrafts, listMaterials } from "../../lib/api";
import { buildBookThreadId, getChiefHref } from "../../lib/book-links";
import type { BookRecord, DraftArtifact, MaterialRecord } from "../../lib/contracts";
import { useLiveEvents } from "../../lib/use-live-events";
import { BookContextNav } from "../books/book-context-nav";
import { WorkbenchHeader } from "../chrome/workbench-header";
import { ErrorPanel } from "../common/error-panel";
import { LoadingPanel } from "../common/loading-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Separator } from "../ui/separator";

type MaterialType = "character" | "faction" | "location";

// 素材状态映射到 Badge variant
function getMaterialStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "applied") return "secondary";
  if (status === "discarded") return "outline";
  return "default";
}

export function MaterialsPage({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<BookRecord | null>(null);
  const [materials, setMaterials] = useState<MaterialRecord[]>([]);
  const [drafts, setDrafts] = useState<DraftArtifact[]>([]);
  const [selectedType, setSelectedType] = useState<MaterialType>("character");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveVersion, setLiveVersion] = useState(0);
  const scheduleRef = useRef<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const [nextBook, nextMaterials, nextDrafts] = await Promise.all([getBook(bookId), listMaterials(bookId), listDrafts(bookId)]);
        setBook(nextBook);
        setMaterials(nextMaterials);
        setDrafts(nextDrafts);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Materials 加载失败");
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

  const filteredMaterials = useMemo(
    () => materials.filter((item) => item.type === selectedType),
    [materials, selectedType],
  );
  const filteredDrafts = useMemo(
    () => drafts.filter((item) => item.type === selectedType),
    [drafts, selectedType],
  );
  const latestDraft = filteredDrafts[0] ?? null;

  return (
    <div className="space-y-4">
      <WorkbenchHeader
        eyebrow="Materials Center"
        title="素材中心"
        description={`${book?.title ?? "当前书籍"} 的角色、阵营、地点素材统一从 DraftArtifact 与已落库 materials 推导展示。`}
        actions={
          <Button asChild>
            <Link href={getChiefHref(buildBookThreadId(bookId, "materials"))}>
              回到 /chief 素材线程
            </Link>
          </Button>
        }
      />
      {loading ? <LoadingPanel title="加载素材中心中..." /> : null}
      {error ? <ErrorPanel description={error} /> : null}
      {!loading && !error && book ? (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <section className="space-y-4">
            {/* 素材类型选择 - 使用 Tabs */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Frozen Types</p>
                    <CardTitle className="text-lg">首批 3 类素材</CardTitle>
                  </div>
                  <Badge variant="secondary">character / faction / location</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedType} onValueChange={(value) => setSelectedType(value as MaterialType)}>
                  <TabsList>
                    {(["character", "faction", "location"] as MaterialType[]).map((type) => (
                      <TabsTrigger key={type} value={type}>
                        {type}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  <TabsContent value={selectedType} className="mt-4">
                    {filteredMaterials.length > 0 ? (
                      <Card>
                        <CardContent className="p-0">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>名称</TableHead>
                                <TableHead>状态</TableHead>
                                <TableHead>来源</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredMaterials.map((material) => {
                                const preview = material.payload as Record<string, unknown>;
                                return (
                                  <TableRow key={material.materialId}>
                                    <TableCell>
                                      <p className="font-medium">{material.name}</p>
                                      <p className="text-sm text-muted-foreground">{String(preview.summary ?? material.note)}</p>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={getMaterialStatusVariant(material.status)}>
                                        {material.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{material.provenance}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="p-6 border border-dashed rounded-lg bg-muted/30 text-center">
                        <p className="font-medium">当前类型还没有已落库素材</p>
                        <p className="text-sm text-muted-foreground">从 /chief 生成候选并应用保存后，这里会立即展示。</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* 最近草案 */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Draft Timeline</p>
                    <CardTitle className="text-lg">最近草案</CardTitle>
                  </div>
                  <Badge variant={latestDraft?.status === "applied" ? "secondary" : latestDraft ? "outline" : "default"}>
                    {latestDraft?.status ?? "暂无草案"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {filteredDrafts.length > 0 ? (
                  <div className="space-y-4">
                    {filteredDrafts.slice(0, 4).map((draft, idx) => {
                      const preview = draft.preview as Record<string, unknown>;
                      const conflicts = Array.isArray(preview.conflicts) ? preview.conflicts : [];
                      return (
                        <div key={draft.draftId} className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 flex-1">
                              <div className="font-medium">{String(preview.title ?? "未命名候选")}</div>
                              <p className="text-sm text-muted-foreground">{String(preview.summary ?? preview.fit ?? "")}</p>
                              {conflicts.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  同名冲突 {conflicts.length} 条，应用时会要求确认覆盖。
                                </p>
                              )}
                            </div>
                            <Badge variant={getMaterialStatusVariant(draft.status)}>
                              {draft.status}
                            </Badge>
                          </div>
                          {idx < Math.min(filteredDrafts.slice(0, 4).length - 1, 3) && <Separator />}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 border border-dashed rounded-lg bg-muted/30 text-center">
                    <p className="font-medium">暂无可回放草案</p>
                    <p className="text-sm text-muted-foreground">当前这本书还没有生成过该类型的 materials 草案。</p>
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
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Bridge</p>
                    <CardTitle className="text-lg">来源追踪</CardTitle>
                  </div>
                  <Badge variant="default">materials_summary.md</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestDraft ? (
                  <>
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">sourceThreadId</div>
                      <p className="text-sm break-all">{latestDraft.sourceThreadId}</p>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">sourceRunId</div>
                      <p className="text-sm break-all">{latestDraft.sourceRunId}</p>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">etag</div>
                      <p className="text-sm break-all">{latestDraft.etag}</p>
                    </div>
                    <Separator />
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">bridge note</div>
                      <p className="text-sm text-muted-foreground">
                        {String((latestDraft.preview as Record<string, unknown>).bridgeNote ?? "应用后会同步写回 materials summary。")}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="p-4 border border-dashed rounded-lg bg-muted/30 text-center">
                    <p className="text-sm font-medium">暂无来源信息</p>
                    <p className="text-xs text-muted-foreground">当前书籍还没有已生成的 materials 草案。</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
