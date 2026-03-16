# InkOS 前端设计文档 v2

## 1. 设计目标与阶段边界

本文档定义 InkOS Web 前端 v2 在当前阶段的最小技术设计基线。

当前阶段不是正式开发阶段，而是 **设计冻结前阶段**。目标不是把所有未来能力一次性写成硬协议，而是先冻结：

- 最小运行时不变量
- 最小数据模型
- 最小 Transport 契约
- `web -> server -> core` 的边界
- 原型阶段所需的页面蓝图与 Tool UI 状态模型

当前阶段不冻结：

- 完整 settings API
- 全量 skill 管理面
- 全量 materials 类型
- 所有页面的最终布局细节

## 2. 文档治理与阶段顺序

当前对应的 Plane issue：

- `INKOS-2`：前端设计文档 v2 持续迭代

阶段顺序是硬约束：

1. 需求文档冻结产品边界
2. 设计文档冻结最小协议和系统边界
3. HTML 原型验证页面与交互
4. 原型反馈回写文档
5. 再生成开发 issue

因此本文档中的内容分为两类：

- `当前冻结`：后续原型和开发都依赖
- `后续演进`：保留方向，但不作为当前实现硬约束

## 3. 系统分层总览

### 3.1 包边界

#### `packages/web`

职责：

- 页面渲染
- `assistant-ui` runtime 与 Tool UI
- 资源查询
- 本地 UI 状态

#### `packages/server`

职责：

- 唯一执行入口
- Assistant Transport 事件流与命令入口
- 资源 API
- 线程、run、事件、草案持久化
- worker facade
- skill 解析与快照
- 调用 `@actalk/inkos-core`

#### `packages/core`

职责：

- `PipelineRunner`
- `StateManager`
- `Scheduler`
- 现有小说生产能力

### 3.2 强约束：唯一执行入口

- 前端只调用 `packages/server`
- `packages/server` 只调用 `@actalk/inkos-core`
- `packages/server` 不允许 exec CLI
- `packages/core` 不直接承担前端协议职责

## 4. 当前阶段冻结的最小运行时不变量

当前阶段先冻结以下不变量：

- `Thread` 是会话容器
- `Run` 是一次执行容器
- 所有写操作都通过 command 进入 server
- 所有对话态结果都通过事件流返回
- 每个可回放结果都必须有稳定的事件记录
- `server -> worker facade -> core` 是固定调用链
- 一个 `runId` 内 skill 快照固定不漂移

当前阶段不冻结：

- skill 更新/回滚 UI
- 完整 settings 页行为
- 所有未来 Tool UI 类型

## 5. 最小数据模型

### 5.1 `Thread`

字段：

- `threadId`
- `scope`: `global | book | chapter | quick`
- `title`
- `bookId?`
- `chapterNumber?`
- `lastRunId?`
- `lastMessageAt`
- `archived`

### 5.2 `SkillRef`

字段：

- `skillId`
- `skillVersion`
- `skillHash`
- `source`: `project | user | builtin`

### 5.3 `Run`

字段：

- `runId`
- `threadId`
- `status`: `planning | executing | awaiting_approval | completed | failed | cancelled`
- `startedAt`
- `endedAt?`
- `currentStepId?`
- `eventCursor`
- `pendingApprovalId?`
- `activeCommandId?`
- `lastPersistedAt`
- `skillsLocked: Record<string, SkillRef>`

### 5.4 `ToolPresentation`

字段：

- `toolEventId`
- `runId`
- `toolName`
- `toolSchemaVersion`
- `previewPayload`
- `resourceRef?`
- `actions?`
- `skillId`
- `skillVersion`

说明：

- `previewPayload` 用于回放默认态
- `resourceRef` 用于大文本、附件、长 diff、truth file 片段的延迟加载
- `actions` 用于声明卡片允许的显式用户动作，包括应用、重写、编辑、丢弃与导航入口
- 若结果需要跳转到书籍页、章节页或其他专页，server 必须通过 `actions` 显式声明入口，web 不允许根据 `toolName`、`run_completed` 或 assistant 文本做硬编码跳转

### 5.5 `DraftArtifact`

字段：

- `draftId`
- `type`
- `bookId`
- `status`: `draft | applied | discarded | failed`
- `revision`
- `parentDraftId?`
- `sourceThreadId`
- `sourceRunId`
- `skillRef`
- `toolSchemaVersion`
- `preview`
- `artifactSnapshotRefs[]`
- `etag`

## 6. Worker Facade 与 Core Integration

这是当前阶段必须补明确的一层。

### 6.1 `worker facade` 的职责

`packages/server` 内必须存在一层 facade / orchestrator，用于：

- 把总编计划拆成 step
- 为每个 step 绑定 skill
- 把 core 调用包装成可追踪事件
- 负责审批挂起、取消、失败归因、结果汇总

### 6.2 为什么必须有这一层

没有 facade 就无法稳定实现：

- `worker_trace`
- `ToolPresentation`
- 审批挂起
- 取消与重试
- 回放一致性

### 6.3 与 core 的关系

- `core` 保持生产能力内核
- `server` 负责前端协议与 orchestration
- facade 既不是前端，也不是 core，而是 server 的执行桥接层

## 7. 最小 Transport 契约

### 7.1 协议分层

- Transport：聊天、命令、事件流
- REST：列表、详情、只读资源查询

### 7.2 当前阶段冻结的 command

当前阶段冻结的 command 类型：

- `send_message`
- `submit_form`
- `approve_action`
- `cancel_action`
- `apply_draft`
- `regenerate_draft`
- `edit_draft`
- `discard_draft`
- `cancel_run`

当前阶段不冻结 `invoke_tool_action` 为主路径，只保留为后续兼容扩展候选。

### 7.3 当前阶段冻结的事件

当前阶段冻结：

- `run_started`
- `run_state_changed`
- `assistant_text_delta`
- `tool_presented`
- `draft_state_changed`
- `run_completed`
- `run_failed`
- `run_cancelled`

补充约束：

- `apply_draft / regenerate_draft / edit_draft / discard_draft` 改变草案事实状态后，server 必须发出 `draft_state_changed`
- `draft_state_changed` 至少要能标识 `draftId / revision / status / sourceRunId`

### 7.4 幂等

所有 command 必须带 `commandId`。

server 必须保证：

- 相同 `commandId` 只执行一次
- 重复提交返回同一结果
- `apply_draft` 对同一 `draftId + revision` 幂等

## 8. Replay / Resume / Event Store

### 8.1 当前阶段的回放承诺

当前阶段只承诺：

- 线程刷新后可恢复最近执行状态
- 已记录的 `ToolPresentation` 可回放默认态
- 历史结果查看不需要重新执行 skill

### 8.2 前提

为实现以上承诺，server 必须持久化：

- run 元数据
- 事件日志
- artifact snapshot 引用

### 8.3 当前阶段不承诺

- 所有长文本都永久内嵌在事件中
- 所有旧资源都不依赖额外 snapshot
- 所有未来 schema 版本都自动兼容

## 9. Skill Runtime Contract

### 9.1 目标

skill 是 server 侧内部运行时能力包，不是前端主交互概念。

### 9.2 当前阶段冻结

当前阶段只冻结：

- 每个关键 worker 必须绑定一个且仅一个 skill
- `runId` 内 skill 快照固定
- `skillHash` 用于复盘标识
- skill 只能声明兼容，不直接控制前端 schema

### 9.3 当前阶段延后

以下内容延后到 v2.1 或开发细化阶段：

- 完整 settings/skills UI
- skill 更新/回滚/pin 流程
- Stable / Experimental 的最终产品面
- 项目级与用户级 override 的完整交互

### 9.4 `skill.json`

当前阶段只保留方向性约束：

- 存在 `skill.json`
- 记录 `id / version / description / compatibleToolSchemaVersions`
- server 启动时校验

不在当前阶段把完整 skill 包目录与所有字段写成不可变硬契约。

## 10. Tool UI Registry 与状态模型

### 10.1 稳定命名空间

`toolName` 维持产品级稳定命名：

- `chief.*`
- `material.*`
- `chapter.*`
- `scheduler.*`

### 10.2 当前阶段最小 Tool UI 集合

- `chief.plan`
- `chief.worker-trace`
- `material.request-form`
- `material.table-result`
- `chief.approval-request`
- `chapter.audit-report`

### 10.3 Tool UI 状态语义

当前阶段先冻结 UX 状态：

- `idle`
- `submitting`
- `generating`
- `awaiting_user_action`
- `applied`
- `discarded`
- `failed`

状态推导约束：

- `awaiting_user_action` 表示当前卡片存在待用户决策的显式 action，不要求与 `Run.status` 一一等价
- `applied / discarded / failed` 优先从绑定的 `DraftArtifact.status` 推导
- web 只允许维护 `submitting / generating` 这类短暂交互中间态，不允许长期复制服务端事实状态

### 10.4 schema ownership

- `toolSchemaVersion` 由 server 维护
- web 只消费版本
- skill 只能声明兼容范围，不能自行决定前端 schema 版本

## 11. assistant-ui 交互模型

### 11.1 当前阶段重点

当前阶段只需要设计清楚：

- `Thread`
- Tool UI 容器
- `AssistantModal`
- modal 升级到 `/chief` 的规则

### 11.2 `/chief` 最小闭环

原型和后续实现只先验证：

- 主线程
- 表单卡
- 结果卡
- 审批卡
- 页面跳转

以下能力延后：

- 完整线程分组策略
- 右侧工件检查器细化
- skill 快照展示细节

## 12. 页面蓝图

### 12.1 当前阶段重点页面

#### `/chief`

最小目标：

- 能承载主线程
- 能完成表单 -> 结果 -> 确认
- 能处理中断、失败、审批

#### 章节分析完成面

这是对需求文档“场景 D：诊断审计失败”的最小技术承载定义。

最小目标：

- 用户能在 `/chief` 看到 `chapter.audit-report`
- `chapter.audit-report` 默认提供结构化问题摘要
- 若需要长文本阅读、正文上下文或完整段落定位，跳转章节页完成

#### `/books/:bookId/chapters/:chapterNo`

最小目标：

- 作为章节分析的长文本阅读面
- 作为 audit 结果的深读与上下文查看面

#### `/books/:bookId/materials`

最小目标：

- 能看到已保存或未保存的 materials
- 能查看来源线程和状态

### 12.2 占位级页面

以下页面当前只保留职责，不冻结完整布局：

- `/truth`
- `/automation`
- `/settings`

## 13. 统一样式系统设计基线

当前阶段先冻结这些设计基线：

- light / dark 双主题 token
- 页面栅格
- 内容最大宽度
- 聊天卡片与业务卡片的关系
- 主按钮 / 次按钮 / 危险按钮等级
- 表格密度
- 卡片层级与留白

当前阶段不冻结：

- 所有最终像素级尺寸
- `/chief` 三栏比例
- 工件检查器是否常驻

主题系统要求：

- light 和 dark 共用同一套语义 token 命名
- 不允许为 dark 主题单独发明一套组件层级
- 原型阶段至少验证 `/chief` 的 light/dark 切换
- 后续页面优先复用 token，不允许页面内私有硬编码色板

## 14. Materials Bridge Strategy

### 14.1 当前阶段冻结

当前阶段只冻结：

- 首批 types：`character / faction / location`
- `materials_summary.md` 作为 bridge strategy
- server 在调用 core 前注入 materials 摘要

### 14.2 说明

`materials_summary.md` 是当前阶段的桥接方案，不代表长期终态架构。

## 15. 本地持久化与唯一事实源

当前阶段写死：

- server 负责持久化 `Thread / Run / Event / DraftArtifact`
- `.inkos-ui/` 由 server 管理
- web 通过 API 读取，不直接写文件

## 16. 当前阶段延后项

以下内容明确延后：

- 完整 settings/skills API
- Stable / Experimental 完整交互
- 全量 materials 类型
- 高级 modal 细则
- `/truth`、`/automation`、`/settings` 的最终布局

## 17. 技术验证矩阵

当前阶段至少需要验证：

- `commandId` 幂等
- `run_started / tool_presented / run_completed / run_failed / run_cancelled`
- run 恢复
- `DraftArtifact` 的 revision 规则
- facade 能把 core 调用包装成稳定 step
- skill 快照在一个 run 内不漂移
