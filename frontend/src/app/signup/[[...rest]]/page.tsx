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
    <main className="min-h-screen grid lg:grid-cols-2 bg-black text-white font-body relative">
      {/* Left Side - Branding/Summary */}
      <div className="hidden lg:flex flex-col justify-center px-12 xl:px-20 relative overflow-hidden border-r border-white/10">
        <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] bg-violet-600/20 rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-lg space-y-12"
        >
          <div className="flex items-center gap-4">
            <Link href="/" className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-violet-500/10 border border-violet-400/20">
              <Image src="/favicon.png" alt="SentinelNexus" width={32} height={32} className="object-cover" />
            </Link>
            <span className="text-xl font-bold tracking-tight">SentinelNexus</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-heading italic tracking-tight">Join SentinelNexus today</h1>
            <p className="text-gray-400 leading-relaxed text-lg">
              Create an account to begin automating your AI compliance and deploying real-time guardrails for your LLMs.
            </p>
          </div>

          <div className="space-y-4 pt-8 border-t border-white/10">
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span className="text-violet-400">✓</span> Connect in seconds
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span className="text-violet-400">✓</span> Interactive Live Scans
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span className="text-violet-400">✓</span> Automated PDF Reports
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Form Container */}
      <div className="bg-white text-black flex items-center justify-center p-6 lg:p-12 relative h-screen overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-[400px] space-y-8 my-auto"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <Image src="/favicon.png" alt="SentinelNexus" width={32} height={32} />
            <span className="font-bold text-xl">SentinelNexus</span>
          </div>

          <div className="flex justify-center w-full">
            <SignUp
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-transparent shadow-none border-0 w-full p-0",
                  headerTitle: "text-gray-900 text-2xl font-bold mb-1",
                  headerSubtitle: "text-gray-500",
                  socialButtonsBlockButton: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm",
                  socialButtonsBlockButtonText: "text-gray-700 font-medium",
                  formFieldLabel: "text-gray-700 font-medium",
                  formFieldInput: "bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-violet-500 focus:ring-violet-500/20 shadow-sm",
                  footerActionLink: "text-violet-600 hover:text-violet-700 font-medium",
                  formButtonPrimary: "bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition-colors",
                  dividerLine: "bg-gray-200",
                  dividerText: "text-gray-500 bg-white px-3",
                  formFieldAction: "text-violet-600 font-medium",
                  otpCodeFieldInput: "border-gray-200 text-gray-900 focus:border-violet-500 focus:ring-violet-500/20",
                  alert: "bg-red-50 border-red-200 text-red-600",
                  alertText: "text-red-600",
                  footer: "hidden", 
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
          </div>

          <p className="text-center text-xs text-gray-500 pt-6">
            By signing up, you agree to our{" "}
            <Link href="/legal/terms" className="text-violet-600 hover:underline">Terms</Link>
            {" "}and{" "}
            <Link href="/legal/privacy" className="text-violet-600 hover:underline">Privacy Policy</Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
