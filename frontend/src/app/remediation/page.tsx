"use client";
import { useState } from "react";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function RemediationPage() {
  const [isApproving, setIsApproving] = useState(false);
  const [patches, setPatches] = useState([
    { repo: "backend-api", vuln: "Path Traversal in /files", status: "Awaiting Approval", diff: "+12 lines, -2 lines" },
    { repo: "frontend-app", vuln: "XSS in Dashboard", status: "Applied", diff: "+5 lines, -1 line" }
  ]);

  const handleApprove = async () => {
    setIsApproving(true);
    await new Promise(r => setTimeout(r, 2000));
    setPatches(patches.map(p => p.status === "Awaiting Approval" ? { ...p, status: "Applied" } : p));
    setIsApproving(false);
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-violet-500">🔧</span> Auto Patch & Remediation
            </h1>
            <p className="text-sm text-gray-500 mt-1">Automatically generate and deploy code patches for detected vulnerabilities.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={handleApprove}
            disabled={isApproving || patches.every(p => p.status !== "Awaiting Approval")}
            className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50"
          >
            {isApproving ? "Merging PRs..." : "Approve All Patches"}
          </motion.button>
        </motion.div>
        
        
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Pending Patches</div>
            <div className="text-3xl font-bold tracking-tight text-amber-400 mt-1">
              {patches.filter(p => p.status === "Awaiting Approval").length}
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Successfully Applied</div>
            <div className="text-3xl font-bold tracking-tight text-emerald-400 mt-1">
              {14 + patches.filter(p => p.status === "Applied").length}
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Rollbacks</div>
            <div className="text-3xl font-bold tracking-tight text-emerald-400 mt-1">0</div>
          </motion.div>
        </motion.div>


        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01] mt-6 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-xs text-gray-500">
                  <th className="pb-3 font-medium">Repository</th>
                  <th className="pb-3 font-medium">Vulnerability</th>
                  <th className="pb-3 font-medium">Patch Status</th>
                  <th className="pb-3 font-medium">Diff Size</th>

                </tr>
              </thead>
              <tbody className="text-sm">
                {patches.map((p, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 border-b border-white/[0.02] font-semibold">{p.repo}</td>
                    <td className="py-3 border-b border-white/[0.02] text-gray-400">{p.vuln}</td>
                    <td className="py-3 border-b border-white/[0.02]">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'Applied' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 border-b border-white/[0.02] font-mono text-gray-400">{p.diff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
