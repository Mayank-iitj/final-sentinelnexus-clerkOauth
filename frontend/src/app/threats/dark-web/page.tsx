"use client";
import { useState, useEffect } from "react";
import { AppShell } from "../../../components/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { getDarkWebMentions, scanDarkWeb } from "../../../lib/api";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45 } } };

export default function DarkWebPage() {
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [domain, setDomain] = useState("sentinelnexus.com");
  const [loading, setLoading] = useState(true);

  const fetchMentions = async () => {
    try {
      const data = await getDarkWebMentions();
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentions();
  }, []);

  const handleScan = async () => {
    if (!domain) return;
    setIsScanning(true);
    try {
      await scanDarkWeb(domain);
      // Wait for background task to populate DB (usually 2-3 seconds for OTX)
      setTimeout(async () => {
        await fetchMentions();
        setIsScanning(false);
      }, 3500);
    } catch (err) {
      console.error(err);
      setIsScanning(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-violet-500">🕸</span> Dark Web OSINT Monitor
            </h1>
            <p className="text-sm text-gray-500 mt-1">Continuous scanning of deep/dark web forums, marketplaces, and AlienVault OTX feeds.</p>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Target Domain (e.g. example.com)"
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
            />
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              onClick={handleScan}
              disabled={isScanning || !domain}
              className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50 min-w-[140px]"
            >
              {isScanning ? "Scanning OSINT..." : "Force Scan"}
            </motion.button>
          </div>
        </motion.div>
        
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Critical Intelligence Pulses</div>
            <div className="text-3xl font-bold tracking-tight text-red-400 mt-1">
              {results.filter(r => r.severity === 'critical').length}
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">High Severity Mentions</div>
            <div className="text-3xl font-bold tracking-tight text-amber-400 mt-1">
              {results.filter(r => r.severity === 'high').length}
            </div>
          </motion.div>
          <motion.div variants={fadeUp} className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01]">
            <div className="text-xs text-gray-500 font-medium">Resolved Mentions</div>
            <div className="text-3xl font-bold tracking-tight text-emerald-400 mt-1">
              {results.filter(r => r.is_resolved).length}
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="nub-card rounded-2xl p-5 border border-white/[0.04] bg-white/[0.01] mt-6 overflow-hidden min-h-[300px]"
        >
          {loading ? (
             <div className="flex items-center justify-center h-48">
               <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
             </div>
          ) : results.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-48 text-gray-500">
               <p>No dark web mentions found for this account.</p>
               <p className="text-xs mt-2">Enter a domain and click Force Scan to query OSINT feeds.</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] text-xs text-gray-500">
                    <th className="pb-3 font-medium">Source</th>
                    <th className="pb-3 font-medium">Date Discovered</th>
                    <th className="pb-3 font-medium">Intelligence Snippet</th>
                    <th className="pb-3 font-medium">Threat Actor</th>
                    <th className="pb-3 font-medium">Severity</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <AnimatePresence>
                    {results.map((r, i) => (
                      <motion.tr 
                        key={r.id || i}
                        initial={{ opacity: 0, bg: "rgba(255,255,255,0.1)" }}
                        animate={{ opacity: 1, bg: "transparent" }}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 border-b border-white/[0.02] whitespace-nowrap">{r.source_forum}</td>
                        <td className="py-3 border-b border-white/[0.02] font-mono text-gray-400 text-xs whitespace-nowrap">
                          {new Date(r.discovered_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 border-b border-white/[0.02] max-w-md truncate pr-4 text-gray-300" title={r.snippet}>{r.snippet}</td>
                        <td className="py-3 border-b border-white/[0.02] text-gray-400">{r.threat_actor}</td>
                        <td className="py-3 border-b border-white/[0.02] font-semibold">
                          <span className={`px-2 py-1 rounded text-xs ${
                            r.severity === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                            r.severity === 'high' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {r.severity.toUpperCase()}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </AppShell>
  );
}
