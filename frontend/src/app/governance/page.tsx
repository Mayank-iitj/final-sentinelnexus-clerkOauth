"use client";
import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";

import { getGovernanceDashboard } from "../../lib/api";

export default function GovernancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGovernanceDashboard().then(d => {
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
            <h1 className="text-2xl font-bold">Autonomous AI Governance</h1>
            <p className="text-sm text-gray-500 mt-1">Asset inventory, vendor risk management, and compliance enforcement</p>
          </div>
          <div className="flex gap-2">
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              className="btn-secondary !py-2 !px-4 text-sm"
            >
              Export Audit Log
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              className="btn-primary !py-2 !px-4 text-sm"
            >
              Add New Asset
            </motion.button>
          </div>
        </motion.div>

        {loading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="nub-card rounded-2xl p-6 border border-white/[0.04] bg-white/[0.01]">
                <h3 className="text-gray-400 text-sm font-medium">Total Tracked Assets</h3>
                <p className="text-3xl font-black text-white mt-2">{data.metrics.total_assets}</p>
              </motion.div>
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="nub-card rounded-2xl p-6 border border-white/[0.04] bg-white/[0.01]">
                <h3 className="text-gray-400 text-sm font-medium">Compliant Assets</h3>
                <p className="text-3xl font-black text-green-400 mt-2">{data.metrics.compliant_assets} / {data.metrics.total_assets}</p>
              </motion.div>
              <motion.div initial={{opacity:0, y:10}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="nub-card rounded-2xl p-6 border border-white/[0.04] bg-white/[0.01]">
                <h3 className="text-gray-400 text-sm font-medium">High Risk Vendors</h3>
                <p className="text-3xl font-black text-red-500 mt-2">{data.metrics.high_risk_vendors}</p>
              </motion.div>
            </div>

            {/* Split Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Asset Inventory */}
              <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:0.4}} className="nub-card rounded-2xl p-6 border border-white/[0.04] bg-white/[0.01]">
                <h2 className="text-lg font-bold text-white mb-4">Internal Asset Inventory</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-400">
                        <th className="pb-3 font-medium">Asset Name</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Compliance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.assets.map((asset: any) => (
                        <tr key={asset.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 font-medium text-white">{asset.name}</td>
                          <td className="py-3 text-gray-400">{asset.type}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${asset.compliance === 'Pass' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                              {asset.compliance}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* Vendor Supply Chain Risk */}
              <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1,scale:1}} transition={{delay:0.5}} className="nub-card rounded-2xl p-6 border border-white/[0.04] bg-white/[0.01]">
                <h2 className="text-lg font-bold text-white mb-4">Third-Party Vendor Risk</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-400">
                        <th className="pb-3 font-medium">Vendor</th>
                        <th className="pb-3 font-medium">Service</th>
                        <th className="pb-3 font-medium">Trust Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.vendors.map((vendor: any) => (
                        <tr key={vendor.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 font-medium text-white">{vendor.name}</td>
                          <td className="py-3 text-gray-400">{vendor.service}</td>
                          <td className="py-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${vendor.trust_score >= 800 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                              {vendor.trust_score}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
