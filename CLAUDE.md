# InkOS - Multi-Agent Novel Production System

## 项目概述

InkOS 是一个多智能体小说生产系统，包含 CLI 工具、核心写作引擎、Web 服务端和前端界面。

## 仓库结构

```
packages/core/    # 核心写作引擎（agents, models, pipeline, state）
packages/cli/     # 命令行工具
packages/server/  # Web 服务端（Fastify + WebSocket + SQLite）
packages/web/     # Next.js 前端界面
scripts/          # 构建和开发辅助脚本
```

## 技术栈

- **Runtime**: Node.js >= 20, pnpm >= 9
- **Language**: TypeScript (strict mode, ES2022, Node16 modules)
- **Core**: Zod schema, Vitest
- **Server**: Fastify 5, better-sqlite3, @fastify/websocket
- **Web**: Next.js 15, React 19, @assistant-ui/react, shadcn/ui, Tailwind CSS v4
- **State**: Zustand

## 常用命令

```bash
pnpm build          # 全量构建
pnpm dev            # 全量开发模式
pnpm test           # 全量测试
pnpm typecheck      # 全量类型检查
pnpm --filter @actalk/inkos-server build   # 单包构建
pnpm --filter @actalk/inkos-web build      # 单包构建
```

## 工作流约束

### 后端代码编写规则

1. **后端首次代码编写由 Claude Code 负责** — 所有 `packages/server/` 下的新代码和重要修改必须由我（Claude Code）编写
2. **编写完成后交给 Codex 审查修正** — 使用 `codex exec` 进行代码审查和问题修复
3. Codex 调用方式：`codex exec --dangerously-bypass-approvals-and-sandbox "<审查/修复指令>"`
4. 审查完成后需验证：`pnpm --filter @actalk/inkos-server typecheck && pnpm --filter @actalk/inkos-server test`

### 代码规范

- TypeScript strict mode，不允许 `any`（除非接口边界确实无法避免）
- 所有 SQL 使用参数绑定，禁止字符串拼接
- SQLite 写操作必须用 `transaction()` 包裹
- 错误处理使用 `InkOSError`，未知异常不透出内部 message
- REST 路由必须配置 Fastify schema（params/query/response）
- WebSocket 命令必须校验 runId/threadId 绑定关系
- 中文注释说明业务意图，代码标识符使用英文

### 前端代码规范

- 对话相关 UI 使用 `@assistant-ui/react-ui` 组件（Thread, Composer, ActionBar）
- 管理页面使用 shadcn/ui 组件 + Tailwind CSS
- Tool UI 使用 `makeAssistantToolUI` 模式
- CSS 变量保持与 `aui-root` 体系对齐
- 组件文件命名：kebab-case（如 `book-page.tsx`）

### Git 规范

- 分支命名：`feat/<scope>-<description>`、`fix/<scope>-<description>`
- 提交信息：英文，`feat`/`fix`/`refactor`/`docs`/`chore` 前缀
- 远程使用 SSH 模式：`git@github.com:leinasi2014/inkos.git`

## 安全红线

- 禁止 SQL 注入：所有查询必须参数化
- 禁止信息泄露：错误响应不暴露内部堆栈、配置路径、API 密钥
- WebSocket 必须校验 Origin + token
- 事件广播必须按 threadId 隔离
- 读接口（GET）禁止触发写库操作
