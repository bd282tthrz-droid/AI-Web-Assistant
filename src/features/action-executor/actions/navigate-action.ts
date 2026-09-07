import type { ActionResult, ActionParams } from "@/features/action-executor/action-types";

// 导航 Action
// 用于页面跳转

export const executeNavigate = async (params: ActionParams): Promise<ActionResult> => {
  const { url } = params;

  if (!url) {
    return {
      success: false,
      error: "url_required",
      message: "URL is required for navigation"
    };
  }

  try {
    // 验证 URL 格式
    const targetUrl = new URL(url, window.location.href);

    // 执行导航（当前窗口跳转）
    window.location.href = targetUrl.href;

    return {
      success: true,
      message: `Navigating to: ${targetUrl.href}`,
      data: { url: targetUrl.href }
    };
  } catch (error) {
    return {
      success: false,
      error: "invalid_url",
      message: `Invalid URL: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
};
