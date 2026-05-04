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

/* ── Data ─────────────────────────────────────────────────────────────────── */
const features = [
  { title: "Code Security Scanning", desc: "120+ SAST rules for secrets, injections, and IaC misconfigurations with CVSS v3.1 scoring.", icon: "</>" },
  { title: "Prompt Injection Defense", desc: "Detect jailbreaks, system prompt leakage, and PII exfiltration across LLM conversations.", icon: "!>" },
  { title: "PII & Data Protection", desc: "Credit cards (Luhn), SSNs, IBANs, emails — automated compliance evidence trails.", icon: "⊕" },
  { title: "AI Risk Scoring", desc: "IEEE-precise CVSS v3.1 base scores with 8-metric vector strings and CWE mappings.", icon: "R+" },
  { title: "Real-time Alerts", desc: "Instant notifications for critical threats with severity filtering and bulk actions.", icon: "⚡" },
  { title: "PDF Report Generation", desc: "HackerOne-style PDF security reports with executive summaries and full evidence.", icon: "☰" },
];

const plans = [
  { tier: "Starter", price: "$0", period: "forever", items: ["5 scans/month", "All scan engines", "Basic CVSS scoring", "Email support", "1 project"], cta: "Start Free", tag: "Most Pick" },
  { tier: "Professional", price: "$299", period: "/month", items: ["100 scans/month", "All scan engines", "Custom rules", "PDF reports", "10 projects", "Slack alerts", "Priority support"], cta: "Upgrade to Pro", tag: "Recommended", popular: true },
  { tier: "Enterprise", price: "$999", period: "/month", items: ["Unlimited scans", "SOC 2 exports", "SSO / SAML", "Unlimited projects", "Dedicated CSM", "SLA < 30 min", "Custom integrations"], cta: "Talk to Sales", tag: "Advanced" },
];

const marqueeItems = [
  "Prompt Injection", "PII Detection", "SOC2 Evidence", "AI Act Mapping",
  "Zero-Trust Policies", "Live Risk Graph", "Incident Timelines", "Model Guardrails",
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
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main className="nubien-bg min-h-screen text-white overflow-hidden">
      {/* ── Header (initial + animate) ─────────────────────────────────── */}
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...springSmooth, delay: 0.1 }}
        className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/60 backdrop-blur-xl"
      >
        <div className="section-shell flex h-[72px] items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
              <motion.div
              animate={pulseGlow}
              className="nub-card flex h-9 w-9 items-center justify-center rounded-xl overflow-hidden transition-all duration-300 group-hover:border-violet-400/40"
            >
              <Image src="/favicon.png" alt="SentinelNexus" width={36} height={36} className="object-cover" />
            </motion.div>
            <span className="text-lg font-semibold tracking-tight">SentinelNexus</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm text-gray-400">
            {[
              { href: "#features", label: "Features" },
              { href: "#workflow", label: "How it Works" },
              { href: "#pricing", label: "Pricing" },
              { href: "/docs", label: "Docs" },
              { href: "/blog", label: "Blog" },
            ].map((l) => (
              <motion.div key={l.href} whileHover={{ y: -2, color: "#fff" }} transition={{ type: "spring", stiffness: 500, damping: 20 }}>
                <Link href={l.href}>{l.label}</Link>
              </motion.div>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <motion.div whileHover={hoverScale} whileTap={tapShrink}>
              <Link href="/login" className="btn-ghost !py-2 !px-5 text-xs sm:text-sm">Sign In</Link>
            </motion.div>
            <motion.div whileHover={hoverScale} whileTap={tapBounce}>
              <Link href="/signup" className="btn-primary !py-2 !px-5 text-xs sm:text-sm hidden sm:inline-flex">Get Started</Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* ── Hero (parallax + scroll + spring) ──────────────────────────── */}
      <section ref={heroRef} className="relative section-shell pt-24 pb-20 text-center">
        <motion.div animate={floatY} className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 mx-auto max-w-4xl space-y-8">
          <Reveal>
            <motion.div whileHover={hoverScale} className="section-pill mx-auto cursor-default">
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
              <motion.div whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(124,58,237,0.35)" }} whileTap={tapBounce} transition={springBouncy}>
                <Link href="/signup" className="btn-primary text-base !px-8 !py-3.5">Get Started Free</Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03, borderColor: "rgba(124,58,237,0.5)" }} whileTap={tapShrink}>
                <a href="#workflow" className="btn-ghost text-base !px-8 !py-3.5">See How It Works</a>
              </motion.div>
            </div>
            <p className="text-sm text-gray-600 mt-4">No credit card required · Google SSO sign-in</p>
          </Reveal>
        </motion.div>

        {/* Dashboard preview (scale-in + hover lift) */}
        <Reveal delay={0.45} variant="scaleIn" className="mt-16 relative z-10">
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-b from-violet-600/15 via-transparent to-transparent blur-2xl pointer-events-none" />
            <motion.div whileHover={hoverLift} className="nub-card violet-glow relative overflow-hidden rounded-3xl p-7 text-left">
              <div className="mb-6 flex items-center justify-between text-sm text-gray-400">
                <span className="font-medium text-white">SentinelNexus Dashboard</span>
                <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="section-pill !text-[10px] !py-1">Live Preview</motion.span>
              </div>
              <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true }} className="grid gap-4 md:grid-cols-3">
                {[
                  ["Critical Alerts", "07", "text-red-400"],
                  ["Prompt Attacks", "31", "text-amber-400"],
                  ["PII Incidents", "04", "text-violet-400"],
                ].map(([label, val, color]) => (
                  <motion.div key={label} variants={fadeUp} whileHover={{ scale: 1.04, ...hoverGlow }} whileTap={tapShrink} className="rounded-2xl border border-white/[0.06] bg-black/40 p-5 cursor-default">
                    <div className="text-xs text-gray-500">{label}</div>
                    <div className={`mt-2 text-3xl font-bold ${color}`}>{val}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
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
              whileHover={{ y: -8, scale: 1.01, boxShadow: "0 0 50px rgba(124,58,237,0.08)", borderColor: "rgba(124,58,237,0.25)" }}
              whileTap={tapShrink}
              className="nub-card glare-hover h-full rounded-2xl p-7 cursor-default group"
            >
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                transition={{ duration: 0.5 }}
                className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-bold text-violet-300 transition-all duration-300 group-hover:bg-violet-500/10 group-hover:border-violet-400/30"
              >
                {f.icon}
              </motion.div>
              <h3 className="mb-2 text-lg font-semibold">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Marquee (infinite tween) ──────────────────────────────────── */}
      <section className="section-shell py-8 overflow-hidden">
        <div className="nub-card rounded-2xl px-3 py-3">
          <div className="infinite-track">
            {[...marqueeItems, ...marqueeItems].map((item, i) => (
              <motion.span
                key={`${item}-${i}`}
                whileHover={{ scale: 1.1, backgroundColor: "rgba(124,58,237,0.15)" }}
                className="whitespace-nowrap rounded-full border border-violet-400/20 bg-violet-500/8 px-4 py-1.5 text-xs text-violet-300/80 cursor-default"
              >
                {item}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works (layout + drag) ──────────────────────────────── */}
      <section id="workflow" className="section-shell py-24">
        <Reveal className="mb-14 text-center">
          <div className="section-pill mx-auto mb-4">Our Process</div>
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">for AI-Driven Security</h2>
          <p className="mt-4 text-gray-500 max-w-xl mx-auto">Three steps to production-grade AI protection.</p>
        </Reveal>

        <div className="relative mx-auto max-w-4xl space-y-6">
          <div className="absolute left-7 top-8 hidden h-[70%] w-px bg-gradient-to-b from-violet-500/50 to-transparent md:block" />
          {processSteps.map((step, i) => (
            <Reveal key={step.num} delay={i * 0.12} variant={i % 2 === 0 ? "slideLeft" : "slideRight"}>
              <motion.div
                layout
                whileHover={{ x: 12, borderColor: "rgba(124,58,237,0.3)" }}
                whileTap={tapShrink}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.1}
                transition={springSmooth}
                className="nub-card flex items-start gap-5 rounded-2xl p-7 cursor-grab active:cursor-grabbing"
              >
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "linear" }}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/10 text-sm font-bold text-violet-300"
                >
                  {step.num}
                </motion.div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            </Reveal>
          ))}
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
              whileTap={tapShrink}
              className={`nub-card glare-hover relative rounded-2xl p-8 h-full flex flex-col cursor-default ${plan.popular ? "violet-glow" : ""}`}
            >
              <span className="section-pill !text-[10px] mb-4 self-start">{plan.tag}</span>
              <h3 className="text-xl font-semibold">{plan.tier}</h3>
              <div className="mt-3">
                <motion.span
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={springBouncy}
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
              <motion.div whileHover={{ scale: 1.03 }} whileTap={tapBounce}>
                <Link href="/signup" className={`mt-7 ${plan.popular ? "btn-primary" : "btn-ghost"} w-full justify-center`}>{plan.cta}</Link>
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
              transition={springSmooth}
              className="nub-card rounded-2xl overflow-hidden"
            >
              <motion.button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.02)" }}
                whileTap={tapShrink}
                className="w-full flex items-center justify-between p-5 text-left text-sm font-medium text-white"
              >
                <span>{faq.q}</span>
                <motion.span animate={{ rotate: openFaq === i ? 45 : 0 }} transition={springBouncy} className="text-violet-400 text-lg">+</motion.span>
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
                  <motion.div key={s.label} whileHover={{ x: 6, borderColor: "rgba(124,58,237,0.35)", color: "#fff" }} whileTap={tapShrink} transition={springSmooth}>
                    <Link href={s.href} target="_blank" rel="noopener noreferrer" className="glare-hover flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">{s.label}</Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
          <div className="section-shell mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-sm text-gray-600">
            <span>© {new Date().getFullYear()} SentinelNexus. All rights reserved.</span>
            <span>Made with ❤️ for AI Safety</span>
          </div>
        </footer>
      </Reveal>
    </main>
  );
}
