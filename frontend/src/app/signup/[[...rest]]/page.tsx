"use client";
export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useUser, SignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

export default function SignupPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/dashboard");
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
        className="w-full max-w-md space-y-8 relative"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-center space-y-3"
        >
          <Link href="/" className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-violet-500/5 border border-violet-400/20 shadow-[0_0_40px_rgba(124,58,237,.1)] overflow-hidden transition-all duration-300 hover:border-violet-400/40 hover:shadow-[0_0_50px_rgba(124,58,237,.2)]">
            <Image src="/favicon.png" alt="SentinelNexus" width={48} height={48} className="object-cover" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Create account</h1>
            <p className="text-sm text-gray-500 mt-1">Join SentinelNexus today</p>
          </div>
        </motion.div>

        {/* Clerk SignUp component */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex justify-center"
        >
          <SignUp
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
            path="/signup"
            signInUrl="/login"
            forceRedirectUrl="/dashboard"
          />
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-600"
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
