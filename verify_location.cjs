// Headless Playwright check: navigates to localhost:3000 and verifies the
// location input element is present and functional after focus.
(async () => {
  const pw = await import('playwright');
  const { chromium } = pw;
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: '/tmp/before_focus.png' });

    const input = page.locator('input[data-testid="location-input"]');
    await input.waitFor({ state: 'visible' });

    const boxBefore = await input.boundingBox();
    console.log('Before focus:', JSON.stringify(boxBefore));

    await input.focus();
    await input.waitFor({ state: 'visible' });

    await page.screenshot({ path: '/tmp/after_focus.png' });
    const boxAfter = await input.boundingBox();
    console.log('After focus:', JSON.stringify(boxAfter));

    const styles = await input.evaluate(el => ({
      computedWidth: window.getComputedStyle(el).width,
      computedHeight: window.getComputedStyle(el).height,
      inlineWidth: el.style.width,
      parentComputedWidth: window.getComputedStyle(el.parentElement).width,
      grandParentComputedWidth: window.getComputedStyle(el.parentElement.parentElement).width,
      grandParentClass: el.parentElement.parentElement.className,
    }));
    console.log('Computed styles:', JSON.stringify(styles));
  } catch (err) {
    console.error('verify_location failed:', err);
    process.exit(1);
  } finally {
    await browser?.close();
  }
})();
