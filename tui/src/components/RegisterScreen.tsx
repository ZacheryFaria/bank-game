import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import Spinner from "ink-spinner";
import { client } from "../lib/api.js";
import { useAuthStore } from "../lib/store.js";

type Props = {
  onSwitchToLogin: () => void;
};

export function RegisterScreen({ onSwitchToLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bankName, setBankName] = useState("");
  const [step, setStep] = useState<"email" | "bankName" | "password">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useAuthStore((state) => state.login);

  const handleEmailSubmit = () => {
    if (email.trim()) {
      setStep("bankName");
      setError(null);
    }
  };

  const handleBankNameSubmit = () => {
    if (bankName.trim()) {
      setStep("password");
      setError(null);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim() || password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await client.auth.register({
        body: { email, password, bankName },
      });

      if (result.status === 200) {
        login(result.body.token, result.body.refreshToken, result.body.user);
      } else if (result.status === 400) {
        setError(result.body.error);
        setPassword("");
        setStep("password");
      } else {
        setError("Registration failed. Please try again.");
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
        🏦 Bank Game - Register
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
          <Text> Creating account...</Text>
        </Box>
      ) : (
        <>
          {step === "email" ? (
            <>
              <Text>Email:</Text>
              <TextInput value={email} onChange={setEmail} onSubmit={handleEmailSubmit} />
            </>
          ) : step === "bankName" ? (
            <>
              <Text>Email: {email}</Text>
              <Text>Bank Name:</Text>
              <TextInput value={bankName} onChange={setBankName} onSubmit={handleBankNameSubmit} />
            </>
          ) : (
            <>
              <Text>Email: {email}</Text>
              <Text>Bank Name: {bankName}</Text>
              <Text>Password (min 8 chars):</Text>
              <TextInput
                value={password}
                onChange={setPassword}
                onSubmit={handlePasswordSubmit}
                mask="*"
              />
            </>
          )}
          <Text> </Text>
          <Text dimColor>
            Already have an account? Type [:login] to switch
          </Text>
          <Text dimColor>Press [:q] to quit</Text>
        </>
      )}
    </Box>
  );
}
