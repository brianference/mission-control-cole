# Deployment Guide - Cloudflare Pages

## 🚀 Quick Deploy

### Option 1: Automated GitHub Deployment (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Mission Control Dashboard"
   git remote add origin <your-github-repo>
   git push -u origin main
   ```

2. **Connect to Cloudflare Pages**
   - Go to [Cloudflare Pages](https://pages.cloudflare.com/)
   - Click "Create a project"
   - Connect your GitHub repository
   - Configure build settings:
     - **Build command:** `npm run build`
     - **Build output directory:** `dist`
     - **Environment variables:** None required
   - Click "Save and Deploy"

3. **Configure Custom Domain**
   - Project name: `mission-control-cole`
   - Custom domain: `mission-control-cole.pages.dev` (auto-assigned)

### Option 2: Direct Deploy with Wrangler

1. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

2. **Deploy**
   ```bash
   npm run build
   npx wrangler pages deploy dist --project-name=mission-control-cole
   ```

3. **Follow prompts** to confirm deployment

## 📋 Build Settings for Cloudflare Pages

| Setting | Value |
|---------|-------|
| Framework | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 18+ |
| Environment variables | None |

## 🔄 Continuous Deployment

Once connected to GitHub, Cloudflare Pages will automatically:
- Deploy on every push to `main` branch
- Create preview deployments for pull requests
- Provide deployment previews at `<branch>.<project>.pages.dev`

## 🌐 Deployment URL

**Production:** https://mission-control-cole.pages.dev

## 🛠️ Manual Deployment Steps

If you prefer manual deployment:

1. **Build the project**
   ```bash
   npm install
   npm run build
   ```

2. **Verify build output**
   ```bash
   ls -la dist/
   # Should contain: index.html, assets/, etc.
   ```

3. **Deploy to Cloudflare Pages**
   ```bash
   npx wrangler pages deploy dist --project-name=mission-control-cole
   ```

## 🔍 Troubleshooting

### Build Fails

**Error:** TypeScript compilation errors
```bash
# Check for errors
npm run build

# Fix TypeScript issues and rebuild
```

**Error:** Missing dependencies
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Deployment Fails

**Error:** Authentication required
```bash
# Login to Cloudflare
wrangler login
```

**Error:** Project name already exists
```bash
# Use a different project name
npx wrangler pages deploy dist --project-name=mission-control-brian
```

### 404 Errors on Deployed Site

**Issue:** React Router routes return 404
**Solution:** Cloudflare Pages automatically handles SPA routing for Vite projects

If issues persist, create a `_redirects` file:
```bash
echo "/* /index.html 200" > dist/_redirects
```

Then redeploy.

## 📊 Deployment Checklist

- [x] Project builds successfully (`npm run build`)
- [x] No TypeScript errors
- [x] All dependencies installed
- [ ] GitHub repository created
- [ ] Cloudflare Pages project connected
- [ ] Custom domain configured (optional)
- [ ] Environment variables set (if needed)
- [ ] Deployment successful
- [ ] Site accessible at production URL
- [ ] All routes working (no 404s)
- [ ] Mobile responsive
- [ ] Cross-browser tested

## 🎯 Post-Deployment

After successful deployment:

1. **Test the live site**
   - Visit https://mission-control-cole.pages.dev
   - Navigate through all 6 sections
   - Test on mobile device
   - Check console for errors

2. **Monitor performance**
   - Check Lighthouse score
   - Verify loading times
   - Test WebSocket connections (when implemented)

3. **Share with team**
   - Send URL to Brian
   - Gather feedback
   - Iterate on design

## 🔐 Security Notes

- No environment variables required for basic deployment
- All API calls should use HTTPS
- WebSocket connections should use WSS (secure)
- No secrets should be committed to Git

## 📝 Deployment History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-12 | 1.0.0 | Initial deployment |

## 🆘 Support

If deployment issues persist:
1. Check [Cloudflare Pages docs](https://developers.cloudflare.com/pages/)
2. Review build logs in Cloudflare dashboard
3. Check wrangler documentation
4. Contact Cloudflare support

---

**Ready to deploy!** 🚀
