"use client";
import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";

import { getRiskHeatmap } from "../../lib/api";

export default function HeatmapPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    getRiskHeatmap().then(d => {
      setData(d);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const getSeverityColor = (score: number) => {
    if (score >= 9.0) return "bg-red-500/20 border-red-500/50 text-red-400";
    if (score >= 7.0) return "bg-orange-500/20 border-orange-500/50 text-orange-400";
    if (score >= 4.0) return "bg-yellow-500/20 border-yellow-500/50 text-yellow-400";
    return "bg-green-500/20 border-green-500/50 text-green-400";
  };

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
            <h1 className="text-2xl font-bold">Enterprise Risk Heatmap</h1>
            <p className="text-sm text-gray-500 mt-1">CVSS-weighted asset vulnerability mapping</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
              setIsExporting(true);
              await new Promise(r => setTimeout(r, 2000));
              // Simulate downloading CSV
              const a = document.createElement('a');
              a.href = 'data:text/csv;charset=utf-8,Asset,Type,Score,Severity\\n' + data.map(d => `${d.asset},${d.type},${d.risk_score},${d.severity}`).join('\\n');
              a.download = 'Heatmap_Risk_Export.csv';
              a.click();
              setIsExporting(false);
            }}
            disabled={isExporting || loading || data.length === 0}
            className="btn-primary !py-2 !px-4 text-sm disabled:opacity-50"
          >
            {isExporting ? "Compiling CSV..." : "Export Report"}
          </motion.button>
        </motion.div>

        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="h-[400px] flex flex-col items-center justify-center text-gray-500">
            <p>No risk data available.</p>
            <p className="text-sm mt-2">Unable to connect to the backend API. Please try again later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className={`nub-card rounded-2xl p-6 border ${getSeverityColor(item.risk_score).replace('text-', 'shadow-')} transition-all hover:scale-[1.02] cursor-pointer`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{item.asset}</h3>
                    <p className="text-xs text-gray-400">{item.type}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold border ${getSeverityColor(item.risk_score)}`}>
                    CVSS {item.risk_score.toFixed(1)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Severity</span>
                    <span className={`font-medium ${getSeverityColor(item.risk_score).split(' ')[2]}`}>
                      {item.severity}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Active Vulnerabilities</span>
                    <span className="text-white font-medium">{item.vulnerabilities}</span>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${getSeverityColor(item.risk_score).split(' ')[0].replace('/20', '')}`}
                      style={{ width: `${(item.risk_score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
