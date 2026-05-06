# Component Integration Guide

## Overview
This guide explains how to use the newly integrated React Bits components in your SentinelNexus project.

### Components Included
1. **StaggeredMenu** - Animated navigation menu with staggered reveal
2. **MagicBento** - Interactive bento grid cards with particle and spotlight effects
3. **NavigationMenu** (Wrapper) - Pre-configured StaggeredMenu with SentinelNexus navigation
4. **FeaturedProjects** (Wrapper) - Pre-configured MagicBento with featured projects
5. **MagicBento Showcase** - Full page component at `/showcase`

## Installation
gsap dependency has been added to `package.json`. Run:

```bash
npm install
# or
yarn install
# or
pnpm install
```

## Component Locations
- `frontend/src/components/StaggeredMenu/` - StaggeredMenu component + CSS
- `frontend/src/components/MagicBento/` - MagicBento component + CSS
- `frontend/src/components/NavigationMenu.tsx` - Pre-configured navigation wrapper
- `frontend/src/components/FeaturedProjects.tsx` - Pre-configured featured projects wrapper
- `frontend/src/app/showcase/page.tsx` - Showcase page with MagicBento

## Usage Examples

### 1. Using NavigationMenu (Recommended for Headers)
```tsx
import NavigationMenu from '@/components/NavigationMenu';

export default function Header() {
  return (
    <div className="relative">
      <NavigationMenu 
        position="right"
        accentColor="#5227FF"
        logoUrl="/your-logo.svg"
      />
    </div>
  );
}
```

### 2. Using FeaturedProjects (Recommended for Feature Showcases)
```tsx
import FeaturedProjects from '@/components/FeaturedProjects';

export default function FeaturesSection() {
  return (
    <section className="py-12">
      <h2>Our Capabilities</h2>
      <FeaturedProjects 
        enableSpotlight={true}
        enableBorderGlow={true}
        glowColor="132, 0, 255"
      />
    </section>
  );
}
```

### 3. Using MagicBento Directly (Advanced)
```tsx
'use client';
import MagicBento from '@/components/MagicBento';

export default function ProjectGrid() {
  return (
    <MagicBento
      textAutoHide={true}
      enableStars={true}
      enableSpotlight={true}
      enableBorderGlow={true}
      enableTilt={false}
      glowColor="132, 0, 255"
      clickEffect={true}
      enableMagnetism={true}
    />
  );
}
```

### 4. Using StaggeredMenu Directly (Advanced)
```tsx
'use client';
import StaggeredMenu from '@/components/StaggeredMenu';

const items = [
  { label: 'Home', ariaLabel: 'Go to home', link: '/' },
  { label: 'About', ariaLabel: 'Learn about us', link: '/about' },
];

export default function Menu() {
  return (
    <StaggeredMenu
      position="right"
      items={items}
      socialItems={[{ label: 'Twitter', link: 'https://twitter.com' }]}
      displaySocials={true}
      colors={['#B497CF', '#5227FF']}
      accentColor="#8400ff"
      onMenuOpen={() => console.log('Menu opened')}
      onMenuClose={() => console.log('Menu closed')}
    />
  );
}
```

## Props Reference

### MagicBento Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| enableStars | boolean | true | Enable particle star animation effect |
| enableSpotlight | boolean | true | Enable spotlight cursor following effect |
| enableBorderGlow | boolean | true | Enable border glow effect |
| enableTilt | boolean | false | Enable 3D tilt effect on hover |
| enableMagnetism | boolean | true | Enable subtle card attraction to cursor |
| clickEffect | boolean | true | Enable ripple effect on card click |
| glowColor | string | "132, 0, 255" | RGB color values for glow effects |
| spotlightRadius | number | 300 | Radius of spotlight effect in pixels |
| particleCount | number | 12 | Number of particles in star animation |
| textAutoHide | boolean | true | Whether text content should auto-hide on hover |
| disableAnimations | boolean | false | Disable all animations (auto-enabled on mobile) |

### StaggeredMenu Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| position | "left" \| "right" | "right" | Anchor position for menu panel |
| colors | string[] | ["#B497CF", "#5227FF"] | Colors for staggered underlay layers |
| items | MenuItem[] | [] | Menu items with label, ariaLabel, link |
| socialItems | SocialItem[] | [] | Social links for menu |
| displaySocials | boolean | false | Show social links section |
| displayItemNumbering | boolean | true | Show item numbering |
| accentColor | string | undefined | Hover accent color for items |
| menuButtonColor | string | "#fff" | Color of menu button when closed |
| openMenuButtonColor | string | "#fff" | Color of menu button when open |
| changeMenuColorOnOpen | boolean | true | Animate button color on open/close |
| closeOnClickAway | boolean | true | Close menu when clicking outside |
| onMenuOpen | () => void | undefined | Callback when menu opens |
| onMenuClose | () => void | undefined | Callback when menu closes |

## Mobile Responsiveness
Both components include automatic mobile detection:
- **MagicBento**: Automatically disables animations on screens < 768px width
- **StaggeredMenu**: Responsive panel width (100% on mobile, 38vw on desktop)

## Performance Optimization
- GSAP animations use `will-change` and GPU acceleration
- Particle cleanup on unmount to prevent memory leaks
- Ref-based animation caching for optimal performance
- Event listener cleanup in useEffect returns

## Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (requires -webkit- prefix for backdrop-filter)
- Mobile browsers: Animations auto-disable on small screens

## Troubleshooting

### Components Not Animating
- Ensure `"use client"` directive is at top of file
- Check that gsap is installed: `npm list gsap`
- Verify CSS files are imported
- Check browser console for errors

### Styles Not Applying
- Ensure Tailwind CSS and PostCSS are configured
- CSS files should be imported alongside component
- Check z-index conflicts with other positioned elements

### Performance Issues
- Disable particle effects on older devices
- Reduce `spotlightRadius` to improve spotlight performance
- Set `disableAnimations={true}` for very constrained environments

## Examples

### Full Page Header with Navigation
See `frontend/src/app/showcase/page.tsx` for a complete example of integrating MagicBento in a page.

### Dashboard with Menu and Projects
The projects page can be enhanced by adding FeaturedProjects above the user projects list.

## Next Steps
1. Install dependencies: `npm install`
2. Test components on `/showcase` page
3. Integrate NavigationMenu into your header
4. Add FeaturedProjects to feature showcase sections
5. Customize colors and animations to match your brand

## Support
For issues with GSAP animations or component props, refer to:
- GSAP Docs: https://gsap.com/docs/
- React Best Practices: https://react.dev/reference
- Next.js Docs: https://nextjs.org/docs
