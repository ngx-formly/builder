# Contributing to ngx-formly Builder

Thanks for helping build the shared visual editor for ngx-formly.

## Before starting

Use an issue or discussion for changes that affect the document format, public APIs, package
boundaries, extension contracts, or user workflows. Small fixes and test improvements can go
directly to a pull request.

The public builder package is `@ngx-formly/builder`, built from `libs/core`. State and UI packages
use `@ngx-formly/builder-*`; see the [package map](README.md#package-names).
Avoid introducing new imports from application code into a library or exporting an internal
service without discussing the compatibility cost.

## Local setup

Use Node.js 24.15 or newer within the Node.js 24 release line and npm 11.19.0.

```sh
npm ci
npm start
```

## Validation

Run the checks relevant to your change and, before requesting review, run the complete validation
set:

```sh
npm run lint
npm test
npm run check:docs
npm run build
```

Install Playwright Chromium once before running browser tests:

```sh
npx playwright install chromium
npm run test:e2e
npm run build:builder-material
npm run check:packages:e2e
```

The production build includes package-contract validation. It checks built bundle imports against
package manifests, packs the libraries, and installs their tarballs into an isolated Angular
consumer for type-checking, export resolution, and a production build. `check:packages:e2e` also
opens that consumer in Chromium at desktop and mobile sizes, checks its styles, and creates a form.
It uses port 4314 and does not reuse a running server. CI runs this alongside the Studio browser
tests.

## Architecture rules

- Keep the Studio application dependent on libraries, not the reverse.
- Keep `@ngx-formly/builder-state` headless: it must not depend on Angular CDK, UI frameworks, or the
  editor shell.
- Keep reusable Material runtime fields independent from editor state.
- Put editor-only Material adapters in `builder-material`.
- Use Formly type names and JSON-safe configuration as the persistence boundary.
- Preserve unknown supported Formly properties during import and export.
- Treat exported symbols and dependency-injection tokens as compatibility commitments.
- Add behavior-focused tests for state transitions and document transformations.

## Pull requests

Describe the user-facing outcome, compatibility impact, and validation performed. Include migration
notes when changing stored documents, package APIs, or configuration metadata. Add screenshots or a
short recording for material interaction or responsive-layout changes.
