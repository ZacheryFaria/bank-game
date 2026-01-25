import React, { useState } from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { client } from "../lib/api.js";
import { useAuthStore } from "../lib/store.js";
import { StatusBar } from "./ui/StatusBar.js";
import { Screen } from "./ui/Screen.js";
import { InputBox } from "./ui/InputBox.js";

type Props = {
  onSwitchToRegister: () => void;
};

export function LoginScreen({ onSwitchToRegister }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "password">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);

  const handleEmailSubmit = () => {
    if (email.trim()) {
      setStep("password");
      setError(null);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await client.auth.login({
        body: { email, password },
      });

      if (result.status === 200) {
        login(result.body.token, result.body.refreshToken, result.body.user);
      } else if (result.status === 401) {
        setError(result.body.error);
        setPassword("");
        setStep("password");
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err) {
      setError("Network error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Bank Game - Login" icon="🏦">
      {loading ? (
        <Box>
          <Text color="green">
            <Spinner type="dots" />
          </Text>
          <Text> Logging in...</Text>
        </Box>
      ) : (
        <>
          {step === "email" ? (
            <InputBox
              label="Email"
              value={email}
              onChange={setEmail}
              onSubmit={handleEmailSubmit}
              placeholder="user@example.com"
              error={error || undefined}
            />
          ) : (
            <>
              <Text dimColor>Email: {email}</Text>
              <Text> </Text>
              <InputBox
                label="Password"
                value={password}
                onChange={setPassword}
                onSubmit={handlePasswordSubmit}
                mask="*"
                error={error || undefined}
              />
            </>
          )}
          <Text> </Text>
          <StatusBar
            items={[
              { key: "Enter", label: "Submit" },
              { key: "Ctrl+T", label: "Register" },
              { key: "Ctrl+Q", label: "Quit" },
            ]}
          />
        </>
      )}
    </Screen>
  );
}
