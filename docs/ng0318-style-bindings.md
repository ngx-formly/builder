# Angular NG0318 style bindings

Investigation for [#13](https://github.com/ngx-formly/ngx-formly-builder/issues/13), on main revision
`da1d33e` with Angular 22.2.3 and PrimeNG 21.1.10.

## Reproduction

Run `npm ci` and `npm start`, then open `/form-editor` with the browser console visible.
Opening the editor emits:

```text
NG0318: `[style.right]` was bound to an invalid value. Expected a string, number, SafeValue, null, or undefined, but received `boolean` (`false`). Find more at https://v22.angular.dev/errors/NG0318
```

Choose **Create Form**, select **Material Showcase**, and create the form. The active-field
chips emit:

```text
NG0318: `[style.display]` was bound to an invalid value. Expected a string, number, SafeValue, null, or undefined, but received `boolean` (`false`). Find more at https://v22.angular.dev/errors/NG0318
```

The browser stacks end in `Toast_HostBindings` and `Chip_HostBindings`, respectively, through
Angular's `styleMap` and `warnInvalidStylePropValue` functions. The installed PrimeNG sources are
`node_modules/primeng/fesm2022/primeng-toast.mjs` and `primeng-chip.mjs`. Their `inlineStyles.root`
functions use `condition && '20px'` for toast positioning and `!instance.visible && 'none'` for
chip display. Both expressions can return `false`, which Angular 22 rejects as a CSS value.

## Bounded fix

The builder's toast and local `MessageService` provider had no message-producing callers, so they
were removed. The chip remains in use. `ChipStyleFix` replaces the injected, per-component
`ChipStyle.inlineStyles` map at the editor's three chip call sites. It returns an empty string
for visible chips and `none` for hidden chips, leaving the theme stylesheet and chip behavior intact.
It does not modify PrimeNG prototypes, other applications' chips, or console logging.

The workaround depends on PrimeNG's exported `ChipStyle` and its `inlineStyles.root` shape.
Recheck it when upgrading PrimeNG. Remove it when upstream returns valid CSS values, or when
chips are replaced under the [PrimeNG removal plan, #8](https://github.com/ngx-formly/ngx-formly-builder/issues/8).
This change does not remove the other PrimeNG dependencies or the Angular peer overrides.
Consumers that relied on the builder's undocumented local `MessageService` provider must supply
their own service and notification component.

## Regression checks

```sh
npm run test:core -- --include=libs/core/src/lib/shared/chip-style-fix.spec.ts
npm run test:e2e -- form-editor-style-bindings
```

The browser check listens for `NG0318` before navigation, creates a Material form, and opens its
preview at desktop and phone sizes. It also checks dialog dimensions and the active-field chip's
text, display, corner radius, and background. The component check covers both visible and removed
chips. These checks use Angular's development build because production mode omits the warning.
