"use client";

import { cn } from "../lib/utils";
import { motion, MotionProps } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export interface AnimatedSpanProps extends React.HTMLAttributes<HTMLSpanElement> {
  delay?: number;
  show?: boolean;
}

export const AnimatedSpan = ({
  children,
  delay = 0,
  show = false,
  className,
  ...props
}: AnimatedSpanProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : -5 }}
      transition={{ duration: 0.2, delay: show ? delay / 1000 : 0 }}
      className={cn("grid text-sm font-normal tracking-tight", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export interface TypingAnimationProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: string;
  className?: string;
  duration?: number;
  delay?: number;
  as?: React.ElementType;
}

export function TypingAnimation({
  children,
  className,
  duration = 60,
  delay = 0,
  as: Component = "span",
  ...props
}: TypingAnimationProps) {
  if (typeof children !== "string") {
    throw new Error("TypingAnimation: children must be a string. Received:");
  }

  const MotionComponent = motion.create(Component, {
    forwardMotionProps: true,
  });

  const [displayedText, setDisplayedText] = useState<string>("");
  const [started, setStarted] = useState(false);
  const [i, setI] = useState<number>(0);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    const typingEffect = setInterval(() => {
      if (i < children.length) {
        setDisplayedText(children.substring(0, i + 1));
        setI(i + 1);
      } else {
        clearInterval(typingEffect);
      }
    }, duration);

    return () => {
      clearInterval(typingEffect);
    };
  }, [children, duration, started, i]);

  return (
    <MotionComponent
      className={cn(
        "text-sm font-normal tracking-tight",
        className,
      )}
      {...props}
    >
      {displayedText}
    </MotionComponent>
  );
}

interface TerminalProps {
  children: React.ReactNode;
  className?: string;
}

export const Terminal = ({ children, className }: TerminalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={cn(
        "z-0 h-full w-full max-w-lg rounded-xl border border-white/10 bg-black/50 backdrop-blur-md shadow-2xl",
        className,
      )}
    >
      <div className="flex flex-col gap-y-2 border-b border-white/5 p-4">
        <div className="flex flex-row gap-x-2">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-amber-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
        </div>
      </div>
      <div
        ref={containerRef}
        className="p-4 pt-4 font-mono text-sm text-gray-300"
      >
        <div className="flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
};
