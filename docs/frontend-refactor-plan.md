# InkOS 前端重构计划

> 基于 assistant-ui 审查报告、官方文档研究、实际案例分析的综合规划

## 一、当前现状

| 维度 | 现状 | 问题 |
|------|------|------|
| assistant-ui 版本 | `@assistant-ui/react@^0.12.17` | 仅安装核心包，缺少 `react-ui` 预样式包 |
| assistant-ui 使用 | 仅 `assistant-thread.tsx` 一个文件 | 组件利用率 < 10% |
| 样式方案 | 728 行手写 CSS + CSS 变量 | 未用 Tailwind，与 assistant-ui 样式体系不兼容 |
| 对话界面 | 手动拼装 ThreadPrimitive | 缺少 Composer、ActionBar、BranchPicker 等 |
| 非对话界面 | 全部自定义 | 书籍/素材/审计/设置页面独立实现 |
| 状态管理 | Zustand（仅主题） | 未利用 assistant-ui Runtime 系统 |

## 二、重构目标

1. **全面采用 assistant-ui 组件体系** — 替换手动拼装为预构建组件
2. **引入 Tailwind CSS** — 对齐 assistant-ui 样式体系
3. **标准化 Tool UI** — 利用 `makeAssistantToolUI` 替换自定义 `StandaloneToolCard`
4. **渐进式迁移** — 不影响现有功能，逐步替换

## 三、分阶段实施计划

### Phase 1：基础设施（优先）

| 任务 | 说明 | 文件 |
|------|------|------|
| 安装 Tailwind CSS | 添加 `tailwind.config.ts`，配置 content 路径和 `aui-` 前缀 | 新增配置文件 |
| 安装 assistant-ui 全家桶 | `@assistant-ui/react-ui`、`@assistant-ui/react-markdown`、`ThreadList` add-on | `package.json` |
| 引入 shadcn/ui 基础组件 | 按钮、卡片、输入框、对话框、下拉菜单等 | 新增组件 |
| 对齐 CSS 变量 | 将现有 `--bg-*`、`--text-*` 等映射到 `aui-root` 变量体系 | `globals.css` |

### Phase 2：对话界面重构

| 组件 | 现有实现 | 替换方案 | 文件 |
|------|---------|---------|------|
| `AssistantThread` | 手动拼装 ThreadPrimitive | `Thread` 预构建组件 | `components/chief/assistant-thread.tsx` |
| 自定义输入框 | 手写 textarea | `Composer` 组件（支持附件、取消、建议） | `components/chief/assistant-thread.tsx` |
| `AssistantToolPart` | 自定义工具卡片 | `ToolFallback` + `makeAssistantToolUI` | `components/chief/assistant-tool-part.tsx` |
| 消息气泡 | 自定义 CSS | `MessagePrimitive` + 预样式 | `components/chief/assistant-thread.tsx` |
| 工具审批 UI | 自定义 approve/reject | `AuiIf` 条件渲染 + ActionBar | `components/chief/tool-ui.tsx` |
| 审批流程状态 | 自定义 | `BranchPicker` 模式展示多分支 | `components/chief/assistant-thread.tsx` |
| Markdown 渲染 | 未实现 | `@assistant-ui/react-markdown` | `components/chief/assistant-thread.tsx` |
| 消息操作 | 未实现（无复制/重试） | `ActionBar`（Copy/Reload/Edit/Export） | `components/chief/assistant-thread.tsx` |

### Phase 3：页面布局优化

参考官方案例（ChatGPT Clone、LangGraph Stockbroker）的布局模式：

**主编工作台（/chief）— 重点重构**
```
┌─────────────┬──────────────────────┬──────────────┐
│ ThreadList  │     Thread 主聊天区    │  Tool/审计面板 │
│ (280px)     │     (flex-1)         │  (320px)     │
│             │                      │              │
│ 线程列表     │  对话 + 审批 + 工具    │  审计报告      │
│             │                      │  素材预览      │
│             │                      │  章节状态      │
└─────────────┴──────────────────────┴──────────────┘
```
- 用 `AssistantSidebar` 替换自定义侧边栏
- 用 `Thread` 组件重构主聊天区
- 右侧面板展示 InkOS 特有的审计/素材视图

**仪表盘（/dashboard）— shadcn 重写**
- 借鉴官方案例的 metric-grid 布局
- 书籍卡片用 shadcn Card 组件重写
- 连接状态横幅对齐 assistant-ui 风格

**调度中心（/automation）— shadcn 重写**
- 队列列表用 shadcn Table 组件
- 日志流参考 LangGraph human-in-the-loop 模式

**书籍/素材/Truth 页面 — shadcn 重写**
- 这些是业务特定页面，assistant-ui 无直接替代
- 用 shadcn 组件统一视觉风格

### Phase 4：主题和响应式

| 任务 | 说明 |
|------|------|
| 深色/浅色主题 | 利用 assistant-ui 的 CSS 变量系统 + `data-theme` 属性 |
| 响应式优化 | 960px 三栏→单栏，768px 隐藏侧边栏 |
| 移动端底部导航 | 保留现有设计，用 Tailwind 磨砂玻璃效果重写 |
| 动画效果 | 参考新增的 `tw-shimmer` 插件做加载骨架屏 |

## 四、技术架构

```
依赖层次：
┌─────────────────────────────────────┐
│         InkOS 业务组件              │
│  (书籍管理、素材系统、审计流程)       │
├─────────────────────────────────────┤
│      shadcn/ui 组件层              │
│  (Button, Card, Dialog, Table...)   │
├─────────────────────────────────────┤
│   @assistant-ui/react-ui 预样式     │
│  (Thread, Composer, ActionBar...)   │
├─────────────────────────────────────┤
│   @assistant-ui/react 原语层        │
│  (ThreadPrimitive, ComposerPrimitive)│
├─────────────────────────────────────┤
│         Tailwind CSS + aui- 变量    │
└─────────────────────────────────────┘
```

**关键原则：**
- 对话相关 → assistant-ui 组件
- 业务管理页面 → shadcn/ui 组件 + 自定义逻辑
- 状态管理 → assistant-ui Runtime 替代手写 Zustand store
- Tool UI → `makeAssistantToolUI` 标准化所有工具渲染

## 五、参考案例

| 案例 | 借鉴点 |
|------|--------|
| ChatGPT Clone | 三栏布局、可折叠侧边栏、消息操作栏 |
| Claude Clone | 简洁消息气泡、工具调用展示 |
| LangGraph Stockbroker | human-in-the-loop 审批流程 UI |
| Open Canvas | 侧边面板交互模式 |
| assistant-ui Artifacts | 内嵌交互式内容渲染 |
| Mem0 | 记忆/上下文展示模式 |

## 六、预期收益

| 收益 | 说明 |
|------|------|
| 代码量减少 | 对话界面代码预计减少 60-70% |
| 功能提升 | 获得复制、重试、分支选择、Markdown 等开箱功能 |
| 视觉一致性 | shadcn/ui + assistant-ui 主题统一风格 |
| 维护成本 | 减少 globals.css 手写样式，Tailwind 工具类可维护 |
| 扩展性 | 新增工具/UI 只需写 tool component，框架自动渲染 |

## 七、assistant-ui 组件对照表

| assistant-ui 组件 | 用途 | InkOS 对应 |
|-------------------|------|-----------|
| `Thread` | 完整聊天界面 | `AssistantThread` |
| `ThreadList` | 会话列表 | 自定义（需新增） |
| `Composer` | 输入框（支持附件/建议） | 自定义 textarea |
| `MessagePrimitive` | 消息渲染原语 | 自定义消息气泡 |
| `ActionBar` | 消息操作（复制/重试/编辑） | 未实现 |
| `BranchPicker` | 分支选择 | 未实现 |
| `AuiIf` | 条件渲染 | 手动状态判断 |
| `ToolFallback` | 工具调用回退 UI | `AssistantToolPart` |
| `makeAssistantToolUI` | 自定义工具 UI 注册 | `StandaloneToolCard` |
| `AssistantSidebar` | 侧边栏 | 自定义 `AppShell` |
| `ModelSelector` | 模型选择器 | 未实现 |
| `Markdown` | Markdown 渲染 | 未实现 |
| `ThreadWelcome` | 空线程欢迎页 | 自定义 |
| `SyntaxHighlighter` | 代码高亮 | 未实现 |
