import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { UseQueryResult } from '@tanstack/react-query';
import { QueryState } from '../components/common/QueryState';
import { SkeletonCards, SkeletonMetrics, SkeletonPage, SkeletonRows, SkeletonTable } from '../components/common/Skeleton';
import { ApiError } from '../lib/api';

/** Minimal stand-in for a react-query result — QueryState only reads these fields. */
const q = (o: Partial<UseQueryResult<string[]>>) => ({ isLoading: false, isError: false, data: undefined, error: null, refetch: () => undefined, ...o }) as unknown as UseQueryResult<string[]>;

describe('QueryState loading behaviour', () => {
  it('shows a skeleton — not the words "Loading…" — while a query is loading', () => {
    render(<QueryState q={q({ isLoading: true })}>{(d) => <p>{d.join(',')}</p>}</QueryState>);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
    expect(screen.queryByText(/Loading…/)).toBeNull();
  });

  it('uses the caller-supplied skeleton when given, instead of the default', () => {
    render(<QueryState q={q({ isLoading: true })} skeleton={<p>custom-skeleton</p>}>{() => null}</QueryState>);
    expect(screen.getByText('custom-skeleton')).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading' })).toBeNull(); // the default one is NOT also rendered
  });

  it('replaces the skeleton with real content once data arrives', () => {
    render(<QueryState q={q({ data: ['a', 'b'] })}>{(d) => <p>{d.join(',')}</p>}</QueryState>);
    expect(screen.getByText('a,b')).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading' })).toBeNull();
  });

  it('shows the empty message (not a skeleton, not the children) for an empty result', () => {
    render(<QueryState q={q({ data: [] })} isEmpty={(d) => d.length === 0} empty="Nothing booked yet.">{() => <p>should-not-render</p>}</QueryState>);
    expect(screen.getByText('Nothing booked yet.')).toBeInTheDocument();
    expect(screen.queryByText('should-not-render')).toBeNull();
  });

  it('shows a retryable error, never a skeleton, when the query fails', () => {
    render(<QueryState q={q({ isError: true, error: new ApiError(503, 'unavailable', 'Server is busy') as never })}>{() => null}</QueryState>);
    expect(screen.getByRole('alert')).toHaveTextContent('Server is busy');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: 'Loading' })).toBeNull();
  });
});

describe('skeleton variants', () => {
  // Every variant must be announced to assistive tech as a loading region, and be decorative-only inside.
  it.each([
    ['SkeletonRows', <SkeletonRows rows={2} />],
    ['SkeletonCards', <SkeletonCards count={3} />],
    ['SkeletonTable', <SkeletonTable rows={2} columns={3} />],
    ['SkeletonMetrics', <SkeletonMetrics count={2} />],
    ['SkeletonPage', <SkeletonPage />],
  ])('%s is a labelled status region', (_name, ui) => {
    render(ui);
    expect(screen.getAllByRole('status', { name: 'Loading' }).length).toBeGreaterThan(0);
  });

  it('renders the requested number of placeholder items', () => {
    const { container } = render(<SkeletonCards count={5} />);
    expect(container.querySelectorAll('.rounded-lg.border')).toHaveLength(5);
    const rows = render(<SkeletonRows rows={4} />);
    expect(rows.container.querySelectorAll('.rounded-lg.border')).toHaveLength(4);
  });

  it('placeholder bars are hidden from screen readers (only the region announces "Loading")', () => {
    const { container } = render(<SkeletonRows rows={2} />);
    const bars = container.querySelectorAll('.animate-pulse');
    expect(bars.length).toBeGreaterThan(0);
    bars.forEach((b) => expect(b).toHaveAttribute('aria-hidden', 'true'));
  });
});
