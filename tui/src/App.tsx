import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { LoginScreen } from "./components/LoginScreen.js";
import { RegisterScreen } from "./components/RegisterScreen.js";
import { Dashboard } from "./components/Dashboard.js";
import { useAuthStore } from "./lib/store.js";
import { loadToken } from "./lib/tokenPersistence.js";
import { CommandModeProvider, useCommandMode } from "./lib/CommandModeContext.js";

function AppContent() {
  const [screen, setScreen] = useState<"login" | "register">("login");
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { commandMode, command } = useCommandMode();

  if (isAuthenticated) {
    return (
      <>
        <Dashboard />
        {commandMode && (
          <Box marginTop={1}>
            <Text color="yellow">:{command}</Text>
          </Box>
        )}
      </>
    );
  }

  if (screen === "login") {
    return (
      <>
        <LoginScreen onSwitchToRegister={() => setScreen("register")} />
        {commandMode && (
          <Box marginTop={1}>
            <Text color="yellow">:{command}</Text>
          </Box>
        )}
      </>
    );
  }

  return (
    <>
      <RegisterScreen onSwitchToLogin={() => setScreen("login")} />
      {commandMode && (
        <Box marginTop={1}>
          <Text color="yellow">:{command}</Text>
        </Box>
      )}
    </>
  );
}

export function App() {
  const [screen, setScreen] = useState<"login" | "register">("login");
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    loadToken().then((data) => {
      if (data) {
        login(data.token, data.refreshToken, data.user);
      }
    });
  }, [login]);

  return (
    <CommandModeProvider
      context={isAuthenticated ? "dashboard" : "auth"}
      onAction={(action) => {
        if (action.type === "switchScreen") {
          setScreen(action.screen);
        }
      }}
    >
      <AppContent />
    </CommandModeProvider>
  );
}
