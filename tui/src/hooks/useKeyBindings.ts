import { useInput, useApp } from "ink";
import { useState } from "react";
import { useAuthStore } from "../lib/store.js";

export type KeyBindingContext = "auth" | "dashboard" | "menu";

export type KeyBindingAction =
  | { type: "switchScreen"; screen: "login" | "register" }
  | { type: "logout" }
  | { type: "quit" }
  | { type: "collect" }
  | { type: "navigate"; direction: "up" | "down" | "left" | "right" }
  | { type: "select" }
  | { type: "back" };

export function useKeyBindings(
  context: KeyBindingContext,
  onAction: (action: KeyBindingAction) => void,
  options?: { disabled?: boolean },
) {
  const [commandMode, setCommandMode] = useState(false);
  const [command, setCommand] = useState("");
  const { exit } = useApp();
  const logout = useAuthStore((state) => state.logout);

  useInput((input, key) => {
    // When disabled (e.g., user is typing in input field), ignore all keys
    // except ":" which allows command mode to still work
    const isDisabled = options?.disabled ?? false;
    if (isDisabled && !commandMode && input !== ":") {
      return;
    }
    // Global vim-like command mode (:q, :quit, etc)
    if (input === ":" && !commandMode) {
      setCommandMode(true);
      setCommand("");
      return;
    }

    if (commandMode) {
      if (key.escape || (key.ctrl && input === "c")) {
        setCommandMode(false);
        setCommand("");
      } else if (key.return) {
        handleCommand(command);
        setCommandMode(false);
        setCommand("");
      } else if (key.backspace || key.delete) {
        setCommand(command.slice(0, -1));
      } else if (input) {
        setCommand(command + input);
      }
      return;
    }

    // Context-specific keybindings
    if (context === "auth") {
      handleAuthKeys(input, key, onAction);
    } else if (context === "dashboard") {
      handleDashboardKeys(input, key, onAction);
    }
  });

  function handleCommand(cmd: string) {
    if (cmd === "q" || cmd === "quit") {
      exit();
    } else if (cmd === "logout") {
      logout();
      onAction({ type: "logout" });
    } else if (cmd === "login" || cmd === "l") {
      onAction({ type: "switchScreen", screen: "login" });
    } else if (cmd === "register" || cmd === "r") {
      onAction({ type: "switchScreen", screen: "register" });
    }
  }

  function handleAuthKeys(
    input: string,
    key: any,
    onAction: (action: KeyBindingAction) => void,
  ) {
    if (input === "r") {
      onAction({ type: "switchScreen", screen: "register" });
    } else if (input === "l") {
      onAction({ type: "switchScreen", screen: "login" });
    }
  }

  function handleDashboardKeys(
    input: string,
    key: any,
    onAction: (action: KeyBindingAction) => void,
  ) {
    // Vim navigation
    if (input === "j" || key.downArrow) {
      onAction({ type: "navigate", direction: "down" });
    } else if (input === "k" || key.upArrow) {
      onAction({ type: "navigate", direction: "up" });
    } else if (input === "h" || key.leftArrow) {
      onAction({ type: "navigate", direction: "left" });
    } else if (input === "l" || key.rightArrow) {
      onAction({ type: "navigate", direction: "right" });
    }

    // Actions
    if (input === "c") {
      onAction({ type: "collect" });
    } else if (key.return) {
      onAction({ type: "select" });
    } else if (key.escape) {
      onAction({ type: "back" });
    }
  }

  return { commandMode, command };
}
