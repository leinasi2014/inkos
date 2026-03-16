import type { ServerConfig } from "../config.js";
import type { FastifyInstance } from "fastify";
import { errorPayload, httpStatus } from "../errors.js";
import { InkOSError } from "../errors.js";
import type { RuntimeService } from "../services/runtime-service.js";
import { buildAutomationOverview, buildChapterAuditRecord, buildSettingsOverview } from "../services/runtime-read-models.js";

export async function registerRestRoutes(app: FastifyInstance, runtime: RuntimeService, config: ServerConfig): Promise<void> {
  app.get("/api/v1/health", async () => ({ data: { ok: true, name: "@actalk/inkos-server" } }));

  app.get("/api/v1/system/automation", async (_request, reply) => {
    try {
      return { data: buildAutomationOverview(runtime.store) };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/system/settings", async (_request, reply) => {
    try {
      return { data: buildSettingsOverview(runtime.store, config) };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/threads", async (request, reply) => {
    try {
      const query = request.query as { scope?: string; bookId?: string };
      return { data: runtime.listThreads(query) };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/threads/:threadId", async (request, reply) => {
    try {
      const { threadId } = request.params as { threadId: string };
      return { data: runtime.getThread(threadId) };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/threads/:threadId/messages", async (request, reply) => {
    try {
      const { threadId } = request.params as { threadId: string };
      return { data: runtime.listMessages(threadId) };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/runs/:runId", async (request, reply) => {
    try {
      const { runId } = request.params as { runId: string };
      return { data: runtime.getRun(runId) };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/runs/:runId/events", async (request, reply) => {
    try {
      const { runId } = request.params as { runId: string };
      return { data: runtime.listRunEvents(runId) };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/books", async (_request, reply) => {
    try {
      return { data: runtime.listBooks() };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/books/:bookId", async (request, reply) => {
    try {
      const { bookId } = request.params as { bookId: string };
      return { data: runtime.getBook(bookId) };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/books/:bookId/chapters", async (request, reply) => {
    try {
      const { bookId } = request.params as { bookId: string };
      return { data: runtime.listChapters(bookId) };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/books/:bookId/chapters/:chapterNo", async (request, reply) => {
    try {
      const { bookId, chapterNo } = request.params as { bookId: string; chapterNo: string };
      return { data: runtime.getChapter(bookId, Number(chapterNo)) };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/books/:bookId/chapters/:chapterNo/audit", async (request, reply) => {
    try {
      const { bookId, chapterNo } = request.params as { bookId: string; chapterNo: string };
      const audit = buildChapterAuditRecord(runtime.store, bookId, Number(chapterNo));
      if (!audit) {
        throw new InkOSError("RUN.NOT_FOUND", `Chapter audit ${bookId}#${chapterNo} 不存在`, { statusCode: 404 });
      }
      return { data: audit };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/books/:bookId/truth", async (request, reply) => {
    try {
      const { bookId } = request.params as { bookId: string };
      return { data: runtime.listTruthFiles(bookId) };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/books/:bookId/truth/:fileName", async (request, reply) => {
    try {
      const { bookId, fileName } = request.params as { bookId: string; fileName: string };
      return { data: runtime.getTruthFile(bookId, fileName) };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/books/:bookId/materials", async (request, reply) => {
    try {
      const { bookId } = request.params as { bookId: string };
      return { data: runtime.listMaterials(bookId) };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/books/:bookId/drafts", async (request, reply) => {
    try {
      const { bookId } = request.params as { bookId: string };
      return { data: runtime.listDrafts(bookId) };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/books/:bookId/materials/:materialId", async (request, reply) => {
    try {
      const { bookId, materialId } = request.params as { bookId: string; materialId: string };
      return { data: runtime.getMaterial(bookId, materialId) };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/drafts/:draftId", async (request, reply) => {
    try {
      const { draftId } = request.params as { draftId: string };
      return { data: runtime.getDraft(draftId) };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get("/api/v1/resources/:refId", async (request, reply) => {
    try {
      const { refId } = request.params as { refId: string };
      return { data: runtime.getResource(refId) };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });
}
