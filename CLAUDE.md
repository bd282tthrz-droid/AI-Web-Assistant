# 项目说明

## 核心工作流程（绝对禁止违反）

### 第一条：禁止直接修改，必须先方案后执行

**任何涉及代码修改、文件操作、配置变更的任务，必须遵循以下流程：**

1. **先分析问题** — 描述当前代码的问题、错误原因、影响范围
2. **给出修改方案** — 列出具体改哪里、改什么、为什么改，包括：
   - 涉及的文件列表
   - 每处改动的内容和原因
   - 预期的效果
3. **等待确认** — 必须等用户明确说"可以"或"确认修改"后，才能执行任何修改操作
4. **执行修改** — 确认后按方案逐一修改

**违反此规则的后果：** 可能引入不需要的变更，浪费时间回滚。如果发现直接修改的行为，请立即停止并指出规则被违反。

### 第二条：每次对话必须读取本规则

每次对话开始时，必须重新读取 CLAUDE.md 中的"核心工作流程"部分，确保遵守上述规则。

## 项目概述

网站 AI 助手 (web-assistant) — 嵌入网站的 AI 对话 Widget，基于 React + Assistant UI + Dify 构建。

## 技术栈

| 技术             | 版本     | 用途                                           |
| ---------------- | -------- | ---------------------------------------------- |
| React            | 19+      | UI 框架                                        |
| TypeScript       | 6+       | 类型安全                                       |
| HeroUI           | v3.2.4   | UI 组件库（基于 Tailwind v4，不需要 Provider） |
| assistant-ui     | latest   | AI 对话组件（Thread / Composer）               |
| react-icons      | fa6 模块 | 图标库（集中管理于 src/constants/icon.ts）     |
| Zod              | v4       | 外部数据校验（API / 表单）                     |
| Dify             | 云端     | AI 后端（SSE 流式响应）                        |
| Vercel AI SDK    | v7       | AI 运行时                                      |
| dify-ai-provider | v1       | Dify ↔ AI SDK 适配层                           |
| Vite             | v8       | 构建工具                                       |
| Tailwind CSS     | v4       | 样式框架                                       |

## 关键约定

1. **HeroUI v3 不需要 Provider** — 直接使用组件，无需 HeroUIProvider 包裹
2. **样式导入顺序** — index.css 中必须先 `@import "tailwindcss"` 再 `@import "@heroui/styles"`
3. **路径别名** — 使用 `@/` 指向 `src/`（已配置 vite.config.ts 和 tsconfig.app.json）
4. **工具调用机制** — 通过 inputs.tools 传入工具定义，AI 返回结构化指令块，前端解析执行
5. **会话存储** — sessionStorage 存当前 Tab 会话，localStorage 存历史会话列表
6. **assistant-ui 集成** — 混合方案，阶段 A 用完整组件，样式瓶颈时降级 Primitive
7. **环境变量集中管理** — 绝对禁止在业务代码中直接使用 `import.meta.env.VITE_*` 读取环境变量。所有环境变量必须在 `src/services/dify/dify-config.ts` 或 `src/constants/api.ts` 等集中配置文件中定义，业务代码通过导入配置对象引用（如 `DIFY_CONFIG.apiKey`）。违反此规则会导致环境变量散落项目各处，难以维护和排查。
8. **语言规范** — 所有用户可见的 UI 文本（标签、按钮、提示、错误消息等）必须使用英文。代码注释不限语言。除注释外，其他所有代码相关文本（变量名、函数名、类型名、日志、commit message 等）禁止使用中文。

## HeroUI v3 与 v2 API 差异（重要）

v3 API 与 v2 有重大变化，禁止凭记忆使用 v2 写法：

### Button 组件

- **删除 `color` prop** — v2 的 `color="primary"` 不再存在
- **variant 值变化**：
  - v2: `solid` / `bordered` / `light` / `flat` / `faded` / `shadow` / `ghost`
  - v3: `primary` / `secondary` / `tertiary` / `outline` / `ghost` / `danger` / `danger-soft`
  - 语义合并：v3 的 `variant="primary"` 等同于 v2 的 `color="primary" variant="solid"`
- **`isLoading` → `isPending`**
- **保留**：`size` (`sm`/`md`/`lg`)、`fullWidth`、`isDisabled`、`isIconOnly`、`onPress`

### 其他组件差异

- 使用任何 HeroUI 组件前，必须查看官方文档：https://heroui.com/en/docs/react/components/
- 或查看类型定义：node_modules/@heroui/styles/dist/components/<component>/<component>.styles.d.ts
- 禁止凭记忆推测 API 参数

## 开发规范

- 组件必须使用箭头函数：`const Component = () => {}`
- 禁止 any 类型，不确定用 unknown
- 外部数据用 Zod Schema（src/schemas/），内部类型用 TS 原生
- 图标必须通过 src/constants/icon.ts 导入
- API Endpoint 集中在 src/constants/api.ts
- 业务逻辑抽离至 src/hooks/use-xxx.ts
- 文件命名 kebab-case，Hook 文件 use- 开头，Schema 文件 .schema.ts 结尾
- 单文件不超过 150 行

## 目录结构

```
src/
├── components/   # 通用原子组件
├── features/     # 业务功能模块
│   ├── chat-widget/      # 聊天 Widget 嵌入层
│   ├── page-context/    # 页面内容提取
│   └── action-executor/ # 页面操作执行
├── hooks/        # 业务逻辑 Hook
├── schemas/      # Zod Schema 校验层
├── services/     # API 请求封装
│   └── dify/             # Dify 服务层
├── constants/    # 静态常量（api.ts, icon.ts）
├── utils/        # 纯工具函数
└── providers/    # 全局 Provider
```

## 环境变量

创建 `.env.local` 文件：

```
VITE_DIFY_API_KEY=app-xxxxxxxxxxxxxxxxx
VITE_DIFY_APP_ID=your-app-id
```
