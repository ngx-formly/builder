# @ngx-formly/builder-material-fields

Generated declarations for review. Update with `npm run update:api`.

## Package exports

```json
{
  "./package.json": {
    "default": "./package.json"
  },
  ".": {
    "types": "./types/ngx-formly-builder-material-fields.d.ts",
    "default": "./fesm2022/ngx-formly-builder-material-fields.mjs"
  }
}
```

## Declarations

```ts
// types/ngx-formly-builder-material-fields.d.ts
import { ConfigOption, FormlyFieldConfig, FormlyFieldProps } from "@ngx-formly/core";
import { FormlyFieldProps as FormlyFieldProps$1 } from "@ngx-formly/material/form-field";
import { StepperOrientation } from "@angular/material/stepper";
import * as i0 from "@angular/core";
import { MatTabHeaderPosition } from "@angular/material/tabs";
export declare function withButtonGroupType(): ConfigOption;
export declare function withCardType(): ConfigOption;
export declare function withDividerType(): ConfigOption;
interface DividerProps extends FormlyFieldProps {
  vertical?: boolean;
  inset?: boolean;
}
export declare function withMarkdownType(): ConfigOption;
interface MarkdownProps extends FormlyFieldProps {
  text: string;
}
export declare function withPostalCodeType(): ConfigOption;
type PostalCodeInputMode = 'numeric' | 'text';
type PostalCodeAutocompleteContext = 'billing' | 'shipping' | 'unscoped';
interface PostalCodeProps extends FormlyFieldProps$1 {
  mask?: string;
  storeRawValue?: boolean;
  inputMode?: PostalCodeInputMode;
  autoCapitalize?: boolean;
  autocompleteContext?: PostalCodeAutocompleteContext;
  postalCodePattern?: string;
}
export declare function withRepeatingSectionType(): ConfigOption;
export declare function withStepType(): ConfigOption;
interface StepProps {
  label?: string;
  optional?: boolean;
  disableEdit?: boolean;
  previousButtonLabel?: string;
  nextButtonLabel?: string;
}
export declare function withStepperType(): ConfigOption;
interface StepperProps {
  linear?: boolean;
  orientation?: StepperOrientation;
  ariaLabel?: string;
}
export declare class StepperContent {
  readonly field: import("@angular/core").InputSignal<FormlyFieldConfig<import("@ngx-formly/core").FormlyFieldProps & {
    [additionalProperties: string]: any;
  }>>;
  readonly props: import("@angular/core").InputSignal<StepperProps>;
  readonly selectedIndex: import("@angular/core").ModelSignal<number>;
  get hasInvalidChildren(): boolean;
  get visibleSteps(): readonly FormlyFieldConfig<StepProps>[];
  get boundedSelectedIndex(): number;
  isStepValid(step: FormlyFieldConfig): boolean;
  stepLabel(step: FormlyFieldConfig<StepProps>, index: number): string;
  static ɵfac: i0.ɵɵFactoryDeclaration<StepperContent, never>;
  static ɵcmp: i0.ɵɵComponentDeclaration<StepperContent, "lib-stepper-content", never, {
    "field": {
      "alias": "field";
      "required": true;
      "isSignal": true;
    };
    "props": {
      "alias": "props";
      "required": true;
      "isSignal": true;
    };
    "selectedIndex": {
      "alias": "selectedIndex";
      "required": false;
      "isSignal": true;
    };
  }, {
    "selectedIndex": "selectedIndexChange";
  }, never, never, true, never>;
}
export declare function withTabType(): ConfigOption;
interface TabProps {
  label?: string;
  disabled?: boolean;
}
export declare function withTabsType(): ConfigOption;
type TabAlignment = 'start' | 'center' | 'end';
interface TabsProps {
  dynamicHeight?: boolean;
  headerPosition?: MatTabHeaderPosition;
  alignTabs?: TabAlignment;
  disableStretchTabs?: boolean;
  fitInkBarToContent?: boolean;
  preserveContent?: boolean;
}
export declare class TabsContent {
  readonly field: import("@angular/core").InputSignal<FormlyFieldConfig<import("@ngx-formly/core").FormlyFieldProps & {
    [additionalProperties: string]: any;
  }>>;
  readonly props: import("@angular/core").InputSignal<TabsProps>;
  readonly selectedIndex: import("@angular/core").ModelSignal<number>;
  get hasInvalidChildren(): boolean;
  get visibleTabs(): readonly FormlyFieldConfig<TabProps>[];
  get boundedSelectedIndex(): number;
  tabLabel(tab: FormlyFieldConfig<TabProps>, index: number): string;
  static ɵfac: i0.ɵɵFactoryDeclaration<TabsContent, never>;
  static ɵcmp: i0.ɵɵComponentDeclaration<TabsContent, "lib-tabs-content", never, {
    "field": {
      "alias": "field";
      "required": true;
      "isSignal": true;
    };
    "props": {
      "alias": "props";
      "required": true;
      "isSignal": true;
    };
    "selectedIndex": {
      "alias": "selectedIndex";
      "required": false;
      "isSignal": true;
    };
  }, {
    "selectedIndex": "selectedIndexChange";
  }, never, never, true, never>;
}
export declare function withCardWrapper(): ConfigOption;
export type { DividerProps, MarkdownProps, PostalCodeAutocompleteContext, PostalCodeInputMode, PostalCodeProps, StepProps, StepperProps, TabAlignment, TabProps, TabsProps };
```
