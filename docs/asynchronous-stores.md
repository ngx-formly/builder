# Asynchronous stores and editor lifecycle

Ordinary `FormStoreService` methods return one result per call, possibly asynchronously. Writes
emit `undefined` after they succeed; reads emit a snapshot. The engine consumes the first result.
Only `getRecoveryIssues$` is a live stream. Empty completion is an error, not confirmation of a write.

Mutations are ordered within one engine, including saves and workspace read/modify/write operations.
While saving, further edits are coalesced into a subsequent save. A failed save preserves edits and
requires an explicit `saveActiveForm()` retry; editing does not silently retry it. These guarantees
apply to one engine instance, not concurrent tabs or independent clients sharing remote storage.

Selecting another form saves the current draft first. The latest selection wins; selecting the
current form again cancels a pending switch. Once the target is loading, editing the current draft
cancels that load. `loadingFormId()` identifies the target. `formLoadError()` distinguishes missing
forms, unavailable libraries, store failures, invalid form data, and required storage recovery.
Failures preserve the active document, field selection, and save status. Retry with
`setActiveForm(error.formId)`; a new selection attempt clears the previous load error. The shell
shows these errors and a Retry load action. `formSelected$` emits only successful activations and
explicit unloads.

A failed folder deletion can be partial: successful deletions are not rolled back. The engine waits
for child operations and refreshes the actual workspace. `persistenceError()` exposes the failed
action and, for partial child deletion, `failedFormIds`. Review the remaining tree before retrying.
The existing store interface does not guarantee atomic deletion.

`setActiveForm(null)` explicitly unloads the form and can discard unsaved edits. Destroying the
injector cancels subscriptions, queued work, and pending autosave timers without starting a final
write. A remote write already sent might still commit. A host that needs to preserve edits must
save and await confirmed success **before** unloading or destroying the injector. For example,
in a host with an Angular `Injector` available:

```ts
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, firstValueFrom } from 'rxjs';

engine.saveActiveForm();
const status = await firstValueFrom(
  toObservable(engine.saveStatus, { injector }).pipe(
    filter((value) => value === 'saved' || value === 'error'),
  ),
);
if (status === 'saved') {
  // The host may now close its editor, provided no further edits are accepted.
}
// On error, keep the editor open and offer an explicit save retry.
```
