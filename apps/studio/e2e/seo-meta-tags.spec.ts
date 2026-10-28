import { expect, test } from '@playwright/test';

const routes = [
  {
    path: '/',
    title: 'ngx-formly Builder | Visual Angular Form Builder',
  },
  {
    path: '/form-editor',
    title: 'Form Editor | ngx-formly Builder',
  },
] as const;

for (const route of routes) {
  test(`route title and static metadata: ${route.path}`, async ({ page }) => {
    await page.goto(route.path);

    await expect(page).toHaveTitle(route.title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Build, preview, and export ngx-formly forms visually with ngx-formly Builder, a visual authoring tool for Angular.',
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://formlystudio.com/',
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      'https://formlystudio.com/',
    );
  });
}

test('homepage, install metadata and crawler links use the builder identity', async ({
  page,
  request,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('link', { name: 'Go to ngx-formly Builder home page' }),
  ).toBeVisible();
  await expect(
    page.getByText('ngx-formly Builder is a visual authoring tool', { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Open ngx-formly Builder GitHub repository' }),
  ).toHaveAttribute('href', 'https://github.com/ngx-formly/ngx-formly-builder');
  await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
    'content',
    'ngx-formly Builder',
  );
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    'content',
    routes[0].title,
  );
  const manifest = await request.get('/site.webmanifest');
  expect(await manifest.json()).toMatchObject({
    name: 'ngx-formly Builder',
    short_name: 'Formly Builder',
  });
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain('Sitemap: https://formlystudio.com/sitemap.xml');
  const sitemap = await request.get('/sitemap.xml');
  expect(await sitemap.text()).toContain('<loc>https://formlystudio.com/</loc>');
  const llms = await request.get('/llms.txt');
  expect(await llms.text()).toContain('https://github.com/ngx-formly/ngx-formly-builder');
});
