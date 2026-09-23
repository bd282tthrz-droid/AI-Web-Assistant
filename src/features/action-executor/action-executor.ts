import { resolveElement } from "./action-resolver";
import { executeClick } from "./actions/click-action";
import { executeFill } from "./actions/fill-action";
import { executeFillField } from "./actions/fill-field-action";
import { executeSubmitForm } from "./actions/submit-form-action";
import { executeScroll } from "./actions/scroll-action";
import { executeNavigate } from "./actions/navigate-action";
import { executeHighlight } from "./actions/highlight-action";
import { batchFillFields } from "./form-actions";
import type { ActionCall, ActionResult, ActionParams } from "./action-types";
import { createDebugLogger } from "@/utils/debug-log";
import { invalidatePageContextCache } from "@/features/page-context/page-context-extractor";

// Action 执行器 - 工具调用调度中心
// 接收 ActionCall，解析元素，分发给对应的 Action 处理器

// 工具处理器映射表（策略模式）
type ActionHandler = (params: ActionParams) => Promise<ActionResult>;
const debugLog = createDebugLogger("[action-executor]");
const ACTION_HANDLERS: Record<string, ActionHandler> = {
  click_element: executeClick,
  fill_input: executeFill,
  fill_field: executeFillField,
  submit_form: executeSubmitForm,
  scroll_to: executeScroll,
  navigate_to: executeNavigate,
  highlight_element: executeHighlight,
  batch_fill: async (params: ActionParams) => batchFillFields({ fields: params.fields ?? [] })
};

// 解析元素并构建 ActionParams
const buildActionParams = (call: ActionCall): ActionParams => {
  // batch_fill 不需要元素解析，直接传递 fields
  if (call.tool === "batch_fill") {
    return { fields: call.params.fields };
  }

  // navigate_to 不需要元素解析
  if (call.tool === "navigate_to") {
    return { url: call.params.url };
  }

  // scroll_to 支持 position 参数（无需元素）
  if (call.tool === "scroll_to" && call.params.position) {
    return { position: call.params.position };
  }

  // submit_form：只需要解析元素来定位 form
  if (call.tool === "submit_form") {
    const resolved = resolveElement({
      dataAttributes: call.params.data_attributes,
      cssSelector: call.params.css_selector,
      textMatch: call.params.text_match,
    });
    return { element: resolved?.element };
  }

  debugLog.log(call.params);
  // 其他工具需要解析目标元素（4 维策略）
  const resolved = resolveElement({
    dataAttributes: call.params.data_attributes,
    anchorContext: call.params.anchor_context
      ? {
          anchorText: call.params.anchor_context.anchorText,
          targetSelector: call.params.anchor_context.targetSelector,
        }
      : undefined,
    textMatch: call.params.text_match,
    cssSelector: call.params.css_selector,
  });

  return {
    element: resolved?.element,
    value: call.params.value,
    url: call.params.url,
    position: call.params.position
  };
};

// 执行单个 Action
export const executeAction = async (call: ActionCall): Promise<ActionResult> => {
  const handler = ACTION_HANDLERS[call.tool];

  if (!handler) {
    const result: ActionResult = {
      success: false,
      error: "unknown_tool",
      message: `Unknown tool: ${call.tool}`
    };
    return result;
    }

  const params = buildActionParams(call);
  debugLog.log(`[executeAction] tool=${call.tool} params=`, params);
  const result = await handler(params);
  debugLog.log(`[executeAction] result=`, result);
  // action 执行后页面 DOM 已变化，清除页面上下文缓存
  invalidatePageContextCache();
  return result;
};

// 批量执行多个 Action（顺序执行）
export const executeActions = async (calls: readonly ActionCall[]): Promise<ActionResult[]> => {
  const results: ActionResult[] = [];

  for (const call of calls) {
    const result = await executeAction(call);
    results.push(result);

    // 如果某个 Action 失败，停止后续执行
    if (!result.success) break;
  }

  return results;
};
