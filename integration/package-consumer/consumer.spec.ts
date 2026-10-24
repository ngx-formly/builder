import { expect, test } from '@playwright/test';

for (const viewport of [
  { width: 1536, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`renders the packaged editor at ${viewport.width}px`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto('/');

    const builder = page.locator('formly-builder');
    await expect(builder).toBeVisible();
    await expect(builder).toHaveCSS('--panel-header-height', '80px');
    await expect(page.locator('core-form-panel')).toHaveCSS('display', 'flex');
    await expect(page.locator('core-form-panel')).toHaveCSS('flex-direction', 'column');
    await expect(page.getByRole('button', { name: 'Create Form' }).first()).toHaveCSS(
      'align-items',
      'center',
    );
    await expect(page.getByRole('button', { name: 'Create Form' }).first()).not.toHaveCSS(
      'background-color',
      'rgba(0, 0, 0, 0)',
    );

    await page.getByRole('button', { name: 'Create Form' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Create Form' });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel('Name', { exact: true }).fill('Packaged form');
    await dialog.getByRole('button', { name: 'Create Form' }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.locator('core-form-panel')).toContainText('Packaged form');
    await expect(page.locator('body')).toHaveJSProperty('scrollWidth', viewport.width);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('consumer.png'), fullPage: true });
  });
}
