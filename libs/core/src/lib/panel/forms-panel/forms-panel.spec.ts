import { CoreFormService } from '../../editor/core-form.service';
import { computed, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonDirective, ButtonIcon, ButtonLabel } from 'primeng/button';
import { ButtonGroup } from 'primeng/buttongroup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Empty } from '../../empty/empty';
import { CreateFormDialogService } from './create-form-dialog.service';
import { ImportDialogService } from './import-dialog.service';
import { MouseInsideService } from '../../editor/mouse-inside.service';
import type { BaseEditorForm, WorkspaceNode } from '../../model/types';
import type { FormStoreRecoveryIssue } from '../../persistence/types';
import { Tooltip } from '../../shared';
import { Filter } from '../../shared/filter';
import { FormsPanel } from './forms-panel';

describe('FormsPanel', () => {
  let fixture: ComponentFixture<FormsPanel>;
  let createFolder: ReturnType<typeof vi.fn>;
  let openCreateFormDialog: ReturnType<typeof vi.fn>;
  let openImportDialog: ReturnType<typeof vi.fn>;
  const formList = signal<BaseEditorForm[]>([]);
  const hierarchyRootNodeIds = signal<string[]>([]);
  const hierarchyNodeMap = signal<Record<string, WorkspaceNode>>({});
  const storageRecoveryIssues = signal<readonly FormStoreRecoveryIssue[]>([]);
  const hasStorageRecoveryIssues = computed(() => storageRecoveryIssues().length > 0);
  let resetCorruptedStorage: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    formList.set([]);
    hierarchyRootNodeIds.set([]);
    hierarchyNodeMap.set({});
    storageRecoveryIssues.set([]);
    createFolder = vi.fn();
    resetCorruptedStorage = vi.fn();
    openCreateFormDialog = vi.fn();
    openImportDialog = vi.fn();

    TestBed.resetTestingModule();
    TestBed.overrideComponent(FormsPanel, {
      set: {
        imports: [Empty, ButtonDirective, ButtonIcon, ButtonLabel, ButtonGroup, Tooltip, Filter],
        schemas: [NO_ERRORS_SCHEMA],
        providers: [
          MouseInsideService,
          {
            provide: CreateFormDialogService,
            useValue: {
              open: openCreateFormDialog,
              close: vi.fn(),
              isOpen: signal(false),
              parentId: signal(null),
            },
          },
          {
            provide: ImportDialogService,
            useValue: { open: openImportDialog },
          },
        ],
      },
    });

    await TestBed.configureTestingModule({
      imports: [FormsPanel],
      providers: [
        {
          provide: CoreFormService,
          useValue: {
            formList,
            hierarchyRootNodeIds,
            hierarchyNodeMap,
            createFolder,
            storageRecoveryIssues,
            hasStorageRecoveryIssues,
            getStorageRecoveryBackup: () => '{}',
            resetCorruptedStorage,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormsPanel);
    fixture.detectChanges();
  });

  it('shows the first-run empty state and starter copy', () => {
    expect(fixture.nativeElement.textContent).toContain('No Forms Yet');
    expect(fixture.nativeElement.textContent).toContain(
      'Click the + button to add a new form. You can also add the default form',
    );
    expect(fixture.nativeElement.querySelector('button[aria-label="Create Form"]')).toBeTruthy();
  });

  it('renders the shared filter when forms exist', () => {
    hierarchyRootNodeIds.set(['form-1']);
    hierarchyNodeMap.set({
      'form-1': {
        id: 'form-1',
        name: 'Marketing Form',
        type: 'form',
        parentId: null,
        idPath: ['form-1'],
        libraryId: 'form-material',
        fieldCount: 0,
      },
    });

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('input[placeholder="Filter items..."]'),
    ).toBeTruthy();
  });

  it('shows an empty filter state when no forms or folders match', () => {
    hierarchyRootNodeIds.set(['folder-1', 'form-1']);
    hierarchyNodeMap.set({
      'folder-1': {
        id: 'folder-1',
        name: 'Marketing Folder',
        type: 'folder',
        parentId: null,
        idPath: ['folder-1'],
        childIds: [],
        isExpanded: true,
      },
      'form-1': {
        id: 'form-1',
        name: 'Marketing Form',
        type: 'form',
        parentId: null,
        idPath: ['form-1'],
        libraryId: 'form-material',
        fieldCount: 0,
      },
    });

    fixture.componentInstance.filterValue.set('zzz');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No forms or folders found');
    expect(fixture.nativeElement.textContent).toContain('Try adjusting your filter criteria.');
  });

  it('delegates starter actions to the form service and create-form dialog', () => {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const createNewButton = buttons.find((button) => button.textContent?.includes('Create Form'));
    const addNewButton = fixture.nativeElement.querySelector(
      'button[aria-label="Create Form"]',
    ) as HTMLButtonElement | null;
    const addFolderButton = fixture.nativeElement.querySelector(
      'button[aria-label="New folder"]',
    ) as HTMLButtonElement | null;

    expect(createNewButton).toBeTruthy();
    expect(addNewButton).toBeTruthy();
    expect(addFolderButton).toBeTruthy();

    createNewButton?.click();
    addNewButton?.click();
    addFolderButton?.click();

    expect(openCreateFormDialog).toHaveBeenCalledTimes(2);
    expect(openCreateFormDialog).toHaveBeenCalledWith();
    expect(createFolder).toHaveBeenCalledWith('New Folder');
  });

  it('groups actions and opens the import dialog', () => {
    const group = fixture.nativeElement.querySelector('p-buttongroup');
    const buttons = Array.from(group.querySelectorAll('button')) as HTMLButtonElement[];

    expect(group).toBeTruthy();
    expect(buttons.map((button) => button.getAttribute('aria-label'))).toEqual([
      'New folder',
      'Import Form',
      'Create Form',
    ]);
    expect(buttons[2].textContent).toContain('Create Form');

    buttons[1].click();

    expect(openImportDialog).toHaveBeenCalledWith();
  });

  it('offers backup and explicit reset actions for corrupted storage', async () => {
    storageRecoveryIssues.set([
      {
        editorType: 'test-editor',
        kind: 'forms',
        reason: 'invalid-json',
        storageKey: 'formly-studio-forms-test-editor',
        rawValue: '{',
      },
    ]);
    fixture.detectChanges();
    await fixture.whenStable();

    const alert = fixture.nativeElement.querySelector('[role="alert"]');
    const buttons = Array.from(alert.querySelectorAll('button')) as HTMLButtonElement[];
    expect(alert.textContent).toContain('Saved workspace data could not be read.');
    expect(buttons.map((button) => button.textContent?.trim())).toEqual([
      'Download backup',
      'Reset local data',
    ]);

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    buttons[1].click();

    expect(resetCorruptedStorage).toHaveBeenCalledOnce();
  });
});
