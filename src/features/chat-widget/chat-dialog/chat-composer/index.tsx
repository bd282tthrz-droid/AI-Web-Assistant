import { ComposerPrimitive, unstable_useComposerInputHistory } from "@assistant-ui/react";
import { useAui } from "@assistant-ui/store";
import { useEffect, type FC } from "react";
import { useFormFill } from "../../form-fill-context";
import { getProfileSync } from "@/services/dify/user-profile-store";
import SubmitButton from "./submit-button";

const ChatComposer: FC = () => {
  const history = unstable_useComposerInputHistory();
  const aui = useAui();
  const fieldLabel = useFormFill();

  useEffect(() => {
    if (fieldLabel) {
      const isSearch = fieldLabel === "search" || fieldLabel.toLowerCase().includes("search");
      let text: string;
      if (isSearch) {
        const query = fieldLabel.replace(/search/i, "").trim();
        text = `Help me search for ${query || "products"}`;
      } else {
        // 已有用户信息时自动传入真实数据
        const profile = getProfileSync();
        const nameVal = profile.name || "my name";
        const emailVal = profile.email || "my email";
        const phoneVal = profile.phone || "my phone number";
        text = `Please fill in the name as ${nameVal}, the phone number as ${phoneVal}, the email as ${emailVal}`;
      }
      try {
        aui.composer.setText(text);
      } catch {
        // composer 尚未初始化，忽略
      }
    }
  }, [fieldLabel]);

  return (
    <>
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
      <p className="px-3 pt-0 text-center text-[12px] text-[#F5D2AF]/40 bg-[#3C5F32]/40 p-3 backdrop-blur-lg leading-tight">
        AI-generated content is for reference only. Please verify important information.
      </p>
    </>
  );
};

export default ChatComposer;
