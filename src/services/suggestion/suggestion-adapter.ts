import { getSuggestions } from "@/constants/suggestion";
import type { SuggestionAdapter } from "@assistant-ui/react";

/**
 * 电商场景的 follow-up 建议适配器
 * 每次 AI 回复完成后生成动态建议按钮
 * 可通过 script 标签 data-assistant-suggestions 自定义
 */
export const suggestionAdapter: SuggestionAdapter = {
  generate: async (): Promise<readonly { title: string; prompt: string }[]> => {
    return getSuggestions();
  }
};
