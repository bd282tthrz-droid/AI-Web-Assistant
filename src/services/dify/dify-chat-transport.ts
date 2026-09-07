import { createDifyProvider } from "dify-ai-provider";
import { streamText, toUIMessageStream, convertToModelMessages } from "ai";
import type { ChatTransport, ChatRequestOptions, UIMessage, UIMessageChunk, TextStreamPart, ModelMessage } from "ai";
import { z } from "zod";
import { getConversationId, getSessionId, setConversationId, saveToHistory, consumeLastActionResult } from "./dify-conversation";
import { TOOL_DEFINITIONS_JSON } from "@/features/action-executor/action-tools";
import { toolkit } from "@/features/action-executor/toolkit";
import { DIFY_CONFIG } from "@/constants/api";
import { buildSharedContextInputs } from "@/hooks/assistant-core";
import { createDebugLogger } from "@/utils/debug-log";

// 从 DIFY_CHAT_MESSAGES 端点 URL 提取 base URL（与旧代码使用同一端点）
const DIFY_BASE_URL = DIFY_CONFIG.BASE_URL;

// 创建 provider 时指定正确的 base URL，避免默认值 https://api.dify.ai/v1 导致 401
const difyProvider = createDifyProvider({
  baseURL: DIFY_BASE_URL
});

// Create error stream: returns a UIMessageChunk stream containing only error text
const createErrorStream = (errorText: string): ReadableStream<UIMessageChunk> => {
  return new ReadableStream({
    start(controller) {
      controller.enqueue({ type: "text-start", id: "0" } as UIMessageChunk);
      controller.enqueue({ type: "text-delta", id: "0", delta: errorText } as UIMessageChunk);
      controller.enqueue({ type: "text-end", id: "0" } as UIMessageChunk);
      controller.close();
    }
  });
};

const debugLog = createDebugLogger("[dify-chat-transport]");
const buildDifyInputs = (): Record<string, string> => {
  const contextInputs = buildSharedContextInputs();
  const actionResult = consumeLastActionResult();

  return {
    ...contextInputs,
    round_type: actionResult ? "tool_result" : "new_query",
    // 有 action_result 说明是工具结果回传（Dify 已缓存本轮上下文）→ 不加 tools
    // 无 action_result 说明是新请求 → 加 tools
    ...(actionResult ? {} : { tools: TOOL_DEFINITIONS_JSON }),
    // 只有存在工具结果时才传入 action_result
    ...(actionResult ? { action_result: actionResult } : {})
  };
};
// Dify ChatTransport 实现
// 将 dify-ai-provider (LanguageModelV2) 桥接到 AI SDK 的 ChatTransport 接口
// 供 @assistant-ui/react-ai-sdk 的 useChatRuntime 使用

export class DifyChatTransport implements ChatTransport<UIMessage> {
  async sendMessages(
    options: {
      trigger: "submit-message" | "regenerate-message";
      chatId: string;
      messageId: string | undefined;
      messages: UIMessage[];
      abortSignal: AbortSignal | undefined;
    } & ChatRequestOptions
  ): Promise<ReadableStream<UIMessageChunk>> {
    const { messages, abortSignal, headers } = options;

    try {
      // 消息格式转换
      const modelMessages = await convertToModelMessages(messages);
      // 调试日志：输入消息和转换后的模型消息
      debugLog.log(
        "[debug] input messages roles:",
        messages.map((m) => m.role)
      );
      debugLog.log("[debug] modelMessages count:", modelMessages.length);
      debugLog.log(
        "[debug] modelMessages roles:",
        modelMessages.map((m) => m.role)
      );
      debugLog.log("[debug] modelMessages[-1].role:", modelMessages[modelMessages.length - 1]?.role);
      if (modelMessages.length > 0) {
        const last = modelMessages[modelMessages.length - 1];
        if (last.role === "assistant" && Array.isArray(last.content)) {
          debugLog.log(
            "[debug] last assistant content types:",
            last.content.map((p) => (typeof p === "object" && p !== null && "type" in p ? p.type : typeof p))
          );
        }
      }
      // 解决 dify-ai-provider 的 buildQuery 算法缺陷：
      //
      // 问题：dify-ai-provider 的 buildQuery 从后往前遍历消息时：
      //   - 遇到 tool → startIndex = i, continue
      //   - 遇到 user → startIndex = i, break
      //   - 遇到其他角色（包括 assistant）→ break
      // 当 providerExecuted === true 时，convertToModelMessages 不会创建单独 tool 角色消息
      // 工具结果被嵌入 assistant 消息中，导致 buildQuery 始终遇到 assistant 就 break
      //
      // 修复策略（三步）：
      // 1. 从 assistant 中提取 tool-result parts，补成 tool 角色消息（让 buildQuery 能提取到工具结果）
      // 2. 移除所有 assistant 消息（buildQuery 遇到 assistant 就 break，且 filter 也会过滤掉）
      // 3. 从后往前找到最后一个 user 消息，截断至此（兼容无 conversationId 的首次请求）
      let filteredModelMessages = modelMessages.map((msg) => {
        if (msg.role === "assistant" && Array.isArray(msg.content)) {
          return {
            ...msg,
            // 保留 text 和 tool-result，移除 tool-call
            content: msg.content.filter((part) => !(typeof part === "object" && "type" in part && part.type === "tool-call"))
          };
        }
        return msg;
      });

      // 步骤 1: 从最后一条 assistant 消息中提取 tool-result 补成 tool 角色消息
      const lastAssistantMsg = [...filteredModelMessages].reverse().find((m) => m.role === "assistant");
      if (
        lastAssistantMsg &&
        Array.isArray(lastAssistantMsg.content) &&
        lastAssistantMsg.content.some((part) => typeof part === "object" && part !== null && "type" in part && part.type === "tool-result")
      ) {
        const toolResultParts = lastAssistantMsg.content.filter(
          (part) => typeof part === "object" && part !== null && "type" in part && part.type === "tool-result"
        );
        if (toolResultParts.length > 0) {
          filteredModelMessages.push({
            role: "tool",
            content: toolResultParts.map((part) => {
              const partUnk = part as unknown as Record<string, unknown>;
              const rawOutput = partUnk.output ?? partUnk.result;
              return {
                type: "tool-result" as const,
                toolCallId: partUnk.toolCallId as string,
                toolName: partUnk.toolName as string,
                output:
                  typeof rawOutput === "string"
                    ? { type: "text" as const, value: rawOutput }
                    : { type: "text" as const, value: JSON.stringify(rawOutput ?? "") }
              };
            })
          } as unknown as ModelMessage);
        }
      }

      // 步骤 2: 移除所有 assistant 消息
      // dify-ai-provider 的 buildQuery 遇到 assistant 就 break，永远找不到 user
      // 且 buildQuery 的 filter 也会过滤掉 assistant 消息（当 conversationId 存在时）
      // 所以移除 assistant 消息是安全的，不会影响 query 提取
      filteredModelMessages = filteredModelMessages.filter((msg) => msg.role !== "assistant");

      // 步骤 3: 从后往前找到最后一个 user 消息，截断至此
      // 确保 buildQuery 能从最后一条 user 消息开始提取 query
      let startIndex = 0;
      for (let i = filteredModelMessages.length - 1; i >= 0; i--) {
        if (filteredModelMessages[i].role === "user") {
          startIndex = i;
          break;
        }
      }
      filteredModelMessages = filteredModelMessages.slice(startIndex);

      // 调试日志：打印最终传给 dify-ai-provider 的消息
      debugLog.log("[debug] messages count:", filteredModelMessages.length);
      debugLog.log(
        "[debug] messages roles:",
        filteredModelMessages.map((m) => m.role)
      );
      debugLog.log("[debug] conversationId:", getConversationId());

      // 工具定义（Record<string, CoreTool> 格式，正确定型消除 any 违规）
      const tools: Record<string, { description: string; inputSchema: z.ZodType }> = {
        click_element: {
          description: toolkit.click_element.description,
          inputSchema: toolkit.click_element.parameters as z.ZodType
        },
        navigate_to: {
          description: toolkit.navigate_to.description,
          inputSchema: toolkit.navigate_to.parameters as z.ZodType
        },
        fill_input: {
          description: toolkit.fill_input.description,
          inputSchema: toolkit.fill_input.parameters as z.ZodType
        },
        scroll_to: {
          description: toolkit.scroll_to.description,
          inputSchema: toolkit.scroll_to.parameters as z.ZodType
        },
        highlight_element: {
          description: toolkit.highlight_element.description,
          inputSchema: toolkit.highlight_element.parameters as z.ZodType
        }
      };

      const result = streamText({
        model: difyProvider("dify-chat", {
          apiKey: DIFY_CONFIG.API_KEY,
          responseMode: "streaming" as const,
          injectToolsPrompt: false,
          inputs: buildDifyInputs()
        }),
        messages: filteredModelMessages,
        tools,
        abortSignal,
        headers: {
          "chat-id": getConversationId() ?? "",
          "user-id": getSessionId(),
          ...(headers as Record<string, string>)
        }
      });

      // 调试日志流：打印原始流中所有 chunk 类型和工具调用内容
      const logStream = result.stream.pipeThrough(
        new TransformStream<TextStreamPart<any>, TextStreamPart<any>>({
          transform(chunk, controller) {
            // 打印工具调用相关 chunk 的完整内容
            if (chunk.type === "tool-input-start") {
              debugLog.log(
                "[stream] tool-input-start:",
                JSON.stringify({
                  id: chunk.id,
                  toolName: chunk.toolName,
                  input: (chunk as Record<string, unknown>).input ?? (chunk as Record<string, unknown>).args
                })
              );
            } else if (chunk.type === "tool-input-delta") {
              debugLog.log(
                "[stream] tool-input-delta:",
                JSON.stringify({
                  id: chunk.id,
                  delta: (chunk as Record<string, unknown>).delta ?? (chunk as Record<string, unknown>).inputDelta
                })
              );
            } else if (chunk.type === "tool-input-end") {
              debugLog.log("[stream] tool-input-end:", JSON.stringify({ id: chunk.id }));
            } else if (chunk.type === "tool-call") {
              debugLog.log("[stream] tool-call:", JSON.stringify({ toolName: chunk.toolName, toolCallId: chunk.toolCallId, input: chunk.input }));
            } else if (chunk.type === "text-delta") {
              debugLog.log(
                "[stream] text-delta:",
                JSON.stringify({
                  delta: (chunk as Record<string, unknown>).delta ?? (chunk as Record<string, unknown>).textDelta
                })
              );
            } else if (chunk.type === "reasoning-start") {
              debugLog.log("[stream] reasoning-start");
            } else if (chunk.type === "reasoning-delta") {
              debugLog.log(
                "[stream] reasoning-delta:",
                JSON.stringify({
                  delta: (chunk as Record<string, unknown>).delta ?? (chunk as Record<string, unknown>).textDelta
                })
              );
            } else if (chunk.type === "reasoning-end") {
              debugLog.log("[stream] reasoning-end");
            } else if (chunk.type === "finish-step") {
              debugLog.log("[stream] finish-step");
            } else {
              debugLog.log("[stream] chunk type:", chunk.type);
            }
            controller.enqueue(chunk);
          }
        })
      );

      // 工具调用去重流
      // 根因：Dify chatflow 同时触发 "message_end" 和 "workflow_finished" 事件
      // dify-ai-provider 在两个事件处理中都会调用 parseToolCalls 生成工具调用 chunks
      // 导致同一工具调用被输出两次（toolInputId 不同但 toolName + input 相同）
      const seenToolNames = new Set<string>();
      const duplicateToolCallIds = new Set<string>();
      const seenToolCallKeys = new Set<string>();
      let hasFinished = false;

      const dedupStream = logStream.pipeThrough(
        new TransformStream<TextStreamPart<any>, TextStreamPart<any>>({
          transform(chunk, controller) {
            // 对 finish-step 去重（避免两次 finish）
            if (chunk.type === "finish-step") {
              if (hasFinished) return;
              hasFinished = true;
              controller.enqueue(chunk);
              return;
            }

            // 工具调用去重：按 toolName 拦截重复的 tool-input-start
            if (chunk.type === "tool-input-start") {
              if (seenToolNames.has(chunk.toolName)) {
                duplicateToolCallIds.add(chunk.id);
                debugLog.log("[dedup] duplicate tool-input-start skipped:", chunk.toolName);
                return;
              }
              seenToolNames.add(chunk.toolName);
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

            // 按 toolName + input 做 tool-call 去重（兜底，防 tool-input-start 未命中）
            if (chunk.type === "tool-call") {
              const key = `${chunk.toolName}:${JSON.stringify(chunk.input)}`;
              if (seenToolCallKeys.has(key)) return;
              seenToolCallKeys.add(key);
            }

            controller.enqueue(chunk);
          }
        })
      );

      // 将去重后的流转换为 UIMessageChunk 流
      const uiMessageStream = toUIMessageStream({
        stream: dedupStream
      });

      // 异步提取并保存 conversationId（不阻塞流返回）
      // 用于后续请求的 "chat-id" 头，维持 Dify 多轮对话上下文
      result.finalStep.then(
        (step) => {
          const difyWorkflowData = step.providerMetadata?.difyWorkflowData as { conversationId?: string } | undefined;
          const conversationId = difyWorkflowData?.conversationId;
          if (conversationId) {
            setConversationId(conversationId);
            saveToHistory(conversationId, "");
            debugLog.log("[conversationId] saved:", conversationId);
          }
        },
        (err) => {
          debugLog.error("[conversationId] extraction failed:", err);
        }
      );

      return uiMessageStream;
    } catch (err) {
      const errorText = err instanceof Error ? err.message : "Request failed, please try again later";
      debugLog.error("sendMessages error:", errorText);
      return createErrorStream(`[Error] ${errorText}`);
    }
  }

  async reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    // 暂不支持断线重连
    return null;
  }
}
