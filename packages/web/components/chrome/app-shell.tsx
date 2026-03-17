"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { appIcons } from "./icons";
import { useUiStore } from "../../lib/ui-store";
import { useConnectionStatus } from "../../lib/connection-status";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

interface AppShellProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: appIcons.dashboard },
  { href: "/chief", label: "Chief", icon: appIcons.chief },
  { href: "/books", label: "Books", icon: appIcons.books },
  { href: "/automation", label: "Automation", icon: appIcons.automation },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const connection = useConnectionStatus();
  const bookActive = pathname.startsWith("/books");

  // 同步 theme 到 documentElement 的 class，支持 shadcn/ui 的 .dark 类
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname === "/dashboard";
    if (href === "/books") return bookActive;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="min-h-screen grid grid-cols-[60px_minmax(0,1fr)] lg:grid-cols-[60px_minmax(0,1fr)]" data-theme={theme}>
      {/* 侧边栏 - 使用 Tailwind 工具类，在移动端隐藏 */}
      <aside className="hidden lg:flex sticky top-0 min-h-screen flex-col justify-between items-center py-3 px-0 border-r border-border bg-muted">
        <div className="w-full flex flex-col items-stretch gap-1">
          <Link href="/" className="grid place-items-center w-full h-8 border-0 bg-transparent text-muted-foreground" aria-label="InkOS">
            {appIcons.brand}
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`grid place-items-center w-full h-10 border-0 bg-transparent text-muted-foreground rounded-r-md transition-colors hover:bg-accent hover:text-foreground ${
                isActive(item.href)
                  ? "text-primary bg-accent/50 shadow-[inset_3px_0_0_var(--color-primary)]"
                  : ""
              }`}
              aria-label={item.label}
            >
              {item.icon}
            </Link>
          ))}
        </div>
        <div className="w-full flex flex-col items-center">
          <Link
            href="/settings"
            className={`grid place-items-center w-full h-10 border-0 bg-transparent text-muted-foreground rounded-r-md transition-colors hover:bg-accent hover:text-foreground ${
              pathname === "/settings"
                ? "text-primary bg-accent/50 shadow-[inset_3px_0_0_var(--color-primary)]"
                : ""
            }`}
            aria-label="Settings"
          >
            {appIcons.settings}
          </Link>
          <button
            type="button"
            className="grid place-items-center w-full h-10 border-0 bg-transparent text-muted-foreground rounded-r-md transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? appIcons.themeDark : appIcons.themeLight}
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className={`min-w-0 p-4 pb-16 lg:p-5 lg:pb-5 ${connection.status !== "connected" ? "relative" : ""}`}>{children}</main>

      {/* 移动端导航 - 使用 Tailwind 工具类，在 960px 以下显示 */}
      <nav className="fixed left-3 right-3 bottom-3 z-50 lg:hidden grid grid-cols-[repeat(5,minmax(0,1fr))] gap-1.5 p-1.5 border border-border/40 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-lg">
        <Link href="/" className={isActive("/") ? "flex flex-col items-center justify-center gap-1 min-h-[44px] rounded-xl bg-accent text-primary" : "flex flex-col items-center justify-center gap-1 min-h-[44px] rounded-xl text-muted-foreground hover:bg-accent/50"} aria-label="Dashboard">
          <span className="text-xl">{appIcons.dashboard}</span>
          <span className="text-[10px] font-medium">首页</span>
        </Link>
        <Link href="/chief" className={isActive("/chief") ? "flex flex-col items-center justify-center gap-1 min-h-[44px] rounded-xl bg-accent text-primary" : "flex flex-col items-center justify-center gap-1 min-h-[44px] rounded-xl text-muted-foreground hover:bg-accent/50"} aria-label="Chief">
          <span className="text-xl">{appIcons.chief}</span>
          <span className="text-[10px] font-medium">主编</span>
        </Link>
        <Link href="/books" className={isActive("/books") ? "flex flex-col items-center justify-center gap-1 min-h-[44px] rounded-xl bg-accent text-primary" : "flex flex-col items-center justify-center gap-1 min-h-[44px] rounded-xl text-muted-foreground hover:bg-accent/50"} aria-label="Books">
          <span className="text-xl">{appIcons.books}</span>
          <span className="text-[10px] font-medium">书籍</span>
        </Link>
        <Link href="/automation" className={isActive("/automation") ? "flex flex-col items-center justify-center gap-1 min-h-[44px] rounded-xl bg-accent text-primary" : "flex flex-col items-center justify-center gap-1 min-h-[44px] rounded-xl text-muted-foreground hover:bg-accent/50"} aria-label="Automation">
          <span className="text-xl">{appIcons.automation}</span>
          <span className="text-[10px] font-medium">调度</span>
        </Link>
        <Link href="/settings" className={isActive("/settings") ? "flex flex-col items-center justify-center gap-1 min-h-[44px] rounded-xl bg-accent text-primary" : "flex flex-col items-center justify-center gap-1 min-h-[44px] rounded-xl text-muted-foreground hover:bg-accent/50"} aria-label="Settings">
          <span className="text-xl">{appIcons.settings}</span>
          <span className="text-[10px] font-medium">设置</span>
        </Link>
      </nav>

      {/* 重连提示 - 使用 shadcn Card */}
      {connection.ready && connection.status === "reconnecting" ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-white/20 backdrop-blur-sm" role="status" aria-live="polite">
          <Card className="w-[min(560px,calc(100vw-2rem))] p-6">
            <CardContent className="p-0 space-y-2">
              <p className="font-medium">正在重连 InkOS Server</p>
              <p className="text-sm text-muted-foreground">写操作已暂时禁用，事件流恢复后会自动继续当前视图。</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* 离线提示 - 使用 shadcn Card */}
      {connection.ready && connection.status === "disconnected" ? (
        <div className="fixed inset-0 z-40 grid place-items-center p-6 bg-background/95" role="alert">
          <Card className="w-[min(560px,calc(100vw-2rem))] p-6 border border-border shadow-xl">
            <CardContent className="p-0 space-y-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Server Offline</p>
              <h2 className="text-2xl font-bold">InkOS Server 未启动</h2>
              <p className="text-muted-foreground">当前不展示可写运行时，先把后端拉起来，再返回本页继续 loop 开发。</p>
              <div className="grid gap-2 mt-5">
                <code className="block p-3 border border-border rounded-lg bg-muted text-sm">
                  pnpm dev:hidden:server
                </code>
                <code className="block p-3 border border-border rounded-lg bg-muted text-sm">
                  pnpm dev:hidden:stack
                </code>
                <code className="block p-3 border border-border rounded-lg bg-muted text-sm">
                  http://127.0.0.1:7749/api/v1/health
                </code>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
