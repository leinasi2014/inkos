"use client";

import { useConnectionStatus } from "../../lib/connection-status";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

interface WorkbenchHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function WorkbenchHeader({ eyebrow, title, description, actions }: WorkbenchHeaderProps) {
  const { health, ready, status } = useConnectionStatus();
  const connected = status === "connected";
  const reconnecting = status === "reconnecting";

  // 连接状态对应的 Badge variant
  function getStatusVariant(): "default" | "secondary" | "destructive" | "outline" {
    if (!ready || connected) return "secondary";
    if (reconnecting) return "outline";
    return "destructive";
  }

  return (
    <>
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{eyebrow}</p>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* 服务健康状态 - 使用 Button 组 */}
          <div className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground" aria-label="Service health">
            <Button type="button" variant="ghost" size="sm" className={connected ? "bg-background shadow-sm" : "h-7"}>
              Connected
            </Button>
            <Button type="button" variant="ghost" size="sm" className={reconnecting ? "bg-background shadow-sm" : "h-7"}>
              Reconnecting
            </Button>
            <Button type="button" variant="ghost" size="sm" className={status === "disconnected" ? "bg-background shadow-sm" : "h-7"}>
              Disconnected
            </Button>
          </div>
          {actions}
        </div>
      </header>

      {/* 连接状态横幅 - 使用 shadcn Card + Badge */}
      <Card className={`border ${!ready || connected ? "border-green-500/20 bg-green-500/5" : reconnecting ? "border-yellow-500/20 bg-yellow-500/5" : "border-red-500/20 bg-red-500/5"}`}>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant={getStatusVariant()}>
                {!ready || connected ? "服务正常" : reconnecting ? "重连中" : "服务离线"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {!ready || connected
                ? `${health?.name ?? "InkOS Server"} 已连接，当前可执行 chat / Tool UI / Draft 事务。`
                : reconnecting
                  ? "连接暂时中断，正在自动重连。当前禁止写操作，事件流恢复后会刷新运行状态。"
                  : "无法连接到 InkOS Server。当前进入只读引导态，不展示过期运行时数据。"}
            </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
