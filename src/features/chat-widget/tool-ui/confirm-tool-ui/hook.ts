// 确认工具面板逻辑
import { useState, useCallback, useEffect, useMemo } from "react";
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
  // 如果已有结果（虚拟列表回收后重新挂载），不显示确认面板
  const [isOpen, setIsOpen] = useState(() => result === undefined);
  const [resolved, setResolved] = useState(false);
  const [executing, setExecuting] = useState(false);

  // 已有结果时返回结果信息
  const hasResult = result !== undefined;
  const resultSuccess = result?.success ?? false;
  const resultMessage = useMemo(() => {
    if (!result) return "";
    return result.success
      ? result.message ?? "Operation completed"
      : result.message ?? result.error ?? "Operation failed";
  }, [result]);

  // 销毁面板并回传结果的统一出口
  const resolveWith = useCallback(
    (res: ActionResult | ToolResponse<ActionResult>) => {
      if (resolved) return;
      setResolved(true);
      setIsOpen(false);
      addResult(res);
    },
    [resolved, addResult]
  );

  // portalTarget 为 null 时自动回传错误，避免工具调用永远挂起
  useEffect(() => {
    if (!portalTarget && !resolved && !hasResult) {
      resolveWith(
        new ToolResponse({
          result: { success: false, error: "portal_missing", message: "Confirm UI portal target not found" },
          isError: true
        })
      );
    }
  }, [portalTarget, resolved, resolveWith, hasResult]);

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

  // 用户确认：先执行真实 DOM 操作，再回传执行结果
  const handleConfirm = useCallback(async () => {
    if (resolved || executing) return;
    setExecuting(true);
    try {
      const call = { tool: toolName, params: args } as ActionCall;
      const res = await executeAction(call);
      resolveWith(
        new ToolResponse({
          result: res,
          isError: !res.success,
          ...(res.data && { artifact: res.data as ReadonlyJSONValue })
        })
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Action execution failed";
      resolveWith(
        new ToolResponse({
          result: { success: false, error: "exception", message: errorMsg },
          isError: true
        })
      );
    } finally {
      setExecuting(false);
    }
  }, [resolved, executing, toolName, args, resolveWith]);

  // 用户取消
  const handleCancel = useCallback(() => {
    resolveWith({ success: false, error: "user_cancelled", message: "User cancelled the operation" });
  }, [resolveWith]);

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