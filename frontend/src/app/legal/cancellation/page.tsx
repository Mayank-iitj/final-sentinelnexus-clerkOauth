export default function CancellationPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-8 py-8">
      <article className="max-w-3xl mx-auto space-y-6 text-sm">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Cancellation Policy</h1>
          <p className="text-gray-500 text-xs">Last updated: 2026‑08‑08</p>
        </header>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">1. How to Cancel</h2>
          <p>
            You may cancel your SentinelNexus subscription at any time by navigating to your Subscription Dashboard and selecting "Cancel Plan". 
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">2. End of Billing Cycle</h2>
          <p>
            Upon cancellation, your subscription will remain active until the end of your current billing cycle. You will not be charged again. Once the cycle ends, your account will be downgraded to the free Starter tier, and appropriate risk engine limits will be applied.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">3. Data Retention</h2>
          <p>
            Your scan data and governance logs will be retained securely even after cancellation, up to the limits of the Starter tier. Enterprise exports will no longer be available.
          </p>
        </section>
      </article>
    </main>
  );
}
