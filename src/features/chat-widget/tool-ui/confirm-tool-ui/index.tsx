import { createPortal } from "react-dom";
import { Card, Button, Alert } from "@heroui/react";
import { Ripple } from "m3-ripple";
import { ICONS } from "@/constants/icon";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import type { ActionResult } from "@/features/action-executor/action-types";
import { useConfirmTool } from "./hook";

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

const ConfirmToolUI = ({ toolName, args, addResult, result }: ToolCallMessagePartProps<ConfirmToolArgs, ActionResult>) => {
  const {
    isOpen,
    hasResult,
    resultSuccess,
    resultMessage,
    description,
    executing,
    portalTarget,
    label,
    handleConfirm,
    handleCancel,
    handleBackdropClick
  } = useConfirmTool(toolName, args, addResult, result);

  // 已有结果：展示执行结果卡片
  if (hasResult) {
    return (
      <div className="mt-2 rounded-lg border border-[#3C5F32]/15 bg-[#F5D2AF]/60 px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          {resultSuccess
            ? <ICONS.success className="text-[#3C5F32] shrink-0" size={16} />
            : <ICONS.error className="text-[#FF641E] shrink-0" size={16} />
          }
          <span className={resultSuccess ? "text-[#3C5F32]" : "text-[#FF641E]"}>
            {resultMessage}
          </span>
        </div>
      </div>
    );
  }

  // portalTarget 缺失时降级为 inline 渲染（不依赖 #confirm-portal 节点）
  if (!portalTarget) {
    return (
      <Alert status="danger" className="mx-3 my-2 max-[300px]">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>System Error</Alert.Title>
          <Alert.Description>Confirmation UI failed to initialize. Please refresh the page.</Alert.Description>
        </Alert.Content>
      </Alert>
    );
  }

  // 已完成确认：不渲染任何 DOM
  if (!isOpen) return null;

  // 确认面板：通过 Portal 渲染到 #confirm-portal 节点，避免被虚拟列表父容器裁剪
  return createPortal(
    <div
      className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-xs pointer-events-auto rounded-xl"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-tool-title">
      <Card className="w-[90%] max-w-sm bg-[#F5D2AF]/90 backdrop-blur-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* 标题区 */}
        <div id="confirm-tool-title" className="flex items-center gap-2 border-b border-[#3C5F32]/10 px-4 py-3 text-base font-semibold text-[#3C5F32]">
          <ICONS.wandMagic size={18} className="text-[#FF641E]" />
          {label}
        </div>
        {/* 内容区 */}
        <div className="space-y-1 px-4 py-4">
          <p className="text-sm text-[#3C5F32]/80">{description}</p>
          <p className="text-xs text-[#3C5F32]/50">Please confirm this action</p>
        </div>
        {/* 按钮区 */}
        <div className="flex justify-end gap-2 border-t border-[#3C5F32]/10 px-4 py-3">
          <Button variant="ghost" size="sm" onPress={handleCancel} isDisabled={executing} className="text-[#3C5F32]">
            Cancel
            <Ripple />
          </Button>
          <Button size="sm" onPress={handleConfirm} isDisabled={executing} className="bg-[#FF641E] text-white hover:bg-[#FF641E]/90">
            {executing ? "Executing..." : "Confirm"}
            <Ripple />
          </Button>
        </div>
      </Card>
    </div>,
    portalTarget
  );
};

export default ConfirmToolUI;