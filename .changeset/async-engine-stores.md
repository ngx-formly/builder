---
'@ngx-formly/builder-state': patch
'@ngx-formly/builder': patch
---

Complete asynchronous-store support for the new headless engine. Order saves and workspace
mutations, preserve newer edits, cancel superseded loads, and report partial deletion failures.
The shell displays load errors with a retry action and shares the engine's error state.

Headless autosave now defaults to true, matching the shell provider. Hosts testing the headless
branch that require manual saves must pass `autoSave: false`. Custom stores must emit one result
per ordinary operation; only recovery notifications are live. Hosts must save and await success
before unloading or destroying an editor when unsaved edits should be preserved. See `docs/asynchronous-stores.md` for the
store and lifecycle contract. Release the shell with the updated state package.
