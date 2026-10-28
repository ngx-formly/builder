# Package architecture

Proposal for review in issue #6. Merging this document accepts the boundary; it does not freeze
all current exports or decide the rendering proposal in #2.

## Published packages

```text
host application
  @ngx-formly/builder                 editor shell and embedding provider
    @ngx-formly/builder-state         Angular editing engine and persistence
  @ngx-formly/builder-material        editor adapters
    @ngx-formly/builder
    @ngx-formly/builder-material-fields
  @ngx-formly/builder-material-fields runtime fields
    @ngx-formly/material
```

These are four independently published packages, not secondary entry points. The builder's
`styles.css` is a stylesheet export, not a JavaScript entry point. Source folders and the private
Studio/docs applications are implementation details. No new engine package is needed.

| Package                   | Public responsibility                                                                                                 | Excluded responsibility                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `builder-state`           | Document types, hierarchy operations, storage contracts and recovery; editing engine as extracted in #7               | CDK, PrimeNG, Material, dialogs, panels, runtime field components |
| `builder`                 | `FormlyBuilder`, `provideFormlyBuilder`, library/property configuration, builder extension contracts, packaged styles | Application routes, deployment metadata, host business rules      |
| `builder-material-fields` | Runtime Formly field types and their configuration                                                                    | Editor state and editor wrappers                                  |
| `builder-material`        | Editor adapters for composite Material fields                                                                         | Persistence and standalone runtime behavior                       |

Only package entry points are supported imports. A service exported today remains a compatibility
commitment until explicitly deprecated or migrated, even when its implementation is internal.
Do not remove exports as part of a file move. In particular, keep `CoreFormService`,
`BuilderFieldStateService`, storage tokens and model re-exports working during extraction.

## Engine and shell

The Angular engine owns active form/field selection, normalized documents, nested add/remove/move/
replace operations, Formly import/export conversion, model/property edits, hierarchy operations,
autosave, save failures, recovery state and storage namespaces. Transient field state belongs
beside those operations and must be cleared when its field disappears.

Its configuration describes libraries and field defaults as data. It does not register runtime
components or import shell property editors. The shell maps its richer `LibraryConfig` to that
configuration. Keep the existing JSON-safe Formly document format and storage keys.

The shell owns selected panels, hover state, edit/preview/JSON display modes, responsive layouts,
menus, drag/drop interactions, dialogs, theme integration and schema-validation presentation.
It delegates document mutations to the engine. Selecting a loaded form may open the fields panel
in the shell, but must not require a `PanelService` in the engine.

`FormStoreService` and `CORE_FORM_STORE` belong to state. A headless provider should create one
engine per environment injector and accept a storage namespace, autosave options, field-library
definitions and optional custom store. `provideFormlyBuilder` remains the host's shell provider;
it must expose that same engine instance to shell adapters, not create a second document state.
Use separate route/environment injectors and distinct namespaces for independent editors.

Runtime Formly `ConfigOption` registrations, property editor descriptors and builder-only wrappers
remain shell extension contracts. The Material runtime package must remain usable without those
contracts. The public `CoreAddFieldOption` currently inherits PrimeNG's `MenuItem`; removing that
coupling requires a documented migration under #8, not a silent signature change.

## Host integration

For the complete shell, import `FormlyBuilder` and `provideFormlyBuilder` from
`@ngx-formly/builder`, register a library, and process `@ngx-formly/builder/styles.css` with the
host's Tailwind/PostCSS setup. The [embedding guide](../README.md#embedding-contract-prerelease)
and [tarball consumer](../integration/package-consumer) are the executable reference. The
current PrimeNG theme setup remains required until the migration in #8 finishes.

Today a headless host can import `LocalFormStoreService`, `CORE_FORM_STORE`, document types and
hierarchy helpers directly from `@ngx-formly/builder-state`. Provide the store in an Angular
injector and call its observable methods with a dedicated editor ID. This loads no shell.
The editing service/provider will become available through that same package in #7; it is not
part of the current state entry point yet. Headless hosts supply their own controls and call
engine operations, without `provideFormlyBuilder`, PrimeNG providers or builder styles.

## Follow-up sequence and rationale

1. Review this boundary before moving code. Keeping Angular signals and DI avoids a second
   reactive model; reusing state avoids another package/version relationship.
2. In #7, move document operations and pure conversion/property helpers into state. Keep shell
   facades and exports, bridge providers, then move transient field state. Exercise operations
   with Angular TestBed without shell services; retain Studio and packed-consumer regression tests.
3. In #8, inventory and replace shell UI dependencies in bounded components. A UI-independent
   runtime component skeleton remains a separate experiment in #2.
4. In #9, define independent version ranges and validate packed consumers before publication.
5. In #11, record reviewable API declarations. Make them a required compatibility gate only when
   maintainers explicitly designate supported entry points for stabilization.

Each implementation PR must preserve nested selection, unknown Formly properties, autosave error
handling, storage isolation and recovery backups. Validate state dependencies in built bundles,
then run the Studio and packaged-consumer desktop/mobile checks before changing the shell facade.
