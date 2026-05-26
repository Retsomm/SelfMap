(async () => {
  const pw = await import('playwright');
  const { chromium } = pw;
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  await page.screenshot({ path: '/tmp/before_focus.png' });
  const input = page.locator('input[placeholder="城市名稱…"]');
  const boxBefore = await input.boundingBox();
  console.log('Before focus:', JSON.stringify(boxBefore));

  await input.focus();
  await page.waitForTimeout(500);

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

  await browser.close();
})();
