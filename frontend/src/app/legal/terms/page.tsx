export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-8 py-8">
      <article className="max-w-3xl mx-auto space-y-6 text-sm">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Terms of Service</h1>
          <p className="text-gray-500 text-xs">
            Last updated: 2026‑02‑23
          </p>
        </header>

        <p>
          This website is operated by SentinelNexus.
        </p>
        <p>
          These Terms govern your use of the SentinelNexus platform. By
          accessing or using the service, you agree to be bound by them.
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">1. Use of service</h2>
          <p>
            You may use the service to analyze your own code, logs and prompts
            for security and compliance risks. You are responsible for the
            legality of any data you submit.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">2. Security & confidentiality</h2>
          <p>
            We apply administrative, technical, and physical safeguards to
            protect customer data. We maintain audit logs and support customer
            security reviews.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">3. Liability</h2>
          <p>
            The service is provided &quot;as is&quot; and does not replace your
            own security program. To the maximum extent permitted by law, our
            liability is limited to the fees paid for the service.
          </p>
        </section>
      </article>
    </main>
  );
}

