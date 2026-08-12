"use client";
import { useState } from "react";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function InsurancePage() {
  const [isRequesting, setIsRequesting] = useState(false);
  const [quotes, setQuotes] = useState([
    { carrier: "Sentinel Insure", tier: "Enterprise ₹5M", deductible: "₹25k", status: "Active" },
    { carrier: "CyberGuard LLC", tier: "Standard ₹1M", deductible: "₹10k", status: "Draft" }
  ]);

  const handleRequest = async () => {
    setIsRequesting(true);
    await new Promise(r => setTimeout(r, 2000));
    setQuotes([
      { carrier: "Auto-Quote API", tier: "Premium ₹10M", deductible: "₹50k", status: "Reviewing" },
      ...quotes
    ]);
    setIsRequesting(false);
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
              <span className="text-violet-500">🛡</span> Cyber Insurance Hub
            </h1>
            <p className="text-sm text-gray-500 mt-1">Optimize your security posture to lower insurance premiums.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={handleRequest}
            disabled={isRequesting}
            className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50"
          >
            {isRequesting ? "Fetching Rates..." : "Request Quote"}
          </motion.button>
        </motion.div>
        
        
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Estimated Premium</div>
            <div className="text-3xl font-bold tracking-tight text-white mt-1">₹12,400/yr</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Insurability Score</div>
            <div className="text-3xl font-bold tracking-tight text-emerald-400 mt-1">94/100</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Coverage Gaps</div>
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
                  <th className="pb-3 font-medium">Carrier</th>
                  <th className="pb-3 font-medium">Coverage Tier</th>
                  <th className="pb-3 font-medium">Deductible</th>
                  <th className="pb-3 font-medium">Status</th>

                </tr>
              </thead>
              <tbody className="text-sm">
                {quotes.map((q, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 border-b border-white/[0.02] font-semibold">{q.carrier}</td>
                    <td className="py-3 border-b border-white/[0.02] text-gray-400">{q.tier}</td>
                    <td className="py-3 border-b border-white/[0.02] font-mono">{q.deductible}</td>
                    <td className="py-3 border-b border-white/[0.02]">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        q.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {q.status}
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
