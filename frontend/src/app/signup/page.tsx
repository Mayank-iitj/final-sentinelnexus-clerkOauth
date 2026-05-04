"use client";

import Link from "next/link";
import { SignUpButton } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/[0.06] bg-white/[0.03]/80 p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-white">Create your account</h1>
        <p className="text-sm text-gray-500">
          Sign up with Google to get started with SentinelNexus.
        </p>
        <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard">
          <button
            className="inline-flex items-center justify-center w-full px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400 transition-colors"
          >
            Sign up with Google
          </button>
        </SignUpButton>
        <div className="pt-2">
          <p className="text-xs text-gray-600">
            Already have an account? <Link href="/login" className="text-emerald-500 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
