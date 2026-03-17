import { type AckEnvelope, CommandEnvelopeSchema, type EventEnvelope } from "../contracts.js";
import { InkOSError } from "../errors.js";
import { createId, nowIso } from "../id.js";
import type { DatabaseStore } from "../store/database.js";
import {
  applyDraft,
  approveAction,
  cancelAction,
  cancelRun,
  discardDraft,
  editDraft,
  handleUserMessage,
  rejectAction,
  regenerateDraft,
  submitForm,
} from "./runtime-flows.js";
import { deriveBookMetrics } from "./book-derived-state.js";
import { hydrateRunToolPresentations } from "./runtime-internals.js";
import type { RuntimeLLM } from "./runtime-llm.js";

type WebSocketLike = {
  readyState: number;
  send: (payload: string) => void;
};

export class RuntimeService {
  // 按 threadId 建立订阅表，避免不同线程事件继续全量广播给所有连接。
  private readonly subscriptions = new Map<WebSocketLike, Set<string> | null>();

  constructor(
    readonly store: DatabaseStore,
    readonly llm: RuntimeLLM | null = null,
  ) {}

  subscribeClient(socket: WebSocketLike, threadIds: ReadonlyArray<string>): void {
    this.subscriptions.set(socket, threadIds.length > 0 ? new Set(threadIds) : null);
  }

  removeClient(socket: WebSocketLike): void {
    this.subscriptions.delete(socket);
  }

  listThreads(filters?: { scope?: string; bookId?: string }) {
    return this.store.listThreads(filters);
  }

  getThread(threadId: string) {
    const thread = this.store.getThread(threadId);
    if (!thread) throw new InkOSError("RUN.NOT_FOUND", `Thread ${threadId} 不存在`, { statusCode: 404 });
    return thread;
  }

  listMessages(threadId: string) {
    return this.store.listMessages(threadId);
  }

  listBooks() {
    return this.store.listBooks();
  }

  getBook(bookId: string) {
    const book = this.store.getBook(bookId);
    if (!book) throw new InkOSError("RUN.NOT_FOUND", `Book ${bookId} 不存在`, { statusCode: 404 });
    return book;
  }

  syncBookDerivedState(bookId: string): void {
    // 派生指标只在写路径同步，避免 GET 接口读取时反向触发写库。
    const book = this.store.getBook(bookId);
    if (!book) return;

    this.store.saveBook({
      ...book,
      metrics: deriveBookMetrics(this.store, book),
      updatedAt: nowIso(),
    });
  }

  listChapters(bookId: string) {
    this.ensureCurrentChapterRecord(bookId);
    return this.store.listChapters(bookId);
  }

  getChapter(bookId: string, chapterNumber: number) {
    this.ensureCurrentChapterRecord(bookId);
    const chapter = this.store.getChapter(bookId, chapterNumber);
    if (!chapter) throw new InkOSError("RUN.NOT_FOUND", `Chapter ${chapterNumber} 不存在`, { statusCode: 404 });
    return chapter;
  }

  listTruthFiles(bookId: string) {
    return this.store.listTruthFiles(bookId);
  }

  getTruthFile(bookId: string, fileName: string) {
    const file = this.store.getTruthFile(bookId, fileName);
    if (!file) throw new InkOSError("RUN.NOT_FOUND", `${fileName} 不存在`, { statusCode: 404 });
    return file;
  }

  listMaterials(bookId: string) {
    return this.store.listMaterials(bookId);
  }

  getMaterial(bookId: string, materialId: string) {
    const material = this.store.getMaterial(bookId, materialId);
    if (!material) throw new InkOSError("RUN.NOT_FOUND", `Material ${materialId} 不存在`, { statusCode: 404 });
    return material;
  }

  getDraft(draftId: string) {
    const draft = this.store.getDraft(draftId);
    if (!draft) throw new InkOSError("DRAFT.NOT_FOUND", `Draft ${draftId} 不存在`, { statusCode: 404 });
    return draft;
  }

  listDrafts(bookId?: string) {
    return this.store.listDrafts(bookId);
  }

  getRun(runId: string) {
    const run = this.store.getRun(runId);
    if (!run) throw new InkOSError("RUN.NOT_FOUND", `Run ${runId} 不存在`, { statusCode: 404 });
    return hydrateRunToolPresentations(run);
  }

  listRunEvents(runId: string) {
    return this.store.listRunEvents(runId);
  }

  getResource(refId: string) {
    const resource = this.store.getResource(refId);
    if (!resource) throw new InkOSError("RUN.NOT_FOUND", `Resource ${refId} 不存在`, { statusCode: 404 });
    return resource;
  }

  replayAfter(lastCursor: number, threadIds: ReadonlyArray<string> = [], limit = 100): { events: EventEnvelope[]; nextCursor?: number } {
    const normalizedLimit = Math.max(1, limit);
    const records = this.store.listEventsAfter(lastCursor, normalizedLimit + 1, threadIds);
    const page = records.slice(0, normalizedLimit);
    return {
      events: page.map((event) => ({
        type: "event",
        eventId: event.eventId,
        event: event.event,
        runId: event.runId,
        threadId: event.threadId,
        cursor: event.cursor,
        payload: event.payload,
      })),
      ...(records.length > normalizedLimit && page.length > 0 ? { nextCursor: page[page.length - 1]?.cursor } : {}),
    };
  }

  async handleRawCommand(raw: unknown): Promise<AckEnvelope> {
    const envelope = CommandEnvelopeSchema.parse(raw);
    const duplicate = this.store.getCommandResult(envelope.commandId);
    if (duplicate) return JSON.parse(duplicate) as AckEnvelope;
    const ack = await this.handleCommand(envelope);
    this.store.saveCommandResult(envelope.commandId, JSON.stringify(ack));
    return ack;
  }

  private async handleCommand(envelope: ReturnType<typeof CommandEnvelopeSchema.parse>): Promise<AckEnvelope> {
    switch (envelope.command) {
      case "send_message":
        return await handleUserMessage(this, envelope.commandId, envelope.payload.threadId, envelope.payload.content);
      case "submit_form":
        return submitForm(this, envelope.commandId, envelope.payload.runId, envelope.payload.threadId, envelope.payload.formData);
      case "approve_action":
        return approveAction(this, envelope.commandId, envelope.payload.runId, envelope.payload.threadId, envelope.payload.approvalId);
      case "reject_action":
        return rejectAction(this, envelope.commandId, envelope.payload.runId, envelope.payload.threadId);
      case "cancel_action":
        return cancelAction(this, envelope.commandId, envelope.payload.runId, envelope.payload.threadId);
      case "apply_draft":
        return applyDraft(this, envelope.commandId, envelope.payload.draftId, envelope.payload.revision, envelope.payload.etag);
      case "discard_draft":
        return discardDraft(this, envelope.commandId, envelope.payload.draftId, envelope.payload.revision, envelope.payload.etag);
      case "edit_draft":
        return editDraft(this, envelope.commandId, envelope.payload.draftId, envelope.payload.revision, envelope.payload.etag, envelope.payload.changes);
      case "regenerate_draft":
        return regenerateDraft(this, envelope.commandId, envelope.payload.draftId, envelope.payload.revision, envelope.payload.etag, envelope.payload.instruction);
      case "cancel_run":
        return cancelRun(this, envelope.commandId, envelope.payload.runId);
      case "resume":
        return { type: "ack", commandId: envelope.commandId, success: true };
    }

    throw new InkOSError("COMMAND.UNSUPPORTED", "不支持的命令类型。", { statusCode: 400 });
  }

  emitEvent(runId: string, threadId: string, event: string, payload: unknown): void {
    const record = this.store.saveEvent({ eventId: createId("evt"), event, runId, threadId, payload, createdAt: nowIso() });
    const run = this.store.getRun(runId);
    if (run) this.store.saveRun({ ...run, eventCursor: record.cursor, lastPersistedAt: record.createdAt });

    const envelope: EventEnvelope = {
      type: "event",
      eventId: record.eventId,
      event,
      runId,
      threadId,
      cursor: record.cursor,
      payload,
    };

    const serialized = JSON.stringify(envelope);
    for (const [client, threadIds] of this.subscriptions) {
      if (client.readyState === 1 && (!threadIds || threadIds.has(threadId))) {
        client.send(serialized);
      }
    }
  }

  private ensureCurrentChapterRecord(bookId: string): void {
    const book = this.store.getBook(bookId);
    if (!book) return;
    const existing = this.store.getChapter(bookId, book.currentChapter);
    if (existing) return;

    const createdAt = nowIso();
    this.store.saveChapter({
      bookId,
      chapterNumber: book.currentChapter,
      title: `第${book.currentChapter}章 当前进度占位`,
      status: "draft",
      wordCount: 0,
      auditStatus: "pending",
      content: "这是 server 为修复 currentChapter 与 chapter 记录不一致而自动补的占位章节。",
      createdAt,
      updatedAt: createdAt,
    });
  }
}
