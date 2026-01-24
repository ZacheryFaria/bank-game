import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render as inkRender } from 'ink-testing-library';
import { CommandModeProvider } from '../lib/CommandModeContext.js';

export function render(component: React.ReactElement): ReturnType<typeof inkRender> {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return inkRender(
    <QueryClientProvider client={queryClient}>
      <CommandModeProvider context="auth" onAction={() => {}}>
        {component}
      </CommandModeProvider>
    </QueryClientProvider>
  );
}
