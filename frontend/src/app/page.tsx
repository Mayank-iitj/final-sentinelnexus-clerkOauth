"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import FadingVideo from "../components/FadingVideo/FadingVideo";
import BlurText from "../components/BlurText/BlurText";

import { useUser } from "@clerk/nextjs";
import Hyperspeed from "../components/Hyperspeed/Hyperspeed";
import { OptionWheel, LogoLoop as LogoLoopOriginal, BorderGlow, ScrollVelocity, Plasma, PlasmaWave, StaggeredMenu as StaggeredMenuOriginal, PixelCard, MagicBento } from "../components";

const LogoLoop = LogoLoopOriginal as any;
const StaggeredMenu = StaggeredMenuOriginal as any;

import { Reveal, staggerContainer, slideLeft, slideRight, tapShrink, springSmooth, springBouncy, scaleIn, tapBounce } from "../lib/animations";
import { SOCIAL_LINKS } from "../lib/social-links";
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "../registry/magicui/terminal";

const features = [
  { title: "Code Security Scanning", desc: "120+ SAST rules for secrets, injections, and IaC misconfigurations with CVSS v3.1 scoring.", icon: "</>" },
  { title: "Prompt Injection Defense", desc: "Detect jailbreaks, system prompt leakage, and PII exfiltration across LLM conversations.", icon: "!>" },
  { title: "PII & Data Protection", desc: "Credit cards (Luhn), SSNs, IBANs, emails — automated compliance evidence trails.", icon: "⊗" },
  { title: "Universal AI Trust Score™", desc: "Real-time, dynamic risk quantification engine combining vulnerabilities, supply chain risk, and brand trust.", icon: "★" },
  { title: "Real-Time Digital Twin", desc: "Interactive live attack graphs and zero-day threat prediction for your entire AI infrastructure.", icon: "⚙" },
  { title: "Autonomous Red/Blue Agents", desc: "Continuous automated attack simulation and infrastructure-as-code patch generation.", icon: "⚔" },
  { title: "AI Risk Scoring", desc: "IEEE-precise CVSS v3.1 base scores with 8-metric vector strings and CWE mappings.", icon: "R+" },
  { title: "Global Regulation Engine", desc: "One-click multi-framework compliance automation with automated evidence collection.", icon: "⚖" },
  { title: "PDF Report Generation", desc: "HackerOne-style PDF security reports with executive summaries and full evidence.", icon: "📄" },
];

const plans = [
  { tier: "Starter", price: "₹0", period: "forever", items: ["5 scans/month", "All scan engines", "Basic CVSS scoring", "Email support", "1 project"], cta: "Start Free", tag: "Most Pick" },
  { tier: "Professional", price: "₹299", period: "/month", items: ["100 scans/month", "All scan engines", "Custom rules", "PDF reports", "10 projects", "Slack alerts", "Priority support"], cta: "Upgrade to Pro", tag: "Recommended", popular: true },
  { tier: "Enterprise", price: "₹999", period: "/month", items: ["Unlimited scans", "SOC 2 exports", "SSO / SAML", "Unlimited projects", "Dedicated CSM", "SLA < 30 min", "Custom integrations"], cta: "Talk to Sales", tag: "Advanced" },
];

const marqueeItems = [
  "Universal AI Trust Score™", "Real-Time Organizational Digital Twin", "AI Attack Simulator", 
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

const bentoCards = [
  {
    color: '#0a0a0a',
    title: 'Risk Matrix',
    description: 'Dynamic CVSS v3.1 5x5 Grid',
    label: 'Visualization'
  },
  {
    color: '#0a0a0a',
    title: 'Zero-Day AI',
    description: 'Predictive threat modeling engine',
    label: 'Intelligence'
  },
  {
    color: '#0a0a0a',
    title: 'Compliance',
    description: 'SOC2 & EU AI Act automation',
    label: 'Governance'
  },
  {
    color: '#0a0a0a',
    title: 'Dark Web',
    description: 'OSINT leak detection monitoring',
    label: 'Intelligence'
  },
  {
    color: '#0a0a0a',
    title: 'LLM Firewall',
    description: 'Block prompt injections live',
    label: 'Security'
  },
  {
    color: '#0a0a0a',
    title: 'Red Team',
    description: 'Autonomous penetration testing',
    label: 'Simulation'
  }
];

const processSteps = [
  { num: "01", title: "Connect", desc: "Sign in with Google SSO. Integrate your repositories and AI applications in seconds." },
  { num: "02", title: "Scan", desc: "Our engines analyze code, prompts, and text for vulnerabilities, secrets, and compliance drifts." },
  { num: "03", title: "Protect", desc: "Get CVSS-scored findings, remediation guidance, and auto-generated PDF security reports." },
];

const faqItems = [
  { q: "What types of scans does SentinelNexus support?", a: "Code security (SAST with 120+ rules), prompt injection detection, and PII/secrets scanning with Luhn/IBAN checksums." },
  { q: "Is there a free tier?", a: "Yes — the Starter plan includes 5 scans/month with full access to all scan engines, completely free forever." },
  { q: "How does the scoring work?", a: "We use IEEE-standard CVSS v3.1 with 8-metric vector strings, CWE mappings, and weighted risk aggregation." },
];

export default function HomePage() {
  const { isSignedIn } = useUser();
  const getStartedHref = isSignedIn ? "/dashboard" : "/signup";
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  return (
    <main className="min-h-screen bg-black relative selection:bg-white/20">
      {/* ── Section 1: Hero ─────────────────────────────────── */}
      <section className="relative min-h-screen w-full flex flex-col overflow-hidden bg-black z-0">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Plasma 
            color="#7c3aed"
            speed={0.6}
            direction="forward"
            scale={1.1}
            opacity={0.8}
            mouseInteractive={true}
          />
        </div>

        {/* Navbar */}
        <StaggeredMenu
          isFixed={true}
          position="right"
          logoUrl="/logo.png"
          items={[
            { label: "Product", ariaLabel: "Product Features", link: "/features" },
            { label: "Pricing", ariaLabel: "Pricing Plans", link: "/pricing" },
            { label: "Resources", ariaLabel: "Blog & Resources", link: "/blog" },
            { label: "Docs", ariaLabel: "Documentation", link: "/docs" },
            { label: "Changelog", ariaLabel: "Changelog", link: "/changelog" },
            { label: "Login", ariaLabel: "Log in", link: "/login" },
            { label: "Begin Now", ariaLabel: "Get Started", link: getStartedHref }
          ]}
          socialItems={[
            { label: 'Twitter', link: 'https://twitter.com' },
            { label: 'GitHub', link: 'https://github.com' },
            { label: 'LinkedIn', link: 'https://linkedin.com' }
          ]}
          displaySocials={true}
          displayItemNumbering={true}
          menuButtonColor="#fff"
          openMenuButtonColor="#fff"
          changeMenuColorOnOpen={true}
          colors={['#B497CF', '#5227FF']}
          accentColor="#5227FF"
        />

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
            as="h1"
            text="SentinelNexus: Secure Your AI Infrastructure Across the Enterprise" 
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
          <div className="w-full max-w-4xl mx-auto mt-4 font-heading italic text-white text-2xl md:text-3xl tracking-tight opacity-80">
            <LogoLoop
              logos={[
                { node: <span className="px-8">OpenAI</span> },
                { node: <span className="px-8">Anthropic</span> },
                { node: <span className="px-8">HuggingFace</span> },
                { node: <span className="px-8">Google</span> },
                { node: <span className="px-8">Meta</span> },
                { node: <span className="px-8">Microsoft</span> },
                { node: <span className="px-8">Mistral AI</span> },
                { node: <span className="px-8">Cohere</span> },
              ]}
              speed={50}
              direction="left"
              gap={0}
              pauseOnHover={true}
              fadeOut={true}
              fadeOutColor="transparent"
            />
          </div>
        </motion.div>
      </section>

      {/* ── Section 2: Capabilities ───────────────────────────────── */}
      <section className="relative min-h-screen w-full bg-black z-0">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Plasma 
            color="#7c3aed"
            speed={0.6}
            direction="forward"
            scale={1.1}
            opacity={0.8}
            mouseInteractive={true}
          />
        </div>

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
                <h3 className="font-heading italic text-white text-3xl md:text-4xl tracking-[-1px] leading-none">Universal Trust Score™</h3>
                <p className="mt-3 text-sm text-white/90 font-body font-light leading-snug max-w-[32ch]">
                  Quantify your organizational risk with a dynamic engine combining deep supply chain intelligence, model governance, and active vulnerability metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Marquee (LogoLoop) ─────────────────────────────────────────── */}
      <section className="py-8 bg-black">
        <div className="flex flex-col lg:flex-row justify-center gap-6 mb-12 relative z-10 px-4 max-w-7xl mx-auto">
          <div className="w-full lg:w-1/3">
            <Terminal>
              <TypingAnimation delay={0}>$ sentinel scan --target production-cluster</TypingAnimation>
              <AnimatedSpan delay={1200} className="text-blue-400">
                [*] Initializing SentinelNexus Autonomous Red Team Agent...
              </AnimatedSpan>
              <AnimatedSpan delay={2200} className="text-yellow-400">
                [!] Analyzing 120+ SAST rules & evaluating CVSS v3.1 metrics...
              </AnimatedSpan>
              <AnimatedSpan delay={3200} className="text-yellow-400">
                [!] Detecting prompt injections and PII exfiltration risks...
              </AnimatedSpan>
              <TypingAnimation delay={4600}>$ sentinel status --live</TypingAnimation>
              <AnimatedSpan delay={6000} className="text-green-400">
                [+] Scan Complete: 0 High, 2 Medium, 1 Low
              </AnimatedSpan>
              <AnimatedSpan delay={6500} className="text-green-400">
                [+] Trust Score updated to 94. AI Security Posture: SECURE
              </AnimatedSpan>
            </Terminal>
          </div>
          <div className="w-full lg:w-1/3">
            <Terminal>
              <TypingAnimation delay={500}>$ sentinel monitor --stream ai-gateway</TypingAnimation>
              <AnimatedSpan delay={1500} className="text-blue-400">
                [*] Hooking into LLM API Gateway stream...
              </AnimatedSpan>
              <AnimatedSpan delay={2500} className="text-yellow-400">
                [!] Intercepted anomalous prompt structure.
              </AnimatedSpan>
              <AnimatedSpan delay={3500} className="text-red-400">
                [x] Alert: Potential Jailbreak attempt detected (DAN variation).
              </AnimatedSpan>
              <TypingAnimation delay={4800}>$ sentinel block --session id-924x</TypingAnimation>
              <AnimatedSpan delay={6200} className="text-green-400">
                [+] Session terminated successfully.
              </AnimatedSpan>
              <AnimatedSpan delay={6800} className="text-green-400">
                [+] Governance log updated. No data exfiltrated.
              </AnimatedSpan>
            </Terminal>
          </div>
          <div className="w-full lg:w-1/3">
            <Terminal>
              <TypingAnimation delay={800}>$ sentinel audit --framework soc2,eu-ai-act</TypingAnimation>
              <AnimatedSpan delay={1800} className="text-blue-400">
                [*] Generating automated compliance artifacts...
              </AnimatedSpan>
              <AnimatedSpan delay={2800} className="text-blue-400">
                [*] Cross-referencing AI Asset Inventory...
              </AnimatedSpan>
              <AnimatedSpan delay={3800} className="text-yellow-400">
                [!] Warning: Model &apos;phi-3-mini&apos; missing usage constraints.
              </AnimatedSpan>
              <TypingAnimation delay={5000}>$ sentinel patch --auto --apply</TypingAnimation>
              <AnimatedSpan delay={6400} className="text-green-400">
                [+] Synthesized boundary constraints and applied.
              </AnimatedSpan>
              <AnimatedSpan delay={7000} className="text-green-400">
                [+] Audit passed. HackerOne-style PDF report generated.
              </AnimatedSpan>
            </Terminal>
          </div>
        </div>
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

      {/* ── Section: Wellness Hero override in Features ────────── */}
      <section className="relative w-full h-screen overflow-hidden font-geist">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Plasma 
            color="#7c3aed"
            speed={0.6}
            direction="forward"
            scale={1.1}
            opacity={0.8}
            mouseInteractive={true}
          />
        </div>


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


      </section>

      {/* ── How it Works (ScrollStack) ─────────────────────────────────── */}
      <section id="workflow" className="relative w-full bg-black overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Plasma color="#7c3aed" opacity={0.6} mouseInteractive={false} />
        </div>
        <Reveal className="relative z-10 mb-8 pt-24 text-center">
          <div className="liquid-glass rounded-full px-4 py-1.5 text-xs font-medium text-white inline-block mb-4">Our Process</div>
          <h2 className="font-heading italic text-5xl sm:text-6xl text-white tracking-tight">for AI-Driven Security</h2>
          <p className="mt-4 text-white/70 font-body max-w-xl mx-auto">Three steps to production-grade AI protection.</p>
        </Reveal>

        <div className="h-[600px] w-full relative z-10 mt-10 max-w-7xl mx-auto flex flex-col md:flex-row items-center">
          <div className="w-full md:w-1/2 h-full flex justify-center">
            <div className="w-full h-full relative" style={{ maxWidth: '400px' }}>
              <OptionWheel
                items={processSteps.map(step => step.title)}
                defaultSelected={0}
                textColor="rgba(255,255,255,0.4)"
                activeColor="#7c3aed"
                side="left"
                fontSize={3.5}
                spacing={1.8}
                curve={1.2}
                tilt={10}
                blur={4}
                fade={0.3}
                smoothing={150}
                inset={40}
                loop={false}
                draggable={true}
                onChange={(index) => setActiveStep(index)}
              />
            </div>
          </div>
          <div className="w-full md:w-1/2 flex flex-col justify-center px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="liquid-glass-strong flex flex-col gap-6 rounded-[40px] p-10 backdrop-blur-3xl shadow-[0_0_50px_rgba(124,58,237,0.05)]"
              >
                <div className="flex items-center gap-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] border border-violet-400/30 bg-violet-500/10 text-xl font-heading italic text-violet-400">
                    {processSteps[activeStep].num}
                  </div>
                  <h3 className="text-3xl font-heading italic text-white tracking-tight">{processSteps[activeStep].title}</h3>
                </div>
                <p className="text-lg text-white/80 font-body leading-relaxed">
                  {processSteps[activeStep].desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── Capabilities Showcase (MagicBento) ─────────────────────────────────── */}
      <section className="relative w-full bg-black py-24 overflow-hidden border-t border-white/[0.06]">
        <Reveal className="mb-14 text-center px-4">
          <div className="liquid-glass rounded-full px-4 py-1.5 text-xs font-medium text-white inline-block mb-4">Enterprise Features</div>
          <h2 className="font-heading italic text-5xl sm:text-6xl text-white tracking-tight">AI Infrastructure Security</h2>
          <p className="mt-4 text-white/70 font-body max-w-xl mx-auto">Automate your entire security posture from code commits to runtime LLM defense.</p>
        </Reveal>
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
          <MagicBento 
            cards={bentoCards}
            enableSpotlight={true}
            enableBorderGlow={true}
            glowColor="132, 0, 255"
            enableTilt={true}
            enableMagnetism={true}
            particleCount={15}
          />
        </div>
      </section>

      {/* ── Visual Showcase (PixelCard) ─────────────────────────────────── */}
      <section className="relative w-full bg-black py-24 overflow-hidden border-t border-white/[0.06] flex flex-col items-center">
        <Reveal className="mb-14 text-center px-4">
          <div className="liquid-glass rounded-full px-4 py-1.5 text-xs font-medium text-white inline-block mb-4">Threat Landscape</div>
          <h2 className="font-heading italic text-5xl sm:text-6xl text-white tracking-tight">Active Defense Vectors</h2>
        </Reveal>
        <div className="flex justify-center gap-8 flex-wrap w-full max-w-5xl">
          <PixelCard variant="blue" gap={10} speed={25} colors="#e0f2fe,#7dd3fc,#0ea5e9" noFocus={false}>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
              <h3 className="text-2xl font-bold text-white mb-2">Threat Detection</h3>
              <p className="text-sm text-gray-300">Identify anomalies in real-time.</p>
            </div>
          </PixelCard>
          <PixelCard variant="pink" gap={6} speed={80} colors="#fecdd3,#fda4af,#e11d48" noFocus={true}>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
              <h3 className="text-2xl font-bold text-white mb-2">Vulnerability Scan</h3>
              <p className="text-sm text-gray-300">Automated endpoint scanning.</p>
            </div>
          </PixelCard>
          <PixelCard variant="yellow" gap={3} speed={20} colors="#fef08a,#fde047,#eab308" noFocus={false}>
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 pointer-events-none">
              <h3 className="text-2xl font-bold text-white mb-2">Compliance</h3>
              <p className="text-sm text-gray-300">Track and enforce standards.</p>
            </div>
          </PixelCard>
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
                    <span className="text-violet-400 text-xs">✓</span><span>{d}</span>
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
            <span>© {new Date().getFullYear()} SentinelNexus. All rights reserved.</span>
          </div>

          {/* Huge Background Text Watermark */}
          <div className="pointer-events-none relative flex w-full items-center justify-center overflow-hidden pt-12 pb-2">
            <span className="text-[15vw] font-heading italic font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/[0.07] to-transparent select-none">
              SENTINELNEXUS
            </span>
          </div>
          <div className="relative w-full h-[400px] mt-8 overflow-hidden rounded-t-3xl border-t border-white/[0.06]">
            <Hyperspeed
              effectOptions={{
                onSpeedUp: () => { },
                onSlowDown: () => { },
                distortion: 'turbulentDistortion',
                length: 400,
                roadWidth: 10,
                islandWidth: 2,
                lanesPerRoad: 4,
                fov: 90,
                fovSpeedUp: 150,
                speedUp: 2,
                carLightsFade: 0.4,
                totalSideLightSticks: 20,
                lightPairsPerRoadWay: 40,
                shoulderLinesWidthPercentage: 0.05,
                brokenLinesWidthPercentage: 0.1,
                brokenLinesLengthPercentage: 0.5,
                lightStickWidth: [0.12, 0.5],
                lightStickHeight: [1.3, 1.7],
                movingAwaySpeed: [60, 80],
                movingCloserSpeed: [-120, -160],
                carLightsLength: [400 * 0.03, 400 * 0.2],
                carLightsRadius: [0.05, 0.14],
                carWidthPercentage: [0.3, 0.5],
                carShiftX: [-0.8, 0.8],
                carFloorSeparation: [0, 5],
                colors: {
                  roadColor: 0x080808,
                  islandColor: 0x0a0a0a,
                  background: 0x000000,
                  shoulderLines: 0xFFFFFF,
                  brokenLines: 0xFFFFFF,
                  leftCars: [0xD856BF, 0x6750A2, 0xC247AC],
                  rightCars: [0x03B3C3, 0x0E5EA5, 0x324555],
                  sticks: 0x03B3C3,
                }
              }}
            />
          </div>
        </footer>
      </Reveal>
    </main>
  );
}
