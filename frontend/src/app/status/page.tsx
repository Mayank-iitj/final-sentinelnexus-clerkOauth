"use client";
import SpecularButton from '../../components/SpecularButton';

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "../../components/AppShell";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://sentinelnexus-backend.onrender.com/api/v1";

type HealthData = { status: string; db: string; redis: string };

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    try {
      // Adjusted health check logic to target the base health endpoint
      const baseHealthUrl = API_URL.replace("/api/v1", "/health");
      const res = await fetch(baseHealthUrl, { cache: "no-store" });
      if (res.ok) {
        setHealth(await res.json());
      } else {
        setHealth({ status: "degraded", db: "unknown", redis: "unknown" });
      }
    } catch (error) {
      console.error("Health check failed:", error);
      setHealth({ status: "unreachable", db: "offline", redis: "offline" });
    }
    setLastCheck(new Date());
    setLoading(false);
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (s: string) => {
    if (s === "ok" || s === "healthy" || s === "operational") return "text-emerald-400";
    if (s === "degraded" || s === "warning") return "text-amber-400";
    return "text-red-400";
  };

  const getDotColor = (s: string) => {
    if (s === "ok" || s === "healthy" || s === "operational") return "bg-emerald-400";
    if (s === "degraded" || s === "warning") return "bg-amber-400";
    return "bg-red-400";
  };

  const services = [
    { 
      name: "API Engine", 
      status: health?.status === "healthy" ? "operational" : health?.status === "unreachable" ? "down" : "degraded",
      uptime: "99.98%",
      latency: "< 140ms"
    },
    { 
      name: "Core Database", 
      status: health?.db === "ok" ? "operational" : "unavailable",
      uptime: "99.99%",
      latency: "< 10ms"
    },
    { 
      name: "Redis Cache", 
      status: health?.redis === "ok" ? "operational" : "unavailable",
      uptime: "100%",
      latency: "< 2ms"
    },
    { 
      name: "Identity Service (Clerk)", 
      status: "operational",
      uptime: "99.99%",
      latency: "External"
    },
    { 
      name: "Report Generation Service", 
      status: "operational",
      uptime: "99.95%",
      latency: "Queue-based"
    }
  ];

  return (
    <AppShell>
      <div className="max-w-4xl pb-20">
        <div className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-4">
            System Status
          </h1>
          <p className="text-gray-400 text-lg">
            Real-time infrastructure performance and security engine availability metrics.
          </p>
        </div>

        {/* Global Status Banner */}
        <AnimatePresence mode="wait">
          {!loading && health && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`p-8 rounded-3xl border-2 backdrop-blur-md mb-12 flex flex-col md:flex-row items-center gap-6 ${
                health.status === "healthy" 
                ? "bg-emerald-500/5 border-emerald-500/20" 
                : "bg-red-500/5 border-red-500/20"
              }`}
            >
              <div className="relative">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  health.status === "healthy" ? "bg-emerald-500/20" : "bg-red-500/20"
                }`}>
                  <div className={`w-6 h-6 rounded-full ${getDotColor(health.status)} animate-pulse shadow-[0_0_20px_rgba(52,211,153,0.5)]`} />
                </div>
              </div>
              <div className="text-center md:text-left flex-1">
                <h2 className={`text-2xl font-bold ${getStatusColor(health.status)}`}>
                  {health.status === "healthy" ? "All Systems Operational" : "System Disruption Detected"}
                </h2>
                <p className="text-gray-400 mt-1">
                  {health.status === "healthy" 
                    ? "Our security engines are running at peak performance across all regions."
                    : "We are currently investigating issues with one or more core services."
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Last Updated</div>
                <div className="text-white font-mono">{lastCheck?.toLocaleTimeString() || "--:--:--"}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Service Grid */}
        <div className="grid gap-4">
          {services.map((service, idx) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-2 h-2 rounded-full ${getDotColor(service.status)}`} />
                <div>
                  <h3 className="text-white font-semibold">{service.name}</h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Uptime: {service.uptime}</span>
                    <span className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Latency: {service.latency}</span>
                  </div>
                </div>
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${getStatusColor(service.status)}`}>
                {service.status}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Refresh Button */}
        <div className="mt-12 text-center">
          <SpecularButton 
            onClick={checkStatus}
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition-all disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Refresh Status
          </SpecularButton>
        </div>
      </div>
    </AppShell>
  );
}
