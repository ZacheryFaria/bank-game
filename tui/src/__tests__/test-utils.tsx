import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as inkRender } from 'ink-testing-library';

export function render(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return inkRender(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
}
