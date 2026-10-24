# ngx-formly Builder

A visual form builder for ngx-formly that brings community efforts together. Build Angular forms
with drag-and-drop editing, custom components, live previews, and Formly JSON export.

## Project status

The repository is the shared foundation for an official ngx-formly builder. It currently provides
the Studio application, reusable editor libraries, multiple UI profiles, local persistence, and
authoring documentation.

The project is preparing its first embeddable package contract as `@ngx-formly/builder`, with
companion packages under `@ngx-formly/builder-*`. No compatibility guarantee is made until the
first public prerelease. See
[CONTRIBUTING.md](CONTRIBUTING.md) before proposing public API changes.

The project originated from the community evaluation in
[ngx-formly discussion #4198](https://github.com/ngx-formly/ngx-formly/discussions/4198). It uses
Formly Studio as the initial authoring foundation and will incorporate the strongest engineering
and schema workflows from the other community builders.

## Development

Use Node.js 24.15 or newer within the Node.js 24 release line and npm 11.19.0.
The builder uses Angular 22 and Formly 11.
PrimeNG 21 and PrimeUIX themes 2 retain their MIT licenses. Because PrimeNG 21 declares Angular 21
peers, Angular 22 consumers currently need the scoped npm overrides shown in the package-consumer
fixture. Removing this compatibility requirement is a prerequisite for a stable public release.

```sh
npm ci
npm start
```

Run `npm test`, `npm run lint`, `npm run check:docs`, and `npm run build` to validate changes. The
build also verifies that every external library import is declared by its published package, packs
the libraries, and builds a clean Angular consumer from those tarballs. After installing Playwright
Chromium, run `npm run check:packages:e2e` to check the packaged editor in a browser.

## Repository layout

- `apps/studio`: hosted reference application.
- `apps/docs`: author and integration documentation.
- `libs/state`: headless document models, hierarchy operations, and persistence contracts.
- `libs/core`: editor shell, UI orchestration, and extension contracts.
- `libs/ui/material`: reusable Material runtime fields.
- `libs/ui/builder-material`: editor-only adapters for Material composite fields.

## Package names

| Source                     | Package                               |
| -------------------------- | ------------------------------------- |
| `libs/core`                | `@ngx-formly/builder`                 |
| `libs/state`               | `@ngx-formly/builder-state`           |
| `libs/ui/material`         | `@ngx-formly/builder-material-fields` |
| `libs/ui/builder-material` | `@ngx-formly/builder-material`        |

The builder name maps to the existing editor shell in `libs/core`; source directories, build
targets, and package boundaries stay the same. It is separate from `@ngx-formly/core`, the Formly
runtime dependency. The reusable Material fields use `@ngx-formly/builder-material-fields` to
distinguish them from the existing `@ngx-formly/material` adapter. The private docs and consumer
workspaces use `@ngx-formly/builder-docs` and `@ngx-formly/builder-package-consumer`.

Existing consumers must use the package names above in their dependencies and TypeScript imports,
and import the stylesheet from `@ngx-formly/builder/styles.css`. Rebuild and install matching
tarballs for all packages. Previous package names have no compatibility aliases. Exported symbols
and saved forms are unchanged.

## Embedding contract (prerelease)

The Studio route uses the same component and provider intended for embedding. The complete
[package-consumer fixture](integration/package-consumer) runs against npm tarballs without Studio
or workspace source imports.

The editor's CSS requires Tailwind 4 and its PostCSS plugin. Install the build dependencies in the
consuming application:

```sh
npm install tailwindcss tailwindcss-primeui
npm install --save-dev @tailwindcss/postcss postcss
```

Add `.postcssrc.json` at the Angular application's root:

```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

Import the packaged stylesheet from the application's global CSS:

```css
@layer theme, base, primeng;
@import '@ngx-formly/builder/styles.css';

html,
body,
app-root {
  display: block;
  height: 100%;
  margin: 0;
}
```

The CSS entry includes Tailwind's base styles, editor styles, PrimeUI utilities, and class scanning
for the packaged editor, including its lazy dialogs. It also includes the layout utilities used
by the editor's Styling panel. It is Tailwind source CSS, so it must go through PostCSS rather than
a browser `<link>`. Give the builder's container an explicit height if it does not fill the page.
UI profiles may need their own styles, such as an Angular Material theme.

Load the Material Symbols Outlined icon font in `index.html`, as Studio does, or self-host that
font with its matching font-face and `.material-symbols-outlined` rules:

```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0"
/>
```

Register the PrimeNG theme and one or more UI profiles, then render the builder component:

```ts
import { ApplicationConfig, ChangeDetectionStrategy, Component } from '@angular/core';
import { FormlyBuilder, primengPreset, provideFormlyBuilder } from '@ngx-formly/builder';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormlyBuilder],
  template: `<formly-builder class="block h-full" />`,
})
export class FormEditorPage {}

export const appConfig: ApplicationConfig = {
  providers: [
    providePrimeNG({
      theme: {
        preset: definePreset(Aura, primengPreset),
        options: {
          darkModeSelector: '.dark',
          cssLayer: { name: 'primeng', order: 'theme, base, primeng' },
        },
      },
    }),
    provideFormlyBuilder({ libraries: [myFormlyLibrary] }),
  ],
};
```

Use your own profile for `myFormlyLibrary`. If the host already configures PrimeNG, merge these
theme settings into its existing provider. Toggle the `.dark` class on an ancestor to use dark
mode. `provideCoreTheme()` remains available to hosts that also synchronize the code editor theme.

`provideFormlyBuilder` accepts an editor storage namespace, autosave settings, and a custom
`FormStoreService` implementation. The API remains provisional until the first public prerelease.

Document models and persistence APIs can also be consumed without importing the editor UI:

```ts
import { createEmptyWorkspaceHierarchy, type FormStoreService } from '@ngx-formly/builder-state';
```
