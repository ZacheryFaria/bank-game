import React, { useState } from "react";
import { Box, Text } from "ink";
import Spinner from "ink-spinner";
import { client } from "../lib/api.js";
import { useAuthStore } from "../lib/store.js";
import { StatusBar } from "./ui/StatusBar.js";
import { Screen } from "./ui/Screen.js";
import { InputBox } from "./ui/InputBox.js";

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
    <Screen title="Bank Game - Register" icon="🏦">
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
            <InputBox
              label="Email"
              value={email}
              onChange={setEmail}
              onSubmit={handleEmailSubmit}
              placeholder="user@example.com"
              error={error || undefined}
            />
          ) : step === "bankName" ? (
            <>
              <Text dimColor>Email: {email}</Text>
              <Text> </Text>
              <InputBox
                label="Bank Name"
                value={bankName}
                onChange={setBankName}
                onSubmit={handleBankNameSubmit}
                placeholder="Your Bank Inc."
                error={error || undefined}
              />
            </>
          ) : (
            <>
              <Text dimColor>Email: {email}</Text>
              <Text dimColor>Bank Name: {bankName}</Text>
              <Text> </Text>
              <InputBox
                label="Password (min 8 chars)"
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
              { key: "Ctrl+T", label: "Login" },
              { key: "Ctrl+Q", label: "Quit" },
            ]}
          />
        </>
      )}
    </Screen>
  );
}
