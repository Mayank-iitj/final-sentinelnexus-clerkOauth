"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useUser, useAuth } from "@clerk/nextjs";

function CheckoutContent() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "Pro";
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payuData, setPayuData] = useState<any>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://sentinelnexus-backend.onrender.com/api/v1";

  useEffect(() => {
    if (!isLoaded || !user) return;

    const amount = plan === "Enterprise" ? 999 : 299;

    const fetchHash = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setError("Authentication required. Please log in again.");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE}/payments/payu/hash?amount=${amount}&productinfo=${plan}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("PayU hash error:", response.status, errorText);
          throw new Error(`Payment initialization failed (${response.status}). Please try again.`);
        }

        const data = await response.json();
        setPayuData(data);
        setLoading(false);
      } catch (err: any) {
        console.error("Checkout error:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchHash();
  }, [isLoaded, user, plan]);

  useEffect(() => {
    if (payuData && formRef.current) {
      formRef.current.submit();
    }
  }, [payuData]);

  if (!isLoaded) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading user...</div>;
  if (!user) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Please login first.</div>;
  if (error) return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
      <p className="text-red-400">Error: {error}</p>
      <button onClick={() => window.location.reload()} className="px-4 py-2 bg-violet-600 rounded-lg hover:bg-violet-700 transition">
        Retry
      </button>
    </div>
  );

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="glass-card p-12 rounded-2xl flex flex-col items-center text-center max-w-md w-full">
        <Image src="/favicon.png" alt="Logo" width={48} height={48} className="rounded-xl mb-6" />
        <h1 className="text-2xl font-bold mb-2">Redirecting to Payment</h1>
        <p className="text-gray-400 mb-8">Please wait while we redirect you to PayU to complete your purchase for the {plan} plan.</p>
        
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>

        {payuData && (
          <form ref={formRef} action={payuData.payu_url || "https://test.payu.in/_payment"} method="post" className="hidden">
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
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
