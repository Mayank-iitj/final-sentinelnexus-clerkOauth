"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export default function PaymentFailurePage() {
  const searchParams = useSearchParams();
  const txnid = searchParams.get("txnid");
  const error = searchParams.get("error");

  return (
    <main className="mesh-background min-h-screen text-white relative flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card glare-hover p-10 rounded-3xl flex flex-col items-center text-center max-w-lg w-full shadow-[0_0_80px_rgba(239,68,68,0.15)]"
      >
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        
        <h1 className="font-display text-3xl font-extrabold mb-3">Payment Failed</h1>
        <p className="text-gray-300 mb-6 text-lg">
          Unfortunately, your payment could not be processed. Your account has not been charged.
        </p>

        {(txnid || error) && (
          <div className="bg-black/30 rounded-lg p-3 mb-8 w-full border border-white/5 text-left">
            {txnid && <p className="text-xs text-gray-400 font-mono mb-1">Transaction ID: {txnid}</p>}
            {error && <p className="text-xs text-red-400 font-mono">Error Code: {error}</p>}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 w-full">
          <Link href="/pricing" className="flex-1 rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            Try Again
          </Link>
          <Link href="/dashboard" className="flex-1 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-gray-200 hover:border-white hover:text-white transition">
            Return to Dashboard
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
