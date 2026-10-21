import type { ActionResult, FieldDef } from "../action-types";
import { resolveElement } from "../action-resolver";
import { executeFillField } from "../actions/fill-field-action";
import { animateFill } from "./field-animator";

interface BatchFillParams {
  readonly fields: readonly FieldDef[];
}

// 批量填充表单字段
// 组合：解析元素 → 填充值 → 动画反馈，逐个字段顺序执行

export const batchFillFields = async (params: BatchFillParams): Promise<ActionResult> => {
  const fields = params.fields;

  if (!fields || fields.length === 0) {
    return {
      success: false,
      error: "no_fields",
      message: "No fields provided for batch fill",
    };
  }

  const results: Array<{ field: string; success: boolean; error?: string }> = [];
  let hasError = false;
  let allNotFound = true;

  for (const field of fields) {
    // 1. 解析元素（4 维定位策略）
    const resolved = resolveElement({
      dataAttributes: field.data_attributes,
      cssSelector: field.css_selector,
      textMatch: field.text_match,
      anchorContext: field.anchor_context
        ? { anchorText: field.anchor_context, targetSelector: "input" }
        : undefined,
    });

    if (!resolved?.element) {
      results.push({ field: field.css_selector ?? field.text_match ?? "unknown", success: false, error: "not_found" });
      hasError = true;
      continue;
    }
    allNotFound = false;

    // 2. 填充值
    const fillResult = await executeFillField({
      element: resolved.element,
      value: field.value,
    });

    if (!fillResult.success) {
      results.push({
        field: resolved.element.id || resolved.element.getAttribute("name") || "unknown",
        success: false,
        error: fillResult.error ?? fillResult.message ?? "unknown",
      });
      hasError = true;
      continue;
    }

    // 3. 动画反馈
    await animateFill(resolved.element);

    results.push({ field: resolved.element.id || resolved.element.getAttribute("name") || "unknown", success: true });
  }

  const filledCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  return {
    success: !hasError,
    message: allNotFound
      ? "No form fields found on this page"
      : `Filled ${filledCount}/${fields.length} fields${failedCount > 0 ? `, ${failedCount} failed` : ""}`,
    data: {
      results,
      filledCount,
      failedCount,
    },
  };
};