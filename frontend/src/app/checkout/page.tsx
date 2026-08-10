"use client";
import SpecularButton from '../../components/SpecularButton';
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const plan = searchParams.get("plan") || "Pro";
  const { isLoaded, user } = useUser();
  const formRef = useRef<HTMLFormElement>(null);

  const [error, setError] = useState<string | null>(null);
  const [payuData, setPayuData] = useState<any>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/login?redirect=/checkout?plan=" + plan);
      return;
    }

    const amount = plan === "Enterprise" ? "999" : plan === "Pro" ? "299" : "0";

    const email =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      "";
    const firstname =
      user.firstName ||
      user.username ||
      email.split("@")[0] ||
      "User";

    const fetchHash = async () => {
      try {
        // Call the local Next.js API route — no CORS, no external backend needed
        const response = await fetch("/api/payu-hash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, productinfo: plan, firstname, email }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server error (${response.status})`);
        }

        const data = await response.json();
        setPayuData(data);
      } catch (err: any) {
        console.error("Checkout error:", err);
        setError(err.message);
      }
    };

    fetchHash();
  }, [isLoaded, user, plan]);

  // Auto-submit the hidden form once data arrives
  useEffect(() => {
    if (payuData && formRef.current) {
      formRef.current.submit();
    }
  }, [payuData]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4 px-4">
        <div className="glass-card p-8 rounded-2xl max-w-md w-full text-center">
          <p className="text-red-400 mb-4">⚠️ {error}</p>
          <div className="flex gap-3 justify-center">
            <SpecularButton
              onClick={() => { setError(null); window.location.reload(); }}
              className="px-5 py-2 bg-violet-600 rounded-lg hover:bg-violet-700 transition text-sm font-medium"
            >
              Retry
            </SpecularButton>
            <SpecularButton
              onClick={() => router.push("/subscription")}
              className="px-5 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition text-sm font-medium"
            >
              Back to Plans
            </SpecularButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="glass-card p-12 rounded-2xl flex flex-col items-center text-center max-w-md w-full">
        <Image src="/favicon.png" alt="SentinelNexus" width={48} height={48} className="rounded-xl mb-6" />
        <h1 className="text-2xl font-bold mb-2">Redirecting to Payment</h1>
        <p className="text-gray-400 mb-8">
          Securely processing your <span className="text-violet-400 font-semibold">{plan}</span> plan…
        </p>
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />

        {/* Hidden PayU form — auto-submitted when payuData is ready */}
        {payuData && (
          <form
            ref={formRef}
            action={payuData.payu_url || "https://test.payu.in/_payment"}
            method="post"
            className="hidden"
          >
            <input type="hidden" name="key" value={payuData.key} />
            <input type="hidden" name="txnid" value={payuData.txnid} />
            <input type="hidden" name="amount" value={payuData.amount} />
            <input type="hidden" name="productinfo" value={payuData.productinfo} />
            <input type="hidden" name="firstname" value={payuData.firstname} />
            <input type="hidden" name="email" value={payuData.email} />
            <input type="hidden" name="hash" value={payuData.hash} />
            <input type="hidden" name="surl" value={payuData.surl} />
            <input type="hidden" name="furl" value={payuData.furl} />
          </form>
        )}
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          Loading…
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
