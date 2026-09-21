"use client";

import { type FC } from "react";
import { MarkdownText } from "@/components/assistant-ui/elements/markdown-text";

interface StreamingTextProps {
  readonly streaming?: boolean;
}

const StreamingText: FC<StreamingTextProps> = ({ streaming }) => {
  return (
    <span className="relative inline">
      <MarkdownText />
      {streaming && (
        <span
          aria-hidden
          className="-mb-0.5 ml-0.5 inline-block h-4 w-0.5 animate-pulse rounded-full bg-[#FF641E] align-text-bottom"
        />
      )}
    </span>
  );
};

export default StreamingText;