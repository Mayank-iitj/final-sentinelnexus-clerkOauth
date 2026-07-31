"use client";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function TimeMachinePage() {{
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
            className="btn-primary !py-2 !px-4 text-sm"
          >
            Create Snapshot
          </motion.button>
        </motion.div>
        
        
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Available Snapshots</div>
            <div className="text-3xl font-bold tracking-tight text-white mt-1">14</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Latest Snapshot</div>
            <div className="text-3xl font-bold tracking-tight text-emerald-400 mt-1">1 hr ago</div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Storage Used</div>
            <div className="text-3xl font-bold tracking-tight text-gray-400 mt-1">1.2 TB</div>
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
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 border-b border-white/[0.02]">SNAP-402</td>
                  <td className="py-3 border-b border-white/[0.02]">System (Auto)</td>
                  <td className="py-3 border-b border-white/[0.02]">Verified (100%)</td>
                  <td className="py-3 border-b border-white/[0.02]">2026-07-31 05:00 UTC</td>
                </tr>
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 border-b border-white/[0.02]">SNAP-401</td>
                  <td className="py-3 border-b border-white/[0.02]">Admin User</td>
                  <td className="py-3 border-b border-white/[0.02]">Verified (100%)</td>
                  <td className="py-3 border-b border-white/[0.02]">2026-07-30 18:00 UTC</td>
                </tr>
              </tbody>
            </table>
          </div>
        </motion.div>


      </div>
    </AppShell>
  );
}}
