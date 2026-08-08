"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useUser, useAuth } from "@clerk/nextjs";

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") || "Pro";
  const { isLoaded, user } = useUser();
  const { getToken } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payuData, setPayuData] = useState<any>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const amount = plan === "Enterprise" ? 999 : 299;

    const fetchHash = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payments/payu/hash?amount=${amount}&productinfo=${plan}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error("Failed to generate payment hash");

        const data = await response.json();
        setPayuData(data);
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchHash();
  }, [isLoaded, user, plan]);

  useEffect(() => {
    if (payuData && formRef.current) {
      // Auto submit the form to PayU once data is loaded
      formRef.current.submit();
    }
  }, [payuData]);

  if (!isLoaded) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading user...</div>;
  if (!user) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Please login first.</div>;
  if (error) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Error: {error}</div>;

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="glass-card p-12 rounded-2xl flex flex-col items-center text-center max-w-md w-full">
        <Image src="/favicon.png" alt="Logo" width={48} height={48} className="rounded-xl mb-6" />
        <h1 className="text-2xl font-bold mb-2">Redirecting to Payment</h1>
        <p className="text-gray-400 mb-8">Please wait while we redirect you to PayU to complete your purchase for the {plan} plan.</p>
        
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>

        {payuData && (
          <form ref={formRef} action="https://test.payu.in/_payment" method="post" className="hidden">
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
