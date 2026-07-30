"use client";
import React, { useEffect, useRef } from "react";

export default function FadingVideo({ src, className, style }: { src: string; className?: string; style?: React.CSSProperties }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rAFRef = useRef<number>(0);
  const fadingOutRef = useRef<boolean>(false);

  const fadeTo = (target: number, duration: number = 500) => {
    if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
    const video = videoRef.current;
    if (!video) return;

    const startOpacity = parseFloat(video.style.opacity) || 0;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const currentOpacity = startOpacity + (target - startOpacity) * progress;
      if (videoRef.current) {
        videoRef.current.style.opacity = currentOpacity.toString();
      }

      if (progress < 1) {
        rAFRef.current = requestAnimationFrame(animate);
      }
    };
    rAFRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      video.style.opacity = "0";
      video.play().catch(e => console.error("Autoplay failed:", e));
      fadeTo(1);
    };

    const handleTimeUpdate = () => {
      if (!video.duration) return;
      const remaining = video.duration - video.currentTime;
      if (!fadingOutRef.current && remaining <= 0.55 && remaining > 0) {
        fadingOutRef.current = true;
        fadeTo(0);
      }
    };

    const handleEnded = () => {
      video.style.opacity = "0";
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = 0;
          videoRef.current.play().catch(e => console.error("Autoplay failed:", e));
          fadingOutRef.current = false;
          fadeTo(1);
        }
      }, 100);
    };

    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      if (rAFRef.current) cancelAnimationFrame(rAFRef.current);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      style={{ ...style, opacity: 0 }}
      autoPlay
      muted
      playsInline
      preload="auto"
    />
  );
}
