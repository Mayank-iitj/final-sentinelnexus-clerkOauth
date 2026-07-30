"use client";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";

export default function ExplainabilityPage() {
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
            <h1 className="text-2xl font-bold">AI Explainability Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Model interpretability and decision tracking</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            className="btn-primary !py-2 !px-4 text-sm"
          >
            Configure
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01] flex flex-col gap-2">
              <div className="w-8 h-8 rounded-full bg-violet-500/10 mb-2 flex items-center justify-center text-violet-400">
                ✧
              </div>
              <div className="h-4 w-1/2 bg-white/[0.05] rounded animate-pulse" />
              <div className="h-3 w-3/4 bg-white/[0.03] rounded animate-pulse" />
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="nub-card rounded-2xl p-8 border border-white/[0.04] bg-white/[0.01] min-h-[400px] flex items-center justify-center flex-col text-center"
        >
          <div className="text-4xl mb-4 opacity-50">🚧</div>
          <h2 className="text-lg font-medium text-white mb-2">Module under construction</h2>
          <p className="text-sm text-gray-500 max-w-md">
            The <strong>AI Explainability Dashboard</strong> is currently being scaffolded. 
            Connect your data sources to enable full functionality.
          </p>
        </motion.div>
      </div>
    </AppShell>
  );
}
