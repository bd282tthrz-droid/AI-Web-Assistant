// 文字乱码闪烁动画逻辑
import { useEffect, useRef, useState } from "react";

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";

export function useTextScramble(
  text: string,
  glitchTailCount = 4,
  glitchActiveMs = 700,
  glitchPauseMs = 900,
  frameMs = 25
) {
  const [displayText, setDisplayText] = useState(text);
  const rafId = useRef<number>(0);
  const cycleStart = useRef(0);
  const lastFrame = useRef(0);

  useEffect(() => {
    cycleStart.current = performance.now();
    lastFrame.current = 0;

    const animate = (now: number) => {
      rafId.current = requestAnimationFrame(animate);

      if (now - lastFrame.current < frameMs) return;
      lastFrame.current = now;

      const totalCycle = glitchActiveMs + glitchPauseMs;
      const cycleProgress = (now - cycleStart.current) % totalCycle;
      const isGlitching = cycleProgress < glitchActiveMs;

      const chars = text.split("");
      const len = chars.length;

      const output = chars
        .map((char, idx) => {
          const isTailIndex = idx >= len - glitchTailCount;
          if (!isTailIndex) return char;
          if (char === " ") return " ";
          if (isGlitching) {
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
          }
          return char;
        })
        .join("");

      setDisplayText(output);
    };

    rafId.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafId.current);
  }, [text, glitchTailCount, glitchActiveMs, glitchPauseMs, frameMs]);

  return displayText;
}