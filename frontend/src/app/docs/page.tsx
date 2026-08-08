"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "../../components/AppShell";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://sentinelnexus-backend.onrender.com/api/v1";

const endpoints = [
  {
    category: "Authentication & Identity",
    items: [
      {
        method: "WEBHOOK",
        path: "/auth/clerk/webhook",
        desc: "Clerk User Sync Webhook. Hardened with Svix signature verification. Automatically synchronizes user creation, updates, and deletion events from Clerk to the SentinelNexus database.",
        auth: "Public (Svix Header Required)",
      },
      {
        method: "GET",
        path: "/users/me",
        desc: "Retrieve current authenticated user profile and session data.",
        auth: "Clerk JWT",
      },
    ],
  },
  {
    category: "Scanning Engine",
    items: [
      {
        method: "POST",
        path: "/scans",
        desc: "Initialize a new security scan. Supports 'code', 'prompt', and 'text' types.",
        payload: '{ "content": "...", "scan_type": "code", "project_id": "..." }',
        auth: "Clerk JWT",
      },
      {
        method: "GET",
        path: "/scans/:id",
        desc: "Get detailed results, CVSS scores, and findings for a specific scan.",
        auth: "Clerk JWT",
      },
    ],
  },
  {
    category: "Project Management",
    items: [
      {
        method: "GET",
        path: "/projects",
        desc: "List all active security projects for the current workspace.",
        auth: "Clerk JWT",
      },
      {
        method: "POST",
        path: "/projects",
        desc: "Create a new project container for grouped vulnerability tracking.",
        payload: '{ "name": "API v2", "description": "..." }',
        auth: "Clerk JWT",
      },
    ],
  },
  {
    category: "Reports & Intelligence",
    items: [
      {
        method: "POST",
        path: "/reports/generate/:scan_id",
        desc: "Generate a comprehensive PDF security report with CWE mappings.",
        auth: "Clerk JWT",
      },
      {
        method: "GET",
        path: "/dashboard/stats",
        desc: "Aggregation data for risk heatmaps and severity distribution.",
        auth: "Clerk JWT",
      },
    ],
  },
  {
    category: "Trust & Digital Twin",
    items: [
      {
        method: "GET",
        path: "/trust/score",
        desc: "Calculate and return the dynamic Trust Score for the organization based on active threats and posture.",
        auth: "Clerk JWT",
      },
      {
        method: "GET",
        path: "/trust/digital-twin",
        desc: "Generate the organizational Digital Twin attack graph for real-time risk visualization.",
        auth: "Clerk JWT",
      },
      {
        method: "GET",
        path: "/trust/certificate",
        desc: "Retrieve a verified, shareable Trust Certificate reflecting the current security score.",
        auth: "Clerk JWT",
      },
    ],
  },
  {
    category: "Threat Intelligence & Zero-Day",
    items: [
      {
        method: "GET",
        path: "/threats/predictions",
        desc: "Predict and fetch novel zero-day adversarial attacks (e.g., prompt injections) and their mitigation strategies.",
        auth: "Clerk JWT",
      },
      {
        method: "GET",
        path: "/threats/dark-web",
        desc: "Monitor and retrieve organization-specific Dark Web mentions and data leaks.",
        auth: "Clerk JWT",
      },
    ],
  },
  {
    category: "AI Governance & Auditing",
    items: [
      {
        method: "POST",
        path: "/governance/assets",
        desc: "Register a new AI asset (e.g., LLM model, dataset) into the centralized governance inventory.",
        payload: '{ "name": "Prod GPT-4", "asset_type": "LLM", "provider": "OpenAI" }',
        auth: "Clerk JWT",
      },
      {
        method: "GET",
        path: "/governance/audit-trail",
        desc: "Retrieve the immutable audit trail of all actions performed on AI assets.",
        auth: "Clerk JWT",
      },
    ],
  },
  {
    category: "Billing & Subscriptions",
    items: [
      {
        method: "GET",
        path: "/users/me",
        desc: "Retrieve current authenticated user profile, including their active subscription_tier (e.g., Starter, Pro, Enterprise).",
        auth: "Clerk JWT",
      },
      {
        method: "POST",
        path: "/payments/payu/success",
        desc: "Webhook handler for PayU payment success. Securely verifies the transaction hash and automatically upgrades the user's subscription tier.",
        payload: "application/x-www-form-urlencoded",
        auth: "Public (PayU Hash Required)",
      },
    ],
  },
];

export default function ApiDocsPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <AppShell>
      <div className="max-w-4xl pb-20">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            API Reference
          </h1>
          <p className="mt-4 text-gray-400 text-lg max-w-2xl">
            Integrate SentinelNexus security intelligence directly into your CI/CD pipelines and developer workflows.
          </p>
        </div>

        {/* Base URL Card */}
        <div className="mb-10 p-6 rounded-3xl bg-violet-600/5 border border-violet-500/20 backdrop-blur-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-24 h-24 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-violet-300 uppercase tracking-wider mb-2">Production Base URL</h2>
          <div className="flex items-center gap-3">
            <code className="text-lg sm:text-xl font-mono text-white break-all">{BASE_URL}</code>
            <button 
              onClick={() => copyToClipboard(BASE_URL)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              {copied === BASE_URL ? (
                <span className="text-xs text-emerald-400 font-medium">Copied!</span>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Auth Info */}
        <div className="mb-16 grid gap-6 md:grid-cols-2">
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
              Authentication
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              All endpoints except webhooks require a Bearer JWT token from Clerk. 
              In the browser, this is handled automatically via session cookies.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Rate Limiting
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Standard tier allows 100 requests per minute per user. 
              Enterprise users can request higher limits via support.
            </p>
          </div>
        </div>

        {/* Endpoints */}
        <div className="space-y-16">
          {endpoints.map((cat) => (
            <div key={cat.category}>
              <h2 className="text-lg font-bold text-white mb-6 border-l-2 border-violet-500 pl-4">
                {cat.category}
              </h2>
              <div className="space-y-4">
                {cat.items.map((item) => (
                  <div key={item.path} className="group p-5 rounded-2xl bg-black/40 border border-white/[0.06] hover:border-violet-500/30 transition-all duration-300">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        item.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        item.method === 'POST' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                        item.method === 'WEBHOOK' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}>
                        {item.method}
                      </span>
                      <code className="text-sm font-mono text-white/90">{item.path}</code>
                      <span className="ml-auto text-[10px] text-gray-500 font-medium uppercase tracking-tighter">
                        Auth: {item.auth}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-4">{item.desc}</p>
                    
                    {item.payload && (
                      <div className="relative">
                        <pre className="p-3 rounded-xl bg-black/60 text-[11px] font-mono text-violet-300/80 overflow-x-auto border border-white/[0.03]">
                          {item.payload}
                        </pre>
                        <button 
                          onClick={() => copyToClipboard(item.payload!)}
                          className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded-md"
                        >
                          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-20 p-8 rounded-3xl bg-gradient-to-br from-violet-600/10 to-transparent border border-violet-500/10 text-center">
          <h3 className="text-white font-bold mb-2">Need a custom integration?</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
            Our engineering team can help you build custom security scanners for proprietary codebases or specific compliance requirements.
          </p>
          <Link 
            href="/support"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-violet-600 text-white text-sm font-semibold hover:bg-violet-500 transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)]"
          >
            Contact Integration Team
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
