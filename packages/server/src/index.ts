import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { createServerConfig } from "./config.js";
import { registerRestRoutes } from "./routes/rest.js";
import { RuntimeService } from "./services/runtime-service.js";
import { createRuntimeLLM } from "./services/runtime-llm.js";
import { DatabaseStore } from "./store/database.js";
import { registerWebsocketTransport } from "./transports/websocket.js";

async function main(): Promise<void> {
  const config = createServerConfig();
  const app = Fastify({ logger: true });
  const store = new DatabaseStore(config.databasePath);
  const runtime = new RuntimeService(store, createRuntimeLLM(config));

  await app.register(cors, {
    origin: [/^http:\/\/127\.0\.0\.1:\d+$/, /^http:\/\/localhost:\d+$/],
    credentials: true,
  });
  await app.register(websocket);
  await registerRestRoutes(app, runtime, config);
  await registerWebsocketTransport(app, runtime);

  app.get("/", async () => ({
    name: "@actalk/inkos-server",
    mode: config.mode,
    llm: {
      provider: config.llm.provider,
      baseUrl: config.llm.baseUrl,
      model: config.llm.model,
      hasApiKey: Boolean(config.llm.apiKey),
    },
  }));

  await app.listen({ host: config.host, port: config.port });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
