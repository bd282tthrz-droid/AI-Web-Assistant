import type { FC } from "react";
import { useThinkingAnimation, type AgentThinkingState } from "./hook";

interface HermesThinkingProps {
  state: AgentThinkingState;
  className?: string;
  toolName?: string;
  /** 动词轮换间隔(ms) */
  verbCycleMs?: number;
  /** spinner 帧间隔(ms) */
  spinnerFrameMs?: number;
}

export const HermesThinking: FC<HermesThinkingProps> = ({
  state,
  className,
  toolName,
  verbCycleMs = 1200,
  spinnerFrameMs = 80
}) => {
  const { spinnerFrame, verbText } = useThinkingAnimation(state, verbCycleMs, spinnerFrameMs);

  if (state === "idle") return null;

  let displayText: string;
  if (state === "toolRunning" && toolName) {
    displayText = `Running tool: ${toolName}`;
  } else {
    displayText = `${verbText} …`;
  }

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px"
      }}
    >
      <span style={{ fontFamily: "monospace", fontSize: 16 }}>{spinnerFrame}</span>
      <span>{displayText}</span>
    </div>
  );
};

export type { AgentThinkingState };