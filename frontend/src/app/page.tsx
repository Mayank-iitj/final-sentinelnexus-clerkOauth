"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import FadingVideo from "../components/FadingVideo/FadingVideo";
import BlurText from "../components/BlurText/BlurText";

import { useUser } from "@clerk/nextjs";
import { ScrollStack, ScrollStackItem, LogoLoop, BorderGlow, ScrollVelocity } from "../components";
import { Reveal, staggerContainer, slideLeft, slideRight, tapShrink, springSmooth, springBouncy, scaleIn, tapBounce } from "../lib/animations";
import { SOCIAL_LINKS } from "../lib/social-links";

const features = [
  { title: "Code Security Scanning", desc: "120+ SAST rules for secrets, injections, and IaC misconfigurations with CVSS v3.1 scoring.", icon: "</>" },
  { title: "Prompt Injection Defense", desc: "Detect jailbreaks, system prompt leakage, and PII exfiltration across LLM conversations.", icon: "!>" },
  { title: "PII & Data Protection", desc: "Credit cards (Luhn), SSNs, IBANs, emails â€” automated compliance evidence trails.", icon: "âŠ—" },
  { title: "Universal AI Trust Scoreâ„¢", desc: "Real-time, dynamic risk quantification engine combining vulnerabilities, supply chain risk, and brand trust.", icon: "â˜…" },
  { title: "Real-Time Digital Twin", desc: "Interactive live attack graphs and zero-day threat prediction for your entire AI infrastructure.", icon: "âš™" },
  { title: "Autonomous Red/Blue Agents", desc: "Continuous automated attack simulation and infrastructure-as-code patch generation.", icon: "âš”" },
  { title: "AI Risk Scoring", desc: "IEEE-precise CVSS v3.1 base scores with 8-metric vector strings and CWE mappings.", icon: "R+" },
  { title: "Global Regulation Engine", desc: "One-click multi-framework compliance automation with automated evidence collection.", icon: "âš–" },
  { title: "PDF Report Generation", desc: "HackerOne-style PDF security reports with executive summaries and full evidence.", icon: "ðŸ“„" },
];

const plans = [
  { tier: "Starter", price: "$0", period: "forever", items: ["5 scans/month", "All scan engines", "Basic CVSS scoring", "Email support", "1 project"], cta: "Start Free", tag: "Most Pick" },
  { tier: "Professional", price: "$299", period: "/month", items: ["100 scans/month", "All scan engines", "Custom rules", "PDF reports", "10 projects", "Slack alerts", "Priority support"], cta: "Upgrade to Pro", tag: "Recommended", popular: true },
  { tier: "Enterprise", price: "$999", period: "/month", items: ["Unlimited scans", "SOC 2 exports", "SSO / SAML", "Unlimited projects", "Dedicated CSM", "SLA < 30 min", "Custom integrations"], cta: "Talk to Sales", tag: "Advanced" },
];

const marqueeItems = [
  "Universal AI Trust Scoreâ„¢", "Real-Time Organizational Digital Twin", "AI Attack Simulator", 
  "Autonomous AI Red Team Agent", "Autonomous AI Blue Team Agent", "One-Click Compliance Automation", 
  "Automated Evidence Collection", "Embeddable Trust Certificate", "Continuous Supply Chain Intelligence", 
  "AI Executive Copilot", "Interactive Live Attack Graph", "Deepfake & AI Fraud Detection", 
  "Brand Trust & Dark Web Monitoring", "AI Vendor Risk Rating", "Zero-Day Threat Prediction", 
  "Security Time Machine", "Business Risk Quantification", "AI Compliance Chat Assistant", 
  "Autonomous Patch Generator", "Cyber Insurance Readiness", "Global Regulation Intelligence", 
  "AI Explainability Dashboard", "Security Agent Marketplace", "Public Trust API", 
  "Global Cyber Risk Heatmap", "AI Boardroom Dashboard", "AI Asset Inventory", 
  "Model Governance", "Runtime Policy Enforcement", "Audit Trail Management",
  "Prompt Injection", "PII Detection", "SOC2 Evidence", "AI Act Mapping",
  "CVSS Scoring", "PDF Reports", "CWE Mapping", "SHA-256 Dedup",
];

const processSteps = [
  { num: "01", title: "Connect", desc: "Sign in with Google SSO. Integrate your repositories and AI applications in seconds." },
  { num: "02", title: "Scan", desc: "Our engines analyze code, prompts, and text for vulnerabilities, secrets, and compliance drifts." },
  { num: "03", title: "Protect", desc: "Get CVSS-scored findings, remediation guidance, and auto-generated PDF security reports." },
];

const faqItems = [
  { q: "What types of scans does SentinelNexus support?", a: "Code security (SAST with 120+ rules), prompt injection detection, and PII/secrets scanning with Luhn/IBAN checksums." },
  { q: "Is there a free tier?", a: "Yes â€” the Starter plan includes 5 scans/month with full access to all scan engines, completely free forever." },
  { q: "How does the scoring work?", a: "We use IEEE-standard CVSS v3.1 with 8-metric vector strings, CWE mappings, and weighted risk aggregation." },
];

export default function HomePage() {
  const { isSignedIn } = useUser();
  const getStartedHref = isSignedIn ? "/dashboard" : "/signup";
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-black relative selection:bg-white/20">
      {/* â”€â”€ Section 1: Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
            <div className="flex items-center gap-2 ml-2">
              <Link href="/login" className="liquid-glass text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-white/5 transition-colors">Log in</Link>
              <Link href={getStartedHref} className="bg-white text-black text-sm font-medium px-4 py-2 rounded-full hover:bg-white/90 transition-colors">Begin Now</Link>
            </div>
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
            <Link href="/login" className="liquid-glass text-white text-sm sm:text-base font-medium px-6 sm:px-7 py-3 rounded-full hover:bg-white/5 transition-colors">Log in</Link>
            <Link href={getStartedHref} className="bg-white text-black text-sm sm:text-base font-medium px-6 sm:px-7 py-3 rounded-full hover:bg-white/90 transition-colors">Begin Now</Link>
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

      {/* â”€â”€ Section 2: Capabilities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none">Universal Trust Scoreâ„¢</h3>
                <p className="mt-3 text-sm text-white/90 font-body font-light leading-snug max-w-[32ch]">
                  Quantify your organizational risk with a dynamic engine combining deep supply chain intelligence, model governance, and active vulnerability metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ Marquee (LogoLoop) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-8 bg-black">
        <div className="px-6 py-8 flex flex-col gap-6 overflow-hidden relative">
          <LogoLoop
            logos={marqueeItems.map(item => ({
              node: (
                <span className="whitespace-nowrap rounded-full border border-violet-400/20 bg-violet-500/10 px-5 py-2.5 text-sm font-medium text-violet-300/90 cursor-default shadow-[0_0_15px_rgba(124,58,237,0.1)]">
                  {item}
                </span>
              )
            }))}
            speed={40}
            direction="left"
            logoHeight={40}
            gap={24}
            hoverSpeed={10}
            fadeOut={true}
            fadeOutColor="transparent"
          />
          <LogoLoop
            logos={marqueeItems.slice().reverse().map(item => ({
              node: (
                <span className="whitespace-nowrap rounded-full border border-violet-400/20 bg-violet-500/10 px-5 py-2.5 text-sm font-medium text-violet-300/90 cursor-default shadow-[0_0_15px_rgba(124,58,237,0.1)]">
                  {item}
                </span>
              )
            }))}
            speed={40}
            direction="right"
            logoHeight={40}
            gap={24}
            hoverSpeed={10}
            fadeOut={true}
            fadeOutColor="transparent"
          />
        </div>
      </section>

      {/* â”€â”€ Section: Wellness Hero override in Features â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative w-full h-screen overflow-hidden font-geist">
        <FadingVideo
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260511_230229_7c9bc431-46cf-489a-948d-e8144d8eb5d4.mp4"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />


        {/* Hero content (bottom-left) */}
        <div className="absolute bottom-0 left-0 z-20 px-6 sm:px-12 pb-10 sm:pb-16 max-w-2xl">
          <h1 className="text-white text-4xl sm:text-5xl lg:text-6xl font-medium leading-tight tracking-tight mb-4">
            Autonomous AI Security & Trust
          </h1>
          <p className="text-white/60 text-sm leading-relaxed mb-7 max-w-md">
            Protect your AI infrastructure against prompt injections, data exfiltration, and supply chain vulnerabilities. Automate compliance and maintain total governance.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/login" className="liquid-glass text-white text-sm sm:text-base font-medium px-6 sm:px-7 py-3 rounded-full hover:bg-white/5 transition-colors">Log in</Link>
            <Link href={getStartedHref} className="bg-white text-black text-sm sm:text-base font-medium px-6 sm:px-7 py-3 rounded-full hover:bg-white/90 transition-colors">Begin Now</Link>
          </div>
        </div>

        {/* Author Pill (bottom-right) */}
        <div className="absolute bottom-6 right-6 sm:bottom-10 sm:right-12 z-20">
          <div className="liquid-glass border border-white/10 rounded-full px-4 py-2 text-xs font-medium text-white/70">
            Founded by Mayank Sharma
          </div>
        </div>
      </section>

      {/* â”€â”€ How it Works (ScrollStack) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="workflow" className="w-full bg-black">
        <Reveal className="mb-8 pt-24 text-center">
          <div className="liquid-glass rounded-full px-4 py-1.5 text-xs font-medium text-white inline-block mb-4">Our Process</div>
          <h2 className="font-heading italic text-5xl sm:text-6xl text-white tracking-tight">for AI-Driven Security</h2>
          <p className="mt-4 text-white/70 font-body max-w-xl mx-auto">Three steps to production-grade AI protection.</p>
        </Reveal>

        <div className="h-[120vh] w-full relative -mt-10 max-w-7xl mx-auto">
          <ScrollStack
            itemDistance={120}
            itemScale={0.05}
            itemStackDistance={40}
            useWindowScroll={true}
          >
            {processSteps.map((step) => (
              <ScrollStackItem key={step.num} itemClassName="max-w-3xl mx-auto">
                <div className="liquid-glass-strong flex items-start gap-8 rounded-[40px] p-10 backdrop-blur-3xl shadow-[0_0_50px_rgba(124,58,237,0.05)]">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border border-violet-400/30 bg-violet-500/10 text-2xl font-heading italic text-violet-400">
                    {step.num}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-3xl font-heading italic mb-3 text-white tracking-tight">{step.title}</h3>
                    <p className="text-lg text-white/80 font-body leading-relaxed max-w-xl">{step.desc}</p>
                  </div>
                </div>
              </ScrollStackItem>
            ))}
          </ScrollStack>
        </div>
      </section>

      {/* â”€â”€ Pricing â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="pricing" className="py-24 px-8 md:px-16 lg:px-20 bg-black">
        <Reveal className="mb-14 text-center">
          <div className="liquid-glass rounded-full px-4 py-1.5 text-xs font-medium text-white inline-block mb-4">Pricing</div>
          <h2 className="font-heading italic text-5xl sm:text-6xl text-white tracking-tight">Perfect for Agencies & Startups</h2>
          <p className="mt-4 text-white/70 font-body max-w-xl mx-auto">Flexible plans designed to suit a variety of needs and budgets.</p>
        </Reveal>
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <motion.div
              key={plan.tier}
              variants={scaleIn}
              layout
              whileHover={{ y: -12, transition: { type: "spring", stiffness: 400, damping: 15 } }}
              whileTap={tapShrink}
              className={`liquid-glass relative rounded-[1.25rem] p-8 h-full flex flex-col cursor-default ${plan.popular ? "border border-violet-500/50 shadow-[0_0_30px_rgba(124,58,237,0.2)]" : ""}`}
            >
              <span className="liquid-glass-strong rounded-full px-3 py-1 text-[10px] text-white/90 font-body mb-4 self-start">{plan.tag}</span>
              <h3 className="font-heading italic text-2xl text-white">{plan.tier}</h3>
              <div className="mt-3 text-white">
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={springBouncy}
                  className="font-heading italic text-5xl"
                >{plan.price}</motion.span>
                <span className="text-sm font-body text-white/60 ml-1">{plan.period}</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm font-body text-white/70 flex-1">
                {plan.items.map((d) => (
                  <motion.li key={d} className="flex items-center gap-2.5" whileHover={{ x: 4, color: "#fff" }} transition={{ type: "spring", stiffness: 500 }}>
                    <span className="text-violet-400 text-xs">âœ“</span><span>{d}</span>
                  </motion.li>
                ))}
              </ul>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={tapBounce} className="mt-7">
                <Link href={getStartedHref} className={`block w-full text-center px-4 py-3 rounded-full text-sm font-medium transition-colors ${plan.popular ? "bg-white text-black hover:bg-white/90" : "liquid-glass text-white hover:bg-white/5"}`}>
                  {isSignedIn ? "Go to Dashboard" : "Begin Now"}
                </Link>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* â”€â”€ FAQ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section id="faq" className="py-24 px-8 md:px-16 lg:px-20 bg-black">
        <Reveal className="mb-14 text-center">
          <div className="liquid-glass rounded-full px-4 py-1.5 text-xs font-medium text-white inline-block mb-4">FAQ</div>
          <h2 className="font-heading italic text-5xl sm:text-6xl text-white tracking-tight">Common Questions</h2>
        </Reveal>
        <div className="mx-auto max-w-2xl space-y-3">
          {faqItems.map((faq, i) => (
            <motion.div
              key={i}
              layout
              transition={springSmooth}
              className="liquid-glass rounded-2xl overflow-hidden"
            >
              <motion.button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={tapShrink}
                className="w-full flex items-center justify-between p-5 text-left text-sm font-medium text-white font-body"
              >
                <span>{faq.q}</span>
                <motion.span animate={{ rotate: openFaq === i ? 45 : 0 }} transition={springBouncy} className="text-violet-400 text-lg font-heading italic">+</motion.span>
              </motion.button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-sm font-body text-white/60 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* â”€â”€ ScrollVelocity Transition â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="py-24 overflow-hidden border-t border-white/[0.06] bg-black">
        <ScrollVelocity
          texts={['SentinelNexus', 'Enterprise AI Security']} 
          velocity={50} 
          className="text-white hover:text-white/80 font-heading italic transition-colors duration-500 cursor-default"
        />
      </section>

      {/* â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Reveal>
        <footer className="pt-16 pb-2 bg-black border-t border-white/[0.06] px-8 md:px-16 lg:px-20">
          <div className="max-w-7xl mx-auto grid gap-10 md:grid-cols-4">
            {[
              { title: "Product", links: [{ href: "/features", label: "Features" }, { href: "#pricing", label: "Pricing" }, { href: "/docs", label: "Documentation" }] },
              { title: "Resources", links: [{ href: "/docs", label: "Docs" }, { href: "/blog", label: "Blog" }, { href: "/changelog", label: "Changelog" }, { href: "/status", label: "Status" }] },
              { title: "Company", links: [{ href: "/about", label: "About" }, { href: "/contact", label: "Contact" }, { href: SOCIAL_LINKS.portfolio, label: "mayyanks.app" }, { href: SOCIAL_LINKS.website, label: "mayankiitj.in" }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-sm font-body font-semibold text-white">{col.title}</h4>
                <div className="flex flex-col space-y-2.5 text-sm font-body text-white/60">
                  {col.links.map((l) => (
                    <motion.div key={l.label} whileHover={{ x: 4, color: "#fff" }} transition={{ type: "spring", stiffness: 500 }}>
                      <Link href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}>{l.label}</Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <h4 className="mb-4 text-sm font-body font-semibold text-white">Connect</h4>
              <div className="space-y-2.5 text-sm font-body text-white/60">
                {[
                  { href: SOCIAL_LINKS.linkedin, label: "LinkedIn" },
                  { href: SOCIAL_LINKS.github, label: "GitHub" },
                  { href: SOCIAL_LINKS.instagram, label: "Instagram" },
                ].map((s) => (
                  <motion.div key={s.label} whileHover={{ x: 6, borderColor: "rgba(124,58,237,0.35)", color: "#fff" }} whileTap={tapShrink} transition={springSmooth}>
                    <Link href={s.href} target="_blank" rel="noopener noreferrer" className="liquid-glass flex items-center gap-2.5 rounded-xl px-3 py-2">{s.label}</Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-sm font-body text-white/50 relative z-10">
            <span>Â© {new Date().getFullYear()} SentinelNexus. All rights reserved.</span>
            <span>Made with ðŸ¤ for AI Safety</span>
          </div>

          {/* Huge Background Text Watermark */}
          <div className="pointer-events-none relative flex w-full items-center justify-center overflow-hidden pt-12 pb-2">
            <span className="text-[15vw] font-heading italic font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/[0.07] to-transparent select-none">
              SENTINELNEXUS
            </span>
          </div>
        </footer>
      </Reveal>
    </main>
  );
}
