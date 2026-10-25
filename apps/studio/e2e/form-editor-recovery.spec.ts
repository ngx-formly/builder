import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('backs up the hierarchy and blocks creation until corrupt forms are reset', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.goto('/form-editor');
  const hierarchy = JSON.stringify({
    workspaceId: 'form-editor',
    rootNodeIds: ['folder'],
    nodeMap: {
      folder: {
        id: 'folder',
        name: 'Keep in backup',
        type: 'folder',
        parentId: null,
        idPath: ['folder'],
        childIds: [],
      },
    },
  });
  await page.evaluate((rawHierarchy) => {
    localStorage.setItem('formly-studio-forms-form-editor', '{invalid-json');
    localStorage.setItem('formly-studio-hierarchy-form-editor', rawHierarchy);
  }, hierarchy);
  await page.reload();

  const createForm = page
    .locator('core-form-panel core-empty-no-form')
    .getByRole('button', { name: 'Create Form' });
  await expect(createForm).toBeDisabled();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download backup' }).click();
  const download = await downloadPromise;
  const backup = JSON.parse(await readFile((await download.path())!, 'utf8'));
  expect(backup.entries).toEqual([
    expect.objectContaining({
      kind: 'forms',
      rawValue: '{invalid-json',
      relatedEntries: [{ storageKey: 'formly-studio-hierarchy-form-editor', rawValue: hierarchy }],
    }),
  ]);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reset local data' }).click();
  await expect(page.getByText('Saved workspace data could not be read.')).toBeHidden();
  await expect(createForm).toBeEnabled();
  await createForm.click();
  const dialog = page.getByRole('dialog', { name: 'Create Form' });
  await dialog.getByRole('button', { name: 'Create Form' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Builder', exact: true })).toBeVisible();
});

test('keeps a mobile creation dialog open when storage becomes corrupt before submission', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/form-editor');
  await page
    .locator('core-form-panel core-empty-no-form')
    .getByRole('button', { name: 'Create Form' })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Create Form' });
  await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill('My draft');
  await page.evaluate(() =>
    localStorage.setItem('formly-studio-forms-form-editor', '{invalid-json'),
  );
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));

  await dialog.getByRole('button', { name: 'Create Form' }).click();

  await expect(dialog).toBeVisible();
  await expect(
    dialog.getByText('Recover saved data in the Workspace panel before creating a form.'),
  ).toBeVisible();
  await expect(dialog.getByRole('textbox', { name: 'Name', exact: true })).toHaveValue('My draft');
  await expect(dialog.getByRole('button', { name: 'Create Form' })).toBeDisabled();
  expect(errors).toEqual([]);
});
