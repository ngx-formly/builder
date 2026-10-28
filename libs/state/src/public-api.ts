export type {
  BaseEditorForm,
  BaseWorkspaceNode,
  DefaultForm,
  EditorField,
  EditorForm,
  FieldInfo,
  FieldInfoBadge,
  WorkspaceFolderNode,
  WorkspaceFormNode,
  WorkspaceHierarchy,
  WorkspaceNode,
  WorkspaceNodeType,
} from './lib/model/types';

export {
  addNodeToHierarchy,
  buildHierarchyFromFlatForms,
  createEmptyWorkspaceHierarchy,
  getDescendantNodeIds,
  isAncestorOf,
  moveNodeInHierarchy,
  recalculateNodePaths,
  removeNodeFromHierarchy,
  renameNodeInHierarchy,
  toggleFolderExpansion,
} from './lib/model/workspace-hierarchy.utils';

export { LocalFormStoreService } from './lib/persistence/local-form-store.service';
export {
  CORE_FORM_STORE,
  FormStoreRecoveryRequiredError,
  type FormStoreDataKind,
  type FormStoreRecoveryIssue,
  type FormStoreService,
} from './lib/persistence/types';

export { BuilderEngineService } from './lib/editor/builder-engine.service';
export { BuilderFieldStateService } from './lib/editor/builder-field-state.service';
export { provideBuilderEngine } from './lib/editor/provider';
export {
  BUILDER_ENGINE_CONFIG,
  type BuilderEngineConfig,
  type EngineFieldType,
  type EngineFieldPreset,
  type EngineLibrary,
  type FormLoadError,
  type PersistenceError,
} from './lib/editor/types';
export {
  modifyPropertyTarget,
  PropertyChangeType,
  type PropertyChange,
} from './lib/editor/property-change';
export {
  clearFieldModelValue,
  convertField,
  generateFieldId,
  generateFormId,
} from './lib/editor/field-conversion';
