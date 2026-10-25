import { Directive, inject } from '@angular/core';
import { ChipStyle } from 'primeng/chip';

@Directive({ selector: '[coreChipStyleFix]' })
export class ChipStyleFix {
  constructor() {
    // shortcut: PrimeNG 21 binds display:false; remove after its fix or the migration in #8.
    inject(ChipStyle).inlineStyles = {
      root: ({ instance }) => ({ display: instance.visible ? '' : 'none' }),
    };
  }
}
