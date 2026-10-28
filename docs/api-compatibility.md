# Public API compatibility

Issue #11 tracks stabilization, not an immediate API freeze. The API reports in `etc/api` are a
reviewable snapshot of the four built package entry points after the engine extraction in #7.
They include exports, providers, injection tokens, extension contracts and the builder stylesheet
export. They are intentionally broader than the packaged-consumer fixture.

## Gate and stabilization decision

`npm run check:api` builds all packages and compares their declarations and package export maps
with the checked-in reports. It detects a removed export or changed signature even when no fixture
uses it. Run `npm run test:api` to verify the comparison tool itself.

CI always tests the tool. The compatibility gate runs only when the repository Actions variable
`BUILDER_API_COMPATIBILITY` equals `true`; it is disabled until maintainers explicitly enable it.
Do not enable it as an incidental part of merging this PR.

Before enabling the gate, maintainers must accept the package boundary in #6 and the final engine
exports in #7, identify the supported contract in a stabilization PR, review a freshly generated
baseline, and align the version policy with #9. Enable the variable after that PR merges. Keep the
build job required by branch protection once compatibility is promised. No stabilization date is
implied here. Update the baseline before enabling the gate if other package changes merge first.

## Intentional changes

1. Build and run `npm run check:api`. Review the source/API change and its effect on hosts and
   downstream adapters. An additive export also changes the report; the check is conservative.
2. For a removal or incompatible signature, deprecate the old contract first where practical.
   Use `@deprecated` with the replacement and planned removal version. Keep the alias or adapter
   through the announced migration window; tests must cover that compatibility path.
3. Add a release entry and migration instructions for each affected public package. Under the
   proposed #9 policy, an incompatible `0.x` change increments the minor; after 1.0 it increments
   the major. Update internal peer ranges explicitly. An API report update alone never authorizes
   a breaking release or makes downstream callers compatible.
4. Run `npm run update:api`, inspect every changed report in the same PR, then rerun `check:api`,
   package contracts and the clean tarball consumer. Require maintainer review of report updates.
   Never regenerate reports automatically in CI or skip the gate just to make a PR green.

## Scope and limits

The reports use ng-packagr's complete rolled `.d.ts` output plus package export maps, so inherited
engine contracts and referenced declarations are present either in the same report or the state
package report. This avoids introducing another declaration bundler. Source-map comments, formatting, line
endings and union-member ordering are normalized; all signatures, doc comments and Angular declaration metadata remain.
Private declaration changes can produce review noise and may be rebaselined when harmless.

This is a declaration-diff gate, not a semantic proof that every change is breaking or compatible.
It does not detect runtime behavior changes, DI scope changes with unchanged signatures, CSS
visual changes, changed external dependency types, or saved-document incompatibilities. Retain
unit, package-boundary, tarball-consumer and browser checks for those. A change to Angular's
emitted declarations may need a deliberate report refresh alongside the supported Angular range.

The package reports do not grant support to private deep-import paths. New secondary entry points
must have their exports and declarations reviewed with their package's report. Public package
names follow #5; no report creates a new package or freezes the separate rendering proposal in #2.
