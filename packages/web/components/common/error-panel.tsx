"use client";

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

// 使用 shadcn Alert 风格的错误面板
export function ErrorPanel({ title = "加载失败", description }: { title?: string; description: string }) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Badge variant="destructive" className="mt-0.5">Error</Badge>
          <div className="space-y-1">
            <p className="font-medium text-destructive">{title}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
