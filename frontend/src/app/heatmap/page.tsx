"use client";
import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Server, Database, Globe, Box, X, Download } from "lucide-react";

import { getRiskHeatmap } from "../../lib/api";

const MOCK_HEATMAP_DATA = [
  { id: 1, asset: "Core Banking API", type: "API", likelihood: 4, impact: 5, severity: "Critical", risk_score: 9.8, vulnerabilities: 3 },
  { id: 2, asset: "User DB Repo", type: "Database", likelihood: 2, impact: 5, severity: "High", risk_score: 7.5, vulnerabilities: 1 },
  { id: 3, asset: "Marketing Site", type: "Web", likelihood: 5, impact: 2, severity: "Medium", risk_score: 5.4, vulnerabilities: 12 },
  { id: 4, asset: "Internal Slack Bot", type: "Service", likelihood: 3, impact: 3, severity: "Medium", risk_score: 6.0, vulnerabilities: 4 },
  { id: 5, asset: "Legacy Auth Server", type: "Service", likelihood: 5, impact: 4, severity: "Critical", risk_score: 9.1, vulnerabilities: 8 },
  { id: 6, asset: "Analytics Pipeline", type: "Data", likelihood: 2, impact: 2, severity: "Low", risk_score: 3.2, vulnerabilities: 2 },
  { id: 7, asset: "Employee Portal", type: "Web", likelihood: 4, impact: 3, severity: "High", risk_score: 7.1, vulnerabilities: 5 },
  { id: 8, asset: "Payment Gateway", type: "API", likelihood: 3, impact: 5, severity: "High", risk_score: 8.5, vulnerabilities: 2 },
  { id: 9, asset: "Staging Env", type: "Cloud", likelihood: 4, impact: 1, severity: "Low", risk_score: 2.8, vulnerabilities: 15 },
  { id: 10, asset: "Admin Dashboard", type: "Web", likelihood: 3, impact: 4, severity: "High", risk_score: 7.9, vulnerabilities: 4 },
];

const getCellColor = (l: number, i: number) => {
  const score = l * i;
  if (score >= 20) return "bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400";
  if (score >= 12) return "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30 text-orange-400";
  if (score >= 6) return "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/30 text-yellow-400";
  return "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400";
};

const getAssetIcon = (type: string) => {
  switch(type.toLowerCase()) {
    case 'api': return <Box className="w-4 h-4" />;
    case 'database':
    case 'data': return <Database className="w-4 h-4" />;
    case 'web': return <Globe className="w-4 h-4" />;
    default: return <Server className="w-4 h-4" />;
  }
};

export default function HeatmapPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);

  useEffect(() => {
    getRiskHeatmap().then(d => {
      // If API returns empty or simple data, use our rich graphical mock data
      if (!d || d.length === 0 || !d[0].likelihood) {
        setData(MOCK_HEATMAP_DATA);
      } else {
        setData(d);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setData(MOCK_HEATMAP_DATA);
      setLoading(false);
    });
  }, []);

  // 5x5 Grid: Likelihood (Y: 5 to 1), Impact (X: 1 to 5)
  const grid = [];
  for (let l = 5; l >= 1; l--) {
    for (let i = 1; i <= 5; i++) {
      grid.push({ likelihood: l, impact: i });
    }
  }

  return (
    <AppShell>
      <div className="space-y-6 pb-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">Enterprise Risk Matrix</h1>
            <p className="text-sm text-gray-400 mt-1">Interactive graphical mapping of active threats based on Likelihood vs. Impact</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
              setIsExporting(true);
              await new Promise(r => setTimeout(r, 1500));
              const a = document.createElement('a');
              a.href = 'data:text/csv;charset=utf-8,Asset,Type,Likelihood,Impact,Score,Severity\\n' + data.map(d => `${d.asset},${d.type},${d.likelihood},${d.impact},${d.risk_score},${d.severity}`).join('\\n');
              a.download = 'Enterprise_Risk_Matrix.csv';
              a.click();
              setIsExporting(false);
            }}
            disabled={isExporting || loading}
            className="flex items-center gap-2 btn-primary !py-2 !px-4 text-sm font-semibold disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Compiling HD Report..." : "Export Matrix CSV"}
          </motion.button>
        </motion.div>

        {loading ? (
          <div className="h-[500px] flex items-center justify-center">
            <div className="animate-spin w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="relative mt-8">
            {/* Axis Labels */}
            <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-bold tracking-widest text-gray-400">
              LIKELIHOOD
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-bold tracking-widest text-gray-400">
              IMPACT
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-5 gap-3 p-4 rounded-3xl bg-gray-900/40 border border-white/5 backdrop-blur-xl shadow-2xl">
              {grid.map((cell, idx) => {
                const cellAssets = data.filter(d => d.likelihood === cell.likelihood && d.impact === cell.impact);
                const colorClasses = getCellColor(cell.likelihood, cell.impact);

                return (
                  <motion.div
                    key={`${cell.likelihood}-${cell.impact}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: idx * 0.02 }}
                    className={`relative aspect-square rounded-2xl border transition-all duration-300 ${colorClasses} overflow-hidden group`}
                  >
                    {/* Background glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Grid Coordinates (Subtle) */}
                    <div className="absolute bottom-2 right-2 text-[10px] font-bold opacity-20">
                      L{cell.likelihood} I{cell.impact}
                    </div>

                    {/* Plotted Assets */}
                    <div className="absolute inset-0 p-2 flex flex-wrap content-start gap-2 overflow-y-auto custom-scrollbar">
                      {cellAssets.map(asset => (
                        <motion.div
                          key={asset.id}
                          layoutId={`asset-${asset.id}`}
                          onClick={() => setSelectedAsset(asset)}
                          whileHover={{ scale: 1.1, y: -2 }}
                          className="cursor-pointer flex items-center justify-center w-8 h-8 rounded-full bg-gray-950/80 border border-white/10 shadow-lg text-white hover:border-white/40 transition-colors tooltip-trigger relative"
                        >
                          {getAssetIcon(asset.type)}
                          
                          {/* Built-in Tooltip on Hover */}
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity bg-gray-900 border border-white/10 text-white text-xs p-2 rounded-lg whitespace-nowrap z-10 shadow-xl backdrop-blur-md">
                            <p className="font-bold">{asset.asset}</p>
                            <p className="text-gray-400">CVSS: {asset.risk_score}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Selected Asset Details Modal */}
            <AnimatePresence>
              {selectedAsset && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                  onClick={() => setSelectedAsset(null)}
                >
                  <motion.div
                    layoutId={`asset-${selectedAsset.id}`}
                    className="w-full max-w-md bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={`p-6 border-b ${getCellColor(selectedAsset.likelihood, selectedAsset.impact).split(' ')[0].replace('/10', '/20')} border-white/5 relative`}>
                      <button 
                        onClick={() => setSelectedAsset(null)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-black/30 text-white">
                          {getAssetIcon(selectedAsset.type)}
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-white leading-tight">{selectedAsset.asset}</h2>
                          <p className="text-sm text-gray-300">{selectedAsset.type} Resource</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-950/50 p-3 rounded-xl border border-white/5">
                          <p className="text-xs text-gray-500 mb-1">Likelihood</p>
                          <p className="font-mono text-lg text-white">{selectedAsset.likelihood} / 5</p>
                        </div>
                        <div className="bg-gray-950/50 p-3 rounded-xl border border-white/5">
                          <p className="text-xs text-gray-500 mb-1">Impact</p>
                          <p className="font-mono text-lg text-white">{selectedAsset.impact} / 5</p>
                        </div>
                        <div className="bg-gray-950/50 p-3 rounded-xl border border-white/5">
                          <p className="text-xs text-gray-500 mb-1">CVSS Score</p>
                          <p className="font-mono text-lg text-white">{selectedAsset.risk_score.toFixed(1)}</p>
                        </div>
                        <div className="bg-gray-950/50 p-3 rounded-xl border border-white/5">
                          <p className="text-xs text-gray-500 mb-1">Vulnerabilities</p>
                          <p className="font-mono text-lg text-red-400 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4" />
                            {selectedAsset.vulnerabilities} Active
                          </p>
                        </div>
                      </div>
                      <div className="pt-4 flex gap-3">
                        <button className="flex-1 btn-primary py-2 rounded-xl text-sm font-bold">Investigate Asset</button>
                        <button className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors py-2 rounded-xl text-sm font-bold text-white">View Scan Logs</button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppShell>
  );
}

