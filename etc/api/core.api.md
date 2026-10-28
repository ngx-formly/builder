# @ngx-formly/builder

Generated declarations for review. Update with `npm run update:api`.

## Package exports

```json
{
  "./styles.css": {
    "style": "./styles.css",
    "default": "./styles.css"
  },
  "./package.json": {
    "default": "./package.json"
  },
  ".": {
    "types": "./types/ngx-formly-builder.d.ts",
    "default": "./fesm2022/ngx-formly-builder.mjs"
  }
}
```

## Declarations

```ts
// types/ngx-formly-builder.d.ts
import { BaseEditorForm, BaseWorkspaceNode, BuilderEngineService, BuilderFieldStateService as BuilderFieldStateService$1, CORE_FORM_STORE, DefaultForm, EditorField, EditorForm, FieldInfo, FieldInfoBadge, FormStoreDataKind, FormStoreRecoveryIssue, FormStoreRecoveryRequiredError, FormStoreService, PropertyChange, PropertyChangeType, WorkspaceFolderNode, WorkspaceFormNode, WorkspaceHierarchy, WorkspaceNode, WorkspaceNodeType, addNodeToHierarchy, buildHierarchyFromFlatForms, createEmptyWorkspaceHierarchy, getDescendantNodeIds, isAncestorOf, modifyPropertyTarget, moveNodeInHierarchy, recalculateNodePaths, removeNodeFromHierarchy, renameNodeInHierarchy, toggleFolderExpansion } from "@ngx-formly/builder-state";
import * as i0 from "@angular/core";
import { EnvironmentProviders, InjectionToken, TrackByFunction, Type, WritableSignal } from "@angular/core";
import * as z$1 from "zod";
import z, { ZodType } from "zod";
import { ConfigOption, FormlyFieldConfig } from "@ngx-formly/core";
import { MenuItem } from "primeng/api";
import { Subject } from "rxjs";
import { NgForm } from "@angular/forms";
import { Preset } from "@primeuix/themes/types";
interface BooleanPropertyConfig extends BasePropertyConfig {
    type: PropertyType.BOOLEAN;
    /**
     * When true (default), a false value clears the property from the target
     * instead of writing false. Only true is persisted.
     * @default true
     */
    clearOnFalse?: boolean;
    /**
     * When true (default), a null value clears the property from the target
     * instead of writing null.
     * @default true
     */
    clearOnEmpty?: boolean;
}
export declare const createBooleanProperty: PropertyCreator<BooleanPropertyConfig, BooleanPropertyConfig>;
interface DatePropertyConfig extends BasePropertyConfig {
    type: PropertyType.DATE;
    /**
     * When true (default), an empty value clears the property from the target
     * instead of being ignored. Set to false to leave the existing value untouched.
     * @default true
     */
    clearOnEmpty?: boolean;
}
export declare const createDateProperty: PropertyCreator<DatePropertyConfig, DatePropertyConfig>;
interface InputPropertyConfig extends BasePropertyConfig {
    type: PropertyType.INPUT;
    /**
     * HTML Input data type which controls the control's keyboard and
     * formatting behavior (e.g. 'number' restricts to numeric input).
     */
    dataType: 'email' | 'number' | 'password' | 'tel' | 'text' | 'url';
    /**
     * Placeholder text shown inside the input when the value is empty.
     */
    placeholder?: string;
    /**
     * When true (default), an empty value clears the property from the target
     * instead of writing the empty value. Set to false to persist empty values.
     * @default true
     */
    clearOnEmpty?: boolean;
}
export declare const createInputProperty: PropertyCreator<InputPropertyConfig, InputPropertyConfig>;
interface ObjectPropertyConfig extends BasePropertyConfig {
    type: PropertyType.OBJECT;
    /**
     * Child properties contained by this object property.
     */
    childProperties: PropertyConfig[];
    /**
     * Not intended for public configuration.
     * @internal
     */
    populateChildrenFromTarget?: boolean;
    /**
     * When true, the object may be collapsed/expanded in the UI.
     */
    isCollapsible?: boolean;
}
export declare const createObjectProperty: PropertyCreator<ObjectPropertyConfig, ObjectPropertyConfig>;
interface ChipsPropertyConfig extends BasePropertyConfig {
    type: PropertyType.CHIPS;
    /**
     * Placeholder text displayed in the chips input when empty.
     */
    placeholder?: string;
    /**
     * When configured, chips can be represented as a single string using
     * the provided separator on output.
     */
    outputString?: {
        /**
         * Separator used to join chips when producing a single output string.
         */
        separator: string;
    };
}
export declare const createChipsProperty: PropertyCreator<ChipsPropertyConfig, ChipsPropertyConfig>;
type CustomValidationPropertyConfig = BasePropertyConfig & {
    type: PropertyType.CUSTOM_VALIDATION;
    /**
     * Which validation key in the field this property configures.
     */
    key: 'asyncValidators.validation' | 'validators.validation';
    /**
     * Available custom validator types and their options.
     */
    validationOptions: CustomValidationOption[];
};
interface CustomValidation {
    name: string;
    options?: Record<string, unknown>;
}
interface CustomValidationOption {
    /**
     * Display label for this validator option.
     */
    label: string;
    /**
     * Value/key used to identify the validator.
     */
    value: string;
    /**
     * Optional properties describing additional configuration options
     * for this custom validator.
     */
    optionProperties?: PropertyConfig[];
}
export declare const createCustomValidationProperty: PropertyCreator<CustomValidationPropertyConfig, CustomValidationPropertyConfig>;
type ExpressionsPropertyConfig = BasePropertyConfig & {
    type: PropertyType.EXPRESSIONS;
    key: 'expressionProperties' | 'expressions' | 'widget.formlyConfig.expressionProperties' | 'widget.formlyConfig.expressions';
};
export declare const createExpressionsProperty: PropertyCreator<ExpressionsPropertyConfig, ExpressionsPropertyConfig>;
interface SelectPropertyConfig extends BasePropertyConfig {
    type: PropertyType.SELECT;
    /**
     * Available options shown in the select control.
     */
    options: SelectPropertyOption[];
    /**
     * Placeholder text when no option is selected.
     */
    placeholder?: string;
    /**
     * When true (default), an empty selection clears the property from the target
     * instead of writing null.
     * @default true
     */
    clearOnEmpty?: boolean;
}
interface SelectPropertyOption {
    /**
     * Human readable label for the option.
     */
    label: string;
    /**
     * Value stored in the model when the option is selected.
     */
    value: number | string;
}
export declare const createSelectProperty: PropertyCreator<SelectPropertyConfig, SelectPropertyConfig>;
type GroupChildPropertyConfig = BooleanPropertyConfig | InputPropertyConfig | SelectPropertyConfig;
interface GroupPropertyConfig extends BasePropertyConfig {
    type: PropertyType.GROUP;
    /** Properties rendered inside the group panel. */
    childProperties: GroupChildPropertyConfig[];
}
export declare const createGroupProperty: PropertyCreator<GroupPropertyConfig, GroupPropertyConfig>;
interface MarkdownPropertyConfig extends BasePropertyConfig {
    type: PropertyType.MARKDOWN;
    placeholder?: string;
    clearOnEmpty?: boolean;
}
export declare const createMarkdownProperty: PropertyCreator<MarkdownPropertyConfig, MarkdownPropertyConfig>;
type ValidationMessagesPropertyConfig = BasePropertyConfig & {
    type: PropertyType.VALIDATION_MESSAGES;
    key: 'validation.messages' | 'widget.formlyConfig.validation.messages';
    /**
     * List of validators that can be configured with custom messages.
     */
    validationOptions: ValidationOption[];
};
interface ValidationMessage {
    key: string;
    value: string;
}
interface ValidationOption {
    /**
     * Human readable label for the validator.
     */
    label: string;
    /**
     * Validator key used in the field/configuration.
     */
    value: string;
}
export declare const createValidationMessagesProperty: PropertyCreator<ValidationMessagesPropertyConfig, ValidationMessagesPropertyConfig>;
interface WrappersPropertyOption {
    /** Human readable wrapper label shown in the selector. */
    label: string;
    /** Wrapper name stored in the field configuration. */
    value: string;
}
interface WrappersPropertyConfig extends BasePropertyConfig {
    type: PropertyType.WRAPPERS;
    /** Wrapper options available to the selected field type. */
    options: WrappersPropertyOption[];
    /** Placeholder text shown when no wrapper is selected. */
    placeholder?: string;
    /** When true (default), an empty value clears the property from the target instead of writing the empty value. */
    clearOnEmpty?: boolean;
}
export declare const createWrappersProperty: PropertyCreator<WrappersPropertyConfig, WrappersPropertyConfig>;
export declare enum PropertyType {
    BOOLEAN = "Boolean",
    INPUT = "Input",
    MARKDOWN = "Markdown",
    DATE = "Date",
    OBJECT = "Object",
    GROUP = "Group",
    ARRAY = "Array",
    SELECT = "Select",
    CHIPS = "Chips",
    WRAPPERS = "Wrappers",
    EXPRESSIONS = "Expressions",
    VALIDATION_MESSAGES = "Validation Messages",
    CUSTOM_VALIDATION = "Custom Validation"
}
interface BasePropertyConfig {
    /**
     * Identifies the property kind.
     */
    type: PropertyType;
    /**
     * Label shown in the UI for this property.
     */
    label?: string;
    /**
     * Short description or help text used for tooltips.
     */
    description?: string;
    /**
     * Optional key or path segment associated with this property.
     */
    key?: string;
    /**
     * When true, the property may be removed by the user in the UI.
     */
    isRemovable?: boolean;
    /**
     * When true, the property's key may be edited by the user.
     */
    isKeyEditable?: boolean;
    /**
     * When true, this property is required.
     */
    isRequired?: boolean;
    /**
     * Column span used when rendering this property in a grid layout.
     */
    colSpan?: number;
}
type PropertyConfig = ArrayPropertyConfig | BooleanPropertyConfig | ChipsPropertyConfig | CustomValidationPropertyConfig | DatePropertyConfig | ExpressionsPropertyConfig | GroupPropertyConfig | InputPropertyConfig | MarkdownPropertyConfig | ObjectPropertyConfig | SelectPropertyConfig | ValidationMessagesPropertyConfig | WrappersPropertyConfig;
type PropertyCreator<T extends BasePropertyConfig, V extends BasePropertyConfig> = (property: Omit<T, 'type'>) => V;
interface ArrayPropertyConfig extends BasePropertyConfig {
    type: PropertyType.ARRAY;
    /**
     * Property for each element contained in the array.
     */
    childProperty?: PropertyConfig;
    /**
     * Whether new items can be added to the array from the UI.
     */
    canAdd?: boolean;
    /**
     * When true, the array panel may be collapsed in the UI.
     */
    isCollapsible?: boolean;
    /**
     * When true, an eligible object array can be edited in the table dialog.
     * Eligibility requires keyed Input, Boolean, or Select child properties.
     */
    useTableDialog?: boolean;
}
export declare const createArrayProperty: PropertyCreator<ArrayPropertyConfig, ArrayPropertyConfig>;
export declare const trackByPropertyKey: TrackByFunction<PropertyConfig>;
export declare function getChildPath(path: string[], key: number | string | undefined): string[];
export declare const getDefaultProperty: (type: PropertyType, key?: string, dataType?: "number" | "text", childPropertyType?: PropertyType) => PropertyConfig;
export declare const getDefaultPropertyFromValue: (value: unknown, key?: string) => PropertyConfig | undefined;
export declare const getDefaultPropertyValue: (type: PropertyType, dataType?: "number" | "text") => unknown;
/**
 * Convert an IProperty configuration to a Zod schema for validation.
 * @param property - The property configuration to convert
 * @returns A Zod schema that validates against the property structure
 */
export declare function getPropertySchema(property: PropertyConfig): z.ZodType;
type ValidationRulePropertyConfig = BooleanPropertyConfig | DatePropertyConfig | InputPropertyConfig | SelectPropertyConfig;
interface ValidationRuleConfig {
    /** Formly validator name used as the key in validation.messages. */
    name: string;
    /** Property control that configures the validator. */
    property: ValidationRulePropertyConfig;
}
interface FieldValidationConfig {
    /** Fixed built-in validation rules supported by this field type. */
    rules: ValidationRuleConfig[];
    /** Optional synchronous custom validator section. */
    customValidators?: CustomValidationPropertyConfig;
    /** Optional asynchronous custom validator section. */
    asyncValidators?: CustomValidationPropertyConfig;
    /** Additional validation display controls such as validation.show. */
    displayProperties?: PropertyConfig[];
}
/**
 * A category of field types shown in the UI.
 */
interface FieldCategoryOption {
    /** The category label shown to users. */
    displayName: string;
    /** The field type options that belong to this category. */
    children: FieldTypeOption[];
}
interface FieldCategoryPreset {
    displayName: string;
    children: FieldTypePreset[];
}
/**
 * A field type option describing how a particular field type behaves.
 */
interface FieldTypeOption {
    isFieldArray?: boolean;
    /** Unique type name (used as `type`). */
    name: string;
    /** Human friendly name shown in the palette. */
    displayName: string;
    /** Optional prefix used when generating field keys. */
    keyGenerationPrefix?: string;
    /** When true prevents automatic key generation. */
    disableKeyGeneration?: boolean;
    /** Marks the type as a container/parent type. */
    isParent?: boolean;
    /** Default Formly config used when inserting this field. */
    defaultConfig: FormlyFieldConfig;
    /** Optional wrappers available for this field type. */
    wrapperOptions?: FieldWrapperOption[];
    /** Icon identifier (UI-specific) for the type. */
    materialSymbol: string;
    /** Optional editor property descriptors for configuring this type. */
    properties?: PropertyConfig[];
    /** Optional editor configuration for validation rules and their messages. */
    validationConfig?: FieldValidationConfig;
    /** Optional preset field instances for quick insertion. */
    initialPresets?: FieldTypePreset[];
}
interface FieldTypePreset {
    id: string;
    displayName: string;
    field: FormlyFieldConfig;
    isRemovable?: boolean;
    /**
     * Not intended for public configuration.
     * @internal
     */
    typeOption?: FieldTypeOption;
}
/**
 * Wrapper (container) option description.
 */
interface FieldWrapperOption {
    /** Wrapper key used by Formly. */
    name: string;
    /** Human friendly name shown in the field editor. */
    label: string;
    /** Optional editor properties exposed for the wrapper. */
    properties?: PropertyConfig[];
}
/**
 * Global configuration for the core editor.
 */
interface LibraryConfig {
    /** Unique configuration id used to route editor operations. */
    id: string;
    /** Categories and their field types shown in the palette. */
    fieldCategoryOptions: FieldCategoryOption[];
    /** Enable JSON schema validation in the form import dialog. */
    enableFormUploadSchema?: boolean;
    formTemplates: DefaultForm[];
    label: string;
    configOptions: ConfigOption[];
    /** Optional Formly configuration loaded only for builder contexts. */
    builderConfigOptions?: ConfigOption[];
    schema: ZodType;
    /** Default type option applied to unknown types. */
    defaultTypeOption: FieldTypeOption;
}
interface CoreEditorConfig {
    editorType: string;
    defaultTypeOption: FieldTypeOption;
    /** Enable debounced persistence for active form mutations. */
    autoSave?: boolean;
    /** Delay in milliseconds before an active form mutation is persisted. */
    autoSaveDelay?: number;
}
/** Public configuration for an embedded Formly Builder instance. */
interface FormlyBuilderConfig {
    /** Formly UI profiles available to authors. */
    libraries: LibraryConfig[];
    /** Storage namespace used to isolate this editor's documents. */
    editorType?: string;
    /** Enable debounced persistence for active form mutations. Defaults to true. */
    autoSave?: boolean;
    /** Delay in milliseconds before an active form mutation is persisted. */
    autoSaveDelay?: number;
    /** Persistence implementation. Defaults to browser local storage. */
    formStore?: Type<FormStoreService>;
}
declare const CORE_EDITOR_CONFIG: InjectionToken<CoreEditorConfig>;
export declare const CORE_LIBRARY_CONFIGS: InjectionToken<LibraryConfig[]>;
export declare class CoreLibraryService {
    protected readonly libraryConfigs: LibraryConfig[];
    readonly formTemplates: import("@ngx-formly/builder").DefaultForm[];
    readonly libraryOptions: {
        id: string;
        label: string;
    }[];
    protected readonly activeLibrarySrc: import("@angular/core").WritableSignal<LibraryConfig | null>;
    readonly activeLibrary: import("@angular/core").Signal<LibraryConfig | null>;
    readonly activeLibraryId: import("@angular/core").Signal<null | string>;
    readonly activeLibraryLabel: import("@angular/core").Signal<null | string>;
    setActiveLibrary(libraryId: null | string): void;
    getLibraryLabel(libraryId: string): null | string;
    getLibrary(libraryId: string): LibraryConfig | null;
    static ɵfac: i0.ɵɵFactoryDeclaration<CoreLibraryService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<any>;
}
interface LibraryProperties {
    presetStorageKey: string;
    fieldCategoryOptions: FieldCategoryOption[];
    fieldTypeOptions: FieldTypeOption[];
    fieldTypeMap: Record<string, FieldTypeOption>;
}
export declare class CoreFieldService {
    protected readonly editorConfig: import("@ngx-formly/builder").CoreEditorConfig;
    protected readonly libraryConfigs: import("@ngx-formly/builder").LibraryConfig[];
    protected readonly libraryService: CoreLibraryService;
    protected activeLibraryId: import("@angular/core").Signal<null | string>;
    protected readonly libraryPropertyMap: Record<string, LibraryProperties>;
    protected readonly basePresetStorageKey = "formly-studio-presets";
    defaultTypeOption: FieldTypeOption;
    protected readonly activeFieldTypeMap: import("@angular/core").Signal<Record<string, FieldTypeOption>>;
    readonly activeFieldCategoryOptions: import("@angular/core").Signal<{
        children: FieldTypeOption[];
        displayName: string;
    }[]>;
    readonly activeFieldTypeOptions: import("@angular/core").Signal<FieldTypeOption[]>;
    readonly classNamePath: string[];
    readonly fieldGroupClassNamePath: string[];
    readonly filterPaths: string[];
    readonly validationMessagesPath: string[];
    readonly fieldCategoryPresets: import("@angular/core").WritableSignal<FieldCategoryPreset[]>;
    constructor();
    getTypeOptions(libraryId: string): FieldTypeOption[];
    getTypeOption(type: string): FieldTypeOption | undefined;
    getDefaultField(type: string, configId: string): FormlyFieldConfig;
    getProperties(field: FormlyFieldConfig): PropertyConfig[];
    getValidationConfig(field: FormlyFieldConfig): FieldValidationConfig | undefined;
    getFieldIcon(field: EditorField): string | undefined;
    isFieldEqual(a: EditorField, b: EditorField): boolean;
    savePreset(displayName: string, field: FormlyFieldConfig): void;
    protected getFieldProperties(type: string, configProperties: LibraryProperties): PropertyConfig[];
    protected getFieldValidationConfig(type: string, configProperties: LibraryProperties): FieldValidationConfig | undefined;
    protected getWrapperProperties(wrappers: string[], typeOption: FieldTypeOption): PropertyConfig[];
    protected getTypeOptionForProperties(type: string, configProperties: LibraryProperties): FieldTypeOption;
    protected setupInitialPresets(configId: string): void;
    protected updatePresetCategories(configId: string): void;
    protected getPresetMap(configId: string): Record<string, FieldTypePreset[]>;
    protected storePresetMap(presetMap: Record<string, FieldTypePreset[]>, configId: string): void;
    getKey(field: EditorField): string;
    getKeyPath(fieldInfo: FieldInfo, fieldMap: Record<string, EditorField>): string;
    getChildIds(fieldInfo: FieldInfo): string[];
    static ɵfac: i0.ɵɵFactoryDeclaration<CoreFieldService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<any>;
}
interface CoreAddFieldOption extends MenuItem {
    items?: CoreAddFieldOption[];
    fieldType?: string;
}
type LHSPanelType = 'add-field' | 'fields' | 'forms';
type RHSPanelType = 'field-edit' | 'model' | 'styling' | 'validation';
declare enum DropAction {
    COPY = "copy",
    MOVE = "move"
}
interface DragData {
    action: DropAction;
    fieldType: string;
    fieldId: string;
    index?: number;
    preset?: FieldTypePreset;
}
interface DragOverData {
    fieldId: string;
    clientX: number;
}
type FieldDropPosition = 'center' | 'left' | 'right';
type FormDisplayMode = 'form' | 'json' | 'preview';
declare class PanelService {
    protected readonly activePanelSrc: import("@angular/core").WritableSignal<LHSPanelType | RHSPanelType>;
    readonly activePanel: import("@angular/core").Signal<LHSPanelType | RHSPanelType>;
    protected readonly activeLHSPanelSrc: import("@angular/core").WritableSignal<LHSPanelType>;
    readonly activeLHSPanel: import("@angular/core").Signal<LHSPanelType>;
    protected readonly activeRHSPanelSrc: import("@angular/core").WritableSignal<RHSPanelType>;
    readonly activeRHSPanel: import("@angular/core").Signal<RHSPanelType>;
    protected highlightPanelSrc$: Subject<LHSPanelType | RHSPanelType>;
    readonly highlightPanel$: import("rxjs").Observable<LHSPanelType | RHSPanelType>;
    setActivePanel(panel: LHSPanelType | RHSPanelType): void;
    setActiveLHSPanel(panel: LHSPanelType): void;
    setActiveRHSPanel(panel: RHSPanelType): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<PanelService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<any>;
}
/** Shell facade retaining the existing editing API. */
export declare class CoreFormService extends BuilderEngineService {
    protected readonly libraryService: CoreLibraryService;
    protected readonly fieldService: CoreFieldService;
    protected readonly panelService: PanelService;
    readonly activeFormDisplayModeSrc: import("@angular/core").WritableSignal<"form" | "json" | "preview">;
    readonly activeFormDisplayMode: import("@angular/core").Signal<"form" | "json" | "preview">;
    readonly isEditMode: import("@angular/core").Signal<boolean>;
    protected readonly mouseInsideIds: import("@angular/core").WritableSignal<string[]>;
    readonly activeMouseInside: import("@angular/core").Signal<null | string>;
    readonly activeSchema: import("@angular/core").Signal<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>> | undefined>;
    constructor();
    setMouseEnteredField(fieldId: string): void;
    setMouseLeftField(fieldId: string): void;
    setActiveFormDisplayMode(mode: 'form' | 'json' | 'preview'): void;
    getAddOptions(info: FieldInfo): CoreAddFieldOption[];
    getReplaceOptions(info: FieldInfo): CoreAddFieldOption[];
    static ɵfac: i0.ɵɵFactoryDeclaration<CoreFormService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<any>;
}
declare class AddFieldPanel {
    protected formService: CoreFormService;
    protected fieldService: CoreFieldService;
    activeFormId: import("@angular/core").Signal<string | undefined>;
    activeField: import("@angular/core").Signal<EditorField<import("@ngx-formly/core").FormlyFieldProps & {
        [additionalProperties: string]: unknown;
    }> | null>;
    fieldCategoryPresets: import("@angular/core").WritableSignal<FieldCategoryPreset[]>;
    readonly activeTab: import("@angular/core").WritableSignal<"fields" | "presets">;
    static ɵfac: i0.ɵɵFactoryDeclaration<AddFieldPanel, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<AddFieldPanel, "core-add-field-panel", never, {}, {}, never, never, true, never>;
}
declare class FieldEditPanel {
    protected formService: CoreFormService;
    protected fieldService: CoreFieldService;
    activeField: import("@angular/core").Signal<EditorField<import("@ngx-formly/core").FormlyFieldProps & {
        [additionalProperties: string]: unknown;
    }> | null>;
    activeFieldMap: import("@angular/core").Signal<Record<string, EditorField<import("@ngx-formly/core").FormlyFieldProps & {
        [additionalProperties: string]: unknown;
    }>>>;
    readonly headerTitle: import("@angular/core").Signal<string>;
    readonly parentField: import("@angular/core").Signal<EditorField<import("@ngx-formly/core").FormlyFieldProps & {
        [additionalProperties: string]: unknown;
    }> | null>;
    readonly activeFieldByType: import("@angular/core").Signal<EditorField<import("@ngx-formly/core").FormlyFieldProps & {
        [additionalProperties: string]: unknown;
    }> | null>;
    readonly properties: import("@angular/core").Signal<import("@ngx-formly/builder").PropertyConfig[]>;
    readonly keyPath: import("@angular/core").Signal<string>;
    onFieldChanged(change: PropertyChange): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<FieldEditPanel, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<FieldEditPanel, "core-field-edit-panel", never, {}, {}, never, never, true, never>;
}
declare class MouseInsideService {
    protected readonly isMoudeInsideSrc: import("@angular/core").WritableSignal<boolean>;
    readonly isMouseInside: import("@angular/core").Signal<boolean>;
    setMouseInside(isInside: boolean): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<MouseInsideService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<any>;
}
declare class FieldsPanel {
    protected formService: CoreFormService;
    protected fieldService: CoreFieldService;
    protected panelService: PanelService;
    protected mouseInsideService: MouseInsideService;
    readonly filterValue: import("@angular/core").WritableSignal<string>;
    readonly isFiltering: import("@angular/core").Signal<boolean>;
    readonly filteredVisibleFieldIds: import("@angular/core").Signal<string[]>;
    activeFormId: import("@angular/core").Signal<string | undefined>;
    rootFieldIds: import("@angular/core").Signal<string[]>;
    openFormsPanel(): void;
    setMouseInside(isInside: boolean): void;
    clearFilter(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<FieldsPanel, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<FieldsPanel, "core-fields-panel", never, {}, {}, never, never, true, never>;
}
declare class FormPanel {
    protected formService: CoreFormService;
    activeFormId: import("@angular/core").Signal<string | undefined>;
    activeFormFieldsJSON: import("@angular/core").Signal<string>;
    activeFormDisplayMode: import("@angular/core").Signal<"form" | "json" | "preview">;
    schema: import("@angular/core").Signal<import("zod").ZodType<unknown, unknown, import("zod/v4/core").$ZodTypeInternals<unknown, unknown>> | undefined>;
    activePreviewFormFields$: import("rxjs").Observable<EditorField<import("@ngx-formly/core").FormlyFieldProps & {
        [additionalProperties: string]: unknown;
    }>[]>;
    displayMode$: import("rxjs").Observable<"form" | "json" | "preview">;
    previewFields$: import("rxjs").Observable<EditorField<import("@ngx-formly/core").FormlyFieldProps & {
        [additionalProperties: string]: unknown;
    }>[]>;
    setActiveFormDisplayMode(mode?: number | string): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<FormPanel, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<FormPanel, "core-form-panel", never, {}, {}, never, never, true, never>;
}
export declare class CreateFormDialogService {
    protected readonly isOpenSrc: import("@angular/core").WritableSignal<boolean>;
    readonly isOpen: import("@angular/core").Signal<boolean>;
    protected readonly parentIdSrc: import("@angular/core").WritableSignal<null | string>;
    readonly parentId: import("@angular/core").Signal<null | string>;
    open(parentId?: null | string): void;
    close(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<CreateFormDialogService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<any>;
}
declare class FormsPanel {
    protected formService: CoreFormService;
    protected mouseInsideService: MouseInsideService;
    protected createFormDialogService: CreateFormDialogService;
    private readonly importDialogService;
    private readonly document;
    formList: import("@angular/core").Signal<import("@ngx-formly/builder").BaseEditorForm[]>;
    hierarchyRootNodeIds: import("@angular/core").Signal<string[]>;
    hierarchyNodeMap: import("@angular/core").Signal<Record<string, import("@ngx-formly/builder").WorkspaceNode>>;
    hasStorageRecoveryIssues: import("@angular/core").Signal<boolean>;
    readonly filterValue: import("@angular/core").WritableSignal<string>;
    readonly isFiltering: import("@angular/core").Signal<boolean>;
    readonly showFilter: import("@angular/core").Signal<boolean>;
    readonly filteredVisibleNodeIds: import("@angular/core").Signal<string[]>;
    addNewForm(): void;
    addNewFolder(): void;
    openImportDialog(): void;
    setMouseInside(isInside: boolean): void;
    clearFilter(): void;
    downloadRecoveryBackup(): void;
    resetCorruptedStorage(): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<FormsPanel, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<FormsPanel, "core-forms-panel", never, {}, {}, never, never, true, never>;
}
declare class ModelEditPanel {
    readonly form: import("@angular/core").Signal<NgForm>;
    protected formService: CoreFormService;
    activeForm: import("@angular/core").Signal<import("@ngx-formly/builder").EditorForm | null>;
    activeModel: import("@angular/core").Signal<Record<string, unknown>>;
    readonly isMouseOverContent: import("@angular/core").WritableSignal<boolean>;
    readonly activeModelJSON: import("@angular/core").Signal<string>;
    modifyActiveModel(newJSON: string): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<ModelEditPanel, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<ModelEditPanel, "core-model-edit-panel", never, {}, {}, never, never, true, never>;
}
declare enum ClassType {
    CLASS_NAME = "className",
    FIELD_GROUP_CLASS_NAME = "fieldGroupClassName"
}
declare enum BreakpointAffix {
    PREFIX = "prefix",
    INFIX = "infix",
    SUFFIX = "suffix"
}
interface StyleDependency {
    type: ClassType;
    value: string;
}
interface StyleOptionConfig {
    name: string;
    value?: string;
    variants: string[];
    hasBreakpoints?: boolean;
    spanWidth?: boolean;
    dependsOn?: StyleDependency;
    dependsOnParent?: StyleDependency;
}
interface StylesConfig {
    breakpointAffix: BreakpointAffix;
    breakpoints: Breakpoint[];
    className: StyleOptionCategory[];
    fieldGroupClassName: StyleOptionCategory[];
}
interface StyleOptionCategory {
    name: string;
    options: StyleOptionConfig[];
}
interface Breakpoint {
    name: string;
    description: string;
    value: string;
}
declare const CORE_STYLES_CONFIG: InjectionToken<StylesConfig>;
declare class StylingPanel {
    fieldChange: import("@angular/core").OutputEmitterRef<PropertyChange>;
    typeOfClassType: typeof ClassType;
    readonly activeTab: import("@angular/core").WritableSignal<"children" | "self">;
    readonly isParent: import("@angular/core").Signal<boolean>;
    readonly classNameMap: import("@angular/core").Signal<Record<string, StyleOptionCategory[]>>;
    readonly fieldGroupClassNameMap: import("@angular/core").Signal<Record<string, StyleOptionCategory[]>>;
    protected formService: CoreFormService;
    protected fieldService: CoreFieldService;
    protected stylesConfig: StylesConfig;
    protected classNamePath: string[];
    protected fieldGroupClassNamePath: string[];
    protected activeField: import("@angular/core").Signal<EditorField<import("@ngx-formly/core").FormlyFieldProps & {
        [additionalProperties: string]: unknown;
    }> | null>;
    protected readonly parentField: import("@angular/core").Signal<EditorField<import("@ngx-formly/core").FormlyFieldProps & {
        [additionalProperties: string]: unknown;
    }> | null>;
    classNameProperty: ChipsPropertyConfig;
    fieldGroupClassNameProperty: ChipsPropertyConfig;
    constructor();
    onFieldChanged(change: PropertyChange): void;
    protected getBreakpointCategoryEntries(classType: ClassType, activeField: EditorField, parentField: EditorField | null): Record<string, StyleOptionCategory[]>;
    protected canShowOption(option: StyleOptionConfig, breakpoint: Breakpoint, activeField: EditorField, parentField: EditorField | null): boolean;
    protected getClassValue(field: EditorField | null, classType: ClassType): string;
    static ɵfac: i0.ɵɵFactoryDeclaration<StylingPanel, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<StylingPanel, "core-styling-panel", never, {}, {
        "fieldChange": "fieldChange";
    }, never, never, true, never>;
}
interface PanelOptionConfig {
    label: string;
    value: string;
    matIcon: string;
}
declare class ValidationPanel {
    private readonly formService;
    private readonly fieldService;
    protected readonly activeField: import("@angular/core").Signal<EditorField<import("@ngx-formly/core").FormlyFieldProps & {
        [additionalProperties: string]: unknown;
    }> | null>;
    private readonly activeFieldByType;
    protected readonly config: import("@angular/core").Signal<import("@ngx-formly/builder").FieldValidationConfig | undefined>;
    protected onFieldChanged(change: PropertyChange): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<ValidationPanel, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<ValidationPanel, "core-validation-panel", never, {}, {}, never, never, true, never>;
}
export declare class FormlyBuilder {
    private readonly destroyRef;
    private readonly responsiveService;
    private readonly panelService;
    private readonly viewContainerRef;
    protected readonly isDesktop: import("@angular/core").Signal<boolean>;
    protected readonly isTablet: import("@angular/core").Signal<boolean>;
    protected readonly isMobile: import("@angular/core").Signal<boolean>;
    protected readonly panelSizes: import("@angular/core").WritableSignal<number[]>;
    protected readonly minSizes: import("@angular/core").WritableSignal<number[]>;
    protected readonly tabletPanelSizes: import("@angular/core").WritableSignal<number[]>;
    protected readonly tabletMinSizes: import("@angular/core").WritableSignal<number[]>;
    protected readonly mobileDrawerVisible: import("@angular/core").WritableSignal<boolean>;
    protected readonly activePanel: import("@angular/core").Signal<LHSPanelType | RHSPanelType>;
    protected readonly panelOptions: PanelOptionConfig[];
    constructor();
    openMobilePanel(panel: string): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<FormlyBuilder, never>;
    static ɵcmp: i0.ɵɵComponentDeclaration<FormlyBuilder, "formly-builder", never, {}, {}, never, never, true, never>;
}
export declare const CORE_THEME: InjectionToken<WritableSignal<"dark" | "light">>;
export declare function generateTypeOptionSchema({ properties, validationConfig }: {
    properties?: PropertyConfig[];
    validationConfig?: FieldValidationConfig;
}, validationMessagesPath: string[]): Record<string, z$1.ZodType<unknown, unknown, z$1.core.$ZodTypeInternals<unknown, unknown>>>;
export declare function generateTypeOptionSchemaMap(fieldCategoryOptions: FieldCategoryOption[], validationMessagesPath: string[]): Record<string, {
    typeOption: FieldTypeOption;
    schema: Record<string, z$1.ZodType>;
}>;
export declare class BuilderFieldStateService extends BuilderFieldStateService$1 {
    constructor();
    static ɵfac: i0.ɵɵFactoryDeclaration<BuilderFieldStateService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<any>;
}
export declare class ImportDialogService {
    protected readonly isOpenSrc: import("@angular/core").WritableSignal<boolean>;
    readonly isOpen: import("@angular/core").Signal<boolean>;
    protected onImportedCallback: ((formId: string) => void) | null;
    open(onImported?: (formId: string) => void): void;
    close(): void;
    notifyImported(formId: string): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<ImportDialogService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<any>;
}
interface MarkdownDialogData {
    value: string;
    saveCallback: (value: string) => void;
}
export declare class MarkdownDialogService {
    protected readonly _data: import("@angular/core").WritableSignal<MarkdownDialogData | null>;
    readonly data: import("@angular/core").Signal<MarkdownDialogData | null>;
    protected readonly _isOpen: import("@angular/core").WritableSignal<boolean>;
    readonly isOpen: import("@angular/core").Signal<boolean>;
    open(data: MarkdownDialogData): void;
    close(): void;
    setValue(value: string): void;
    static ɵfac: i0.ɵɵFactoryDeclaration<MarkdownDialogService, never>;
    static ɵprov: i0.ɵɵInjectableDeclaration<any>;
}
export declare function provideCore(): EnvironmentProviders;
export declare function provideCoreTheme(): EnvironmentProviders;
export declare function provideCoreConfig(libraryConfig: LibraryConfig[], autoSave?: boolean, overrides?: Partial<Pick<CoreEditorConfig, 'autoSaveDelay' | 'editorType'>>): EnvironmentProviders;
/** Configures an embeddable Formly Builder and its isolated Formly runtime. */
export declare function provideFormlyBuilder(config: FormlyBuilderConfig): EnvironmentProviders;
export declare function provideFormStore(service: Type<FormStoreService>): EnvironmentProviders;
export declare function provideLocalFormStore(): EnvironmentProviders;
export declare const primengPreset: Preset;
declare const defaultTypeOption: {
    name: string;
    displayName: string;
    materialSymbol: string;
    disableKeyGeneration: boolean;
    defaultConfig: {};
    properties: ExpressionsPropertyConfig[];
};
declare const validationMessagesPath: string[];
declare function getFormSchema(fieldCategoryOptions: FieldCategoryOption[]): z.ZodType;
export declare function createLibrary(config: Omit<LibraryConfig, 'defaultTypeOption' | 'schema'>): LibraryConfig;
export { type BaseEditorForm, type BasePropertyConfig, type BaseWorkspaceNode, CORE_FORM_STORE, FormlyBuilder as Core, type CoreAddFieldOption, type CoreEditorConfig, type DefaultForm, type EditorForm, type FieldCategoryOption, type FieldInfo, type FieldInfoBadge, type FieldTypeOption, type FieldTypePreset, type FieldValidationConfig, type FieldWrapperOption, type FormStoreDataKind, type FormStoreRecoveryIssue, FormStoreRecoveryRequiredError, type FormStoreService, type FormlyBuilderConfig, type GroupChildPropertyConfig, type GroupPropertyConfig, type PropertyConfig as IProperty, type PropertyConfig, type LibraryConfig, type MarkdownPropertyConfig, type PropertyChange, PropertyChangeType, type PropertyCreator, type ValidationRuleConfig, type ValidationRulePropertyConfig, type WorkspaceFolderNode, type WorkspaceFormNode, type WorkspaceHierarchy, type WorkspaceNode, type WorkspaceNodeType, type WrappersPropertyConfig, type WrappersPropertyOption, addNodeToHierarchy, buildHierarchyFromFlatForms, createEmptyWorkspaceHierarchy, getDescendantNodeIds, isAncestorOf, modifyPropertyTarget, moveNodeInHierarchy, recalculateNodePaths, removeNodeFromHierarchy, renameNodeInHierarchy, toggleFolderExpansion };
```
