# Independent package releases

Proposal for issue #9. Review this workflow and policy before enabling publication. The four
public packages keep separate versions; private Studio/docs workspaces are not published.
Changesets 3.0.3 records release intent, updates versions/changelogs and publishes built packages.
The exact CLI version is pinned because the peer-dependent option is marked experimental.

## Versions and peer ranges

| Current version        | Compatible fix or addition                                          | Breaking change                            |
| ---------------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| `0.0.x`                | Patch, with peers `>=0.0.1 <0.1.0` until the next breaking boundary | Minor and explicit dependent range updates |
| `0.y.x`, where `y > 0` | Patch within `^0.y.0`                                               | Minor and explicit dependent range updates |
| `1.x` and later        | Patch for fixes, minor for additions                                | Major and explicit dependent range updates |

The initial `0.0.x` range is intentional: caret `^0.0.1` would admit only `0.0.1`. A peer range
must retain its actual minimum supported version. If a caller starts using an API introduced in
`0.0.4`, raise its lower bound to `>=0.0.4 <0.1.0`. Test against that minimum as well as the new
package combination before claiming support. Do not widen a range across a breaking boundary
without testing the caller and documenting compatibility.

A compatible state patch does not bump core or the adapters. There are no fixed or linked version
groups. `onlyUpdatePeerDependentsWhenOutOfRange` prevents Changesets from forcing peer consumers
into an otherwise unnecessary release. The regression dry run checks that configuration.

For breaking state changes, explicitly update core's peer range and add a core changeset; do the
same for any affected adapter. Choose the dependent's bump based on its own public contract.
Do not blindly accept an automatically proposed major bump for a `0.x` dependent. The move to
`1.0.0` is an explicit stabilization decision coordinated with #6, #7 and #11.

## Authoring and reviewing a release

1. Run `npm run changeset` with a package change. Select only affected public packages and write
   the user-visible change and migration steps. Docs-only changes outside packages need no entry.
2. Inspect `npm run release:status` and `npm run release:dry-run`. The latter creates a temporary
   manifest-only workspace, proposes one state patch and asserts that no dependent is released.
   It changes no source files or registry state. With `--consumer`, it also packs a temporary
   state patch alongside the unchanged packages and builds a clean consumer.
3. Run the **Release packages** workflow on `main` with `publish` unchecked. After validation,
   Changesets opens/updates a version PR. `npm run release:version` updates source manifests,
   package changelogs and `package-lock.json`; it never publishes.
4. Review version numbers, changelogs, internal peers and the lockfile in that PR. Merge only when
   the package/API migration is accepted. Rerun CI on the resulting version commit.
5. Run the workflow again on that commit with `publish` checked. Pending changesets are rejected.
   Build/package checks, clean tarball installation, consumer type-check/build, Studio tests and
   desktop/mobile consumer browser tests run before any publish operation.

Source package `publishConfig.directory` points to its ng-packagr output. Never run `npm publish`
from a library source directory. `release:validate` checks built names, versions, peers, bundles
and declarations against source before publication. The published tarballs must contain Angular
partial-compilation output and public declarations, not workspace TypeScript aliases.

Changesets publishes dependencies before dependents: state and runtime Material fields, then the
builder shell, then Material builder adapters as needed. It skips versions already present in
the registry and creates package-specific tags such as `@ngx-formly/builder-state@0.0.2`. The
workflow records those tags and GitHub release notes. There is no shared repository version tag.
If a publish partially fails, retry the same reviewed commit after inspecting registry versions;
never overwrite or unpublish an existing version to repair a release.

Configure the repository's `npm-release` environment with required reviewers and an `NPM_TOKEN`
that can publish the four `@ngx-formly` packages. Enable GitHub Actions to create pull requests.
The workflow is manual and restricted to `main`; merging this tooling PR does not publish npm
packages. Registry access and actual publication are not exercised by the local dry run.

## Prereleases

Use `npm run changeset -- pre enter next`, commit `.changeset/pre.json`, then add changesets and
prepare/review versions through the same workflow. Publish under `next`, never `latest`. To exit,
run `npm run changeset -- pre exit` and prepare a reviewed stable version PR. Do not hand-edit
prerelease suffixes or delete the prerelease state file.

A stable peer range does not accept a prerelease automatically. Changesets may include dependent
packages to make prerelease peer ranges installable; inspect the plan and clean consumer results.
A prerelease series is a coordinated repository mode, not a reason to synchronize numeric versions
of unrelated packages. Do not introduce prereleases into an already-supported stable range.

## Tooling and validation

This workflow uses the repository's current npm 11.19.0 workspaces and Node 24. The pnpm proposal
in #4 is separate. If that migration is accepted, update the lockfile refresh command, workflow
cache/install steps and dry-run fixture together before releasing.

```sh
npm run release:dry-run
npm run release:validate
```

For example, the compatible state patch fixture reports `builder-state: 0.0.1 -> 0.0.2` and no
other release. `release:validate` builds all four packages, then its dry-run consumer installs a simulated state
patch alongside the unchanged dependent versions; version equality is not required. Intentional breaking changes
must include dependency ranges, migration notes and the API report update once #11 is enabled.

See the [Changesets configuration](https://changesets.dev/guide/config),
[publishing guide](https://changesets.dev/guide/versioning-and-publishing) and
[prerelease rules](https://changesets.dev/guide/prereleases) for the CLI behavior used here.
