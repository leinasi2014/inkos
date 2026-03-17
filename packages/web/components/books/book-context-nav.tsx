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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

// 风险等级映射到 Badge variant
function getRiskVariant(riskTone: string): "default" | "secondary" | "destructive" | "outline" {
  if (riskTone === "danger") return "destructive";
  if (riskTone === "warning") return "outline";
  return "secondary";
}

export function BookContextNav({ book }: { book: BookRecord }) {
  const navItems = [
    { href: getBookOverviewHref(book.id), title: "书籍总览", desc: "进度、章节、truth 和 materials 总入口" },
    { href: getBookChapterHref(book.id, book.currentChapter), title: "章节工作台", desc: `查看第 ${book.currentChapter} 章正文与审计信息` },
    { href: getBookTruthHref(book.id), title: "Truth Files", desc: "浏览 7 个真相文件及其状态" },
    { href: getBookMaterialsHref(book.id), title: "Materials", desc: "查看草案状态、来源追踪与已落库素材" },
    { href: getChiefHref(buildBookThreadId(book.id, "write")), title: "打开写作线程", desc: "回到 /chief 继续多步事务" },
    { href: getChiefHref(buildBookThreadId(book.id, "materials")), title: "打开素材线程", desc: "继续生成与处理当前书的素材草案" },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Entry</p>
            <CardTitle className="text-lg">书内导航</CardTitle>
          </div>
          <Badge variant={getRiskVariant(book.riskTone)}>{book.riskLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="group">
              <Card className="h-full transition-colors hover:bg-accent/50 hover:border-accent">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="line-clamp-2">{item.desc}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
