"use client";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import { PropsWithChildren } from "react";

/* ── Easing presets ─────────────────────────────────────────────────────────── */
export const ease = {
  smooth: [0.22, 1, 0.36, 1] as [number, number, number, number],
  bounce: [0.68, -0.55, 0.265, 1.55] as [number, number, number, number],
  snap: [0.6, 0.05, -0.01, 0.9] as [number, number, number, number],
};

/* ── Variant factories ──────────────────────────────────────────────────────── */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 250, damping: 25 } },
  exit: { opacity: 0, x: -30 },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 250, damping: 25 } },
  exit: { opacity: 0, x: 30 },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

export const staggerFast: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

/* ── Keyframe animations ────────────────────────────────────────────────────── */
export const pulseGlow = {
  boxShadow: [
    "0 0 0px rgba(124,58,237,0)",
    "0 0 30px rgba(124,58,237,0.3)",
    "0 0 0px rgba(124,58,237,0)",
  ],
  transition: { duration: 2, repeat: Infinity },
};

export const floatY = {
  y: [0, -8, 0],
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
};

/* ── Hover / tap presets ────────────────────────────────────────────────────── */
export const hoverLift = { y: -6, scale: 1.02, transition: { type: "spring" as const, stiffness: 400, damping: 20 } };
export const hoverScale = { scale: 1.05, transition: { type: "spring" as const, stiffness: 400, damping: 20 } };
export const hoverGlow = { boxShadow: "0 0 40px rgba(124,58,237,0.2)", borderColor: "rgba(124,58,237,0.4)" };
export const tapShrink = { scale: 0.97 };
export const tapBounce = { scale: 0.95, transition: { type: "spring" as const, stiffness: 500 } };

/* ── Spring configs ─────────────────────────────────────────────────────────── */
export const springBouncy = { type: "spring" as const, stiffness: 500, damping: 15 };
export const springSmooth = { type: "spring" as const, stiffness: 300, damping: 30 };
export const springSnappy = { type: "spring" as const, stiffness: 600, damping: 25 };

/* ── Scroll-triggered Reveal component ──────────────────────────────────────── */
export function Reveal({
  children,
  className = "",
  delay = 0,
  variant = "fadeUp",
}: PropsWithChildren<{ className?: string; delay?: number; variant?: "fadeUp" | "fadeIn" | "scaleIn" | "slideLeft" | "slideRight" }>) {
  const variants: Record<string, Variants> = { fadeUp, fadeIn, scaleIn, slideLeft, slideRight };
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={variants[variant]}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── AnimatePresence wrapper ────────────────────────────────────────────────── */
export function FadePresence({ children, show }: PropsWithChildren<{ show: boolean }>) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { motion, AnimatePresence };
