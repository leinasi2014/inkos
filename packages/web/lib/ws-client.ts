import type { CommandAck, EventEnvelope } from "./contracts";

const WS_URL = process.env.NEXT_PUBLIC_INKOS_WS_URL ?? "ws://127.0.0.1:7749/ws";
const RESUME_PAGE_LIMIT = 100;

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
    let socket: WebSocket | null = null;
    const timeout = window.setTimeout(() => {
      socket?.close();
      reject(new Error("WebSocket command timed out"));
    }, 10_000);

    void createAuthenticatedSocket()
      .then((nextSocket) => {
        socket = nextSocket;

        nextSocket.addEventListener("open", () => {
          nextSocket.send(
            JSON.stringify({
              type: "command",
              commandId: command.commandId,
              command: command.command,
              payload: command.payload,
            }),
          );
        });

        nextSocket.addEventListener("message", (event) => {
          const payload = JSON.parse(String(event.data)) as CommandAck | { type: "error"; error: { message: string } };
          if (payload.type === "ack") {
            window.clearTimeout(timeout);
            nextSocket.close();
            resolve(payload);
          } else if (payload.type === "error") {
            window.clearTimeout(timeout);
            nextSocket.close();
            reject(new Error(payload.error.message));
          }
        });

        nextSocket.addEventListener("error", () => {
          window.clearTimeout(timeout);
          reject(new Error("WebSocket connection failed"));
        });
      })
      .catch((error) => {
        window.clearTimeout(timeout);
        reject(error instanceof Error ? error : new Error("WebSocket 鉴权失败"));
      });
  });
}

export function subscribeToEvents(options: {
  lastCursor?: number;
  threadIds?: string[];
  onEvent: (event: EventEnvelope) => void;
  onError?: (error: Error) => void;
}) {
  let disposed = false;
  let socket: WebSocket | null = null;
  let reconnectTimer: number | null = null;
  let reconnectAttempts = 0;
  let lastCursor = options.lastCursor ?? 0;

  function scheduleReconnect() {
    if (disposed) return;
    const delay = Math.min(30_000, 1_000 * 2 ** reconnectAttempts);
    reconnectAttempts += 1;
    reconnectTimer = window.setTimeout(() => {
      void connect();
    }, delay);
  }

  async function connect() {
    if (disposed) return;
    try {
      socket = await createAuthenticatedSocket();
    } catch (error) {
      options.onError?.(error instanceof Error ? error : new Error("WebSocket 鉴权失败"));
      scheduleReconnect();
      return;
    }

    socket.addEventListener("open", () => {
      reconnectAttempts = 0;
      socket?.send(
        JSON.stringify({
          type: "command",
          commandId: createCommandId(),
          command: "resume",
          payload: {
            lastCursor,
            // 服务端现在按 threadId 做订阅隔离；页面只声明自己真正需要的线程。
            threadIds: options.threadIds ?? [],
            limit: RESUME_PAGE_LIMIT,
          },
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
        return;
      }

      if (payload.nextCursor !== undefined) {
        lastCursor = payload.nextCursor;
        socket?.send(
          JSON.stringify({
            type: "command",
            commandId: createCommandId(),
            command: "resume",
            payload: {
              lastCursor,
              threadIds: options.threadIds ?? [],
              limit: RESUME_PAGE_LIMIT,
            },
          }),
        );
      }
    });

    socket.addEventListener("close", () => {
      socket = null;
      if (disposed) return;
      scheduleReconnect();
    });

    socket.addEventListener("error", () => {
      options.onError?.(new Error("WebSocket event stream failed"));
    });
  }

  void connect();

  return () => {
    disposed = true;
    if (reconnectTimer) window.clearTimeout(reconnectTimer);
    socket?.close();
  };
}

async function createAuthenticatedSocket(): Promise<WebSocket> {
  const url = resolveUrl(WS_URL);
  url.searchParams.set("token", await fetchWsToken());
  return new WebSocket(url.toString());
}

async function fetchWsToken(): Promise<string> {
  const response = await fetch(getWsAuthUrl(), { credentials: "include" });
  if (!response.ok) {
    throw new Error("获取 WebSocket token 失败");
  }
  const payload = await response.json() as { data?: { token?: string } };
  if (!payload.data?.token) {
    throw new Error("WebSocket token 缺失");
  }
  return payload.data.token;
}

function getWsAuthUrl(): string {
  const url = resolveUrl(WS_URL);
  url.protocol = url.protocol === "wss:" ? "https:" : "http:";
  url.pathname = "/api/v1/system/ws-auth";
  url.search = "";
  return url.toString();
}

function resolveUrl(url: string): URL {
  return new URL(url, window.location.href);
}
