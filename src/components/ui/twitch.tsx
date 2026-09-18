"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from "react";

import { cn } from "@/lib/utils";

export interface TwitchIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface TwitchIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
  loop?: boolean;
}

const PATH_VARIANTS: (loop: boolean) => Variants = (loop) => ({
  normal: {
    opacity: 1,
    pathLength: 1,
    pathOffset: 0,
    transition: {
      duration: loop ? 1.4 : 0.4,
      opacity: { duration: 0.1 }
    }
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    pathOffset: [1, 0],
    transition: {
      duration: loop ? 1.6 : 0.6,
      ease: "linear",
      opacity: { duration: 0.1 },
      repeat: Number.POSITIVE_INFINITY
    }
  }
});

const LINE_VARIANTS: (loop: boolean) => Variants = (loop) => ({
  normal: {
    opacity: 1,
    pathLength: 1,
    pathOffset: 0,
    transition: {
      duration: loop ? 1.4 : 0.4,
      opacity: { duration: 0.1 }
    }
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    pathOffset: [1, 0],
    transition: {
      duration: loop ? 1.6 : 0.6,
      ease: "linear",
      opacity: { duration: 0.1 },
      repeat: Number.POSITIVE_INFINITY
    }
  }
});

const TwitchIcon = forwardRef<TwitchIconHandle, TwitchIconProps>(({ onMouseEnter, onMouseLeave, className, loop = false, size = 28, ...props }, ref) => {
  const pathControls = useAnimation();
  const line1Controls = useAnimation();
  const line2Controls = useAnimation();
  const isControlledRef = useRef(false);

  useImperativeHandle(ref, () => {
    isControlledRef.current = true;
    return {
      startAnimation: () => {
        pathControls.start("animate");
        line1Controls.start("animate");
        line2Controls.start("animate");
      },
      stopAnimation: () => {
        pathControls.start("normal");
        line1Controls.start("normal");
        line2Controls.start("normal");
      }
    };
  });

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isControlledRef.current) {
        onMouseEnter?.(e);
      } else {
        pathControls.start("animate");
        line1Controls.start("animate");
        line2Controls.start("animate");
      }
    },
    [line1Controls, line2Controls, onMouseEnter, pathControls]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isControlledRef.current) {
        onMouseLeave?.(e);
      } else {
        pathControls.start("normal");
        line1Controls.start("normal");
        line2Controls.start("normal");
      }
    },
    [pathControls, line1Controls, line2Controls, onMouseLeave]
  );
  useEffect(() => {
    if (loop) {
      pathControls.start("animate");
      line1Controls.start("animate");
      line2Controls.start("animate");
    }
  }, [line1Controls, line2Controls, pathControls, loop]);
  return (
    <div className={cn(className)} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} {...props}>
      <svg
        fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg">
        <motion.path animate={pathControls} d="M21 2H3v16h5v4l4-4h5l4-4V2z" initial="normal" variants={PATH_VARIANTS(loop)} />
        <motion.path animate={line1Controls} d="M11 11V7" initial="normal" variants={LINE_VARIANTS(loop)} />
        <motion.path animate={line2Controls} d="M16 11V7" initial="normal" variants={LINE_VARIANTS(loop)} />
      </svg>
    </div>
  );
});

TwitchIcon.displayName = "TwitchIcon";

export { TwitchIcon };
