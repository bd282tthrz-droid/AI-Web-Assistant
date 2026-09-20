import { streamText, toUIMessageStream, convertToModelMessages } from "ai";
import type { ChatTransport, ChatRequestOptions, UIMessage, UIMessageChunk, ModelMessage } from "ai";
import { z } from "zod";
import { getConversationId, getSessionId, setConversationId, saveToHistory } from "../dify-conversation";
import { toolkit } from "@/features/action-executor/toolkit";
import { DIFY_CONFIG } from "@/constants/api";
import { createDebugLogger } from "@/utils/debug-log";
import { wfError } from "../dify-error-state";
import { useNodeProgress } from "../node-progress-store";
import { useStoppedState } from "../stopped-state";
import { difyProvider, setStopSignal } from "./provider";
import { createErrorStream, buildDifyInputs, createLogTransform, createDedupTransform } from "./stream-utils";

// Dify ChatTransport 实现
// 将 dify-ai-provider (LanguageModelV2) 桥接到 AI SDK 的 ChatTransport 接口
// 供 @assistant-ui/react-ai-sdk 的 useChatRuntime 使用

const debugLog = createDebugLogger("[dify-chat-transport]");

// 模块级停止控制器
let _stopController: AbortController | null = null;

export const cancelStream = () => {
  useStoppedState.getState().set(true);
  _stopController?.abort();
};

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
      let filteredModelMessages = modelMessages.map((msg) => {
        if (msg.role === "assistant" && Array.isArray(msg.content)) {
          return {
            ...msg,
            // 保留 text 和 tool-result，移除 tool-call
            content: msg.content.filter(
              (part) => !(typeof part === "object" && "type" in part && part.type === "tool-call")
            ),
          };
        }
        return msg;
      });

      // 步骤 1: 从最后一条 assistant 消息中提取 tool-result 补成 tool 角色消息
      const lastAssistantMsg = [...filteredModelMessages].reverse().find((m) => m.role === "assistant");
      if (
        lastAssistantMsg &&
        Array.isArray(lastAssistantMsg.content) &&
        lastAssistantMsg.content.some(
          (part) => typeof part === "object" && part !== null && "type" in part && part.type === "tool-result"
        )
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
                    : { type: "text" as const, value: JSON.stringify(rawOutput ?? "") },
              };
            }),
          } as unknown as ModelMessage);
        }
      }

      // 步骤 2: 移除所有 assistant 消息
      filteredModelMessages = filteredModelMessages.filter((msg) => msg.role !== "assistant");

      // 步骤 3: 从后往前找到最后一个 user 消息，截断至此
      let startIndex = 0;
      for (let i = filteredModelMessages.length - 1; i >= 0; i--) {
        if (filteredModelMessages[i].role === "user") {
          startIndex = i;
          break;
        }
      }
      filteredModelMessages = filteredModelMessages.slice(startIndex);

      // 工具定义
      const tools: Record<string, { description: string; inputSchema: z.ZodType }> = {
        click_element: {
          description: toolkit.click_element.description,
          inputSchema: toolkit.click_element.parameters as z.ZodType,
        },
        navigate_to: {
          description: toolkit.navigate_to.description,
          inputSchema: toolkit.navigate_to.parameters as z.ZodType,
        },
        fill_input: {
          description: toolkit.fill_input.description,
          inputSchema: toolkit.fill_input.parameters as z.ZodType,
        },
        scroll_to: {
          description: toolkit.scroll_to.description,
          inputSchema: toolkit.scroll_to.parameters as z.ZodType,
        },
        highlight_element: {
          description: toolkit.highlight_element.description,
          inputSchema: toolkit.highlight_element.parameters as z.ZodType,
        },
      };

      // 创建停止控制器，只控制 fetch 层，不影响 streamText 的状态管理
      _stopController = new AbortController();
      setStopSignal(_stopController.signal);

      const result = streamText({
        model: difyProvider("dify-chat", {
          apiKey: DIFY_CONFIG.API_KEY,
          responseMode: "streaming" as const,
          injectToolsPrompt: false,
          inputs: buildDifyInputs(),
        }),
        messages: filteredModelMessages,
        tools,
        abortSignal,
        headers: {
          "chat-id": getConversationId() ?? "",
          "user-id": getSessionId(),
          ...(headers as Record<string, string>),
        },
      });

      // 管道串联：去重 → 日志 → UIMessageChunk 流
      const logTransform = createLogTransform(debugLog);
      const dedupStream = result.stream.pipeThrough(createDedupTransform(debugLog));
      const dedupLogStream = dedupStream.pipeThrough(logTransform);
      const uiMessageStream = toUIMessageStream({
        stream: dedupLogStream,
      });

      // 异步提取并保存 conversationId
      result.finalStep.then(
        (step) => {
          const difyWorkflowData = step.providerMetadata?.difyWorkflowData as
            | { conversationId?: string }
            | undefined;
          const conversationId = difyWorkflowData?.conversationId;
          if (conversationId) {
            setConversationId(conversationId);
            saveToHistory(conversationId, "");
          }
        },
        (err) => {
          const isUserCancel = err instanceof Error &&
            (err.name === "AbortError" || err.name === "AI_NoOutputGeneratedError");
          if (isUserCancel) return;
          debugLog.error("[conversationId] extraction failed:", err);
        },
      );

      return uiMessageStream;
    } catch (err) {
      const isUserCancel = err instanceof Error &&
        (err.name === "AbortError" || err.name === "AI_NoOutputGeneratedError");
      if (isUserCancel) {
        useNodeProgress.getState().complete();
        debugLog.log("sendMessages cancelled by user");
        return createErrorStream("");
      }
      const errorText = err instanceof Error ? err.message : "Request failed, please try again later";
      debugLog.error("sendMessages error:", errorText);
      wfError.set(errorText);
      return createErrorStream(`[Error] ${errorText}`);
    }
  }

  async reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    // 暂不支持断线重连
    return null;
  }
}