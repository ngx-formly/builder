import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkspaceHierarchy } from '../model/types';
import { LocalFormStoreService } from './local-form-store.service';

describe('LocalFormStoreService', () => {
  let service: LocalFormStoreService;
  const editorId = 'test-editor';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [LocalFormStoreService],
    });
    service = TestBed.inject(LocalFormStoreService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds and retrieves a form', () => {
    const form = {
      id: 'form-1',
      name: 'Form 1',
      libraryId: 'form-material',
      fields: [],
      model: {},
    };

    service.addForm$(editorId, form).subscribe();

    let fetchedForm: unknown;
    service.getForm$(editorId, 'form-1').subscribe((res) => (fetchedForm = res));
    expect(fetchedForm).toEqual(form);
  });

  it('lists forms for an editor', () => {
    const form1 = {
      id: 'f-1',
      name: 'First Form',
      libraryId: 'form-material',
      fields: [],
      model: {},
    };
    const form2 = {
      id: 'f-2',
      name: 'Second Form',
      libraryId: 'form-material',
      fields: [],
      model: {},
    };

    service.addForm$(editorId, form1).subscribe();
    service.addForm$(editorId, form2).subscribe();

    let list: unknown[] = [];
    service.getFormList$(editorId).subscribe((res) => (list = res));
    expect(list).toEqual([
      {
        id: 'f-1',
        name: 'First Form',
        libraryId: 'form-material',
        fieldCount: 0,
        parentId: undefined,
      },
      {
        id: 'f-2',
        name: 'Second Form',
        libraryId: 'form-material',
        fieldCount: 0,
        parentId: undefined,
      },
    ]);
  });

  it('updates an existing form', () => {
    const form = { id: 'f-1', name: 'Old Name', libraryId: 'form-material', fields: [], model: {} };
    service.addForm$(editorId, form).subscribe();

    const updated = {
      id: 'f-1',
      name: 'New Name',
      libraryId: 'form-material',
      fields: [{ key: 'x' }],
      model: {},
    };
    service.updateForm$(editorId, updated).subscribe();

    let fetched: unknown;
    service.getForm$(editorId, 'f-1').subscribe((res) => (fetched = res));
    expect(fetched).toEqual(updated);
  });

  it('removes a form from storage', () => {
    const form = { id: 'f-1', name: 'Form 1', libraryId: 'form-material', fields: [], model: {} };
    service.addForm$(editorId, form).subscribe();

    service.removeForm$(editorId, 'f-1').subscribe();

    let list: unknown[] = [];
    service.getFormList$(editorId).subscribe((res) => (list = res));
    expect(list).toEqual([]);
  });

  it('maintains and retrieves workspace hierarchy', () => {
    const form1 = { id: 'f-1', name: 'Form 1', libraryId: 'form-material', fields: [], model: {} };
    service.addForm$(editorId, form1).subscribe();

    let hierarchy: WorkspaceHierarchy | undefined;
    service.getHierarchy$(editorId).subscribe((res) => (hierarchy = res));
    expect(hierarchy?.rootNodeIds).toEqual(['f-1']);
    expect(hierarchy?.nodeMap['f-1'].name).toBe('Form 1');
    expect(hierarchy?.nodeMap['f-1'].type).toBe('form');
    expect(localStorage.getItem('formly-studio-hierarchy-form-editor')).toBeNull();
    expect(localStorage.getItem('formly-studio-hierarchy-test-editor')).not.toBeNull();
  });

  it('isolates storage across editor ids', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [LocalFormStoreService],
    });
    service = TestBed.inject(LocalFormStoreService);
    service
      .addForm$(editorId, {
        id: 'shared',
        name: 'Shared',
        libraryId: 'form-material',
        fields: [],
        model: {},
      })
      .subscribe();

    let list: unknown;
    service.getFormList$('alternate-editor').subscribe((forms) => (list = forms));
    expect(list).toEqual([]);
    expect(localStorage.getItem('formly-studio-forms-form-editor')).toBeNull();
    expect(localStorage.getItem('formly-studio-forms-test-editor')).not.toBeNull();

    let hierarchy: unknown;
    service.getHierarchy$('alternate-editor').subscribe((value) => (hierarchy = value));
    expect((hierarchy as { nodeMap: Record<string, unknown> }).nodeMap['shared']).toBeUndefined();
    expect(localStorage.getItem('formly-studio-hierarchy-form-editor')).toBeNull();
  });

  it('isolates storage across editor families', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [LocalFormStoreService],
    });
    service = TestBed.inject(LocalFormStoreService);
    service
      .addForm$(editorId, {
        id: 'form-only',
        name: 'Form',
        libraryId: 'form-material',
        fields: [],
        model: {},
      })
      .subscribe();

    let list: unknown;
    service.getFormList$('alternate-editor').subscribe((forms) => (list = forms));
    expect(list).toEqual([]);
  });

  it('ignores legacy config-scoped keys', () => {
    localStorage.setItem(
      `formly-studio-forms-${editorId}`,
      JSON.stringify({ legacy: { id: 'legacy', name: 'Legacy', fields: [], model: {} } }),
    );
    let list: unknown;
    service.getFormList$(editorId).subscribe((forms) => (list = forms));
    expect(list).toEqual([expect.objectContaining({ id: 'legacy', name: 'Legacy' })]);
  });

  it('supports an unknown editor id as an empty namespace', () => {
    let list: unknown;
    service.getFormList$('missing-editor').subscribe((forms) => (list = forms));
    expect(list).toEqual([]);
    expect(localStorage.length).toBe(0);
  });

  it('treats malformed form storage as empty', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    localStorage.setItem(`formly-studio-forms-${editorId}`, '{invalid-json');

    let list: unknown;
    service.getFormList$(editorId).subscribe((forms) => (list = forms));

    expect(list).toEqual([]);
    expect(consoleError).toHaveBeenCalledOnce();
  });

  it.each(['null', '[]', '"invalid"', '42'])(
    'treats non-object form storage (%s) as empty',
    (storedValue) => {
      localStorage.setItem(`formly-studio-forms-${editorId}`, storedValue);

      let list: unknown;
      service.getFormList$(editorId).subscribe((forms) => (list = forms));

      expect(list).toEqual([]);
    },
  );

  it('replaces malformed form storage when a form is added', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    localStorage.setItem(`formly-studio-forms-${editorId}`, '{invalid-json');

    const form = {
      id: 'recovered-form',
      name: 'Recovered Form',
      libraryId: 'form-material',
      fields: [],
      model: {},
    };
    service.addForm$(editorId, form).subscribe();

    expect(JSON.parse(localStorage.getItem(`formly-studio-forms-${editorId}`)!)).toEqual({
      'recovered-form': form,
    });
  });
});
