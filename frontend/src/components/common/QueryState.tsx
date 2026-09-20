import { ReactNode } from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { errorMessage } from '../../lib/api';

/** One consistent loading / error / empty treatment for every data-backed list. */
export function QueryState<T>({ q, empty, isEmpty, children }: {
  q: UseQueryResult<T>;
  empty?: ReactNode;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}) {
  if (q.isLoading) return <p className="text-gray-500 py-4" role="status">Loading…</p>;
  if (q.isError) return (
    <Card className="p-5 border-red-200 bg-red-50" role="alert">
      <p className="text-red-800 mb-3">{errorMessage(q.error)}</p>
      <Button size="sm" variant="outline" onClick={() => q.refetch()}>Try again</Button>
    </Card>
  );
  if (q.data === undefined) return null;
  if (isEmpty?.(q.data)) return <Card className="p-6 text-gray-600">{empty ?? 'Nothing here yet.'}</Card>;
  return <>{children(q.data)}</>;
}
