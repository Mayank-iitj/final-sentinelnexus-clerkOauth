"use client";
import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";
import { useUser } from "@clerk/nextjs";

import { getTrustScore } from "../../lib/api";

export default function TrustScorePage() {
  const { user } = useUser();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrustScore().then(d => {
      setData(d);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold">Universal AI Trust Score™</h1>
            <p className="text-sm text-gray-500 mt-1">Embeddable Trust Certificate, Public Trust API</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            className="btn-primary !py-2 !px-4 text-sm"
          >
            Regenerate Score
          </motion.button>
        </motion.div>

        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
          </div>
        ) : !data ? (
          <div className="h-[400px] flex flex-col items-center justify-center text-red-400">
            <p>Failed to load trust score data.</p>
            <p className="text-sm text-gray-500 mt-2">Please check your connection or try again later.</p>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Main Score Card */}
              <div className="nub-card rounded-2xl p-8 border border-violet-500/20 bg-violet-900/10 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/20 blur-[50px] rounded-full" />
                <h2 className="text-sm font-medium text-violet-300 mb-2">Overall Score</h2>
                <div className="text-6xl font-bold text-white mb-2 tracking-tight">
                  {data.trust_score}<span className="text-2xl text-gray-500">/1000</span>
                </div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
                  {data.status} Status
                </div>
              </div>

              {/* Breakdown List */}
              <div className="nub-card rounded-2xl p-6 border border-white/[0.04] bg-white/[0.01]">
                <h3 className="text-lg font-medium text-white mb-4">Score Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-sm text-gray-400">Security Posture</span>
                    <span className="font-medium">{data.breakdown.security_posture} <span className="text-xs text-gray-600">/ 400</span></span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-sm text-gray-400">Vendor Risk</span>
                    <span className="font-medium">{data.breakdown.vendor_risk} <span className="text-xs text-gray-600">/ 200</span></span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-sm text-gray-400">Compliance & Policy</span>
                    <span className="font-medium">{data.breakdown.compliance} <span className="text-xs text-gray-600">/ 200</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Threat Intelligence</span>
                    <span className="font-medium">{data.breakdown.threat_intel} <span className="text-xs text-gray-600">/ 200</span></span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="nub-card rounded-2xl p-6 border border-white/[0.04] bg-white/[0.01] mt-4"
            >
              <h3 className="text-lg font-medium text-white mb-4">Recent Penalties Applied</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.recent_changes.map((change: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-red-900/10 border border-red-500/10">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold">
                      {change.impact}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{change.factor} Decay</p>
                      <p className="text-xs text-gray-500">Applied log-decay algorithm penalty</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </AppShell>
  );
}
