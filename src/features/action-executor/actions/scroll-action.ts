import type { ActionResult, ActionParams } from "@/features/action-executor/action-types";

// 滚动 Action
// 支持滚动到指定元素或页面特定位置

export const executeScroll = async (params: ActionParams): Promise<ActionResult> => {
  const { element, position } = params;

  try {
    // 滚动到指定元素
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      return {
        success: true,
        message: "Scrolled to target element",
        data: {
          tagName: element.tagName.toLowerCase(),
          text: (element.textContent || "").trim().slice(0, 50)
        }
      };
    }

    // 滚动到页面位置（top / bottom）
    if (position) {
      const scrollOptions: ScrollToOptions = {
        behavior: "smooth"
      };

      switch (position) {
        case "top":
          scrollOptions.top = 0;
          break;
        case "bottom":
          scrollOptions.top = document.documentElement.scrollHeight;
          break;
        default:
          return {
            success: false,
            error: "invalid_position",
            message: `Unsupported position: ${position} (only top/bottom allowed)`
          };
      }

      window.scrollTo(scrollOptions);

      return {
        success: true,
        message: position === "top" ? "Scrolled to page top" : "Scrolled to page bottom"
      };
    }

    return {
      success: false,
      error: "missing_target",
      message: "element or position parameter is required"
    };
  } catch (error) {
    return {
      success: false,
      error: "scroll_failed",
      message: `Scroll failed: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
};
