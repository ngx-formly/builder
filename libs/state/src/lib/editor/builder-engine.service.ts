import { computed, DestroyRef, Inject, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { get, isEmpty, unset } from 'lodash-es';
import { create } from 'mutative';
import {
  catchError,
  concatMap,
  debounceTime,
  defer,
  EMPTY,
  first,
  forkJoin,
  from,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  tap,
  toArray,
} from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  BaseEditorForm,
  DefaultForm,
  EditorField,
  EditorForm,
  WorkspaceFolderNode,
  WorkspaceHierarchy,
} from '../model/types';
import {
  BUILDER_ENGINE_CONFIG,
  BuilderEngineConfig,
  EngineFieldPreset,
  FormLoadError,
  PersistenceError,
} from './types';
import { CORE_FORM_STORE, FormStoreRecoveryIssue, FormStoreService } from '../persistence/types';
import { modifyPropertyTarget, PropertyChange } from './property-change';
import {
  clearFieldModelValue,
  convertField,
  generateFieldId,
  generateFormId,
} from './field-conversion';
import {
  addNodeToHierarchy,
  createEmptyWorkspaceHierarchy,
  moveNodeInHierarchy,
  removeNodeFromHierarchy,
  renameNodeInHierarchy,
  toggleFolderExpansion,
} from '../model/workspace-hierarchy.utils';

@Injectable()
export class BuilderEngineService {
  protected readonly editorConfig: BuilderEngineConfig;
  protected readonly formStoreService: FormStoreService;
  private readonly destroyRef = inject(DestroyRef);
  private pendingFormId: string | undefined;
  private readonly cancelLoad$ = new Subject<void>();
  private loadVersion = 0;
  private activeVersion = 0;
  private readonly queuedSaves = new Set<number>();
  private readonly operations$ = new Subject<() => Observable<unknown>>();
  private readonly loadingFormIdSrc = signal<string | null>(null);
  private readonly formLoadErrorSrc = signal<FormLoadError | null>(null);
  private readonly persistenceErrorSrc = signal<PersistenceError | null>(null);
  readonly loadingFormId = this.loadingFormIdSrc.asReadonly();
  readonly formLoadError = this.formLoadErrorSrc.asReadonly();
  readonly persistenceError = this.persistenceErrorSrc.asReadonly();
  private readonly autosaveTrigger$ = new Subject<string | null>();
  private readonly autosaveEnabled: boolean;
  private readonly autosaveDelay: number;

  readonly saveActiveFormTrigger$ = new Subject<void>();
  readonly saveStatusSrc = signal<'saved' | 'dirty' | 'saving' | 'error'>('saved');
  readonly saveStatus = this.saveStatusSrc.asReadonly();
  protected readonly storageRecoveryIssuesSrc = signal<readonly FormStoreRecoveryIssue[]>([]);
  readonly storageRecoveryIssues = this.storageRecoveryIssuesSrc.asReadonly();
  readonly hasStorageRecoveryIssues = computed(() => this.storageRecoveryIssues().length > 0);
  readonly hasFormStorageRecoveryIssue = computed(() =>
    this.storageRecoveryIssues().some((issue) => issue.kind === 'forms'),
  );

  protected readonly formListSrc = signal<BaseEditorForm[]>([]);
  protected readonly hierarchySrc = signal<WorkspaceHierarchy>(createEmptyWorkspaceHierarchy(''));
  protected readonly activeFieldIdSrc = signal<string | null>(null);
  protected readonly activeFormSrc = signal<EditorForm | null>(null);
  protected readonly activeFieldIdByFormSrc = signal<Record<string, string | null>>({});

  readonly formList = this.formListSrc.asReadonly();
  readonly hierarchy = this.hierarchySrc.asReadonly();
  readonly hierarchyRootNodeIds = computed(() => this.hierarchy().rootNodeIds);
  readonly hierarchyNodeMap = computed(() => this.hierarchy().nodeMap);
  readonly activeFieldId = this.activeFieldIdSrc.asReadonly();
  readonly activeForm = this.activeFormSrc.asReadonly();

  readonly activeFormId = computed(() => this.activeForm()?.id);
  readonly activeFormName = computed(() => this.activeForm()?.name);
  readonly activeRootFieldIds = computed(() => this.activeForm()?.rootFieldIds ?? []);
  readonly activeFieldMap = computed(() => this.activeForm()?.fieldMap ?? {});
  readonly activeFieldCount = computed(() => Object.keys(this.activeFieldMap()).length);
  readonly activeField = computed(() => {
    const activeFieldId = this.activeFieldId();
    if (!activeFieldId) {
      return null;
    }
    return this.activeFieldMap()[activeFieldId] || null;
  });
  readonly activeFormFieldsRaw = computed(() =>
    this.activeRootFieldIds().map((id) => this.buildField(id, this.activeFieldMap())),
  );
  readonly activeModel = computed(() => this.activeForm()?.model || {});
  readonly activeLibraryId = computed(() => this.activeForm()?.libraryId ?? null);
  readonly formSelected$ = new Subject<EditorForm | null>();

  readonly activeFormFields = computed(() => structuredClone(this.activeFormFieldsRaw()));
  readonly activePreviewFormFields = computed(() => {
    const clonedFields = structuredClone(this.activeFormFieldsRaw());
    clonedFields.forEach((f) => this.cleanField(f));
    return clonedFields;
  });
  readonly activeFormFieldsJSON = computed(() =>
    JSON.stringify(this.activePreviewFormFields(), null, 2),
  );

  constructor(
    // eslint-disable-next-line @angular-eslint/prefer-inject -- The shell facade passes its existing configuration and store.
    @Inject(BUILDER_ENGINE_CONFIG) config: BuilderEngineConfig,
    // eslint-disable-next-line @angular-eslint/prefer-inject -- The shell facade passes its existing configuration and store.
    @Inject(CORE_FORM_STORE) store: FormStoreService,
  ) {
    this.editorConfig = config;
    this.formStoreService = store;
    this.autosaveEnabled = config.autoSave ?? true;
    this.autosaveDelay = config.autoSaveDelay ?? 3000;
    this.hierarchySrc.set(createEmptyWorkspaceHierarchy(config.editorType));
    this.operations$
      .pipe(
        concatMap((operation) => operation()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
    this.enqueue$(() => this.refreshWorkspace$()).subscribe({
      error: (error) => this.handlePersistenceError('load workspace', error),
    });

    defer(() => this.formStoreService.getRecoveryIssues$?.(this.editorConfig.editorType) ?? EMPTY)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (issues) => this.storageRecoveryIssuesSrc.set(issues),
        error: (error) => this.handlePersistenceError('load recovery state', error),
      });

    if (this.autosaveEnabled) {
      this.autosaveTrigger$
        .pipe(debounceTime(this.autosaveDelay), takeUntilDestroyed(this.destroyRef))
        .subscribe((formId) => {
          if (formId && formId === this.activeFormId() && this.saveStatus() === 'dirty') {
            this.saveActiveForm();
          }
        });
    }
    this.saveActiveFormTrigger$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.requestSave());
  }

  // Queue the entire read/modify/write operation, not a snapshot captured before earlier writes.
  private enqueue$<T>(operation: () => Observable<T>): Observable<T> {
    return new Observable<T>((subscriber) => {
      if (this.destroyRef.destroyed) {
        subscriber.complete();
        return;
      }
      this.operations$.next(() =>
        subscriber.closed
          ? EMPTY
          : defer(operation).pipe(
              tap({
                next: (value) => subscriber.next(value),
                error: (error) => subscriber.error(error),
                complete: () => subscriber.complete(),
              }),
              catchError(() => EMPTY),
            ),
      );
    }).pipe(takeUntilDestroyed(this.destroyRef));
  }

  private snapshot$<T>(read: () => Observable<T>): Observable<T> {
    return defer(read).pipe(first(), takeUntilDestroyed(this.destroyRef));
  }

  private refreshWorkspace$(): Observable<void> {
    return forkJoin({
      forms: this.snapshot$(() => this.formStoreService.getFormList$(this.editorConfig.editorType)),
      hierarchy: this.snapshot$(() =>
        this.formStoreService.getHierarchy$(this.editorConfig.editorType),
      ),
    }).pipe(
      tap(({ forms, hierarchy }) => {
        if (!this.hasFormStorageRecoveryIssue()) this.formListSrc.set(forms);
        if (!this.storageRecoveryIssues().some((issue) => issue.kind === 'hierarchy')) {
          this.hierarchySrc.set(hierarchy);
        }
      }),
      map(() => undefined),
    );
  }

  private runMutation(
    action: string,
    operation: () => Observable<unknown>,
    recovery = false,
  ): void {
    this.enqueue$(() => {
      if (!recovery && this.isStorageMutationBlocked()) return EMPTY;
      this.persistenceErrorSrc.set(null);
      return defer(operation).pipe(
        catchError((error) => {
          this.handlePersistenceError(action, error);
          return of(undefined);
        }),
        switchMap(() => this.refreshWorkspace$()),
      );
    }).subscribe({ error: (error) => this.handlePersistenceError(action, error) });
  }

  private requestSave(): void {
    const formId = this.activeFormId();
    const version = this.activeVersion;
    if (!formId || this.queuedSaves.has(version) || this.isStorageMutationBlocked()) return;
    this.queuedSaves.add(version);
    this.saveStatusSrc.set('saving');
    this.enqueue$(() => {
      const form = this.activeForm();
      if (!form || version !== this.activeVersion || this.isStorageMutationBlocked()) return EMPTY;
      this.persistenceErrorSrc.set(null);
      return this.snapshot$(() =>
        this.formStoreService.updateForm$(
          this.editorConfig.editorType,
          this.convertToRawForm(form),
        ),
      ).pipe(
        switchMap(() => this.refreshWorkspace$()),
        tap(() => {
          if (version === this.activeVersion) {
            this.saveStatusSrc.set(this.activeForm() === form ? 'saved' : 'dirty');
          }
        }),
      );
    }).subscribe({
      error: (error) => {
        this.queuedSaves.delete(version);
        if (version === this.activeVersion) {
          this.pendingFormId = undefined;
          this.handlePersistenceError('save form', error);
        } else {
          this.persistenceErrorSrc.set({ action: 'save form', cause: error });
        }
      },
      complete: () => {
        this.queuedSaves.delete(version);
        if (this.destroyRef.destroyed || version !== this.activeVersion) return;
        if (this.saveStatus() === 'dirty') {
          this.requestSave();
        } else if (this.pendingFormId) {
          const target = this.pendingFormId;
          this.pendingFormId = undefined;
          this.setActiveForm(target);
        }
      },
    });
  }

  protected markFormDirty(): void {
    if (this.loadingFormId()) this.cancelLoad();
    // A failed save needs an explicit retry, even if editing continues.
    if (this.saveStatus() !== 'error') {
      this.saveStatusSrc.set(this.queuedSaves.has(this.activeVersion) ? 'saving' : 'dirty');
      if (this.autosaveEnabled) this.autosaveTrigger$.next(this.activeFormId() ?? null);
    }
  }

  protected refreshHierarchy(): void {
    this.enqueue$(() => this.refreshWorkspace$()).subscribe({
      error: (error) => this.handlePersistenceError('load workspace', error),
    });
  }

  resetCorruptedStorage(): void {
    const reset = this.formStoreService.resetCorruptedStorage$;
    if (!reset) return;
    this.runMutation(
      'reset storage',
      () =>
        this.snapshot$(() => reset.call(this.formStoreService, this.editorConfig.editorType)).pipe(
          switchMap(() => this.refreshWorkspace$()),
          tap(() => {
            if (!this.formList().some((form) => form.id === this.activeFormId())) {
              this.setActiveForm(null);
            }
          }),
        ),
      true,
    );
  }

  getStorageRecoveryBackup(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        editorType: this.editorConfig.editorType,
        entries: this.storageRecoveryIssues(),
      },
      null,
      2,
    );
  }

  setActiveField(fieldId: string | null): void {
    this.activeFieldIdSrc.set(fieldId);

    const formId = this.activeFormId();
    if (formId) {
      this.activeFieldIdByFormSrc.update((map) => ({
        ...map,
        [formId]: fieldId,
      }));
    }
  }

  setActiveFormName(newName: string): void {
    const form = this.activeForm();
    if (!form) return;

    const newForm = { ...form, name: newName };
    this.activeFormSrc.set(newForm);
    this.markFormDirty();
  }

  setWorkspaceNodeName(nodeId: string, newName: string): void {
    this.runMutation('rename item', () => {
      const node = this.hierarchyNodeMap()[nodeId];
      if (!node) return of(undefined);
      if (node.type === 'form') {
        const activeName = this.activeFormId() === nodeId ? this.activeFormName() : undefined;
        return this.snapshot$(() =>
          this.formStoreService.getForm$(this.editorConfig.editorType, nodeId),
        ).pipe(
          switchMap((form) =>
            form
              ? this.snapshot$(() =>
                  this.formStoreService.updateForm$(this.editorConfig.editorType, {
                    ...form,
                    name: newName,
                  }),
                )
              : of(undefined),
          ),
          tap(() => {
            if (this.activeFormId() === nodeId && this.activeFormName() === activeName) {
              this.setActiveFormName(newName);
            }
          }),
          switchMap(() =>
            this.snapshot$(() =>
              this.formStoreService.saveHierarchy$(
                this.editorConfig.editorType,
                renameNodeInHierarchy(this.hierarchy(), nodeId, newName),
              ),
            ),
          ),
        );
      }
      return this.snapshot$(() =>
        this.formStoreService.saveHierarchy$(
          this.editorConfig.editorType,
          renameNodeInHierarchy(this.hierarchy(), nodeId, newName),
        ),
      );
    });
  }

  private cancelLoad(): void {
    this.loadVersion++;
    this.cancelLoad$.next();
    this.loadingFormIdSrc.set(null);
  }

  setActiveForm(formId: string | null): void {
    if (this.destroyRef.destroyed) return;
    this.cancelLoad();
    this.pendingFormId = undefined;
    this.formLoadErrorSrc.set(null);
    if (!formId) {
      this.activeVersion++;
      this.activeFormSrc.set(null);
      this.activeFieldIdSrc.set(null);
      this.saveStatusSrc.set('saved');
      this.formSelected$.next(null);
      return;
    }
    if (formId === this.activeFormId()) return;
    if (this.hasFormStorageRecoveryIssue()) {
      this.formLoadErrorSrc.set({ formId, reason: 'recovery-required' });
      return;
    }
    if (this.activeForm() && this.saveStatus() !== 'saved') {
      this.pendingFormId = formId;
      this.requestSave();
      return;
    }

    const version = this.loadVersion;
    this.loadingFormIdSrc.set(formId);
    this.snapshot$(() => this.formStoreService.getForm$(this.editorConfig.editorType, formId))
      .pipe(takeUntil(this.cancelLoad$))
      .subscribe({
        next: (rawForm) => {
          if (version !== this.loadVersion) return;
          this.loadingFormIdSrc.set(null);
          if (!rawForm) {
            this.formLoadErrorSrc.set({ formId, reason: 'not-found' });
            return;
          }
          if (!this.editorConfig.libraries.some((library) => library.id === rawForm.libraryId)) {
            this.formLoadErrorSrc.set({
              formId,
              reason: 'missing-library',
              libraryId: rawForm.libraryId,
            });
            return;
          }
          let form: EditorForm;
          try {
            form = this.convertFromRawForm(rawForm);
          } catch (cause) {
            this.formLoadErrorSrc.set({ formId, reason: 'invalid-form', cause });
            return;
          }
          this.activeVersion++;
          this.activeFormSrc.set(form);
          this.saveStatusSrc.set('saved');
          const fieldId = this.activeFieldIdByFormSrc()[formId];
          this.activeFieldIdSrc.set(
            fieldId && form.fieldMap[fieldId] ? fieldId : (form.rootFieldIds[0] ?? null),
          );
          this.formSelected$.next(form);
        },
        error: (cause) => {
          if (version !== this.loadVersion) return;
          this.loadingFormIdSrc.set(null);
          this.formLoadErrorSrc.set({ formId, reason: 'store-error', cause });
        },
      });
  }

  saveActiveForm() {
    this.saveActiveFormTrigger$.next();
  }

  addForm$(
    name: string,
    fields: FormlyFieldConfig[] = [],
    model: Record<string, unknown>,
    libraryId: string,
    setActive = true,
    parentId?: string | null,
  ): Observable<void> {
    // Create Form
    const newRawForm: DefaultForm = {
      id: generateFormId(),
      libraryId: libraryId,
      fieldCount: 0,
      parentId: parentId ?? null,
      name,
      fields,
      model,
    };
    const newForm = this.convertFromRawForm(newRawForm);
    newRawForm.fieldCount = Object.keys(newForm.fieldMap).length;

    return this.enqueue$(() =>
      this.snapshot$(() =>
        this.formStoreService.addForm$(this.editorConfig.editorType, newRawForm),
      ).pipe(
        switchMap(() => this.refreshWorkspace$()),
        tap(() => {
          if (setActive) this.setActiveForm(newForm.id);
        }),
      ),
    );
  }

  private clearDeletedSelection(formId: string): void {
    if (this.loadingFormId() === formId) this.cancelLoad();
    if (this.pendingFormId === formId) this.pendingFormId = undefined;
    if (this.activeFormId() === formId) this.setActiveForm(null);
  }

  removeForm(formId: string): void {
    this.runMutation('remove form', () =>
      this.snapshot$(() =>
        this.formStoreService.removeForm$(this.editorConfig.editorType, formId),
      ).pipe(tap(() => this.clearDeletedSelection(formId))),
    );
  }

  createFolder(name: string, parentId: string | null = null): string | undefined {
    if (this.isStorageMutationBlocked()) return undefined;
    const folderId = `folder_${uuidv4().substring(0, 8)}`;
    this.runMutation('create folder', () => {
      const parentNode = parentId ? this.hierarchyNodeMap()[parentId] : null;
      const folder: WorkspaceFolderNode = {
        id: folderId,
        name,
        type: 'folder',
        parentId,
        idPath: [...(parentNode?.idPath ?? []), folderId],
        childIds: [],
        isExpanded: true,
      };
      return this.snapshot$(() =>
        this.formStoreService.saveHierarchy$(
          this.editorConfig.editorType,
          addNodeToHierarchy(this.hierarchy(), folder),
        ),
      );
    });
    return folderId;
  }

  deleteWorkspaceNode(nodeId: string): void {
    this.runMutation('delete item', () => {
      const node = this.hierarchyNodeMap()[nodeId];
      if (!node) return of(undefined);
      const { removedNodeIds } = removeNodeFromHierarchy(this.hierarchy(), nodeId);
      const formIds = removedNodeIds.filter((id) => this.formList().some((form) => form.id === id));
      const failedFormIds: string[] = [];
      const failures: unknown[] = [];
      return from(formIds).pipe(
        concatMap((id) =>
          this.snapshot$(() =>
            this.formStoreService.removeForm$(this.editorConfig.editorType, id),
          ).pipe(
            tap(() => this.clearDeletedSelection(id)),
            catchError((error) => {
              failedFormIds.push(id);
              failures.push(error);
              return of(undefined);
            }),
          ),
        ),
        toArray(),
        switchMap(() =>
          this.snapshot$(() => this.formStoreService.getHierarchy$(this.editorConfig.editorType)),
        ),
        switchMap((hierarchy) => {
          for (const id of formIds.filter((id) => !failedFormIds.includes(id))) {
            hierarchy = removeNodeFromHierarchy(hierarchy, id).hierarchy;
          }
          if (!failedFormIds.length)
            hierarchy = removeNodeFromHierarchy(hierarchy, nodeId).hierarchy;
          return this.snapshot$(() =>
            this.formStoreService.saveHierarchy$(this.editorConfig.editorType, hierarchy),
          );
        }),
        catchError((error) => {
          failures.push(error);
          return of(undefined);
        }),
        tap(() => {
          if (failures.length)
            this.handlePersistenceError(
              'delete item',
              new AggregateError(failures, 'Some forms could not be deleted.'),
              failedFormIds,
            );
        }),
      );
    });
  }

  moveWorkspaceNode(nodeId: string, targetFolderId: string | null, targetIndex?: number): void {
    this.runMutation('move item', () => {
      const updated = moveNodeInHierarchy(this.hierarchy(), nodeId, targetFolderId, targetIndex);
      return this.snapshot$(() =>
        this.formStoreService.saveHierarchy$(this.editorConfig.editorType, updated),
      ).pipe(
        switchMap(() => {
          if (updated.nodeMap[nodeId]?.type !== 'form') return of(undefined);
          return this.snapshot$(() =>
            this.formStoreService.getForm$(this.editorConfig.editorType, nodeId),
          ).pipe(
            switchMap((form) =>
              form
                ? this.snapshot$(() =>
                    this.formStoreService.updateForm$(this.editorConfig.editorType, {
                      ...form,
                      parentId: targetFolderId,
                    }),
                  )
                : of(undefined),
            ),
            tap(() => {
              const active = this.activeForm();
              if (active?.id === nodeId)
                this.activeFormSrc.set({ ...active, parentId: targetFolderId });
            }),
          );
        }),
      );
    });
  }

  renameWorkspaceNode(nodeId: string, newName: string): void {
    this.setWorkspaceNodeName(nodeId, newName);
  }

  toggleFolderExpansion(folderId: string, isExpanded?: boolean): void {
    this.runMutation('update folder', () =>
      this.snapshot$(() =>
        this.formStoreService.saveHierarchy$(
          this.editorConfig.editorType,
          toggleFolderExpansion(this.hierarchy(), folderId, isExpanded),
        ),
      ),
    );
  }

  private isStorageMutationBlocked(): boolean {
    if (!this.hasStorageRecoveryIssues()) {
      return false;
    }
    this.saveStatusSrc.set('error');
    return true;
  }

  private handlePersistenceError(action: string, error: unknown, failedFormIds?: string[]): void {
    this.persistenceErrorSrc.set({ action, cause: error, failedFormIds });
    this.saveStatusSrc.set('error');
    console.error(`Failed to ${action}`, error);
  }

  modifyActiveField(change: PropertyChange): void {
    if (!change.path) {
      throw new Error('Path is missing from field change');
    }

    const form = this.activeForm();
    if (!form) return;

    const activeFieldId = this.activeFieldIdSrc();
    if (!activeFieldId) return;

    const activeField = this.getField(activeFieldId);
    if (!activeField) return;

    const newActiveField = modifyPropertyTarget(activeField, change);
    const newFieldMap = { ...this.activeFieldMap(), [newActiveField._info.id]: newActiveField };

    const newForm = { ...form, fieldMap: newFieldMap };
    this.activeFormSrc.set(newForm);
    this.markFormDirty();
  }

  setActiveModel(newModel: Record<string, unknown>): void {
    const form = this.activeForm();
    if (!form) return;

    const newForm = { ...form, model: newModel };
    this.activeFormSrc.set(newForm);
    this.markFormDirty();
  }

  modifyActiveModel(newModelJSON: string): void {
    const form = this.activeForm();
    if (!form) return;

    const newModel = JSON.parse(newModelJSON);

    const newForm = { ...form, model: newModel };
    this.activeFormSrc.set(newForm);
    this.markFormDirty();
  }

  getField(fieldId: string): EditorField | undefined {
    return this.activeFieldMap()?.[fieldId];
  }

  private getTypeOptions(libraryId: string) {
    return (
      this.editorConfig.libraries.find((library) => library.id === libraryId)?.fieldTypes ?? []
    );
  }

  private getDefaultField(type: string, libraryId: string): FormlyFieldConfig {
    const library = this.editorConfig.libraries.find((library) => library.id === libraryId);
    const option = library?.fieldTypes.find((field) => field.name === type);
    return structuredClone(
      option ? { ...option.defaultConfig, type: option.name } : (library?.defaultField ?? {}),
    );
  }

  protected insertId(id: string, arr: string[], index: number | undefined) {
    let newArr: string[];
    if (typeof index === 'number') {
      newArr = [...arr.slice(0, index), id, ...arr.slice(index)];
    } else {
      newArr = [...arr, id];
    }

    return newArr;
  }

  buildField(fieldId: string, fieldMap: Record<string, EditorField>): EditorField {
    const field = fieldMap[fieldId];
    const clonedField: EditorField = structuredClone(field);
    const info = clonedField._info;
    if (info.isFieldArray && info.childIds.length) {
      const fieldArray = this.buildField(info.childIds[0], fieldMap);
      if (fieldArray) {
        clonedField.fieldArray = fieldArray;
      }
    } else if (info.childIds.length) {
      clonedField.fieldGroup = info.childIds
        .map((id) => this.buildField(id, fieldMap))
        .filter((f: EditorField | undefined): f is EditorField => !!f);
    }
    return clonedField;
  }
  cleanField(field: EditorField): void {
    if (field._info.isParent) {
      if (field._info.isFieldArray && field.fieldArray) {
        this.cleanField(field.fieldArray);
      } else if (field.fieldGroup?.length) {
        field.fieldGroup.forEach((f: EditorField) => this.cleanField(f));
      }
    }

    // Remove editor properties
    unset(field, '_info');

    // Remove empty properties
    [
      'wrappers',
      'templateOptions',
      'props',
      'expression',
      'className',
      'fieldGroupClassName',
      'validation.messages',
      'validation',
    ].forEach((p) => {
      if (isEmpty(get(field, p))) {
        unset(field, p);
      }
    });
  }
  convertFromRawForm({ id, name, libraryId, fields, model, parentId }: DefaultForm): EditorForm {
    id = id || generateFormId();
    const fieldMap: Record<string, EditorField> = {};
    const fieldTypeOptions = this.getTypeOptions(libraryId);
    const rootFields = fields.map((f) =>
      convertField(
        f,
        generateFieldId(f.type as string),
        id,
        [],
        fieldMap,
        fieldTypeOptions,
        (type: string) => this.getDefaultField(type, libraryId),
      ),
    );
    const rootFieldIds = rootFields.map((f) => f._info.id);

    return {
      id,
      name,
      libraryId,
      fieldCount: Object.keys(fieldMap).length,
      parentId,
      fieldMap,
      rootFieldIds,
      model,
    };
  }
  convertToRawForm({
    id,
    libraryId,
    name,
    fieldMap,
    rootFieldIds,
    model,
    parentId,
  }: EditorForm): DefaultForm {
    const fields: EditorField[] = rootFieldIds.map((id) => this.buildField(id, fieldMap));
    fields.forEach((f) => this.cleanField(f));
    return {
      id,
      libraryId: libraryId,
      name,
      fieldCount: Object.keys(fieldMap).length,
      fields,
      model,
      parentId,
    };
  }
  getFieldIndex(fieldId: string): number {
    const field = this.getField(fieldId);
    if (!field) return -1;

    const idPath = field._info.idPath;
    const parentId = idPath[idPath.length - 2];

    if (parentId) {
      const parent = this.getField(parentId);
      if (!parent) return -1;
      return parent._info.childIds.indexOf(fieldId);
    }

    const form = this.activeForm();
    if (!form) return -1;
    return form.rootFieldIds.indexOf(fieldId);
  }
  addField(fieldType: string, parentId?: string, index?: number, preset?: EngineFieldPreset): void {
    const form = this.activeForm();
    if (!form) return;

    const activeLibraryId = this.activeLibraryId();
    if (!activeLibraryId) {
      throw new Error('No active configuration is set.');
    }

    const newFieldId = generateFieldId(fieldType);
    const newForm = create(form, (draft) => {
      const fieldMap = draft.fieldMap;
      const parent = parentId ? fieldMap[parentId] : undefined;

      // Create new field
      convertField(
        preset?.field ?? this.getDefaultField(fieldType, activeLibraryId),
        newFieldId,
        draft.id,
        parent ? parent._info.idPath : [],
        fieldMap as Record<string, EditorField>,
        this.getTypeOptions(activeLibraryId),
        (type: string) => this.getDefaultField(type, activeLibraryId),
      );

      // Add new field to parent
      if (parent) {
        if (parent._info.isFieldArray) {
          const previousChildId = parent._info.childIds[0];
          const removeRecursively = (fieldId: string) => {
            const field = fieldMap[fieldId];
            if (!field) return;

            field._info.childIds.forEach(removeRecursively);
            delete fieldMap[fieldId];
          };

          if (previousChildId) {
            removeRecursively(previousChildId);
          }
          parent._info.childIds = [newFieldId];
        } else {
          parent._info.childIds = this.insertId(newFieldId, parent._info.childIds, index);
        }
      } else {
        // Add new field as root field
        draft.rootFieldIds = this.insertId(newFieldId, draft.rootFieldIds, index);
      }
    });

    // Set active form and field
    this.activeFormSrc.set(newForm);
    this.markFormDirty();
    this.activeFieldIdSrc.set(newFieldId);
  }
  removeField(fieldId: string): void {
    const form = this.activeForm();
    if (!form) return;
    const field = form.fieldMap[fieldId];
    if (!field) return;
    const activeFieldId = this.activeFieldIdSrc();
    const activeField = activeFieldId ? form.fieldMap[activeFieldId] : undefined;

    const newForm = create(form, (draft) => {
      const fieldMap = draft.fieldMap;
      const field = fieldMap[fieldId];
      const parentId = field._info.idPath[field._info.idPath.length - 2];

      // Remove field from parent's childIds or from rootFieldIds
      if (parentId) {
        const parent = fieldMap[parentId];
        parent._info.childIds = parent._info.childIds.filter((id) => id !== fieldId);
      } else {
        draft.rootFieldIds = draft.rootFieldIds.filter((id) => id !== fieldId);
      }

      clearFieldModelValue(fieldId, fieldMap as Record<string, EditorField>, draft.model);

      // Remove field and its descendants from field map
      const removeRecursively = (id: string) => {
        const field = fieldMap[id];
        if (field) {
          field._info.childIds.forEach(removeRecursively);
          delete fieldMap[id];
        }
      };
      removeRecursively(fieldId);
    });

    // Set active form
    this.activeFormSrc.set(newForm);
    this.markFormDirty();

    // Clear active field if it was removed directly or as part of a removed subtree
    if (activeFieldId === fieldId || activeField?._info.idPath.includes(fieldId)) {
      this.activeFieldIdSrc.set(null);
    }
  }
  moveField(
    fieldId: string,
    fromIndex: number,
    toIndex: number | undefined,
    toParentId?: string | undefined,
  ): void {
    const form = this.activeForm();
    if (!form) return;
    const field = form.fieldMap[fieldId];
    if (!field) return;

    const newForm = create(form, (draft) => {
      const fieldMap = draft.fieldMap;
      const field = fieldMap[fieldId];
      const currentParentId = field._info.idPath[field._info.idPath.length - 2];
      const targetParent = toParentId ? fieldMap[toParentId] : undefined;

      // Prevent moving into self or descendant
      if (targetParent?._info.idPath.includes(fieldId)) {
        return;
      }

      // Remove from current parent or root
      if (currentParentId) {
        const currentParent = fieldMap[currentParentId];
        currentParent._info.childIds = currentParent._info.childIds.filter(
          (id: string) => id !== fieldId,
        );
      } else {
        draft.rootFieldIds = draft.rootFieldIds.filter((id) => id !== fieldId);
      }

      // Insert into target parent or root
      if (targetParent) {
        if (targetParent._info.isFieldArray) {
          targetParent._info.childIds = [fieldId];
        } else {
          let insertIndex =
            typeof toIndex === 'number' ? toIndex : targetParent._info.childIds.length;

          // If reordering within the same parent and the original index was before the target, the removal shifted indices left
          if (currentParentId === targetParent._info.id && fromIndex < insertIndex) {
            insertIndex--;
          }

          targetParent._info.childIds = this.insertId(
            fieldId,
            targetParent._info.childIds,
            insertIndex,
          );
        }
      } else {
        let insertIndex = typeof toIndex === 'number' ? toIndex : draft.rootFieldIds.length;

        // If reordering within root and the original index was before the target, the removal shifted indices left
        if (!currentParentId && fromIndex < insertIndex) {
          insertIndex--;
        }

        draft.rootFieldIds = this.insertId(fieldId, draft.rootFieldIds, insertIndex);
      }

      // Update id path for new field and descendants
      const updateIdPath = (currFieldId: string, parentPath: string[]) => {
        const currField = fieldMap[currFieldId];
        currField._info.idPath = [...parentPath, currFieldId];
        currField._info.childIds.forEach((childId) =>
          updateIdPath(childId, currField._info.idPath),
        );
      };

      updateIdPath(fieldId, targetParent ? targetParent._info.idPath : []);
    });

    if (newForm === form) return;

    this.activeFormSrc.set(newForm);
    this.markFormDirty();
    // keep moved field active
    this.activeFieldIdSrc.set(fieldId);
  }

  replaceField(fieldType: string, fieldId: string): void {
    const form = this.activeForm();
    if (!form) return;

    const field = form.fieldMap[fieldId];
    if (!field || field.type === fieldType) return;

    const activeLibraryId = this.activeLibraryId();
    if (!activeLibraryId) {
      throw new Error('No active configuration is set.');
    }

    const fieldTypeOptions = this.getTypeOptions(activeLibraryId);
    if (!fieldTypeOptions.some((option) => option.name === fieldType)) return;

    const parentId = field._info.idPath[field._info.idPath.length - 2];
    const siblingIds = parentId ? form.fieldMap[parentId]?._info.childIds : form.rootFieldIds;
    const siblingIndex = siblingIds?.indexOf(fieldId) ?? -1;
    if (siblingIndex < 0) return;

    const replacementId = generateFieldId(fieldType);

    const newForm = create(form, (draft) => {
      const fieldMap = draft.fieldMap;
      const oldField = fieldMap[fieldId];
      const parent = parentId ? fieldMap[parentId] : undefined;

      convertField(
        this.getDefaultField(fieldType, activeLibraryId),
        replacementId,
        draft.id,
        parent?._info.idPath ?? [],
        fieldMap as Record<string, EditorField>,
        fieldTypeOptions,
        (type: string) => this.getDefaultField(type, activeLibraryId),
      );

      const replacement = fieldMap[replacementId];
      const oldChildIds = [...oldField._info.childIds];

      if (oldField.key !== undefined) {
        replacement.key = oldField.key;
      }
      if (oldField.className !== undefined) {
        replacement.className = oldField.className;
      }
      if (oldField.fieldGroupClassName !== undefined) {
        replacement.fieldGroupClassName = oldField.fieldGroupClassName;
      }

      const canTransferChildren = oldField._info.isParent && replacement._info.isParent;

      const removeSubtree = (id: string) => {
        const child = fieldMap[id];
        if (!child) return;

        child._info.childIds.forEach(removeSubtree);
        delete fieldMap[id];
      };

      if (canTransferChildren) {
        replacement._info.childIds.forEach(removeSubtree);
        const transferredChildIds = replacement._info.isFieldArray
          ? oldChildIds.slice(0, 1)
          : oldChildIds;
        const transferredChildIdSet = new Set(transferredChildIds);

        oldChildIds.filter((childId) => !transferredChildIdSet.has(childId)).forEach(removeSubtree);
        replacement._info.childIds = transferredChildIds;

        const updateIdPath = (id: string, parentPath: string[]) => {
          const child = fieldMap[id];
          if (!child) return;

          child._info.idPath = [...parentPath, id];
          child._info.childIds.forEach((childId) => updateIdPath(childId, child._info.idPath));
        };

        oldChildIds.forEach((childId) => updateIdPath(childId, replacement._info.idPath));
      } else {
        oldChildIds.forEach(removeSubtree);
      }

      if (parent) {
        parent._info.childIds[siblingIndex] = replacementId;
      } else {
        draft.rootFieldIds[siblingIndex] = replacementId;
      }

      clearFieldModelValue(fieldId, fieldMap as Record<string, EditorField>, draft.model);
      delete fieldMap[fieldId];
    });

    this.activeFormSrc.set(newForm);
    this.markFormDirty();
    this.activeFieldIdSrc.set(replacementId);
  }
}
