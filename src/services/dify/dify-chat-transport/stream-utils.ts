import type { TextStreamPart, UIMessageChunk } from "ai";
import { TOOL_DEFINITIONS_JSON } from "@/features/action-executor/action-tools";
import { buildSharedContextInputs } from "@/hooks/assistant-core";
import { APP_ENV } from "@/constants/api";
import type { DebugLogger } from "@/utils/debug-log";

// 创建错误流：返回只包含错误文本的 UIMessageChunk 流
export const createErrorStream = (errorText: string): ReadableStream<UIMessageChunk> => {
  return new ReadableStream({
    start(controller) {
      controller.enqueue({ type: "text-start", id: "0" } as UIMessageChunk);
      controller.enqueue({ type: "text-delta", id: "0", delta: errorText } as UIMessageChunk);
      controller.enqueue({ type: "text-end", id: "0" } as UIMessageChunk);
      controller.close();
    }
  });
};

// 构建 Dify inputs：页面上下文 + 工具定义 + 宿主环境标识
export const buildDifyInputs = (): Record<string, string> => {
  const contextInputs = buildSharedContextInputs();
  const config = (globalThis as unknown as Record<string, unknown>).__web_assistant_config__ as Record<string, unknown> | undefined;
  const dev = config?.dev as string | undefined;

  return {
    ...contextInputs,
    tools: TOOL_DEFINITIONS_JSON,
    dev: dev ?? APP_ENV.DIFY_DEV
  };
};

// 创建日志 TransformStream：按 chunk.type 映射表打印调试信息
export const createLogTransform = (logger: DebugLogger) =>
  new TransformStream<TextStreamPart<any>, TextStreamPart<any>>({
    transform(chunk, controller) {
      const logHandlers: Partial<Record<string, (c: typeof chunk) => void>> = {
        "tool-input-start": (c) =>
          logger.log(
            "[stream] tool-input-start:",
            JSON.stringify({
              id: (c as any).id,
              toolName: (c as any).toolName,
              input: (c as any).input ?? (c as any).args
            })
          ),
        "tool-input-delta": (c) =>
          logger.log(
            "[stream] tool-input-delta:",
            JSON.stringify({
              id: (c as any).id,
              delta: (c as any).delta ?? (c as any).inputDelta
            })
          ),
        "tool-input-end": (c) => logger.log("[stream] tool-input-end:", JSON.stringify({ id: (c as any).id })),
        "tool-call": (c) =>
          logger.log(
            "[stream] tool-call:",
            JSON.stringify({
              toolName: (c as any).toolName,
              toolCallId: (c as any).toolCallId,
              input: (c as any).input
            })
          ),
        "tool-error": (c) =>
          logger.log(
            "[stream] tool-error:",
            JSON.stringify({
              toolName: (c as any).toolName,
              toolCallId: (c as any).toolCallId,
              error: (c as any).error
            })
          ),
        "text-delta": (c) => logger.log("[stream] text-delta:", JSON.stringify({ delta: (c as any).delta ?? (c as any).textDelta })),
        "reasoning-start": () => logger.log("[stream] reasoning-start"),
        "reasoning-delta": (c) => logger.log("[stream] reasoning-delta:", JSON.stringify({ delta: (c as any).delta ?? (c as any).textDelta })),
        "reasoning-end": () => logger.log("[stream] reasoning-end"),
        "finish-step": () => logger.log("[stream] finish-step")
      };

      const handler = logHandlers[chunk.type];
      if (handler) handler(chunk);
      else logger.log("[stream] chunk type:", chunk.type);

      controller.enqueue(chunk);
    }
  });

// 创建工具调用去重流
// dify-ai-provider 在两个事件处理中都会调用 parseToolCalls 生成工具调用 chunks
// 导致同一工具调用被输出两次（toolInputId 不同但 toolName + input 相同）
export const createDedupTransform = (logger: DebugLogger) => {
  let hasSeenAnyToolStart = false;
  const duplicateToolCallIds = new Set<string>();
  const seenToolCallKeys = new Set<string>();
  let hasFinished = false;

  return new TransformStream<TextStreamPart<any>, TextStreamPart<any>>({
    transform(chunk, controller) {
      // 对 finish-step 去重（避免两次 finish）
      // logger.log("[createDedupTransform]", chunk);
      if (chunk.type === "finish-step") {
        if (hasFinished) return;
        hasFinished = true;
        controller.enqueue(chunk);
        return;
      }

      // 工具调用去重：只保留第一个 tool-input-start，后续全部丢弃
      if (chunk.type === "tool-input-start") {
        if (hasSeenAnyToolStart) {
          duplicateToolCallIds.add(chunk.id);
          //  logger.log("[dedup] duplicate tool-input-start skipped:", chunk.toolName, "id:", chunk.id.slice(0, 8));
          return;
        }
        hasSeenAnyToolStart = true;
        controller.enqueue(chunk);
        return;
      }

      // 拦截重复序列的 tool-input-delta
      if (chunk.type === "tool-input-delta" && duplicateToolCallIds.has(chunk.id)) {
        return;
      }

      // 拦截重复序列的 tool-input-end
      if (chunk.type === "tool-input-end" && duplicateToolCallIds.has(chunk.id)) {
        return;
      }

      // 兜底：按 toolName + input 拦截重复的 tool-call（tool-input-start 阶段可能漏网）
      if (chunk.type === "tool-call") {
        const key = `${chunk.toolName}:${JSON.stringify(chunk.input)}`;
        if (seenToolCallKeys.has(key)) {
          //logger.log("[dedup] duplicate tool-call skipped:", chunk.toolName);
          return;
        }
        seenToolCallKeys.add(key);
      }

      controller.enqueue(chunk);
    }
  });
};
