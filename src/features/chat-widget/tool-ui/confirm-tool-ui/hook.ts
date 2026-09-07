// 确认工具面板逻辑
import { useState, useCallback, useEffect } from "react";
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
  addResult: ToolCallMessagePartProps<ConfirmToolArgs, ActionResult>["addResult"]
) {
  const portalTarget = usePortalTarget();
  const [isOpen, setIsOpen] = useState(toolName !== undefined);
  const [resolved, setResolved] = useState(false);
  const [executing, setExecuting] = useState(false);

  // 销毁面板并回传结果的统一出口
  const resolveWith = useCallback(
    (result: ActionResult | ToolResponse<ActionResult>) => {
      if (resolved) return;
      setResolved(true);
      setIsOpen(false);
      addResult(result);
    },
    [resolved, addResult]
  );

  // portalTarget 为 null 时自动回传错误，避免工具调用永远挂起
  useEffect(() => {
    if (!portalTarget && !resolved) {
      resolveWith(
        new ToolResponse({
          result: { success: false, error: "portal_missing", message: "Confirm UI portal target not found" },
          isError: true
        })
      );
    }
  }, [portalTarget, resolved, resolveWith]);

  // 构建 action description 文本
  const description = (() => {
    const context = typeof args.anchor_context === "string" && args.anchor_context !== ""
      ? JSON.parse(args.anchor_context).anchorText
      : args.anchor_context;
    if (args.url) return `Navigate to: ${args.url}`;
    if (args.data_attributes) return `Execute: ${args.data_attributes}`;
    if (context && typeof context === "object") {
      return `Click: ${context.anchorText}`;
    }
    if (args.text_match) return `Click: ${args.text_match}`;
    if (args.css_selector) return `Operate: ${args.css_selector}`;
    return "Perform page action";
  })();

  // 用户确认：先执行真实 DOM 操作，再回传执行结果
  const handleConfirm = useCallback(async () => {
    if (resolved || executing) return;
    setExecuting(true);
    try {
      const call = { tool: toolName, params: args } as ActionCall;
      const result = await executeAction(call);
      resolveWith(
        new ToolResponse({
          result,
          isError: !result.success,
          ...(result.data && { artifact: result.data as ReadonlyJSONValue })
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
    description,
    executing,
    portalTarget,
    label: TOOL_LABEL_MAP[toolName] ?? "Confirm Action",
    handleConfirm,
    handleCancel,
    handleBackdropClick
  };
}