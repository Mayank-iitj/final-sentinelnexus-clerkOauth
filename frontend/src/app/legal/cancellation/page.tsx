export default function CancellationPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-8 py-8">
      <article className="max-w-3xl mx-auto space-y-6 text-sm">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Cancellation Policy</h1>
          <p className="text-gray-500 text-xs">
            Last updated: 2026‑07‑31
          </p>
        </header>

        <p>
          This website is operated by SentinelNexus.
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Duration & Process</h2>
          <p>
            You may cancel your subscription at any time. To avoid being charged for the next billing cycle, cancellations must be initiated at least 1 day before the end of the current billing period.
          </p>
          <p>
            Cancellations can be made directly through your account dashboard or by contacting our support team.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Effect of Cancellation</h2>
          <p>
            Upon cancellation, you will retain access to your plan&apos;s features until the end of your current billing cycle. After that, your account will be downgraded to the free tier or suspended, depending on your account status.
          </p>
        </section>
      </article>
    </main>
  );
}
