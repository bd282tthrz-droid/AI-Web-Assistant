import { ComposerPrimitive, unstable_useComposerInputHistory } from "@assistant-ui/react";
import { useAui } from "@assistant-ui/store";
import { useEffect, type FC } from "react";
import { useFormFill } from "../../form-fill-context";
import SubmitButton from "./submit-button";

const ChatComposer: FC = () => {
  const history = unstable_useComposerInputHistory();
  const aui = useAui();
  const fieldLabel = useFormFill(); // 当前点击的字段的 placeholder/label

  // fieldLabel 变化时预填充（每次点击 form hint 触发）
  useEffect(() => {
    if (fieldLabel) {
      const isSearch = fieldLabel === "search" || fieldLabel.toLowerCase().includes("search");
      if (isSearch) {
        const query = fieldLabel.replace(/search/i, "").trim();
        aui.composer.setText(`Help me search for ${query || "products"}`);
      } else {
        aui.composer.setText(`Please fill in the name as xxx, the phone number as xxx, the email as xxx@example.com`);
      }
    }
  }, [fieldLabel, aui.composer]);

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
