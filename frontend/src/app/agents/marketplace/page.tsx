"use client";
import { useState } from "react";
import { AppShell } from "../../../components/AppShell";
import { motion } from "framer-motion";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function AgentsMarketplacePage() {
  const [isUploading, setIsUploading] = useState(false);
  const [agents, setAgents] = useState([
    { name: "RedTeam-Alpha", category: "Offensive AI", status: "Running", cpu: "12%" },
    { name: "Log-Analyzer-v2", category: "Defensive AI", status: "Running", cpu: "4%" }
  ]);

  const handleUpload = async () => {
    setIsUploading(true);
    await new Promise(res => setTimeout(res, 2000));
    setAgents([
      { name: "Custom-Agent-v1", category: "Utility AI", status: "Initializing...", cpu: "0%" },
      ...agents
    ]);
    setIsUploading(false);
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
              <span className="text-violet-500">◒</span> AI Agent Marketplace
            </h1>
            <p className="text-sm text-gray-500 mt-1">Deploy specialized autonomous agents for your environment.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={handleUpload}
            disabled={isUploading}
            className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50"
          >
            {isUploading ? "Uploading & Compiling..." : "Upload Custom Agent"}
          </motion.button>
        </motion.div>
        
        
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Deployed Agents</div>
            <div className="text-3xl font-bold tracking-tight text-white mt-1">{agents.length}</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Active Tasks</div>
            <div className="text-3xl font-bold tracking-tight text-violet-400 mt-1">15</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Credits Used</div>
            <div className="text-3xl font-bold tracking-tight text-gray-400 mt-1">450</div>
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
                  <th className="pb-3 font-medium">Agent Name</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">CPU Usage</th>

                </tr>
              </thead>
              <tbody className="text-sm">
                {agents.map((agent, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 border-b border-white/[0.02] font-semibold">{agent.name}</td>
                    <td className="py-3 border-b border-white/[0.02] text-gray-400">{agent.category}</td>
                    <td className="py-3 border-b border-white/[0.02]">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                        agent.status === 'Running' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {agent.status}
                      </span>
                    </td>
                    <td className="py-3 border-b border-white/[0.02] font-mono text-gray-400">{agent.cpu}</td>
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
