import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PointsCard from '../components/rewards/PointsCard';

const base = { points: 500, lifetimeEarned: 6000, tier: 'Gold', tierFrom: 5000, earnedThisMonth: 130, redeemedCount: 3 };

describe('PointsCard shows real values, not the original mock\'s hardcoded ones', () => {
  it('names the ACTUAL next tier and measures remaining points from lifetime earnings (not the spendable balance)', () => {
    render(<PointsCard {...base} next={{ name: 'Platinum', from: 15000 }} />);
    expect(screen.getByText('Progress to Platinum')).toBeInTheDocument();      // was hardcoded "Progress to Gold"
    expect(screen.getByText('9,000 points to go')).toBeInTheDocument();         // 15000 - 6000 lifetime (NOT 15000 - 500 balance)
    const bar = screen.getByRole('progressbar', { name: 'Progress to Platinum tier' });
    expect(bar).toHaveAttribute('aria-valuenow', '10');                          // (6000-5000)/(15000-5000)
  });

  it('shows this month\'s real earnings and the real redemption count', () => {
    render(<PointsCard {...base} next={{ name: 'Platinum', from: 15000 }} />);
    expect(screen.getByText('+130 pts')).toBeInTheDocument();                    // was hardcoded "+450 pts"
    expect(screen.getByText('3 rewards')).toBeInTheDocument();                   // was hardcoded "8 rewards"
    expect(screen.queryByText('+450 pts')).toBeNull();
  });

  it('pluralises redemptions correctly and handles zero', () => {
    const { rerender } = render(<PointsCard {...base} redeemedCount={1} next={{ name: 'Platinum', from: 15000 }} />);
    expect(screen.getByText('1 reward')).toBeInTheDocument();
    rerender(<PointsCard {...base} redeemedCount={0} earnedThisMonth={0} next={{ name: 'Platinum', from: 15000 }} />);
    expect(screen.getByText('0 rewards')).toBeInTheDocument();
    expect(screen.getByText('+0 pts')).toBeInTheDocument();
  });

  it('at the top tier there is nothing to progress toward, and it says so without a bogus "points to go"', () => {
    render(<PointsCard {...base} tier="Platinum" tierFrom={15000} lifetimeEarned={20000} />);
    expect(screen.getByText('Top tier reached', { selector: 'span' })).toBeInTheDocument();
    expect(screen.queryByText(/points to go/)).toBeNull();
    expect(screen.getByRole('progressbar', { name: 'Top tier reached' })).toHaveAttribute('aria-valuenow', '100');
  });

  it('never shows a negative "points to go" or a progress value outside 0–100', () => {
    render(<PointsCard {...base} lifetimeEarned={20000} next={{ name: 'Platinum', from: 15000 }} />); // already past the threshold
    expect(screen.getByText('0 points to go')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
});
