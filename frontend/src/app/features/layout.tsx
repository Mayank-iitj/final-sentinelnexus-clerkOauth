import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Explore SentinelNexus enterprise-grade AI security features including prompt defense, SAST, and PII scanning.',
  alternates: {
    canonical: '/features',
  },
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
