import { MessagePrimitive, MessagePartPrimitive, ThreadPrimitive, SuggestionPrimitive } from "@assistant-ui/react";
import { useActionBarCopy } from "@assistant-ui/core/react";
import { useActionBarReload } from "@assistant-ui/core/react";
import { useAuiState } from "@assistant-ui/store";
import { useState, useCallback, type FC } from "react";
import { MessageActions } from "@/components/elements/message-actions";
import type { Reaction } from "@/components/elements/message-actions";
import { HermesThinking } from "@/components/hermes-thinking";
import { StreamingText, type Segment } from "@/components/assistant-ui/elements/streaming-text";

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
                return <HermesThinking state="thinking" className="text-xs text-[#FF641E]" />;
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

// 助手消息气泡
const AssistantMessage: FC = () => {
  const [reaction, setReaction] = useState<Reaction>(null);
  const isRunning = useAuiState((s) => s.thread.isRunning);

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

  return (
    <MessagePrimitive.Root className="mt-6">
      <div className="rounded-2xl rounded-bl-sm bg-[#F5D2AF]/80 px-4 py-2.5 text-sm text-[#3C5F32] shadow-sm backdrop-blur-sm">
        <MessageContent isUser={false} />
        <div className="grid grid-cols-2 gap-2">
          <ThreadPrimitive.Suggestions>{() => <SuggestionItem />}</ThreadPrimitive.Suggestions>
        </div>
        {!isRunning && (
          <MessageActions
            className="mt-2 justify-end"
            copied={isCopied}
            reaction={reaction}
            regenerating={false}
            onCopy={copy}
            onReactionChange={setReaction}
            onRegenerate={handleRegenerate}
          />
        )}
      </div>
    </MessagePrimitive.Root>
  );
};
const SuggestionItem = () => {
  return (
    <SuggestionPrimitive.Trigger send asChild>
      <button className="rounded-lg border p-3 hover:bg-muted">
        <div className="font-medium">
          <SuggestionPrimitive.Title />
        </div>
        <div className="text-muted-foreground text-sm">
          <SuggestionPrimitive.Description />
        </div>
      </button>
    </SuggestionPrimitive.Trigger>
  );
};
export { UserMessage, AssistantMessage };
