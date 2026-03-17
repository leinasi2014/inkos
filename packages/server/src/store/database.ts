import Database from "better-sqlite3";
import { z } from "zod";
import type {
  BookRecord,
  ChapterRecord,
  DraftArtifact,
  EventRecord,
  MaterialRecord,
  MessageRecord,
  ResourceRecord,
  RunRecord,
  ThreadRecord,
  TruthFileRecord,
} from "../contracts.js";
import {
  BookRecordSchema,
  ChapterRecordSchema,
  DraftArtifactSchema,
  EventRecordSchema,
  MaterialRecordSchema,
  MessageRecordSchema,
  ResourceRecordSchema,
  RunErrorSchema,
  RunRecordSchema,
  SkillRefSchema,
  ThreadRecordSchema,
  ToolPresentationSchema,
  TruthFileRecordSchema,
} from "../contracts.js";
import { nowIso } from "../id.js";
import { createSeedData } from "./seed.js";

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

type QuarantineField = "__record__" | string;

export class DatabaseStore {
  private readonly db: Database.Database;

  constructor(databasePath: string) {
    this.db = new Database(databasePath);
    this.db.pragma("journal_mode = WAL");
    // SQLite 默认不会替你打开外键检查；这里必须显式开启。
    this.db.pragma("foreign_keys = ON");
    this.createTables();
    this.ensureRunColumns();
    this.createIndexes();
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
    return (this.db.prepare(sql).all(...params) as Array<Record<string, unknown>>)
      .map((row) => this.mapThread(row))
      .filter(isPresent);
  }

  getThread(threadId: string): ThreadRecord | null {
    const row = this.db.prepare("SELECT * FROM threads WHERE thread_id = ?").get(threadId) as Record<string, unknown> | undefined;
    return row ? this.mapThread(row) : null;
  }

  saveThread(thread: ThreadRecord): void {
    this.db.prepare(
      `INSERT INTO threads
      (thread_id, scope, title, book_id, chapter_number, last_run_id, last_message_at, archived, created_at)
      VALUES (@threadId, @scope, @title, @bookId, @chapterNumber, @lastRunId, @lastMessageAt, @archived, @createdAt)
      ON CONFLICT(thread_id) DO UPDATE SET
        scope = excluded.scope,
        title = excluded.title,
        book_id = excluded.book_id,
        chapter_number = excluded.chapter_number,
        last_run_id = excluded.last_run_id,
        last_message_at = excluded.last_message_at,
        archived = excluded.archived,
        created_at = excluded.created_at`,
    ).run({
      ...thread,
      bookId: thread.bookId ?? null,
      chapterNumber: thread.chapterNumber ?? null,
      lastRunId: thread.lastRunId ?? null,
      archived: thread.archived ? 1 : 0,
    });
  }

  listMessages(threadId: string): MessageRecord[] {
    return (this.db.prepare("SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC").all(threadId) as Array<Record<string, unknown>>)
      .map((row) => this.mapMessage(row))
      .filter(isPresent);
  }

  saveMessage(message: MessageRecord): void {
    // message 落库和 thread 更新时间必须同事务，避免只写到一半时读到脏状态。
    this.db.transaction((nextMessage: MessageRecord) => {
      this.db.prepare(
        `INSERT INTO messages (message_id, thread_id, role, text, created_at)
        VALUES (@messageId, @threadId, @role, @text, @createdAt)
        ON CONFLICT(message_id) DO UPDATE SET
          thread_id = excluded.thread_id,
          role = excluded.role,
          text = excluded.text,
          created_at = excluded.created_at`,
      ).run(nextMessage);
      this.db.prepare("UPDATE threads SET last_message_at = ? WHERE thread_id = ?").run(nextMessage.createdAt, nextMessage.threadId);
    })(message);
  }

  listBooks(): BookRecord[] {
    return (this.db.prepare("SELECT * FROM books ORDER BY updated_at DESC").all() as Array<Record<string, unknown>>)
      .map((row) => this.mapBook(row))
      .filter(isPresent);
  }

  getBook(bookId: string): BookRecord | null {
    const row = this.db.prepare("SELECT * FROM books WHERE id = ?").get(bookId) as Record<string, unknown> | undefined;
    return row ? this.mapBook(row) : null;
  }

  saveBook(book: BookRecord): void {
    this.db.prepare(
      `INSERT INTO books
      (id, title, genre, phase, risk_tone, risk_label, progress_label, words_label, current_chapter, target_chapter, next_action, summary, metrics_json, created_at, updated_at)
      VALUES (@id, @title, @genre, @phase, @riskTone, @riskLabel, @progressLabel, @wordsLabel, @currentChapter, @targetChapter, @nextAction, @summary, @metricsJson, @createdAt, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        genre = excluded.genre,
        phase = excluded.phase,
        risk_tone = excluded.risk_tone,
        risk_label = excluded.risk_label,
        progress_label = excluded.progress_label,
        words_label = excluded.words_label,
        current_chapter = excluded.current_chapter,
        target_chapter = excluded.target_chapter,
        next_action = excluded.next_action,
        summary = excluded.summary,
        metrics_json = excluded.metrics_json,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at`,
    ).run({ ...book, metricsJson: JSON.stringify(book.metrics) });
  }

  listChapters(bookId: string): ChapterRecord[] {
    return (this.db.prepare("SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number DESC").all(bookId) as Array<Record<string, unknown>>)
      .map((row) => this.mapChapter(row))
      .filter(isPresent);
  }

  getChapter(bookId: string, chapterNumber: number): ChapterRecord | null {
    const row = this.db.prepare("SELECT * FROM chapters WHERE book_id = ? AND chapter_number = ?").get(bookId, chapterNumber) as Record<string, unknown> | undefined;
    return row ? this.mapChapter(row) : null;
  }

  saveChapter(chapter: ChapterRecord): void {
    this.db.prepare(
      `INSERT INTO chapters
      (book_id, chapter_number, title, status, word_count, audit_status, content, created_at, updated_at)
      VALUES (@bookId, @chapterNumber, @title, @status, @wordCount, @auditStatus, @content, @createdAt, @updatedAt)
      ON CONFLICT(book_id, chapter_number) DO UPDATE SET
        title = excluded.title,
        status = excluded.status,
        word_count = excluded.word_count,
        audit_status = excluded.audit_status,
        content = excluded.content,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at`,
    ).run(chapter);
  }

  listTruthFiles(bookId: string): TruthFileRecord[] {
    return (this.db.prepare("SELECT * FROM truth_files WHERE book_id = ? ORDER BY file_name ASC").all(bookId) as Array<Record<string, unknown>>)
      .map((row) => this.mapTruthFile(row))
      .filter(isPresent);
  }

  getTruthFile(bookId: string, fileName: string): TruthFileRecord | null {
    const row = this.db.prepare("SELECT * FROM truth_files WHERE book_id = ? AND file_name = ?").get(bookId, fileName) as Record<string, unknown> | undefined;
    return row ? this.mapTruthFile(row) : null;
  }

  saveTruthFile(file: TruthFileRecord): void {
    this.db.prepare(
      `INSERT INTO truth_files
      (book_id, file_name, category, note, content, created_at, updated_at)
      VALUES (@bookId, @fileName, @category, @note, @content, @createdAt, @updatedAt)
      ON CONFLICT(book_id, file_name) DO UPDATE SET
        category = excluded.category,
        note = excluded.note,
        content = excluded.content,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at`,
    ).run(file);
  }

  listMaterials(bookId: string): MaterialRecord[] {
    return (this.db.prepare("SELECT * FROM materials WHERE book_id = ? ORDER BY updated_at DESC").all(bookId) as Array<Record<string, unknown>>)
      .map((row) => this.mapMaterial(row))
      .filter(isPresent);
  }

  getMaterial(bookId: string, materialId: string): MaterialRecord | null {
    const row = this.db.prepare("SELECT * FROM materials WHERE book_id = ? AND material_id = ?").get(bookId, materialId) as Record<string, unknown> | undefined;
    return row ? this.mapMaterial(row) : null;
  }

  saveMaterial(material: MaterialRecord): void {
    this.db.prepare(
      `INSERT INTO materials
      (material_id, book_id, type, name, status, source_run_id, source_thread_id, provenance, note, payload_json, created_at, updated_at)
      VALUES (@materialId, @bookId, @type, @name, @status, @sourceRunId, @sourceThreadId, @provenance, @note, @payloadJson, @createdAt, @updatedAt)
      ON CONFLICT(material_id) DO UPDATE SET
        book_id = excluded.book_id,
        type = excluded.type,
        name = excluded.name,
        status = excluded.status,
        source_run_id = excluded.source_run_id,
        source_thread_id = excluded.source_thread_id,
        provenance = excluded.provenance,
        note = excluded.note,
        payload_json = excluded.payload_json,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at`,
    ).run({ ...material, payloadJson: JSON.stringify(material.payload) });
  }

  getDraft(draftId: string): DraftArtifact | null {
    const row = this.db.prepare("SELECT * FROM drafts WHERE draft_id = ?").get(draftId) as Record<string, unknown> | undefined;
    return row ? this.mapDraft(row) : null;
  }

  listDrafts(bookId?: string): DraftArtifact[] {
    if (bookId) {
      return (this.db.prepare("SELECT * FROM drafts WHERE book_id = ? ORDER BY updated_at DESC").all(bookId) as Array<Record<string, unknown>>)
        .map((row) => this.mapDraft(row))
        .filter(isPresent);
    }

    return (this.db.prepare("SELECT * FROM drafts ORDER BY updated_at DESC").all() as Array<Record<string, unknown>>)
      .map((row) => this.mapDraft(row))
      .filter(isPresent);
  }

  saveDraft(draft: DraftArtifact): void {
    this.db.prepare(
      `INSERT INTO drafts
      (draft_id, type, book_id, status, revision, parent_draft_id, source_thread_id, source_run_id, skill_ref_json, tool_schema_version, preview_json, snapshot_refs_json, etag, created_at, updated_at)
      VALUES (@draftId, @type, @bookId, @status, @revision, @parentDraftId, @sourceThreadId, @sourceRunId, @skillRefJson, @toolSchemaVersion, @previewJson, @snapshotRefsJson, @etag, @createdAt, @updatedAt)
      ON CONFLICT(draft_id) DO UPDATE SET
        type = excluded.type,
        book_id = excluded.book_id,
        status = excluded.status,
        revision = excluded.revision,
        parent_draft_id = excluded.parent_draft_id,
        source_thread_id = excluded.source_thread_id,
        source_run_id = excluded.source_run_id,
        skill_ref_json = excluded.skill_ref_json,
        tool_schema_version = excluded.tool_schema_version,
        preview_json = excluded.preview_json,
        snapshot_refs_json = excluded.snapshot_refs_json,
        etag = excluded.etag,
        created_at = excluded.created_at,
        updated_at = excluded.updated_at`,
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

  listRunsByThread(threadId: string): RunRecord[] {
    return (this.db.prepare("SELECT * FROM runs WHERE thread_id = ? ORDER BY started_at DESC, rowid DESC").all(threadId) as Array<Record<string, unknown>>)
      .map((row) => this.mapRun(row))
      .filter(isPresent);
  }

  findLatestRunForChapter(bookId: string, chapterNumber: number): RunRecord | null {
    const row = this.db
      .prepare("SELECT * FROM runs WHERE book_id = ? AND chapter_number = ? ORDER BY started_at DESC, rowid DESC LIMIT 1")
      .get(bookId, chapterNumber) as Record<string, unknown> | undefined;
    return row ? this.mapRun(row) : null;
  }

  saveRun(run: RunRecord): void {
    // run 记录和 thread.last_run_id 必须原子更新，避免运行态和线程态失配。
    this.db.transaction((nextRun: RunRecord) => {
      this.db.prepare(
        `INSERT INTO runs
        (run_id, thread_id, book_id, chapter_number, status, started_at, ended_at, current_step_id, step_count, estimated_duration, event_cursor, pending_approval_id, active_command_id, last_persisted_at, skills_locked_json, error_json, summary, tool_presentations_json)
        VALUES (@runId, @threadId, @bookId, @chapterNumber, @status, @startedAt, @endedAt, @currentStepId, @stepCount, @estimatedDuration, @eventCursor, @pendingApprovalId, @activeCommandId, @lastPersistedAt, @skillsLockedJson, @errorJson, @summary, @toolPresentationsJson)
        ON CONFLICT(run_id) DO UPDATE SET
          thread_id = excluded.thread_id,
          book_id = excluded.book_id,
          chapter_number = excluded.chapter_number,
          status = excluded.status,
          started_at = excluded.started_at,
          ended_at = excluded.ended_at,
          current_step_id = excluded.current_step_id,
          step_count = excluded.step_count,
          estimated_duration = excluded.estimated_duration,
          event_cursor = excluded.event_cursor,
          pending_approval_id = excluded.pending_approval_id,
          active_command_id = excluded.active_command_id,
          last_persisted_at = excluded.last_persisted_at,
          skills_locked_json = excluded.skills_locked_json,
          error_json = excluded.error_json,
          summary = excluded.summary,
          tool_presentations_json = excluded.tool_presentations_json`,
      ).run({
        ...nextRun,
        bookId: nextRun.bookId ?? null,
        chapterNumber: nextRun.chapterNumber ?? null,
        endedAt: nextRun.endedAt ?? null,
        currentStepId: nextRun.currentStepId ?? null,
        stepCount: nextRun.stepCount ?? null,
        estimatedDuration: nextRun.estimatedDuration ?? null,
        pendingApprovalId: nextRun.pendingApprovalId ?? null,
        activeCommandId: nextRun.activeCommandId ?? null,
        skillsLockedJson: JSON.stringify(nextRun.skillsLocked),
        errorJson: nextRun.error ? JSON.stringify(nextRun.error) : null,
        toolPresentationsJson: JSON.stringify(nextRun.toolPresentations),
      });
      this.db.prepare("UPDATE threads SET last_run_id = ? WHERE thread_id = ?").run(nextRun.runId, nextRun.threadId);
    })(run);
  }

  listRunEvents(runId: string): EventRecord[] {
    return (this.db.prepare("SELECT * FROM events WHERE run_id = ? ORDER BY cursor ASC").all(runId) as Array<Record<string, unknown>>)
      .map((row) => this.mapEvent(row))
      .filter(isPresent);
  }

  listEventsAfter(cursor: number, limit?: number, threadIds: ReadonlyArray<string> = []): EventRecord[] {
    const normalizedLimit = typeof limit === "number" ? Math.max(1, limit) : null;
    const threadFilter = threadIds.length > 0 ? ` AND thread_id IN (${threadIds.map(() => "?").join(", ")})` : "";
    const sql = `SELECT * FROM events WHERE cursor > ?${threadFilter} ORDER BY cursor ASC${normalizedLimit ? " LIMIT ?" : ""}`;
    const params: Array<number | string> = [cursor, ...threadIds];
    if (normalizedLimit) params.push(normalizedLimit);
    return (this.db.prepare(sql).all(...params) as Array<Record<string, unknown>>)
      .map((row) => this.mapEvent(row))
      .filter(isPresent);
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
    this.db
      .prepare(
        `INSERT INTO resources (ref_id, type, uri, content, created_at)
         VALUES (@refId, @type, @uri, @content, @createdAt)
         ON CONFLICT(ref_id) DO UPDATE SET
           type = excluded.type,
           uri = excluded.uri,
           content = excluded.content,
           created_at = excluded.created_at`,
      )
      .run(resource);
  }

  getCommandResult(commandId: string): string | null {
    const row = this.db.prepare("SELECT response_json FROM commands WHERE command_id = ?").get(commandId) as { response_json: string } | undefined;
    return row?.response_json ?? null;
  }

  saveCommandResult(commandId: string, responseJson: string): void {
    this.db
      .prepare(
        `INSERT INTO commands (command_id, response_json, created_at)
         VALUES (?, ?, ?)
         ON CONFLICT(command_id) DO UPDATE SET
           response_json = excluded.response_json,
           created_at = excluded.created_at`,
      )
      .run(commandId, responseJson, nowIso());
  }

  private createTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS books (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        genre TEXT NOT NULL,
        phase TEXT NOT NULL,
        risk_tone TEXT NOT NULL,
        risk_label TEXT NOT NULL,
        progress_label TEXT NOT NULL,
        words_label TEXT NOT NULL,
        current_chapter INTEGER NOT NULL,
        target_chapter INTEGER NOT NULL,
        next_action TEXT NOT NULL,
        summary TEXT NOT NULL,
        metrics_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS threads (
        thread_id TEXT PRIMARY KEY,
        scope TEXT NOT NULL,
        title TEXT NOT NULL,
        book_id TEXT,
        chapter_number INTEGER,
        last_run_id TEXT,
        last_message_at TEXT NOT NULL,
        archived INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS messages (
        message_id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL,
        role TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS chapters (
        book_id TEXT NOT NULL,
        chapter_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        status TEXT NOT NULL,
        word_count INTEGER NOT NULL,
        audit_status TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (book_id, chapter_number),
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS truth_files (
        book_id TEXT NOT NULL,
        file_name TEXT NOT NULL,
        category TEXT NOT NULL,
        note TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (book_id, file_name),
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS runs (
        run_id TEXT PRIMARY KEY,
        thread_id TEXT NOT NULL,
        book_id TEXT,
        chapter_number INTEGER,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        current_step_id TEXT,
        step_count INTEGER,
        estimated_duration INTEGER,
        event_cursor INTEGER NOT NULL,
        pending_approval_id TEXT,
        active_command_id TEXT,
        last_persisted_at TEXT NOT NULL,
        skills_locked_json TEXT NOT NULL,
        error_json TEXT,
        summary TEXT NOT NULL,
        tool_presentations_json TEXT NOT NULL,
        FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS materials (
        material_id TEXT PRIMARY KEY,
        book_id TEXT NOT NULL,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        source_run_id TEXT NOT NULL,
        source_thread_id TEXT NOT NULL,
        provenance TEXT NOT NULL,
        note TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        FOREIGN KEY (source_run_id) REFERENCES runs(run_id) ON DELETE CASCADE,
        FOREIGN KEY (source_thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS drafts (
        draft_id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        book_id TEXT NOT NULL,
        status TEXT NOT NULL,
        revision INTEGER NOT NULL,
        parent_draft_id TEXT,
        source_thread_id TEXT NOT NULL,
        source_run_id TEXT NOT NULL,
        skill_ref_json TEXT NOT NULL,
        tool_schema_version TEXT NOT NULL,
        preview_json TEXT NOT NULL,
        snapshot_refs_json TEXT NOT NULL,
        etag TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_draft_id) REFERENCES drafts(draft_id) ON DELETE SET NULL,
        FOREIGN KEY (source_thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE,
        FOREIGN KEY (source_run_id) REFERENCES runs(run_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS events (
        cursor INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT UNIQUE NOT NULL,
        run_id TEXT NOT NULL,
        thread_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (run_id) REFERENCES runs(run_id) ON DELETE CASCADE,
        FOREIGN KEY (thread_id) REFERENCES threads(thread_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS resources (
        ref_id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        uri TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS commands (
        command_id TEXT PRIMARY KEY,
        response_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS quarantined_records (
        entity_type TEXT NOT NULL,
        record_key TEXT NOT NULL,
        field_name TEXT NOT NULL,
        raw_value TEXT NOT NULL,
        reason TEXT NOT NULL,
        captured_at TEXT NOT NULL,
        PRIMARY KEY (entity_type, record_key, field_name)
      );
    `);
  }

  private ensureRunColumns(): void {
    this.ensureColumn("runs", "book_id", "TEXT");
    this.ensureColumn("runs", "chapter_number", "INTEGER");
  }

  private ensureColumn(tableName: string, columnName: string, definition: string): void {
    const columns = this.db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
    if (columns.some((column) => column.name === columnName)) return;
    this.db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }

  private createIndexes(): void {
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_threads_book_last_message ON threads(book_id, last_message_at DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON messages(thread_id, created_at ASC);
      CREATE INDEX IF NOT EXISTS idx_chapters_book_updated ON chapters(book_id, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_truth_files_book_updated ON truth_files(book_id, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_materials_book_updated ON materials(book_id, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_drafts_book_updated ON drafts(book_id, updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_runs_thread_started ON runs(thread_id, started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_runs_book_chapter_started ON runs(book_id, chapter_number, started_at DESC);
      CREATE INDEX IF NOT EXISTS idx_events_run_cursor ON events(run_id, cursor ASC);
      CREATE INDEX IF NOT EXISTS idx_events_thread_cursor ON events(thread_id, cursor ASC);
    `);
  }

  private seedIfEmpty(): void {
    // seed 过程需要单事务串行化，避免并发初始化时写出半套数据。
    this.db.transaction(() => {
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
    })();
  }

  private quarantineRecord(entityType: string, recordKey: string, fieldName: QuarantineField, rawValue: string, reason: string): void {
    this.db
      .prepare(
        `INSERT INTO quarantined_records (entity_type, record_key, field_name, raw_value, reason, captured_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(entity_type, record_key, field_name) DO UPDATE SET
           raw_value = excluded.raw_value,
           reason = excluded.reason,
           captured_at = excluded.captured_at`,
      )
      .run(entityType, recordKey, fieldName, rawValue, reason, nowIso());
    console.warn(`[database] quarantined ${entityType}:${recordKey}:${fieldName} - ${reason}`);
  }

  private parseJsonField<T>(
    entityType: string,
    recordKey: string,
    fieldName: string,
    rawValue: unknown,
    schema?: z.ZodType<T>,
  ): T | null {
    const serialized = String(rawValue ?? "");

    try {
      const parsed = JSON.parse(serialized) as unknown;
      if (!schema) return parsed as T;

      const result = schema.safeParse(parsed);
      if (result.success) return result.data;

      this.quarantineRecord(entityType, recordKey, fieldName, serialized, result.error.message);
      return null;
    } catch (error) {
      this.quarantineRecord(entityType, recordKey, fieldName, serialized, error instanceof Error ? error.message : "JSON 解析失败");
      return null;
    }
  }

  private validateRecord<T>(entityType: string, recordKey: string, record: unknown, schema: z.ZodType<T>): T | null {
    const result = schema.safeParse(record);
    if (result.success) return result.data;
    this.quarantineRecord(entityType, recordKey, "__record__", JSON.stringify(record), result.error.message);
    return null;
  }

  private mapThread(row: Record<string, unknown>): ThreadRecord | null {
    return this.validateRecord(
      "threads",
      String(row.thread_id),
      {
        threadId: String(row.thread_id),
        scope: String(row.scope),
        title: String(row.title),
        ...(row.book_id ? { bookId: String(row.book_id) } : {}),
        ...(row.chapter_number ? { chapterNumber: Number(row.chapter_number) } : {}),
        ...(row.last_run_id ? { lastRunId: String(row.last_run_id) } : {}),
        lastMessageAt: String(row.last_message_at),
        archived: Number(row.archived) === 1,
        createdAt: String(row.created_at),
      },
      ThreadRecordSchema,
    );
  }

  private mapMessage(row: Record<string, unknown>): MessageRecord | null {
    return this.validateRecord(
      "messages",
      String(row.message_id),
      {
        messageId: String(row.message_id),
        threadId: String(row.thread_id),
        role: String(row.role),
        text: String(row.text),
        createdAt: String(row.created_at),
      },
      MessageRecordSchema,
    );
  }

  private mapBook(row: Record<string, unknown>): BookRecord | null {
    const recordKey = String(row.id);
    const metrics = this.parseJsonField("books", recordKey, "metrics_json", row.metrics_json, BookRecordSchema.shape.metrics);
    if (!metrics) return null;

    return this.validateRecord(
      "books",
      recordKey,
      {
        id: recordKey,
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
        metrics,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      },
      BookRecordSchema,
    );
  }

  private mapChapter(row: Record<string, unknown>): ChapterRecord | null {
    return this.validateRecord(
      "chapters",
      `${String(row.book_id)}#${String(row.chapter_number)}`,
      {
        bookId: String(row.book_id),
        chapterNumber: Number(row.chapter_number),
        title: String(row.title),
        status: String(row.status),
        wordCount: Number(row.word_count),
        auditStatus: String(row.audit_status),
        content: String(row.content),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      },
      ChapterRecordSchema,
    );
  }

  private mapTruthFile(row: Record<string, unknown>): TruthFileRecord | null {
    return this.validateRecord(
      "truth_files",
      `${String(row.book_id)}:${String(row.file_name)}`,
      {
        bookId: String(row.book_id),
        fileName: String(row.file_name),
        category: String(row.category),
        note: String(row.note),
        content: String(row.content),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      },
      TruthFileRecordSchema,
    );
  }

  private mapMaterial(row: Record<string, unknown>): MaterialRecord | null {
    const recordKey = String(row.material_id);
    const payload = this.parseJsonField<unknown>("materials", recordKey, "payload_json", row.payload_json);
    if (payload === null) return null;

    return this.validateRecord(
      "materials",
      recordKey,
      {
        materialId: recordKey,
        bookId: String(row.book_id),
        type: String(row.type),
        name: String(row.name),
        status: String(row.status),
        sourceRunId: String(row.source_run_id),
        sourceThreadId: String(row.source_thread_id),
        provenance: String(row.provenance),
        note: String(row.note),
        payload,
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      },
      MaterialRecordSchema,
    );
  }

  private mapDraft(row: Record<string, unknown>): DraftArtifact | null {
    const recordKey = String(row.draft_id);
    const skillRef = this.parseJsonField("drafts", recordKey, "skill_ref_json", row.skill_ref_json, SkillRefSchema);
    const preview = this.parseJsonField<unknown>("drafts", recordKey, "preview_json", row.preview_json);
    const snapshotRefs = this.parseJsonField("drafts", recordKey, "snapshot_refs_json", row.snapshot_refs_json, z.array(z.string()));
    if (!skillRef || preview === null || !snapshotRefs) return null;

    return this.validateRecord(
      "drafts",
      recordKey,
      {
        draftId: recordKey,
        type: String(row.type),
        bookId: String(row.book_id),
        status: String(row.status),
        revision: Number(row.revision),
        ...(row.parent_draft_id ? { parentDraftId: String(row.parent_draft_id) } : {}),
        sourceThreadId: String(row.source_thread_id),
        sourceRunId: String(row.source_run_id),
        skillRef,
        toolSchemaVersion: String(row.tool_schema_version),
        preview,
        artifactSnapshotRefs: snapshotRefs,
        etag: String(row.etag),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
      },
      DraftArtifactSchema,
    );
  }

  private mapRun(row: Record<string, unknown>): RunRecord | null {
    const recordKey = String(row.run_id);
    const skillsLocked = this.parseJsonField("runs", recordKey, "skills_locked_json", row.skills_locked_json, z.record(SkillRefSchema));
    const error = row.error_json ? this.parseJsonField("runs", recordKey, "error_json", row.error_json, RunErrorSchema) : undefined;
    const toolPresentations = this.parseJsonField("runs", recordKey, "tool_presentations_json", row.tool_presentations_json, z.array(ToolPresentationSchema));
    if (!skillsLocked || toolPresentations === null || (row.error_json && !error)) return null;

    return this.validateRecord(
      "runs",
      recordKey,
      {
        runId: recordKey,
        threadId: String(row.thread_id),
        ...(row.book_id ? { bookId: String(row.book_id) } : {}),
        ...(row.chapter_number ? { chapterNumber: Number(row.chapter_number) } : {}),
        status: String(row.status),
        startedAt: String(row.started_at),
        ...(row.ended_at ? { endedAt: String(row.ended_at) } : {}),
        ...(row.current_step_id ? { currentStepId: String(row.current_step_id) } : {}),
        ...(row.step_count ? { stepCount: Number(row.step_count) } : {}),
        ...(row.estimated_duration ? { estimatedDuration: Number(row.estimated_duration) } : {}),
        eventCursor: Number(row.event_cursor),
        ...(row.pending_approval_id ? { pendingApprovalId: String(row.pending_approval_id) } : {}),
        ...(row.active_command_id ? { activeCommandId: String(row.active_command_id) } : {}),
        lastPersistedAt: String(row.last_persisted_at),
        skillsLocked,
        ...(error ? { error } : {}),
        summary: String(row.summary),
        toolPresentations,
      },
      RunRecordSchema,
    );
  }

  private mapEvent(row: Record<string, unknown>): EventRecord | null {
    const recordKey = String(row.event_id);
    const payload = this.parseJsonField<unknown>("events", recordKey, "payload_json", row.payload_json);
    if (payload === null) return null;

    return this.validateRecord(
      "events",
      recordKey,
      {
        eventId: recordKey,
        event: String(row.event_type),
        runId: String(row.run_id),
        threadId: String(row.thread_id),
        payload,
        cursor: Number(row.cursor),
        createdAt: String(row.created_at),
      },
      EventRecordSchema,
    );
  }

  private mapResource(row: Record<string, unknown>): ResourceRecord | null {
    return this.validateRecord(
      "resources",
      String(row.ref_id),
      {
        refId: String(row.ref_id),
        type: String(row.type),
        uri: String(row.uri),
        content: String(row.content),
        createdAt: String(row.created_at),
      },
      ResourceRecordSchema,
    );
  }
}
