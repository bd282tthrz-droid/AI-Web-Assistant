import { SUGGESTIONS } from "@/constants/suggestion";
import type { SuggestionAdapter, ThreadSuggestion } from "@assistant-ui/react";

/**
 * 电商场景的 follow-up 建议适配器
 * 每次 AI 回复完成后生成动态建议按钮
 * 首次打开的空状态建议在 chat-dialog.tsx 中静态定义
 */
export const suggestionAdapter: SuggestionAdapter = {
  generate: async (): Promise<readonly ThreadSuggestion[]> => {
    return SUGGESTIONS;
  }
};
