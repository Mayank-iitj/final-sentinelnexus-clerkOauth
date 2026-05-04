"use client";

import { useEffect, useState } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Start fade-out after 2.5s
    const fadeTimer = window.setTimeout(() => setFading(true), 2500);
    // Remove from DOM after fade completes
    const removeTimer = window.setTimeout(() => setVisible(false), 3200);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black transition-opacity duration-700 ${
        fading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Violet ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Lottie animation */}
      <div className="relative w-40 h-40 mb-6">
        {/* @ts-expect-error dotlottie-player is a web component */}
        <dotlottie-player
          src="/loading.lottie"
          autoplay
          loop
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {/* Text */}
      <div className="relative space-y-2 text-center">
        <h2 className="text-lg font-semibold text-white tracking-tight">
          Engine is waking up
        </h2>
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span
            className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"
            style={{ animationDelay: "0.2s" }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"
            style={{ animationDelay: "0.4s" }}
          />
        </div>
      </div>
    </div>
  );
}
