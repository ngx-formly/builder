import { expect, test } from '@playwright/test';

for (const viewport of [
  { width: 1600, height: 1000 },
  { width: 390, height: 844 },
]) {
  test(`keeps editor styles valid at ${viewport.width}px`, async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', (message) => {
      if (message.text().includes('NG0318')) {
        warnings.push(message.text());
      }
    });

    await page.setViewportSize(viewport);
    await page.goto('/form-editor');
    await page.getByRole('button', { name: 'Create Form' }).first().click();

    const createDialog = page.getByRole('dialog', { name: 'Create Form' });
    await expect(createDialog).toBeVisible();
    await expect(createDialog).toHaveCSS('width', `${Math.min(800, viewport.width - 32)}px`);
    await expect(createDialog).toHaveCSS('height', '600px');
    await createDialog
      .getByRole('radio', { name: /Material Showcase\s+\u2022\s+Material\b/ })
      .check();
    await createDialog.getByRole('button', { name: /Create Form/ }).click();
    await expect(createDialog).toBeHidden();
    await expect(page.locator('core-form-builder-content')).toContainText('supportRequest');

    const badge = page.locator('core-active-field-chip p-chip').filter({ visible: true }).first();
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('supportRequest');
    await expect(badge).toHaveCSS('display', 'inline-flex');
    await expect(badge).toHaveCSS('border-radius', '16px');
    await expect(badge).toHaveCSS('background-color', 'rgb(241, 245, 249)');

    if (viewport.width < 1024) {
      await page.locator('.p-drawer-close-button').click();
      await expect(page.getByRole('complementary')).toBeHidden();
    }

    await page.getByRole('button', { name: 'Open preview', exact: true }).click();
    const preview = page.getByRole('dialog', { name: 'Form Preview' });
    await expect(preview).toBeVisible();
    await expect(
      preview
        .frameLocator('iframe[title="Responsive form preview"]')
        .getByRole('textbox', { name: 'Customer name' }),
    ).toBeVisible();
    expect(warnings).toEqual([]);
  });
}
