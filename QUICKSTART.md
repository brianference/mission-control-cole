# Mission Control Dashboard - Quick Start

## 🚀 Get Started in 3 Steps

### 1. Preview Locally

```bash
cd /root/.openclaw/workspace-coder/mission-control-dashboard
npm run dev
```

**Open:** http://localhost:5173

### 2. Build for Production

```bash
npm run build
```

**Output:** `dist/` directory (ready to deploy)

### 3. Deploy to Cloudflare Pages

```bash
npm run deploy
```

**Or manually:**

```bash
wrangler login
npx wrangler pages deploy dist --project-name=mission-control-cole
```

**Live URL:** https://mission-control-cole.pages.dev

---

## 📋 What's Included

✅ **6 Navigation Sections** - Ideas, Content, Tasks, Calendar, Memory, Docs  
✅ **Live Stats Dashboard** - CPU, Memory, Network, Requests  
✅ **App Cards** - OpenClaw, MobileClaw, Secret Vault  
✅ **Activity Feed** - Recent events across all apps  
✅ **Glassmorphic Design** - Indigo Night theme  
✅ **Fully Responsive** - Mobile, tablet, desktop  

---

## 🎯 Key Pages

- **Overview** - Dashboard home with stats and app cards
- **Ideas** - Idea management with tags and status
- **Content** - Content pipeline (@swordtruth ready)
- **Calendar** - Schedule and events
- **Memory** - Links to Second Brain
- **Docs** - Documentation browser
- **Settings** - App configuration
- **Profile** - User account

---

## 📁 Quick Reference

| File | Purpose |
|------|---------|
| `src/data/navigation.ts` | Edit navigation items |
| `src/styles/variables.css` | Change colors/design |
| `src/pages/Overview.tsx` | Edit dashboard |
| `DEPLOYMENT.md` | Deployment guide |
| `PROJECT-SUMMARY.md` | Full project details |

---

## 🔧 Common Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linter

# Deployment
npm run deploy       # Build + deploy to Cloudflare Pages
./deploy.sh          # Alternative deploy script
```

---

## 🐛 Troubleshooting

**Build fails?**
```bash
rm -rf node_modules dist
npm install
npm run build
```

**Deployment fails?**
```bash
wrangler login
npm run deploy
```

**Dev server not starting?**
```bash
# Kill any processes on port 5173
lsof -ti:5173 | xargs kill -9
npm run dev
```

---

## 🌐 External Links

Some navigation items link to external apps:

- **Tasks** → https://python-kanban.pages.dev
- **Memory** → https://second-brain-cole.pages.dev

These will open in new tabs.

---

## 📝 Next Steps

1. **Test locally** - Run `npm run dev`
2. **Review design** - Check all 6 sections
3. **Deploy** - Run `npm run deploy`
4. **Integrate APIs** - Connect to real data sources
5. **Add WebSocket** - Enable real-time updates

---

## 🆘 Need Help?

- **README.md** - Full project documentation
- **DEPLOYMENT.md** - Deployment troubleshooting
- **PROJECT-SUMMARY.md** - Complete project details

---

**Ready to launch!** 🚀
