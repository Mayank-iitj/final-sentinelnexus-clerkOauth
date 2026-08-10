"use client";
import { useState, useRef, useEffect } from "react";
import SpecularButton from '../../../components/SpecularButton';
import { AppShell } from "../../../components/AppShell";
import { motion } from "framer-motion";
import ReactMarkdown from 'react-markdown';

export default function ComplianceChatPage() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am SentinelNexus Compliance Copilot. Ask me anything about SOC2, ISO 27001, GDPR, or your current compliance status." }
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
          agent_type: "compliance"
        })
      });

      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "assistant", content: "Error: Could not reach the Compliance AI Core." }]);
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
              <span className="text-violet-500">💬</span> Compliance Chat
            </h1>
            <p className="text-sm text-gray-500 mt-1">Get instant answers on regulatory requirements and audit readiness.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }} 
            whileTap={{ scale: 0.98 }}
            className="btn-primary !py-2 !px-4 text-sm"
            onClick={() => setMessages([{ role: "assistant", content: "Chat history cleared." }])}
          >
            Clear Chat
          </motion.button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="nub-card rounded-2xl p-6 border border-white/[0.04] bg-white/[0.01] mt-6 flex-1 min-h-[600px] flex flex-col relative overflow-hidden"
        >
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-20 scrollbar-hide">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {msg.role === 'user' ? '👤' : '✓'}
                </div>
                <div className={`p-4 rounded-xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-500/10 border border-blue-500/20 rounded-tr-none text-blue-50' 
                    : 'bg-white/[0.04] border border-white/[0.05] rounded-tl-none text-gray-200'
                } max-w-[80%] prose prose-invert prose-p:leading-relaxed`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">✓</div>
                <div className="bg-white/[0.04] border border-white/[0.05] p-4 rounded-xl rounded-tl-none text-sm text-gray-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-75" />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-150" />
                </div>
              </div>
            )}
            <div ref={endOfMessagesRef} />
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about SOC2, ISO 27001, or GDPR..." 
                className="w-full bg-black/60 backdrop-blur-xl border border-white/[0.1] rounded-xl px-4 py-4 text-sm text-white outline-none focus:border-emerald-500 pr-12 shadow-2xl transition-all" 
              />
              <SpecularButton 
                onClick={sendMessage}
                className="absolute right-2 top-2 bottom-2 w-10 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 flex items-center justify-center text-emerald-300 hover:text-white transition-all"
              >
                 ↑ 
              </SpecularButton>
            </div>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
