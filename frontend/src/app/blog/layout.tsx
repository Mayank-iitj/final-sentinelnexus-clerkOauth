import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'The latest insights in AI security, prompt engineering safety, and compliance automation from the SentinelNexus team.',
  alternates: {
    canonical: '/blog',
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
