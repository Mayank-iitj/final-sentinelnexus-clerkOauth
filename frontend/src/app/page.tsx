"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useScroll, useTransform } from "framer-motion";
import {
  motion, AnimatePresence, Reveal,
  staggerContainer, fadeUp, scaleIn, slideLeft, slideRight,
  hoverLift, hoverScale, hoverGlow, tapShrink, tapBounce,
  pulseGlow, floatY, springBouncy, springSmooth,
} from "../lib/animations";
import Image from "next/image";
import { SOCIAL_LINKS } from "../lib/social-links";
import { CardNav, CardSwap, Card, ScrollStack, ScrollStackItem, LogoLoop, BorderGlow, StarBorder, ScrollVelocity } from "../components";
import { useUser } from "@clerk/nextjs";

const navItems = [
  {
    label: "Product",
    bgColor: "#1B1722",
    textColor: "#fff",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it Works", href: "#workflow" },
      { label: "Pricing", href: "#pricing" }
    ]
  },
  {
    label: "Resources", 
    bgColor: "#2F293A",
    textColor: "#fff",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Blog", href: "/blog" }
    ]
  }
];

import Strands from "../components/Strands/Strands";

/* ── Data ─────────────────────────────────────────────────────────────────── */
const features = [
  { title: "Code Security Scanning", desc: "120+ SAST rules for secrets, injections, and IaC misconfigurations with CVSS v3.1 scoring.", icon: "</>" },
  { title: "Prompt Injection Defense", desc: "Detect jailbreaks, system prompt leakage, and PII exfiltration across LLM conversations.", icon: "!>" },
  { title: "PII & Data Protection", desc: "Credit cards (Luhn), SSNs, IBANs, emails — automated compliance evidence trails.", icon: "⊕" },
  { title: "Universal AI Trust Score™", desc: "Real-time, dynamic risk quantification engine combining vulnerabilities, supply chain risk, and brand trust.", icon: "★" },
  { title: "Real-Time Digital Twin", desc: "Interactive live attack graphs and zero-day threat prediction for your entire AI infrastructure.", icon: "⚄" },
  { title: "Autonomous Red/Blue Agents", desc: "Continuous automated attack simulation and infrastructure-as-code patch generation.", icon: "⚔" },
  { title: "AI Risk Scoring", desc: "IEEE-precise CVSS v3.1 base scores with 8-metric vector strings and CWE mappings.", icon: "R+" },
  { title: "Global Regulation Engine", desc: "One-click multi-framework compliance automation with automated evidence collection.", icon: "⚖" },
  { title: "PDF Report Generation", desc: "HackerOne-style PDF security reports with executive summaries and full evidence.", icon: "☰" },
];

const plans = [
  { tier: "Starter", price: "$0", period: "forever", items: ["5 scans/month", "All scan engines", "Basic CVSS scoring", "Email support", "1 project"], cta: "Start Free", tag: "Most Pick" },
  { tier: "Professional", price: "$299", period: "/month", items: ["100 scans/month", "All scan engines", "Custom rules", "PDF reports", "10 projects", "Slack alerts", "Priority support"], cta: "Upgrade to Pro", tag: "Recommended", popular: true },
  { tier: "Enterprise", price: "$999", period: "/month", items: ["Unlimited scans", "SOC 2 exports", "SSO / SAML", "Unlimited projects", "Dedicated CSM", "SLA < 30 min", "Custom integrations"], cta: "Talk to Sales", tag: "Advanced" },
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

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function HomePage() {
  const { isSignedIn } = useUser();
  const getStartedHref = isSignedIn ? "/dashboard" : "/signup";
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="nubien-bg min-h-screen text-white overflow-hidden">
      {/* ── Header (initial + animate) ─────────────────────────────────── */}
      {/* ── Header (CardNav) ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 pt-4 pointer-events-none">
        <div className="pointer-events-auto">
          <CardNav
            logo="/favicon.png"
            logoAlt="SentinelNexus Logo"
            items={navItems}
            baseColor="rgba(0,0,0,0.7)"
            menuColor="#fff"
            buttonBgColor="#7c3aed"
            buttonTextColor="#fff"
            className="backdrop-blur-xl"
          />
        </div>
      </div>

      {/* ── Hero (parallax + scroll + spring) ──────────────────────────── */}
      <section ref={heroRef} className="relative section-shell pt-24 pb-20 text-center min-h-[90vh]">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-50">
          <Strands
            colors={["#F97316", "#7C3AED", "#06B6D4"]}
            count={3}
            speed={0.5}
            amplitude={1.2}
            waviness={1.2}
            thickness={0.8}
            glow={2.6}
            taper={3}
            spread={1}
            intensity={0.6}
            saturation={1.5}
            opacity={1}
            scale={1.5}
          />
        </div>
        <motion.div animate={{ floatY }} className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none z-0" />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 mx-auto max-w-4xl space-y-8 pt-10">
          <Reveal>
            <motion.div whileHover={{ hoverScale }} className="section-pill mx-auto cursor-default">
              <span>🛡️</span><span>AI Security V2.0 is now live</span>
            </motion.div>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="text-5xl sm:text-7xl font-extrabold leading-[1.08] tracking-tight">
              Secure your AI with{" "}<span className="gradient-word">SentinelNexus</span>
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-gray-400 leading-relaxed">
              The AI Security & Compliance Intelligence Platform. Detect injections,
              protect PII, and ensure regulatory compliance — in real-time.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(124,58,237,0.35)" }} whileTap={{ tapBounce }} transition={{ springBouncy }}>
                <StarBorder
                  as="div"
                  color="rgba(124,58,237,0.8)"
                  speed="4s"
                  thickness={2}
                  className="rounded-full p-0"
                >
                  <Link href={getStartedHref} className="btn-primary text-base !px-8 !py-3.5 m-[2px] block w-full h-full rounded-full">
                    {isSignedIn ? "Go to Dashboard" : "Get Started Free"}
                  </Link>
                </StarBorder>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03, borderColor: "rgba(124,58,237,0.5)" }} whileTap={{ tapShrink }}>
                <a href="#workflow" className="btn-ghost text-base !px-8 !py-3.5">See How It Works</a>
              </motion.div>
            </div>
            <p className="text-sm text-gray-600 mt-4">No credit card required · Google SSO sign-in</p>
          </Reveal>
        </motion.div>

        {/* CardSwap feature showcase */}
        <Reveal delay={0.45} variant="scaleIn" className="mt-24 relative z-10 flex justify-center">
          <div className="relative mx-auto" style={{ height: '400px', width: '500px' }}>
            <CardSwap cardDistance={60} verticalDistance={70} delay={4000} pauseOnHover={true}>
              {[
                ["Critical Alerts", "07", "text-red-400", "Detected in last 24h"],
                ["Prompt Attacks", "31", "text-amber-400", "Jailbreak attempts blocked"],
                ["PII Incidents", "04", "text-violet-400", "Data exfiltration prevented"],
              ].map(([label, val, color, subtitle]) => (
                <Card key={label} className="nub-card violet-glow flex flex-col justify-center items-center h-full w-full p-8 text-center bg-black/90 backdrop-blur-2xl border-white/[0.1]">
                  <div className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">{label}</div>
                  <div className={`text-8xl font-black tracking-tighter ${color}`}>{val}</div>
                  <div className="mt-6 text-sm text-gray-500">{subtitle}</div>
                </Card>
              ))}
            </CardSwap>
          </div>
        </Reveal>
      </section>

      {/* ── Features (stagger + variants + whileInView) ───────────────── */}
      <section id="features" className="section-shell py-24">
        <Reveal className="mb-14 text-center">
          <div className="section-pill mx-auto mb-4">Features</div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Everything you need to secure AI</h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">Packed with cutting-edge features designed to elevate your security posture.</p>
        </Reveal>
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              variants={i % 2 === 0 ? slideLeft : slideRight}
              whileTap={{ tapShrink }}
              className="h-full"
            >
              <BorderGlow
                className="h-full w-full"
                backgroundColor="#0a0a0a"
                glowColor="268 100 76"
                edgeSensitivity={40}
                glowRadius={50}
                animated={true}
              >
                <div className="h-full rounded-2xl p-7 cursor-default group border border-white/[0.04]">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-bold text-violet-300 transition-all duration-300 group-hover:bg-violet-500/10 group-hover:border-violet-400/30"
                  >
                    {f.icon}
                  </motion.div>
                  <h3 className="mb-2 text-lg font-semibold text-white">{f.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              </BorderGlow>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Marquee (LogoLoop) ────────────────────────────────────────── */}
      <section className="section-shell py-8">
        <div className="nub-card rounded-3xl px-6 py-8 flex flex-col gap-6 overflow-hidden relative">
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

      {/* ── How it Works (ScrollStack) ────────────────────────────────── */}
      <section id="workflow" className="w-full">
        <Reveal className="mb-8 pt-24 text-center">
          <div className="section-pill mx-auto mb-4">Our Process</div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">for AI-Driven Security</h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">Three steps to production-grade AI protection.</p>
        </Reveal>

        <div className="h-[120vh] w-full relative -mt-10">
          <ScrollStack
            itemDistance={120}
            itemScale={0.05}
            itemStackDistance={40}
            useWindowScroll={true}
          >
            {processSteps.map((step) => (
              <ScrollStackItem key={step.num} itemClassName="max-w-3xl mx-auto">
                <div className="nub-card flex items-start gap-8 rounded-[40px] p-10 bg-[#0a0a0a] border border-white/[0.08] backdrop-blur-3xl shadow-[0_0_50px_rgba(124,58,237,0.05)]">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border border-violet-400/30 bg-violet-500/10 text-2xl font-black text-violet-400">
                    {step.num}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-3xl font-bold mb-3 text-white tracking-tight">{step.title}</h3>
                    <p className="text-lg text-gray-400 leading-relaxed max-w-xl">{step.desc}</p>
                  </div>
                </div>
              </ScrollStackItem>
            ))}
          </ScrollStack>
        </div>
      </section>

      {/* ── Pricing (spring hover + layout) ───────────────────────────── */}
      <section id="pricing" className="section-shell py-24">
        <Reveal className="mb-14 text-center">
          <div className="section-pill mx-auto mb-4">Pricing</div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Perfect for Agencies & Startups</h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">Flexible plans designed to suit a variety of needs and budgets.</p>
        </Reveal>
        <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <motion.div
              key={plan.tier}
              variants={scaleIn}
              layout
              whileHover={{ y: -12, transition: { type: "spring", stiffness: 400, damping: 15 } }}
              whileTap={{ tapShrink }}
              className={`nub-card glare-hover relative rounded-2xl p-8 h-full flex flex-col cursor-default ${plan.popular ? "violet-glow" : ""}`}
            >
              <span className="section-pill !text-[10px] mb-4 self-start">{plan.tag}</span>
              <h3 className="text-xl font-semibold">{plan.tier}</h3>
              <div className="mt-3">
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ springBouncy }}
                  className="text-4xl font-bold"
                >{plan.price}</motion.span>
                <span className="text-sm text-gray-500 ml-1">{plan.period}</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-gray-400 flex-1">
                {plan.items.map((d) => (
                  <motion.li key={d} className="flex items-center gap-2.5" whileHover={{ x: 4, color: "#e5e7eb" }} transition={{ type: "spring", stiffness: 500 }}>
                    <span className="text-violet-400 text-xs">✓</span><span>{d}</span>
                  </motion.li>
                ))}
              </ul>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ tapBounce }}>
                <Link href={getStartedHref} className={`mt-7 ${plan.popular ? "btn-primary" : "btn-ghost"} w-full justify-center`}>{isSignedIn ? "Go to Dashboard" : plan.cta}</Link>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── FAQ (AnimatePresence + exit + layout) ─────────────────────── */}
      <section id="faq" className="section-shell py-24">
        <Reveal className="mb-14 text-center">
          <div className="section-pill mx-auto mb-4">FAQ</div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">Common Questions</h2>
        </Reveal>
        <div className="mx-auto max-w-2xl space-y-3">
          {faqItems.map((faq, i) => (
            <motion.div
              key={i}
              layout
              transition={{ springSmooth }}
              className="nub-card rounded-2xl overflow-hidden"
            >
              <motion.button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                whileTap={{ tapShrink }}
                className="w-full flex items-center justify-between p-5 text-left text-sm font-medium text-white"
              >
                <span>{faq.q}</span>
                <motion.span animate={{ rotate: openFaq === i ? 45 : 0 }} transition={{ springBouncy }} className="text-violet-400 text-lg">+</motion.span>
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
                    <p className="px-5 pb-5 text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── ScrollVelocity Transition ─────────────────────────────────── */}
      <section className="py-24 overflow-hidden border-t border-white/[0.06]">
        <ScrollVelocity
          texts={['SentinelNexus', 'Enterprise AI Security']} 
          velocity={50} 
          className="text-white hover:text-white/80 transition-colors duration-500 cursor-default"
        />
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <Reveal>
        <footer className="mt-16 border-t border-white/[0.06] py-14">
          <div className="section-shell grid gap-10 md:grid-cols-4">
            {[
              { title: "Product", links: [{ href: "/features", label: "Features" }, { href: "#pricing", label: "Pricing" }, { href: "/docs", label: "Documentation" }] },
              { title: "Resources", links: [{ href: "/docs", label: "Docs" }, { href: "/blog", label: "Blog" }, { href: "/changelog", label: "Changelog" }, { href: "/status", label: "Status" }] },
              { title: "Company", links: [{ href: "/about", label: "About" }, { href: "/contact", label: "Contact" }, { href: SOCIAL_LINKS.portfolio, label: "mayyanks.app" }, { href: SOCIAL_LINKS.website, label: "mayankiitj.in" }] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-sm font-semibold text-white">{col.title}</h4>
                <div className="flex flex-col space-y-2.5 text-sm text-gray-500">
                  {col.links.map((l) => (
                    <motion.div key={l.label} whileHover={{ x: 4, color: "#fff" }} transition={{ type: "spring", stiffness: 500 }}>
                      <Link href={l.href} target={l.href.startsWith("http") ? "_blank" : undefined} rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}>{l.label}</Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Connect</h4>
              <div className="space-y-2.5 text-sm text-gray-500">
                {[
                  { href: SOCIAL_LINKS.linkedin, label: "LinkedIn" },
                  { href: SOCIAL_LINKS.github, label: "GitHub" },
                  { href: SOCIAL_LINKS.instagram, label: "Instagram" },
                ].map((s) => (
                  <motion.div key={s.label} whileHover={{ x: 6, borderColor: "rgba(124,58,237,0.35)", color: "#fff" }} whileTap={{ tapShrink }} transition={{ springSmooth }}>
                    <Link href={s.href} target="_blank" rel="noopener noreferrer" className="glare-hover flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">{s.label}</Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          <div className="section-shell mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-sm text-gray-600 relative z-10">
            <span>© {new Date().getFullYear()} SentinelNexus. All rights reserved.</span>
            <span>Made with ❤️ for AI Safety</span>
          </div>

          {/* Huge Background Text Watermark */}
          <div className="pointer-events-none relative flex w-full items-center justify-center overflow-hidden pt-12 pb-2">
            <span className="text-[15vw] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/[0.07] to-transparent select-none">
              SENTINELNEXUS
            </span>
          </div>
        </footer>
      </Reveal>
    </main>
  );
}
