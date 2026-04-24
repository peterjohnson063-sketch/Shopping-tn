const { test, expect } = require('@playwright/test');

test.describe('Everest smoke', () => {
  test('home loads with default JSON-LD', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Everest/i);
    await expect(page.locator('#jsonld-org')).toHaveCount(1);
    const raw = await page.locator('#jsonld-org').textContent();
    expect(raw).toContain('Organization');
  });

  test('language switch updates html lang and dir', async ({ page }) => {
    await page.goto('/');
    await page.locator('#lang-ar').click();
    await page.waitForFunction(() => document.documentElement.lang === 'ar', { timeout: 25000 });
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });

  test('track page shows tracking input', async ({ page }) => {
    await page.goto('/');
    await page.locator('#navbtn-track').click();
    await expect(page.locator('#track-num')).toBeVisible();
  });

  test('auth page renders sign-in tab', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      if (typeof showPage === 'function') showPage('auth');
    });
    await expect(page.locator('#tab-login')).toBeVisible({ timeout: 15000 });
  });

  test('add standard product to cart from listing', async ({ page }) => {
    await page.goto('/');
    await page.locator('#navbtn-products').click();
    await page.evaluate(() => {
      if (typeof filterAndGo === 'function') filterAndGo('furniture');
    });
    await page.waitForSelector('.product-card', { timeout: 45000 });
    await page.locator('.product-card').first().getByRole('button', { name: '+ Cart' }).click();
    await page.locator('#float-cart').click();
    await expect(page.locator('#cart-drawer')).toHaveClass(/open/);
    await expect(page.locator('#cart-drawer .cart-item')).toHaveCount(1);
  });

  test('product detail sets Product JSON-LD then clears on close', async ({ page }) => {
    await page.goto('/');
    await page.locator('#navbtn-products').click();
    await page.evaluate(() => {
      if (typeof filterAndGo === 'function') filterAndGo('furniture');
    });
    await page.waitForSelector('.product-card', { timeout: 45000 });
    await page.locator('.product-card').first().getByRole('button', { name: 'View Details' }).click();
    await expect(page.locator('#jsonld-product')).toHaveCount(1, { timeout: 15000 });
    const blob = await page.locator('#jsonld-product').textContent();
    expect(blob).toContain('Product');
    await page.locator('#product-modal .modal-close').click();
    await expect(page.locator('#jsonld-product')).toHaveCount(0);
  });
});
