import type { ActionResult, ActionParams } from "@/features/action-executor/action-types";

// 点击元素 Action
// 用于加购物车、点链接、提交按钮等场景

export const executeClick = async (params: ActionParams): Promise<ActionResult> => {
  const { element } = params;

  if (!element) {
    return {
      success: false,
      error: "element_not_found",
      message: "Target element not found"
    };
  }

  // 检查元素是否可交互
  if (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") {
    return {
      success: false,
      error: "element_not_interactable",
      message: "Element is disabled, cannot click"
    };
  }

  // 检查元素是否可见
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return {
      success: false,
      error: "element_not_visible",
      message: "Element is not visible, cannot click"
    };
  }

  try {
    // 滚动到元素可见区域
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    // 短暂延迟确保滚动完成
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 触发点击
    element.click();

    return {
      success: true,
      message: `Clicked element: ${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}`,
      data: {
        tagName: element.tagName.toLowerCase(),
        text: (element.textContent || "").trim().slice(0, 50)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: "click_failed",
      message: `Click failed: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
};
