import Link from "next/link";
import type { Metadata } from "next";
import { AppShell } from "../../components/AppShell";
import { SOCIAL_LINKS } from "../../lib/social-links";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about SentinelNexus mission, AI security approach, and platform capabilities for production teams.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  return (
    <AppShell>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">About SentinelNexus</h1>
          <p className="mt-1 text-sm text-gray-300">
            SentinelNexus is an AI‑security and compliance platform designed to
            help teams ship LLM‑powered products safely, with a clear audit
            trail for regulators and customers.
          </p>
        </div>

        <section className="glass-card space-y-3 rounded-2xl p-5 text-sm text-gray-200">
          <h2 className="text-base font-semibold text-white">Our Mission</h2>
          <p>
            We are building default-safe AI operations for teams that cannot
            compromise on trust. Every scan, alert, and remediation path is
            designed to keep security, compliance, and engineering velocity in
            balance.
          </p>
        </section>

        <section className="glass-card space-y-3 rounded-2xl p-5 text-sm text-gray-200">
          <h2 className="text-base font-semibold text-white">What We Deliver</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold text-white">Runtime Prompt Defense</h3>
              <p className="mt-1 text-xs text-gray-300">Detect injection attempts and policy bypass patterns before they propagate.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold text-white">Code + Config Scanning</h3>
              <p className="mt-1 text-xs text-gray-300">Catch secret leakage, risky defaults, and sensitive data exposure early.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold text-white">Audit-Ready Evidence</h3>
              <p className="mt-1 text-xs text-gray-300">Generate traceable events and control mappings for governance reviews.</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <h3 className="font-semibold text-white">Continuous Monitoring</h3>
              <p className="mt-1 text-xs text-gray-300">Track risk posture changes across prompts, models, and deployment channels.</p>
            </div>
          </div>
        </section>

        <section className="glass-card space-y-3 rounded-2xl p-5 text-sm text-gray-200">
          <h2 className="text-base font-semibold text-white">Why Teams Choose Us</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Enterprise-grade Authentication via Clerk with seamless integration and session management.</li>
            <li>Production-aware controls and strict environment validation.</li>
            <li>Production-grade scanning with immediate scan results and PDF reporting.</li>
            <li>Clear remediation guidance instead of raw noisy alerts.</li>
          </ul>
        </section>

        <section className="glass-card space-y-3 rounded-2xl p-5 text-sm text-gray-200">
          <h2 className="text-base font-semibold text-white">Built by Founder</h2>
          <p>
            We combine static and dynamic analysis, prompt‑injection heuristics
            and PII detection to provide a unified risk score for every AI
            interaction in your stack.
          </p>
          <p>
            The platform is built and maintained by{" "}
            <Link
              href={SOCIAL_LINKS.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-300 underline"
            >
              Mayank Sharma
            </Link>{" "}
            (
            <Link
              href={SOCIAL_LINKS.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-300 underline"
            >
              mayankiitj.in
            </Link>
            ), a security‑focused engineer building AI‑native infrastructure for
            enterprises.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/signup" className="rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500">
              Get Started Free
            </Link>
            <Link href="/features" className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-gray-200 hover:border-violet-400 hover:text-white">
              View All Features
            </Link>
          </div>
        </section>
        <section className="glass-card space-y-3 rounded-2xl p-5 text-sm text-gray-200">
          <h2 className="text-base font-semibold text-white">Verification Details</h2>
          <p>
            <strong>Registered Name:</strong> Mayank Sharma
          </p>
          <p>
            <strong>Registered Address:</strong> Jhabua , MP , India
          </p>
        </section>
      </div>
    </AppShell>
  );
}

