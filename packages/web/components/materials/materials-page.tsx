"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getBook, listDrafts, listMaterials } from "../../lib/api";
import { buildBookThreadId, getChiefHref } from "../../lib/book-links";
import type { BookRecord, DraftArtifact, MaterialRecord } from "../../lib/contracts";
import { useLiveEvents } from "../../lib/use-live-events";
import { BookContextNav } from "../books/book-context-nav";
import { WorkbenchHeader } from "../chrome/workbench-header";
import { ErrorPanel } from "../common/error-panel";
import { LoadingPanel } from "../common/loading-panel";

type MaterialType = "character" | "faction" | "location";

export function MaterialsPage({ bookId }: { bookId: string }) {
  const [book, setBook] = useState<BookRecord | null>(null);
  const [materials, setMaterials] = useState<MaterialRecord[]>([]);
  const [drafts, setDrafts] = useState<DraftArtifact[]>([]);
  const [selectedType, setSelectedType] = useState<MaterialType>("character");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveVersion, setLiveVersion] = useState(0);
  const scheduleRef = useRef<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        const [nextBook, nextMaterials, nextDrafts] = await Promise.all([getBook(bookId), listMaterials(bookId), listDrafts(bookId)]);
        setBook(nextBook);
        setMaterials(nextMaterials);
        setDrafts(nextDrafts);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Materials 加载失败");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [bookId, liveVersion]);

  useLiveEvents({
    enabled: Boolean(bookId),
    isRelevant: (event) => event.threadId.includes(bookId) || String(event.payload.bookId ?? "") === bookId,
    onEvent: () => {
      if (scheduleRef.current) return;
      scheduleRef.current = window.setTimeout(() => {
        scheduleRef.current = null;
        setLiveVersion((value) => value + 1);
      }, 150);
    },
    onError: (nextError) => {
      setError(nextError.message);
    },
  });

  useEffect(() => () => {
    if (scheduleRef.current) window.clearTimeout(scheduleRef.current);
  }, []);

  const filteredMaterials = useMemo(
    () => materials.filter((item) => item.type === selectedType),
    [materials, selectedType],
  );
  const filteredDrafts = useMemo(
    () => drafts.filter((item) => item.type === selectedType),
    [drafts, selectedType],
  );
  const latestDraft = filteredDrafts[0] ?? null;

  return (
    <div className="page-shell">
      <WorkbenchHeader
        eyebrow="Materials Center"
        title="素材中心"
        description={`${book?.title ?? "当前书籍"} 的角色、阵营、地点素材统一从 DraftArtifact 与已落库 materials 推导展示。`}
        actions={
          <Link className="button primary" href={getChiefHref(buildBookThreadId(bookId, "materials"))}>
            回到 /chief 素材线程
          </Link>
        }
      />
      {loading ? <LoadingPanel title="加载素材中心中..." /> : null}
      {error ? <ErrorPanel description={error} /> : null}
      {!loading && !error && book ? (
        <div className="books-layout">
          <section className="thread-main">
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Frozen Types</p>
                  <h2 className="section-title">首批 3 类素材</h2>
                </div>
                <div className="status-pill success">character / faction / location</div>
              </div>
              <div className="settings-tabs">
                {(["character", "faction", "location"] as MaterialType[]).map((type) => (
                  <button key={type} type="button" className={selectedType === type ? "active" : ""} onClick={() => setSelectedType(type)}>
                    {type}
                  </button>
                ))}
              </div>
              <div className="table-list">
                {filteredMaterials.length > 0 ? (
                  filteredMaterials.map((material) => {
                    const preview = material.payload as Record<string, unknown>;
                    return (
                      <div key={material.materialId} className="table-row">
                        <div>
                          <strong>{material.name}</strong>
                          <p>{String(preview.summary ?? material.note)}</p>
                        </div>
                        <div>
                          <span className={`status-pill ${material.status === "applied" ? "success" : "warning"}`}>{material.status}</span>
                        </div>
                        <div>
                          <span className="subtle">{material.provenance}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <strong>当前类型还没有已落库素材</strong>
                    <p>从 /chief 生成候选并应用保存后，这里会立即展示。</p>
                  </div>
                )}
              </div>
            </section>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Draft Timeline</p>
                  <h2 className="section-title">最近草案</h2>
                </div>
                <div className={`status-pill ${latestDraft?.status === "applied" ? "success" : latestDraft ? "warning" : ""}`}>{latestDraft?.status ?? "暂无草案"}</div>
              </div>
              {filteredDrafts.length > 0 ? (
                <div className="timeline">
                  {filteredDrafts.slice(0, 4).map((draft) => {
                    const preview = draft.preview as Record<string, unknown>;
                    const conflicts = Array.isArray(preview.conflicts) ? preview.conflicts : [];
                    return (
                      <div key={draft.draftId} className="timeline-item">
                        <div>
                          <strong>{String(preview.title ?? "未命名候选")}</strong>
                          <p>{String(preview.summary ?? preview.fit ?? "")}</p>
                          {conflicts.length > 0 ? (
                            <p className="subtle">{`同名冲突 ${conflicts.length} 条，应用时会要求确认覆盖。`}</p>
                          ) : null}
                        </div>
                        <div className={`status-pill ${draft.status === "applied" ? "success" : draft.status === "discarded" ? "danger" : "warning"}`}>
                          {draft.status}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <strong>暂无可回放草案</strong>
                  <p>当前这本书还没有生成过该类型的 materials 草案。</p>
                </div>
              )}
            </section>
          </section>
          <aside className="inspector-stack">
            <BookContextNav book={book} />
            <section className="panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">Bridge</p>
                  <h2 className="section-title">来源追踪</h2>
                </div>
                <div className="status-pill active">materials_summary.md</div>
              </div>
              {latestDraft ? (
                <div className="timeline">
                  <div className="timeline-item">
                    <div>
                      <strong>sourceThreadId</strong>
                      <p>{latestDraft.sourceThreadId}</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div>
                      <strong>sourceRunId</strong>
                      <p>{latestDraft.sourceRunId}</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div>
                      <strong>etag</strong>
                      <p>{latestDraft.etag}</p>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div>
                      <strong>bridge note</strong>
                      <p>{String((latestDraft.preview as Record<string, unknown>).bridgeNote ?? "应用后会同步写回 materials summary。")}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <strong>暂无来源信息</strong>
                  <p>当前书籍还没有已生成的 materials 草案。</p>
                </div>
              )}
            </section>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
