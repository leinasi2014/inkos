"use client";

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

// 使用 shadcn Card + Tailwind 动画的加载面板
export function LoadingPanel({ title = "加载中...", description = "正在读取当前页面所需的数据。" }: { title?: string; description?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          {/* Tailwind CSS 加载动画 */}
          <div className="shrink-0 h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="space-y-1">
            <p className="font-medium">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
