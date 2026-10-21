import { MessagePrimitive, MessagePartPrimitive, type ToolCallMessagePartProps } from "@assistant-ui/react";
import { useAuiState } from "@assistant-ui/store";
import { type FC } from "react";
import { StreamingText } from "@/components/assistant-ui/elements/streaming-text";
import Thinking from "@/components/thinking";
import { createDebugLogger } from "@/utils/debug-log";

// ── UserText ──
// 模块级命名组件，引用稳定，不被 MessagePrimitive.Parts 反复卸载/挂载
const debugLog = createDebugLogger("[MessageContent]");

const UserText: FC = () => (
  <div className="pre-line-clamp-2">
    <MessagePartPrimitive.Text />
  </div>
);

// ── AssistantText ──
// 模块级命名组件，引用稳定；内部订阅 part 进行流式渲染
// 当 message 包含 tool-call 时，隐藏所有文本输出（用户只看到工具 UI）

const AssistantText: FC = () => {
  const PAGE_UI_PREFIX = "page_ui";
  const part = useAuiState((s) => {
    if (s.part.type !== "text" && s.part.type !== "reasoning") return null;
    return s.part;
  });
  const text = part?.text ?? "";
  const isStreaming = part?.status?.type === "running" || part?.status?.type === "incomplete";

  if (!text && isStreaming) {
    return <Thinking />;
  }
  if (text.startsWith(PAGE_UI_PREFIX)) return null;
  if (!text) return null;

  return <StreamingText streaming={isStreaming} />;
};

// ── ToolCallFallback ──
// 所有页面操作工具的文字展示（不展示字段明细，只显示文字描述）

const TOOL_LABELS: Record<string, string> = {
  click_element: "Click element",
  navigate_to: "Navigate to page",
  fill_input: "Fill input field",
  batch_fill: "Fill form fields",
  scroll_to: "Scroll page",
  highlight_element: "Highlight element",
  submit_form: "Submit form"
};

type ActionResult = { readonly message?: string; readonly success?: boolean };

const ToolCallFallback: FC<ToolCallMessagePartProps<Record<string, unknown>, ActionResult>> = ({ toolName, result }) => {
  const label = TOOL_LABELS[toolName] ?? `Execute ${toolName}`;
  if (result) {
    return <div className="mt-2 text-sm text-[#3C5F32]/80">{result.success ? `${label} completed` : result.message ?? `${label} failed`}</div>;
  }
  return <div className="mt-2 text-sm text-[#3C5F32]/60">{label}...</div>;
};

// ── MessageContent ──
// 选择 UserText / AssistantText / 工具文字描述，传递稳定引用

const MessageContent: FC<{ isUser?: boolean }> = ({ isUser = true }) => {
  return (
    <MessagePrimitive.Parts
      components={{
        Text: isUser ? UserText : AssistantText,
        tools: { Fallback: ToolCallFallback }
      }}
    />
  );
};

export default MessageContent;
