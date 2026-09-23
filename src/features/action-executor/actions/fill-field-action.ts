import type { ActionResult, ActionParams } from "../action-types";

// 填充输入框 Action（纯填充，不提交）
// 被 batch_fill 调用，与 fill-action 的区别是不提交表单

export const executeFillField = async (params: ActionParams): Promise<ActionResult> => {
  const { element, value } = params;

  if (!element) {
    return {
      success: false,
      error: "element_not_found",
      message: "Target input element not found",
    };
  }

  const isInput =
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element.getAttribute("contenteditable") === "true";

  if (!isInput) {
    return {
      success: false,
      error: "element_not_input",
      message: "Target element is not an input",
    };
  }

  if (!value) {
    return {
      success: false,
      error: "value_required",
      message: "A value parameter is required for fill",
    };
  }

  try {
    element.focus();

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        element instanceof HTMLInputElement
          ? HTMLInputElement.prototype
          : HTMLTextAreaElement.prototype,
        "value",
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, value);
      } else {
        element.value = value;
      }

      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }

    return {
      success: true,
      message: `Filled field with: "${value}"`,
      data: { value },
    };
  } catch (error) {
    return {
      success: false,
      error: "fill_failed",
      message: `Fill failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
};