import { ComposerPrimitive, unstable_useComposerInputHistory } from "@assistant-ui/react";
import { type FC } from "react";
import SubmitButton from "./submit-button";

const ChatComposer: FC = () => {
  const history = unstable_useComposerInputHistory();

  return (
    <ComposerPrimitive.Root className="flex items-end gap-2 border-t border-white/10 bg-[#3C5F32]/40 p-3 backdrop-blur-lg">
      <ComposerPrimitive.Input
        {...history}
        placeholder="Type a message..."
        submitMode="enter"
        className="flex-1 resize-none rounded-lg border border-[#F5D2AF]/40 bg-[#3C5F32] px-3 py-2 text-sm text-[#F5D2AF] outline-none placeholder:text-[#F5D2AF]/50"
        rows={1}
      />
      <SubmitButton />
    </ComposerPrimitive.Root>
  );
};

export default ChatComposer;
