/**
 * SentinelNexus Component Index
 * 
 * This file provides quick access to all integrated React Bits components
 * and wrapper components for your application.
 */

// ============================================================================
// CORE COMPONENTS (React Bits)
// ============================================================================

/**
 * StaggeredMenu
 * 
 * Animated navigation menu with staggered reveal effect.
 * Perfect for main site navigation or mobile menus.
 * 
 * Import: import StaggeredMenu from '@/components/StaggeredMenu';
 * Location: frontend/src/components/StaggeredMenu/
 * 
 * Features:
 * - Animated staggered reveal on open
 * - Configurable position (left/right)
 * - Social links section
 * - Item numbering
 * - Click-away close
 * - Accent color customization
 * 
 * Dependencies: GSAP
 */
export { StaggeredMenu } from './StaggeredMenu';

/**
 * CardSwap
 *
 * Animated card stack with GSAP-powered 3D swapping effect.
 * Cards cycle through a stack with configurable easing, spacing, and timing.
 *
 * Import: import CardSwap, { Card } from '@/components/CardSwap/CardSwap';
 * Location: frontend/src/components/CardSwap/
 *
 * Dependencies: GSAP
 */
export { default as CardSwap, Card } from './CardSwap/CardSwap';

/**
 * CardNav
 *
 * Animated card-based navigation menu with GSAP transitions.
 * Expands to reveal categorized navigation links in styled cards.
 *
 * Import: import CardNav from '@/components/CardNav/CardNav';
 * Location: frontend/src/components/CardNav/
 *
 * Dependencies: GSAP
 */
export { default as CardNav } from './CardNav/CardNav';

/**
 * ScrollStack
 *
 * Scroll-driven card stacking with pinning, scaling, rotation, and blur.
 * Uses Lenis for smooth scrolling. Cards stack as the user scrolls down.
 *
 * Import: import ScrollStack, { ScrollStackItem } from '@/components/ScrollStack/ScrollStack';
 * Location: frontend/src/components/ScrollStack/
 *
 * Dependencies: Lenis
 */
export { default as ScrollStack, ScrollStackItem } from './ScrollStack/ScrollStack';

/**
 * LogoLoop
 *
 * Infinite logo/brand carousel with configurable speed, direction, and hover effects.
 * Supports both React node logos and image-based logos. Pure CSS + requestAnimationFrame.
 *
 * Import: import LogoLoop from '@/components/LogoLoop/LogoLoop';
 * Location: frontend/src/components/LogoLoop/
 *
 * Dependencies: None
 */
export { default as LogoLoop } from './LogoLoop/LogoLoop';

/**
 * BorderGlow
 *
 * Interactive border glow effect that responds to cursor proximity.
 * Creates a beautiful mesh gradient glow on the edges when hovered.
 *
 * Import: import BorderGlow from '@/components/BorderGlow/BorderGlow';
 * Location: frontend/src/components/BorderGlow/
 */
export { default as BorderGlow } from './BorderGlow/BorderGlow';

/**
 * StarBorder
 *
 * Animated border gradient component that looks like a shooting star traveling around the border.
 *
 * Import: import StarBorder from '@/components/StarBorder/StarBorder';
 * Location: frontend/src/components/StarBorder/
 */
export { default as StarBorder } from './StarBorder/StarBorder';

/**
 * MagicBento
 * 
 * Interactive bento grid cards with particle and spotlight effects.
 * Perfect for feature showcases or project displays.
 * 
 * Import: import MagicBento from '@/components/MagicBento';
 * Location: frontend/src/components/MagicBento/
 * 
 * Features:
 * - Particle star effects on hover
 * - Global spotlight cursor tracking
 * - Border glow animation
 * - 3D tilt effect (optional)
 * - Magnetism effect (optional)
 * - Click ripple effect
 * - Mobile-responsive (auto-disable <768px)
 * 
 * Dependencies: GSAP
 */
export { MagicBento } from './MagicBento';

/**
 * GlassSurface
 * 
 * Interactive glass surface with displacement map effects.
 * 
 * Import: import GlassSurface from '@/components/GlassSurface/GlassSurface';
 * Location: frontend/src/components/GlassSurface/
 */
export { default as GlassSurface } from './GlassSurface/GlassSurface';
export { Plasma } from './Plasma';
export { TargetCursor } from './TargetCursor';

// ============================================================================
// WRAPPER COMPONENTS (Pre-configured)
// ============================================================================

export { ScrollVelocity } from './ScrollVelocity/ScrollVelocity';

/**
 * NavigationMenu
 * 
 * Pre-configured StaggeredMenu with SentinelNexus navigation items.
 * Ready to use - no additional configuration needed.
 * 
 * Import: import NavigationMenu from '@/components/NavigationMenu';
 * Location: frontend/src/components/NavigationMenu.tsx
 * 
 * Default Menu Items:
 * - Dashboard (/dashboard)
 * - Projects (/projects)
 * - Scans (/scanner)
 * - Reports (/reports)
 * - Features (/features)
 * 
 * Default Social Links:
 * - GitHub
 * - Twitter
 * - LinkedIn
 * 
 * Usage:
 * <NavigationMenu position="right" accentColor="#5227FF" />
 */
export { NavigationMenu } from './NavigationMenu';

/**
 * FeaturedProjects
 * 
 * Pre-configured MagicBento for displaying featured projects or capabilities.
 * Display your key features with beautiful animations.
 * 
 * Import: import FeaturedProjects from '@/components/FeaturedProjects';
 * Location: frontend/src/components/FeaturedProjects.tsx
 * 
 * Default Capabilities:
 * - Code Scanning
 * - Prompt Defense
 * - Data Protection
 * - Risk Scoring
 * - Real-time Alerts
 * - PDF Reports
 * 
 * Usage:
 * <FeaturedProjects 
 *   enableSpotlight={true}
 *   enableBorderGlow={true}
 *   glowColor="132, 0, 255"
 * />
 */
export { FeaturedProjects } from './FeaturedProjects';

// ============================================================================
// SHOWCASE PAGES
// ============================================================================

/**
 * Routes Created:
 * 
 * /cyberpentest
 *   - Full showcase of the Autonomous Cyber-Pentest Framework
 *   - 12 capability cards with icons and details
 *   - Vulnerability types reference table
 *   - Technical specifications
 *   - Quick start guide
 * 
 * /showcase
 *   - MagicBento showcase page
 *   - Feature display example
 *   - Call-to-action section
 * 
 * /projects
 *   - Updated with featured projects section
 *   - Featured card for Cyber-Pentest Framework
 *   - User projects below featured section
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * MagicBento Color Scheme (RGB format)
 * 
 * Violet (Default): "132, 0, 255"
 * Red: "255, 0, 0"
 * Blue: "0, 0, 255"
 * Green: "0, 255, 0"
 * Orange: "255, 165, 0"
 * Pink: "255, 105, 180"
 * 
 * Use: glowColor="132, 0, 255"
 */

/**
 * StaggeredMenu Colors (Hex format)
 * 
 * Default Gradient: ["#B497CF", "#5227FF"]
 * Custom: Pass custom color array as needed
 * Accent: Pass accentColor prop separately
 * 
 * Use: colors={["#B497CF", "#5227FF"]}
 */

// ============================================================================
// QUICK START
// ============================================================================

/**
 * 1. Install Dependencies
 *    npm install
 * 
 * 2. Verify GSAP Installation
 *    npm list gsap  (should be ^3.12.2 or higher)
 * 
 * 3. Test Components
 *    - Visit http://localhost:3000/showcase
 *    - Visit http://localhost:3000/cyberpentest
 *    - Visit http://localhost:3000/projects
 * 
 * 4. Integrate into Your App
 *    import NavigationMenu from '@/components/NavigationMenu';
 *    
 *    export default function Layout() {
 *      return <NavigationMenu position="right" />;
 *    }
 * 
 * 5. Customize
 *    - Colors: Update glowColor or colors props
 *    - Menu Items: Modify NavigationMenu.tsx
 *    - Animations: Adjust enableStars, enableSpotlight, etc.
 */

// ============================================================================
// DOCUMENTATION
// ============================================================================

/**
 * Full Documentation:
 * - COMPONENT_INTEGRATION_GUIDE.md - Complete usage guide
 * - COMPONENTS_INTEGRATION_SUMMARY.md - Implementation summary
 * 
 * Files:
 * - GSAP Docs: https://gsap.com/docs/
 * - React Docs: https://react.dev/reference
 * - Next.js Docs: https://nextjs.org/docs
 */

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/**
 * Issue: Components not animating
 * Solution: 
 * - Check "use client" directive at top of file
 * - Verify GSAP is installed: npm install gsap
 * - Check browser console for errors
 * - Ensure CSS files are imported
 * 
 * Issue: Styles not applying
 * Solution:
 * - Verify Tailwind CSS is configured
 * - Check CSS imports
 * - Look for z-index conflicts
 * 
 * Issue: Performance problems
 * Solution:
 * - Set disableAnimations={true} on low-end devices
 * - Reduce spotlightRadius for better performance
 * - Disable particle effects: enableStars={false}
 */

// ============================================================================
// FEATURES SUMMARY
// ============================================================================

/**
 * StaggeredMenu
 * ✅ Animated staggered reveal
 * ✅ Left/right positioning
 * ✅ Social links section
 * ✅ Item numbering
 * ✅ Click-away detection
 * ✅ Color customization
 * ✅ Mobile responsive
 * ✅ Accessibility support
 * 
 * MagicBento
 * ✅ Particle effects
 * ✅ Spotlight tracking
 * ✅ Border glow
 * ✅ 3D tilt
 * ✅ Magnetism
 * ✅ Click ripple
 * ✅ Mobile detection
 * ✅ Responsive grid
 * 
 * NavigationMenu
 * ✅ Pre-configured navigation
 * ✅ Default menu items
 * ✅ Social links
 * ✅ Theme ready
 * 
 * FeaturedProjects
 * ✅ Pre-configured showcase
 * ✅ Default capabilities
 * ✅ Fully customizable
 */

export const COMPONENT_STATUS = {
  staggeredMenu: 'Production Ready ✅',
  magicBento: 'Production Ready ✅',
  navigationMenu: 'Production Ready ✅',
  featuredProjects: 'Production Ready ✅',
  cyberPentestShowcase: 'Production Ready ✅',
  showcasePage: 'Production Ready ✅',
  projectsPage: 'Updated ✅'
};

export const GSAP_VERSION = '^3.12.2';
export const NEXT_VERSION = '14.2.7';
export const REACT_VERSION = '18.3.1';
export const TYPESCRIPT_VERSION = '^5.5.4';
