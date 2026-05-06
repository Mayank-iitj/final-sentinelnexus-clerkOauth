"use client";

import { useEffect, useState } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const ERROR_MESSAGES: Record<string, string> = {
  google_auth_failed:     "Google sign-in was cancelled or failed. Please try again.",
  google_no_email:        "Your Google account has no accessible email address.",
  google_internal_error:  "An unexpected error occurred with Google sign-in. Please try again.",
  user_sync_failed:       "Account sync failed. Please try again or contact support.",
  session_failed:         "Session creation failed. Please sign in again.",
  session_bridge_error:   "An unexpected error occurred during sign-in. Please try again.",
  OAuthCallback:          "OAuth callback error. Please try again.",
  OAuthSignin:            "OAuth sign-in error. Please try again.",
  Configuration:          "Server configuration error. Contact support.",
};

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function LoginPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const errorMsg = errorCode ? (ERROR_MESSAGES[errorCode] ?? `Sign-in error: ${errorCode}`) : null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setErrorCode(params.get("error"));
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLoading(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    }
  }, [isSignedIn, isLoaded, router]);

  return (
    <main className="nubien-bg min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm space-y-8"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-center space-y-3"
        >
          {/* @ts-expect-error */}
          <Link href="/" className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-violet-500/5 border border-violet-400/20 shadow-[0_0_40px_rgba(124,58,237,.1)] mb-1 overflow-hidden transition-all duration-300 hover:border-violet-400/40 hover:shadow-[0_0_50px_rgba(124,58,237,.2)]">
            <Image src="/favicon.png" alt="SentinelNexus" width={56} height={56} className="object-cover" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">SentinelNexus</h1>
            <p className="text-sm text-gray-500 mt-1">AI Security & Compliance Platform</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="nub-card rounded-3xl p-7 shadow-2xl shadow-black/40 space-y-5"
        >
          <div className="text-center">
            <h2 className="text-base font-semibold text-white">Sign in to your account</h2>
            <p className="text-xs text-gray-600 mt-1">Continue with your Clerk account</p>
          </div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-xl border border-red-500/30 bg-red-900/15 text-red-300 text-xs px-4 py-3 text-center"
            >
              {errorMsg}
            </motion.div>
          )}

          <div className="space-y-3">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border font-semibold text-sm transition-all duration-200 bg-white/[0.03] hover:bg-white/[0.06] text-white border-white/[0.08] hover:border-violet-400/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="w-5 h-5 flex items-center justify-center"><GoogleIcon /></span>
                <span className="flex-1 text-left">
                  {loading ? "Signing in..." : "Continue with Clerk"}
                </span>
                <span className="text-gray-600 text-xs">{loading ? "" : "→"}</span>
              </motion.button>
            </SignInButton>
          </div>

          {!isLoaded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-xs text-gray-500 animate-pulse pt-1"
            >
              Loading...
            </motion.div>
          )}

          <div className="relative flex items-center gap-2 before:content-[''] before:flex-1 before:h-px before:bg-white/10 after:content-[''] after:flex-1 after:h-px after:bg-white/10">
            <span className="text-xs text-gray-600">No account?</span>
          </div>

          {/* @ts-expect-error */}
          <Link href="/signup" className="block">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full px-4 py-2.5 rounded-2xl border border-violet-400/30 text-violet-300 text-sm font-medium transition-colors hover:bg-violet-500/10 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              Create an account
            </motion.button>
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-600"
        >
          By signing in, you agree to our{" "}
          {/* @ts-expect-error */}
          <Link href="/legal/terms" className="text-violet-400 hover:underline">Terms of Service</Link>
          {" "}and{" "}
          {/* @ts-expect-error */}
          <Link href="/legal/privacy" className="text-violet-400 hover:underline">Privacy Policy</Link>
        </motion.p>
      </motion.div>
    </main>
  );
}
