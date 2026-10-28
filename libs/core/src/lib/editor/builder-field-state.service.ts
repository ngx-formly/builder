import { inject, Injectable } from '@angular/core';
import { BuilderFieldStateService as FieldState } from '@ngx-formly/builder-state';
import { CoreFormService } from './core-form.service';

@Injectable()
export class BuilderFieldStateService extends FieldState {
  constructor() {
    super(inject(CoreFormService));
  }
}
