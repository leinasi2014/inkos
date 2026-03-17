import type { FastifyInstance, FastifyRequest } from "fastify";
import type { ServerConfig } from "../config.js";
import { CommandEnvelopeSchema } from "../contracts.js";
import { errorPayload, httpStatus, InkOSError } from "../errors.js";
import type { RuntimeService } from "../services/runtime-service.js";

const LOCALHOST_ORIGIN_RE = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i;

export async function registerWebsocketTransport(app: FastifyInstance, runtime: RuntimeService, config: ServerConfig): Promise<void> {
  app.get(
    "/ws",
    {
      websocket: true,
      preValidation: (request, reply, done) => {
        try {
          assertWebsocketHandshake(request, config);
          done();
        } catch (error) {
          void reply.status(httpStatus(error)).send({ error: errorPayload(error) });
        }
      },
    },
    (socket: any) => {
      socket.on("message", async (rawBuffer: Buffer | string) => {
        let payload: unknown;

        try {
          const rawText = typeof rawBuffer === "string" ? rawBuffer : rawBuffer.toString("utf-8");
          payload = JSON.parse(rawText) as unknown;
        } catch (error) {
          socket.send(JSON.stringify({ type: "error", error: errorPayload(error) }));
          return;
        }

        try {
          const envelope = CommandEnvelopeSchema.parse(payload);
          if (envelope.command === "resume") {
            const replay = runtime.replayAfter(envelope.payload.lastCursor, envelope.payload.threadIds ?? [], envelope.payload.limit ?? 100);
            for (const event of replay.events) {
              socket.send(JSON.stringify(event));
            }
            if (replay.nextCursor === undefined) {
              runtime.subscribeClient(socket, envelope.payload.threadIds ?? []);
            } else {
              runtime.removeClient(socket);
            }
            socket.send(
              JSON.stringify({
                type: "ack",
                commandId: envelope.commandId,
                success: true,
                ...(replay.nextCursor === undefined ? {} : { nextCursor: replay.nextCursor }),
              }),
            );
            return;
          }

          const ack = await runtime.handleRawCommand(envelope);
          socket.send(JSON.stringify(ack));
        } catch (error) {
          socket.send(JSON.stringify({ type: "error", error: errorPayload(error) }));
        }
      });

      socket.on("close", () => {
        runtime.removeClient(socket);
      });
    },
  );

  const heartbeat = setInterval(() => {
    const wsServer = (app as FastifyInstance & { websocketServer: { clients: Set<any> } }).websocketServer;
    for (const client of wsServer.clients) {
      if (client.readyState === 1 && typeof client.ping === "function") {
        client.ping();
      }
    }
  }, 30_000);

  app.addHook("onClose", async () => {
    clearInterval(heartbeat);
  });
}

function assertWebsocketHandshake(request: FastifyRequest, config: ServerConfig): void {
  const origin = readHeader(request.headers.origin);
  if (!origin || !LOCALHOST_ORIGIN_RE.test(origin)) {
    throw new InkOSError("WS.ORIGIN_FORBIDDEN", "WebSocket 只允许从 localhost / 127.0.0.1 发起连接。", { statusCode: 403 });
  }

  const query = request.query as { token?: unknown };
  if (typeof query.token !== "string" || query.token !== config.wsAuthToken) {
    throw new InkOSError("WS.AUTH_REQUIRED", "WebSocket token 无效。", { statusCode: 403 });
  }
}

function readHeader(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  return value?.[0];
}
