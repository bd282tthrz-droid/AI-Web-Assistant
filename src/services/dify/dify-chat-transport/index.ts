import { streamText, toUIMessageStream, convertToModelMessages } from "ai";
import type { ChatTransport, ChatRequestOptions, UIMessage, UIMessageChunk, ModelMessage, TextStreamPart } from "ai";
import { z } from "zod";
import { getConversationId, getVisitorId, setConversationId, saveToHistory } from "../dify-conversation";
import { toolkit } from "@/features/action-executor/toolkit";
import { DIFY_CONFIG } from "@/constants/api";
import { MESSAGE_TYPE_PAGE_SUMMARY, METADATA_PAGE_SUMMARY } from "@/constants/page-summary";
import { createDebugLogger } from "@/utils/debug-log";
import { useNodeProgress } from "../node-progress-store";
import { useTurnStore } from "../turn-store";
import { useStoppedState } from "../stopped-state";
import { useDifyMessageStore } from "../dify-message-store";
import { useNewMessageStore } from "../new-message-store";
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
    // 开启新一轮：生成前端唯一 turnId（错误状态按轮关联）
    const turnId = useTurnStore.getState().startTurn();

    useNodeProgress.getState().setActiveMessage(messages.length.toString());

    // 识别页面总结请求：最后一条 user 消息带 metadata.custom.type 标记
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const lastUserMetadata = lastUserMessage?.metadata as { custom?: { type?: string } } | undefined;
    const isSummaryRequest = lastUserMetadata?.custom?.type === MESSAGE_TYPE_PAGE_SUMMARY;

    try {
      // 消息格式转换
      const modelMessages = await convertToModelMessages(messages);
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
        },
        batch_fill: {
          description: toolkit.batch_fill.description,
          inputSchema: toolkit.batch_fill.parameters as z.ZodType
        }
      };

      // 创建停止控制器，只控制 fetch 层，不影响 streamText 的状态管理
      _stopController = new AbortController();
      setStopSignal(_stopController.signal);

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
          "user-id": getVisitorId(),
          ...(headers as Record<string, string>)
        }
      });

      // 管道串联：去重 → 日志 → 响应ID捕获 → UIMessageChunk 流
      const logTransform = createLogTransform(debugLog);
      const dedupStream = result.stream.pipeThrough(createDedupTransform(debugLog));
      const dedupLogStream = dedupStream.pipeThrough(logTransform);

      // 捕获 response-metadata（UIMessage ID = dify message_id 用于 feedback API）
      let capturedResponseId: string | undefined;
      const idCaptureStream = dedupLogStream.pipeThrough(
        new TransformStream<TextStreamPart<any>, TextStreamPart<any>>({
          transform(chunk, controller) {
            const c = chunk as unknown as { type: string; id?: string };
            if (c.type === "start" && c.id) {
              capturedResponseId = c.id;
              // 绑定 messageId → turnId（渲染侧 ErrorPanel 通过 messageId 查 turnId）
              useTurnStore.getState().bindMessageId(c.id, turnId);
            }
            controller.enqueue(chunk);
          }
        })
      );

      const uiMessageStream = toUIMessageStream({
        stream: idCaptureStream,
        // 页面总结请求 → 在回复消息 metadata 注入 pageSummary 标记（前端据此渲染询价卡片）
        messageMetadata: isSummaryRequest ? () => ({ custom: { [METADATA_PAGE_SUMMARY]: true } }) : undefined,
      });

      // 异步提取并保存 conversationId 和 messageId 映射
      result.finalStep.then(
        (step) => {
          const difyWorkflowData = step.providerMetadata?.difyWorkflowData as { conversationId?: string; messageId?: string } | undefined;
          const conversationId = difyWorkflowData?.conversationId;
          if (conversationId) {
            setConversationId(conversationId);
            saveToHistory(conversationId, "");
          }
          const difyMessageId = difyWorkflowData?.messageId;
          debugLog.log("[conversationId] extraction:", conversationId, difyMessageId, capturedResponseId);
          if (difyMessageId && capturedResponseId) {
            useDifyMessageStore.getState().setDifyId(capturedResponseId, difyMessageId);
          }
          // 新消息完成时计数（用于最小化时 FAB 角标）
          useNewMessageStore.getState().increment();
        },
        (err) => {
          const isUserCancel = err instanceof Error && (err.name === "AbortError" || err.name === "AI_NoOutputGeneratedError");
          if (isUserCancel) return;
          const errorText = err instanceof Error ? err.message : "Request failed, please try again later";
          debugLog.error("[conversationId] extraction failed:", err);
          useTurnStore.getState().setError(turnId, errorText);
        }
      );

      return uiMessageStream;
    } catch (err) {
      const isUserCancel = err instanceof Error && (err.name === "AbortError" || err.name === "AI_NoOutputGeneratedError");
      if (isUserCancel) {
        useNodeProgress.getState().complete();
        debugLog.log("sendMessages cancelled by user");
        return createErrorStream("");
      }
      const errorText = err instanceof Error ? err.message : "Request failed, please try again later";
      debugLog.error("sendMessages error:", errorText);
      useTurnStore.getState().setError(turnId, errorText);
      return createErrorStream(`[Error] ${errorText}`);
    }
  }

  async reconnectToStream(): Promise<ReadableStream<UIMessageChunk> | null> {
    // 暂不支持断线重连
    return null;
  }
}
