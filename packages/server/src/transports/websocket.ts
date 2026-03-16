import type { FastifyInstance } from "fastify";
import { errorPayload } from "../errors.js";
import type { RuntimeService } from "../services/runtime-service.js";

export async function registerWebsocketTransport(app: FastifyInstance, runtime: RuntimeService): Promise<void> {
  app.get("/ws", { websocket: true }, (socket: any) => {
    runtime.addClient(socket);

    socket.on("message", async (rawBuffer: Buffer | string) => {
      try {
        const rawText = typeof rawBuffer === "string" ? rawBuffer : rawBuffer.toString("utf-8");
        const payload = JSON.parse(rawText) as unknown;
        const ack = await runtime.handleRawCommand(payload);
        socket.send(JSON.stringify(ack));

        const command = payload as { command?: string; payload?: { lastCursor?: number } };
        if (command.command === "resume") {
          for (const event of runtime.replayAfter(command.payload?.lastCursor ?? 0)) {
            socket.send(JSON.stringify(event));
          }
        }
      } catch (error) {
        socket.send(JSON.stringify({ type: "error", error: errorPayload(error) }));
      }
    });

    socket.on("close", () => {
      runtime.removeClient(socket);
    });
  });

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
