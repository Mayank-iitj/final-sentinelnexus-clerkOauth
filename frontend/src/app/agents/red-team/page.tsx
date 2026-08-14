"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import SpecularButton from '../../../components/SpecularButton';
import { AppShell } from "../../../components/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import '../../../components/HackerEffects.css';

// 1. Hex Dump Utility
const convertToHexDump = (text: string) => {
  let hexDump = "";
  for (let i = 0; i < text.length; i += 16) {
    const chunk = text.slice(i, i + 16);
    const hex = Array.from(chunk).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
    const ascii = chunk.replace(/[^\x20-\x7E]/g, '.');
    const offset = i.toString(16).padStart(8, '0');
    hexDump += `${offset}  ${hex.padEnd(48, ' ')}  |${ascii}|\n`;
  }
  return hexDump;
};

// 4. Interactive Attack Graph Component
const KillChainGraph = ({ stage }: { stage: number }) => {
  const nodes = ['EXTERNAL_IP', 'WAF_GATEWAY', 'WEB_SERVER', 'INTERNAL_DB'];
  return (
    <div className="flex items-center justify-between mt-2 p-2 bg-[#0F0]/5 border border-[#0F0]/20 rounded">
      {nodes.map((node, idx) => {
        const isCompromised = stage >= idx;
        const color = isCompromised ? 'text-red-500' : 'text-[#0F0]';
        const borderColor = isCompromised ? 'border-red-500' : 'border-[#0F0]/50';
        return (
          <div key={node} className="flex items-center flex-1 last:flex-none">
            <motion.div 
              animate={{ scale: isCompromised ? [1, 1.2, 1] : 1 }}
              className={`p-2 border ${borderColor} ${color} text-[10px] font-bold`}
            >
              {node}
            </motion.div>
            {idx < nodes.length - 1 && (
              <div className={`h-px flex-1 mx-2 ${isCompromised ? 'bg-red-500' : 'bg-[#0F0]/30'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function RedTeamPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "> INITIALIZING RED TEAM AI...\n> I am SentinelNexus Red Team AI. Target acquired. What adversarial campaign would you like me to simulate today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [networkLogs, setNetworkLogs] = useState<string[]>([]);
  const [payloadLogs, setPayloadLogs] = useState<string[]>([]);
  
  const [isGlitching, setIsGlitching] = useState(false);
  const [killChainStage, setKillChainStage] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const networkLogsEndRef = useRef<HTMLDivElement>(null);
  const payloadLogsEndRef = useRef<HTMLDivElement>(null);
  
  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    // Initialize Web Audio API on first mount
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioCtxRef.current?.close();
    };
  }, []);

  // 3. Sound Engine
  const playTypingSound = useCallback(() => {
    if (isMuted || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(150 + Math.random() * 50, ctx.currentTime);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }, [isMuted]);

  const playSuccessBlip = useCallback(() => {
    if (isMuted || !audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }, [isMuted]);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    networkLogsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    payloadLogsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, networkLogs, payloadLogs]);

  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      const ports = [80, 443, 22, 3306, 8080];
      const statuses = ['200 OK', '404 NOT FOUND', '403 FORBIDDEN', '500 INTERNAL ERROR'];
      const actions = ['GET /', 'POST /login', 'GET /admin.php', 'PROPFIND /', 'GET /.git/config'];
      const log = `[+] TCP:${ports[Math.floor(Math.random() * ports.length)]} - ${actions[Math.floor(Math.random() * actions.length)]} -> ${statuses[Math.floor(Math.random() * statuses.length)]}`;
      setNetworkLogs(prev => [...prev.slice(-40), log]);
    }, 400);
    return () => clearInterval(interval);
  }, [isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    // Ensure audio context is resumed on user interaction
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setNetworkLogs(prev => [...prev, `\n[*] EXECUTING OPERATOR COMMAND: ${input}`]);
    setPayloadLogs(prev => [...prev, `\n[!] PREPARING PAYLOAD FOR: ${input}`]);
    setInput("");
    setIsLoading(true);
    setKillChainStage(0);

    try {
      const chatHistory = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));
      
      const response = await fetch("/api/v1/ai-agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory,
          agent_type: "red_team"
        })
      });

      if (!response.ok) throw new Error("Failed to fetch");
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      setIsLoading(false);

      let assistantMessage = "";
      let payloadBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;
        playTypingSound();
        
        // Check for glitch triggers
        const upperMsg = assistantMessage.toUpperCase();
        if ((upperMsg.includes('CRITICAL') || upperMsg.includes('PWNED') || upperMsg.includes('VULNERABILITY')) && !isGlitching) {
          setIsGlitching(true);
          playSuccessBlip();
          setTimeout(() => setIsGlitching(false), 1000);
        }
        
        // Progress Kill Chain based on text length (simulation)
        if (assistantMessage.length > 50 && killChainStage < 1) setKillChainStage(1);
        if (assistantMessage.length > 150 && killChainStage < 2) setKillChainStage(2);
        if (assistantMessage.length > 300 && killChainStage < 3) {
          setKillChainStage(3);
          playSuccessBlip();
        }

        // Extract payloads if inside code blocks
        if (assistantMessage.includes('```')) {
          const blocks = assistantMessage.split('```');
          if (blocks.length > 1 && blocks.length % 2 === 0) {
             // We are inside a code block
             const codeContent = blocks[blocks.length - 1].replace(/^[a-z]+\n/, '');
             payloadBuffer = convertToHexDump(codeContent);
             setPayloadLogs(prev => {
                const newLogs = [...prev];
                // Replace the last payload log with the growing hex dump
                if (newLogs[newLogs.length - 1].startsWith("00000000") || newLogs.length > 1) {
                  newLogs[newLogs.length - 1] = payloadBuffer;
                } else {
                  newLogs.push(payloadBuffer);
                }
                return newLogs;
             });
          }
        }
        
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: "assistant", content: assistantMessage };
          return newMessages;
        });
      }
      setNetworkLogs(prev => [...prev, `[✓] EXECUTION COMPLETE. AWAITING FURTHER INSTRUCTIONS.`]);
      setPayloadLogs(prev => [...prev, `[✓] PAYLOAD DEPLOYED.`]);
    } catch (error) {
      setIsLoading(false);
      setMessages(prev => [...prev, { role: "assistant", content: "Error: Could not reach the Red Team AI Core. Connection terminated." }]);
    }
  };

  return (
    <AppShell>
      <div className={`relative space-y-4 pb-8 h-full flex flex-col font-mono text-[#0F0] ${isGlitching ? 'glitch-hit' : ''}`}>
        
        {/* CRT Overlay */}
        <div className="crt-overlay" />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between z-10"
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-[#0F0] tracking-widest uppercase">
              <span className="text-red-500 animate-pulse">●</span> Red_Team_AI_v2.0
            </h1>
            <p className="text-xs text-[#0F0]/50 mt-1 uppercase">Autonomous continuous penetration testing and adversarial emulation.</p>
          </div>
          <div className="flex gap-2">
            <button 
              className={`border px-4 py-2 text-xs uppercase tracking-widest transition-colors ${isMuted ? 'border-[#0F0]/30 text-[#0F0]/50 bg-transparent' : 'border-[#0F0] text-black bg-[#0F0]'}`}
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? '[ Audio_Muted ]' : '[ Audio_Live ]'}
            </button>
            <button 
              className="border border-[#0F0] px-4 py-2 text-xs uppercase tracking-widest text-[#0F0] hover:text-[#0F0] bg-black hover:border-red-500 transition-colors"
              onClick={() => {
                setMessages([{ role: "assistant", content: "> TERMINAL CLEARED\n> Ready for new campaign parameters." }]);
                setNetworkLogs([]);
                setPayloadLogs([]);
                setKillChainStage(0);
              }}
            >
              [ Clear_Session ]
            </button>
          </div>
        </motion.div>
        
        {/* Tmux Split Layout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 mt-4 z-10 min-h-[600px]"
        >
          
          {/* Pane 1: Chat Interface */}
          <div className="lg:col-span-2 border border-[#0F0]/30 bg-black/90 p-1 flex flex-col relative">
            <div className="bg-[#0F0]/10 text-xs px-2 py-1 border-b border-[#0F0]/30 uppercase font-bold text-[#0F0] flex justify-between items-center">
              <span>Pane 0: RECON_&_COMMAND // AI_CHAT</span>
              {killChainStage > 0 && <span className="text-red-500 animate-pulse">ATTACK IN PROGRESS</span>}
            </div>
            
            <div className="p-2 border-b border-[#0F0]/10">
               <KillChainGraph stage={killChainStage} />
            </div>

            <div className="flex-1 flex flex-col gap-4 overflow-y-auto p-4 hacker-scroll text-sm">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`p-4 border w-full ${
                    msg.role === 'user' 
                      ? 'bg-black border-[#0F0]/50 text-[#0F0]' 
                      : 'bg-[#0F0]/5 border-[#0F0]/20 text-[#0F0]/90'
                  } prose prose-invert prose-p:leading-relaxed max-w-none`}>
                    <div className="text-[10px] mb-2 opacity-50 uppercase tracking-widest">{msg.role === 'user' ? 'OPERATOR' : 'RED TEAM AI'}</div>
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="p-4 border w-full bg-[#0F0]/5 border-[#0F0]/20 text-[#0F0]">
                    <div className="text-[10px] mb-2 opacity-50 uppercase tracking-widest">RED TEAM AI</div>
                    <div className="flex items-center gap-2">
                      <span>PROCESSING_</span>
                      <span className="w-2 h-4 bg-[#0F0] animate-pulse" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>

            <div className="p-4 border-t border-[#0F0]/30 bg-black">
              <div className="relative flex items-center">
                <span className="absolute left-4 text-[#0F0] text-sm">root@nexus:~#</span>
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="enter command..." 
                  className="w-full bg-transparent border border-[#0F0]/50 rounded-none px-4 py-3 pl-32 text-sm text-[#0F0] outline-none focus:border-[#0F0] transition-colors placeholder:text-[#0F0]/30" 
                />
              </div>
            </div>
          </div>

          {/* Right Column: Network and Payload Panes */}
          <div className="flex flex-col gap-4">
            
            {/* Pane 2: Network Traffic */}
            <div className="flex-1 border border-[#0F0]/30 bg-black/90 p-1 flex flex-col min-h-[250px]">
              <div className="bg-[#0F0]/10 text-xs px-2 py-1 border-b border-[#0F0]/30 uppercase font-bold text-[#0F0]">
                Pane 1: NETWORK_MONITOR // TCP_DUMP
              </div>
              <div className="flex-1 p-2 overflow-y-auto hacker-scroll text-[10px] leading-tight text-[#0F0]/70 break-all whitespace-pre-wrap">
                {networkLogs.length === 0 ? "> Awaiting traffic..." : networkLogs.join("\n")}
                <div ref={networkLogsEndRef} />
              </div>
            </div>

            {/* Pane 3: Payload Output */}
            <div className="flex-1 border border-red-500/40 bg-black/90 p-1 flex flex-col min-h-[250px]">
              <div className="bg-red-500/10 text-xs px-2 py-1 border-b border-red-500/40 uppercase font-bold text-red-500 flex justify-between">
                <span>Pane 2: PAYLOAD_EXPLOIT</span>
                <span className="animate-pulse">LIVE</span>
              </div>
              <div className="flex-1 p-2 overflow-y-auto hacker-scroll text-[10px] leading-tight text-red-400 whitespace-pre font-mono">
                {payloadLogs.length === 0 ? "> Awaiting payload generation..." : payloadLogs.join("\n\n")}
                <div ref={payloadLogsEndRef} />
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
