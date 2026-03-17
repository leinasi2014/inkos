import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ServerConfig } from "../config.js";
import { ThreadScopeSchema } from "../contracts.js";
import { errorPayload, httpStatus, InkOSError } from "../errors.js";
import type { RuntimeService } from "../services/runtime-service.js";
import {
  buildAutomationOverview,
  buildChapterAuditRecord,
  buildProtectedSettingsOverview,
  buildSettingsOverview,
} from "../services/runtime-read-models.js";

const STRING_ID_SCHEMA = { type: "string", minLength: 1 } as const;
const POSITIVE_INT_SCHEMA = { type: "integer", minimum: 1 } as const;

const ThreadListQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    scope: { type: "string", enum: [...ThreadScopeSchema.options] },
    bookId: STRING_ID_SCHEMA,
  },
} as const;

const ThreadIdParamsSchema = {
  type: "object",
  required: ["threadId"],
  additionalProperties: false,
  properties: {
    threadId: STRING_ID_SCHEMA,
  },
} as const;

const RunIdParamsSchema = {
  type: "object",
  required: ["runId"],
  additionalProperties: false,
  properties: {
    runId: STRING_ID_SCHEMA,
  },
} as const;

const BookIdParamsSchema = {
  type: "object",
  required: ["bookId"],
  additionalProperties: false,
  properties: {
    bookId: STRING_ID_SCHEMA,
  },
} as const;

const BookMaterialParamsSchema = {
  type: "object",
  required: ["bookId", "materialId"],
  additionalProperties: false,
  properties: {
    bookId: STRING_ID_SCHEMA,
    materialId: STRING_ID_SCHEMA,
  },
} as const;

const BookTruthFileParamsSchema = {
  type: "object",
  required: ["bookId", "fileName"],
  additionalProperties: false,
  properties: {
    bookId: STRING_ID_SCHEMA,
    fileName: STRING_ID_SCHEMA,
  },
} as const;

const BookChapterParamsSchema = {
  type: "object",
  required: ["bookId", "chapterNo"],
  additionalProperties: false,
  properties: {
    bookId: STRING_ID_SCHEMA,
    chapterNo: POSITIVE_INT_SCHEMA,
  },
} as const;

const DraftIdParamsSchema = {
  type: "object",
  required: ["draftId"],
  additionalProperties: false,
  properties: {
    draftId: STRING_ID_SCHEMA,
  },
} as const;

const ResourceIdParamsSchema = {
  type: "object",
  required: ["refId"],
  additionalProperties: false,
  properties: {
    refId: STRING_ID_SCHEMA,
  },
} as const;

const SystemTokenHeadersSchema = {
  type: "object",
  required: ["x-inkos-system-token"],
  additionalProperties: true,
  properties: {
    "x-inkos-system-token": STRING_ID_SCHEMA,
  },
} as const;

export async function registerRestRoutes(app: FastifyInstance, runtime: RuntimeService, config: ServerConfig): Promise<void> {
  app.setErrorHandler((error, _request, reply) => {
    if (hasValidationError(error)) {
      void reply.status(400).send({
        error: {
          code: "REQUEST.INVALID",
          message: "请求参数不合法。",
        },
      });
      return;
    }

    void reply.status(httpStatus(error)).send({ error: errorPayload(error) });
  });

  app.get("/api/v1/health", async () => ({ data: { ok: true, name: "@actalk/inkos-server" } }));

  app.get("/api/v1/system/ws-auth", async () => ({
    data: {
      // Token 只发给通过 CORS 的本地页面，用来阻断跨站 WebSocket 劫持。
      token: config.wsAuthToken,
    },
  }));

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

  app.get<{ Headers: { "x-inkos-system-token": string } }>(
    "/api/v1/system/settings/internal",
    {
      schema: {
        headers: SystemTokenHeadersSchema,
      },
    },
    async (request, reply) => {
      try {
        assertSystemToken(request, config);
        return { data: buildProtectedSettingsOverview(config) };
      } catch (error) {
        return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
      }
    },
  );

  app.get<{ Querystring: { scope?: string; bookId?: string } }>(
    "/api/v1/threads",
    {
      schema: {
        querystring: ThreadListQuerySchema,
      },
    },
    async (request, reply) => {
      try {
        return { data: runtime.listThreads(request.query) };
      } catch (error) {
        return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
      }
    },
  );

  app.get<{ Params: { threadId: string } }>(
    "/api/v1/threads/:threadId",
    {
      schema: {
        params: ThreadIdParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        return { data: runtime.getThread(request.params.threadId) };
      } catch (error) {
        return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
      }
    },
  );

  app.get<{ Params: { threadId: string } }>(
    "/api/v1/threads/:threadId/messages",
    {
      schema: {
        params: ThreadIdParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        return { data: runtime.listMessages(request.params.threadId) };
      } catch (error) {
        return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
      }
    },
  );

  app.get<{ Params: { runId: string } }>(
    "/api/v1/runs/:runId",
    {
      schema: {
        params: RunIdParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        return { data: runtime.getRun(request.params.runId) };
      } catch (error) {
        return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
      }
    },
  );

  app.get<{ Params: { runId: string } }>(
    "/api/v1/runs/:runId/events",
    {
      schema: {
        params: RunIdParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        return { data: runtime.listRunEvents(request.params.runId) };
      } catch (error) {
        return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
      }
    },
  );

  app.get("/api/v1/books", async (_request, reply) => {
    try {
      return { data: runtime.listBooks() };
    } catch (error) {
      return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
    }
  });

  app.get<{ Params: { bookId: string } }>(
    "/api/v1/books/:bookId",
    {
      schema: {
        params: BookIdParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        return { data: runtime.getBook(request.params.bookId) };
      } catch (error) {
        return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
      }
    },
  );

  app.get<{ Params: { bookId: string } }>(
    "/api/v1/books/:bookId/chapters",
    {
      schema: {
        params: BookIdParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        return { data: runtime.listChapters(request.params.bookId) };
      } catch (error) {
        return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
      }
    },
  );

  app.get<{ Params: { bookId: string; chapterNo: number } }>(
    "/api/v1/books/:bookId/chapters/:chapterNo",
    {
      schema: {
        params: BookChapterParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        return { data: runtime.getChapter(request.params.bookId, request.params.chapterNo) };
      } catch (error) {
        return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
      }
    },
  );

  app.get<{ Params: { bookId: string; chapterNo: number } }>(
    "/api/v1/books/:bookId/chapters/:chapterNo/audit",
    {
      schema: {
        params: BookChapterParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        const audit = buildChapterAuditRecord(runtime.store, request.params.bookId, request.params.chapterNo);
        if (!audit) {
          throw new InkOSError("RUN.NOT_FOUND", `Chapter audit ${request.params.bookId}#${request.params.chapterNo} 不存在`, { statusCode: 404 });
        }
        return { data: audit };
      } catch (error) {
        return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
      }
    },
  );

  app.get<{ Params: { bookId: string } }>(
    "/api/v1/books/:bookId/truth",
    {
      schema: {
        params: BookIdParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        return { data: runtime.listTruthFiles(request.params.bookId) };
      } catch (error) {
        return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
      }
    },
  );

  app.get<{ Params: { bookId: string; fileName: string } }>(
    "/api/v1/books/:bookId/truth/:fileName",
    {
      schema: {
        params: BookTruthFileParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        return { data: runtime.getTruthFile(request.params.bookId, request.params.fileName) };
      } catch (error) {
        return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
      }
    },
  );

  app.get<{ Params: { bookId: string } }>(
    "/api/v1/books/:bookId/materials",
    {
      schema: {
        params: BookIdParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        return { data: runtime.listMaterials(request.params.bookId) };
      } catch (error) {
        return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
      }
    },
  );

  app.get<{ Params: { bookId: string } }>(
    "/api/v1/books/:bookId/drafts",
    {
      schema: {
        params: BookIdParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        return { data: runtime.listDrafts(request.params.bookId) };
      } catch (error) {
        return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
      }
    },
  );

  app.get<{ Params: { bookId: string; materialId: string } }>(
    "/api/v1/books/:bookId/materials/:materialId",
    {
      schema: {
        params: BookMaterialParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        return { data: runtime.getMaterial(request.params.bookId, request.params.materialId) };
      } catch (error) {
        return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
      }
    },
  );

  app.get<{ Params: { draftId: string } }>(
    "/api/v1/drafts/:draftId",
    {
      schema: {
        params: DraftIdParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        return { data: runtime.getDraft(request.params.draftId) };
      } catch (error) {
        return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
      }
    },
  );

  app.get<{ Params: { refId: string } }>(
    "/api/v1/resources/:refId",
    {
      schema: {
        params: ResourceIdParamsSchema,
      },
    },
    async (request, reply) => {
      try {
        return { data: runtime.getResource(request.params.refId) };
      } catch (error) {
        return reply.status(httpStatus(error)).send({ error: errorPayload(error) });
      }
    },
  );
}

function hasValidationError(error: unknown): error is { validation: unknown } {
  return typeof error === "object" && error !== null && "validation" in error;
}

function assertSystemToken(request: FastifyRequest, config: ServerConfig): void {
  const token = readHeader(request.headers["x-inkos-system-token"]);
  if (!token || token !== config.wsAuthToken) {
    throw new InkOSError("WS.AUTH_REQUIRED", "系统接口 token 无效。", { statusCode: 403 });
  }
}

function readHeader(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  return Array.isArray(value) && typeof value[0] === "string" ? value[0] : undefined;
}
