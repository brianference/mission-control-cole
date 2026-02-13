# Mission Control Dashboard

**Central hub for all Brian's applications**

A modern, glassmorphic dashboard built with React + TypeScript, featuring live stats, real-time updates, and the Indigo Night theme.

## 🚀 Features

- **6 Core Navigation Sections**
  - 💡 **Ideas** - Brainstorm and manage ideas
  - 📝 **Content** - Content creation pipeline
  - ✅ **Tasks** - Task management and Kanban board
  - 📅 **Calendar** - Schedule and deadlines
  - 🧠 **Memory** - Second Brain and memory systems
  - 📄 **Docs** - Documentation and knowledge base

- **Live System Stats** - Real-time CPU, memory, network monitoring
- **App Cards** - Modular cards for each application
- **Activity Feed** - Recent events across all apps
- **Glassmorphism Design** - Modern glass-effect UI
- **Indigo Night Theme** - Beautiful dark-first color scheme
- **Fully Responsive** - Desktop, tablet, and mobile

## 🛠️ Tech Stack

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Styling:** CSS Modules with Custom Properties

## 📦 Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🌐 Deployment

This app is deployed to Cloudflare Pages at:
**https://mission-control-cole.pages.dev**

### Deploy to Cloudflare Pages

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Cloudflare Pages:
   ```bash
   npx wrangler pages deploy dist
   ```

Or connect your GitHub repository to Cloudflare Pages with these settings:
- **Framework:** Vite
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node version:** 18+

## 📁 Project Structure

```
mission-control-dashboard/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   └── layout/      # Layout components (TopBar, Sidebar, MainContent)
│   ├── data/            # Static data (navigation items)
│   ├── pages/           # Page components (Overview, Ideas, Content, etc.)
│   ├── styles/          # Global styles and design system
│   │   ├── variables.css    # CSS custom properties
│   │   ├── globals.css      # Global styles
│   │   └── animations.css   # Keyframe animations
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── index.html           # HTML template
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── vite.config.ts       # Vite config
```

## 🎨 Design System

### Color Palette (Indigo Night)

```css
--accent-primary: #8b9bff;       /* Indigo */
--accent-secondary: #9d6cc9;     /* Purple */
--status-excellent: #34d399;     /* Green */
--status-warning: #f59e0b;       /* Orange */
--status-critical: #f87171;      /* Red */
```

### Typography

- **Primary Font:** Inter
- **Monospace Font:** JetBrains Mono
- **Sizes:** Responsive with `clamp()`

### Spacing

- Base unit: 4px
- Scale: 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20

## 🔧 Configuration

### Navigation Items

Edit `src/data/navigation.ts` to customize navigation:

```typescript
export const navigationItems: NavItem[] = [
  {
    id: 'ideas',
    label: 'Ideas',
    icon: '💡',
    url: '/ideas',
    badge: { count: 12 },
  },
  // ... more items
];
```

### External Links

Some navigation items link to external apps:
- **Tasks** → Python Kanban (https://python-kanban.pages.dev)
- **Memory** → Second Brain (https://second-brain-cole.pages.dev)

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 767px) { }

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) { }

/* Desktop */
@media (min-width: 1024px) { }

/* Large Desktop */
@media (min-width: 1920px) { }
```

## ♿ Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation supported
- Screen reader friendly
- Focus indicators visible
- Reduced motion support
- High contrast mode support

## 🚧 Development

### Adding a New Page

1. Create component in `src/pages/YourPage.tsx`
2. Add route in `src/App.tsx`
3. Add navigation item in `src/data/navigation.ts`

### Adding a New App Card

1. Define card data in `src/types/index.ts`
2. Create card in `src/pages/Overview.tsx`
3. Style in `src/pages/Overview.css`

## 📝 License

MIT License - feel free to use for your own projects!

## 👤 Author

**Brian** - Built with OpenClaw and Morpheus (Designer Agent)

---

**Live Demo:** https://mission-control-cole.pages.dev
