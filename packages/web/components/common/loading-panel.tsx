"use client";

export function LoadingPanel({ title = "加载中...", description = "正在读取当前页面所需的数据。" }: { title?: string; description?: string }) {
  return (
    <section className="panel empty-state">
      <strong>{title}</strong>
      <p>{description}</p>
    </section>
  );
}
