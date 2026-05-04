import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Documentation", description: "SentinelNexus API and platform documentation." };

const sections = [
  { title: "Getting Started", items: [
    { name: "Quick Start Guide", desc: "Set up your first scan in under 2 minutes.", href: "#quickstart" },
    { name: "Authentication", desc: "Google OAuth flow and session management.", href: "#auth" },
    { name: "API Overview", desc: "RESTful API endpoints and authentication.", href: "#api" },
  ]},
  { title: "Scan Engines", items: [
    { name: "Code Scanner", desc: "120+ SAST rules for secrets, injections, and IaC.", href: "#code" },
    { name: "Prompt Scanner", desc: "Jailbreak detection and prompt injection defense.", href: "#prompt" },
    { name: "Text Scanner", desc: "PII detection with Luhn validation and IBAN checks.", href: "#text" },
  ]},
  { title: "API Reference", items: [
    { name: "POST /api/v1/scans", desc: "Run a new security scan.", href: "#scans-create" },
    { name: "GET /api/v1/scans/:id", desc: "Retrieve scan results and findings.", href: "#scans-get" },
    { name: "GET /api/v1/dashboard/stats", desc: "Dashboard aggregation data.", href: "#dashboard" },
    { name: "POST /api/v1/reports/generate/:id", desc: "Generate a PDF report.", href: "#reports" },
    { name: "GET /api/v1/projects", desc: "List and manage projects.", href: "#projects" },
    { name: "GET /api/v1/notifications", desc: "List alert notifications.", href: "#notifications" },
  ]},
  { title: "Security", items: [
    { name: "CVSS v3.1 Scoring", desc: "How we calculate base scores and severity labels.", href: "#cvss" },
    { name: "Finding Deduplication", desc: "SHA-256 fingerprinting for duplicate detection.", href: "#dedup" },
    { name: "CWE Mappings", desc: "Common Weakness Enumeration identifiers.", href: "#cwe" },
  ]},
];

export default function DocsPage() {
  return (
    <main className="mesh-background min-h-screen text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/35 backdrop-blur-xl">
        <div className="section-shell flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3"><div className="glass-card flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold">SN</div><span className="font-display text-lg font-semibold">SentinelNexus</span></Link>
          <Link href="/login" className="rounded-full border border-white/20 px-4 py-2 text-sm text-gray-200 hover:border-violet-400 hover:text-white transition">Sign In</Link>
        </div>
      </header>

      <div className="section-shell py-12">
        <h1 className="font-display text-4xl font-extrabold mb-2">Documentation</h1>
        <p className="text-gray-400 mb-10">Complete reference for the SentinelNexus API and platform capabilities.</p>

        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="text-xl font-bold mb-4 text-violet-300">{s.title}</h2>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {s.items.map((item) => (
                  <div key={item.name} className="glass-card glare-hover rounded-xl p-4 hover:border-violet-400/30 transition-colors">
                    <h3 className="text-sm font-semibold text-white">{item.name}</h3>
                    <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section id="quickstart" className="mt-16 glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Quick Start</h2>
          <div className="space-y-4 text-sm text-gray-300">
            <p>1. Sign in with your Google account at <code className="text-violet-300">/login</code></p>
            <p>2. Navigate to the <strong>Scanner</strong> page</p>
            <p>3. Paste code, a prompt, or plain text and select the scan type</p>
            <p>4. Click <strong>Run Scan</strong> — results appear in seconds with CVSS scores</p>
            <p>5. Generate a PDF report from the results or view findings in the scan detail page</p>
          </div>
        </section>

        <section id="api" className="mt-10 glass-card rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">API Authentication</h2>
          <div className="text-sm text-gray-300 space-y-3">
            <p>All API requests require authentication via <code className="text-violet-300">access_token</code> cookie (set during OAuth flow).</p>
            <pre className="bg-black/40 rounded-lg p-4 text-xs font-mono overflow-x-auto">
{`# Example: Run a scan
curl -X POST http://localhost:8000/api/v1/scans \\
  -H "Content-Type: application/json" \\
  -b "access_token=YOUR_JWT" \\
  -d '{"target": "test", "content": "password = secret123", "scan_type": "code"}'`}
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}
