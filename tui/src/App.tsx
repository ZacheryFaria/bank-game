import React, { useState, useEffect } from "react";
import { useInput } from "ink";
import { LoginScreen } from "./components/LoginScreen.js";
import { RegisterScreen } from "./components/RegisterScreen.js";
import { Dashboard } from "./components/Dashboard.js";
import { useAuthStore } from "./lib/store.js";
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

  // Handle Ctrl+T to toggle between login/register when not authenticated
  useInput((input, key) => {
    if (!isAuthenticated && key.ctrl && input === "t") {
      setScreen((current) => (current === "login" ? "register" : "login"));
    }
  });

  if (isAuthenticated) {
    return <Dashboard />;
  }

  if (screen === "login") {
    return <LoginScreen onSwitchToRegister={() => setScreen("register")} />;
  }

  return <RegisterScreen onSwitchToLogin={() => setScreen("login")} />;
}
