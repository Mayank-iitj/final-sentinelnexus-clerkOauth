"use client";
import SpecularButton from '../../components/SpecularButton';
import { useState } from "react";
import { AppShell } from "../../components/AppShell";
import { motion } from "framer-motion";
import { Terminal, TypingAnimation, AnimatedSpan } from "../../components/Terminal";

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
            className="w-full"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <h2 className="text-lg font-bold text-red-400">Red Team Agent</h2>
            </div>
            
            <Terminal className="max-w-none h-[500px]">
              {!simulation && !running && (
                <TypingAnimation delay={0}>&gt; Awaiting target configuration...</TypingAnimation>
              )}
              
              {running && !simulation && (
                <>
                  <TypingAnimation delay={0}>{`> root@sentinel --target ${target}`}</TypingAnimation>
                  <AnimatedSpan show={true} delay={500} className="text-green-500">
                    ✔ Preflight checks complete.
                  </AnimatedSpan>
                  <AnimatedSpan show={true} delay={1000} className="text-green-500">
                    ✔ Target acquired: {target}
                  </AnimatedSpan>
                  <AnimatedSpan show={true} delay={1500} className="text-green-500">
                    ✔ Initializing reconnaissance modules...
                  </AnimatedSpan>
                  <TypingAnimation delay={2500} className="text-gray-400">
                    &gt; Executing payloads...
                  </TypingAnimation>
                </>
              )}

              {simulation && (
                <>
                  <TypingAnimation delay={0}>{`> root@sentinel --target ${target}`}</TypingAnimation>
                  <AnimatedSpan show={true} delay={300} className="text-green-500">
                    ✔ Target acquired: {target}
                  </AnimatedSpan>
                  
                  {simulation.execution_log.map((log: string, i: number) => (
                    <AnimatedSpan show={true} delay={600 + i * 200} key={`log-${i}`} className="text-gray-400">
                      <span>[*] {log}</span>
                    </AnimatedSpan>
                  ))}

                  {simulation.findings.map((f: any, i: number) => (
                    <AnimatedSpan show={true} delay={1000 + (simulation.execution_log.length * 200) + (i * 600)} key={`finding-${i}`} className="text-red-400 mt-4 flex flex-col gap-1">
                      <span>&gt; injecting payload: <span className="text-white bg-red-900/40 px-1 py-0.5 rounded">{f.technique}</span></span>
                      <span className="text-xs text-gray-500 pl-4">{f.payload_used}</span>
                      <span className="text-violet-400 font-bold pl-4 uppercase">[+] VULNERABILITY EXPLOITED - {f.severity} RISK</span>
                    </AnimatedSpan>
                  ))}

                  <TypingAnimation delay={1500 + (simulation.execution_log.length * 200) + (simulation.findings.length * 600)} className="text-blue-500 mt-4">
                    &gt; Handing off to Blue Team Agent for autonomous remediation...
                  </TypingAnimation>
                </>
              )}
            </Terminal>
          </motion.div>

          {/* Blue Team Output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
              <h2 className="text-lg font-bold text-blue-400">Blue Team Agent</h2>
            </div>

            <Terminal className="max-w-none h-[500px]">
              {!patch && !running && (
                <TypingAnimation delay={0} className="text-gray-500">&gt; Awaiting Red Team findings to generate remediation.</TypingAnimation>
              )}

              {running && !patch && (
                <>
                  <TypingAnimation delay={0} className="text-blue-400">&gt; sentinel-blue-team --monitor</TypingAnimation>
                  <AnimatedSpan show={true} delay={1000} className="text-gray-400">
                    [*] Monitoring for breaches...
                  </AnimatedSpan>
                </>
              )}

              {patch && (
                <>
                  <TypingAnimation delay={0} className="text-blue-400">&gt; sentinel-blue-team --analyze-findings</TypingAnimation>
                  <AnimatedSpan show={true} delay={500} className="text-green-500">
                    ✔ Anomalies detected from Red Team payload
                  </AnimatedSpan>
                  <AnimatedSpan show={true} delay={1000} className="text-green-500">
                    ✔ Generating Abstract Syntax Tree (AST) for vulnerable code
                  </AnimatedSpan>
                  <AnimatedSpan show={true} delay={1500} className="text-green-500">
                    ✔ AI confidently proposes patch (Confidence: {patch.confidence_score * 100}%)
                  </AnimatedSpan>
                  
                  <AnimatedSpan show={true} delay={2000} className="text-blue-300 mt-4 flex flex-col gap-2">
                    <span>&gt; Compiled Patch Code:</span>
                    <pre className="bg-black/60 border border-white/5 rounded-lg p-3 font-mono text-xs overflow-x-auto text-blue-200">
                      {patch.patch_code}
                    </pre>
                  </AnimatedSpan>

                  <AnimatedSpan show={true} delay={2500} className="text-gray-300 mt-4 flex flex-col gap-2">
                    <span>&gt; Compiled IaC Update:</span>
                    <pre className="bg-black/60 border border-white/5 rounded-lg p-3 font-mono text-xs overflow-x-auto text-gray-400">
                      {patch.iac_update}
                    </pre>
                  </AnimatedSpan>

                  <AnimatedSpan show={true} delay={3500} className="mt-4">
                    <SpecularButton className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Deploy Fix Automatically
                    </SpecularButton>
                  </AnimatedSpan>
                </>
              )}
            </Terminal>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
