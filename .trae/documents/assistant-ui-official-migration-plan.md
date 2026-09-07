# Assistant UI 官方机制迁移计划

## Context

当前项目基于 `@assistant-ui/react` 的 `LocalRuntime` + `ChatModelAdapter` 构建嵌入式 AI 助手。工具调用采用自定义 ` ```action ` 代码块解析机制，绕过了 assistant-ui 的工具状态机。经查阅官方文档（https://www.assistant-ui.com/docs），发现三处偏离官方推荐：

1. **工具调用机制**：自定义 action 块 vs 官方 `tool-call` content part + `defineToolkit` + `unstable_humanToolNames`
2. **废弃 API**：`ThreadPrimitive.Empty` 和 `ThreadPrimitive.Messages` 的 `components` prop 均已废弃
3. **虚拟列表**：当前用 CSS `content-visibility: auto`，官方推荐 `Unstable_MessageById` 路径

用户确认执行全部三项迁移。Dify 端不改动（继续输出 ```action 块），前端 adapter 负责转换为官方 tool-call content part。

## 关键 API 约束（探索确认）

- `humanTool()` / `providerTool()` 工厂函数依赖 `"use generative"` 编译器，非 generative 项目会运行时抛错。需直接构造带 `type: "human"` / `type: "frontend"` 的 `ToolDefinition` 对象，通过 `defineToolkit` 第二重载注入。
- `ToolCallMessagePartProps` 提供 `addResult(result)` 方法，human tool 的 render 组件通过它回传用户确认结果，runtime 自动恢复 adapter。
- `ChatModelRunUpdate.content` 接受 `ToolCallMessagePart`（含 `type: "tool-call"`, `toolCallId`, `toolName`, `args`, `argsText`）。
- `useLocalRuntime(adapter, { unstable_humanToolNames: [...] })` 声明 human tool 列表，adapter 返回 `status: { type: "requires-action", reason: "tool-calls" }` 时暂停。
- `unstable_useThreadMessageIds` + `ThreadPrimitive.Unstable_MessageById` 是官方虚拟列表路径（基于 id 而非 index，支持窗口化）。

## 实现方案

### 阶段 1：工具注册层（新建）

**新建 `src/features/action-executor/toolkit.ts`**

用 `defineToolkit` 注册 5 个工具，复用现有 `executeAction` 执行器：

```typescript
import { defineToolkit, type ToolDefinition } from "@assistant-ui/react";
import { z } from "zod";
import { executeAction } from "./action-executor";
import type { ActionResult } from "./action-types";
import { ConfirmToolUI } from "@/features/chat-widget/tool-ui/confirm-tool-ui";
import { FrontendToolUI } from "@/features/chat-widget/tool-ui/frontend-tool-ui";

// human tool（需要用户确认）：click_element, navigate_to
// frontend tool（自动执行）：fill_input, scroll_to, highlight_element

const toolkit = defineToolkit({
  click_element: {
    type: "human",
    description: "点击页面上的指定元素",
    parameters: z.object({
      action: z.string().optional(),
      selector: z.string().optional(),
      text: z.string().optional(),
      productId: z.string().optional(),
    }),
    render: ConfirmToolUI,
  } as ToolDefinition,
  navigate_to: {
    type: "human",
    description: "跳转到指定 URL",
    parameters: z.object({ url: z.string() }),
    render: ConfirmToolUI,
  } as ToolDefinition,
  fill_input: {
    type: "frontend",
    description: "在输入框中填充内容",
    parameters: z.object({
      action: z.string().optional(),
      selector: z.string().optional(),
      value: z.string(),
    }),
    execute: async (args): Promise<ActionResult> => 
      executeAction({ tool: "fill_input", params: args }),
    render: FrontendToolUI,
  } as ToolDefinition,
  scroll_to: {
    type: "frontend",
    description: "滚动页面到指定位置",
    parameters: z.object({
      selector: z.string().optional(),
      position: z.enum(["top", "bottom"]).optional(),
    }),
    execute: async (args): Promise<ActionResult> =>
      executeAction({ tool: "scroll_to", params: args }),
    render: FrontendToolUI,
  } as ToolDefinition,
  highlight_element: {
    type: "frontend",
    description: "高亮显示页面元素",
    parameters: z.object({
      selector: z.string().optional(),
      text: z.string().optional(),
    }),
    execute: async (args): Promise<ActionResult> =>
      executeAction({ tool: "highlight_element", params: args }),
    render: FrontendToolUI,
  } as ToolDefinition,
});

export const HUMAN_TOOL_NAMES = ["click_element", "navigate_to"] as const;
export { toolkit };
```

**修改 `src/features/action-executor/action-tools.ts`**
- 保留 `TOOL_DEFINITIONS_JSON`（Dify inputs 仍需传入文本格式工具描述）
- 保留 `TOOL_USAGE_PROMPT`（Dify System Prompt 仍需引导 LLM 输出 ```action 块）
- 删除 `confirmRequired` 字段（改由 toolkit 的 type: "human" 控制）
- 删除 `ToolDefinition` 接口（改用 toolkit 的 Zod schema）

### 阶段 2：工具 UI 组件（新建）

**新建 `src/features/chat-widget/tool-ui/confirm-tool-ui.tsx`**

human tool 的 render 组件，用 HeroUI Modal 实现确认弹窗：

```typescript
import { Modal, Button, Card, CardBody } from "@heroui/react";
import { ICONS } from "@/constants/icon";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { useState } from "react";
import type { ActionResult } from "@/features/action-executor/action-types";

interface ConfirmToolArgs {
  readonly action?: string;
  readonly selector?: string;
  readonly text?: string;
  readonly url?: string;
}

const ConfirmToolUI = ({ toolName, args, addResult }: ToolCallMessagePartProps<ConfirmToolArgs, ActionResult>) => {
  const [isOpen, setIsOpen] = useState(true);
  // ... HeroUI Modal 实现
  // 确认 → addResult({ success: true, message: "用户已确认" })
  // 取消 → addResult({ success: false, error: "user_cancelled", message: "用户取消" })
};
export default ConfirmToolUI;
```

**新建 `src/features/chat-widget/tool-ui/frontend-tool-ui.tsx`**

frontend tool 的 render 组件，显示执行状态：

```typescript
// 根据 part.status.type 显示：running / complete / error
// complete 时显示 result.message
```

### 阶段 3：Adapter 改造

**修改 `src/hooks/use-dify-assistant.ts`**

核心变化：`message_end` 时解析 action 块，yield `tool-call` content part 而非手动执行。

```typescript
case "message_end": {
  setConversationId(newConversationId);
  
  const actionCalls = parseActionsFromMessage(fullAnswer);
  
  if (actionCalls.length === 0) {
    // 无工具调用，纯文本回复
    yield { content: [{ type: "text", text: stripActionBlocks(fullAnswer) }] };
    return;
  }

  // 有工具调用：yield tool-call content part
  const call = actionCalls[0];
  const toolCallId = crypto.randomUUID();
  
  yield {
    content: [
      { type: "text", text: stripActionBlocks(fullAnswer) },
      {
        type: "tool-call",
        toolCallId,
        toolName: call.tool,
        args: call.params,
        argsText: JSON.stringify(call.params),
      },
    ],
    // human tool 暂停等待确认；frontend tool 由 runtime 自动执行
    ...(HUMAN_TOOL_NAMES.includes(call.tool) 
      ? { status: { type: "requires-action", reason: "tool-calls" } } 
      : {}),
  };
  return;
}
```

移除：`processActionBlocks`、`executeActionCall` 调用、`getLastActionResult` 回传逻辑（改由 assistant-ui tool result 机制管理）。

**修改 `src/hooks/use-local-assistant.ts`**

核心变化：`tool-input-available` 时 yield `tool-call` content part，不再手动调用 `executeToolCall`。

```typescript
case "tool-input-available": {
  toolEvent = event;
  break;  // 退出消费循环
}

// 循环外：
if (toolEvent) {
  yield {
    content: [{
      type: "tool-call",
      toolCallId: toolEvent.toolCallId,
      toolName: toolEvent.toolName,
      args: toolEvent.input,
      argsText: JSON.stringify(toolEvent.input),
    }],
    ...(HUMAN_TOOL_NAMES.includes(toolEvent.toolName)
      ? { status: { type: "requires-action", reason: "tool-calls" } }
      : {}),
  };
  return;  // human tool 暂停；frontend tool 由 runtime 执行后通过 unstable_getMessage 读取结果
}
```

Local 模式的 tool result 回传后端逻辑：runtime 恢复 adapter 后，通过 `unstable_getMessage` 读取 tool result，调用 `sendToolResult` 回传后端继续流。

### 阶段 4：Runtime 配置

**修改 `src/hooks/use-assistant.ts`**

```typescript
import { AuiConfig, Tools } from "@assistant-ui/react";
import { toolkit, HUMAN_TOOL_NAMES } from "@/features/action-executor/toolkit";

export const useAssistant = () => {
  const config = useMemo(() => AuiConfig({ tools: Tools({ toolkit }) }), []);
  
  if (BACKEND_CONFIG.mode === "local") {
    return useLocalAssistant({ config, humanToolNames: HUMAN_TOOL_NAMES });
  }
  return useDifyAssistant({ config, humanToolNames: HUMAN_TOOL_NAMES });
};
```

**修改 `src/hooks/use-dify-assistant.ts` 和 `use-local-assistant.ts`**

接受 `config` 和 `humanToolNames` 参数，传给 `useLocalRuntime`：

```typescript
export const useDifyAssistant = (options: { config: ...; humanToolNames: readonly string[] }) => {
  const adapter = useMemo(() => createDifyAdapter(), []);
  const runtime = useLocalRuntime(adapter, {
    unstable_humanToolNames: options.humanToolNames,
  });
  // ...
  return { runtime, clearConversation };
};
```

并用 `AssistantRuntimeProvider runtime={runtime} config={config}` 注入工具配置。

### 阶段 5：废弃 API 替换

**修改 `src/features/chat-widget/chat-dialog.tsx`**

1. `ThreadPrimitive.Empty` → `AuiIf`：
```tsx
<AuiIf condition={(s) => s.thread.isEmpty}>...</AuiIf>
```

2. `ThreadPrimitive.Messages` 的 `components` prop → children render function：
```tsx
<ThreadPrimitive.Messages>
  {({ message }) => message.role === "user" ? <UserMessage /> : <AssistantMessage />}
</ThreadPrimitive.Messages>
```

### 阶段 6：虚拟列表（Unstable_MessageById）

**新建 `src/hooks/use-thread-message-ids.ts`**

```typescript
import { unstable_useThreadMessageIds } from "@assistant-ui/react";
import { useSyncExternalStore } from "react";

export const useThreadMessageIds = (): readonly string[] => {
  // 包装 unstable_useThreadMessageIds，配合 useSyncExternalStore
  // 确保在 React 18 并发模式下安全
};
```

**新建 `src/features/chat-widget/virtual-message-list.tsx`**

```typescript
import { useVirtualizer } from "@tanstack/react-virtual";
import { ThreadPrimitive } from "@assistant-ui/react";
import { useThreadMessageIds } from "@/hooks/use-thread-message-ids";

const VirtualMessageList = () => {
  const messageIds = useThreadMessageIds();
  const virtualizer = useVirtualizer({
    count: messageIds.length,
    estimateSize: () => 100,
    overscan: 5,
    getItemKey: (index) => messageIds[index],
  });

  return (
    <div ref={scrollRef} className="overflow-y-auto h-full">
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <ThreadPrimitive.Unstable_MessageById
            key={messageIds[virtualRow.index]}
            messageId={messageIds[virtualRow.index]}
            components={{ Message: messageIds[virtualRow.index] === lastUserIndex ? UserMessage : AssistantMessage }}
          />
        ))}
      </div>
    </div>
  );
};
```

**修改 `src/features/chat-widget/chat-dialog.tsx`**

用 `VirtualMessageList` 替换 `ThreadPrimitive.Messages`，移除 `content-visibility` inline style。

### 阶段 7：清理

- 重新安装 `@tanstack/react-virtual`（阶段 6 需要）
- 删除 `src/features/action-executor/action-parser.ts` 中的 `debugLog`（迁移到 utils 后已不需要此处日志）
- 保留 `action-parser.ts`、`action-executor.ts`、`action-resolver.ts`、`actions/` 目录（Dify 模式仍需解析文本 + toolkit execute 复用执行器）
- 保留 `assistant-core.ts` 的 `extractLastUserMessage`、`buildSharedContextInputs`（仍需构建 Dify inputs）
- 移除 `assistant-core.ts` 的 `getLastActionResult`、`resetLastActionResult`、`executeActionCall`、`executeToolCall`（改由 assistant-ui 工具机制管理）

## 关键文件清单

### 新建（7 个）
- `src/features/action-executor/toolkit.ts`
- `src/features/chat-widget/tool-ui/confirm-tool-ui.tsx`
- `src/features/chat-widget/tool-ui/frontend-tool-ui.tsx`
- `src/hooks/use-thread-message-ids.ts`
- `src/features/chat-widget/virtual-message-list.tsx`

### 修改（6 个）
- `src/features/action-executor/action-tools.ts` — 删除 confirmRequired，保留 JSON 输出
- `src/hooks/use-dify-assistant.ts` — adapter yield tool-call part
- `src/hooks/use-local-assistant.ts` — adapter yield tool-call part
- `src/hooks/use-assistant.ts` — 注入 AuiConfig + unstable_humanToolNames
- `src/features/chat-widget/chat-dialog.tsx` — AuiIf + children render + 虚拟列表
- `src/hooks/assistant-core.ts` — 移除已废弃的 action 状态管理函数

## 验证方案

1. **TypeScript 编译**：`npx tsc --noEmit` 无错误
2. **Local 模式端到端**：
   - `VITE_ASSISTANT_BACKEND=local` 启动 dev
   - 发送消息触发 fill_input 工具 → 验证 frontend tool 自动执行 + UI 显示状态
   - 发送消息触发 click_element 工具 → 验证 human tool 弹出 Modal 确认 → 确认后执行
3. **Dify 模式端到端**：
   - `VITE_ASSISTANT_BACKEND=dify` 启动 dev
   - Dify Agent 回复含 ```action 块 → 验证 adapter 转换为 tool-call part → 工具 UI 渲染
   - human tool 暂停 → Modal 确认 → 执行
4. **虚拟列表**：发送 20+ 条消息 → 验证滚动流畅、视口外消息不渲染
5. **废弃 API**：确认无 `ThreadPrimitive.Empty` 和 `components` prop 使用

## 风险与回滚

- **Unstable_MessageById 风险**：API 带 unstable 前缀，可能 breaking change。如遇问题，回退到 `content-visibility: auto`。
- **Dify action 块流式问题**：action 块在 message_end 才完整，tool-call part 在流末尾 yield。如流式体验不佳，可考虑在流中检测 action 块开始时提前 yield（但 JSON 可能不完整）。
- **Local 模式 tool result 回传**：human tool 确认后需要把 result 回传后端继续流。如 runtime 恢复机制与 Local 后端协议不匹配，保留手动 `sendToolResult` 调用作为兜底。
