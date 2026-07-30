"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import FadingVideo from "../components/FadingVideo/FadingVideo";
import BlurText from "../components/BlurText/BlurText";
import { useUser, SignInButton } from "@clerk/nextjs";

export default function HomePage() {
  const { isSignedIn } = useUser();
  const getStartedHref = isSignedIn ? "/dashboard" : "/signup";

  return (
    <main className="min-h-screen bg-black relative selection:bg-white/20">
      {/* ── Section 1: Hero ────────────────────────────────────────── */}
      <section className="relative min-h-screen w-full flex flex-col overflow-hidden bg-black z-0">
        <FadingVideo
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4"
          className="absolute left-1/2 top-0 -translate-x-1/2 object-cover object-top z-0"
          style={{ width: "120%", height: "120%" }}
        />

        {/* Navbar */}
        <nav className="fixed top-4 left-0 right-0 z-50 px-8 lg:px-16 flex items-center justify-between">
          <div className="liquid-glass w-12 h-12 rounded-full flex items-center justify-center text-white font-heading italic text-2xl lowercase">
            a
          </div>
          <div className="hidden md:flex liquid-glass rounded-full p-1.5 items-center gap-1">
            {["Home", "Voyages", "Worlds", "Innovation", "Plan Launch"].map((link) => (
              <a key={link} href="#" className="px-3 py-2 text-sm font-medium text-white/90 font-body hover:text-white transition-colors">
                {link}
              </a>
            ))}
            <Link href={getStartedHref} className="ml-2 bg-white text-black px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex items-center gap-1 hover:bg-white/90 transition-colors">
              Claim a Spot
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
                <path d="M7 17L17 7" /><path d="M7 7h10v10" />
              </svg>
            </Link>
          </div>
          <div className="w-12 h-12 invisible" />
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center pt-24 px-4 text-center">
          <motion.div
            initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            className="liquid-glass rounded-full flex items-center gap-2 p-1 pl-1.5 pr-4 mb-6"
          >
            <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-semibold">New</span>
            <span className="text-sm text-white/90 font-body pr-1">Maiden Crewed Voyage to Mars Arrives 2026</span>
          </motion.div>

          <BlurText 
            text="Venture Past Our Sky Across the Universe" 
            className="text-6xl md:text-7xl lg:text-[5.5rem] font-heading italic text-white leading-[0.8] max-w-2xl tracking-[-4px]" 
          />

          <motion.p
            initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
            className="mt-6 text-sm md:text-base text-white max-w-2xl font-body font-light leading-tight"
          >
            Discover the universe in ways once unimaginable. Our pioneering vessels and breakthrough engineering bring deep-space exploration within reach—secure and extraordinary.
          </motion.p>

          <motion.div
            initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8, ease: "easeOut" }}
            className="flex items-center gap-6 mt-8"
          >
            <Link href={getStartedHref} className="liquid-glass-strong rounded-full px-6 py-3 text-sm font-medium text-white flex items-center gap-2 hover:bg-white/10 transition-colors">
              Start Your Voyage
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7" /><path d="M7 7h10v10" />
              </svg>
            </Link>
            <button className="flex items-center gap-2 text-sm font-medium text-white hover:text-white/80 transition-colors">
              View Liftoff
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            </button>
          </motion.div>

          <motion.div
            initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.8, ease: "easeOut" }}
            className="flex items-stretch justify-center gap-4 mt-12 flex-wrap"
          >
            <div className="liquid-glass p-5 w-[220px] rounded-[1.25rem] text-left flex flex-col justify-between">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-6">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <div>
                <div className="font-heading italic text-white text-4xl tracking-[-1px] leading-none">34.5 Min</div>
                <div className="text-xs text-white font-body font-light mt-2">Average Videos Watch Time</div>
              </div>
            </div>
            <div className="liquid-glass p-5 w-[220px] rounded-[1.25rem] text-left flex flex-col justify-between">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-6">
                <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <div>
                <div className="font-heading italic text-white text-4xl tracking-[-1px] leading-none">2.8B+</div>
                <div className="text-xs text-white font-body font-light mt-2">Users Across the Globe</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Partners */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="relative z-10 flex flex-col items-center gap-4 pb-8 mt-12"
        >
          <div className="liquid-glass rounded-full px-4 py-1.5 text-xs font-medium text-white">
            Collaborating with top aerospace pioneers globally
          </div>
          <div className="flex flex-wrap justify-center gap-12 md:gap-16 mt-2 font-heading italic text-white text-2xl md:text-3xl tracking-tight opacity-80">
            <span>Aeon</span>
            <span>Vela</span>
            <span>Apex</span>
            <span>Orbit</span>
            <span>Zeno</span>
          </div>
        </motion.div>
      </section>

      {/* ── Section 2: Capabilities ────────────────────────────────────── */}
      <section className="relative min-h-screen w-full bg-black z-0">
        <FadingVideo
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        <div className="relative z-10 px-8 md:px-16 lg:px-20 pt-24 pb-10 flex flex-col min-h-screen">
          <div className="mb-auto">
            <div className="text-sm font-body text-white/80 mb-6 uppercase tracking-wider">{"// Capabilities"}</div>
            <h2 className="font-heading italic text-white text-6xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-[-3px]">
              Production<br />evolved
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pb-8">
            {/* Card 1 */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="liquid-glass w-11 h-11 rounded-[0.75rem] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21H5Zm1-4h12l-3.75-5-3 4L9 13l-3 4Z" />
                  </svg>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  {["Natural Context", "Photo Realism", "Infinite Settings", "Eco-Vibe"].map(tag => (
                    <span key={tag} className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 font-body whitespace-nowrap">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none">AI Scenery</h3>
                <p className="mt-3 text-sm text-white/90 font-body font-light leading-snug max-w-[32ch]">
                  AI analyzes your product to create indistinguishable natural environments — from Icelandic cliffs to misty forests.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="liquid-glass w-11 h-11 rounded-[0.75rem] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path d="M4 6.47 5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.89-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4Z" />
                  </svg>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  {["Scale Fast", "Visual Consistency", "Time Saver", "Ready to Post"].map(tag => (
                    <span key={tag} className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 font-body whitespace-nowrap">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none">Batch Production</h3>
                <p className="mt-3 text-sm text-white/90 font-body font-light leading-snug max-w-[32ch]">
                  Style your entire product line in minutes. Create a unified visual identity for catalogues and social media without weeks of retouching.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="liquid-glass w-11 h-11 rounded-[0.75rem] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                    <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1Zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7Z" />
                  </svg>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  {["Ray Tracing", "Physical Shadows", "Studio Quality", "Sunlight Sync"].map(tag => (
                    <span key={tag} className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 font-body whitespace-nowrap">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none">Smart Lighting</h3>
                <p className="mt-3 text-sm text-white/90 font-body font-light leading-snug max-w-[32ch]">
                  Automatic lighting and material adjustment. Achieve flawless integration with realistic shadows and sunlight.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
