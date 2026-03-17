"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listBooks } from "../../lib/api";
import { getBookMaterialsHref, getBookOverviewHref } from "../../lib/book-links";
import type { BookRecord } from "../../lib/contracts";
import { WorkbenchHeader } from "../chrome/workbench-header";
import { ErrorPanel } from "../common/error-panel";
import { LoadingPanel } from "../common/loading-panel";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

// 状态类型映射到 Badge variant
function getRiskVariant(riskTone: string): "default" | "secondary" | "destructive" | "outline" {
  if (riskTone === "danger") return "destructive";
  if (riskTone === "warning") return "outline";
  return "secondary";
}

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
    <div className="space-y-4">
      <WorkbenchHeader
        eyebrow="Books"
        title="书籍列表"
        description="这一页负责所有书籍的全局视图、风险排序和快速进入书内工作台。"
        actions={<Button asChild><Link href="/chief">打开 /chief</Link></Button>}
      />
      {loading ? <LoadingPanel title="加载书籍中..." /> : null}
      {error ? <ErrorPanel description={error} /> : null}
      {!loading && !error ? (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
            {books.map((book) => (
              <Card key={book.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-1">{book.title}</CardTitle>
                    <Badge variant={getRiskVariant(book.riskTone)} className="shrink-0">
                      {book.riskLabel}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{book.summary}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <span>{book.progressLabel}</span>
                    <span>·</span>
                    <span>{book.wordsLabel}</span>
                  </div>
                </CardContent>
                <CardFooter className="gap-2">
                  <Button asChild variant="default" className="flex-1">
                    <Link href={getBookOverviewHref(book.id)}>查看书页</Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={getBookMaterialsHref(book.id)}>Materials</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </section>

          {/* 侧边栏 - 当前优先级 */}
          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Priority</p>
                    <CardTitle className="text-lg">当前优先级</CardTitle>
                  </div>
                  <Badge variant="outline">按风险排序</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {books.slice(0, 3).map((book, index) => (
                  <div key={book.id} className="space-y-1">
                    <div className="font-medium">{book.title}</div>
                    <p className="text-sm text-muted-foreground">{book.nextAction}</p>
                    {index < books.slice(0, 3).length - 1 && <Separator className="mt-3" />}
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
