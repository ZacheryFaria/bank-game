import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";
import { client } from "../lib/api.js";
import { useAuthStore } from "../lib/store.js";

type Props = {
  onSwitchToRegister: () => void;
  commandMode?: boolean;
};

export function LoginScreen({ onSwitchToRegister, commandMode = false }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<"email" | "password">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);

  const guardedOnChange = (setter: (value: string) => void) => {
    return (value: string) => {
      if (!commandMode) {
        setter(value);
      }
    };
  };

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
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        🏦 Bank Game - Login
      </Text>
      <Text> </Text>

      {error && (
        <>
          <Text color="red">❌ {error}</Text>
          <Text> </Text>
        </>
      )}

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
            <>
              <Text>Email:</Text>
              <TextInput value={email} onChange={guardedOnChange(setEmail)} onSubmit={handleEmailSubmit} />
            </>
          ) : (
            <>
              <Text>Email: {email}</Text>
              <Text>Password:</Text>
              <TextInput
                value={password}
                onChange={guardedOnChange(setPassword)}
                onSubmit={handlePasswordSubmit}
                mask="*"
              />
            </>
          )}
          <Text> </Text>
          <Text dimColor>
            Don't have an account? Type [:register] to switch
          </Text>
          <Text dimColor>Press [:q] to quit</Text>
        </>
      )}
    </Box>
  );
}
