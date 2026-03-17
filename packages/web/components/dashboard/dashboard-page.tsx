"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listBooks } from "../../lib/api";
import { getBookOverviewHref } from "../../lib/book-links";
import type { BookRecord } from "../../lib/contracts";
import { WorkbenchHeader } from "../chrome/workbench-header";
import { ErrorPanel } from "../common/error-panel";
import { LoadingPanel } from "../common/loading-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";

// 状态类型映射到 Badge variant
function getRiskVariant(riskTone: string): "default" | "secondary" | "destructive" | "outline" {
  if (riskTone === "danger") return "destructive";
  if (riskTone === "warning") return "outline";
  return "secondary";
}

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
    <div className="space-y-4">
      <WorkbenchHeader eyebrow="Dashboard" title="仪表盘" description="以 v3 原型为参照的多书概览、风险分布和下一步动作。" />
      {loading ? <LoadingPanel title="加载仪表盘中..." /> : null}
      {error ? <ErrorPanel description={error} /> : null}
      {!loading && !error ? (
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <section className="space-y-4">
            {/* 统计卡片网格 - 使用 shadcn Card */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>在管书籍</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{books.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>待确认素材</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {books.reduce((sum, book) => sum + book.metrics.pendingDrafts, 0)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Truth 风险</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {books.reduce((sum, book) => sum + book.metrics.truthIssues, 0)}
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* 书籍列表 - 使用 Card + Badge */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {books.map((book) => (
                <Link key={book.id} href={getBookOverviewHref(book.id)} className="group">
                  <Card className="h-full transition-colors hover:bg-accent/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="line-clamp-1">{book.title}</CardTitle>
                        <Badge variant={getRiskVariant(book.riskTone)} className="shrink-0">
                          {book.riskLabel}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{book.summary}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground">{book.progressLabel}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </section>
          </section>

          {/* 侧边栏 - 下一步动作 */}
          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Recent Focus</p>
                    <CardTitle className="text-lg">下一步动作</CardTitle>
                  </div>
                  <Badge variant="secondary">多书并行</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {books.slice(0, 3).map((book) => (
                  <div key={book.id} className="space-y-1">
                    <div className="font-medium">{book.title}</div>
                    <p className="text-sm text-muted-foreground">{book.nextAction}</p>
                    {book.id !== books.slice(0, 3)[books.slice(0, 3).length - 1].id && <Separator className="mt-3" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
