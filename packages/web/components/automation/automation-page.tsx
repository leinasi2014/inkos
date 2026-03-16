"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getAutomationOverview } from "../../lib/api";
import type { AutomationOverview } from "../../lib/contracts";
import { useLiveEvents } from "../../lib/use-live-events";
import { WorkbenchHeader } from "../chrome/workbench-header";
import { ErrorPanel } from "../common/error-panel";
import { LoadingPanel } from "../common/loading-panel";

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
    <div className="page-shell">
      <WorkbenchHeader
        eyebrow="Automation"
        title="调度中心"
        description="这里展示系统守护状态、待处理队列和最近回放日志，审批决策仍回到 /chief 或专页。"
      />
      {loading ? <LoadingPanel title="加载调度状态中..." /> : null}
      {error ? <ErrorPanel description={error} /> : null}
      {!loading && !error && overview ? (
        <div className="automation-layout">
          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Daemon</p>
                <h2 className="section-title">守护状态</h2>
              </div>
              <div className={`status-pill ${overview.daemonStatus === "healthy" ? "success" : "warning"}`}>{overview.daemonStatus}</div>
            </div>
            <section className="metric-grid">
              <article className="metric-card">
                <span className="subtle">workers</span>
                <strong className="metric-value">{overview.workerCount}</strong>
                <p>当前并发 worker 池</p>
              </article>
              <article className="metric-card">
                <span className="subtle">next inspection</span>
                <strong className="metric-value">{overview.nextInspectionAt.slice(11, 16)}</strong>
                <p>下一次 truth 漂移巡检</p>
              </article>
              <article className="metric-card">
                <span className="subtle">write cron</span>
                <strong className="metric-value">{overview.writeCron}</strong>
                <p>自动巡查计划</p>
              </article>
            </section>
          </section>
          <section className="panel">
            <div className="panel-head">
              <div>
                <p className="eyebrow">Queue</p>
                <h2 className="section-title">当前队列</h2>
              </div>
              <div className="status-pill warning">{overview.queue.length} jobs</div>
            </div>
            <div className="table-list">
              {overview.queue.map((item) => (
                <Link key={item.id} href={item.targetHref} className="table-row">
                  <div>
                    <strong>{item.task}</strong>
                    <p>{item.note}</p>
                  </div>
                  <div>
                    <span className={`status-pill ${item.state === "running" ? "success" : item.state === "blocked" ? "warning" : ""}`}>{item.state}</span>
                  </div>
                  <div>
                    <span className="subtle">{item.scope}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <aside className="inspector-stack">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">History</p>
                  <h2 className="section-title">最近日志</h2>
                </div>
                <div className="status-pill active">实时回放</div>
              </div>
              <div className="log-list">
                {overview.recentLogs.map((line, index) => (
                  line.targetHref ? (
                    <Link key={line.id} href={line.targetHref} className="log-row">
                      <span>{index + 1}</span>
                      <span>
                        {line.timestamp.slice(11, 16)} · {line.sourceLabel} ·{" "}
                        <span className={`status-pill ${line.level === "success" ? "success" : line.level === "warning" ? "warning" : "active"}`}>
                          {line.category}
                        </span>{" "}
                        · {line.text}
                      </span>
                    </Link>
                  ) : (
                    <div key={line.id} className="log-row">
                      <span>{index + 1}</span>
                      <span>
                        {line.timestamp.slice(11, 16)} · {line.sourceLabel} ·{" "}
                        <span className={`status-pill ${line.level === "success" ? "success" : line.level === "warning" ? "warning" : "active"}`}>
                          {line.category}
                        </span>{" "}
                        · {line.text}
                      </span>
                    </div>
                  )
                ))}
              </div>
            </section>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
