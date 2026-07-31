"use client";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function ComplianceCopilotPage() {{
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
              <span className="text-violet-500">💬</span> Compliance Copilot
            </h1>
            <p className="text-sm text-gray-500 mt-1">Chat with the AI to map controls, generate policies, and audit evidence.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            className="btn-primary !py-2 !px-4 text-sm"
          >
            Export Audit Log
          </motion.button>
        </motion.div>
        
        

        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="nub-card rounded-2xl p-6 border border-white/[0.04] bg-white/[0.01] mt-6 min-h-[500px] flex flex-col"
        >
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded bg-violet-500/20 text-violet-400 flex items-center justify-center shrink-0">🤖</div>
              <div className="bg-white/[0.04] p-3 rounded-xl rounded-tl-none text-sm text-gray-200">
                Hello! I am your AI assistant for this module. How can I help you analyze your data today?
              </div>
            </div>
          </div>
          <div className="mt-4 relative">
            <input type="text" placeholder="Ask a question..." className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-violet-500 pr-12" />
            <button className="absolute right-2 top-2 w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center text-white hover:bg-violet-400 transition-colors">
               ↑ 
            </button>
          </div>
        </motion.div>


      </div>
    </AppShell>
  );
}}
