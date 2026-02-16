/**
 * Mission Control - Percy Visual Test Suite
 * 
 * Tests all pages across Desktop, iPhone, Android viewports
 * Verifies real data, no mock/fake data visible
 */

import { chromium } from 'playwright';
import percySnapshot from '@percy/playwright';

const BASE_URL = process.env.BASE_URL || 'https://mission-control-cole.pages.dev';

const VIEWPORTS = {
  desktop: { width: 1280, height: 800 },
  iphone: { width: 375, height: 812 },
  android: { width: 412, height: 915 }
};

const PAGES = [
  { path: '/', name: 'Dashboard Overview' },
  { path: '/costs', name: 'Cost Tracking' },
  { path: '/agents', name: 'Agents' },
  { path: '/skills', name: 'Skills' },
  { path: '/calendar', name: 'Calendar' },
  { path: '/logs', name: 'Logs' }
];

async function runTests() {
  const browser = await chromium.launch();
  
  for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
    console.log(`\n📱 Testing ${viewportName} (${viewport.width}x${viewport.height})`);
    
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    
    for (const pageInfo of PAGES) {
      const url = BASE_URL + pageInfo.path;
      console.log(`  → ${pageInfo.name}: ${url}`);
      
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        
        // Wait for content to load
        await page.waitForTimeout(2000);
        
        // Take Percy snapshot
        await percySnapshot(page, `${pageInfo.name} - ${viewportName}`, {
          widths: [viewport.width]
        });
        
        console.log(`    ✅ Snapshot captured`);
      } catch (error) {
        console.error(`    ❌ Error: ${error.message}`);
      }
    }
    
    // Test Cost page time ranges
    if (viewportName === 'desktop') {
      console.log(`  → Cost Tracking - Time Range Tests`);
      await page.goto(BASE_URL + '/costs', { waitUntil: 'networkidle' });
      
      // Daily view (should be default now)
      await percySnapshot(page, 'Cost Tracking - Daily View', { widths: [1280] });
      
      // Weekly view
      const weeklyBtn = await page.$('button:has-text("Weekly")');
      if (weeklyBtn) {
        await weeklyBtn.click();
        await page.waitForTimeout(1000);
        await percySnapshot(page, 'Cost Tracking - Weekly View', { widths: [1280] });
      }
      
      // Monthly view
      const monthlyBtn = await page.$('button:has-text("Monthly")');
      if (monthlyBtn) {
        await monthlyBtn.click();
        await page.waitForTimeout(1000);
        await percySnapshot(page, 'Cost Tracking - Monthly View', { widths: [1280] });
      }
    }
    
    await context.close();
  }
  
  await browser.close();
  console.log('\n✅ Percy test suite complete!');
}

// Verify real data checks
async function verifyNoFakeData() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('\n🔍 Verifying no fake data...');
  
  const fakeDataPatterns = [
    'generateMockLog',
    'sampleMemories',
    'Math.random',
    'Simulated',
    'hardcoded',
    'placeholder'
  ];
  
  for (const pageInfo of PAGES) {
    await page.goto(BASE_URL + pageInfo.path, { waitUntil: 'networkidle' });
    const content = await page.content();
    
    let hasFakeData = false;
    for (const pattern of fakeDataPatterns) {
      if (content.toLowerCase().includes(pattern.toLowerCase())) {
        console.log(`  ❌ ${pageInfo.name}: Found "${pattern}"`);
        hasFakeData = true;
      }
    }
    
    if (!hasFakeData) {
      console.log(`  ✅ ${pageInfo.name}: Clean`);
    }
  }
  
  await browser.close();
}

// Run both
(async () => {
  await verifyNoFakeData();
  await runTests();
})();