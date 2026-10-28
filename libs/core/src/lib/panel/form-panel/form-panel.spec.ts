import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { FormLoadError, PersistenceError } from '@ngx-formly/builder-state';
import { ButtonDirective } from 'primeng/button';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CoreFormService } from '../../editor/core-form.service';
import { FormPanel } from './form-panel';

describe('FormPanel load feedback', () => {
  const formLoadError = signal<FormLoadError | null>(null);
  const loadingFormId = signal<string | null>(null);
  const persistenceError = signal<PersistenceError | null>(null);
  const setActiveForm = vi.fn();

  beforeEach(() => {
    formLoadError.set(null);
    loadingFormId.set(null);
    persistenceError.set(null);
    setActiveForm.mockReset();
    TestBed.overrideComponent(FormPanel, {
      set: {
        imports: [ButtonDirective],
        schemas: [NO_ERRORS_SCHEMA],
      },
    });
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CoreFormService,
          useValue: {
            formLoadError,
            loadingFormId,
            persistenceError,
            setActiveForm,
            activeFormId: signal(null),
            activeFormFieldsJSON: signal('[]'),
            activeFormDisplayMode: signal('form'),
            activeSchema: signal(null),
            activePreviewFormFields: signal([]),
          },
        },
      ],
    });
  });

  it('shows load failures without an active form and retries the failed target', () => {
    formLoadError.set({ formId: 'target', reason: 'missing-library', libraryId: 'survey' });
    const fixture = TestBed.createComponent(FormPanel);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('survey');
    const retry = fixture.nativeElement.querySelector('button');
    expect(retry.textContent).toContain('Retry load');
    retry.click();
    expect(setActiveForm).toHaveBeenCalledWith('target');
    formLoadError.set(null);
    loadingFormId.set('target');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Loading form',
    );
  });

  it('reports partial deletion without exposing the raw store error', () => {
    persistenceError.set({
      action: 'delete workspace node',
      cause: new Error('private server detail'),
      failedFormIds: ['a'],
    });
    const fixture = TestBed.createComponent(FormPanel);
    fixture.detectChanges();
    const message = fixture.nativeElement.querySelector('[role="alert"]').textContent;
    expect(message).toContain('Some forms were not deleted');
    expect(message).not.toContain('private server detail');
  });
});
