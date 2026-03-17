"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getAutomationOverview } from "../../lib/api";
import type { AutomationOverview } from "../../lib/contracts";
import { useLiveEvents } from "../../lib/use-live-events";
import { WorkbenchHeader } from "../chrome/workbench-header";
import { ErrorPanel } from "../common/error-panel";
import { LoadingPanel } from "../common/loading-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Separator } from "../ui/separator";

// 状态映射到 Badge variant
function getStateVariant(state: string): "default" | "secondary" | "destructive" | "outline" {
  if (state === "running") return "secondary";
  if (state === "blocked") return "outline";
  return "default";
}

function getLevelVariant(level: string): "default" | "secondary" | "destructive" | "outline" {
  if (level === "success") return "secondary";
  if (level === "warning") return "outline";
  return "default";
}

export function AutomationPage() {
  const [overview, setOverview] = useState<AutomationOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveVersion, setLiveVersion] = useState(0);
  const scheduleRef = useRef<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        setOverview(await getAutomationOverview());
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "调度中心加载失败");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [liveVersion]);

  useLiveEvents({
    onEvent: () => {
      if (scheduleRef.current) return;
      scheduleRef.current = window.setTimeout(() => {
        scheduleRef.current = null;
        setLiveVersion((value) => value + 1);
      }, 200);
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
        eyebrow="Automation"
        title="调度中心"
        description="这里展示系统守护状态、待处理队列和最近回放日志，审批决策仍回到 /chief 或专页。"
      />
      {loading ? <LoadingPanel title="加载调度状态中..." /> : null}
      {error ? <ErrorPanel description={error} /> : null}
      {!loading && !error && overview ? (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <section className="space-y-4">
            {/* 守护状态 - 使用 Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Daemon</p>
                    <CardTitle className="text-lg">守护状态</CardTitle>
                  </div>
                  <Badge variant={overview.daemonStatus === "healthy" ? "secondary" : "outline"}>
                    {overview.daemonStatus}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>workers</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-2xl font-bold">{overview.workerCount}</p>
                      <p className="text-sm text-muted-foreground">当前并发 worker 池</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>next inspection</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-2xl font-bold">{overview.nextInspectionAt.slice(11, 16)}</p>
                      <p className="text-sm text-muted-foreground">下一次 truth 漂移巡检</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>write cron</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-2xl font-bold">{overview.writeCron}</p>
                      <p className="text-sm text-muted-foreground">自动巡查计划</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* 当前队列 - 使用 Table */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Queue</p>
                    <CardTitle className="text-lg">当前队列</CardTitle>
                  </div>
                  <Badge variant="outline">{overview.queue.length} jobs</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>任务</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>范围</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.queue.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Link href={item.targetHref} className="block hover:underline">
                            <div className="font-medium">{item.task}</div>
                            <p className="text-sm text-muted-foreground">{item.note}</p>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStateVariant(item.state)}>{item.state}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.scope}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>

          {/* 侧边栏 - 最近日志 */}
          <aside>
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">History</p>
                    <CardTitle className="text-lg">最近日志</CardTitle>
                  </div>
                  <Badge variant="default">实时回放</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overview.recentLogs.map((line, index) => {
                    const content = (
                      <div key={line.id} className="grid grid-cols-[auto_1fr] gap-2 py-2 -mx-2 px-2 rounded hover:bg-accent/50">
                        <span className="text-muted-foreground text-xs">{index + 1}</span>
                        <span className="text-sm text-muted-foreground">
                          {line.timestamp.slice(11, 16)} · {line.sourceLabel} ·{" "}
                          <Badge variant={getLevelVariant(line.level)} className="text-xs">
                            {line.category}
                          </Badge>{" "}
                          · {line.text}
                        </span>
                      </div>
                    );
                    return line.targetHref ? (
                      <Link key={line.id} href={line.targetHref} className="block">
                        {content}
                      </Link>
                    ) : (
                      <div key={line.id}>{content}</div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
