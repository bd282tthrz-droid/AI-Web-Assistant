"use client";

import type { Variants } from "motion/react";
import { motion } from "motion/react";
import type { SVGAttributes } from "react";

import { cn } from "@/lib/utils";

export interface AiAssistantIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface AiAssistantIconProps extends SVGAttributes<SVGSVGElement> {
  size?: number;
}

const DOT_VARIANTS: Variants = {
  animate: (custom: number) => ({
    opacity: [1, 0, 0, 1, 1, 0, 0, 1],
    transition: {
      opacity: {
        times: [0, 0.1, 0.1 + custom * 0.1, 0.1 + custom * 0.1 + 0.1, 0.5, 0.6, 0.6 + custom * 0.1, 0.6 + custom * 0.1 + 0.1],
        duration: 1.5,
        repeat: Number.POSITIVE_INFINITY
      }
    }
  })
};

const SPARKLE_VARIANTS: Variants = {
  animate: {
    rotate: 360,
    opacity: [0.8, 0.4, 0.8],
    scale: [1, 1.2, 1],
    transition: {
      rotate: { duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
      opacity: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
      scale: { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
    }
  }
};

const AiAssistantIcon: React.FC<AiAssistantIconProps> = ({ className, size = 28, ...props }) => {
  return (
    <svg
      className={cn(className)}
      fill="none"
      height="1em"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width="1em"
      style={{ fontSize: size }}
      xmlns="http://www.w3.org/2000/svg"
      {...props}>
      {/* Message bubble */}
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />

      {/* Three animated dots */}
      <motion.path animate="animate" custom={0} d="M8 12h.01" variants={DOT_VARIANTS} />
      <motion.path animate="animate" custom={1} d="M12 12h.01" variants={DOT_VARIANTS} />
      <motion.path animate="animate" custom={2} d="M16 12h.01" variants={DOT_VARIANTS} />

      {/* Sparkle star at top-right */}
      <motion.g animate="animate" style={{ transformOrigin: "18px 7px" }} variants={SPARKLE_VARIANTS}>
        <path d="M18 3 L18.5 6.5 L22 7 L18.5 7.5 L18 11 L17.5 7.5 L14 7 L17.5 6.5 Z" />
      </motion.g>
    </svg>
  );
};

AiAssistantIcon.displayName = "AiAssistantIcon";

export { AiAssistantIcon };
