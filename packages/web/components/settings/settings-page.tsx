"use client";

import { useEffect, useState } from "react";
import { getSettingsOverview } from "../../lib/api";
import type { SettingsOverview } from "../../lib/contracts";
import { WorkbenchHeader } from "../chrome/workbench-header";
import { ErrorPanel } from "../common/error-panel";
import { LoadingPanel } from "../common/loading-panel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Separator } from "../ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

const sections = [
  { id: "llm", label: "LLM" },
  { id: "notifications", label: "通知" },
  { id: "skills", label: "Skills" },
  { id: "advanced", label: "高级" },
] as const;

// Skill 状态映射到 Badge variant
function getSkillStateVariant(state: string): "default" | "secondary" | "destructive" | "outline" {
  return state === "stable" ? "secondary" : "outline";
}

export function SettingsPage() {
  const [sectionId, setSectionId] = useState<(typeof sections)[number]["id"]>("llm");
  const [overview, setOverview] = useState<SettingsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        setOverview(await getSettingsOverview());
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "设置页加载失败");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  return (
    <div className="space-y-4">
      <WorkbenchHeader
        eyebrow="Settings"
        title="设置中心"
        description="设置页承载模型路由、通知和系统边界。这里展示真实运行配置，不承载复杂审批流程。"
      />
      {loading ? <LoadingPanel title="加载设置中..." /> : null}
      {error ? <ErrorPanel description={error} /> : null}
      {!loading && !error && overview ? (
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Sections</p>
                  <CardTitle className="text-lg">{sections.find((item) => item.id === sectionId)?.label}</CardTitle>
                </div>
                <Badge variant="default">v3 baseline</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 使用 shadcn Tabs 做设置分类 */}
              <Tabs value={sectionId} onValueChange={(value) => setSectionId(value as typeof sectionId)} className="w-full">
                <TabsList>
                  {sections.map((item) => (
                    <TabsTrigger key={item.id} value={item.id}>
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="llm" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Provider</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="font-medium">{overview.llm.provider}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Primary</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="font-medium">{overview.llm.model}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>Fallback</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="font-medium">{overview.llm.fallbackModel}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardDescription>API Key</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Badge variant={overview.llm.hasApiKey ? "secondary" : "outline"}>
                          {overview.llm.hasApiKey ? "已注入" : "未注入"}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {overview.notifications.map((item) => (
                      <Card key={item.label}>
                        <CardHeader className="pb-2">
                          <CardDescription>{item.label}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="font-medium">{item.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="skills" className="space-y-4 mt-4">
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Skill ID</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>来源</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {overview.skills.map((item) => (
                            <TableRow key={item.skillId}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{item.skillId}</p>
                                  <p className="text-sm text-muted-foreground">{item.note}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getSkillStateVariant(item.state)}>{item.state}</Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{item.source}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {overview.advanced.map((item) => (
                      <Card key={item.label}>
                        <CardHeader className="pb-2">
                          <CardDescription>{item.label}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="font-medium">{item.value}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 侧边栏 */}
          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Boundary</p>
                    <CardTitle className="text-lg">为什么在这里</CardTitle>
                  </div>
                  <Badge variant="outline">非主工作台</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="font-medium">模型路由</div>
                  <p className="text-sm text-muted-foreground">公开设置页只展示 provider / model / key 是否注入，内部地址已移至受保护接口。</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="font-medium">Skill 可见性</div>
                  <p className="text-sm text-muted-foreground">这里展示活跃技能与来源；实际执行仍回到 /chief 或专页。</p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
