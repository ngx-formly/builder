import { FormlyBuilder, createLibrary, provideFormlyBuilder } from '@formly-editor/core';
import { withMarkdownType, withTabsType } from '@formly-editor/material';
import { withTabsTypeBuilder } from '@formly-editor/builder-material';
import { createEmptyWorkspaceHierarchy, type FormStoreService } from '@formly-editor/state';

export const consumerLibrary = createLibrary({
  id: 'consumer-material',
  label: 'Consumer Material',
  fieldCategoryOptions: [],
  formTemplates: [],
  configOptions: [withMarkdownType(), withTabsType()],
  builderConfigOptions: [withTabsTypeBuilder()],
});

export const consumerProviders = [
  provideFormlyBuilder({
    libraries: [consumerLibrary],
    editorType: 'consumer-form-editor',
    autoSaveDelay: 500,
  }),
];

export const editorComponent = FormlyBuilder;
export const emptyWorkspace = createEmptyWorkspaceHierarchy('consumer-workspace');
export type ConsumerFormStore = FormStoreService;
