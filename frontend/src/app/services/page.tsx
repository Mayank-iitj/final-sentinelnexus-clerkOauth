import { AppShell } from "../../components/AppShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Services",
  description: "Explore the security and compliance services provided by our platform.",
};

export default function ServicesPage() {
  return (
    <AppShell>
      <div className="max-w-5xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Our Services</h1>
          <p className="mt-1 text-sm text-gray-300">
            We provide a comprehensive suite of AI security and compliance services.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Service 1 */}
          <section className="glass-card space-y-3 rounded-2xl p-5 text-sm text-gray-200">
            <h2 className="text-base font-semibold text-white">Runtime Prompt Defense</h2>
            <p>
              Detect injection attempts, policy bypass patterns, and malicious intents before they propagate to your LLM models in production.
            </p>
          </section>

          {/* Service 2 */}
          <section className="glass-card space-y-3 rounded-2xl p-5 text-sm text-gray-200">
            <h2 className="text-base font-semibold text-white">Code & Config Scanning</h2>
            <p>
              Automatically catch secret leakage, risky defaults, and sensitive data exposure during development with our static analysis engine.
            </p>
          </section>
          
          {/* Service 3 */}
          <section className="glass-card space-y-3 rounded-2xl p-5 text-sm text-gray-200">
            <h2 className="text-base font-semibold text-white">Audit & Compliance Evidence</h2>
            <p>
              Generate traceable events and control mappings for governance reviews. We help you stay SOC 2 and GDPR compliant out-of-the-box.
            </p>
          </section>

          {/* Service 4 */}
          <section className="glass-card space-y-3 rounded-2xl p-5 text-sm text-gray-200">
            <h2 className="text-base font-semibold text-white">Continuous Posture Monitoring</h2>
            <p>
              Track risk posture changes across prompts, models, and deployment channels with real-time alerting via webhook and Slack.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
