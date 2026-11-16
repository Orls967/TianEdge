import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';

/**
 * README screenshot gallery. See `playwright.screenshots.config.ts` for usage.
 *
 *   SHOTS_BASE_URL=https://orls967.github.io/TianEdge/ npm run screenshots
 *
 * Images are written to `<repo>/docs/screenshots/`.
 */
const OUT_DIR = path.resolve(process.cwd(), '../../docs/screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const file = (name: string) => path.join(OUT_DIR, `${name}.png`);

async function settle(page: Page, ms = 1200) {
  await page.waitForTimeout(ms);
}

async function shot(page: Page, name: string, opts: { fullPage?: boolean } = {}) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);
  await page.screenshot({ path: file(name), fullPage: opts.fullPage ?? false });
}

async function shotOf(locator: Locator, name: string) {
  await locator.scrollIntoViewIfNeeded();
  await locator.screenshot({ path: file(name) });
}

async function waitForCanvas(page: Page) {
  const canvas = page.locator('canvas').first();
  await expect.poll(async () => (await canvas.boundingBox())?.width ?? 0, { timeout: 20000 }).toBeGreaterThan(300);
  // Let GLB assets stream in and the camera transition finish.
  await settle(page, 2500);
}

async function anatomyMode(page: Page, mode: string) {
  await page
    .getByRole('toolbar', { name: '3D Visualization Modes' })
    .getByRole('button', { name: mode, exact: true })
    .click();
  await settle(page, 2000);
}

test.describe('Desktop gallery (1440x900)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('01 Overview', async ({ page }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { name: /Explore the Architecture/i })).toBeVisible();
    await waitForCanvas(page);
    await shot(page, '01-overview-hero');
    await shot(page, '01-overview-full', { fullPage: true });
  });

  test('02 Chip Anatomy', async ({ page }) => {
    await page.goto('./anatomy?component=pkg-ihs&mode=full_assembly');
    await expect(page.getByRole('heading', { name: /Chip Anatomy \(36\)/i })).toBeVisible();
    await waitForCanvas(page);
    await shot(page, '02-anatomy-full-assembly');

    await anatomyMode(page, 'Exploded View');
    await shot(page, '02-anatomy-exploded');

    await anatomyMode(page, 'Section Cut');
    await shot(page, '02-anatomy-section-cut');

    await anatomyMode(page, 'Internal Architecture');
    await shot(page, '02-anatomy-internal');

    await anatomyMode(page, 'Signal Flow');
    await shot(page, '02-anatomy-signal-flow');

    await page.goto('./anatomy?component=core-alu&mode=component_isolation');
    await waitForCanvas(page);
    await shot(page, '02-anatomy-isolate-alu');

    await page.goto('./anatomy?component=logic-transistors&mode=component_isolation');
    await waitForCanvas(page);
    await shot(page, '02-anatomy-logic-transistor');
  });

  test('03 Instruction Journey', async ({ page }) => {
    await page.goto('./journey');
    await expect(page.getByRole('heading', { name: 'Instruction Journey' })).toBeVisible();
    await expect(page.getByText(/WASM Ready/i).first()).toBeVisible({ timeout: 20000 });
    await waitForCanvas(page);
    await shot(page, '03-journey-fetch');

    await page.getByRole('button', { name: /^4\./ }).click();
    await settle(page, 2000);
    await shot(page, '03-journey-execute');

    await page.getByRole('button', { name: /^5\./ }).click();
    await settle(page, 1500);
    await shot(page, '03-journey-memory-bypassed');
  });

  test('04 CPU Simulator', async ({ page }) => {
    await page.goto('./simulator');
    await expect(page.getByRole('heading', { name: 'TIAN-ISA v1 CPU Simulator' })).toBeVisible();
    await waitForCanvas(page);
    await shot(page, '04-simulator-ready');

    await page.getByRole('button', { name: 'Assemble & Load' }).click();
    await page.locator('#sim-speed-slider').fill('0');
    await page.getByRole('button', { name: 'Run' }).click();
    await expect(page.getByTestId('sim-clock-cycles')).toHaveText('24', { timeout: 20000 });
    await settle(page, 1200);
    await shot(page, '04-simulator-completed');

    await page.getByLabel('Select preset program').selectOption('sum-loop');
    await page.getByRole('button', { name: 'Assemble & Load' }).click();
    await page.getByRole('button', { name: 'Step Instr' }).click();
    await page.getByRole('button', { name: 'Step Instr' }).click();
    await page.getByRole('button', { name: 'Step Stage' }).click();
    await settle(page, 1500);
    await shot(page, '04-simulator-sum-loop-step');
  });

  test('05 Engineering Insights', async ({ page }) => {
    await page.goto('./insights?topic=cpu-pipelining');
    await expect(page.getByRole('heading', { name: /Engineering Insights \(13 Core Topics\)/i })).toBeVisible();
    await settle(page, 1200);
    await shot(page, '05-insights-pipelining');

    await page.goto('./insights?topic=power-consumption');
    await settle(page, 1200);
    const formula = page.locator('.katex-display').first();
    if (await formula.count()) {
      await shotOf(formula.locator('xpath=ancestor::section[1]'), '05-insights-formula');
    }
    await shot(page, '05-insights-power', { fullPage: true });
  });

  test('06 Technical Library', async ({ page }) => {
    await page.goto('./library');
    await expect(page.getByLabel('Search Technical Library')).toBeVisible();
    await settle(page, 1000);
    await shot(page, '06-library-encyclopedia');

    await page.getByLabel('Search Technical Library').fill('cache');
    await settle(page, 800);
    await shot(page, '06-library-search');

    await page.getByLabel('Search Technical Library').fill('');
    await page.getByRole('tab', { name: /^Formulas/ }).click();
    await settle(page, 1000);
    await shot(page, '06-library-formulas');

    await page.getByRole('tab', { name: /^Diagrams/ }).click();
    await settle(page, 1000);
    await shot(page, '06-library-diagrams');

    await page.getByRole('tab', { name: /^Learning Paths/ }).click();
    await settle(page, 800);
    await shot(page, '06-library-learning-paths');
  });
});

test.describe('Mobile gallery (390x844)', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

  test('07 Mobile', async ({ page }) => {
    await page.goto('./');
    await waitForCanvas(page);
    await shot(page, '07-mobile-overview');

    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await settle(page, 400);
    await shot(page, '07-mobile-nav');

    await page.goto('./anatomy?component=die-cpu-cores&mode=internal_architecture');
    await waitForCanvas(page);
    await shot(page, '07-mobile-anatomy');

    await page.goto('./simulator');
    await waitForCanvas(page);
    await shot(page, '07-mobile-simulator');
  });
});
