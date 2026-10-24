import { EnvironmentProviders } from '@angular/core';
import { provideFormlyBuilder } from '@ngx-formly/builder';
import { bootstrapFormEditorConfig } from './bootstrap/bootstrap.library';
import { materialFormEditorConfig } from './material/material.library';
import { ngZorroFormEditorConfig } from './ng-zorro/ng-zorro.library';
import { studioMaterialFormEditorConfig } from './studio-material/studio-material.library';

export function provideFormEditor(): EnvironmentProviders {
  return provideFormlyBuilder({
    libraries: [
      studioMaterialFormEditorConfig,
      materialFormEditorConfig,
      ngZorroFormEditorConfig,
      bootstrapFormEditorConfig,
    ],
  });
}
