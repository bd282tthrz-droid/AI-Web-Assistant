import { MessagePrimitive, MessagePartPrimitive } from "@assistant-ui/react";
import { useAuiState } from "@assistant-ui/store";
import { memo, type FC } from "react";
import { StreamingText } from "@/components/assistant-ui/elements/streaming-text";
import Thinking from "@/components/thinking";

// ── UserText ──
// 模块级命名组件，引用稳定，不被 MessagePrimitive.Parts 反复卸载/挂载

const UserText: FC = () => (
  <div className="pre-line-clamp-2">
    <MessagePartPrimitive.Text />
  </div>
);

// ── AssistantText ──
// 模块级命名组件，引用稳定；内部订阅 part 进行流式渲染

const AssistantText: FC = () => {
  const part = useAuiState((s) => {
    if (s.part.type !== "text" && s.part.type !== "reasoning") return null;
    return s.part;
  });
  const text = part?.text ?? "";
  const isStreaming = part?.status?.type === "running" || part?.status?.type === "incomplete";

  if (!text && isStreaming) {
    return <Thinking />;
  }

  if (!text) return null;

  return <StreamingText streaming={isStreaming} />;
};

// ── MessageContent ──
// 选择 UserText / AssistantText，传递稳定引用

const MessageContent: FC<{ isUser?: boolean }> = ({ isUser = true }) => {
  return (
    <MessagePrimitive.Parts
      components={{
        Text: isUser ? UserText : AssistantText,
      }}
    />
  );
};

export default MessageContent;