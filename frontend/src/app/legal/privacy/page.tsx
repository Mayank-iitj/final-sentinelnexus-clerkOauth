export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-8 py-8">
      <article className="max-w-3xl mx-auto space-y-6 text-sm">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">Privacy Policy</h1>
          <p className="text-gray-500 text-xs">
            Last updated: 2026‑02‑23
          </p>
        </header>

        <p>
          SentinelNexus (operating as SentinelNexus) processes limited personal data necessary to provide and
          secure the service. We do not sell personal data and we minimize data
          retention to what is required for security, billing and compliance.
        </p>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Data we process</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Account information (name, email, organization).</li>
            <li>Authentication data from identity providers (OAuth).</li>
            <li>
              Security scan inputs and results, stored for audit and
              troubleshooting.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Retention</h2>
          <p>
            Scan data is retained for a limited period and may be aggregated or
            anonymized for analytics. You may request deletion of specific
            datasets subject to legal and contractual obligations.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-semibold">Contact</h2>
          <p>
            For privacy questions or data subject requests, contact
            privacy@sentinelnexus.example.
          </p>
        </section>
      </article>
    </main>
  );
}

