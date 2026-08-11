"use client";
import { useState } from "react";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function CompliancePage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [controls, setControls] = useState([
    { id: "CC6.1", fw: "SOC2", status: "Passed", time: "1 hr ago" },
    { id: "A.9.2.1", fw: "ISO27001", status: "Failing (MFA missing on 1 user)", time: "2 hrs ago" }
  ]);

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 2500));
    setControls([
      { id: "HIPAA-164.312", fw: "HIPAA", status: "Passed", time: "Just now" },
      { id: "A.9.2.1", fw: "ISO27001", status: "Passed (MFA Remedied)", time: "Just now" },
      ...controls.filter(c => c.id !== "A.9.2.1")
    ]);
    setIsSyncing(false);
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
              <span className="text-violet-500">✓</span> Compliance Automation
            </h1>
            <p className="text-sm text-gray-500 mt-1">Automated evidence collection for SOC2, ISO27001, and HIPAA.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={handleSync}
            disabled={isSyncing}
            className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50"
          >
            {isSyncing ? "Running CSPM Scan..." : "Sync Cloud Infra"}
          </motion.button>
        </motion.div>
        
        
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">SOC 2 Type II</div>
            <div className="text-3xl font-bold tracking-tight text-emerald-400 mt-1">98%</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">ISO 27001</div>
            <div className="text-3xl font-bold tracking-tight text-amber-400 mt-1">85%</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Open Controls</div>
            <div className="text-3xl font-bold tracking-tight text-red-400 mt-1">
              {controls.some(c => c.status.includes('Failing')) ? "4" : "0"}
            </div>
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
                  <th className="pb-3 font-medium">Control ID</th>
                  <th className="pb-3 font-medium">Framework</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Last Tested</th>

                </tr>
              </thead>
              <tbody className="text-sm">
                {controls.map((c, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 border-b border-white/[0.02]">{c.id}</td>
                    <td className="py-3 border-b border-white/[0.02] text-gray-400">{c.fw}</td>
                    <td className="py-3 border-b border-white/[0.02]">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${c.status.includes('Passed') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 border-b border-white/[0.02] font-mono text-gray-400">{c.time}</td>
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
