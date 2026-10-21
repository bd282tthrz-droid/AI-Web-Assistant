import { type FC } from "react";
import { ErrorPrimitive } from "@assistant-ui/react";
import { useAuiState } from "@assistant-ui/store";
import { useTurnStore } from "@/services/dify/turn-store";

interface ErrorPanelProps {
  readonly turnId?: string;
}

// 错误面板：按 turnId 显示本轮错误（历史消息通过 messageTurnMap 查到自己那轮的错误）
const ErrorPanel: FC<ErrorPanelProps> = ({ turnId }) => {
  const currentTurnId = useTurnStore((s) => s.currentTurnId);
  const errors = useTurnStore((s) => s.errors);
  const isLast = useAuiState((s) => s.message.isLast);

  // 优先用 props 传入的 turnId；网络错误（无映射）时 isLast 兜底为当前轮
  const effectiveTurnId = turnId ?? (isLast ? currentTurnId : undefined);
  const error = effectiveTurnId ? errors[effectiveTurnId] : undefined;

  if (!error) return null;

  return (
    <ErrorPrimitive.Root className="mb-3 rounded-lg border border-[#FF641E]/30 bg-[#FF641E]/10 px-3 py-2">
      <ErrorPrimitive.Message className="text-sm text-[#FF641E]">
        ❌ {error}
      </ErrorPrimitive.Message>
    </ErrorPrimitive.Root>
  );
};

export default ErrorPanel;