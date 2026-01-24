import React, { useState, useEffect } from "react";
import { Box, Text } from "ink";
import { LoginScreen } from "./components/LoginScreen.js";
import { RegisterScreen } from "./components/RegisterScreen.js";
import { Dashboard } from "./components/Dashboard.js";
import { useAuthStore } from "./lib/store.js";
import { useKeyBindings } from "./hooks/useKeyBindings.js";
import { loadToken } from "./lib/tokenPersistence.js";

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

  const { commandMode, command } = useKeyBindings(
    isAuthenticated ? "dashboard" : "auth",
    (action) => {
      if (action.type === "switchScreen") {
        setScreen(action.screen);
      }
    },
  );

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
        <LoginScreen
          onSwitchToRegister={() => setScreen("register")}
          commandMode={commandMode}
        />
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
      <RegisterScreen
        onSwitchToLogin={() => setScreen("login")}
        commandMode={commandMode}
      />
      {commandMode && (
        <Box marginTop={1}>
          <Text color="yellow">:{command}</Text>
        </Box>
      )}
    </>
  );
}
