<p align="center">
  <img src="assets/logo.svg" width="180" height="180" alt="InkOS Logo">
</p>

<h1 align="center">InkOS</h1>

<p align="center">
  <strong>多智能体网文生产系统</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg" alt="Node.js"></a>
  <a href="https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-%3E%3D9.0.0-orange.svg" alt="pnpm"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?logo=typescript&logoColor=white" alt="TypeScript"></a>
</p>

<p align="center">
  <a href="README.md">English</a> | 中文
</p>

---

开源多智能体网文生产系统。AI 智能体自主完成写作、审计、修订的完整流程 — 人类审核门控让你始终掌控全局。

## 为什么需要 InkOS？

用 AI 写小说不是简单的"提示词 + 复制粘贴"。长篇小说很快就会崩：角色记忆混乱、物品凭空出现、同样的形容词每段都在重复、伏笔悄无声息地断掉。InkOS 把这些当工程问题来解决。

- **三大真相文件** — 追踪世界的真实状态，而非 LLM 的幻觉
- **反信息泄漏** — 确保角色只知道他们亲眼见证过的事
- **资源衰减** — 物资会消耗、物品会损坏，没有无限背包
- **词汇疲劳检测** — 在读者发现之前就捕捉过度使用的词语
- **自动修订** — 在人工审核之前修复数值错误和连续性断裂

## 工作原理

InkOS 为每一章运行多智能体管线：

```
 雷达 ──> 建筑师 ──> 写手 ──> 连续性审计员 ──> 修订者
  │         │         │            │               │
 扫描      规划      根据大纲     对照真相文件    修复审计员
 平台      章节      +当前状态    验证草稿       发现的问题
 趋势      结构      生成正文
```

### 智能体角色

| 智能体 | 职责 |
|--------|------|
| **雷达 Radar** | 扫描平台趋势和读者偏好，指导故事方向 |
| **建筑师 Architect** | 规划章节结构：大纲、场景节拍、节奏控制 |
| **写手 Writer** | 根据大纲 + 当前世界状态生成正文 |
| **连续性审计员 Auditor** | 对照三大真相文件验证草稿 |
| **修订者 Reviser** | 修复审计发现的问题 — 关键问题自动修复，其他标记给人工审核 |

### 三大真相文件

每本书维护三个文件作为唯一事实来源：

| 文件 | 用途 |
|------|------|
| `current_state.md` | 世界状态：角色位置、关系网络、已知信息、情感弧线 |
| `particle_ledger.md` | 资源账本：物品、金钱、物资数量及衰减追踪 |
| `pending_hooks.md` | 未闭合伏笔：铺垫、对读者的承诺、未解决冲突 |

连续性审计员对照这三个文件检查每一章草稿。如果角色"记起"了从未亲眼见过的事，或者拿出了两章前已经丢失的武器，审计员会捕捉到。

## 项目结构

```
inkos/
├── packages/
│   ├── core/              # 智能体运行时、管线、状态管理
│   │   ├── agents/        # architect, writer, continuity, reviser, radar
│   │   ├── pipeline/      # runner (写→审→改), scheduler (守护进程)
│   │   ├── state/         # 基于文件的状态管理器
│   │   ├── llm/           # OpenAI 兼容接口 (流式)
│   │   ├── notify/        # Telegram, 飞书, 企业微信
│   │   ├── models/        # Zod schema 校验
│   │   └── prompts/       # 提示词模板
│   └── cli/               # Commander.js 命令行
│       └── commands/      # init, book, write, review, status, export 等
├── templates/             # 项目脚手架模板
└── (规划中) studio/        # 网页审阅编辑界面
```

TypeScript 单仓库，pnpm workspaces 管理。

## 快速开始

### 前置要求

- Node.js >= 20.0.0
- pnpm >= 9.0.0
- OpenAI 兼容的 API Key

### 安装

```bash
git clone https://github.com/Narcooo/inkos.git
cd inkos
pnpm install
pnpm build
```

### 配置

```bash
cp .env.example .env
```

```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_BASE_URL=https://api.openai.com/v1   # 或任何兼容端点
OPENAI_MODEL=gpt-4o

# 可选：通知推送
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
FEISHU_WEBHOOK_URL=
WECOM_WEBHOOK_URL=
```

### 创建你的第一本书

```bash
inkos init              # 初始化项目
inkos book create       # 创建新书（交互式）
inkos write next        # 写下一章（运行完整智能体管线）
inkos review            # 审阅最新草稿
inkos status            # 查看项目状态
```

## 命令参考

| 命令 | 说明 |
|------|------|
| `inkos init` | 初始化项目 |
| `inkos book create` | 创建新书 |
| `inkos write next` | 智能体管线写下一章 |
| `inkos write rewrite <n>` | 重写第 N 章（恢复状态快照） |
| `inkos review` | 审阅并通过/拒绝草稿 |
| `inkos review approve-all <id>` | 批量通过所有待审章节 |
| `inkos status` | 项目状态 |
| `inkos export <id>` | 导出书籍为 txt/md |
| `inkos radar` | 扫描平台趋势 |
| `inkos config` | 查看/更新配置 |
| `inkos doctor` | 诊断配置问题 |
| `inkos up` | 启动守护进程模式 |
| `inkos down` | 停止守护进程 |

## 核心特性

### 状态快照

每章自动创建状态快照。使用 `inkos write rewrite <n>` 可以回滚并重新生成任意章节 — 世界状态、资源账本、伏笔钩子全部恢复到该章写入前的状态。

### 写入锁

基于文件的锁机制防止对同一本书的并发写入。

### 守护进程模式

`inkos up` 启动自主循环，按计划写章。管线对非关键问题全自动运行，当审计员标记无法自动修复的问题时暂停等待人工审核。

通过 Telegram、飞书或企业微信推送通知。

## 项目状态

**早期 alpha 阶段。** 核心管线可用，预计会有破坏性变更。

已实现：
- 完整智能体管线（建筑师 → 写手 → 连续性审计员 → 修订者）
- 基于文件的状态管理 + 三大真相文件
- 完整 CLI（初始化、建书、写作、审阅、导出）
- 状态快照和章节重写
- 通知推送（Telegram、飞书、企业微信）
- 守护进程模式

规划中：
- `packages/studio` — 网页审阅编辑界面
- 自定义智能体插件系统
- 多模型路由（不同智能体用不同模型）
- 平台格式导出（起点、番茄等）

## 参与贡献

欢迎贡献代码。这是早期阶段的软件，欢迎提 issue 或 PR。

```bash
pnpm install
pnpm dev          # 监听模式
pnpm test         # 运行测试
pnpm typecheck    # 类型检查
```

## 许可证

[MIT](LICENSE)
