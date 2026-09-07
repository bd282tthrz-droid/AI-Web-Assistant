import { useCallback, useMemo } from "react";
import {
  useLocalRuntime,
  type ChatModelAdapter,
  type ChatModelRunOptions,
  type ChatModelRunResult,
  type AuiConfig
} from "@assistant-ui/react";
import { sendLocalMessage, sendToolResult } from "@/services/backend/local-client";
import { buildSharedContextInputs, extractLastUserMessage } from "./assistant-core";
import type { DataStreamEvent } from "@/schemas/data-stream.schema";

// 本地 Agent 助手 Hook：桥接 assistant-ui 与本地后端 Data Stream
// 工具机制：ai-sdk 原生 tool calls
//   - 拦截 tool-input-available → yield 官方 tool-call content part + requires-action
//   - runtime 通过 toolkit 执行 tool（human tool 等待确认，frontend tool 自动执行）
//   - tool 执行完成后 runtime 再次调用 run，检测到 tool result 后回传后端继续生成

// useLocalAssistant 入参
interface UseLocalAssistantOptions {
  readonly config: ReturnType<typeof AuiConfig>;
  readonly humanToolNames: readonly string[];
}

// 从 messages 中提取最后的 tool result（用于判断是否为 resume）
interface ToolResultInfo {
  readonly toolCallId: string;
  readonly result: unknown;
}

const extractLastToolResult = (messages: ChatModelRunOptions["messages"]): ToolResultInfo | null => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;

    const toolPart = msg.content.find(
      (part): part is Extract<(typeof msg.content)[number], { type: "tool-call" }> =>
        part.type === "tool-call" && part.result !== undefined
    );
    if (toolPart) {
      return { toolCallId: toolPart.toolCallId, result: toolPart.result };
    }
  }
  return null;
};

// 消费 Data Stream 事件流，yield 文本增量或 tool-call part
// 遇到 tool-input-available 时 yield requires-action，暂停等待 tool 执行
const consumeLocalStream = async function* (
  stream: AsyncIterable<DataStreamEvent>,
  abortSignal: AbortSignal
): AsyncGenerator<ChatModelRunResult, void> {
  let fullText = "";

  try {
    for await (const event of stream) {
      if (abortSignal.aborted) return;

      switch (event.type) {
        case "text-delta": {
          fullText += event.delta;
          yield { content: [{ type: "text", text: fullText }] };
          break;
        }

        case "reasoning-delta": {
          yield {
            content: [
              { type: "reasoning", text: event.delta },
              ...(fullText ? [{ type: "text" as const, text: fullText }] : [])
            ]
          };
          break;
        }

        case "tool-input-available": {
          // 拦截 tool 事件：yield 官方 tool-call content part
          // runtime 通过 toolkit 执行（human tool 暂停等待确认，frontend tool 自动执行）
          // tool 执行完成后 runtime 再次调用 run，进入 resume 分支回传后端
          // 注：event.input 在 Zod 中推断为 Record<string, unknown>
          // 运行时为合法 JSON，此处直接构造内容数组并断言为 ChatModelRunResult 要求的类型
          const content = [
            ...(fullText ? [{ type: "text" as const, text: fullText }] : []),
            {
              type: "tool-call" as const,
              toolCallId: event.toolCallId,
              toolName: event.toolName,
              args: event.input,
              argsText: JSON.stringify(event.input)
            }
          ] as ChatModelRunResult["content"];
          yield {
            content,
            status: { type: "requires-action", reason: "tool-calls" }
          };
          return;
        }

        case "error": {
          yield { content: [{ type: "text", text: `[Error] ${event.errorText}` }] };
          return;
        }
      }
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    yield { content: [{ type: "text", text: `[Request failed] ${errorMsg}` }] };
  }
};

// 创建本地 Agent ChatModelAdapter
const createLocalAdapter = (): ChatModelAdapter => ({
  async *run({ messages, abortSignal, unstable_getMessage }: ChatModelRunOptions): AsyncGenerator<ChatModelRunResult, void> {
    // 检测是否为 resume（tool 执行完成后的回传调用）
    const toolResult =
      extractLastToolResult(messages) ??
      (unstable_getMessage ? extractLastToolResult([unstable_getMessage()]) : null);

    if (toolResult) {
      // resume：回传 tool result 给后端，继续生成后续内容
      const stream = await sendToolResult(toolResult.toolCallId, toolResult.result, buildSharedContextInputs());
      yield* consumeLocalStream(stream, abortSignal);
      return;
    }

    // 正常消息：发送用户 query 到本地后端
    const query = extractLastUserMessage(messages);
    if (!query) return;

    const stream = await sendLocalMessage({
      query,
      inputs: buildSharedContextInputs()
    });
    yield* consumeLocalStream(stream, abortSignal);
  }
});

// 本地 Agent 助手 Hook
export const useLocalAssistant = (options: UseLocalAssistantOptions) => {
  const adapter = useMemo(() => createLocalAdapter(), []);
  const runtime = useLocalRuntime(adapter, {
    unstable_humanToolNames: [...options.humanToolNames]
  });

  // 清空当前会话（本地模式无会话持久化，状态由 runtime 管理）
  const clearConversation = useCallback(() => {}, []);

  return { runtime, config: options.config, clearConversation };
};
