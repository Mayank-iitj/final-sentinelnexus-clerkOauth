"use client";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function AttackGraphPage() {{
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
              <span className="text-violet-500">🕸</span> Interactive Live Attack Graph
            </h1>
            <p className="text-sm text-gray-500 mt-1">Visualize lateral movement paths and simulated breach scenarios.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            className="btn-primary !py-2 !px-4 text-sm"
          >
            Run Simulation
          </motion.button>
        </motion.div>
        
        
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Active Lateral Paths</div>
            <div className="text-3xl font-bold tracking-tight text-red-400 mt-1">12</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Choke Points</div>
            <div className="text-3xl font-bold tracking-tight text-amber-400 mt-1">4</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Mean Time to Compromise</div>
            <div className="text-3xl font-bold tracking-tight text-violet-400 mt-1">4h 12m</div>
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
                  <th className="pb-3 font-medium">Source Node</th>
                  <th className="pb-3 font-medium">Target Node</th>
                  <th className="pb-3 font-medium">Vector</th>
                  <th className="pb-3 font-medium">Probability</th>

                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 border-b border-white/[0.02]">Web-01</td>
                  <td className="py-3 border-b border-white/[0.02]">DB-Primary</td>
                  <td className="py-3 border-b border-white/[0.02]">SQL Injection → Privilege Escalation</td>
                  <td className="py-3 border-b border-white/[0.02]">High (89%)</td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 border-b border-white/[0.02]">VPN-Endpoint</td>
                  <td className="py-3 border-b border-white/[0.02]">Internal-Subnet</td>
                  <td className="py-3 border-b border-white/[0.02]">Stolen Credentials (Simulated)</td>
                  <td className="py-3 border-b border-white/[0.02]">Critical (99%)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>


      </div>
    </AppShell>
  );
}}
