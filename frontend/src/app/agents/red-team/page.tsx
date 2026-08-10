"use client";
import { useState, useRef, useEffect } from "react";
import SpecularButton from '../../../components/SpecularButton';
import { AppShell } from "../../../components/AppShell";
import { motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';

export default function RedTeamPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "> INITIALIZING RED TEAM AI...\n> I am SentinelNexus Red Team AI. Target acquired. What adversarial campaign would you like me to simulate today?" }
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
          agent_type: "red_team"
        })
      });

      if (!response.ok) throw new Error("Failed to fetch");
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);
      setIsLoading(false); // Stop pulse animation once streaming starts

      let assistantMessage = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;
        
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { role: "assistant", content: assistantMessage };
          return newMessages;
        });
      }
    } catch (error) {
      setIsLoading(false);
      setMessages(prev => [...prev, { role: "assistant", content: "Error: Could not reach the Red Team AI Core. Connection terminated." }]);
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
              <span className="text-red-500">🔴</span> Red Team AI
            </h1>
            <p className="text-sm text-gray-500 mt-1">Autonomous continuous penetration testing and adversarial emulation.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            className="btn-primary !py-2 !px-4 text-sm !bg-red-500/20 !border-red-500/50 !text-red-400 hover:!bg-red-500 hover:!text-white"
            onClick={() => setMessages([{ role: "assistant", content: "> TERMINAL CLEARED\n> Ready for new campaign parameters." }])}
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
                    : 'bg-red-950/20 border-red-500/30 text-red-400'
                } prose prose-invert prose-p:leading-relaxed max-w-none`}>
                  <div className="text-xs mb-2 opacity-50 uppercase tracking-widest">{msg.role === 'user' ? 'OPERATOR' : 'RED TEAM AI'}</div>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="p-4 rounded-md border w-full bg-red-950/20 border-red-500/30 text-red-400">
                  <div className="text-xs mb-2 opacity-50 uppercase tracking-widest">RED TEAM AI</div>
                  <div className="flex items-center gap-2">
                    <span>PROCESSING</span>
                    <span className="w-2 h-4 bg-red-500 animate-pulse" />
                  </div>
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="relative">
              <span className="absolute left-4 top-4 text-red-500 font-mono text-sm">{">"}</span>
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Enter command or target parameters..." 
                className="w-full bg-black border border-red-500/30 rounded-md px-10 py-4 text-sm text-red-500 outline-none focus:border-red-500 pr-12 transition-all font-mono placeholder:text-red-900/50" 
              />
              <SpecularButton 
                onClick={sendMessage}
                className="absolute right-2 top-2 bottom-2 w-10 rounded-sm bg-red-500/20 hover:bg-red-500 flex items-center justify-center text-red-400 hover:text-white transition-all"
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
