# @ngx-formly/builder-state

Generated declarations for review. Update with `npm run update:api`.

## Package exports

```json
{
  "./package.json": {
    "default": "./package.json"
  },
  ".": {
    "types": "./types/ngx-formly-builder-state.d.ts",
    "default": "./fesm2022/ngx-formly-builder-state.mjs"
  }
}
```

## Declarations

```ts
// types/ngx-formly-builder-state.d.ts
import { FormlyFieldConfig, FormlyFieldProps } from "@ngx-formly/core";
import { Observable, Subject } from "rxjs";
import * as i0 from "@angular/core";
import { EnvironmentProviders, InjectionToken, Type } from "@angular/core";
/**
 * Metadata about a field used by the editor to track relationships and UI state.
 */
interface FieldInfo {
  childIds: string[];
  isFieldArray?: boolean;
  /** Field name/label used for display or key generation. */
  name: string;
  /** The id of the form this field belongs to. */
  formId: string;
  /** Unique id for the field. */
  id: string;
  /** Array of ancestor ids followed by this field's id. */
  idPath: string[];
  /** True when the field can contain children. */
  isParent?: boolean;
  /** True when the field is a root-level field. */
  isRoot?: boolean;
  /** Optional UI badges to display alongside the field. */
  badges?: FieldInfoBadge[];
}
/**
 * Small descriptive badge attached to a field in the UI.
 */
interface FieldInfoBadge {
  /** Short badge text. */
  label: string;
  /** Longer description shown in a tooltip. */
  description: string;
}
type EditorField<Props = FormlyFieldProps & {
  [additionalProperties: string]: unknown;
}> = FormlyFieldConfig<Props> & {
  _info: FieldInfo;
  fieldGroup?: EditorField[];
  fieldArray?: EditorField;
  [key: string]: unknown;
};
/**
 * Basic metadata for an editor form.
 */
interface BaseEditorForm {
  /** Unique form id. */
  id: string;
  libraryId: string;
  fieldCount: number;
  /** Human friendly form name. */
  name: string;
  /** Optional parent directory/folder id. */
  parentId?: string | null;
}
/**
 * Full form representation including fields and model.
 */
interface EditorForm extends BaseEditorForm {
  /** Map of field id -> field instance. */
  fieldMap: Record<string, EditorField>;
  /** Ordered ids for root-level fields. */
  rootFieldIds: string[];
  /** Form model data object. */
  model: Record<string, unknown>;
}
/**
 * Default form package used when creating a new form from a template.
 */
interface DefaultForm {
  /** Identifier for the form. Will be generated if not set */
  id?: string;
  libraryId: string;
  fieldCount?: number;
  /** Optional parent folder id */
  parentId?: string | null;
  /** Form name. */
  name: string;
  /** Optional icon identifier (e.g. Material Symbols name) shown on template cards. */
  icon?: string;
  /** Optional short description shown on template cards. */
  description?: string;
  /** Array of field definitions for the template. */
  fields: FormlyFieldConfig[];
  /** Initial model for the template form. */
  model: Record<string, unknown>;
}
/**
 * Node types for workspace folder and form hierarchy.
 */
type WorkspaceNodeType = 'folder' | 'form';
interface BaseWorkspaceNode {
  id: string;
  name: string;
  type: WorkspaceNodeType;
  parentId: string | null;
  idPath: string[];
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}
interface WorkspaceFolderNode extends BaseWorkspaceNode {
  type: 'folder';
  childIds: string[];
  isExpanded?: boolean;
}
interface WorkspaceFormNode extends BaseWorkspaceNode {
  type: 'form';
  libraryId: string;
  fieldCount?: number;
}
type WorkspaceNode = WorkspaceFolderNode | WorkspaceFormNode;
interface WorkspaceHierarchy {
  workspaceId: string;
  rootNodeIds: string[];
  nodeMap: Record<string, WorkspaceNode>;
}
/**
 * Creates a clean, empty workspace hierarchy structure.
 */
export declare function createEmptyWorkspaceHierarchy(workspaceId: string): WorkspaceHierarchy;
/**
 * Checks if a candidate node is an ancestor of target node.
 * Used to prevent circular hierarchies (e.g. moving a folder into its own subfolder).
 */
export declare function isAncestorOf(hierarchy: WorkspaceHierarchy, potentialAncestorId: string, targetNodeId: string | null): boolean;
/**
 * Recursively collects all descendant node IDs for a given folder.
 */
export declare function getDescendantNodeIds(hierarchy: WorkspaceHierarchy, folderId: string): string[];
/**
 * Recalculates idPaths for a node and all its descendants recursively.
 */
export declare function recalculateNodePaths(nodeMap: Record<string, WorkspaceNode>, nodeId: string, parentPath?: string[]): Record<string, WorkspaceNode>;
/**
 * Adds a new node (folder or form) to the hierarchy immutably.
 */
export declare function addNodeToHierarchy(hierarchy: WorkspaceHierarchy, node: WorkspaceNode, targetIndex?: number): WorkspaceHierarchy;
/**
 * Removes a node and all of its descendants recursively from the hierarchy.
 */
export declare function removeNodeFromHierarchy(hierarchy: WorkspaceHierarchy, nodeId: string): {
  hierarchy: WorkspaceHierarchy;
  removedNodeIds: string[];
};
/**
 * Moves a node to a new parent folder (or to root) with cycle detection.
 */
export declare function moveNodeInHierarchy(hierarchy: WorkspaceHierarchy, nodeId: string, newParentId: string | null, targetIndex?: number): WorkspaceHierarchy;
/**
 * Renames a node in the hierarchy immutably.
 */
export declare function renameNodeInHierarchy(hierarchy: WorkspaceHierarchy, nodeId: string, newName: string): WorkspaceHierarchy;
/**
 * Toggles or sets the expanded state of a folder.
 */
export declare function toggleFolderExpansion(hierarchy: WorkspaceHierarchy, folderId: string, isExpanded?: boolean): WorkspaceHierarchy;
/**
 * Migrates a legacy flat array of forms into a normalized WorkspaceHierarchy.
 */
export declare function buildHierarchyFromFlatForms(workspaceId: string, forms: BaseEditorForm[]): WorkspaceHierarchy;
/**
 * Form store interface describing persistence operations.
 */
interface FormStoreService {
  /** Add a new form to storage. */
  addForm$(editorType: string, form: DefaultForm): Observable<void>;
  /** Update an existing form in storage. */
  updateForm$(editorType: string, form: DefaultForm): Observable<void>;
  /** Remove a form by id. */
  removeForm$(editorType: string, formId: string): Observable<void>;
  /** Retrieve a stored form by id. */
  getForm$(editorType: string, formId: string): Observable<DefaultForm | undefined>;
  /** List available forms for an editor. */
  getFormList$(editorType: string): Observable<BaseEditorForm[]>;
  /** Retrieve the full workspace hierarchy structure. */
  getHierarchy$(editorType: string): Observable<WorkspaceHierarchy>;
  /** Save the full workspace hierarchy structure. */
  saveHierarchy$(editorType: string, hierarchy: WorkspaceHierarchy): Observable<void>;
  /** Report local data that could not be read without discarding the original value. */
  getRecoveryIssues$?(editorType: string): Observable<readonly FormStoreRecoveryIssue[]>;
  /** Explicitly remove corrupted local data for an editor namespace. */
  resetCorruptedStorage$?(editorType: string): Observable<void>;
}
type FormStoreDataKind = 'forms' | 'hierarchy';
interface FormStoreRecoveryIssue {
  editorType: string;
  kind: FormStoreDataKind;
  reason: 'invalid-json' | 'invalid-shape';
  storageKey: string;
  rawValue: string;
  /** Additional stored values removed when this issue is reset, included in recovery backups. */
  relatedEntries?: readonly {
    storageKey: string;
    rawValue: string;
  }[];
}
export declare class FormStoreRecoveryRequiredError extends Error {
  readonly issues: readonly FormStoreRecoveryIssue[];
  constructor(issues: readonly FormStoreRecoveryIssue[]);
}
export declare const CORE_FORM_STORE: InjectionToken<FormStoreService>;
export declare class LocalFormStoreService implements FormStoreService {
  readonly storageKey = "formly-studio-forms";
  readonly hierarchyStorageKey = "formly-studio-hierarchy";
  private readonly recoveryIssues;
  addForm$(editorType: string, newForm: DefaultForm): Observable<undefined>;
  updateForm$(editorType: string, newForm: DefaultForm): Observable<undefined>;
  removeForm$(editorType: string, formId: string): Observable<undefined>;
  getFormList$(editorType: string): Observable<BaseEditorForm[]>;
  getForm$(editorType: string, formId: string): Observable<DefaultForm | undefined>;
  getHierarchy$(editorType: string): Observable<WorkspaceHierarchy>;
  saveHierarchy$(editorType: string, hierarchy: WorkspaceHierarchy): Observable<void>;
  getRecoveryIssues$(editorType: string): Observable<readonly FormStoreRecoveryIssue[]>;
  resetCorruptedStorage$(editorType: string): Observable<void>;
  protected getHierarchySync(editorType: string): WorkspaceHierarchy;
  protected storeHierarchy(editorType: string, hierarchy: WorkspaceHierarchy): void;
  protected getFormMap(editorType: string): Record<string, DefaultForm>;
  protected storeFormMap(editorType: string, formMap: Record<string, DefaultForm>): void;
  private getRecoveryIssuesSubject;
  private getRecoveryError;
  private setRecoveryIssue;
  private clearRecoveryIssue;
  private isFormMap;
  private isWorkspaceHierarchy;
  private isWorkspaceNode;
  private isRecord;
  static ɵfac: i0.ɵɵFactoryDeclaration<LocalFormStoreService, never>;
  static ɵprov: i0.ɵɵInjectableDeclaration<any>;
}
/** Field metadata used by document operations, without rendering components. */
interface EngineFieldType {
  name: string;
  displayName: string;
  defaultConfig: FormlyFieldConfig;
  isParent?: boolean;
  isFieldArray?: boolean;
  disableKeyGeneration?: boolean;
  keyGenerationPrefix?: string;
}
interface EngineFieldPreset {
  id?: string;
  displayName?: string;
  isRemovable?: boolean;
  typeOption?: EngineFieldType;
  field: FormlyFieldConfig;
}
/** Libraries available to a headless editor. Runtime registration is the host's responsibility. */
interface EngineLibrary {
  id: string;
  fieldTypes: EngineFieldType[];
  defaultField?: FormlyFieldConfig;
}
interface BuilderEngineConfig {
  editorType: string;
  libraries: EngineLibrary[];
  autoSave?: boolean;
  autoSaveDelay?: number;
  formStore?: Type<FormStoreService>;
}
export declare const BUILDER_ENGINE_CONFIG: InjectionToken<BuilderEngineConfig>;
export declare enum PropertyChangeType {
  KEY = 0,
  VALUE = 1,
  CLEAR = 2
}
interface PropertyChange {
  type: PropertyChangeType;
  path: string[];
  newPath?: string[];
  value?: unknown;
}
export declare const modifyPropertyTarget: <T extends Record<string, unknown>>(target: T, { type, ...change }: PropertyChange) => T;
export declare class BuilderEngineService {
  protected readonly editorConfig: BuilderEngineConfig;
  protected readonly formStoreService: FormStoreService;
  private readonly destroyRef;
  private pendingFormId;
  private readonly autosaveTrigger$;
  private readonly autosaveEnabled;
  private readonly autosaveDelay;
  readonly saveActiveFormTrigger$: Subject<void>;
  readonly saveStatusSrc: import("@angular/core").WritableSignal<"saved" | "dirty" | "saving" | "error">;
  readonly saveStatus: import("@angular/core").Signal<"saved" | "dirty" | "saving" | "error">;
  protected readonly storageRecoveryIssuesSrc: import("@angular/core").WritableSignal<readonly FormStoreRecoveryIssue[]>;
  readonly storageRecoveryIssues: import("@angular/core").Signal<readonly FormStoreRecoveryIssue[]>;
  readonly hasStorageRecoveryIssues: import("@angular/core").Signal<boolean>;
  readonly hasFormStorageRecoveryIssue: import("@angular/core").Signal<boolean>;
  protected readonly formListSrc: import("@angular/core").WritableSignal<BaseEditorForm[]>;
  protected readonly hierarchySrc: import("@angular/core").WritableSignal<WorkspaceHierarchy>;
  protected readonly activeFieldIdSrc: import("@angular/core").WritableSignal<string | null>;
  protected readonly activeFormSrc: import("@angular/core").WritableSignal<EditorForm | null>;
  protected readonly activeFieldIdByFormSrc: import("@angular/core").WritableSignal<Record<string, string | null>>;
  readonly formList: import("@angular/core").Signal<BaseEditorForm[]>;
  readonly hierarchy: import("@angular/core").Signal<WorkspaceHierarchy>;
  readonly hierarchyRootNodeIds: import("@angular/core").Signal<string[]>;
  readonly hierarchyNodeMap: import("@angular/core").Signal<Record<string, import("@ngx-formly/builder-state").WorkspaceNode>>;
  readonly activeFieldId: import("@angular/core").Signal<string | null>;
  readonly activeForm: import("@angular/core").Signal<EditorForm | null>;
  readonly activeFormId: import("@angular/core").Signal<string | undefined>;
  readonly activeFormName: import("@angular/core").Signal<string | undefined>;
  readonly activeRootFieldIds: import("@angular/core").Signal<string[]>;
  readonly activeFieldMap: import("@angular/core").Signal<Record<string, EditorField<import("@ngx-formly/core").FormlyFieldProps & {
    [additionalProperties: string]: unknown;
  }>>>;
  readonly activeFieldCount: import("@angular/core").Signal<number>;
  readonly activeField: import("@angular/core").Signal<EditorField<import("@ngx-formly/core").FormlyFieldProps & {
    [additionalProperties: string]: unknown;
  }> | null>;
  readonly activeFormFieldsRaw: import("@angular/core").Signal<EditorField[]>;
  readonly activeModel: import("@angular/core").Signal<Record<string, unknown>>;
  readonly activeLibraryId: import("@angular/core").Signal<string | null>;
  readonly formSelected$: Subject<EditorForm | null>;
  readonly activeFormFields: import("@angular/core").Signal<EditorField[]>;
  readonly activePreviewFormFields: import("@angular/core").Signal<EditorField[]>;
  readonly activeFormFieldsJSON: import("@angular/core").Signal<string>;
  constructor(config: BuilderEngineConfig, store: FormStoreService);
  protected markFormDirty(): void;
  protected refreshHierarchy(): void;
  resetCorruptedStorage(): void;
  getStorageRecoveryBackup(): string;
  setActiveField(fieldId: string | null): void;
  setActiveFormName(newName: string): void;
  setWorkspaceNodeName(nodeId: string, newName: string): void;
  setActiveForm(formId: string | null): void;
  saveActiveForm(): void;
  addForm$(name: string, fields: FormlyFieldConfig[] | undefined, model: Record<string, unknown>, libraryId: string, setActive?: boolean, parentId?: string | null): Observable<void>;
  removeForm(formId: string): void;
  createFolder(name: string, parentId?: string | null): string | undefined;
  deleteWorkspaceNode(nodeId: string): void;
  moveWorkspaceNode(nodeId: string, targetFolderId: string | null, targetIndex?: number): void;
  renameWorkspaceNode(nodeId: string, newName: string): void;
  toggleFolderExpansion(folderId: string, isExpanded?: boolean): void;
  private isStorageMutationBlocked;
  private handlePersistenceError;
  modifyActiveField(change: PropertyChange): void;
  setActiveModel(newModel: Record<string, unknown>): void;
  modifyActiveModel(newModelJSON: string): void;
  getField(fieldId: string): EditorField | undefined;
  private getTypeOptions;
  private getDefaultField;
  protected insertId(id: string, arr: string[], index: number | undefined): string[];
  buildField(fieldId: string, fieldMap: Record<string, EditorField>): EditorField;
  cleanField(field: EditorField): void;
  convertFromRawForm({ id, name, libraryId, fields, model }: DefaultForm): EditorForm;
  convertToRawForm({ id, libraryId, name, fieldMap, rootFieldIds, model }: EditorForm): DefaultForm;
  getFieldIndex(fieldId: string): number;
  addField(fieldType: string, parentId?: string, index?: number, preset?: EngineFieldPreset): void;
  removeField(fieldId: string): void;
  moveField(fieldId: string, fromIndex: number, toIndex: number | undefined, toParentId?: string | undefined): void;
  replaceField(fieldType: string, fieldId: string): void;
  static ɵfac: i0.ɵɵFactoryDeclaration<BuilderEngineService, never>;
  static ɵprov: i0.ɵɵInjectableDeclaration<any>;
}
type StatefulField = FormlyFieldConfig & {
  _info?: Pick<FieldInfo, 'id'>;
};
export declare class BuilderFieldStateService {
  protected readonly formService: BuilderEngineService;
  constructor(formService?: BuilderEngineService);
  private readonly state;
  getState<T>(field: StatefulField): T | undefined;
  setState<T>(field: StatefulField, state: T): void;
  static ɵfac: i0.ɵɵFactoryDeclaration<BuilderFieldStateService, never>;
  static ɵprov: i0.ɵɵInjectableDeclaration<any>;
}
/** Provide an isolated editor engine without configuring a UI shell or a Formly runtime. */
export declare function provideBuilderEngine(config: BuilderEngineConfig): EnvironmentProviders;
export declare function generateFormId(): string;
export declare function generateFieldId(type: string | undefined): string;
export declare function clearFieldModelValue(fieldId: string, fieldMap: Record<string, EditorField>, model: Record<string, unknown>): void;
/**
 * Converts a FormlyFieldConfig to an IEditorFormlyField, populating _info and generating ids.
 */
export declare function convertField(sourceField: FormlyFieldConfig, fieldId: string, formId: string, parentIdPath: string[] | undefined, fieldMap: Record<string, EditorField>, typeOptions: EngineFieldType[], getDefaultField: (type: string) => FormlyFieldConfig): EditorField;
export type { BaseEditorForm, BaseWorkspaceNode, BuilderEngineConfig, DefaultForm, EditorField, EditorForm, EngineFieldPreset, EngineFieldType, EngineLibrary, FieldInfo, FieldInfoBadge, FormStoreDataKind, FormStoreRecoveryIssue, FormStoreService, PropertyChange, WorkspaceFolderNode, WorkspaceFormNode, WorkspaceHierarchy, WorkspaceNode, WorkspaceNodeType };
```
