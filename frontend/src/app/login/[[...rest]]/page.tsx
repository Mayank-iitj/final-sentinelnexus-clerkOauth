"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useUser, SignIn } from "@clerk/nextjs";
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

export default function LoginPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const errorMsg = errorCode ? (ERROR_MESSAGES[errorCode] ?? `Sign-in error: ${errorCode}`) : null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setErrorCode(params.get("error"));
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
    }
  }, [isSignedIn, isLoaded, router]);

  return (
    <main className="nubien-bg min-h-screen flex items-center justify-center p-4 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-violet-600/8 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md space-y-8"
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-center space-y-3"
        >
          <Link href="/" className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-violet-500/5 border border-violet-400/20 shadow-[0_0_40px_rgba(124,58,237,.1)] mb-1 overflow-hidden transition-all duration-300 hover:border-violet-400/40 hover:shadow-[0_0_50px_rgba(124,58,237,.2)]">
            <Image src="/favicon.png" alt="SentinelNexus" width={56} height={56} className="object-cover" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">SentinelNexus</h1>
            <p className="text-sm text-gray-500 mt-1">AI Security & Compliance Platform</p>
          </div>
        </motion.div>

        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-xl border border-red-500/30 bg-red-900/15 text-red-300 text-xs px-4 py-3 text-center"
          >
            {errorMsg}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex justify-center"
        >
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "bg-transparent shadow-none border-0 w-full",
                headerTitle: "text-white",
                headerSubtitle: "text-gray-400",
                socialButtonsBlockButton:
                  "bg-white/[0.03] border border-white/[0.08] text-white hover:bg-white/[0.06] hover:border-violet-400/30 transition-all duration-200",
                socialButtonsBlockButtonText: "text-white font-medium",
                formFieldLabel: "text-gray-400",
                formFieldInput:
                  "bg-white/[0.03] border-white/[0.08] text-white placeholder:text-gray-600 focus:border-violet-400/50 focus:ring-violet-500/20",
                footerActionLink: "text-violet-400 hover:text-violet-300",
                formButtonPrimary:
                  "bg-violet-600 hover:bg-violet-700 text-white transition-colors",
                dividerLine: "bg-white/10",
                dividerText: "text-gray-600",
                identityPreview: "bg-white/[0.03] border-white/[0.08]",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-violet-400",
                formFieldAction: "text-violet-400",
                otpCodeFieldInput: "border-white/[0.08] text-white",
                alert: "bg-red-900/20 border-red-500/30 text-red-300",
                alertText: "text-red-300",
              },
              layout: {
                socialButtonsPlacement: "top",
                socialButtonsVariant: "blockButton",
              },
            }}
            routing="path"
            path="/login"
            signUpUrl="/signup"
            forceRedirectUrl="/dashboard"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-600"
        >
          By signing in, you agree to our{" "}
          <Link href="/legal/terms" className="text-violet-400 hover:underline">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/legal/privacy" className="text-violet-400 hover:underline">Privacy Policy</Link>
        </motion.p>
      </motion.div>
    </main>
  );
}
