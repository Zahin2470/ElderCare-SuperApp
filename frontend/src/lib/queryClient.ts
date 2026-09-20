import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Retry once for network/5xx blips, never for 4xx (a 403/404 will not fix itself).
      retry: (count, err) => count < 1 && !(err instanceof ApiError && err.status < 500),
    },
  },
});
