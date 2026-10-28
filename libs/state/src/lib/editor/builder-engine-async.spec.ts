import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EMPTY, Observable, Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DefaultForm, WorkspaceHierarchy } from '../model/types';
import { LocalFormStoreService } from '../persistence/local-form-store.service';
import { CORE_FORM_STORE } from '../persistence/types';
import { BuilderEngineService } from './builder-engine.service';
import { provideBuilderEngine } from './provider';

type Operation = 'read' | 'write' | 'delete' | 'hierarchy';

@Injectable()
class DelayedStore extends LocalFormStoreService {
  readonly delayed = new Set<Operation>();
  readonly pending: {
    operation: Operation;
    id: string;
    complete: () => void;
    fail: () => void;
    cancelled: () => boolean;
  }[] = [];

  private schedule<T>(operation: Operation, id: string, run: () => Observable<T>): Observable<T> {
    if (!this.delayed.has(operation)) return run();
    return new Observable<T>((subscriber) => {
      this.pending.push({
        operation,
        id,
        complete: () => run().subscribe(subscriber),
        fail: () => subscriber.error(new Error('offline')),
        cancelled: () => subscriber.closed,
      });
    });
  }

  override getForm$(namespace: string, id: string) {
    return this.schedule('read', id, () => super.getForm$(namespace, id));
  }
  override updateForm$(namespace: string, form: DefaultForm) {
    return this.schedule('write', form.id!, () => super.updateForm$(namespace, form));
  }
  override removeForm$(namespace: string, id: string) {
    return this.schedule('delete', id, () => super.removeForm$(namespace, id));
  }
  override saveHierarchy$(namespace: string, hierarchy: WorkspaceHierarchy) {
    return this.schedule('hierarchy', namespace, () => super.saveHierarchy$(namespace, hierarchy));
  }
}

describe('asynchronous builder stores', () => {
  let engine: BuilderEngineService;
  let store: DelayedStore;
  const namespace = 'async-test';
  const library = { id: 'test', fieldTypes: [] };

  function configure(autoSave?: boolean) {
    TestBed.configureTestingModule({
      providers: [
        provideBuilderEngine({
          editorType: namespace,
          libraries: [library],
          formStore: DelayedStore,
          autoSave,
          autoSaveDelay: 10,
        }),
      ],
    });
    engine = TestBed.inject(BuilderEngineService);
    store = TestBed.inject(CORE_FORM_STORE) as DelayedStore;
  }
  function add(name: string, active = true, parentId?: string) {
    engine.addForm$(name, [{ key: 'name' }], {}, library.id, active, parentId).subscribe();
    return engine.formList().find((form) => form.name === name)!.id;
  }
  function stored(id: string): DefaultForm | undefined {
    return JSON.parse(localStorage.getItem(`formly-studio-forms-${namespace}`)!)[id];
  }
  function completeNext() {
    const operation = store.pending.shift();
    expect(operation).toBeDefined();
    operation!.complete();
  }

  beforeEach(() => {
    localStorage.clear();
    configure(false);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('keeps the latest selection when responses arrive out of order', () => {
    const a = add('A');
    const b = add('B', false);
    const c = add('C', false);
    store.delayed.add('read');
    engine.setActiveForm(b);
    engine.setActiveForm(c);
    expect(engine.activeFormId()).toBe(a);
    expect(engine.loadingFormId()).toBe(c);
    expect(store.pending[0].cancelled()).toBe(true);
    store.pending[1].complete();
    store.pending[0].complete();
    expect(engine.activeFormId()).toBe(c);
    expect(engine.loadingFormId()).toBeNull();
  });

  it.each(['edit', 'reselect', 'unload'] as const)('cancels a pending load on %s', (action) => {
    const a = add('A');
    const b = add('B', false);
    store.delayed.add('read');
    engine.setActiveForm(b);
    if (action === 'edit') engine.setActiveModel({ latest: true });
    else engine.setActiveForm(action === 'unload' ? null : a);
    expect(store.pending[0].cancelled()).toBe(true);
    completeNext();
    expect(engine.activeFormId()).toBe(action === 'unload' ? undefined : a);
    expect(engine.loadingFormId()).toBeNull();
    if (action === 'edit') expect(engine.activeModel()).toEqual({ latest: true });
  });

  it('saves the current draft before rejecting an unavailable library without changing selection', () => {
    const a = add('A');
    const fieldId = engine.activeFieldId();
    store
      .addForm$(namespace, {
        id: 'unknown',
        name: 'Unknown',
        libraryId: 'missing',
        fields: [],
        model: {},
      })
      .subscribe();
    const rejected = stored('unknown');
    engine.setActiveModel({ edited: true });
    engine.setActiveForm('unknown');
    expect(stored(a)?.model).toEqual({ edited: true });
    expect(stored('unknown')).toEqual(rejected);
    expect(engine.activeFormId()).toBe(a);
    expect(engine.activeFieldId()).toBe(fieldId);
    expect(engine.saveStatus()).toBe('saved');
    expect(engine.formLoadError()).toEqual({
      formId: 'unknown',
      reason: 'missing-library',
      libraryId: 'missing',
    });
  });

  it('reports missing forms and store errors independently from saves and allows retry', () => {
    const a = add('A');
    const b = add('B', false);
    engine.setActiveForm('missing');
    expect(engine.formLoadError()?.reason).toBe('not-found');
    store.delayed.add('read');
    engine.setActiveForm(b);
    expect(engine.formLoadError()).toBeNull();
    store.pending.shift()!.fail();
    expect(engine.formLoadError()).toMatchObject({ formId: b, reason: 'store-error' });
    expect(engine.activeFormId()).toBe(a);
    expect(engine.saveStatus()).toBe('saved');
    engine.setActiveForm(b);
    completeNext();
    expect(engine.activeFormId()).toBe(b);
    expect(engine.formLoadError()).toBeNull();
  });

  it('consumes only the first read result, even when a store returns a live observable', () => {
    add('A');
    const b = add('B', false);
    const responses = new Subject<DefaultForm>();
    vi.spyOn(store, 'getForm$').mockReturnValue(responses);
    engine.setActiveForm(b);
    responses.next(stored(b)!);
    engine.setActiveModel({ unsaved: true });
    responses.next(stored(b)!);
    expect(responses.observed).toBe(false);
    expect(engine.activeModel()).toEqual({ unsaved: true });
  });

  it.each(['throw', 'empty'] as const)(
    'reports a %s from a custom store without losing the draft',
    (failure) => {
      const a = add('A');
      vi.spyOn(store, 'getForm$').mockImplementation(() => {
        if (failure === 'throw') throw new Error('offline');
        return EMPTY;
      });
      expect(() => engine.setActiveForm('target')).not.toThrow();
      expect(engine.formLoadError()?.reason).toBe('store-error');
      expect(engine.activeFormId()).toBe(a);
      expect(engine.loadingFormId()).toBeNull();
    },
  );

  it.each([undefined, false])('defaults autosave on while respecting explicit %s', (autoSave) => {
    TestBed.resetTestingModule();
    vi.useFakeTimers();
    configure(autoSave);
    const a = add('A');
    engine.setActiveModel({ edited: true });
    vi.advanceTimersByTime(10);
    expect(stored(a)?.model).toEqual(autoSave === false ? {} : { edited: true });
  });

  it('serializes saves and coalesces newer edits before switching', () => {
    const a = add('A');
    const b = add('B', false);
    store.delayed.add('write');
    engine.setActiveModel({ value: 1 });
    engine.setActiveForm(b);
    engine.setActiveModel({ value: 2 });
    engine.saveActiveForm();
    engine.setActiveModel({ value: 3 });
    engine.saveActiveForm();
    expect(store.pending).toHaveLength(1);
    completeNext();
    expect(engine.activeFormId()).toBe(a);
    expect(engine.saveStatus()).toBe('saving');
    expect(store.pending).toHaveLength(1);
    completeNext();
    expect(stored(a)?.model).toEqual({ value: 3 });
    expect(engine.activeFormId()).toBe(b);
  });

  it('requires explicit retry after a failed save, even when editing continues', () => {
    TestBed.resetTestingModule();
    vi.useFakeTimers();
    configure();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const a = add('A');
    const b = add('B', false);
    store.delayed.add('write');
    engine.setActiveModel({ value: 1 });
    engine.setActiveForm(b);
    store.pending.shift()!.fail();
    engine.setActiveModel({ value: 2 });
    vi.advanceTimersByTime(100);
    expect(store.pending).toHaveLength(0);
    expect(engine.saveStatus()).toBe('error');
    engine.saveActiveForm();
    completeNext();
    expect(stored(a)?.model).toEqual({ value: 2 });
    expect(engine.activeFormId()).toBe(a);
    expect(engine.saveStatus()).toBe('saved');
  });

  it('orders rename and move with saves without restoring stale metadata or model values', () => {
    const folder = engine.createFolder('Folder')!;
    const a = add('A');
    store.delayed.add('write');
    engine.setActiveModel({ value: 1 });
    engine.saveActiveForm();
    engine.renameWorkspaceNode(a, 'Renamed');
    engine.moveWorkspaceNode(a, folder);
    engine.setActiveModel({ value: 2 });
    engine.saveActiveForm();
    expect(store.pending).toHaveLength(1);
    completeNext(); // First save.
    completeNext(); // Rename.
    completeNext(); // Move.
    completeNext(); // Latest draft, with the new metadata.
    expect(stored(a)).toMatchObject({ name: 'Renamed', parentId: folder, model: { value: 2 } });
    expect(engine.activeForm()).toMatchObject({ name: 'Renamed', parentId: folder });
    expect(engine.hierarchyNodeMap()[a]).toMatchObject({ name: 'Renamed', parentId: folder });
  });

  it('does not clear a newer selection when a delayed deletion completes', () => {
    const a = add('A');
    const b = add('B', false);
    store.delayed.add('delete');
    engine.removeForm(a);
    engine.setActiveForm(b);
    completeNext();
    expect(engine.activeFormId()).toBe(b);
    expect(stored(a)).toBeUndefined();
  });

  it('saves a new draft after explicitly unloading a form whose save later fails', () => {
    const a = add('A');
    const b = add('B', false);
    store.delayed.add('write');
    engine.setActiveModel({ value: 'old draft' });
    engine.saveActiveForm();
    engine.setActiveForm(null);
    engine.setActiveForm(b);
    engine.setActiveModel({ value: 'new draft' });
    engine.saveActiveForm();
    store.pending.shift()!.fail();
    expect(store.pending).toHaveLength(1);
    completeNext();
    expect(engine.saveStatus()).toBe('saved');
    expect(stored(b)?.model).toEqual({ value: 'new draft' });
    expect(stored(a)?.model).toEqual({});
  });

  it('does not autosave a different draft because an unloaded form is still saving', () => {
    add('A');
    const b = add('B', false);
    store.delayed.add('write');
    engine.setActiveModel({ value: 'A' });
    engine.saveActiveForm();
    engine.setActiveForm(null);
    engine.setActiveForm(b);
    engine.setActiveModel({ value: 'unsaved B' });
    completeNext();
    expect(store.pending).toHaveLength(0);
    expect(engine.saveStatus()).toBe('dirty');
    expect(stored(b)?.model).toEqual({});
  });

  it('does not treat a reloaded form as newer edits to an earlier save', () => {
    const a = add('A');
    store.delayed.add('write');
    engine.setActiveModel({ value: 'saving' });
    engine.saveActiveForm();
    engine.setActiveForm(null);
    engine.setActiveForm(a);
    completeNext();
    expect(store.pending).toHaveLength(0);
    expect(engine.saveStatus()).toBe('saved');
    expect(stored(a)?.model).toEqual({ value: 'saving' });
  });

  it('cancels a load started synchronously by a selection-event listener', () => {
    const a = add('A');
    const b = add('B', false);
    const c = add('C', false);
    const listener = engine.formSelected$.subscribe((form) => {
      if (form?.id === b) {
        store.delayed.add('read');
        engine.setActiveForm(c);
      }
    });
    engine.setActiveForm(b);
    const pending = store.pending[0];
    engine.setActiveForm(a);
    expect(pending.cancelled()).toBe(true);
    listener.unsubscribe();
  });

  it('keeps a newer draft name when a delayed rename completes', () => {
    const a = add('A');
    store.delayed.add('write');
    engine.renameWorkspaceNode(a, 'Earlier name');
    engine.setActiveFormName('Latest name');
    engine.saveActiveForm();
    completeNext();
    completeNext();
    expect(engine.activeFormName()).toBe('Latest name');
    expect(stored(a)?.name).toBe('Latest name');
  });

  it('waits for all child deletions and retains failed children in the actual hierarchy', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const folder = engine.createFolder('Folder')!;
    const a = add('A', true, folder);
    const b = add('B', false, folder);
    store.delayed.add('delete');
    engine.deleteWorkspaceNode(folder);
    expect(engine.formList()).toHaveLength(2);
    completeNext();
    expect(store.pending).toHaveLength(1);
    store.pending.shift()!.fail();
    expect(engine.formList().map((form) => form.id)).toEqual([b]);
    expect(engine.hierarchyNodeMap()[a]).toBeUndefined();
    expect(engine.hierarchyNodeMap()[b].parentId).toBe(folder);
    expect(engine.persistenceError()?.failedFormIds).toEqual([b]);
    expect(engine.activeForm()).toBeNull();
    engine.deleteWorkspaceNode(folder);
    completeNext();
    expect(engine.formList()).toEqual([]);
    expect(engine.hierarchyNodeMap()[folder]).toBeUndefined();
    expect(engine.persistenceError()).toBeNull();
  });

  it('does not resurrect a deleted form from a queued save', () => {
    const a = add('A');
    store.delayed.add('write');
    engine.setActiveModel({ value: 1 });
    engine.saveActiveForm();
    engine.removeForm(a);
    engine.setActiveModel({ value: 2 });
    completeNext();
    expect(stored(a)).toBeUndefined();
    expect(store.pending).toHaveLength(0);
    expect(engine.activeForm()).toBeNull();
  });

  it('cancels reads, active writes and queued operations on destruction without flushing', () => {
    const a = add('A');
    const b = add('B', false);
    store.delayed.add('read');
    engine.setActiveForm(b);
    const read = store.pending.shift()!;
    engine.setActiveModel({ edited: true });
    store.delayed.add('write');
    engine.saveActiveForm();
    engine.renameWorkspaceNode(a, 'Must not run');
    const write = store.pending[0];
    TestBed.resetTestingModule();
    expect(read.cancelled()).toBe(true);
    expect(write.cancelled()).toBe(true);
    expect(store.pending).toHaveLength(1);
    expect(stored(a)?.model).toEqual({});
  });

  it('does not flush a debounced autosave on destruction', () => {
    TestBed.resetTestingModule();
    vi.useFakeTimers();
    configure();
    const a = add('A');
    engine.setActiveModel({ edited: true });
    TestBed.resetTestingModule();
    vi.advanceTimersByTime(100);
    expect(stored(a)?.model).toEqual({});
  });

  it('releases pending workspace reads and live recovery notifications on destruction', () => {
    TestBed.resetTestingModule();
    const forms = new Subject<[]>();
    const recovery = new Subject<[]>();
    vi.spyOn(DelayedStore.prototype, 'getFormList$').mockReturnValue(forms);
    vi.spyOn(DelayedStore.prototype, 'getRecoveryIssues$').mockReturnValue(recovery);
    configure();
    expect(forms.observed).toBe(true);
    expect(recovery.observed).toBe(true);
    TestBed.resetTestingModule();
    expect(forms.observed).toBe(false);
    expect(recovery.observed).toBe(false);
  });
});
