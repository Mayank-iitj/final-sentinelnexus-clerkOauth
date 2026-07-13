"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const features = [
  { title: "Code Security Scanning", desc: "120+ SAST rules for secrets, injections, IaC misconfigs.", icon: "</>", details: ["API keys, passwords, private keys", "SQL/command injection, XSS, SSRF", "IaC: S3 buckets, IAM, TLS", "CVSS v3.1 + CWE mapping"] },
  { title: "Prompt Injection Defense", desc: "Detect jailbreaks, system-prompt leakage, PII exfiltration.", icon: "!>", details: ["DAN-style jailbreak detection", "System prompt extraction", "PII exfiltration blocking", "Multi-turn chain analysis"] },
  { title: "PII & Data Protection", desc: "Detect credit cards (Luhn), SSNs, IBANs, emails, phones.", icon: "PII", details: ["Luhn-validated credit cards", "SSN format detection", "IBAN across 30+ countries", "GDPR compliance trails"] },
  { title: "CVSS v3.1 Risk Scoring", desc: "Full CVSS base scores with vector strings and severity labels.", icon: "R+", details: ["IEEE-precise scoring", "8-metric vector analysis", "Scope change calculations", "Actionable remediation"] },
  { title: "Real-time Alerts", desc: "Auto-notifications for critical findings with CVSS scores.", icon: "!", details: ["Auto-generated from scans", "Severity threshold filtering", "Bulk mark-read operations", "Unread badge across app"] },
  { title: "PDF Reports", desc: "HackerOne-style PDF reports with full evidence trails.", icon: "☰", details: ["Professional PDF layout", "Executive risk summary", "Detailed findings + evidence", "Background generation"] },
  { title: "Project Organization", desc: "Group scans by project for team-level risk tracking.", icon: "▤", details: ["Create, update, archive", "Aggregate risk levels", "Finding counts per project", "Quick-scan from project"] },
  { title: "Finding Dedup", desc: "SHA-256 fingerprinting prevents duplicate findings.", icon: "#", details: ["Stable SHA-256 hashing", "Cross-scan deduplication", "Normalized evidence", "Unique audit fingerprints"] },
];

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (<motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className={className}>{children}</motion.div>);
}

export default function FeaturesPage() {
  return (
    <main className="mesh-background min-h-screen text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/35 backdrop-blur-xl">
        <div className="section-shell flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3"><Image src="/favicon.png" alt="SentinelNexus" width={36} height={36} className="rounded-xl object-cover" /><span className="font-display text-lg font-semibold">SentinelNexus</span></Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-full border border-white/20 px-4 py-2 text-sm text-gray-200 hover:border-violet-400 hover:text-white transition">Sign In</Link>
            <Link href="/signup" className="hidden sm:inline-flex rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition">Get Started</Link>
          </div>
        </div>
      </header>

      <section className="section-shell pt-16 pb-12 text-center">
        <Reveal><h1 className="font-display text-4xl font-extrabold sm:text-5xl">Platform <span className="gradient-word">Features</span></h1><p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">Everything you need to secure AI workflows — code secrets, prompt injection defense, CVSS scoring, and PDF reporting.</p></Reveal>
      </section>

      <section className="section-shell pb-20">
        <div className="grid gap-6 md:grid-cols-2">
          {features.map((f) => (
            <Reveal key={f.title}>
              <div className="glass-card glare-hover rounded-2xl p-6 h-full hover:border-violet-400/30 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-sm font-bold text-violet-200">{f.icon}</div>
                  <h3 className="text-lg font-semibold">{f.title}</h3>
                </div>
                <p className="text-sm text-gray-300 mb-4">{f.desc}</p>
                <ul className="space-y-1.5">{f.details.map((d) => (<li key={d} className="text-xs text-gray-400 flex items-start gap-2"><span className="text-violet-400 shrink-0">✓</span><span>{d}</span></li>))}</ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-shell pb-20 text-center">
        <Reveal>
          <div className="glass-card violet-glow rounded-2xl p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-3">Ready to secure your AI stack?</h2>
            <p className="text-sm text-gray-300 mb-6">Start scanning in under 60 seconds. No credit card required.</p>
            <Link href="/signup" className="rounded-full bg-violet-600 px-8 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition">Get Started Free</Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
