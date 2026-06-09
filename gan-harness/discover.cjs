'use strict';
const { chromium } = require('playwright');

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:3000';
const API_URL = process.env.QA_API_URL || 'http://localhost:8000';

const WEBHOOK = {
  ProblemID: 'P-DISCOVER',
  ProblemTitle: 'High response time on checkout-service',
  State: 'OPEN',
  ProblemSeverity: 'PERFORMANCE',
  ImpactedEntities: [
    { type: 'SERVICE', name: 'checkout-service', entity: 'SERVICE-ABC123' },
  ],
};

async function dumpFields(page, label) {
  const url = page.url();
  const fields = await page.evaluate(() => {
    const result = [];
    document
      .querySelectorAll('input, select, textarea, button, a, [role="button"], [contenteditable]')
      .forEach((el) => {
        if (el.offsetParent === null) return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        result.push({
          tag: el.tagName,
          type: el.type || '',
          text: (el.textContent || '').trim().substring(0, 60),
          placeholder: el.placeholder || '',
          ariaLabel: el.getAttribute('aria-label') || '',
          dataTestId: el.getAttribute('data-testid') || '',
          href: el.tagName === 'A' ? el.getAttribute('href') : '',
          x: Math.round(rect.x),
          y: Math.round(rect.y),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        });
      });
    return result;
  });
  console.log(`\n=== ${label} (${url}) ===`);
  console.log(JSON.stringify(fields, null, 2));

  const headings = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('h1, h2, h3'))
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({ tag: el.tagName, text: (el.textContent || '').trim().substring(0, 80) }));
  });
  console.log(`\n--- Headings on ${label} ---`);
  console.log(JSON.stringify(headings, null, 2));
}

(async () => {
  // Seed an incident
  const seed = await fetch(`${API_URL}/api/webhooks/dynatrace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(WEBHOOK),
  });
  const seedJson = await seed.json();
  console.log('SEED RESULT:', JSON.stringify(seedJson));
  const incidentId = seedJson.incident_id;

  // Wait for the agent loop to settle (Step 7 AWAIT)
  await new Promise((r) => setTimeout(r, 8000));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await dumpFields(page, 'DASHBOARD');

  await page.goto(`${BASE_URL}/incidents`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await dumpFields(page, 'INCIDENTS_LIST');

  await page.goto(`${BASE_URL}/incidents/${incidentId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await dumpFields(page, 'INCIDENT_DETAIL');

  await browser.close();
  console.log(`\nDISCOVERY DONE. incidentId=${incidentId}`);
})().catch((e) => {
  console.error('DISCOVERY ERROR:', e);
  process.exit(1);
});
