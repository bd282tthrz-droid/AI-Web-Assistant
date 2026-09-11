"use client";

import { type ComponentProps, useMemo } from "react";
import { cn } from "@/lib/utils";
import { take } from "@/lib/range";

// 检测单词是否为 URL，返回干净的 href 和显示文本
function parseUrlWord(word: string): { href: string; display: string } | null {
  const match = word.match(/^(https?:\/\/[^\s]+)/);
  if (!match) return null;

  const url = match[1];
  // 清理尾部的标点符号（仅用于 href，显示文本保留原样）
  const cleanUrl = url.replace(/[.,!?;:)\]}>]+$/, "");
  return { href: cleanUrl, display: word };
}

export interface Segment {
  text: string;
  mono?: boolean;
}

export function StreamingText({
  segments,
  count,
  streaming,
  className,
  ...props
}: Omit<
  ComponentProps<"p">,
  "children" | "segments" | "count" | "streaming"
> & {
  segments: Segment[];
  count: number;
  streaming: boolean;
}) {
  const words = useMemo(
    () =>
      segments.flatMap((segment) =>
        segment.text
          .split(" ")
          .map((word) => ({ word, mono: segment.mono ?? false })),
      ),
    [segments],
  );
  const shown = take(words, count);

  return (
    <p
      data-slot="streaming-text"
      className={cn(
        "min-h-[8.5rem] max-w-sm text-sm leading-relaxed text-pretty",
        className,
      )}

      {...props}
    >
      {shown.map(({ word, mono: isMono }, i) => {
        const urlInfo = parseUrlWord(word);
        const fresh = streaming && shown.length - 1 - i < 2;

        if (urlInfo) {
          return (
            <a
              key={i}
              href={urlInfo.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF641E] underline decoration-[#FF641E]/40 hover:decoration-[#FF641E] transition-colors"
            >
              {urlInfo.display}{" "}
            </a>
          );
        }

        return (
          <span
            key={i}
            className="fade-in animate-in fill-mode-both duration-500 motion-reduce:animate-none"
          >
            <span
              className={cn(
                "transition-colors duration-700 motion-reduce:transition-none",
                fresh && "text-blue-500 dark:text-blue-400",
                isMono &&
                  "bg-foreground/[0.06] rounded-md px-1.5 py-0.5 font-mono text-[0.85em]",
              )}
            >
              {word}
            </span>{" "}
          </span>
        );
      })}
      {streaming && shown.length > 0 && (
        <span
          aria-hidden
          className="-mb-0.5 ml-0.5 inline-block h-4 w-0.5 animate-pulse rounded-full bg-[#FF641E]"
        />
      )}
    </p>
  );
}