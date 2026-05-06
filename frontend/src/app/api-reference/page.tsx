"use client";

import { useState } from "react";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://sentinelnexus-backend.onrender.com/api/v1";

const endpoints = [
  {
    category: "Connectivity",
    items: [
      { method: "GET", path: "/health", desc: "System health check and dependency status.", auth: "Public" },
      { method: "GET", path: "/v1/users/me", desc: "Identity and session metadata.", auth: "Clerk JWT" },
    ],
  },
  {
    category: "Scans",
    items: [
      { method: "POST", path: "/v1/scans", desc: "Initiate security scan (SAST/Prompt/PII).", auth: "Clerk JWT" },
      { method: "GET", path: "/v1/scans/:id", desc: "Fetch scan findings and CVSS vectors.", auth: "Clerk JWT" },
    ],
  },
  {
    category: "Intelligence",
    items: [
      { method: "GET", path: "/v1/dashboard/stats", desc: "Risk aggregation and severity trends.", auth: "Clerk JWT" },
      { method: "POST", path: "/v1/reports/generate/:id", desc: "Export findings as PDF reports.", auth: "Clerk JWT" },
    ],
  },
];

export default function ApiReferencePage() {
  return (
    <main className="mesh-background min-h-screen text-white pt-24 pb-20">
      <div className="section-shell max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>

        <h1 className="text-4xl font-extrabold text-white mb-4">API Reference</h1>
        <p className="text-gray-400 mb-10">Production endpoints for the SentinelNexus Security Engine.</p>

        <div className="p-6 rounded-3xl bg-violet-600/5 border border-violet-500/20 mb-12">
          <h2 className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-2">Base URL</h2>
          <code className="text-lg font-mono text-white break-all">{BASE_URL}</code>
        </div>

        <div className="space-y-12">
          {endpoints.map((cat) => (
            <div key={cat.category}>
              <h3 className="text-white font-bold mb-4">{cat.category}</h3>
              <div className="grid gap-4">
                {cat.items.map((item) => (
                  <div key={item.path} className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-violet-500/10 text-violet-400'}`}>
                        {item.method}
                      </span>
                      <code className="text-sm font-mono text-white/80">{item.path}</code>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">{item.auth}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
