"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";

const plans = [
  { tier: "Starter", price: "₹0", period: "forever", details: ["5 scans/month", "Code + Prompt + Text scanners", "Basic CVSS scoring", "Email support", "1 project"], cta: "Start Free", popular: false, checkoutUrl: "/checkout?plan=Starter" },
  { tier: "Pro", price: "₹299", period: "/month", details: ["100 scans/month", "All scan engines", "Custom scan rules", "PDF report generation", "10 projects", "Slack & webhook alerts", "Priority support"], cta: "Upgrade to Pro", popular: true, checkoutUrl: "/checkout?plan=Pro" },
  { tier: "Enterprise", price: "₹999", period: "/month", details: ["Unlimited scans", "SOC 2 evidence exports", "SSO / SAML support", "Unlimited projects", "Dedicated CSM", "SLA < 30 min (critical)", "Custom integrations"], cta: "Talk to Sales", popular: false, checkoutUrl: "/checkout?plan=Enterprise" },
];

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (<motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className={className}>{children}</motion.div>);
}

export default function PricingPage() {
  const [comingSoon, setComingSoon] = useState(false);

  return (
    <main className="mesh-background min-h-screen text-white relative">
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
        <Reveal><h1 className="font-display text-4xl font-extrabold sm:text-5xl">Simple, Transparent <span className="gradient-word">Pricing</span></h1><p className="mx-auto mt-4 max-w-xl text-lg text-gray-300">Start free. Scale as your AI security needs grow.</p></Reveal>
      </section>

      <section className="section-shell pb-20">
        <div className="grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Reveal key={plan.tier}>
              <div className={`glass-card glare-hover relative rounded-2xl p-7 h-full flex flex-col ${plan.popular ? "violet-glow border-violet-400/45" : ""}`}>
                {plan.popular && <span className="absolute -top-3 left-6 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold">Most Popular</span>}
                <h3 className="text-xl font-semibold">{plan.tier}</h3>
                <div className="mt-3"><span className="font-display text-4xl font-bold">{plan.price}</span><span className="text-sm text-gray-400 ml-1">{plan.period}</span></div>
                <ul className="mt-6 space-y-2.5 text-sm text-gray-300 flex-1">{plan.details.map((d) => (<li key={d} className="flex items-center gap-2"><span className="text-violet-300">✓</span><span>{d}</span></li>))}</ul>
                <Link href={plan.checkoutUrl} className={`w-full mt-6 inline-flex justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition ${plan.popular ? "bg-violet-600 text-white hover:bg-violet-500 hover:shadow-[0_0_30px_rgba(139,92,246,.4)]" : "border border-white/20 text-gray-200 hover:border-violet-400 hover:text-white"}`}>{plan.cta}</Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section-shell pb-16">
        <Reveal>
          <div className="glass-card rounded-2xl p-8 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-4 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4 text-sm">
              {[
                ["Can I change plans?", "Yes, upgrade or downgrade anytime. Changes take effect on your next billing cycle."],
                ["Is there a free trial for Pro?", "Yes, all new accounts get a 14-day Pro trial. No credit card needed."],
                ["What payment methods do you accept?", "We accept all major credit cards via Stripe. Enterprise customers can pay by invoice."],
                ["Do you offer annual billing?", "Yes, annual plans receive a 20% discount. Contact sales for details."],
              ].map(([q, a]) => (
                <div key={q} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <h3 className="font-semibold text-white">{q}</h3>
                  <p className="mt-1 text-gray-400">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <AnimatePresence>
        {comingSoon && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
          >
            <div className="relative overflow-hidden rounded-full border border-violet-500/40 bg-black/90 px-8 py-4 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.4)]">
              <motion.div
                animate={{ x: ["-200%", "200%"] }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-1/2 skew-x-12"
              />
              <div className="flex items-center gap-3 relative z-10">
                <motion.span 
                  animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }} 
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-xl"
                >✨</motion.span>
                <span className="font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-300 bg-[length:200%_auto] animate-[pulse_2s_ease-in-out_infinite]">
                  Rolling out soon , Stay Tuned
                </span>
                <motion.span 
                  animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] }} 
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                  className="text-xl"
                >✨</motion.span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
