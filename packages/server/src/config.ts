import { mkdirSync } from "node:fs";
import { join } from "node:path";

export interface ServerConfig {
  readonly host: string;
  readonly port: number;
  readonly dataDir: string;
  readonly databasePath: string;
  readonly mode: "mock" | "core";
  readonly llm: {
    readonly provider: string;
    readonly baseUrl: string;
    readonly model: string;
    readonly apiKey?: string;
  };
}

export function createServerConfig(): ServerConfig {
  const cwd = process.cwd();
  const dataDir = process.env.INKOS_UI_DATA_DIR ?? join(cwd, ".inkos-ui");
  mkdirSync(dataDir, { recursive: true });

  return {
    host: process.env.INKOS_SERVER_HOST ?? "127.0.0.1",
    port: Number(process.env.INKOS_SERVER_PORT ?? "7749"),
    dataDir,
    databasePath: process.env.INKOS_UI_DB_PATH ?? join(dataDir, "inkos.db"),
    mode: process.env.INKOS_SERVER_MODE === "core" ? "core" : "mock",
    llm: {
      provider: process.env.INKOS_LLM_PROVIDER ?? "openai",
      baseUrl: process.env.INKOS_LLM_BASE_URL ?? "https://open.bigmodel.cn/api/coding/paas/v4",
      model: process.env.INKOS_LLM_MODEL ?? "glm-5",
      apiKey: process.env.INKOS_LLM_API_KEY,
    },
  };
}
