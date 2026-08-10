"use client";
import { useState, useRef, useEffect } from "react";
import SpecularButton from '../../../components/SpecularButton';
import { AppShell } from "../../../components/AppShell";
import { motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';

export default function BlueTeamPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "> INITIALIZING BLUE TEAM AI CORE...\n> I am SentinelNexus Blue Team AI. I am monitoring your infrastructure. What incident or remediation strategy do you need assistance with?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const chatHistory = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));
      
      const response = await fetch("/api/v1/ai-agents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory,
          agent_type: "blue_team"
        })
      });

      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error: Could not reach the Blue Team AI Core. Network failure." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-8 h-full flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-cyan-500">🔵</span> Blue Team AI
            </h1>
            <p className="text-sm text-gray-500 mt-1">Defensive orchestration, instant patching, and threat remediation.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            className="btn-primary !py-2 !px-4 text-sm !bg-cyan-500/20 !border-cyan-500/50 !text-cyan-400 hover:!bg-cyan-500 hover:!text-white"
            onClick={() => setMessages([{ role: "assistant", content: "> SYSTEM RESET\n> Ready for new defensive protocols." }])}
          >
            Clear Terminal
          </motion.button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="nub-card rounded-2xl p-6 border border-white/[0.04] bg-black/80 mt-6 flex-1 min-h-[600px] flex flex-col relative overflow-hidden font-mono"
        >
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-20 scrollbar-hide text-sm">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`p-4 rounded-md border w-full ${
                  msg.role === 'user' 
                    ? 'bg-gray-900 border-gray-700 text-gray-300' 
                    : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-400'
                } prose prose-invert prose-p:leading-relaxed max-w-none`}>
                  <div className="text-xs mb-2 opacity-50 uppercase tracking-widest">{msg.role === 'user' ? 'SECURITY ADMIN' : 'BLUE TEAM AI'}</div>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="p-4 rounded-md border w-full bg-cyan-950/20 border-cyan-500/30 text-cyan-400">
                  <div className="text-xs mb-2 opacity-50 uppercase tracking-widest">BLUE TEAM AI</div>
                  <div className="flex items-center gap-2">
                    <span>GENERATING PATCH</span>
                    <span className="w-2 h-4 bg-cyan-500 animate-pulse" />
                  </div>
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="relative">
              <span className="absolute left-4 top-4 text-cyan-500 font-mono text-sm">{">"}</span>
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Describe an incident or request a WAF rule..." 
                className="w-full bg-black border border-cyan-500/30 rounded-md px-10 py-4 text-sm text-cyan-500 outline-none focus:border-cyan-500 pr-12 transition-all font-mono placeholder:text-cyan-900/50" 
              />
              <SpecularButton 
                onClick={sendMessage}
                className="absolute right-2 top-2 bottom-2 w-10 rounded-sm bg-cyan-500/20 hover:bg-cyan-500 flex items-center justify-center text-cyan-400 hover:text-white transition-all"
              >
                 ↵ 
              </SpecularButton>
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
