# Mission Control - Percy Visual Test Suite

## Overview

Comprehensive Percy visual testing suite that captures screenshots of all Mission Control pages across multiple viewports (Desktop, iPhone, Android) and validates against real data.

## What's Tested

### Pages
- **Dashboard Overview** (`/`)
- **Cost Tracking** (`/costs`)
- **Agents** (`/agents`)
- **Skills** (`/skills`)
- **Calendar** (`/calendar`)
- **Logs** (`/logs`)

### Viewports
- **Desktop**: 1280x800
- **iPhone**: 375x812 (iPhone 14 Pro dimensions)
- **Android**: 412x915 (Pixel 7 dimensions)

### Time Range States (Cost Tracking)
- Daily view
- Weekly view
- Monthly view

### Data Validation
- Verifies no mock/fake data patterns
- Checks for hardcoded values
- Ensures real data from JSON files

## Running Tests

### Locally (without Percy)
```bash
# Start dev server
npm run dev

# In another terminal, run tests against local
BASE_URL=http://localhost:5173 node tests/percy-full-suite.js
```

### With Percy (requires PERCY_TOKEN)
```bash
# Against production
npm run test:percy

# Against local dev server
npm run test:percy:local
```

### CI/CD Integration
Percy tests run automatically on every push to `master`/`main`:
1. Build completes
2. Deploy to Cloudflare Pages
3. Wait 30 seconds for CDN propagation
4. Run comprehensive Percy suite
5. Upload visual snapshots to Percy dashboard

## Test Files

### `percy-full-suite.js`
Comprehensive test suite covering:
- All 6 pages × 3 viewports = 18 base snapshots
- Cost Tracking time range variations = 3 additional snapshots
- **Total: ~21 Percy snapshots per run**

### `screenshots.spec.ts`
Playwright test for basic page loading and screenshot capture.

### `time-range.spec.ts`
Playwright test for Cost Tracking time range toggle functionality.

## Percy Dashboard

Visual diffs and history: https://percy.io/[your-org]/mission-control-cole

## Environment Variables

- `BASE_URL`: Target URL for tests (default: `https://mission-control-cole.pages.dev`)
- `PERCY_TOKEN`: Percy API token (required for `test:percy` scripts)

## Fake Data Detection

The suite includes automatic detection of common fake data patterns:
- `generateMockLog`
- `sampleMemories`
- `Math.random`
- `Simulated`
- `hardcoded`
- `placeholder`

If any of these patterns are found in page content, a warning is logged.

## Adding New Tests

To add a new page to the test suite:

1. Add to `PAGES` array in `percy-full-suite.js`:
```javascript
const PAGES = [
  // ...existing pages
  { path: '/new-page', name: 'New Page' }
];
```

2. Add special interactions if needed (like time range toggles):
```javascript
// After standard viewport tests
if (viewportName === 'desktop') {
  console.log(`  → New Page - Special Tests`);
  await page.goto(BASE_URL + '/new-page', { waitUntil: 'networkidle' });
  
  // Interact with page elements
  await page.click('button.some-toggle');
  await page.waitForTimeout(1000);
  await percySnapshot(page, 'New Page - Special State', { widths: [1280] });
}
```

3. Commit and push - CI will run automatically

## Troubleshooting

### Tests timing out
- Increase timeout in `page.goto()` options
- Check if page is actually loading at the URL
- Verify Cloudflare Pages deployment succeeded

### Percy snapshots not appearing
- Verify `PERCY_TOKEN` is set correctly
- Check Percy dashboard for build status
- Ensure `@percy/cli` and `@percy/playwright` are installed

### Fake data warnings
- Check that real JSON files exist in `dist/` after build
- Verify `prebuild` script runs successfully
- Inspect page source to locate mock data patterns

## Performance

Typical run time:
- **3 viewports** × **6 pages** = ~2-3 minutes
- **Special tests** (time ranges) = +30 seconds
- **Total**: ~3-4 minutes per full suite run

## Pass/Fail Criteria

Tests pass when:
- All pages load successfully (HTTP 200)
- No JavaScript errors in console
- Percy snapshots captured without errors
- No fake data patterns detected (warning only, not failure)

Percy visual review happens on Percy dashboard where you:
- Approve changes (expected UI updates)
- Reject changes (unintended regressions)
- Set up auto-approve rules for minor changes
