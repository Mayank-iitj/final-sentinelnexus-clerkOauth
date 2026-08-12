"use client";
import { useState } from "react";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function DigitalTwinPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [components, setComponents] = useState([
    { name: "Kubernetes Cluster", status: "Healthy", lastSync: "10 mins ago", drift: "0.0%" },
    { name: "Postgres Database", status: "Healthy", lastSync: "1 hr ago", drift: "0.1%" }
  ]);

  const handleSync = async () => {
    setIsSyncing(true);
    await new Promise(res => setTimeout(res, 2500));
    setComponents([
      { name: "AWS Edge Router", status: "Healthy", lastSync: "Just now", drift: "0.0%" },
      ...components.map(c => ({ ...c, lastSync: "Just now", drift: "0.0%" }))
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
              <span className="text-violet-500">👯</span> Digital Twin
            </h1>
            <p className="text-sm text-gray-500 mt-1">Interact with a mirrored, isolated staging environment of your production infra.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={handleSync}
            disabled={isSyncing}
            className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50"
          >
            {isSyncing ? "Synchronizing State..." : "Sync with Production"}
          </motion.button>
        </motion.div>
        
        
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Sync Status</div>
            <div className="text-3xl font-bold tracking-tight text-emerald-400 mt-1">
              {isSyncing ? "Syncing..." : "In Sync"}
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Simulated Attacks</div>
            <div className="text-3xl font-bold tracking-tight text-violet-400 mt-1">45</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Cost / Hr</div>
            <div className="text-3xl font-bold tracking-tight text-gray-400 mt-1">₹1.20</div>
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
                  <th className="pb-3 font-medium">Component</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Last Sync</th>
                  <th className="pb-3 font-medium">Drift</th>

                </tr>
              </thead>
              <tbody className="text-sm">
                {components.map((c, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 border-b border-white/[0.02]">{c.name}</td>
                    <td className="py-3 border-b border-white/[0.02] text-emerald-400">{c.status}</td>
                    <td className="py-3 border-b border-white/[0.02] text-gray-400">{c.lastSync}</td>
                    <td className="py-3 border-b border-white/[0.02] font-mono">{c.drift}</td>
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
