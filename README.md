# ngx-formly Builder

A visual form builder for ngx-formly that brings community efforts together. Build Angular forms
with drag-and-drop editing, custom components, live previews, and Formly JSON export.

## Project status

The repository is the shared foundation for an official ngx-formly builder. It currently provides
the Studio application, reusable editor libraries, multiple UI profiles, local persistence, and
authoring documentation.

The project is preparing its first embeddable package contract. Package names under the temporary
`@formly-editor` scope are not the final public npm names and no compatibility guarantee is made
until the first public prerelease. See [CONTRIBUTING.md](CONTRIBUTING.md) before proposing public API
changes.

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
the libraries, and installs them into a clean package-consumer fixture.

## Repository layout

- `apps/studio`: hosted reference application.
- `apps/docs`: author and integration documentation.
- `libs/state`: headless document models, hierarchy operations, and persistence contracts.
- `libs/core`: editor shell, UI orchestration, and extension contracts.
- `libs/ui/material`: reusable Material runtime fields.
- `libs/ui/builder-material`: editor-only adapters for Material composite fields.

## Embedding contract (prerelease)

The Studio route uses the same component and provider intended for embedding. Register one or more
UI profiles, then render the builder component:

```ts
import { FormlyBuilder, provideFormlyBuilder } from '@formly-editor/core';

@Component({
  imports: [FormlyBuilder],
  template: `<formly-builder class="block h-full" />`,
})
export class FormEditorPage {}

export const appConfig: ApplicationConfig = {
  providers: [provideFormlyBuilder({ libraries: [myFormlyLibrary] })],
};
```

`provideFormlyBuilder` accepts an editor storage namespace, autosave settings, and a custom
`FormStoreService` implementation. The package scope and API remain provisional until the first
public prerelease.

Document models and persistence APIs can also be consumed without importing the editor UI:

```ts
import { createEmptyWorkspaceHierarchy, type FormStoreService } from '@formly-editor/state';
```
