"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appIcons } from "./icons";
import { useUiStore } from "../../lib/ui-store";
import { useConnectionStatus } from "../../lib/connection-status";

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

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname === "/dashboard";
    if (href === "/books") return bookActive;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="v3-shell" data-theme={theme}>
      <aside className="global-rail">
        <div className="rail-stack">
          <Link href="/" className="brand-mark" aria-label="InkOS">
            {appIcons.brand}
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rail-link ${isActive(item.href) ? "active" : ""}`}
              aria-label={item.label}
            >
              {item.icon}
            </Link>
          ))}
        </div>
        <div className="utility-stack">
          <Link href="/settings" className={`rail-link ${pathname === "/settings" ? "active" : ""}`} aria-label="Settings">
            {appIcons.settings}
          </Link>
          <button
            type="button"
            className="theme-toggle"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "light" ? appIcons.themeDark : appIcons.themeLight}
          </button>
        </div>
      </aside>
      <main className={`workspace ${connection.status !== "connected" ? "workspace-blocked" : ""}`}>{children}</main>
      <nav className="mobile-nav">
        <Link href="/" className={isActive("/") ? "active" : ""} aria-label="Dashboard">
          {appIcons.dashboard}
        </Link>
        <Link href="/chief" className={isActive("/chief") ? "active" : ""} aria-label="Chief">
          {appIcons.chief}
        </Link>
        <Link href="/books" className={isActive("/books") ? "active" : ""} aria-label="Books">
          {appIcons.books}
        </Link>
        <Link href="/automation" className={isActive("/automation") ? "active" : ""} aria-label="Automation">
          {appIcons.automation}
        </Link>
        <Link href="/settings" className={isActive("/settings") ? "active" : ""} aria-label="Settings">
          {appIcons.settings}
        </Link>
      </nav>
      {connection.ready && connection.status === "reconnecting" ? (
        <div className="reconnect-overlay" role="status" aria-live="polite">
          <div className="reconnect-card">
            <strong>正在重连 InkOS Server</strong>
            <p>写操作已暂时禁用，事件流恢复后会自动继续当前视图。</p>
          </div>
        </div>
      ) : null}
      {connection.ready && connection.status === "disconnected" ? (
        <div className="offline-overlay" role="alert">
          <div className="offline-card">
            <p className="eyebrow">Server Offline</p>
            <h2>InkOS Server 未启动</h2>
            <p>当前不展示可写运行时，先把后端拉起来，再返回本页继续 loop 开发。</p>
            <div className="command-stack">
              <code>pnpm dev:hidden:server</code>
              <code>pnpm dev:hidden:stack</code>
              <code>http://127.0.0.1:7749/api/v1/health</code>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
