import React from 'react';
import { MagicBento } from './MagicBento';

interface FeaturedProject {
  color: string;
  title: string;
  description: string;
  label: string;
}

interface FeaturedProjectsProps {
  projects?: FeaturedProject[];
  enableStars?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  enableTilt?: boolean;
  glowColor?: string;
  clickEffect?: boolean;
  enableMagnetism?: boolean;
  textAutoHide?: boolean;
}

const defaultProjects: FeaturedProject[] = [
  {
    color: '#120F17',
    title: 'Code Scanning',
    description: '120+ SAST rules for secrets',
    label: 'Security'
  },
  {
    color: '#120F17',
    title: 'Prompt Defense',
    description: 'Detect jailbreaks & PII exfil',
    label: 'AI Defense'
  },
  {
    color: '#120F17',
    title: 'Data Protection',
    description: 'Credit cards, SSNs, emails',
    label: 'Privacy'
  },
  {
    color: '#120F17',
    title: 'Risk Scoring',
    description: 'CVSS v3.1 calculations',
    label: 'Assessment'
  },
  {
    color: '#120F17',
    title: 'Real-time Alerts',
    description: 'Critical findings notified',
    label: 'Notifications'
  },
  {
    color: '#120F17',
    title: 'PDF Reports',
    description: 'Professional audit trails',
    label: 'Reporting'
  }
];

/**
 * FeaturedProjects
 * 
 * A component wrapper around MagicBento displaying featured projects or capabilities.
 * Fully customizable with different projects, colors, and animation settings.
 * 
 * @example
 * ```tsx
 * <FeaturedProjects
 *   enableSpotlight={true}
 *   enableBorderGlow={true}
 *   glowColor="132, 0, 255"
 * />
 * ```
 */
export const FeaturedProjects: React.FC<FeaturedProjectsProps> = ({
  projects = defaultProjects,
  enableStars = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  enableTilt = false,
  glowColor = '132, 0, 255',
  clickEffect = true,
  enableMagnetism = true,
  textAutoHide = true
}) => {
  return (
    <MagicBento
      textAutoHide={textAutoHide}
      enableStars={enableStars}
      enableSpotlight={enableSpotlight}
      enableBorderGlow={enableBorderGlow}
      enableTilt={enableTilt}
      glowColor={glowColor}
      clickEffect={clickEffect}
      enableMagnetism={enableMagnetism}
    />
  );
};

export default FeaturedProjects;
