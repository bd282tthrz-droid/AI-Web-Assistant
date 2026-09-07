import { useCallback, useMemo } from "react";
import {
  useLocalRuntime,
  type ChatModelAdapter,
  type ChatModelRunOptions,
  type ChatModelRunResult
} from "@assistant-ui/react";
import { sendChatMessage } from "@/services/dify/dify-client";
import {
  getConversationId,
  setConversationId,
  getSessionId,
  saveToHistory,
  clearCurrentSession
} from "@/services/dify/dify-conversation";
import { parseActionsFromMessage, stripActionBlocks } from "@/features/action-executor/action-parser";
import { TOOL_DEFINITIONS_JSON } from "@/features/action-executor/action-tools";
import { HUMAN_TOOL_NAMES } from "@/features/action-executor/toolkit";
import { extractLastUserMessage, buildSharedContextInputs } from "./assistant-core";
import type { AuiConfig } from "@assistant-ui/react";
import { createDebugLogger } from "@/utils/debug-log";

// Dify 助手 Hook：桥接 assistant-ui 与 Dify API
// 工具机制：解析 ```action 块 → 转换为官方 tool-call content part
// human tool 暂停等待确认；frontend tool 由 runtime 自动执行

// useDifyAssistant 入参
interface UseDifyAssistantOptions {
  readonly config: ReturnType<typeof AuiConfig>;
  readonly humanToolNames: readonly string[];
}

const debugLog = createDebugLogger("[use-dify-assistant]");

// 从 messages 提取最后的 tool result（用于判断是否为 resume 调用）
// 逻辑与 use-local-assistant 一致：扫描 assistant 消息中带 result 的 tool-call part
interface ToolResultInfo {
  readonly toolCallId: string;
  readonly toolName: string;
  readonly result: unknown;
}
const extractLastToolResult = (messages: ChatModelRunOptions["messages"]): ToolResultInfo | null => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;
    const toolPart = msg.content.find(
      (part): part is Extract<(typeof msg.content)[number], { type: "tool-call" }> & { result: unknown } =>
        part.type === "tool-call" && (part as { result?: unknown }).result !== undefined
    );
    if (toolPart) {
      return {
        toolCallId: toolPart.toolCallId,
        toolName: toolPart.toolName,
        result: toolPart.result
      };
    }
  }
  return null;
};

// 构建 Dify inputs：页面上下文 + 工具定义
const buildDifyInputs = (): Record<string, string> => {
  const contextInputs = buildSharedContextInputs();

  return {
    ...contextInputs,
    tools: TOOL_DEFINITIONS_JSON
  };
};

// 判断是否为 human tool（需要暂停等待确认）
const isHumanTool = (toolName: string): boolean =>
  HUMAN_TOOL_NAMES.includes(toolName as (typeof HUMAN_TOOL_NAMES)[number]);

// 创建 Dify ChatModelAdapter
const createDifyAdapter = (): ChatModelAdapter => ({
  async *run({ messages, abortSignal, unstable_getMessage }: ChatModelRunOptions): AsyncGenerator<ChatModelRunResult, void> {
    // ————————————————————————————————————————————
    // 关键：检测是否为 resume（用户确认/取消工具后，runtime 再次调用 run）
    // 若不做检测 → 会重新 extractLastUserMessage → 重发 query → 循环
    // ————————————————————————————————————————————
    const toolResult =
      extractLastToolResult(messages) ??
      (unstable_getMessage ? extractLastToolResult([unstable_getMessage()]) : null);

    if (toolResult) {
      // ============ resume 分支 ============
      // tool 已经由 runtime 的 toolkit 执行完毕（human tool 经用户确认，frontend tool 自动执行）
      // result 已经由 runtime 写入 thread 内部的 tool-call part 上，不需要 adapter 再发 tool-result
      //
      // Dify 的处理方式：工具结果由前端直接消费（DOM 操作由 frontend executor 完成）
      // 不需要额外通知 Dify（conversation 已经保存，用户可继续对话）
      //
      // adapter 这里只需 yield 一段人类可读的执行结果文本，写入聊天记录即可
      debugLog.log("resume detected for tool:", toolResult.toolName, "callId:", toolResult.toolCallId.slice(0, 8));

      // 按 ActionResult 结构构造展示文案
      const r = toolResult.result as { success?: boolean; message?: string; error?: string };
      const summary =
        r?.success === true ? `✅ ${r.message ?? "Operation completed"}` : `❌ ${r?.message ?? r?.error ?? "Operation failed"}`;

      yield {
        content: [{ type: "text", text: summary }]
      };
      return;
    }

    // ============ 首次调用分支 ============
    // 防护：检测是否已有 pending tool-call（result 未定义）
    // 场景：虚拟列表回收/重新挂载、StrictMode 双调用导致 run() 被重复触发
    // 此时不应重发 Dify 请求，避免循环
    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
    const hasPendingToolCall = lastAssistantMsg?.content.some(
      (p) => p.type === "tool-call" && (p as { result?: unknown }).result === undefined
    );
    if (hasPendingToolCall) {
      debugLog.log("pending tool-call detected, skip resend");
      return;
    }

    const query = extractLastUserMessage(messages);
    if (!query) return;

    const user = getSessionId();
    const conversationId = getConversationId() ?? undefined;

    try {
      const stream = await sendChatMessage({
        query,
        inputs: buildDifyInputs(),
        conversationId,
        user
      });

      let fullAnswer = "";
      let newConversationId: string | null = null;

      for await (const event of stream) {
        if (abortSignal.aborted) return;

        switch (event.event) {
          case "message": {
            fullAnswer += event.answer;
            newConversationId = event.conversation_id;

            // 显示回复时移除指令块（用户只看自然语言部分）
            const displayText = stripActionBlocks(fullAnswer);
            yield {
              content: [{ type: "text", text: displayText || "Processing your request..." }]
            };
            break;
          }

          case "agent_thought": {
            if (event.thought) {
              yield {
                content: [
                  { type: "reasoning", text: event.thought },
                  ...(fullAnswer ? [{ type: "text" as const, text: stripActionBlocks(fullAnswer) }] : [])
                ]
              };
            }
            break;
          }

          case "message_end": {
            newConversationId = event.conversation_id;
            setConversationId(newConversationId);
            saveToHistory(newConversationId, stripActionBlocks(fullAnswer) || query);

            // 解析 action 块，转换为官方 tool-call content part
            const actionCalls = parseActionsFromMessage(fullAnswer);

            if (actionCalls.length === 0) {
              // 无工具调用，纯文本回复
              yield {
                content: [{ type: "text", text: stripActionBlocks(fullAnswer) }]
              };
              return;
            }

            // 有工具调用：yield tool-call content part
            const call = actionCalls[0];
            const toolCallId = crypto.randomUUID();
            const displayText = stripActionBlocks(fullAnswer);

            const content = [
              { type: "text", text: displayText },
              {
                type: "tool-call" as const,
                toolCallId,
                toolName: call.tool,
                args: call.params,
                argsText: JSON.stringify(call.params)
              }
            ] as ChatModelRunResult["content"];
            debugLog.log("emit tool-call:", call.tool);
            // human tool 暂停等待确认；frontend tool 由 runtime 自动执行
            if (isHumanTool(call.tool)) {
              yield { content, status: { type: "requires-action", reason: "tool-calls" } };
            } else {
              yield { content };
            }
            return;
          }

          case "error": {
            yield {
              content: [{ type: "text", text: `[Error] ${event.message}` }]
            };
            return;
          }

          case "ping":
            break;

          // ChatFlow 工作流事件：仅识别不处理
          case "workflow_started":
          case "node_started":
          case "node_finished":
          case "workflow_finished":
            break;
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      yield {
        content: [{ type: "text", text: `[Request failed] ${errorMsg}` }]
      };
    }
  }
});

// Dify 助手 Hook
export const useDifyAssistant = (options: UseDifyAssistantOptions) => {
  debugLog.log("useDifyAssistant:", options);
  const adapter = useMemo(() => createDifyAdapter(), []);
  const runtime = useLocalRuntime(adapter, {
    unstable_humanToolNames: [...options.humanToolNames]
  });

  // 清空当前会话
  const clearConversation = useCallback(() => {
    clearCurrentSession();
  }, []);

  return { runtime, config: options.config, clearConversation };
};
