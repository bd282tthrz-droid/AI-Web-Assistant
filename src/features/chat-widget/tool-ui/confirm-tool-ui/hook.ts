// 确认工具面板逻辑
import { useState, useCallback, useMemo } from "react";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import type { ActionResult, ActionCall } from "@/features/action-executor/action-types";
import { executeAction } from "@/features/action-executor/action-executor";
import { ToolResponse } from "assistant-stream";
import type { ReadonlyJSONValue } from "assistant-stream/utils";
import { usePortalTarget } from "@/embed/portal-context";

// 锚点上下文类型（与 action-types.ts 对齐）
interface AnchorContext {
  readonly anchorText: string;
  readonly targetSelector: string;
}

// human tool 的参数类型（与 4 维元素定位策略对齐）
interface ConfirmToolArgs {
  readonly data_attributes?: string;
  readonly anchor_context?: AnchorContext | string;
  readonly text_match?: string;
  readonly css_selector?: string;
  readonly url?: string;
}

// tool name to English label mapping
const TOOL_LABEL_MAP: Record<string, string> = {
  click_element: "Click Element",
  navigate_to: "Navigate"
};

export function useConfirmTool(
  toolName: string,
  args: ConfirmToolArgs,
  addResult: ToolCallMessagePartProps<ConfirmToolArgs, ActionResult>["addResult"],
  result?: ActionResult
) {
  const portalTarget = usePortalTarget();
  const [isOpen, setIsOpen] = useState(() => result === undefined);
  const [executing, setExecuting] = useState(false);
  // 本地执行结果（不依赖 adapter resume 流程，直接在前端显示）
  const [localResult, setLocalResult] = useState<ActionResult | null>(null);

  // 已有结果时返回结果信息（优先本地结果，其次 props result）
  const displayResult = localResult ?? result;
  const hasResult = displayResult !== undefined;
  const resultSuccess = displayResult?.success ?? false;
  const resultMessage = useMemo(() => {
    if (!displayResult) return "";
    return displayResult.success
      ? displayResult.message ?? "Operation completed"
      : displayResult.message ?? displayResult.error ?? "Operation failed";
  }, [displayResult]);

  // 构建 action description 文本
  const description = useMemo(() => {
    const context = typeof args.anchor_context === "string" && args.anchor_context !== "" ? JSON.parse(args.anchor_context).anchorText : args.anchor_context;
    if (args.url) return `Navigate to: ${args.url}`;
    if (args.data_attributes) return `Execute: ${args.data_attributes}`;
    if (context && typeof context === "object") {
      return `Click: ${context.anchorText}`;
    }
    if (args.text_match) return `Click: ${args.text_match}`;
    if (args.css_selector) return `Operate: ${args.css_selector}`;
    return "Perform page action";
  }, [args]);

  // 用户确认：立即关闭弹窗，异步执行 DOM 操作，结果本地显示
  const handleConfirm = useCallback(async () => {
    if (executing || hasResult) return;
    setExecuting(true);
    setIsOpen(false); // ← 立即销毁弹窗，不等 executeAction 完成

    try {
      const call = { tool: toolName, params: args } as ActionCall;
      const res = await executeAction(call);
      setLocalResult(res);
      // 通知 runtime 工具已完成（仅用于解除 thread 的 pending 状态，不触发额外流程）
      addResult(
        new ToolResponse({
          result: res,
          isError: !res.success,
          ...(res.data && { artifact: res.data as ReadonlyJSONValue })
        })
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Action execution failed";
      const res: ActionResult = { success: false, error: "exception", message: errorMsg };
      setLocalResult(res);
      addResult(
        new ToolResponse({
          result: res,
          isError: true
        })
      );
    } finally {
      setExecuting(false);
    }
  }, [executing, hasResult, toolName, args, addResult]);

  // 用户取消：关闭弹窗，本地显示取消状态
  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setLocalResult({ success: false, error: "user_cancelled", message: "User cancelled the operation" });
    addResult({ success: false, error: "user_cancelled", message: "User cancelled the operation" });
  }, [addResult]);

  // 点击遮罩 → 视为取消
  const handleBackdropClick = useCallback(() => {
    handleCancel();
  }, [handleCancel]);

  return {
    isOpen,
    hasResult,
    resultSuccess,
    resultMessage,
    description,
    executing,
    portalTarget,
    label: TOOL_LABEL_MAP[toolName] ?? "Confirm Action",
    handleConfirm,
    handleCancel,
    handleBackdropClick
  };
}