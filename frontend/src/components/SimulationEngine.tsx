"use client";
import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { Orb, Plasma, Strands } from './index';

export function SimulationEngine() {
  const pathname = usePathname() || '';

  const simulationType = useMemo(() => {
    if (!pathname) return 'none';
    
    if (pathname.includes('/scanner') || pathname.includes('/simulator') || pathname.includes('/threats/zero-day') || pathname.includes('/remediation')) {
      return 'plasma';
    }
    
    if (pathname.includes('/threats/deepfake') || pathname.includes('/digital-twin') || pathname.includes('/attack-graph') || pathname.includes('/supply-chain') || pathname.includes('/heatmap')) {
      return 'strands';
    }
    
    if (pathname.includes('/dashboard') || pathname.includes('/boardroom') || pathname.includes('/governance') || pathname.includes('/copilot') || pathname.includes('/trust-score') || pathname.includes('/agents')) {
      return 'orb';
    }

    if (pathname.includes('/time-machine') || pathname.includes('/threats/dark-web') || pathname.includes('/security-telemetry') || pathname.includes('/explainability')) {
      return 'strands'; // Fallback for data streams
    }

    return 'none';
  }, [pathname]);

  if (simulationType === 'none') {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] opacity-30 overflow-hidden">
      {simulationType === 'orb' && (
        <div className="absolute inset-0 scale-[1.5] translate-y-[10%]">
          <Orb hoverIntensity={0.1} rotateOnHover={true} hue={260} backgroundColor="transparent" />
        </div>
      )}
      {simulationType === 'plasma' && (
        <div className="absolute inset-0 opacity-40">
           <Plasma />
        </div>
      )}
      {simulationType === 'strands' && (
        <div className="absolute inset-0 opacity-50">
           <Strands />
        </div>
      )}
      
      {/* Overlay to dim the simulation slightly and blend it with the background */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
    </div>
  );
}
