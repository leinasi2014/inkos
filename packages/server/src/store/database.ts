import Database from "better-sqlite3";
import type {
  BookRecord,
  ChapterRecord,
  DraftArtifact,
  EventRecord,
  MaterialRecord,
  MessageRecord,
  ResourceRecord,
  RunRecord,
  SkillRef,
  ThreadRecord,
  TruthFileRecord,
} from "../contracts.js";
import { nowIso } from "../id.js";
import { createSeedData } from "./seed.js";

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

export class DatabaseStore {
  private readonly db: Database.Database;

  constructor(databasePath: string) {
    this.db = new Database(databasePath);
    this.db.pragma("journal_mode = WAL");
    this.createTables();
    this.seedIfEmpty();
  }

  listThreads(filters?: { scope?: string; bookId?: string }): ThreadRecord[] {
    let sql = "SELECT * FROM threads WHERE 1=1";
    const params: Array<string> = [];
    if (filters?.scope) {
      sql += " AND scope = ?";
      params.push(filters.scope);
    }
    if (filters?.bookId) {
      sql += " AND book_id = ?";
      params.push(filters.bookId);
    }
    sql += " ORDER BY last_message_at DESC";
    return (this.db.prepare(sql).all(...params) as Array<Record<string, unknown>>).map((row) => this.mapThread(row));
  }

  getThread(threadId: string): ThreadRecord | null {
    const row = this.db.prepare("SELECT * FROM threads WHERE thread_id = ?").get(threadId) as Record<string, unknown> | undefined;
    return row ? this.mapThread(row) : null;
  }

  saveThread(thread: ThreadRecord): void {
    this.db.prepare(
      `INSERT OR REPLACE INTO threads
      (thread_id, scope, title, book_id, chapter_number, last_run_id, last_message_at, archived, created_at)
      VALUES (@threadId, @scope, @title, @bookId, @chapterNumber, @lastRunId, @lastMessageAt, @archived, @createdAt)`,
    ).run({
      ...thread,
      bookId: thread.bookId ?? null,
      chapterNumber: thread.chapterNumber ?? null,
      lastRunId: thread.lastRunId ?? null,
      archived: thread.archived ? 1 : 0,
    });
  }

  listMessages(threadId: string): MessageRecord[] {
    return (this.db.prepare("SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC").all(threadId) as Array<Record<string, unknown>>).map((row) => this.mapMessage(row));
  }

  saveMessage(message: MessageRecord): void {
    this.db.prepare(
      `INSERT OR REPLACE INTO messages (message_id, thread_id, role, text, created_at)
      VALUES (@messageId, @threadId, @role, @text, @createdAt)`,
    ).run(message);
    this.db.prepare("UPDATE threads SET last_message_at = ? WHERE thread_id = ?").run(message.createdAt, message.threadId);
  }

  listBooks(): BookRecord[] {
    return (this.db.prepare("SELECT * FROM books ORDER BY updated_at DESC").all() as Array<Record<string, unknown>>).map((row) => this.mapBook(row));
  }

  getBook(bookId: string): BookRecord | null {
    const row = this.db.prepare("SELECT * FROM books WHERE id = ?").get(bookId) as Record<string, unknown> | undefined;
    return row ? this.mapBook(row) : null;
  }

  saveBook(book: BookRecord): void {
    this.db.prepare(
      `INSERT OR REPLACE INTO books
      (id, title, genre, phase, risk_tone, risk_label, progress_label, words_label, current_chapter, target_chapter, next_action, summary, metrics_json, created_at, updated_at)
      VALUES (@id, @title, @genre, @phase, @riskTone, @riskLabel, @progressLabel, @wordsLabel, @currentChapter, @targetChapter, @nextAction, @summary, @metricsJson, @createdAt, @updatedAt)`,
    ).run({ ...book, metricsJson: JSON.stringify(book.metrics) });
  }

  listChapters(bookId: string): ChapterRecord[] {
    return (this.db.prepare("SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number DESC").all(bookId) as Array<Record<string, unknown>>).map((row) => this.mapChapter(row));
  }

  getChapter(bookId: string, chapterNumber: number): ChapterRecord | null {
    const row = this.db.prepare("SELECT * FROM chapters WHERE book_id = ? AND chapter_number = ?").get(bookId, chapterNumber) as Record<string, unknown> | undefined;
    return row ? this.mapChapter(row) : null;
  }

  saveChapter(chapter: ChapterRecord): void {
    this.db.prepare(
      `INSERT OR REPLACE INTO chapters
      (book_id, chapter_number, title, status, word_count, audit_status, content, created_at, updated_at)
      VALUES (@bookId, @chapterNumber, @title, @status, @wordCount, @auditStatus, @content, @createdAt, @updatedAt)`,
    ).run(chapter);
  }

  listTruthFiles(bookId: string): TruthFileRecord[] {
    return (this.db.prepare("SELECT * FROM truth_files WHERE book_id = ? ORDER BY file_name ASC").all(bookId) as Array<Record<string, unknown>>).map((row) => this.mapTruthFile(row));
  }

  getTruthFile(bookId: string, fileName: string): TruthFileRecord | null {
    const row = this.db.prepare("SELECT * FROM truth_files WHERE book_id = ? AND file_name = ?").get(bookId, fileName) as Record<string, unknown> | undefined;
    return row ? this.mapTruthFile(row) : null;
  }

  saveTruthFile(file: TruthFileRecord): void {
    this.db.prepare(
      `INSERT OR REPLACE INTO truth_files
      (book_id, file_name, category, note, content, created_at, updated_at)
      VALUES (@bookId, @fileName, @category, @note, @content, @createdAt, @updatedAt)`,
    ).run(file);
  }

  listMaterials(bookId: string): MaterialRecord[] {
    return (this.db.prepare("SELECT * FROM materials WHERE book_id = ? ORDER BY updated_at DESC").all(bookId) as Array<Record<string, unknown>>).map((row) => this.mapMaterial(row));
  }

  getMaterial(bookId: string, materialId: string): MaterialRecord | null {
    const row = this.db.prepare("SELECT * FROM materials WHERE book_id = ? AND material_id = ?").get(bookId, materialId) as Record<string, unknown> | undefined;
    return row ? this.mapMaterial(row) : null;
  }

  saveMaterial(material: MaterialRecord): void {
    this.db.prepare(
      `INSERT OR REPLACE INTO materials
      (material_id, book_id, type, name, status, source_run_id, source_thread_id, provenance, note, payload_json, created_at, updated_at)
      VALUES (@materialId, @bookId, @type, @name, @status, @sourceRunId, @sourceThreadId, @provenance, @note, @payloadJson, @createdAt, @updatedAt)`,
    ).run({ ...material, payloadJson: JSON.stringify(material.payload) });
  }

  getDraft(draftId: string): DraftArtifact | null {
    const row = this.db.prepare("SELECT * FROM drafts WHERE draft_id = ?").get(draftId) as Record<string, unknown> | undefined;
    return row ? this.mapDraft(row) : null;
  }

  listDrafts(bookId?: string): DraftArtifact[] {
    if (bookId) {
      return (this.db.prepare("SELECT * FROM drafts WHERE book_id = ? ORDER BY updated_at DESC").all(bookId) as Array<Record<string, unknown>>).map((row) =>
        this.mapDraft(row),
      );
    }

    return (this.db.prepare("SELECT * FROM drafts ORDER BY updated_at DESC").all() as Array<Record<string, unknown>>).map((row) => this.mapDraft(row));
  }

  saveDraft(draft: DraftArtifact): void {
    this.db.prepare(
      `INSERT OR REPLACE INTO drafts
      (draft_id, type, book_id, status, revision, parent_draft_id, source_thread_id, source_run_id, skill_ref_json, tool_schema_version, preview_json, snapshot_refs_json, etag, created_at, updated_at)
      VALUES (@draftId, @type, @bookId, @status, @revision, @parentDraftId, @sourceThreadId, @sourceRunId, @skillRefJson, @toolSchemaVersion, @previewJson, @snapshotRefsJson, @etag, @createdAt, @updatedAt)`,
    ).run({
      ...draft,
      parentDraftId: draft.parentDraftId ?? null,
      skillRefJson: JSON.stringify(draft.skillRef),
      previewJson: JSON.stringify(draft.preview),
      snapshotRefsJson: JSON.stringify(draft.artifactSnapshotRefs),
    });
  }

  getRun(runId: string): RunRecord | null {
    const row = this.db.prepare("SELECT * FROM runs WHERE run_id = ?").get(runId) as Record<string, unknown> | undefined;
    return row ? this.mapRun(row) : null;
  }

  saveRun(run: RunRecord): void {
    this.db.prepare(
      `INSERT OR REPLACE INTO runs
      (run_id, thread_id, status, started_at, ended_at, current_step_id, step_count, estimated_duration, event_cursor, pending_approval_id, active_command_id, last_persisted_at, skills_locked_json, error_json, summary, tool_presentations_json)
      VALUES (@runId, @threadId, @status, @startedAt, @endedAt, @currentStepId, @stepCount, @estimatedDuration, @eventCursor, @pendingApprovalId, @activeCommandId, @lastPersistedAt, @skillsLockedJson, @errorJson, @summary, @toolPresentationsJson)`,
    ).run({
      ...run,
      endedAt: run.endedAt ?? null,
      currentStepId: run.currentStepId ?? null,
      stepCount: run.stepCount ?? null,
      estimatedDuration: run.estimatedDuration ?? null,
      pendingApprovalId: run.pendingApprovalId ?? null,
      activeCommandId: run.activeCommandId ?? null,
      skillsLockedJson: JSON.stringify(run.skillsLocked),
      errorJson: run.error ? JSON.stringify(run.error) : null,
      toolPresentationsJson: JSON.stringify(run.toolPresentations),
    });
    this.db.prepare("UPDATE threads SET last_run_id = ? WHERE thread_id = ?").run(run.runId, run.threadId);
  }

  listRunEvents(runId: string): EventRecord[] {
    return (this.db.prepare("SELECT * FROM events WHERE run_id = ? ORDER BY cursor ASC").all(runId) as Array<Record<string, unknown>>).map((row) => this.mapEvent(row));
  }

  listEventsAfter(cursor: number): EventRecord[] {
    return (this.db.prepare("SELECT * FROM events WHERE cursor > ? ORDER BY cursor ASC").all(cursor) as Array<Record<string, unknown>>).map((row) => this.mapEvent(row));
  }

  saveEvent(input: Omit<EventRecord, "cursor">): EventRecord {
    const createdAt = input.createdAt || nowIso();
    const result = this.db
      .prepare("INSERT INTO events (event_id, run_id, thread_id, event_type, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(input.eventId, input.runId, input.threadId, input.event, JSON.stringify(input.payload), createdAt);

    return {
      ...input,
      createdAt,
      cursor: Number(result.lastInsertRowid),
    };
  }

  getResource(refId: string): ResourceRecord | null {
    const row = this.db.prepare("SELECT * FROM resources WHERE ref_id = ?").get(refId) as Record<string, unknown> | undefined;
    return row ? this.mapResource(row) : null;
  }

  saveResource(resource: ResourceRecord): void {
    this.db.prepare("INSERT OR REPLACE INTO resources (ref_id, type, uri, content, created_at) VALUES (@refId, @type, @uri, @content, @createdAt)").run(resource);
  }

  getCommandResult(commandId: string): string | null {
    const row = this.db.prepare("SELECT response_json FROM commands WHERE command_id = ?").get(commandId) as { response_json: string } | undefined;
    return row?.response_json ?? null;
  }

  saveCommandResult(commandId: string, responseJson: string): void {
    this.db.prepare("INSERT OR REPLACE INTO commands (command_id, response_json, created_at) VALUES (?, ?, ?)").run(commandId, responseJson, nowIso());
  }

  private createTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS threads (thread_id TEXT PRIMARY KEY, scope TEXT NOT NULL, title TEXT NOT NULL, book_id TEXT, chapter_number INTEGER, last_run_id TEXT, last_message_at TEXT NOT NULL, archived INTEGER NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS messages (message_id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, role TEXT NOT NULL, text TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS books (id TEXT PRIMARY KEY, title TEXT NOT NULL, genre TEXT NOT NULL, phase TEXT NOT NULL, risk_tone TEXT NOT NULL, risk_label TEXT NOT NULL, progress_label TEXT NOT NULL, words_label TEXT NOT NULL, current_chapter INTEGER NOT NULL, target_chapter INTEGER NOT NULL, next_action TEXT NOT NULL, summary TEXT NOT NULL, metrics_json TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS chapters (book_id TEXT NOT NULL, chapter_number INTEGER NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL, word_count INTEGER NOT NULL, audit_status TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY (book_id, chapter_number));
      CREATE TABLE IF NOT EXISTS truth_files (book_id TEXT NOT NULL, file_name TEXT NOT NULL, category TEXT NOT NULL, note TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY (book_id, file_name));
      CREATE TABLE IF NOT EXISTS materials (material_id TEXT PRIMARY KEY, book_id TEXT NOT NULL, type TEXT NOT NULL, name TEXT NOT NULL, status TEXT NOT NULL, source_run_id TEXT NOT NULL, source_thread_id TEXT NOT NULL, provenance TEXT NOT NULL, note TEXT NOT NULL, payload_json TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS drafts (draft_id TEXT PRIMARY KEY, type TEXT NOT NULL, book_id TEXT NOT NULL, status TEXT NOT NULL, revision INTEGER NOT NULL, parent_draft_id TEXT, source_thread_id TEXT NOT NULL, source_run_id TEXT NOT NULL, skill_ref_json TEXT NOT NULL, tool_schema_version TEXT NOT NULL, preview_json TEXT NOT NULL, snapshot_refs_json TEXT NOT NULL, etag TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS runs (run_id TEXT PRIMARY KEY, thread_id TEXT NOT NULL, status TEXT NOT NULL, started_at TEXT NOT NULL, ended_at TEXT, current_step_id TEXT, step_count INTEGER, estimated_duration INTEGER, event_cursor INTEGER NOT NULL, pending_approval_id TEXT, active_command_id TEXT, last_persisted_at TEXT NOT NULL, skills_locked_json TEXT NOT NULL, error_json TEXT, summary TEXT NOT NULL, tool_presentations_json TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS events (cursor INTEGER PRIMARY KEY AUTOINCREMENT, event_id TEXT UNIQUE NOT NULL, run_id TEXT NOT NULL, thread_id TEXT NOT NULL, event_type TEXT NOT NULL, payload_json TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS resources (ref_id TEXT PRIMARY KEY, type TEXT NOT NULL, uri TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS commands (command_id TEXT PRIMARY KEY, response_json TEXT NOT NULL, created_at TEXT NOT NULL);
    `);
  }

  private seedIfEmpty(): void {
    const count = this.db.prepare("SELECT COUNT(*) AS count FROM books").get() as { count: number };
    if (count.count > 0) return;
    const seed = createSeedData();
    for (const book of seed.books) this.saveBook(book);
    for (const thread of seed.threads) this.saveThread(thread);
    for (const message of seed.messages) this.saveMessage(message);
    for (const run of seed.runs) this.saveRun(run);
    for (const draft of seed.drafts) this.saveDraft(draft);
    for (const material of seed.materials) this.saveMaterial(material);
    for (const chapter of seed.chapters) this.saveChapter(chapter);
    for (const truthFile of seed.truthFiles) this.saveTruthFile(truthFile);
    for (const resource of seed.resources) this.saveResource(resource);
  }

  private mapThread(row: Record<string, unknown>): ThreadRecord {
    return {
      threadId: String(row.thread_id),
      scope: String(row.scope) as ThreadRecord["scope"],
      title: String(row.title),
      ...(row.book_id ? { bookId: String(row.book_id) } : {}),
      ...(row.chapter_number ? { chapterNumber: Number(row.chapter_number) } : {}),
      ...(row.last_run_id ? { lastRunId: String(row.last_run_id) } : {}),
      lastMessageAt: String(row.last_message_at),
      archived: Number(row.archived) === 1,
      createdAt: String(row.created_at),
    };
  }

  private mapMessage(row: Record<string, unknown>): MessageRecord {
    return { messageId: String(row.message_id), threadId: String(row.thread_id), role: String(row.role) as MessageRecord["role"], text: String(row.text), createdAt: String(row.created_at) };
  }

  private mapBook(row: Record<string, unknown>): BookRecord {
    return {
      id: String(row.id),
      title: String(row.title),
      genre: String(row.genre),
      phase: String(row.phase),
      riskTone: String(row.risk_tone),
      riskLabel: String(row.risk_label),
      progressLabel: String(row.progress_label),
      wordsLabel: String(row.words_label),
      currentChapter: Number(row.current_chapter),
      targetChapter: Number(row.target_chapter),
      nextAction: String(row.next_action),
      summary: String(row.summary),
      metrics: parseJson<BookRecord["metrics"]>(String(row.metrics_json)),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  private mapChapter(row: Record<string, unknown>): ChapterRecord {
    return {
      bookId: String(row.book_id),
      chapterNumber: Number(row.chapter_number),
      title: String(row.title),
      status: String(row.status),
      wordCount: Number(row.word_count),
      auditStatus: String(row.audit_status),
      content: String(row.content),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  private mapTruthFile(row: Record<string, unknown>): TruthFileRecord {
    return { bookId: String(row.book_id), fileName: String(row.file_name), category: String(row.category), note: String(row.note), content: String(row.content), createdAt: String(row.created_at), updatedAt: String(row.updated_at) };
  }

  private mapMaterial(row: Record<string, unknown>): MaterialRecord {
    return {
      materialId: String(row.material_id),
      bookId: String(row.book_id),
      type: String(row.type),
      name: String(row.name),
      status: String(row.status),
      sourceRunId: String(row.source_run_id),
      sourceThreadId: String(row.source_thread_id),
      provenance: String(row.provenance),
      note: String(row.note),
      payload: parseJson<unknown>(String(row.payload_json)),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  private mapDraft(row: Record<string, unknown>): DraftArtifact {
    return {
      draftId: String(row.draft_id),
      type: String(row.type),
      bookId: String(row.book_id),
      status: String(row.status) as DraftArtifact["status"],
      revision: Number(row.revision),
      ...(row.parent_draft_id ? { parentDraftId: String(row.parent_draft_id) } : {}),
      sourceThreadId: String(row.source_thread_id),
      sourceRunId: String(row.source_run_id),
      skillRef: parseJson<SkillRef>(String(row.skill_ref_json)),
      toolSchemaVersion: String(row.tool_schema_version),
      preview: parseJson<unknown>(String(row.preview_json)),
      artifactSnapshotRefs: parseJson<string[]>(String(row.snapshot_refs_json)),
      etag: String(row.etag),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    };
  }

  private mapRun(row: Record<string, unknown>): RunRecord {
    return {
      runId: String(row.run_id),
      threadId: String(row.thread_id),
      status: String(row.status) as RunRecord["status"],
      startedAt: String(row.started_at),
      ...(row.ended_at ? { endedAt: String(row.ended_at) } : {}),
      ...(row.current_step_id ? { currentStepId: String(row.current_step_id) } : {}),
      ...(row.step_count ? { stepCount: Number(row.step_count) } : {}),
      ...(row.estimated_duration ? { estimatedDuration: Number(row.estimated_duration) } : {}),
      eventCursor: Number(row.event_cursor),
      ...(row.pending_approval_id ? { pendingApprovalId: String(row.pending_approval_id) } : {}),
      ...(row.active_command_id ? { activeCommandId: String(row.active_command_id) } : {}),
      lastPersistedAt: String(row.last_persisted_at),
      skillsLocked: parseJson(String(row.skills_locked_json)),
      ...(row.error_json ? { error: parseJson(String(row.error_json)) } : {}),
      summary: String(row.summary),
      toolPresentations: parseJson(String(row.tool_presentations_json)),
    };
  }

  private mapEvent(row: Record<string, unknown>): EventRecord {
    return { eventId: String(row.event_id), event: String(row.event_type), runId: String(row.run_id), threadId: String(row.thread_id), payload: parseJson(String(row.payload_json)), cursor: Number(row.cursor), createdAt: String(row.created_at) };
  }

  private mapResource(row: Record<string, unknown>): ResourceRecord {
    return { refId: String(row.ref_id), type: String(row.type) as ResourceRecord["type"], uri: String(row.uri), content: String(row.content), createdAt: String(row.created_at) };
  }
}
