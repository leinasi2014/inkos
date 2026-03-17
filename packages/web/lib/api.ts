import type {
  ApiResponse,
  AutomationOverview,
  BookRecord,
  ChapterAuditRecord,
  ChapterRecord,
  DraftArtifact,
  HealthRecord,
  MaterialRecord,
  MessageRecord,
  ResourceRecord,
  RunRecord,
  SettingsOverview,
  ThreadRecord,
  TruthFileRecord,
} from "./contracts";

const API_BASE = process.env.NEXT_PUBLIC_INKOS_API_BASE ?? "http://127.0.0.1:7749";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  const payload = (await response.json()) as ApiResponse<T> | { error: { message: string } };
  if (!response.ok || !("data" in payload)) {
    throw new Error("error" in payload ? payload.error.message : `Request failed: ${response.status}`);
  }
  return payload.data;
}

export function getApiBase(): string {
  return API_BASE;
}

export function getHealth() {
  return getJson<HealthRecord>("/api/v1/health");
}

export function listThreads(params?: { scope?: string; bookId?: string }) {
  const query = new URLSearchParams();
  if (params?.scope) query.set("scope", params.scope);
  if (params?.bookId) query.set("bookId", params.bookId);
  return getJson<ThreadRecord[]>(`/api/v1/threads${query.size > 0 ? `?${query.toString()}` : ""}`);
}

export function getThreadMessages(threadId: string) {
  return getJson<MessageRecord[]>(`/api/v1/threads/${threadId}/messages`);
}

export function getRun(runId: string) {
  return getJson<RunRecord>(`/api/v1/runs/${runId}`);
}

export function listBooks() {
  return getJson<BookRecord[]>("/api/v1/books");
}

export function getBook(bookId: string) {
  return getJson<BookRecord>(`/api/v1/books/${bookId}`);
}

export function listChapters(bookId: string) {
  return getJson<ChapterRecord[]>(`/api/v1/books/${bookId}/chapters`);
}

export function getChapter(bookId: string, chapterNumber: number) {
  return getJson<ChapterRecord>(`/api/v1/books/${bookId}/chapters/${chapterNumber}`);
}

export function getChapterAudit(bookId: string, chapterNumber: number) {
  return getJson<ChapterAuditRecord>(`/api/v1/books/${bookId}/chapters/${chapterNumber}/audit`);
}

export function listTruthFiles(bookId: string) {
  return getJson<TruthFileRecord[]>(`/api/v1/books/${bookId}/truth`);
}

export function getTruthFile(bookId: string, fileName: string) {
  return getJson<TruthFileRecord>(`/api/v1/books/${bookId}/truth/${fileName}`);
}

export function listMaterials(bookId: string) {
  return getJson<MaterialRecord[]>(`/api/v1/books/${bookId}/materials`);
}

export function listDrafts(bookId: string) {
  return getJson<DraftArtifact[]>(`/api/v1/books/${bookId}/drafts`);
}

export function getMaterial(bookId: string, materialId: string) {
  return getJson<MaterialRecord>(`/api/v1/books/${bookId}/materials/${materialId}`);
}

export function getAutomationOverview() {
  return getJson<AutomationOverview>("/api/v1/system/automation");
}

export function getSettingsOverview() {
  return getJson<SettingsOverview>("/api/v1/system/settings");
}

export function getDraft(draftId: string) {
  return getJson<DraftArtifact>(`/api/v1/drafts/${draftId}`);
}

export function getResource(refId: string) {
  return getJson<ResourceRecord>(`/api/v1/resources/${refId}`);
}
