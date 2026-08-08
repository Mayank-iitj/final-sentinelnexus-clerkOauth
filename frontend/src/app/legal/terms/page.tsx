export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-8 py-8">
      <article className="max-w-3xl mx-auto space-y-6 text-sm">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Terms of Service</h1>
          <p className="text-gray-500 text-xs">Last updated: 2026‑08‑08</p>
        </header>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">1. Acceptance of Terms</h2>
          <p>
            By accessing or using SentinelNexus, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use our services.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">2. Service Usage and Restrictions</h2>
          <p>
            SentinelNexus provides AI security scanning, threat intelligence, and governance tools. You agree to use these tools only for lawful purposes on infrastructure and models you own or have explicit authorization to test. You may not use SentinelNexus to launch attacks against third-party systems.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">3. Payments and Billing</h2>
          <p>
            Paid subscriptions (Pro, Enterprise) are billed in advance via PayU. By subscribing, you authorize us to charge your selected payment method. Refer to our Refund Policy and Cancellation Policy for details on subscription management.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">4. Limitation of Liability</h2>
          <p>
            SentinelNexus is provided &quot;as is&quot;. While our AI models strive for accuracy, we do not guarantee the identification of all vulnerabilities. We shall not be liable for any security breaches, data loss, or damages resulting from the use of our platform.
          </p>
        </section>
      </article>
    </main>
  );
}
