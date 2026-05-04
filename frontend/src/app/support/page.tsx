import { AppShell } from "../../components/AppShell";
import Link from "next/link";
import { SOCIAL_LINKS } from "../../lib/social-links";

export default function SupportPage() {
  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Support</h1>
          <p className="mt-1 text-sm text-gray-300">
            Need help with onboarding, integrations or security reviews? Reach
            out and we&apos;ll respond within one business day.
          </p>
        </div>

        <section className="glass-card space-y-3 rounded-2xl p-4 text-sm">
          <div>
            <h2 className="text-sm font-semibold">Contact</h2>
            <p className="text-xs text-gray-400">
              For production customers we provide a dedicated Slack channel and
              24/7 incident response.
            </p>
          </div>
          <ul className="space-y-1 text-sm text-gray-200">
            <li>Primary Support: ms1591934@gmail.com</li>
            <li>Escalation Desk: admin.sentinelnexus@mayankiitj.in</li>
            <li>Security Disclosure: admin.sentinelnexus@mayankiitj.in</li>
            <li>
              Founder: <Link href={SOCIAL_LINKS.portfolio} target="_blank" rel="noopener noreferrer" className="text-violet-300 underline">mayyanks.app</Link> / <Link href={SOCIAL_LINKS.website} target="_blank" rel="noopener noreferrer" className="text-violet-300 underline">mayankiitj.in</Link>
            </li>
            <li>
              Social: <Link href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="text-violet-300 underline">LinkedIn</Link> · <Link href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="text-violet-300 underline">Instagram</Link> · <Link href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" className="text-violet-300 underline">GitHub</Link>
            </li>
          </ul>
        </section>

        <section className="glass-card rounded-2xl p-4 text-sm text-gray-200">
          <h2 className="text-sm font-semibold">Support SLA</h2>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-gray-400">Critical security incidents</p>
              <p className="mt-1 font-semibold text-white">&lt; 30 min response</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-gray-400">Production support tickets</p>
              <p className="mt-1 font-semibold text-white">&lt; 4 hrs response</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-gray-400">General onboarding queries</p>
              <p className="mt-1 font-semibold text-white">1 business day</p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

