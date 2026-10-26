import { createLibrary } from '@ngx-formly/builder';
import { ngZorroConfigOptions } from './ng-zorro.config';
import { formTemplates } from './ng-zorro.forms';
import { ngZorroFieldCategoryOptions } from './ng-zorro.options';

export const ngZorroFormEditorConfig = createLibrary({
  id: 'form-ng-zorro',
  fieldCategoryOptions: ngZorroFieldCategoryOptions,
  enableFormUploadSchema: true,
  formTemplates,
  label: 'Ng Zorro',
  configOptions: ngZorroConfigOptions(),
});
