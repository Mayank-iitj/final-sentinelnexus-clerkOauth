"use client";
import { useState, useEffect } from "react";
import { AppShell } from "../../../components/AppShell";
import { motion, AnimatePresence } from "framer-motion";

// Mock fetch to backend threat models (ThreatPrediction)
const generateZeroDayIntel = () => {
  const intelTypes = ["Prompt Injection", "Model Inversion", "Supply Chain Subversion", "Data Poisoning"];
  const impacts = ["critical", "high", "medium"];
  return {
    id: Math.random().toString(36).substring(7),
    threat_type: intelTypes[Math.floor(Math.random() * intelTypes.length)],
    description: `Automated telemetry detected anomalous parameter extraction attempts on model endpoint. Correlates with zero-day exploit CVE-2026-TBD.`,
    confidence_score: (Math.random() * (0.99 - 0.75) + 0.75).toFixed(2),
    impact_level: impacts[Math.floor(Math.random() * impacts.length)],
    mitigation_strategy: "Isolate affected LLM nodes. Inject counter-prompt validation filters.",
    timestamp: new Date().toLocaleTimeString()
  };
};

export default function ThreatsZeroDayPage() {
  const [intelStream, setIntelStream] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    if (!isScanning) return;
    
    // Initial data
    setIntelStream([generateZeroDayIntel(), generateZeroDayIntel()]);

    const interval = setInterval(() => {
      setIntelStream(prev => {
        const newIntel = generateZeroDayIntel();
        return [newIntel, ...prev].slice(0, 10); // Keep last 10
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isScanning]);

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
            <h1 className="text-2xl font-bold">Zero-Day Prediction Engine</h1>
            <p className="text-sm text-gray-500 mt-1">Live autonomous threat intelligence streaming</p>
          </div>
          <div className="flex gap-2 items-center">
            <span className="flex items-center gap-2 text-xs font-bold text-green-400 mr-4">
              <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
              {isScanning ? 'LIVE MONITORING' : 'PAUSED'}
            </span>
            <motion.button 
              onClick={() => setIsScanning(!isScanning)}
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              className={`${isScanning ? 'bg-white/10 hover:bg-white/20' : 'bg-violet-600 hover:bg-violet-700'} text-white rounded-lg px-4 py-2 text-sm font-medium transition-all`}
            >
              {isScanning ? 'Halt Scanner' : 'Resume Scanner'}
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Terminal Feed */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 nub-card rounded-2xl p-6 border border-white/[0.04] bg-[#0A0A0A] min-h-[600px] flex flex-col font-mono"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <h2 className="text-sm font-bold text-violet-400 flex items-center gap-2">
                <span>&gt;_</span> GLOBAL_THREAT_TELEMETRY_FEED
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              <AnimatePresence>
                {intelStream.map((intel) => (
                  <motion.div 
                    key={intel.id}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0 }}
                    className="p-4 border border-white/5 rounded-lg bg-white/[0.02]"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        intel.impact_level === 'critical' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                        intel.impact_level === 'high' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' :
                        'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                      }`}>
                        {intel.impact_level} IMPACT
                      </span>
                      <span className="text-gray-500 text-xs">[{intel.timestamp}]</span>
                    </div>
                    <h3 className="text-white font-bold text-sm mb-1">{intel.threat_type}</h3>
                    <p className="text-gray-400 text-xs leading-relaxed mb-3">
                      {intel.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-violet-400 font-bold">
                        CONFIDENCE: {(intel.confidence_score * 100).toFixed(0)}%
                      </span>
                      <span className="text-gray-600">|</span>
                      <span className="text-gray-300">
                        <span className="text-gray-500">MITIGATION: </span>{intel.mitigation_strategy}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right Metrics Panel */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="nub-card rounded-2xl p-6 border border-white/[0.04] bg-white/[0.01]"
            >
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-4">Neural Engine Status</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">Predictive Accuracy</span>
                    <span className="text-green-400">94.2%</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1"><div className="bg-green-500 h-1 rounded-full w-[94.2%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">Global Sensors</span>
                    <span className="text-violet-400">14,205 Active</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1"><div className="bg-violet-500 h-1 rounded-full w-[100%]" /></div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="nub-card rounded-2xl p-6 border border-white/[0.04] bg-white/[0.01]"
            >
              <h3 className="text-xs font-semibold text-gray-400 uppercase mb-4">Top Vectors (24h)</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex justify-between items-center">
                  <span className="text-gray-300">Prompt Injection</span>
                  <span className="text-white font-bold">42%</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-300">Data Poisoning</span>
                  <span className="text-white font-bold">28%</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-gray-300">Model Inversion</span>
                  <span className="text-white font-bold">15%</span>
                </li>
              </ul>
            </motion.div>
          </div>
          
        </div>
      </div>
    </AppShell>
  );
}
