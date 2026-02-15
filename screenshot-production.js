#!/usr/bin/env node

import { chromium } from 'playwright';

async function captureScreenshots() {
  const browser = await chromium.launch({
    headless: true,
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📸 Navigating to production URL...');
    await page.goto('https://mission-control-cole.pages.dev', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });
    
    console.log('⏳ Waiting for page to load...');
    await page.waitForTimeout(5000);
    
    console.log('📸 Taking screenshot...');
    await page.screenshot({
      path: 'production-screenshot.png',
      fullPage: false,
    });
    
    console.log('✅ Screenshot saved to production-screenshot.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
