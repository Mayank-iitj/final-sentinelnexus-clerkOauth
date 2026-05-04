import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Flexible pricing plans for SentinelNexus AI security platform. Start free or upgrade for enterprise controls.',
  alternates: {
    canonical: '/pricing',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
