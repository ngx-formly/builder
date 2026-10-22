import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Tooltip } from './tooltip';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Tooltip],
  template: `
    <button coreTooltip="Default hint">Default</button>
    <button
      coreTooltip="Custom hint"
      tooltipPosition="left"
      [showDelay]="delay()"
    >
      Custom
    </button>
  `,
})
class TestHost {
  readonly delay = signal(100);
}

describe('Tooltip', () => {
  let fixture: ComponentFixture<TestHost>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
    await fixture.whenStable();
    vi.useFakeTimers();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('shows the hint after the default 500 ms delay and removes it on mouse leave', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.dispatchEvent(new MouseEvent('mouseenter'));

    vi.advanceTimersByTime(499);
    expect(document.querySelector('[role="tooltip"]')).toBeNull();

    vi.advanceTimersByTime(1);
    const tooltip = document.querySelector('[role="tooltip"]');
    expect(tooltip?.textContent).toContain('Default hint');

    button.dispatchEvent(new MouseEvent('mouseleave'));
    expect(document.querySelector('[role="tooltip"]')).toBeNull();
  });

  it.each([0, 50])('honors a changed showDelay of %i ms', (delay) => {
    fixture.componentInstance.delay.set(delay);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelectorAll('button')[1] as HTMLButtonElement;
    button.dispatchEvent(new MouseEvent('mouseenter'));

    if (delay > 0) {
      vi.advanceTimersByTime(delay - 1);
      expect(document.querySelector('[role="tooltip"]')).toBeNull();
      vi.advanceTimersByTime(1);
    }

    expect(document.querySelector('[role="tooltip"]')?.textContent).toContain('Custom hint');
  });
});
