"use client";
import SpecularButton from '../../components/SpecularButton';
import { useState } from "react";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";

import { runSimulation } from "../../lib/api";

export default function SimulatorPage() {
  const [target, setTarget] = useState("api.acme.com/v1/chat");
  const [running, setRunning] = useState(false);
  const [simulation, setSimulation] = useState<any>(null);
  const [patch, setPatch] = useState<any>(null);

  const startSimulation = async () => {
    setRunning(true);
    setSimulation(null);
    setPatch(null);
    try {
      const result = await runSimulation({ target });
      setSimulation(result);
      if (result.patch) {
        setPatch(result.patch);
      }
    } catch (error) {
      console.error(error);
    }
    setRunning(false);
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
            <h1 className="text-2xl font-bold">Autonomous Red/Blue Agents</h1>
            <p className="text-sm text-gray-500 mt-1">Simulate adversarial attacks and generate automated patches</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="nub-card rounded-2xl p-6 border border-white/[0.04] bg-white/[0.01] flex flex-col md:flex-row gap-4 items-end"
        >
          <div className="flex-1 w-full space-y-2">
            <label className="text-sm font-medium text-gray-400">Target Endpoint / Model</label>
            <input 
              type="text" 
              value={target}
              onChange={e => setTarget(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500" 
            />
          </div>
          <SpecularButton 
            onClick={startSimulation}
            disabled={running}
            className="btn-primary !py-2 !px-6 h-[42px] min-w-[140px]"
          >
            {running ? "Simulating..." : "Launch Attack"}
          </SpecularButton>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Red Team Output */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="nub-card rounded-2xl p-6 border border-red-500/20 bg-red-900/5 min-h-[400px]"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-lg font-bold text-red-400">Red Team Agent</h2>
            </div>
            
            {!simulation && !running && (
              <div className="text-gray-500 text-sm text-center py-20">Enter a target and launch the simulation to see adversarial payloads.</div>
            )}
            
            {running && !simulation && (
              <div className="space-y-4">
                <div className="h-4 w-3/4 bg-red-500/10 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-red-500/10 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-red-500/10 rounded animate-pulse" />
              </div>
            )}

            {simulation && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Execution Log</h3>
                  <div className="bg-black/40 border border-white/5 rounded-lg p-3 font-mono text-xs text-gray-300 space-y-1">
                    {simulation.execution_log.map((log: string, i: number) => (
                      <div key={i}>$ {log}</div>
                    ))}
                  </div>
                </div>

                {simulation.findings.map((f: any, i: number) => (
                  <div key={i} className="border border-red-500/30 bg-red-500/10 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-bold text-white">{f.technique}</span>
                      <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded uppercase">{f.severity}</span>
                    </div>
                    <div className="text-sm text-gray-300 mb-2">Payload: <span className="font-mono text-xs bg-black/30 px-1">{f.payload_used}</span></div>
                    <div className="text-sm text-gray-400 italic">Response: {f.simulated_response}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Blue Team Output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="nub-card rounded-2xl p-6 border border-blue-500/20 bg-blue-900/5 min-h-[400px]"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="text-lg font-bold text-blue-400">Blue Team Agent</h2>
            </div>

            {!patch && !running && (
              <div className="text-gray-500 text-sm text-center py-20">Awaiting Red Team findings to generate remediation.</div>
            )}

            {running && !patch && (
              <div className="text-gray-500 text-sm text-center py-20 flex flex-col items-center">
                <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mb-4" />
                Monitoring for breaches...
              </div>
            )}

            {patch && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                  <span className="text-sm text-blue-200">Confidence Score</span>
                  <span className="font-bold text-white">{patch.confidence_score * 100}%</span>
                </div>
                
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Generated Patch Code</h3>
                  <pre className="bg-black/60 border border-white/5 rounded-lg p-4 font-mono text-xs text-blue-300 overflow-x-auto">
                    {patch.patch_code}
                  </pre>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">IaC Infrastructure Update</h3>
                  <pre className="bg-black/60 border border-white/5 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto">
                    {patch.iac_update}
                  </pre>
                </div>
                
                <SpecularButton className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                  Deploy Fix Automatically
                </SpecularButton>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
