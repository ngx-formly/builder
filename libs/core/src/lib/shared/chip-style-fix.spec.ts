import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Chip } from 'primeng/chip';
import { expect, it, vi } from 'vitest';
import { ChipStyleFix } from './chip-style-fix';

@Component({
  imports: [Chip, ChipStyleFix],
  template: `<p-chip
    coreChipStyleFix
    label="Field badge"
    [removable]="true"
  />`,
})
class TestHost {}

it('keeps visible and removed chips free of invalid style bindings', async () => {
  const warn = vi.spyOn(console, 'warn');
  try {
    const fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    await fixture.whenStable();

    const chip: HTMLElement = fixture.nativeElement.querySelector('p-chip');
    expect(chip.textContent).toContain('Field badge');
    expect(chip.style.display).toBe('');

    chip
      .querySelector('.p-chip-remove-icon')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();
    expect(chip.style.display).toBe('none');
    expect(warn.mock.calls.filter(([message]) => String(message).includes('NG0318'))).toEqual([]);
  } finally {
    warn.mockRestore();
  }
});
