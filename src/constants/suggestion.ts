type SuggestionItem = { readonly title: string; readonly prompt: string };

const DEFAULT_SUGGESTIONS: readonly SuggestionItem[] = [
  { title: "More services", prompt: "Show me more services" },
  { title: "Return policy", prompt: "What's your return policy?" },
  { title: "Promotions", prompt: "Do you have any promotions?" }
];

// 读取用户配置，无配置时返回默认
export const getSuggestions = (): readonly SuggestionItem[] => {
  const config = (globalThis as unknown as Record<string, unknown>).__web_assistant_config__ as Record<string, unknown> | undefined;
  const custom = config?.suggestions as SuggestionItem[] | undefined;
  return custom ?? DEFAULT_SUGGESTIONS;
};
