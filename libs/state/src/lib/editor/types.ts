import { InjectionToken, Type } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormStoreService } from '../persistence/types';

/** Field metadata used by document operations, without rendering components. */
export interface EngineFieldType {
  name: string;
  displayName: string;
  defaultConfig: FormlyFieldConfig;
  isParent?: boolean;
  isFieldArray?: boolean;
  disableKeyGeneration?: boolean;
  keyGenerationPrefix?: string;
}

export interface EngineFieldPreset {
  id?: string;
  displayName?: string;
  isRemovable?: boolean;
  typeOption?: EngineFieldType;
  field: FormlyFieldConfig;
}

/** Libraries available to a headless editor. Runtime registration is the host's responsibility. */
export interface EngineLibrary {
  id: string;
  fieldTypes: EngineFieldType[];
  defaultField?: FormlyFieldConfig;
}

export interface BuilderEngineConfig {
  editorType: string;
  libraries: EngineLibrary[];
  /** Defaults to true. */
  autoSave?: boolean;
  autoSaveDelay?: number;
  formStore?: Type<FormStoreService>;
}

export const BUILDER_ENGINE_CONFIG = new InjectionToken<BuilderEngineConfig>('BuilderEngineConfig');

/** A failed selection leaves the current document and save status unchanged. */
export interface FormLoadError {
  formId: string;
  reason: 'not-found' | 'missing-library' | 'store-error' | 'invalid-form' | 'recovery-required';
  libraryId?: string;
  cause?: unknown;
}

export interface PersistenceError {
  action: string;
  cause: unknown;
  failedFormIds?: string[];
}
