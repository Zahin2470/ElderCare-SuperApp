import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Progress } from '../components/ui/progress';

describe('Progress announces its real value to assistive tech', () => {
  // Regression test: the original shadcn component destructured `value` off the props to compute
  // the fill width, but never passed it back to Radix's <Root>, so every progress bar in the app —
  // adherence, meal calories, order tracking, tier progress — was always "indeterminate" to a
  // screen reader regardless of what was visually shown.
  it('sets aria-valuenow (and a determinate state), not just the visual fill', () => {
    render(<Progress value={42} aria-label="Weekly adherence" />);
    const bar = screen.getByRole('progressbar', { name: 'Weekly adherence' });
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(bar).not.toHaveAttribute('data-state', 'indeterminate');
  });

  it('is indeterminate only when no value is given at all', () => {
    render(<Progress aria-label="Unknown progress" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-state', 'indeterminate');
  });

  it('reflects 0% and 100% correctly (not swallowed as falsy/complete)', () => {
    const { rerender } = render(<Progress value={0} aria-label="p" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    rerender(<Progress value={100} aria-label="p" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});
