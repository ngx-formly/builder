import { computed, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BuilderEngineService, CORE_FORM_STORE } from '@ngx-formly/builder-state';
import { CoreFieldService } from '../config/core-field.service';
import { CoreLibraryService } from '../config/core-library.service';
import { CORE_EDITOR_CONFIG, CORE_LIBRARY_CONFIGS } from '../config/types';
import { FieldInfo } from '../model/types';
import { CoreAddFieldOption } from './types';
import { PanelService } from './panel.service';

/** Shell facade retaining the existing editing API. */
@Injectable()
export class CoreFormService extends BuilderEngineService {
  protected readonly libraryService = inject(CoreLibraryService);
  protected readonly fieldService = inject(CoreFieldService);
  protected readonly panelService = inject(PanelService);

  readonly activeFormDisplayModeSrc = signal<'form' | 'preview' | 'json'>('form');
  readonly activeFormDisplayMode = this.activeFormDisplayModeSrc.asReadonly();
  readonly isEditMode = computed(() => this.activeFormDisplayModeSrc() === 'form');
  protected readonly mouseInsideIds = signal<string[]>([]);
  readonly activeMouseInside = computed(() => {
    const ids = this.mouseInsideIds();
    return ids.length ? ids[ids.length - 1] : null;
  });

  readonly activeSchema = computed(() => this.libraryService.activeLibrary()?.schema);

  constructor() {
    const config = inject(CORE_EDITOR_CONFIG);
    super(
      {
        ...config,
        libraries: inject(CORE_LIBRARY_CONFIGS).map((library) => ({
          id: library.id,
          fieldTypes: library.fieldCategoryOptions.flatMap((category) => category.children),
          defaultField: config.defaultTypeOption.defaultConfig,
        })),
      },
      inject(CORE_FORM_STORE),
    );
    this.formSelected$.pipe(takeUntilDestroyed()).subscribe((form) => {
      this.libraryService.setActiveLibrary(form?.libraryId ?? null);
      if (form) this.panelService.setActiveLHSPanel('fields');
    });
  }

  setMouseEnteredField(fieldId: string): void {
    this.mouseInsideIds.set([...this.mouseInsideIds(), fieldId]);
  }

  setMouseLeftField(fieldId: string): void {
    const ids = this.mouseInsideIds();
    const index = ids.lastIndexOf(fieldId);
    if (index !== -1) {
      this.mouseInsideIds.set(ids.toSpliced(index, 1));
    }
  }

  setActiveFormDisplayMode(mode: 'form' | 'preview' | 'json'): void {
    this.activeFormDisplayModeSrc.set(mode);
  }

  getAddOptions(info: FieldInfo): CoreAddFieldOption[] {
    return info.isParent
      ? this.fieldService.activeFieldCategoryOptions().map((category) => ({
          label: category.displayName,
          items: category.children.map((child) => ({
            label: child.displayName,
            type: child.name,
            command: () => this.addField(child.name, info.id),
          })),
        }))
      : [];
  }
  getReplaceOptions(info: FieldInfo): CoreAddFieldOption[] {
    const currentType = this.getField(info.id)?.type;

    return this.fieldService
      .activeFieldCategoryOptions()
      .map((category) => ({
        label: category.displayName,
        items: category.children
          .filter((child) => child.name !== currentType)
          .map((child) => ({
            label: child.displayName,
            type: child.name,
            command: () => this.replaceField(child.name, info.id),
          })),
      }))
      .filter((category) => category.items.length > 0);
  }
}
