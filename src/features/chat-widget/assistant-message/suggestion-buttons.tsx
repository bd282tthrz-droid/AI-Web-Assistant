// 建议按钮列表组件
// 在每条助手消息末尾渲染推荐建议，点击后直接发送新对话

import { useCallback, type FC } from "react";
import { useAui } from "@assistant-ui/store";
import { getSuggestions } from "@/constants/suggestion";

const SuggestionButtons: FC = () => {
  const aui = useAui();

  const handleSuggestion = useCallback(
    (prompt: string) => {
      aui.thread.append({ content: [{ type: "text", text: prompt }] });
    },
    [aui],
  );

  return (
    <div className="flex flex-col">
      {getSuggestions().map((suggestion) => (
        <button
          key={suggestion.prompt}
          onClick={() => handleSuggestion(suggestion.prompt)}
          className="mt-2 w-full rounded-lg border border-[#3C5F32]/20 bg-[#F5D2AF]/40 px-3 py-2 text-sm text-[#3C5F32]/70 hover:bg-[#E2DED9]/50 cursor-pointer transition-colors text-left">
          {suggestion.title}
        </button>
      ))}
    </div>
  );
};

export default SuggestionButtons;