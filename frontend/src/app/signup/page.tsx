"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useUser, SignUpButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

export default function SignupPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLoading(true);
      // Small delay to ensure session is established
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    }
  }, [isSignedIn, isLoaded, router]);

  return (
    <main className="nubien-bg min-h-screen bg-black flex items-center justify-center p-4 relative">
      {/* Violet glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-white/[0.03]/80 p-8 text-center space-y-6 relative"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="space-y-3"
        >
          <Link href="/" className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-violet-500/5 border border-violet-400/20 shadow-[0_0_40px_rgba(124,58,237,.1)] overflow-hidden transition-all duration-300 hover:border-violet-400/40 hover:shadow-[0_0_50px_rgba(124,58,237,.2)]">
            <Image src="/favicon.png" alt="SentinelNexus" width={48} height={48} className="object-cover" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Create account</h1>
            <p className="text-sm text-gray-500 mt-1">Join SentinelNexus today</p>
          </div>
        </motion.div>

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="space-y-4"
        >
          <p className="text-sm text-gray-400">
            Sign up with your account to get started with AI security.
          </p>
          
          <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-violet-500"
            >
              {loading ? "Creating account..." : "Sign up with Clerk"}
            </motion.button>
          </SignUpButton>
        </motion.div>

        {!isLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-xs text-gray-500 animate-pulse"
          >
            Loading...
          </motion.div>
        )}

        {/* Divider */}
        <div className="relative flex items-center gap-2 before:content-[''] before:flex-1 before:h-px before:bg-white/10 after:content-[''] after:flex-1 after:h-px after:bg-white/10">
          <span className="text-xs text-gray-600">Already signed up?</span>
        </div>

        {/* Login link */}
        <Link href="/login" className="block">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-4 py-2 rounded-xl border border-violet-400/30 text-violet-300 font-medium hover:bg-violet-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            Sign in to existing account
          </motion.button>
        </Link>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-xs text-gray-600"
        >
          By signing up, you agree to our{" "}
          <Link href="/legal/terms" className="text-violet-400 hover:underline">Terms</Link>
          {" "}and{" "}
          <Link href="/legal/privacy" className="text-violet-400 hover:underline">Privacy Policy</Link>
        </motion.p>
      </motion.div>
    </main>
  );
}
