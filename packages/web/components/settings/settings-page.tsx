"use client";

import { useEffect, useState } from "react";
import { getSettingsOverview } from "../../lib/api";
import type { SettingsOverview } from "../../lib/contracts";
import { WorkbenchHeader } from "../chrome/workbench-header";
import { ErrorPanel } from "../common/error-panel";
import { LoadingPanel } from "../common/loading-panel";

const sections = [
  { id: "llm", label: "LLM" },
  { id: "notifications", label: "通知" },
  { id: "skills", label: "Skills" },
  { id: "advanced", label: "高级" },
] as const;

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
    <div className="page-shell">
      <WorkbenchHeader
        eyebrow="Settings"
        title="设置中心"
        description="设置页承载模型路由、通知和系统边界。这里展示真实运行配置，不承载复杂审批流程。"
      />
      {loading ? <LoadingPanel title="加载设置中..." /> : null}
      {error ? <ErrorPanel description={error} /> : null}
      {!loading && !error && overview ? (
        <div className="settings-layout">
          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Sections</p>
                <h2 className="section-title">{sections.find((item) => item.id === sectionId)?.label}</h2>
              </div>
              <div className="status-pill active">v3 baseline</div>
            </div>
            <div className="settings-tabs">
              {sections.map((item) => (
                <button key={item.id} type="button" className={item.id === sectionId ? "active" : ""} onClick={() => setSectionId(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="divider" />
            {sectionId === "llm" ? (
              <div className="mini-grid">
                <div className="mini-card">
                  <span className="subtle">Provider</span>
                  <strong>{overview.llm.provider}</strong>
                </div>
                <div className="mini-card">
                  <span className="subtle">Primary</span>
                  <strong>{overview.llm.model}</strong>
                </div>
                <div className="mini-card">
                  <span className="subtle">Fallback</span>
                  <strong>{overview.llm.fallbackModel}</strong>
                </div>
                <div className="mini-card">
                  <span className="subtle">API Key</span>
                  <strong>{overview.llm.hasApiKey ? "已注入" : "未注入"}</strong>
                </div>
              </div>
            ) : null}
            {sectionId === "notifications" ? (
              <div className="mini-grid">
                {overview.notifications.map((item) => (
                  <div key={item.label} className="mini-card">
                    <span className="subtle">{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            ) : null}
            {sectionId === "skills" ? (
              <div className="table-list">
                {overview.skills.map((item) => (
                  <div key={item.skillId} className="table-row">
                    <div>
                      <strong>{item.skillId}</strong>
                      <p>{item.note}</p>
                    </div>
                    <div>
                      <span className={`status-pill ${item.state === "stable" ? "success" : "warning"}`}>{item.state}</span>
                    </div>
                    <div>
                      <span className="subtle">{item.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {sectionId === "advanced" ? (
              <div className="mini-grid">
                {overview.advanced.map((item) => (
                  <div key={item.label} className="mini-card">
                    <span className="subtle">{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
          <aside className="inspector-stack">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Boundary</p>
                  <h2 className="section-title">为什么在这里</h2>
                </div>
                <div className="status-pill warning">非主工作台</div>
              </div>
              <div className="timeline">
                <div className="timeline-item">
                  <div>
                    <strong>模型路由</strong>
                    <p>{overview.llm.baseUrl}</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div>
                    <strong>Skill 可见性</strong>
                    <p>这里展示活跃技能与来源；实际执行仍回到 /chief 或专页。</p>
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
