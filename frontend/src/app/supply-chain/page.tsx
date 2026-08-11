"use client";
import { useState } from "react";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function SupplyChainPage() {
  const [isAuditing, setIsAuditing] = useState(false);
  const [deps, setDeps] = useState([
    { vendor: "Stripe API", type: "Third-Party API", risk: "Low Risk (98/100)", finding: "Clean" },
    { vendor: "npm: lodash-utils", type: "Dependency", risk: "High Risk (40/100)", finding: "Unpatched RCE vulnerability" }
  ]);

  const handleAudit = async () => {
    setIsAuditing(true);
    await new Promise(r => setTimeout(r, 2000));
    setDeps([
      { vendor: "pip: requests-lib", type: "Dependency", risk: "Medium Risk (72/100)", finding: "Outdated version" },
      ...deps
    ]);
    setIsAuditing(false);
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
              <span className="text-violet-500">🔗</span> Supply Chain Risk
            </h1>
            <p className="text-sm text-gray-500 mt-1">Visualize risks spanning your dependencies, vendors, and third-party APIs.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={handleAudit}
            disabled={isAuditing}
            className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50"
          >
            {isAuditing ? "Scanning SBOMs..." : "Audit Dependencies"}
          </motion.button>
        </motion.div>
        
        
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Monitored Vendors</div>
            <div className="text-3xl font-bold tracking-tight text-white mt-1">42</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">High Risk Dependencies</div>
            <div className="text-3xl font-bold tracking-tight text-red-400 mt-1">3</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Overall Supply Health</div>
            <div className="text-3xl font-bold tracking-tight text-emerald-400 mt-1">B+</div>
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
                  <th className="pb-3 font-medium">Vendor / Package</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Risk Score</th>
                  <th className="pb-3 font-medium">Latest Finding</th>

                </tr>
              </thead>
              <tbody className="text-sm">
                {deps.map((d, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 border-b border-white/[0.02] font-semibold">{d.vendor}</td>
                    <td className="py-3 border-b border-white/[0.02] text-gray-400">{d.type}</td>
                    <td className="py-3 border-b border-white/[0.02] font-bold text-gray-300">{d.risk}</td>
                    <td className="py-3 border-b border-white/[0.02]">{d.finding}</td>
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
