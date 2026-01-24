import React, { createContext, useContext, useMemo, ReactNode, useCallback } from 'react';
import { useKeyBindings, KeyBindingContext, KeyBindingAction } from '../hooks/useKeyBindings.js';

type CommandModeContextValue = {
  commandMode: boolean;
  command: string;
  guardInput: <T>(setter: (value: T) => void) => (value: T) => void;
};

const CommandModeContext = createContext<CommandModeContextValue | null>(null);

type Props = {
  context: KeyBindingContext;
  onAction: (action: KeyBindingAction) => void;
  children: ReactNode;
};

export function CommandModeProvider({ context, onAction, children }: Props) {
  const { commandMode, command } = useKeyBindings(context, onAction);

  const guardInput = useCallback(<T,>(setter: (value: T) => void) => {
    return (value: T) => {
      if (!commandMode) {
        setter(value);
      }
    };
  }, [commandMode]);

  const value = useMemo(
    () => ({ commandMode, command, guardInput }),
    [commandMode, command, guardInput]
  );

  return (
    <CommandModeContext.Provider value={value}>
      {children}
    </CommandModeContext.Provider>
  );
}

export function useCommandMode() {
  const context = useContext(CommandModeContext);
  if (!context) {
    throw new Error('useCommandMode must be used within CommandModeProvider');
  }
  return context;
}
