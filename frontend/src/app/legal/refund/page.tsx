export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-8 py-8">
      <article className="max-w-3xl mx-auto space-y-6 text-sm">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Refund Policy</h1>
          <p className="text-gray-500 text-xs">Last updated: 2026‑08‑08</p>
        </header>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">1. Subscription Refunds</h2>
          <p>
            SentinelNexus offers a 14-day money-back guarantee for all new Pro and Enterprise subscription plans. If you are not satisfied with the service within the first 14 days of your initial purchase, you may request a full refund.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">2. Renewal Refunds</h2>
          <p>
            We do not provide refunds for automatic subscription renewals. You are responsible for cancelling your subscription prior to the renewal date via your Subscription Dashboard.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">3. How to Request</h2>
          <p>
            To request a refund, please contact our support team at billing@sentinelnexus.example with your PayU transaction ID.
          </p>
        </section>
      </article>
    </main>
  );
}
