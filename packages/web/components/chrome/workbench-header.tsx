"use client";

import { useConnectionStatus } from "../../lib/connection-status";

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

  return (
    <>
      <header className="topbar">
        <div className="topbar-copy">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="topbar-actions">
          <div className="segmented" aria-label="Service health">
            <button type="button" className={connected ? "active" : ""}>
              Connected
            </button>
            <button type="button" className={reconnecting ? "active" : ""}>
              Reconnecting
            </button>
            <button type="button" className={status === "disconnected" ? "active" : ""}>
              Disconnected
            </button>
          </div>
          {actions}
        </div>
      </header>
      <div className={`connection-banner ${!ready || connected ? "success" : reconnecting ? "warning" : "danger"}`}>
        <div>
          <strong>{!ready || connected ? "服务正常" : reconnecting ? "重连中" : "服务离线"}</strong>
          <p className="section-copy">
            {!ready || connected
              ? `${health?.name ?? "InkOS Server"} 已连接，当前可执行 chat / Tool UI / Draft 事务。`
              : reconnecting
                ? "连接暂时中断，正在自动重连。当前禁止写操作，事件流恢复后会刷新运行状态。"
                : "无法连接到 InkOS Server。当前进入只读引导态，不展示过期运行时数据。"}
          </p>
        </div>
      </div>
    </>
  );
}
