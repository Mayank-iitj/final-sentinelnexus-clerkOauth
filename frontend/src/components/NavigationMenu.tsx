import React from 'react';
import StaggeredMenu from './StaggeredMenu';

interface NavigationMenuProps {
  logoUrl?: string;
  position?: 'left' | 'right';
  accentColor?: string;
  onMenuOpen?: () => void;
  onMenuClose?: () => void;
}

const defaultMenuItems = [
  { label: 'Dashboard', ariaLabel: 'Go to dashboard', link: '/dashboard' },
  { label: 'Projects', ariaLabel: 'View your projects', link: '/projects' },
  { label: 'Scans', ariaLabel: 'View your scans', link: '/scanner' },
  { label: 'Reports', ariaLabel: 'View your reports', link: '/reports' },
  { label: 'Features', ariaLabel: 'View features', link: '/features' },
];

const defaultSocialItems = [
  { label: 'GitHub', link: 'https://github.com' },
  { label: 'Twitter', link: 'https://twitter.com' },
  { label: 'LinkedIn', link: 'https://linkedin.com' },
];

/**
 * NavigationMenu
 * 
 * A pre-configured StaggeredMenu component with SentinelNexus navigation items.
 * Perfect for main site navigation with animated menu interactions.
 * 
 * @example
 * ```tsx
 * <NavigationMenu position="right" accentColor="#8400ff" />
 * ```
 */
export const NavigationMenu: React.FC<NavigationMenuProps> = ({
  logoUrl = '/favicon.png',
  position = 'right',
  accentColor = '#5227FF',
  onMenuOpen,
  onMenuClose
}) => {
  return (
    <StaggeredMenu
      position={position}
      colors={['#B497CF', '#5227FF']}
      items={defaultMenuItems}
      socialItems={defaultSocialItems}
      displaySocials={true}
      displayItemNumbering={true}
      logoUrl={logoUrl}
      menuButtonColor="#fff"
      openMenuButtonColor="#fff"
      accentColor={accentColor}
      changeMenuColorOnOpen={true}
      closeOnClickAway={true}
      onMenuOpen={onMenuOpen}
      onMenuClose={onMenuClose}
    />
  );
};

export default NavigationMenu;
