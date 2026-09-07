// Hermes 思考动画逻辑
// spinner 帧动画 + 动词轮换动画
import { useState, useEffect } from "react";

// Hermes 原版配置
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const THINKING_VERBS = ["Processing", "Analyzing", "Computing", "Evaluating", "Pondering"];

export type AgentThinkingState = "idle" | "thinking" | "toolRunning";

export function useThinkingAnimation(state: AgentThinkingState, verbCycleMs = 1200, spinnerFrameMs = 80) {
  const [spinnerIndex, setSpinnerIndex] = useState(0);
  const [verbIndex, setVerbIndex] = useState(0);

  // spinner 帧动画
  useEffect(() => {
    if (state === "idle") return;
    const timer = setInterval(() => {
      setSpinnerIndex((p) => (p + 1) % SPINNER_FRAMES.length);
    }, spinnerFrameMs);
    return () => clearInterval(timer);
  }, [state, spinnerFrameMs]);

  // 仅 thinking 状态轮换动词，toolRunning 不轮换
  useEffect(() => {
    if (state !== "thinking") return;
    const timer = setInterval(() => {
      setVerbIndex((p) => (p + 1) % THINKING_VERBS.length);
    }, verbCycleMs);
    return () => clearInterval(timer);
  }, [state, verbCycleMs]);

  return {
    spinnerFrame: SPINNER_FRAMES[spinnerIndex],
    verbText: THINKING_VERBS[verbIndex]
  };
}
