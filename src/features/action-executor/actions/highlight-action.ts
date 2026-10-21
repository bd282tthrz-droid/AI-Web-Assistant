import type { ActionResult, ActionParams } from "../action-types";
import { createDebugLogger } from "@/utils/debug-log";

// 高亮元素 Action
// 用于引导用户关注页面特定区域

const debugLog = createDebugLogger("[highlight-action]");

// 高亮样式类名
const HIGHLIGHT_CLASS = "ai-assistant-highlight";

// 创建高亮样式
const ensureHighlightStyle = (): void => {
  if (document.getElementById("ai-assistant-highlight-style")) return;

  const style = document.createElement("style");
  style.id = "ai-assistant-highlight-style";
  style.textContent = `
    .${HIGHLIGHT_CLASS} {
      outline: 1px solid #3b82f6 !important;
      outline-offset: 1px !important;
      transition: outline 0.3s, box-shadow 0.3s !important;
    }
  `;
  document.head.appendChild(style);
};

// 清除所有高亮
const clearAllHighlights = (): void => {
  document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => {
    el.classList.remove(HIGHLIGHT_CLASS);
  });
};

export const executeHighlight = async (params: ActionParams): Promise<ActionResult> => {
  const { element } = params;

  if (!element) {
    return {
      success: false,
      error: "element_not_found",
      message: "Target element not found"
    };
  }

  try {
    ensureHighlightStyle();

    // 清除之前的高亮
    clearAllHighlights();

    // 滚动前：目标位置 & 视口信息（排查滚动是否生效）
    const rect = element.getBoundingClientRect();
    debugLog.log("[executeHighlight] before scroll", {
      tag: element.tagName,
      id: element.id,
      cls: element.className,
      rect: { top: rect.top, bottom: rect.bottom, height: rect.height },
      viewport: { h: window.innerHeight, scrollY: window.scrollY }
    });

    // 滚动到元素
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    // 短暂延迟后添加高亮
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 滚动后：对比 scrollY / rect，确认滚动是否实际发生
    const rectAfter = element.getBoundingClientRect();
    debugLog.log("[executeHighlight] after scroll", {
      scrollY: window.scrollY,
      rectAfter: { top: rectAfter.top, bottom: rectAfter.bottom }
    });

    element.classList.add(HIGHLIGHT_CLASS);

    // 5 秒后自动移除高亮
    setTimeout(() => {
      element.classList.remove(HIGHLIGHT_CLASS);
    }, 5000);

    return {
      success: true,
      message: "Element highlighted",
      data: {
        tagName: element.tagName.toLowerCase(),
        text: (element.textContent || "").trim().slice(0, 50)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: "highlight_failed",
      message: `Highlight failed: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
};
