import { ChangeDetectionStrategy, Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  FormlyBuilder,
  createLibrary,
  primengPreset,
  provideFormlyBuilder,
} from '@ngx-formly/builder';
import { withMarkdownType, withTabsType } from '@ngx-formly/builder-material-fields';
import { withTabsTypeBuilder } from '@ngx-formly/builder-material';
import { createEmptyWorkspaceHierarchy, type FormStoreService } from '@ngx-formly/builder-state';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';

export const consumerLibrary = createLibrary({
  id: 'consumer-material',
  label: 'Consumer Material',
  fieldCategoryOptions: [],
  formTemplates: [],
  configOptions: [withMarkdownType(), withTabsType()],
  builderConfigOptions: [withTabsTypeBuilder()],
});

export const consumerProviders = [
  providePrimeNG({
    theme: {
      preset: definePreset(Aura, primengPreset),
      options: {
        darkModeSelector: '.dark',
        cssLayer: { name: 'primeng', order: 'theme, base, primeng' },
      },
    },
  }),
  provideFormlyBuilder({
    libraries: [consumerLibrary],
    editorType: 'consumer-form-editor',
    autoSaveDelay: 500,
  }),
];

export const editorComponent = FormlyBuilder;
export const emptyWorkspace = createEmptyWorkspaceHierarchy('consumer-workspace');
export type ConsumerFormStore = FormStoreService;

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormlyBuilder],
  template: `<formly-builder class="block h-full" />`,
})
class ConsumerApp {}

bootstrapApplication(ConsumerApp, { providers: consumerProviders }).catch(console.error);
