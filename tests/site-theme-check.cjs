const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const files = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
  .split('\n').filter(f => f.endsWith('.html') && !f.startsWith('.github/'));

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || (process.platform === 'win32'
      ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : chromium.executablePath()),
  });
  const failures = [];
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    let pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const file of files) {
        pageErrors = [];
        await page.goto(pathToFileURL(path.join(root, file)).href);
        const report = await page.evaluate(() => {
          const body = getComputedStyle(document.body);
          return {
            theme: !!document.querySelector('link[href$="assets/site-theme.css"]'),
            background: body.backgroundColor,
            overflow: document.documentElement.scrollWidth > innerWidth,
            heading: parseFloat(getComputedStyle(document.querySelector('h1')).fontSize),
          };
        });
        if (!report.theme || report.overflow || report.heading > 38 || pageErrors.length) {
          failures.push({ file, width, ...report, pageErrors });
        }
        await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
        assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor),
          'rgb(21, 24, 22)', `${file}: shared dark background`);
      }
    }
    assert.deepEqual(failures, [], 'All public pages must support the shared theme and mobile width');
    await page.goto(pathToFileURL(path.join(root, 'android-interview-10-day-plan.html')).href);
    await page.locator('input[data-key]').first().check();
    await page.reload();
    assert(await page.locator('input[data-key]').first().isChecked(), 'Study progress survives reload');
    await page.locator('input[data-key]').first().uncheck();
    await page.locator('[data-site-theme-toggle]').click();
    const theme = await page.evaluate(() => document.documentElement.dataset.theme);
    await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), theme, 'Theme shared with homepage');
    for (const file of ['guides/android-custom-view-interview-guide.html', 'guides/kotlin-keywords-interview-guide.html']) {
      await page.setViewportSize({ width: 390, height: 900 });
      await page.goto(pathToFileURL(path.join(root, file)).href);
      assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), theme, `${file}: shared theme preference`);
      await page.locator('#drawerOpen').click();
      assert(await page.locator('body').evaluate(body => body.classList.contains('drawer-open')), 'Mobile drawer opens');
      await page.locator('#searchInput').fill('zzzz-no-match');
      assert.equal(await page.locator('.question-card:visible,.keyword-card:visible').count(), 0, `${file}: search filters cards`);
      await page.locator('#searchInput').fill('');
      assert(await page.locator('.question-card:visible,.keyword-card:visible').count() > 0, `${file}: search resets`);
      await page.locator('#drawerClose').click();
      assert(!await page.locator('body').evaluate(body => body.classList.contains('drawer-open')), 'Mobile drawer closes');
      // The guide intentionally hides section controls on narrow screens.
      await page.setViewportSize({ width: 1440, height: 900 });
      const toggle = page.locator('.section-toggle:visible').first();
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'false', 'Section collapses');
      await toggle.click();
      const mastery = page.locator('.master-btn:visible').first();
      await mastery.click();
      await page.reload();
      assert(await page.locator('.master-btn[aria-pressed="true"]').count() > 0, 'Guide progress survives reload');
    }
    console.log(`PASS: ${files.length} public pages, desktop/mobile, dark theme, shared preference, progress and guide search`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
