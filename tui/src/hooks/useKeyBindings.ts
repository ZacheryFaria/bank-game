import { useInput, useApp } from "ink";
import { useAuthStore } from "../lib/store.js";

export type KeyBindingContext = "auth" | "dashboard" | "menu";

export type KeyBindingAction =
  | { type: "switchScreen"; screen: "login" | "register" }
  | { type: "logout" }
  | { type: "quit" }
  | { type: "collect" }
  | { type: "refresh" }
  | { type: "help" }
  | { type: "navigate"; direction: "up" | "down" | "left" | "right" }
  | { type: "select" }
  | { type: "back" };

export function useKeyBindings(
  context: KeyBindingContext,
  onAction: (action: KeyBindingAction) => void,
) {
  const { exit } = useApp();
  const logout = useAuthStore((state) => state.logout);

  useInput((input, key) => {
    // Ctrl+H - Help (global)
    if (key.ctrl && input === "h") {
      onAction({ type: "help" });
      return;
    }

    // Ctrl+Q - Logout (dashboard) or Quit (auth)
    if (key.ctrl && input === "q") {
      if (context === "dashboard") {
        logout();
        onAction({ type: "logout" });
      } else {
        exit();
      }
      return;
    }

    // Dashboard-specific Ctrl keys
    if (context === "dashboard") {
      if (key.ctrl && input === "l") {
        onAction({ type: "collect" });
        return;
      }
      if (key.ctrl && input === "r") {
        onAction({ type: "refresh" });
        return;
      }
    }

    // Esc for back/cancel
    if (key.escape) {
      onAction({ type: "back" });
    }

    // Arrow navigation for future use
    if (key.upArrow) {
      onAction({ type: "navigate", direction: "up" });
    } else if (key.downArrow) {
      onAction({ type: "navigate", direction: "down" });
    } else if (key.leftArrow) {
      onAction({ type: "navigate", direction: "left" });
    } else if (key.rightArrow) {
      onAction({ type: "navigate", direction: "right" });
    }
  });
}
