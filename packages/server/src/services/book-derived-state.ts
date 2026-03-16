import type { BookRecord, TruthFileRecord } from "../contracts.js";
import type { DatabaseStore } from "../store/database.js";

function hasNegatedDrift(text: string): boolean {
  return /暂无\s*(drift|冲突|问题)|无\s*(drift|冲突|问题)|未发现\s*(drift|冲突|问题)/i.test(text);
}

function hasPositiveDrift(text: string): boolean {
  return /待修正|待校正|冲突|漂移|drift|问题/i.test(text);
}

export function countTruthIssues(files: TruthFileRecord[]): number {
  return files.filter((item) => {
    const text = `${item.note} ${item.content}`;
    return hasPositiveDrift(text) && !hasNegatedDrift(text);
  }).length;
}

export function deriveBookMetrics(store: DatabaseStore, book: BookRecord): BookRecord["metrics"] {
  return {
    materials: store.listMaterials(book.id).length,
    truthIssues: countTruthIssues(store.listTruthFiles(book.id)),
    pendingDrafts: store.listDrafts(book.id).filter((item) => item.status === "draft").length,
  };
}
