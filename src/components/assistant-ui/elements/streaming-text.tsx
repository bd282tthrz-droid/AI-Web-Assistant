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

// 检测行内 markdown 格式（粗体、斜体、删除线、行内代码）
interface InlineMd {
  readonly before: string;
  readonly tag: string;
  readonly content: string;
  readonly after: string;
}
function parseInlineMarkdown(word: string): InlineMd | null {
  const patterns: Array<{ regex: RegExp; tag: string }> = [
    { regex: /^\*\*(.+)\*\*(.*)$/, tag: "strong" },
    { regex: /^\*(.+)\*(.*)$/, tag: "em" },
    { regex: /^__(.+)__(.*)$/, tag: "strong" },
    { regex: /^_(.+)_(.*)$/, tag: "em" },
    { regex: /^~~(.+)~~(.*)$/, tag: "del" },
    { regex: /^`(.+)`(.*)$/, tag: "code" }
  ];
  for (const { regex, tag } of patterns) {
    const match = word.match(regex);
    if (match) return { before: "", tag, content: match[1], after: match[2] };
  }
  return null;
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
}: Omit<ComponentProps<"p">, "children" | "segments" | "count" | "streaming"> & {
  segments: Segment[];
  count: number;
  streaming: boolean;
}) {
  const words = useMemo(
    () =>
      segments.flatMap((segment) =>
        segment.text.split(/(\n+)/).flatMap((token) => {
          if (/^\n+$/.test(token)) {
            const isParagraph = token.length >= 2;
            return [{ word: isParagraph ? "\n\n" : "\n", mono: false }];
          }
          return token.split(" ").map((word) => ({ word, mono: segment.mono ?? false }));
        })
      ),
    [segments]
  );
  const shown = take(words, count);

  return (
    <p data-slot="streaming-text" className={cn("min-h-[8.5rem] max-w-sm text-sm leading-relaxed text-pretty", className)} {...props}>
      {shown.map(({ word, mono: isMono }, i) => {
        // 换行 / 段落渲染
        if (word === "\n") {
          return <br key={i} />;
        }
        if (word === "\n\n") {
          return <span key={i} className="h-3" />;
        }

        const urlInfo = parseUrlWord(word);
        const fresh = streaming && shown.length - 1 - i < 2;

        if (urlInfo) {
          return (
            <a
              key={i}
              href={urlInfo.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF641E] underline decoration-[#FF641E]/40 hover:decoration-[#FF641E] transition-colors">
              {urlInfo.display}{" "}
            </a>
          );
        }

        // 行内 markdown 渲染（粗体、斜体、删除线、行内代码）
        const mdInfo = parseInlineMarkdown(word);
        if (mdInfo) {
          const MD_TAG_MAP: Record<string, "strong" | "em" | "del" | "code"> = {
            strong: "strong",
            em: "em",
            del: "del",
            code: "code"
          };
          const Tag = MD_TAG_MAP[mdInfo.tag];
          if (!Tag) {
            // 未知 tag，回退为纯文本
            return <span key={i}>{word} </span>;
          }
          return (
            <span key={i} className="fade-in animate-in fill-mode-both duration-500 motion-reduce:animate-none">
              <Tag
                className={cn(
                  "transition-colors duration-700 motion-reduce:transition-none",
                  fresh && "text-blue-500 dark:text-blue-400",
                  mdInfo.tag === "code" && "bg-foreground/[0.06] rounded-md px-1.5 py-0.5 font-mono text-[0.85em]"
                )}>
                {mdInfo.content}
              </Tag>
              {mdInfo.after}{" "}
            </span>
          );
        }

        return (
          <span key={i} className="fade-in animate-in fill-mode-both duration-500 motion-reduce:animate-none">
            <span
              className={cn(
                "transition-colors duration-700 motion-reduce:transition-none",
                fresh && "text-blue-500 dark:text-blue-400",
                isMono && "bg-foreground/[0.06] rounded-md px-1.5 py-0.5 font-mono text-[0.85em]"
              )}>
              {word}
            </span>{" "}
          </span>
        );
      })}
      {streaming && shown.length > 0 && <span aria-hidden className="-mb-0.5 ml-0.5 inline-block h-4 w-0.5 animate-pulse rounded-full bg-[#FF641E]" />}
    </p>
  );
}
