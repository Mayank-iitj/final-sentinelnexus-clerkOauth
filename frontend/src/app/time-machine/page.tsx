"use client";
import { useState } from "react";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function TimeMachinePage() {
  const [isCreating, setIsCreating] = useState(false);
  const [snapshots, setSnapshots] = useState([
    { id: "SNAP-402", by: "System (Auto)", integrity: "Verified (100%)", timestamp: "2026-07-31 05:00 UTC" },
    { id: "SNAP-401", by: "Admin User", integrity: "Verified (100%)", timestamp: "2026-07-30 18:00 UTC" }
  ]);

  const handleCreate = async () => {
    setIsCreating(true);
    await new Promise(res => setTimeout(res, 1500));
    setSnapshots([
      { id: `SNAP-${403 + (snapshots.length - 2)}`, by: "Current User", integrity: "Verified (100%)", timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16) + ' UTC' }, 
      ...snapshots
    ]);
    setIsCreating(false);
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
              <span className="text-violet-500">⏳</span> Time Machine
            </h1>
            <p className="text-sm text-gray-500 mt-1">Restore infrastructure state and configurations from any point in time.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={handleCreate}
            disabled={isCreating}
            className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create Snapshot"}
          </motion.button>
        </motion.div>
        
        
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Available Snapshots</div>
            <div className="text-3xl font-bold tracking-tight text-white mt-1">{12 + snapshots.length}</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Latest Snapshot</div>
            <div className="text-3xl font-bold tracking-tight text-emerald-400 mt-1">Just now</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Storage Used</div>
            <div className="text-3xl font-bold tracking-tight text-gray-400 mt-1">{1.2 + (snapshots.length * 0.1).toFixed(1)} TB</div>
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
                  <th className="pb-3 font-medium">Snapshot ID</th>
                  <th className="pb-3 font-medium">Created By</th>
                  <th className="pb-3 font-medium">State Integrity</th>
                  <th className="pb-3 font-medium">Timestamp</th>

                </tr>
              </thead>
              <tbody className="text-sm">
                {snapshots.map(s => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 border-b border-white/[0.02]">{s.id}</td>
                    <td className="py-3 border-b border-white/[0.02]">{s.by}</td>
                    <td className="py-3 border-b border-white/[0.02] text-emerald-400">{s.integrity}</td>
                    <td className="py-3 border-b border-white/[0.02] font-mono text-gray-400">{s.timestamp}</td>
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
