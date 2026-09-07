import type { FC } from "react";
import { useTextScramble } from "./hook";

interface GlitchSplashProps {
  text: string;
  className?: string;
  /** 末尾多少个字母做抖动 */
  glitchTailCount?: number;
  /** 每轮闪烁持续毫秒 */
  glitchActiveMs?: number;
  /** 停顿静止毫秒 */
  glitchPauseMs?: number;
  /** 字符刷新速度 */
  frameMs?: number;
}

export const TailGlitchText: FC<GlitchSplashProps> = ({
  text,
  className,
  glitchTailCount = 4,
  glitchActiveMs = 700,
  glitchPauseMs = 900,
  frameMs = 25
}) => {
  const displayText = useTextScramble(text, glitchTailCount, glitchActiveMs, glitchPauseMs, frameMs);

  return (
    <div
      className={className}
      style={{
        fontFamily: "monospace",
        fontWeight: 700,
        letterSpacing: 3,
        whiteSpace: "pre"
      }}
    >
      {displayText}
    </div>
  );
};

export default TailGlitchText;