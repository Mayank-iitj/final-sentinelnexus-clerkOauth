"use client";
import { useState, useEffect } from "react";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";

// Mock fetch to digital_twin.py backend response
const fetchDigitalTwinTopology = async () => {
  await new Promise(r => setTimeout(r, 1100));
  return {
    nodes: [
      { id: "vendor_1", label: "OpenAI API", type: "vendor", risk: "high", blast_radius: 0 },
      { id: "asset_1", label: "Customer Chatbot", type: "asset", risk: "medium", blast_radius: 0 },
      { id: "asset_2", label: "Internal RAG Tool", type: "asset", risk: "high", blast_radius: 0 },
      { id: "vuln_1", label: "Vuln: Context Overflow", type: "vulnerability", risk: "critical", blast_radius: 2 },
      { id: "vuln_2", label: "Vuln: PII Leak", type: "vulnerability", risk: "high", blast_radius: 1 }
    ],
    edges: [
      { source: "vendor_1", target: "asset_1", type: "provides" },
      { source: "vendor_1", target: "asset_2", type: "provides" },
      { source: "vuln_1", target: "asset_1", type: "affects" },
      { source: "vuln_2", target: "asset_2", type: "affects" }
    ],
    metadata: {
      total_nodes: 5,
      total_edges: 4,
      max_blast_radius: 2
    }
  };
};

export default function DigitalTwinPage() {
  const [topology, setTopology] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeNode, setActiveNode] = useState<any>(null);

  useEffect(() => {
    fetchDigitalTwinTopology().then(d => {
      setTopology(d);
      setLoading(false);
    });
  }, []);

  const getNodeColor = (type: string, risk: string) => {
    if (type === "vulnerability") {
      return risk === "critical" ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]" : "bg-orange-500";
    }
    if (type === "vendor") return "bg-blue-500";
    return "bg-violet-500";
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
            <h1 className="text-2xl font-bold">Digital Twin Attack Graph</h1>
            <p className="text-sm text-gray-500 mt-1">Live blast radius topology mapping (Vendor → Asset → Vulnerability)</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            className="btn-primary !py-2 !px-4 text-sm"
          >
            Run Topology Scan
          </motion.button>
        </motion.div>

        {loading ? (
          <div className="h-[500px] flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Visual Graph Simulation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-3 nub-card rounded-2xl p-6 border border-white/[0.04] bg-white/[0.01] h-[600px] relative overflow-hidden"
            >
              <div className="absolute top-4 left-4 flex gap-4 text-xs font-medium">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /> Third-Party Vendor</span>
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-500" /> Internal Asset</span>
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /> Active Vulnerability</span>
              </div>
              
              {/* Simulated Graph Layout (Manual absolute positioning for demo) */}
              <div className="absolute inset-0 flex items-center justify-center mt-8">
                
                {/* Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                  <path d="M 20% 50% Q 50% 30% 50% 30%" stroke="currentColor" strokeWidth="2" fill="none" className="text-blue-500" />
                  <path d="M 20% 50% Q 50% 70% 50% 70%" stroke="currentColor" strokeWidth="2" fill="none" className="text-blue-500" />
                  
                  <path d="M 50% 30% Q 80% 30% 80% 30%" stroke="currentColor" strokeWidth="2" fill="none" className="text-red-500" />
                  <path d="M 50% 70% Q 80% 70% 80% 70%" stroke="currentColor" strokeWidth="2" fill="none" className="text-red-500" />
                </svg>

                {/* Nodes */}
                <div 
                  className={`absolute left-[20%] top-[50%] -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full ${getNodeColor("vendor", "")} flex items-center justify-center text-xs font-bold text-center cursor-pointer transition-transform hover:scale-110`}
                  onClick={() => setActiveNode(topology.nodes[0])}
                >
                  OpenAI
                </div>

                <div 
                  className={`absolute left-[50%] top-[30%] -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full ${getNodeColor("asset", "")} flex items-center justify-center text-xs font-bold text-center p-2 cursor-pointer transition-transform hover:scale-110`}
                  onClick={() => setActiveNode(topology.nodes[1])}
                >
                  Customer Chatbot
                </div>
                
                <div 
                  className={`absolute left-[50%] top-[70%] -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full ${getNodeColor("asset", "")} flex items-center justify-center text-xs font-bold text-center p-2 cursor-pointer transition-transform hover:scale-110`}
                  onClick={() => setActiveNode(topology.nodes[2])}
                >
                  Internal RAG
                </div>

                <div 
                  className={`absolute left-[80%] top-[30%] -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full ${getNodeColor("vulnerability", "critical")} flex items-center justify-center text-xs font-bold text-center p-2 cursor-pointer transition-transform hover:scale-110 animate-pulse`}
                  onClick={() => setActiveNode(topology.nodes[3])}
                >
                  Context Overflow
                </div>

                <div 
                  className={`absolute left-[80%] top-[70%] -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full ${getNodeColor("vulnerability", "high")} flex items-center justify-center text-xs font-bold text-center p-2 cursor-pointer transition-transform hover:scale-110`}
                  onClick={() => setActiveNode(topology.nodes[4])}
                >
                  PII Leak
                </div>
              </div>
            </motion.div>

            {/* Side Panel: Node Inspector */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 nub-card rounded-2xl p-6 border border-white/[0.04] bg-white/[0.01] h-[600px] flex flex-col"
            >
              <h2 className="text-lg font-bold text-white mb-6">Node Inspector</h2>
              
              {!activeNode ? (
                <div className="flex-1 flex items-center justify-center text-sm text-gray-500 text-center">
                  Click on any node in the topology graph to view blast radius details.
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase">Entity Label</h3>
                    <p className="text-lg font-bold text-white mt-1">{activeNode.label}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase">Type</h3>
                    <p className="text-sm text-white mt-1 capitalize">{activeNode.type}</p>
                  </div>

                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase">Risk Level</h3>
                    <p className={`text-sm mt-1 uppercase font-bold ${activeNode.risk === 'critical' ? 'text-red-500' : 'text-orange-500'}`}>
                      {activeNode.risk}
                    </p>
                  </div>

                  {activeNode.type === "vulnerability" && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mt-4">
                      <h3 className="text-sm font-bold text-red-400 mb-1">Calculated Blast Radius</h3>
                      <p className="text-2xl font-black text-white">{activeNode.blast_radius} <span className="text-sm font-normal text-gray-400">assets impacted</span></p>
                      <button className="w-full mt-4 bg-red-600 hover:bg-red-700 text-white rounded py-2 text-xs font-bold">
                        Quarantine Upstream
                      </button>
                    </div>
                  )}
                  
                  {activeNode.type === "vendor" && (
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mt-4">
                      <h3 className="text-sm font-bold text-blue-400 mb-1">Supply Chain Context</h3>
                      <p className="text-sm text-gray-300">This vendor feeds data into {topology.edges.filter((e:any) => e.source === activeNode.id).length} internal assets.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
