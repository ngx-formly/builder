import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CoreFormService } from '../editor/core-form.service';
import { PanelService } from '../editor/panel.service';
import { CreateFormDialogService } from '../panel/forms-panel/create-form-dialog.service';
import { EmptyNoForm } from './empty-no-form';

describe('EmptyNoForm', () => {
  it('blocks creation during recovery while keeping the workspace accessible', async () => {
    const hasStorageRecoveryIssues = signal(true);
    const open = vi.fn();
    const setActiveLHSPanel = vi.fn();
    TestBed.configureTestingModule({
      imports: [EmptyNoForm],
      providers: [
        { provide: CoreFormService, useValue: { hasStorageRecoveryIssues } },
        { provide: PanelService, useValue: { setActiveLHSPanel } },
        { provide: CreateFormDialogService, useValue: { open } },
      ],
    });
    const fixture = TestBed.createComponent(EmptyNoForm);
    fixture.autoDetectChanges();
    await fixture.whenStable();
    const [workspace, create] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];

    expect(create.disabled).toBe(true);
    create.click();
    expect(open).not.toHaveBeenCalled();
    workspace.click();
    expect(setActiveLHSPanel).toHaveBeenCalledWith('forms');

    hasStorageRecoveryIssues.set(false);
    await fixture.whenStable();
    expect(create.disabled).toBe(false);
    create.click();
    expect(open).toHaveBeenCalledOnce();
  });
});
