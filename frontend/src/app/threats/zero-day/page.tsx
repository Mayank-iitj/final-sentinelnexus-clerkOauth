"use client";
import { useState } from "react";
import { AppShell } from "../../../components/AppShell";
import { motion } from "framer-motion";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function ZeroDayPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [intel, setIntel] = useState([
    { id: "CVE-2026-XYZ1", severity: "Critical 9.8", component: "Nginx Ingress Controller", status: "Mitigated (WAF Block)" },
    { id: "Zero-Day-AI-102", severity: "High 8.2", component: "LangChain Core", status: "Patch Pending" }
  ]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(res => setTimeout(res, 1200));
    setIntel([
      { id: `Zero-Day-OS-${Math.floor(Math.random() * 900) + 100}`, severity: "Critical 9.9", component: "Linux Kernel", status: "Analyzing..." },
      ...intel
    ]);
    setIsRefreshing(false);
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
              <span className="text-violet-500">⚡</span> Zero-Day Engine
            </h1>
            <p className="text-sm text-gray-500 mt-1">Real-time AI analysis of unknown vulnerabilities and zero-day exploits.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50"
          >
            {isRefreshing ? "Fetching Intel..." : "Refresh Intel Feed"}
          </motion.button>
        </motion.div>
        
        
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Tracked Zero-Days</div>
            <div className="text-3xl font-bold tracking-tight text-red-400 mt-1">{3 + intel.length}</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Vulnerable Assets</div>
            <div className="text-3xl font-bold tracking-tight text-emerald-400 mt-1">0</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Auto-Mitigations Applied</div>
            <div className="text-3xl font-bold tracking-tight text-violet-400 mt-1">12</div>
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
                  <th className="pb-3 font-medium">CVE / ID</th>
                  <th className="pb-3 font-medium">Severity</th>
                  <th className="pb-3 font-medium">Affected Component</th>
                  <th className="pb-3 font-medium">Mitigation Status</th>

                </tr>
              </thead>
              <tbody className="text-sm">
                {intel.map(item => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 border-b border-white/[0.02]">{item.id}</td>
                    <td className="py-3 border-b border-white/[0.02]">{item.severity}</td>
                    <td className="py-3 border-b border-white/[0.02]">{item.component}</td>
                    <td className="py-3 border-b border-white/[0.02]">{item.status}</td>
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
