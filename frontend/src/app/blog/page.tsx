import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Blog", description: "Insights on AI security, compliance, and threat intelligence." };

const posts = [
  { title: "Announcing Automated Billing & Subscription Dashboards", date: "2026-08-08", category: "Product", excerpt: "We're excited to launch fully automated subscriptions via PayU. You can now manage your tier, upgrade to Pro, and track your risk engine limits directly from the new Subscription Dashboard.", readTime: "4 min" },
  { title: "How CVSS v3.1 Scoring Works for AI Security Findings", date: "2026-04-28", category: "Engineering", excerpt: "A deep dive into how SentinelNexus implements IEEE-precise CVSS v3.1 base scoring for every finding, including attack vector analysis and scope change calculations.", readTime: "8 min" },
  { title: "Prompt Injection: The #1 AI Security Threat in 2026", date: "2026-04-15", category: "Threat Intel", excerpt: "We analyzed 10,000+ prompt injection attempts across our platform. Here's what we found about DAN-style jailbreaks, system prompt leakage, and multi-turn attack chains.", readTime: "12 min" },
  { title: "Building a Production-Grade OAuth Flow with FastAPI", date: "2026-04-01", category: "Engineering", excerpt: "How we built secure Google OAuth with httpOnly JWT cookies, refresh token rotation via Redis, and a NextAuth session bridge for seamless frontend auth.", readTime: "10 min" },
  { title: "Secrets in Code: Why Static Analysis Still Matters", date: "2026-03-20", category: "Security", excerpt: "Despite Secret Manager adoption, 73% of repos we scan still contain at least one hardcoded credential. Here's how our 120+ SAST rules catch them.", readTime: "6 min" },
  { title: "GDPR and the AI Act: What Developers Need to Know", date: "2026-03-10", category: "Compliance", excerpt: "A practical guide to meeting GDPR and EU AI Act requirements when building LLM-powered applications, with SentinelNexus evidence trail examples.", readTime: "9 min" },
  { title: "Deduplicating Security Findings at Scale", date: "2026-02-28", category: "Engineering", excerpt: "How we use SHA-256 fingerprinting with normalized evidence to prevent phantom duplicates across thousands of scans.", readTime: "5 min" },
];

const categories = ["All", "Engineering", "Security", "Threat Intel", "Compliance"];

export default function BlogPage() {
  return (
    <main className="mesh-background min-h-screen text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/35 backdrop-blur-xl">
        <div className="section-shell flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3"><Image src="/favicon.png" alt="SentinelNexus" width={36} height={36} className="rounded-xl object-cover" /><span className="font-display text-lg font-semibold">SentinelNexus</span></Link>
          <Link href="/login" className="rounded-full border border-white/20 px-4 py-2 text-sm text-gray-200 hover:border-violet-400 hover:text-white transition">Sign In</Link>
        </div>
      </header>

      <div className="section-shell py-12">
        <h1 className="font-display text-4xl font-extrabold mb-2">Blog</h1>
        <p className="text-gray-400 mb-8">Insights on AI security, compliance, and threat intelligence from the SentinelNexus team.</p>

        <div className="flex gap-2 mb-8 flex-wrap">
          {categories.map((c) => (
            <button key={c} className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${c === "All" ? "bg-violet-500/20 border-violet-400/40 text-violet-200" : "border-white/10 text-gray-400 hover:border-violet-400/30 hover:text-white"}`}>{c}</button>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.title} className="glass-card glare-hover rounded-2xl p-5 flex flex-col hover:border-violet-400/30 transition-colors">
              <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-3">
                <span className="px-2 py-0.5 rounded-full border border-violet-400/30 bg-violet-500/10 text-violet-300">{post.category}</span>
                <span>{post.date}</span>
                <span>· {post.readTime}</span>
              </div>
              <h2 className="text-base font-semibold text-white mb-2 line-clamp-2">{post.title}</h2>
              <p className="text-xs text-gray-400 flex-1 line-clamp-3">{post.excerpt}</p>
              <div className="mt-4"><span className="text-xs text-violet-400 hover:underline cursor-pointer">Read more →</span></div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
