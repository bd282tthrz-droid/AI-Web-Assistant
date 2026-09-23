import { ComposerPrimitive } from "@assistant-ui/react";
import { useAuiState } from "@assistant-ui/store";
import { type FC } from "react";
import { ICONS } from "@/constants/icon";
import { cancelStream } from "@/services/dify/dify-chat-transport";

const SubmitButton: FC = () => {
  const isRunning = useAuiState((s) => s.thread.isRunning);

  if (isRunning) {
    return (
      <button
        onClick={cancelStream}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5D2AF] text-[#3C5F32] hover:text-[#FF641E] cursor-pointer"
      >
        <ICONS.stop size={16} />
      </button>
    );
  }

  return (
    <ComposerPrimitive.Send className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5D2AF] text-[#3C5F32] hover:text-[#FF641E] disabled:opacity-40">
      <ICONS.paperPlane size={16} />
    </ComposerPrimitive.Send>
  );
};

export default SubmitButton;