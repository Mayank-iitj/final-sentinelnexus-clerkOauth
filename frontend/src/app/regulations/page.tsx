"use client";
import { useState } from "react";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function RegulationsPage() {
  const [isMapping, setIsMapping] = useState(false);
  const [regs, setRegs] = useState([
    { name: "EU AI Act", region: "European Union", date: "August 2026", impact: "High" },
    { name: "DORA", region: "European Union", date: "January 2025", impact: "Medium" }
  ]);

  const handleMap = async () => {
    setIsMapping(true);
    await new Promise(r => setTimeout(r, 2000));
    setRegs([
      { name: "CPRA (CCPA 2.0)", region: "California, USA", date: "Active", impact: "Critical" },
      ...regs
    ]);
    setIsMapping(false);
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
              <span className="text-violet-500">⚖</span> Global Regulations
            </h1>
            <p className="text-sm text-gray-500 mt-1">Track geopolitical cyber regulations (GDPR, CCPA, EU AI Act).</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={handleMap}
            disabled={isMapping}
            className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50"
          >
            {isMapping ? "Correlating Regions..." : "Map My Infra"}
          </motion.button>
        </motion.div>
        
        
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Active Mandates</div>
            <div className="text-3xl font-bold tracking-tight text-white mt-1">{6 + regs.length}</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Pending Legislation</div>
            <div className="text-3xl font-bold tracking-tight text-amber-400 mt-1">3</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Violations</div>
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
                  <th className="pb-3 font-medium">Regulation</th>
                  <th className="pb-3 font-medium">Region</th>
                  <th className="pb-3 font-medium">Effective Date</th>
                  <th className="pb-3 font-medium">Impact Level</th>

                </tr>
              </thead>
              <tbody className="text-sm">
                {regs.map((r, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 border-b border-white/[0.02] font-semibold">{r.name}</td>
                    <td className="py-3 border-b border-white/[0.02] text-gray-400">{r.region}</td>
                    <td className="py-3 border-b border-white/[0.02] font-mono">{r.date}</td>
                    <td className="py-3 border-b border-white/[0.02]">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        r.impact === 'Critical' ? 'bg-purple-500/20 text-purple-400' :
                        r.impact === 'High' ? 'bg-red-500/20 text-red-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {r.impact}
                      </span>
                    </td>
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
