"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const txnid = searchParams.get("txnid");
  const plan = searchParams.get("plan");

  return (
    <main className="mesh-background min-h-screen text-white relative flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass-card glare-hover p-10 rounded-3xl flex flex-col items-center text-center max-w-lg w-full shadow-[0_0_80px_rgba(139,92,246,0.15)]"
      >
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="font-display text-3xl font-extrabold mb-3">Payment Successful!</h1>
        <p className="text-gray-300 mb-6 text-lg">
          Welcome to the <span className="font-bold text-violet-300">{plan || "Premium"}</span> tier. Your account has been upgraded and your new benefits are unlocked.
        </p>

        {txnid && (
          <div className="bg-black/30 rounded-lg p-3 mb-8 w-full border border-white/5">
            <p className="text-xs text-gray-400 font-mono">Transaction ID: {txnid}</p>
          </div>
        )}

        <div className="flex gap-4 w-full">
          <Link href="/dashboard" className="flex-1 rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            Go to Dashboard
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
