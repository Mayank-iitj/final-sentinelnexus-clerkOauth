'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import MagicBento from '../../components/MagicBento/MagicBento';

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function ProjectShowcasePage() {
  return (
    <main className="mesh-background min-h-screen text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/35 backdrop-blur-xl">
        <div className="section-shell flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/favicon.png" alt="SentinelNexus" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-display text-lg font-semibold">SentinelNexus</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-full border border-white/20 px-4 py-2 text-sm text-gray-200 hover:border-violet-400 hover:text-white transition"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="hidden sm:inline-flex rounded-full bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <section className="section-shell pt-16 pb-12 text-center">
        <Reveal>
          <h1 className="font-display text-4xl font-extrabold sm:text-5xl">
            Featured <span className="gradient-word">Projects</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            Explore our showcase of powerful security scanning and AI defense capabilities in action.
          </p>
        </Reveal>
      </section>

      <section className="section-shell pb-20">
        <Reveal>
          <div className="py-12">
            <MagicBento
              enableStars={true}
              enableSpotlight={true}
              enableBorderGlow={true}
              enableTilt={false}
              glowColor="132, 0, 255"
              clickEffect={true}
              enableMagnetism={true}
              textAutoHide={true}
            />
          </div>
        </Reveal>
      </section>

      <section className="section-shell pb-20 text-center">
        <Reveal>
          <div className="glass-card violet-glow rounded-2xl p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-3">Ready to explore our platform?</h2>
            <p className="text-sm text-gray-300 mb-6">
              See how SentinelNexus secures your code and AI workflows.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/features"
                className="rounded-full border border-white/20 px-8 py-3 text-sm font-semibold text-white hover:border-violet-400 transition"
              >
                View All Features
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-violet-600 px-8 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
