import Link from "next/link";
import { SOCIAL_LINKS } from "../../lib/social-links";

export default function ContactPage() {
  return (
    <main className="mesh-background min-h-screen px-4 py-10 text-white md:px-8">
      <section className="glass-card mx-auto max-w-3xl rounded-2xl p-6">
        <h1 className="font-display text-3xl font-bold">Contact</h1>
        <p className="mt-2 text-sm text-gray-300">Need sales, support, or security help? We reply within one business day.</p>
        <div className="mt-6 grid gap-3 text-sm text-gray-200">
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">Sales: ms1591934@gmail.com</div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">Support: ms1591934@gmail.com</div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">Security: admin.sentinelnexus@mayankiitj.in</div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            Founder: <Link href={SOCIAL_LINKS.portfolio} target="_blank" rel="noopener noreferrer" className="text-violet-300 underline">mayyanks.app</Link> | <Link href={SOCIAL_LINKS.website} target="_blank" rel="noopener noreferrer" className="text-violet-300 underline">mayankiitj.in</Link>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
            Social: <Link href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" className="text-violet-300 underline">LinkedIn</Link> · <Link href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="text-violet-300 underline">Instagram</Link> · <Link href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" className="text-violet-300 underline">GitHub</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
