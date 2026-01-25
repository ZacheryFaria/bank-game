import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

type InputBoxProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  error?: string;
  mask?: string;
  showHelpText?: boolean;
};

export function InputBox({
  label,
  value,
  onChange,
  onSubmit,
  placeholder,
  error,
  mask,
  showHelpText = true,
}: InputBoxProps) {
  const [isFocused, setIsFocused] = useState(true);

  return (
    <Box flexDirection="column">
      <Text>{label}</Text>
      <Box
        borderStyle="single"
        borderColor={error ? "red" : isFocused ? "cyan" : "gray"}
        paddingX={1}
      >
        <TextInput
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          placeholder={placeholder}
          mask={mask}
        />
      </Box>
      {error && (
        <Text color="red">
          ❌ {error}
        </Text>
      )}
      {showHelpText && !error && (
        <Text dimColor>
          {mask ? `${value.length} characters` : "Enter to submit"}
        </Text>
      )}
    </Box>
  );
}
