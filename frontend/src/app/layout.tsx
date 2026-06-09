import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { Providers } from "../components/Providers";
import { SplashScreen } from "../components/SplashScreen";
import { SOCIAL_LINKS } from "../lib/social-links";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://sentinelnexus.mayankiitj.in"),
  title: {
    default: "SentinelNexus | AI Security & Risk Intelligence Platform",
    template: "%s | SentinelNexus",
  },
  description:
    "SentinelNexus provides enterprise-grade AI security. Protect LLM workflows with real-time prompt injection defense, PII detection, and compliance automation.",
  keywords: [
    "AI Security",
    "SentinelNexus",
    "Prompt Injection Defense",
    "LLM Guardrails",
    "PII Detection",
    "AI Compliance",
    "CVSS Scoring",
    "AI Risk Management",
    "Generative AI Security",
  ],
  authors: [{ name: "Mayank Sharma", url: "https://mayankiitj.in" }],
  creator: "Mayank Sharma",
  publisher: "SentinelNexus",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sentinelnexus.mayankiitj.in",
    siteName: "SentinelNexus",
    title: "SentinelNexus | AI Security & Risk Intelligence",
    description: "The world's first comprehensive AI security and compliance platform for enterprise LLM workflows.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        alt: "SentinelNexus AI Security",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SentinelNexus | AI Security & Risk Intelligence",
    description: "Real-time AI guardrails and compliance automation for modern enterprises.",
    images: ["/og-image.png"],
    creator: "@mayankiitj",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  manifest: "/manifest.webmanifest",
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "SentinelNexus",
  "url": "https://sentinelnexus.mayankiitj.in",
  "logo": "https://sentinelnexus.mayankiitj.in/favicon.png",
  "description": "Enterprise-grade AI security and compliance platform.",
  "founder": {
    "@type": "Person",
    "name": "Mayank Sharma"
  },
  "sameAs": [
    SOCIAL_LINKS.linkedin,
    SOCIAL_LINKS.instagram,
    SOCIAL_LINKS.github,
    SOCIAL_LINKS.website,
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "SentinelNexus",
  "url": "https://sentinelnexus.mayankiitj.in",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://sentinelnexus.mayankiitj.in/docs?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
const isTestClerkKey = clerkPublishableKey.startsWith("pk_test_");
const isLiveClerkKey = clerkPublishableKey.startsWith("pk_live_");
const siteUrlHost = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL).hostname.toLowerCase()
  : "";
const isAllowedLiveHost =
  siteUrlHost === "mayankiitj.in" || siteUrlHost.endsWith(".mayankiitj.in");
const hasUsableClerkPublishableKey = isTestClerkKey || (isLiveClerkKey && isAllowedLiveHost);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <Script
          src="https://unpkg.com/@dotlottie/player-component@2.7.12/dist/dotlottie-player.mjs"
          type="module"
          strategy="beforeInteractive"
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <SplashScreen />
        <ClerkProvider publishableKey={hasUsableClerkPublishableKey ? clerkPublishableKey : "pk_test_ZHVtbXkua2V5LmNsZXJrLmFjY291bnRzLmRldiQ"}>
          {hasUsableClerkPublishableKey ? (
            <header className="fixed top-4 right-20 z-50 flex items-center gap-4">
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-700">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-violet-500/20">
                    Sign Up
                  </button>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <UserButton />
              </Show>
            </header>
          ) : (
            <header className="fixed top-4 right-20 z-50 rounded-lg border border-amber-400/25 bg-amber-300/10 px-4 py-2 text-xs font-medium text-amber-200 backdrop-blur-sm">
              Auth disabled: use pk_test locally or mayankiitj.in with pk_live
            </header>
          )}
          <Providers>{children}</Providers>
        </ClerkProvider>
        <Link
          href={SOCIAL_LINKS.website}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-4 right-4 z-40 rounded-full border border-violet-400/25 bg-black/60 px-4 py-2 text-xs font-medium tracking-wide text-violet-200/80 backdrop-blur-xl transition-all duration-300 hover:border-violet-400/50 hover:bg-violet-500/15 hover:text-white hover:shadow-[0_0_30px_rgba(124,58,237,.3)] hover:-translate-y-0.5"
        >
          Founded by Mayank Sharma
        </Link>
      </body>
    </html>
  );
}
