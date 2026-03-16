import type { CommandAck, EventEnvelope } from "./contracts";

const WS_URL = process.env.NEXT_PUBLIC_INKOS_WS_URL ?? "ws://127.0.0.1:7749/ws";

export function getWsUrl(): string {
  return WS_URL;
}

function createCommandId() {
  return `cmd_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export async function sendCommand(command: {
  commandId: string;
  command: string;
  payload: Record<string, unknown>;
}): Promise<CommandAck> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(WS_URL);
    const timeout = window.setTimeout(() => {
      socket.close();
      reject(new Error("WebSocket command timed out"));
    }, 10_000);

    socket.addEventListener("open", () => {
      socket.send(
        JSON.stringify({
          type: "command",
          commandId: command.commandId,
          command: command.command,
          payload: command.payload,
        }),
      );
    });

    socket.addEventListener("message", (event) => {
      const payload = JSON.parse(String(event.data)) as CommandAck | { type: "error"; error: { message: string } };
      if (payload.type === "ack") {
        window.clearTimeout(timeout);
        socket.close();
        resolve(payload);
      } else if (payload.type === "error") {
        window.clearTimeout(timeout);
        socket.close();
        reject(new Error(payload.error.message));
      }
    });

    socket.addEventListener("error", () => {
      window.clearTimeout(timeout);
      reject(new Error("WebSocket connection failed"));
    });
  });
}

export function subscribeToEvents(options: {
  lastCursor?: number;
  onEvent: (event: EventEnvelope) => void;
  onError?: (error: Error) => void;
}) {
  let disposed = false;
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let reconnectAttempts = 0;
  let lastCursor = options.lastCursor ?? 0;

  function connect() {
    if (disposed) return;
    socket = new WebSocket(WS_URL);

    socket.addEventListener("open", () => {
      reconnectAttempts = 0;
      socket?.send(
        JSON.stringify({
          type: "command",
          commandId: createCommandId(),
          command: "resume",
          payload: { lastCursor },
        }),
      );
    });

    socket.addEventListener("message", (event) => {
      const payload = JSON.parse(String(event.data)) as EventEnvelope | CommandAck | { type: "error"; error: { message: string } };
      if (payload.type === "event") {
        lastCursor = Math.max(lastCursor, payload.cursor);
        options.onEvent(payload);
        return;
      }

      if (payload.type === "error") {
        options.onError?.(new Error(payload.error.message));
      }
    });

    socket.addEventListener("close", () => {
      socket = null;
      if (disposed) return;
      const delay = Math.min(30_000, 1_000 * 2 ** reconnectAttempts);
      reconnectAttempts += 1;
      reconnectTimer = window.setTimeout(connect, delay);
    });

    socket.addEventListener("error", () => {
      options.onError?.(new Error("WebSocket event stream failed"));
    });
  }

  connect();

  return () => {
    disposed = true;
    if (reconnectTimer) window.clearTimeout(reconnectTimer);
    socket?.close();
  };
}
