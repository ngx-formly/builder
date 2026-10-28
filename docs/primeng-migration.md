# Removing PrimeNG from the shell

Proposal for issue #8. Maintainer approval of this PR selects the migration direction; PrimeNG 21
stays in place until each replacement has equivalent behavior. This does not decide the runtime
component-skeleton proposal in #2. The engine boundary is proposed separately in #6 and #7.

## Inventory

Run the following from the repository root to refresh the file-level inventory, including tests:

```sh
rg -n 'primeng|primeuix|tailwindcss-primeui' libs/core apps/studio integration/package-consumer README.md
```

| Area                                                                                                | Current dependencies                                                                                                     | Replacement responsibility                                                         |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `libs/core/src/lib/core.ts`                                                                         | Drawer, Splitter                                                                                                         | Responsive panes, resizing, mobile focus containment                               |
| `sidebar`, `empty`, `formly`                                                                        | Button directives, Divider, Menu, TieredMenu                                                                             | Navigation, empty-state actions, field actions and keyboard menus                  |
| `panel/forms-panel`                                                                                 | Buttons, ButtonGroup, Menu, FloatLabel, InputText, Message, Select, RadioButton                                          | Workspace actions, import/create dialogs, errors and recovery                      |
| `panel/add-field-panel`, `panel/styling-panel`, `panel/validation-panel`                            | Tabs, Panel, Select, SelectButton                                                                                        | Palette/styling tabs, expandable sections, selection and validation feedback       |
| `panel/model-property`, `properties`                                                                | InputText, Textarea, InputNumber, DatePicker, ToggleSwitch, Select, MultiSelect, KeyFilter, Inplace, Panel, AutoComplete | Typed model edits, wrappers, property groups, validation and expression editing    |
| `json-content`, `field-preset`, `properties/array`, `properties/expressions`, `properties/markdown` | Dialog, Table, AutoFocus and form controls                                                                               | Modal lifecycle, focus return, array row editing/reordering, code/markdown editing |
| `shared`                                                                                            | ChipStyle, Tooltip, InputGroup/InputGroupAddon, Popover                                                                  | Filters, rename popovers, hints and removal of chip-style workarounds              |
| `panel/form-panel/preview-device-toolbar.ts`                                                        | InputNumber                                                                                                              | Viewport size editing                                                              |
| `editor/types.ts`, `panel/add-field-panel/types.ts`                                                 | `MenuItem`                                                                                                               | Replace shell menu models while preserving callbacks and disabled states           |
| `apps/studio/src/app/header.ts`, `home/action-button.ts`                                            | Button directives and Divider                                                                                            | Hosted navigation and landing-page actions                                         |
| `libs/core/src/lib/primeng.ts`, Studio `app.config.ts`, consumer `consumer.ts`                      | `Preset`, `palette`, `definePreset`, Aura, `providePrimeNG`                                                              | Theme tokens, dark mode and host setup                                             |
| `libs/core/src/styles.css`, Studio and consumer styles                                              | PrimeUI Tailwind plugin, `primeng` cascade layer and `.p-*` selectors                                                    | Package-owned tokens/utilities and control styles                                  |
| Root/core manifests, consumer manifest, lockfile                                                    | PrimeNG/PrimeUIX peers and Angular peer overrides                                                                        | Remove only after no compiled or stylesheet dependency remains                     |

Also search for `p-`, `pButton`, `pt` and `PassThrough` when migrating a component. PrimeNG's
pass-through options and CSS selectors are behavior dependencies even without a new import.
Dialog services in `field-preset`, `panel/forms-panel` and `properties` coordinate shell workflows;
they must keep their public methods, cancellation behavior and lazy loading during replacement.
Public `primengPreset` and `CoreAddFieldOption extends MenuItem` expose PrimeNG to consumers.

## Options and proposed decision

| Approach                                    | Accessibility and maintenance                                                                                                               | Licensing and Angular support                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Angular Material throughout                 | Maintained controls/harnesses; broad coverage but changes the editor's appearance and imposes Material on hosts                             | MIT; use the major matching Angular, currently 22          |
| Native controls plus Angular CDK            | Native keyboard semantics for simple inputs; CDK supplies dialogs, focus and overlays; custom complex controls need explicit keyboard tests | MIT CDK and browser platform; CDK major must match Angular |
| Fully custom controls or another UI library | A custom library adds ongoing keyboard/focus work; another vendor requires a separate compatibility audit                                   | No replacement vendor selected or licensed by this plan    |

Choose native controls plus the already-installed Angular CDK. Preserve the existing visual tokens
and shell layouts. Prefer native button/input/select for simple controls, and CDK Dialog/Overlay
and A11y utilities for modal focus/overlay behavior. Do not add a home-grown select, datepicker or
menu framework as part of a small migration. For complex controls that cannot meet the acceptance
checks, review a bounded Material or Angular Aria implementation before replacing them. Angular
Aria adoption requires checking the supported Angular major and adding explicit keyboard coverage;
issue #2 remains a separate runtime-rendering investigation.

Sources: [Angular Material/CDK](https://material.angular.dev/),
[CDK accessibility](https://material.angular.dev/cdk/a11y/overview),
[CDK dialog](https://material.angular.dev/cdk/dialog/overview), and the installed packages' LICENSE
files. PrimeNG 21 and PrimeUIX themes 2 remain MIT in this workspace; do not upgrade them to a new
major as a substitute for this plan without checking its license and peers.

## Small implementation steps

1. Replace only the two empty-state action buttons in `empty/empty-no-form.ts` and
   `empty/empty-no-field.ts` with native buttons using existing editor tokens. Retain accessible
   names, disabled behavior and create/add actions. Add keyboard activation and focus-visible
   assertions and desktop/mobile screenshots. Do not remove package dependencies in this step.
2. Replace shared buttons, dividers and text inputs, then migrate their callers in small groups.
   Keep labels, error associations, focus rings and the current compact spacing.
3. Move menu data off `MenuItem` and preserve the public legacy type during deprecation. Migrate
   workspace and field menus with arrow keys, Escape, focus return and disabled-item behavior.
4. Migrate one dialog family at a time to CDK Dialog. Preserve Escape/backdrop cancellation,
   nested overlay behavior, focus trapping/return, scroll locking and mobile viewport bounds.
5. Migrate tabs/panels, selection controls, array tables and date inputs individually. Retain
   row reordering and touch alternatives; do not depend on drag-only interaction.
6. Replace the shell Drawer/Splitter last, preserving resize persistence and breakpoint state.
7. Remove theme exports, CSS plugin/layer usage, manifests and consumer overrides in the explicit
   compatibility release described below. Search source, declarations, CSS and built bundles.

## Validation for every step

Run affected unit tests and lint, then `npm run build:builder-material`, `npm run check:packages:e2e`
and the relevant Studio Playwright specs. The packed consumer must install from tarballs and
work without Studio imports. Retain the existing mobile, tablet, desktop, JSON, recovery, style
binding and keyboard regression checks. Compare light/dark mode at 390px, 1024px and 1600px.

Use keyboard-only navigation through every changed control: Tab/Shift+Tab, Enter/Space, arrows
where the widget pattern requires them, and Escape. Check accessible names, roles, expanded/
selected/invalid state, visible focus, dialog return focus, zoom and overflow. Test touch creation,
selection and reordering without relying on hover. Automated checks do not replace a manual
screen-reader pass for changed composite widgets before the final removal release.

## Temporary setup and consumer migration

Keep PrimeNG `^21.1.10`, PrimeUIX themes `^2.0.3`, and `tailwindcss-primeui` while any shell feature
uses them. Angular 22 consumers must keep the scoped `primeng` overrides for Angular CDK, common,
core, forms, platform-browser and router shown in
[`integration/package-consumer/package.json`](../integration/package-consumer/package.json).
Do not use a global `--legacy-peer-deps` workaround. Follow the current
[embedding setup](../README.md#embedding-contract-prerelease) for theme providers and CSS.

The final removal PR must include a consumer migration example that:

- Removes builder-only `providePrimeNG`, `definePreset`, Aura and `primengPreset` imports/providers.
  Hosts using PrimeNG elsewhere keep their own provider and dependencies.
- Replaces use of PrimeNG-specific exported menu types with the documented builder-owned shape.
- Removes the builder's `primeng` cascade layer and PrimeUI Tailwind import, while retaining
  `@ngx-formly/builder/styles.css` and the documented Tailwind/PostCSS processing.
- Removes scoped peer overrides only when the host has no other incompatible PrimeNG usage.
- Rebuilds from clean tarballs without PrimeNG/PrimeUIX installed, verifies light/dark styling,
  keyboard navigation, responsive editing and dialog focus, and checks generated declarations.

Removal is complete only when no builder public type, bundle or stylesheet requires PrimeNG,
its theme package or its Tailwind plugin. Update README, package-consumer fixture, dependency
metadata and lockfile together. Treat removal of `primengPreset` or the old menu type contract
as a breaking change under the release policy in #9. Existing saved forms and storage keys must
remain unchanged throughout the migration.
