export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-8 py-8">
      <article className="max-w-3xl mx-auto space-y-6 text-sm">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Refund Policy</h1>
          <p className="text-gray-500 text-xs">
            Last updated: 2026‑07‑31
          </p>
        </header>

        <p>
          This website is operated by SentinelNexus.
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Duration</h2>
          <p>
            You are eligible for a refund within 7 days of your original purchase date.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Mode of Refund</h2>
          <p>
            Approved refunds will be processed via the original payment method. Please allow up to 7-10 business days for the credit to appear on your statement.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Exceptions</h2>
          <p>
            Custom enterprise plans or heavily discounted promotional plans may be exempt from this standard refund policy. Please refer to your individual contract terms for exceptions.
          </p>
        </section>
      </article>
    </main>
  );
}
