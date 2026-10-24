import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormlyBuilder } from '@ngx-formly/builder';

@Component({
  selector: 'app-form-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormlyBuilder],
  host: { class: 'block h-full' },
  template: `<formly-builder class="block h-full" />`,
})
export class FormEditorApp {}
