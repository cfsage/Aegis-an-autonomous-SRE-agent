'use strict';
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:3000';
const API_URL = process.env.QA_API_URL || 'http://localhost:8000';
const SCREENSHOT_DIR = path.resolve(__dirname, 'screenshots');
const OUTPUT_NAME = 'aegis-demo.webm';
const REHEARSAL = process.argv.includes('--rehearse');

const WEBHOOK = {
  ProblemID: 'P-2026-LIVE',
  ProblemTitle: 'Checkout latency spike on payment-gateway',
  State: 'OPEN',
  ProblemSeverity: 'PERFORMANCE',
  ImpactedEntities: [
    { type: 'SERVICE', name: 'payment-gateway', entity: 'SERVICE-PAY-001' },
    { type: 'SERVICE', name: 'checkout-api', entity: 'SERVICE-CHK-002' },
  ],
};

// ── Overlay helpers ──────────────────────────────────────────────

async function injectCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById('demo-cursor')) return;
    const cursor = document.createElement('div');
    cursor.id = 'demo-cursor';
    cursor.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 3L19 12L12 13L9 20L5 3Z" fill="white" stroke="black" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`;
    cursor.style.cssText = `
      position: fixed; z-index: 999999; pointer-events: none;
      width: 24px; height: 24px; left: 640px; top: 360px;
      transition: left 0.1s linear, top 0.1s linear;
      filter: drop-shadow(1px 1px 3px rgba(0,0,0,0.5));
    `;
    document.body.appendChild(cursor);
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px';
      cursor.style.top = e.clientY + 'px';
    });
  });
}

async function injectSubtitleBar(page) {
  await page.evaluate(() => {
    if (document.getElementById('demo-subtitle')) return;
    const bar = document.createElement('div');
    bar.id = 'demo-subtitle';
    bar.style.cssText = `
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 999998;
      text-align: center; padding: 14px 28px;
      background: rgba(8, 8, 10, 0.82);
      color: white;
      font-family: 'Onest', -apple-system, "Segoe UI", system-ui, sans-serif;
      font-size: 16px; font-weight: 500; letter-spacing: 0.02em;
      transition: opacity 0.3s ease;
      pointer-events: none;
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    `;
    bar.textContent = '';
    bar.style.opacity = '0';
    document.body.appendChild(bar);
  });
}

async function showSubtitle(page, text) {
  await page.evaluate((t) => {
    const bar = document.getElementById('demo-subtitle');
    if (!bar) return;
    if (t) {
      bar.textContent = t;
      bar.style.opacity = '1';
    } else {
      bar.style.opacity = '0';
    }
  }, text);
  if (text) await page.waitForTimeout(400);
}

async function injectOverlays(page) {
  await injectCursor(page);
  await injectSubtitleBar(page);
}

// ── Interaction helpers ──────────────────────────────────────────

async function ensureVisible(page, locator, label) {
  const el = typeof locator === 'string' ? page.locator(locator).first() : locator;
  const visible = await el.isVisible().catch(() => false);
  if (!visible) {
    console.error(`REHEARSAL FAIL: "${label}" not found — selector: ${typeof locator === 'string' ? locator : '(locator)'}`);
    const found = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button, input, a, [role="button"]'))
        .filter((el) => el.offsetParent !== null)
        .slice(0, 30)
        .map((el) => `${el.tagName} "${(el.textContent || '').trim().substring(0, 40)}"`)
        .join('\n  ');
    });
    console.error('  Visible elements:\n  ' + found);
    return false;
  }
  console.log(`REHEARSAL OK: "${label}"`);
  return true;
}

async function moveAndClick(page, locator, label, opts = {}) {
  const { postClickDelay = 800 } = opts;
  const el = typeof locator === 'string' ? page.locator(locator).first() : locator;
  const visible = await el.isVisible().catch(() => false);
  if (!visible) {
    console.error(`WARN: moveAndClick skipped — "${label}" not visible`);
    return false;
  }
  try {
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const box = await el.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 14 });
      await page.waitForTimeout(450);
    }
    await el.click();
  } catch (e) {
    console.error(`WARN: moveAndClick failed on "${label}": ${e.message}`);
    return false;
  }
  await page.waitForTimeout(postClickDelay);
  return true;
}

async function moveTo(page, locator, label) {
  const el = typeof locator === 'string' ? page.locator(locator).first() : locator;
  const visible = await el.isVisible().catch(() => false);
  if (!visible) {
    console.warn(`WARN: moveTo skipped — "${label}" not visible`);
    return false;
  }
  try {
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const box = await el.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
    }
  } catch (e) {
    console.warn(`WARN: moveTo failed on "${label}": ${e.message}`);
  }
  return true;
}

async function smoothScroll(page, top) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), top);
  await page.waitForTimeout(1200);
}

async function postWebhook() {
  const r = await fetch(`${API_URL}/api/webhooks/dynatrace`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(WEBHOOK),
  });
  const j = await r.json();
  if (!j.incident_id) throw new Error(`Webhook returned no incident_id: ${JSON.stringify(j)}`);
  return j.incident_id;
}

// ── Phase 2: REHEARSAL ───────────────────────────────────────────

async function rehearse() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  let allOk = true;

  // Seed an incident so the detail-page selectors exist
  const incidentId = await postWebhook();
  console.log(`REHEARSAL seed: ${incidentId}`);
  await page.waitForTimeout(7000);

  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  if (!await ensureVisible(page, 'h1:has-text("Command Center")', 'Dashboard H1')) allOk = false;
  if (!await ensureVisible(page, 'a[href="/incidents"]', 'Nav: Incidents')) allOk = false;
  if (!await ensureVisible(page, 'a[href^="/incidents/"]', 'Any incident row')) allOk = false;

  await page.goto(`${BASE_URL}/incidents/${incidentId}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  if (!await ensureVisible(page, 'h1', 'Detail page H1')) allOk = false;
  if (!await ensureVisible(page, 'button:has-text("Approve")', 'Approve button')) allOk = false;
  if (!await ensureVisible(page, 'button:has-text("Reject")', 'Reject button')) allOk = false;

  await browser.close();
  if (!allOk) {
    console.error('REHEARSAL FAILED');
    process.exit(1);
  }
  console.log('REHEARSAL PASSED — all selectors verified');
}

// ── Phase 3: RECORD ──────────────────────────────────────────────

async function record() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: SCREENSHOT_DIR, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 },
  });
  const page = await context.newPage();

  try {
    // ── ACT 1: Dashboard at rest ──
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);
    await injectOverlays(page);
    await showSubtitle(page, 'Command Center · production is calm');
    await page.mouse.move(640, 300, { steps: 8 });
    await page.waitForTimeout(1800);
    await moveTo(page, 'h1:has-text("Command Center")', 'Command Center heading');
    await page.waitForTimeout(1200);
    await moveTo(page, 'a[href="/incidents"]', 'Incidents nav');
    await page.waitForTimeout(900);

    // ── ACT 2: A page arrives ──
    await showSubtitle(page, 'A page arrives from Dynatrace');
    await page.waitForTimeout(1400);
    const incidentId = await postWebhook();
    console.log(`Live incident: ${incidentId}`);
    await page.waitForTimeout(900);

    // ── ACT 3: Open the war room ──
    await showSubtitle(page, 'Aegis takes the page');
    await page.goto(`${BASE_URL}/incidents/${incidentId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await injectOverlays(page);
    await page.mouse.move(640, 360, { steps: 6 });

    // Watch the agent loop stream in
    await showSubtitle(page, 'Step 1 · Classify severity and blast radius');
    await page.waitForTimeout(1600);
    await showSubtitle(page, 'Step 2 · Gather telemetry from Dynatrace MCP');
    await page.waitForTimeout(1600);
    await showSubtitle(page, 'Step 3 · Correlate signals across the timeline');
    await smoothScroll(page, 400);
    await page.waitForTimeout(1400);
    await showSubtitle(page, 'Step 4 · Generate ranked hypotheses');
    await smoothScroll(page, 800);
    await page.waitForTimeout(1600);
    await showSubtitle(page, 'Each hypothesis carries a confidence score');
    await page.waitForTimeout(1800);
    await showSubtitle(page, 'Step 5 · Verify the top hypothesis');
    await smoothScroll(page, 1200);
    await page.waitForTimeout(1600);

    // ── ACT 4: Proposed remediation + human approval ──
    await showSubtitle(page, 'Step 6 · Propose a remediation');
    await smoothScroll(page, 1500);
    await page.waitForTimeout(1500);
    await showSubtitle(page, 'Step 7 · Wait for human approval');
    await smoothScroll(page, 1700);
    await page.waitForTimeout(1200);

    const approveBtn = page.locator('button:has-text("Approve")').first();
    await moveTo(page, approveBtn, 'Approve button');
    await showSubtitle(page, 'Engineer in the loop — one click');
    await page.waitForTimeout(1400);
    await moveAndClick(page, approveBtn, 'Approve', { postClickDelay: 400 });

    // ── ACT 5: Execute, verify, RCA ──
    await showSubtitle(page, 'Step 8 · Executing rollback via Dynatrace API');
    await page.waitForTimeout(2200);
    await showSubtitle(page, 'Step 9 · Verifying fix — metrics returning to baseline');
    await page.waitForTimeout(2400);
    await showSubtitle(page, 'Step 10 · Generating post-incident RCA');
    await smoothScroll(page, 2200);
    await page.waitForTimeout(2200);

    // ── ACT 6: Resolved ──
    await showSubtitle(page, 'Resolved · MTTR under 60 seconds');
    await smoothScroll(page, 0);
    await page.waitForTimeout(2600);

    await showSubtitle(page, '');
    await page.waitForTimeout(900);
  } catch (err) {
    console.error('DEMO ERROR:', err.message, err.stack);
  } finally {
    const video = page.video();
    await context.close();
    if (video) {
      try {
        const src = await video.path();
        const dest = path.join(SCREENSHOT_DIR, OUTPUT_NAME);
        fs.copyFileSync(src, dest);
        console.log('Video saved:', dest);
      } catch (e) {
        console.error('ERROR copying video:', e.message);
      }
    }
    await browser.close();
  }
}

(async () => {
  if (REHEARSAL) {
    await rehearse();
  } else {
    await record();
  }
})().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
