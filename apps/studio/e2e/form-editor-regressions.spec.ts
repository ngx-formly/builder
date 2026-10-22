import { expect, Page, test } from '@playwright/test';

async function createMaterialForm(page: Page) {
  await page.getByRole('button', { name: 'Create Form' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Create Form' });
  await dialog.getByRole('radio', { name: /Material Showcase\s+\u2022\s+Material\b/ }).check();
  await dialog.getByRole('button', { name: /Create Form/ }).click();
  await expect(page.getByRole('button', { name: 'Builder', exact: true })).toBeVisible();
}

test('reopens a saved form using only the keyboard', async ({ page }) => {
  await page.goto('/form-editor');
  await createMaterialForm(page);
  await page.reload();
  await page.getByRole('button', { name: 'Open Workspace panel', exact: true }).click();

  const openForm = page.getByRole('button', { name: /^Open form / });
  await page.getByPlaceholder('Filter items...').focus();
  for (let i = 0; i < 5 && !(await openForm.evaluate((el) => el === document.activeElement)); i++) {
    await page.keyboard.press('Tab');
  }
  await expect(openForm).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Builder', exact: true })).toBeVisible();
});

for (const mode of ['inline', 'dialog'] as const) {
  test(`keeps Material preview popups inside the ${mode} frame`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto('/form-editor');
    await createMaterialForm(page);
    await page
      .getByRole('button', { name: mode === 'inline' ? 'Preview' : 'Open preview', exact: true })
      .click();

    const preview =
      mode === 'dialog'
        ? page.getByRole('dialog', { name: 'Form Preview' })
        : page.locator('core-form-preview-content').first();
    const frame = preview.frameLocator('iframe[title="Responsive form preview"]');
    const dateInput = frame.getByRole('textbox', { name: 'Preferred follow-up date' });
    await dateInput.clear();
    await frame.getByRole('button', { name: 'Open calendar' }).click();
    const calendar = frame.locator('mat-calendar');
    await expect(calendar).toBeVisible();
    await expect(page.locator('mat-calendar')).toHaveCount(0);
    const input = await dateInput.boundingBox();
    const popup = await calendar.boundingBox();
    expect(input).not.toBeNull();
    expect(popup).not.toBeNull();
    expect(Math.abs(popup!.x - input!.x)).toBeLessThan(32);
    await calendar
      .locator('button.mat-calendar-body-cell:not(.mat-calendar-body-disabled)')
      .first()
      .click();
    await expect(calendar).toBeHidden();
    await expect(dateInput).not.toBeEmpty();

    await preview.getByRole('button', { name: 'SM', exact: true }).click();
    await frame.getByRole('button', { name: 'Open calendar' }).click();
    await expect(calendar).toBeVisible();
    const resizedInput = await dateInput.boundingBox();
    const resizedPopup = await calendar.boundingBox();
    expect(Math.abs(resizedPopup!.x - resizedInput!.x)).toBeLessThan(32);
    // Material ignores close requests while its opening animation is active.
    await expect
      .poll(() =>
        frame
          .locator('mat-datepicker-content')
          .evaluate((content) => content.getAnimations().length),
      )
      .toBe(0);
    await calendar.getByRole('button', { name: 'Choose month and year' }).press('Escape');
    await expect(calendar).toBeHidden();

    await frame.getByRole('combobox', { name: 'Topic' }).click();
    await expect(frame.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await frame.getByRole('option').first().click();
    await expect(frame.getByRole('listbox')).toBeHidden();
    await expect(frame.getByRole('combobox', { name: 'Topic' })).not.toBeEmpty();

    await frame.getByRole('combobox', { name: 'Topic' }).click();
    await frame.locator('.cdk-overlay-backdrop').click({ position: { x: 1, y: 1 } });
    await expect(frame.getByRole('listbox')).toBeHidden();
  });
}
