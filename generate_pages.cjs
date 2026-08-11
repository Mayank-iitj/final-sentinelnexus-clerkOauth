const fs = require('fs');
const path = require('path');

const routes = [
  { href: "/dashboard", label: "Dashboard", desc: "Real-time aggregation of active scans, risk scores, and recent findings." },
  { href: "/boardroom", label: "Boardroom", desc: "High-level metrics, ROI, and compliance posture for C-suite." },
  { href: "/trust-score", label: "Trust Score", desc: "Universal AI Trust Score™ calculation and breakdown." },
  { href: "/heatmap", label: "Risk Heatmap", desc: "Geographic and logical distribution of organizational risk." },
  { href: "/agents/marketplace", label: "Marketplace", desc: "Browse and deploy specialized autonomous security agents." },
  { href: "/agents/red-team", label: "Red Team AI", desc: "Manage continuous autonomous offensive operations." },
  { href: "/agents/blue-team", label: "Blue Team AI", desc: "Monitor autonomous defensive responses and active patching." },
  { href: "/governance", label: "AI Governance", desc: "AI usage policies, model inventory, and ethical compliance." },
  { href: "/compliance", label: "Compliance Auto", desc: "Automated mapping of findings to SOC2, ISO27001, and HIPAA." },
  { href: "/compliance/copilot", label: "Compliance Chat", desc: "Interactive AI assistant for compliance workflows." },
  { href: "/security-telemetry", label: "Security Telemetry", desc: "Live ingestion and analysis of security event streams." },
  { href: "/regulations", label: "Global Regs", desc: "Tracking global cybersecurity regulatory changes." },
  { href: "/explainability", label: "Explainability", desc: "XAI tools to understand AI model decisions." },
  { href: "/threats/zero-day", label: "Zero-Day Engine", desc: "AST-based vulnerability prediction and zero-day hunting." },
  { href: "/threats/deepfake", label: "Deepfake Detection", desc: "Media analysis and deepfake detection algorithms." },
  { href: "/threats/dark-web", label: "Dark Web Monitor", desc: "Continuous monitoring of dark web forums for leaked credentials." },
  { href: "/supply-chain", label: "Supply Chain", desc: "Third-party vendor risk and software bill of materials (SBOM)." },
  { href: "/digital-twin", label: "Digital Twin", desc: "Real-Time Organizational Digital Twin simulation." },
  { href: "/attack-graph", label: "Attack Graph", desc: "Visual node-based mapping of attack vectors." },
  { href: "/time-machine", label: "Time Machine", desc: "Historical snapshot playback of organizational security state." },
  { href: "/remediation", label: "Auto Patch", desc: "Automated vulnerability remediation and IaC updates." },
  { href: "/insurance", label: "Cyber Insurance", desc: "Automated risk quantification for cyber insurance premiums." },
  { href: "/copilot", label: "Exec Copilot", desc: "LLM chat interface for executive security briefings." },
  { href: "/scanner", label: "Scanner", desc: "Execute ad-hoc static and dynamic security scans." },
  { href: "/reports", label: "Reports", desc: "Generate and export comprehensive security reports." },
  { href: "/notifications", label: "Notifications", desc: "Alerts, webhook failures, and system notifications." },
  { href: "/subscription", label: "Billing & Plans", desc: "Manage SentinelNexus enterprise subscription." },
  { href: "/settings", label: "Settings", desc: "Manage workspace configurations, API keys, and team members." },
];

const template = (label, desc) => `"use client";
import { AppShell } from "@/components/AppShell";
import { motion } from "framer-motion";

export default function Page() {
  return (
    <AppShell>
      <div className="space-y-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">${label}</h1>
            <p className="text-sm text-gray-500 mt-1">${desc}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-xl bg-white/[0.06] text-sm text-gray-300 hover:bg-white/[0.1] transition-colors border border-white/[0.05]">
              Export Report
            </button>
            <button className="px-4 py-2 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-500 transition-colors shadow-[0_0_20px_rgba(124,58,237,.3)]">
              Refresh Data
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.02]">
              <div className="text-sm text-gray-500 mb-2">Metric {i}</div>
              <div className="text-2xl font-bold text-white">
                <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="nub-card rounded-2xl p-6 border border-white/[0.04] bg-white/[0.02] min-h-[400px] flex flex-col items-center justify-center text-center"
        >
          <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mb-4 border border-violet-500/20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-lg font-bold text-white mb-2">Initializing ${label} Engine...</h2>
          <p className="text-sm text-gray-500 max-w-md">
            The backend microservices for this module are currently booting up. In production, this section provides deep analytics and configuration for ${label}.
          </p>
        </motion.div>
      </div>
    </AppShell>
  );
}`;

const baseDir = path.join(__dirname, 'frontend/src/app');

routes.forEach(route => {
  const routePath = path.join(baseDir, route.href);
  if (!fs.existsSync(routePath)) {
    fs.mkdirSync(routePath, { recursive: true });
  }
  const filePath = path.join(routePath, 'page.tsx');
  // Skip if it exists
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, template(route.label, route.desc));
    console.log(`Created ${filePath}`);
  } else {
    console.log(`Skipped ${filePath}`);
  }
});
