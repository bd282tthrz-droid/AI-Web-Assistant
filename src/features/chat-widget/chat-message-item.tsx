import { MessagePrimitive, MessagePartPrimitive, ThreadPrimitive, SuggestionPrimitive, ErrorPrimitive } from "@assistant-ui/react";
import { useActionBarCopy } from "@assistant-ui/core/react";
import { useActionBarReload } from "@assistant-ui/core/react";
import { useAuiState } from "@assistant-ui/store";
import { useState, useCallback, useEffect, useRef, type FC } from "react";
import { MessageActions } from "@/components/elements/message-actions";
import type { Reaction } from "@/components/elements/message-actions";
import { StreamingText, type Segment } from "@/components/assistant-ui/elements/streaming-text";
import Thinking from "@/components/thinking";
import { wfError } from "@/services/dify/dify-error-state";
import { createDebugLogger } from "@/utils/debug-log";
import { useNodeProgress } from "@/services/dify/node-progress-store";
import { ReasoningRoot, ReasoningTrigger, ReasoningContent, ReasoningText } from "@/components/assistant-ui/elements/reasoning.aui";
import { LoaderIcon, type LoaderIconHandle } from "@/components/ui/loader";
import { ICONS } from "@/constants/icon";
import { useStoppedState } from "@/services/dify/stopped-state";
import { StoppedRun } from "@/components/assistant-ui/elements/stopped-run";
import { useAui } from "@assistant-ui/store";

const debugLog = createDebugLogger("[chat-message-item]");

// 消息内容渲染组件 - 使用 MessagePrimitive.Parts 自动渲染消息各部分
const MessageContent: FC<{ isUser?: boolean }> = ({ isUser = true }) => {
  return (
    <MessagePrimitive.Parts
      components={{
        Text: isUser
          ? () => {
              return (
                <div className="pre-line-clamp-2">
                  <MessagePartPrimitive.Text />
                </div>
              );
            }
          : () => {
              const part = useAuiState((s) => {
                if (s.part.type !== "text" && s.part.type !== "reasoning") return null;
                return s.part;
              });
              const text = part?.text ?? "";
              const isStreaming = part?.status?.type === "running" || part?.status?.type === "incomplete";
              const segments: Segment[] = text ? [{ text }] : [{ text: "" }];
              const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

              // 初始阶段还没有文本时，显示 thinking 指示器
              if (!text && isStreaming) {
                return <Thinking />;
              }

              return <StreamingText segments={segments} count={wordCount} streaming={isStreaming} />;
            }
      }}
    />
  );
};

// 用户消息气泡
const UserMessage: FC = () => {
  const { copy, isCopied } = useActionBarCopy({
    copyToClipboard: async (text: string) => {
      await navigator.clipboard.writeText(text);
    }
  });

  return (
    <MessagePrimitive.Root className="flex flex-col items-end mt-6">
      <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[#FF641E]/85 px-4 py-2.5 text-sm text-white shadow-sm backdrop-blur-sm">
        <MessageContent />
      </div>
      <MessageActions className="justify-end text-white" copied={isCopied} helpful={false} onCopy={copy} />
    </MessagePrimitive.Root>
  );
};

// 节点进度条目组件（带动画加载图标）
const NodeItem: FC<{ title: string; done: boolean }> = ({ title, done }) => {
  const loaderRef = useRef<LoaderIconHandle>(null);

  useEffect(() => {
    if (!done) loaderRef.current?.startAnimation();
  }, [done]);

  return (
    <div className="flex items-center gap-2 text-sm text-[#325f419f]">
      <span className="shrink-0">{done ? <ICONS.check className="shrink-0 text-[#325f419f]" size={14} /> : <LoaderIcon ref={loaderRef} size={16} />}</span>
      <span>{title}</span>
    </div>
  );
};

// 助手消息气泡
const AssistantMessage: FC = () => {
  const [reaction, setReaction] = useState<Reaction>(null);
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const [error, setError] = useState<string | null>(null);
  const { nodes, isActive: hasNodes } = useNodeProgress();
  const { isStopped, set: setStopped } = useStoppedState();
  const aui = useAui();
  const messages = useAuiState((s) => s.thread.messages);

  // 新消息发送时重置进度与停止状态
  useEffect(() => {
    if (isRunning) {
      useNodeProgress.getState().reset();
      setStopped(false);
    }
  }, [isRunning, setStopped]);

  // 提取当前助理消息文本
  const lastAssistantText = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === "assistant") {
        return msg.content
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join(" ");
      }
    }
    return "";
  })();

  // 订阅工作流错误状态
  useEffect(() => {
    const unsub = wfError.subscribe(setError);
    return () => {
      unsub();
    };
  }, []);

  // 复制功能
  const { copy, isCopied } = useActionBarCopy({
    copyToClipboard: async (text: string) => {
      await navigator.clipboard.writeText(text);
    }
  });

  // 重新生成功能
  const { reload, disabled: reloadDisabled } = useActionBarReload();

  // 重新生成回调
  const handleRegenerate = useCallback(() => {
    if (!reloadDisabled) reload();
  }, [reload, reloadDisabled]);
  debugLog.log("error:", error);
  return (
    <MessagePrimitive.Root className="mt-6">
      <div className="rounded-2xl rounded-bl-sm bg-[#F5D2AF]/80 px-4 py-2.5 text-sm text-[#3C5F32] shadow-sm backdrop-blur-sm">
        {error && (
          <ErrorPrimitive.Root className="mb-3 rounded-lg border border-[#FF641E]/30 bg-[#FF641E]/10 px-3 py-2">
            <ErrorPrimitive.Message className="text-sm text-[#FF641E]">❌ {error}</ErrorPrimitive.Message>
          </ErrorPrimitive.Root>
        )}
        {nodes.length > 0 && (
          <ReasoningRoot streaming={hasNodes} defaultOpen variant="outline" className="mb-3">
            <ReasoningTrigger active={hasNodes} />
            <ReasoningContent>
              <ReasoningText>
                {nodes.map((n, i) => (
                  <NodeItem key={i} title={n.title} done={n.done} />
                ))}
              </ReasoningText>
            </ReasoningContent>
          </ReasoningRoot>
        )}
        <MessageContent isUser={false} />
        {!isRunning && isStopped && (
          <StoppedRun
            words={[lastAssistantText]}
            reason="Stopped"
            onContinue={handleRegenerate}
            onDiscard={() => aui.thread.deleteMessage(messages.filter((m) => m.role === "assistant").at(-1)?.id ?? "")}
          />
        )}
        {!isRunning && (
          <>
            <div className="flex flex-col">
              <ThreadPrimitive.Suggestions>
                {() => (
                  <SuggestionPrimitive.Trigger
                    send
                    className="mt-2 rounded-lg border border-[#3C5F32]/20 bg-[#F5D2AF]/40 px-3 py-2 text-sm text-[#3C5F32]/70 hover:bg-[#E2DED9]/50 cursor-pointer transition-colors">
                    <SuggestionPrimitive.Title />
                  </SuggestionPrimitive.Trigger>
                )}
              </ThreadPrimitive.Suggestions>
            </div>

            <MessageActions
              className="mt-2 justify-end"
              copied={isCopied}
              reaction={reaction}
              regenerating={false}
              onCopy={copy}
              onReactionChange={setReaction}
              onRegenerate={handleRegenerate}
            />
          </>
        )}
      </div>
    </MessagePrimitive.Root>
  );
};

export { UserMessage, AssistantMessage };
