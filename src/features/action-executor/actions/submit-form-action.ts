import type { ActionResult, ActionParams } from "../action-types";

const debugLog = console.log;

// 提交表单 Action
// 查找指定元素的父表单并提交，兜底找最近的提交按钮

export const executeSubmitForm = async (params: ActionParams): Promise<ActionResult> => {
  const { element } = params;

  if (!element) {
    return {
      success: false,
      error: "element_not_found",
      message: "Target element not found",
    };
  }

  try {
    // 优先找 <form> 元素
    const form = element.closest("form");
    if (form) {
      debugLog("[submit-form] submitting form via requestSubmit()");
      form.requestSubmit();
      return {
        success: true,
        message: "Form submitted successfully",
      };
    }

    // 兜底：从当前元素向上查 2 层，找第一个可点击元素
    let current = element.parentElement;
    for (let i = 0; i < 2 && current; i++) {
      const btn = current.querySelector<HTMLElement>(
        'button, input[type="submit"], input[type="button"], a[role="button"], [role="button"]'
      );
      if (btn) {
        debugLog("[submit-form] clicking submit button via fallback");
        btn.click();
        return {
          success: true,
          message: "Form submitted via fallback button",
        };
      }
      current = current.parentElement;
    }

    return {
      success: false,
      error: "form_not_found",
      message: "No form or submit button found",
    };
  } catch (error) {
    return {
      success: false,
      error: "submit_failed",
      message: `Submit failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};