---
tracker:
  kind: plane
  project_name: "InkOS"
  project_identifier: "INKOS"
  active_states:
    - Backlog
    - Todo
    - In Progress
    - Review
  terminal_states:
    - Done
    - Cancelled
plane_cli:
  workspace_slug: "codex-studio"
  project_name: "InkOS"
  project_identifier: "INKOS"
  roles:
    coordinator: "xujie"
    development: "zhangjuzheng"
    review_a: "hairui"
    review_b: "yuqian"
  role_members:
    coordinator: "徐阶"
    development: "张居正"
    review_a: "海瑞"
    review_b: "于谦"
  role_member_ids:
    coordinator: "4a76d987-54d3-45ae-a7b1-2234a99eef32"
    development: "1190b508-c74d-40c0-abf6-186fb07814aa"
    review_a: "f1979b9d-9a31-495a-878c-2721bd2461e1"
    review_b: "05bd004d-2b34-4fe8-97e2-fa8d087a04bd"
review:
  required_approvals: 2
git:
  auto_commit: false
  auto_push: false
  auto_pr: false
  auto_land: false
---

# InkOS Workflow

本仓库用于开发 `InkOS`，即一个本地优先的长篇小说生产系统，以及基于 `assistant-ui` 的总编工作台前端。

在本仓库中，Plane 是任务与协作的主链，`plane-cli` 是默认操作入口。

## 当前阶段

当前阶段先做 **文档驱动迭代**，不是直接进入开发拆解。

约束：

- 先通过 Plane 持续迭代需求文档和设计文档
- 文档稳定前，不提前批量创建开发类 issue
- 真正进入实现阶段后，再基于稳定文档生成开发 issue

## Plane 分类方案

为了降低使用复杂度，当前仓库只采用三层分类：

1. `Module`
2. `Issue`
3. `State`

当前主模块：

- `前端文档与原型`

该模块专门承载：

- 需求文档
- 设计文档
- HTML 原型
- 原型截图与交互说明

当前文档期的标准 issue 类型：

- 文档需求 issue
- 文档设计 issue
- HTML 原型 issue

当前不使用的重型分类：

- 不按功能点提前拆大量开发 issue
- 不在文档期创建大量 cycle
- 不把 Plane Pages 当唯一文档源

## 当前推荐用法

如果你不熟悉 Plane，当前只需要记住下面这套：

- 看 `Module`：确认当前大方向
- 看 `Issue`：确认具体正在迭代哪份文档或哪份原型
- 看 `State`：确认是否待做、进行中、评审中、已完成

对当前仓库，优先只关注以下 issue：

- `INKOS-1`：前端需求文档 v2 持续迭代
- `INKOS-2`：前端设计文档 v2 持续迭代
- `INKOS-3`：HTML 原型与统一样式持续迭代

当前主 cycle：

- `文档与原型收敛 S1`

当前基础 labels：

- `artifact:requirements`
- `artifact:design`
- `artifact:prototype`
- `phase:documentation`
- `track:frontend`

## Plane Staging

repo-local Plane staging 文件必须放在 `.plane-cli\plane\` 下，并按类型分目录：

- `.plane-cli\plane\workpad\`
- `.plane-cli\plane\handoffs\`
- `.plane-cli\plane\reviews\`
- `.plane-cli\plane\checkpoints\`

约束：

- `workpad upsert --file ...` 只从 `workpad` 目录取文件
- `handoff * --file ...` 只从 `handoffs` 目录取文件
- review 报告只放 `reviews`
- checkpoint 只放 `checkpoints`
- 文件名必须带 issue ref 前缀，避免不同 issue 混淆

## Comment And Report Format

### Workpad 必填 section 格式

- `scope`
  - Background
  - In Scope
  - Out of Scope
  - Inputs / Dependencies
- `acceptance-criteria`
  - 用户可观察结果
  - 文档结构约束
  - 不可接受结果
- `validation`
  - Automated Checks
  - Manual Checks
  - Skipped Checks
- `next-immediate-action`
  - Current Owner
  - Current Step
  - Exit Condition
- `implementation-report`
  - Changed Files
  - Summary
  - Validation
  - Residual Risks
- `review-report-a`
  - Files Reviewed
  - Blocking Findings
  - Non-blocking Findings
  - Verdict
- `review-report-b`
  - Files Reviewed
  - Blocking Findings
  - Non-blocking Findings
  - Verdict

## 状态流

- `Backlog`: 已记录但未排期
- `Todo`: 已明确定义，待处理
- `In Progress`: 正在编写或更新文档
- `Review`: 文档变更已完成，等待审阅
- `Done`: 文档收敛并通过验收
- `Cancelled`: 主动终止

## 文档优先规则

以下内容优先以文档 issue 迭代，不直接拆开发：

- 产品需求
- 前端设计
- 总编 Agent 行为边界
- skill 系统架构
- assistant-ui 交互协议

当前首批文档源文件：

- `docs/frontend-requirements-v2.md`
- `docs/frontend-design-v2.md`
- 后续 HTML 原型建议放在 `docs/prototypes/` 或独立原型目录

## HTML 原型规则

HTML 原型的定位是：

- 用于验证页面结构、交互流和统一样式
- 用于辅助评审需求文档和设计文档
- 不视为正式实现代码

要求：

- 原型优先采用 `assistant-ui` 的交互模式
- 原型尽量遵守设计文档定义的统一样式系统
- 原型与文档保持相互引用
- 原型更新时，同步更新对应 Plane issue 的 workpad 或说明

## Plane 功能使用策略

当前我会优先使用以下 Plane 能力来管理本仓库：

- `Modules`：按大方向组织工作
- `Issues`：承载具体文档、原型和后续开发任务
- `States`：表达任务阶段
- `Workpad`：作为每个 issue 的操作记录和当前真相
- `Cycles`：承载当前阶段性的收敛周期
- `Labels`：表达 issue 类型与工作轨道
- `Intake`：后续用于接收模糊想法、候选需求、临时灵感

当前本地 Plane 实例的能力限制：

- `Pages` 不稳定，不作为主工作流
- `Milestones create` 当前实例不支持，暂不依赖

因此当前的管理替代关系为：

- milestone 目标用 `cycle + module + workpad exit condition` 组合表达
- pages/wiki 目标用仓库文档 + issue workpad 表达

## Intake 使用原则

后续如果出现下面这类内容，我会优先放进 `Intake`，而不是直接建正式开发 issue：

- 只有一句话的想法
- 还没确定边界的功能
- 需要先讨论再决定是否进入文档的方向
- 还没进入正式排期的探索点

只有当 intake 内容满足以下条件，才升级成正式 issue：

- 已经明确目标
- 已经知道归属哪个 module
- 已经知道当前阶段是文档、原型还是开发

## 从文档转开发的规则

进入开发前，必须满足以下条件：

1. `INKOS-1` 需求文档已达到可执行状态
2. `INKOS-2` 设计文档已达到可拆解状态
3. `INKOS-3` 至少完成关键页面或交互的 HTML 原型验证

满足以上条件后，再进入第二阶段：

- 新建开发模块，而不是直接在文档模块里继续堆 issue
- 开发模块按能力域拆分，例如：
  - `Chief Agent`
  - `Skill System`
  - `assistant-ui Runtime`
  - `Materials System`
  - `Design System & Layout`

开发 issue 的生成原则：

- 每条开发 issue 必须引用来源文档 issue
- 开发 issue 必须能回指到对应文档章节
- 文档变更未稳定时，不创建实现 issue

一句话规则：

- 先收敛文档
- 再验证原型
- 最后按文档生成开发 issue

## 开发前置条件

进入实际开发前，至少要满足：

1. 文档 issue 已经收敛到可执行版本
2. 关键交互边界已在 Plane workpad 中确认
3. 再基于文档生成开发类 issue
