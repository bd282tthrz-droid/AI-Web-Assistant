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
  submit_form: "Submit Form",
};

// frontend tool 状态显示组件
// 根据 part.status 显示执行状态（running/complete/error）
const FrontendToolUI = ({ toolName, args, result, status }: ToolCallMessagePartProps<FrontendToolArgs, ActionResult>) => {
  const label = TOOL_LABEL_MAP[toolName] ?? "Tool";
  const statusType = status?.type;

  // 执行中
  if (statusType === "running") {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#3C5F32]/15 bg-[#F5D2AF]/60 px-3 py-2 text-sm text-[#3C5F32]">
        <ICONS.loading className="animate-spin shrink-0 text-[#FF641E]" size={14} />
        <span className="font-medium">{label}</span>
        {args.value && <span className="text-[#3C5F32]/60">→ {args.value}</span>}
      </div>
    );
  }

  // 执行成功
  if (statusType === "complete" || result) {
    const isSuccess = result?.success !== false;
    const message = result?.message ?? "Completed";

    return (
      <div className="mt-2 rounded-lg border border-[#3C5F32]/15 bg-[#F5D2AF]/60 px-3 py-2 text-sm">
        <div className="flex items-center gap-2">
          {isSuccess
            ? <ICONS.success className="shrink-0 text-[#3C5F32]" size={14} />
            : <ICONS.error className="shrink-0 text-[#FF641E]" size={14} />
          }
          <span className={isSuccess ? "text-[#3C5F32]" : "text-[#FF641E]"}>
            {message}
          </span>
        </div>
      </div>
    );
  }

  // 默认状态
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#3C5F32]/10 bg-[#F5D2AF]/40 px-3 py-2 text-sm text-[#3C5F32]/60">
      <ICONS.wandMagic className="shrink-0" size={14} />
      <span>{label}</span>
    </div>
  );
};

export default FrontendToolUI;