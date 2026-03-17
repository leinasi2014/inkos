import { chatCompletion, createLLMClient, type LLMClient } from "@actalk/inkos-core";
import type { ServerConfig } from "../config.js";
import type { ThreadRecord } from "../contracts.js";

export interface RuntimeLLM {
  completeChiefReply(input: {
    thread: ThreadRecord;
    content: string;
  }): Promise<string>;
}

function resolveProvider(provider: string): "openai" | "anthropic" | "custom" {
  if (provider === "anthropic") {
    return "anthropic";
  }

  if (provider === "custom") {
    return "custom";
  }

  return "openai";
}

function buildThreadLabel(thread: ThreadRecord): string {
  if (thread.scope === "book") {
    return `book thread (${thread.bookId ?? "unknown-book"})`;
  }

  if (thread.scope === "chapter") {
    return `chapter thread (${thread.bookId ?? "unknown-book"} / chapter ${thread.chapterNumber ?? "?"})`;
  }

  return `${thread.scope} thread`;
}

function buildSystemPrompt(thread: ThreadRecord): string {
  return [
    "你是 InkOS 的总编协同助手。",
    "你的回复必须简洁、直接、可执行，使用简体中文。",
    "不要输出 markdown 列表，不要自称 AI，不要寒暄。",
    "当请求是普通问答或轻量讨论时，直接给出简短结论和下一步建议。",
    "当请求涉及写作、素材、审计、多步执行时，先用一句话说明当前判断，再提示用户去 /chief 中继续事务。",
    `当前线程上下文：${buildThreadLabel(thread)}。`,
  ].join("\n");
}

function buildUserPrompt(thread: ThreadRecord, content: string): string {
  return [
    `线程标题：${thread.title}`,
    `用户消息：${content}`,
    "请输出 1 到 3 句总编式回复，控制在 120 字内。",
  ].join("\n");
}

export function createRuntimeLLM(config: ServerConfig): RuntimeLLM | null {
  if (config.mode !== "core" || !config.llm.apiKey) {
    return null;
  }

  const client: LLMClient = createLLMClient({
    provider: resolveProvider(config.llm.provider),
    baseUrl: config.llm.baseUrl,
    apiKey: config.llm.apiKey,
    model: config.llm.model,
    apiFormat: "chat",
    temperature: 0.4,
    maxTokens: 256,
    thinkingBudget: 0,
  });

  return {
    async completeChiefReply({ thread, content }) {
      const response = await chatCompletion(
        client,
        config.llm.model,
        [
          { role: "system", content: buildSystemPrompt(thread) },
          { role: "user", content: buildUserPrompt(thread, content) },
        ],
        {
          temperature: 0.4,
          maxTokens: 180,
          thinking: "disabled",
        },
      );

      const text = response.content.trim();
      return text || "已收到你的请求。若要继续执行多步事务，请回到 /chief 对应线程。";
    },
  };
}
