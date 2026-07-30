"use client";

import Link from "next/link";
import { AppShell } from "../components/AppShell";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <h1 className="text-[150px] sm:text-[200px] font-black leading-none text-transparent bg-clip-text bg-gradient-to-b from-violet-500/20 to-transparent select-none">
            404
          </h1>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
              Page Not Found
            </h2>
            <p className="text-gray-400 text-sm sm:text-base max-w-sm mb-8">
              The page you are looking for has been moved, deleted, or never existed in the SentinelNexus infrastructure.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                href="/dashboard"
                className="btn-primary"
              >
                Return to Dashboard
              </Link>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-16 pt-8 border-t border-white/[0.06] flex items-center justify-center gap-6 text-sm text-gray-500 w-full max-w-md"
        >
          <Link href="/docs" className="hover:text-violet-400 transition-colors">Documentation</Link>
          <span className="w-1 h-1 rounded-full bg-white/[0.1]"></span>
          <Link href="/support" className="hover:text-violet-400 transition-colors">Support</Link>
          <span className="w-1 h-1 rounded-full bg-white/[0.1]"></span>
          <Link href="/status" className="hover:text-violet-400 transition-colors">System Status</Link>
        </motion.div>
      </div>
    </AppShell>
  );
}
