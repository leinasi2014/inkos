"use client";

export function ErrorPanel({ title = "加载失败", description }: { title?: string; description: string }) {
  return (
    <section className="panel empty-state danger">
      <strong>{title}</strong>
      <p>{description}</p>
    </section>
  );
}
