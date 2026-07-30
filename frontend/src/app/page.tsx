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
            S
          </div>
          <div className="hidden md:flex liquid-glass rounded-full p-1.5 items-center gap-1">
            {[
              { label: "Product", href: "/features" },
              { label: "Pricing", href: "/pricing" },
              { label: "Resources", href: "/blog" },
              { label: "Docs", href: "/docs" },
              { label: "Changelog", href: "/changelog" }
            ].map((link) => (
              <Link key={link.label} href={link.href} className="px-3 py-2 text-sm font-medium text-white/90 font-body hover:text-white transition-colors">
                {link.label}
              </Link>
            ))}
            <Link href={getStartedHref} className="ml-2 bg-white text-black px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex items-center gap-1 hover:bg-white/90 transition-colors">
              Get Started Free
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
            <span className="bg-white text-black px-3 py-1 rounded-full text-xs font-semibold">Live</span>
            <span className="text-sm text-white/90 font-body pr-1">SentinelNexus Enterprise Security V2.0 is Now Live</span>
          </motion.div>

          <BlurText 
            text="Secure Your AI Infrastructure Across the Enterprise" 
            className="text-6xl md:text-7xl lg:text-[5.5rem] font-heading italic text-white leading-[0.8] max-w-2xl tracking-[-4px]" 
          />

          <motion.p
            initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
            className="mt-6 text-sm md:text-base text-white max-w-2xl font-body font-light leading-tight"
          >
            Protect your AI applications from prompt injections, data exfiltration, and compliance drifts. SentinelNexus delivers real-time defense and universal trust scoring.
          </motion.p>

          <motion.div
            initial={{ filter: "blur(10px)", opacity: 0, y: 20 }}
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8, ease: "easeOut" }}
            className="flex items-center gap-6 mt-8"
          >
            <Link href={getStartedHref} className="liquid-glass-strong rounded-full px-6 py-3 text-sm font-medium text-white flex items-center gap-2 hover:bg-white/10 transition-colors">
              Start Scanning
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 17L17 7" /><path d="M7 7h10v10" />
              </svg>
            </Link>
            <button className="flex items-center gap-2 text-sm font-medium text-white hover:text-white/80 transition-colors">
              See How It Works
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
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <div>
                <div className="font-heading italic text-white text-4xl tracking-[-1px] leading-none">120+</div>
                <div className="text-xs text-white font-body font-light mt-2">SAST Rules & Security Engines</div>
              </div>
            </div>
            <div className="liquid-glass p-5 w-[220px] rounded-[1.25rem] text-left flex flex-col justify-between">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-6">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <div>
                <div className="font-heading italic text-white text-4xl tracking-[-1px] leading-none">30ms</div>
                <div className="text-xs text-white font-body font-light mt-2">Real-Time Protection Latency</div>
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
            Trusted by leading AI innovators globally
          </div>
          <div className="flex flex-wrap justify-center gap-12 md:gap-16 mt-2 font-heading italic text-white text-2xl md:text-3xl tracking-tight opacity-80">
            <span>OpenAI</span>
            <span>Anthropic</span>
            <span>HuggingFace</span>
            <span>Google</span>
            <span>Meta</span>
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
            <div className="text-sm font-body text-white/80 mb-6 uppercase tracking-wider">{"// Core Capabilities"}</div>
            <h2 className="font-heading italic text-white text-6xl md:text-7xl lg:text-[6rem] leading-[0.9] tracking-[-3px]">
              Security<br />Autonomous
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pb-8">
            {/* Card 1 */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="liquid-glass w-11 h-11 rounded-[0.75rem] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  {["Real-time", "Prompt Injection", "PII Defense", "Zero-day"].map(tag => (
                    <span key={tag} className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 font-body whitespace-nowrap">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none">Autonomous Threat Detection</h3>
                <p className="mt-3 text-sm text-white/90 font-body font-light leading-snug max-w-[32ch]">
                  Continuous monitoring of your LLM workflows to instantly detect and block jailbreaks, system prompt leakage, and unauthorized data exfiltration.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="liquid-glass w-11 h-11 rounded-[0.75rem] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  {["SOC 2", "AI Act", "ISO 27001", "Automated"].map(tag => (
                    <span key={tag} className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 font-body whitespace-nowrap">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none">Continuous Compliance</h3>
                <p className="mt-3 text-sm text-white/90 font-body font-light leading-snug max-w-[32ch]">
                  Automate evidence collection and map vulnerabilities to global regulatory frameworks with one-click, HackerOne-style PDF security reports.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="liquid-glass rounded-[1.25rem] p-6 min-h-[360px] flex flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="liquid-glass w-11 h-11 rounded-[0.75rem] flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                    <circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /><path d="M2 12h20" />
                  </svg>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5 max-w-[70%]">
                  {["CVSS v3.1", "CWE Mapping", "Dynamic Risk", "Supply Chain"].map(tag => (
                    <span key={tag} className="liquid-glass rounded-full px-3 py-1 text-[11px] text-white/90 font-body whitespace-nowrap">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex-1"></div>
              <div className="mt-6">
                <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none">Universal Trust Score&trade;</h3>
                <p className="mt-3 text-sm text-white/90 font-body font-light leading-snug max-w-[32ch]">
                  Quantify your organizational risk with a dynamic engine combining deep supply chain intelligence, model governance, and active vulnerability metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
