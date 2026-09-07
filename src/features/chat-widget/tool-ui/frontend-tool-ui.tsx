import { ICONS } from "@/constants/icon";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import type { ActionResult } from "@/features/action-executor/action-types";

// frontend tool 的参数类型（联合所有 frontend 工具的参数）
interface FrontendToolArgs {
  readonly action?: string;
  readonly selector?: string;
  readonly text?: string;
  readonly productId?: string;
  readonly value?: string;
  readonly url?: string;
  readonly position?: string;
}

// tool name to English label mapping
const TOOL_LABEL_MAP: Record<string, string> = {
  fill_input: "Fill Input",
  scroll_to: "Scroll Page",
  highlight_element: "Highlight Element",
};

// frontend tool 状态显示组件
// 根据 part.status 显示执行状态（running/complete/error）
const FrontendToolUI = ({ toolName, args, result, status }: ToolCallMessagePartProps<FrontendToolArgs, ActionResult>) => {
  const label = TOOL_LABEL_MAP[toolName] ?? "Tool";
  const statusType = status?.type;

  // 执行中
  if (statusType === "running") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-600">
        <ICONS.loading className="animate-spin" size={14} />
        <span>Executing: {label}</span>
        {args.value && <span className="text-blue-400">→ {args.value}</span>}
      </div>
    );
  }

  // 执行成功
  if (statusType === "complete" || result) {
    const isSuccess = result?.success !== false;
    const message = result?.message ?? "Completed";

    return (
      <div
        className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
          isSuccess ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        }`}
      >
        {isSuccess ? <ICONS.success size={14} /> : <ICONS.error size={14} />}
        <span>{message}</span>
      </div>
    );
  }

  // 默认状态
  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
      <ICONS.wandMagic size={14} />
      <span>{label}</span>
    </div>
  );
};

export default FrontendToolUI;
