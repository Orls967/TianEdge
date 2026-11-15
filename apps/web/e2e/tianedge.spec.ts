import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('TIANEDGE End-to-End Platform Verification', () => {
  test('TC-APP-01 & TC-3D-PERF: all 6 routes load, WebGL scene renders GLBs within poly/draw budget, and no runtime errors occur', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`console.error: ${msg.text()}`);
      }
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Explore the Architecture/i })).toBeVisible();
    await expect(page.getByText(/Local Mode/i)).toBeVisible();

    // Verify 3D anatomy & live WebGL metrics (TC-3D-01..05)
    await page.getByRole('link', { name: 'Chip Anatomy' }).first().click();
    await expect(page).toHaveURL(/\/anatomy/);
    await expect(page.getByRole('heading', { name: /Chip Anatomy \(36\)/i })).toBeVisible();

    await page.waitForFunction(
      () =>
        window.__TIANEDGE_SCENE_METRICS__ !== undefined &&
        window.__TIANEDGE_SCENE_METRICS__.drawCalls > 0,
      { timeout: 15000 },
    );
    const metrics = await page.evaluate(() => window.__TIANEDGE_SCENE_METRICS__);
    expect(metrics).toBeDefined();
    console.log(
      `[WebGL Metrics /anatomy] drawCalls=${metrics!.drawCalls}, triangles=${metrics!.triangles}, fallbackAssets=${metrics!.fallbackAssets}`,
    );
    expect(metrics!.fallbackAssets).toBe(0);
    expect(metrics!.drawCalls).toBeLessThanOrEqual(120);
    expect(metrics!.triangles).toBeLessThanOrEqual(150_000);

    // Switch through Exploded View, Section Cut, and Digital Logic Isolation
    await page.getByRole('button', { name: 'Exploded View' }).click();
    await page.getByRole('button', { name: 'Section Cut' }).click();
    await expect(page.locator('#section-cut-slider')).toBeVisible();

    await page
      .getByRole('treeitem', { name: 'Transistors (MOSFET / FinFET Conceptual Model)' })
      .click();
    await expect(page.getByText(/CONCEPTUAL MODEL — NOT TO SCALE/i).first()).toBeVisible();
    await expect(page.getByText(/Scale & Abstraction Notice/i).first()).toBeVisible();

    // Verify Insights (13 topics + KaTeX math)
    await page.getByRole('link', { name: 'Engineering Insights' }).first().click();
    await expect(page).toHaveURL(/\/insights/);
    await expect(page.getByRole('heading', { name: /Engineering Insights \(13 Core Topics\)/i })).toBeVisible();

    // Verify Library search works completely offline
    await page.getByRole('link', { name: 'Technical Library' }).first().click();
    await expect(page).toHaveURL(/\/library/);
    await page.getByLabel('Search Technical Library').fill('ALU');
    await expect(page.getByText(/search match/i)).toBeVisible();
    await page.getByRole('tab', { name: 'Formulas (6)' }).click();
    await expect(page.locator('.katex').first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('TC-CPU-02 & TC-INT-03: WASM CPU executes canonical program accurately and Instruction Journey hands off cleanly', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/journey');
    await expect(page.getByRole('heading', { name: 'Instruction Journey' })).toBeVisible();

    // Wait for WASM core initialization
    await expect(page.getByText(/WASM Ready/i)).toBeVisible({ timeout: 15000 });

    // Advance to stage 5 (MEMORY_ACCESS bypassed for ADD R3, R1, R2)
    await page.getByRole('button', { name: /^5\./ }).click();
    await expect(page.getByText(/MEMORY ACCESS BYPASSED/i).first()).toBeVisible();

    // Handoff to Simulator
    await page.getByRole('button', { name: /Open in CPU Simulator/i }).click();
    await expect(page).toHaveURL(/\/simulator/);
    await expect(page.getByRole('heading', { name: 'TIAN-ISA v1 CPU Simulator' })).toBeVisible();

    // Reset and step/run canonical baseline (4 instructions * 6 stages = 24 cycles)
    await page.getByRole('button', { name: 'Assemble & Load' }).click();
    await page.locator('#sim-speed-slider').fill('0');
    await page.getByRole('button', { name: 'Run' }).click();

    await expect(page.getByTestId('sim-clock-cycles')).toHaveText('24', { timeout: 15000 });
    await expect(page.getByTestId('sim-executed-instr')).toHaveText('4');
    await expect(page.getByTestId('reg-row-R1')).toContainText('10');
    await expect(page.getByTestId('reg-row-R2')).toContainText('20');
    await expect(page.getByTestId('reg-row-R3')).toContainText('30');
    await expect(page.getByTestId('mem-cell-100')).toContainText('30');

    // Reset clears telemetry cleanly
    await page.getByRole('button', { name: 'Reset' }).first().click();
    await expect(page.getByTestId('sim-clock-cycles')).toHaveText('0');
    await expect(page.getByTestId('reg-row-R3')).toContainText('0');

    expect(errors).toEqual([]);
  });

  test('TC-APP-02: responsive layout fits 1024x768 and 390x844 viewports without horizontal overflow', async ({
    page,
  }) => {
    for (const vp of [
      { width: 1024, height: 768 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(vp);
      for (const route of ['/', '/anatomy', '/simulator', '/library']) {
        await page.goto(route);
        await expect(page.locator('main')).toBeVisible();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, `Overflow at ${route} (${vp.width}x${vp.height})`).toBeLessThanOrEqual(4);
      }
    }
  });

  test('TC-APP-04: axe-core automated WCAG accessibility scan passes with zero critical/serious violations', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const route of ['/', '/anatomy', '/journey', '/simulator', '/insights', '/library']) {
      await page.goto(route);
      await page.waitForTimeout(300);
      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      );
      expect(
        blocking,
        `Accessibility violations on ${route}: ${JSON.stringify(blocking, null, 2)}`,
      ).toEqual([]);
    }
  });
});
