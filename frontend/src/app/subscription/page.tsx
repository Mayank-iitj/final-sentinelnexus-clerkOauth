"use client";
import { useEffect, useState } from "react";
import { AppShell } from "../../components/AppShell";
import { getCurrentUser, UserProfile } from "../../lib/api";
import Link from "next/link";
import { motion } from "framer-motion";

const plans = [
  { tier: "Starter", price: "$0", period: "forever", details: ["5 scans/month", "Code + Prompt + Text scanners", "1 project"], checkoutUrl: "/checkout?plan=Starter" },
  { tier: "Pro", price: "$299", period: "/month", details: ["100 scans/month", "All scan engines", "PDF report generation", "10 projects"], checkoutUrl: "/checkout?plan=Pro" },
  { tier: "Enterprise", price: "$999", period: "/month", details: ["Unlimited scans", "SOC 2 evidence exports", "Unlimited projects", "Dedicated CSM"], checkoutUrl: "/checkout?plan=Enterprise" },
];

export default function SubscriptionPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
        </div>
      </AppShell>
    );
  }

  const activeTier = profile?.subscription_tier || "Starter";

  return (
    <AppShell>
      <div className="space-y-6 pb-12 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold">Billing & Subscription</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your SentinelNexus AI Security plan.</p>
        </motion.div>

        {/* Current Active Plan */}
        <section className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[80px] pointer-events-none rounded-full" />
          <div className="relative z-10">
            <h2 className="text-sm font-semibold text-violet-300 uppercase tracking-wider mb-2">Current Active Plan</h2>
            <div className="text-4xl font-display font-bold text-white flex items-baseline gap-2">
              {activeTier}
            </div>
            <p className="text-sm text-gray-400 mt-2 max-w-md">
              You are currently on the {activeTier} plan. Usage limits are strictly enforced by the backend risk engine.
            </p>
          </div>
          <div className="relative z-10 flex gap-4 w-full md:w-auto">
            {activeTier === "Starter" && (
              <Link href="/checkout?plan=Pro" className="btn-primary !px-8 !py-3 w-full md:w-auto text-center font-semibold shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)]">
                Upgrade to Pro
              </Link>
            )}
            {activeTier === "Pro" && (
              <Link href="/checkout?plan=Enterprise" className="btn-primary !px-8 !py-3 w-full md:w-auto text-center font-semibold">
                Upgrade to Enterprise
              </Link>
            )}
            {activeTier === "Enterprise" && (
              <button disabled className="btn-primary !px-8 !py-3 w-full md:w-auto text-center font-semibold opacity-50 cursor-not-allowed">
                Max Tier Active
              </button>
            )}
          </div>
        </section>

        {/* Available Plans */}
        <div>
          <h3 className="text-lg font-bold mb-4 mt-8">Available Plans</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const isActive = plan.tier === activeTier;
              return (
                <div key={plan.tier} className={`rounded-2xl border ${isActive ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.15)]' : 'border-white/10 bg-black/40'} p-6 flex flex-col h-full relative`}>
                  {isActive && <div className="absolute -top-3 left-6 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">Active Plan</div>}
                  <h4 className="text-xl font-semibold text-white mb-2">{plan.tier}</h4>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-bold text-white">{plan.price}</span>
                    <span className="text-sm text-gray-400">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-violet-400 mt-0.5">✓</span>
                        {detail}
                      </li>
                    ))}
                  </ul>
                  {!isActive && (
                    <Link href={plan.checkoutUrl} className="w-full text-center py-2.5 rounded-full border border-white/20 text-sm font-medium hover:bg-white/10 transition-colors">
                      Switch to {plan.tier}
                    </Link>
                  )}
                  {isActive && (
                    <div className="w-full text-center py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-gray-400 cursor-default">
                      Current Plan
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
