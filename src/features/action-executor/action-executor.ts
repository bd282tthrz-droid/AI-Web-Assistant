import { resolveElement } from "./action-resolver";
import { executeClick } from "./actions/click-action";
import { executeFill } from "./actions/fill-action";
import { executeScroll } from "./actions/scroll-action";
import { executeNavigate } from "./actions/navigate-action";
import { executeHighlight } from "./actions/highlight-action";
import type { ActionCall, ActionResult, ActionParams } from "./action-types";
import { createDebugLogger } from "@/utils/debug-log";
import { setLastActionResult } from "@/services/dify/dify-conversation";
import { invalidatePageContextCache } from "@/features/page-context/page-context-extractor";

// Action 执行器 - 工具调用调度中心
// 接收 ActionCall，解析元素，分发给对应的 Action 处理器

// 工具处理器映射表（策略模式）
type ActionHandler = (params: ActionParams) => Promise<ActionResult>;
const debugLog = createDebugLogger("[action-executor]");
const ACTION_HANDLERS: Record<string, ActionHandler> = {
  click_element: executeClick,
  fill_input: executeFill,
  scroll_to: executeScroll,
  navigate_to: executeNavigate,
  highlight_element: executeHighlight
};

// 解析元素并构建 ActionParams
const buildActionParams = (call: ActionCall): ActionParams => {
  // navigate_to 不需要元素解析
  if (call.tool === "navigate_to") {
    return { url: call.params.url };
  }

  // scroll_to 支持 position 参数（无需元素）
  if (call.tool === "scroll_to" && call.params.position) {
    return { position: call.params.position };
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
    setLastActionResult(JSON.stringify(result));
    return result;
  }

  const params = buildActionParams(call);
  debugLog.log(`[executeAction] tool=${call.tool} params=`, params);
  const result = await handler(params);
  debugLog.log(`[executeAction] result=`, result);
  // action 执行后页面 DOM 已变化，清除页面上下文缓存
  invalidatePageContextCache();
  setLastActionResult(JSON.stringify(result));
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
